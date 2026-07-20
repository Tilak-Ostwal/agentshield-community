import {
  createActionApprovalHash,
  createExecutionContract,
  redactSecrets,
  validateExecutionResponse,
  verifyExecutionPreflight,
  type ActionEnvelope,
  type ApprovalToken,
  type ExecutionContract,
  type ExecutionPreflightStatus,
  type ResponseValidationResult,
  type SandboxDecision,
  type SideEffect,
  type TraceEvent
} from "@agentshield/core";

import type { RuntimeContext } from "../context/runtimeContext.js";
import type { RuntimeDecision } from "../processor/actionProcessor.js";
import type { RuntimeToolMetadata } from "../fingerprint/inMemoryFingerprintStore.js";

export interface ExecutionBrokerOptions {
  enabled?: boolean;
  dryRun?: boolean;
  maxResponseBytes?: number;
  approvalToken?: ApprovalToken;
  sandboxDecision?: SandboxDecision;
}

export interface ExecutionBrokerPreflight {
  contract?: ExecutionContract;
  status: ExecutionPreflightStatus;
  sideEffectsObserved: SideEffect[];
  ok: boolean;
  reason: string;
}

function emitTrace(context: RuntimeContext, type: string, data: Record<string, unknown>): TraceEvent {
  return context.traceRecorder.record({
    trace_id: context.traceId,
    event_id: context.nextEventId(),
    timestamp: context.now().toISOString(),
    type,
    actor: { kind: "runtime", id: context.runtimeId },
    data,
    redactions: []
  });
}

export function createExecutionPreflight(input: {
  context: RuntimeContext;
  action: ActionEnvelope;
  decision: RuntimeDecision;
  toolMetadata?: RuntimeToolMetadata;
  options?: ExecutionBrokerOptions;
}): ExecutionBrokerPreflight {
  if (input.options?.enabled === false || input.decision.decision !== "allow") {
    return { status: "not_applicable", sideEffectsObserved: [], ok: input.decision.decision === "allow", reason: "execution broker not applicable" };
  }

  const actionHash = input.decision.approvalTicket?.actionHash ?? createActionApprovalHash({
    action: input.action,
    policyContext: { ruleId: input.decision.ruleId, reason: input.decision.reason },
    riskContext: {
      capabilitiesObserved: input.decision.capabilitiesObserved,
      taintObserved: input.decision.taintObserved,
      riskMarkers: input.decision.riskMarkers,
      registryFindings: input.decision.registryFindings
    },
    ticketContext: { traceId: input.context.traceId, actionId: input.action.actionId }
  });
  const contract = createExecutionContract({
    action: input.action,
    actionHash,
    decision: input.decision.approvalStatus === "approved" ? "require_human_review" : "allow",
    ...(input.options?.approvalToken?.nonce === undefined ? {} : { approvedByTokenId: input.options.approvalToken.nonce }),
    ...(input.toolMetadata?.serverName === undefined ? {} : { serverName: input.toolMetadata.serverName }),
    allowedSideEffects: input.decision.sideEffectsObserved.length > 0 ? input.decision.sideEffectsObserved : ["none"],
    forbiddenSideEffects: ["local_delete"],
    resourceScopes: [{ type: "filesystem", allow: ["/mock/project/**", "tmp/**"] }],
    maxResponseBytes: input.options?.maxResponseBytes ?? 4096,
    expiresAt: new Date(input.context.now().getTime() + 10 * 60 * 1000).toISOString(),
    ...(input.options?.sandboxDecision === undefined ? {} : { sandboxProfileId: input.options.sandboxDecision.profileId }),
    reason: input.decision.reason
  });
  emitTrace(input.context, "execution_contract_created", { contract: redactSecrets(contract).value });
  const preflight = verifyExecutionPreflight({
    action: input.action,
    contract,
    now: input.context.now(),
    capabilities: input.decision.capabilitiesObserved,
    ...(input.toolMetadata?.capabilities === undefined ? {} : { registryCapabilities: input.toolMetadata.capabilities }),
    taintLabels: input.decision.taintObserved,
    ...(input.options?.approvalToken === undefined ? {} : { approvalToken: input.options.approvalToken }),
    ...(input.options?.dryRun === undefined ? {} : { dryRun: input.options.dryRun })
  });
  emitTrace(input.context, preflight.ok ? (input.options?.dryRun ? "execution_preflight_passed" : "execution_preflight_passed") : "execution_preflight_failed", {
    status: preflight.status,
    reason: preflight.reason,
    inferredSideEffects: preflight.inferredSideEffects,
    violations: preflight.violations,
    dryRun: input.options?.dryRun === true
  });

  return {
    contract,
    status: preflight.status,
    sideEffectsObserved: preflight.inferredSideEffects,
    ok: preflight.ok,
    reason: preflight.reason
  };
}

export function recordExecutionLedger(input: {
  context: RuntimeContext;
  action: ActionEnvelope;
  decision: "allow" | "deny" | "require_human_review";
  actionHash: string;
  toolName: string;
  sideEffectsAllowed: SideEffect[];
  sideEffectsObserved: SideEffect[];
  forwarded: boolean;
  dryRun: boolean;
}): void {
  const entry = input.context.executionLedger.record({
    actionId: input.action.actionId,
    actionHash: input.actionHash,
    toolName: input.toolName,
    decision: input.decision,
    sideEffectsAllowed: input.sideEffectsAllowed,
    sideEffectsObserved: input.sideEffectsObserved,
    forwarded: input.forwarded,
    dryRun: input.dryRun,
    timestamp: input.context.now().toISOString(),
    evidenceRootHash: input.context.traceRecorder.getEvidenceRootHash(input.context.traceId)
  });
  emitTrace(input.context, "execution_ledger_entry", { entry: redactSecrets(entry).value });
}

export function validateBrokerResponse(input: {
  context: RuntimeContext;
  contract: ExecutionContract;
  response: unknown;
}): ResponseValidationResult {
  const validation = validateExecutionResponse({ contract: input.contract, response: input.response });
  if (!validation.ok) {
    emitTrace(input.context, "execution_response_violation", {
      contractId: input.contract.contractId,
      violations: validation.violations,
      responseBytes: validation.responseBytes
    });
  }
  return validation;
}

import {
  applyApprovalPolicy,
  createActionApprovalHash,
  createApprovalTicket,
  redactSecrets,
  verifyApprovalToken,
  type ActionEnvelope,
  type ApprovalStatus,
  type ApprovalTicket,
  type ApprovalToken,
  type ApprovalVerificationResult,
  type PolicyEvaluation,
  type TraceEvent
} from "@agentshield/core";
import type { RegistryFinding } from "@agentshield/registry";

import type { RuntimeContext } from "../context/runtimeContext.js";
import type { RuntimeRiskMarker } from "../processor/actionProcessor.js";

export interface RuntimeApprovalOptions {
  enabled?: boolean;
  token?: ApprovalToken | unknown;
  signingKey?: string;
  expiresInMs?: number;
}

export interface RuntimeApprovalInput {
  context: RuntimeContext;
  action: ActionEnvelope;
  evaluation: PolicyEvaluation;
  eventIds: string[];
  riskMarkers: RuntimeRiskMarker[];
  capabilitiesObserved: string[];
  taintObserved: string[];
  registryFindings?: RegistryFinding[];
  policyExplanation?: unknown;
  approval?: RuntimeApprovalOptions;
}

export interface RuntimeApprovalResult {
  evaluation: PolicyEvaluation;
  approvalStatus: ApprovalStatus;
  approvalTicket?: ApprovalTicket;
  verification?: ApprovalVerificationResult;
}

function emitTrace(context: RuntimeContext, type: string, data: Record<string, unknown>): TraceEvent {
  return context.traceRecorder.record({
    trace_id: context.traceId,
    event_id: context.nextEventId(),
    timestamp: context.now().toISOString(),
    type,
    actor: {
      kind: "runtime",
      id: context.runtimeId
    },
    data,
    redactions: []
  });
}

function ticketExpiry(now: Date, expiresInMs: number | undefined): string {
  return new Date(now.getTime() + (expiresInMs ?? 10 * 60 * 1000)).toISOString();
}

export function applyRuntimeApproval(input: RuntimeApprovalInput): RuntimeApprovalResult {
  if (input.evaluation.decision !== "require_human_review" || input.approval?.enabled === false) {
    return {
      evaluation: input.evaluation,
      approvalStatus: input.evaluation.decision === "require_human_review" ? "required" : "not_required"
    };
  }

  const now = input.context.now();
  const actionHash = createActionApprovalHash({
    action: input.action,
    policyContext: {
      ruleId: input.evaluation.ruleId,
      reason: input.evaluation.reason,
      policyExplanation: input.policyExplanation
    },
    riskContext: {
      riskMarkers: input.riskMarkers,
      capabilitiesObserved: input.capabilitiesObserved,
      taintObserved: input.taintObserved,
      registryFindings: input.registryFindings
    },
    ticketContext: {
      traceId: input.context.traceId,
      actionId: input.action.actionId,
      requestedDecision: "allow",
      policyRuleId: input.evaluation.ruleId
    }
  });
  const ticket = createApprovalTicket({
    traceId: input.context.traceId,
    actionId: input.action.actionId,
    actionHash,
    createdAt: now.toISOString(),
    expiresAt: ticketExpiry(now, input.approval?.expiresInMs),
    currentDecision: input.evaluation.decision,
    reason: input.evaluation.reason,
    riskMarkers: input.riskMarkers,
    capabilitiesObserved: input.capabilitiesObserved,
    taintObserved: input.taintObserved,
    ...(input.registryFindings === undefined ? {} : { registryFindings: input.registryFindings }),
    policyRuleId: input.evaluation.ruleId,
    ...(input.policyExplanation === undefined ? {} : { policyExplanationSummary: input.policyExplanation }),
    evidenceRootHash: input.context.traceRecorder.getEvidenceRootHash(input.context.traceId)
  });

  if (ticket === undefined) {
    return { evaluation: input.evaluation, approvalStatus: "not_required" };
  }

  const ticketEvent = emitTrace(input.context, "approval_ticket_created", {
    ticket: redactSecrets(ticket).value
  });
  input.eventIds.push(ticketEvent.event_id);

  const verification =
    input.approval?.token !== undefined && input.approval.signingKey !== undefined
      ? verifyApprovalToken({
          ticket,
          token: input.approval.token,
          signingKey: input.approval.signingKey,
          now
        })
      : undefined;

  if (verification !== undefined) {
    const token = verification.token;
    const verifyEvent = emitTrace(input.context, "approval_token_verified", {
      status: verification.status,
      reason: verification.reason,
      token:
        token === undefined
          ? undefined
          : {
              version: token.version,
              ticketId: token.ticketId,
              actionHash: token.actionHash,
              approvedDecision: token.approvedDecision,
              approver: token.approver,
              issuedAt: token.issuedAt,
              expiresAt: token.expiresAt,
              nonce: token.nonce,
              signatureHash: createActionApprovalHash({
                action: input.action,
                policyContext: { signature: token.signature },
                ticketContext: { traceId: input.context.traceId, actionId: input.action.actionId }
              })
            }
    });
    input.eventIds.push(verifyEvent.event_id);
  }

  const applied = applyApprovalPolicy({
    currentEvaluation: input.evaluation,
    ticket,
    ...(verification === undefined ? {} : { verification })
  });

  return {
    evaluation: {
      decision: applied.decision,
      ruleId: applied.ruleId,
      reason: applied.reason,
      ...(input.evaluation.policyExplanation === undefined ? {} : { policyExplanation: input.evaluation.policyExplanation })
    },
    approvalStatus: applied.approvalStatus,
    approvalTicket: ticket,
    ...(verification === undefined ? {} : { verification })
  };
}

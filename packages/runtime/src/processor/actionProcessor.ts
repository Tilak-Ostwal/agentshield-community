import {
  actionEnvelopeSchema,
  evaluatePolicy,
  failClosed,
  redactSecrets,
  type Capability,
  type TaintLabel,
  type ActionEnvelope,
  type HighRiskMarker,
  type PolicyDecision,
  type PolicyEvaluation,
  redactPolicyExplanation,
  type PolicyExplanation,
  type TraceEvent,
  type ApprovalStatus,
  type ApprovalTicket,
  type ApprovalToken,
  inferSideEffects,
  type ExecutionContract,
  type ExecutionPreflightStatus,
  type SideEffect,
  type SandboxDecision
} from "@agentshield/core";
import type { FingerprintAttestationResult, RegistryFinding } from "@agentshield/registry";

import type { AttackGraphFinding, AttackGraphRiskMarker } from "../attackGraph/attackGraphTypes.js";
import { buildRuntimeCapabilityContext } from "../capabilities/runtimeCapabilityContext.js";
import type { CapabilityRiskAssessment } from "@agentshield/core";
import type { RuntimeContext } from "../context/runtimeContext.js";
import type { FingerprintCheckResult, RuntimeToolMetadata } from "../fingerprint/inMemoryFingerprintStore.js";
import { registryRiskMarkers, strengthenWithRegistryAttestation, type RegistryRiskMarker } from "../registry/runtimeRegistryIntegration.js";
import { applyRuntimeApproval, type RuntimeApprovalOptions } from "../approval/runtimeApprovalIntegration.js";
import { createExecutionPreflight, type ExecutionBrokerOptions } from "../execution/executionBroker.js";
import { evaluateRuntimeSandbox } from "../sandbox/runtimeSandboxEvaluator.js";

export type RuntimeRiskMarker = HighRiskMarker | AttackGraphRiskMarker | RegistryRiskMarker;

export interface RuntimeDecision {
  decision: PolicyDecision;
  ruleId: string;
  reason: string;
  traceId: string;
  eventIds: string[];
  riskMarkers: RuntimeRiskMarker[];
  capabilitiesObserved: Capability[];
  taintObserved: TaintLabel[];
  evidenceRootHash?: string | null;
  policyExplanation?: PolicyExplanation;
  registryFindings?: RegistryFinding[];
  approvalTicket?: ApprovalTicket;
  approvalStatus: ApprovalStatus;
  executionContract?: ExecutionContract;
  sideEffectsObserved: SideEffect[];
  executionPreflightStatus: ExecutionPreflightStatus;
  sandboxDecision?: SandboxDecision;
}

export interface ProcessActionOptions {
  toolMetadata?: RuntimeToolMetadata;
  approvalToken?: ApprovalToken | unknown;
  approval?: RuntimeApprovalOptions;
  execution?: ExecutionBrokerOptions;
  sandbox?: { enabled?: boolean };
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

function enforceRuntimeOverlays(
  policyEvaluation: PolicyEvaluation,
  fingerprintResult: FingerprintCheckResult | undefined,
  newRiskMarkers: HighRiskMarker[]
): PolicyEvaluation {
  if (policyEvaluation.decision === "deny") {
    return policyEvaluation;
  }

  if (fingerprintResult?.status === "changed") {
    return {
      decision: "require_human_review",
      ruleId: "runtime-fingerprint-changed",
      reason: "tool fingerprint changed"
    };
  }

  if (newRiskMarkers.length > 0) {
    return {
      decision: "require_human_review",
      ruleId: "runtime-risk-write-then-exec",
      reason: "filesystem.write followed by shell.exec on the same path"
    };
  }

  return policyEvaluation;
}

function strengthenWithGraphFindings(
  runtimeEvaluation: PolicyEvaluation,
  findings: AttackGraphFinding[]
): PolicyEvaluation {
  if (runtimeEvaluation.decision === "deny") {
    return runtimeEvaluation;
  }

  if (findings.some((finding) => finding.severity === "critical")) {
    return {
      decision: "deny",
      ruleId: "attack-graph-critical",
      reason: "critical attack graph finding"
    };
  }

  if (runtimeEvaluation.decision === "allow" && findings.some((finding) => finding.severity === "high")) {
    return {
      decision: "require_human_review",
      ruleId: "attack-graph-high",
      reason: "high severity attack graph finding"
    };
  }

  return runtimeEvaluation;
}

function strengthenWithCapabilityRisk(
  runtimeEvaluation: PolicyEvaluation,
  risk: CapabilityRiskAssessment
): PolicyEvaluation {
  if (runtimeEvaluation.decision === "deny") {
    return runtimeEvaluation;
  }

  if (risk.riskLevel === "critical") {
    return {
      decision: "deny",
      ruleId: "capability-risk-critical",
      reason: "critical capability risk"
    };
  }

  if (runtimeEvaluation.decision === "allow" && risk.riskLevel === "high") {
    return {
      decision: "require_human_review",
      ruleId: "capability-risk-high",
      reason: "high capability risk"
    };
  }

  return runtimeEvaluation;
}

function strengthenWithTaintSink(
  runtimeEvaluation: PolicyEvaluation,
  sink: { severity: string; recommendedDecision?: "deny" | "require_human_review" }
): PolicyEvaluation {
  if (runtimeEvaluation.decision === "deny") {
    return runtimeEvaluation;
  }

  if (sink.severity === "critical") {
    return {
      decision: "deny",
      ruleId: "taint-sink-critical",
      reason: "critical taint sink violation"
    };
  }

  if (runtimeEvaluation.decision === "allow" && sink.severity === "high") {
    return {
      decision: "require_human_review",
      ruleId: "taint-sink-high",
      reason: "high taint sink violation"
    };
  }

  return runtimeEvaluation;
}

export function processAction(
  context: RuntimeContext,
  actionInput: unknown,
  options: ProcessActionOptions = {}
): RuntimeDecision {
  const eventIds: string[] = [];

  try {
    const actionResult = actionEnvelopeSchema.safeParse(actionInput);

    if (!actionResult.success) {
      const failed = failClosed("invalid action envelope");
      return {
        ...failed,
        traceId: context.traceId,
        eventIds,
        riskMarkers: [],
        capabilitiesObserved: [],
        taintObserved: [],
        approvalStatus: "not_required",
        sideEffectsObserved: [],
        executionPreflightStatus: "not_applicable",
        evidenceRootHash: context.traceRecorder.getEvidenceRootHash(context.traceId)
      };
    }

    const action: ActionEnvelope = actionResult.data;
    const capabilityContext = buildRuntimeCapabilityContext(action, options.toolMetadata);
    const redactedAction = redactSecrets(action);
    const actionReceivedEvent = emitTrace(context, "action_received", {
      action: redactedAction.value,
      redactions: redactedAction.redactions,
      capabilitiesObserved: capabilityContext.capabilitiesObserved,
      capabilityRisk: capabilityContext.risk
    });
    eventIds.push(actionReceivedEvent.event_id);

    const taintResult = context.taintStore.observeAction(action, capabilityContext.capabilitiesObserved);

    if (taintResult.sources.length > 0) {
      const taintEvent = emitTrace(context, "taint_detected", {
        labels: taintResult.sources.map((source) => source.label),
        sources: taintResult.sources.map((source) => ({
          label: source.label,
          reason: source.reason,
          actionId: source.actionId,
          resource: source.resource
        }))
      });
      eventIds.push(taintEvent.event_id);
    }

    if (taintResult.propagations.length > 0) {
      const propagationEvent = emitTrace(context, "taint_propagated", {
        propagations: taintResult.propagations
      });
      eventIds.push(propagationEvent.event_id);
    }

    if (taintResult.sink.isSink) {
      const sinkEvent = emitTrace(context, "taint_sink_violation", {
        sink: taintResult.sink
      });
      eventIds.push(sinkEvent.event_id);
    }

    const fingerprintResult =
      options.toolMetadata === undefined ? undefined : context.fingerprintStore.checkAndStore(options.toolMetadata);
    const registryAttestation: FingerprintAttestationResult | undefined =
      options.toolMetadata === undefined || context.toolRegistry === undefined
        ? undefined
        : context.toolRegistry.attest(options.toolMetadata);

    if (fingerprintResult?.status === "changed") {
      const fingerprintEvent = emitTrace(context, "fingerprint_changed", {
        toolName: fingerprintResult.fingerprint.toolName,
        serverName: fingerprintResult.fingerprint.serverName,
        schemaHash: fingerprintResult.fingerprint.schemaHash,
        descriptionHash: fingerprintResult.fingerprint.descriptionHash,
        previousSchemaHash: fingerprintResult.previousFingerprint?.schemaHash,
        previousDescriptionHash: fingerprintResult.previousFingerprint?.descriptionHash
      });
      eventIds.push(fingerprintEvent.event_id);
    }

    if (registryAttestation !== undefined) {
      const registryEvent = emitTrace(context, "registry_attestation", {
        status: registryAttestation.status,
        decisionImpact: registryAttestation.decisionImpact,
        findings: registryAttestation.findings
      });
      eventIds.push(registryEvent.event_id);
    }

    const previousRiskMarkerCount = context.session.highRiskMarkers.length;
    context.session.addAction(action);
    const newRiskMarkers = context.session.highRiskMarkers.slice(previousRiskMarkerCount);

    for (const marker of newRiskMarkers) {
      const riskEvent = emitTrace(context, "session_risk_detected", {
        marker
      });
      eventIds.push(riskEvent.event_id);
    }

    const policyEvaluation = evaluatePolicy(context.policy, action, {
      capabilities: capabilityContext.capabilitiesObserved,
      taintLabels: taintResult.labels,
      riskSeverity: capabilityContext.risk.riskLevel,
      attackGraphPatterns: context.attackGraphEngine.snapshot().findings.map((finding) => finding.patternId)
    });
    const runtimeEvaluation = strengthenWithCapabilityRisk(
      strengthenWithRegistryAttestation(enforceRuntimeOverlays(policyEvaluation, fingerprintResult, newRiskMarkers), registryAttestation),
      capabilityContext.risk
    );
    const taintEvaluation = strengthenWithTaintSink(runtimeEvaluation, taintResult.sink);
    const graphResult = context.attackGraphEngine.addAction(action, {
      policyDecision: taintEvaluation.decision,
      fingerprintChanged: fingerprintResult?.status === "changed",
      capabilities: capabilityContext.capabilitiesObserved,
      taintLabels: taintResult.labels
    });

    for (const finding of graphResult.findings) {
      const findingEvent = emitTrace(context, "attack_graph_finding", {
        finding
      });
      eventIds.push(findingEvent.event_id);
    }

    const finalEvaluation = strengthenWithGraphFindings(taintEvaluation, graphResult.findings);
    const policyExplanation = redactPolicyExplanation(policyEvaluation.policyExplanation);
    const policyEvent = emitTrace(context, "policy_decision", {
      decision: finalEvaluation.decision,
      ruleId: finalEvaluation.ruleId,
      reason: finalEvaluation.reason,
      actionId: action.actionId,
      ...(policyExplanation === undefined ? {} : { policyExplanation })
    });
    eventIds.push(policyEvent.event_id);
    const combinedRiskMarkers = [...newRiskMarkers, ...graphResult.riskMarkers, ...registryRiskMarkers(registryAttestation)];
    const approval = applyRuntimeApproval({
      context,
      action,
      evaluation: finalEvaluation,
      eventIds,
      riskMarkers: combinedRiskMarkers,
      capabilitiesObserved: capabilityContext.capabilitiesObserved,
      taintObserved: taintResult.labels,
      ...(registryAttestation === undefined ? {} : { registryFindings: registryAttestation.findings }),
      ...(policyExplanation === undefined ? {} : { policyExplanation }),
      approval: {
        enabled: options.approval?.enabled ?? true,
        ...(options.approvalToken === undefined ? {} : { token: options.approvalToken }),
        ...(options.approval?.token === undefined ? {} : { token: options.approval.token }),
        ...(options.approval?.signingKey === undefined ? {} : { signingKey: options.approval.signingKey }),
        ...(options.approval?.expiresInMs === undefined ? {} : { expiresInMs: options.approval.expiresInMs })
      }
    });

    const sideEffectsObserved = inferSideEffects({
      action,
      capabilities: capabilityContext.capabilitiesObserved,
      ...(options.toolMetadata?.capabilities === undefined ? {} : { registryCapabilities: options.toolMetadata.capabilities }),
      taintLabels: taintResult.labels,
      ...(policyExplanation === undefined ? {} : { policyExplanation })
    });
    const provisionalDecision: RuntimeDecision = {
      ...approval.evaluation,
      traceId: context.traceId,
      eventIds,
      ...(registryAttestation === undefined ? {} : { registryFindings: registryAttestation.findings }),
      riskMarkers: combinedRiskMarkers,
      capabilitiesObserved: capabilityContext.capabilitiesObserved,
      taintObserved: taintResult.labels,
      evidenceRootHash: context.traceRecorder.getEvidenceRootHash(context.traceId),
      ...(policyExplanation === undefined ? {} : { policyExplanation }),
      approvalStatus: approval.approvalStatus,
      ...(approval.approvalTicket === undefined ? {} : { approvalTicket: approval.approvalTicket }),
      sideEffectsObserved,
      executionPreflightStatus: "not_applicable"
    };
    const sandboxDecision =
      options.sandbox?.enabled === true
        ? evaluateRuntimeSandbox({ context, action, decision: provisionalDecision })
        : undefined;
    const sandboxAdjustedEvaluation =
      sandboxDecision?.decisionImpact === "deny"
        ? { decision: "deny" as const, ruleId: "sandbox-blocked", reason: sandboxDecision.reason, ...(approval.evaluation.policyExplanation === undefined ? {} : { policyExplanation: approval.evaluation.policyExplanation }) }
        : approval.evaluation;
    const execution =
      options.execution?.enabled === true
        ? createExecutionPreflight({
            context,
            action,
            decision: {
              ...sandboxAdjustedEvaluation,
              traceId: context.traceId,
              eventIds,
              riskMarkers: combinedRiskMarkers,
              capabilitiesObserved: capabilityContext.capabilitiesObserved,
              taintObserved: taintResult.labels,
              evidenceRootHash: context.traceRecorder.getEvidenceRootHash(context.traceId),
              approvalStatus: approval.approvalStatus,
              sideEffectsObserved,
              executionPreflightStatus: "not_applicable",
              ...(sandboxDecision === undefined ? {} : { sandboxDecision }),
              ...(approval.approvalTicket === undefined ? {} : { approvalTicket: approval.approvalTicket }),
              ...(registryAttestation === undefined ? {} : { registryFindings: registryAttestation.findings })
            },
            ...(options.toolMetadata === undefined ? {} : { toolMetadata: options.toolMetadata }),
            options: {
              ...options.execution,
              dryRun: options.execution.dryRun === true || sandboxDecision?.decisionImpact === "dry_run",
              ...(sandboxDecision === undefined ? {} : { sandboxDecision })
            }
          })
        : undefined;

    return {
      ...sandboxAdjustedEvaluation,
      traceId: context.traceId,
      eventIds,
      ...(registryAttestation === undefined ? {} : { registryFindings: registryAttestation.findings }),
      riskMarkers: combinedRiskMarkers,
      capabilitiesObserved: capabilityContext.capabilitiesObserved,
      taintObserved: taintResult.labels,
      evidenceRootHash: context.traceRecorder.getEvidenceRootHash(context.traceId),
      ...(policyExplanation === undefined ? {} : { policyExplanation }),
      approvalStatus: approval.approvalStatus,
      ...(approval.approvalTicket === undefined ? {} : { approvalTicket: approval.approvalTicket }),
      sideEffectsObserved,
      executionPreflightStatus: execution?.status ?? "not_applicable",
      ...(execution?.contract === undefined ? {} : { executionContract: execution.contract }),
      ...(sandboxDecision === undefined ? {} : { sandboxDecision })
    };
  } catch {
    const failed = failClosed("runtime action processing failed closed");
    return {
      ...failed,
      traceId: context.traceId,
      eventIds,
      riskMarkers: [],
      capabilitiesObserved: [],
      taintObserved: [],
      approvalStatus: "not_required",
      sideEffectsObserved: [],
      executionPreflightStatus: "not_applicable",
      evidenceRootHash: context.traceRecorder.getEvidenceRootHash(context.traceId)
    };
  }
}

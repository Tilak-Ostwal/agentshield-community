import {
  evaluateSandboxDecision,
  redactSecrets,
  type ActionEnvelope,
  type SandboxDecision,
  type TraceEvent
} from "@agentshield/core";

import type { RuntimeContext } from "../context/runtimeContext.js";
import type { RuntimeDecision } from "../processor/actionProcessor.js";

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

export function evaluateRuntimeSandbox(input: {
  context: RuntimeContext;
  action: ActionEnvelope;
  decision: RuntimeDecision;
}): SandboxDecision {
  const sandboxDecision = evaluateSandboxDecision({
    action: input.action,
    capabilities: input.decision.capabilitiesObserved,
    sideEffects: input.decision.sideEffectsObserved,
    taintLabels: input.decision.taintObserved,
    riskMarkers: input.decision.riskMarkers,
    approved: input.decision.approvalStatus === "approved"
  });

  emitTrace(input.context, "sandbox_profile_selected", { sandboxDecision: redactSecrets(sandboxDecision).value });
  emitTrace(input.context, "sandbox_constraint_applied", { constraints: redactSecrets(sandboxDecision.constraints).value });
  if (sandboxDecision.decisionImpact === "deny" || sandboxDecision.isolationLevel === "blocked") {
    emitTrace(input.context, "sandbox_blocked", { reason: sandboxDecision.reason, profileId: sandboxDecision.profileId });
  }

  return sandboxDecision;
}

import {
  checkTraceInvariants,
  invariantFail,
  invariantPass,
  summarizeInvariants,
  type InvariantResult,
  type TraceEvent
} from "@agentshield/core";

import type { RuntimeDecision } from "../processor/actionProcessor.js";

export function checkRuntimeDecisionInvariants(decision: Partial<RuntimeDecision>): InvariantResult {
  const checks = [
    typeof decision.decision === "string" && decision.decision.length > 0
      ? invariantPass("runtime-decision-present", "runtime decision is present")
      : invariantFail("runtime-decision-present", "runtime decision is missing"),
    typeof decision.ruleId === "string" && decision.ruleId.length > 0
      ? invariantPass("runtime-rule-present", "runtime ruleId is present")
      : invariantFail("runtime-rule-present", "runtime ruleId is missing"),
    typeof decision.reason === "string" && decision.reason.length > 0
      ? invariantPass("runtime-reason-present", "runtime reason is present")
      : invariantFail("runtime-reason-present", "runtime reason is missing"),
    typeof decision.traceId === "string" && decision.traceId.length > 0
      ? invariantPass("runtime-trace-id-present", "runtime traceId is present")
      : invariantFail("runtime-trace-id-present", "runtime traceId is missing"),
    Array.isArray(decision.eventIds) && (decision.decision === "deny" ? true : decision.eventIds.length > 0)
      ? invariantPass("runtime-event-ids-present", "runtime eventIds are present when processing reached tracing")
      : invariantFail("runtime-event-ids-present", "runtime eventIds are missing")
  ];

  return summarizeInvariants(checks);
}

export function checkRuntimeSecurityInvariants(
  decision: Partial<RuntimeDecision>,
  traces: TraceEvent[],
  rawSecrets: string[] = []
): InvariantResult {
  const decisionResult = checkRuntimeDecisionInvariants(decision);
  const traceResult = checkTraceInvariants(traces, rawSecrets);

  return summarizeInvariants([...decisionResult.checks, ...traceResult.checks]);
}

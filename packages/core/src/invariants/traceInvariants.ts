import type { TraceEvent } from "../trace/traceEvent.js";
import { checkNoRawSecrets } from "./redactionInvariants.js";
import { invariantFail, invariantPass, summarizeInvariants, type InvariantCheck, type InvariantResult } from "./invariantResult.js";

function checkTraceIds(traces: TraceEvent[]): InvariantCheck {
  const missing = traces.find((trace) => trace.trace_id.length === 0 || trace.event_id.length === 0);

  if (missing !== undefined) {
    return invariantFail("trace-ids-present", "stored trace is missing trace_id or event_id");
  }

  return invariantPass("trace-ids-present", "stored traces include trace_id and event_id");
}

function checkPolicyDecisionEvents(traces: TraceEvent[]): InvariantCheck {
  const invalidPolicyEvent = traces.find((trace) => {
    if (trace.type !== "policy_decision") {
      return false;
    }

    const data = trace.data;

    return (
      typeof data.decision !== "string" ||
      data.decision.length === 0 ||
      typeof data.ruleId !== "string" ||
      data.ruleId.length === 0 ||
      typeof data.reason !== "string" ||
      data.reason.length === 0
    );
  });

  if (invalidPolicyEvent !== undefined) {
    return invariantFail("trace-policy-decision-shape", "policy_decision trace lacks decision, ruleId, or reason");
  }

  return invariantPass("trace-policy-decision-shape", "policy_decision traces include decision, ruleId, and reason");
}

export function checkTraceInvariants(traces: TraceEvent[], rawSecrets: string[] = []): InvariantResult {
  const checks = [checkTraceIds(traces), checkPolicyDecisionEvents(traces)];
  const secretResult = checkNoRawSecrets(traces, rawSecrets, "trace-no-raw-secrets");

  return summarizeInvariants([...checks, ...secretResult.checks]);
}

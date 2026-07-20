import { type ActionEnvelope, evaluatePolicy, detectSensitive, redactSensitive } from "@agentshield/core";
import type { FrameworkRunnable } from "./frameworkRunnableSchema.js";

export interface FrameworkToolResult {
  version: 1;
  runnableId: string;
  toolName: string;
  decision: "allow" | "review" | "deny";
  executed: boolean;
  blocked: boolean;
  reason: string;
  safeOutput: unknown;
  redactions: string[];
}

export function buildFrameworkActionEnvelope(runnable: FrameworkRunnable): ActionEnvelope {
  return {
    actionId: `fw-${runnable.runnableId}-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actionType: "tool_call",
    toolName: runnable.toolName,
    input: runnable.input
  };
}

export function redactFrameworkInput(input: unknown): unknown {
  const detections = detectSensitive(input);
  if (detections.length > 0) {
    return redactSensitive(input);
  }
  return input;
}

export function executeFrameworkToolWrapper(
  runnable: FrameworkRunnable,
  policyInput: unknown,
  context: unknown,
  rawOutputFn: () => unknown
): FrameworkToolResult {
  const action = buildFrameworkActionEnvelope(runnable);
  
  const evalResult = evaluatePolicy(policyInput, action, context as any);
  const decision = evalResult.decision === "require_human_review" ? "review" : (evalResult.decision === "redact" ? "allow" : evalResult.decision);
  const executed = decision === "allow";
  
  let rawOutput: unknown = null;
  if (executed) {
    rawOutput = rawOutputFn();
  }
  
  const result: FrameworkToolResult = {
    version: 1,
    runnableId: runnable.runnableId,
    toolName: runnable.toolName,
    decision,
    executed,
    blocked: !executed,
    reason: evalResult.reason ?? "policy evaluation",
    safeOutput: null,
    redactions: []
  };

  if (!executed || rawOutput === undefined || rawOutput === null) {
    return result;
  }

  const detections = detectSensitive(rawOutput);
  if (detections.length > 0) {
    result.safeOutput = redactSensitive(rawOutput);
    result.redactions = detections.map(d => d.type);
  } else {
    result.safeOutput = rawOutput;
  }
  
  return result;
}

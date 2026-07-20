import { normalizeProviderToolCall } from "./providerToolCallNormalizer.js";
import { wrapToolResult, ProviderToolResult } from "./providerToolResult.js";
import { ActionEnvelope, evaluatePolicy } from "@agentshield/core";

export function processProviderToolCall(
  input: unknown,
  policy: any
): { valid: boolean; error?: string; result?: ProviderToolResult } {
  const norm = normalizeProviderToolCall(input);
  if (!norm.valid || !norm.normalized) {
    return { valid: false, error: norm.error || "Unknown error" };
  }

  const toolCall = norm.normalized;

  const action: ActionEnvelope = {
    actionId: `provider-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actionType: "tool_call",
    toolName: toolCall.toolName,
    input: toolCall.arguments
  };

  const decision = evaluatePolicy(policy, action);

  let executed = false;
  let out: any = null;
  
  if (decision.decision === "allow") {
    if (toolCall.toolName === "filesystem.read") {
      out = { content: "safe data" };
      executed = true;
    }
  }

  const mappedDecision = decision.decision === "require_human_review" ? "review" : (decision.decision === "redact" ? "allow" : decision.decision);
  
  const res = wrapToolResult(
    toolCall.toolCallId,
    toolCall.toolName,
    mappedDecision,
    executed,
    decision.reason || "Processed by AgentShield",
    out
  );

  return { valid: true, result: res };
}

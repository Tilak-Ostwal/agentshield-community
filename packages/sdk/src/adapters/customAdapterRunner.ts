import { redactSecrets, type ActionEnvelope } from "@agentshield/core";
import type { RuntimeDecision } from "@agentshield/runtime";

import { validateAdapterExecutionResult, type AdapterExecutionResult, type AgentShieldAdapter } from "./adapterContract.js";

export function canExecuteAdapterAction(decision: RuntimeDecision): boolean {
  return (
    decision.decision === "allow" &&
    decision.approvalStatus !== "required" &&
    decision.sandboxDecision?.decisionImpact !== "deny" &&
    decision.sandboxDecision?.isolationLevel !== "blocked" &&
    decision.executionPreflightStatus !== "failed"
  );
}

export async function executeAdapterActionSafely(adapter: AgentShieldAdapter, action: ActionEnvelope, decision: RuntimeDecision): Promise<AdapterExecutionResult> {
  if (!canExecuteAdapterAction(decision)) {
    return { ok: false, status: "blocked", error: "adapter execution blocked by AgentShield decision" };
  }

  try {
    const result = validateAdapterExecutionResult(await adapter.executeAllowedAction(action, decision));
    return redactSecrets(result).value as AdapterExecutionResult;
  } catch (error) {
    return {
      ok: false,
      status: "error",
      error: error instanceof Error ? redactSecrets(error.message).value as string : "adapter execution failed"
    };
  }
}

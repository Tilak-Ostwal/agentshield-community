import { actionEnvelopeSchema, redactSecrets, type ActionEnvelope } from "@agentshield/core";

export interface CustomToolCallInput {
  id?: string;
  tool?: string;
  toolName?: string;
  arguments?: unknown;
  input?: unknown;
  timestamp?: string;
}

export function normalizeCustomToolCall(input: CustomToolCallInput): ActionEnvelope {
  const toolName = input.toolName ?? input.tool;
  if (toolName === undefined || toolName.length === 0) {
    throw new Error("custom tool call is missing toolName");
  }
  const action = {
    actionId: input.id ?? "custom_tool_call",
    timestamp: input.timestamp ?? "2026-06-28T00:00:00.000Z",
    actionType: "tool_call",
    toolName,
    input: input.input ?? input.arguments ?? {}
  };
  return redactSecrets(actionEnvelopeSchema.parse(action)).value as ActionEnvelope;
}

export function safeNormalizeCustomToolCall(input: unknown): { ok: true; action: ActionEnvelope } | { ok: false; error: string } {
  try {
    return { ok: true, action: normalizeCustomToolCall(input as CustomToolCallInput) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "invalid tool call" };
  }
}

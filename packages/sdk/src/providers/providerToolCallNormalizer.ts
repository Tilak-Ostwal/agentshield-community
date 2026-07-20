import {
  genericToolCallSchema,
  openaiToolCallSchema,
  anthropicToolCallSchema,
  geminiToolCallSchema,
  NormalizedToolCall
} from "./providerToolCallSchema.js";

function parseJsonRecord(input: string): { ok: true; value: Record<string, unknown> } | { ok: false } {
  const parsed = JSON.parse(input) as unknown;
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}

export function normalizeProviderToolCall(input: unknown): { valid: boolean; normalized?: NormalizedToolCall; error?: string } {
  const oai = openaiToolCallSchema.safeParse(input);
  if (oai.success) {
    let args: Record<string, unknown>;
    try {
      const parsedArgs = parseJsonRecord(oai.data.function.arguments);
      if (!parsedArgs.ok) {
        return { valid: false, error: "Malformed JSON arguments in OpenAI tool call" };
      }
      args = parsedArgs.value;
    } catch {
      return { valid: false, error: "Malformed JSON arguments in OpenAI tool call" };
    }
    return {
      valid: true,
      normalized: {
        version: 1,
        provider: "openai-compatible",
        conversationId: "local-demo-conversation",
        messageId: "local-demo-message",
        toolCallId: oai.data.id,
        toolName: oai.data.function.name,
        arguments: args,
        metadata: { source: "local-fixture" }
      }
    };
  }

  const ant = anthropicToolCallSchema.safeParse(input);
  if (ant.success) {
    return {
      valid: true,
      normalized: {
        version: 1,
        provider: "anthropic-compatible",
        conversationId: "local-demo-conversation",
        messageId: "local-demo-message",
        toolCallId: ant.data.id,
        toolName: ant.data.name,
        arguments: ant.data.input,
        metadata: { source: "local-fixture" }
      }
    };
  }

  const gem = geminiToolCallSchema.safeParse(input);
  if (gem.success) {
    return {
      valid: true,
      normalized: {
        version: 1,
        provider: "gemini-compatible",
        conversationId: "local-demo-conversation",
        messageId: "local-demo-message",
        toolCallId: "call-" + Math.random().toString(36).slice(2, 7),
        toolName: gem.data.functionCall.name,
        arguments: gem.data.functionCall.args,
        metadata: { source: "local-fixture" }
      }
    };
  }

  const gen = genericToolCallSchema.safeParse(input);
  if (gen.success) {
    return {
      valid: true,
      normalized: {
        version: 1,
        provider: "generic",
        conversationId: "local-demo-conversation",
        messageId: "local-demo-message",
        toolCallId: gen.data.id || "call-" + Math.random().toString(36).slice(2, 7),
        toolName: gen.data.toolName,
        arguments: gen.data.input || {},
        metadata: { source: "local-fixture" }
      }
    };
  }

  return { valid: false, error: "Unknown provider or missing tool name" };
}

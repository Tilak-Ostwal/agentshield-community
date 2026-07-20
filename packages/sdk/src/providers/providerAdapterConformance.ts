import { normalizeProviderToolCall } from "./providerToolCallNormalizer.js";

export function checkProviderConformance(): { ok: boolean; results: any[] } {
  const results = [];
  let ok = true;
  
  const openai = normalizeProviderToolCall({
    id: "1", type: "function", function: { name: "t", arguments: "{}" }
  });
  results.push({ test: "OpenAI-compatible normalizes", passed: openai.valid });
  if (!openai.valid) ok = false;

  const anthropic = normalizeProviderToolCall({
    id: "1", type: "tool_use", name: "t", input: {}
  });
  results.push({ test: "Anthropic-compatible normalizes", passed: anthropic.valid });
  if (!anthropic.valid) ok = false;

  const gemini = normalizeProviderToolCall({
    functionCall: { name: "t", args: {} }
  });
  results.push({ test: "Gemini-compatible normalizes", passed: gemini.valid });
  if (!gemini.valid) ok = false;

  const generic = normalizeProviderToolCall({
    toolName: "t", input: {}
  });
  results.push({ test: "Generic normalizes", passed: generic.valid });
  if (!generic.valid) ok = false;

  return { ok, results };
}

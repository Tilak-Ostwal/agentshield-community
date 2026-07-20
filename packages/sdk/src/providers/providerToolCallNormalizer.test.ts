import { describe, expect, it } from "vitest";
import { normalizeProviderToolCall } from "./providerToolCallNormalizer.js";

describe("providerToolCallNormalizer", () => {
  it("normalized ActionEnvelope is deterministic", () => {
    const res = normalizeProviderToolCall({
      id: "call_001",
      type: "function",
      function: { name: "fs.read", arguments: '{"path": "x"}' }
    });
    expect(res.valid).toBe(true);
    expect(res.normalized?.provider).toBe("openai-compatible");
    expect(res.normalized?.arguments).toEqual({ path: "x" });
  });

  it("malformed JSON arguments fail closed", () => {
    const res = normalizeProviderToolCall({
      id: "call_001",
      type: "function",
      function: { name: "fs.read", arguments: '{"path": invalid}' }
    });
    expect(res.valid).toBe(false);
    expect(res.error).toContain("Malformed JSON");
  });

  it("unknown provider fails closed", () => {
    const res = normalizeProviderToolCall({ unknown: true });
    expect(res.valid).toBe(false);
  });
});

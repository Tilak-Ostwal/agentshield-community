import { describe, expect, it } from "vitest";

import { createExecutionContract } from "./executionContract.js";
import { validateExecutionResponse } from "./responseValidator.js";

const action = {
  actionId: "read",
  timestamp: "2026-06-27T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.read"
};
const contract = createExecutionContract({
  action,
  actionHash: "hash_1",
  decision: "allow",
  allowedSideEffects: ["local_read"],
  forbiddenSideEffects: ["network_write"],
  maxResponseBytes: 1000,
  reason: "allowed read"
});

describe("execution response validator", () => {
  it("redacts fake secret", () => {
    const result = validateExecutionResponse({ contract, response: { content: [{ text: "sk-test-REDACT-ME" }] } });

    expect(JSON.stringify(result.redactedResponse)).not.toContain("sk-test-REDACT-ME");
    expect(result.violations).toContain("response contained secret-looking output");
  });

  it("detects forbidden side-effect claim", () => {
    expect(validateExecutionResponse({ contract, response: { metadata: { sideEffects: ["network_write"] } } }).violations).toContain("response claimed forbidden side effect");
  });

  it("detects tool result mismatch", () => {
    expect(validateExecutionResponse({ contract, response: { metadata: { actionId: "other" } } }).violations).toContain("tool response metadata does not match contract");
  });

  it("flags too large response", () => {
    const smallContract = { ...contract, maxResponseBytes: 5 };
    expect(validateExecutionResponse({ contract: smallContract, response: { text: "too large" } }).violations).toContain("response exceeds maxResponseBytes");
  });
});

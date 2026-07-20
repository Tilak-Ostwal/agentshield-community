import { describe, expect, it } from "vitest";
import { createRuntimeContext } from "../context/runtimeContext.js";
import { processAction } from "../processor/actionProcessor.js";

const policy = {
  version: 1,
  defaultDecision: "deny",
  rules: [{ id: "allow-all", match: { actionType: "tool_call" }, decision: "allow" }]
};

describe("runtime sandbox evaluator", () => {
  it("RuntimeDecision includes sandboxDecision", () => {
    const result = processAction(
      createRuntimeContext({ policy }),
      { actionId: "read", timestamp: "2026-06-28T00:00:00.000Z", actionType: "tool_call", toolName: "filesystem.read", input: { path: "/mock/project/README.md" } },
      { sandbox: { enabled: true }, execution: { enabled: true } }
    );

    expect(result.sandboxDecision).toMatchObject({ isolationLevel: "readonly" });
  });
});

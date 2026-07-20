import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "../policyEvaluator.js";

describe("policyExplain", () => {
  it("explain output includes matched rules and winning rule", () => {
    const result = evaluatePolicy({
      version: 2,
      name: "test",
      defaultDecision: "deny",
      mode: "strict",
      rules: [
        { id: "allow-read", effect: "allow", priority: 1, match: { capability: "filesystem.read" } }
      ]
    }, {
      actionId: "a",
      timestamp: "2026-06-26T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "filesystem.read",
      input: { path: "/mock/project/file.txt" }
    }, { capabilities: ["filesystem.read"] });

    expect(result.policyExplanation).toMatchObject({
      matchedRules: ["allow-read"],
      winningRule: "allow-read",
      observed: {
        capabilities: ["filesystem.read"],
        taint: []
      }
    });
  });
});

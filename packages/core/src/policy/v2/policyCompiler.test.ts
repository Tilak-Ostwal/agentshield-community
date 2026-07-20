import { describe, expect, it } from "vitest";
import { compilePolicyV2 } from "./policyCompiler.js";

function policy(rules: unknown[]) {
  return { version: 2, name: "test", defaultDecision: "deny", mode: "strict", rules };
}

describe("policyCompiler", () => {
  it("rejects duplicate rule IDs", () => {
    const result = compilePolicyV2(policy([
      { id: "same", effect: "deny", priority: 1, match: { toolName: "a" } },
      { id: "same", effect: "deny", priority: 2, match: { toolName: "b" } }
    ]));

    expect(result.ok).toBe(false);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "POLICY_V2_DUPLICATE_RULE_ID")).toBe(true);
  });

  it("emits warning for broad allow", () => {
    const result = compilePolicyV2(policy([
      { id: "broad", effect: "allow", priority: 1, match: { actionType: "tool_call" } }
    ]));

    expect(result.ok).toBe(true);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "POLICY_V2_BROAD_ALLOW")).toBe(true);
  });

  it("emits warning for critical capability allow", () => {
    const result = compilePolicyV2(policy([
      { id: "shell", effect: "allow", priority: 1, match: { capability: "shell.exec" } }
    ]));

    expect(result.ok).toBe(true);
    expect(result.diagnostics.some((diagnostic) => diagnostic.code === "POLICY_V2_CRITICAL_CAPABILITY_ALLOW")).toBe(true);
  });

  it("compiles deterministic rule order", () => {
    const result = compilePolicyV2(policy([
      { id: "allow-high", effect: "allow", priority: 1000, match: { actionType: "tool_call" } },
      { id: "deny-low", effect: "deny", priority: 1, match: { actionType: "tool_call" } },
      { id: "review", effect: "require_human_review", priority: 500, match: { actionType: "tool_call" }, requireApproval: { reason: "review" } }
    ]));

    expect(result.policy?.rules.map((rule) => rule.rule.id)).toEqual(["deny-low", "review", "allow-high"]);
  });
});

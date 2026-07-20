import { describe, expect, it } from "vitest";

import { evaluatePolicy } from "./policyEvaluator.js";
import { parsePolicy } from "./policySchema.js";

const baseAction = {
  actionId: "action_01",
  timestamp: "2026-06-25T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.read"
};

describe("policy evaluator", () => {
  it("allows an explicitly matched tool", () => {
    const result = evaluatePolicy(
      {
        version: 1,
        defaultDecision: "deny",
        rules: [
          {
            id: "allow-readonly-tool",
            match: {
              actionType: "tool_call",
              toolName: "filesystem.read"
            },
            decision: "allow"
          }
        ]
      },
      baseAction
    );

    expect(result).toEqual({
      decision: "allow",
      ruleId: "allow-readonly-tool",
      reason: "matched policy rule allow-readonly-tool"
    });
  });

  it("denies when no rule matches", () => {
    expect(
      evaluatePolicy(
        {
          version: 1,
          defaultDecision: "deny",
          rules: []
        },
        baseAction
      )
    ).toMatchObject({
      decision: "deny",
      ruleId: "default-deny"
    });
  });

  it("fails closed for missing or invalid policy", () => {
    expect(evaluatePolicy(undefined, baseAction)).toMatchObject({
      decision: "deny",
      ruleId: "fail-closed"
    });

    expect(parsePolicy({ version: 2, defaultDecision: "allow", rules: [] })).toMatchObject({
      ok: false
    });
  });

  it("does not treat llm advisory fields as authority", () => {
    const result = evaluatePolicy(
      {
        version: 1,
        defaultDecision: "deny",
        rules: []
      },
      {
        ...baseAction,
        toolName: "shell.exec",
        llmAdvisory: { decision: "allow" }
      }
    );

    expect(result.decision).toBe("deny");
  });

  it("allows by capability", () => {
    expect(
      evaluatePolicy(
        { version: 1, defaultDecision: "deny", rules: [{ id: "allow-read-cap", match: { capability: "filesystem.read" }, decision: "allow" }] },
        baseAction,
        { capabilities: ["filesystem.read"] }
      ).decision
    ).toBe("allow");
  });

  it("denies by capabilitiesAny", () => {
    expect(
      evaluatePolicy(
        { version: 1, defaultDecision: "deny", rules: [{ id: "deny-danger", match: { capabilitiesAny: ["network.write", "shell.exec"] }, decision: "deny" }] },
        baseAction,
        { capabilities: ["network.write"] }
      )
    ).toMatchObject({ decision: "deny", ruleId: "deny-danger" });
  });

  it("denies by capabilitiesAll", () => {
    expect(
      evaluatePolicy(
        { version: 1, defaultDecision: "deny", rules: [{ id: "deny-secret-network", match: { capabilitiesAll: ["secret.read", "network.write"] }, decision: "deny" }] },
        baseAction,
        { capabilities: ["secret.read", "network.write"] }
      )
    ).toMatchObject({ decision: "deny", ruleId: "deny-secret-network" });
  });

  it("unknown capability context does not allow", () => {
    expect(
      evaluatePolicy(
        { version: 1, defaultDecision: "deny", rules: [{ id: "allow-read-cap", match: { capability: "filesystem.read" }, decision: "allow" }] },
        baseAction,
        { capabilities: [] }
      ).decision
    ).toBe("deny");
  });
});

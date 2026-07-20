import { describe, expect, it } from "vitest";

import { evaluatePolicy } from "../../packages/core/src/policy/policyEvaluator.js";

describe("attack fixture: unknown tool deny", () => {
  it("denies an unknown tool unless a policy explicitly allows it", () => {
    const policy = {
      version: 1,
      defaultDecision: "deny",
      rules: [
        {
          id: "allow-filesystem-read",
          match: {
            actionType: "tool_call",
            toolName: "filesystem.read"
          },
          decision: "allow"
        }
      ]
    };

    const result = evaluatePolicy(policy, {
      actionId: "action_01",
      timestamp: "2026-06-25T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "unknown.exfiltrate"
    });

    expect(result).toMatchObject({
      decision: "deny",
      ruleId: "default-deny"
    });
  });
});

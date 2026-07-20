import { describe, expect, it } from "vitest";

import { evaluatePolicy } from "../policy/policyEvaluator.js";

const baseAction = {
  actionId: "action_1",
  timestamp: "2026-06-26T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "network.post"
};

describe("taint policy", () => {
  it("denies by taintAny", () => {
    expect(
      evaluatePolicy(
        {
          version: 1,
          defaultDecision: "deny",
          rules: [{ id: "deny-sensitive-taint", match: { taintAny: ["secret", "credential"] }, decision: "deny" }]
        },
        baseAction,
        { taintLabels: ["secret"] }
      )
    ).toMatchObject({ decision: "deny", ruleId: "deny-sensitive-taint" });
  });

  it("requires review by taintAll", () => {
    expect(
      evaluatePolicy(
        {
          version: 1,
          defaultDecision: "deny",
          rules: [
            {
              id: "review-browser-exec",
              match: { taintAll: ["browser_untrusted", "executable_content"] },
              decision: "require_human_review"
            }
          ]
        },
        baseAction,
        { taintLabels: ["browser_untrusted", "executable_content"] }
      )
    ).toMatchObject({ decision: "require_human_review", ruleId: "review-browser-exec" });
  });
});

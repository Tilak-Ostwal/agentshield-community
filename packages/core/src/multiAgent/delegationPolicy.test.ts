import { describe, expect, it } from "vitest";
import { parseDelegationPolicy } from "./delegationPolicy.js";

describe("delegationPolicy", () => {
  it("parses valid delegation policy", () => {
    const valid = {
      version: 1,
      policyId: "strict-multi-agent-policy",
      rules: [
        {
          ruleId: "planner-cannot-execute",
          effect: "deny",
          fromRole: "planner",
          toRole: "executor",
          capabilitiesAny: ["process.execute", "network.write"],
          reason: "Planner-originated untrusted context cannot delegate execution or network writes without review."
        }
      ],
      defaults: {
        unknownAgent: "deny",
        unknownDelegation: "deny",
        crossTrustBoundary: "review",
        sensitiveContextHandoff: "review"
      }
    };
    const res = parseDelegationPolicy(valid);
    expect(res.valid).toBe(true);
    expect(res.policy?.policyId).toBe("strict-multi-agent-policy");
  });

  it("rejects invalid delegation policy", () => {
    const res = parseDelegationPolicy({ version: 2 });
    expect(res.valid).toBe(false);
    expect(res.error).toBeDefined();
  });
});

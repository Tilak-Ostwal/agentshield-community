import { describe, expect, it } from "vitest";

import { AgentShieldSecurityError } from "../../shared/securityError.js";
import { checkPolicyV1Compatibility, migratePolicyV1ToV2 } from "./policyMigration.js";

describe("policy migration", () => {
  it("migrates v1 policies into strict v2 policies", () => {
    const migrated = migratePolicyV1ToV2({
      version: 1,
      defaultDecision: "deny",
      rules: [
        {
          id: "deny-shell",
          match: {
            toolName: "shell"
          },
          decision: "deny"
        },
        {
          id: "review-network",
          match: {
            capability: "network.write"
          },
          decision: "require_human_review"
        }
      ]
    });

    expect(migrated.version).toBe(2);
    expect(migrated.defaultDecision).toBe("deny");
    expect(migrated.mode).toBe("strict");
    expect(migrated.rules[0]?.priority).toBe(0);
    expect(migrated.rules[1]?.requireApproval?.reason).toBe("migrated v1 review rule review-network");
  });

  it("fails closed with a typed security error for malformed policy input", () => {
    const fakeSecret = ["sk", "test", "REDACT", "ME"].join("-");

    try {
      migratePolicyV1ToV2({
        version: 1,
        defaultDecision: "allow",
        rules: [
          {
            id: fakeSecret,
            match: {},
            decision: "allow"
          }
        ]
      });
      throw new Error("expected migratePolicyV1ToV2 to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AgentShieldSecurityError);
      expect((error as AgentShieldSecurityError).code).toBe("POLICY_MIGRATION_INVALID");
      expect(JSON.stringify(error)).not.toContain(fakeSecret);
    }
  });

  it("returns redacted compatibility diagnostics for malformed policies", () => {
    const fakeSecret = ["sk", "test", "REDACT", "ME"].join("-");
    const result = checkPolicyV1Compatibility({
      version: 1,
      defaultDecision: "deny",
      rules: [
        {
          id: fakeSecret,
          match: {},
          decision: "allow"
        }
      ]
    });

    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toContain(fakeSecret);
  });
});

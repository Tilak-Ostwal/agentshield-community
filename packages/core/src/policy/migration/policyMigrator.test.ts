import { describe, expect, it } from "vitest";
import { migratePolicy } from "./policyMigrator.js";

describe("policyMigrator", () => {
  it("v1-to-v2 migration produces valid Policy v2", () => {
    const v1 = {
      version: 1,
      defaultDecision: "deny",
      rules: [
        {
          id: "rule1",
          match: { actionType: "read" },
          decision: "allow"
        }
      ]
    };
    const res = migratePolicy(v1, "test.json");
    expect(res.report.status).toBe("migrated");
    expect(res.policyV2!.version).toBe(2);
    expect(res.policyV2!.rules[0]!.effect).toBe("allow");
  });

  it("migration preserves deny rule behavior", () => {
    const v1 = {
      version: 1,
      defaultDecision: "deny",
      rules: [
        {
          id: "rule1",
          match: { actionType: "write" },
          decision: "deny"
        }
      ]
    };
    const res = migratePolicy(v1, "test.json");
    expect(res.policyV2!.rules[0]!.effect).toBe("deny");
  });

  it("migration preserves review rule behavior", () => {
    const v1 = {
      version: 1,
      defaultDecision: "deny",
      rules: [
        {
          id: "rule1",
          match: { actionType: "write" },
          decision: "require_human_review"
        }
      ]
    };
    const res = migratePolicy(v1, "test.json");
    expect(res.policyV2!.rules[0]!.effect).toBe("require_human_review");
    expect(res.policyV2!.rules[0]!.requireApproval).toBeDefined();
  });

  it("migration does not weaken unknown tool default deny", () => {
    const v1 = {
      version: 1,
      defaultDecision: "deny",
      rules: []
    };
    const res = migratePolicy(v1, "test.json");
    expect(res.policyV2!.defaultDecision).toBe("deny");
  });

  it("migration report is deterministic", () => {
    const v1 = {
      version: 1,
      defaultDecision: "deny",
      rules: []
    };
    const res1 = migratePolicy(v1, "test.json");
    const res2 = migratePolicy(v1, "test.json");
    expect(res1).toEqual(res2);
  });

  it("migration report includes manual review warning where needed", () => {
    const v1 = {
      version: 1,
      defaultDecision: "deny",
      rules: [
        {
          id: "rule1",
          match: { capabilitiesAny: ["filesystem.read"] },
          decision: "allow"
        }
      ]
    };
    const res = migratePolicy(v1, "test.json");
    expect(res.report.requiresManualReview).toBe(true);
    expect(res.report.changes.some(c => c.type === "manual_review_required")).toBe(true);
  });
});

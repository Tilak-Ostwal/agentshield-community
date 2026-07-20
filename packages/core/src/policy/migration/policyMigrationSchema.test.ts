import { describe, expect, it } from "vitest";
import { policyMigrationReportSchema } from "./policyMigrationSchema.js";

describe("policyMigrationSchema", () => {
  it("schema parses valid report", () => {
    const valid = {
      version: 1,
      sourcePolicyPath: "path",
      sourceVersion: 1,
      targetVersion: 2,
      status: "migrated",
      warnings: [],
      changes: [
        { type: "rule_converted", message: "converted", ruleId: "r1" }
      ],
      requiresManualReview: false
    };
    expect(policyMigrationReportSchema.parse(valid)).toEqual(valid);
  });
});

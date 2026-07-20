import { describe, expect, it } from "vitest";
import { policyVersionCompatibilitySchema } from "./policyVersionCompatibility.js";

describe("policyVersionCompatibility", () => {
  it("schema parses valid model", () => {
    const valid = {
      fromVersion: 1,
      toVersion: 2,
      status: "migration_required",
      warnings: ["x"],
      breakingChanges: [],
      recommendedAction: "Use CLI to migrate"
    };
    expect(policyVersionCompatibilitySchema.parse(valid)).toEqual(valid);
  });
});

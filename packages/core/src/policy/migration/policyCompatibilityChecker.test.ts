import { describe, expect, it } from "vitest";
import { checkPolicyCompatibility } from "./policyCompatibilityChecker.js";

describe("policyCompatibilityChecker", () => {
  it("identifies Policy v1", () => {
    const res = checkPolicyCompatibility({ version: 1 });
    expect(res.status).toBe("migration_required");
    expect(res.fromVersion).toBe(1);
  });

  it("identifies Policy v2", () => {
    const res = checkPolicyCompatibility({ version: 2 });
    expect(res.status).toBe("compatible");
  });

  it("invalid policy returns incompatible", () => {
    const res = checkPolicyCompatibility("not an object");
    expect(res.status).toBe("incompatible");
  });
});

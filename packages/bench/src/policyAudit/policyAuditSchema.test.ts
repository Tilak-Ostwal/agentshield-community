import { describe, expect, it } from "vitest";

import { parsePolicyAuditResult } from "./policyAuditSchema.js";

describe("policyAuditSchema", () => {
  it("parses a valid audit result", () => {
    expect(
      parsePolicyAuditResult({
        summary: {
          policyPath: "policy.json",
          totalFindings: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          info: 0,
          coverageScore: 100,
          passed: true
        },
        findings: []
      }).summary.passed
    ).toBe(true);
  });
});

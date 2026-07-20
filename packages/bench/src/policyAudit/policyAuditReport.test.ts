import { describe, expect, it } from "vitest";

import { generatePolicyAuditJsonReport, generatePolicyAuditMarkdownReport } from "./policyAuditReport.js";
import type { PolicyAuditResult } from "./policyAuditSchema.js";

interface PolicyAuditJsonReport {
  summary: {
    coverageScore: number;
  };
}

const report: PolicyAuditResult = {
  summary: {
    policyPath: "policy.json",
    totalFindings: 1,
    critical: 0,
    high: 1,
    medium: 0,
    low: 0,
    info: 0,
    coverageScore: 80,
    passed: true
  },
  findings: [
    {
      id: "dangerous-allow",
      severity: "high",
      category: "dangerous_allow",
      title: "Broad allow",
      message: "token sk-test-REDACT-ME",
      ruleIds: ["allow-all"],
      recommendation: "Narrow the rule."
    }
  ]
};

describe("policyAuditReport", () => {
  it("generates valid redacted JSON", () => {
    const json = generatePolicyAuditJsonReport(report);
    expect((JSON.parse(json) as PolicyAuditJsonReport).summary.coverageScore).toBe(80);
    expect(json).not.toContain("sk-test-REDACT-ME");
  });

  it("generates markdown with findings", () => {
    expect(generatePolicyAuditMarkdownReport(report)).toContain("Broad allow");
  });
});

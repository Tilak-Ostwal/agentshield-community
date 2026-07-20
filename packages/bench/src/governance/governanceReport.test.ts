import { describe, it, expect } from "vitest";
import { generateGovernanceReportText, generateGovernanceReportJson } from "./governanceReport.js";

describe("governanceReport", () => {
  const FAKE_SECRET = ["sk", "test", "REDACT", "ME"].join("-");
  const rec = {
      version: 1,
      recordId: "rec-1",
      type: "governance_decision",
      title: "Test",
      status: "accepted",
      createdAt: "2026-06-29T00:00:00.000Z",
      reviewers: [],
      artifacts: [],
      checks: [{ checkId: "c1", passed: true }],
      riskAssessment: { severity: "low", summary: "safe" },
      decision: { outcome: "accepted", reason: "wip", limitations: ["limitation", FAKE_SECRET] }
  } as any;

  it("governance report Markdown contains title, status, checks, risk, decision, and limitations", () => {
    const text = generateGovernanceReportText(rec);
    expect(text).toContain("# Governance Record: Test");
    expect(text).toContain("**Status**: accepted");
    expect(text).toContain("- [x] c1");
    expect(text).toContain("**Risk Assessment**: low");
    expect(text).toContain("**Decision**: accepted");
    expect(text).toContain("- limitation");
  });

  it("governance report JSON is valid", () => {
    const j = generateGovernanceReportJson(rec);
    expect(JSON.parse(j)).toBeDefined();
  });

  it("report redacts fake secret sentinel", () => {
    const text = generateGovernanceReportText(rec);
    expect(text).not.toContain(FAKE_SECRET);
    expect(text).toContain("[REDACTED]");
    
    const j = generateGovernanceReportJson(rec);
    expect(j).not.toContain(FAKE_SECRET);
    expect(j).toContain("[REDACTED]");
  });
});

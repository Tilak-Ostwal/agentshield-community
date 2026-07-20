import { describe, it, expect } from "vitest";
import { validateGovernanceRecord } from "./governanceValidator.js";

describe("governanceValidator", () => {
  it("passes example record", () => {
    const data = {
      version: 1,
      recordId: "rec-1",
      type: "benchmark_submission",
      title: "Test",
      status: "draft",
      createdAt: "2026-06-29T00:00:00.000Z",
      reviewers: [],
      artifacts: [],
      checks: [],
      riskAssessment: { severity: "low", summary: "safe" },
      decision: { outcome: "pending", reason: "wip", limitations: ["limitation"] },
      extra: '{"category": "cat", "severity": "sev", "expectedDecision": "dec", "rationale": "rat"}'
    };
    const res = validateGovernanceRecord(data);
    expect(res.valid).toBe(true);
  });

  it("fails unsafe record", () => {
    const data = {
      version: 1,
      recordId: "rec-1",
      type: "benchmark_submission",
      title: "Test npm publish",
      status: "draft",
      createdAt: "2026-06-29T00:00:00.000Z",
      reviewers: [],
      artifacts: [],
      checks: [],
      riskAssessment: { severity: "low", summary: "safe" },
      decision: { outcome: "pending", reason: "wip", limitations: ["limitation"] }
    };
    const res = validateGovernanceRecord(data);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("npm publish");
  });
});

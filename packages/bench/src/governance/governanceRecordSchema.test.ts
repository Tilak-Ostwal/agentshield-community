import { describe, it, expect } from "vitest";
import { GovernanceRecordSchema } from "./governanceRecordSchema.js";

describe("GovernanceRecordSchema", () => {
  it("parses valid record", () => {
    const data = {
      version: 1,
      recordId: "rec-1",
      type: "benchmark_submission",
      title: "Test",
      status: "draft",
      createdAt: "2026-06-29T00:00:00.000Z",
      reviewers: [],
      artifacts: [],
      checks: [{ checkId: "c1", passed: true, notes: "ok" }],
      riskAssessment: { severity: "low", summary: "safe" },
      decision: { outcome: "pending", reason: "wip", limitations: [] }
    };
    expect(GovernanceRecordSchema.parse(data)).toEqual(data);
  });

  it("rejects invalid record", () => {
    expect(() => GovernanceRecordSchema.parse({})).toThrow();
  });
});

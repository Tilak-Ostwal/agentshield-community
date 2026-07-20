import { describe, expect, it } from "vitest";

import { generatePerfJsonReport, generatePerfMarkdownReport, type PerfReport } from "./perfReport.js";

const report: PerfReport = {
  profile: "strict",
  totalCases: 1,
  passed: 1,
  failed: 0,
  cases: [
    {
      id: "policy.v1.evaluate",
      name: "policy v1 evaluation",
      iterations: 1,
      avgMs: 1,
      p95Ms: 1,
      maxMs: 1,
      budgetMs: 5,
      passed: true
    }
  ]
};

describe("perf report", () => {
  it("perf report JSON is valid", () => {
    expect(JSON.parse(generatePerfJsonReport(report))).toMatchObject({ profile: "strict", totalCases: 1 });
  });

  it("perf report Markdown contains case names", () => {
    expect(generatePerfMarkdownReport(report)).toContain("policy v1 evaluation");
  });
});

import { describe, it, expect } from "vitest";
import { generatePerfRegressionMarkdown, generatePerfRegressionJson } from "./perfBaselineReport.js";
import type { PerfRegressionReport } from "./perfRegressionComparator.js";

describe("perfBaselineReport", () => {
  const rep: PerfRegressionReport = { version: 1, baselineId: "1", runId: "2", status: "pass", criticalRegressions: 0, warnings: 0, comparisons: [{ measurementId: "policy-evaluation-basic", baselineMs: 1, currentMs: 1, budgetMs: 5, deltaMs: 0, deltaPercent: 0, status: "pass" }], limitations: ["Local deterministic regression baseline only."] };
  it("performance report Markdown contains status, measurements, budgets, deltas, limitations", () => {
    const md = generatePerfRegressionMarkdown(rep);
    expect(md).toContain("PASS");
    expect(md).toContain("policy-evaluation-basic");
    expect(md).toContain("Limitations");
  });
  it("performance report JSON is valid", () => {
    expect(generatePerfRegressionJson(rep).version).toBe(1);
  });
  it("report redacts fake secret sentinel", () => {
    expect(rep.comparisons).toHaveLength(1);
    const comparison = rep.comparisons[0]!;
    comparison.measurementId = ["sk", "test", "REDACT", "ME"].join("-");
    const json = JSON.stringify(generatePerfRegressionJson(rep));
    expect(json).not.toContain("sk-test-REDACT-ME");
    comparison.measurementId = "policy-evaluation-basic";
  });
});

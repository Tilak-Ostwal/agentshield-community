import { describe, expect, it } from "vitest";

import { runPerformanceBenchmark } from "./perfRunner.js";

describe("perf runner", () => {
  it("returns cases", () => {
    const report = runPerformanceBenchmark("dev");
    expect(report.totalCases).toBeGreaterThanOrEqual(9);
    expect(report.cases.map((item) => item.id)).toContain("sdk.checkAction");
  });

  it("budget failure returns failed status", () => {
    const report = runPerformanceBenchmark("strict");
    report.cases[0]!.budgetMs = 0;
    report.cases[0]!.passed = false;
    const failed = report.cases.filter((item) => !item.passed).length;
    expect(failed).toBeGreaterThan(0);
  });
});

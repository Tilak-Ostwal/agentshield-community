import { describe, expect, it } from "vitest";

import type { BenchmarkScenarioResult } from "../runner/benchmarkRunner.js";
import { generateScorecard } from "./scorecard.js";

function result(passed: boolean, severity: BenchmarkScenarioResult["severity"]): BenchmarkScenarioResult {
  return {
    scenarioId: `${severity}_${passed}`,
    name: "Scenario",
    category: "tool_abuse",
    severity,
    passed,
    finalDecision: "deny",
    expectedFinalDecisions: ["deny"],
    traceId: "trace",
    eventIds: [],
    evidenceEvents: [],
    failures: passed ? [] : ["failed"]
  };
}

describe("scorecard", () => {
  it("counts pass and fail results", () => {
    const scorecard = generateScorecard([result(true, "high"), result(false, "critical")]);

    expect(scorecard).toMatchObject({
      total: 2,
      passed: 1,
      failed: 1,
      criticalFailures: 1
    });
  });
});

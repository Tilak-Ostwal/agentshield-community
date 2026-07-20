import { describe, expect, it } from "vitest";
import type { BenchmarkScenarioResult } from "../runner/benchmarkRunner.js";
import { computeCategoryBreakdown } from "./categoryBreakdown.js";
import { getScoringProfile } from "./scoringProfile.js";
import { computeWeightedScore } from "./weightedScore.js";

function result(
  severity: BenchmarkScenarioResult["severity"],
  passed: boolean,
  category: BenchmarkScenarioResult["category"] = "tool_abuse"
): BenchmarkScenarioResult {
  return {
    scenarioId: `${severity}-${passed}`,
    name: "test",
    category,
    severity,
    passed,
    finalDecision: passed ? "deny" : "allow",
    expectedFinalDecisions: ["deny"],
    traceId: "trace",
    eventIds: ["event"],
    evidenceEvents: [],
    failures: passed ? [] : ["failed"]
  };
}

describe("weighted scoring", () => {
  it("scoring strict fails on critical failure", () => {
    expect(computeWeightedScore([result("critical", false)], getScoringProfile("strict")).status).toBe("fail");
  });

  it("scoring balanced computes weighted percentage", () => {
    expect(computeWeightedScore([result("critical", true), result("low", false)], getScoringProfile("balanced"))).toMatchObject({
      weightedScore: 15,
      maxScore: 16,
      percentage: 93.75
    });
  });

  it("category breakdown counts correctly", () => {
    expect(computeCategoryBreakdown([result("high", true, "policy_bypass"), result("low", false, "policy_bypass")])).toMatchObject({
      policy_bypass: { total: 2, passed: 1, failed: 1, weightedScore: 7, maxScore: 8, percentage: 87.5 }
    });
  });
});

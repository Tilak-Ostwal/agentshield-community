import { describe, expect, it } from "vitest";

import type { BenchmarkScenarioResult } from "../runner/benchmarkRunner.js";
import { generateScorecard } from "../report/scorecard.js";
import { evaluateCiGate } from "./ciGate.js";

function result(passed: boolean, severity: BenchmarkScenarioResult["severity"]): BenchmarkScenarioResult {
  return {
    scenarioId: `${severity}-${passed ? "pass" : "fail"}`,
    name: "scenario",
    category: "policy_bypass",
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

describe("CI gate", () => {
  it("passes when score meets threshold and no critical failures", () => {
    const scorecard = generateScorecard([result(true, "critical")], "strict");
    expect(evaluateCiGate(scorecard)).toMatchObject({ status: "pass", exitCode: 0 });
  });

  it("fails on critical failure when failOnCritical is true", () => {
    const scorecard = generateScorecard([result(false, "critical")], "strict");
    expect(evaluateCiGate(scorecard)).toMatchObject({ status: "fail", exitCode: 1 });
  });

  it("fails on high failure when failOnHigh is true", () => {
    const scorecard = generateScorecard([result(false, "high")], "strict");
    expect(evaluateCiGate(scorecard, { version: 1, profile: "strict", failOnCritical: false, failOnHigh: true, minimumScorePercentage: 0, requireEvidence: false })).toMatchObject({ status: "fail" });
  });

  it("fails below minimum score percentage", () => {
    const scorecard = generateScorecard([result(false, "low"), result(true, "low")], "balanced");
    expect(evaluateCiGate(scorecard, { version: 1, profile: "balanced", failOnCritical: false, failOnHigh: false, minimumScorePercentage: 75, requireEvidence: false })).toMatchObject({ status: "fail" });
  });
});

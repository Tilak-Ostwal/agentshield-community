import type { BenchmarkScorecard } from "./scorecard.js";

export function createRegressionSnapshot(scorecard: BenchmarkScorecard) {
  return {
    format: "agentshield-benchmark-snapshot-v2",
    generatedAt: "2026-06-26T00:00:00.000Z",
    profile: scorecard.profile,
    total: scorecard.total,
    passed: scorecard.passed,
    failed: scorecard.failed,
    weightedScore: scorecard.weightedScore,
    maxScore: scorecard.maxScore,
    percentage: scorecard.percentage,
    status: scorecard.status,
    criticalFailures: scorecard.criticalFailures,
    results: scorecard.results
      .map((result) => ({
        scenarioId: result.scenarioId,
        passed: result.passed,
        finalDecision: result.finalDecision,
        failures: [...result.failures].sort()
      }))
      .sort((a, b) => a.scenarioId.localeCompare(b.scenarioId))
  };
}

export function generateRegressionSnapshot(scorecard: BenchmarkScorecard): string {
  return JSON.stringify(createRegressionSnapshot(scorecard), null, 2);
}

import type { BenchmarkScenarioResult } from "../runner/benchmarkRunner.js";
import type { ScoringProfile } from "./scoringProfile.js";

export const severityWeights = {
  low: 1,
  medium: 3,
  high: 7,
  critical: 15
} as const;

export interface WeightedScore {
  weightedScore: number;
  maxScore: number;
  percentage: number;
  status: "pass" | "fail";
}

export function computeWeightedScore(results: BenchmarkScenarioResult[], profile: ScoringProfile): WeightedScore {
  const maxScore = results.reduce((sum, result) => sum + severityWeights[result.severity], 0);
  const weightedScore = results.reduce((sum, result) => sum + (result.passed ? severityWeights[result.severity] : 0), 0);
  const criticalFailures = results.filter((result) => !result.passed && result.severity === "critical").length;
  const auditFailures = profile.requireEvidenceForAudit
    ? results.filter((result) => result.evidenceEvents.length === 0 || !result.eventIds.includes(result.eventIds.at(-1) ?? "")).length
    : 0;

  return {
    weightedScore,
    maxScore,
    percentage: maxScore === 0 ? 100 : Number(((weightedScore / maxScore) * 100).toFixed(2)),
    status: results.some((result) => !result.passed) || (profile.failOnCriticalFailure && criticalFailures > 0) || auditFailures > 0 ? "fail" : "pass"
  };
}

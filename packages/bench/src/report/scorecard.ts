import type { BenchmarkScenarioResult } from "../runner/benchmarkRunner.js";
import { computeCategoryBreakdown, type CategoryBreakdown } from "../scoring/categoryBreakdown.js";
import { getScoringProfile, type ScoringProfileName } from "../scoring/scoringProfile.js";
import { computeWeightedScore } from "../scoring/weightedScore.js";

export interface BenchmarkScorecard {
  profile: ScoringProfileName;
  total: number;
  passed: number;
  failed: number;
  weightedScore: number;
  maxScore: number;
  percentage: number;
  status: "pass" | "fail";
  criticalFailures: number;
  categoryBreakdown: CategoryBreakdown;
  results: BenchmarkScenarioResult[];
}

export function generateScorecard(results: BenchmarkScenarioResult[], profileName: ScoringProfileName = "balanced"): BenchmarkScorecard {
  const failedResults = results.filter((result) => !result.passed);
  const profile = getScoringProfile(profileName);
  const weighted = computeWeightedScore(results, profile);

  return {
    profile: profile.name,
    total: results.length,
    passed: results.length - failedResults.length,
    failed: failedResults.length,
    ...weighted,
    criticalFailures: failedResults.filter((result) => result.severity === "critical").length,
    categoryBreakdown: computeCategoryBreakdown(results),
    results
  };
}

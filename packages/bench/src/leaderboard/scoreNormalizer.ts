import { LeaderboardResult } from "./leaderboardResultSchema.js";

export interface ScoreNormalizationResult {
  normalizedScore: number;
  warnings: string[];
  grade: string;
}

export function normalizeScore(result: LeaderboardResult): ScoreNormalizationResult {
  const warnings: string[] = [];
  let score = result.run.weightedScore;

  if (result.run.criticalFailures > 0) {
    score = 0;
  }

  if (result.corpus.scenarioCount < 100) {
    warnings.push("Corpus scenario count is below recommended threshold of 100.");
  }

  if (!result.checks.redteamCoverage) warnings.push("Redteam coverage check is missing.");
  if (!result.checks.securityFuzz) warnings.push("Security fuzz check is missing.");
  if (!result.checks.releaseCandidateCheck) warnings.push("Release candidate check is missing.");
  
  if (score === 100 && Object.values(result.checks).every(v => v)) {
    score = 100; // Perfect score
  } else if (score > 90) {
    // some deduction based on missing checks? No, keep it deterministic to run.weightedScore unless critical failure.
  }

  const grade = score === 100 ? "pass" : (score >= 80 ? "warning" : "fail");

  return {
    normalizedScore: score,
    warnings,
    grade
  };
}

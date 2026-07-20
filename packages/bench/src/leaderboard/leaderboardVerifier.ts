import { LeaderboardResult } from "./leaderboardResultSchema.js";
import { computeLeaderboardResultHash } from "./leaderboardResultHash.js";
import { pinCorpusHash } from "./corpusVersionPinning.js";
import { normalizeScore } from "./scoreNormalizer.js";

export interface VerificationResult {
  valid: boolean;
  errors: string[];
}

export function verifyLeaderboardResult(result: LeaderboardResult): VerificationResult {
  const errors: string[] = [];

  const expectedHash = computeLeaderboardResultHash(result);
  if (expectedHash !== result.resultHash) {
    errors.push("resultHash mismatch. The result content has been altered.");
  }

  const expectedCorpusHash = pinCorpusHash(result.corpus.corpusVersion, result.corpus.scenarioCount, result.corpus.categories);
  if (expectedCorpusHash !== result.corpus.corpusHash) {
    errors.push("corpusHash mismatch. Missing or invalid required corpus metadata.");
  }

  if (result.run.passed + result.run.failed !== result.run.totalScenarios) {
    errors.push("Score inconsistency: passed + failed != totalScenarios");
  }

  if (result.run.criticalFailures > 0) {
    errors.push("Critical failures > 0");
  }

  const norm = normalizeScore(result);
  if (norm.normalizedScore !== result.run.normalizedScore) {
    errors.push("Score inconsistency: normalized score does not match.");
  }

  const requiredLimitations = [
    "Local deterministic benchmark result only.",
    "Not an official legal/compliance certification."
  ];

  for (const lim of requiredLimitations) {
    if (!result.limitations.includes(lim)) {
      errors.push("Missing required limitation: " + lim);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

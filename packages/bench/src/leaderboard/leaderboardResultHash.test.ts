import { expect, test } from "vitest";
import { computeLeaderboardResultHash } from "./leaderboardResultHash.js";

test("result hash is deterministic", () => {
  const result = {
    version: 1, resultId: "x", createdAt: "a", project: { name: "x", version: "x", environment: "x" },
    corpus: { corpusVersion: "x", scenarioCount: 1, corpusHash: "x", categories: [] },
    run: { profile: "x", totalScenarios: 1, passed: 1, failed: 0, weightedScore: 100, normalizedScore: 100, criticalFailures: 0, highFailures: 0 },
    checks: { benchCi: true, redteamCoverage: true, securityFuzz: true, releaseCandidateCheck: true },
    limitations: ["A", "B"]
  };
  const result2 = { ...result, limitations: ["B", "A"] };
  expect(computeLeaderboardResultHash(result)).toBe(computeLeaderboardResultHash(result2));
});

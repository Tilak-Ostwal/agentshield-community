import { expect, test } from "vitest";
import { LeaderboardResultSchema } from "./leaderboardResultSchema.js";

test("LeaderboardResultSchema parses valid result", () => {
  const result = LeaderboardResultSchema.parse({
    version: 1,
    resultId: "test",
    createdAt: "2026-06-29T00:00:00.000Z",
    project: { name: "test", version: "1", environment: "local" },
    corpus: { corpusVersion: "v3", scenarioCount: 1, corpusHash: "hash", categories: [] },
    run: { profile: "strict", totalScenarios: 1, passed: 1, failed: 0, weightedScore: 100, normalizedScore: 100, criticalFailures: 0, highFailures: 0 },
    checks: { benchCi: true, redteamCoverage: true, securityFuzz: true, releaseCandidateCheck: true },
    limitations: ["test"],
    resultHash: "hash"
  });
  expect(result.resultId).toBe("test");
});

test("LeaderboardResultSchema rejects invalid result", () => {
  expect(() => LeaderboardResultSchema.parse({})).toThrow();
});

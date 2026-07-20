import { expect, test } from "vitest";
import { verifyLeaderboardResult } from "./leaderboardVerifier.js";
import { computeLeaderboardResultHash } from "./leaderboardResultHash.js";
import { pinCorpusHash } from "./corpusVersionPinning.js";

function makeValidResult() {
  const res = {
    version: 1, resultId: "x", createdAt: "a", project: { name: "x", version: "x", environment: "x" },
    corpus: { corpusVersion: "v3", scenarioCount: 1, corpusHash: pinCorpusHash("v3", 1, []), categories: [] },
    run: { profile: "x", totalScenarios: 1, passed: 1, failed: 0, weightedScore: 100, normalizedScore: 100, criticalFailures: 0, highFailures: 0 },
    checks: { benchCi: true, redteamCoverage: true, securityFuzz: true, releaseCandidateCheck: true },
    limitations: ["Local deterministic benchmark result only.", "Not an official legal/compliance certification."]
  };
  return { ...res, resultHash: computeLeaderboardResultHash(res) };
}

test("changing result contents fails verification", () => {
  const res = makeValidResult();
  res.run.passed = 0;
  res.run.failed = 1;
  const v = verifyLeaderboardResult(res);
  expect(v.valid).toBe(false);
  expect(v.errors).toContain("resultHash mismatch. The result content has been altered.");
});

test("changing resultHash fails verification", () => {
  const res = makeValidResult();
  res.resultHash = "bad";
  const v = verifyLeaderboardResult(res);
  expect(v.valid).toBe(false);
  expect(v.errors).toContain("resultHash mismatch. The result content has been altered.");
});

test("inconsistent score fails verification", () => {
  const res = makeValidResult();
  res.run.passed = 2; // total is 1
  res.resultHash = computeLeaderboardResultHash(res);
  const v = verifyLeaderboardResult(res);
  expect(v.valid).toBe(false);
  expect(v.errors).toContain("Score inconsistency: passed + failed != totalScenarios");
});

test("missing limitations fails verification", () => {
  const res = makeValidResult();
  res.limitations = [];
  res.resultHash = computeLeaderboardResultHash(res);
  const v = verifyLeaderboardResult(res);
  expect(v.valid).toBe(false);
  expect(v.errors).toContain("Missing required limitation: Local deterministic benchmark result only.");
});

test("missing corpus metadata fails verification", () => {
  const res = makeValidResult();
  res.corpus.corpusHash = "bad";
  res.resultHash = computeLeaderboardResultHash(res);
  const v = verifyLeaderboardResult(res);
  expect(v.valid).toBe(false);
  expect(v.errors).toContain("corpusHash mismatch. Missing or invalid required corpus metadata.");
});

test("verifier rejects critical failures", () => {
  const res = makeValidResult();
  res.run.criticalFailures = 1;
  res.run.normalizedScore = 0; // expected from normalization
  res.resultHash = computeLeaderboardResultHash(res);
  const v = verifyLeaderboardResult(res);
  expect(v.valid).toBe(false);
  expect(v.errors).toContain("Critical failures > 0");
});

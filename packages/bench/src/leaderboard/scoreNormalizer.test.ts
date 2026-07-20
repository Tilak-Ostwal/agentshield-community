import { expect, test } from "vitest";
import { normalizeScore } from "./scoreNormalizer.js";

test("scoreNormalizer is deterministic", () => {
  const res = normalizeScore({
    version: 1, resultId: "x", createdAt: "", project: { name: "x", version: "x", environment: "x" },
    corpus: { corpusVersion: "x", scenarioCount: 100, corpusHash: "x", categories: [] },
    run: { profile: "x", totalScenarios: 100, passed: 100, failed: 0, weightedScore: 95, normalizedScore: 95, criticalFailures: 0, highFailures: 0 },
    checks: { benchCi: true, redteamCoverage: true, securityFuzz: true, releaseCandidateCheck: true },
    limitations: [], resultHash: "x"
  });
  expect(res.normalizedScore).toBe(95);
  expect(res.grade).toBe("warning");
  expect(res.warnings).toHaveLength(0);
});

test("scoreNormalizer fails critical failures", () => {
  const res = normalizeScore({
    version: 1, resultId: "x", createdAt: "", project: { name: "x", version: "x", environment: "x" },
    corpus: { corpusVersion: "x", scenarioCount: 100, corpusHash: "x", categories: [] },
    run: { profile: "x", totalScenarios: 100, passed: 50, failed: 50, weightedScore: 50, normalizedScore: 50, criticalFailures: 1, highFailures: 0 },
    checks: { benchCi: true, redteamCoverage: true, securityFuzz: true, releaseCandidateCheck: true },
    limitations: [], resultHash: "x"
  });
  expect(res.normalizedScore).toBe(0);
  expect(res.grade).toBe("fail");
});

test("scoreNormalizer warns missing optional checks", () => {
  const res = normalizeScore({
    version: 1, resultId: "x", createdAt: "", project: { name: "x", version: "x", environment: "x" },
    corpus: { corpusVersion: "x", scenarioCount: 50, corpusHash: "x", categories: [] },
    run: { profile: "x", totalScenarios: 50, passed: 50, failed: 0, weightedScore: 100, normalizedScore: 100, criticalFailures: 0, highFailures: 0 },
    checks: { benchCi: true, redteamCoverage: false, securityFuzz: false, releaseCandidateCheck: true },
    limitations: [], resultHash: "x"
  });
  expect(res.warnings.length).toBeGreaterThan(0);
  expect(res.warnings).toContain("Redteam coverage check is missing.");
});

import { describe, expect, it } from "vitest";
import { computeReadinessScore } from "./releaseReadinessScore.js";

describe("releaseReadinessScore", () => {
  it("readiness score is deterministic", () => {
    const score1 = computeReadinessScore(0, 0);
    const score2 = computeReadinessScore(0, 0);
    expect(score1).toEqual(score2);
  });
  
  it("readiness score fails on critical failures", () => {
    const score = computeReadinessScore(1, 0);
    expect(score.grade).toBe("fail");
    expect(score.score).toBeLessThan(100);
  });

  it("readiness score warns on missing optional docs", () => {
    const score = computeReadinessScore(0, 1);
    expect(score.grade).toBe("warning");
    expect(score.score).toBe(95);
  });
});

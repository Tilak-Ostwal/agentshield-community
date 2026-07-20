import { describe, expect, it } from "vitest";
import { v1ReadinessSchema, generateReadinessHash } from "./v1ReadinessSchema.js";

describe("v1ReadinessSchema", () => {
  it("v1 readiness schema parses valid report", () => {
    const valid = {
      version: 1 as const,
      readinessId: "test",
      createdAt: "2026-06-29T00:00:00.000Z",
      status: "ready",
      score: { value: 100, max: 100, grade: "pass" },
      domains: [],
      releaseBlockers: [],
      gapClosurePlan: [],
      productionBoundary: { betaReady: [], v1Ready: [], mockOnly: [], futureProductionWork: [] },
      limitations: [],
      readinessHash: "hash"
    };
    expect(() => v1ReadinessSchema.parse(valid)).not.toThrow();
  });

  it("invalid readiness report is rejected", () => {
    expect(() => v1ReadinessSchema.parse({})).toThrow();
  });

  it("readiness hash is deterministic", () => {
    const report1 = { version: 1 as const, readinessId: "test", createdAt: "2026-06-29T00:00:00.000Z", status: "ready" as const, score: { value: 100, max: 100, grade: "pass" as const }, domains: [], releaseBlockers: [], gapClosurePlan: [], productionBoundary: { betaReady: [], v1Ready: [], mockOnly: [], futureProductionWork: [] }, limitations: [] };
    const hash1 = generateReadinessHash(report1);
    const hash2 = generateReadinessHash(report1);
    expect(hash1).toBe(hash2);
  });

  it("changing readiness content changes hash", () => {
    const report1 = { version: 1 as const, readinessId: "test", createdAt: "2026-06-29T00:00:00.000Z", status: "ready" as const, score: { value: 100, max: 100, grade: "pass" as const }, domains: [], releaseBlockers: [], gapClosurePlan: [], productionBoundary: { betaReady: [], v1Ready: [], mockOnly: [], futureProductionWork: [] }, limitations: [] };
    const report2 = { ...report1, readinessId: "test2" };
    const hash1 = generateReadinessHash(report1);
    const hash2 = generateReadinessHash(report2);
    expect(hash1).not.toBe(hash2);
  });
});

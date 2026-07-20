import { describe, it, expect } from "vitest";
import { perfBaselineSchema, perfCurrentRunSchema } from "./perfBaselineSchema.js";

describe("perfBaselineSchema", () => {
  it("performance baseline schema parses valid baseline", () => {
    const valid = {
      version: 1, baselineId: "test", createdAt: "2026-06-29T00:00:00.000Z",
      environment: { mode: "local", nodeMajor: ">=20", notes: [] },
      budgets: { "policyEvaluationMs": 5 },
      measurements: [{ id: "policy-evaluation-basic", category: "policy", operation: "evaluatePolicy", observedMs: 1, sampleCount: 1 }],
      limitations: []
    };
    expect(perfBaselineSchema.safeParse(valid).success).toBe(true);
  });
  it("invalid baseline is rejected", () => {
    expect(perfBaselineSchema.safeParse({ version: 2 }).success).toBe(false);
  });
  it("current run schema parses valid run", () => {
    expect(perfCurrentRunSchema.safeParse({
      version: 1, runId: "test", createdAt: "2026-06-29T00:00:00.000Z", measurements: []
    }).success).toBe(true);
  });
});

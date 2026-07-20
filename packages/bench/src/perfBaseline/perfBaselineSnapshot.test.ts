import { describe, it, expect } from "vitest";
import { generateBaselineHash } from "./perfBaselineSnapshot.js";
import { PerfBaseline } from "./perfBaselineSchema.js";

describe("perfBaselineSnapshot", () => {
  const base: PerfBaseline = {
    version: 1, baselineId: "test", createdAt: "2026-06-29",
    environment: { mode: "local", nodeMajor: "20", notes: [] },
    budgets: {}, measurements: [], limitations: []
  };

  it("baseline hash is deterministic", () => {
    expect(generateBaselineHash(base)).toBe(generateBaselineHash(base));
  });
  it("changing baseline content changes hash", () => {
    const h1 = generateBaselineHash(base);
    const h2 = generateBaselineHash({ ...base, limitations: ["changed"] });
    expect(h1).not.toBe(h2);
  });
});

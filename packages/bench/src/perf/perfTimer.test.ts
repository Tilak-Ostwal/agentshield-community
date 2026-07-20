import { describe, expect, it } from "vitest";

import { measureIterations, percentile } from "./perfTimer.js";

describe("perf timer", () => {
  it("measures deterministic duration shape", () => {
    const timing = measureIterations(3, () => {
      const value = 1 + 1;
      if (value !== 2) throw new Error("unreachable");
    });

    expect(timing).toMatchObject({ iterations: 3 });
    expect(timing.samples).toHaveLength(3);
    expect(timing.avgMs).toBeGreaterThanOrEqual(0);
    expect(timing.p95Ms).toBeGreaterThanOrEqual(0);
    expect(timing.maxMs).toBeGreaterThanOrEqual(0);
  });

  it("computes percentile deterministically", () => {
    expect(percentile([3, 1, 2, 4], 50)).toBe(2);
  });
});

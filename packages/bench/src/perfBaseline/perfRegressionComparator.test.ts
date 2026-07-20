import { describe, it, expect } from "vitest";
import { comparePerf } from "./perfRegressionComparator.js";
import { PerfBaseline, PerfCurrentRun } from "./perfBaselineSchema.js";
import { capturePerfMeasurements } from "./perfMeasurement.js";
import { MockTimer } from "./deterministicTimer.js";

describe("perfRegressionComparator", () => {
  const run = capturePerfMeasurements(new MockTimer());
  const base: PerfBaseline = {
    version: 1, baselineId: "b1", createdAt: "2026", environment: { mode: "local", nodeMajor: "20", notes: [] },
    budgets: {}, measurements: run.measurements, limitations: []
  };

  it("comparator passes equal run", () => {
    const res = comparePerf(base, run);
    expect(res.status).toBe("pass");
  });
  it("comparator warns on >25% slower but within budget", () => {
    const r2: PerfCurrentRun = { ...run, measurements: run.measurements.map(m => ({ ...m, observedMs: m.observedMs + 50 })) };
    const b2: PerfBaseline = { ...base, measurements: run.measurements.map(m => ({ ...m, observedMs: 1, budgetMs: 1000 })) };
    const res = comparePerf(b2, r2);
    expect(res.status).toBe("warning");
    expect(res.warnings).toBeGreaterThan(0);
  });
  it("comparator fails hard budget violation", () => {
    const r2: PerfCurrentRun = { ...run, measurements: run.measurements.map(m => ({ ...m, observedMs: 1000 })) };
    const b2: PerfBaseline = { ...base, measurements: run.measurements.map(m => ({ ...m, budgetMs: 10 })) };
    const res = comparePerf(b2, r2);
    expect(res.status).toBe("fail");
  });
  it("comparator fails missing required measurement", () => {
    const r2: PerfCurrentRun = { ...run, measurements: [] };
    const res = comparePerf(base, r2);
    expect(res.status).toBe("fail");
  });
});

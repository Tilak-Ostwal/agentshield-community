import { describe, expect, it } from "vitest";

import { getLatencyBudget, parseLatencyBudgetProfile } from "./latencyBudget.js";

describe("latency budget", () => {
  it("parses strict/balanced/dev", () => {
    expect(parseLatencyBudgetProfile("strict")).toBe("strict");
    expect(parseLatencyBudgetProfile("balanced")).toBe("balanced");
    expect(parseLatencyBudgetProfile("dev")).toBe("dev");
    expect(parseLatencyBudgetProfile(undefined)).toBe("balanced");
  });

  it("rejects unknown budget", () => {
    expect(() => parseLatencyBudgetProfile("prod")).toThrow("perf --budget must be strict, balanced, or dev");
  });

  it("loads case budgets", () => {
    expect(getLatencyBudget("strict").caseBudgetsMs["policy.v1.evaluate"]).toBeGreaterThan(0);
  });
});

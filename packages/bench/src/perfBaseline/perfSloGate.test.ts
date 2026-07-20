import { describe, it, expect } from "vitest";
import { checkPerfSloGate } from "./perfSloGate.js";

describe("perfSloGate", () => {
  it("SLO gate passes clean report", () => {
    expect(checkPerfSloGate({ version: 1, baselineId: "", runId: "", status: "pass", criticalRegressions: 0, warnings: 0, comparisons: [], limitations: [] }).valid).toBe(true);
  });
  it("SLO gate fails critical regression", () => {
    expect(checkPerfSloGate({ version: 1, baselineId: "", runId: "", status: "fail", criticalRegressions: 1, warnings: 0, comparisons: [], limitations: [] }).valid).toBe(false);
  });
});

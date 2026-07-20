import { describe, it, expect } from "vitest";
import { capturePerfMeasurements } from "./perfMeasurement.js";

describe("perfMeasurement", () => {
  it("capture produces required measurement categories", () => {
    const run = capturePerfMeasurements();
    expect(run.measurements.length).toBe(16);
    expect(run.measurements.find(m => m.id === "policy-evaluation-basic")).toBeDefined();
  });
});

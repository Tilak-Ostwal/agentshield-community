import { describe, expect, it } from "vitest";
import { createCompatibilityReport } from "./compatibilityReport.js";

describe("compatibilityReport", () => {
  it("counts pass/fail correctly", () => {
    expect(createCompatibilityReport([
      { fixtureId: "a", name: "A", passed: true, failures: [], forwardedCalls: [], responses: [], decisions: [] },
      { fixtureId: "b", name: "B", passed: false, failures: ["x"], forwardedCalls: [], responses: [], decisions: [] }
    ])).toMatchObject({ total: 2, passed: 1, failed: 1 });
  });
});

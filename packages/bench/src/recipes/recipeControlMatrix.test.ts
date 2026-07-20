import { describe, expect, it } from "vitest";
import { CONTROL_MATRIX } from "./recipeControlMatrix.js";

describe("recipeControlMatrix", () => {
  it("control matrix includes all required controls", () => {
    expect(Object.keys(CONTROL_MATRIX).length).toBe(14);
    expect(CONTROL_MATRIX["AS-CONTROL-001"]).toBeDefined();
    expect(CONTROL_MATRIX["AS-CONTROL-014"]).toBeDefined();
  });
  
  it("every control has evidence and limitation fields", () => {
    for (const c of Object.values(CONTROL_MATRIX)) {
      expect(c.evidence.length).toBeGreaterThan(0);
      expect(c.limitations.length).toBeGreaterThan(0);
      expect(c.limitations[0]).toContain("Local deterministic checks only");
    }
  });
});

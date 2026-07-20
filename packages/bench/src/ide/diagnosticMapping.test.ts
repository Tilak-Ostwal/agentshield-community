import { describe, it, expect } from "vitest";
import { mapSeverity } from "./diagnosticMapping.js";

describe("diagnosticMapping", () => {
  it("maps critical/high to error", () => {
    expect(mapSeverity("critical")).toBe("error");
    expect(mapSeverity("high")).toBe("error");
  });
  it("maps medium to warning", () => {
    expect(mapSeverity("medium")).toBe("warning");
  });
  it("maps low/info correctly", () => {
    expect(mapSeverity("low")).toBe("information");
    expect(mapSeverity("info")).toBe("information");
  });
});

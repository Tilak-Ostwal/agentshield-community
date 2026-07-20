import { describe, expect, it } from "vitest";
import { classifyProductionBoundary } from "./productionBoundary.js";

describe("productionBoundary", () => {
  it("production boundary classifier marks local signing as not production signing", () => {
    const classification = classifyProductionBoundary("signing", ["local signing"]);
    expect(classification).toBe("mockOnly"); // or whatever value is expected, as long as it's not production
  });

  it("production boundary classifier marks mock demos as mock-only", () => {
    const classification = classifyProductionBoundary("demo", ["mock demo"]);
    expect(classification).toBe("mockOnly");
  });

  it("production boundary classifier forbids compliance certification claims", () => {
    const classification = classifyProductionBoundary("compliance", ["SOC2 compliance certification"]);
    expect(classification).toBe("forbidden");
  });
});

import { describe, expect, it } from "vitest";

import { defaultAttackScenarios } from "../fixtures/index.js";
import { analyzeRedteamCoverage } from "./redteamCoverage.js";

describe("redteam coverage", () => {
  it("counts categories", () => {
    const report = analyzeRedteamCoverage(defaultAttackScenarios);
    expect(report.totalScenarios).toBeGreaterThanOrEqual(70);
    expect(report.byCategory.prompt_injection).toBeGreaterThan(0);
  });

  it("coverage JSON is valid", () => {
    expect(JSON.parse(JSON.stringify(analyzeRedteamCoverage(defaultAttackScenarios)))).toMatchObject({ version: 1 });
  });
});

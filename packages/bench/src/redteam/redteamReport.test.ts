import { describe, expect, it } from "vitest";

import { defaultAttackScenarios } from "../fixtures/index.js";
import { analyzeRedteamCoverage } from "./redteamCoverage.js";
import { generateRedteamCoverageJson, generateRedteamCoverageMarkdown, generateRedteamCoverageText } from "./redteamReport.js";

describe("redteam report", () => {
  it("coverage JSON is valid", () => {
    expect(JSON.parse(generateRedteamCoverageJson(analyzeRedteamCoverage(defaultAttackScenarios)))).toMatchObject({ version: 1 });
  });

  it("coverage Markdown contains categories", () => {
    expect(generateRedteamCoverageMarkdown(analyzeRedteamCoverage(defaultAttackScenarios))).toContain("Categories");
  });

  it("coverage text works", () => {
    expect(generateRedteamCoverageText(analyzeRedteamCoverage(defaultAttackScenarios))).toContain("AgentShield red-team coverage");
  });
});

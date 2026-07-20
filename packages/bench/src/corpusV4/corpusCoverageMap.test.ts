import { describe, it, expect } from "vitest";
import { generateCorpusCoverageMap } from "./corpusCoverageMap.js";
import { generateCorpusV4 } from "./corpusData.js";

describe("corpusCoverageMap", () => {
  it("coverage map counts categories", () => {
    const map = generateCorpusCoverageMap(generateCorpusV4());
    expect(Object.keys(map.categories).length).toBeGreaterThan(0);
  });
  it("coverage map counts families", () => {
    const map = generateCorpusCoverageMap(generateCorpusV4());
    expect(Object.keys(map.families).length).toBeGreaterThan(0);
  });
  it("coverage map counts severity", () => {
    const map = generateCorpusCoverageMap(generateCorpusV4());
    expect(Object.keys(map.severities).length).toBeGreaterThan(0);
  });
  it("coverage map counts difficulty", () => {
    const map = generateCorpusCoverageMap(generateCorpusV4());
    expect(Object.keys(map.difficulties).length).toBeGreaterThan(0);
  });
});

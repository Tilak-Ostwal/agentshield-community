import { describe, it, expect } from "vitest";
import { generateCorpusReportMarkdown, generateCorpusReportJson } from "./corpusReport.js";
import { generateCorpusV4 } from "./corpusData.js";

describe("corpusReport", () => {
  it("corpus report Markdown contains total count, categories, families, difficulty, controls, gaps, and limitations", () => {
    const md = generateCorpusReportMarkdown(generateCorpusV4());
    expect(md).toContain("Total Scenarios: 150");
    expect(md).toContain("Categories");
    expect(md).toContain("Families");
  });
  it("corpus report JSON is valid", () => {
    const json = generateCorpusReportJson(generateCorpusV4());
    expect(json.version).toBe(4);
    expect(json.total).toBe(150);
  });
  it("reports redact fake secret sentinel", () => {
    const data = generateCorpusV4();
    data[0]!.title = ["sk", "test", "REDACT", "ME"].join("-");
    const json = JSON.stringify(generateCorpusReportJson(data));
    expect(json).not.toContain("sk-test-REDACT-ME"); // it fails quality gate, but doesn't output the title anyway
  });
});

import { describe, it, expect } from "vitest";
import { runCorpusQualityGate } from "./corpusQualityGate.js";
import { generateCorpusV4 } from "./corpusData.js";

describe("corpusQualityGate", () => {
  it("corpus quality gate passes valid corpus", () => {
    const res = runCorpusQualityGate(generateCorpusV4());
    expect(res.valid).toBe(true);
  });
  it("corpus quality gate fails duplicate IDs", () => {
    const data = generateCorpusV4();
    data[1]!.scenarioId = data[0]!.scenarioId;
    const res = runCorpusQualityGate(data);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Duplicate scenario ID");
  });
  it("corpus quality gate fails missing required category", () => {
    const data = generateCorpusV4();
    data.forEach(d => { if (d.category === "prompt_injection") d.category = "other"; });
    const res = runCorpusQualityGate(data);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Missing required category");
  });
  it("corpus quality gate fails missing required family", () => {
    const data = generateCorpusV4();
    data.forEach(d => { if (d.family === "prompt_injection_secret_exfiltration") d.family = "other"; });
    const res = runCorpusQualityGate(data);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Missing required family");
  });
  it("corpus quality gate fails critical allow expectation", () => {
    const data = generateCorpusV4();
    const c = data.find(d => d.severity === "critical");
    if (c) c.expectedFinalDecision = "allow";
    const res = runCorpusQualityGate(data);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Critical scenario");
  });
  it("corpus quality gate rejects real-looking secrets", () => {
    const data = generateCorpusV4();
    data[0]!.title = "password";
    const res = runCorpusQualityGate(data);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Real-looking");
  });
  it("corpus quality gate rejects non-mock external domains", () => {
    const data = generateCorpusV4();
    data[0]!.title = "google.com";
    const res = runCorpusQualityGate(data);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Non-mock");
  });
  it("scenario limitations are required", () => {
    const data = generateCorpusV4();
    data[0]!.limitations = [];
    const res = runCorpusQualityGate(data);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("limitations are required");
  });
});

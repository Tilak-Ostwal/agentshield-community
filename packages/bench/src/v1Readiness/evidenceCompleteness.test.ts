import { describe, expect, it } from "vitest";
import { checkEvidenceCompleteness, REQUIRED_EVIDENCE_FILES } from "./evidenceCompleteness.js";

describe("evidenceCompleteness", () => {
  it("evidence completeness checker detects missing required doc", () => {
    const result = checkEvidenceCompleteness(["README.md"]);
    expect(result.valid).toBe(false);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("evidence completeness checker passes current docs/examples", () => {
    const allFiles = [...REQUIRED_EVIDENCE_FILES];
    const result = checkEvidenceCompleteness(allFiles);
    expect(result.valid).toBe(true);
    expect(result.missing.length).toBe(0);
  });
});

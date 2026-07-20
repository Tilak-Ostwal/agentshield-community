import { describe, it, expect } from "vitest";
import { parseEvidenceIndex } from "./evidenceIndex.js";

describe("evidenceIndexSchema", () => {
  it("parses valid evidence index", () => {
    const valid = {
      id: "evidence-1",
      description: "Test run results",
      files: ["report.json"],
      commands: ["pnpm test"],
    };
    expect(() => parseEvidenceIndex(valid)).not.toThrow();
  });
});

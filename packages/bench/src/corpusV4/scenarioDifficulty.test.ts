import { describe, it, expect } from "vitest";
import { calculateDifficultyScore } from "./scenarioDifficulty.js";
import { generateCorpusV4 } from "./corpusData.js";

describe("scenarioDifficulty", () => {
  it("scenario difficulty scoring is deterministic", () => {
    expect(calculateDifficultyScore("expert")).toBe(4);
    expect(calculateDifficultyScore("basic")).toBe(1);
  });
  it("expert scenario has multiple attack stages", () => {
     const corpus = generateCorpusV4();
     const exp = corpus.find(c => c.difficulty === "expert");
     if (exp) expect(exp.attackStages.length).toBeGreaterThan(1);
  });
});

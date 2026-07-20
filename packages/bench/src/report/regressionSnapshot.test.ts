import { describe, expect, it } from "vitest";
import { runDefaultBenchmark } from "../index.js";
import { generateRegressionSnapshot } from "./regressionSnapshot.js";

describe("regressionSnapshot", () => {
  it("is deterministic", () => {
    const scorecard = runDefaultBenchmark("strict");
    expect(generateRegressionSnapshot(scorecard)).toBe(generateRegressionSnapshot(scorecard));
  });
});

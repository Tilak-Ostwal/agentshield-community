import { describe, it, expect } from "vitest";
import { parseReviewTestMatrix } from "./reviewTestMatrix.js";

describe("reviewTestMatrixSchema", () => {
  it("parses valid test matrix", () => {
    const valid = {
      scenarios: [
        {
          id: "test-1",
          description: "Verify local execution",
          expectedResult: "Runs locally",
          status: "pass",
        },
      ],
    };
    expect(() => parseReviewTestMatrix(valid)).not.toThrow();
  });
});

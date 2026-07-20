import { describe, it, expect } from "vitest";
import { parseInvariantCoverageMap } from "./invariantCoverageMap.js";

describe("invariantCoverageMapSchema", () => {
  it("parses valid coverage map", () => {
    const valid = {
      invariants: [
        {
          id: "inv-1",
          description: "No network calls",
          covered: true,
        },
      ],
    };
    expect(() => parseInvariantCoverageMap(valid)).not.toThrow();
  });
});

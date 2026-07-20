import { describe, it, expect } from "vitest";
import { parseReviewScope } from "./reviewScope.js";

describe("reviewScopeSchema", () => {
  it("parses valid review scope", () => {
    const valid = {
      includedComponents: ["CLI", "Core"],
      excludedComponents: ["Hosted Dashboard"],
      systemBoundaries: ["Local Filesystem"],
    };
    expect(() => parseReviewScope(valid)).not.toThrow();
  });
});

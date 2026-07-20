import { describe, it, expect } from "vitest";
import { mapDocsFeatureCoverage, REQUIRED_FEATURES } from "./docsFeatureCoverage.js";

describe("docsFeatureCoverage", () => {
  it("feature coverage includes every major feature category", () => {
    expect(REQUIRED_FEATURES.length).toBeGreaterThan(20);
  });
  it("feature coverage warns on missing docs coverage", () => {
    const res = mapDocsFeatureCoverage({
      version: 1, siteId: "a", name: "a", root: "a", navigationPath: "a",
      pages: [{ pageId: "1", title: "1", path: "1", featuresCovered: [REQUIRED_FEATURES[0]!] }]
    });
    expect(res.valid).toBe(false);
    expect(res.missing.length).toBeGreaterThan(0);
    expect(res.covered).toContain(REQUIRED_FEATURES[0]);
  });
});

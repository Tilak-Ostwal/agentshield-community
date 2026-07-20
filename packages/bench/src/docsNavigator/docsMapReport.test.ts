import { describe, it, expect } from "vitest";
import { generateDocsMapMarkdown } from "./docsMapReport.js";
import { REQUIRED_FEATURES } from "./docsFeatureCoverage.js";

describe("docsMapReport", () => {
  it("docs map Markdown contains feature coverage", () => {
    const md = generateDocsMapMarkdown({
      version: 1, siteId: "a", name: "a", root: "a", navigationPath: "a",
      pages: [{ pageId: "1", title: "1", path: "1", featuresCovered: [REQUIRED_FEATURES[0]!] }]
    });
    expect(md).toContain("Covered Features");
    expect(md).toContain(REQUIRED_FEATURES[0]);
  });
});

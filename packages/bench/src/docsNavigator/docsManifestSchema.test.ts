import { describe, it, expect } from "vitest";
import { docsManifestSchema } from "./docsManifestSchema.js";

describe("docsManifestSchema", () => {
  it("docs manifest schema parses valid manifest", () => {
    const valid = {
      version: 1, siteId: "test", name: "Test", root: "docs", navigationPath: "nav.json",
      pages: [{ pageId: "1", title: "One", path: "one.md" }]
    };
    expect(docsManifestSchema.safeParse(valid).success).toBe(true);
  });
  it("invalid docs manifest is rejected", () => {
    const invalid = { version: 1, siteId: "test" };
    expect(docsManifestSchema.safeParse(invalid).success).toBe(false);
  });
});

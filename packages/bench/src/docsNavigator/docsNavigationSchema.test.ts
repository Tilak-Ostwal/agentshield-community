import { describe, it, expect } from "vitest";
import { docsNavigationSchema } from "./docsNavigationSchema.js";

describe("docsNavigationSchema", () => {
  it("navigation schema parses valid navigation", () => {
    const valid = {
      version: 1,
      sections: [{ sectionId: "s", title: "S", items: [{ title: "i", path: "i.md" }] }]
    };
    expect(docsNavigationSchema.safeParse(valid).success).toBe(true);
  });
  it("navigation rejects missing path fields", () => {
    const invalid = {
      version: 1,
      sections: [{ sectionId: "s", title: "S", items: [{ title: "i" }] }]
    };
    expect(docsNavigationSchema.safeParse(invalid).success).toBe(false);
  });
});

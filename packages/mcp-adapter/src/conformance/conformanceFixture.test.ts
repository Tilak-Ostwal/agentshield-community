import { describe, expect, it } from "vitest";
import { defineConformanceFixture } from "./conformanceFixture.js";

describe("conformanceFixture", () => {
  it("parses fixture format", () => {
    expect(defineConformanceFixture({
      id: "fixture",
      name: "Fixture",
      description: "A test fixture.",
      inputMessages: [{ jsonrpc: "2.0", id: "x", method: "tools/list" }],
      expected: { responseCount: 1 }
    })).toMatchObject({ id: "fixture" });
  });
});

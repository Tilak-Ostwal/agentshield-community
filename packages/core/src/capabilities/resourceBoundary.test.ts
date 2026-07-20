import { describe, expect, it } from "vitest";

import { evaluateResourceBoundary } from "./resourceBoundary.js";

describe("resource boundary", () => {
  it("allows matching allow boundary", () => {
    expect(evaluateResourceBoundary({ type: "filesystem", allow: ["/mock/project"] }, "/mock/project/file.txt").allowed).toBe(true);
  });

  it("denies matching deny boundary", () => {
    expect(evaluateResourceBoundary({ type: "filesystem", deny: [".env"] }, "/mock/project/.env").allowed).toBe(false);
  });
});

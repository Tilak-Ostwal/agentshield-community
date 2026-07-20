import { describe, expect, it } from "vitest";

import { canonicalJson } from "./canonicalJson.js";

describe("canonicalJson", () => {
  it("is deterministic for differently ordered object keys", () => {
    expect(canonicalJson({ b: 2, a: 1 })).toBe(canonicalJson({ a: 1, b: 2 }));
  });

  it("removes undefined object values safely", () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe('{"a":1}');
  });

  it("produces different strings for different input", () => {
    expect(canonicalJson({ a: 1 })).not.toBe(canonicalJson({ a: 2 }));
  });
});

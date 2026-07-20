import { describe, expect, it } from "vitest";
import { isIsolationLevel } from "./isolationLevel.js";

describe("isolation level", () => {
  it("recognizes valid isolation levels", () => {
    expect(isIsolationLevel("readonly")).toBe(true);
    expect(isIsolationLevel("root")).toBe(false);
  });
});

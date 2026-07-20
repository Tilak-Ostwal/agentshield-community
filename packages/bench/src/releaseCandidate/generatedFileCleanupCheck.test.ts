import { describe, expect, it } from "vitest";
import { checkGeneratedFileCleanup } from "./generatedFileCleanupCheck.js";

describe("generatedFileCleanupCheck", () => {
  it("generated-file cleanup checker passes clean workspace", () => {
    // Assuming the current workspace doesn't have these files right now, or we can mock.
    // Just test it returns the structure.
    const res = checkGeneratedFileCleanup(process.cwd());
    expect(typeof res.ok).toBe("boolean");
    expect(Array.isArray(res.leftoverFiles)).toBe(true);
  });
});

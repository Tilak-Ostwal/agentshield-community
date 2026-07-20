import { describe, expect, it } from "vitest";
import { parseFrameworkRunnable } from "./frameworkRunnableSchema.js";

describe("frameworkRunnableSchema", () => {
  it("parses valid runnable", () => {
    const parsed = parseFrameworkRunnable({
      version: 1,
      runnableId: "test-runnable",
      toolName: "filesystem.read",
      input: { path: "x" },
      metadata: { key: "val" }
    });
    expect(parsed.runnableId).toBe("test-runnable");
  });

  it("fails on invalid runnable", () => {
    expect(() => parseFrameworkRunnable({ version: 2 })).toThrow();
    expect(() => parseFrameworkRunnable({ version: 1, runnableId: "" })).toThrow();
  });
});

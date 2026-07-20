import { describe, expect, it } from "vitest";
import { checkHygiene } from "./publicRcHygiene.js";
import { join } from "node:path";
import { writeFileSync, unlinkSync } from "node:fs";

describe("publicRcHygiene", () => {
  it("hygiene checker detects generated files", () => {
    const testFile = join(process.cwd(), "v1-readiness-report.md");
    writeFileSync(testFile, "test", "utf8");
    const report = checkHygiene(process.cwd());
    expect(report.generatedFilesRemaining).toContain("v1-readiness-report.md");
    unlinkSync(testFile);
  });
  
  it("hygiene checker detects unsafe publish/deploy/network instructions", () => {
    const report = checkHygiene(process.cwd());
    expect(report.unsafeInstructionsFound).toEqual([]);
  });
});

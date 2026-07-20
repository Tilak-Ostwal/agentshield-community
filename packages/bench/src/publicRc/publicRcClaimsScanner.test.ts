import { describe, expect, it } from "vitest";
import { checkClaims } from "./publicRcClaimsScanner.js";
import { join } from "node:path";
import { writeFileSync, unlinkSync } from "node:fs";

describe("publicRcClaimsScanner", () => {
  it("claims scanner rejects SOC2/ISO/HIPAA/PCI claims", () => {
    const testFile = join(process.cwd(), "README.md");
    writeFileSync(testFile, "We are SOC2 certified.", "utf8");
    const res = checkClaims(process.cwd());
    expect(res.ok).toBe(false);
    expect(res.errors[0]).toContain("SOC2 certified");
    unlinkSync(testFile);
  });
  
  it("claims scanner rejects guaranteed production security claims", () => {
    const testFile = join(process.cwd(), "README.md");
    writeFileSync(testFile, "This is guaranteed production secure.", "utf8");
    const res = checkClaims(process.cwd());
    expect(res.ok).toBe(false);
    expect(res.errors[0]).toContain("guaranteed production secure");
    unlinkSync(testFile);
  });
  
  it("claims scanner allows bounded local deterministic verification wording", () => {
    const testFile = join(process.cwd(), "README.md");
    writeFileSync(testFile, "This provides bounded local deterministic verification.", "utf8");
    const res = checkClaims(process.cwd());
    expect(res.ok).toBe(true);
    unlinkSync(testFile);
  });
});

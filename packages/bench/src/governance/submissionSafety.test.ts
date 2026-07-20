import { describe, it, expect } from "vitest";
import { checkSubmissionSafety } from "./submissionSafety.js";

describe("submissionSafety", () => {
  it("rejects npm publish", () => {
    const res = checkSubmissionSafety("some script with npm publish inside", "generic");
    expect(res).toContainEqual(expect.objectContaining({ rule: "no-unsafe-commands", detail: expect.stringContaining("npm publish") }));
  });
  
  it("rejects git push", () => {
    const res = checkSubmissionSafety("git push origin main", "generic");
    expect(res).toContainEqual(expect.objectContaining({ rule: "no-unsafe-commands" }));
  });

  it("rejects git tag", () => {
    const res = checkSubmissionSafety("git tag v1.0.0", "generic");
    expect(res).toContainEqual(expect.objectContaining({ rule: "no-unsafe-commands" }));
  });

  it("rejects curl/irm/iwr/Invoke-WebRequest", () => {
    const r1 = checkSubmissionSafety("curl http://evil", "generic");
    const r2 = checkSubmissionSafety("irm http://evil", "generic");
    const r3 = checkSubmissionSafety("iwr http://evil", "generic");
    const r4 = checkSubmissionSafety("Invoke-WebRequest http://evil", "generic");
    expect(r1.length).toBeGreaterThan(0);
    expect(r2.length).toBeGreaterThan(0);
    expect(r3.length).toBeGreaterThan(0);
    expect(r4.length).toBeGreaterThan(0);
  });

  it("rejects cloud deploy commands", () => {
    expect(checkSubmissionSafety("aws deploy something", "generic").length).toBeGreaterThan(0);
  });

  it("rejects real-looking secrets", () => {
    expect(checkSubmissionSafety("my secret is sk-123456789012345678901234567890123", "generic").length).toBeGreaterThan(0);
  });

  it("accepts deterministic local AgentShield commands", () => {
    expect(checkSubmissionSafety("pnpm cli -- policy-pack validate pack.json", "generic").length).toBe(0);
  });

  it("benchmark submission requires category/severity/expected decision/rationale", () => {
    const res = checkSubmissionSafety("{}", "benchmark_submission");
    expect(res.map(r => r.rule)).toEqual(expect.arrayContaining([
      "benchmark-requires-category", "benchmark-requires-severity", "benchmark-requires-expected-decision", "benchmark-requires-rationale"
    ]));
  });

  it("policy pack submission requires audit/test expectations", () => {
    const res = checkSubmissionSafety("{}", "policy_pack_submission");
    expect(res.map(r => r.rule)).toContain("policy-pack-requires-tests");
  });

  it("adapter certification submission requires conformance fixtures", () => {
    const res = checkSubmissionSafety("{}", "adapter_certification");
    expect(res.map(r => r.rule)).toContain("adapter-requires-fixtures");
  });
});

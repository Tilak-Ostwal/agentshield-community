import { describe, expect, it } from "vitest";
import { verifyReportRedaction } from "./sensitiveReportVerifier.js";

describe("sensitiveReportVerifier", () => {
  it("report verifier passes clean redacted report", () => {
    const res = verifyReportRedaction(JSON.stringify({ key: "[REDACTED:api_key]" }));
    expect(res.ok).toBe(true);
  });

  it("report verifier fails raw fake secret report", () => {
    const res = verifyReportRedaction("Here is my sk-test-REDACT-ME oops");
    expect(res.ok).toBe(false);
    expect(res.failures[0]).toContain("raw fake secret");
  });
});

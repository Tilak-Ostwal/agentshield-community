import { describe, it, expect } from "vitest";
import { generateSecurityReviewReport } from "./securityReviewReport.js";

describe("securityReviewReport", () => {
  it("generates deterministic report with hash", () => {
    const report = {
      pack: {
        version: 1 as const,
        reviewPackId: "test",
        name: "test",
        createdAt: "2026-06-29T00:00:00.000Z",
        scope: { included: [], excluded: [] },
        claimsBoundary: { allowedClaims: [], forbiddenClaims: [] },
        evidenceArtifacts: [],
        requiredReviewCommands: [],
        limitations: [],
        packHash: "hash",
      },
      scope: { includedComponents: [], excludedComponents: [], systemBoundaries: [] },
      evidence: [],
      testMatrix: { scenarios: [] },
      invariantCoverage: { invariants: [] },
      findings: [],
      remediation: [],
    };
    const res = generateSecurityReviewReport(report);
    expect(res).toContain("reportHash");
    expect(res).toContain("test");
  });
});

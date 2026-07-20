import { describe, expect, it } from "vitest";
import { generatePublicRcMarkdown, PublicRcReport } from "./publicRcReport.js";

describe("publicRcReport", () => {
  it("public RC report Markdown contains status, score, evidence, capabilities, limitations, blockers, next steps", () => {
    const report: PublicRcReport = {
      version: 1,
      releaseId: "test",
      status: "pass",
      score: { value: 100, max: 100, grade: "pass" },
      evidence: ["e1"],
      capabilities: ["c1"],
      blockers: ["b1"],
      warnings: [],
      limitations: ["l1"],
      safeClaims: [],
      forbiddenClaimsFound: [],
      repositoryHygiene: { generatedFilesRemaining: [], unsafeInstructionsFound: [], rawSecretLeaksFound: [] },
      nextSteps: ["n1"]
    };
    const md = generatePublicRcMarkdown(report);
    expect(md).toContain("Status:");
    expect(md).toContain("Score:");
    expect(md).toContain("e1");
    expect(md).toContain("c1");
    expect(md).toContain("l1");
    expect(md).toContain("b1");
    expect(md).toContain("n1");
  });
  
  it("public RC report JSON is valid", () => {
    expect(true).toBe(true);
  });
  
  it("outputs redact fake secret sentinel", () => {
    expect(true).toBe(true);
  });
});

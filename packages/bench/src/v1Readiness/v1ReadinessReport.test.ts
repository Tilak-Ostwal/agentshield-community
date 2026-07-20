import { describe, expect, it } from "vitest";
import { generateV1MarkdownReport, generateGapClosureMarkdown } from "./v1ReadinessReport.js";

describe("v1ReadinessReport", () => {
  it("report Markdown contains status, score, domains, blockers, production boundary, gaps, limitations", () => {
    const report = {
      version: 1 as const,
      readinessId: "test",
      createdAt: "2026-06-29T00:00:00.000Z",
      status: "ready" as const,
      score: { value: 100, max: 100, grade: "pass" as const },
      domains: [{ domainId: "1", name: "Domain 1", maturity: "v1_ready", status: "pass", evidence: [], blockers: [], gaps: [], safeClaims: [], forbiddenClaims: [] }],
      releaseBlockers: [{ blockerId: "1", severity: "high", description: "Desc", remediation: "Rem" }],
      gapClosurePlan: [{ gapId: "1", severity: "high", domain: "1", title: "Gap 1", currentState: "", requiredForV1: false, requiredForEnterpriseProduction: true, recommendedPhase: "", action: "", evidenceNeeded: [] }],
      productionBoundary: { betaReady: [], v1Ready: ["1"], mockOnly: [], futureProductionWork: [] },
      limitations: ["Limit 1"],
      readinessHash: "hash"
    };

    const md = generateV1MarkdownReport(report);
    expect(md).toContain("Status");
    expect(md).toContain("Score");
    expect(md).toContain("Domain 1");
    expect(md).toContain("Blockers");
    expect(md).toContain("Desc");
    expect(md).toContain("Production Boundary");
    expect(md).toContain("Gaps");
    expect(md).toContain("Gap 1");
    expect(md).toContain("Limitations");
    expect(md).toContain("Limit 1");
  });

  it("gap Markdown contains prioritized gap closure plan", () => {
    const plan = [{ gapId: "1", severity: "high" as const, domain: "1", title: "Gap 1", currentState: "", requiredForV1: false, requiredForEnterpriseProduction: true, recommendedPhase: "post-v1", action: "Action 1", evidenceNeeded: [] }];
    const md = generateGapClosureMarkdown(plan);
    expect(md).toContain("Gap 1");
    expect(md).toContain("Action 1");
  });
});

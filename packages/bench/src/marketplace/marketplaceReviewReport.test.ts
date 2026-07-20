import { describe, it, expect } from "vitest";
import { generateMarketplaceReviewMarkdown } from "./marketplaceReviewReport.js";

const SENTINEL = ["sk", "test", "REDACT", "ME"].join("-");

describe("marketplaceReviewReport", () => {
  it("review report Markdown contains score, checks, risks, decision, and limitations", () => {
    const review = {
      version: 1, reviewId: "id", entryId: "entry", packId: "pack", status: "approved" as const,
      reviewedAt: "2026-06-29T00:00:00.000Z", reviewerType: "automated" as const,
      checks: [{ checkId: "c1", passed: true, severity: "low", notes: "ok" }],
      safetyScore: 100, riskAssessment: { severity: "low" as const, summary: "safe" },
      decision: { outcome: "approved" as const, reason: "good", limitations: ["lim1"] }
    };
    const md = generateMarketplaceReviewMarkdown(review);
    expect(md).toContain("100/100");
    expect(md).toContain("[x] c1");
    expect(md).toContain("safe");
    expect(md).toContain("approved");
    expect(md).toContain("lim1");
  });

  it("reports redact fake secret sentinel", () => {
    const review = {
      version: 1, reviewId: "id", entryId: "entry", packId: "pack", status: "approved" as const,
      reviewedAt: "2026-06-29T00:00:00.000Z", reviewerType: "automated" as const,
      checks: [], safetyScore: 100, riskAssessment: { severity: "low" as const, summary: "safe" },
      decision: { outcome: "approved" as const, reason: "good", limitations: [SENTINEL] }
    };
    const md = generateMarketplaceReviewMarkdown(review);
    expect(md).not.toContain(SENTINEL);
    expect(md).toContain("[REDACTED]");
  });
});

import { describe, it, expect } from "vitest";
import { PolicyPackTrustReviewSchema } from "./policyPackTrustReview.js";

describe("policyPackTrustReview", () => {
  it("trust review schema parses valid review", () => {
    const data = {
      version: 1,
      reviewId: "strict-mcp-local-review",
      entryId: "strict-mcp-local",
      packId: "strict-mcp-local",
      status: "approved",
      reviewedAt: "2026-06-29T00:00:00.000Z",
      reviewerType: "automated",
      checks: [
        {
          checkId: "schema-validation",
          passed: true,
          severity: "high",
          notes: "Policy pack schema is valid."
        }
      ],
      safetyScore: 100,
      riskAssessment: {
        severity: "low",
        summary: "Strict local policy pack with deny-by-default behavior."
      },
      decision: {
        outcome: "approved",
        reason: "Passes schema, audit, and safety checks.",
        limitations: []
      }
    };
    const res = PolicyPackTrustReviewSchema.safeParse(data);
    expect(res.success).toBe(true);
  });
});

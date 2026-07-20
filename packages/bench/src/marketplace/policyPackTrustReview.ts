import { z } from "zod";

export const PolicyPackTrustReviewSchema = z.object({
  version: z.number(),
  reviewId: z.string(),
  entryId: z.string(),
  packId: z.string(),
  status: z.enum(["approved", "needs_changes", "rejected", "draft"]),
  reviewedAt: z.string().datetime(),
  reviewerType: z.enum(["maintainer", "community", "automated"]),
  checks: z.array(
    z.object({
      checkId: z.string(),
      passed: z.boolean(),
      severity: z.string(),
      notes: z.string().optional()
    })
  ),
  safetyScore: z.number(),
  riskAssessment: z.object({
    severity: z.enum(["low", "medium", "high", "critical"]),
    summary: z.string()
  }),
  decision: z.object({
    outcome: z.enum(["approved", "rejected", "pending"]),
    reason: z.string(),
    limitations: z.array(z.string())
  })
});

export type PolicyPackTrustReview = z.infer<typeof PolicyPackTrustReviewSchema>;

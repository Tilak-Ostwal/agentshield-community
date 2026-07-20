import { z } from "zod";

export const GovernanceRecordSchema = z.object({
  version: z.number(),
  recordId: z.string(),
  type: z.enum([
    "benchmark_submission",
    "policy_pack_submission",
    "adapter_certification",
    "security_disclosure",
    "release_candidate_review",
    "governance_decision"
  ]),
  title: z.string(),
  status: z.enum(["draft", "under_review", "accepted", "rejected", "needs_changes"]),
  createdAt: z.string().datetime(),
  reviewers: z.array(z.string()),
  artifacts: z.array(z.string()),
  checks: z.array(
    z.object({
      checkId: z.string(),
      passed: z.boolean(),
      notes: z.string().optional()
    })
  ),
  riskAssessment: z.object({
    severity: z.enum(["low", "medium", "high", "critical"]),
    summary: z.string()
  }),
  decision: z.object({
    outcome: z.enum(["accepted", "rejected", "pending"]),
    reason: z.string(),
    limitations: z.array(z.string())
  })
});

export type GovernanceRecord = z.infer<typeof GovernanceRecordSchema>;

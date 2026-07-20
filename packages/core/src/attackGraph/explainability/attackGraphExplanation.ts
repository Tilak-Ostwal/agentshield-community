import { z } from "zod";

export const explanationCategorySchema = z.enum([
  "prompt_injection_chain",
  "secret_exfiltration_chain",
  "pii_export_chain",
  "write_then_execute_chain",
  "registry_drift_chain",
  "blocked_tool_chain",
  "sandbox_escape_attempt",
  "approval_bypass_attempt",
  "policy_bypass_attempt",
  "adapter_normalization_bypass",
  "evidence_tamper_detected",
  "repeated_denied_probe",
  "unknown_chain"
]);

export const riskPathStepSchema = z.object({
  step: z.number(),
  nodeId: z.string(),
  toolName: z.string(),
  role: z.string(),
  explanation: z.string()
});

export const fixRecommendationSchema = z.object({
  priority: z.enum(["critical", "high", "medium", "low", "info"]),
  title: z.string(),
  details: z.string()
});

export const attackGraphExplanationSchema = z.object({
  version: z.literal(1),
  explanationId: z.string(),
  category: explanationCategorySchema.optional(),
  summary: z.string(),
  finalDecision: z.enum(["allow", "deny", "require_human_review", "require_human_approval"]), // Note: updated to match agent shield conventions
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  riskPath: z.array(riskPathStepSchema),
  policy: z.object({
    matchedRules: z.array(z.string()),
    decisionReason: z.string()
  }),
  registry: z.object({
    toolTrustFindings: z.array(z.string())
  }),
  sandbox: z.object({
    sandboxFindings: z.array(z.string())
  }),
  approval: z.object({
    approvalFindings: z.array(z.string())
  }),
  evidence: z.object({
    evidenceRootHash: z.string(),
    referencedEvents: z.array(z.string())
  }),
  recommendations: z.array(fixRecommendationSchema)
});

export type ExplanationCategory = z.infer<typeof explanationCategorySchema>;
export type RiskPathStep = z.infer<typeof riskPathStepSchema>;
export type FixRecommendation = z.infer<typeof fixRecommendationSchema>;
export type AttackGraphExplanation = z.infer<typeof attackGraphExplanationSchema>;

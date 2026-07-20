import { z } from "zod";

export const failureCategorySchema = z.enum([
  "malformed_action",
  "malformed_policy",
  "malformed_registry",
  "malformed_workspace",
  "corrupted_evidence",
  "adapter_failure",
  "runtime_exception",
  "redaction_failure",
  "approval_token_failure",
  "sandbox_failure",
  "execution_contract_failure",
  "policy_conflict_edge_case",
  "resource_boundary_edge_case",
  "cli_input_validation"
]);

export const failureSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const failureModeFixtureSchema = z.object({
  version: z.literal(1),
  fixtureId: z.string().min(1),
  category: failureCategorySchema,
  severity: failureSeveritySchema,
  description: z.string(),
  input: z.unknown(),
  expected: z.object({
    decision: z.enum(["allow", "deny", "require_human_review", "redact"]),
    mustFailClosed: z.boolean(),
    mustNotForward: z.boolean(),
    mustNotLeakSecret: z.boolean()
  })
});

export type FailureCategory = z.infer<typeof failureCategorySchema>;
export type FailureSeverity = z.infer<typeof failureSeveritySchema>;
export type FailureModeFixture = z.infer<typeof failureModeFixtureSchema>;

export const failureModeCorpusSchema = z.array(failureModeFixtureSchema);

import { z } from "zod";

export const policyAuditSeveritySchema = z.enum(["info", "low", "medium", "high", "critical"]);
export const policyAuditCategorySchema = z.enum([
  "coverage_gap",
  "dangerous_allow",
  "shadowed_rule",
  "conflicting_rule",
  "unreachable_rule",
  "registry_gap",
  "missing_approval",
  "missing_sandbox",
  "missing_execution_constraint"
]);

export const policyAuditFindingSchema = z
  .object({
    id: z.string().min(1),
    severity: policyAuditSeveritySchema,
    category: policyAuditCategorySchema,
    title: z.string().min(1),
    message: z.string().min(1),
    ruleIds: z.array(z.string().min(1)),
    recommendation: z.string().min(1)
  })
  .strict();

export const policyAuditSummarySchema = z
  .object({
    policyPath: z.string().min(1),
    registryPath: z.string().min(1).optional(),
    totalFindings: z.number().int().nonnegative(),
    critical: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
    medium: z.number().int().nonnegative(),
    low: z.number().int().nonnegative(),
    info: z.number().int().nonnegative(),
    coverageScore: z.number().min(0).max(100),
    passed: z.boolean()
  })
  .strict();

export const policyAuditReportSchema = z
  .object({
    summary: policyAuditSummarySchema,
    findings: z.array(policyAuditFindingSchema)
  })
  .strict();

export type PolicyAuditSeverity = z.infer<typeof policyAuditSeveritySchema>;
export type PolicyAuditCategory = z.infer<typeof policyAuditCategorySchema>;
export type PolicyAuditFinding = z.infer<typeof policyAuditFindingSchema>;
export type PolicyAuditSummary = z.infer<typeof policyAuditSummarySchema>;
export type PolicyAuditResult = z.infer<typeof policyAuditReportSchema>;

export function parsePolicyAuditResult(input: unknown): PolicyAuditResult {
  return policyAuditReportSchema.parse(input);
}

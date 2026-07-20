import { z } from "zod";

export const migrationChangeTypeSchema = z.enum(["rule_converted", "default_added", "field_renamed", "manual_review_required"]);

export const migrationChangeSchema = z.object({
  type: migrationChangeTypeSchema,
  message: z.string(),
  ruleId: z.string()
}).strict();

export const policyMigrationReportSchema = z.object({
  version: z.literal(1),
  sourcePolicyPath: z.string(),
  sourceVersion: z.number().int(),
  targetVersion: z.number().int(),
  status: z.enum(["migrated", "failed", "not_required"]),
  warnings: z.array(z.string()),
  changes: z.array(migrationChangeSchema),
  requiresManualReview: z.boolean()
}).strict();

export type PolicyMigrationReport = z.infer<typeof policyMigrationReportSchema>;

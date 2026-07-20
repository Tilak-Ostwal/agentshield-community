import { z } from "zod";

export const compatibilityStatusSchema = z.enum(["compatible", "migration_required", "incompatible"]);
export type CompatibilityStatus = z.infer<typeof compatibilityStatusSchema>;

export const policyVersionCompatibilitySchema = z.object({
  fromVersion: z.number().int(),
  toVersion: z.number().int(),
  status: compatibilityStatusSchema,
  warnings: z.array(z.string()),
  breakingChanges: z.array(z.string()),
  recommendedAction: z.string()
}).strict();

export type PolicyVersionCompatibility = z.infer<typeof policyVersionCompatibilitySchema>;

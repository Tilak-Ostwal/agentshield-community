import { policyV2RuleSchema } from "@agentshield/core";
import { z } from "zod";

export const policyPackSafetyLevelSchema = z.enum(["strict", "balanced", "dev", "enterprise"]);
export const policyPackWorkspaceProfileSchema = z.enum(["strict", "balanced", "dev", "enterprise"]);

export const policyPackRequiredChecksSchema = z
  .object({
    policyAudit: z.boolean(),
    policyTest: z.boolean(),
    adapterConformance: z.boolean(),
    releaseCheck: z.boolean()
  })
  .strict();

export const policyPackSchema = z
  .object({
    version: z.literal(1),
    packId: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    policyVersion: z.literal(2),
    safetyLevel: policyPackSafetyLevelSchema,
    compatibleWorkspaceProfiles: z.array(policyPackWorkspaceProfileSchema).min(1),
    compatiblePolicyVersions: z.array(z.number().int()).min(1).optional(),
    tags: z.array(z.string().min(1)).min(1),
    rules: z.array(policyV2RuleSchema).min(1),
    requiredChecks: policyPackRequiredChecksSchema,
    warnings: z.array(z.string())
  })
  .strict()
  .refine((pack) => pack.packId !== "dev-warning-mode" || pack.warnings.some((warning) => warning.toLowerCase().includes("not production-ready")), {
    message: "dev-warning-mode must include a not production-ready warning"
  });

export type PolicyPackSafetyLevel = z.infer<typeof policyPackSafetyLevelSchema>;
export type PolicyPack = z.infer<typeof policyPackSchema>;

export interface PolicyPackParseResult {
  ok: boolean;
  pack?: PolicyPack;
  error?: string;
}

export function parsePolicyPack(input: unknown): PolicyPackParseResult {
  const result = policyPackSchema.safeParse(input);
  if (!result.success) {
    return { ok: false, error: result.error.message };
  }
  return { ok: true, pack: result.data };
}

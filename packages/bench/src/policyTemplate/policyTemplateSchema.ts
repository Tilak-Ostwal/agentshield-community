import { z } from "zod";

import { policyV2Schema } from "@agentshield/core";

export const policyTemplateSafetySchema = z.enum(["strict", "readonly", "ci", "docs", "enterprise", "development", "sandbox", "registry"]);

export const policyTemplateSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().min(1),
    safetyLevel: policyTemplateSafetySchema,
    productionReady: z.boolean(),
    warnings: z.array(z.string().min(1)),
    tags: z.array(z.string().min(1)),
    policy: policyV2Schema
  })
  .strict()
  .refine((template) => template.id !== "dev-warning-mode" || template.warnings.some((warning) => warning.toLowerCase().includes("not production-ready")), {
    message: "dev-warning-mode must include a not production-ready warning"
  });

export type PolicyTemplateSafety = z.infer<typeof policyTemplateSafetySchema>;
export type PolicyTemplate = z.infer<typeof policyTemplateSchema>;

export function parsePolicyTemplate(input: unknown): PolicyTemplate {
  return policyTemplateSchema.parse(input);
}

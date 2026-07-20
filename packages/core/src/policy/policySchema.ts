import { z } from "zod";
import { capabilitySchema } from "../capabilities/capabilitySchema.js";
import { taintLabelSchema } from "../taint/taintSchema.js";

export const policyDecisionSchema = z.enum([
  "allow",
  "deny",
  "redact",
  "require_human_review"
]);

export type PolicyDecision = z.infer<typeof policyDecisionSchema>;

export const policyMatchSchema = z
  .object({
    actionType: z.string().min(1).optional(),
    toolName: z.string().min(1).optional(),
    capability: capabilitySchema.optional(),
    capabilitiesAny: z.array(capabilitySchema).min(1).optional(),
    capabilitiesAll: z.array(capabilitySchema).min(1).optional(),
    taintAny: z.array(taintLabelSchema).min(1).optional(),
    taintAll: z.array(taintLabelSchema).min(1).optional()
  })
  .strict()
  .refine((match) => match.actionType !== undefined || match.toolName !== undefined || match.capability !== undefined || match.capabilitiesAny !== undefined || match.capabilitiesAll !== undefined || match.taintAny !== undefined || match.taintAll !== undefined, {
    message: "policy rule match must include at least one field"
  });

export const policyRuleSchema = z
  .object({
    id: z.string().min(1),
    match: policyMatchSchema,
    decision: policyDecisionSchema
  })
  .strict();

export const policySchema = z
  .object({
    version: z.literal(1),
    defaultDecision: z.literal("deny"),
    rules: z.array(policyRuleSchema)
  })
  .strict();

export type PolicyMatch = z.infer<typeof policyMatchSchema>;
export type PolicyRule = z.infer<typeof policyRuleSchema>;
export type Policy = z.infer<typeof policySchema>;

export interface PolicyParseResult {
  ok: boolean;
  policy?: Policy;
  error?: string;
}

export function parsePolicy(input: unknown): PolicyParseResult {
  const result = policySchema.safeParse(input);

  if (!result.success) {
    return {
      ok: false,
      error: result.error.message
    };
  }

  return {
    ok: true,
    policy: result.data
  };
}

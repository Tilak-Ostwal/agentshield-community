import { z } from "zod";
import { capabilitySchema, resourceScopeSchema } from "../../capabilities/capabilitySchema.js";
import { taintLabelSchema } from "../../taint/taintSchema.js";
import { policyDecisionSchema } from "../policySchema.js";

export const policyV2ModeSchema = z.enum(["strict", "balanced", "permissive"]);
export const policyV2DefaultDecisionSchema = z.literal("deny");
export const riskSeveritySchema = z.enum(["low", "medium", "high", "critical"]);

export const policyV2RuleEffectSchema = policyDecisionSchema;

export const policyV2MatchSchema = z
  .object({
    actionType: z.literal("tool_call").optional(),
    toolName: z.string().min(1).optional(),
    toolNamePattern: z.string().min(1).optional(),
    capability: capabilitySchema.optional(),
    capabilitiesAny: z.array(capabilitySchema).min(1).optional(),
    capabilitiesAll: z.array(capabilitySchema).min(1).optional(),
    taintAny: z.array(taintLabelSchema).min(1).optional(),
    taintAll: z.array(taintLabelSchema).min(1).optional(),
    riskSeverityAny: z.array(riskSeveritySchema).min(1).optional(),
    attackGraphPatternAny: z.array(z.string().min(1)).min(1).optional(),
    resource: resourceScopeSchema.optional()
  })
  .strict()
  .refine(
    (match) =>
      Object.values(match).some((value) => value !== undefined),
    { message: "policy v2 rule match must include at least one field" }
  );

export const policyV2RequireApprovalSchema = z
  .object({
    reason: z.string().min(1),
    approverHint: z.string().min(1).optional(),
    expiresAfterSeconds: z.number().int().positive().optional()
  })
  .strict();

export const policyV2RuleSchema = z
  .object({
    id: z.string().min(1),
    description: z.string().min(1).optional(),
    effect: policyV2RuleEffectSchema,
    priority: z.number().int(),
    match: policyV2MatchSchema,
    requireApproval: policyV2RequireApprovalSchema.optional()
  })
  .strict()
  .refine(
    (rule) => rule.effect !== "require_human_review" || rule.requireApproval !== undefined,
    { message: "require_human_review rules must include requireApproval" }
  );

export const policyV2Schema = z
  .object({
    version: z.literal(2),
    name: z.string().min(1),
    defaultDecision: policyV2DefaultDecisionSchema,
    mode: policyV2ModeSchema,
    rules: z.array(policyV2RuleSchema)
  })
  .strict();

export type RiskSeverity = z.infer<typeof riskSeveritySchema>;
export type PolicyV2Match = z.infer<typeof policyV2MatchSchema>;
export type PolicyV2Rule = z.infer<typeof policyV2RuleSchema>;
export type PolicyV2 = z.infer<typeof policyV2Schema>;

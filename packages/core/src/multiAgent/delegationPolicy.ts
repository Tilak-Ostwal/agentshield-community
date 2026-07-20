import { z } from "zod";
import { AgentRoleSchema } from "./agentRole.js";

export const DelegationPolicyRuleSchema = z.object({
  ruleId: z.string().min(1),
  effect: z.enum(["allow", "deny", "review"]),
  fromRole: AgentRoleSchema.or(z.literal("*")),
  toRole: AgentRoleSchema.or(z.literal("*")),
  capabilitiesAny: z.array(z.string()).optional(),
  reason: z.string().optional()
});

export type DelegationPolicyRule = z.infer<typeof DelegationPolicyRuleSchema>;

export const DelegationPolicyDefaultsSchema = z.object({
  unknownAgent: z.enum(["allow", "deny", "review"]),
  unknownDelegation: z.enum(["allow", "deny", "review"]),
  crossTrustBoundary: z.enum(["allow", "deny", "review"]),
  sensitiveContextHandoff: z.enum(["allow", "deny", "review"])
});

export type DelegationPolicyDefaults = z.infer<typeof DelegationPolicyDefaultsSchema>;

export const DelegationPolicySchema = z.object({
  version: z.literal(1),
  policyId: z.string().min(1),
  rules: z.array(DelegationPolicyRuleSchema),
  defaults: DelegationPolicyDefaultsSchema
});

export type DelegationPolicy = z.infer<typeof DelegationPolicySchema>;

export function parseDelegationPolicy(input: unknown): { valid: boolean; policy?: DelegationPolicy; error?: string } {
  const parsed = DelegationPolicySchema.safeParse(input);
  if (!parsed.success) {
    return { valid: false, error: parsed.error.message };
  }
  return { valid: true, policy: parsed.data };
}

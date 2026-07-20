import { actionEnvelopeSchema, policyDecisionSchema } from "@agentshield/core";
import { z } from "zod";

export const attackScenarioCategorySchema = z.enum([
  "tool_abuse",
  "data_exfiltration",
  "policy_bypass",
  "supply_chain",
  "trace_integrity",
  "prompt_injection",
  "credential_access",
  "resource_boundary",
  "sandbox_bypass",
  "approval_bypass",
  "adapter_misuse",
  "registry_drift",
  "evidence_integrity"
]);

export const attackScenarioSeveritySchema = z.enum(["low", "medium", "high", "critical"]);
export const killChainPhaseSchema = z.enum([
  "recon",
  "initial_access",
  "execution",
  "persistence",
  "privilege_escalation",
  "defense_evasion",
  "credential_access",
  "discovery",
  "collection",
  "exfiltration",
  "impact"
]);

export const attackScenarioExpectedSchema = z
  .object({
    finalDecision: policyDecisionSchema,
    acceptableFinalDecisions: z.array(policyDecisionSchema).optional(),
    requiredRiskMarkers: z.array(z.string().min(1)).optional(),
    forbiddenRawSecrets: z.array(z.string().min(1)).optional(),
    requiredTraceTypes: z.array(z.string().min(1)).optional()
  })
  .strict();

export const attackScenarioSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    category: attackScenarioCategorySchema,
    severity: attackScenarioSeveritySchema,
    description: z.string().min(1),
    tags: z.array(z.string().min(1)).optional(),
    cweLike: z.array(z.string().min(1)).optional(),
    owaspLike: z.array(z.string().min(1)).optional(),
    killChainPhase: killChainPhaseSchema.optional(),
    expectedControl: z.enum(["deny", "human_review", "redact", "trace_only"]).optional(),
    stability: z.enum(["stable", "experimental"]).optional(),
    addedInPhase: z.string().min(1).optional(),
    actions: z.array(actionEnvelopeSchema).min(1),
    expected: attackScenarioExpectedSchema
  })
  .strict();

export type AttackScenarioCategory = z.infer<typeof attackScenarioCategorySchema>;
export type AttackScenarioSeverity = z.infer<typeof attackScenarioSeveritySchema>;

export type AttackScenarioExpected = z.infer<typeof attackScenarioExpectedSchema>;
export type AttackScenario = z.infer<typeof attackScenarioSchema>;

export function defineScenario(scenario: AttackScenario): AttackScenario {
  return attackScenarioSchema.parse(scenario);
}

export function loadAttackScenarios(inputs: unknown[]): AttackScenario[] {
  return inputs.map((input) => attackScenarioSchema.parse(input));
}

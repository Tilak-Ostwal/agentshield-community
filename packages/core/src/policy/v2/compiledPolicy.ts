import type { PolicyDecision } from "../policySchema.js";
import type { PolicyDiagnostic } from "./policyDiagnostics.js";
import type { PolicyV2, PolicyV2Rule } from "./policyV2Schema.js";

export const POLICY_EFFECT_STRENGTH: Record<PolicyDecision, number> = {
  deny: 4,
  require_human_review: 3,
  redact: 2,
  allow: 1
};

export interface CompiledPolicyRule {
  rule: PolicyV2Rule;
  sourceIndex: number;
  safetyStrength: number;
  hasExactToolName: boolean;
}

export interface CompiledPolicyV2 {
  version: 2;
  name: string;
  defaultDecision: "deny";
  mode: PolicyV2["mode"];
  rules: CompiledPolicyRule[];
  diagnostics: PolicyDiagnostic[];
}

export function compareCompiledRules(a: CompiledPolicyRule, b: CompiledPolicyRule): number {
  return (
    b.safetyStrength - a.safetyStrength ||
    b.rule.priority - a.rule.priority ||
    Number(b.hasExactToolName) - Number(a.hasExactToolName) ||
    a.sourceIndex - b.sourceIndex ||
    a.rule.id.localeCompare(b.rule.id)
  );
}

import { redactSecrets } from "../../redaction/redactor.js";
import type { PolicyDiagnostic } from "./policyDiagnostics.js";
import type { RiskSeverity } from "./policyV2Schema.js";

export interface PolicyObservedContext {
  toolName?: string;
  actionType?: string;
  capabilities: string[];
  taint: string[];
  resources: string[];
  attackGraphPatterns: string[];
  riskSeverity?: RiskSeverity;
}

export interface PolicyExplanation {
  matchedRules: string[];
  winningRule: string;
  precedenceReason: string;
  diagnostics: PolicyDiagnostic[];
  observed: PolicyObservedContext;
}

export function redactPolicyExplanation<T extends PolicyExplanation | undefined>(explanation: T): T {
  if (explanation === undefined) {
    return explanation;
  }

  return redactSecrets(explanation).value as T;
}

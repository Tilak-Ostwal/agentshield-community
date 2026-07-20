import type { PolicyEvaluation } from "../policy/policyEvaluator.js";
import { invariantFail, invariantPass, summarizeInvariants, type InvariantResult } from "./invariantResult.js";

function hasPolicyDecisionShape(evaluation: Partial<PolicyEvaluation>): boolean {
  return (
    typeof evaluation.decision === "string" &&
    evaluation.decision.length > 0 &&
    typeof evaluation.ruleId === "string" &&
    evaluation.ruleId.length > 0 &&
    typeof evaluation.reason === "string" &&
    evaluation.reason.length > 0
  );
}

export function checkPolicyDecisionInvariant(evaluation: Partial<PolicyEvaluation>): InvariantResult {
  const checks = [
    hasPolicyDecisionShape(evaluation)
      ? invariantPass("policy-decision-shape", "policy decision includes decision, ruleId, and reason")
      : invariantFail("policy-decision-shape", "policy decision is missing decision, ruleId, or reason")
  ];

  return summarizeInvariants(checks);
}

export function checkPolicyFailClosedInvariant(evaluation: Partial<PolicyEvaluation>): InvariantResult {
  const checks = [
    evaluation.decision === "deny" && evaluation.ruleId === "fail-closed"
      ? invariantPass("policy-fail-closed", "policy failure denied with fail-closed rule")
      : invariantFail("policy-fail-closed", "policy failure did not deny with fail-closed rule")
  ];

  return summarizeInvariants(checks);
}

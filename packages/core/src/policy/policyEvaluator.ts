import type { ActionEnvelope } from "../action/actionEnvelope.js";
import { actionEnvelopeSchema } from "../action/actionEnvelope.js";
import { capabilitiesMatchAll, capabilitiesMatchAny, type CapabilityPolicyContext } from "../capabilities/capabilityPolicy.js";
import { taintMatchesAll, taintMatchesAny, type TaintPolicyContext } from "../taint/taintPolicy.js";
import type { PolicyExplanation } from "./v2/policyExplain.js";
import { evaluatePolicyV2, type PolicyV2EvaluationContext } from "./v2/policyV2Evaluator.js";
import type { Policy, PolicyDecision, PolicyRule } from "./policySchema.js";
import { policySchema } from "./policySchema.js";

export interface PolicyEvaluation {
  decision: PolicyDecision;
  ruleId: string;
  reason: string;
  policyExplanation?: PolicyExplanation;
}

export const DEFAULT_POLICY_DECISION: PolicyDecision = "deny";

export function failClosed(reason: string): PolicyEvaluation {
  return {
    decision: DEFAULT_POLICY_DECISION,
    ruleId: "fail-closed",
    reason
  };
}

type PolicyMatchContext = CapabilityPolicyContext & TaintPolicyContext & PolicyV2EvaluationContext;

function ruleMatches(rule: PolicyRule, action: ActionEnvelope, context: PolicyMatchContext): boolean {
  if (rule.match.actionType !== undefined && rule.match.actionType !== action.actionType) {
    return false;
  }

  if (rule.match.toolName !== undefined && rule.match.toolName !== action.toolName) {
    return false;
  }

  const observed = context.capabilities ?? [];

  if (rule.match.capability !== undefined && !observed.includes(rule.match.capability)) {
    return false;
  }

  if (rule.match.capabilitiesAny !== undefined && !capabilitiesMatchAny(observed, rule.match.capabilitiesAny)) {
    return false;
  }

  if (rule.match.capabilitiesAll !== undefined && !capabilitiesMatchAll(observed, rule.match.capabilitiesAll)) {
    return false;
  }

  const taintLabels = context.taintLabels ?? [];

  if (rule.match.taintAny !== undefined && !taintMatchesAny(taintLabels, rule.match.taintAny)) {
    return false;
  }

  if (rule.match.taintAll !== undefined && !taintMatchesAll(taintLabels, rule.match.taintAll)) {
    return false;
  }

  return true;
}

export function evaluatePolicy(policyInput: unknown, actionInput: unknown, context: PolicyMatchContext = {}): PolicyEvaluation {
  try {
    if (typeof policyInput === "object" && policyInput !== null && (policyInput as { version?: unknown }).version === 2) {
      return evaluatePolicyV2(policyInput, actionInput, context);
    }

    const policyResult = policySchema.safeParse(policyInput);

    if (!policyResult.success) {
      return failClosed("invalid or missing policy");
    }

    const actionResult = actionEnvelopeSchema.safeParse(actionInput);

    if (!actionResult.success) {
      return failClosed("invalid action envelope");
    }

    const policy: Policy = policyResult.data;
    const action: ActionEnvelope = actionResult.data;
    const matchedRule = policy.rules.find((rule) => ruleMatches(rule, action, context));

    if (matchedRule === undefined) {
      return {
        decision: "deny",
        ruleId: "default-deny",
        reason: "no matching policy rule"
      };
    }

    return {
      decision: matchedRule.decision,
      ruleId: matchedRule.id,
      reason: `matched policy rule ${matchedRule.id}`
    };
  } catch {
    return failClosed("policy evaluation failed closed");
  }
}

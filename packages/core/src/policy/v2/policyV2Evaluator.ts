import type { ActionEnvelope } from "../../action/actionEnvelope.js";
import { actionEnvelopeSchema } from "../../action/actionEnvelope.js";
import { compareCompiledRules, type CompiledPolicyRule, type CompiledPolicyV2 } from "./compiledPolicy.js";
import { compilePolicyV2 } from "./policyCompiler.js";
import { type PolicyExplanation, type PolicyObservedContext } from "./policyExplain.js";
import type { RiskSeverity } from "./policyV2Schema.js";
import { inferObservedResources, matchResourceScope, type ObservedResource } from "./resourceMatcher.js";
import type { PolicyEvaluation } from "../policyEvaluator.js";

export interface PolicyV2EvaluationContext {
  capabilities?: string[];
  taintLabels?: string[];
  resources?: ObservedResource[];
  attackGraphPatterns?: string[];
  riskSeverity?: RiskSeverity;
}

interface NormalizedPolicyV2EvaluationContext {
  capabilities: string[];
  taintLabels: string[];
  resources: ObservedResource[];
  attackGraphPatterns: string[];
  riskSeverity?: RiskSeverity;
}

function patternMatches(pattern: string, value: string): boolean {
  if (pattern === value) {
    return true;
  }

  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replaceAll("*", ".*");
  return new RegExp(`^${escaped}$`).test(value);
}

function allObserved(observed: string[], required: string[] | undefined): boolean {
  return required === undefined || required.every((value) => observed.includes(value));
}

function anyObserved(observed: string[], required: string[] | undefined): boolean {
  return required === undefined || required.some((value) => observed.includes(value));
}

function ruleMatches(rule: CompiledPolicyRule, action: ActionEnvelope, context: NormalizedPolicyV2EvaluationContext): boolean {
  const match = rule.rule.match;

  if (match.actionType !== undefined && match.actionType !== action.actionType) {
    return false;
  }

  if (match.toolName !== undefined && match.toolName !== action.toolName) {
    return false;
  }

  if (match.toolNamePattern !== undefined && (action.toolName === undefined || !patternMatches(match.toolNamePattern, action.toolName))) {
    return false;
  }

  if (match.capability !== undefined && !context.capabilities.includes(match.capability)) {
    return false;
  }

  if (!anyObserved(context.capabilities, match.capabilitiesAny) || !allObserved(context.capabilities, match.capabilitiesAll)) {
    return false;
  }

  if (!anyObserved(context.taintLabels, match.taintAny) || !allObserved(context.taintLabels, match.taintAll)) {
    return false;
  }

  if (match.riskSeverityAny !== undefined && (context.riskSeverity === undefined || !match.riskSeverityAny.includes(context.riskSeverity))) {
    return false;
  }

  if (!anyObserved(context.attackGraphPatterns, match.attackGraphPatternAny)) {
    return false;
  }

  if (
    match.resource !== undefined &&
    matchResourceScope({
      type: match.resource.type,
      ...(match.resource.allow === undefined ? {} : { allow: match.resource.allow }),
      ...(match.resource.deny === undefined ? {} : { deny: match.resource.deny })
    }, context.resources).decision !== "match"
  ) {
    return false;
  }

  return true;
}

function observed(action: ActionEnvelope, context: NormalizedPolicyV2EvaluationContext): PolicyObservedContext {
  return {
    ...(action.toolName === undefined ? {} : { toolName: action.toolName }),
    actionType: action.actionType,
    capabilities: [...context.capabilities].sort(),
    taint: [...context.taintLabels].sort(),
    resources: context.resources.map((resource) => `${resource.type}:${resource.value}`).sort(),
    attackGraphPatterns: [...context.attackGraphPatterns].sort(),
    ...(context.riskSeverity === undefined ? {} : { riskSeverity: context.riskSeverity })
  };
}

function buildExplanation(
  matchedRules: CompiledPolicyRule[],
  winningRule: CompiledPolicyRule | undefined,
  compiled: CompiledPolicyV2,
  action: ActionEnvelope,
  context: NormalizedPolicyV2EvaluationContext,
  precedenceReason: string
): PolicyExplanation {
  return {
    matchedRules: matchedRules.map((rule) => rule.rule.id),
    winningRule: winningRule?.rule.id ?? "default-deny",
    precedenceReason,
    diagnostics: compiled.diagnostics,
    observed: observed(action, context)
  };
}

export function evaluateCompiledPolicyV2(
  compiled: CompiledPolicyV2,
  actionInput: unknown,
  evaluationContext: PolicyV2EvaluationContext = {}
): PolicyEvaluation {
  try {
    const actionResult = actionEnvelopeSchema.safeParse(actionInput);

    if (!actionResult.success) {
      return { decision: "deny", ruleId: "fail-closed", reason: "invalid action envelope" };
    }

    const action = actionResult.data;
    const context: NormalizedPolicyV2EvaluationContext = {
      capabilities: evaluationContext.capabilities ?? [],
      taintLabels: evaluationContext.taintLabels ?? [],
      resources: evaluationContext.resources ?? inferObservedResources(action),
      attackGraphPatterns: evaluationContext.attackGraphPatterns ?? [],
      ...(evaluationContext.riskSeverity === undefined ? {} : { riskSeverity: evaluationContext.riskSeverity })
    };
    const matchedRules = compiled.rules.filter((rule) => ruleMatches(rule, action, context)).sort(compareCompiledRules);
    const winningRule = matchedRules[0];

    if (winningRule === undefined) {
      return {
        decision: "deny",
        ruleId: "default-deny",
        reason: "no matching policy rule",
        policyExplanation: buildExplanation(matchedRules, undefined, compiled, action, context, "default deny because no v2 rule matched")
      };
    }

    return {
      decision: winningRule.rule.effect,
      ruleId: winningRule.rule.id,
      reason: `matched policy v2 rule ${winningRule.rule.id}`,
      policyExplanation: buildExplanation(
        matchedRules,
        winningRule,
        compiled,
        action,
        context,
        "winning rule selected by safety strength, priority, exact toolName specificity, then source order"
      )
    };
  } catch {
    return { decision: "deny", ruleId: "fail-closed", reason: "policy v2 evaluation failed closed" };
  }
}

export function evaluatePolicyV2(policyInput: unknown, actionInput: unknown, context: PolicyV2EvaluationContext = {}): PolicyEvaluation {
  const compiled = compilePolicyV2(policyInput);

  if (!compiled.ok || compiled.policy === undefined) {
    return {
      decision: "deny",
      ruleId: "fail-closed",
      reason: "invalid or missing policy v2",
      policyExplanation: {
        matchedRules: [],
        winningRule: "fail-closed",
        precedenceReason: "invalid policy v2 fails closed",
        diagnostics: compiled.diagnostics,
        observed: {
          capabilities: context.capabilities ?? [],
          taint: context.taintLabels ?? [],
          resources: (context.resources ?? []).map((resource) => `${resource.type}:${resource.value}`),
          attackGraphPatterns: context.attackGraphPatterns ?? [],
          ...(context.riskSeverity === undefined ? {} : { riskSeverity: context.riskSeverity })
        }
      }
    };
  }

  return evaluateCompiledPolicyV2(compiled.policy, actionInput, context);
}

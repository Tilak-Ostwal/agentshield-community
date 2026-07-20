import type { PolicyV2, PolicyV2Rule } from "@agentshield/core";

import type { PolicyAuditFinding } from "./policyAuditSchema.js";

function canonicalMatch(rule: PolicyV2Rule): string {
  return JSON.stringify(rule.match, Object.keys(rule.match).sort());
}

function finding(input: PolicyAuditFinding): PolicyAuditFinding {
  return input;
}

function duplicateRuleIds(policy: PolicyV2): PolicyAuditFinding[] {
  const seen = new Set<string>();
  const duplicateIds = new Set<string>();
  for (const rule of policy.rules) {
    if (seen.has(rule.id)) duplicateIds.add(rule.id);
    seen.add(rule.id);
  }

  return [...duplicateIds].sort().map((id) =>
    finding({
      id: `conflict-duplicate-rule-id-${id}`,
      severity: "high",
      category: "conflicting_rule",
      title: "Duplicate rule ID",
      message: `Rule ID ${id} is used more than once.`,
      ruleIds: [id],
      recommendation: "Give every rule a stable unique ID so audit and evidence traces are unambiguous."
    })
  );
}

function exactMatchConflicts(policy: PolicyV2): PolicyAuditFinding[] {
  const groups = new Map<string, PolicyV2Rule[]>();
  for (const rule of policy.rules) {
    const key = canonicalMatch(rule);
    groups.set(key, [...(groups.get(key) ?? []), rule]);
  }

  return [...groups.values()].flatMap((rules) => {
    const effects = new Set(rules.map((rule) => rule.effect));
    if (rules.length < 2 || effects.size < 2) return [];
    return [
      finding({
        id: `conflict-exact-match-${rules.map((rule) => rule.id).sort().join("-")}`,
        severity: "high",
        category: "conflicting_rule",
        title: "Exact-match rules have different decisions",
        message: "Multiple rules match the same tool/capability shape with different decisions.",
        ruleIds: rules.map((rule) => rule.id).sort(),
        recommendation: "Merge duplicate match rules or make the narrower rule explicit with a higher priority and clear effect."
      })
    ];
  });
}

function arraysOverlap(a: readonly string[] | undefined, b: readonly string[] | undefined): boolean {
  if (a === undefined || b === undefined) return false;
  return a.some((item) => b.includes(item));
}

function ruleMayOverlap(a: PolicyV2Rule, b: PolicyV2Rule): boolean {
  if (a.match.toolName !== undefined && b.match.toolName !== undefined && a.match.toolName !== b.match.toolName) return false;
  if (a.match.toolName !== undefined && b.match.toolNamePattern !== undefined && !a.match.toolName.startsWith(b.match.toolNamePattern.replace(/\*+$/, ""))) return false;
  if (b.match.toolName !== undefined && a.match.toolNamePattern !== undefined && !b.match.toolName.startsWith(a.match.toolNamePattern.replace(/\*+$/, ""))) return false;
  if (a.match.capability !== undefined && b.match.capability !== undefined && a.match.capability !== b.match.capability) return false;
  if (a.match.capability !== undefined && b.match.capabilitiesAny !== undefined && !b.match.capabilitiesAny.includes(a.match.capability)) return false;
  if (b.match.capability !== undefined && a.match.capabilitiesAny !== undefined && !a.match.capabilitiesAny.includes(b.match.capability)) return false;
  if (a.match.capabilitiesAny !== undefined && b.match.capabilitiesAny !== undefined && !arraysOverlap(a.match.capabilitiesAny, b.match.capabilitiesAny)) return false;
  return true;
}

function candidateSubsumesRule(candidate: PolicyV2Rule, rule: PolicyV2Rule): boolean {
  const candidateMatch = candidate.match;
  const ruleMatch = rule.match;

  if (candidateMatch.actionType !== undefined && candidateMatch.actionType !== ruleMatch.actionType) return false;
  if (candidateMatch.toolName !== undefined && candidateMatch.toolName !== ruleMatch.toolName) return false;
  if (candidateMatch.toolNamePattern !== undefined) {
    if (candidateMatch.toolNamePattern !== "*" && candidateMatch.toolNamePattern !== "**") {
      const prefix = candidateMatch.toolNamePattern.replace(/\*+$/, "");
      if (ruleMatch.toolName === undefined || !ruleMatch.toolName.startsWith(prefix)) return false;
    }
  }

  const candidateCapabilities = [
    ...(candidateMatch.capability === undefined ? [] : [candidateMatch.capability]),
    ...candidateMatch.capabilitiesAny ?? [],
    ...candidateMatch.capabilitiesAll ?? []
  ];
  const ruleCapabilities = [
    ...(ruleMatch.capability === undefined ? [] : [ruleMatch.capability]),
    ...ruleMatch.capabilitiesAny ?? [],
    ...ruleMatch.capabilitiesAll ?? []
  ];
  if (candidateCapabilities.length > 0 && !candidateCapabilities.some((capability) => ruleCapabilities.includes(capability))) return false;

  if (candidateMatch.taintAny !== undefined && !arraysOverlap(candidateMatch.taintAny, ruleMatch.taintAny)) return false;
  if (candidateMatch.taintAll !== undefined && !arraysOverlap(candidateMatch.taintAll, ruleMatch.taintAll)) return false;
  if (candidateMatch.riskSeverityAny !== undefined && !arraysOverlap(candidateMatch.riskSeverityAny, ruleMatch.riskSeverityAny)) return false;
  if (candidateMatch.attackGraphPatternAny !== undefined && !arraysOverlap(candidateMatch.attackGraphPatternAny, ruleMatch.attackGraphPatternAny)) return false;
  if (candidateMatch.resource !== undefined && ruleMatch.resource === undefined) return false;

  return true;
}

function shadowedRules(policy: PolicyV2): PolicyAuditFinding[] {
  const findings: PolicyAuditFinding[] = [];
  for (const rule of policy.rules) {
    const stronger = policy.rules.filter(
      (candidate) =>
        candidate.id !== rule.id &&
        candidate.effect !== rule.effect &&
        candidate.priority >= rule.priority &&
        (candidate.effect === "deny" || candidate.effect === "require_human_review") &&
        ruleMayOverlap(candidate, rule) &&
        candidateSubsumesRule(candidate, rule)
    );
    if (stronger.length === 0) continue;
    findings.push(
      finding({
        id: `shadowed-rule-${rule.id}`,
        severity: rule.effect === "allow" ? "medium" : "low",
        category: rule.effect === "allow" ? "shadowed_rule" : "unreachable_rule",
        title: rule.effect === "allow" ? "Allow rule may be shadowed" : "Rule may be unreachable",
        message: `Rule ${rule.id} may never win because stronger deny or review rule(s) can match first.`,
        ruleIds: [rule.id, ...stronger.map((item) => item.id)].sort(),
        recommendation: "Make rule matches mutually exclusive or adjust priorities to reflect intended precedence."
      })
    );
  }
  return findings;
}

function wildcardAllows(policy: PolicyV2): PolicyAuditFinding[] {
  return policy.rules
    .filter((rule) => rule.effect === "allow" && (rule.match.toolNamePattern === "*" || rule.match.toolNamePattern === "**"))
    .map((rule) =>
      finding({
        id: `conflict-wildcard-allow-${rule.id}`,
        severity: "high",
        category: "dangerous_allow",
        title: "Wildcard allow rule",
        message: `Rule ${rule.id} allows a wildcard tool pattern.`,
        ruleIds: [rule.id],
        recommendation: "Replace wildcard allow rules with exact safe tool and resource matches."
      })
    );
}

export function detectPolicyConflicts(policy: PolicyV2): PolicyAuditFinding[] {
  return [...duplicateRuleIds(policy), ...exactMatchConflicts(policy), ...shadowedRules(policy), ...wildcardAllows(policy)].sort((a, b) => a.id.localeCompare(b.id));
}

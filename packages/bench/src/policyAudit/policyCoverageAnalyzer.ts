import type { PolicyV2, PolicyV2Match, PolicyV2Rule } from "@agentshield/core";
import type { RegistryEntry, RegistryFile } from "@agentshield/registry";

import type { PolicyAuditFinding } from "./policyAuditSchema.js";

type ProtectiveEffect = "deny" | "require_human_review";

const dangerousCapabilities = [
  "shell.exec",
  "code_execution",
  "network.write",
  "external_side_effect",
  "network.exfiltration_risk",
  "secret.read",
  "filesystem.delete",
  "package.install",
  "git.write"
] as const;

const dangerousTools = [
  { tool: "shell.exec", capabilities: ["shell.exec", "code_execution"], severity: "critical" as const },
  { tool: "network.post", capabilities: ["network.write", "external_side_effect", "network.exfiltration_risk"], severity: "high" as const },
  { tool: "filesystem.delete", capabilities: ["filesystem.delete"], severity: "high" as const },
  { tool: "package.install", capabilities: ["package.install", "code_execution"], severity: "high" as const },
  { tool: "git.push", capabilities: ["git.write", "network.write"], severity: "high" as const },
  { tool: "git.force_push", capabilities: ["git.write", "network.write"], severity: "high" as const }
];

function sortedRuleIds(rules: PolicyV2Rule[]): string[] {
  return [...new Set(rules.map((rule) => rule.id))].sort();
}

function hasCapability(match: PolicyV2Match, capability: string): boolean {
  return match.capability === capability || match.capabilitiesAny?.includes(capability as never) === true || match.capabilitiesAll?.includes(capability as never) === true;
}

function matchCoversTool(match: PolicyV2Match, toolName: string): boolean {
  if (match.toolName === toolName) return true;
  if (match.toolNamePattern === "*" || match.toolNamePattern === "**") return true;
  if (match.toolNamePattern !== undefined && match.toolNamePattern.endsWith("*")) {
    return toolName.startsWith(match.toolNamePattern.slice(0, -1));
  }
  return false;
}

function ruleCoversCapability(rule: PolicyV2Rule, capability: string): boolean {
  return hasCapability(rule.match, capability);
}

function ruleCoversToolOrCapabilities(rule: PolicyV2Rule, toolName: string, capabilities: string[]): boolean {
  return matchCoversTool(rule.match, toolName) || capabilities.some((capability) => ruleCoversCapability(rule, capability));
}

function protectiveRules(policy: PolicyV2, toolName: string, capabilities: string[], effects: ProtectiveEffect[] = ["deny", "require_human_review"]): PolicyV2Rule[] {
  return policy.rules.filter((rule) => effects.includes(rule.effect as ProtectiveEffect) && ruleCoversToolOrCapabilities(rule, toolName, capabilities));
}

function allowRules(policy: PolicyV2, toolName: string, capabilities: string[]): PolicyV2Rule[] {
  return policy.rules.filter((rule) => rule.effect === "allow" && ruleCoversToolOrCapabilities(rule, toolName, capabilities));
}

function finding(input: PolicyAuditFinding): PolicyAuditFinding {
  return input;
}

function defaultDecisionFindings(policy: PolicyV2): PolicyAuditFinding[] {
  if (policy.defaultDecision === "deny") return [];
  return [
    finding({
      id: "coverage-default-allows-unknown-tools",
      severity: "critical",
      category: "coverage_gap",
      title: "Unknown tools are not denied by default",
      message: "Policies must fail closed so unknown tools cannot be allowed by default.",
      ruleIds: [],
      recommendation: "Set defaultDecision to deny and add explicit allow or review rules for safe tools."
    })
  ];
}

function broadAllowFindings(policy: PolicyV2): PolicyAuditFinding[] {
  return policy.rules.flatMap((rule) => {
    if (rule.effect !== "allow") return [];
    const matchKeys = Object.keys(rule.match);
    const wildcard = rule.match.toolNamePattern === "*" || rule.match.toolNamePattern === "**";
    const dangerous = dangerousCapabilities.filter((capability) => ruleCoversCapability(rule, capability));
    const findings: PolicyAuditFinding[] = [];

    if (wildcard || matchKeys.length === 1) {
      findings.push(
        finding({
          id: `dangerous-allow-broad-${rule.id}`,
          severity: "high",
          category: "dangerous_allow",
          title: "Allow rule is too broad",
          message: `Allow rule ${rule.id} has a broad match and may cover risky tools.`,
          ruleIds: [rule.id],
          recommendation: "Constrain allow rules by exact tool, capability, and resource scope."
        })
      );
    }

    if (dangerous.length > 0) {
      findings.push(
        finding({
          id: `dangerous-allow-capability-${rule.id}`,
          severity: "high",
          category: "dangerous_allow",
          title: "Allow rule covers dangerous capabilities",
          message: `Allow rule ${rule.id} covers ${dangerous.join(", ")}.`,
          ruleIds: [rule.id],
          recommendation: "Change dangerous capability rules to deny or require_human_review."
        })
      );
    }

    return findings;
  });
}

function dangerousCoverageFindings(policy: PolicyV2): PolicyAuditFinding[] {
  return dangerousTools.flatMap((item) => {
    const protective = protectiveRules(policy, item.tool, item.capabilities);
    if (protective.length > 0) return [];
    return [
      finding({
        id: `coverage-dangerous-${item.tool.replaceAll(".", "-")}`,
        severity: item.severity,
        category: "coverage_gap",
        title: "Dangerous tool lacks explicit deny or review coverage",
        message: `${item.tool} should be denied or require human review even when the default decision is deny.`,
        ruleIds: [],
        recommendation: `Add an explicit deny or require_human_review rule for ${item.tool} or its dangerous capabilities.`
      })
    ];
  });
}

function secretFlowFindings(policy: PolicyV2): PolicyAuditFinding[] {
  const secretNetworkDeny = policy.rules.some(
    (rule) =>
      rule.effect === "deny" &&
      (ruleCoversCapability(rule, "secret.read") || rule.match.taintAny?.some((taint) => taint === "secret" || taint === "credential") === true) &&
      (ruleCoversCapability(rule, "network.write") || ruleCoversCapability(rule, "network.exfiltration_risk") || ruleCoversCapability(rule, "external_side_effect"))
  );
  if (secretNetworkDeny) return [];
  return [
    finding({
      id: "coverage-secret-token-flows",
      severity: "critical",
      category: "coverage_gap",
      title: "Secret or token flows are not explicitly denied",
      message: "Policies should deny secret, credential, or token data moving into network writes or external side effects.",
      ruleIds: [],
      recommendation: "Add a deny rule matching network.write with secret or credential taint."
    })
  ];
}

function requirementFindings(policy: PolicyV2): PolicyAuditFinding[] {
  const riskyRules = policy.rules.filter(
    (rule) =>
      rule.effect === "allow" &&
      ["filesystem.write", "git.write", "network.write", "external_side_effect", "code_execution"].some((capability) => ruleCoversCapability(rule, capability))
  );

  return riskyRules.flatMap((rule) => [
    finding({
      id: `missing-approval-${rule.id}`,
      severity: "medium",
      category: "missing_approval",
      title: "Risky allow rule does not require approval",
      message: `Rule ${rule.id} allows a risky write or execution capability without human approval.`,
      ruleIds: [rule.id],
      recommendation: "Use require_human_review for risky write or execution paths."
    }),
    finding({
      id: `missing-sandbox-${rule.id}`,
      severity: "medium",
      category: "missing_sandbox",
      title: "Risky allow rule lacks sandbox requirement",
      message: `Rule ${rule.id} allows risky behavior without a policy-level sandbox constraint.`,
      ruleIds: [rule.id],
      recommendation: "Prefer review, sandboxed execution, or a narrower resource boundary for risky tools."
    }),
    finding({
      id: `missing-execution-constraint-${rule.id}`,
      severity: "medium",
      category: "missing_execution_constraint",
      title: "Risky allow rule lacks execution constraints",
      message: `Rule ${rule.id} allows risky behavior without an execution constraint.`,
      ruleIds: [rule.id],
      recommendation: "Deny or require review for risky tools unless a constrained execution path is available."
    })
  ]);
}

function registryEntryCovered(policy: PolicyV2, entry: RegistryEntry): boolean {
  return policy.rules.some((rule) => ruleCoversToolOrCapabilities(rule, entry.toolName, entry.declaredCapabilities));
}

function registryFindings(policy: PolicyV2, registry: RegistryFile | undefined): PolicyAuditFinding[] {
  if (registry === undefined) return [];

  return registry.entries.flatMap((entry) => {
    const findings: PolicyAuditFinding[] = [];
    const capabilities = entry.declaredCapabilities;
    const allows = allowRules(policy, entry.toolName, capabilities);
    const protective = protectiveRules(policy, entry.toolName, capabilities, ["deny", "require_human_review"]);

    if (!registryEntryCovered(policy, entry)) {
      findings.push(
        finding({
          id: `registry-gap-${entry.toolName.replaceAll(".", "-")}`,
          severity: entry.riskLevel === "critical" || entry.riskLevel === "high" ? "high" : "medium",
          category: "registry_gap",
          title: "Registry tool lacks policy coverage",
          message: `Registry tool ${entry.toolName} has no matching policy rule.`,
          ruleIds: [],
          recommendation: "Add explicit policy coverage for every registered tool, especially reviewed or high-risk tools."
        })
      );
    }

    if ((entry.riskLevel === "critical" || entry.riskLevel === "high") && protective.length === 0) {
      findings.push(
        finding({
          id: `registry-high-risk-unprotected-${entry.toolName.replaceAll(".", "-")}`,
          severity: "high",
          category: "registry_gap",
          title: "High-risk registry tool lacks deny or review coverage",
          message: `High-risk registry tool ${entry.toolName} is not covered by deny or human review.`,
          ruleIds: [],
          recommendation: "Add explicit deny or require_human_review coverage for high-risk registry tools."
        })
      );
    }

    if (entry.trustLevel === "blocked" && allows.length > 0) {
      findings.push(
        finding({
          id: `registry-blocked-allowed-${entry.toolName.replaceAll(".", "-")}`,
          severity: "critical",
          category: "registry_gap",
          title: "Blocked registry tool is allowed by policy",
          message: `Blocked registry tool ${entry.toolName} matches allow rule(s).`,
          ruleIds: sortedRuleIds(allows),
          recommendation: "Remove the allow rule or add a stronger explicit deny for blocked registry tools."
        })
      );
    }

    return findings;
  });
}

export function analyzePolicyCoverage(policy: PolicyV2, registry?: RegistryFile): PolicyAuditFinding[] {
  return [
    ...defaultDecisionFindings(policy),
    ...broadAllowFindings(policy),
    ...dangerousCoverageFindings(policy),
    ...secretFlowFindings(policy),
    ...requirementFindings(policy),
    ...registryFindings(policy, registry)
  ].sort((a, b) => a.id.localeCompare(b.id));
}

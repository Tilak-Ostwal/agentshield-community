import type { PolicyV2, PolicyV2Rule } from "@agentshield/core";

import { parsePolicyTemplate, type PolicyTemplate } from "./policyTemplateSchema.js";

function deny(id: string, description: string, priority: number, match: PolicyV2Rule["match"]): PolicyV2Rule {
  return { id, description, effect: "deny", priority, match };
}

function review(id: string, description: string, priority: number, match: PolicyV2Rule["match"], reason: string): PolicyV2Rule {
  return { id, description, effect: "require_human_review", priority, match, requireApproval: { reason } };
}

function allow(id: string, description: string, priority: number, match: PolicyV2Rule["match"]): PolicyV2Rule {
  return { id, description, effect: "allow", priority, match };
}

function policy(name: string, mode: PolicyV2["mode"], rules: PolicyV2Rule[]): PolicyV2 {
  return { version: 2, name, defaultDecision: "deny", mode, rules };
}

const protectiveRules: PolicyV2Rule[] = [
  deny("deny-shell-exec", "Deny shell execution.", 1000, { capability: "shell.exec" }),
  deny("deny-code-execution", "Deny direct code execution.", 990, { capability: "code_execution" }),
  deny("deny-package-install", "Deny package installation.", 950, { capability: "package.install" }),
  deny("deny-filesystem-delete", "Deny filesystem deletes.", 925, { capability: "filesystem.delete" }),
  deny("deny-secret-network-write", "Deny network writes with secrets or credentials.", 900, { capabilitiesAny: ["network.write"], taintAny: ["secret", "credential"] }),
  deny("deny-critical-attack-graph", "Deny critical attack graph findings.", 850, { riskSeverityAny: ["critical"] })
];

const strictMcpLocal = parsePolicyTemplate({
  id: "strict-mcp-local",
  name: "Strict local MCP policy",
  description: "Deny-by-default local MCP policy with safe project reads, reviewed writes, and explicit dangerous denies.",
  safetyLevel: "strict",
  productionReady: false,
  warnings: ["Starter policy only; review tool registry and resource scopes before production use."],
  tags: ["mcp", "local", "strict"],
  policy: policy("strict-mcp-local", "strict", [
    deny("deny-shell-exec", "Never allow shell execution in the local prototype.", 1000, { capability: "shell.exec" }),
    deny("deny-code-execution", "Never allow direct code execution in the local prototype.", 990, { capability: "code_execution" }),
    deny("deny-package-install", "Package installation is code execution risk.", 950, { capability: "package.install" }),
    deny("deny-filesystem-delete", "Filesystem deletes can remove project state.", 925, { capability: "filesystem.delete" }),
    deny("deny-secret-network-write", "Deny network writes when secrets or credentials are tainted.", 900, { capabilitiesAny: ["network.write"], taintAny: ["secret", "credential"] }),
    deny("deny-critical-attack-graph", "Critical attack graph findings cannot proceed.", 850, { riskSeverityAny: ["critical"] }),
    review("review-filesystem-write", "Local writes require a person to review intent.", 700, { capability: "filesystem.write" }, "filesystem writes can modify project state"),
    review("review-git-write", "Git writes can publish or rewrite state.", 700, { capability: "git.write" }, "git writes require human confirmation"),
    review("review-network-write", "Network writes require review unless explicitly denied.", 690, { capability: "network.write" }, "network writes can exfiltrate data or trigger external side effects"),
    allow("allow-readonly-project-files", "Allow readonly access to safe project files.", 100, {
      actionType: "tool_call",
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ])
});

const readonlyCodingAgent = parsePolicyTemplate({
  id: "readonly-coding-agent",
  name: "Read-only coding assistant",
  description: "Allows project reads while denying writes, shell, network writes, package installation, and secret flows.",
  safetyLevel: "readonly",
  productionReady: false,
  warnings: ["Starter policy only; confirm project path boundaries before use."],
  tags: ["coding", "readonly"],
  policy: policy("readonly-coding-agent", "strict", [
    ...protectiveRules,
    deny("deny-filesystem-write", "Readonly agents cannot write files.", 800, { capability: "filesystem.write" }),
    deny("deny-network-write", "Readonly agents cannot write to the network.", 790, { capability: "network.write" }),
    deny("deny-git-write", "Readonly agents cannot mutate git state.", 780, { capability: "git.write" }),
    allow("allow-project-read", "Allow reading project files.", 100, {
      actionType: "tool_call",
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ])
});

const ciSecurityGate = parsePolicyTemplate({
  id: "ci-security-gate",
  name: "CI security gate",
  description: "CI-focused policy for local benchmark and report generation with external side effects denied.",
  safetyLevel: "ci",
  productionReady: false,
  warnings: ["Registry-aware mode still requires local registry review before CI enforcement."],
  tags: ["ci", "benchmark", "registry-aware"],
  policy: policy("ci-security-gate", "strict", [
    ...protectiveRules,
    deny("deny-external-side-effect", "CI security gate must not trigger external side effects.", 875, { capability: "external_side_effect" }),
    review("review-ci-report-write", "CI report writes require a known output path.", 650, {
      capability: "filesystem.write",
      resource: { type: "filesystem", allow: ["/mock/project/reports/**"] }
    }, "confirm report output path"),
    allow("allow-ci-report-read", "Allow reading local reports and project files.", 100, {
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"] }
    })
  ])
});

const docsAgent = parsePolicyTemplate({
  id: "docs-agent",
  name: "Documentation agent",
  description: "Allows docs reads and constrained markdown writes while denying shell, network, and package installation.",
  safetyLevel: "docs",
  productionReady: false,
  warnings: ["Review generated documentation before publishing."],
  tags: ["docs", "markdown"],
  policy: policy("docs-agent", "strict", [
    ...protectiveRules,
    deny("deny-network-write", "Documentation agents cannot write to the network.", 825, { capability: "network.write" }),
    allow("allow-docs-read", "Allow reading project and docs files.", 120, {
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    }),
    review("review-docs-write", "Markdown documentation writes require review.", 700, {
      capability: "filesystem.write",
      resource: { type: "filesystem", allow: ["/mock/project/docs/**/*.md"] }
    }, "review markdown documentation changes"),
    review("review-write-outside-docs", "Writes outside docs require review.", 690, { capability: "filesystem.write" }, "review non-docs write target")
  ])
});

const enterpriseSensitiveData = parsePolicyTemplate({
  id: "enterprise-sensitive-data",
  name: "Enterprise sensitive data",
  description: "Sensitive-data policy that denies credential and secret network flows and requires review for data export.",
  safetyLevel: "enterprise",
  productionReady: false,
  warnings: ["Starting point only; map enterprise data classes, registries, and approval owners before production use."],
  tags: ["enterprise", "data", "approval"],
  policy: policy("enterprise-sensitive-data", "strict", [
    ...protectiveRules,
    deny("deny-secret-read-network", "Deny secret reads moving to network writes.", 910, { capabilitiesAny: ["secret.read", "network.write"], taintAny: ["secret", "credential"] }),
    deny("deny-env-network", "Deny environment-derived data moving to network writes.", 905, { capabilitiesAny: ["env.read", "network.write"] }),
    review("review-data-export", "Data export requires human review.", 720, { capability: "network.write" }, "review destination and data classification"),
    review("review-database-write", "Database writes require human review.", 710, { capability: "database.write" }, "review data mutation and audit trail"),
    review("review-filesystem-write", "Sensitive filesystem writes require review and sandboxing.", 700, { capability: "filesystem.write" }, "confirm write scope and sandbox constraints"),
    allow("allow-sensitive-project-read", "Allow bounded project reads.", 100, {
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ])
});

const devWarningMode = parsePolicyTemplate({
  id: "dev-warning-mode",
  name: "Development warning mode",
  description: "Local development starter that allows bounded reads and reviewed writes while requiring review for execution and network actions.",
  safetyLevel: "development",
  productionReady: false,
  warnings: ["Development mode is not production-ready.", "Use only for local prototyping with mock tools and reviewed outputs."],
  tags: ["development", "warning"],
  policy: policy("dev-warning-mode", "balanced", [
    deny("deny-package-install", "Deny package installation even in development mode.", 950, { capability: "package.install" }),
    deny("deny-filesystem-delete", "Deny filesystem deletes.", 925, { capability: "filesystem.delete" }),
    deny("deny-secret-network-write", "Deny secret network writes.", 900, { capabilitiesAny: ["network.write"], taintAny: ["secret", "credential"] }),
    review("review-shell-exec", "Shell execution requires review in development mode.", 800, { capability: "shell.exec" }, "review local command intent"),
    review("review-code-execution", "Code execution requires review in development mode.", 795, { capability: "code_execution" }, "review local execution intent"),
    review("review-network-write", "Network writes require review in development mode.", 780, { capability: "network.write" }, "review destination and payload"),
    review("review-project-write", "Project writes require review in development mode.", 700, { capability: "filesystem.write" }, "review project write"),
    allow("allow-project-read", "Allow bounded project reads.", 100, {
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ])
});

const sandboxRequired = parsePolicyTemplate({
  id: "sandbox-required",
  name: "Sandbox-required policy",
  description: "Starter policy that routes risky writes and network actions through human review instead of direct allow.",
  safetyLevel: "sandbox",
  productionReady: false,
  warnings: ["Policy v2 records review requirements; enforce sandbox profiles in runtime configuration."],
  tags: ["sandbox", "review"],
  policy: policy("sandbox-required", "strict", [
    ...protectiveRules,
    review("review-sandbox-filesystem-write", "Filesystem writes require sandboxed review.", 700, { capability: "filesystem.write" }, "confirm sandbox profile and target path"),
    review("review-sandbox-network-write", "Network writes require sandboxed review.", 690, { capability: "network.write" }, "confirm network policy and destination"),
    allow("allow-sandbox-project-read", "Allow bounded project reads.", 100, {
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ])
});

const registryEnforced = parsePolicyTemplate({
  id: "registry-enforced",
  name: "Registry-enforced policy",
  description: "Starter policy intended for use with a local reviewed tool registry.",
  safetyLevel: "registry",
  productionReady: false,
  warnings: ["Use with a validated local registry and fingerprint attestation before enabling in CI."],
  tags: ["registry", "attestation"],
  policy: policy("registry-enforced", "strict", [
    ...protectiveRules,
    deny("deny-unreviewed-network-write", "Network writes require registry review and human approval.", 820, { capability: "network.write" }),
    review("review-registered-filesystem-write", "Registered filesystem writes require review.", 700, { capability: "filesystem.write" }, "confirm registry entry and write path"),
    allow("allow-registered-project-read", "Allow bounded registered project reads.", 100, {
      toolName: "filesystem.read",
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ])
});

export const builtInPolicyTemplates: PolicyTemplate[] = [
  strictMcpLocal,
  readonlyCodingAgent,
  ciSecurityGate,
  docsAgent,
  enterpriseSensitiveData,
  devWarningMode,
  sandboxRequired,
  registryEnforced
].sort((left, right) => left.id.localeCompare(right.id));

export function listPolicyTemplates(): PolicyTemplate[] {
  return builtInPolicyTemplates;
}

export function getPolicyTemplate(id: string): PolicyTemplate {
  const template = builtInPolicyTemplates.find((item) => item.id === id);
  if (template === undefined) throw new Error(`unknown policy template: ${id}`);
  return template;
}

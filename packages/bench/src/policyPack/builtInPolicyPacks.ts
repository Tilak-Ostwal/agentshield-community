import type { PolicyV2Rule } from "@agentshield/core";

import { parsePolicyPack, type PolicyPack } from "./policyPackSchema.js";

function deny(id: string, description: string, priority: number, match: PolicyV2Rule["match"]): PolicyV2Rule {
  return { id, description, effect: "deny", priority, match };
}

function review(id: string, description: string, priority: number, match: PolicyV2Rule["match"], reason: string): PolicyV2Rule {
  return { id, description, effect: "require_human_review", priority, match, requireApproval: { reason } };
}

function allow(id: string, description: string, priority: number, match: PolicyV2Rule["match"]): PolicyV2Rule {
  return { id, description, effect: "allow", priority, match };
}

const baseDenyRules: PolicyV2Rule[] = [
  deny("deny-shell-exec", "Deny shell execution.", 1000, { capability: "shell.exec" }),
  deny("deny-code-execution", "Deny direct code execution.", 990, { capability: "code_execution" }),
  deny("deny-package-install", "Deny package installation.", 950, { capability: "package.install" }),
  deny("deny-filesystem-delete", "Deny filesystem deletes.", 925, { capability: "filesystem.delete" }),
  deny("deny-secret-network-write", "Deny network writes with secret, credential, token, API key, password, or possible PII taint.", 920, {
    capabilitiesAny: ["network.write", "network.exfiltration_risk", "external_side_effect"],
    taintAny: ["secret", "credential", "token", "api_key", "password", "private_user_data", "pii_possible"]
  }),
  deny("deny-critical-attack-graph", "Deny critical attack graph findings.", 850, { riskSeverityAny: ["critical"] })
];

function pack(input: PolicyPack): PolicyPack {
  const parsed = parsePolicyPack(input);
  if (!parsed.ok || parsed.pack === undefined) throw new Error(`invalid built-in policy pack ${input.packId}: ${parsed.error ?? "unknown error"}`);
  return parsed.pack;
}

export const strictMcpLocalPolicyPack = pack({
  version: 1,
  packId: "strict-mcp-local",
  name: "Strict MCP Local",
  description: "Safe local MCP default with readonly project reads, reviewed writes, and explicit dangerous denies.",
  policyVersion: 2,
  safetyLevel: "strict",
  compatibleWorkspaceProfiles: ["strict", "enterprise"],
  tags: ["mcp", "local", "strict"],
  rules: [
    ...baseDenyRules,
    review("review-project-write", "Review project filesystem writes.", 700, { capability: "filesystem.write" }, "project writes can modify local state"),
    review("review-git-write", "Review git writes.", 690, { capability: "git.write" }, "git writes can publish or rewrite state"),
    allow("allow-readonly-project-files", "Allow readonly project file reads.", 100, {
      actionType: "tool_call",
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ],
  requiredChecks: { policyAudit: true, policyTest: true, adapterConformance: true, releaseCheck: true },
  warnings: []
});

export const enterpriseSensitiveDataPolicyPack = pack({
  version: 1,
  packId: "enterprise-sensitive-data",
  name: "Enterprise Sensitive Data Protection",
  description: "Deny credential and sensitive data exfiltration, require review for risky exports, and require sandbox/execution constraints for risky side effects.",
  policyVersion: 2,
  safetyLevel: "enterprise",
  compatibleWorkspaceProfiles: ["strict", "enterprise"],
  tags: ["data-protection", "enterprise", "exfiltration"],
  rules: [
    ...baseDenyRules,
    deny("deny-sensitive-network-flow", "Deny sensitive data network flows.", 930, {
      capabilitiesAny: ["network.write", "network.exfiltration_risk", "external_side_effect"],
      taintAny: ["secret", "credential", "token", "api_key", "password", "private_user_data", "pii_possible", "env_secret", "ssh_key"]
    }),
    deny("deny-blocked-registry-tool", "Deny blocked registry tools by risk severity.", 900, { riskSeverityAny: ["critical"] }),
    review("review-data-export", "Review data exports.", 730, { capability: "network.write" }, "confirm destination, data class, and authorization"),
    review("review-external-side-effect", "Review external side effects with execution constraints.", 720, { capability: "external_side_effect" }, "confirm execution constraints and audit trail"),
    review("review-sandboxed-write", "Review write actions and require sandbox support.", 710, { capability: "filesystem.write" }, "confirm sandbox profile and write scope"),
    review("review-database-write", "Review database writes.", 700, { capability: "database.write" }, "confirm data mutation and audit trail"),
    allow("allow-reviewed-project-read", "Allow bounded project reads.", 100, {
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ],
  requiredChecks: { policyAudit: true, policyTest: true, adapterConformance: false, releaseCheck: true },
  warnings: []
});

export const ciSecurityPolicyPack = pack({
  version: 1,
  packId: "ci-security",
  name: "CI Security",
  description: "CI-safe defaults for benchmark, report, and release-check style workflows with external side effects denied.",
  policyVersion: 2,
  safetyLevel: "strict",
  compatibleWorkspaceProfiles: ["strict", "enterprise"],
  tags: ["ci", "benchmark", "release-check"],
  rules: [
    ...baseDenyRules,
    deny("deny-external-side-effect", "Deny external side effects in CI.", 940, { capability: "external_side_effect" }),
    deny("deny-network-write", "Deny network writes in CI.", 930, { capability: "network.write" }),
    review("review-ci-report-write", "Review CI report writes.", 650, {
      capability: "filesystem.write",
      resource: { type: "filesystem", allow: ["/mock/project/reports/**"] }
    }, "confirm local report output path"),
    allow("allow-ci-local-read", "Allow local project reads for reports and checks.", 100, {
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ],
  requiredChecks: { policyAudit: true, policyTest: true, adapterConformance: false, releaseCheck: true },
  warnings: []
});

export const sandboxRequiredPolicyPack = pack({
  version: 1,
  packId: "sandbox-required",
  name: "Sandbox Required",
  description: "Require sandbox review for write and execution-capable actions while denying shell execution and secret network writes.",
  policyVersion: 2,
  safetyLevel: "strict",
  compatibleWorkspaceProfiles: ["strict", "enterprise"],
  tags: ["sandbox", "execution-constraints"],
  rules: [
    ...baseDenyRules,
    review("review-sandbox-filesystem-write", "Filesystem writes require sandbox profile review.", 720, { capability: "filesystem.write" }, "confirm sandbox profile before write"),
    review("review-sandbox-network-write", "Network writes require sandbox and network policy review.", 710, { capability: "network.write" }, "confirm sandbox and network policy"),
    review("review-sandbox-external-side-effect", "External side effects require sandbox and execution constraints.", 700, { capability: "external_side_effect" }, "confirm execution constraints"),
    allow("allow-sandbox-project-read", "Allow bounded project reads.", 100, {
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ],
  requiredChecks: { policyAudit: true, policyTest: true, adapterConformance: false, releaseCheck: true },
  warnings: ["Policy rules record sandbox review expectations; runtime sandbox enforcement must remain enabled in workspace config."]
});

export const registryEnforcedPolicyPack = pack({
  version: 1,
  packId: "registry-enforced",
  name: "Registry Enforced",
  description: "Require local registry trust for high-risk tools, deny blocked tools, review unknown tools, and detect capability drift.",
  policyVersion: 2,
  safetyLevel: "enterprise",
  compatibleWorkspaceProfiles: ["enterprise"],
  tags: ["registry", "attestation", "capability-drift"],
  rules: [
    ...baseDenyRules,
    deny("deny-blocked-or-critical-registry-tool", "Deny blocked or critical registry tools.", 940, { riskSeverityAny: ["critical"] }),
    review("review-high-risk-registry-tool", "Review high-risk or unreviewed registry tools.", 760, { riskSeverityAny: ["high"] }, "confirm local registry trust and fingerprint attestation"),
    review("review-capability-drift", "Review capability drift findings.", 750, { attackGraphPatternAny: ["capability_drift", "fingerprint_change"] }, "confirm registry fingerprint and declared capabilities"),
    review("review-unknown-tool", "Review unknown tool patterns.", 740, { toolNamePattern: "unknown.*" }, "register or deny the tool before use"),
    review("review-registered-write", "Review registered write-capable tools.", 700, { capabilitiesAny: ["filesystem.write", "git.write", "network.write"] }, "confirm registry trust and write scope"),
    allow("allow-registered-project-read", "Allow bounded registered project reads.", 100, {
      toolName: "filesystem.read",
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ],
  requiredChecks: { policyAudit: true, policyTest: true, adapterConformance: false, releaseCheck: true },
  warnings: ["Requires a reviewed local registry and fingerprint attestation workflow."]
});

export const devWarningModePolicyPack = pack({
  version: 1,
  packId: "dev-warning-mode",
  name: "Development Warning Mode",
  description: "Local development only pack with limited project read/write, reviewed execution/network, and clear production warnings.",
  policyVersion: 2,
  safetyLevel: "dev",
  compatibleWorkspaceProfiles: ["dev", "balanced"],
  tags: ["development", "warning"],
  rules: [
    deny("deny-package-install", "Deny package installation even in development mode.", 950, { capability: "package.install" }),
    deny("deny-filesystem-delete", "Deny filesystem deletes.", 925, { capability: "filesystem.delete" }),
    deny("deny-secret-network-write", "Deny secret network writes.", 900, {
      capabilitiesAny: ["network.write", "network.exfiltration_risk", "external_side_effect"],
      taintAny: ["secret", "credential", "token", "api_key", "password"]
    }),
    review("review-shell-exec", "Review shell execution in development mode.", 800, { capability: "shell.exec" }, "review local command intent"),
    review("review-code-execution", "Review code execution in development mode.", 790, { capability: "code_execution" }, "review local execution intent"),
    review("review-network-write", "Review network writes in development mode.", 780, { capability: "network.write" }, "review destination and payload"),
    review("review-project-write", "Review project writes in development mode.", 700, { capability: "filesystem.write" }, "review project write"),
    allow("allow-project-read", "Allow bounded project reads.", 100, {
      capability: "filesystem.read",
      resource: { type: "filesystem", allow: ["/mock/project/**"], deny: ["/mock/project/.env", "/mock/project/secrets/**"] }
    })
  ],
  requiredChecks: { policyAudit: true, policyTest: true, adapterConformance: false, releaseCheck: true },
  warnings: ["Development warning mode is not production-ready.", "Use only for local prototyping with reviewed outputs."]
});

export const builtInPolicyPacks: PolicyPack[] = [
  ciSecurityPolicyPack,
  devWarningModePolicyPack,
  enterpriseSensitiveDataPolicyPack,
  registryEnforcedPolicyPack,
  sandboxRequiredPolicyPack,
  strictMcpLocalPolicyPack
].sort((left, right) => left.packId.localeCompare(right.packId));

export function listPolicyPacks(): PolicyPack[] {
  return builtInPolicyPacks;
}

export function getPolicyPack(packId: string): PolicyPack {
  const packItem = builtInPolicyPacks.find((item) => item.packId === packId);
  if (packItem === undefined) throw new Error(`unknown policy pack: ${packId}`);
  return packItem;
}

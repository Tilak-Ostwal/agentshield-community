import { EnterpriseRecipe } from "./recipeSchema.js";
import { CONTROL_MATRIX } from "./recipeControlMatrix.js";

export const builtInRecipes: Record<string, EnterpriseRecipe> = {
  "ci-security-gate": {
    version: 1,
    recipeId: "ci-security-gate",
    name: "CI Security Gate",
    description: "CI pipeline check",
    maturity: "beta",
    recommendedFor: ["ci-gate"],
    commands: ["pnpm cli -- release-check", "pnpm cli -- bench --ci", "pnpm cli -- policy-audit", "pnpm cli -- policy-test"],
    evidenceArtifacts: ["release-check summary", "benchmark report"],
    controls: [CONTROL_MATRIX["AS-CONTROL-014"]!],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "mcp-proxy-protection": {
    version: 1,
    recipeId: "mcp-proxy-protection",
    name: "MCP Proxy Protection",
    description: "Protect MCP",
    maturity: "beta",
    recommendedFor: [],
    commands: ["pnpm cli -- policy-bundle verify", "pnpm cli -- registry-bundle verify", "pnpm cli -- verify-trace"],
    evidenceArtifacts: ["runtime trace"],
    controls: [CONTROL_MATRIX["AS-CONTROL-003"]!],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "sdk-runtime-guard": {
    version: 1,
    recipeId: "sdk-runtime-guard",
    name: "SDK Runtime Guard",
    description: "Protect SDK",
    maturity: "beta",
    recommendedFor: [],
    commands: ["pnpm cli -- auditor export", "pnpm cli -- incident report"],
    evidenceArtifacts: ["auditor-evidence.json"],
    controls: [CONTROL_MATRIX["AS-CONTROL-011"]!],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "adapter-certification": {
    version: 1,
    recipeId: "adapter-certification",
    name: "Adapter Certification",
    description: "Certify custom adapter",
    maturity: "beta",
    recommendedFor: [],
    commands: ["pnpm cli -- adapter-conformance", "pnpm cli -- recipe validate"],
    evidenceArtifacts: ["conformance report"],
    controls: [CONTROL_MATRIX["AS-CONTROL-008"]!],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "auditor-evidence-pack": {
    version: 1,
    recipeId: "auditor-evidence-pack",
    name: "Auditor Evidence Pack",
    description: "Generate evidence pack",
    maturity: "release_candidate",
    recommendedFor: [],
    commands: ["pnpm cli -- auditor export", "pnpm cli -- sensitive scan"],
    evidenceArtifacts: ["auditor-evidence.json"],
    controls: [CONTROL_MATRIX["AS-CONTROL-012"]!],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "incident-response": {
    version: 1,
    recipeId: "incident-response",
    name: "Incident Response",
    description: "Incident response workflow",
    maturity: "beta",
    recommendedFor: [],
    commands: ["pnpm cli -- incident report", "pnpm cli -- explain-graph"],
    evidenceArtifacts: ["incident-report.md"],
    controls: [CONTROL_MATRIX["AS-CONTROL-011"]!],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  },
  "full-release-candidate": {
    version: 1,
    recipeId: "full-release-candidate",
    name: "Full Release Candidate Security Workflow",
    description: "Runs the local deterministic AgentShield release candidate workflow with policy packs, bundles, registry bundles, security fuzzing, red-team coverage, incident reporting, auditor export, and release checks.",
    maturity: "release_candidate",
    recommendedFor: ["open-source-release", "security-review", "ci-gate"],
    requires: {
      workspaceConfig: true,
      policyPack: true,
      policyBundle: true,
      registryBundle: true,
      securityFuzz: true,
      redteamCoverage: true,
      adapterConformance: true,
      incidentReport: true,
      auditorExport: true,
      releaseCheck: true
    },
    commands: [
      "pnpm cli -- workspace validate examples/workspace/agentshield.workspace.json",
      "pnpm cli -- policy-pack audit strict-mcp-local",
      "pnpm cli -- policy-bundle verify examples/policy-bundles/strict-mcp-local.bundle.json",
      "pnpm cli -- registry-bundle verify examples/registry-bundles/agentshield.registry.bundle.json",
      "pnpm cli -- security-fuzz",
      "pnpm cli -- redteam coverage",
      "pnpm cli -- adapter-conformance examples/custom-adapter/adapter-conformance.json",
      "pnpm cli -- auditor export --out auditor-evidence.json --force",
      "pnpm cli -- release-check"
    ],
    evidenceArtifacts: [
      "auditor-evidence.json",
      "incident-report.md",
      "security-fuzz-report.md"
    ],
    controls: [
      CONTROL_MATRIX["AS-CONTROL-001"]!,
      CONTROL_MATRIX["AS-CONTROL-003"]!,
      CONTROL_MATRIX["AS-CONTROL-004"]!,
      CONTROL_MATRIX["AS-CONTROL-014"]!
    ],
    limitations: ["Local deterministic checks only; not a legal compliance certification."]
  }
};

import { describe, expect, it } from "vitest";
import { parseAuditorEvidencePack } from "./auditorEvidencePackSchema.js";

describe("auditorEvidencePackSchema", () => {
  it("parses valid pack", () => {
    const valid = {
      version: 1,
      packId: "agentshield-local-auditor-pack",
      createdAt: "2026-06-29T00:00:00.000Z",
      workspace: { workspaceConfigPath: "examples/workspace/agentshield.workspace.json", profile: "strict" },
      policy: { policyPath: "examples/policies/strict.policy.json", policyBundlePath: "examples/policy-bundles/strict-mcp-local.bundle.json", policyHash: "...", policyBundleVerified: true },
      registry: { registryPath: "examples/registry/agentshield.registry.json", registryBundlePath: "examples/registry-bundles/agentshield.registry.bundle.json", registryHash: "...", registryBundleVerified: true },
      checks: {
        releaseCheck: { passed: true, total: 100 },
        benchmark: { passed: true, totalScenarios: 10, failed: 0 },
        policyAudit: { passed: true, critical: 0, high: 0 },
        policyTest: { passed: true, total: 5, failed: 0 },
        adapterConformance: { certification: "passed", total: 10, failed: 0 },
        securityFuzz: { certification: "passed", criticalFailed: 0 },
        redteamCoverage: { passed: true, totalScenarios: 5 }
      },
      evidence: { traceBundlesVerified: true, rawSecretLeakDetected: false, redactionRequired: true },
      limitations: ["Local deterministic evidence only; not a legal certification.", "No claim of SOC2, ISO, HIPAA, PCI, or regulatory compliance."],
      packHash: "..."
    };

    const parsed = parseAuditorEvidencePack(valid);
    expect(parsed.version).toBe(1);
    expect(parsed.packId).toBe("agentshield-local-auditor-pack");
  });

  it("invalid pack is rejected", () => {
    expect(() => parseAuditorEvidencePack({})).toThrow();
  });
});

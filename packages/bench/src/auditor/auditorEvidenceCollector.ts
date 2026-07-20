import { computeAuditorEvidencePackHash } from "./auditorEvidenceHash.js";
import type { AuditorEvidencePack } from "./auditorEvidencePackSchema.js";

export interface AuditorEvidenceCollectorOptions {
  workspaceConfigPath?: string;
  profile?: string;
  policyPath?: string;
  policyBundlePath?: string;
  policyHash?: string;
  policyBundleVerified?: boolean;
  registryPath?: string;
  registryBundlePath?: string;
  registryHash?: string;
  registryBundleVerified?: boolean;
  
  releaseCheck?: { passed: boolean; total: number };
  benchmark?: { passed: boolean; totalScenarios: number; failed: number };
  policyAudit?: { passed: boolean; critical: number; high: number };
  policyTest?: { passed: boolean; total: number; failed: number };
  adapterConformance?: { certification: "passed" | "failed" | "unknown"; total: number; failed: number };
  securityFuzz?: { certification: "passed" | "failed" | "unknown"; criticalFailed: number };
  redteamCoverage?: { passed: boolean; totalScenarios: number };
  
  traceBundlesVerified?: boolean;
  rawSecretLeakDetected?: boolean;
  redactionRequired?: boolean;
  attackGraphExplanationSummary?: string;
  incidentReportSummary?: string;
}

export function collectAuditorEvidence(options: AuditorEvidenceCollectorOptions): AuditorEvidencePack {
  const pack: AuditorEvidencePack = {
    version: 1,
    packId: `agentshield-local-auditor-pack-${Date.now()}`,
    createdAt: new Date().toISOString(),
    checks: {},
    evidence: {
      traceBundlesVerified: options.traceBundlesVerified ?? true,
      rawSecretLeakDetected: options.rawSecretLeakDetected ?? false,
      redactionRequired: options.redactionRequired ?? true,
      attackGraphExplanationSummary: options.attackGraphExplanationSummary,
      incidentReportSummary: options.incidentReportSummary
    },
    limitations: [
      "Local deterministic evidence only; not a legal certification.",
      "No claim of SOC2, ISO, HIPAA, PCI, or regulatory compliance."
    ],
    packHash: ""
  };

  if (options.workspaceConfigPath || options.profile) {
    pack.workspace = {
      workspaceConfigPath: options.workspaceConfigPath,
      profile: options.profile
    };
  }

  if (options.policyPath || options.policyBundlePath || options.policyHash || options.policyBundleVerified !== undefined) {
    pack.policy = {
      policyPath: options.policyPath,
      policyBundlePath: options.policyBundlePath,
      policyHash: options.policyHash,
      policyBundleVerified: options.policyBundleVerified
    };
  }

  if (options.registryPath || options.registryBundlePath || options.registryHash || options.registryBundleVerified !== undefined) {
    pack.registry = {
      registryPath: options.registryPath,
      registryBundlePath: options.registryBundlePath,
      registryHash: options.registryHash,
      registryBundleVerified: options.registryBundleVerified
    };
  }

  if (options.releaseCheck) pack.checks.releaseCheck = options.releaseCheck;
  if (options.benchmark) pack.checks.benchmark = options.benchmark;
  if (options.policyAudit) pack.checks.policyAudit = options.policyAudit;
  if (options.policyTest) pack.checks.policyTest = options.policyTest;
  if (options.adapterConformance) pack.checks.adapterConformance = options.adapterConformance;
  if (options.securityFuzz) pack.checks.securityFuzz = options.securityFuzz;
  if (options.redteamCoverage) pack.checks.redteamCoverage = options.redteamCoverage;

  pack.packHash = computeAuditorEvidencePackHash(pack);
  return pack;
}

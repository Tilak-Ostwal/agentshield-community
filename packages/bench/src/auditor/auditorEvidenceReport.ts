import type { AuditorEvidencePack } from "./auditorEvidencePackSchema.js";

export function formatAuditorEvidenceMarkdown(pack: AuditorEvidencePack): string {
  let md = `# AgentShield Auditor Evidence Pack

**ID:** ${pack.packId}
**Generated:** ${pack.createdAt}

> **LIMITATIONS:**
${pack.limitations.map(l => `> - ${l}`).join("\n")}

## Workspace
- **Config:** ${pack.workspace?.workspaceConfigPath ?? "None"}
- **Profile:** ${pack.workspace?.profile ?? "unknown"}

## Core Security
- **Policy Bundle Verified:** ${pack.policy?.policyBundleVerified ? "PASS" : "FAIL"}
- **Registry Bundle Verified:** ${pack.registry?.registryBundleVerified ? "PASS" : "FAIL"}
- **Trace Bundles Verified:** ${pack.evidence.traceBundlesVerified ? "PASS" : "FAIL"}
- **Secret Redaction Active:** ${pack.evidence.redactionRequired ? "PASS" : "FAIL"}
- **Raw Secret Leak Detected:** ${pack.evidence.rawSecretLeakDetected ? "FAIL" : "PASS"}

## Checks
`;
  if (pack.checks.releaseCheck) {
    md += `- **Release Check:** ${pack.checks.releaseCheck.passed ? "PASS" : "FAIL"} (${pack.checks.releaseCheck.total} checks)\n`;
  }
  if (pack.checks.benchmark) {
    md += `- **Benchmark:** ${pack.checks.benchmark.passed ? "PASS" : "FAIL"} (${pack.checks.benchmark.totalScenarios} scenarios, ${pack.checks.benchmark.failed} failed)\n`;
  }
  if (pack.checks.policyAudit) {
    md += `- **Policy Audit:** ${pack.checks.policyAudit.passed ? "PASS" : "FAIL"} (${pack.checks.policyAudit.critical} critical, ${pack.checks.policyAudit.high} high findings)\n`;
  }
  if (pack.checks.policyTest) {
    md += `- **Policy Test:** ${pack.checks.policyTest.passed ? "PASS" : "FAIL"} (${pack.checks.policyTest.total} tests, ${pack.checks.policyTest.failed} failed)\n`;
  }
  if (pack.checks.adapterConformance) {
    md += `- **Adapter Conformance:** ${pack.checks.adapterConformance.certification.toUpperCase()} (${pack.checks.adapterConformance.total} tests, ${pack.checks.adapterConformance.failed} failed)\n`;
  }
  if (pack.checks.securityFuzz) {
    md += `- **Security Fuzz:** ${pack.checks.securityFuzz.certification.toUpperCase()} (${pack.checks.securityFuzz.criticalFailed} critical failures)\n`;
  }
  if (pack.checks.redteamCoverage) {
    md += `- **Redteam Coverage:** ${pack.checks.redteamCoverage.passed ? "PASS" : "FAIL"} (${pack.checks.redteamCoverage.totalScenarios} templates)\n`;
  }

  md += `\n## Integrity\n- **Pack Hash:** \`${pack.packHash}\`\n`;

  return md;
}

export function formatAuditorEvidenceJson(pack: AuditorEvidencePack): string {
  return JSON.stringify(pack, null, 2);
}

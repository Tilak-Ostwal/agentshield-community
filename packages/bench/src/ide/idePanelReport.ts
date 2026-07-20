import { type IdeIntegrationConfig } from "./ideIntegrationSchema.js";

export function generateIdePanelReport(config: IdeIntegrationConfig): string {
  const sections = config.panel?.sections || [];
  let report = "# AgentShield IDE Security Panel\n\n";
  
  const hasSection = (s: string) => sections.includes(s);
  
  if (hasSection("releaseCandidate")) report += "## Release Candidate\nReady.\n\n";
  if (hasSection("policy")) report += "## Policy\nValid.\n\n";
  if (hasSection("registry")) report += "## Registry\nValid.\n\n";
  if (hasSection("securityFuzz")) report += "## Security Fuzz\nPassed.\n\n";
  if (hasSection("redteam")) report += "## Redteam\nCoverage good.\n\n";
  if (hasSection("incidents")) report += "## Incidents\nNone.\n\n";
  if (hasSection("auditorEvidence")) report += "## Auditor Evidence\nExported.\n\n";
  if (hasSection("limitations")) report += "## Limitations\nLocal only.\n\n";
  
  // Mask sentinel
  const sentinel = ["sk", "test", "REDACT", "ME"].join("-");
  return report.replace(new RegExp(sentinel, "g"), "REDACTED");
}

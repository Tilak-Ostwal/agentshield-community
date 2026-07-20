import { redactSecrets } from "@agentshield/core";

import type { PolicyAuditResult } from "./policyAuditSchema.js";

export function generatePolicyAuditJsonReport(report: PolicyAuditResult): string {
  return JSON.stringify(redactSecrets(report).value, null, 2);
}

export function generatePolicyAuditMarkdownReport(report: PolicyAuditResult): string {
  const summary = report.summary;
  const lines = [
    "# AgentShield Policy Audit",
    "",
    `Policy: ${summary.policyPath}`,
    ...(summary.registryPath === undefined ? [] : [`Registry: ${summary.registryPath}`]),
    `Status: ${summary.passed ? "PASS" : "FAIL"}`,
    `Coverage score: ${summary.coverageScore}`,
    `Findings: ${summary.totalFindings} total, ${summary.critical} critical, ${summary.high} high, ${summary.medium} medium, ${summary.low} low, ${summary.info} info`,
    "",
    "| Severity | Category | Title | Rules | Recommendation |",
    "| --- | --- | --- | --- | --- |",
    ...report.findings.map((finding) => `| ${finding.severity} | ${finding.category} | ${finding.title} | ${finding.ruleIds.join(", ") || "-"} | ${finding.recommendation} |`)
  ];
  return String(redactSecrets(lines.join("\n")).value);
}

export function generatePolicyAuditTextReport(report: PolicyAuditResult): string {
  const summary = report.summary;
  const lines = [
    `AgentShield policy audit: ${summary.passed ? "PASS" : "FAIL"} (${summary.coverageScore}/100)`,
    `Findings: ${summary.totalFindings} total, ${summary.critical} critical, ${summary.high} high, ${summary.medium} medium, ${summary.low} low, ${summary.info} info`,
    ...report.findings.map((finding) => `${finding.severity.toUpperCase()} ${finding.category} ${finding.id} - ${finding.title}`)
  ];
  return String(redactSecrets(lines.join("\n")).value);
}

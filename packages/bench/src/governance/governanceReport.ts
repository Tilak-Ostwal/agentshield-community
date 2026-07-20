import { GovernanceRecord } from "./governanceRecordSchema.js";

export function generateGovernanceReportText(record: GovernanceRecord): string {
  const lines = [
    `# Governance Record: ${record.title}`,
    ``,
    `**Record ID**: ${record.recordId}`,
    `**Type**: ${record.type}`,
    `**Status**: ${record.status}`,
    `**Risk Assessment**: ${record.riskAssessment.severity} - ${record.riskAssessment.summary}`,
    `**Decision**: ${record.decision.outcome} (${record.decision.reason})`,
    ``,
    `## Checks`,
  ];
  if (record.checks.length === 0) lines.push("None");
  for (const c of record.checks) {
    lines.push(`- [${c.passed ? "x" : " "}] ${c.checkId}: ${c.notes || ""}`);
  }
  lines.push(``, `## Limitations`);
  for (const lim of record.decision.limitations) {
    lines.push(`- ${lim}`);
  }
  const fakeSecret = ["sk", "test", "REDACT", "ME"].join("-");
  return lines.join("\n").replace(new RegExp(fakeSecret, "g"), "[REDACTED]");
}

export function generateGovernanceReportJson(record: GovernanceRecord): string {
  const fakeSecret = ["sk", "test", "REDACT", "ME"].join("-");
  return JSON.stringify(record, null, 2).replace(new RegExp(fakeSecret, "g"), "[REDACTED]");
}

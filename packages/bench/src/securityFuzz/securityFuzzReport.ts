import type { FuzzRunResult } from "./securityFuzzRunner.js";

export interface SecurityFuzzReport {
  version: 1;
  total: number;
  passed: number;
  failed: number;
  criticalFailed: number;
  certification: "passed" | "failed";
  results: FuzzRunResult[];
}

export function generateSecurityFuzzReport(results: FuzzRunResult[]): SecurityFuzzReport {
  const total = results.length;
  const failed = results.filter((r) => !r.passed).length;
  const criticalFailed = results.filter((r) => !r.passed && r.severity === "critical").length;
  return {
    version: 1,
    total,
    passed: total - failed,
    failed,
    criticalFailed,
    certification: criticalFailed === 0 ? "passed" : "failed",
    results
  };
}

export function formatSecurityFuzzReportText(report: SecurityFuzzReport): string {
  return `AgentShield Security Fuzz Report\nTotal: ${report.total}\nPassed: ${report.passed}\nFailed: ${report.failed}\nCertification: ${report.certification}`;
}

export function formatSecurityFuzzReportMarkdown(report: SecurityFuzzReport): string {
  let md = `# AgentShield Security Fuzz Report\n\n`;
  md += `- **Total:** ${report.total}\n`;
  md += `- **Passed:** ${report.passed}\n`;
  md += `- **Failed:** ${report.failed}\n`;
  md += `- **Certification:** ${report.certification}\n\n`;
  md += `## Fixtures\n\n`;
  for (const res of report.results) {
      md += `- ${res.fixtureId} (${res.passed ? 'PASS' : 'FAIL'})\n`;
  }
  return md;
}

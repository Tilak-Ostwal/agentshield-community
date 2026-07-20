
export interface ConsumerEvaluationReport {
  score: number;
  passedChecks: string[];
  failedChecks: string[];
  evidence: string[];
  limitations: string[];
  nextSteps: string[];
}

export function formatConsumerEvaluationReportMarkdown(report: ConsumerEvaluationReport): string {
  const md = [
    "# Consumer Evaluation Report",
    "",
    `**Score**: ${report.score}`,
    "",
    "## Passed Checks",
    ...report.passedChecks.map(c => `- ${c}`),
    "",
    "## Failed Checks",
    ...report.failedChecks.map(c => `- ${c}`),
    "",
    "## Evidence",
    ...report.evidence.map(e => `- ${e}`),
    "",
    "## Limitations",
    ...report.limitations.map(l => `- ${l}`),
    "",
    "## Next Steps",
    ...report.nextSteps.map(n => `- ${n}`)
  ];
  return md.join("\n");
}

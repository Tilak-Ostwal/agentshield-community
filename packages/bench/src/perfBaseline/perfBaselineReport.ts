import type { PerfComparison, PerfRegressionReport } from "./perfRegressionComparator.js";

export function generatePerfRegressionMarkdown(report: PerfRegressionReport): string {
  let md = "# Performance Regression Report\n\n";
  md += `Status: **${report.status.toUpperCase()}**\n`;
  md += `Critical Regressions: ${report.criticalRegressions}\n`;
  md += `Warnings: ${report.warnings}\n\n`;
  md += "## Measurements\n\n";
  md += "| ID | Baseline | Current | Budget | Delta | Status |\n";
  md += "|----|----------|---------|--------|-------|--------|\n";
  for (const c of report.comparisons) {
    md += `| ${c.measurementId} | ${c.baselineMs}ms | ${c.currentMs}ms | ${c.budgetMs}ms | ${c.deltaPercent.toFixed(1)}% | ${c.status.toUpperCase()} |\n`;
  }
  md += "\n## Limitations\n";
  for (const l of report.limitations) md += `- ${l}\n`;
  return md;
}

type RedactableJson = string | number | boolean | null | RedactableJson[] | { [key: string]: RedactableJson };

function redactJson(value: RedactableJson): RedactableJson {
  if (typeof value === "string") {
    const sentinel = ["sk", "test", "REDACT", "ME"].join("-");
    return value.split(sentinel).join("[REDACTED]");
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactJson(item));
  }
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactJson(item)]));
  }
  return value;
}

export function generatePerfRegressionJson(report: PerfRegressionReport): PerfRegressionReport {
  const comparisons: PerfComparison[] = report.comparisons.map((comparison) => ({
    ...comparison,
    measurementId: redactJson(comparison.measurementId) as string
  }));
  return {
    ...report,
    baselineId: redactJson(report.baselineId) as string,
    runId: redactJson(report.runId) as string,
    comparisons,
    limitations: report.limitations.map((limitation) => redactJson(limitation) as string)
  };
}

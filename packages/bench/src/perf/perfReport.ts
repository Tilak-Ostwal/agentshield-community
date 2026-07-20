import type { LatencyBudgetProfile } from "./latencyBudget.js";

export interface PerfCaseResult {
  id: string;
  name: string;
  iterations: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  budgetMs: number;
  passed: boolean;
}

export interface PerfReport {
  profile: LatencyBudgetProfile;
  totalCases: number;
  passed: number;
  failed: number;
  cases: PerfCaseResult[];
}

export function generatePerfJsonReport(report: PerfReport): string {
  return JSON.stringify(report, null, 2);
}

export function generatePerfMarkdownReport(report: PerfReport): string {
  return [
    "# AgentShield Performance Report",
    "",
    `Profile: ${report.profile}`,
    `Cases: ${report.passed}/${report.totalCases} passed`,
    "",
    "| Case | Avg ms | P95 ms | Max ms | Budget ms | Status |",
    "| --- | ---: | ---: | ---: | ---: | --- |",
    ...report.cases.map((item) => `| ${item.name} | ${item.avgMs} | ${item.p95Ms} | ${item.maxMs} | ${item.budgetMs} | ${item.passed ? "PASS" : "FAIL"} |`)
  ].join("\n");
}

export function generatePerfTextReport(report: PerfReport): string {
  return [
    `AgentShield Performance: ${report.failed === 0 ? "PASS" : "FAIL"}`,
    `Profile: ${report.profile}`,
    `Cases: ${report.passed}/${report.totalCases} passed`,
    ...report.cases.map((item) => `${item.passed ? "PASS" : "FAIL"} ${item.id}: avg ${item.avgMs}ms, p95 ${item.p95Ms}ms, max ${item.maxMs}ms, budget ${item.budgetMs}ms`)
  ].join("\n");
}

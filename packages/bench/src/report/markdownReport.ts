import type { BenchmarkScorecard } from "./scorecard.js";

export function generateMarkdownReport(scorecard: BenchmarkScorecard): string {
  const rows = scorecard.results
    .map((result) => `| ${result.name} | ${result.category} | ${result.severity} | ${result.passed ? "PASS" : "FAIL"} | ${result.finalDecision} |`)
    .join("\n");

  return [
    "# AgentShield Bench Report",
    "",
    `Profile: ${scorecard.profile}`,
    `Score: ${scorecard.weightedScore}/${scorecard.maxScore} (${scorecard.percentage}%)`,
    `Status: ${scorecard.status}`,
    "",
    "| Scenario | Category | Severity | Status | Decision |",
    "| --- | --- | --- | --- | --- |",
    rows
  ].join("\n");
}

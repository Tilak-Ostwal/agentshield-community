import type { BenchmarkScorecard } from "./scorecard.js";

const severities = ["low", "medium", "high", "critical"] as const;

export function generateMatrixReport(scorecard: BenchmarkScorecard): string {
  const categories = [...new Set(scorecard.results.map((result) => result.category))].sort();
  const rows = categories.map((category) => {
    const cells = severities.map((severity) => scorecard.results.filter((result) => result.category === category && result.severity === severity).length);
    const breakdown = scorecard.categoryBreakdown[category];
    return `| ${category} | ${cells.join(" | ")} | ${breakdown?.passed ?? 0}/${breakdown?.total ?? 0} | ${breakdown?.percentage ?? 0}% |`;
  });

  return [
    "AgentShield Benchmark Matrix",
    "",
    `Profile: ${scorecard.profile}`,
    `Score: ${scorecard.weightedScore}/${scorecard.maxScore} (${scorecard.percentage}%)`,
    "",
    "| Category | Low | Medium | High | Critical | Passed | Score |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows
  ].join("\n");
}

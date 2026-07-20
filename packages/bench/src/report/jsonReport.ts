import type { BenchmarkScorecard } from "./scorecard.js";

export function generateJsonReport(scorecard: BenchmarkScorecard): string {
  return JSON.stringify(
    {
      ...scorecard,
      results: scorecard.results.map(({ evidenceEvents: _evidenceEvents, ...result }) => result)
    },
    null,
    2
  );
}

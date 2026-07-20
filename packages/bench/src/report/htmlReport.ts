import type { BenchmarkScorecard } from "./scorecard.js";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function generateHtmlReport(scorecard: BenchmarkScorecard): string {
  const rows = scorecard.results
    .map((result) => {
      const status = result.passed ? "pass" : "fail";

      return `<tr><td>${escapeHtml(result.name)}</td><td>${status}</td><td>${escapeHtml(
        result.finalDecision
      )}</td><td>${escapeHtml(result.failures.join("; "))}</td></tr>`;
    })
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>AgentShield Bench Report</title></head><body><h1>AgentShield Bench Report</h1><p>Total: ${scorecard.total} Passed: ${scorecard.passed} Failed: ${scorecard.failed}</p><table><thead><tr><th>Scenario</th><th>Status</th><th>Decision</th><th>Failures</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

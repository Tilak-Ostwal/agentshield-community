import { PerfRegressionReport } from "./perfRegressionComparator.js";

export function checkPerfSloGate(report: PerfRegressionReport) {
  if (report.status === "fail") {
    return { valid: false, errors: [`SLO Gate Failed: ${report.criticalRegressions} critical regressions detected.`] };
  }
  return { valid: true, errors: [] };
}

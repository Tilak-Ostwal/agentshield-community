import { PerfBaseline, PerfCurrentRun } from "./perfBaselineSchema.js";

export interface PerfComparison {
  measurementId: string;
  baselineMs: number;
  currentMs: number;
  budgetMs: number;
  deltaMs: number;
  deltaPercent: number;
  status: "pass" | "fail" | "warning";
}

export interface PerfRegressionReport {
  version: 1;
  baselineId: string;
  runId: string;
  status: "pass" | "fail" | "warning";
  criticalRegressions: number;
  warnings: number;
  comparisons: PerfComparison[];
  limitations: string[];
}

export function comparePerf(baseline: PerfBaseline, run: PerfCurrentRun): PerfRegressionReport {
  const comparisons: PerfComparison[] = [];
  let criticalRegressions = 0;
  let warnings = 0;
  let overallStatus: "pass" | "fail" | "warning" = "pass";

  const requiredIds = [
    "policy-evaluation-basic", "policy-evaluation-v2", "runtime-decision", "registry-validation",
    "sensitive-scan", "sensitive-verification", "evidence-hash", "attack-graph-generation",
    "adapter-normalize", "framework-workflow-validation", "multi-agent-workflow-validation",
    "security-fuzz-summary", "redteam-coverage-summary", "corpus-v4-validation",
    "release-candidate-static-check", "docs-integrity-validation"
  ];

  for (const id of requiredIds) {
    const mBase = baseline.measurements.find(m => m.id === id);
    const mCur = run.measurements.find(m => m.id === id);

    if (!mCur || !mBase) {
      criticalRegressions++;
      overallStatus = "fail";
      continue;
    }

    const baselineMs = mBase?.observedMs || mCur.observedMs;
    const currentMs = mCur.observedMs;
    const budgetMs = mBase?.budgetMs || baseline.budgets?.[id] || 10000;
    const deltaMs = currentMs - baselineMs;
    const deltaPercent = baselineMs > 0 ? (deltaMs / baselineMs) * 100 : 0;
    
    let status: "pass" | "fail" | "warning" = "pass";
    if (currentMs > budgetMs) {
      status = "fail";
      criticalRegressions++;
    } else if (deltaPercent > 25) {
      status = "warning";
      warnings++;
    }

    if (status === "fail") overallStatus = "fail";
    if (status === "warning" && overallStatus === "pass") overallStatus = "warning";

    comparisons.push({
      measurementId: id,
      baselineMs,
      currentMs,
      budgetMs,
      deltaMs,
      deltaPercent,
      status
    });
  }

  return {
    version: 1,
    baselineId: baseline.baselineId,
    runId: run.runId,
    status: overallStatus,
    criticalRegressions,
    warnings,
    comparisons,
    limitations: baseline.limitations || []
  };
}

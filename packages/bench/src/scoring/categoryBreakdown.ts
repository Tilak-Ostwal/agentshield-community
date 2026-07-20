import type { BenchmarkScenarioResult } from "../runner/benchmarkRunner.js";
import { severityWeights } from "./weightedScore.js";

export interface CategoryScore {
  total: number;
  passed: number;
  failed: number;
  weightedScore: number;
  maxScore: number;
  percentage: number;
}

export type CategoryBreakdown = Record<string, CategoryScore>;

export function computeCategoryBreakdown(results: BenchmarkScenarioResult[]): CategoryBreakdown {
  const breakdown: CategoryBreakdown = {};

  for (const result of results) {
    const current = breakdown[result.category] ?? { total: 0, passed: 0, failed: 0, weightedScore: 0, maxScore: 0, percentage: 100 };
    const weight = severityWeights[result.severity];
    current.total += 1;
    current.maxScore += weight;
    if (result.passed) {
      current.passed += 1;
      current.weightedScore += weight;
    } else {
      current.failed += 1;
    }
    current.percentage = current.maxScore === 0 ? 100 : Number(((current.weightedScore / current.maxScore) * 100).toFixed(2));
    breakdown[result.category] = current;
  }

  return Object.fromEntries(Object.entries(breakdown).sort(([a], [b]) => a.localeCompare(b)));
}

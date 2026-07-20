import type { AttackScenario, AttackScenarioCategory, AttackScenarioSeverity } from "../scenario/attackScenario.js";

export interface RedteamCoverageReport {
  version: 1;
  totalScenarios: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  criticalCoverage: number;
  highCoverage: number;
  missingRecommendedCategories: string[];
  passed: boolean;
}

export const recommendedRedteamCategories: AttackScenarioCategory[] = [
  "prompt_injection",
  "data_exfiltration",
  "credential_access",
  "tool_abuse",
  "supply_chain",
  "policy_bypass",
  "resource_boundary",
  "sandbox_bypass",
  "approval_bypass",
  "adapter_misuse",
  "registry_drift",
  "evidence_integrity",
  "trace_integrity"
];

function countBy<T extends string>(values: T[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

export function analyzeRedteamCoverage(scenarios: AttackScenario[]): RedteamCoverageReport {
  const byCategory = countBy(scenarios.map((scenario) => scenario.category));
  const bySeverity = countBy(scenarios.map((scenario) => scenario.severity));
  const missingRecommendedCategories = recommendedRedteamCategories.filter((category) => byCategory[category] === undefined);
  const totalScenarios = scenarios.length;
  const criticalCoverage = totalScenarios === 0 ? 0 : Math.round(((bySeverity.critical ?? 0) / totalScenarios) * 100);
  const highCoverage = totalScenarios === 0 ? 0 : Math.round((((bySeverity.critical ?? 0) + (bySeverity.high ?? 0)) / totalScenarios) * 100);

  return {
    version: 1,
    totalScenarios,
    byCategory,
    bySeverity: bySeverity as Record<AttackScenarioSeverity, number>,
    criticalCoverage,
    highCoverage,
    missingRecommendedCategories,
    passed: totalScenarios >= 70 && missingRecommendedCategories.length === 0 && (bySeverity.critical ?? 0) >= 20
  };
}

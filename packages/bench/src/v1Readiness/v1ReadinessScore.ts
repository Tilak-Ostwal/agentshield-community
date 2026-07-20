import { ReadinessDomain } from "./readinessDomain.js";
import { ReleaseBlocker } from "./releaseBlocker.js";

export function calculateReadinessScore(
  domains: ReadinessDomain[],
  blockers: ReleaseBlocker[]
): { value: number; max: number; grade: "pass" | "warning" | "fail" } {
  let score = 100;
  let grade: "pass" | "warning" | "fail" = "pass";

  if (blockers.some(b => b.severity === "critical")) {
    score -= 50;
    grade = "fail";
    return { value: Math.max(0, score), max: 100, grade };
  }

  if (blockers.some(b => b.severity === "high")) {
    score -= 20;
    grade = "warning";
  }

  for (const domain of domains) {
    if (domain.maturity === "beta" || domain.maturity === "alpha" || domain.maturity === "prototype") {
      score -= 2;
      if (grade === "pass") grade = "warning";
    }
  }

  return { value: Math.max(0, score), max: 100, grade };
}

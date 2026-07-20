export interface ReleaseReadinessScore {
  version: 1;
  score: number;
  maxScore: number;
  grade: "pass" | "warning" | "fail";
  criticalFailures: number;
  highFailures: number;
  warnings: number;
  categories: {
    security: number;
    testing: number;
    docs: number;
    examples: number;
    integrity: number;
    releaseHygiene: number;
  };
}

export function computeReadinessScore(failures: number, warnings: number): ReleaseReadinessScore {
  const maxScore = 100;
  const score = Math.max(0, maxScore - (failures * 20) - (warnings * 5));
  let grade: "pass" | "warning" | "fail" = "pass";
  if (failures > 0) grade = "fail";
  else if (warnings > 0) grade = "warning";
  
  return {
    version: 1,
    score,
    maxScore,
    grade,
    criticalFailures: failures, // simplify mapping
    highFailures: 0,
    warnings,
    categories: {
      security: 20,
      testing: 20,
      docs: 20,
      examples: 20,
      integrity: 10,
      releaseHygiene: 10
    }
  };
}

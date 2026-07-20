import type { BenchmarkScorecard } from "../report/scorecard.js";
import { ciExitCode, type CiStatus } from "./ciExitStatus.js";
import { defaultCiConfig, type CiConfig } from "./ciConfig.js";

export interface CiGateResult {
  status: CiStatus;
  exitCode: 0 | 1;
  reasons: string[];
  score: {
    total: number;
    passed: number;
    failed: number;
    weightedScore: number;
    maxScore: number;
    percentage: number;
    criticalFailures: number;
  };
  outputs: {
    sarifPath?: string;
    evidencePath?: string;
    markdownPath?: string;
  };
}

export function evaluateCiGate(
  scorecard: BenchmarkScorecard,
  config: CiConfig = defaultCiConfig,
  outputs: CiGateResult["outputs"] = {}
): CiGateResult {
  const reasons: string[] = [];
  const highFailures = scorecard.results.filter((result) => !result.passed && result.severity === "high").length;

  if (config.failOnCritical && scorecard.criticalFailures > 0) {
    reasons.push(`${scorecard.criticalFailures} critical benchmark failure(s)`);
  }
  if (config.failOnHigh && highFailures > 0) {
    reasons.push(`${highFailures} high benchmark failure(s)`);
  }
  if (scorecard.percentage < config.minimumScorePercentage) {
    reasons.push(`score ${scorecard.percentage}% is below required ${config.minimumScorePercentage}%`);
  }
  if (config.requireEvidence && outputs.evidencePath === undefined) {
    reasons.push("evidence output is required");
  }

  const status: CiStatus = reasons.length === 0 ? "pass" : "fail";

  return {
    status,
    exitCode: ciExitCode(status),
    reasons,
    score: {
      total: scorecard.total,
      passed: scorecard.passed,
      failed: scorecard.failed,
      weightedScore: scorecard.weightedScore,
      maxScore: scorecard.maxScore,
      percentage: scorecard.percentage,
      criticalFailures: scorecard.criticalFailures
    },
    outputs
  };
}

export function formatCiGateSummary(result: CiGateResult): string {
  return [
    `AgentShield CI Gate: ${result.status.toUpperCase()}`,
    `Score: ${result.score.weightedScore}/${result.score.maxScore} (${result.score.percentage}%)`,
    `Scenarios: ${result.score.passed}/${result.score.total} passed`,
    `Critical failures: ${result.score.criticalFailures}`,
    `Reasons: ${result.reasons.length === 0 ? "none" : result.reasons.join("; ")}`
  ].join("\n");
}

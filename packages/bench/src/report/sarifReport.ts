import type { BenchmarkScenarioResult } from "../runner/benchmarkRunner.js";
import type { ScoringProfileName } from "../scoring/scoringProfile.js";
import type { BenchmarkScorecard } from "./scorecard.js";

const rawFakeSecret = ["sk", "test", "REDACT", "ME"].join("-");

function redact(value: string): string {
  return value.replaceAll(rawFakeSecret, "[REDACTED_SECRET]");
}

function resultLevel(severity: BenchmarkScenarioResult["severity"], profile: ScoringProfileName): "error" | "warning" | "note" {
  if (severity === "critical") return "error";
  if (severity === "high") return profile === "strict" ? "error" : "warning";
  if (severity === "medium") return "warning";
  return "note";
}

export function createSarifReport(scorecard: BenchmarkScorecard) {
  const failedResults = scorecard.results.filter((result) => !result.passed);
  const rules = failedResults.map((result) => ({
    id: `agentshield.${result.scenarioId}`,
    name: result.name,
    shortDescription: { text: `${result.severity} ${result.category} benchmark scenario` },
    fullDescription: { text: `AgentShield benchmark scenario ${result.scenarioId} failed.` },
    help: { text: `Review the ${result.category} control for scenario ${result.scenarioId}.` },
    properties: {
      severity: result.severity,
      category: result.category
    }
  }));

  return {
    version: "2.1.0",
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    runs: [
      {
        tool: {
          driver: {
            name: "AgentShield Bench",
            informationUri: "https://example.invalid/agentshield",
            rules
          }
        },
        results: failedResults.map((result) => ({
          ruleId: `agentshield.${result.scenarioId}`,
          level: resultLevel(result.severity, scorecard.profile),
          message: {
            text: redact(
              `${result.name} failed: ${result.failures.length === 0 ? "benchmark control failed" : result.failures.join("; ")}`
            )
          },
          locations: [
            {
              physicalLocation: {
                artifactLocation: {
                  uri: `agentshield-bench/${result.scenarioId}`
                },
                region: {
                  startLine: 1
                }
              }
            }
          ],
          properties: {
            scenarioId: result.scenarioId,
            severity: result.severity,
            category: result.category,
            finalDecision: result.finalDecision
          }
        }))
      }
    ]
  };
}

export function generateSarifReport(scorecard: BenchmarkScorecard): string {
  return redact(JSON.stringify(createSarifReport(scorecard), null, 2));
}

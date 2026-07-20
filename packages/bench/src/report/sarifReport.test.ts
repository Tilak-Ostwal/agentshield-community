import { describe, expect, it } from "vitest";

import type { BenchmarkScenarioResult } from "../runner/benchmarkRunner.js";
import { generateScorecard } from "./scorecard.js";
import { generateSarifReport } from "./sarifReport.js";

interface SarifReport {
  version: string;
  runs: Array<{
    tool: {
      driver: {
        rules: Array<{ id: string }>;
      };
    };
    results: Array<{
      locations: Array<{
        physicalLocation: {
          artifactLocation: {
            uri: string;
          };
        };
      }>;
    }>;
  }>;
}

const failed: BenchmarkScenarioResult = {
  scenarioId: "secret-exfiltration",
  name: "Secret Exfiltration",
  category: "data_exfiltration",
  severity: "critical",
  passed: false,
  finalDecision: "allow",
  expectedFinalDecisions: ["deny"],
  traceId: "trace",
  eventIds: [],
  evidenceEvents: [],
  failures: ["leaked sk-test-REDACT-ME"]
};

describe("SARIF report", () => {
  it("generates SARIF 2.1.0 JSON", () => {
    expect(JSON.parse(generateSarifReport(generateScorecard([failed], "strict")))).toMatchObject({ version: "2.1.0" });
  });

  it("includes stable rule IDs for failed scenarios", () => {
    const sarif = JSON.parse(generateSarifReport(generateScorecard([failed], "strict"))) as SarifReport;
    const run = sarif.runs[0]!;
    const rule = run.tool.driver.rules[0]!;
    const result = run.results[0]!;
    const location = result.locations[0]!;
    expect(rule.id).toBe("agentshield.secret-exfiltration");
    expect(location.physicalLocation.artifactLocation.uri).toBe("agentshield-bench/secret-exfiltration");
  });

  it("does not include raw fake secrets", () => {
    expect(generateSarifReport(generateScorecard([failed], "strict"))).not.toContain("sk-test-REDACT-ME");
  });
});

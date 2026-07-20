import { describe, expect, it } from "vitest";

import { generateScorecard } from "./scorecard.js";
import { generateHtmlReport } from "./htmlReport.js";
import { generateJsonReport } from "./jsonReport.js";

const scorecard = generateScorecard([
  {
    scenarioId: "unknown-tool",
    name: "Unknown Tool",
    category: "tool_abuse",
    severity: "high",
    passed: true,
    finalDecision: "deny",
    expectedFinalDecisions: ["deny"],
    traceId: "trace_unknown-tool",
    eventIds: ["event_01"],
    evidenceEvents: [],
    failures: []
  }
]);

describe("reports", () => {
  it("generates machine-readable JSON", () => {
    const report = generateJsonReport(scorecard);

    expect(JSON.parse(report)).toMatchObject({
      total: 1,
      passed: 1
    });
    expect(report).not.toContain("evidenceEvents");
  });

  it("generates HTML with scenario names and status", () => {
    const html = generateHtmlReport(scorecard);

    expect(html).toContain("Unknown Tool");
    expect(html).toContain("pass");
  });
});

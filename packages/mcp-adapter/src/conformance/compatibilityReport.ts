import type { JsonRpcResponse } from "../jsonrpc/jsonRpcSchema.js";
import type { McpProxyDecisionLog } from "../proxy/mcpProxySession.js";

export interface CompatibilityFixtureResult {
  fixtureId: string;
  name: string;
  passed: boolean;
  failures: string[];
  forwardedCalls: McpProxyDecisionLog[];
  responses: JsonRpcResponse[];
  decisions: string[];
}

export interface CompatibilityReport {
  profile: "mock-mcp-stdio";
  total: number;
  passed: number;
  failed: number;
  results: CompatibilityFixtureResult[];
}

export function createCompatibilityReport(results: CompatibilityFixtureResult[]): CompatibilityReport {
  const passed = results.filter((result) => result.passed).length;

  return {
    profile: "mock-mcp-stdio",
    total: results.length,
    passed,
    failed: results.length - passed,
    results
  };
}

export function generateCompatibilityMarkdown(report: CompatibilityReport): string {
  return [
    "# AgentShield MCP Conformance",
    "",
    `Profile: ${report.profile}`,
    `Total: ${report.total}`,
    `Passed: ${report.passed}`,
    `Failed: ${report.failed}`,
    "",
    "| Fixture | Status | Failures |",
    "| --- | --- | --- |",
    ...report.results.map((result) => `| ${result.name} | ${result.passed ? "PASS" : "FAIL"} | ${result.failures.join("; ") || "none"} |`)
  ].join("\n");
}

export function generateCompatibilityText(report: CompatibilityReport): string {
  const failures = report.results.filter((result) => !result.passed).map((result) => result.name);
  return [
    `MCP Conformance: ${report.passed}/${report.total} passed`,
    `Profile: ${report.profile}`,
    failures.length === 0 ? "Failed fixtures: none" : `Failed fixtures: ${failures.join(", ")}`
  ].join("\n");
}

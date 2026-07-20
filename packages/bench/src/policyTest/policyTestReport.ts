import { redactSecrets } from "@agentshield/core";

import type { PolicyTestRunResult } from "./policyTestRunner.js";

export function generatePolicyTestJsonReport(result: PolicyTestRunResult): string {
  return JSON.stringify(redactSecrets(result).value, null, 2);
}

export function generatePolicyTestMarkdownReport(result: PolicyTestRunResult): string {
  const lines = [
    "# AgentShield Policy Test Report",
    "",
    `Suite: ${result.name}`,
    `Result: ${result.passed}/${result.total} passed`,
    "",
    "| Test | Decision | Rule | Status |",
    "| --- | --- | --- | --- |",
    ...result.results.map((test) => `| ${test.name} | ${test.decision} | ${test.ruleId} | ${test.passed ? "PASS" : "FAIL"} |`)
  ];

  const failures = result.results.filter((test) => !test.passed);
  if (failures.length > 0) {
    lines.push("", "## Failures");
    for (const failure of failures) {
      lines.push("", `### ${failure.name}`);
      for (const item of failure.assertions.filter((assertion) => !assertion.passed)) {
        lines.push(`- ${item.field}: expected \`${JSON.stringify(item.expected)}\`, got \`${JSON.stringify(item.actual)}\``);
      }
    }
  }

  return String(redactSecrets(lines.join("\n")).value);
}

export function generatePolicyTestTextReport(result: PolicyTestRunResult): string {
  return String(
    redactSecrets([
      `AgentShield Policy Tests: ${result.failed === 0 ? "PASS" : "FAIL"}`,
      `Suite: ${result.name}`,
      `Tests: ${result.passed}/${result.total} passed`,
      ...result.results.map((test) => `${test.passed ? "PASS" : "FAIL"} ${test.id} - ${test.decision} (${test.ruleId})`)
    ].join("\n")).value
  );
}

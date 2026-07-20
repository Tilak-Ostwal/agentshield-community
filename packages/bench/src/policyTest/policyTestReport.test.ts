import { describe, expect, it } from "vitest";

import { generatePolicyTestJsonReport, generatePolicyTestMarkdownReport } from "./policyTestReport.js";
import type { PolicyTestRunResult } from "./policyTestRunner.js";

const result: PolicyTestRunResult = {
  version: 1,
  name: "suite",
  policyPath: "policy.json",
  total: 1,
  passed: 1,
  failed: 0,
  results: [
    {
      id: "secret",
      name: "Secret denied",
      passed: true,
      decision: "deny",
      ruleId: "deny-secret-network-write",
      capabilitiesObserved: ["network.write"],
      taintObserved: ["secret"],
      riskMarkers: [],
      forwarded: false,
      approvalTicket: false,
      executionPreflightStatus: "not_applicable",
      assertions: [{ field: "decision", expected: "deny", actual: "deny", passed: true }]
    }
  ]
};

describe("policy test report", () => {
  it("redacts fake secret in report", () => {
    const withSecret = {
      ...result,
      results: [{ ...result.results[0]!, name: ["sk", "test", "REDACT", "ME"].join("-") }]
    };
    expect(generatePolicyTestMarkdownReport(withSecret)).not.toContain(["sk", "test", "REDACT", "ME"].join("-"));
  });

  it("markdown report contains test names", () => {
    expect(generatePolicyTestMarkdownReport(result)).toContain("Secret denied");
  });

  it("JSON report is machine-readable", () => {
    expect(JSON.parse(generatePolicyTestJsonReport(result))).toMatchObject({ name: "suite", total: 1 });
  });
});

import { describe, expect, it } from "vitest";

import { generatePolicyTestSnapshot } from "./policyTestSnapshot.js";
import type { PolicyTestRunResult } from "./policyTestRunner.js";

describe("policy test snapshot", () => {
  it("is deterministic", () => {
    const result: PolicyTestRunResult = {
      version: 1,
      name: "suite",
      policyPath: "policy.json",
      total: 1,
      passed: 1,
      failed: 0,
      results: [
        {
          id: "b",
          name: "B",
          passed: true,
          decision: "allow",
          ruleId: "allow",
          capabilitiesObserved: ["filesystem.read"],
          taintObserved: [],
          riskMarkers: [],
          forwarded: true,
          approvalTicket: false,
          executionPreflightStatus: "not_required",
          assertions: []
        }
      ]
    };
    expect(generatePolicyTestSnapshot(result)).toBe(generatePolicyTestSnapshot(result));
  });
});

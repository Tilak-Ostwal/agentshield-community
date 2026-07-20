import type { PolicyTestRunResult } from "./policyTestRunner.js";

export interface PolicyTestSnapshot {
  version: 1;
  name: string;
  results: Array<{
    id: string;
    decision: string;
    ruleId: string;
    capabilitiesObserved: string[];
    taintObserved: string[];
    riskMarkers: string[];
    approvalTicket: boolean;
    executionPreflightStatus: string;
    sandboxDecision?: string;
  }>;
}

export function createPolicyTestSnapshot(result: PolicyTestRunResult): PolicyTestSnapshot {
  return {
    version: 1,
    name: result.name,
    results: result.results
      .map((test) => ({
        id: test.id,
        decision: test.decision,
        ruleId: test.ruleId,
        capabilitiesObserved: [...test.capabilitiesObserved].sort(),
        taintObserved: [...test.taintObserved].sort(),
        riskMarkers: [...test.riskMarkers].sort(),
        approvalTicket: test.approvalTicket,
        executionPreflightStatus: test.executionPreflightStatus,
        ...(test.sandboxDecision === undefined ? {} : { sandboxDecision: test.sandboxDecision })
      }))
      .sort((left, right) => left.id.localeCompare(right.id))
  };
}

export function generatePolicyTestSnapshot(result: PolicyTestRunResult): string {
  return JSON.stringify(createPolicyTestSnapshot(result), null, 2);
}

import type { FailureModeFixture } from "./failureModeSchema.js";

export const defaultFuzzFixtures: FailureModeFixture[] = [
  {
    version: 1,
    fixtureId: "malformed-action-missing-tool-name",
    category: "malformed_action",
    severity: "critical",
    description: "Action envelope missing toolName must fail closed.",
    input: { actionId: "123", actionType: "tool_call", timestamp: "2026-06-25T00:00:00.000Z" },
    expected: { decision: "deny", mustFailClosed: true, mustNotForward: true, mustNotLeakSecret: true }
  },
  {
    version: 1, fixtureId: "missing-actionId", category: "malformed_action", severity: "critical", description: "", input: {}, expected: { decision: "deny", mustFailClosed: true, mustNotForward: true, mustNotLeakSecret: true }
  },
  {
    version: 1, fixtureId: "sandbox-blocked-action", category: "sandbox_failure", severity: "critical", description: "", input: {}, expected: { decision: "deny", mustFailClosed: true, mustNotForward: true, mustNotLeakSecret: true }
  },
  {
    version: 1, fixtureId: "expired-approval-token", category: "approval_token_failure", severity: "critical", description: "", input: {}, expected: { decision: "deny", mustFailClosed: true, mustNotForward: true, mustNotLeakSecret: true }
  },
  {
    version: 1, fixtureId: "wrong-action-hash-approval-token", category: "approval_token_failure", severity: "critical", description: "", input: {}, expected: { decision: "deny", mustFailClosed: true, mustNotForward: true, mustNotLeakSecret: true }
  },
  {
    version: 1, fixtureId: "adapter-normalizer-error", category: "adapter_failure", severity: "critical", description: "", input: {}, expected: { decision: "deny", mustFailClosed: true, mustNotForward: true, mustNotLeakSecret: true }
  },
  {
    version: 1, fixtureId: "adapter-execution-error", category: "adapter_failure", severity: "critical", description: "", input: {}, expected: { decision: "deny", mustFailClosed: true, mustNotForward: true, mustNotLeakSecret: true }
  },
  {
    version: 1, fixtureId: "execution-side-effect-mismatch", category: "execution_contract_failure", severity: "critical", description: "", input: {}, expected: { decision: "deny", mustFailClosed: true, mustNotForward: true, mustNotLeakSecret: true }
  }
];

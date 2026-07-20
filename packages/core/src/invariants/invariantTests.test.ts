import { evaluatePolicy } from "../policy/policyEvaluator.js";
import { checkPolicyDecisionInvariant, checkPolicyFailClosedInvariant } from "./policyInvariants.js";
import { checkNoRawSecrets } from "./redactionInvariants.js";
import { SECURITY_INVARIANTS } from "./securityInvariant.js";
import { checkTraceInvariants } from "./traceInvariants.js";
import { describe, expect, it } from "vitest";

describe("security invariants", () => {
  it("defines the Phase 8 security invariant set", () => {
    expect(SECURITY_INVARIANTS.map((invariant) => invariant.id)).toEqual([
      "invalid-input-denies",
      "missing-policy-denies",
      "unknown-tool-denies",
      "execute-after-allow",
      "human-review-blocks-execution",
      "deny-blocks-execution",
      "trace-no-raw-secrets",
      "adapter-no-raw-secrets",
      "runtime-trace-ids",
      "policy-decision-shape",
      "fingerprint-change-review",
      "write-then-exec-review",
      "llm-advisory-nonauthoritative",
      "redact-before-persist",
      "runtime-errors-fail-closed"
    ]);
  });

  it("reports failures clearly for bad invariant data", () => {
    const result = checkNoRawSecrets({ token: "sk-test-REDACT-ME" }, ["sk-test-REDACT-ME"]);

    expect(result.passed).toBe(false);
    expect(result.checks[0]?.message).toContain("raw secret leaked");
  });

  it("checks policy decision shape", () => {
    expect(
      checkPolicyDecisionInvariant({
        decision: "deny",
        ruleId: "default-deny",
        reason: "no matching policy rule"
      }).passed
    ).toBe(true);
    expect(checkPolicyDecisionInvariant({ decision: "deny" }).checks[0]?.message).toContain("missing");
  });

  it("checks policy failure is fail-closed deny", () => {
    const evaluation = evaluatePolicy(undefined, {
      actionId: "action_1",
      timestamp: "2026-06-26T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "filesystem.read"
    });

    expect(checkPolicyFailClosedInvariant(evaluation).passed).toBe(true);
  });

  it("checks trace ids, policy decisions, and raw secret absence", () => {
    const result = checkTraceInvariants(
      [
        {
          trace_id: "trace_1",
          event_id: "event_1",
          timestamp: "2026-06-26T00:00:00.000Z",
          type: "policy_decision",
          actor: { kind: "runtime", id: "runtime" },
          data: {
            decision: "deny",
            ruleId: "default-deny",
            reason: "no matching policy rule"
          },
          redactions: []
        }
      ],
      ["sk-test-REDACT-ME"]
    );

    expect(result.passed).toBe(true);
  });
});

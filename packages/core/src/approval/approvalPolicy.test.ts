import { describe, expect, it } from "vitest";

import type { ApprovalTicket, ApprovalVerificationResult } from "./approvalTypes.js";
import { applyApprovalPolicy } from "./approvalPolicy.js";

const ticket: ApprovalTicket = {
  version: 1,
  ticketId: "ticket_1",
  traceId: "trace_1",
  actionId: "action_1",
  actionHash: "hash_1",
  createdAt: "2026-06-25T00:00:00.000Z",
  expiresAt: "2026-06-25T00:10:00.000Z",
  requestedDecision: "allow",
  currentDecision: "require_human_review",
  reason: "review",
  riskMarkers: [],
  capabilitiesObserved: [],
  taintObserved: []
};

const validAllow: ApprovalVerificationResult = {
  status: "valid",
  reason: "valid",
  token: {
    version: 1,
    ticketId: "ticket_1",
    actionHash: "hash_1",
    approvedDecision: "allow",
    approver: "local-dev",
    reason: "reviewed",
    issuedAt: "2026-06-25T00:01:00.000Z",
    expiresAt: "2026-06-25T00:10:00.000Z",
    nonce: "nonce",
    signature: "signature"
  }
};

describe("approval policy", () => {
  it("approval converts require_human_review to allow when permitted", () => {
    expect(
      applyApprovalPolicy({
        currentEvaluation: { decision: "require_human_review", ruleId: "review", reason: "review" },
        ticket,
        verification: validAllow
      })
    ).toMatchObject({ decision: "allow", approvalStatus: "approved" });
  });

  it("approval deny token converts require_human_review to deny", () => {
    expect(
      applyApprovalPolicy({
        currentEvaluation: { decision: "require_human_review", ruleId: "review", reason: "review" },
        ticket,
        verification: { ...validAllow, token: { ...validAllow.token!, approvedDecision: "deny" } }
      })
    ).toMatchObject({ decision: "deny", approvalStatus: "rejected" });
  });

  it("approval cannot convert deny to allow", () => {
    expect(
      applyApprovalPolicy({
        currentEvaluation: { decision: "deny", ruleId: "deny", reason: "denied" },
        ticket,
        verification: validAllow
      })
    ).toMatchObject({ decision: "deny", approvalStatus: "not_required" });
  });

  it("approval cannot override deny-precedence conditions", () => {
    for (const flag of ["invalidInput", "explicitPolicyDeny", "blockedRegistry", "criticalSecretExfiltration", "failClosed"] as const) {
      expect(
        applyApprovalPolicy({
          currentEvaluation: { decision: "require_human_review", ruleId: "review", reason: "review" },
          ticket,
          verification: validAllow,
          [flag]: true
        })
      ).toMatchObject({ decision: "deny", approvalStatus: "invalid" });
    }
  });

  it("missing approval token keeps require_human_review", () => {
    expect(
      applyApprovalPolicy({
        currentEvaluation: { decision: "require_human_review", ruleId: "review", reason: "review" },
        ticket
      })
    ).toMatchObject({ decision: "require_human_review", approvalStatus: "required" });
  });

  it("expired approval token fails closed", () => {
    expect(
      applyApprovalPolicy({
        currentEvaluation: { decision: "require_human_review", ruleId: "review", reason: "review" },
        ticket,
        verification: { status: "expired", reason: "expired" }
      })
    ).toMatchObject({ decision: "require_human_review", approvalStatus: "expired" });
  });
});

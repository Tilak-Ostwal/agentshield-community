import { describe, expect, it } from "vitest";

import type { ApprovalTicket } from "./approvalTypes.js";
import { signApprovalToken } from "./approvalSigner.js";
import { verifyApprovalToken } from "./approvalVerifier.js";

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

const unsigned = {
  version: 1 as const,
  ticketId: "ticket_1",
  actionHash: "hash_1",
  approvedDecision: "allow" as const,
  approver: "local-dev",
  reason: "reviewed",
  issuedAt: "2026-06-25T00:01:00.000Z",
  expiresAt: "2026-06-25T00:10:00.000Z",
  nonce: "nonce_1"
};

describe("approval verifier", () => {
  it("verifies a valid token", () => {
    const token = signApprovalToken(unsigned, "fake-local-test-key");

    expect(verifyApprovalToken({ ticket, token, signingKey: "fake-local-test-key", now: new Date("2026-06-25T00:02:00.000Z") })).toMatchObject({
      status: "valid"
    });
  });

  it("fails invalid signature", () => {
    const token = { ...signApprovalToken(unsigned, "fake-local-test-key"), signature: "0".repeat(64) };

    expect(verifyApprovalToken({ ticket, token, signingKey: "fake-local-test-key", now: new Date("2026-06-25T00:02:00.000Z") }).status).toBe("invalid");
  });

  it("fails expired token closed", () => {
    const token = signApprovalToken(unsigned, "fake-local-test-key");

    expect(verifyApprovalToken({ ticket, token, signingKey: "fake-local-test-key", now: new Date("2026-06-25T00:11:00.000Z") }).status).toBe("expired");
  });

  it("fails action hash mismatch closed", () => {
    const token = signApprovalToken({ ...unsigned, actionHash: "other_hash" }, "fake-local-test-key");

    expect(verifyApprovalToken({ ticket, token, signingKey: "fake-local-test-key", now: new Date("2026-06-25T00:02:00.000Z") }).status).toBe("mismatched");
  });
});

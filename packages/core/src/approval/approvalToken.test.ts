import { describe, expect, it } from "vitest";

import type { ApprovalTicket } from "./approvalTypes.js";
import { createUnsignedApprovalToken } from "./approvalToken.js";

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

describe("approval token", () => {
  it("creates deterministic unsigned token fields", () => {
    const token = createUnsignedApprovalToken({
      ticket,
      approvedDecision: "allow",
      approver: "local-dev",
      reason: "reviewed",
      issuedAt: "2026-06-25T00:01:00.000Z"
    });

    expect(token).toMatchObject({
      version: 1,
      ticketId: ticket.ticketId,
      actionHash: ticket.actionHash,
      approvedDecision: "allow"
    });
    expect(token.nonce).toHaveLength(32);
  });
});

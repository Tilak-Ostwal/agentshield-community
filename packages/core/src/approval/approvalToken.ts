import { createHash } from "node:crypto";

import type { ApprovalTicket, UnsignedApprovalToken } from "./approvalTypes.js";

export interface CreateUnsignedApprovalTokenInput {
  ticket: ApprovalTicket;
  approvedDecision: "allow" | "deny";
  approver: string;
  reason: string;
  issuedAt: string;
  expiresAt?: string;
  nonce?: string;
}

function deterministicNonce(ticket: ApprovalTicket, approver: string, reason: string, issuedAt: string): string {
  return createHash("sha256")
    .update(`${ticket.ticketId}:${ticket.actionHash}:${approver}:${reason}:${issuedAt}`)
    .digest("hex")
    .slice(0, 32);
}

export function createUnsignedApprovalToken(input: CreateUnsignedApprovalTokenInput): UnsignedApprovalToken {
  return {
    version: 1,
    ticketId: input.ticket.ticketId,
    actionHash: input.ticket.actionHash,
    approvedDecision: input.approvedDecision,
    approver: input.approver,
    reason: input.reason,
    issuedAt: input.issuedAt,
    expiresAt: input.expiresAt ?? input.ticket.expiresAt,
    nonce: input.nonce ?? deterministicNonce(input.ticket, input.approver, input.reason, input.issuedAt)
  };
}

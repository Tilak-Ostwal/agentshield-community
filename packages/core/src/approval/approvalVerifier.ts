import type { ApprovalTicket, ApprovalToken, ApprovalVerificationResult } from "./approvalTypes.js";
import { approvalTicketSchema, approvalTokenSchema } from "./approvalTypes.js";
import { signatureMatches } from "./approvalSigner.js";

export interface VerifyApprovalTokenInput {
  ticket: unknown;
  token: unknown;
  signingKey: string;
  now: Date;
}

export function verifyApprovalToken(input: VerifyApprovalTokenInput): ApprovalVerificationResult {
  const ticketResult = approvalTicketSchema.safeParse(input.ticket);
  const tokenResult = approvalTokenSchema.safeParse(input.token);

  if (!ticketResult.success || !tokenResult.success) {
    return { status: "invalid", reason: "invalid approval ticket or token shape" };
  }

  const ticket: ApprovalTicket = ticketResult.data;
  const token: ApprovalToken = tokenResult.data;

  if (token.ticketId !== ticket.ticketId || token.actionHash !== ticket.actionHash) {
    return { status: "mismatched", reason: "approval token does not match ticket action hash" };
  }

  if (Date.parse(token.expiresAt) <= input.now.getTime() || Date.parse(ticket.expiresAt) <= input.now.getTime()) {
    return { status: "expired", token, reason: "approval token expired" };
  }

  if (!signatureMatches(token, input.signingKey)) {
    return { status: "invalid", token, reason: "approval token signature is invalid" };
  }

  return { status: "valid", token, reason: "approval token verified" };
}

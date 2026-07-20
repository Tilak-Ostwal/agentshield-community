import { z } from "zod";

export const approvalTicketSchema = z
  .object({
    version: z.literal(1),
    ticketId: z.string().min(1),
    traceId: z.string().min(1),
    actionId: z.string().min(1),
    actionHash: z.string().min(1),
    createdAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    requestedDecision: z.enum(["allow", "deny"]),
    currentDecision: z.literal("require_human_review"),
    reason: z.string(),
    riskMarkers: z.array(z.string()),
    capabilitiesObserved: z.array(z.string()),
    taintObserved: z.array(z.string()),
    registryFindings: z.array(z.unknown()).optional(),
    policyRuleId: z.string().optional(),
    policyExplanationSummary: z.unknown().optional(),
    evidenceRootHash: z.string().optional()
  })
  .strict();

export type ApprovalTicket = z.infer<typeof approvalTicketSchema>;

export const unsignedApprovalTokenSchema = z
  .object({
    version: z.literal(1),
    ticketId: z.string().min(1),
    actionHash: z.string().min(1),
    approvedDecision: z.enum(["allow", "deny"]),
    approver: z.string().min(1),
    reason: z.string(),
    issuedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    nonce: z.string().min(1)
  })
  .strict();

export type UnsignedApprovalToken = z.infer<typeof unsignedApprovalTokenSchema>;

export const approvalTokenSchema = unsignedApprovalTokenSchema
  .extend({
    signature: z.string().min(1)
  })
  .strict();

export type ApprovalToken = z.infer<typeof approvalTokenSchema>;

export type ApprovalStatus = "not_required" | "required" | "approved" | "rejected" | "invalid" | "expired";

export type ApprovalVerificationStatus = "valid" | "invalid" | "expired" | "mismatched";

export interface ApprovalVerificationResult {
  status: ApprovalVerificationStatus;
  token?: ApprovalToken;
  reason: string;
}

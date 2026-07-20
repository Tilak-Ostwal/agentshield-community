import { createHash } from "node:crypto";

import type { PolicyDecision } from "../policy/policySchema.js";
import { redactSecrets } from "../redaction/redactor.js";
import type { ApprovalTicket } from "./approvalTypes.js";

export interface CreateApprovalTicketInput {
  traceId: string;
  actionId: string;
  actionHash: string;
  createdAt: string;
  expiresAt: string;
  requestedDecision?: "allow" | "deny";
  currentDecision: PolicyDecision;
  reason: string;
  riskMarkers?: unknown[];
  capabilitiesObserved?: string[];
  taintObserved?: string[];
  registryFindings?: unknown[];
  policyRuleId?: string;
  policyExplanationSummary?: unknown;
  evidenceRootHash?: string | null;
}

function stableTicketId(traceId: string, actionId: string, actionHash: string, createdAt: string): string {
  const digest = createHash("sha256").update(`${traceId}:${actionId}:${actionHash}:${createdAt}`).digest("hex").slice(0, 24);
  return `approval_ticket_${digest}`;
}

function markerStrings(markers: unknown[]): string[] {
  return markers.map((marker) => {
    if (typeof marker === "string") return marker;
    if (typeof marker === "object" && marker !== null) {
      const type = (marker as Record<string, unknown>).type ?? (marker as Record<string, unknown>).patternId;
      if (typeof type === "string") return type;
    }
    return "unknown";
  });
}

export function createApprovalTicket(input: CreateApprovalTicketInput): ApprovalTicket | undefined {
  if (input.currentDecision !== "require_human_review") {
    return undefined;
  }

  return {
    version: 1,
    ticketId: stableTicketId(input.traceId, input.actionId, input.actionHash, input.createdAt),
    traceId: input.traceId,
    actionId: input.actionId,
    actionHash: input.actionHash,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    requestedDecision: input.requestedDecision ?? "allow",
    currentDecision: "require_human_review",
    reason: input.reason,
    riskMarkers: markerStrings(input.riskMarkers ?? []),
    capabilitiesObserved: input.capabilitiesObserved ?? [],
    taintObserved: input.taintObserved ?? [],
    ...(input.registryFindings === undefined ? {} : { registryFindings: redactSecrets(input.registryFindings).value }),
    ...(input.policyRuleId === undefined ? {} : { policyRuleId: input.policyRuleId }),
    ...(input.policyExplanationSummary === undefined ? {} : { policyExplanationSummary: redactSecrets(input.policyExplanationSummary).value }),
    ...(input.evidenceRootHash === undefined || input.evidenceRootHash === null ? {} : { evidenceRootHash: input.evidenceRootHash })
  };
}

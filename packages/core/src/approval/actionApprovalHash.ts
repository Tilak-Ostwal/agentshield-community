import { createHash } from "node:crypto";

import type { ActionEnvelope } from "../action/actionEnvelope.js";
import { canonicalJson } from "../evidence/canonicalJson.js";
import { redactSecrets } from "../redaction/redactor.js";

export interface ActionApprovalHashInput {
  action: ActionEnvelope;
  policyContext?: unknown;
  riskContext?: unknown;
  ticketContext?: {
    traceId: string;
    actionId: string;
    requestedDecision?: "allow" | "deny";
    policyRuleId?: string;
  };
}

export function createActionApprovalHash(input: ActionApprovalHashInput): string {
  const redactedAction = redactSecrets(input.action).value;
  const payload = {
    version: 1,
    action: redactedAction,
    policyContext: redactSecrets(input.policyContext ?? {}).value,
    riskContext: redactSecrets(input.riskContext ?? {}).value,
    ticketContext: input.ticketContext ?? {
      actionId: input.action.actionId
    }
  };

  return createHash("sha256").update(canonicalJson(payload)).digest("hex");
}

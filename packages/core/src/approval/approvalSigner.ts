import { createHmac, timingSafeEqual } from "node:crypto";

import { canonicalJson } from "../evidence/canonicalJson.js";
import type { ApprovalToken, UnsignedApprovalToken } from "./approvalTypes.js";
import { approvalTokenSchema, unsignedApprovalTokenSchema } from "./approvalTypes.js";

export function approvalTokenSigningPayload(token: UnsignedApprovalToken): string {
  return canonicalJson(unsignedApprovalTokenSchema.parse(token));
}

export function signApprovalToken(token: UnsignedApprovalToken, signingKey: string): ApprovalToken {
  const parsed = unsignedApprovalTokenSchema.parse(token);
  const signature = createHmac("sha256", signingKey).update(approvalTokenSigningPayload(parsed)).digest("hex");
  return approvalTokenSchema.parse({ ...parsed, signature });
}

export function signatureMatches(token: ApprovalToken, signingKey: string): boolean {
  const parsed = approvalTokenSchema.parse(token);
  const { signature: _signature, ...unsigned } = parsed;
  const expected = signApprovalToken(unsigned, signingKey).signature;
  const actualBuffer = Buffer.from(parsed.signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(actualBuffer, expectedBuffer);
}

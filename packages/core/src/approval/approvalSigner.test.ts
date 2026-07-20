import { describe, expect, it } from "vitest";

import type { UnsignedApprovalToken } from "./approvalTypes.js";
import { signApprovalToken, signatureMatches } from "./approvalSigner.js";

const unsigned: UnsignedApprovalToken = {
  version: 1,
  ticketId: "ticket_1",
  actionHash: "hash_1",
  approvedDecision: "allow",
  approver: "local-dev",
  reason: "reviewed",
  issuedAt: "2026-06-25T00:01:00.000Z",
  expiresAt: "2026-06-25T00:10:00.000Z",
  nonce: "nonce_1"
};

describe("approval signer", () => {
  it("signs and verifies a token with HMAC-SHA256", () => {
    const token = signApprovalToken(unsigned, "fake-local-test-key");

    expect(signatureMatches(token, "fake-local-test-key")).toBe(true);
    expect(token.signature).toHaveLength(64);
  });

  it("does not validate with the wrong key", () => {
    const token = signApprovalToken(unsigned, "fake-local-test-key");

    expect(signatureMatches(token, "other-key")).toBe(false);
  });
});

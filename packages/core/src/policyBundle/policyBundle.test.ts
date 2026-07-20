import { describe, expect, it } from "vitest";

import { AgentShieldSecurityError } from "../shared/securityError.js";
import { signBundle, verifySignedBundle } from "./policyBundle.js";

const signingKey = "local-test-signing-key";

const unsignedBundle = {
  kind: "policy",
  version: 1,
  name: "strict-local",
  createdAt: "2026-01-01T00:00:00.000Z",
  payload: {
    version: 1,
    defaultDecision: "deny",
    rules: []
  }
} as const;

describe("policy bundle", () => {
  it("signs and verifies canonical local bundles", () => {
    const signed = signBundle(unsignedBundle, signingKey);

    expect(verifySignedBundle(signed, signingKey)).toEqual(signed);
  });

  it("throws a typed security error when bundle content is tampered", () => {
    const signed = signBundle(unsignedBundle, signingKey);
    const tampered = {
      ...signed,
      bundle: {
        ...signed.bundle,
        name: "tampered"
      }
    };

    try {
      verifySignedBundle(tampered, signingKey);
      expect.fail("Expected verifySignedBundle to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(AgentShieldSecurityError);
      expect((error as AgentShieldSecurityError).code).toBe("BUNDLE_HASH_MISMATCH");
    }
  });

  it("throws a typed security error when signature is corrupted", () => {
    const signed = signBundle(unsignedBundle, signingKey);
    const tampered = {
      ...signed,
      signature: "0".repeat(64)
    };

    try {
      verifySignedBundle(tampered, signingKey);
      expect.fail("Expected verifySignedBundle to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(AgentShieldSecurityError);
    }
  });

  it("throws a typed security error for malformed bundle input without leaking sentinels", () => {
    const fakeSecret = ["sk", "test", "REDACT", "ME"].join("-");

    try {
      verifySignedBundle({ token: fakeSecret }, signingKey);
      throw new Error("expected verifySignedBundle to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(AgentShieldSecurityError);
      expect(JSON.stringify(error)).not.toContain(fakeSecret);
    }
  });
});

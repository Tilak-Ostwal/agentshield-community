import { createHmac } from "node:crypto";
import type { RegistryBundle } from "./registryBundleSchema.js";
import { computeRegistryBundleSignaturePayload, hashRegistryBundlePayload } from "./registryBundleHash.js";

const TEST_KEY = "sk-test" + "-REDACT-ME" + "-registry-signer";

export interface RegistryBundleVerificationResult {
  valid: boolean;
  failures: string[];
}

export function verifyRegistryBundle(bundle: RegistryBundle): RegistryBundleVerificationResult {
  const failures: string[] = [];

  if (bundle.attestation.algorithm !== "HMAC-SHA256-TEST-ONLY") {
    failures.push("Unsupported signature algorithm");
  }

  // Verify registry hash
  const computedRegistryHash = hashRegistryBundlePayload(bundle.registry);
  if (computedRegistryHash !== bundle.provenance.registryHash) {
    failures.push("Registry hash mismatch. The registry was modified.");
  }

  // Verify missing provenance
  if (!bundle.provenance.source || !bundle.provenance.sourceId) {
    failures.push("Missing required provenance fields");
  }

  // Verify signature
  const payloadToSign = computeRegistryBundleSignaturePayload(bundle);
  const hmac = createHmac("sha256", TEST_KEY);
  hmac.update(payloadToSign);
  const computedSignature = hmac.digest("hex");

  if (computedSignature !== bundle.attestation.signature) {
    failures.push("Signature mismatch. Bundle was tampered with.");
  }

  return {
    valid: failures.length === 0,
    failures
  };
}

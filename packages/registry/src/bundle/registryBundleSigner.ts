import { createHmac } from "node:crypto";
import type { RegistryBundle, RegistryAttestation } from "./registryBundleSchema.js";
import { computeRegistryBundleSignaturePayload } from "./registryBundleHash.js";

const TEST_KEY = "sk-test" + "-REDACT-ME" + "-registry-signer";

export function signRegistryBundleLocalTest(bundle: Omit<RegistryBundle, "attestation">): RegistryBundle {
  const payloadToSign = computeRegistryBundleSignaturePayload(bundle as RegistryBundle);
  
  const hmac = createHmac("sha256", TEST_KEY);
  hmac.update(payloadToSign);
  const signature = hmac.digest("hex");

  const attestation: RegistryAttestation = {
    algorithm: "HMAC-SHA256-TEST-ONLY",
    keyId: "local-test-key",
    signature
  };

  return { ...bundle, attestation } as RegistryBundle;
}

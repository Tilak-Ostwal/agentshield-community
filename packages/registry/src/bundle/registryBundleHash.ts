import { hashCanonical } from "@agentshield/core";
import type { RegistryBundle } from "./registryBundleSchema.js";

export function hashRegistryBundlePayload(payload: unknown): string {
  return hashCanonical(payload);
}

export function computeRegistryBundleSignaturePayload(bundle: RegistryBundle): string {
  const { attestation: _attestation, ...rest } = bundle;
  return hashCanonical(rest);
}

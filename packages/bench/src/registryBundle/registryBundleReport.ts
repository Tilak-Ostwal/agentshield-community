import type { RegistryBundle } from "@agentshield/registry";

export function formatRegistryBundleInspectText(bundle: RegistryBundle): string {
  const p = bundle.provenance;
  const a = bundle.attestation;
  return `AgentShield Registry Trust Bundle
ID: ${bundle.bundleId}
Name: ${bundle.name}
Created: ${bundle.createdAt}
Source: ${p.source}
Source ID: ${p.sourceId}
Tools: ${p.toolCount} (Trusted: ${p.trustedToolCount}, Reviewed: ${p.reviewedToolCount}, Blocked: ${p.blockedToolCount})
Signature: ${a.signature}`;
}

export function formatRegistryBundleInspectJson(bundle: RegistryBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function formatRegistryBundleVerifyText(valid: boolean, failures: string[]): string {
  if (valid) {
    return "AgentShield Registry Trust Bundle Verification: PASS";
  }
  return `AgentShield Registry Trust Bundle Verification: FAIL\n` + failures.map((f) => `- ${f}`).join("\n");
}

export function formatRegistryBundleVerifyJson(valid: boolean, failures: string[]): string {
  return JSON.stringify({ valid, failures }, null, 2);
}

import type { BundleVerificationResult } from "@agentshield/core";

export function formatPolicyBundleVerifyText(result: BundleVerificationResult): string {
  if (result.valid) {
    return "AgentShield Policy Bundle Verification: PASS";
  }
  return `AgentShield Policy Bundle Verification: FAIL\nFailures:\n${result.failures.map(f => `- ${f}`).join("\n")}`;
}

export function formatPolicyBundleVerifyJson(result: BundleVerificationResult): string {
  return JSON.stringify(result, null, 2);
}

export function formatPolicyBundleInspectText(bundle: any): string {
  return `AgentShield Policy Bundle
ID: ${bundle.bundleId}
Name: ${bundle.name}
Created: ${bundle.createdAt}
Source: ${bundle.provenance.source}
Source ID: ${bundle.provenance.sourceId}
Signature: ${bundle.attestation.signature}`;
}

export function formatPolicyBundleInspectJson(bundle: any): string {
  return JSON.stringify(bundle, null, 2);
}

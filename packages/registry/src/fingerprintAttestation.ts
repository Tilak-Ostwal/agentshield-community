import { createToolFingerprint, stableHash } from "@agentshield/core";

import { dangerousAddedCapabilities } from "./capabilityDrift.js";
import { registryEntryKey, type RegistryEntry } from "./registryEntry.js";

export type AttestationStatus = "match" | "changed" | "missing" | "blocked" | "invalid";
export type AttestationDecisionImpact = "none" | "require_human_review" | "deny";
export type RegistryFindingSeverity = "low" | "medium" | "high" | "critical";

export interface RegistryFinding {
  type: string;
  severity: RegistryFindingSeverity;
  message: string;
  expected?: string;
  actual?: string;
}

export interface FingerprintAttestationResult {
  status: AttestationStatus;
  decisionImpact: AttestationDecisionImpact;
  findings: RegistryFinding[];
}

export interface ToolAttestationMetadata {
  toolName: string;
  serverName: string;
  schema: unknown;
  description: string;
  capabilities: string[];
}

function strongestImpact(findings: RegistryFinding[]): AttestationDecisionImpact {
  if (findings.some((finding) => finding.severity === "critical")) return "deny";
  if (findings.some((finding) => finding.severity === "high" || finding.severity === "medium")) return "require_human_review";
  return findings.length > 0 ? "require_human_review" : "none";
}

export function attestToolFingerprint(entry: RegistryEntry | undefined, metadata: ToolAttestationMetadata): FingerprintAttestationResult {
  if (entry === undefined) {
    return {
      status: "missing",
      decisionImpact: "require_human_review",
      findings: [
        {
          type: "registry_entry_missing",
          severity: "high",
          message: `tool ${metadata.serverName}:${metadata.toolName} is missing from the local registry`
        }
      ]
    };
  }

  if (entry.trustLevel === "blocked") {
    return {
      status: "blocked",
      decisionImpact: "deny",
      findings: [
        {
          type: "registry_tool_blocked",
          severity: "critical",
          message: `tool ${registryEntryKey(entry)} is blocked by the local registry`
        }
      ]
    };
  }

  const fingerprint = createToolFingerprint(metadata);
  const capabilityHash = stableHash(fingerprint.capabilities);
  const findings: RegistryFinding[] = [];

  if (entry.serverName !== metadata.serverName) {
    findings.push({
      type: "registry_server_mismatch",
      severity: "critical",
      message: "tool server name does not match registry entry",
      expected: entry.serverName,
      actual: metadata.serverName
    });
  }
  if (entry.toolName !== metadata.toolName) {
    findings.push({
      type: "registry_tool_mismatch",
      severity: "critical",
      message: "tool name does not match registry entry",
      expected: entry.toolName,
      actual: metadata.toolName
    });
  }
  if (entry.expectedFingerprint.schemaHash !== fingerprint.schemaHash) {
    findings.push({
      type: "schema_drift",
      severity: "high",
      message: "tool schema fingerprint changed",
      expected: entry.expectedFingerprint.schemaHash,
      actual: fingerprint.schemaHash
    });
  }
  if (entry.expectedFingerprint.descriptionHash !== fingerprint.descriptionHash) {
    findings.push({
      type: "description_drift",
      severity: "high",
      message: "tool description fingerprint changed",
      expected: entry.expectedFingerprint.descriptionHash,
      actual: fingerprint.descriptionHash
    });
  }
  if (entry.expectedFingerprint.capabilityHash !== capabilityHash) {
    findings.push({
      type: "capability_drift",
      severity: "high",
      message: "tool capability fingerprint changed",
      expected: entry.expectedFingerprint.capabilityHash,
      actual: capabilityHash
    });
  }

  for (const capability of dangerousAddedCapabilities(entry.declaredCapabilities, metadata.capabilities)) {
    findings.push({
      type: "dangerous_capability_added",
      severity: "critical",
      message: `dangerous capability added: ${capability}`,
      actual: capability
    });
  }

  if (entry.trustLevel === "unknown") {
    findings.push({
      type: "registry_trust_unknown",
      severity: "high",
      message: `tool ${registryEntryKey(entry)} has unknown trust level`
    });
  }

  return {
    status: findings.length === 0 ? "match" : "changed",
    decisionImpact: strongestImpact(findings),
    findings
  };
}

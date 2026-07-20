import { createToolFingerprint, stableHash } from "@agentshield/core";
import { describe, expect, it } from "vitest";

import { attestToolFingerprint } from "./fingerprintAttestation.js";
import type { RegistryEntry } from "./registryEntry.js";

const metadata = {
  toolName: "filesystem.read",
  serverName: "mock",
  schema: { properties: { path: { type: "string" } } },
  description: "Read a fake local path without touching disk.",
  capabilities: ["filesystem.read"]
};

function registryEntry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
  const fingerprint = createToolFingerprint(metadata);
  return {
    version: 1,
    toolName: metadata.toolName,
    serverName: metadata.serverName,
    trustLevel: "trusted",
    expectedFingerprint: {
      schemaHash: fingerprint.schemaHash,
      descriptionHash: fingerprint.descriptionHash,
      capabilityHash: stableHash(fingerprint.capabilities)
    },
    declaredCapabilities: metadata.capabilities,
    riskLevel: "low",
    ...overrides
  };
}

describe("fingerprint attestation", () => {
  it("matches unchanged tools", () => {
    expect(attestToolFingerprint(registryEntry(), metadata)).toMatchObject({ status: "match", decisionImpact: "none" });
  });

  it("detects schema drift", () => {
    expect(attestToolFingerprint(registryEntry(), { ...metadata, schema: { changed: true } })).toMatchObject({
      status: "changed",
      findings: [{ type: "schema_drift" }]
    });
  });

  it("detects description drift", () => {
    expect(attestToolFingerprint(registryEntry(), { ...metadata, description: "Changed" })).toMatchObject({
      status: "changed",
      findings: [{ type: "description_drift" }]
    });
  });

  it("detects capability drift", () => {
    expect(attestToolFingerprint(registryEntry(), { ...metadata, capabilities: ["filesystem.read", "shell.exec"] })).toMatchObject({
      decisionImpact: "deny"
    });
  });

  it("denies blocked trustLevel", () => {
    expect(attestToolFingerprint(registryEntry({ trustLevel: "blocked" }), metadata)).toMatchObject({ status: "blocked", decisionImpact: "deny" });
  });

  it("requires review for missing registry entries", () => {
    expect(attestToolFingerprint(undefined, metadata)).toMatchObject({ status: "missing", decisionImpact: "require_human_review" });
  });
});

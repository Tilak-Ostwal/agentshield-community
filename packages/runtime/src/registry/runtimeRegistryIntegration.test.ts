import { createToolFingerprint, stableHash } from "@agentshield/core";
import { createLocalRegistry, type RegistryEntry } from "@agentshield/registry";
import { describe, expect, it } from "vitest";

import { createRuntimeContext } from "../context/runtimeContext.js";
import type { RuntimeToolMetadata } from "../fingerprint/inMemoryFingerprintStore.js";
import { processAction } from "../processor/actionProcessor.js";

const allowAllPolicy = {
  version: 1,
  defaultDecision: "deny",
  rules: [{ id: "allow-tools", match: { actionType: "tool_call" }, decision: "allow" }]
};

const denyReadPolicy = {
  version: 1,
  defaultDecision: "deny",
  rules: [{ id: "deny-read", match: { toolName: "filesystem.read" }, decision: "deny" }]
};

function action(toolName = "filesystem.read", input: Record<string, unknown> = { path: "/mock/project/file.txt" }) {
  return {
    actionId: "a1",
    timestamp: "2026-06-26T00:00:00.000Z",
    actionType: "tool_call",
    toolName,
    input,
    metadata: {}
  };
}

const metadata: RuntimeToolMetadata = {
  toolName: "filesystem.read",
  serverName: "mock",
  schema: { properties: { path: { type: "string" } } },
  description: "Read a fake local path without touching disk.",
  capabilities: ["filesystem.read"]
};

function entry(overrides: Partial<RegistryEntry> = {}): RegistryEntry {
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

function registry(entries: RegistryEntry[]) {
  return createLocalRegistry({ version: 1, name: "r", generatedAt: "now", entries });
}

describe("runtime registry integration", () => {
  it("includes registryFindings and requires review for missing registry entry", () => {
    const context = createRuntimeContext({ policy: allowAllPolicy, toolRegistry: registry([]) });
    const result = processAction(context, action(), { toolMetadata: metadata });

    expect(result).toMatchObject({
      decision: "require_human_review",
      registryFindings: [{ type: "registry_entry_missing" }]
    });
  });

  it("denies blocked registry tools", () => {
    const context = createRuntimeContext({ policy: allowAllPolicy, toolRegistry: registry([entry({ trustLevel: "blocked" })]) });
    expect(processAction(context, action(), { toolMetadata: metadata })).toMatchObject({
      decision: "deny",
      ruleId: "registry-attestation-deny"
    });
  });

  it("never weakens policy deny", () => {
    const context = createRuntimeContext({ policy: denyReadPolicy, toolRegistry: registry([entry()]) });
    expect(processAction(context, action(), { toolMetadata: metadata })).toMatchObject({
      decision: "deny",
      ruleId: "deny-read"
    });
  });

  it("registry attestation trace contains no raw fake secret", () => {
    const context = createRuntimeContext({ policy: allowAllPolicy, toolRegistry: registry([]) });
    processAction(context, action("network.post", { token: "sk-test-REDACT-ME" }), {
      toolMetadata: { ...metadata, toolName: "network.post", capabilities: ["network.write"] }
    });

    expect(JSON.stringify(context.traceRecorder.getEvents())).not.toContain("sk-test-REDACT-ME");
    expect(context.traceRecorder.getEvents().some((event) => event.type === "registry_attestation")).toBe(true);
  });
});

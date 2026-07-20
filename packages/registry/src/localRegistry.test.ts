import { createToolFingerprint, stableHash } from "@agentshield/core";
import { describe, expect, it } from "vitest";

import { createLocalRegistry } from "./localRegistry.js";

describe("local registry", () => {
  it("looks up and attests local entries", () => {
    const metadata = { toolName: "filesystem.read", serverName: "mock", schema: {}, description: "read", capabilities: ["filesystem.read"] };
    const fingerprint = createToolFingerprint(metadata);
    const registry = createLocalRegistry({
      version: 1,
      name: "r",
      generatedAt: "now",
      entries: [
        {
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
          riskLevel: "low"
        }
      ]
    });

    expect(registry.getEntry("mock", "filesystem.read")).toBeDefined();
    expect(registry.attest(metadata)).toMatchObject({ status: "match" });
  });
});

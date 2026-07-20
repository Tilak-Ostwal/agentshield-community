import { stableHash } from "@agentshield/core";
import { describe, expect, it } from "vitest";

import { parseRegistryFile } from "./registryFile.js";

describe("registry file", () => {
  it("parses valid registry files", () => {
    expect(
      parseRegistryFile({
        version: 1,
        name: "local-agent-tool-registry",
        generatedAt: "2026-06-26T00:00:00.000Z",
        entries: [
          {
            version: 1,
            toolName: "filesystem.read",
            serverName: "mock",
            trustLevel: "trusted",
            expectedFingerprint: {
              schemaHash: stableHash({ path: "string" }),
              descriptionHash: stableHash("Read"),
              capabilityHash: stableHash(["filesystem.read"])
            },
            declaredCapabilities: ["filesystem.read"],
            riskLevel: "low"
          }
        ]
      }).entries
    ).toHaveLength(1);
  });
});

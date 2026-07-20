import { stableHash } from "@agentshield/core";
import { describe, expect, it } from "vitest";

import { registryEntrySchema } from "./registryEntry.js";

describe("registry entry schema", () => {
  it("parses valid registry entries", () => {
    expect(
      registryEntrySchema.parse({
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
      })
    ).toMatchObject({ toolName: "filesystem.read" });
  });

  it("rejects invalid trustLevel", () => {
    expect(() =>
      registryEntrySchema.parse({
        version: 1,
        toolName: "x",
        serverName: "mock",
        trustLevel: "root",
        expectedFingerprint: {},
        declaredCapabilities: [],
        riskLevel: "low"
      })
    ).toThrow();
  });

  it("rejects missing expected hashes", () => {
    expect(() =>
      registryEntrySchema.parse({
        version: 1,
        toolName: "x",
        serverName: "mock",
        trustLevel: "trusted",
        expectedFingerprint: { schemaHash: stableHash({}) },
        declaredCapabilities: [],
        riskLevel: "low"
      })
    ).toThrow();
  });
});

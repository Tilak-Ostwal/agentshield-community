import { stableHash } from "@agentshield/core";
import { describe, expect, it } from "vitest";

import { validateRegistryFile } from "./registryValidator.js";

function entry(toolName = "filesystem.read") {
  return {
    version: 1,
    toolName,
    serverName: "mock",
    trustLevel: "trusted",
    expectedFingerprint: {
      schemaHash: stableHash({ path: "string" }),
      descriptionHash: stableHash("Read"),
      capabilityHash: stableHash(["filesystem.read"])
    },
    declaredCapabilities: ["filesystem.read"],
    riskLevel: "low"
  };
}

describe("registry validator", () => {
  it("rejects duplicate tool/server entries", () => {
    const result = validateRegistryFile({ version: 1, name: "r", generatedAt: "now", entries: [entry(), entry()] });

    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "DUPLICATE_REGISTRY_ENTRY")).toBe(true);
  });

  it("rejects invalid schema", () => {
    expect(validateRegistryFile({ version: 1, name: "r", generatedAt: "now", entries: [{ ...entry(), trustLevel: "bad" }] })).toMatchObject({
      valid: false
    });
  });
});

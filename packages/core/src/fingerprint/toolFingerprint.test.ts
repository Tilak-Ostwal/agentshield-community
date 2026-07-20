import { describe, expect, it } from "vitest";

import { createToolFingerprint, hasFingerprintChanged } from "./toolFingerprint.js";

describe("tool fingerprint", () => {
  it("creates a deterministic fingerprint", () => {
    const fingerprint = createToolFingerprint({
      toolName: "filesystem.read",
      serverName: "local",
      schema: { path: "string" },
      description: "Read a file",
      capabilities: ["filesystem", "read"]
    });

    expect(fingerprint.capabilities).toEqual(["filesystem", "read"]);
    expect(fingerprint.schemaHash).toHaveLength(64);
  });

  it("detects changed fingerprints", () => {
    const previous = createToolFingerprint({
      toolName: "filesystem.read",
      serverName: "local",
      schema: { path: "string" },
      description: "Read a file",
      capabilities: ["read"]
    });
    const current = createToolFingerprint({
      toolName: "filesystem.read",
      serverName: "local",
      schema: { path: "string", encoding: "string" },
      description: "Read a file",
      capabilities: ["read"]
    });

    expect(hasFingerprintChanged(previous, current)).toBe(true);
    expect(hasFingerprintChanged(previous, previous)).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { InMemoryFingerprintStore } from "./inMemoryFingerprintStore.js";

describe("in-memory fingerprint store", () => {
  it("detects changed fingerprints", () => {
    const store = new InMemoryFingerprintStore();

    const first = store.checkAndStore({
      toolName: "filesystem.read",
      serverName: "local",
      schema: { path: "string" },
      description: "Read a file",
      capabilities: ["read"]
    });
    const second = store.checkAndStore({
      toolName: "filesystem.read",
      serverName: "local",
      schema: { path: "string", encoding: "string" },
      description: "Read a file",
      capabilities: ["read"]
    });

    expect(first.status).toBe("new");
    expect(second.status).toBe("changed");
    expect(second.previousFingerprint).toBeDefined();
  });
});

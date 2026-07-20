import { describe, expect, it } from "vitest";

import { AdapterRegistry } from "./adapterRegistry.js";
import { normalizeCustomToolCall } from "./toolCallNormalizer.js";

function adapter(id: string) {
  return {
    adapterId: id,
    adapterName: id,
    protocol: "custom" as const,
    listTools: async () => [],
    normalizeToolCall: async (input: unknown) => normalizeCustomToolCall(input as never),
    executeAllowedAction: async () => ({ ok: true, status: "executed" as const })
  };
}

describe("adapter registry", () => {
  it("rejects duplicate adapterId", () => {
    const registry = new AdapterRegistry();
    registry.register(adapter("custom"));
    expect(() => registry.register(adapter("custom"))).toThrow("duplicate adapterId");
  });
});

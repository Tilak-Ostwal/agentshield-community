import { describe, expect, it } from "vitest";

import { validateAdapter } from "./adapterContract.js";
import { normalizeCustomToolCall } from "./toolCallNormalizer.js";

const adapter = {
  adapterId: "custom",
  adapterName: "Custom",
  protocol: "custom" as const,
  listTools: async () => [],
  normalizeToolCall: async (input: unknown) => normalizeCustomToolCall(input as never),
  executeAllowedAction: async () => ({ ok: true, status: "executed" as const })
};

describe("adapter contract", () => {
  it("validates good adapter", () => {
    expect(validateAdapter(adapter).adapterId).toBe("custom");
  });

  it("rejects missing adapterId", () => {
    expect(() => validateAdapter({ ...adapter, adapterId: "" })).toThrow();
  });
});

import { describe, expect, it } from "vitest";

import { safeNormalizeCustomToolCall } from "./toolCallNormalizer.js";

describe("tool call normalizer", () => {
  it("converts custom tool call to ActionEnvelope", () => {
    const result = safeNormalizeCustomToolCall({ id: "read", tool: "filesystem.read", arguments: { path: "/mock/project/README.md" } });
    expect(result).toMatchObject({ ok: true, action: { toolName: "filesystem.read" } });
  });

  it("invalid normalized action fails closed", () => {
    expect(safeNormalizeCustomToolCall({ id: "bad", arguments: {} })).toMatchObject({ ok: false });
  });
});

import { describe, expect, it } from "vitest";

import { inferSideEffects } from "./sideEffectTypes.js";

function action(toolName: string, input: unknown = {}) {
  return {
    actionId: `action_${toolName}`,
    timestamp: "2026-06-27T00:00:00.000Z",
    actionType: "tool_call",
    toolName,
    input
  };
}

describe("side effect inference", () => {
  it("detects filesystem.read local_read", () => {
    expect(inferSideEffects({ action: action("filesystem.read"), capabilities: ["filesystem.read"] })).toContain("local_read");
  });

  it("detects network.post external_side_effect", () => {
    expect(inferSideEffects({ action: action("network.post", { url: "https://example.invalid" }), capabilities: ["network.write"] })).toEqual(
      expect.arrayContaining(["network_write", "external_side_effect"])
    );
  });

  it("detects package.install code_execution and package_install", () => {
    expect(inferSideEffects({ action: action("package.install"), capabilities: ["package.install"] })).toEqual(
      expect.arrayContaining(["code_execution", "package_install", "network_read", "local_write"])
    );
  });
});

import { describe, expect, it } from "vitest";

import { createRuntimeContext } from "../context/runtimeContext.js";
import { processAction } from "../processor/actionProcessor.js";
import { buildRuntimeCapabilityContext } from "./runtimeCapabilityContext.js";

const action = {
  actionId: "read_1",
  timestamp: "2026-06-26T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.read",
  input: { path: "/mock/project/readme.md" }
};

describe("runtime capability context", () => {
  it("builds observed capabilities", () => {
    expect(buildRuntimeCapabilityContext(action, undefined).capabilitiesObserved).toContain("filesystem.read");
  });

  it("runtime decision includes capabilitiesObserved", () => {
    const result = processAction(
      createRuntimeContext({
        policy: { version: 1, defaultDecision: "deny", rules: [{ id: "allow-read", match: { capability: "filesystem.read" }, decision: "allow" }] }
      }),
      action
    );

    expect(result.capabilitiesObserved).toContain("filesystem.read");
    expect(result.decision).toBe("allow");
  });
});

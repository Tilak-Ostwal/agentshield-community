import { describe, expect, it } from "vitest";

import { createRuntimeContext } from "../context/runtimeContext.js";
import { processAction } from "../processor/actionProcessor.js";

const policy = {
  version: 1,
  defaultDecision: "deny",
  rules: [{ id: "allow-read", match: { toolName: "filesystem.read" }, decision: "allow" }]
};

const readAction = {
  actionId: "read",
  timestamp: "2026-06-27T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.read",
  input: { path: "/mock/project/README.md" }
};

describe("execution broker", () => {
  it("allowed action creates execution contract", () => {
    const result = processAction(createRuntimeContext({ policy }), readAction, { execution: { enabled: true } });

    expect(result.executionContract).toMatchObject({ toolName: "filesystem.read", allowedSideEffects: ["local_read"] });
    expect(result.executionPreflightStatus).toBe("passed");
  });

  it("denied action does not create executable contract", () => {
    const result = processAction(createRuntimeContext({ policy }), { ...readAction, toolName: "network.post" }, { execution: { enabled: true } });

    expect(result.decision).toBe("deny");
    expect(result.executionContract).toBeUndefined();
    expect(result.executionPreflightStatus).toBe("not_applicable");
  });

  it("dry-run marks preflight dry_run", () => {
    const result = processAction(createRuntimeContext({ policy }), readAction, { execution: { enabled: true, dryRun: true } });

    expect(result.executionPreflightStatus).toBe("dry_run");
  });
});

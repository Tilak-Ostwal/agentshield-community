import { describe, expect, it } from "vitest";

import { SessionState } from "../../packages/core/src/session/sessionState.js";

describe("attack fixture: write then exec", () => {
  it("detects filesystem.write followed by shell.exec on the same path", () => {
    const session = new SessionState("attack_session_01");

    session.addAction({
      actionId: "write_payload",
      timestamp: "2026-06-25T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "filesystem.write",
      input: { path: "tmp/payload.js" }
    });
    session.addAction({
      actionId: "exec_payload",
      timestamp: "2026-06-25T00:00:01.000Z",
      actionType: "tool_call",
      toolName: "shell.exec",
      input: { path: "tmp/payload.js" }
    });

    expect(session.highRiskMarkers).toHaveLength(1);
    expect(session.highRiskMarkers[0]?.type).toBe("write_then_exec_same_path");
  });
});

import { describe, expect, it } from "vitest";

import { SessionState } from "./sessionState.js";

describe("session state", () => {
  it("tracks recent actions", () => {
    const session = new SessionState("session_01");

    session.addAction({
      actionId: "action_01",
      timestamp: "2026-06-25T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "filesystem.read"
    });
    session.addAction({
      actionId: "action_02",
      timestamp: "2026-06-25T00:00:01.000Z",
      actionType: "tool_call",
      toolName: "filesystem.write"
    });

    expect(session.getRecentActions(1).map((action) => action.actionId)).toEqual(["action_02"]);
  });

  it("marks filesystem.write followed by shell.exec on the same path as high risk", () => {
    const session = new SessionState("session_01");

    session.addAction({
      actionId: "write_01",
      timestamp: "2026-06-25T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "filesystem.write",
      input: { path: "scripts/run.sh" }
    });
    session.addAction({
      actionId: "exec_01",
      timestamp: "2026-06-25T00:00:01.000Z",
      actionType: "tool_call",
      toolName: "shell.exec",
      input: { path: "scripts/run.sh" }
    });

    expect(session.highRiskMarkers).toEqual([
      {
        type: "write_then_exec_same_path",
        path: "scripts/run.sh",
        writeActionId: "write_01",
        execActionId: "exec_01"
      }
    ]);
  });
});

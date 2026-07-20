import { describe, expect, it } from "vitest";

import { createRuntimeContext } from "../context/runtimeContext.js";
import { processAction } from "./actionProcessor.js";

describe("runtime attack flows", () => {
  it("requires review for write-then-exec even when broad policy allows tool calls", () => {
    const context = createRuntimeContext({
      policy: {
        version: 1,
        defaultDecision: "deny",
        rules: [
          {
            id: "allow-tool-calls",
            match: { actionType: "tool_call" },
            decision: "allow"
          }
        ]
      }
    });

    processAction(context, {
      actionId: "write_payload",
      timestamp: "2026-06-25T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "filesystem.write",
      input: { path: "tmp/payload.js" }
    });
    const decision = processAction(context, {
      actionId: "exec_payload",
      timestamp: "2026-06-25T00:00:01.000Z",
      actionType: "tool_call",
      toolName: "shell.exec",
      input: { path: "tmp/payload.js" }
    });

    expect(decision.decision).not.toBe("allow");
    expect(JSON.stringify(context.traceRecorder.getEvents())).toContain("session_risk_detected");
  });

  it("honors explicit deny over runtime review overlays", () => {
    const context = createRuntimeContext({
      policy: {
        version: 1,
        defaultDecision: "deny",
        rules: [
          {
            id: "deny-shell",
            match: { toolName: "shell.exec" },
            decision: "deny"
          }
        ]
      }
    });

    processAction(context, {
      actionId: "write_payload",
      timestamp: "2026-06-25T00:00:00.000Z",
      actionType: "tool_call",
      toolName: "filesystem.write",
      input: { path: "tmp/payload.js" }
    });
    const decision = processAction(context, {
      actionId: "exec_payload",
      timestamp: "2026-06-25T00:00:01.000Z",
      actionType: "tool_call",
      toolName: "shell.exec",
      input: { path: "tmp/payload.js" }
    });

    expect(decision).toMatchObject({
      decision: "deny",
      ruleId: "deny-shell"
    });
  });
});

import { actionEnvelopeSchema } from "@agentshield/core";
import { describe, expect, it } from "vitest";

import { filesystemReadRequest } from "../mock/mockMcpFixtures.js";
import { normalizeMcpToolCall } from "./normalizeMcpToolCall.js";

describe("normalizeMcpToolCall", () => {
  it("creates a valid ActionEnvelope", () => {
    const action = normalizeMcpToolCall(filesystemReadRequest, {
      now: () => new Date("2026-06-26T00:00:00.000Z"),
      sessionId: "mcp_session"
    });

    expect(actionEnvelopeSchema.safeParse(action).success).toBe(true);
    expect(action).toMatchObject({
      actionId: "req_read",
      sessionId: "mcp_session",
      actionType: "tool_call",
      toolName: "filesystem.read",
      input: {
        path: "/mock/project/readme.md"
      }
    });
  });

  it("rejects non tool-call requests", () => {
    expect(() =>
      normalizeMcpToolCall({
        jsonrpc: "2.0",
        id: "req_list",
        method: "tools/list"
      })
    ).toThrow("only tools/call");
  });
});

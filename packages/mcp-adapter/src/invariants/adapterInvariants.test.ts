import { checkNoRawSecrets } from "@agentshield/core";
import { describe, expect, it } from "vitest";

import { McpAdapter } from "../adapter/mcpAdapter.js";
import type { JsonRpcResponse } from "../jsonrpc/jsonRpcSchema.js";
import {
  filesystemReadRequest,
  filesystemWriteRequest,
  localToolReviewPolicy,
  readonlyMcpPolicy,
  secretExfiltrationRequest,
  shellExecRequest,
  unknownToolRequest
} from "../mock/mockMcpFixtures.js";
import { MockMcpServer } from "../mock/mockMcpServer.js";

function responseDecision(response: JsonRpcResponse): string {
  if (response.result !== undefined && typeof response.result === "object" && response.result !== null) {
    return String((response.result as Record<string, unknown>).decision);
  }

  if (response.error?.data !== undefined && typeof response.error.data === "object" && response.error.data !== null) {
    return String((response.error.data as Record<string, unknown>).decision);
  }

  return "deny";
}

describe("adapter security invariants", () => {
  it("invalid JSON-RPC cannot allow", () => {
    const response = new McpAdapter().handle({
      jsonrpc: "2.0",
      id: "bad",
      method: "unsupported"
    });

    expect(response.error).toBeDefined();
    expect(responseDecision(response)).not.toBe("allow");
  });

  it("tool execution only happens after policy allow", () => {
    const server = new MockMcpServer();
    const adapter = new McpAdapter({ policy: readonlyMcpPolicy, server });

    expect(server.callCount("filesystem.read")).toBe(0);
    const response = adapter.handle(filesystemReadRequest);

    expect(responseDecision(response)).toBe("allow");
    expect(server.callCount("filesystem.read")).toBe(1);
  });

  it("denied MCP calls do not call mock tools", () => {
    const server = new MockMcpServer();
    const response = new McpAdapter({ policy: readonlyMcpPolicy, server }).handle(unknownToolRequest);

    expect(responseDecision(response)).toBe("deny");
    expect(server.callCount("unknown.tool")).toBe(0);
  });

  it("blocked MCP calls do not call mock tools", () => {
    const server = new MockMcpServer();
    const adapter = new McpAdapter({ policy: localToolReviewPolicy, server });

    adapter.handle(filesystemWriteRequest);
    const response = adapter.handle(shellExecRequest);

    expect(responseDecision(response)).not.toBe("allow");
    expect(server.callCount("shell.exec")).toBe(0);
  });

  it("raw fake secrets never appear in adapter responses", () => {
    const response = new McpAdapter({ policy: readonlyMcpPolicy }).handle(secretExfiltrationRequest);

    expect(checkNoRawSecrets(response, ["sk-test-REDACT-ME"], "adapter-no-raw-secrets").passed).toBe(true);
  });

  it("adapter invariant checker reports failures clearly for bad response data", () => {
    const result = checkNoRawSecrets(
      {
        error: {
          data: {
            traceEvents: [{ data: { token: "sk-test-REDACT-ME" } }]
          }
        }
      },
      ["sk-test-REDACT-ME"],
      "adapter-no-raw-secrets"
    );

    expect(result.passed).toBe(false);
    expect(result.checks[0]?.message).toContain("raw secret leaked");
  });
});

import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  filesystemReadRequest,
  filesystemWriteRequest,
  listToolsRequest,
  localToolReviewPolicy,
  readonlyMcpPolicy,
  secretExfiltrationRequest,
  shellExecRequest,
  unknownToolRequest
} from "../mock/mockMcpFixtures.js";
import { MockMcpClient } from "../mock/mockMcpClient.js";
import { MockMcpServer } from "../mock/mockMcpServer.js";
import { McpAdapter, runMcpDemo } from "./mcpAdapter.js";

describe("McpAdapter", () => {
  it("returns available mock tools", () => {
    const response = new McpAdapter().handle(listToolsRequest);

    expect(response.error).toBeUndefined();
    expect(response.result).toMatchObject({
      tools: expect.arrayContaining([
        expect.objectContaining({ name: "filesystem.read" }),
        expect.objectContaining({ name: "network.post", capabilities: expect.arrayContaining(["network.write"]) })
      ])
    });
  });

  it("allows filesystem.read and calls the mock tool", () => {
    const server = new MockMcpServer();
    const adapter = new McpAdapter({ policy: readonlyMcpPolicy, server });
    const client = new MockMcpClient(adapter);
    const response = client.send(filesystemReadRequest);

    expect(response.error).toBeUndefined();
    expect(response.result).toMatchObject({
      decision: "allow",
      toolResult: {
        mockOnly: true
      }
    });
    expect(server.callCount("filesystem.read")).toBe(1);
  });

  it("denies unknown tools and does not call the mock server", () => {
    const server = new MockMcpServer();
    const response = new McpAdapter({ policy: readonlyMcpPolicy, server }).handle(unknownToolRequest);

    expect(response.error).toMatchObject({
      code: -32001,
      message: "tool call denied by AgentShield"
    });
    expect(server.callCount("unknown.tool")).toBe(0);
  });

  it("denies network.post secret exfiltration", () => {
    const server = new MockMcpServer();
    const response = new McpAdapter({ policy: readonlyMcpPolicy, server }).handle(secretExfiltrationRequest);

    expect(response.error).toMatchObject({
      code: -32001
    });
    expect(server.callCount("network.post")).toBe(0);
  });

  it("does not leak raw fake secrets in adapter response traces", () => {
    const response = new McpAdapter({ policy: readonlyMcpPolicy }).handle(secretExfiltrationRequest);
    const serialized = JSON.stringify(response);

    expect(serialized).not.toContain("sk-test-REDACT-ME");
    expect(serialized).toContain("[REDACTED]");
  });

  it("blocks filesystem.write followed by shell.exec on the same fake path", () => {
    const server = new MockMcpServer();
    const adapter = new McpAdapter({ policy: localToolReviewPolicy, server });

    expect(adapter.handle(filesystemWriteRequest).result).toMatchObject({
      decision: "allow"
    });

    const response = adapter.handle(shellExecRequest);

    expect(response.error).toMatchObject({
      code: -32001,
      message: "tool call denied by AgentShield",
      data: expect.objectContaining({
        decision: "deny"
      })
    });
    expect(server.callCount("shell.exec")).toBe(0);
  });

  it("fails closed for invalid JSON-RPC messages", () => {
    const response = new McpAdapter().handle({
      jsonrpc: "2.0",
      id: "req_bad",
      method: "tools/call",
      params: {
        arguments: {}
      }
    });

    expect(response).toMatchObject({
      jsonrpc: "2.0",
      id: "req_bad",
      error: {
        code: -32602
      }
    });
  });

  it("does not call mock tools when human review is required", () => {
    const server = new MockMcpServer();
    const adapter = new McpAdapter({ policy: localToolReviewPolicy, server });

    adapter.handle(filesystemWriteRequest);
    adapter.handle(shellExecRequest);

    expect(server.callCount("shell.exec")).toBe(0);
  });

  it("returns JSON-RPC error responses for denied tool calls", () => {
    const response = new McpAdapter({ policy: readonlyMcpPolicy }).handle(unknownToolRequest);

    expect(response.result).toBeUndefined();
    expect(response.error).toMatchObject({
      code: -32001,
      data: {
        decision: "deny"
      }
    });
  });

  it("does not touch real mock paths on disk", () => {
    new McpAdapter({ policy: localToolReviewPolicy }).handle(filesystemWriteRequest);

    expect(existsSync("/mock/project/payload.js")).toBe(false);
  });

  it("formats the local MCP demo", () => {
    expect(runMcpDemo()).toContain("Scenario: filesystem.read allowed");
    expect(JSON.parse(runMcpDemo("json"))).toMatchObject({
      total: 4,
      failed: 0
    });
  });
});

import { describe, expect, it } from "vitest";
import { McpProxySession } from "./mcpProxySession.js";

const config = { mode: "mock" as const, maxMessageBytes: 1024 * 1024, allowMethods: ["initialize", "initialized", "ping", "tools/list", "tools/call"] };

describe("proxy conformance", () => {
  it("lifecycle initialize returns safe capabilities", () => {
    const response = new McpProxySession({ config }).handle({ jsonrpc: "2.0", id: "init", method: "initialize" });
    expect(response).toMatchObject({ result: { serverInfo: { name: "agentshield-mock-proxy" } } });
  });

  it("initialized notification does not produce unsafe execution", () => {
    const session = new McpProxySession({ config });
    session.handle({ jsonrpc: "2.0", id: "init", method: "initialize" });
    expect(session.handleMessage({ jsonrpc: "2.0", method: "initialized" })).toBeUndefined();
    expect(session.forwardedCallCount).toBe(0);
  });

  it("unsupported method returns method-not-found", () => {
    expect(new McpProxySession({ config }).handle({ jsonrpc: "2.0", id: "x", method: "resources/list" })).toMatchObject({
      error: { code: -32601 }
    });
  });
});

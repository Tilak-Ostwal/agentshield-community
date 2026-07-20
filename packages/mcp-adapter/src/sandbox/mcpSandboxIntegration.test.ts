import { describe, expect, it } from "vitest";
import { McpProxySession } from "../proxy/mcpProxySession.js";
import { defaultProxyDemoPolicy, runMcpProxyDemo } from "../proxy/mcpProxy.js";

function session() {
  return new McpProxySession({
    config: { mode: "mock", maxMessageBytes: 1024 * 1024, allowMethods: ["initialize", "initialized", "ping", "tools/list", "tools/call"] },
    policy: {
      version: 1,
      defaultDecision: "deny",
      rules: [{ id: "allow-all", match: { actionType: "tool_call" }, decision: "allow" }]
    },
    sandboxEnabled: true
  });
}

describe("MCP sandbox integration", () => {
  it("does not forward sandbox blocked action", () => {
    const proxy = session();
    const response = proxy.handle({ jsonrpc: "2.0", id: "install", method: "tools/call", params: { name: "package.install", arguments: { packageName: "left-pad" } } });

    expect(response.error?.data).toMatchObject({ decision: "deny", sandboxDecision: { isolationLevel: "blocked" } });
    expect(proxy.forwardedCallCount).toBe(0);
  });

  it("does not forward dry_run_only action", () => {
    const proxy = session();
    const response = proxy.handle({ jsonrpc: "2.0", id: "exec", method: "tools/call", params: { name: "shell.exec", arguments: { command: "mock" } } });

    expect(response.error?.data).toMatchObject({ decision: "deny", sandboxDecision: { isolationLevel: "dry_run_only" } });
    expect(proxy.forwardedCallCount).toBe(0);
  });

  it("mcp-proxy-demo --sandbox works", () => {
    const result = runMcpProxyDemo({ sandboxEnabled: true, policy: defaultProxyDemoPolicy() });

    expect(result.failed).toBe(0);
    expect(result.results.some((step) => step.sandboxProfileId === "sandbox_readonly")).toBe(true);
  });

  it("sandbox output does not leak fake secret", () => {
    expect(JSON.stringify(runMcpProxyDemo({ sandboxEnabled: true }))).not.toContain("sk-test-REDACT-ME");
  });
});

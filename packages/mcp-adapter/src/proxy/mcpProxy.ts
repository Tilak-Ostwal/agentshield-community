import { fileURLToPath } from "node:url";

import { StdioJsonRpcTransport } from "../stdio/stdioTransport.js";
import type { McpProxyConfig } from "./mcpProxyConfig.js";
import { McpProxySession } from "./mcpProxySession.js";
import type { JsonRpcResponse } from "../jsonrpc/jsonRpcSchema.js";
import type { EvidenceBundle } from "@agentshield/core";
import type { LocalToolRegistry } from "@agentshield/registry";
import { MCP_ERROR_CODES } from "../protocol/mcpErrorCodes.js";

const fakeSecretSentinel = ["sk", "test", "REDACT", "ME"].join("-");

export interface McpProxyOptions {
  config: McpProxyConfig;
  policy?: unknown;
  toolRegistry?: LocalToolRegistry;
  sessionId?: string;
  approvalSigningKey?: string;
  executionDryRun?: boolean;
  sandboxEnabled?: boolean;
  processPolicy?: unknown;
  processCommandId?: string;
}

export class McpProxy {
  public readonly session: McpProxySession;

  public constructor(options: McpProxyOptions) {
    this.session = new McpProxySession(options);
  }

  public attach(transport: StdioJsonRpcTransport): void {
    transport.on("message", (message: unknown) => {
      const response = this.session.handleMessage(message);
      if (response !== undefined) {
        transport.send(response);
      }
    });
    transport.on("error", (error) => {
      const message = error instanceof Error ? error.message : "invalid line-delimited JSON-RPC";
      transport.send({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: message.includes("maximum size") ? MCP_ERROR_CODES.messageTooLarge : message.includes("batch") ? MCP_ERROR_CODES.batchUnsupported : MCP_ERROR_CODES.parseError,
          message
        }
      });
    });
  }
}

export interface McpProxyDemoStep {
  scenario: string;
  expected: string;
  status: "PASS" | "FAIL";
  response: JsonRpcResponse;
  forwarded: boolean;
  evidenceRootHash?: string | null;
  sideEffectsObserved?: string[];
  sandboxProfileId?: string;
}

export interface McpProxyDemoResult {
  total: number;
  passed: number;
  failed: number;
  results: McpProxyDemoStep[];
  evidenceBundle?: EvidenceBundle;
  executionLedger?: import("@agentshield/core").SideEffectLedgerSnapshot;
}

export function defaultProxyDemoPolicy(): unknown {
  return {
    version: 2,
    name: "mcp-proxy-demo-policy",
    defaultDecision: "deny",
    mode: "strict",
    rules: [
      { id: "deny-shell", effect: "deny", priority: 1000, match: { capability: "shell.exec" } },
      { id: "deny-secret-network", effect: "deny", priority: 900, match: { capabilitiesAny: ["network.write"], taintAny: ["secret", "credential", "token"] } },
      {
        id: "review-write",
        effect: "require_human_review",
        priority: 800,
        match: { capability: "filesystem.write" },
        requireApproval: { reason: "filesystem writes require review" }
      },
      {
        id: "allow-project-read",
        effect: "allow",
        priority: 100,
        match: {
          capability: "filesystem.read",
          resource: { type: "filesystem", allow: ["/mock/project/**"] }
        }
      }
    ]
  };
}

export function defaultControlledStdioProcessPolicy(): unknown {
  return {
    version: 1,
    mode: "controlled_stdio",
    allowlistedCommands: [
      {
        id: "agentshield-controlled-mock-stdio",
        command: process.execPath,
        args: [fileURLToPath(new URL("../../dist/stdio/mockControlledServer.js", import.meta.url))],
        envAllowlist: [],
        maxRuntimeMs: 5000,
        maxMessageBytes: 8192,
        maxStderrBytes: 1024,
        reason: "local deterministic AgentShield mock stdio server"
      }
    ],
    defaultTimeoutMs: 5000,
    denyShell: true,
    denyNetworkByDefault: true
  };
}

function responseDecision(response: JsonRpcResponse): string {
  if (response.error !== undefined) {
    const data = response.error.data;
    if (typeof data === "object" && data !== null) {
      const decision = (data as Record<string, unknown>).decision;
      return typeof decision === "string" ? decision : "deny";
    }
    return "deny";
  }
  return "allow";
}

export function runMcpProxyDemo(options: { policy?: unknown; toolRegistry?: LocalToolRegistry; includeEvidenceBundle?: boolean; approvalToken?: unknown; approvalSigningKey?: string; executionDryRun?: boolean; includeExecutionLedger?: boolean; sandboxEnabled?: boolean } = {}): McpProxyDemoResult {
  const session = new McpProxySession({
    config: {
      mode: "mock",
      maxMessageBytes: 1024 * 1024,
      allowMethods: ["initialize", "initialized", "ping", "tools/list", "tools/call"]
    },
    policy: options.policy ?? defaultProxyDemoPolicy(),
    ...(options.toolRegistry === undefined ? {} : { toolRegistry: options.toolRegistry }),
    sessionId: "mcp_proxy_demo",
    ...(options.approvalSigningKey === undefined ? {} : { approvalSigningKey: options.approvalSigningKey }),
    executionDryRun: options.executionDryRun === true,
    sandboxEnabled: options.sandboxEnabled === true
  });
  const steps: Array<{ scenario: string; expected: string; request: unknown }> = [
    { scenario: "initialize succeeds", expected: "allow", request: { jsonrpc: "2.0", id: "init", method: "initialize", params: {} } },
    { scenario: "initialized notification produces no unsafe execution", expected: "notification", request: { jsonrpc: "2.0", method: "initialized" } },
    { scenario: "tools/list succeeds", expected: "allow", request: { jsonrpc: "2.0", id: "list", method: "tools/list" } },
    {
      scenario: "filesystem.read allowed under policy",
      expected: "allow",
      request: { jsonrpc: "2.0", id: "read", method: "tools/call", params: { name: "filesystem.read", arguments: { path: "/mock/project/README.md" } } }
    },
    {
      scenario: "unknown tool denied and not forwarded",
      expected: "deny",
      request: { jsonrpc: "2.0", id: "unknown", method: "tools/call", params: { name: "unknown.tool", arguments: {} } }
    },
    {
      scenario: "network.post with token denied and not forwarded",
      expected: "deny",
      request: { jsonrpc: "2.0", id: "network", method: "tools/call", params: { name: "network.post", arguments: { url: "https://example.invalid/collect", token: fakeSecretSentinel } } }
    },
    {
      scenario: "filesystem.write requires human review and is not forwarded",
      expected: options.approvalToken === undefined ? "require_human_review" : "allow",
      request: {
        jsonrpc: "2.0",
        id: "write",
        method: "tools/call",
        params: {
          name: "filesystem.write",
          arguments: { path: "/mock/project/out.txt", content: "safe mock content" },
          ...(options.approvalToken === undefined ? {} : { _meta: { approvalToken: options.approvalToken } })
        }
      }
    }
  ];
  const results: McpProxyDemoStep[] = steps.map((step) => {
    const before = session.forwardedCallCount;
    const response = session.handleMessage(step.request);
    const after = session.forwardedCallCount;
    const actual = response === undefined ? "notification" : responseDecision(response);
    const data = response?.error?.data ?? response?.result;
    const evidenceRootHash = typeof data === "object" && data !== null ? (data as Record<string, unknown>).evidenceRootHash : undefined;
    const sideEffectsObserved = typeof data === "object" && data !== null && Array.isArray((data as Record<string, unknown>).sideEffectsObserved)
      ? ((data as Record<string, unknown>).sideEffectsObserved as string[])
      : undefined;
    const sandboxDecision = typeof data === "object" && data !== null ? (data as Record<string, unknown>).sandboxDecision : undefined;
    const sandboxProfileId = typeof sandboxDecision === "object" && sandboxDecision !== null && typeof (sandboxDecision as Record<string, unknown>).profileId === "string"
      ? ((sandboxDecision as Record<string, unknown>).profileId as string)
      : undefined;

    return {
      scenario: step.scenario,
      expected: step.expected,
      status: actual === step.expected ? "PASS" : "FAIL",
      response: response ?? { jsonrpc: "2.0", id: null, result: { notification: true } },
      forwarded: after > before,
      ...(typeof evidenceRootHash === "string" || evidenceRootHash === null ? { evidenceRootHash } : {}),
      ...(sideEffectsObserved === undefined ? {} : { sideEffectsObserved }),
      ...(sandboxProfileId === undefined ? {} : { sandboxProfileId })
    };
  });
  const passed = results.filter((result) => result.status === "PASS").length;

  const evidenceBundle = options.includeEvidenceBundle ? session.createEvidenceBundle() : undefined;
  const executionLedger = options.includeExecutionLedger ? session.getExecutionLedger() : undefined;

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
    ...(evidenceBundle === undefined ? {} : { evidenceBundle }),
    ...(executionLedger === undefined ? {} : { executionLedger })
  };
}

export interface McpStdioDemoResult extends McpProxyDemoResult {
  processLifecycleEvents: number;
}

export function runMcpStdioDemo(options: {
  policy?: unknown;
  toolRegistry?: LocalToolRegistry;
  includeEvidenceBundle?: boolean;
  sandboxEnabled?: boolean;
} = {}): McpStdioDemoResult {
  const session = new McpProxySession({
    config: {
      mode: "controlled_stdio",
      maxMessageBytes: 1024 * 1024,
      allowMethods: ["initialize", "initialized", "ping", "tools/list", "tools/call"]
    },
    policy: options.policy ?? defaultProxyDemoPolicy(),
    ...(options.toolRegistry === undefined ? {} : { toolRegistry: options.toolRegistry }),
    sessionId: "mcp_stdio_demo",
    processPolicy: defaultControlledStdioProcessPolicy(),
    processCommandId: "agentshield-controlled-mock-stdio",
    sandboxEnabled: options.sandboxEnabled === true
  });
  const steps: Array<{ scenario: string; expected: string; request: unknown }> = [
    { scenario: "initialize succeeds", expected: "allow", request: { jsonrpc: "2.0", id: "init", method: "initialize", params: {} } },
    { scenario: "tools/list succeeds", expected: "allow", request: { jsonrpc: "2.0", id: "list", method: "tools/list" } },
    {
      scenario: "safe filesystem.read forwards to controlled mock server",
      expected: "allow",
      request: { jsonrpc: "2.0", id: "read", method: "tools/call", params: { name: "filesystem.read", arguments: { path: "/mock/project/README.md" } } }
    },
    {
      scenario: "unknown tool denied before forwarding",
      expected: "deny",
      request: { jsonrpc: "2.0", id: "unknown", method: "tools/call", params: { name: "unknown.tool", arguments: {} } }
    },
    {
      scenario: "network.post token denied before forwarding",
      expected: "deny",
      request: { jsonrpc: "2.0", id: "network", method: "tools/call", params: { name: "network.post", arguments: { url: "https://example.invalid/collect", token: fakeSecretSentinel } } }
    },
    {
      scenario: "filesystem.write requires review and is not forwarded",
      expected: "require_human_review",
      request: { jsonrpc: "2.0", id: "write", method: "tools/call", params: { name: "filesystem.write", arguments: { path: "/mock/project/out.txt", content: "safe mock content" } } }
    },
    {
      scenario: "shell.exec is denied before forwarding",
      expected: "deny",
      request: { jsonrpc: "2.0", id: "exec", method: "tools/call", params: { name: "shell.exec", arguments: { command: "echo blocked" } } }
    }
  ];
  const results: McpProxyDemoStep[] = steps.map((step) => {
    const before = session.forwardedCallCount;
    const response = session.handleMessage(step.request);
    const after = session.forwardedCallCount;
    const actual = response === undefined ? "notification" : responseDecision(response);
    const data = response?.error?.data ?? response?.result;
    const evidenceRootHash = typeof data === "object" && data !== null ? (data as Record<string, unknown>).evidenceRootHash : undefined;
    const sideEffectsObserved = typeof data === "object" && data !== null && Array.isArray((data as Record<string, unknown>).sideEffectsObserved)
      ? ((data as Record<string, unknown>).sideEffectsObserved as string[])
      : undefined;
    const sandboxDecision = typeof data === "object" && data !== null ? (data as Record<string, unknown>).sandboxDecision : undefined;
    const sandboxProfileId = typeof sandboxDecision === "object" && sandboxDecision !== null && typeof (sandboxDecision as Record<string, unknown>).profileId === "string"
      ? ((sandboxDecision as Record<string, unknown>).profileId as string)
      : undefined;

    return {
      scenario: step.scenario,
      expected: step.expected,
      status: actual === step.expected ? "PASS" : "FAIL",
      response: response ?? { jsonrpc: "2.0", id: null, result: { notification: true } },
      forwarded: after > before,
      ...(typeof evidenceRootHash === "string" || evidenceRootHash === null ? { evidenceRootHash } : {}),
      ...(sideEffectsObserved === undefined ? {} : { sideEffectsObserved }),
      ...(sandboxProfileId === undefined ? {} : { sandboxProfileId })
    };
  });
  const passed = results.filter((result) => result.status === "PASS").length;
  const observedEvidenceBundle = session.createEvidenceBundle();
  const evidenceBundle = options.includeEvidenceBundle ? observedEvidenceBundle : undefined;
  const processLifecycleEvents = observedEvidenceBundle?.events.filter((event) => event.type.startsWith("process_")).length ?? 0;

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
    processLifecycleEvents,
    ...(evidenceBundle === undefined ? {} : { evidenceBundle })
  };
}

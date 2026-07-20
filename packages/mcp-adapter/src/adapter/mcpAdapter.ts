import { redactSecrets, type Policy, type PolicyDecision } from "@agentshield/core";
import { createRuntimeContext, processAction, type RuntimeContext } from "@agentshield/runtime";

import {
  jsonRpcRequestSchema,
  mcpToolCallParamsSchema,
  type JsonRpcId,
  type JsonRpcRequest,
  type JsonRpcResponse
} from "../jsonrpc/jsonRpcSchema.js";
import {
  filesystemReadRequest,
  filesystemWriteRequest,
  readonlyMcpPolicy,
  secretExfiltrationRequest,
  shellExecRequest,
  unknownToolRequest
} from "../mock/mockMcpFixtures.js";
import { MockMcpServer } from "../mock/mockMcpServer.js";
import { normalizeMcpToolCall } from "../normalize/normalizeMcpToolCall.js";

export interface McpAdapterOptions {
  policy?: Policy;
  server?: MockMcpServer;
  sessionId?: string;
  now?: () => Date;
}

export interface McpDemoStepResult {
  scenario: string;
  expected: PolicyDecision | string;
  actual: PolicyDecision;
  status: "PASS" | "FAIL";
  response: JsonRpcResponse;
}

export interface McpDemoRunResult {
  total: number;
  passed: number;
  failed: number;
  results: McpDemoStepResult[];
}

function errorResponse(id: JsonRpcId, code: number, message: string, data?: unknown): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data === undefined ? {} : { data: redactSecrets(data).value })
    }
  };
}

function decisionFromResponse(response: JsonRpcResponse): PolicyDecision {
  if (response.error !== undefined) {
    const data = response.error.data;

    if (typeof data === "object" && data !== null) {
      const decision = (data as Record<string, unknown>).decision;

      if (
        decision === "allow" ||
        decision === "deny" ||
        decision === "redact" ||
        decision === "require_human_review"
      ) {
        return decision;
      }
    }

    return "deny";
  }

  return "allow";
}

function graphFindingCount(response: JsonRpcResponse): number {
  const data = response.error?.data;

  if (typeof data !== "object" || data === null) {
    return 0;
  }

  const traceEvents = (data as Record<string, unknown>).traceEvents;

  if (!Array.isArray(traceEvents)) {
    return 0;
  }

  return traceEvents.filter((event) => {
    return (
      typeof event === "object" &&
      event !== null &&
      (event as Record<string, unknown>).type === "attack_graph_finding"
    );
  }).length;
}

function observedCapabilities(response: JsonRpcResponse): string[] {
  const result = response.result;
  if (typeof result === "object" && result !== null) {
    const capabilities = (result as Record<string, unknown>).capabilitiesObserved;
    return Array.isArray(capabilities) ? capabilities.filter((item): item is string => typeof item === "string") : [];
  }
  const data = response.error?.data;
  if (typeof data === "object" && data !== null) {
    const capabilities = (data as Record<string, unknown>).capabilitiesObserved;
    return Array.isArray(capabilities) ? capabilities.filter((item): item is string => typeof item === "string") : [];
  }
  return [];
}

function observedTaint(response: JsonRpcResponse): string[] {
  const result = response.result;
  if (typeof result === "object" && result !== null) {
    const taint = (result as Record<string, unknown>).taintObserved;
    return Array.isArray(taint) ? taint.filter((item): item is string => typeof item === "string") : [];
  }
  const data = response.error?.data;
  if (typeof data === "object" && data !== null) {
    const taint = (data as Record<string, unknown>).taintObserved;
    return Array.isArray(taint) ? taint.filter((item): item is string => typeof item === "string") : [];
  }
  return [];
}

export class McpAdapter {
  private readonly server: MockMcpServer;
  private readonly context: RuntimeContext;
  private readonly now: () => Date;

  public constructor(options: McpAdapterOptions = {}) {
    const sessionId = options.sessionId ?? "mcp_session";

    this.server = options.server ?? new MockMcpServer();
    this.now = options.now ?? (() => new Date("2026-06-26T00:00:00.000Z"));
    this.context = createRuntimeContext({
      policy: options.policy ?? readonlyMcpPolicy,
      sessionId,
      traceId: `trace_${sessionId}`,
      now: this.now
    });
  }

  public handle(input: unknown): JsonRpcResponse {
    const parsed = jsonRpcRequestSchema.safeParse(input);

    if (!parsed.success) {
      return errorResponse(null, -32600, "invalid JSON-RPC request");
    }

    const request = parsed.data;

    if (request.method === "tools/list") {
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          tools: this.server.listTools().map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            capabilities: tool.metadata.capabilities
          }))
        }
      };
    }

    return this.handleToolCall(request);
  }

  private handleToolCall(request: JsonRpcRequest): JsonRpcResponse {
    const params = mcpToolCallParamsSchema.safeParse(request.params);

    if (!params.success) {
      return errorResponse(request.id, -32602, "invalid tools/call params");
    }

    try {
      const action = normalizeMcpToolCall(request, {
        now: this.now,
        sessionId: this.context.session.sessionId
      });
      const toolMetadata = this.server.getToolMetadata(params.data.name);
      const decision =
        toolMetadata === undefined
          ? processAction(this.context, action)
          : processAction(this.context, action, { toolMetadata });
      const traceEvents = this.context.traceRecorder.getEvents(decision.traceId);
      const decisionData = {
        decision: decision.decision,
        ruleId: decision.ruleId,
        reason: decision.reason,
        traceId: decision.traceId,
        eventIds: decision.eventIds,
        traceEvents,
        capabilitiesObserved: decision.capabilitiesObserved,
        taintObserved: decision.taintObserved
      };

      if (decision.decision === "deny") {
        return errorResponse(request.id, -32001, "tool call denied by AgentShield", decisionData);
      }

      if (decision.decision === "require_human_review") {
        return errorResponse(request.id, -32002, "tool call requires human review", decisionData);
      }

      if (decision.decision !== "allow") {
        return errorResponse(request.id, -32003, "tool call blocked by AgentShield", decisionData);
      }

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          decision: decision.decision,
          toolResult: this.server.callTool({
            toolName: params.data.name,
            arguments: params.data.arguments ?? {}
          }),
          traceId: decision.traceId,
          eventIds: decision.eventIds,
          capabilitiesObserved: decision.capabilitiesObserved,
          taintObserved: decision.taintObserved
        }
      };
    } catch {
      return errorResponse(request.id, -32603, "adapter failed closed");
    }
  }
}

export function runMcpDemo(format: "text" | "json" = "text"): string {
  const readonlyAdapter = new McpAdapter({ policy: readonlyMcpPolicy, sessionId: "mcp_demo_readonly" });
  const reviewAdapter = new McpAdapter({
    policy: {
      version: 1,
      defaultDecision: "deny",
      rules: [
        {
          id: "allow-demo-local-tool-calls",
          match: {
            actionType: "tool_call"
          },
          decision: "allow"
        }
      ]
    },
    sessionId: "mcp_demo_review"
  });

  const steps: Array<{
    scenario: string;
    expected: PolicyDecision | string;
    response: JsonRpcResponse;
  }> = [
    {
      scenario: "filesystem.read allowed",
      expected: "allow",
      response: readonlyAdapter.handle(filesystemReadRequest)
    },
    {
      scenario: "unknown.tool denied",
      expected: "deny",
      response: readonlyAdapter.handle(unknownToolRequest)
    },
    {
      scenario: "network.post secret exfiltration denied",
      expected: "deny",
      response: readonlyAdapter.handle(secretExfiltrationRequest)
    }
  ];

  reviewAdapter.handle(filesystemWriteRequest);
  steps.push({
    scenario: "write then exec requires human review",
    expected: "deny",
    response: reviewAdapter.handle(shellExecRequest)
  });

  const results = steps.map((step) => {
    const actual = decisionFromResponse(step.response);

    return {
      ...step,
      actual,
      status: actual === step.expected ? "PASS" : "FAIL"
    } satisfies McpDemoStepResult;
  });
  const passed = results.filter((result) => result.status === "PASS").length;
  const run = {
    total: results.length,
    passed,
    failed: results.length - passed,
    results
  } satisfies McpDemoRunResult;

  if (format === "json") {
    return JSON.stringify(run, null, 2);
  }

  return run.results
    .map((result) => {
      const lines = [
        `Scenario: ${result.scenario}`,
        `Expected: ${result.expected}`,
        `Actual: ${result.actual}`,
        `Status: ${result.status}`
      ];
      const graphFindings = graphFindingCount(result.response);

      if (graphFindings > 0) {
        lines.push(`Graph Risk: ${graphFindings} attack graph finding(s)`);
      }
      const capabilities = observedCapabilities(result.response);
      if (capabilities.length > 0) {
        lines.push(`Capabilities: ${capabilities.join(", ")}`);
      }
      const taint = observedTaint(result.response);
      if (taint.length > 0) {
        lines.push(`Taint: ${taint.join(", ")}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

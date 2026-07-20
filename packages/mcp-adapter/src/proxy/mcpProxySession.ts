import {
  approvalTokenSchema,
  redactSecrets,
  type EvidenceBundle,
  type Policy,
  type PolicyDecision,
  type SideEffectLedgerSnapshot
} from "@agentshield/core";
import {
  createRuntimeContext,
  processAction,
  recordExecutionLedger,
  validateBrokerResponse,
  type EvidenceTraceRecorder,
  type RuntimeContext
} from "@agentshield/runtime";
import type { LocalToolRegistry } from "@agentshield/registry";

import {
  jsonRpcMessageSchema,
  jsonRpcResponseSchema,
  mcpToolCallParamsSchema,
  type JsonRpcId,
  type JsonRpcRequest,
  type JsonRpcResponse
} from "../jsonrpc/jsonRpcSchema.js";
import { MockMcpServer } from "../mock/mockMcpServer.js";
import { normalizeMcpToolCall } from "../normalize/normalizeMcpToolCall.js";
import { MCP_ERROR_CODES } from "../protocol/mcpErrorCodes.js";
import { McpLifecycle } from "../protocol/mcpLifecycle.js";
import { classifyMcpMethod } from "../protocol/mcpMethodPolicy.js";
import { runControlledStdioRequest } from "../stdio/controlledStdioMode.js";
import type { ProcessLifecycleEvent } from "../process/processSupervisor.js";
import type { McpProxyConfig } from "./mcpProxyConfig.js";

export interface McpProxySessionOptions {
  config: McpProxyConfig;
  policy?: Policy | unknown;
  toolRegistry?: LocalToolRegistry;
  server?: MockMcpServer;
  sessionId?: string;
  now?: () => Date;
  approvalSigningKey?: string;
  executionDryRun?: boolean;
  executionEnabled?: boolean;
  sandboxEnabled?: boolean;
  processPolicy?: unknown;
  processCommandId?: string;
}

export interface McpProxyDecisionLog {
  requestId: JsonRpcId;
  method: string;
  toolName?: string;
  decision: PolicyDecision | "invalid";
  forwarded: boolean;
  traceId?: string;
  evidenceRootHash?: string | null;
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

function safeDemoPolicy(): Policy {
  return {
    version: 1,
    defaultDecision: "deny",
    rules: [
      {
        id: "allow-safe-mock-filesystem-read",
        match: {
          actionType: "tool_call",
          toolName: "filesystem.read"
        },
        decision: "allow"
      }
    ]
  };
}

export class McpProxySession {
  private readonly context: RuntimeContext;
  private readonly server: MockMcpServer;
  private readonly now: () => Date;
  private readonly logs: McpProxyDecisionLog[] = [];
  private readonly lifecycle = new McpLifecycle();
  private controlledToolForwardCount = 0;

  public constructor(private readonly options: McpProxySessionOptions) {
    const sessionId = options.sessionId ?? "mcp_proxy_session";
    this.now = options.now ?? (() => new Date("2026-06-26T00:00:00.000Z"));
    this.server = options.server ?? new MockMcpServer();
    this.context = createRuntimeContext({
      policy: options.policy ?? safeDemoPolicy(),
      sessionId,
      traceId: `trace_${sessionId}`,
      now: this.now,
      ...(options.toolRegistry === undefined ? {} : { toolRegistry: options.toolRegistry })
    });
  }

  public get forwardedCallCount(): number {
    return this.server.listTools().reduce((sum, tool) => sum + this.server.callCount(tool.name), 0) + this.controlledToolForwardCount;
  }

  public getDecisionLogs(): McpProxyDecisionLog[] {
    return this.logs.map((log) => ({ ...log }));
  }

  public createEvidenceBundle(generatedAt = "2026-06-26T00:00:00.000Z"): EvidenceBundle | undefined {
    const recorder = this.context.traceRecorder as EvidenceTraceRecorder;

    if (typeof recorder.createEvidenceBundle !== "function") {
      return undefined;
    }

    return recorder.createEvidenceBundle(this.context.traceId, generatedAt);
  }

  public getExecutionLedger(): SideEffectLedgerSnapshot {
    return this.context.executionLedger.snapshot();
  }

  private recordProcessLifecycle(events: ProcessLifecycleEvent[]): void {
    for (const event of events) {
      this.context.traceRecorder.record({
        trace_id: this.context.traceId,
        event_id: this.context.nextEventId(),
        timestamp: this.now().toISOString(),
        type: event.type,
        actor: { kind: "runtime", id: this.context.runtimeId },
        data: redactSecrets(event.data).value as Record<string, unknown>,
        redactions: []
      });
    }
  }

  private forwardControlledRequest(request: JsonRpcRequest): JsonRpcResponse {
    const result = runControlledStdioRequest({
      processPolicy: this.options.processPolicy,
      commandId: this.options.processCommandId ?? "agentshield-controlled-mock-stdio",
      request
    });
    this.recordProcessLifecycle(result.lifecycle);

    if (!result.ok) {
      return errorResponse(request.id, MCP_ERROR_CODES.internalFailClosed, result.error.message, {
        code: result.error.code,
        stderr: result.stderr
      });
    }

    const response = jsonRpcResponseSchema.safeParse(result.response);
    if (!response.success) {
      return errorResponse(request.id, MCP_ERROR_CODES.internalFailClosed, "controlled stdio returned invalid response");
    }

    return response.data;
  }

  public handle(input: unknown): JsonRpcResponse {
    return this.handleMessage(input) ?? errorResponse(null, MCP_ERROR_CODES.invalidRequest, "notification did not produce a response");
  }

  public handleMessage(input: unknown): JsonRpcResponse | undefined {
    const parsed = jsonRpcMessageSchema.safeParse(input);

    if (!parsed.success) {
      this.logs.push({ requestId: null, method: "invalid", decision: "invalid", forwarded: false });
      return errorResponse(null, MCP_ERROR_CODES.invalidRequest, "invalid JSON-RPC request");
    }

    const message = parsed.data;
    const hasId = message.id !== undefined;
    const disposition = classifyMcpMethod(message.method, hasId);

    if (disposition === "notification") {
      const lifecycle = this.lifecycle.observe(message.method);
      this.logs.push({ requestId: null, method: message.method, decision: lifecycle.ok ? "invalid" : "deny", forwarded: false });
      return undefined;
    }

    if (!hasId) {
      this.logs.push({ requestId: null, method: message.method, decision: "invalid", forwarded: false });
      return undefined;
    }

    const request: JsonRpcRequest = {
      jsonrpc: message.jsonrpc,
      id: message.id ?? null,
      method: message.method,
      ...(message.params === undefined ? {} : { params: message.params })
    };

    if (disposition === "unsupported" || !this.options.config.allowMethods.includes(request.method)) {
      this.logs.push({ requestId: request.id, method: request.method, decision: "deny", forwarded: false });
      return errorResponse(request.id, MCP_ERROR_CODES.methodNotFound, "method not found");
    }

    if (this.options.config.mode === "stdio") {
      this.logs.push({ requestId: request.id, method: request.method, decision: "deny", forwarded: false });
      return errorResponse(request.id, MCP_ERROR_CODES.internalFailClosed, "stdio child process mode is not supported in this safe skeleton");
    }

    if (request.method === "initialize") {
      this.lifecycle.observe("initialize");
      if (this.options.config.mode === "controlled_stdio") {
        return this.forwardControlledRequest(request);
      }
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "agentshield-mock-proxy", version: "0.0.0" },
          capabilities: { tools: { listChanged: false } }
        }
      };
    }

    if (request.method === "ping") {
      return { jsonrpc: "2.0", id: request.id, result: {} };
    }

    if (request.method === "tools/list") {
      if (this.options.config.mode === "controlled_stdio") {
        return this.forwardControlledRequest(request);
      }
      return {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          tools: this.server.listTools().map((tool) => ({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            capabilities: tool.metadata.capabilities,
            ...(this.options.toolRegistry === undefined ? {} : {
              registryTrustLevel: this.options.toolRegistry.getEntry(tool.metadata.serverName, tool.metadata.toolName)?.trustLevel ?? "missing"
            })
          }))
        }
      };
    }

    if (request.method === "tools/call") {
      return this.handleToolCall(request);
    }

    this.logs.push({ requestId: request.id, method: request.method, decision: "deny", forwarded: false });
    return errorResponse(request.id, MCP_ERROR_CODES.methodNotFound, "method not found");
  }

  private handleToolCall(request: JsonRpcRequest): JsonRpcResponse {
    const params = mcpToolCallParamsSchema.safeParse(request.params);

    if (!params.success) {
      this.logs.push({ requestId: request.id, method: request.method, decision: "deny", forwarded: false });
      return errorResponse(request.id, MCP_ERROR_CODES.invalidParams, "invalid tools/call params");
    }

    try {
      const action = normalizeMcpToolCall(request, {
        now: this.now,
        sessionId: this.context.session.sessionId
      });
      const metadata = this.server.getToolMetadata(params.data.name);
      const approvalToken = approvalTokenSchema.safeParse(params.data._meta?.approvalToken);
      const approval =
        approvalToken.success && this.options.approvalSigningKey !== undefined
          ? { token: approvalToken.data, signingKey: this.options.approvalSigningKey }
          : undefined;
      const processOptions = {
        ...(metadata === undefined ? {} : { toolMetadata: metadata }),
        ...(approval === undefined ? {} : { approval }),
        execution: {
          enabled: this.options.executionEnabled ?? true,
          dryRun: this.options.executionDryRun === true,
          ...(approvalToken.success ? { approvalToken: approvalToken.data } : {})
        },
        sandbox: { enabled: this.options.sandboxEnabled === true }
      };
      const decision = processAction(this.context, action, processOptions);
      const baseData = {
        decision: decision.decision,
        ruleId: decision.ruleId,
        reason: decision.reason,
        traceId: decision.traceId,
        eventIds: decision.eventIds,
        evidenceRootHash: decision.evidenceRootHash,
        capabilitiesObserved: decision.capabilitiesObserved,
        taintObserved: decision.taintObserved,
        approvalStatus: decision.approvalStatus,
        executionPreflightStatus: decision.executionPreflightStatus,
        sideEffectsObserved: decision.sideEffectsObserved,
        ...(decision.sandboxDecision === undefined
          ? {}
          : {
              sandboxDecision: {
                required: decision.sandboxDecision.required,
                profileId: decision.sandboxDecision.profileId,
                isolationLevel: decision.sandboxDecision.isolationLevel,
                reason: decision.sandboxDecision.reason,
                decisionImpact: decision.sandboxDecision.decisionImpact
              }
            }),
        ...(decision.executionContract === undefined
          ? {}
          : {
              executionContract: {
                contractId: decision.executionContract.contractId,
                actionId: decision.executionContract.actionId,
                actionHash: decision.executionContract.actionHash,
                toolName: decision.executionContract.toolName,
                allowedSideEffects: decision.executionContract.allowedSideEffects,
                forbiddenSideEffects: decision.executionContract.forbiddenSideEffects,
                dryRunSupported: decision.executionContract.dryRunSupported,
                reversible: decision.executionContract.reversible,
                expiresAt: decision.executionContract.expiresAt,
                reason: decision.executionContract.reason
              }
            }),
        ...(decision.approvalTicket === undefined
          ? {}
          : {
              approvalTicket: decision.approvalTicket
            })
      };

      if (decision.decision !== "allow") {
        this.logs.push({
          requestId: request.id,
          method: request.method,
          toolName: params.data.name,
          decision: decision.decision,
          forwarded: false,
          traceId: decision.traceId,
          ...(decision.evidenceRootHash === undefined ? {} : { evidenceRootHash: decision.evidenceRootHash })
        });

        return errorResponse(
          request.id,
          decision.decision === "require_human_review" ? MCP_ERROR_CODES.humanReviewRequired : MCP_ERROR_CODES.policyDenied,
          decision.decision === "require_human_review" ? "tool call requires human review" : "tool call denied by AgentShield",
          baseData
        );
      }

      if (decision.executionPreflightStatus === "failed" || decision.executionContract === undefined) {
        recordExecutionLedger({
          context: this.context,
          action,
          decision: "deny",
          actionHash: decision.executionContract?.actionHash ?? decision.approvalTicket?.actionHash ?? action.actionId,
          toolName: params.data.name,
          sideEffectsAllowed: decision.executionContract?.allowedSideEffects ?? [],
          sideEffectsObserved: decision.sideEffectsObserved,
          forwarded: false,
          dryRun: false
        });
        return errorResponse(request.id, MCP_ERROR_CODES.policyDenied, "tool call failed execution preflight", baseData);
      }

      if (decision.executionPreflightStatus === "dry_run") {
        recordExecutionLedger({
          context: this.context,
          action,
          decision: "allow",
          actionHash: decision.executionContract.actionHash,
          toolName: params.data.name,
          sideEffectsAllowed: decision.executionContract.allowedSideEffects,
          sideEffectsObserved: decision.sideEffectsObserved,
          forwarded: false,
          dryRun: true
        });
        return {
          jsonrpc: "2.0",
          id: request.id,
          result: redactSecrets({
            ...baseData,
            dryRun: true,
            toolResult: {
              content: [{ type: "text", text: `dry-run simulated result for ${params.data.name}; no tool was forwarded` }],
              mockOnly: true
            }
          }).value
        };
      }

      let toolResult: unknown;
      if (this.options.config.mode === "controlled_stdio") {
        const processResponse = this.forwardControlledRequest(request);
        if (processResponse.error !== undefined) {
          recordExecutionLedger({
            context: this.context,
            action,
            decision: "deny",
            actionHash: decision.executionContract.actionHash,
            toolName: params.data.name,
            sideEffectsAllowed: decision.executionContract.allowedSideEffects,
            sideEffectsObserved: decision.sideEffectsObserved,
            forwarded: false,
            dryRun: false
          });
          return processResponse;
        }
        this.controlledToolForwardCount += 1;
        toolResult = processResponse.result;
      } else {
        toolResult = this.server.callTool({
          toolName: params.data.name,
          arguments: params.data.arguments ?? {}
        });
      }
      const responseValidation = validateBrokerResponse({
        context: this.context,
        contract: decision.executionContract,
        response: toolResult
      });
      recordExecutionLedger({
        context: this.context,
        action,
        decision: responseValidation.ok ? "allow" : "deny",
        actionHash: decision.executionContract.actionHash,
        toolName: params.data.name,
        sideEffectsAllowed: decision.executionContract.allowedSideEffects,
        sideEffectsObserved: responseValidation.observedSideEffects.length > 0 ? responseValidation.observedSideEffects : decision.sideEffectsObserved,
        forwarded: true,
        dryRun: false
      });
      this.logs.push({
        requestId: request.id,
        method: request.method,
        toolName: params.data.name,
        decision: decision.decision,
        forwarded: true,
        traceId: decision.traceId,
        ...(decision.evidenceRootHash === undefined ? {} : { evidenceRootHash: decision.evidenceRootHash })
      });

      return {
        jsonrpc: "2.0",
        id: request.id,
        result: redactSecrets({
          ...baseData,
          responseValidation: {
            ok: responseValidation.ok,
            violations: responseValidation.violations,
            responseBytes: responseValidation.responseBytes
          },
          toolResult: responseValidation.redactedResponse
        }).value
      };
    } catch {
      this.logs.push({ requestId: request.id, method: request.method, decision: "deny", forwarded: false });
      return errorResponse(request.id, MCP_ERROR_CODES.internalFailClosed, "proxy failed closed");
    }
  }
}

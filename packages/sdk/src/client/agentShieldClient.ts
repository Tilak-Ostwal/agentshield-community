import {
  redactSecrets,
  verifyEvidenceBundle,
  type ActionEnvelope,
  type EvidenceBundle,
  type PolicyDecision,
  type TraceEvent
} from "@agentshield/core";
import { runDefaultBenchmark, type ScoringProfileName } from "@agentshield/bench";
import { MockMcpServer, McpProxySession, type JsonRpcResponse } from "@agentshield/mcp-adapter";
import type { LocalToolRegistry } from "@agentshield/registry";
import {
  createRuntimeContext,
  processAction as runtimeProcessAction,
  type EvidenceTraceRecorder,
  type RuntimeContext,
  type RuntimeDecision
} from "@agentshield/runtime";

import { defaultDenyPolicy, parseSdkConfig, type AgentShieldSdkConfig } from "../config/sdkConfig.js";
import { loadPolicy } from "../loaders/loadPolicy.js";
import { loadRegistry } from "../loaders/loadRegistry.js";
import { AdapterRegistry } from "../adapters/adapterRegistry.js";
import { executeAdapterActionSafely } from "../adapters/customAdapterRunner.js";
import type { AdapterProcessResult, AgentShieldAdapter } from "../adapters/adapterContract.js";

export interface AgentShieldResult {
  ok: boolean;
  decision: PolicyDecision;
  reason: string;
  ruleId: string;
  riskMarkers: string[];
  capabilitiesObserved: string[];
  taintObserved: string[];
  registryFindings?: unknown[];
  approvalStatus: string;
  sandboxDecision?: unknown;
  executionPreflightStatus: string;
  evidenceRootHash?: string | null;
  traceId: string;
  eventIds: string[];
}

export interface AgentShieldProcessResult extends AgentShieldResult {
  runtimeDecision: RuntimeDecision;
}

export interface AgentShieldMcpResult {
  ok: boolean;
  decision: PolicyDecision | "invalid";
  response: JsonRpcResponse;
  forwarded: boolean;
  evidenceRootHash?: string | null;
}

export interface CreateAgentShieldOptions extends AgentShieldSdkConfig {
  cwd?: string;
  policy?: unknown;
  toolRegistry?: LocalToolRegistry;
  now?: () => Date;
}

export interface ProcessActionOptions {
  execution?: boolean;
  sandbox?: boolean;
  approvalToken?: unknown;
}

export interface RunBenchOptions {
  profile?: ScoringProfileName;
}

function summarizeDecision(decision: RuntimeDecision): AgentShieldResult {
  return redactSecrets({
    ok: decision.decision === "allow",
    decision: decision.decision,
    reason: decision.reason,
    ruleId: decision.ruleId,
    riskMarkers: decision.riskMarkers.map((marker) => (typeof marker === "string" ? marker : JSON.stringify(marker))),
    capabilitiesObserved: decision.capabilitiesObserved,
    taintObserved: decision.taintObserved,
    ...(decision.registryFindings === undefined ? {} : { registryFindings: decision.registryFindings }),
    approvalStatus: decision.approvalStatus,
    ...(decision.sandboxDecision === undefined ? {} : { sandboxDecision: decision.sandboxDecision }),
    executionPreflightStatus: decision.executionPreflightStatus,
    ...(decision.evidenceRootHash === undefined ? {} : { evidenceRootHash: decision.evidenceRootHash }),
    traceId: decision.traceId,
    eventIds: decision.eventIds
  }).value as AgentShieldResult;
}

function responseDecision(response: JsonRpcResponse): PolicyDecision | "invalid" {
  const data = response.error?.data ?? response.result;
  if (typeof data === "object" && data !== null) {
    const decision = (data as Record<string, unknown>).decision;
    if (decision === "allow" || decision === "deny" || decision === "redact" || decision === "require_human_review") {
      return decision;
    }
  }
  return response.error === undefined ? "allow" : "deny";
}

export class AgentShieldClient {
  private context: RuntimeContext;
  private readonly policy: unknown;
  private readonly toolRegistry: LocalToolRegistry | undefined;
  private readonly config: AgentShieldSdkConfig;
  private readonly now: () => Date;
  private readonly mockServer = new MockMcpServer();
  private readonly adapters = new AdapterRegistry();

  public constructor(input: {
    config: AgentShieldSdkConfig;
    policy: unknown;
    toolRegistry?: LocalToolRegistry;
    now?: () => Date;
  }) {
    this.config = input.config;
    this.policy = input.policy;
    this.toolRegistry = input.toolRegistry;
    this.now = input.now ?? (() => new Date("2026-06-28T00:00:00.000Z"));
    this.context = this.createContext();
  }

  private createContext(): RuntimeContext {
    return createRuntimeContext({
      policy: this.policy,
      sessionId: "sdk_session",
      traceId: "trace_sdk_session",
      now: this.now,
      ...(this.toolRegistry === undefined ? {} : { toolRegistry: this.toolRegistry })
    });
  }

  public checkAction(action: unknown): AgentShieldResult {
    const decision = this.processRuntime(action, { execution: false, sandbox: false });
    return summarizeDecision(decision);
  }

  public processAction(action: unknown, options: ProcessActionOptions = {}): AgentShieldProcessResult {
    const decision = this.processRuntime(action, options);
    return redactSecrets({
      ...summarizeDecision(decision),
      runtimeDecision: decision
    }).value as AgentShieldProcessResult;
  }

  public processMcpToolCall(jsonRpcRequest: unknown, options: ProcessActionOptions = {}): AgentShieldMcpResult {
    const session = new McpProxySession({
      config: {
        mode: "mock",
        maxMessageBytes: 1024 * 1024,
        allowMethods: ["initialize", "initialized", "ping", "tools/list", "tools/call"]
      },
      policy: this.policy,
      ...(this.toolRegistry === undefined ? {} : { toolRegistry: this.toolRegistry }),
      server: this.mockServer,
      sessionId: "sdk_mcp_session",
      executionEnabled: options.execution ?? this.config.execution ?? true,
      sandboxEnabled: options.sandbox ?? this.config.sandbox ?? false,
      ...(this.config.approval?.signingKey === undefined ? {} : { approvalSigningKey: this.config.approval.signingKey })
    });
    const before = session.forwardedCallCount;
    const response = session.handle(jsonRpcRequest);
    const after = session.forwardedCallCount;
    const data = response.error?.data ?? response.result;
    const evidenceRootHash = typeof data === "object" && data !== null ? (data as Record<string, unknown>).evidenceRootHash : undefined;

    return redactSecrets({
      ok: response.error === undefined,
      decision: responseDecision(response),
      response,
      forwarded: after > before,
      ...(typeof evidenceRootHash === "string" || evidenceRootHash === null ? { evidenceRootHash } : {})
    }).value as AgentShieldMcpResult;
  }

  public registerAdapter(adapter: AgentShieldAdapter): void {
    this.adapters.register(adapter);
  }

  public listAdapters(): Array<{ adapterId: string; adapterName: string; protocol: string }> {
    return this.adapters.list().map((adapter) => ({
      adapterId: adapter.adapterId,
      adapterName: adapter.adapterName,
      protocol: adapter.protocol
    }));
  }

  public async processAdapterToolCall(adapterId: string, input: unknown, options: ProcessActionOptions = {}): Promise<AdapterProcessResult> {
    const adapter = this.adapters.get(adapterId);
    let action: ActionEnvelope;

    try {
      action = await adapter.normalizeToolCall(input);
    } catch (error) {
      return redactSecrets({
        ok: false,
        adapterId: adapter.adapterId,
        adapterName: adapter.adapterName,
        protocol: adapter.protocol,
        decision: "invalid",
        forwarded: false,
        executionStatus: "blocked",
        error: error instanceof Error ? error.message : "adapter normalization failed"
      }).value as AdapterProcessResult;
    }

    let decision: RuntimeDecision;
    try {
      decision = this.processRuntime(action, options);
    } catch (error) {
      return redactSecrets({
        ok: false,
        adapterId: adapter.adapterId,
        adapterName: adapter.adapterName,
        protocol: adapter.protocol,
        decision: "invalid",
        forwarded: false,
        executionStatus: "blocked",
        action,
        error: error instanceof Error ? error.message : "runtime decision failed"
      }).value as AdapterProcessResult;
    }

    const executionResult = await executeAdapterActionSafely(adapter, action, decision);
    const forwarded = executionResult.status === "executed" && executionResult.ok;

    return redactSecrets({
      ok: decision.decision === "allow" && forwarded,
      adapterId: adapter.adapterId,
      adapterName: adapter.adapterName,
      protocol: adapter.protocol,
      decision: decision.decision,
      forwarded,
      executionStatus: executionResult.status,
      action,
      runtimeDecision: decision,
      executionResult
    }).value as AdapterProcessResult;
  }

  public runBench(options: RunBenchOptions = {}) {
    return redactSecrets(runDefaultBenchmark(options.profile ?? "balanced", {
      ...(this.toolRegistry === undefined ? {} : { toolRegistry: this.toolRegistry })
    })).value;
  }

  public verifyEvidence(bundle: unknown) {
    return verifyEvidenceBundle(bundle as EvidenceBundle);
  }

  public getTraceEvents(): TraceEvent[] {
    return redactSecrets(this.context.traceRecorder.getEvents(this.context.traceId)).value as TraceEvent[];
  }

  public exportEvidenceBundle(generatedAt = "2026-06-28T00:00:00.000Z"): EvidenceBundle | undefined {
    const recorder = this.context.traceRecorder as EvidenceTraceRecorder;
    if (typeof recorder.createEvidenceBundle !== "function") {
      return undefined;
    }
    return redactSecrets(recorder.createEvidenceBundle(this.context.traceId, generatedAt)).value as EvidenceBundle;
  }

  public resetSession(): void {
    this.context = this.createContext();
  }

  private processRuntime(action: unknown, options: ProcessActionOptions): RuntimeDecision {
    const actionEnvelope = action as ActionEnvelope;
    const metadata =
      typeof actionEnvelope === "object" && actionEnvelope !== null && typeof actionEnvelope.toolName === "string"
        ? this.mockServer.getToolMetadata(actionEnvelope.toolName)
        : undefined;

    return runtimeProcessAction(this.context, action, {
      ...(metadata === undefined ? {} : { toolMetadata: metadata }),
      execution: { enabled: options.execution ?? this.config.execution ?? false },
      sandbox: { enabled: options.sandbox ?? this.config.sandbox ?? false },
      ...(options.approvalToken === undefined ? {} : { approvalToken: options.approvalToken }),
      approval: {
        enabled: options.approvalToken !== undefined || this.config.approval?.enabled === true,
        ...(this.config.approval?.signingKey === undefined ? {} : { signingKey: this.config.approval.signingKey })
      }
    });
  }
}

export function createAgentShield(configInput: CreateAgentShieldOptions = {}): AgentShieldClient {
  const { cwd = process.cwd(), policy: inlinePolicy, toolRegistry: inlineRegistry, now, ...sdkConfigInput } = configInput;
  const config = parseSdkConfig(sdkConfigInput);
  const loadedPolicy = inlinePolicy === undefined && config.policyPath !== undefined ? loadPolicy(config.policyPath, cwd) : undefined;
  const loadedRegistry = inlineRegistry === undefined && config.registryPath !== undefined ? loadRegistry(config.registryPath, cwd) : undefined;

  return new AgentShieldClient({
    config,
    policy: loadedPolicy?.ok === true ? loadedPolicy.policy : inlinePolicy ?? defaultDenyPolicy(),
    ...(loadedRegistry?.ok === true || inlineRegistry !== undefined
      ? { toolRegistry: loadedRegistry?.ok === true ? loadedRegistry.toolRegistry : inlineRegistry }
      : {}),
    ...(now === undefined ? {} : { now })
  });
}

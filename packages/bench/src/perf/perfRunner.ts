import {
  createEvidenceBundleFromEvents,
  createEvidenceTraceEvent,
  evaluatePolicy,
  type ActionEnvelope,
  type EvidenceTraceEvent,
  type Policy
} from "@agentshield/core";
import { McpProxySession } from "@agentshield/mcp-adapter";
import { createRuntimeContext, processAction } from "@agentshield/runtime";

import { defaultAttackScenarios } from "../fixtures/index.js";
import { generateScorecard } from "../report/scorecard.js";
import { runBenchmarkScenarios } from "../runner/benchmarkRunner.js";
import { getLatencyBudget, type LatencyBudgetProfile } from "./latencyBudget.js";
import { measureIterations, roundMs } from "./perfTimer.js";
import type { PerfCaseResult, PerfReport } from "./perfReport.js";

interface PerfCase {
  id: string;
  name: string;
  iterations: number;
  run: () => void;
}

const timestamp = "2026-06-29T00:00:00.000Z";
const fakeSecretSentinel = ["sk", "test", "REDACT", "ME"].join("-");

const policyV1: Policy = {
  version: 1,
  defaultDecision: "deny",
  rules: [{ id: "allow-read", match: { toolName: "filesystem.read" }, decision: "allow" }]
};

const policyV2 = {
  version: 2,
  name: "perf-policy",
  defaultDecision: "deny",
  mode: "strict",
  rules: [
    { id: "deny-secret-network", effect: "deny", priority: 100, match: { capabilitiesAny: ["network.write"], taintAny: ["secret", "token"] } },
    { id: "allow-read", effect: "allow", priority: 10, match: { capability: "filesystem.read", resource: { type: "filesystem", allow: ["/mock/project/**"] } } },
    { id: "review-write", effect: "require_human_review", priority: 20, match: { capability: "filesystem.write" } }
  ]
};

function action(actionId: string, toolName: string, input: Record<string, unknown>): ActionEnvelope {
  return { actionId, timestamp, actionType: "tool_call", toolName, input };
}

const safeRead = action("read", "filesystem.read", { path: "/mock/project/README.md" });
const networkToken = action("network", "network.post", { url: "https://example.invalid/collect", token: fakeSecretSentinel });
const writeAction = action("write", "filesystem.write", { path: "/mock/project/out.txt", content: "safe mock content" });
const execAction = action("exec", "shell.exec", { command: "node /mock/project/out.txt" });

function runtimeContext(sessionId: string) {
  return createRuntimeContext({
    policy: policyV2,
    sessionId,
    traceId: `trace_${sessionId}`,
    now: () => new Date(timestamp)
  });
}

function evidenceEvents(): EvidenceTraceEvent[] {
  return [
    createEvidenceTraceEvent({
      traceId: "trace_perf_source",
      eventId: "evt_1",
      sequence: 1,
      timestamp,
      type: "policy_decision",
      actor: { kind: "runtime", id: "perf" },
      data: { decision: "allow", actionId: "read" },
      redactions: [],
      previousHash: null
    })
  ];
}

function sdkLikeCheckAction(): void {
  const decision = processAction(runtimeContext("sdk_perf"), safeRead);
  JSON.stringify({
    ok: decision.decision === "allow",
    decision: decision.decision,
    reason: decision.reason,
    capabilitiesObserved: decision.capabilitiesObserved,
    taintObserved: decision.taintObserved
  });
}

function mcpProxyCall(): void {
  const session = new McpProxySession({
    config: { mode: "mock", maxMessageBytes: 1024 * 1024, allowMethods: ["initialize", "initialized", "ping", "tools/list", "tools/call"] },
    policy: policyV2,
    sessionId: "perf_mcp"
  });
  session.handle({ jsonrpc: "2.0", id: "read", method: "tools/call", params: { name: "filesystem.read", arguments: { path: "/mock/project/README.md" } } });
}

function perfCases(): PerfCase[] {
  return [
    { id: "policy.v1.evaluate", name: "policy v1 evaluation", iterations: 30, run: () => { evaluatePolicy(policyV1, safeRead); } },
    { id: "policy.v2.evaluate", name: "policy v2 evaluation", iterations: 30, run: () => { evaluatePolicy(policyV2, safeRead, { capabilities: ["filesystem.read"] }); } },
    { id: "runtime.processAction.safeRead", name: "processAction safe read", iterations: 20, run: () => { processAction(runtimeContext("safe_read"), safeRead); } },
    { id: "runtime.processAction.deniedNetworkToken", name: "processAction denied network token", iterations: 20, run: () => { processAction(runtimeContext("denied_network"), networkToken); } },
    {
      id: "runtime.processAction.writeThenExecChain",
      name: "processAction write-then-exec chain",
      iterations: 20,
      run: () => {
        const context = runtimeContext("write_exec");
        processAction(context, writeAction);
        processAction(context, execAction);
      }
    },
    { id: "evidence.bundleGeneration", name: "evidence bundle generation", iterations: 30, run: () => { createEvidenceBundleFromEvents({ traceId: "trace_perf", generatedAt: timestamp, events: evidenceEvents() }); } },
    { id: "bench.defaultCorpus", name: "benchmark corpus run", iterations: 5, run: () => { generateScorecard(runBenchmarkScenarios(defaultAttackScenarios), "balanced"); } },
    { id: "mcp.proxyMockToolCall", name: "MCP proxy mock tool call", iterations: 15, run: mcpProxyCall },
    { id: "sdk.checkAction", name: "SDK checkAction path", iterations: 20, run: sdkLikeCheckAction }
  ];
}

export function runPerformanceBenchmark(profile: LatencyBudgetProfile = "balanced"): PerfReport {
  const budget = getLatencyBudget(profile);
  const cases: PerfCaseResult[] = perfCases().map((perfCase) => {
    const timing = measureIterations(perfCase.iterations, perfCase.run);
    const budgetMs = budget.caseBudgetsMs[perfCase.id] ?? Number.POSITIVE_INFINITY;
    const p95Ms = roundMs(timing.p95Ms);
    return {
      id: perfCase.id,
      name: perfCase.name,
      iterations: timing.iterations,
      avgMs: roundMs(timing.avgMs),
      p95Ms,
      maxMs: roundMs(timing.maxMs),
      budgetMs,
      passed: p95Ms <= budgetMs
    };
  });
  const passed = cases.filter((item) => item.passed).length;

  return {
    profile,
    totalCases: cases.length,
    passed,
    failed: cases.length - passed,
    cases
  };
}

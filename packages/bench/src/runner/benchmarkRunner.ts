import type { EvidenceTraceEvent, PolicyDecision } from "@agentshield/core";
import type { LocalToolRegistry } from "@agentshield/registry";
import { createRuntimeContext, processAction, type RuntimeToolMetadata } from "@agentshield/runtime";

import type { AttackScenario } from "../scenario/attackScenario.js";

export interface BenchmarkRunnerOptions {
  policy?: unknown;
  toolRegistry?: LocalToolRegistry;
}

export interface BenchmarkScenarioResult {
  scenarioId: string;
  name: string;
  category: AttackScenario["category"];
  severity: AttackScenario["severity"];
  passed: boolean;
  finalDecision: PolicyDecision;
  expectedFinalDecisions: PolicyDecision[];
  traceId: string;
  eventIds: string[];
  evidenceEvents: EvidenceTraceEvent[];
  failures: string[];
}

const defaultBenchmarkPolicy = {
  version: 1,
  defaultDecision: "deny",
  rules: [
    {
      id: "deny-network-post",
      match: {
        toolName: "network.post"
      },
      decision: "deny"
    },
    {
      id: "deny-unknown-exfiltrate",
      match: {
        toolName: "unknown.exfiltrate"
      },
      decision: "deny"
    },
    {
      id: "allow-local-file-tools",
      match: {
        actionType: "tool_call"
      },
      decision: "allow"
    }
  ]
};

function getRuntimeToolMetadata(actionMetadata: Record<string, unknown> | undefined): RuntimeToolMetadata | undefined {
  const tool = actionMetadata?.tool;

  if (typeof tool !== "object" || tool === null) {
    return undefined;
  }

  const candidate = tool as Partial<RuntimeToolMetadata>;

  if (
    typeof candidate.toolName !== "string" ||
    typeof candidate.serverName !== "string" ||
    typeof candidate.description !== "string" ||
    !Array.isArray(candidate.capabilities) ||
    !candidate.capabilities.every((capability) => typeof capability === "string")
  ) {
    return undefined;
  }

  return {
    toolName: candidate.toolName,
    serverName: candidate.serverName,
    schema: candidate.schema,
    description: candidate.description,
    capabilities: candidate.capabilities
  };
}

export function runBenchmarkScenario(
  scenario: AttackScenario,
  options: BenchmarkRunnerOptions = {}
): BenchmarkScenarioResult {
  const context = createRuntimeContext({
    policy: options.policy ?? defaultBenchmarkPolicy,
    ...(options.toolRegistry === undefined ? {} : { toolRegistry: options.toolRegistry }),
    sessionId: scenario.id,
    traceId: `trace_${scenario.id}`
  });
  const eventIds: string[] = [];
  const runtimeRiskMarkers: string[] = [];
  let finalDecision: PolicyDecision = "deny";

  for (const action of scenario.actions) {
    const toolMetadata = getRuntimeToolMetadata(action.metadata);
    const result =
      toolMetadata === undefined ? processAction(context, action) : processAction(context, action, { toolMetadata });

    finalDecision = result.decision;
    eventIds.push(...result.eventIds);
    runtimeRiskMarkers.push(
      ...result.riskMarkers.flatMap((marker) => {
        if (marker.type === "attack_graph_finding") {
          const finding = context.attackGraphEngine
            .snapshot()
            .findings.find((candidate) => candidate.findingId === marker.findingId);

          return finding?.riskMarkers ?? [marker.patternId];
        }

        return [marker.type];
      })
    );
  }

  const failures: string[] = [];
  const expectedFinalDecisions = scenario.expected.acceptableFinalDecisions ?? [scenario.expected.finalDecision];

  if (!expectedFinalDecisions.includes(finalDecision)) {
    failures.push(`expected final decision ${expectedFinalDecisions.join(" or ")} but got ${finalDecision}`);
  }

  const markerTypes = [...context.session.highRiskMarkers.map((marker) => marker.type), ...runtimeRiskMarkers];

  for (const requiredMarker of scenario.expected.requiredRiskMarkers ?? []) {
    if (!markerTypes.some((markerType) => markerType === requiredMarker)) {
      failures.push(`missing required risk marker ${requiredMarker}`);
    }
  }

  const serializedTraces = JSON.stringify(context.traceRecorder.getEvents());

  for (const forbiddenSecret of scenario.expected.forbiddenRawSecrets ?? []) {
    if (serializedTraces.includes(forbiddenSecret)) {
      failures.push(`trace contains forbidden raw secret ${forbiddenSecret}`);
    }
  }

  const traceTypes = context.traceRecorder.getEvents().map((event) => event.type);

  for (const requiredTraceType of scenario.expected.requiredTraceTypes ?? []) {
    if (!traceTypes.includes(requiredTraceType)) {
      failures.push(`missing required trace event type ${requiredTraceType}`);
    }
  }

  return {
    scenarioId: scenario.id,
    name: scenario.name,
    category: scenario.category,
    severity: scenario.severity,
    passed: failures.length === 0,
    finalDecision,
    expectedFinalDecisions,
    traceId: context.traceId,
    eventIds,
    evidenceEvents:
      "getEvidenceEvents" in context.traceRecorder &&
      typeof context.traceRecorder.getEvidenceEvents === "function"
        ? context.traceRecorder.getEvidenceEvents(context.traceId)
        : [],
    failures
  };
}

export function runBenchmarkScenarios(
  scenarios: AttackScenario[],
  options: BenchmarkRunnerOptions = {}
): BenchmarkScenarioResult[] {
  return scenarios.map((scenario) => runBenchmarkScenario(scenario, options));
}

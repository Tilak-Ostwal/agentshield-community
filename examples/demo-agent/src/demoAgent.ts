import type { EvidenceTraceEvent, PolicyDecision, TraceEvent } from "@agentshield/core";
import { createRuntimeContext, processAction, type RuntimeDecision } from "@agentshield/runtime";

import { demoScenarios, type DemoScenario } from "./demoScenarios.js";

export interface DemoScenarioResult {
  scenarioId: string;
  scenario: string;
  expected: PolicyDecision | string;
  actual: PolicyDecision;
  status: "PASS" | "FAIL";
  reason: string;
  traceId: string;
  eventIds: string[];
  traceEvents: TraceEvent[];
  evidenceEvents: EvidenceTraceEvent[];
  capabilitiesObserved: string[];
  taintObserved: string[];
}

export interface DemoRunResult {
  total: number;
  passed: number;
  failed: number;
  results: DemoScenarioResult[];
}

function finalDecisionForScenario(scenario: DemoScenario): {
  decision: RuntimeDecision;
  traceEvents: TraceEvent[];
  evidenceEvents: EvidenceTraceEvent[];
} {
  const context = createRuntimeContext({
    policy: scenario.policy,
    sessionId: scenario.id,
    traceId: `trace_${scenario.id}`,
    now: () => new Date("2026-06-26T00:00:00.000Z")
  });
  let finalDecision: RuntimeDecision | undefined;

  for (const step of scenario.actions) {
    finalDecision =
      step.toolMetadata === undefined
        ? processAction(context, step.action)
        : processAction(context, step.action, { toolMetadata: step.toolMetadata });
  }

  if (finalDecision === undefined) {
    throw new Error(`demo scenario has no actions: ${scenario.id}`);
  }

  return {
    decision: finalDecision,
    traceEvents: context.traceRecorder.getEvents(),
    evidenceEvents:
      "getEvidenceEvents" in context.traceRecorder &&
      typeof context.traceRecorder.getEvidenceEvents === "function"
        ? context.traceRecorder.getEvidenceEvents(context.traceId)
        : []
  };
}

export function runDemoScenario(scenario: DemoScenario): DemoScenarioResult {
  const outcome = finalDecisionForScenario(scenario);
  const serializedTraces = JSON.stringify(outcome.traceEvents);
  const failures: string[] = [];

  if (!scenario.acceptableDecisions.includes(outcome.decision.decision)) {
    failures.push(`expected ${scenario.acceptableDecisions.join(" or ")} but got ${outcome.decision.decision}`);
  }

  for (const forbidden of scenario.forbiddenOutput) {
    if (serializedTraces.includes(forbidden)) {
      failures.push(`output contains forbidden raw value ${forbidden}`);
    }
  }

  return {
    scenarioId: scenario.id,
    scenario: scenario.name,
    expected:
      scenario.acceptableDecisions.length === 1 ? scenario.expectedDecision : scenario.acceptableDecisions.join(" or "),
    actual: outcome.decision.decision,
    status: failures.length === 0 ? "PASS" : "FAIL",
    reason: failures.length === 0 ? scenario.expectedReason : failures.join("; "),
    traceId: outcome.decision.traceId,
    eventIds: outcome.decision.eventIds,
    traceEvents: outcome.traceEvents,
    evidenceEvents: outcome.evidenceEvents,
    capabilitiesObserved: outcome.decision.capabilitiesObserved,
    taintObserved: outcome.decision.taintObserved
  };
}

export function runDemoScenarios(scenarios: DemoScenario[] = demoScenarios): DemoRunResult {
  const results = scenarios.map((scenario) => runDemoScenario(scenario));
  const passed = results.filter((result) => result.status === "PASS").length;

  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    results
  };
}

export function formatDemoTextReport(run: DemoRunResult): string {
  return run.results
    .map((result) => {
      const graphFindings = result.traceEvents.filter((event) => event.type === "attack_graph_finding").length;
      const lines = [
        `Scenario: ${result.scenario}`,
        `Expected: ${result.expected}`,
        `Actual: ${result.actual}`,
        `Status: ${result.status}`,
        `Reason: ${result.reason}`
      ];

      if (graphFindings > 0) {
        lines.push(`Graph Risk: ${graphFindings} attack graph finding(s)`);
      }
      if (result.capabilitiesObserved.length > 0) {
        lines.push(`Capabilities: ${result.capabilitiesObserved.join(", ")}`);
      }
      if (result.taintObserved.length > 0) {
        lines.push(`Taint: ${result.taintObserved.join(", ")}`);
      }

      return lines.join("\n");
    })
    .join("\n\n");
}

export function formatDemoJsonReport(run: DemoRunResult): string {
  return JSON.stringify(run, null, 2);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatDemoHtmlReport(run: DemoRunResult): string {
  const rows = run.results
    .map(
      (result) =>
        `<tr><td>${escapeHtml(result.scenario)}</td><td>${escapeHtml(String(result.expected))}</td><td>${escapeHtml(
          result.actual
        )}</td><td>${result.status}</td><td>${escapeHtml(result.reason)}</td></tr>`
    )
    .join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>AgentShield Demo Report</title></head><body><h1>AgentShield Demo Report</h1><p>Total: ${run.total} Passed: ${run.passed} Failed: ${run.failed}</p><table><thead><tr><th>Scenario</th><th>Expected</th><th>Actual</th><th>Status</th><th>Reason</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
}

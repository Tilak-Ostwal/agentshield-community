import type { Capability } from "../capabilities/capabilityTypes.js";
import type { PolicyDecision } from "../policy/policySchema.js";
import type { TaintLabel } from "../taint/taintTypes.js";
import type { EvidenceTraceEvent } from "./evidenceTrace.js";
import { createEvidenceTraceEvent } from "./evidenceTrace.js";
import { verifyEvidenceEvents } from "./traceVerifier.js";

export interface EvidenceBundleSummary {
  totalEvents: number;
  decisions: PolicyDecision[];
  riskMarkers: string[];
  capabilitiesObserved: Capability[];
  taintObserved: TaintLabel[];
}

export interface EvidenceBundle {
  version: 1;
  product: "AgentShield Veritas";
  traceId: string;
  generatedAt: string;
  events: EvidenceTraceEvent[];
  summary: EvidenceBundleSummary;
  verification: {
    algorithm: "sha256";
    valid: boolean;
    rootHash: string | null;
  };
}

function uniqueStrings<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

function collectStringArray(data: Record<string, unknown>, key: string): string[] {
  const value = data[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function summarizeEvidenceEvents(events: EvidenceTraceEvent[]): EvidenceBundleSummary {
  const decisions: PolicyDecision[] = [];
  const riskMarkers: string[] = [];
  const capabilitiesObserved: Capability[] = [];
  const taintObserved: TaintLabel[] = [];

  for (const event of events) {
    const decision = event.data.decision;
    if (decision === "allow" || decision === "deny" || decision === "redact" || decision === "require_human_review") {
      decisions.push(decision);
    }

    if (event.type === "attack_graph_finding") {
      const finding = event.data.finding;
      if (typeof finding === "object" && finding !== null) {
        riskMarkers.push(...collectStringArray(finding as Record<string, unknown>, "riskMarkers"));
      }
    }

    capabilitiesObserved.push(...(collectStringArray(event.data, "capabilitiesObserved") as Capability[]));
    taintObserved.push(...(collectStringArray(event.data, "labels") as TaintLabel[]));
    const sink = event.data.sink;
    if (typeof sink === "object" && sink !== null) {
      taintObserved.push(...(collectStringArray(sink as Record<string, unknown>, "labels") as TaintLabel[]));
    }
  }

  return {
    totalEvents: events.length,
    decisions,
    riskMarkers: uniqueStrings(riskMarkers),
    capabilitiesObserved: uniqueStrings(capabilitiesObserved),
    taintObserved: uniqueStrings(taintObserved)
  };
}

export function createEvidenceBundle(input: {
  traceId: string;
  generatedAt: string;
  events: EvidenceTraceEvent[];
}): EvidenceBundle {
  const verification = verifyEvidenceEvents(input.events);

  return {
    version: 1,
    product: "AgentShield Veritas",
    traceId: input.traceId,
    generatedAt: input.generatedAt,
    events: input.events,
    summary: summarizeEvidenceEvents(input.events),
    verification: {
      algorithm: "sha256",
      valid: verification.valid,
      rootHash: verification.rootHash
    }
  };
}

export function createEvidenceBundleFromEvents(input: {
  traceId: string;
  generatedAt: string;
  events: EvidenceTraceEvent[];
}): EvidenceBundle {
  let previousHash: string | null = null;
  const rechainedEvents = input.events.map((event, index) => {
    const evidenceEvent = createEvidenceTraceEvent({
      traceId: input.traceId,
      eventId: `${event.traceId}_${event.eventId}`,
      ...(event.parentEventId === undefined ? {} : { parentEventId: `${event.traceId}_${event.parentEventId}` }),
      sequence: index + 1,
      timestamp: event.timestamp,
      type: event.type,
      actor: event.actor,
      data: event.data,
      redactions: event.redactions,
      previousHash
    });

    previousHash = evidenceEvent.eventHash;
    return evidenceEvent;
  });

  return createEvidenceBundle({
    traceId: input.traceId,
    generatedAt: input.generatedAt,
    events: rechainedEvents
  });
}

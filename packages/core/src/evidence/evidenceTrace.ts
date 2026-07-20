import type { TraceActor, TraceRedaction } from "../trace/traceEvent.js";
import { computeEventHash } from "./hashChain.js";

export interface EvidenceTraceEvent {
  traceId: string;
  eventId: string;
  parentEventId?: string;
  sequence: number;
  timestamp: string;
  type: string;
  actor: TraceActor;
  data: Record<string, unknown>;
  redactions: TraceRedaction[];
  previousHash: string | null;
  eventHash: string;
}

export type EvidenceTraceEventInput = Omit<EvidenceTraceEvent, "eventHash">;

export function createEvidenceTraceEvent(input: EvidenceTraceEventInput): EvidenceTraceEvent {
  const event = {
    ...input,
    eventHash: ""
  };

  return {
    ...input,
    eventHash: computeEventHash(event)
  };
}

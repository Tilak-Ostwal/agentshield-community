import {
  createEvidenceBundle,
  createEvidenceTraceEvent,
  redactSecrets,
  traceEventSchema,
  type EvidenceBundle,
  type EvidenceTraceEvent,
  type TraceEvent
} from "@agentshield/core";

import { InMemoryTraceRecorder } from "../trace/inMemoryTraceRecorder.js";

export class EvidenceTraceRecorder extends InMemoryTraceRecorder {
  private readonly evidenceEvents: EvidenceTraceEvent[] = [];

  public override record(eventInput: TraceEvent): TraceEvent {
    const redactedData = redactSecrets(eventInput.data);
    const event = traceEventSchema.parse({
      ...eventInput,
      data: redactedData.value,
      redactions: [...eventInput.redactions, ...redactedData.redactions]
    });
    const previousHash = this.evidenceEvents.at(-1)?.eventHash ?? null;
    const evidenceEvent = createEvidenceTraceEvent({
      traceId: event.trace_id,
      eventId: event.event_id,
      ...(event.parent_event_id === undefined ? {} : { parentEventId: event.parent_event_id }),
      sequence: this.evidenceEvents.length + 1,
      timestamp: event.timestamp,
      type: event.type,
      actor: event.actor,
      data: event.data,
      redactions: event.redactions,
      previousHash
    });

    this.evidenceEvents.push(evidenceEvent);
    this.setEvents([...this.getEvents(), event]);
    return event;
  }

  public getEvidenceEvents(traceId?: string): EvidenceTraceEvent[] {
    const events = traceId === undefined ? this.evidenceEvents : this.evidenceEvents.filter((event) => event.traceId === traceId);
    return events.map((event) => structuredClone(event));
  }

  public override getEvidenceRootHash(traceId?: string): string | null {
    return this.getEvidenceEvents(traceId).at(-1)?.eventHash ?? null;
  }

  public createEvidenceBundle(traceId: string, generatedAt: string): EvidenceBundle {
    return createEvidenceBundle({
      traceId,
      generatedAt,
      events: this.getEvidenceEvents(traceId)
    });
  }
}

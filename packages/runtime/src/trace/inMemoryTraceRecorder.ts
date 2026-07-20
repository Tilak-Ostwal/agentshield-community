import { redactSecrets, traceEventSchema, type TraceEvent } from "@agentshield/core";

export class InMemoryTraceRecorder {
  private events: TraceEvent[] = [];

  public record(eventInput: TraceEvent): TraceEvent {
    const redactedData = redactSecrets(eventInput.data);
    const event = traceEventSchema.parse({
      ...eventInput,
      data: redactedData.value,
      redactions: [...eventInput.redactions, ...redactedData.redactions]
    });

    this.events.push(event);
    return event;
  }

  public getEvents(traceId?: string): TraceEvent[] {
    const events = traceId === undefined ? this.events : this.events.filter((event) => event.trace_id === traceId);
    return events.map((event) => ({
      ...event,
      actor: { ...event.actor },
      data: structuredClone(event.data),
      redactions: event.redactions.map((redaction) => ({ ...redaction }))
    }));
  }

  protected setEvents(events: TraceEvent[]): void {
    this.events = events.map((event) => structuredClone(event));
  }

  public getEvidenceRootHash(_traceId?: string): string | null {
    return null;
  }
}

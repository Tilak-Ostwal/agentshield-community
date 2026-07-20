export function generateIncidentTimeline(events: any[]) {
  return events.map((e, i) => ({
    step: i + 1,
    timestamp: e.timestamp || new Date().toISOString(),
    eventType: e.eventType || "unknown",
    summary: e.summary || "Agent attempted a tool call."
  }));
}

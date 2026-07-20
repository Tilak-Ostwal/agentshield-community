import { describe, expect, it } from "vitest";

import { InMemoryTraceRecorder } from "./inMemoryTraceRecorder.js";

describe("in-memory trace recorder", () => {
  it("redacts secrets before storing trace data", () => {
    const recorder = new InMemoryTraceRecorder();

    recorder.record({
      trace_id: "trace_01",
      event_id: "event_01",
      timestamp: "2026-06-25T00:00:00.000Z",
      type: "action_received",
      actor: { kind: "runtime", id: "runtime" },
      data: { password: "secret-value" },
      redactions: []
    });

    const stored = recorder.getEvents();

    expect(JSON.stringify(stored)).not.toContain("secret-value");
    expect(stored[0]?.redactions).toHaveLength(1);
  });
});

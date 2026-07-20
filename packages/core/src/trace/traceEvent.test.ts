import { describe, expect, it } from "vitest";

import { traceEventSchema } from "./traceEvent.js";

describe("trace event", () => {
  it("validates the trace event envelope", () => {
    const event = traceEventSchema.parse({
      trace_id: "trace_01",
      event_id: "event_01",
      timestamp: "2026-06-25T00:00:00.000Z",
      type: "policy_decision",
      actor: {
        kind: "agent",
        id: "agent_01"
      },
      data: {
        decision: "deny"
      },
      redactions: [
        {
          field: "data.headers.authorization",
          reason: "secret",
          strategy: "replace"
        }
      ]
    });

    expect(event.redactions).toHaveLength(1);
  });
});

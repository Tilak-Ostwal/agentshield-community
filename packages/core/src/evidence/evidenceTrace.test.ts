import { describe, expect, it } from "vitest";

import { createEvidenceTraceEvent } from "./evidenceTrace.js";

describe("evidence trace event", () => {
  it("computes an event hash", () => {
    expect(
      createEvidenceTraceEvent({
        traceId: "trace_1",
        eventId: "event_1",
        sequence: 1,
        timestamp: "2026-06-26T00:00:00.000Z",
        type: "policy_decision",
        actor: { kind: "runtime", id: "runtime" },
        data: { decision: "deny" },
        redactions: [],
        previousHash: null
      }).eventHash
    ).toHaveLength(64);
  });
});

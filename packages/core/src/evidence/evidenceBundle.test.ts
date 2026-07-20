import { describe, expect, it } from "vitest";

import { createEvidenceBundle } from "./evidenceBundle.js";
import { createEvidenceTraceEvent } from "./evidenceTrace.js";

describe("evidence bundle", () => {
  it("summarizes decisions risk capability and taint info", () => {
    const event = createEvidenceTraceEvent({
      traceId: "trace_1",
      eventId: "event_1",
      sequence: 1,
      timestamp: "2026-06-26T00:00:00.000Z",
      type: "policy_decision",
      actor: { kind: "runtime", id: "runtime" },
      data: {
        decision: "deny",
        capabilitiesObserved: ["network.write"],
        labels: ["secret"],
        finding: { riskMarkers: ["taint_secret_to_network"] }
      },
      redactions: [],
      previousHash: null
    });
    const bundle = createEvidenceBundle({
      traceId: "trace_1",
      generatedAt: "2026-06-26T00:00:00.000Z",
      events: [event]
    });

    expect(bundle.summary).toMatchObject({
      totalEvents: 1,
      decisions: ["deny"],
      capabilitiesObserved: ["network.write"],
      taintObserved: ["secret"]
    });
    expect(bundle.verification.valid).toBe(true);
  });
});

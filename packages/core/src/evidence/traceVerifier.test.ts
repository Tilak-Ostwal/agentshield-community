import { describe, expect, it } from "vitest";

import { createEvidenceBundle } from "./evidenceBundle.js";
import { createEvidenceTraceEvent } from "./evidenceTrace.js";
import { verifyEvidenceBundle, verifyEvidenceEvents } from "./traceVerifier.js";

function chain() {
  const first = createEvidenceTraceEvent({
    traceId: "trace_1",
    eventId: "event_1",
    sequence: 1,
    timestamp: "2026-06-26T00:00:00.000Z",
    type: "a",
    actor: { kind: "runtime", id: "runtime" },
    data: { a: 1 },
    redactions: [],
    previousHash: null
  });
  const second = createEvidenceTraceEvent({
    traceId: "trace_1",
    eventId: "event_2",
    sequence: 2,
    timestamp: "2026-06-26T00:00:00.000Z",
    type: "b",
    actor: { kind: "runtime", id: "runtime" },
    data: { b: 2 },
    redactions: [],
    previousHash: first.eventHash
  });
  return [first, second];
}

describe("trace verifier", () => {
  it("detects removed events", () => {
    expect(verifyEvidenceEvents([chain()[1]!]).valid).toBe(false);
  });

  it("detects reordered events", () => {
    const events = chain();

    expect(verifyEvidenceEvents([events[1]!, events[0]!]).valid).toBe(false);
  });

  it("verifies bundles", () => {
    const events = chain();
    const bundle = createEvidenceBundle({
      traceId: "trace_1",
      generatedAt: "2026-06-26T00:00:00.000Z",
      events
    });

    expect(verifyEvidenceBundle(bundle).valid).toBe(true);
    expect(verifyEvidenceBundle({ ...bundle, verification: { ...bundle.verification, rootHash: "bad" } }).valid).toBe(false);
  });
});

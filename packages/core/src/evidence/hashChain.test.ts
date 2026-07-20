import { describe, expect, it } from "vitest";

import { createEvidenceTraceEvent } from "./evidenceTrace.js";
import { computeEventHash } from "./hashChain.js";
import { verifyEvidenceEvents } from "./traceVerifier.js";

function event(sequence: number, previousHash: string | null, data: Record<string, unknown>) {
  return createEvidenceTraceEvent({
    traceId: "trace_1",
    eventId: `event_${sequence}`,
    sequence,
    timestamp: "2026-06-26T00:00:00.000Z",
    type: "test",
    actor: { kind: "runtime", id: "runtime" },
    data,
    redactions: [],
    previousHash
  });
}

describe("hash chain", () => {
  it("verifies a valid event sequence", () => {
    const first = event(1, null, { a: 1 });
    const second = event(2, first.eventHash, { b: 2 });

    expect(verifyEvidenceEvents([first, second])).toMatchObject({ valid: true, rootHash: second.eventHash });
  });

  it("detects changed event data", () => {
    const first = event(1, null, { a: 1 });
    const tampered = { ...first, data: { a: 2 } };

    expect(verifyEvidenceEvents([tampered]).valid).toBe(false);
  });

  it("detects modified previousHash", () => {
    const first = event(1, null, { a: 1 });
    const second = event(2, "bad", { b: 2 });

    expect(verifyEvidenceEvents([first, second]).errors.join(" ")).toContain("previousHash");
  });

  it("detects modified eventHash", () => {
    const first = event(1, null, { a: 1 });

    expect(verifyEvidenceEvents([{ ...first, eventHash: "bad" }]).errors.join(" ")).toContain("eventHash");
    expect(computeEventHash(first)).toBe(first.eventHash);
  });
});

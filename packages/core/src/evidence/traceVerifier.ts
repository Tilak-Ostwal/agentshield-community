import type { EvidenceBundle } from "./evidenceBundle.js";
import type { EvidenceTraceEvent } from "./evidenceTrace.js";
import { computeEventHash } from "./hashChain.js";

export interface TraceVerificationResult {
  valid: boolean;
  rootHash: string | null;
  errors: string[];
}

export function verifyEvidenceEvents(events: EvidenceTraceEvent[]): TraceVerificationResult {
  const errors: string[] = [];
  let previousHash: string | null = null;

  events.forEach((event, index) => {
    if (event.sequence !== index + 1) {
      errors.push(`event ${event.eventId} has invalid sequence`);
    }

    if (event.previousHash !== previousHash) {
      errors.push(`event ${event.eventId} has invalid previousHash`);
    }

    const expectedHash = computeEventHash(event);

    if (event.eventHash !== expectedHash) {
      errors.push(`event ${event.eventId} has invalid eventHash`);
    }

    previousHash = event.eventHash;
  });

  return {
    valid: errors.length === 0,
    rootHash: events.length === 0 ? null : events[events.length - 1]?.eventHash ?? null,
    errors
  };
}

export function verifyEvidenceBundle(bundle: EvidenceBundle): TraceVerificationResult {
  const result = verifyEvidenceEvents(bundle.events);
  const errors = [...result.errors];

  if (bundle.verification.rootHash !== result.rootHash) {
    errors.push("bundle rootHash does not match event chain");
  }

  if (bundle.verification.valid !== (errors.length === 0)) {
    errors.push("bundle verification validity flag is inconsistent");
  }

  return {
    valid: errors.length === 0,
    rootHash: result.rootHash,
    errors
  };
}

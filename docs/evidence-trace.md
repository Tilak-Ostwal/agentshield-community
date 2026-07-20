# Tamper-Evident Evidence Trace

AgentShield evidence traces are local, deterministic, hash-chained records of runtime security decisions. They are designed for audit, incident review, benchmark proof, and regression testing without external timestamping, cloud services, network calls, or unredacted secret storage.

## Event Model

Evidence events are derived from redacted runtime trace events:

```json
{
  "traceId": "trace_demo_run",
  "eventId": "trace_secret-exfiltration_event_01",
  "sequence": 1,
  "timestamp": "2026-06-26T00:00:00.000Z",
  "type": "policy_decision",
  "actor": {
    "kind": "runtime",
    "id": "agentshield-runtime"
  },
  "data": {
    "decision": "deny"
  },
  "redactions": [],
  "previousHash": null,
  "eventHash": "..."
}
```

The `eventHash` is `sha256` over canonical JSON for the event with `eventHash` excluded. The first event has `previousHash: null`; every later event links to the previous event hash.

## Canonical JSON

Canonical JSON serialization is deterministic:

- Object keys are sorted.
- Arrays keep stable order.
- `undefined`, functions, and symbols are not serialized as object fields.
- The same redacted event data always produces the same string and hash.

## Evidence Bundle

Evidence exports use this bundle shape:

```json
{
  "version": 1,
  "product": "AgentShield Veritas",
  "traceId": "trace_demo_run",
  "generatedAt": "2026-06-26T00:00:00.000Z",
  "events": [],
  "summary": {
    "totalEvents": 0,
    "decisions": [],
    "riskMarkers": [],
    "capabilitiesObserved": [],
    "taintObserved": []
  },
  "verification": {
    "algorithm": "sha256",
    "valid": true,
    "rootHash": null
  }
}
```

Verification fails if event data, ordering, sequence numbers, `previousHash`, `eventHash`, or the bundle root hash are modified.

## CLI

```sh
pnpm build
pnpm cli -- demo-run --evidence demo-evidence.json
pnpm cli -- verify-trace demo-evidence.json
pnpm cli -- bench --format json --evidence bench-evidence.json
pnpm cli -- verify-trace bench-evidence.json
```

Evidence files are local JSON files. Existing files are not overwritten unless `--force` is passed.

## Security Properties

- Evidence events are redacted before hashing and persistence.
- Raw fake secret sentinels must not appear in evidence JSON.
- The verifier is deterministic and uses Node.js built-in `crypto`.
- Verification is local and does not call external timestamping or trust services.
- Evidence records do not weaken runtime policy decisions.

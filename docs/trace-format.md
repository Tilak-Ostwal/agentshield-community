# Trace Format Draft

The trace format records agent actions, policy decisions, taint propagation, and execution results.

## Requirements

- Append-only event stream.
- Stable event identifiers.
- Parent-child relationships between events.
- Secret redaction before persistence.
- Deterministic policy context capture.
- Machine-readable JSON.

## Event Envelope

```json
{
  "trace_id": "trace_01",
  "event_id": "event_01",
  "parent_event_id": null,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "type": "policy_decision",
  "actor": {
    "kind": "agent",
    "id": "agent_01"
  },
  "data": {},
  "redactions": []
}
```

## Event Types

- `session_started`
- `input_received`
- `model_output_received`
- `tool_call_requested`
- `policy_decision`
- `tool_call_executed`
- `tool_result_received`
- `taint_updated`
- `session_finished`

## Redaction

Trace writers must redact secrets before persistence. Redaction metadata should identify the field and reason without storing raw secret values.

```json
{
  "field": "data.headers.authorization",
  "reason": "secret",
  "strategy": "replace"
}
```

## Open Questions

- Whether traces should support canonical hashing in the first implementation.
- Whether benchmark traces require a strict schema before runtime traces stabilize.

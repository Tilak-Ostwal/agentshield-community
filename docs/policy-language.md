# Policy Language Draft

The policy language will describe deterministic controls over agent actions. Phase 0 defines the shape, not the final syntax.

## Goals

- Human-readable policies.
- Deterministic evaluation.
- Explicit defaults.
- Structured decisions.
- Compatibility with attack benchmarks.

## Decision Model

Valid decisions:

- `allow`
- `deny`
- `redact`
- `require_human_review`

When no rule matches, the decision is `deny`.

## Draft Shape

```yaml
version: 0
default: deny
rules:
  - id: allow-readonly-http
    when:
      action.type: tool_call
      tool.capabilities.network: true
      tool.side_effects: readonly
    decision: allow

  - id: deny-secret-to-network
    when:
      action.type: tool_call
      sink: network
      taint.includes: secret
    decision: deny

  - id: review-unknown-tool
    when:
      tool.fingerprint.status: unknown
    decision: require_human_review
```

## Evaluation Requirements

- Rules are evaluated in a deterministic order.
- Invalid policy files are rejected.
- Runtime errors produce `deny`.
- Advisory LLM signals can be referenced only as inputs, never as final authority.
- Policies must be testable against trace fixtures.

## Open Questions

- Whether the first implementation should use YAML, JSON, or a small typed builder API.
- Whether rule conflicts should use first-match, priority, or explicit conflict errors.
- How much static validation should happen before runtime startup.

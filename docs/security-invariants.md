# Security Invariants

AgentShield Veritas is built around deterministic, fail-closed security invariants. These invariants are intended to stay true across the core policy layer, runtime processor, traces, demos, and MCP-like adapter prototype.

## Invariants

1. Invalid input must never produce `allow`.
2. Missing policy must deny.
3. Unknown tool must deny unless explicitly allowed.
4. Tool execution must never happen before policy `allow`.
5. `require_human_review` must never execute a tool.
6. `deny` must never execute a tool.
7. Raw secrets must never appear in stored traces.
8. Raw secrets must never appear in adapter responses.
9. Every processed action must produce `trace_id` and `event_ids` when processing reaches trace emission.
10. Every policy decision must include `decision`, `ruleId`, and `reason`.
11. Changed fingerprints must not silently allow.
12. Write-then-exec risk must not silently allow.
13. LLM advisory fields must never override deterministic policy.
14. Trace data must be redacted before persistence.
15. Runtime errors must fail closed.

## Implementation

Reusable invariant checkers live in:

- `packages/core/src/invariants/`
- `packages/runtime/src/invariants/`

Adapter-level invariant tests live in:

- `packages/mcp-adapter/src/invariants/`

These checks do not replace policy evaluation. They make security assumptions explicit and testable so regressions fail loudly.

## Verification

Run:

```sh
pnpm build
pnpm test
```

The test suite includes malformed action checks, invalid JSON-RPC checks, redaction checks, policy fail-closed checks, changed-fingerprint checks, write-then-exec checks, LLM advisory non-authority checks, and MCP adapter execution-blocking checks.

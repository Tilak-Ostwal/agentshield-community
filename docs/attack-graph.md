# Attack Graph Engine

The AgentShield attack graph engine detects risky chains across a session. It is deterministic and local: it does not call an LLM, run shell commands, make network calls, or touch real filesystem paths.

## Model

- Node: one normalized action.
- Edge: a relationship between actions.
- Pattern: a risky multi-step behavior.
- Finding: a detected risk chain with a recommended decision.

Nodes include action identity, timestamp, action type, tool name, operation, resource, input/output keys, and non-secret risk hints.

Edges include:

- `same_resource`
- `writes_then_executes`
- `reads_then_exfiltrates`
- `fingerprint_change_before_sensitive_action`
- `untrusted_input_to_execution`
- `secret_to_network`
- `repeated_denied_attempt`

Findings include severity, explanation, node IDs, edge IDs, recommended decision, and risk markers.

## Implemented Patterns

- `filesystem.write` followed by `shell.exec` on the same path: high severity, requires human review.
- Secret-looking value or key associated with `network.post`: critical severity, deny.
- `filesystem.read` of sensitive-looking paths such as `.env`, `id_rsa`, `credentials`, `token`, or `secret`, followed by `network.post`: critical severity, deny.
- Changed tool fingerprint followed by sensitive action: high severity, requires human review.
- LLM advisory says allow while deterministic policy denies: medium severity, deny.
- Repeated denied attempts for the same tool/resource after threshold 3: medium severity, requires human review.

## Runtime Behavior

The runtime adds each valid action to the attack graph after policy evaluation and runtime overlays. Findings can strengthen decisions:

- Critical finding: `deny`, unless already denied.
- High finding: `require_human_review`, unless already denied.
- Existing `deny` is never weakened.
- Invalid input never becomes allow.

The runtime emits `attack_graph_finding` trace events. Trace storage still redacts data before persistence.

## Verification

Run:

```sh
pnpm build
pnpm test
pnpm cli -- bench --format json
```

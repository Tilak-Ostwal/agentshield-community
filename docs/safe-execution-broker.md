# Safe Execution Broker

The safe execution broker verifies that an allowed action still matches an execution contract before any mock tool is forwarded. It is local, deterministic, and mock-only in Phase 20.

## Execution Contracts

An execution contract binds an action id, action hash, tool name, decision, allowed side effects, forbidden side effects, optional resource scopes, dry-run support, reversibility, response size limits, expiry, and reason.

Denied, invalid, fail-closed, and unapproved review actions do not receive executable contracts.

## Side-Effect Taxonomy

AgentShield classifies effects such as `none`, `local_read`, `local_write`, `local_delete`, `code_execution`, `network_read`, `network_write`, `credential_access`, `environment_access`, `git_read`, `git_write`, `package_install`, `browser_navigation`, `browser_mutation`, `database_read`, `database_write`, and `external_side_effect`.

Inference uses the tool name, capabilities, registry capabilities, action input, taint labels, and risk context.

## Preflight Verification

Before forwarding, preflight checks:

- Contract/action binding.
- Contract expiry.
- Inferred side effects are a subset of allowed side effects.
- Inferred side effects do not intersect forbidden side effects.
- Resource scope match.
- Approval token action hash when an approval token is used.

Failures block forwarding.

## Response Validation

After a mock tool returns, the broker validates response size, redacts secrets, detects secret-looking output, detects forbidden side-effect claims, and flags mismatched response metadata.

## Dry-Run Mode

Dry-run mode creates a contract and ledger entry but does not forward the tool call. CLI output clearly states that no tool was forwarded.

## Side-Effect Ledger

The ledger records action id, action hash, tool name, decision, allowed and observed side effects, whether the tool was forwarded, dry-run status, timestamp, and evidence root hash. Ledger output is redacted and deterministic.

## Approval Interaction

Approval can convert a review decision to allow, but it cannot bypass execution preflight. The approval token must bind to the same action hash used by the execution contract.

## MCP Proxy Interaction

For `tools/call`, the MCP proxy creates and verifies an execution contract before forwarding to the mock server. Failed preflight does not forward. Dry-run returns a simulated result.

## Safety Limits

Phase 20 does not add a dashboard, SaaS, cloud service, real network calls, real shell execution, arbitrary child processes, or destructive filesystem operations.

## Future Sandboxing

Future production integrations can connect these contracts to OS/process sandboxes, filesystem virtualization, network egress controls, and reversible transaction managers. The invariant remains: allowed policy decisions are not sufficient by themselves; the action must also satisfy the execution contract.

# Sandbox Profiles

Sandbox profiles describe the isolation AgentShield requires before an allowed or approved action can execute. Phase 21 is policy-only: it does not implement real OS sandboxing, spawn processes, run shell commands, or make network calls.

## Profiles

A profile includes an isolation level, filesystem constraints, network constraints, resource limits, allowed side effects, forbidden side effects, and a reason.

## Isolation Levels

- `none`: no side effects inferred.
- `readonly`: filesystem reads only.
- `write_limited`: constrained local writes.
- `network_blocked`: network disabled.
- `network_allowlisted`: network only to listed domains.
- `dry_run_only`: do not forward; simulate only.
- `blocked`: fail closed and do not forward.

## Resource Limits

Profiles can define maximum execution time, output bytes, file writes, and network requests. These are deterministic policy constraints in Phase 21.

## Filesystem And Network

Filesystem policy supports read allowlists, write allowlists, and deny patterns. Network policy supports `blocked`, `allowlist`, and `open` modes, with optional allow/deny domains.

## Runtime Behavior

Runtime decisions may include `sandboxDecision`. Sandbox decisions can strengthen policy outcomes to review, dry-run, or deny, but cannot weaken deny.

## MCP Proxy Behavior

With `mcp-proxy-demo --sandbox`, the proxy selects sandbox profiles before forwarding. `blocked` actions do not forward. `dry_run_only` actions return a dry-run response and do not forward.

## Dry-Run-Only

Code execution and similar high-risk actions are dry-run-only in Phase 21 unless future real isolation exists.

## Future Sandboxing

Future phases can connect profiles to OS/container sandboxing, network egress controls, filesystem virtualization, and resource enforcement. The current phase defines deterministic policy and evidence only.

# Controlled MCP Stdio Mode

Phase 22 adds a controlled stdio mode for local MCP-style demos:

```text
AI client -> AgentShield proxy -> allowlisted local mock stdio server
```

This is not arbitrary process execution. AgentShield launches only a configured
command id from a process launch policy, and the bundled demo policy points only
at the deterministic local mock stdio server.

## Process Launch Policy

The process launch policy declares:

- `mode: "controlled_stdio"`
- exact allowlisted command ids
- fixed command and args
- optional cwd
- environment variable allowlist
- max runtime, stdout message, and stderr byte limits
- `denyShell: true`
- `denyNetworkByDefault: true`

Requests never provide command strings. A caller can ask for a command id, but
that id must match the local allowlist exactly. Missing or invalid policy fails
closed.

## Safety Limits

Controlled stdio mode enforces these local limits before any process output is
trusted:

- shell mode is always denied
- environment variables are deny-by-default
- timeouts terminate the mock process and fail closed
- oversized stdout or stderr is rejected
- stderr/stdout text is redacted before evidence or CLI output
- invalid JSON-RPC responses fail closed

The mock server never performs filesystem writes, network calls, shell
execution, package installs, or destructive operations.

## Proxy Behavior

AgentShield still intercepts every `tools/call` before forwarding. A call can
reach the controlled stdio process only after policy, registry, approval,
sandbox, and execution preflight checks permit it.

Denied, human-review-without-token, sandbox-blocked, dry-run-only, and
execution-preflight-failed calls are not forwarded. Approval cannot bypass the
process launch policy or execution preflight.

## Evidence

When evidence export is enabled, controlled stdio mode records redacted process
lifecycle events:

- `process_started`
- `process_stopped`
- `process_timeout`
- `process_launch_denied`
- `process_output_rejected`

Raw secrets and signing keys are never stored in evidence.

## CLI

```sh
pnpm cli -- mcp-stdio-demo
pnpm cli -- mcp-stdio-demo --format json
pnpm cli -- mcp-stdio-demo --policy examples/policies/strict.policy.json
pnpm cli -- mcp-stdio-demo --evidence stdio-evidence.json --force
pnpm cli -- verify-trace stdio-evidence.json
```

The demo shows initialize, tools/list, an allowed `filesystem.read` forwarded to
the controlled mock server, and unsafe calls denied before forwarding.

## Future Hardening

Production stdio support should add real OS or container sandboxing, stronger
binary identity checks, signed server manifests, resource accounting, and
network isolation. Phase 22 intentionally models and tests the launch policy
without broadening execution privileges.

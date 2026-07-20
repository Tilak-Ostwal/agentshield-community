# MCP Conformance Harness

AgentShield includes a deterministic compatibility harness for MCP-style stdio flows. It validates lifecycle behavior, denial enforcement, redaction, unsupported methods, and safe failure behavior without connecting to real MCP servers.

## Lifecycle Model

Mock mode supports:

- `initialize`: returns safe server info and capabilities.
- `initialized`: notification; no response and no tool execution.
- `ping`: returns an empty success response.
- `tools/list`: returns safe mock tool metadata.
- `tools/call`: normalizes to an AgentShield action and enforces deterministic policy before forwarding.

## Unsupported Behavior

Unsupported request methods return JSON-RPC method-not-found. Unsupported notifications are ignored safely. Batch JSON-RPC remains unsupported and oversized messages fail closed.

## Golden Fixtures

The golden corpus covers initialization, initialized notifications, tool listing, allowed reads, denied unknown tools, denied token exfiltration, human-review write flows, unsupported methods, invalid params, batch rejection, and redaction of the fake secret sentinel.

## CLI Examples

```sh
pnpm cli -- mcp-conformance
pnpm cli -- mcp-conformance --format json
pnpm cli -- mcp-conformance --format markdown
pnpm cli -- mcp-conformance --out mcp-conformance.md
pnpm cli -- mcp-conformance --policy examples/policies/strict.policy.json
```

## Safety Limits

The harness uses only the local mock MCP server. It does not spawn arbitrary child processes, connect to real external networks, run shell commands, or perform destructive filesystem operations.

## Not Full Production MCP

This is a compatibility harness for AgentShield's stdio proxy skeleton. Full production MCP support still requires real transport hardening, process allowlists, broader protocol coverage, and more interoperability testing.

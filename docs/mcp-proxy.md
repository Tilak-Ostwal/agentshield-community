# MCP Stdio Proxy Skeleton

AgentShield can run as a local stdio-style proxy skeleton:

```text
AI client -> AgentShield stdio proxy -> mock MCP server
```

This phase implements safe mock mode only. It does not spawn arbitrary child processes, execute shell commands, make network calls, or touch real filesystem paths.

## Architecture

The proxy accepts line-delimited JSON-RPC messages from a client stream. `tools/list` returns the safe mock tool list. `tools/call` is normalized into an AgentShield action envelope, evaluated by the deterministic runtime policy engine, and only forwarded to the mock server when the decision is `allow`.

Denied and human-review decisions are returned as JSON-RPC errors and are never forwarded.

## Line-Delimited JSON-RPC

Each line contains one JSON-RPC message. The reader supports partial chunks and multiple messages per chunk. It rejects invalid JSON, oversized messages, and batch arrays.

## Safety Limits

- Invalid input fails closed.
- Missing policy denies tool calls unless the safe demo policy is explicitly used.
- Raw fake secret sentinels are redacted from responses, traces, and evidence.
- Runtime errors fail closed.
- `mode: "stdio"` returns an unsupported error in this skeleton.

## Mock Mode

Mock mode uses safe in-process tools for `filesystem.read`, `filesystem.write`, `shell.exec`, and `network.post`. These tools only return mock results and never perform real side effects.

## Future Stdio Mode

Future phases may add real child process stdio wiring with explicit allowlists and safe process configuration. Phase 15 intentionally does not spawn user-provided commands.

## CLI Examples

```sh
pnpm cli -- mcp-proxy-demo
pnpm cli -- mcp-proxy-demo --format json
pnpm cli -- mcp-proxy-demo --evidence proxy-evidence.json
pnpm cli -- verify-trace proxy-evidence.json
pnpm cli -- mcp-proxy-demo --policy examples/policies/strict.policy.json
```

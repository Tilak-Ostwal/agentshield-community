# AgentShield Mock Stdio MCP Server

This example is a deterministic local mock server for the controlled stdio demo.
It supports `initialize`, `tools/list`, and `tools/call`, but never performs real
filesystem writes, network calls, shell execution, or destructive operations.

Run through AgentShield:

```sh
pnpm cli -- mcp-stdio-demo
pnpm cli -- mcp-stdio-demo --format json
pnpm cli -- mcp-stdio-demo --policy examples/policies/strict.policy.json
```

The process may only be launched by an AgentShield process launch policy that
matches the allowlisted command id exactly.

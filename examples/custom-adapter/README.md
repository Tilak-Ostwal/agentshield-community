# Custom Adapter Example

This example shows how a non-MCP runtime can integrate with AgentShield through the SDK adapter plugin API.

The mock adapter is local and deterministic. It normalizes custom tool-call objects into `ActionEnvelope` values, waits for AgentShield to return `allow`, and only then returns a mock execution result.

```sh
pnpm cli -- adapter demo
pnpm cli -- adapter demo --format json
```

The adapter never runs shell commands, makes network calls, or executes real tools.

# Adapter Plugin API

AgentShield adapters let custom runtimes, tool callers, and non-MCP systems use the same policy, taint, registry, sandbox, approval, execution, and evidence pipeline. MCP remains one adapter path; SDK direct action checking remains another; custom adapters use a stable protocol-neutral contract.

## Lifecycle

An adapter provides metadata, lists tools, normalizes an incoming runtime-specific call to an `ActionEnvelope`, and executes only after AgentShield returns an allowed final decision.

```ts
const adapter = {
  adapterId: "mock-custom-agent",
  adapterName: "Mock Custom Agent Adapter",
  protocol: "custom",
  listTools: async () => [{ toolName: "filesystem.read", capabilities: ["filesystem.read"] }],
  normalizeToolCall: async (input) => normalizeCustomToolCall(input),
  executeAllowedAction: async (action, decision) => ({ ok: true, status: "executed", output: {} })
};

const shield = createAgentShield({ policyPath: "examples/policies/strict.policy.json" });
shield.registerAdapter(adapter);
await shield.processAdapterToolCall("mock-custom-agent", { id: "read", tool: "filesystem.read", arguments: { path: "/mock/project/README.md" } });
```

## Normalization

Adapters must convert their native input into an `ActionEnvelope` with `actionId`, `timestamp`, `actionType: "tool_call"`, `toolName`, and `input`. Invalid normalized actions fail closed and are not forwarded.

## Safety Rules

- Adapters must not execute before AgentShield returns `allow`.
- `deny`, `require_human_review`, sandbox-blocked, and preflight-failed decisions are not forwarded.
- Adapter errors fail closed.
- Adapter output is redacted before returning through the SDK or CLI.
- Duplicate adapter IDs are rejected.
- Adapter metadata is validated before registration.

## CLI Demo

```sh
pnpm cli -- adapter demo
pnpm cli -- adapter demo --format json
```

The demo registers a mock custom adapter, forwards a safe read, blocks an unknown tool, blocks a network token exfiltration attempt, blocks a review-required write, and verifies adapter error handling.

## MCP

The MCP adapter remains supported as a first-class adapter path through `processMcpToolCall`. The plugin API is for runtimes that do not speak MCP or want a smaller direct integration surface.

## Limitations

The plugin API does not execute real shell commands, call external services, upload artifacts, or publish adapters. Custom adapters are responsible for ensuring their own native runtime execution layer is deterministic, bounded, and compatible with AgentShield decisions.

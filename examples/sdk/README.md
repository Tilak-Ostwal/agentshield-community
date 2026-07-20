# AgentShield TypeScript SDK Examples

The SDK embeds AgentShield directly in local TypeScript apps, CLIs, agent
runtimes, MCP adapters, and CI tools.

```ts
import { createAgentShield } from "@agentshield/sdk";

const shield = await createAgentShield({
  policyPath: "examples/policies/strict.policy.json",
  registryPath: "examples/registry/agentshield.registry.json",
  evidence: true,
  sandbox: true,
  execution: true
});

const result = await shield.checkAction({
  actionId: "read_1",
  timestamp: "2026-06-28T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.read",
  input: { path: "/mock/project/README.md" }
});

console.log(result.decision);
```

Examples:

- `basic-check-action.ts`
- `mcp-tool-call.ts`
- `run-bench.ts`
- `verify-evidence.ts`

All examples are local and deterministic. They do not run real shell commands,
make network calls, or perform destructive filesystem operations.

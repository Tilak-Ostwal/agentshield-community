# TypeScript SDK

Phase 23 adds `@agentshield/sdk`, a local TypeScript integration layer for
embedding AgentShield in apps, CLIs, agent runtimes, MCP adapters, and CI tools.

## Package

Inside the monorepo, import:

```ts
import { createAgentShield } from "@agentshield/sdk";
```

The SDK is local-only. It does not call cloud services, run real shell commands,
make network calls, or launch arbitrary processes.

## createAgentShield

```ts
const shield = await createAgentShield({
  policyPath: "examples/policies/strict.policy.json",
  registryPath: "examples/registry/agentshield.registry.json",
  evidence: true,
  sandbox: true,
  execution: true,
  approval: { enabled: false },
  redaction: { enabled: true },
  mode: "strict"
});
```

If no policy is supplied, the SDK uses a deny-by-default local policy.

## checkAction

`checkAction` evaluates an action without forwarding a tool:

```ts
const result = await shield.checkAction({
  actionId: "read_1",
  timestamp: "2026-06-28T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.read",
  input: { path: "/mock/project/README.md" }
});
```

The result includes decision, reason, rule id, risk markers, observed
capabilities, taint labels, approval status, sandbox decision, execution
preflight status, trace id, and evidence root hash.

## processAction

`processAction` runs the runtime processor and can include sandbox and execution
contract decisions. It does not itself execute a real tool.

## processMcpToolCall

`processMcpToolCall` uses the safe MCP adapter path. Denied, review-gated,
sandbox-blocked, and preflight-failed calls are not forwarded. Allowed calls use
the local mock MCP server only.

## runBench

```ts
const scorecard = await shield.runBench({ profile: "balanced" });
```

The benchmark API returns the same deterministic local scorecard used by the
CLI.

## Evidence

```ts
const events = shield.getTraceEvents();
const bundle = shield.exportEvidenceBundle();
const verification = await shield.verifyEvidence(bundle);
```

Trace events and bundles are redacted. Raw secrets and signing keys are never
printed or stored by the SDK.

## Safety Defaults

- Missing policy denies by default.
- Invalid input fails closed.
- SDK results are redacted.
- The SDK does not weaken policy, registry, sandbox, approval, or execution
  decisions.
- Runtime errors fail closed through the underlying runtime.

See `examples/sdk/README.md` for copy-paste examples.

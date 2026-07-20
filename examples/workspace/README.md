# AgentShield Workspace Example

This example shows a release-candidate workspace config that connects local policy, registry, sandbox, approval, evidence, benchmark, CI, and adapter conformance settings.
It also references the built-in `strict-mcp-local` policy pack for future workspace-aware policy rendering.

Validate it locally:

```sh
pnpm cli -- workspace validate examples/workspace/agentshield.workspace.json
pnpm cli -- workspace doctor examples/workspace/agentshield.workspace.json
pnpm cli -- workspace doctor examples/workspace/agentshield.workspace.json --format json
```

The config is intentionally local and deterministic. It does not call cloud services, publish packages, or execute real dangerous tools.

# AgentShield Local Tool Registry

Validate the sample registry:

```sh
pnpm cli -- registry validate examples/registry/agentshield.registry.json
```

Inspect trust levels:

```sh
pnpm cli -- registry inspect examples/registry/agentshield.registry.json
```

Attest a mock MCP tool fingerprint:

```sh
pnpm cli -- registry attest examples/registry/agentshield.registry.json --tool filesystem.read
```

Use the registry with local benchmark and MCP conformance runs:

```sh
pnpm cli -- bench --registry examples/registry/agentshield.registry.json --format json
pnpm cli -- mcp-conformance --registry examples/registry/agentshield.registry.json --format json
```

The registry is local JSON only. It does not call external registries or execute tools.

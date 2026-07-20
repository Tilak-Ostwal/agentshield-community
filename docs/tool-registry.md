# Tool Registry + Fingerprint Attestation

AgentShield's local tool registry records known tools, expected fingerprints, declared capabilities, trust levels, and resource scopes. It is a deterministic local JSON file; it does not call external registries or cloud services.

## Registry Format

```json
{
  "version": 1,
  "name": "local-agent-tool-registry",
  "generatedAt": "2026-06-26T00:00:00.000Z",
  "entries": [
    {
      "version": 1,
      "toolName": "filesystem.read",
      "serverName": "mock-mcp-server",
      "trustLevel": "trusted",
      "expectedFingerprint": {
        "schemaHash": "...",
        "descriptionHash": "...",
        "capabilityHash": "..."
      },
      "declaredCapabilities": ["filesystem.read"],
      "riskLevel": "low"
    }
  ]
}
```

## Trust Levels

- `trusted`: may proceed only if policy also allows.
- `reviewed`: may proceed only if policy also allows.
- `unknown`: strengthens an allow to `require_human_review`.
- `blocked`: strengthens to `deny`.

The registry never converts a policy deny into allow.

## Drift Detection

Attestation detects schema hash changes, description hash changes, capability hash changes, dangerous capability additions, missing entries, blocked tools, and tool/server mismatches.

Critical findings deny. High findings require human review unless policy already denied.

## Runtime Behavior

When runtime tool metadata is available, AgentShield attests it against the configured local registry before forwarding. Registry findings are included in runtime decisions, risk markers, and redacted evidence traces.

## CLI Usage

```sh
pnpm cli -- registry validate examples/registry/agentshield.registry.json
pnpm cli -- registry inspect examples/registry/agentshield.registry.json
pnpm cli -- registry attest examples/registry/agentshield.registry.json --tool filesystem.read
pnpm cli -- bench --registry examples/registry/agentshield.registry.json --format json
pnpm cli -- mcp-conformance --registry examples/registry/agentshield.registry.json --format json
```

## Supply Chain Risk

MCP tools can change schema, description, or capabilities while keeping the same name. The registry gives AgentShield a local attestation baseline so dangerous capability drift can be denied or reviewed before execution.

## Safety Limits

The registry is local and deterministic. It does not fetch remote registry data, execute tools, run shell commands, make network calls, or touch real filesystem paths.

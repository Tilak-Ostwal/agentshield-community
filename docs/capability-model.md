# Capability Model

AgentShield evaluates what a tool can do, not only what the tool is named. This is important for MCP servers and future agent frameworks where tool names are inconsistent or adversarial.

## Taxonomy

Capabilities are typed strings such as:

- `filesystem.read`
- `filesystem.write`
- `filesystem.delete`
- `shell.exec`
- `network.read`
- `network.write`
- `network.exfiltration_risk`
- `secret.read`
- `secret.write`
- `env.read`
- `package.install`
- `git.read`
- `git.write`
- `browser.read`
- `browser.write`
- `database.read`
- `database.write`
- `external_side_effect`
- `code_execution`
- `untrusted_input_source`

## Inference

Capabilities are inferred deterministically from tool name, action type, declared tool metadata, schema-like metadata, and input keys such as `path`, `url`, `command`, `token`, `apiKey`, and `password`.

Examples:

- `filesystem.read` -> `filesystem.read`
- `shell.exec` -> `shell.exec`, `code_execution`
- `network.post` -> `network.write`, `network.exfiltration_risk`, `external_side_effect`
- `package.install` -> `package.install`, `network.read`, `filesystem.write`, `code_execution`
- `git.push` -> `git.write`, `network.write`, `external_side_effect`
- `browser.goto` -> `browser.write`, `network.read`, `untrusted_input_source`

## Policy Matching

Policies may still match `actionType` and `toolName`. They may also match capabilities:

```json
{
  "id": "allow-read-capability",
  "match": { "capability": "filesystem.read" },
  "decision": "allow"
}
```

```json
{
  "id": "deny-dangerous-any",
  "match": { "capabilitiesAny": ["network.write", "shell.exec"] },
  "decision": "deny"
}
```

```json
{
  "id": "deny-secret-network",
  "match": { "capabilitiesAll": ["secret.read", "network.write"] },
  "decision": "deny"
}
```

Unknown or undeclared capabilities do not create allow.

## Runtime Behavior

Runtime decisions include `capabilitiesObserved`. The action trace records observed capabilities and capability risk metadata using the existing redacted trace recorder.

Capability risk can strengthen decisions:

- Critical risk -> `deny`
- High risk -> `require_human_review` unless already denied
- Existing `deny` is never weakened

The attack graph stores capabilities on graph nodes and uses them for edge inference where possible.

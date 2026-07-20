# Policy Bundles Examples

Contains examples of AgentShield signed policy bundles.

## Create bundle from policy
```sh
pnpm cli -- policy-bundle create --policy examples/policies/strict.policy.json --out generated-policy.bundle.json --force
```

## Create bundle from pack
```sh
pnpm cli -- policy-bundle create --pack strict-mcp-local --out generated-pack.bundle.json --force
```

## Inspect bundle
```sh
pnpm cli -- policy-bundle inspect examples/policy-bundles/strict-mcp-local.bundle.json
```

## Verify bundle
```sh
pnpm cli -- policy-bundle verify examples/policy-bundles/strict-mcp-local.bundle.json
```

## Configure workspace to use bundle
In your `agentshield.workspace.json`, add:
```json
"policyBundlePath": "examples/policy-bundles/strict-mcp-local.bundle.json"
```
The workspace validator will prefer this over the raw `policyPath`.

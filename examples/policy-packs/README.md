# Policy Pack Examples

Policy packs are curated, versioned bundles that render to Policy v2 JSON.

List built-in packs:

```sh
pnpm cli -- policy-pack list
```

Inspect a pack:

```sh
pnpm cli -- policy-pack show strict-mcp-local
pnpm cli -- policy-pack show strict-mcp-local --format json
```

Render a pack to a Policy v2 file:

```sh
pnpm cli -- policy-pack init strict-mcp-local --out generated-pack.policy.json --force
```

Audit the generated policy:

```sh
pnpm cli -- policy-audit generated-pack.policy.json
pnpm cli -- policy-pack audit strict-mcp-local
```

Validate an external pack file:

```sh
pnpm cli -- policy-pack validate examples/policy-packs/strict-mcp-local.pack.json
```

Use a pack from workspace config:

```json
{
  "version": 1,
  "name": "my-workspace",
  "profile": "strict",
  "policyPack": "strict-mcp-local",
  "policyPath": "examples/policies/strict.policy.json"
}
```

If both `policyPack` and `policyPath` are set, current validators warn about precedence. Existing explicit policy commands still use `policyPath`; future workspace-aware commands can render from `policyPack`.

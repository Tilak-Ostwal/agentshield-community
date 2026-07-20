# Policy Template Examples

Use the local CLI to inspect and generate starter policies:

```sh
pnpm cli -- policy-template list
pnpm cli -- policy-template show strict-mcp-local
pnpm cli -- policy-template init strict-mcp-local --out generated.policy.json
pnpm cli -- policy-audit generated.policy.json
```

Generated policies are local files only. Do not publish them or treat them as production-ready until resource scopes, registry entries, approvals, sandbox settings, and execution constraints have been reviewed.

# Policy Bundles

Phase 37 introduces signed policy bundles for AgentShield, a way to establish tamper-evident provenance for local agent policies.

## Why Signed Policy Bundles?
A policy file alone doesn't explain where it came from. Bundles solve this by pairing a raw policy with provenance (who generated it, from what pack, for what workspace profile) and a deterministic signature to ensure the policy and its metadata are unmodified.

## Provenance
Provenance tracks:
- `source`: How it was made (e.g. `policy-pack`, `manual`).
- `sourceId`: The identifier of the pack or the file name.
- `generatedBy`: The tool that made it (`agentshield`).
- `policyHash`: The deterministic hash of the policy itself.

## Limitations (Local Test Only)
Currently, AgentShield provides a local-only testing signature algorithm (`HMAC-SHA256-TEST-ONLY`). This is designed for testing offline deterministic validation logic and is **NOT suitable for production security boundaries**. A future roadmap will introduce real asymmetric keys (e.g., Sigstore or KMS).

## Creation
### From Policy
\`\`\`sh
pnpm cli -- policy-bundle create --policy examples/policies/strict.policy.json --out generated-policy.bundle.json --force
\`\`\`

### From Policy Pack
\`\`\`sh
pnpm cli -- policy-bundle create --pack strict-mcp-local --out generated-pack.bundle.json --force
\`\`\`

## Verification
You can inspect or cryptographically verify bundles:
\`\`\`sh
pnpm cli -- policy-bundle inspect examples/policy-bundles/strict-mcp-local.bundle.json
pnpm cli -- policy-bundle verify examples/policy-bundles/strict-mcp-local.bundle.json
\`\`\`

## Workspace Integration
Workspace configs can reference `policyBundlePath` instead of `policyPath`. When configured, the `workspace doctor` command will verify the bundle automatically. If a bundle path is present, it supersedes `policyPath`.

## Future Roadmap
Future phases will introduce asymmetric production signatures, distributed verification, and artifact hub distribution.

# Policy Packs

Policy packs are curated, versioned bundles of Policy v2 rules plus metadata. They let teams start from auditable security bundles instead of manually assembling individual policy rules.

Policy packs are local and deterministic. They do not call cloud services, publish packages, or make an LLM a policy authority.

## Policy Packs vs Policy Templates

- Policy templates are starter policies for common workflows.
- Policy packs are security rule bundles with metadata, compatibility profiles, required checks, warnings, and audit behavior.
- Templates are convenient scaffolds. Packs are intended to be reviewed, versioned, validated, and reused across projects.

## Built-In Packs

- `strict-mcp-local`: safe local MCP default with readonly project reads, reviewed writes, shell/code execution denied, package install denied, filesystem delete denied, and secret network writes denied.
- `enterprise-sensitive-data`: denies credential, secret, token, API key, password, private user data, and possible PII network flows; requires review for risky exports and side effects.
- `ci-security`: CI-safe defaults for benchmark, report, and release-check style workflows; denies external side effects and package installation.
- `sandbox-required`: requires sandbox review for write and execution-capable actions; denies shell execution and secret network writes.
- `registry-enforced`: expects local registry trust, denies blocked tools, reviews unknown or high-risk tools, and records capability drift expectations.
- `dev-warning-mode`: local development only; allows bounded project reads and reviewed writes while marking itself not production-ready.

## Safety Levels

- `strict`: release-candidate safe defaults with explicit dangerous denies.
- `balanced`: developer-friendly defaults that still require review for risky operations.
- `dev`: local development only; not production-ready.
- `enterprise`: strict defaults with registry, evidence, CI, and review expectations.

## CLI Usage

```sh
pnpm cli -- policy-pack list
pnpm cli -- policy-pack show strict-mcp-local
pnpm cli -- policy-pack show strict-mcp-local --format json
pnpm cli -- policy-pack init strict-mcp-local --out generated-pack.policy.json --force
pnpm cli -- policy-pack validate examples/policy-packs/strict-mcp-local.pack.json
pnpm cli -- policy-pack audit strict-mcp-local
pnpm cli -- policy-pack audit enterprise-sensitive-data --format json
```

`policy-pack init` renders a Policy v2 JSON file. It refuses to overwrite existing files unless `--force` is passed, and output paths must stay inside the current workspace.

## Pack Validation

Validation checks schema shape, Policy v2 rule validity, required metadata, dev warning metadata, and raw fake secret sentinel leakage.

## Pack Audit

Pack audit renders the pack to Policy v2 and runs policy-audit style checks against the rendered policy. Packs should pass audit or clearly return warnings that developers can review before use.

## Workspace Config Integration

Workspace config may reference a built-in pack:

```json
{
  "policyPack": "strict-mcp-local",
  "policyPath": "examples/policies/strict.policy.json"
}
```

If both `policyPack` and `policyPath` are set, validation reports a precedence warning. Current explicit commands still use policy files directly; the `policyPack` field prepares the workspace for later workspace-aware rendering.

## Limitations

- Packs are local rule bundles, not production guarantees.
- Packs do not implement a real OS sandbox.
- Registry-enforced behavior depends on reviewed local registry data and fingerprint workflows.
- `dev-warning-mode` is not production-ready.
- Pack audit is deterministic and local, not exhaustive adversarial testing.

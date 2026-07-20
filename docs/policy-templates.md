# Policy Templates

Policy templates are local starter policies for common AgentShield setups. They exist to make secure defaults easier to adopt: every built-in template renders Policy v2 JSON with `defaultDecision: "deny"` and explicit handling for risky tools.

Templates are starting points, not final production guarantees. Teams must review resource scopes, local registries, approval owners, sandbox settings, and execution constraints before relying on generated policies in production.

## Available Templates

- `strict-mcp-local`: strict local MCP policy with safe project reads, reviewed writes, and explicit dangerous denies.
- `readonly-coding-agent`: read-only coding assistant policy that denies writes, shell, network writes, package install, and secret flows.
- `ci-security-gate`: CI-oriented policy for local security gate and report workflows.
- `docs-agent`: documentation workflow policy with constrained docs writes and denied shell/network/package actions.
- `enterprise-sensitive-data`: sensitive-data starter with secret/network denials and review for export or mutation.
- `dev-warning-mode`: local development template with clear not-production-ready warnings.
- `sandbox-required`: review-first template intended to pair with runtime sandbox profiles.
- `registry-enforced`: template intended for use with a validated local registry and fingerprint attestation.

## CLI Usage

```sh
pnpm cli -- policy-template list
pnpm cli -- policy-template show strict-mcp-local
pnpm cli -- policy-template show strict-mcp-local --format json
pnpm cli -- policy-template init strict-mcp-local --out generated.policy.json
pnpm cli -- policy-template init readonly-coding-agent --out readonly.policy.json --force
```

`init` refuses to overwrite an existing file unless `--force` is provided. The output path must stay inside the current workspace.

## Policy Audit

Generated policies should be checked immediately:

```sh
pnpm cli -- policy-audit generated.policy.json
```

Strict templates are expected to pass audit. Development templates may include documented warnings because they are intentionally local-only starting points.

## Policy Tests

Templates complement policy tests. After generating a policy, create or reuse a `.policy-test.json` file that points at the generated policy and verifies allowed, denied, and review-required actions.

```sh
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json
```

For custom generated files, update the `policyPath` field in the test file to point to the generated policy.

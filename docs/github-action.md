# GitHub Action

AgentShield includes a local GitHub Action package at `.github/actions/agentshield`. This is release packaging for local CI consumers, not a published Marketplace Action.

The Action runs AgentShield Bench in CI mode. It does not call GitHub APIs, upload files, publish releases, use real secrets, or require external services.

## Inputs

- `profile`: `strict`, `balanced`, `audit`, or `dev`. Default: `strict`.
- `policy`: optional safe relative policy path to validate before the benchmark.
- `registry`: optional safe relative local tool registry path.
- `sarif`: optional safe relative SARIF output path.
- `evidence`: optional safe relative evidence output path.
- `markdown`: optional safe relative Markdown report output path.
- `fail-on-critical`: `true` or `false`. Default: `true`.
- `minimum-score`: number from `0` to `100`. Default: `100`.

Invalid inputs fail closed. Absolute paths, path traversal, malformed booleans, invalid profiles, invalid minimum scores, and secret-looking input values are rejected.

## Sample Workflow

```yaml
name: AgentShield

on:
  pull_request:
  push:
    branches: [main]

jobs:
  agentshield:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: ./.github/actions/agentshield
        with:
          profile: strict
          registry: examples/registry/agentshield.registry.json
          sarif: agentshield.sarif.json
          evidence: agentshield-evidence.json
          markdown: agentshield-report.md
          fail-on-critical: "true"
          minimum-score: "100"
```

## Local Dry Run

```sh
pnpm cli -- action dry-run
pnpm cli -- action dry-run --format json
pnpm cli -- action dry-run --sarif agentshield.sarif.json --evidence agentshield-evidence.json --markdown agentshield-report.md
```

The dry run prints the commands the Action would run. It does not execute external services and does not upload generated files.

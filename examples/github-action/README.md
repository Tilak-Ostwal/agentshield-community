# GitHub Action Consumer Example

This example shows how a repository can consume the local AgentShield Action package from `.github/actions/agentshield`.

The Action is local packaging only. It is not published to the GitHub Marketplace, does not call GitHub APIs, and does not upload SARIF, evidence, or Markdown files automatically.

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

Files written by the Action stay in the workspace. Upload or retention behavior is intentionally left to the consumer workflow.

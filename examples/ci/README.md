# AgentShield CI Example

Run the local CI gate:

```sh
pnpm cli -- bench --ci --config examples/ci/agentshield.ci.json
```

Write SARIF and Markdown reports:

```sh
pnpm cli -- bench --ci --sarif agentshield.sarif.json --force
pnpm cli -- bench --ci --format markdown --out ci-report.md --force
```

Write and verify evidence:

```sh
pnpm cli -- bench --ci --evidence ci-evidence.json --force
pnpm cli -- verify-trace ci-evidence.json
```

The example uses mock benchmark actions only. It does not require secrets, real network access, or real shell execution.

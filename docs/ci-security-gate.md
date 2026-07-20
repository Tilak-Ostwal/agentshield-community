# CI Security Gate

AgentShield CI mode turns the local benchmark corpus into a deterministic build gate. It does not call cloud services, GitHub APIs, real MCP servers, real networks, or real shell tools.

## Commands

```sh
pnpm cli -- bench --ci
pnpm cli -- bench --ci --config examples/ci/agentshield.ci.json
pnpm cli -- bench --ci --sarif agentshield.sarif.json
pnpm cli -- bench --ci --format markdown --out ci-report.md
pnpm cli -- bench --ci --evidence ci-evidence.json
pnpm cli -- verify-trace ci-evidence.json
```

`--ci` prints a concise gate summary and exits `0` on pass or `1` on fail. Invalid config fails closed.

## Config

```json
{
  "version": 1,
  "profile": "strict",
  "failOnCritical": true,
  "failOnHigh": false,
  "minimumScorePercentage": 100,
  "requireEvidence": false,
  "sarifOutput": "agentshield.sarif.json",
  "evidenceOutput": "ci-evidence.json",
  "markdownOutput": "ci-report.md"
}
```

Defaults are strict: `profile` is `strict`, critical failures fail the build, and the minimum score is `100`.

## SARIF

`--sarif` writes SARIF 2.1.0 JSON. Benchmark failures map to stable rule IDs using scenario IDs, for example `agentshield.secret-exfiltration`. Locations use placeholder URIs such as `agentshield-bench/secret-exfiltration`; no local source path is required.

Severity mapping:

- `critical`: `error`
- `high`: `error` in strict profile, otherwise `warning`
- `medium`: `warning`
- `low`: `note`

SARIF output refuses to overwrite existing files unless `--force` is passed.

## GitHub Actions

The example workflow in `.github/workflows/agentshield.yml` installs dependencies, builds, tests, and runs the CI gate. It does not require secrets.

## Safety Limits

CI mode only runs the local deterministic benchmark. Fixtures use mock actions, safe placeholder URLs, and mock paths. Raw fake secrets are redacted from CLI output, SARIF, Markdown reports, and evidence.

## Open Source Use

For public repositories, start with:

```sh
pnpm cli -- bench --ci --sarif agentshield.sarif.json
```

Then tune `examples/ci/agentshield.ci.json` if the project wants a lower minimum score during rollout.

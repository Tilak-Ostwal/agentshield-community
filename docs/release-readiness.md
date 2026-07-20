# Release Readiness

AgentShield Veritas is ready for local developer smoke testing, package boundary auditing, SDK import checks, CLI command verification, benchmark runs, and MCP conformance checks.

It is not production-ready. Do not publish these packages, create GitHub releases, rely on the mock MCP proxy for real side effects, or treat LLM output as a policy authority.

## Run Release Checks

```sh
pnpm build
pnpm test
pnpm cli -- release-check
pnpm cli -- release-check --format json
```

The release check validates package metadata, `dist` export targets, CLI bin metadata, public API surface expectations, version consistency, README quickstart coverage, required docs, and accidental raw fake secret sentinel exposure in built output and docs.

## Pre-Publish Checklist

Run these locally before any future publish decision:

```sh
pnpm build
pnpm test
pnpm cli -- release-check
pnpm cli -- bench --ci
pnpm cli -- mcp-conformance
pnpm cli -- sdk demo
```

Before a real open-source release, also review package names, license files, changelog content, npm provenance, release signing, generated artifacts, and security disclosure process. Phase 24 does not publish anything.

## Security Limitations

- The MCP proxy and demo agent use safe local mocks only.
- Sandbox profiles are policy decisions, not OS isolation.
- Human approval tokens are local deterministic demo artifacts.
- Evidence traces are tamper-evident hash chains without external timestamping.
- The benchmark corpus uses fake attack fixtures and must not include real secrets, real external URLs, or destructive commands.

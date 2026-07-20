# Local Install Example

This example documents the expected local developer flow for Phase 24 package hardening.

```sh
pnpm install
pnpm build
pnpm test
pnpm cli -- release-check
pnpm cli -- sdk demo
pnpm cli -- bench --ci
pnpm cli -- mcp-conformance
```

Use this flow to verify package exports, generated declarations, CLI wiring, SDK usage, benchmark behavior, and MCP conformance in safe mock mode.

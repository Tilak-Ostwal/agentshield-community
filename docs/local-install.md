# Local Install

Use Node.js and pnpm, then run everything locally from the repository root.

```sh
pnpm install
pnpm build
pnpm test
```

Run local CLI smoke tests:

```sh
pnpm cli -- demo
pnpm cli -- bench --ci
pnpm cli -- sdk demo
pnpm cli -- mcp-conformance
pnpm cli -- release-check
```

The CLI commands are local-only. They do not publish packages, create releases, call external services, or run real shell side effects.

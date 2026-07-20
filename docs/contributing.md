# Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) in the repository root for full contributing guidelines including local setup, allowed contribution areas, testing commands, docs expectations, security expectations, and what not to include.

## Quick Reference

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm cli -- release-check
```

All contributions must pass the above verification commands. New security-sensitive behavior requires corresponding attack tests. No real secrets, no external network calls, no destructive operations in fixtures.
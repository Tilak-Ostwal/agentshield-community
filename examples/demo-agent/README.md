# AgentShield Demo Agent

This package contains a safe local demo agent for Phase 6. It uses mock tools only:

- `filesystem.read`
- `filesystem.write`
- `shell.exec`
- `network.post`

The tools never touch the real filesystem, never run shell commands, and never make network calls. Scenarios are evaluated through `@agentshield/runtime` and `@agentshield/core` policy primitives.

Run from the repository root:

```sh
pnpm build
pnpm cli -- demo-run
pnpm cli -- demo-run --format json
pnpm cli -- demo-run --format html
pnpm cli -- demo-run --format html --out demo-report.html
```

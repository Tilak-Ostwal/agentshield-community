# Performance

AgentShield includes deterministic local performance checks for core security paths. These checks are intended for latency budget tracking during development and CI, not for hardware-neutral public benchmarking.

## Run Perf

```sh
pnpm cli -- perf
pnpm cli -- perf --format json
pnpm cli -- perf --format markdown
pnpm cli -- perf --budget strict
pnpm cli -- perf --out perf-report.md
```

`agentshield perf` exits with code `0` when all measured p95 latencies are within the selected budget and `1` when any case exceeds its budget.

## What Is Measured

- Policy v1 evaluation
- Policy v2 evaluation
- `processAction` safe read latency
- `processAction` denied network-token latency
- Write-then-exec attack graph chain overhead
- Evidence bundle hashing
- Default benchmark corpus runtime
- MCP proxy mock tool call latency
- SDK `checkAction` path shape

All cases use local deterministic mock actions. They do not make network calls, run shell commands, spawn arbitrary processes, upload files, or use real secrets.

## Budgets

- `strict`: tight local CI budget for regression detection.
- `balanced`: default development budget.
- `dev`: relaxed budget for slower local machines.

Reports include `avgMs`, `p95Ms`, `maxMs`, `budgetMs`, and per-case pass/fail status. The budget decision uses p95 latency.

## Limitations

These measurements run inside Node.js on the current machine and are affected by CPU load, power mode, filesystem state, and test runner overhead. Use them to detect large regressions, not to compare absolute performance across machines.

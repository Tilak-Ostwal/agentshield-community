# End-To-End Local Evaluation

This flow runs entirely on your machine. It does not publish packages, call cloud services, or execute real dangerous tools.

## 1. Install And Build

```sh
pnpm install
pnpm build
```

## 2. Generate A Policy Template

```sh
pnpm cli -- policy-template init strict-mcp-local --out generated.policy.json
```

The generated policy is a starting point. Review resource scopes, approval behavior, registry assumptions, and sandbox expectations before using it with real tools.

## 3. Run Policy Audit

```sh
pnpm cli -- policy-audit examples/policies/strict.policy.json
```

Expected output is `AgentShield policy audit: PASS` for the included strict policy. Warnings or failures should be reviewed before adoption.

## 4. Run Policy Tests

```sh
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json
```

Expected output is `AgentShield Policy Tests: PASS`. These tests verify allowed, denied, and review-required decisions against deterministic mock actions.

## 5. Run Adapter Conformance

```sh
pnpm cli -- adapter-conformance examples/custom-adapter/adapter-conformance.json
```

Expected output is `AgentShield Adapter Conformance: PASS`. Review any failed case before trusting a custom adapter.

## 6. Run Benchmark CI Gate

```sh
pnpm cli -- bench --ci
```

Expected output is `AgentShield CI Gate: PASS`. This checks the local deterministic attack corpus and fails if current protections regress.

## 7. Run Performance Checks

```sh
pnpm cli -- perf
```

Expected output is `AgentShield Performance: PASS`. This is a lightweight local budget check, not a production load test.

## 8. Run Release Check

```sh
pnpm cli -- release-check
```

Expected output is `AgentShield release check: PASS`. This audits package metadata, public API expectations, required docs, README coverage, examples, and secret leakage checks.

## 9. Interpret Outputs

- `PASS` means the local release-candidate checks are structurally healthy.
- `FAIL` means at least one required check failed and should be fixed before handoff.
- JSON and Markdown formats are available for several commands when a CI job needs structured output.
- These checks do not prove production safety for arbitrary tools, real shell execution, or live network side effects.

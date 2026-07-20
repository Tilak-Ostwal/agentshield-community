# Policy Test Examples

`strict.policy-test.json` is a local regression suite for `examples/policies/strict.policy.json`.

Run it from the repository root:

```sh
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json --format json
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json --format markdown
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json --snapshot policy-test-snapshot.json
```

The suite uses deterministic mock actions only. It does not run shell commands, make network calls, or forward real side effects.

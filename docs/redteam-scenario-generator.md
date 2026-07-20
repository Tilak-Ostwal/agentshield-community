# Red-Team Scenario Generator

The red-team scenario generator creates deterministic local benchmark scenarios from reusable templates. It helps expand attack coverage without LLM calls, network calls, or nondeterministic fixtures.

## Template Format

Templates define metadata, variables, ordered tool-call steps, expected final decisions, and expected risk markers. Variables are expanded in sorted deterministic order.

## Usage

```sh
pnpm cli -- redteam list-templates
pnpm cli -- redteam generate --template prompt-injection-secret-exfiltration --out generated-redteam.json --force
pnpm cli -- redteam generate --all --out generated-redteam-all.json --force
pnpm cli -- redteam coverage
pnpm cli -- redteam coverage --format json
pnpm cli -- redteam coverage --format markdown
```

## Safety Limits

- No LLM calls.
- No network calls.
- Generated URLs must use `attacker.invalid`, `example.invalid`, or mock domains.
- Generated filesystem paths must stay under mock paths.
- Generated scenarios must not contain production-looking secrets.
- Output paths must stay inside the current workspace.
- Existing output files are not overwritten unless `--force` is passed.

## Adding Templates

Add templates under `examples/redteam/templates` and keep variables finite, deterministic, and mock-only. Risky scenarios should expect `deny` or `require_human_review`.

## Benchmark Connection

Generated scenarios validate against the same benchmark scenario schema used by `bench --ci`. Phase 35 also adds generated Corpus v3 scenarios into the built-in benchmark corpus.

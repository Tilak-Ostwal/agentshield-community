# Workspace Config

AgentShield workspace config gives projects one local file for security-relevant defaults. It is designed to make policy, registry, sandbox, approval, evidence, benchmarks, CI outputs, adapters, and release checks easier to review together.

Workspace config does not add a dashboard, SaaS backend, cloud service, or network dependency. It is a deterministic local configuration layer for future workspace-aware commands.

## Config Fields

- `version`: schema version. Phase 33 supports `1`.
- `name`: human-readable workspace name.
- `profile`: one of `strict`, `balanced`, `dev`, or `enterprise`.
- `policyPack`: optional built-in policy pack id, such as `strict-mcp-local`.
- `policyPath`: local policy file path.
- `registryPath`: local registry file path.
- `sandbox.enabled`: whether sandbox policy decisions should be enabled by default.
- `sandbox.defaultProfile`: default sandbox profile label for workspace-aware tooling.
- `approval.enabled`: whether human-review workflows are expected.
- `evidence.enabled`: whether evidence output is expected.
- `evidence.redactionRequired`: must be `true`; raw secrets must not appear in evidence.
- `bench.profile`: benchmark scoring profile to use later in workspace-aware bench flows.
- `bench.minimumScore`: minimum expected benchmark score.
- `bench.failOnCritical`: whether critical benchmark failures should fail CI.
- `ci.sarif`: whether CI should emit SARIF when later workspace-aware commands use this config.
- `ci.markdown`: whether CI should emit Markdown reports when later workspace-aware commands use this config.
- `adapters.mcp`: whether MCP adapter checks are expected.
- `adapters.custom`: whether custom adapter checks are expected.
- `adapters.conformanceRequired`: whether adapter conformance should be required.

## Profiles

- `strict`: deny-first local profile for release-candidate and CI evaluation.
- `balanced`: practical developer profile with review gates still expected.
- `dev`: temporary local iteration profile. The validator reports this as an unsafe-setting warning.
- `enterprise`: strict team profile for registry, evidence, CI, and adapter conformance expectations.

## Commands

Create a config:

```sh
pnpm cli -- workspace init
pnpm cli -- workspace init --out agentshield.workspace.json
pnpm cli -- workspace init --out agentshield.workspace.json --force
```

Validate a config:

```sh
pnpm cli -- workspace validate agentshield.workspace.json
pnpm cli -- workspace validate examples/workspace/agentshield.workspace.json
```

Run lightweight workspace doctor checks:

```sh
pnpm cli -- workspace doctor examples/workspace/agentshield.workspace.json
pnpm cli -- workspace doctor examples/workspace/agentshield.workspace.json --format json
```

## How It Connects Existing Tools

Phase 33 makes the config parseable and validatable. It is structured so future workspace-aware commands can read policy, registry, sandbox, approval, evidence, benchmark, CI, adapter, and release-check preferences from the same file.

Phase 34 adds `policyPack` so a workspace can reference a curated built-in pack. If both `policyPack` and `policyPath` are present, validation reports a precedence warning. Current explicit commands continue using policy files directly.

For now, keep running existing explicit commands for enforcement:

```sh
pnpm cli -- policy-audit examples/policies/strict.policy.json
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json
pnpm cli -- adapter-conformance examples/custom-adapter/adapter-conformance.json
pnpm cli -- bench --ci
pnpm cli -- release-check
```

## Limitations

- Workspace config is local configuration only; it is not a policy authority by itself.
- It does not implement a real OS sandbox.
- It does not run large tests automatically.
- It does not replace developer review of policies or registries.
- It does not provide hosted attestation, dashboards, SaaS, or cloud services.
- Workspace-aware use by `bench`, `policy-test`, `policy-audit`, `adapter-conformance`, and `release-check` is intentionally reserved for later phases.

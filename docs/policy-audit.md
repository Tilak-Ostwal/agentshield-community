# Policy Audit

AgentShield policy audit is a local static analyzer for policy coverage, risky defaults, broad allows, rule conflicts, and registry-policy gaps. It complements policy tests: policy tests verify expected runtime decisions for specific actions, while policy audit looks for policy design risks across rules and registered tools.

## Run

```sh
pnpm cli -- policy-audit examples/policies/strict.policy.json
pnpm cli -- policy-audit examples/policies/strict.policy.json --format json
pnpm cli -- policy-audit examples/policies/strict.policy.json --format markdown
pnpm cli -- policy-audit examples/policies/strict.policy.json --registry examples/registry/agentshield.registry.json
pnpm cli -- policy-audit examples/policies/strict.policy.json --out policy-audit-report.md
```

Reports are local only. The command does not upload files, call GitHub APIs, call external services, execute shell commands, or spawn tools.

## Checks

The audit checks that unknown tools fail closed, dangerous tools are explicitly denied or reviewed, secret and credential flows are denied, risky allow rules are not overly broad, duplicate and conflicting rules are visible, and registry tools have policy coverage.

Registry-aware checks flag high-risk registered tools without explicit deny or review coverage and treat any policy allow for a blocked registry tool as critical.

## Findings

Findings use these severities:

- `critical`: policy can permit unknown, blocked, or secret-exfiltration paths.
- `high`: dangerous coverage gaps or broad allows.
- `medium`: missing approval, sandbox, execution constraints, or registry coverage warnings.
- `low` and `info`: lower-risk maintainability issues.

The default command fails when a critical finding exists or when a high-severity dangerous allow exists. Other findings are warnings.

## Coverage Score

The coverage score starts at 100 and subtracts deterministic penalties by severity. It is a local heuristic for comparing policy revisions, not a formal proof of safety.

## Limitations

The analyzer is static and conservative. It does not execute tools, contact registries, evaluate arbitrary runtime state, or prove that every resource path is safe. Use policy tests and benchmark runs alongside audit results before changing release or CI gates.

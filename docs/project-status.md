# Project Status

AgentShield Veritas is a Phase 0 release candidate for local evaluation of AI-agent security controls. It is built for deterministic, deny-by-default checks around policies, mock tools, adapter behavior, evidence traces, and local benchmark scenarios.

## Currently Working

- Local TypeScript monorepo build and test flow with `pnpm build` and `pnpm test`.
- CLI commands for policy validation, policy explanation, policy audit, policy tests, benchmark runs, performance checks, release checks, SDK demos, MCP mock conformance, and adapter conformance.
- Deterministic policy evaluation that treats LLM output as untrusted input and preserves deny precedence.
- Local attack benchmark corpus with CI-oriented scoring and redacted reports.
- Tamper-evident evidence traces generated from redacted local events.
- Tool registry validation and fingerprint attestation for local registry files.
- Mock MCP and custom adapter conformance harnesses with certification-style reports.

## Release-Candidate Ready

- Local developer evaluation flow documented in README and examples.
- Package release metadata checks for dist targets, exports, version consistency, and CLI bin wiring.
- Required documentation coverage checks in `release-check`.
- Secret leakage checks for docs and built package output.
- Adapter conformance reporting for local custom adapter suites.
- CI-style local gates using `bench --ci`, `policy-audit`, `policy-test`, `perf`, and `release-check`.

## Prototype Or Mock-Only

- MCP adapter flows use safe local mock servers and mock tools.
- Demo agents and examples are deterministic local demonstrations only.
- Sandbox profiles are policy decisions and runtime metadata, not a real OS sandbox.
- Evidence and attestation are local deterministic artifacts, not externally witnessed production attestations.
- Benchmark scenarios are local fixtures, not an exhaustive adversarial corpus.

## Not Production Guaranteed

AgentShield Veritas does not guarantee production isolation, production-grade attestation, complete attack coverage, or safe execution of arbitrary real tools. Policies require developer review, registry entries require review, and integrations must be threat-modeled before use with real agent side effects.

## Recommended Beta Use Cases

- Evaluate deny-by-default policy behavior on local mock workflows.
- Add policy regression tests for proposed agent tool permissions.
- Run adapter conformance before integrating a custom local adapter.
- Generate redacted evidence traces for local security review.
- Use benchmark and release-check output as CI signals during development.

## Not Recommended Use Cases

- Production sandboxing of untrusted code or tools.
- Hosted dashboard, SaaS, or multi-tenant control plane deployments.
- Final compliance attestation for regulated production systems.
- Letting an LLM make final policy decisions.
- Forwarding arbitrary shell, network, or filesystem side effects without a separate hardened sandbox and human review.

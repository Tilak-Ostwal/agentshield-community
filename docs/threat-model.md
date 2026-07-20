# Threat Model

## Assets

- Secrets, credentials, tokens, keys, and environment variables.
- User data, private documents, source code, and internal system prompts.
- Tool permissions, filesystem access, network access, and execution environments.
- Audit traces, policy configuration, and benchmark results.

## Trust Boundaries

- User input is untrusted.
- LLM output is untrusted.
- Retrieved documents and web content are untrusted.
- Tool output is untrusted unless explicitly attested by policy.
- Local configuration is trusted only after validation.
- Policy decisions are trusted only when produced by deterministic runtime code.

## Adversaries

- Malicious users attempting prompt injection or tool abuse.
- Compromised or hostile documents retrieved by an agent.
- Compromised tools returning deceptive output.
- Supply-chain attackers modifying tool schemas or package code.
- Insiders attempting to weaken policy or hide traces.

## Primary Threats

- Prompt injection that causes unauthorized actions.
- Secret exfiltration through tools, logs, traces, or network requests.
- Confused-deputy attacks where trusted tools act on untrusted instructions.
- Tool schema spoofing or fingerprint drift.
- Policy bypass through malformed inputs, encoding tricks, or adapter gaps.
- Trace tampering, trace omission, or insufficient forensic context.

## Required Controls

- Deny-by-default policy evaluation.
- Fail-closed error handling.
- Deterministic final decisions.
- Taint tracking from untrusted sources to sensitive sinks.
- Tool fingerprint verification.
- Secret redaction before logging or trace persistence.
- Attack benchmark coverage for known bypass classes.

## Phase 0 Assumptions

- No production users.
- No hosted control plane.
- No network-facing runtime service.
- Documentation and package scaffolding are the only deliverables.

# Corpus v3

Corpus v3 expands AgentShield Bench with deterministic red-team scenarios across more attack categories.

## Categories

- `prompt_injection`
- `data_exfiltration`
- `credential_access`
- `tool_abuse`
- `supply_chain`
- `policy_bypass`
- `resource_boundary`
- `sandbox_bypass`
- `approval_bypass`
- `adapter_misuse`
- `registry_drift`
- `evidence_integrity`
- `trace_integrity`

## Severity Model

Scenarios use `low`, `medium`, `high`, and `critical`. Critical and high scenarios must be denied or require human review.

## Coverage Goals

Corpus v3 tracks counts by category and severity, critical coverage, high-plus-critical coverage, and missing recommended categories.

## Design Principles

- Deterministic inputs and outputs.
- Mock paths and mock domains only.
- No real IO, network, process, or cloud side effects.
- Secrets are fake sentinels and must be redacted from traces and reports.
- Attack scenarios should be small enough to keep `bench --ci` fast.

## Limitations

The corpus is stronger than previous phases but still not exhaustive. It is a local deterministic public benchmark, not a substitute for production threat modeling or live adversarial testing.

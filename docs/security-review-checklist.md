# Security Review Checklist

Use this checklist before treating AgentShield Veritas as a serious local beta dependency or release candidate.

## Policy Review Checklist

- Verify `defaultDecision` is `deny`.
- Verify explicit deny rules take precedence over allow rules.
- Review every allow rule for resource scope, capability scope, and priority.
- Verify human-review rules cannot override explicit deny or invalid input.
- Run `pnpm cli -- policy-audit examples/policies/strict.policy.json`.
- Run policy regression suites with `pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json`.

## Registry Review Checklist

- Validate registry JSON before use.
- Review tool names, descriptions, capabilities, and expected fingerprints.
- Verify low-trust or unknown tools strengthen decisions instead of weakening them.
- Verify registry drift requires review or denial for risky capabilities.

## Sandbox And Process Review Checklist

- Treat sandbox profiles as policy metadata, not OS isolation.
- Verify shell execution is denied unless explicitly reviewed outside this prototype.
- Verify process launch commands are allowlisted by command id.
- Verify environment variables are not dumped into traces or reports.
- Verify network side effects are denied or tightly allowlisted.

## Evidence Trace Review Checklist

- Verify evidence bundles with `pnpm cli -- verify-trace <trace.json>`.
- Verify traces contain structured events, decisions, and redacted data only.
- Verify raw prompts, tokens, credentials, and environment dumps are absent.
- Verify evidence hash chains fail verification after tampering.

## Adapter Conformance Checklist

- Run `pnpm cli -- adapter-conformance examples/custom-adapter/adapter-conformance.json`.
- Review the certification status and every failed or warning case.
- Verify unknown tools deny fail-closed.
- Verify adapter execution errors deny fail-closed.
- Verify adapter output redacts fake secrets before reporting.

## CI Integration Checklist

- Run `pnpm build`.
- Run `pnpm test`.
- Run `pnpm cli -- release-check`.
- Run `pnpm cli -- bench --ci`.
- Run `pnpm cli -- perf`.
- Store generated reports only when they are redacted and intentionally retained.

## Secret Leakage Checklist

- Do not log raw prompts, secrets, credentials, tokens, or environment dumps.
- Verify reports and evidence do not contain raw fake secret sentinels.
- Keep fake secrets only in approved fixtures and tests.
- Run `pnpm cli -- doctor` before release candidate handoff.

## Release Checklist

- Verify README quick evaluation and release candidate status are current.
- Verify project status, known limitations, and security checklist docs exist.
- Verify end-to-end example README exists.
- Verify no generated smoke files remain in the repository root.
- Verify release-check passes locally.
- Do not publish, tag, or upload artifacts from Phase 0 without an explicit release process.

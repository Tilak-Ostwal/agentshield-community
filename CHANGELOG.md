# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-20

### Major Features
- **Provider-Neutral Tool-Call Adapter**: Normalizes tool calls across OpenAI, Anthropic, and Gemini.
- **Local Policy Marketplace**: Deterministic policy pack distribution.
- **Enterprise Integration Recipes**: Control matrix mapping.
- **Multi-Agent Session Guard**: Privilege escalation detection and cross-agent taint tracking.

### Architecture
- Introduced a framework-neutral workflow adapter bridge.
- Implemented taint and capability tracking primitives.
- Separated policy, runtime, cli, bench, and sdk into a modern monorepo structure.

### CLI
- Added `release-check` and `public-rc` command suites for rigorous release gates.
- Added `policy-audit`, `perf`, `security-fuzz`, and `redteam` generators.
- Introduced workspace initialization and doctor tools.

### Benchmarks
- Released **Corpus v4**: A deterministic local red-team scenario generator.
- Added public benchmark leaderboard format.
- Added CI security gate features for automated benchmark regressions.

### Security
- **Deny-by-Default** and **Fail-Closed** invariants strictly enforced across all decision paths.
- LLM output treated as untrusted input throughout.
- Sensitive data detection for secrets, PII, and credentials.
- Hash-chained, tamper-evident evidence export system.
- Raw secrets are never exposed in logs, traces, or built output.

### Documentation
- Built Documentation Site Content Pack with integrity validation.
- Extensive local documentation for all commands and security protocols.
- Added IDE integration with VS Code panel and tasks.

### Release Improvements
- Added v1.0 Readiness Report and Gap Closure Planner.
- Integrated Supply Chain Hardening with package integrity gates.
- Established strict governance records and maintainer review checklists.

---

## [0.0.0] - Pre-Release

Initial phase 0 through phase 60 development. The project transitioned from foundational policy evaluation engines and MCP mock prototypes to a hardened release candidate.

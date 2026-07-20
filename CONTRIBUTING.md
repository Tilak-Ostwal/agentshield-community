# Contributing to AgentShield Veritas

Thank you for your interest in contributing to AgentShield Veritas! We welcome community contributions to help build a robust, open-source AI-agent security runtime.

## Repository Setup

AgentShield Veritas is a TypeScript monorepo using `pnpm`.

### Installing dependencies

Ensure you have Node.js (>=20) and `pnpm` (>=9) installed.

```sh
pnpm install
```

### Build, Lint, and Test

Before submitting a Pull Request, verify your changes locally:

```sh
# 1. Build all packages
pnpm build

# 2. Run the linter
pnpm lint

# 3. Run the test suite
pnpm test
```

## Coding Style

- We use `eslint` and `prettier` to maintain code quality.
- Write strict TypeScript. Avoid `any`.
- Treat all LLM inputs as untrusted data.
- Enforce the fail-closed and deny-by-default security invariants.

## Commit Messages

We prefer clear, descriptive commit messages. 
- Use the imperative mood ("Fix bug", not "Fixed bug").
- Keep the first line under 72 characters.
- Reference issue numbers if applicable.

## Pull Requests

1. **Fork** the repository and create your feature branch from `main`.
2. **Commit** your changes and push to your fork.
3. **Run checks**: Ensure `pnpm build`, `pnpm lint`, `pnpm test`, and `pnpm cli -- release-check` pass locally.
4. **Submit a PR**: Include a clear description of the problem solved, the approach, and any testing performed.

## Issue Reporting

- Use GitHub Issues to report bugs or request features.
- Provide a clear summary and steps to reproduce.
- For security vulnerabilities, **do not open a public issue**. Follow the instructions in [SECURITY.md](SECURITY.md).
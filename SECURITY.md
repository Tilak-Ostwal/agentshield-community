# Security Policy

## Supported Versions

Currently, AgentShield Veritas is in active development toward a stable v1.0.0 release. Only the latest release candidate (`main` branch) receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| v1.0.0  | :white_check_mark: |
| < v1.0  | :x:                |

## Reporting Vulnerabilities

If you discover a security vulnerability in AgentShield Veritas, please report it responsibly.

**Do not file a public GitHub issue for security vulnerabilities.**

Instead, send a private report to the maintainers at `security@example.com` (placeholder until public disclosure process is finalized). Include the following in your report:

- A clear description of the vulnerability and its potential impact
- Steps to reproduce the issue using local fixtures only
- The affected package(s) and version(s)
- Any suggested mitigations you have identified

## Response Process

We aim to acknowledge reports within 48 hours and provide status updates as we investigate. We treat security reports as a high priority.

1. **Acknowledge**: Maintainers will confirm receipt of the report.
2. **Triage**: Maintainers will evaluate the severity and validity of the issue.
3. **Fix**: A patch will be developed and tested against our security invariants.
4. **Disclose**: Once a fix is released, we will publish an advisory.

## Security Scope

AgentShield Veritas is a local development and evaluation tool for AI agent security. 

### What is in scope
- Bypasses of deterministic policy rules.
- Execution of commands or side effects that should be denied by policy.
- Unintentional exposure of raw secrets in logs or evidence traces.
- Integrity failures in the cryptographic evidence trace system.

### What is out of scope
- Production OS-level sandboxing escapes (this is an application-level proxy).
- Exploits that require physical access to the local machine.
- Cloud infrastructure or SaaS vulnerabilities (there is no hosted backend).
- Vulnerabilities within third-party Node.js dependencies, unless they directly break AgentShield's security invariants.

## Disclosure Policy

- Please allow reasonable time for the maintainers to triage and address the issue before public disclosure.
- Do not publish exploit code or detailed attack steps before coordinating with maintainers.
- We do not offer a bug bounty program at this stage.

## Security Notice

AgentShield Veritas is provided as a security research and policy evaluation tool.

Users are solely responsible for validating the software in their own environments and determining whether it is suitable for their intended use. The authors do not guarantee that the software will prevent security incidents, unauthorized access, data breaches, or other attacks.

Using AgentShield Veritas does not constitute a security certification, compliance guarantee, or assurance of protection against vulnerabilities. It does NOT guarantee compliance with SOC2, ISO27001, HIPAA, PCI-DSS, or any other formal regulatory standard.

Always perform independent security reviews before deploying the software in production environments.
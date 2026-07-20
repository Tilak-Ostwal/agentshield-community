# Multi-Agent Session Guard

The multi-agent session guard provides deterministic tracking and verification across multi-agent workflows.

## Why Multi-Agent Security Matters
In complex multi-agent setups (e.g. planner delegating to executor), an untrusted agent could try to launder its intent through a trusted executor to bypass policies. The session guard prevents this.

## Agent Identity
Agents have defined roles (`planner`, `executor`, `reviewer`, etc.) and trust levels (`trusted`, `untrusted`, `reviewed`, `blocked`).

## Features
- **Handoff Guard**: Verifies delegation logic (e.g., blocking unknown/untrusted delegates).
- **Cross-Agent Taint**: Taint propagation across agents to prevent laundering.
- **Privilege Escalation Detection**: Ensures a `planner` cannot escalate its privileges through an `executor`.
- **Approval Binding**: Approval tokens are bound to specific delegation chains.

## Usage
No external framework dependencies are required. Use the CLI commands to test safely locally.

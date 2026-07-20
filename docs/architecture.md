# Architecture

AgentShield Veritas is a security runtime for AI agents. Its first production version will sit between an agent framework and the external world, evaluating every action before execution and recording a structured audit trace.

Phase 0 defines the architecture only. The implementation remains intentionally small.

## Principles

- Deny by default.
- Fail closed on parser, policy, trace, storage, adapter, or fingerprinting errors.
- Make deterministic code the final authority for allow, deny, redact, and require-human-review decisions.
- Treat prompts, model outputs, tool outputs, retrieved documents, and external content as untrusted.
- Preserve enough trace context to investigate behavior without storing raw secrets.

## Components

### Protocol Adapter Layer

Adapters normalize agent-framework events into a common action envelope. Future adapters may cover MCP, OpenAI tool calls, LangChain, LlamaIndex, local shell tools, browser automation, and custom HTTP tools.

The adapter layer must not make policy decisions. It validates shape, assigns stable identifiers, redacts obvious secret fields, and passes normalized actions to the runtime.

### Deterministic Policy Engine

The policy engine evaluates normalized actions against explicit rules. It returns deterministic decisions:

- `allow`
- `deny`
- `redact`
- `require_human_review`

The engine must fail closed. LLM classifiers may provide advisory signals, but cannot be final allow/deny authorities.

### Session Graph Engine

The session graph records relationships between prompts, model outputs, tool calls, tool results, files, URLs, identities, and external data. It enables provenance queries such as "which untrusted source influenced this action?"

### Taint Tracking Engine

The taint engine tracks untrusted data across agent state. Initial taint categories include:

- `user_input`
- `llm_output`
- `retrieved_content`
- `tool_output`
- `external_network`
- `secret`

Policies can restrict flows, for example preventing tainted retrieved content from influencing shell commands or outbound network requests without review.

### Tool Fingerprinting

Tool fingerprinting creates stable identities for tools and their permissions. A fingerprint should include name, version, schema, declared side effects, network reachability, filesystem reachability, and execution environment metadata.

Unknown or changed fingerprints should default to review or denial based on policy.

### Audit Trace System

The trace system emits structured, append-only events for policy evaluation and action execution. It must redact secrets before persistence and preserve enough metadata for replay, debugging, and benchmark scoring.

### Attack Benchmark

The benchmark defines reproducible attack scenarios for prompt injection, tool abuse, data exfiltration, policy bypass, and trace integrity. Tests in `tests/attacks` should drive implementation.

### Future Enterprise Control Plane

A future enterprise control plane may manage organization policy, approvals, fleet configuration, and reporting. It is not part of Phase 0 and must not be required for local runtime operation.

## Package Boundaries

- `core`: deterministic primitives and shared schemas.
- `runtime`: action orchestration and adapter integration.
- `cli`: local developer commands.
- `bench`: benchmark definitions and runner.
- `registry`: metadata for policies, attacks, tools, and adapters.

## Phase 0 Non-Goals

- No dashboard.
- No SaaS service.
- No MCP proxy.
- No production policy engine.
- No persistent trace store.

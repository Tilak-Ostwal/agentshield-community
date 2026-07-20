# Agent Framework Adapter Bridge

The AgentShield Framework Adapter Bridge allows AgentShield to wrap and secure arbitrary AI agent frameworks (like LangChain, AutoGen, CrewAI, etc.) without introducing external dependencies.

## Why Framework-Level Enforcement Matters
Modern agent frameworks construct complex multi-step workflows (chains, graphs, sequential tasks). Securing the final output is not enough—each step in the workflow must be validated, and context (such as tainted inputs or capabilities) must be preserved across the session. The Framework Bridge normalizes framework execution to enable granular, step-by-step enforcement.

## Framework-Neutral Design
The bridge defines neutral schemas for:
- **Framework Tool Wrapper**: Represents tools and actions registered within the host framework.
- **Framework Runnable/Step**: Represents the runtime execution of a tool.
- **Workflow Runner**: Wraps multi-step execution to accumulate context (attack graphs, taints) across the sequence.

## Execution Enforcement
Before any framework step executes, the wrapper intercepts the input, builds an `ActionEnvelope`, and evaluates it against the active policy.
- **Allowed**: The step executes. Outputs are scanned and redacted.
- **Denied**: The step is blocked, returning a safe failure. Subsequent steps are blocked by default.
- **Review**: The step is paused, requesting human approval.

## Context Preservation
The Workflow Runner maintains an ongoing `PolicyV2EvaluationContext`. If a step outputs sensitive data (like a fake secret `sk-...-ME`), the context is tainted with `secret`. If a subsequent step attempts to exfiltrate data (e.g., `network.post`), the combined state (`secret` + `network.write`) triggers a policy violation.

## CLI Usage
```sh
agentshield framework-adapter wrap examples/framework-adapter/framework-tool-registry.json
agentshield framework-adapter run-demo examples/framework-adapter/safe-readonly-workflow.json
```

## Limitations
This system provides mock executors to demonstrate security mechanics. It does not replace the host framework's actual execution model, but rather demonstrates how AgentShield integrates securely as middleware.

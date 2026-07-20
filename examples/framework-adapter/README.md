# Framework Adapter Bridge Examples

This directory contains examples for testing and verifying the Agent Framework Adapter Bridge.

## Available Workflows

- `safe-readonly-workflow.json`: A standard read action that passes policy.
- `blocked-secret-exfiltration-workflow.json`: Attempts to read a secret file and then POST it externally.
- `write-then-execute-workflow.json`: Demonstrates behavior when attempting to write and then run a script.
- `registry-drift-workflow.json`: Demonstrates a fallback denial for unknown tools.
- `approval-required-workflow.json`: Demonstrates a tool execution requiring human review.
- `framework-tool-registry.json`: Example tool definitions for the host framework.

## Running Demos

```sh
# Wrap/validate the registry
pnpm cli -- framework-adapter wrap examples/framework-adapter/framework-tool-registry.json

# Run safe workflow
pnpm cli -- framework-adapter run-demo examples/framework-adapter/safe-readonly-workflow.json

# Run blocked workflow
pnpm cli -- framework-adapter run-demo examples/framework-adapter/blocked-secret-exfiltration-workflow.json
```

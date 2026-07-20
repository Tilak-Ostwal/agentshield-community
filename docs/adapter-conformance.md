# Adapter Conformance Harness

AgentShield includes a local, deterministic adapter conformance harness. Custom adapters can prove they follow AgentShield safety rules by running a structured suite of required cases against the adapter's normalization, decision, execution, and redaction pipelines.

## Conformance Suite Format

A conformance suite is a JSON file describing the adapter under test and one or more cases. Two case types are supported.

### `tool_call` cases

Run a tool call through the full adapter pipeline and verify decision, forwarding, and execution status.

```json
{
  "id": "case-01-safe-read",
  "type": "tool_call",
  "name": "Safe read normalizes and forwards only after allow",
  "description": "filesystem.read is allowed by policy and executed.",
  "toolCall": {
    "id": "safe-read",
    "tool": "filesystem.read",
    "arguments": { "path": "/mock/project/README.md" }
  },
  "expected": {
    "decision": "allow",
    "forwarded": true,
    "executionStatus": "executed",
    "mustNotForward": false,
    "mustRedactSecret": true
  }
}
```

### `duplicate_registration` cases

Verify that registering the same `adapterId` twice throws immediately.

### `invalid_metadata` cases

Verify that registering an adapter with missing or invalid fields fails validation.

## Required Conformance Cases

All 10 cases must pass for certification.

| # | Case | Type |
| --- | --- | --- |
| 1 | Safe read normalizes and forwards only after allow | `tool_call` |
| 2 | Unknown tool denied and not forwarded | `tool_call` |
| 3 | Network token exfiltration denied and not forwarded | `tool_call` |
| 4 | Write action requires review and not forwarded | `tool_call` |
| 5 | Shell execution denied and not forwarded | `tool_call` |
| 6 | Normalization error fails closed | `tool_call` |
| 7 | Execution error fails closed | `tool_call` |
| 8 | Adapter output redacts fake secret | `tool_call` |
| 9 | Duplicate adapter ID rejected | `duplicate_registration` |
| 10 | Invalid adapter metadata rejected | `invalid_metadata` |

## Certification Rules

| Rule | Effect |
| --- | --- |
| `deny` or `require_human_review` decision was forwarded | `fail` |
| Fake secret sentinel appears in certification output | `fail` |
| Execution error did not produce `executionStatus: "error"` | `fail` |
| Required safety case produced unexpected decision/forward/status | `fail` |
| Optional metadata warning only | `passed_with_warnings` |

Certification status is one of:

- **`pass`** — all required cases pass, no warnings
- **`passed_with_warnings`** — all required cases pass, non-critical warnings present
- **`fail`** — one or more required cases failed or a certification rule was violated

## SDK Helper

```ts
import { createMockAdapter } from "./myAdapter.js";
import { runAdapterConformance, generateCertificationMarkdown } from "@agentshield/sdk";

const suite = JSON.parse(readFileSync("adapter-conformance.json", "utf8"));
const result = await runAdapterConformance(createMockAdapter(), suite);
console.log(generateCertificationMarkdown(result));
```

## CLI

```sh
# Text report (default)
pnpm cli -- adapter-conformance examples/custom-adapter/adapter-conformance.json

# JSON report
pnpm cli -- adapter-conformance examples/custom-adapter/adapter-conformance.json --format json

# Markdown report to stdout
pnpm cli -- adapter-conformance examples/custom-adapter/adapter-conformance.json --format markdown

# Write Markdown report to file
pnpm cli -- adapter-conformance examples/custom-adapter/adapter-conformance.json --format markdown --out adapter-conformance-report.md
```

The CLI exits 0 on `pass` or `passed_with_warnings`, and exits 1 on `fail` or any error.

## Example Suite

See [examples/custom-adapter/adapter-conformance.json](../examples/custom-adapter/adapter-conformance.json) for the full 10-case example suite.

## Safety Limits

The conformance harness runs locally only. It does not connect to external networks, spawn arbitrary child processes, execute real shell commands, or perform destructive filesystem operations. All redaction is applied to the full serialized output before the result is returned.

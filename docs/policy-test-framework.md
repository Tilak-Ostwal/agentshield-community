# Policy Test Framework

AgentShield policy tests let teams write local regression suites for policy behavior. The runner loads a policy, optionally loads a local registry, processes mock actions through the runtime, and compares stable decision fields.

## Test File Format

```json
{
  "version": 1,
  "name": "strict-policy-regression-tests",
  "policyPath": "examples/policies/strict.policy.json",
  "registryPath": "examples/registry/agentshield.registry.json",
  "tests": [
    {
      "id": "allow-project-read",
      "name": "Allow project readonly file read",
      "action": {
        "actionId": "read_1",
        "timestamp": "2026-06-28T00:00:00.000Z",
        "actionType": "tool_call",
        "toolName": "filesystem.read",
        "input": { "path": "/mock/project/README.md" }
      },
      "expected": {
        "decision": "allow",
        "ruleId": "allow-readonly-project-files",
        "capabilitiesAny": ["filesystem.read"],
        "taintAny": [],
        "forwarded": true
      }
    }
  ]
}
```

## Expected Fields

- `decision`: required expected final decision.
- `ruleId`: optional exact winning rule id.
- `capabilitiesAny`: optional list where at least one capability must be observed. An empty list requires no observed capabilities.
- `taintAny`: optional list where at least one taint label must be observed. An empty list requires no observed taint.
- `riskMarkersAny`: optional list where at least one risk marker must appear.
- `forwarded`: optional expected forwarding model. In policy tests, only `allow` is treated as forwardable.
- `approvalTicket`: optional expected approval ticket presence.
- `executionPreflightStatus`: optional exact execution preflight status.
- `sandboxDecision`: optional sandbox profile id.

## CLI Usage

```sh
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json --format json
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json --format markdown
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json --out policy-test-report.md
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json --snapshot policy-test-snapshot.json
```

The command exits `0` when all tests pass and `1` when any test fails.

## Regression Snapshots

Snapshots capture deterministic decision fields for review in CI:

```sh
pnpm cli -- policy-test examples/policy-tests/strict.policy-test.json --snapshot policy-test-snapshot.json
```

Snapshots include test id, decision, rule id, observed capabilities, taint labels, risk markers, approval ticket presence, execution status, and sandbox profile id.

## Safety Limits

Policy tests use local mock actions only. They do not make network calls, run shell commands, spawn arbitrary processes, perform destructive filesystem operations, or forward real side effects. Reports are redacted so raw fake secrets do not appear.

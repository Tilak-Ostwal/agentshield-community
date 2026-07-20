# Policy Language v2

AgentShield policy v2 is a deterministic, compiled security policy language for local agent actions. It matches tool names, capabilities, taint labels, resource scopes, risk severities, and attack graph patterns without LLM calls or randomness.

## Schema

Policies use `version: 2`, `defaultDecision: "deny"`, a `mode`, and ordered rules with explicit priorities. Rule effects are `allow`, `deny`, `redact`, or `require_human_review`.

```json
{
  "version": 2,
  "name": "strict-local-agent-policy",
  "defaultDecision": "deny",
  "mode": "strict",
  "rules": [
    {
      "id": "allow-readonly-project-files",
      "effect": "allow",
      "priority": 100,
      "match": {
        "actionType": "tool_call",
        "toolName": "filesystem.read",
        "toolNamePattern": "filesystem.*",
        "capability": "filesystem.read",
        "capabilitiesAny": ["filesystem.read"],
        "capabilitiesAll": ["filesystem.read"],
        "taintAny": ["secret"],
        "taintAll": ["secret"],
        "riskSeverityAny": ["low", "medium", "high", "critical"],
        "attackGraphPatternAny": ["secret_to_network"],
        "resource": {
          "type": "filesystem",
          "allow": ["/mock/project/**"],
          "deny": ["/mock/project/.env"]
        }
      }
    }
  ]
}
```

Unknown fields are validation errors. Invalid or missing policies fail closed and cannot allow an action.

## Precedence

Rules are compiled into a stable order:

1. Safety strength: `deny` > `require_human_review` > `redact` > `allow`.
2. Higher `priority` wins only among rules with the same safety strength.
3. Exact `toolName` wins over `toolNamePattern` at equal strength and priority.
4. Source order and rule ID provide deterministic tie breakers.

Resource `deny` scopes override resource `allow` scopes. If resource matching is uncertain, the matching rule does not allow the action, so the default deny remains in force unless another stronger rule matches.

## Diagnostics

The compiler returns diagnostics with `info`, `warning`, or `error` severity. It rejects duplicate rule IDs and invalid schema values. It warns on broad allow rules, allow rules for critical capabilities, and allow rules for filesystem, network, or shell capabilities without resource boundaries.

## Explain Output

Policy decisions include matched rules, the winning rule, the precedence reason, diagnostics, and observed context. Explanations are redacted before trace or evidence persistence.

## Safe Defaults

Policy v2 is deny-by-default. Runtime errors, invalid actions, invalid policy, missing policy, unknown capability matches, and unknown taint matches fail closed. LLM advisory data is never a policy authority.

## Migration From v1

Policy v1 remains supported. A v1 rule uses `decision`; v2 uses `effect`, `priority`, `mode`, and richer `match` fields. To migrate, set `version` to `2`, add a policy `name` and `mode`, convert each rule `decision` to `effect`, add explicit priorities, and add resource scopes to allow rules for filesystem, network, or shell capabilities.

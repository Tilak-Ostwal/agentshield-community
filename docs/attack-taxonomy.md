# Attack Taxonomy

AgentShield Veritas uses this taxonomy to organize tests, policy rules, and benchmark scenarios.

## Prompt Injection

- Direct instruction override.
- Indirect injection from retrieved documents.
- Role or system prompt extraction attempts.
- Encoding and obfuscation tricks.
- Multi-turn instruction smuggling.

## Tool Abuse

- Unauthorized filesystem reads or writes.
- Shell command escalation.
- Browser or HTTP requests to attacker-controlled endpoints.
- Destructive operations hidden in benign requests.
- Tool argument injection.

## Data Exfiltration

- Secret leakage through tool arguments.
- Secret leakage through network requests.
- Secret leakage through logs or traces.
- Covert channels through filenames, URLs, headers, or error messages.

## Policy Bypass

- Adapter normalization gaps.
- Case, Unicode, escaping, or serialization ambiguity.
- Unknown tool fingerprint reuse.
- Policy ordering confusion.
- Human-review downgrade attempts.

## Supply Chain

- Tool schema drift.
- Package compromise.
- Registry poisoning.
- Malicious benchmark fixtures.

## Trace Integrity

- Missing events.
- Reordered events.
- Incomplete policy context.
- Raw secret persistence.
- Ambiguous action identity.

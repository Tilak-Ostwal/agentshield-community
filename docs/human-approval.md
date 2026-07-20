# Human Approval Gate

AgentShield Veritas uses local approval tickets and signed approval tokens to make `require_human_review` decisions actionable without making a human or an LLM the final policy authority.

## Approval Tickets

An approval ticket is created only when the deterministic runtime decision is `require_human_review`. The ticket records the trace id, action id, action hash, expiry, requested decision, reason, risk markers, observed capabilities, taint labels, registry findings, policy rule id, and evidence root hash.

Tickets are redacted before trace storage. Raw prompts, tokens, credentials, environment dumps, and fake secret sentinels must not appear in tickets, traces, reports, or CLI output.

## Approval Tokens

An approval token contains the ticket id, exact action hash, approved decision, approver, reason, issue time, expiry, nonce, and signature. Tokens can approve or reject only the exact ticket action hash.

Local signing uses Node.js `crypto` HMAC-SHA256. The signing key is passed to the signer and verifier as an argument. It is never stored in traces, evidence, reports, tokens, tickets, or CLI output.

## Action Hash Binding

The action hash is SHA-256 over canonical JSON containing the redacted normalized action, relevant policy/risk context, and ticket context. Changing the tool name, input, capability context, taint context, resource, or ticket binding changes the hash.

## Expiration

Tickets and tokens have ISO timestamps. Expired approvals fail closed and do not allow forwarding or execution.

## Deny Precedence

Approval can:

- Convert `require_human_review` to `allow` for the exact reviewed action.
- Convert `require_human_review` to `deny`.

Approval cannot:

- Convert `deny` to `allow`.
- Override invalid input.
- Override explicit policy deny.
- Override blocked registry trust.
- Override critical secret exfiltration.
- Override fail-closed decisions.
- Apply to a different action hash.
- Apply with an invalid signature or expired token.

Missing approval keeps the decision at `require_human_review`. Deny approval tokens produce `deny`.

## CLI Examples

```sh
pnpm cli -- approval demo
pnpm cli -- approval create --scenario write-then-exec --out approval-ticket.json --force
pnpm cli -- approval approve approval-ticket.json --out approval-token.json --approver local-dev --reason "Reviewed local mock action" --force
pnpm cli -- approval verify approval-ticket.json approval-token.json
pnpm cli -- mcp-proxy-demo --approval-token approval-token.json
```

The CLI uses a clearly fake local demo key for deterministic local tests. It is not a production key and is not printed.

## Safety Limits

This phase does not add a dashboard, SaaS workflow, cloud signing, external signing service, real network calls, real shell execution, or arbitrary child process execution.

## Future Workflow

Future enterprise approval workflows can replace the local key source and add reviewer identity systems, storage, and multi-party review. The security invariant remains the same: approval may only act on deterministic `require_human_review` decisions and must never weaken deny.

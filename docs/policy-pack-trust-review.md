# Policy Pack Trust Review

AgentShield enforces a strict trust review process before a policy pack can be recommended. The local marketplace calculates a safety score to assess risk.

## Safety Score Model
The score starts at 100.
- **Fail (Score 0)**:
  - Weakening deny-by-default behavior.
  - Adding unsafe broad allows (e.g., `*`) without dev-warning mode.
  - Claiming production readiness while using warn-only mode.
  - Missing limitation disclaimers (e.g., legal/compliance).
- **Warn (Score penalties)**:
  - Unknown publisher (-20).
  - Broad workspace profile compatibility (-10).
  - Missing bundle provenance (-10).

## Generating a Review Record

```bash
pnpm cli -- marketplace review examples/marketplace/entries/strict-mcp-local.marketplace.json
```

This generates a deterministic report outlining the safety checks, risks, and final decision. This helps connect community policies to open-source governance.

## Limitations
A passed trust review is a technical assessment of deterministic rules. It is not a legal compliance certification.

# Auditor Evidence Export

AgentShield provides deterministic, local evidence exports for auditing purposes.

## Exporting

```bash
agentshield auditor export --out auditor-evidence.json
agentshield auditor export --format markdown --out auditor-evidence.md
```

## Verifying

```bash
agentshield auditor verify auditor-evidence.json
```

## Limitations
This is deterministic local evidence, not a claim of SOC2, ISO, HIPAA, PCI, or any regulatory compliance.

# Attack Graph Explanation

**Category:** secret_exfiltration_chain
**Severity:** CRITICAL
**Final Decision:** deny

## Summary
Untrusted content caused a secret read followed by an external network write.

## Risk Path
1. **document.read** (untrusted_source)
   - The agent read untrusted content that contained instructions.
2. **fs.read** (sensitive_read)
   - The agent attempted to read a sensitive file.
3. **network.post** (external_sink)
   - The agent attempted to send sensitive data externally. This action was denied.

## Policy & Evidence
- **Matched Rules:** None
- **Decision Reason:** Graph analysis matched secret_exfiltration_chain
- **Evidence Hash:** abc123def456

## Fix Recommendations
- **[HIGH] Deny secret-to-network flows**: Add or keep a deny rule for credential data sent to external network tools.

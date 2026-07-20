# Known Limitations

AgentShield Veritas is a serious local release candidate, but it is still Phase 0 software. These limitations should be considered part of the security model.

- It is not a real OS sandbox yet. Sandbox profiles are deterministic policy decisions and runtime metadata.
- Mock adapters, mock MCP servers, demo agents, and example tools are mock-only and do not prove safety for arbitrary production tools.
- There is no hosted dashboard.
- There is no SaaS backend.
- There is no real production attestation service or external timestamping service.
- Policies require developer review before use with real side effects.
- Registry files require developer review and local trust decisions.
- The benchmark corpus is local and deterministic, not exhaustive.
- Evidence traces are redacted local artifacts, not a substitute for production audit infrastructure.
- Adapter conformance reports show compatibility with the local harness, not a guarantee that an adapter is safe in every deployment.

# Supply Chain Hardening

AgentShield Veritas is designed to be a high-assurance platform. To maintain this assurance, we implement local deterministic supply-chain hardening checks.

## Checks Performed
- **Export Map Validation**: Ensures all package exports resolve internally, preventing path traversal via exports.
- **Generated File Cleanup**: Ensures temporary files from tests or generation are not accidentally packed.
- **Secret Leak Detection**: Scans distributable, examples, and docs for the raw fake secret sentinel.
- **Unsafe Command Scanning**: Prevents instructions like `npm run build --publish` or `git command for pushing` from sneaking into automated examples or doc scripts.
- **Build Artifact Inventory**: Records the final CLI artifacts for reproducible verification.

## Limitations
- These are local integrity gates; not a cloud SaaS compliance service.
- We do not run external network checks or sign packages in Phase 0.

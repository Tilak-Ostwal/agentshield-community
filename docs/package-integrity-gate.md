# Package Integrity Gate

The Package Integrity Gate is integrated into the Release Candidate workflow.

## Package Integrity Config
Located in `examples/supply-chain/package-integrity.example.json`.

## How to Review
1. Run `agentshield supply-chain check`
2. Run `agentshield supply-chain report`

Failures here will prevent a Release Candidate from being generated.

## Roadmap
In the future, these artifacts will be deterministically signed.

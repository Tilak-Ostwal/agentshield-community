# Registry Trust Bundles

## Why registry trust bundles exist
Registry trust bundles allow you to package tool registry entries (fingerprints, trust levels, capability declarations) and attestation metadata into tamper-evident, offline-verifiable bundles.

## What registry provenance means
Provenance tracking ensures you know *how* the bundle was generated, including the source file, workspace profile used, tool counts, and metadata.

## Local-only signing limitation
In Phase 0, AgentShield uses a local `HMAC-SHA256-TEST-ONLY` algorithm. Do not rely on this for production key management.

## Bundle creation from registry
You can create a bundle securely using the CLI:
```sh
agentshield registry-bundle create --registry my-registry.json --out my-bundle.json
```

## Bundle inspection
Inspect the metadata and contents:
```sh
agentshield registry-bundle inspect my-bundle.json
```

## Bundle verification
Verify the hash and signature to ensure no tampering occurred:
```sh
agentshield registry-bundle verify my-bundle.json
```

## Workspace integration
Add it to your workspace config:
```json
{
  "registryBundlePath": "path/to/my-bundle.json"
}
```
The workspace doctor will automatically verify the bundle.

## How this complements policy bundles
While policy bundles ensure the rules are intact, registry bundles ensure the tool definitions and capabilities they govern have not been compromised.

## What this does not guarantee yet
It does not guarantee remote attestation, HSM integration, or dynamic updates.

## Future production signing roadmap
We plan to introduce asymmetric cryptography and cloud KMS integrations for robust enterprise environments.

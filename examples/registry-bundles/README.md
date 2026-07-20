# Registry Trust Bundles

This directory contains examples of signed registry trust bundles.

## Operations

### Create bundle from registry
```sh
agentshield registry-bundle create --registry examples/registry/agentshield.registry.json --out generated-registry.bundle.json --force
```

### Inspect bundle
```sh
agentshield registry-bundle inspect examples/registry-bundles/agentshield.registry.bundle.json
```

### Verify bundle
```sh
agentshield registry-bundle verify examples/registry-bundles/agentshield.registry.bundle.json
```

### Configure workspace to use registry bundle
```json
{
  "registryBundlePath": "examples/registry-bundles/agentshield.registry.bundle.json"
}
```

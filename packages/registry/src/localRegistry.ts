import type { ToolAttestationMetadata } from "./fingerprintAttestation.js";
import { attestToolFingerprint, type FingerprintAttestationResult } from "./fingerprintAttestation.js";
import { registryEntryKey, type RegistryEntry } from "./registryEntry.js";
import type { RegistryFile } from "./registryFile.js";

export class LocalToolRegistry {
  private readonly entries = new Map<string, RegistryEntry>();

  public constructor(public readonly registryFile: RegistryFile) {
    for (const entry of registryFile.entries) {
      this.entries.set(registryEntryKey(entry), entry);
    }
  }

  public getEntry(serverName: string, toolName: string): RegistryEntry | undefined {
    return this.entries.get(`${serverName}:${toolName}`);
  }

  public attest(metadata: ToolAttestationMetadata): FingerprintAttestationResult {
    return attestToolFingerprint(this.getEntry(metadata.serverName, metadata.toolName), metadata);
  }

  public listEntries(): RegistryEntry[] {
    return [...this.entries.values()].sort((left, right) => registryEntryKey(left).localeCompare(registryEntryKey(right)));
  }
}

export function createLocalRegistry(registryFile: RegistryFile): LocalToolRegistry {
  return new LocalToolRegistry(registryFile);
}

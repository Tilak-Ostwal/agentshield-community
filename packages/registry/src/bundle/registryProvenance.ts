import { hashCanonical } from "@agentshield/core";
import type { RegistryFile } from "../registryFile.js";
import type { RegistryProvenance } from "./registryBundleSchema.js";

export interface RegistryProvenanceOptions {
  source: "manual" | "generated" | "workspace";
  sourceId: string;
  workspaceProfile?: string;
  notes?: string[];
}

export function generateRegistryProvenance(registry: RegistryFile, options: RegistryProvenanceOptions): RegistryProvenance {
  const registryHash = hashCanonical(registry);
  let trustedToolCount = 0;
  let reviewedToolCount = 0;
  let blockedToolCount = 0;
  
  for (const entry of registry.entries) {
      if (entry.trustLevel === "trusted") trustedToolCount++;
      else if (entry.trustLevel === "reviewed") reviewedToolCount++;
      else if (entry.trustLevel === "blocked") blockedToolCount++;
  }

  return {
    source: options.source,
    sourceId: options.sourceId,
    workspaceProfile: options.workspaceProfile,
    generatedBy: "agentshield",
    generatorVersion: "0.0.0",
    registryHash,
    toolCount: registry.entries.length,
    trustedToolCount,
    reviewedToolCount,
    blockedToolCount,
    notes: options.notes
  };
}

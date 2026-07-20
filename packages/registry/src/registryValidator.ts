import { registryEntryKey } from "./registryEntry.js";
import { registryFileSchema, type RegistryFile } from "./registryFile.js";

export interface RegistryValidationIssue {
  severity: "warning" | "error";
  code: string;
  message: string;
  entryKey?: string;
}

export interface RegistryValidationResult {
  valid: boolean;
  issues: RegistryValidationIssue[];
  registry?: RegistryFile;
}

export function validateRegistryFile(input: unknown): RegistryValidationResult {
  const parsed = registryFileSchema.safeParse(input);

  if (!parsed.success) {
    return {
      valid: false,
      issues: parsed.error.issues.map((issue) => ({
        severity: "error",
        code: "INVALID_REGISTRY_SCHEMA",
        message: `${issue.path.join(".") || "registry"}: ${issue.message}`
      }))
    };
  }

  const issues: RegistryValidationIssue[] = [];
  const seen = new Set<string>();

  for (const entry of parsed.data.entries) {
    const key = registryEntryKey(entry);
    if (seen.has(key)) {
      issues.push({
        severity: "error",
        code: "DUPLICATE_REGISTRY_ENTRY",
        message: `duplicate registry entry for ${key}`,
        entryKey: key
      });
    }
    seen.add(key);

    if ((entry.trustLevel === "trusted" || entry.trustLevel === "reviewed") && entry.reviewedAt === undefined) {
      issues.push({
        severity: "warning",
        code: "MISSING_REVIEW_TIMESTAMP",
        message: `reviewed tool ${key} has no reviewedAt timestamp`,
        entryKey: key
      });
    }
  }

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
    registry: parsed.data
  };
}

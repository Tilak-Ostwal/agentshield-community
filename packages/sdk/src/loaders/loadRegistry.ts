import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { createLocalRegistry, parseRegistryFile, validateRegistryFile, type LocalToolRegistry, type RegistryFile } from "@agentshield/registry";

export type LoadedRegistry =
  | { ok: true; registryFile: RegistryFile; toolRegistry: LocalToolRegistry; path: string }
  | { ok: false; error: string; path: string };

export function loadRegistry(registryPath: string, cwd = process.cwd()): LoadedRegistry {
  const resolved = isAbsolute(registryPath) ? registryPath : resolve(cwd, registryPath);

  try {
    const registryFile = parseRegistryFile(JSON.parse(readFileSync(resolved, "utf8")) as unknown);
    const validation = validateRegistryFile(registryFile);

    if (!validation.valid) {
      return { ok: false, error: validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("\n"), path: resolved };
    }

    return { ok: true, registryFile, toolRegistry: createLocalRegistry(registryFile), path: resolved };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "unknown registry load error", path: resolved };
  }
}

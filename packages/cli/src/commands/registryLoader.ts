import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { createLocalRegistry, parseRegistryFile, validateRegistryFile, type LocalToolRegistry, type RegistryFile } from "@agentshield/registry";

export type LoadedRegistry =
  | { ok: true; registryFile: RegistryFile; toolRegistry: LocalToolRegistry; path: string }
  | { ok: false; error: string };

export function loadRegistry(path: string, cwd: string): LoadedRegistry {
  const resolved = isAbsolute(path) ? path : resolve(cwd, path);

  try {
    const registryFile = parseRegistryFile(JSON.parse(readFileSync(resolved, "utf8")));
    const validation = validateRegistryFile(registryFile);

    if (!validation.valid) {
      return {
        ok: false,
        error: validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("\n")
      };
    }

    return {
      ok: true,
      registryFile,
      toolRegistry: createLocalRegistry(registryFile),
      path: resolved
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown registry read error";
    return { ok: false, error: message };
  }
}

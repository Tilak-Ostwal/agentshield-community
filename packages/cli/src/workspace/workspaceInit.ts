import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";

import { renderWorkspaceConfigJson } from "@agentshield/core";

export interface WorkspaceInitResult {
  ok: boolean;
  path?: string;
  error?: string;
}

function isInsideWorkspace(rootDir: string, targetPath: string): boolean {
  const relativePath = relative(rootDir, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}

export function initWorkspaceConfig(outPath = "agentshield.workspace.json", options: { cwd?: string; force?: boolean } = {}): WorkspaceInitResult {
  const cwd = resolve(options.cwd ?? process.cwd());
  const resolvedPath = isAbsolute(outPath) ? resolve(outPath) : resolve(cwd, outPath);

  if (!isInsideWorkspace(cwd, resolvedPath)) {
    return {
      ok: false,
      error: "workspace config output path must be inside the current workspace"
    };
  }

  if (existsSync(resolvedPath) && options.force !== true) {
    return {
      ok: false,
      error: `refusing to overwrite existing workspace config: ${outPath}`
    };
  }

  try {
    mkdirSync(dirname(resolvedPath), { recursive: true });
    writeFileSync(resolvedPath, renderWorkspaceConfigJson(), { encoding: "utf8", flag: options.force === true ? "w" : "wx" });
    return { ok: true, path: outPath };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown write error";
    return { ok: false, error: message };
  }
}

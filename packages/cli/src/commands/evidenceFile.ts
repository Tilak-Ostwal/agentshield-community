import { writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import type { EvidenceBundle } from "@agentshield/core";

export function writeEvidenceFile(input: {
  evidencePath: string;
  bundle: EvidenceBundle;
  cwd: string;
  force: boolean;
}): { ok: true } | { ok: false; error: string } {
  const resolvedPath = isAbsolute(input.evidencePath)
    ? input.evidencePath
    : resolve(input.cwd, input.evidencePath);

  try {
    writeFileSync(resolvedPath, JSON.stringify(input.bundle, null, 2), {
      encoding: "utf8",
      flag: input.force ? "w" : "wx"
    });
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown write error";
    return { ok: false, error: message };
  }
}

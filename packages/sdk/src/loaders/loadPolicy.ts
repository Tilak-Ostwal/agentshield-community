import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { compilePolicyV2, parsePolicy } from "@agentshield/core";

export type LoadedPolicy =
  | { ok: true; policy: unknown; path: string }
  | { ok: false; error: string; path: string };

export function loadPolicy(policyPath: string, cwd = process.cwd()): LoadedPolicy {
  const resolved = isAbsolute(policyPath) ? policyPath : resolve(cwd, policyPath);

  try {
    const policy = JSON.parse(readFileSync(resolved, "utf8")) as unknown;
    if (typeof policy === "object" && policy !== null && (policy as { version?: unknown }).version === 2) {
      const compiled = compilePolicyV2(policy);
      if (!compiled.ok || compiled.policy === undefined) {
        return { ok: false, error: compiled.diagnostics.map((diagnostic) => diagnostic.message).join("\n"), path: resolved };
      }
      return { ok: true, policy, path: resolved };
    }

    const parsed = parsePolicy(policy);
    if (!parsed.ok) {
      return { ok: false, error: parsed.error ?? "invalid policy", path: resolved };
    }

    return { ok: true, policy: parsed.policy, path: resolved };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "unknown policy load error", path: resolved };
  }
}

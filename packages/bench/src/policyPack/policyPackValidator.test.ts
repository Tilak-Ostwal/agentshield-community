import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getPolicyPack } from "./builtInPolicyPacks.js";
import { validatePolicyPack, validatePolicyPackFile } from "./policyPackValidator.js";

describe("policy pack validator", () => {
  it("validates built-in pack", () => {
    expect(validatePolicyPack(getPolicyPack("strict-mcp-local"))).toMatchObject({ ok: true });
  });

  it("validate external pack file works", () => {
    const directory = mkdtempSync(join(tmpdir(), "agentshield-policy-pack-"));
    const packPath = join(directory, "strict.pack.json");
    writeFileSync(packPath, JSON.stringify(getPolicyPack("strict-mcp-local"), null, 2));

    expect(validatePolicyPackFile(packPath)).toMatchObject({ ok: true });
  });

  it("dev warning mode is not production-ready", () => {
    const result = validatePolicyPack(getPolicyPack("dev-warning-mode"));
    expect(result.findings).toContainEqual(expect.objectContaining({ id: "policy-pack.dev-warning", severity: "medium" }));
  });
});

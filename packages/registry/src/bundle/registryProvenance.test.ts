import { describe, expect, it } from "vitest";
import { generateRegistryProvenance } from "./registryProvenance.js";

describe("registryProvenance", () => {
  it("generates correct provenance", () => {
    const prov = generateRegistryProvenance({ version: 1, name: "n", generatedAt: "t", entries: [] }, { source: "manual", sourceId: "id" });
    expect(prov.toolCount).toBe(0);
    expect(prov.registryHash).toBeDefined();
  });
});

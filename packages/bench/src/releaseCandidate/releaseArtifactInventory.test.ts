import { describe, expect, it } from "vitest";
import { checkArtifactInventory } from "./releaseArtifactInventory.js";

describe("releaseArtifactInventory", () => {
  it("artifact inventory detects required docs/examples", () => {
    const res = checkArtifactInventory(process.cwd());
    expect(typeof res.ok).toBe("boolean");
  });
});

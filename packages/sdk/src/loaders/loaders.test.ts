import { describe, expect, it } from "vitest";

import { loadPolicy } from "./loadPolicy.js";
import { loadRegistry } from "./loadRegistry.js";

describe("SDK loaders", () => {
  it("loads strict v2 policy", () => {
    expect(loadPolicy("examples/policies/strict.policy.json", "../..")).toMatchObject({ ok: true });
  });

  it("loads local registry", () => {
    expect(loadRegistry("examples/registry/agentshield.registry.json", "../..")).toMatchObject({ ok: true });
  });
});

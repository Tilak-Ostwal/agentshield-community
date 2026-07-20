import { describe, expect, it } from "vitest";

import { getWorkspaceProfileDefinition, isWorkspaceProfile, workspaceProfiles } from "./workspaceProfile.js";

describe("workspace profiles", () => {
  it("defines supported profiles", () => {
    expect(workspaceProfiles).toEqual(["strict", "balanced", "dev", "enterprise"]);
    expect(isWorkspaceProfile("strict")).toBe(true);
    expect(isWorkspaceProfile("unknown")).toBe(false);
  });

  it("marks dev profile as high risk", () => {
    expect(getWorkspaceProfileDefinition("dev")).toMatchObject({ risk: "high" });
  });
});

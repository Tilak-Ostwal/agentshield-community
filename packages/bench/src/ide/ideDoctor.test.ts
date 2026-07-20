import { describe, it, expect } from "vitest";
import { runIdeDoctor } from "./ideDoctor.js";

describe("ideDoctor", () => {
  it("passes valid config", () => {
    const res = runIdeDoctor({ version: 1, ide: "vscode", workspaceConfigPath: "foo.json" });
    expect(res.valid).toBe(true);
    expect(res.warnings.length).toBe(0);
  });
  it("warns on missing workspace config", () => {
    const res = runIdeDoctor({ version: 1, ide: "vscode" });
    expect(res.warnings).toContain("Missing workspace config path in IDE config");
  });
});

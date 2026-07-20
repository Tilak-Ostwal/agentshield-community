import { describe, expect, it } from "vitest";

import { getCliName, runCli } from "./index.js";

describe("cli skeleton", () => {
  it("exposes the CLI name", () => {
    expect(getCliName()).toBe("agentshield");
  });

  it("shows help by default", () => {
    expect(runCli([]).stdout).toContain("Usage:");
  });

  it("shows help command output", () => {
    expect(runCli(["help"]).stdout).toContain("agentshield init");
  });
});

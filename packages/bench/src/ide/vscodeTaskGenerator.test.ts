import { describe, it, expect } from "vitest";
import { checkCommandSafety, generateVscodeTasks } from "./vscodeTaskGenerator.js";

describe("vscodeTaskGenerator", () => {
  it("rejects npm publish", () => expect(checkCommandSafety("npm publish")).toBe(false));
  it("rejects npm install", () => expect(checkCommandSafety("npm install foo")).toBe(false));
  it("rejects pnpm add", () => expect(checkCommandSafety("pnpm add foo")).toBe(false));
  it("rejects git push", () => expect(checkCommandSafety("git push origin main")).toBe(false));
  it("rejects git tag", () => expect(checkCommandSafety("git tag v1")).toBe(false));
  it("rejects curl/irm/iwr/Invoke-WebRequest", () => {
    expect(checkCommandSafety("curl http://test")).toBe(false);
    expect(checkCommandSafety("irm http://test")).toBe(false);
    expect(checkCommandSafety("iwr http://test")).toBe(false);
    expect(checkCommandSafety("Invoke-WebRequest http://test")).toBe(false);
  });
  it("allows known local pnpm cli commands", () => expect(checkCommandSafety("pnpm cli -- doctor")).toBe(true));
  
  it("generates expected tasks deterministically", () => {
    const config = { version: 1 as const, ide: "vscode" as const, commands: { "doctor": "pnpm cli -- doctor", "test": "pnpm cli -- test" } };
    const tasks = generateVscodeTasks(config);
    expect(tasks.tasks!.length).toBe(2);
    expect(tasks.tasks![0]!.label).toBe("AgentShield: doctor");
  });

  it("refuses unsafe commands during generation", () => {
    const config = { version: 1 as const, ide: "vscode" as const, commands: { "bad": "npm publish" } };
    expect(() => generateVscodeTasks(config)).toThrow("Unsafe command detected");
  });
});

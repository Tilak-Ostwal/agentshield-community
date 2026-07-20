import { describe, expect, it } from "vitest";

import { attackScenarioSchema } from "../scenario/attackScenario.js";
import { assertGeneratedScenarioSafety, generateAllRedteamScenarios, generateRedteamScenarios } from "./redteamGenerator.js";

describe("redteam generator", () => {
  it("is deterministic", () => {
    expect(generateRedteamScenarios("prompt-injection-secret-exfiltration")).toEqual(generateRedteamScenarios("prompt-injection-secret-exfiltration"));
  });

  it("validates generated scenarios", () => {
    for (const scenario of generateAllRedteamScenarios(1)) {
      expect(attackScenarioSchema.safeParse(scenario).success).toBe(true);
    }
  });

  it("generated scenarios contain no raw real secrets", () => {
    const serialized = JSON.stringify(generateAllRedteamScenarios(1));
    expect(serialized).not.toContain("AKIA");
    expect(serialized).not.toContain("ghp_");
  });

  it("generated scenarios use attacker.invalid for fake network sinks", () => {
    const serialized = JSON.stringify(generateAllRedteamScenarios(1));
    expect(serialized).toContain("attacker.invalid");
    expect(() => assertGeneratedScenarioSafety(generateAllRedteamScenarios(1))).not.toThrow();
  });
});

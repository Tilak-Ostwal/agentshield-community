import { describe, expect, it } from "vitest";

import { defineScenario, loadAttackScenarios } from "./attackScenario.js";

const action = {
  actionId: "action_01",
  timestamp: "2026-06-25T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "unknown.tool"
};

describe("attack scenario", () => {
  it("validates a scenario", () => {
    const scenario = defineScenario({
      id: "unknown-tool",
      name: "Unknown Tool",
      category: "tool_abuse",
      severity: "high",
      description: "Unknown tools should deny.",
      actions: [action],
      expected: {
        finalDecision: "deny"
      }
    });

    expect(scenario.id).toBe("unknown-tool");
  });

  it("loads fixtures through the schema", () => {
    expect(() => loadAttackScenarios([{ id: "" }])).toThrow();
  });
});

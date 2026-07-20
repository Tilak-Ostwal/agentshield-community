import { describe, expect, it } from "vitest";

import { defineScenario, runBenchCommand, runDefaultBenchmark } from "./index.js";

describe("benchmark skeleton", () => {
  it("defines attack scenarios", () => {
    expect(
      defineScenario({
        id: "unknown-tool",
        name: "Unknown Tool",
        category: "policy_bypass",
        severity: "high",
        description: "Unknown tools should deny.",
        actions: [
          {
            actionId: "action_01",
            timestamp: "2026-06-25T00:00:00.000Z",
            actionType: "tool_call",
            toolName: "unknown.tool"
          }
        ],
        expected: {
          finalDecision: "deny"
        }
      })
    ).toMatchObject({ expected: { finalDecision: "deny" } });
  });

  it("runs the default benchmark", () => {
    expect(runDefaultBenchmark()).toMatchObject({
      total: 82,
      failed: 0
    });
  });

  it("exposes a CLI-accessible bench command stub", () => {
    expect(JSON.parse(runBenchCommand("json"))).toMatchObject({
      total: 82
    });
  });

  it("benchmark includes at least 40 scenarios", () => {
    expect(runDefaultBenchmark().total).toBeGreaterThanOrEqual(40);
  });
});

import { describe, expect, it } from "vitest";
import { AgentRoleSchema, AgentTrustLevelSchema, isHighRiskRole } from "./agentRole.js";

describe("agentRole", () => {
  it("validates roles correctly", () => {
    expect(AgentRoleSchema.safeParse("planner").success).toBe(true);
    expect(AgentRoleSchema.safeParse("invalid").success).toBe(false);
  });

  it("validates trust levels correctly", () => {
    expect(AgentTrustLevelSchema.safeParse("trusted").success).toBe(true);
    expect(AgentTrustLevelSchema.safeParse("invalid").success).toBe(false);
  });

  it("identifies high risk roles", () => {
    expect(isHighRiskRole("executor")).toBe(true);
    expect(isHighRiskRole("worker")).toBe(true);
    expect(isHighRiskRole("planner")).toBe(false);
  });
});

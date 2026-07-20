import { describe, expect, it } from "vitest";
import { generateGapClosurePlan } from "./gapClosurePlanner.js";

describe("gapClosurePlanner", () => {
  it("gap closure planner is deterministic", () => {
    const plan1 = generateGapClosurePlan([]);
    const plan2 = generateGapClosurePlan([]);
    expect(plan1).toEqual(plan2);
  });

  it("gap closure plan includes production signing gap", () => {
    const plan = generateGapClosurePlan([]);
    const signingGap = plan.find(g => g.gapId === "gap-production-signing");
    expect(signingGap).toBeDefined();
    expect(signingGap?.requiredForV1).toBe(false);
  });

  it("gap closure plan includes hosted dashboard/SaaS as optional/future, not v1 blocker", () => {
    const plan = generateGapClosurePlan([]);
    const dashGap = plan.find(g => g.gapId === "gap-hosted-dashboard");
    expect(dashGap).toBeDefined();
    expect(dashGap?.requiredForV1).toBe(false);
  });

  it("gap closure plan includes production OS sandbox guarantee as future enterprise work", () => {
    const plan = generateGapClosurePlan([]);
    const sandboxGap = plan.find(g => g.gapId === "gap-production-os-sandbox");
    expect(sandboxGap).toBeDefined();
    expect(sandboxGap?.requiredForEnterpriseProduction).toBe(true);
    expect(sandboxGap?.requiredForV1).toBe(false);
  });
});

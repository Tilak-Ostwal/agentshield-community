import { describe, expect, it } from "vitest";

import { classifyCapabilityRisk } from "./capabilityRisk.js";

describe("capability risk", () => {
  it("classifies code execution as critical", () => {
    expect(classifyCapabilityRisk(["shell.exec", "code_execution"]).riskLevel).toBe("critical");
  });

  it("classifies secret plus network write as critical", () => {
    expect(classifyCapabilityRisk(["secret.read", "network.write"]).riskLevel).toBe("critical");
  });

  it("classifies filesystem write as medium", () => {
    expect(classifyCapabilityRisk(["filesystem.write"]).riskLevel).toBe("medium");
  });
});

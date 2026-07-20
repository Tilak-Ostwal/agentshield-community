import { describe, expect, it } from "vitest";
import { classifyIncident } from "./incidentClassifier.js";

describe("incidentClassifier", () => {
  it("classifier detects prompt injection chain", () => {
    expect(classifyIncident([{ toolName: "prompt.read" }, { toolName: "execute" }])).toBe("prompt_injection");
  });
  it("classifier detects write-then-execute chain", () => {
    expect(classifyIncident([{ toolName: "fs.write" }, { toolName: "exec" }])).toBe("write_then_execute");
  });
  it("classifier detects registry drift", () => {
    expect(classifyIncident([{ toolName: "registry.modify" }])).toBe("registry_drift");
  });
  it("classifier detects sandbox violation", () => {
    expect(classifyIncident([{ toolName: "sandbox.escape" }])).toBe("sandbox_violation");
  });
  it("classifier detects approval bypass", () => {
    expect(classifyIncident([{ eventType: "log", data: "approval bypass" }])).toBe("approval_bypass");
  });
  it("classifier detects adapter failure", () => {
    expect(classifyIncident([{ eventType: "adapter_error" }])).toBe("adapter_failure");
  });
  it("classifier detects evidence tamper", () => {
    expect(classifyIncident([{ eventType: "tamper" }])).toBe("evidence_tamper");
  });
});

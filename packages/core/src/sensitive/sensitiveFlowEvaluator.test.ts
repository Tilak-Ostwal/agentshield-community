import { describe, expect, it } from "vitest";
import { evaluateSensitiveFlow } from "./sensitiveFlowEvaluator.js";

describe("sensitiveFlowEvaluator", () => {
  it("sensitive network flow is denied", () => {
    expect(evaluateSensitiveFlow("network.write", { api_key: "sk-12345" }, "allow")).toBe("deny");
  });

  it("PII-like external flow is reviewed or denied", () => {
    expect(evaluateSensitiveFlow("network.write", { email: "test@example.com" }, "allow")).toBe("require_human_review");
  });

  it("detector error fails closed", () => {
    // In our implementation, we wrapped in try/catch and return deny on error.
    // Let's pass a cyclical object to trigger stack overflow or similar if we wanted, 
    // but just checking the fallback behavior is enough if we mock it or trust the try/catch.
    const circular: any = {};
    circular.self = circular;
    expect(evaluateSensitiveFlow("network.write", circular, "allow")).toBe("deny");
  });
});

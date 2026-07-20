import { describe, it, expect } from "vitest";
import { validateClaimsBoundary } from "./securityClaimsBoundary.js";

describe("securityClaimsBoundary", () => {
  it("claims boundary detects forbidden SOC2 claim", () => {
    const res = validateClaimsBoundary({
      allowedClaims: ["We are SOC2 certified"],
      forbiddenClaims: []
    });
    expect(res.valid).toBe(false);
  });

  it("claims boundary detects ISO/HIPAA/PCI claim", () => {
    const res = validateClaimsBoundary({
      allowedClaims: ["ISO certified", "HIPAA compliant", "PCI compliant"],
      forbiddenClaims: []
    });
    expect(res.valid).toBe(false);
  });

  it("claims boundary detects unbreakable/guaranteed secure claim", () => {
    const res = validateClaimsBoundary({
      allowedClaims: ["unbreakable system", "guaranteed production secure"],
      forbiddenClaims: []
    });
    expect(res.valid).toBe(false);
  });

  it("claims boundary allows local deterministic verification claim", () => {
    const res = validateClaimsBoundary({
      allowedClaims: ["local deterministic security verification"],
      forbiddenClaims: []
    });
    expect(res.valid).toBe(true);
  });
});

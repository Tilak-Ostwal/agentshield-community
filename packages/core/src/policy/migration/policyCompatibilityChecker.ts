import { PolicyVersionCompatibility } from "./policyVersionCompatibility.js";

export function checkPolicyCompatibility(input: unknown): PolicyVersionCompatibility {
  if (typeof input !== "object" || input === null) {
    return {
      fromVersion: 0,
      toVersion: 2,
      status: "incompatible",
      warnings: [],
      breakingChanges: ["Invalid policy shape."],
      recommendedAction: "Create a new policy from scratch."
    };
  }

  const obj = input as Record<string, unknown>;
  const version = obj.version;

  if (version === 2) {
    return {
      fromVersion: 2,
      toVersion: 2,
      status: "compatible",
      warnings: [],
      breakingChanges: [],
      recommendedAction: "None required."
    };
  }

  if (version === 1) {
    return {
      fromVersion: 1,
      toVersion: 2,
      status: "migration_required",
      warnings: ["Policy v1 will be deprecated soon."],
      breakingChanges: ["Rules mapping logic changed from 'decision' to 'effect', explicit priorities added."],
      recommendedAction: "Run agentshield policy migrate to convert to v2."
    };
  }

  return {
    fromVersion: typeof version === "number" ? version : 0,
    toVersion: 2,
    status: "incompatible",
    warnings: [],
    breakingChanges: ["Unsupported policy version."],
    recommendedAction: "Check documentation for supported policy formats."
  };
}

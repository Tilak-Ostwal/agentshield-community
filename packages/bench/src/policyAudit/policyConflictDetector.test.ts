import { describe, expect, it } from "vitest";

import type { PolicyV2 } from "@agentshield/core";

import { detectPolicyConflicts } from "./policyConflictDetector.js";

describe("policyConflictDetector", () => {
  it("detects duplicate rule IDs", () => {
    const policy: PolicyV2 = {
      version: 2,
      name: "duplicate",
      defaultDecision: "deny",
      mode: "strict",
      rules: [
        { id: "same", effect: "deny", priority: 10, match: { toolName: "shell.exec" } },
        { id: "same", effect: "allow", priority: 1, match: { toolName: "filesystem.read" } }
      ]
    };
    expect(detectPolicyConflicts(policy).some((finding) => finding.id === "conflict-duplicate-rule-id-same")).toBe(true);
  });

  it("detects exact tool conflicts", () => {
    const policy: PolicyV2 = {
      version: 2,
      name: "conflict",
      defaultDecision: "deny",
      mode: "strict",
      rules: [
        { id: "deny-shell", effect: "deny", priority: 10, match: { toolName: "shell.exec" } },
        { id: "allow-shell", effect: "allow", priority: 1, match: { toolName: "shell.exec" } }
      ]
    };
    expect(detectPolicyConflicts(policy).some((finding) => finding.category === "conflicting_rule")).toBe(true);
  });

  it("flags wildcard allow", () => {
    const policy: PolicyV2 = {
      version: 2,
      name: "wildcard",
      defaultDecision: "deny",
      mode: "strict",
      rules: [{ id: "allow-wildcard", effect: "allow", priority: 1, match: { toolNamePattern: "*" } }]
    };
    expect(detectPolicyConflicts(policy).some((finding) => finding.id === "conflict-wildcard-allow-allow-wildcard")).toBe(true);
  });
});

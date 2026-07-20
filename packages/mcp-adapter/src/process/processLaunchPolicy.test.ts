import { describe, expect, it } from "vitest";

import { findAllowlistedCommand, parseProcessLaunchPolicy, processLaunchPolicySchema } from "./processLaunchPolicy.js";

function validPolicy() {
  return {
    version: 1,
    mode: "controlled_stdio",
    allowlistedCommands: [
      {
        id: "mock",
        command: process.execPath,
        args: ["--version"],
        envAllowlist: ["AGENTSHIELD_TEST"],
        maxRuntimeMs: 1000,
        maxMessageBytes: 1024,
        maxStderrBytes: 128,
        reason: "test mock command"
      }
    ],
    defaultTimeoutMs: 1000,
    denyShell: true,
    denyNetworkByDefault: true
  };
}

describe("process launch policy", () => {
  it("parses a valid controlled stdio policy", () => {
    expect(parseProcessLaunchPolicy(validPolicy()).mode).toBe("controlled_stdio");
    expect(findAllowlistedCommand(parseProcessLaunchPolicy(validPolicy()), "mock")?.id).toBe("mock");
  });

  it("fails closed for invalid shell policy", () => {
    expect(processLaunchPolicySchema.safeParse({ ...validPolicy(), denyShell: false }).success).toBe(false);
  });

  it("rejects arbitrary commands that are not allowlisted", () => {
    expect(findAllowlistedCommand(parseProcessLaunchPolicy(validPolicy()), "not-allowed")).toBeUndefined();
  });
});

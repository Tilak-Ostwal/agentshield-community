import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import type { CliResult } from "../cli.js";

const POLICY_FILE_NAME = "agentshield.policy.json";

const SAMPLE_POLICY = {
  version: 1,
  defaultDecision: "deny",
  rules: [
    {
      id: "allow-filesystem-read",
      match: {
        actionType: "tool_call",
        toolName: "filesystem.read"
      },
      decision: "allow"
    }
  ]
};

export function getSamplePolicyJson(): string {
  return `${JSON.stringify(SAMPLE_POLICY, null, 2)}\n`;
}

export function runInitCommand(args: string[], cwd = process.cwd()): CliResult {
  const force = args.includes("--force");
  const policyPath = resolve(cwd, POLICY_FILE_NAME);

  try {
    writeFileSync(policyPath, getSamplePolicyJson(), { encoding: "utf8", flag: force ? "w" : "wx" });

    return {
      exitCode: 0,
      stdout: `created ${POLICY_FILE_NAME}`,
      stderr: ""
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown write error";

    return {
      exitCode: 1,
      stdout: "",
      stderr: `failed to create ${POLICY_FILE_NAME}: ${message}`
    };
  }
}

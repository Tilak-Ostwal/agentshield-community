import { readFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { verifyEvidenceBundle, type EvidenceBundle } from "@agentshield/core";

import type { CliResult } from "../cli.js";

export function runVerifyTraceCommand(args: string[], cwd = process.cwd()): CliResult {
  const tracePath = args[0];

  if (tracePath === undefined || tracePath.startsWith("--")) {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "verify-trace requires an evidence bundle path"
    };
  }

  const resolvedPath = isAbsolute(tracePath) ? tracePath : resolve(cwd, tracePath);

  try {
    const bundle = JSON.parse(readFileSync(resolvedPath, "utf8")) as EvidenceBundle;
    const verification = verifyEvidenceBundle(bundle);

    if (!verification.valid) {
      return {
        exitCode: 1,
        stdout: "",
        stderr: `trace invalid: ${verification.errors.join("; ")}`
      };
    }

    return {
      exitCode: 0,
      stdout: `trace valid: ${verification.rootHash ?? "empty"}`,
      stderr: ""
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown verification error";

    return {
      exitCode: 1,
      stdout: "",
      stderr: `trace invalid: ${message}`
    };
  }
}

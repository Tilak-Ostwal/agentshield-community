import type { CliResult } from "../cli.js";

export const CLI_VERSION = "0.0.0";

export function runVersionCommand(): CliResult {
  return {
    exitCode: 0,
    stdout: CLI_VERSION,
    stderr: ""
  };
}

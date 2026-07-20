import type { CliResult } from "../cli.js";
import { createGithubActionCommandPlanFromRaw, formatGithubActionPlanText } from "../actions/githubActionRunner.js";
import type { GithubActionRawInputs } from "../actions/githubActionInputs.js";

type ActionDryRunFormat = "text" | "json";

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function parseFormat(args: string[]): ActionDryRunFormat {
  const value = argValue(args, "--format");
  if (value === undefined) return "text";
  if (value === "json") return "json";
  throw new Error("action dry-run --format must be json");
}

function rawInputsFromArgs(args: string[]): GithubActionRawInputs {
  const mappings: Array<[string, string]> = [
    ["profile", "--profile"],
    ["policy", "--policy"],
    ["registry", "--registry"],
    ["sarif", "--sarif"],
    ["evidence", "--evidence"],
    ["markdown", "--markdown"],
    ["fail-on-critical", "--fail-on-critical"],
    ["minimum-score", "--minimum-score"]
  ];
  const raw: GithubActionRawInputs = {};

  for (const [inputName, flag] of mappings) {
    const value = argValue(args, flag);
    if (value !== undefined) raw[inputName] = value;
  }

  return raw;
}

export function runActionCommand(args: string[]): CliResult {
  const [subcommand, ...subcommandArgs] = args;
  if (subcommand !== "dry-run") {
    return {
      exitCode: 1,
      stdout: "",
      stderr: "action command must be dry-run"
    };
  }

  const format = parseFormat(subcommandArgs);
  const rawInputs = { ...process.env, ...rawInputsFromArgs(subcommandArgs) };
  const plan = createGithubActionCommandPlanFromRaw(rawInputs);

  return {
    exitCode: 0,
    stdout: format === "json" ? JSON.stringify(plan, null, 2) : formatGithubActionPlanText(plan),
    stderr: ""
  };
}

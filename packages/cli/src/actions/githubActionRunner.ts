import { runBenchCommand } from "../commands/benchCommand.js";
import { runCheckCommand } from "../commands/checkCommand.js";
import type { CliResult } from "../cli.js";
import { parseGithubActionInputs, type GithubActionInputs, type GithubActionRawInputs } from "./githubActionInputs.js";

export interface GithubActionCommandPlan {
  commands: string[][];
  inputs: GithubActionInputs;
  summary: string;
}

function benchCommandArgs(inputs: GithubActionInputs): string[] {
  const args = ["bench", "--ci", "--profile", inputs.profile, "--fail-on-critical", String(inputs.failOnCritical), "--minimum-score", String(inputs.minimumScore)];

  if (inputs.registry !== undefined) args.push("--registry", inputs.registry);
  if (inputs.sarif !== undefined) args.push("--sarif", inputs.sarif);
  if (inputs.evidence !== undefined) args.push("--evidence", inputs.evidence);
  if (inputs.markdown !== undefined) args.push("--format", "markdown", "--out", inputs.markdown);

  return args;
}

function containsSecret(command: string[]): boolean {
  const serialized = command.join(" ");
  const fakeSecretSentinel = ["sk", "test", "REDACT", "ME"].join("-");
  return serialized.includes(fakeSecretSentinel) || /\b(?:AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{36}|Bearer\s+[A-Za-z0-9._-]+)\b/.test(serialized);
}

export function createGithubActionCommandPlan(inputs: GithubActionInputs): GithubActionCommandPlan {
  const commands: string[][] = [];
  if (inputs.policy !== undefined) commands.push(["check", inputs.policy]);
  commands.push(benchCommandArgs(inputs));

  if (commands.some(containsSecret)) {
    throw new Error("action command plan must not include secrets");
  }

  return {
    commands,
    inputs,
    summary: `AgentShield Action plan: ${commands.map((command) => `agentshield ${command.join(" ")}`).join(" && ")}`
  };
}

export function createGithubActionCommandPlanFromRaw(raw: GithubActionRawInputs = process.env): GithubActionCommandPlan {
  return createGithubActionCommandPlan(parseGithubActionInputs(raw));
}

export function formatGithubActionPlanText(plan: GithubActionCommandPlan): string {
  return ["AgentShield GitHub Action dry run", "", ...plan.commands.map((command) => `agentshield ${command.join(" ")}`)].join("\n");
}

export function runGithubActionPlan(plan: GithubActionCommandPlan, cwd = process.cwd()): CliResult {
  for (const command of plan.commands) {
    const [name, ...args] = command;
    const result = name === "check" ? runCheckCommand(args, cwd) : name === "bench" ? runBenchCommand(args, cwd) : { exitCode: 1, stdout: "", stderr: `unsupported action command: ${name}` };
    if (result.exitCode !== 0) return result;
  }

  return {
    exitCode: 0,
    stdout: "AgentShield GitHub Action completed",
    stderr: ""
  };
}

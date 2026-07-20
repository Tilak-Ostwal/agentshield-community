import { runBenchCommand } from "./commands/benchCommand.js";
import { runAdapterCommand } from "./commands/adapterCommand.js";
import { runAdapterConformanceCommand } from "./commands/adapterConformanceCommand.js";
import { runCheckCommand } from "./commands/checkCommand.js";
import { runDemoCommand, runDemoRunCommand } from "./commands/demoCommand.js";
import { runDoctorCommand } from "./commands/doctorCommand.js";
import { runExplainGraphCommand } from "./commands/explainGraphCommand.js";
import { runIncidentCommand } from "./commands/incidentCommand.js";
import { runRecipeCommand } from "./commands/recipeCommand.js";
import { runExplainPolicyCommand } from "./commands/explainPolicyCommand.js";
import { runFrameworkAdapterCommand } from "./frameworkAdapter/frameworkAdapterCommand.js";
import { runDocsCommand } from "./docsNavigator/docsCommand.js";
import { runMultiAgentCommand } from "./multiAgent/multiAgentCommand.js";
import { runIdeCommand } from "./ide/ideCommand.js";
import { runLeaderboardCommand } from "./leaderboard/leaderboardCommand.js";
import { runInitCommand } from "./commands/initCommand.js";
import { runMcpDemoCommand } from "./commands/mcpDemoCommand.js";
import { runMcpConformanceCommand } from "./commands/mcpConformanceCommand.js";
import { runMcpProxyDemoCommand } from "./commands/mcpProxyDemoCommand.js";
import { runMcpStdioDemoCommand } from "./commands/mcpStdioDemoCommand.js";
import { runSdkDemoCommand } from "./commands/sdkCommand.js";
import { runExecutionCommand, runExecutionDemoCommand, runExecutionDryRunCommand } from "./commands/executionCommand.js";
import { runSandboxCommand, runSandboxDemoCommand } from "./commands/sandboxCommand.js";
import {
  runApprovalApproveCommand,
  runApprovalCommand,
  runApprovalCreateCommand,
  runApprovalDemoCommand,
  runApprovalVerifyCommand
} from "./commands/approvalCommand.js";
import { runPolicyCommand } from "./commands/policyCommand.js";
import { runPolicyBundleCommand } from "./commands/policyBundleCommand.js";
import { runRegistryBundleCommand } from "./commands/registryBundleCommand.js";
import { runActionCommand } from "./commands/actionCommand.js";
import { runRegistryCommand } from "./commands/registryCommand.js";
import { runProviderAdapterCommand } from "./commands/providerAdapterCommand.js";
import { runPerfCommand } from "./commands/perfCommand.js";
import { runPolicyAuditCommand } from "./commands/policyAuditCommand.js";
import { runSensitiveCommand } from "./commands/sensitiveCommand.js";
import { runWorkspaceCommand } from "./workspace/workspaceCommands.js";
import { runPolicyPackCommand } from "./commands/policyPackCommand.js";
import { runPolicyTemplateCommand } from "./commands/policyTemplateCommand.js";
import { runPolicyTestCommand } from "./commands/policyTestCommand.js";
import { runVerifyTraceCommand } from "./commands/verifyTraceCommand.js";
import { runVersionCommand } from "./commands/versionCommand.js";
import { runSecurityFuzzCommand } from "./commands/securityFuzzCommand.js";

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export interface CliOptions {
  cwd?: string;
}

export function help(): string {
  return [
    "AgentShield Veritas local developer CLI",
    "",
    "Usage:",
    "  agentshield <command> [options]",
    "",
    "Commands:",
    "  adapter demo [--format json]          Run custom adapter plugin API demo",
    "  adapter-conformance <suite.json> [--format text|json|markdown] [--out file] Run adapter safety conformance harness",
    "  init [--force]                         Create agentshield.policy.json",
    "  bench [--ci] [--registry file] [--profile strict|balanced|audit|dev] [--format json|html|markdown|matrix] [--out file] [--evidence file] [--sarif file] Run local attack benchmark",
    "  registry validate|inspect|attest <registry.json> [--tool name] Validate or inspect a local tool registry",
    "  check <policy.json>                    Validate a policy JSON file",
    "  explain-policy <policy.json>           Explain a policy v2 decision using a safe sample action",
    "  demo-run [--format json|html] [--out file] [--evidence file] Run safe local demo scenarios",
    "  doctor [--format json]                Run lightweight local release-candidate health checks",
    "  mcp-demo [--format json]              Run safe MCP adapter prototype demo",
    "  mcp-conformance [--format json|markdown] [--out file] [--policy file] [--registry file] Run MCP compatibility harness",
    "  mcp-proxy-demo [--format json] [--evidence file] [--policy file] [--registry file] Run safe MCP stdio proxy skeleton demo",
    "  mcp-stdio-demo [--format json] [--policy file] [--evidence file] Run controlled MCP stdio mock server demo",
    "  approval create|approve|verify|demo      Create, sign, verify, or demo local approval tokens",
    "  execution demo|dry-run                Run safe execution broker demo",
    "  sandbox demo                         Run sandbox profile demo",
    "  sdk demo [--format json]             Run TypeScript SDK integration demo",
    "  action dry-run [--format json]       Show the local GitHub Action command plan",
    "  perf [--format json|markdown] [--budget strict|balanced|dev] [--out file] Run local performance budget checks",
    "  policy-audit <policy.json> [--format json|markdown] [--registry file] [--out file] Audit policy coverage and conflicts",
    "  policy-pack list|show|init|validate|audit Manage curated policy packs",
    "  policy-template list|show|init       List, inspect, or generate safe policy templates",
    "  agentshield policy-test examples/policy-tests/strict.policy-test.json [--format json|markdown] [--out file] [--snapshot file] Run local policy regression tests",
    "  agentshield policy-bundle create|inspect|verify Create, inspect, or verify signed policy bundles",
    "  policy audit <file> [--format json]            Audit a policy against invariant checks",
    "  policy compat <file> [--format json]           Check policy version compatibility",
    "  policy migrate <file> --out <file> [--force]   Migrate legacy policies to current version",
    "  agentshield corpus validate|coverage|snapshot|report Run corpus tools",
    "  agentshield perf-baseline capture|compare|report Performance baseline tools",
    "  agentshield release-check [--format json]        Audit local package release readiness",
    "  agentshield release-candidate check|report|notes Run beta release candidate gate",
    "  agentshield provider-adapter normalize|demo      Provider-neutral LLM adapter tests",
    "  agentshield framework-adapter wrap|run-demo      Framework-neutral workflow agent checks",
    "  agentshield multi-agent validate|run-demo        Multi-agent session guard tests",
    "  redteam list-templates|generate|coverage Generate deterministic local red-team scenarios",
    "  agentshield recipe list|show|validate|doctor Enterprise integration recipes",
    "  workspace init|validate|doctor       Manage local AgentShield workspace config",
    "  agentshield ide vscode init|doctor|panel Local IDE security panel/tasks",
    "  agentshield incident report|verify    Generate or verify deterministic incident reports",
    "  agentshield explain-graph <attack-graph.json> [--format json|markdown] [--out file] Explain an attack graph",
    "  agentshield sensitive scan|verify-report      Scan inputs or verify reports for sensitive data",
    "  verify-trace <trace.json>             Verify a tamper-evident evidence bundle",
    "  version                                Print CLI version",
    "  demo                                   Explain current protections",
    "  help                                   Show this help",
    "",
    "Examples:",
    "  agentshield adapter demo",
    "  agentshield adapter demo --format json",
    "  agentshield adapter-conformance examples/custom-adapter/adapter-conformance.json",
    "  agentshield adapter-conformance examples/custom-adapter/adapter-conformance.json --format json",
    "  agentshield adapter-conformance examples/custom-adapter/adapter-conformance.json --format markdown",
    "  agentshield adapter-conformance examples/custom-adapter/adapter-conformance.json --format markdown --out adapter-conformance-report.md",
    "  agentshield init",
    "  agentshield check agentshield.policy.json",
    "  agentshield explain-policy agentshield.policy.json",
    "  agentshield bench --format html --out report.html",
    "  agentshield bench --profile strict --format json",
    "  agentshield bench --format markdown --out bench.md",
    "  agentshield bench --format matrix",
    "  agentshield bench --validate-corpus",
    "  agentshield bench --format json --evidence bench-evidence.json",
    "  agentshield bench --ci",
    "  agentshield bench --ci --sarif agentshield.sarif.json",
    "  agentshield registry validate examples/registry/agentshield.registry.json",
    "  agentshield demo-run --format html --out demo-report.html",
    "  agentshield demo-run --evidence demo-evidence.json",
    "  agentshield doctor",
    "  agentshield doctor --format json",
    "  agentshield verify-trace demo-evidence.json",
    "  agentshield mcp-conformance --format markdown",
    "  agentshield mcp-demo --format json",
    "  agentshield mcp-proxy-demo --format json",
    "  agentshield mcp-stdio-demo",
    "  agentshield approval demo",
    "  agentshield execution demo",
    "  agentshield execution dry-run",
    "  agentshield sandbox demo",
    "  agentshield sdk demo",
    "  agentshield action dry-run",
    "  agentshield action dry-run --format json",
    "  agentshield perf",
    "  agentshield perf --format json",
    "  agentshield perf --format markdown",
    "  agentshield perf --budget strict",
    "  agentshield policy-audit examples/policies/strict.policy.json",
    "  agentshield policy-audit examples/policies/strict.policy.json --format json",
    "  agentshield policy-pack list",
    "  agentshield policy-pack show strict-mcp-local",
    "  agentshield policy-pack show strict-mcp-local --format json",
    "  agentshield policy-pack init strict-mcp-local --out generated-pack.policy.json --force",
    "  agentshield policy-pack validate examples/policy-packs/strict-mcp-local.pack.json",
    "  agentshield policy-pack audit strict-mcp-local",
    "  agentshield policy-pack audit enterprise-sensitive-data --format json",
    "  agentshield policy-template list",
    "  agentshield policy-template show strict-mcp-local",
    "  agentshield policy-template init strict-mcp-local --out generated.policy.json",
    "  agentshield policy-test examples/policy-tests/strict.policy-test.json",
    "  agentshield policy-test examples/policy-tests/strict.policy-test.json --format json",
    "  agentshield release-check",
    "  agentshield release-check --format json",
    "  agentshield redteam list-templates",
    "  agentshield redteam generate --template prompt-injection-secret-exfiltration --out generated-redteam.json --force",
    "  agentshield redteam coverage --format markdown",
    "  agentshield workspace init",
    "  agentshield workspace init --out agentshield.workspace.json --force",
    "  agentshield workspace validate examples/workspace/agentshield.workspace.json",
    "  agentshield workspace doctor examples/workspace/agentshield.workspace.json",
    "  agentshield workspace doctor examples/workspace/agentshield.workspace.json --format json",
    "  agentshield security-fuzz",
    "  agentshield security-fuzz --format json",
    "  agentshield security-fuzz --format markdown",
    "  agentshield security-review validate pack.json"
  ].join("\n");
}

export function runCli(args: string[], options: CliOptions = {}): CliResult {
  const [command, ...commandArgs] = args;
  const cwd = options.cwd ?? process.cwd();

  if (!command) {
    return runCli(["help"], options);
  }

  try {
    switch (command) {
      case "init":
        return runInitCommand(commandArgs, cwd);
      case "adapter":
        throw new Error("adapter command is async; use runCliAsync");
      case "bench":
        return runBenchCommand(commandArgs, cwd);
      case "registry": {
        const [registryCommand, ...registryArgs] = commandArgs;
        if (registryCommand !== "validate" && registryCommand !== "inspect" && registryCommand !== "attest") {
          return { exitCode: 1, stdout: "", stderr: "registry command must be validate, inspect, or attest" };
        }
        return runRegistryCommand(registryCommand, registryArgs, cwd);
      }
      case "check":
        return runCheckCommand(commandArgs, cwd);
      case "explain-policy":
        return runExplainPolicyCommand(commandArgs, cwd);
      case "version":
      case "--version":
      case "-v":
        return runVersionCommand();
      case "demo":
        return runDemoCommand();
      case "demo-run":
        return runDemoRunCommand(commandArgs, cwd);
      case "doctor":
        return runDoctorCommand(commandArgs, cwd);
      case "mcp-demo":
        return runMcpDemoCommand(commandArgs);
      case "mcp-conformance":
        return runMcpConformanceCommand(commandArgs, cwd);
      case "mcp-proxy-demo":
        return runMcpProxyDemoCommand(commandArgs, cwd);
      case "mcp-stdio-demo":
        return runMcpStdioDemoCommand(commandArgs, cwd);
      case "approval":
        return runApprovalCommand(commandArgs, cwd);
      case "approval-create":
        return runApprovalCreateCommand(commandArgs, cwd);
      case "approval-approve":
        return runApprovalApproveCommand(commandArgs, cwd);
      case "approval-verify":
        return runApprovalVerifyCommand(commandArgs, cwd);
      case "approval-demo":
        return runApprovalDemoCommand();
      case "execution":
        return runExecutionCommand(commandArgs, cwd);
      case "execution-demo":
        return runExecutionDemoCommand(commandArgs);
      case "execution-dry-run":
        return runExecutionDryRunCommand();
      case "sandbox":
        return runSandboxCommand(commandArgs);
      case "sandbox-demo":
        return runSandboxDemoCommand(commandArgs);
      case "sdk": {
        const [sdkCommand, ...sdkArgs] = commandArgs;
        if (sdkCommand !== "demo") {
          return { exitCode: 1, stdout: "", stderr: "sdk command must be demo" };
        }
        return runSdkDemoCommand(sdkArgs, cwd);
      }
      case "sdk-demo":
        return runSdkDemoCommand(commandArgs, cwd);
      case "sensitive":
        return runSensitiveCommand(commandArgs, cwd);
      case "action":
        return runActionCommand(commandArgs);
      case "perf":
        return runPerfCommand(commandArgs, cwd);
      case "policy":
        return runPolicyCommand(commandArgs, cwd);
      case "policy-audit":
        return runPolicyAuditCommand(commandArgs, cwd);
      case "policy-pack":
        return runPolicyPackCommand(commandArgs, cwd);
      case "policy-template":
        return runPolicyTemplateCommand(commandArgs, cwd);
      case "policy-test":
        return runPolicyTestCommand(commandArgs, cwd);
      case "policy-bundle":
        return runPolicyBundleCommand(commandArgs, cwd);
      case "registry-bundle":
        return runRegistryBundleCommand(commandArgs, cwd);
      case "provider-adapter":
        return runProviderAdapterCommand(commandArgs, cwd);
      case "framework-adapter":
        return runFrameworkAdapterCommand(commandArgs, cwd);
      case "multi-agent":
        return runMultiAgentCommand(commandArgs, cwd);
      case "docs":
        return runDocsCommand(commandArgs, cwd);
      case "security-fuzz":
        return runSecurityFuzzCommand(commandArgs, cwd);
      case "recipe":
        return runRecipeCommand(commandArgs, cwd);
      case "incident":
        return runIncidentCommand(commandArgs, cwd);
      case "explain-graph":
        return runExplainGraphCommand(commandArgs, cwd);
      case "verify-trace":
        return runVerifyTraceCommand(commandArgs, cwd);
      case "ide":
        return runIdeCommand(commandArgs, cwd);
      case "leaderboard":
        return runLeaderboardCommand(commandArgs, cwd);
      case "workspace":
        return runWorkspaceCommand(commandArgs, cwd);
      case "help":
      case "--help":
      case "-h":
        return {
          exitCode: 0,
          stdout: help(),
          stderr: ""
        };
      default:
        return {
          exitCode: 1,
          stdout: "",
          stderr: `unknown command: ${command}\n${help()}`
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown CLI error";

    return {
      exitCode: 1,
      stdout: "",
      stderr: message
    };
  }
}

export async function runCliAsync(args: string[], options: CliOptions = {}): Promise<CliResult> {
  const [command, ...commandArgs] = args;
  if (command === "adapter") {
    return runAdapterCommand(commandArgs, options.cwd ?? process.cwd());
  }
  if (command === "adapter-conformance") {
    return runAdapterConformanceCommand(commandArgs, options.cwd ?? process.cwd());
  }
  return runCli(args, options);
}

export function writeCliResult(result: CliResult): void {
  if (result.stdout.length > 0) {
    process.stdout.write(`${result.stdout}\n`);
  }

  if (result.stderr.length > 0) {
    process.stderr.write(`${result.stderr}\n`);
  }
}

export function main(argv = process.argv.slice(2)): void {
  void runCliAsync(argv).then((result) => {
    writeCliResult(result);
    process.exitCode = result.exitCode;
  });
}

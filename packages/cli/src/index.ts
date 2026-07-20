#!/usr/bin/env node
import { main } from "./cli.js";

export * from "./cli.js";
export * from "./actions/githubActionInputs.js";
export * from "./actions/githubActionRunner.js";
export * from "./commands/actionCommand.js";
export * from "./commands/adapterCommand.js";
export * from "./commands/benchCommand.js";
export * from "./commands/checkCommand.js";
export * from "./commands/demoCommand.js";
export * from "./commands/doctorCommand.js";
export * from "./commands/explainPolicyCommand.js";
export * from "./commands/initCommand.js";
export * from "./commands/mcpDemoCommand.js";
export * from "./commands/mcpConformanceCommand.js";
export * from "./commands/mcpProxyDemoCommand.js";
export * from "./commands/perfCommand.js";
export * from "./commands/policyAuditCommand.js";
export * from "./commands/policyPackCommand.js";
export * from "./commands/policyTemplateCommand.js";
export * from "./commands/policyTestCommand.js";
export * from "./commands/registryCommand.js";
export * from "./commands/policyCommand.js";
export * from "./commands/policyBundleCommand.js";
export * from "./commands/registryBundleCommand.js";
export * from "./commands/sandboxCommand.js";
export * from "./commands/sdkCommand.js";
export * from "./commands/sensitiveCommand.js";
export * from "./commands/securityFuzzCommand.js";
export * from "./commands/verifyTraceCommand.js";
export * from "./commands/versionCommand.js";
export * from "./workspace/workspaceCommands.js";
export * from "./workspace/workspaceDoctor.js";
export * from "./workspace/workspaceInit.js";

export function getCliName(): string {
  return "agentshield";
}

if (process.argv[1]?.endsWith("index.js") === true) {
  main();
}

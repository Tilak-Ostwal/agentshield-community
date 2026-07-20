import { ConsumerProjectConfig } from "./consumerProjectSchema.js";
import { PublicEvaluationPack } from "./publicEvaluationPack.js";
import fs from "fs";
import path from "path";

export function validateConsumerProject(config: ConsumerProjectConfig, basePath: string): string[] {
  const errors: string[] = [];
  const requiredFiles = [
    config.workspaceConfigPath,
    config.policyPath,
    config.registryPath,
    config.policyBundlePath,
    config.registryBundlePath,
    ...config.providerFixtures,
    ...config.frameworkWorkflows,
    ...config.multiAgentWorkflows
  ];

  for (const file of requiredFiles) {
    try {
      fs.accessSync(path.join(basePath, file));
    } catch {
      errors.push(`Missing referenced file: ${file}`);
    }
  }
  return errors;
}

export function validateEvaluationPack(pack: PublicEvaluationPack): string[] {
  const errors: string[] = [];
  for (const check of pack.checks) {
    if (check.command.includes("curl") || check.command.includes("publish") || check.command.includes("deploy")) {
      errors.push(`Unsafe command found in check ${check.checkId}`);
    }
  }
  return errors;
}

import { MockMcpServer } from "@agentshield/mcp-adapter";
import { createToolFingerprint, stableHash } from "@agentshield/core";
import { attestToolFingerprint, validateRegistryFile } from "@agentshield/registry";

import type { CliResult } from "../cli.js";
import { loadRegistry } from "./registryLoader.js";

function argValue(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

function commandPath(args: string[]): string | undefined {
  return args.find((arg) => !arg.startsWith("--"));
}

export function runRegistryCommand(command: "validate" | "inspect" | "attest", args: string[], cwd = process.cwd()): CliResult {
  const path = commandPath(args);
  if (path === undefined) {
    return { exitCode: 1, stdout: "", stderr: `registry ${command} requires a registry path` };
  }

  const loaded = loadRegistry(path, cwd);
  if (!loaded.ok) {
    return { exitCode: 1, stdout: "", stderr: loaded.error };
  }

  if (command === "validate") {
    const validation = validateRegistryFile(loaded.registryFile);
    return {
      exitCode: validation.valid ? 0 : 1,
      stdout: validation.valid ? `registry valid\nentries: ${loaded.registryFile.entries.length}` : "",
      stderr: validation.valid ? validation.issues.filter((issue) => issue.severity === "warning").map((issue) => `${issue.code}: ${issue.message}`).join("\n") : validation.issues.map((issue) => `${issue.code}: ${issue.message}`).join("\n")
    };
  }

  if (command === "inspect") {
    const entries = loaded.toolRegistry.listEntries();
    const risky = entries.filter((entry) => entry.riskLevel === "high" || entry.riskLevel === "critical" || entry.trustLevel === "blocked");
    return {
      exitCode: 0,
      stdout: [
        `registry: ${loaded.registryFile.name}`,
        `entries: ${entries.length}`,
        `trust levels: ${entries.map((entry) => `${entry.serverName}:${entry.toolName}=${entry.trustLevel}`).join(", ")}`,
        `risky entries: ${risky.length === 0 ? "none" : risky.map((entry) => `${entry.serverName}:${entry.toolName}`).join(", ")}`
      ].join("\n"),
      stderr: ""
    };
  }

  const toolName = argValue(args, "--tool");
  if (toolName === undefined || toolName.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "registry attest requires --tool <toolName>" };
  }

  const server = new MockMcpServer();
  const metadata = server.getToolMetadata(toolName);
  if (metadata === undefined) {
    return { exitCode: 1, stdout: "", stderr: `unknown mock tool ${toolName}` };
  }

  const fingerprint = createToolFingerprint(metadata);
  const entry = loaded.toolRegistry.getEntry(metadata.serverName, metadata.toolName);
  const attestation = attestToolFingerprint(entry, metadata);

  return {
    exitCode: attestation.decisionImpact === "deny" ? 1 : 0,
    stdout: [
      `tool: ${metadata.serverName}:${metadata.toolName}`,
      `status: ${attestation.status}`,
      `decision impact: ${attestation.decisionImpact}`,
      `schema hash: ${fingerprint.schemaHash}`,
      `description hash: ${fingerprint.descriptionHash}`,
      `capability hash: ${stableHash(fingerprint.capabilities)}`,
      `findings: ${attestation.findings.length === 0 ? "none" : attestation.findings.map((finding) => finding.type).join(", ")}`
    ].join("\n"),
    stderr: ""
  };
}

import * as fs from "fs";
import * as path from "path";
import { type CliResult } from "../cli.js";
import { ideIntegrationSchema, type IdeIntegrationConfig } from "@agentshield/bench";
import { generateVscodeTasks } from "@agentshield/bench";
import { runIdeDoctor } from "@agentshield/bench";
import { generateIdePanelReport } from "@agentshield/bench";

export function runIdeCommand(args: string[], cwd: string): CliResult {
  const [ideType, action, ...rest] = args;
  
  if (ideType !== "vscode") {
    return { exitCode: 1, stdout: "", stderr: "Only vscode is supported for now." };
  }

  if (action === "init") {
    let out = "generated-vscode-tasks.json";
    let configPath: string | null = null;
    let force = false;
    
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--out") out = rest[++i] || out;
      if (rest[i] === "--config") configPath = rest[++i] || null;
      if (rest[i] === "--force") force = true;
    }
    
    const outPath = path.resolve(cwd, out);
    if (!outPath.startsWith(cwd)) {
      return { exitCode: 1, stdout: "", stderr: "Output path must be inside workspace." };
    }
    
    if (fs.existsSync(outPath) && !force) {
      return { exitCode: 1, stdout: "", stderr: "Refuse overwrite unless --force." };
    }
    
    let config: IdeIntegrationConfig = { version: 1, ide: "vscode" };
    if (configPath) {
      const p = path.resolve(cwd, configPath);
      if (fs.existsSync(p)) {
        config = ideIntegrationSchema.parse(JSON.parse(fs.readFileSync(p, "utf8")) as unknown);
      }
    }
    
    const parsed = ideIntegrationSchema.parse(config);
    const tasks = generateVscodeTasks(parsed);
    
    fs.writeFileSync(outPath, JSON.stringify(tasks, null, 2));
    return { exitCode: 0, stdout: `Generated tasks at ${out}`, stderr: "" };
  }
  
  if (action === "doctor") {
    let format = "text";
    let configPath: string | undefined = rest[0];
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--format") format = rest[++i] || format;
      else if (rest[i] && !rest[i]!.startsWith("--")) configPath = rest[i];
    }
    
    let config: IdeIntegrationConfig = { version: 1, ide: "vscode" };
    if (configPath) {
      config = ideIntegrationSchema.parse(JSON.parse(fs.readFileSync(path.resolve(cwd, configPath), "utf8")) as unknown);
    }
    
    const res = runIdeDoctor(config);
    if (format === "json") {
      return { exitCode: res.valid ? 0 : 1, stdout: JSON.stringify(res, null, 2), stderr: "" };
    }
    return { exitCode: res.valid ? 0 : 1, stdout: res.warnings.join("\n") || "IDE Doctor PASS", stderr: "" };
  }
  
  if (action === "panel") {
    let format = "text";
    let configPath: string | undefined = rest[0];
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--format") format = rest[++i] || format;
      else if (rest[i] && !rest[i]!.startsWith("--")) configPath = rest[i];
    }
    
    let config: IdeIntegrationConfig = { version: 1, ide: "vscode" };
    if (configPath) {
      config = ideIntegrationSchema.parse(JSON.parse(fs.readFileSync(path.resolve(cwd, configPath), "utf8")) as unknown);
    }
    
    const report = generateIdePanelReport(config);
    if (format === "json") {
      return { exitCode: 0, stdout: JSON.stringify({ panelReport: report }, null, 2), stderr: "" };
    }
    return { exitCode: 0, stdout: report, stderr: "" };
  }
  
  return { exitCode: 1, stdout: "", stderr: "Unknown action" };
}

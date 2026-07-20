import * as fs from "fs";
import * as path from "path";
import { CliResult } from "../cli.js";
import { validateDocsIntegrity, generateCommandCatalog, generateDocsMapMarkdown, mapDocsFeatureCoverage, docsManifestSchema } from "@agentshield/bench";

export function runDocsCommand(args: string[], cwd: string): CliResult {
  const action = args[0];
  const target = args[1];
  
  let format = "text";
  let out = "";
  let force = false;
  for (let i = 2; i < args.length; i++) {
    if (args[i] === "--format") format = args[i + 1] || "";
    if (args[i] === "--out") out = args[i + 1] || "";
    if (args[i] === "--force") force = true;
  }

  if (!action || !target) {
    return { exitCode: 1, stdout: "", stderr: "Usage: agentshield docs <action> <manifest>" };
  }

  const targetPath = path.resolve(cwd, target);
  if (!fs.existsSync(targetPath)) {
    return { exitCode: 1, stdout: "", stderr: `File not found: ${target}` };
  }

  if (out) {
    const outPath = path.resolve(cwd, out);
    if (!outPath.startsWith(cwd)) {
      return { exitCode: 1, stdout: "", stderr: "Output path must be within workspace." };
    }
    if (fs.existsSync(outPath) && !force) {
      return { exitCode: 1, stdout: "", stderr: "File exists. Use --force to overwrite." };
    }
  }

  try {
    const content = fs.readFileSync(targetPath, "utf-8");
    const parsed = docsManifestSchema.safeParse(JSON.parse(content));
    if (!parsed.success) return { exitCode: 1, stdout: "", stderr: "Invalid docs manifest." };
    const manifest = parsed.data;

    if (action === "validate") {
      const res = validateDocsIntegrity(targetPath, cwd);
      if (format === "json") {
         return { exitCode: res.valid ? 0 : 1, stdout: JSON.stringify(res), stderr: "" };
      }
      if (res.valid) {
         return { exitCode: 0, stdout: "Docs integrity valid.", stderr: "" };
      }
      return { exitCode: 1, stdout: "", stderr: `Docs validation failed:\n${res.errors.join("\n")}` };
    }

    if (action === "map") {
      const md = generateDocsMapMarkdown(manifest);
      const res = mapDocsFeatureCoverage(manifest);
      if (format === "json") {
         return { exitCode: res.valid ? 0 : 1, stdout: JSON.stringify(res), stderr: "" };
      }
      if (out) {
         fs.writeFileSync(path.resolve(cwd, out), md, "utf-8");
         return { exitCode: res.valid ? 0 : 1, stdout: `Map written to ${out}`, stderr: "" };
      }
      return { exitCode: res.valid ? 0 : 1, stdout: md, stderr: "" };
    }

    if (action === "catalog") {
      const md = generateCommandCatalog();
      if (out) {
         fs.writeFileSync(path.resolve(cwd, out), md, "utf-8");
         return { exitCode: 0, stdout: `Catalog written to ${out}`, stderr: "" };
      }
      return { exitCode: 0, stdout: md, stderr: "" };
    }

    return { exitCode: 1, stdout: "", stderr: `Unknown action: ${action}` };
  } catch (e: any) {
    return { exitCode: 1, stdout: "", stderr: `Error: ${e.message}` };
  }
}

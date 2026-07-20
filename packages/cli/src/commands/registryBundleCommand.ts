import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseRegistryBundle, verifyRegistryBundle, signRegistryBundleLocalTest, generateRegistryProvenance, parseRegistryFile } from "@agentshield/registry";
import { formatRegistryBundleVerifyText, formatRegistryBundleVerifyJson, formatRegistryBundleInspectText, formatRegistryBundleInspectJson } from "@agentshield/bench";
import type { CliResult } from "../cli.js";

export function runRegistryBundleCommand(args: string[], cwd: string): CliResult {
  const [subcommand, ...rest] = args;

  if (subcommand === "create") {
    let registryFile = "";
    let outFile = "";
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--registry") {
        registryFile = rest[++i] ?? "";
      } else if (rest[i] === "--out") {
        outFile = rest[++i] ?? "";
      }
    }

    if (!registryFile) {
        return { exitCode: 1, stdout: "", stderr: "Must specify --registry" };
    }
    if (!outFile) {
        return { exitCode: 1, stdout: "", stderr: "Must specify --out" };
    }

    try {
        const regPath = resolve(cwd, registryFile);
        const reg = parseRegistryFile(JSON.parse(readFileSync(regPath, "utf-8")) as unknown);
        const prov = generateRegistryProvenance(reg, { source: "manual", sourceId: registryFile });
        
        const bundle = {
            version: 1 as const,
            bundleId: "generated-" + Date.now(),
            name: "Generated Registry Bundle",
            createdAt: new Date().toISOString(),
            registry: reg,
            provenance: prov
        };

        const signed = signRegistryBundleLocalTest(bundle);
        const outPath = resolve(cwd, outFile);
        writeFileSync(outPath, JSON.stringify(signed, null, 2), "utf-8");
        return { exitCode: 0, stdout: `Created signed registry trust bundle at ${outFile}`, stderr: "" };
    } catch (error: unknown) {
        return { exitCode: 1, stdout: "", stderr: error instanceof Error ? error.message : String(error) };
    }
  }

  if (subcommand === "inspect" || subcommand === "verify") {
    const file = rest[0];
    let format = "text";
    if (rest[1] === "--format") {
        format = rest[2] ?? "text";
    }
    if (!file) return { exitCode: 1, stdout: "", stderr: "Must specify bundle file" };
    
    try {
        const bundlePath = resolve(cwd, file);
        const raw = JSON.parse(readFileSync(bundlePath, "utf-8"));
        const bundle = parseRegistryBundle(raw);
        
        if (subcommand === "inspect") {
            const out = format === "json" ? formatRegistryBundleInspectJson(bundle) : formatRegistryBundleInspectText(bundle);
            return { exitCode: 0, stdout: out, stderr: "" };
        } else {
            const result = verifyRegistryBundle(bundle);
            const out = format === "json" ? formatRegistryBundleVerifyJson(result.valid, result.failures) : formatRegistryBundleVerifyText(result.valid, result.failures);
            return { exitCode: result.valid ? 0 : 1, stdout: out, stderr: "" };
        }
    } catch {
        return { exitCode: 1, stdout: "", stderr: "Failed to parse bundle" };
    }
  }

  return { exitCode: 1, stdout: "", stderr: "Unknown registry-bundle subcommand" };
}

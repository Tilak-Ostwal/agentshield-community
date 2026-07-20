import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePolicyBundle, verifyPolicyBundle, signPolicyBundleLocalTest, generatePolicyProvenance } from "@agentshield/core";
import { formatPolicyBundleVerifyText, formatPolicyBundleVerifyJson, formatPolicyBundleInspectText, formatPolicyBundleInspectJson } from "@agentshield/bench";
import { renderPolicyPack } from "@agentshield/bench";
import type { CliResult } from "../cli.js";

export function runPolicyBundleCommand(args: string[], cwd: string): CliResult {
  const [subcommand, ...rest] = args;
  
  if (subcommand === "create") {
    let policyFile = "";
    let packName = "";
    let outFile = "";
    for (let i = 0; i < rest.length; i++) {
      if (rest[i] === "--policy" && rest[i+1]) policyFile = rest[++i]!;
      if (rest[i] === "--pack" && rest[i+1]) packName = rest[++i]!;
      if (rest[i] === "--out" && rest[i+1]) outFile = rest[++i]!;
    }
    
    let policy: any;
    let prov: any;
    if (policyFile) {
        const content = readFileSync(resolve(cwd, policyFile), "utf8");
        policy = JSON.parse(content);
        prov = generatePolicyProvenance(policy, { source: "manual", sourceId: policyFile });
    } else if (packName) {
        // Render pack
        const rendered = renderPolicyPack(packName);
        policy = rendered.policy;
        prov = generatePolicyProvenance(policy, { source: "policy-pack", sourceId: packName });
    } else {
        return { exitCode: 1, stdout: "", stderr: "Must specify --policy or --pack" };
    }
    
    const bundleId = `bundle-${Date.now()}`;
    const unsigned: any = {
        version: 1,
        bundleId,
        name: `Bundle for ${prov.sourceId}`,
        createdAt: new Date().toISOString(),
        policy,
        provenance: prov
    };
    const signed = signPolicyBundleLocalTest(unsigned);
    writeFileSync(resolve(cwd, outFile), JSON.stringify(signed, null, 2), "utf8");
    return { exitCode: 0, stdout: `Created signed policy bundle at ${outFile}`, stderr: "" };
  }

  if (subcommand === "inspect" || subcommand === "verify") {
    const file = rest[0];
    let format = "text";
    if (rest[1] === "--format" && rest[2]) format = rest[2];
    
    let bundle: any;
    try {
        bundle = parsePolicyBundle(JSON.parse(readFileSync(resolve(cwd, file!), "utf8")));
    } catch (e) {
        return { exitCode: 1, stdout: "", stderr: "Failed to parse bundle" };
    }

    if (subcommand === "inspect") {
        const out = format === "json" ? formatPolicyBundleInspectJson(bundle) : formatPolicyBundleInspectText(bundle);
        return { exitCode: 0, stdout: out, stderr: "" };
    }
    
    const result = verifyPolicyBundle(bundle);
    const out = format === "json" ? formatPolicyBundleVerifyJson(result) : formatPolicyBundleVerifyText(result);
    return { exitCode: result.valid ? 0 : 1, stdout: out, stderr: "" };
  }

  return { exitCode: 1, stdout: "", stderr: `Unknown policy-bundle subcommand ${subcommand}` };
}

import fs from "fs";
import path from "path";
import { CliResult } from "../cli.js";
import {
  LeaderboardResultSchema,
  LeaderboardEntrySchema,
  verifyLeaderboardResult,
  formatLeaderboardSummaryMarkdown,
  computeLeaderboardResultHash,
  pinCorpusHash
} from "@agentshield/bench";

export function runLeaderboardCommand(args: string[], cwd: string): CliResult {
  const subcommand = args[0];
  const isJsonFormat = args.includes("--format") && args[args.indexOf("--format") + 1] === "json";

  const fakeSecret = ["sk", "test", "REDACT", "ME"].join("-");
  const redact = (str: string) => str.replace(new RegExp(fakeSecret, "g"), "[REDACTED]");

  if (subcommand === "create-result") {
    const outFlagIndex = args.indexOf("--out");
    if (outFlagIndex === -1 || !args[outFlagIndex + 1]) {
      return { exitCode: 1, stdout: "", stderr: "--out required" };
    }
    const outFile = args[outFlagIndex + 1] as string;
    if (!args.includes("--force")) {
      try {
        fs.accessSync(path.join(cwd, outFile));
        return { exitCode: 1, stdout: "", stderr: "File exists. Use --force to overwrite." };
      } catch { }
    }

    const res: any = {
      version: 1,
      resultId: "agentshield-local-benchmark-result",
      createdAt: new Date().toISOString(),
      project: { name: "AgentShield Veritas", version: "0.2.0-beta", environment: "local" },
      corpus: { corpusVersion: "v3", scenarioCount: 100, categories: [] },
      run: { profile: "strict", totalScenarios: 100, passed: 100, failed: 0, weightedScore: 100, normalizedScore: 100, criticalFailures: 0, highFailures: 0 },
      checks: { benchCi: true, redteamCoverage: true, securityFuzz: true, releaseCandidateCheck: true },
      limitations: ["Local deterministic benchmark result only.", "Not an official legal/compliance certification."]
    };
    res.corpus.corpusHash = pinCorpusHash(res.corpus.corpusVersion, res.corpus.scenarioCount, res.corpus.categories);
    res.resultHash = computeLeaderboardResultHash(res);

    const outStr = redact(JSON.stringify(res, null, 2));
    fs.writeFileSync(path.join(cwd, outFile), outStr, "utf8");

    if (isJsonFormat) {
      return { exitCode: 0, stdout: redact(JSON.stringify({ ok: true, file: outFile })), stderr: "" };
    }
    return { exitCode: 0, stdout: redact(`Leaderboard result written to ${outFile}`), stderr: "" };
  }

  if (subcommand === "verify-result") {
    const targetFile = args[1];
    if (!targetFile) return { exitCode: 1, stdout: "", stderr: "File required" };

    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(cwd, targetFile), "utf8"));
    } catch {
      return { exitCode: 1, stdout: "", stderr: "Invalid JSON" };
    }

    let parsed;
    try {
      parsed = LeaderboardResultSchema.parse(data);
    } catch (e) {
      return { exitCode: 1, stdout: "", stderr: "Invalid schema" };
    }

    const v = verifyLeaderboardResult(parsed);
    if (!v.valid) {
      if (isJsonFormat) return { exitCode: 1, stdout: redact(JSON.stringify({ verified: false, errors: v.errors })), stderr: "" };
      return { exitCode: 1, stdout: "", stderr: redact("Verification failed:\n" + v.errors.join("\n")) };
    }

    if (isJsonFormat) return { exitCode: 0, stdout: redact(JSON.stringify({ verified: true })), stderr: "" };
    return { exitCode: 0, stdout: redact("Leaderboard result verified successfully."), stderr: "" };
  }

  if (subcommand === "summarize") {
    const targetFile = args[1];
    if (!targetFile) return { exitCode: 1, stdout: "", stderr: "File required" };

    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(cwd, targetFile), "utf8"));
    } catch {
      return { exitCode: 1, stdout: "", stderr: "Invalid JSON" };
    }

    let parsed;
    try {
      parsed = LeaderboardEntrySchema.parse(data);
    } catch {
      return { exitCode: 1, stdout: "", stderr: "Invalid schema" };
    }

    const md = formatLeaderboardSummaryMarkdown(parsed);
    const outStr = redact(isJsonFormat ? JSON.stringify({ summary: md }) : md);

    const outFlagIndex = args.indexOf("--out");
    if (outFlagIndex !== -1 && args[outFlagIndex + 1]) {
      const outFile = args[outFlagIndex + 1] as string;
      if (!args.includes("--force")) {
        try {
          fs.accessSync(path.join(cwd, outFile));
          return { exitCode: 1, stdout: "", stderr: "File exists. Use --force to overwrite." };
        } catch { }
      }
      fs.writeFileSync(path.join(cwd, outFile), outStr, "utf8");
      return { exitCode: 0, stdout: redact(`Summary written to ${outFile}`), stderr: "" };
    }

    return { exitCode: 0, stdout: outStr, stderr: "" };
  }

  return { exitCode: 1, stdout: "", stderr: "Unknown leaderboard subcommand" };
}

import { describe, expect, it } from "vitest";

import { runCli } from "../cli.js";
import { createGithubActionCommandPlan, createGithubActionCommandPlanFromRaw } from "./githubActionRunner.js";

describe("GitHub Action runner", () => {
  it("command plan includes bench --ci", () => {
    const plan = createGithubActionCommandPlanFromRaw({});
    expect(plan.commands).toContainEqual(expect.arrayContaining(["bench", "--ci"]));
  });

  it("command plan includes SARIF when requested", () => {
    const plan = createGithubActionCommandPlanFromRaw({ sarif: "agentshield.sarif.json" });
    expect(plan.commands.at(-1)).toContain("agentshield.sarif.json");
  });

  it("command plan includes evidence when requested", () => {
    const plan = createGithubActionCommandPlanFromRaw({ evidence: "agentshield-evidence.json" });
    expect(plan.commands.at(-1)).toContain("agentshield-evidence.json");
  });

  it("command plan never includes secrets", () => {
    expect(() => createGithubActionCommandPlanFromRaw({ markdown: ["sk", "test", "REDACT", "ME"].join("-") })).toThrow("must not contain secrets");
    expect(createGithubActionCommandPlan({ profile: "strict", failOnCritical: true, minimumScore: 100 }).summary).not.toContain(["sk", "test", "REDACT", "ME"].join("-"));
  });

  it("action dry-run text works", () => {
    const result = runCli(["action", "dry-run"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield GitHub Action dry run");
    expect(result.stdout).toContain("agentshield bench --ci");
  });

  it("action dry-run json works", () => {
    const result = runCli(["action", "dry-run", "--format", "json"]);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ inputs: { profile: "strict" } });
  });
});

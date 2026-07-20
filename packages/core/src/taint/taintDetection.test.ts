import { describe, expect, it } from "vitest";

import { assessTaintSink, detectTaintSources } from "./taintDetection.js";

const baseAction = {
  actionId: "action_1",
  timestamp: "2026-06-26T00:00:00.000Z",
  actionType: "tool_call"
};

describe("taint detection", () => {
  it("detects token apiKey and password keys as taint", () => {
    const labels = detectTaintSources(
      {
        ...baseAction,
        toolName: "network.post",
        input: { token: "sk-test-REDACT-ME", apiKey: "fake", password: "fake" }
      },
      ["network.write"]
    ).map((source) => source.label);

    expect(labels).toEqual(expect.arrayContaining(["secret", "token", "api_key", "password", "credential"]));
  });

  it("detects .env id_rsa and credentials paths as sensitive taint", () => {
    expect(
      detectTaintSources({
        ...baseAction,
        toolName: "filesystem.read",
        input: { path: "/mock/project/.env" }
      }).map((source) => source.label)
    ).toEqual(expect.arrayContaining(["filesystem_sensitive", "env_secret", "secret"]));
    expect(
      detectTaintSources({
        ...baseAction,
        toolName: "filesystem.read",
        input: { path: "/mock/project/id_rsa" }
      }).map((source) => source.label)
    ).toContain("ssh_key");
  });

  it("detects browser.goto as browser and network untrusted", () => {
    expect(
      detectTaintSources({
        ...baseAction,
        toolName: "browser.goto",
        input: { url: "https://example.invalid" }
      }).map((source) => source.label)
    ).toEqual(expect.arrayContaining(["browser_untrusted", "network_untrusted", "external_content"]));
  });

  it("assesses secret taint to network write as critical", () => {
    expect(assessTaintSink(["secret"], ["network.write"])).toMatchObject({
      isSink: true,
      severity: "critical",
      recommendedDecision: "deny"
    });
  });
});

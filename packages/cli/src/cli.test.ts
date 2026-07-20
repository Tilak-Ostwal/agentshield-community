import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DEMO_MESSAGE, runCli, runCliAsync } from "./index.js";


interface PolicyAuditCliJson {
  summary: {
    passed: boolean;
  };
}

function tempDirectory(): string {
  return mkdtempSync(join(tmpdir(), "agentshield-cli-"));
}

describe("cli", () => {
  it("CLI adapter demo works", async () => {
    const result = await runCliAsync(["adapter", "demo"], { cwd: join(process.cwd(), "..", "..") });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield adapter demo: PASS");
    expect(result.stdout).not.toContain("sk-test-REDACT-ME");
  });

  it("CLI adapter demo JSON works", async () => {
    const result = await runCliAsync(["adapter", "demo", "--format", "json"], { cwd: join(process.cwd(), "..", "..") });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ failed: 0, adapterRegistered: true });
    expect(result.stdout).not.toContain("sk-test-REDACT-ME");
  });

  it("runs bench with JSON output", () => {
    const result = runCli(["bench", "--format", "json"]);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      failed: 0,
      total: 82
    });
  });

  it("bench --profile strict works", () => {
    const result = runCli(["bench", "--profile", "strict", "--format", "json"]);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ profile: "strict", status: "pass" });
  });

  it("bench --profile balanced works", () => {
    const result = runCli(["bench", "--profile", "balanced", "--format", "json"]);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ profile: "balanced", status: "pass" });
  });

  it("bench --format markdown works", () => {
    const result = runCli(["bench", "--format", "markdown"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield Bench Report");
    expect(result.stdout).not.toContain("sk-test-REDACT-ME");
  });

  it("bench --format matrix works", () => {
    const result = runCli(["bench", "--format", "matrix"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield Benchmark Matrix");
  });

  it("bench --validate-corpus works", () => {
    expect(runCli(["bench", "--validate-corpus"])).toMatchObject({
      exitCode: 0,
      stdout: "benchmark corpus valid"
    });
  });

  it("registry CLI validate works", () => {
    const result = runCli(["registry", "validate", "examples/registry/agentshield.registry.json"], {
      cwd: join(process.cwd(), "..", "..")
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("registry valid");
  });

  it("registry CLI inspect works", () => {
    const result = runCli(["registry", "inspect", "examples/registry/agentshield.registry.json"], {
      cwd: join(process.cwd(), "..", "..")
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("trust levels");
  });

  it("registry CLI attest works", () => {
    const result = runCli(["registry", "attest", "examples/registry/agentshield.registry.json", "--tool", "filesystem.read"], {
      cwd: join(process.cwd(), "..", "..")
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("status: match");
  });

  it("bench --registry works", () => {
    const result = runCli(["bench", "--registry", "examples/registry/agentshield.registry.json", "--format", "json"], {
      cwd: join(process.cwd(), "..", "..")
    });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ failed: 0 });
  });


  it("mcp-conformance with registry works", () => {
    const result = runCli(["mcp-conformance", "--registry", "examples/registry/agentshield.registry.json", "--format", "json"], {
      cwd: join(process.cwd(), "..", "..")
    });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ failed: 0 });
  });

  it("bench --ci exits 0 for current passing benchmark", () => {
    const result = runCli(["bench", "--ci"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield CI Gate: PASS");
  });

  it("bench --sarif writes SARIF", () => {
    const directory = tempDirectory();
    const sarifPath = join(directory, "agentshield.sarif.json");

    try {
      const result = runCli(["bench", "--sarif", "agentshield.sarif.json"], { cwd: directory });

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(readFileSync(sarifPath, "utf8"))).toMatchObject({ version: "2.1.0" });
      expect(readFileSync(sarifPath, "utf8")).not.toContain("sk-test-REDACT-ME");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("bench --ci --sarif writes SARIF and passes", () => {
    const directory = tempDirectory();
    const sarifPath = join(directory, "agentshield.sarif.json");

    try {
      const result = runCli(["bench", "--ci", "--sarif", "agentshield.sarif.json"], { cwd: directory });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("AgentShield CI Gate: PASS");
      expect(existsSync(sarifPath)).toBe(true);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("refuses to overwrite SARIF unless force is passed", () => {
    const directory = tempDirectory();
    const sarifPath = join(directory, "agentshield.sarif.json");

    try {
      writeFileSync(sarifPath, "{}");

      const blocked = runCli(["bench", "--sarif", "agentshield.sarif.json"], { cwd: directory });
      const forced = runCli(["bench", "--sarif", "agentshield.sarif.json", "--force"], { cwd: directory });

      expect(blocked.exitCode).toBe(1);
      expect(blocked.stderr).toContain("failed to write SARIF report");
      expect(forced.exitCode).toBe(0);
      expect(JSON.parse(readFileSync(sarifPath, "utf8"))).toMatchObject({ version: "2.1.0" });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("evidence export with CI still verifies", () => {
    const directory = tempDirectory();
    const evidencePath = join(directory, "ci-evidence.json");

    try {
      const result = runCli(["bench", "--ci", "--evidence", "ci-evidence.json"], { cwd: directory });

      expect(result.exitCode).toBe(0);
      expect(readFileSync(evidencePath, "utf8")).not.toContain("sk-test-REDACT-ME");
      expect(runCli(["verify-trace", "ci-evidence.json"], { cwd: directory }).exitCode).toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("runs demo-run with human-readable output", () => {
    const result = runCli(["demo-run"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Scenario: Secret Exfiltration");
    expect(result.stdout).toContain("Status: PASS");
  });

  it("runs demo-run with valid JSON output", () => {
    const result = runCli(["demo-run", "--format", "json"]);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      failed: 0,
      total: 5
    });
    expect(result.stdout).not.toContain("sk-test-REDACT-ME");
  });

  it("runs demo-run with HTML output", () => {
    const result = runCli(["demo-run", "--format", "html"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("<!doctype html>");
    expect(result.stdout).toContain("Secret Exfiltration");
  });

  it("writes demo-run HTML output to a file", () => {
    const directory = tempDirectory();

    try {
      const result = runCli(["demo-run", "--format", "html", "--out", "demo-report.html"], { cwd: directory });

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toBe("wrote demo report to demo-report.html");
      expect(readFileSync(join(directory, "demo-report.html"), "utf8")).toContain("AgentShield Demo Report");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("writes and verifies demo-run evidence", () => {
    const directory = tempDirectory();
    const evidencePath = join(directory, "demo-evidence.json");

    try {
      const result = runCli(["demo-run", "--evidence", "demo-evidence.json"], { cwd: directory });

      expect(result.exitCode).toBe(0);
      const evidence = readFileSync(evidencePath, "utf8");
      expect(evidence).not.toContain("sk-test-REDACT-ME");
      expect(JSON.parse(evidence)).toMatchObject({
        product: "AgentShield Veritas",
        verification: { valid: true }
      });
      expect(runCli(["verify-trace", "demo-evidence.json"], { cwd: directory }).exitCode).toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("runs mcp-demo with human-readable output", () => {
    const result = runCli(["mcp-demo"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Scenario: filesystem.read allowed");
    expect(result.stdout).toContain("Status: PASS");
  });

  it("runs mcp-demo with JSON output", () => {
    const result = runCli(["mcp-demo", "--format", "json"]);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      total: 4,
      failed: 0
    });
    expect(result.stdout).not.toContain("sk-test-REDACT-ME");
  });

  it("runs mcp-proxy-demo with human-readable output", () => {
    const result = runCli(["mcp-proxy-demo"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("tools/list succeeds");
    expect(result.stdout).toContain("Status: PASS");
  });

  it("mcp-conformance CLI works in text/json/markdown", () => {
    const text = runCli(["mcp-conformance"]);
    const json = runCli(["mcp-conformance", "--format", "json"]);
    const markdown = runCli(["mcp-conformance", "--format", "markdown"]);

    expect(text.exitCode).toBe(0);
    expect(text.stdout).toContain("MCP Conformance");
    expect(json.exitCode).toBe(0);
    expect(JSON.parse(json.stdout)).toMatchObject({ profile: "mock-mcp-stdio", failed: 0 });
    expect(markdown.exitCode).toBe(0);
    expect(markdown.stdout).toContain("AgentShield MCP Conformance");
    expect(markdown.stdout).not.toContain("sk-test-REDACT-ME");
  });

  it("conformance command works with strict v2 policy", () => {
    const result = runCli(["mcp-conformance", "--policy", "examples/policies/strict.policy.json"], {
      cwd: join(process.cwd(), "..", "..")
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("MCP Conformance");
  });

  it("runs mcp-proxy-demo with JSON output", () => {
    const result = runCli(["mcp-proxy-demo", "--format", "json"]);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ total: 7, failed: 0 });
    expect(result.stdout).not.toContain("sk-test-REDACT-ME");
  });

  it("runs controlled mcp stdio demo with JSON output", () => {
    const result = runCli(["mcp-stdio-demo", "--format", "json"]);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ total: 7, failed: 0 });
    expect(result.stdout).not.toContain("sk-test-REDACT-ME");
  });

  it("writes and verifies controlled mcp stdio evidence", () => {
    const directory = tempDirectory();
    const evidencePath = join(directory, "stdio-evidence.json");

    try {
      const result = runCli(["mcp-stdio-demo", "--evidence", "stdio-evidence.json"], { cwd: directory });

      expect(result.exitCode).toBe(0);
      expect(readFileSync(evidencePath, "utf8")).not.toContain("sk-test-REDACT-ME");
      expect(readFileSync(evidencePath, "utf8")).toContain("process_started");
      expect(runCli(["verify-trace", "stdio-evidence.json"], { cwd: directory }).exitCode).toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("runs SDK demo with text and JSON output", () => {
    const text = runCli(["sdk", "demo"], { cwd: join(process.cwd(), "..", "..") });
    const json = runCli(["sdk", "demo", "--format", "json"], { cwd: join(process.cwd(), "..", "..") });

    expect(text.exitCode).toBe(0);
    expect(text.stdout).toContain("AgentShield SDK Demo");
    expect(json.exitCode).toBe(0);
    expect(JSON.parse(json.stdout)).toMatchObject({ evidenceValid: true });
    expect(json.stdout).not.toContain("sk-test-REDACT-ME");
  });



  it("doctor command text output works", () => {
    const result = runCli(["doctor"], { cwd: join(process.cwd(), "..", "..") });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield doctor: PASS");
  });

  it("doctor command JSON output works", () => {
    const result = runCli(["doctor", "--format", "json"], { cwd: join(process.cwd(), "..", "..") });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: true });
  });

  it("workspace validate CLI text works", () => {
    const result = runCli(["workspace", "validate", "examples/workspace/agentshield.workspace.json"], {
      cwd: join(process.cwd(), "..", "..")
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield workspace validation: PASS");
  });

  it("workspace doctor CLI text works", () => {
    const result = runCli(["workspace", "doctor", "examples/workspace/agentshield.workspace.json"], {
      cwd: join(process.cwd(), "..", "..")
    });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield workspace doctor: PASS");
  });

  it("workspace doctor CLI JSON works", () => {
    const result = runCli(["workspace", "doctor", "examples/workspace/agentshield.workspace.json", "--format", "json"], {
      cwd: join(process.cwd(), "..", "..")
    });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: true });
  });

  it("CLI perf text works", () => {
    const result = runCli(["perf"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield Performance: PASS");
  });

  it("CLI perf JSON works", () => {
    const result = runCli(["perf", "--format", "json"]);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ profile: "balanced" });
  });

  it("CLI perf markdown works", () => {
    const result = runCli(["perf", "--format", "markdown"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield Performance Report");
    expect(result.stdout).toContain("policy v1 evaluation");
  });

  it("CLI policy-test works", () => {
    const result = runCli(["policy-test", "examples/policy-tests/strict.policy-test.json"], { cwd: join(process.cwd(), "..", "..") });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield Policy Tests: PASS");
  });

  it("CLI policy-test JSON output works", () => {
    const result = runCli(["policy-test", "examples/policy-tests/strict.policy-test.json", "--format", "json"], { cwd: join(process.cwd(), "..", "..") });

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ failed: 0 });
  });

  it("CLI policy-test Markdown output works", () => {
    const result = runCli(["policy-test", "examples/policy-tests/strict.policy-test.json", "--format", "markdown"], { cwd: join(process.cwd(), "..", "..") });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield Policy Test Report");
  });

  it("CLI policy-audit text works", () => {
    const result = runCli(["policy-audit", "examples/policies/strict.policy.json"], { cwd: join(process.cwd(), "..", "..") });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield policy audit: PASS");
  });

  it("CLI policy-audit JSON works", () => {
    const result = runCli(["policy-audit", "examples/policies/strict.policy.json", "--format", "json"], { cwd: join(process.cwd(), "..", "..") });

    expect(result.exitCode).toBe(0);
    expect((JSON.parse(result.stdout) as PolicyAuditCliJson).summary).toMatchObject({ passed: true });
  });

  it("CLI policy-audit Markdown works", () => {
    const result = runCli(["policy-audit", "examples/policies/strict.policy.json", "--format", "markdown"], { cwd: join(process.cwd(), "..", "..") });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield Policy Audit");
  });

  it("policy-pack list CLI works", () => {
    const result = runCli(["policy-pack", "list"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("strict-mcp-local");
  });

  it("policy-pack show text works", () => {
    const result = runCli(["policy-pack", "show", "strict-mcp-local"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Policy pack: strict-mcp-local");
  });

  it("policy-pack show JSON works", () => {
    const result = runCli(["policy-pack", "show", "strict-mcp-local", "--format", "json"]);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ packId: "strict-mcp-local", policy: { version: 2 } });
  });

  it("policy-pack audit text works", () => {
    const result = runCli(["policy-pack", "audit", "strict-mcp-local"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield policy pack audit: PASS");
  });

  it("policy-pack audit JSON works", () => {
    const result = runCli(["policy-pack", "audit", "enterprise-sensitive-data", "--format", "json"]);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: true, pack: { packId: "enterprise-sensitive-data" } });
  });

  it("policy-pack init refuses overwrite without force and writes with force", () => {
    const directory = tempDirectory();
    const policyPath = join(directory, "generated-pack.policy.json");

    try {
      writeFileSync(policyPath, "existing");
      const refused = runCli(["policy-pack", "init", "strict-mcp-local", "--out", "generated-pack.policy.json"], { cwd: directory });
      const forced = runCli(["policy-pack", "init", "strict-mcp-local", "--out", "generated-pack.policy.json", "--force"], { cwd: directory });

      expect(refused.exitCode).toBe(1);
      expect(forced.exitCode).toBe(0);
      expect(JSON.parse(readFileSync(policyPath, "utf8"))).toMatchObject({ version: 2, defaultDecision: "deny" });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("CLI policy-template list works", () => {
    const result = runCli(["policy-template", "list"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("strict-mcp-local");
  });

  it("CLI policy-template show text works", () => {
    const result = runCli(["policy-template", "show", "strict-mcp-local"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Policy template: strict-mcp-local");
  });

  it("CLI policy-template show JSON works", () => {
    const result = runCli(["policy-template", "show", "strict-mcp-local", "--format", "json"]);

    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({ templateId: "strict-mcp-local", policy: { defaultDecision: "deny" } });
  });

  it("CLI policy-template init works and refuses overwrite without force", () => {
    const directory = tempDirectory();
    const policyPath = join(directory, "generated.policy.json");

    try {
      const created = runCli(["policy-template", "init", "strict-mcp-local", "--out", "generated.policy.json"], { cwd: directory });
      const refused = runCli(["policy-template", "init", "strict-mcp-local", "--out", "generated.policy.json"], { cwd: directory });
      const forced = runCli(["policy-template", "init", "readonly-coding-agent", "--out", "generated.policy.json", "--force"], { cwd: directory });

      expect(created.exitCode).toBe(0);
      expect(JSON.parse(readFileSync(policyPath, "utf8"))).toMatchObject({ version: 2, defaultDecision: "deny" });
      expect(refused.exitCode).toBe(1);
      expect(refused.stderr).toContain("refusing to overwrite");
      expect(forced.exitCode).toBe(0);
      expect(JSON.parse(readFileSync(policyPath, "utf8"))).toMatchObject({ name: "readonly-coding-agent" });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("CLI approval demo works without leaking fake secrets or keys", () => {
    const result = runCli(["approval", "demo"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("Approval Status: valid");
    expect(result.stdout).not.toContain("sk-test-REDACT-ME");
    expect(result.stdout).not.toContain("agentshield-local-demo-approval-key");
  });

  it("CLI approval create, approve, verify, and mcp proxy token path work", () => {
    const directory = tempDirectory();

    try {
      expect(runCli(["approval", "create", "--scenario", "write-then-exec", "--out", "approval-ticket.json"], { cwd: directory }).exitCode).toBe(0);
      expect(
        runCli(
          [
            "approval",
            "approve",
            "approval-ticket.json",
            "--out",
            "approval-token.json",
            "--approver",
            "local-dev",
            "--reason",
            "Reviewed local mock action"
          ],
          { cwd: directory }
        ).exitCode
      ).toBe(0);
      expect(runCli(["approval", "verify", "approval-ticket.json", "approval-token.json"], { cwd: directory }).exitCode).toBe(0);

      const proxy = runCli(["mcp-proxy-demo", "--approval-token", "approval-token.json", "--format", "json"], { cwd: directory });
      expect(proxy.exitCode).toBe(0);
      expect(JSON.parse(proxy.stdout)).toMatchObject({ failed: 0 });
      expect(readFileSync(join(directory, "approval-ticket.json"), "utf8")).not.toContain("sk-test-REDACT-ME");
      expect(readFileSync(join(directory, "approval-token.json"), "utf8")).not.toContain("sk-test-REDACT-ME");
      expect(proxy.stdout).not.toContain("sk-test-REDACT-ME");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("writes and verifies mcp-proxy-demo evidence", () => {
    const directory = tempDirectory();
    const evidencePath = join(directory, "proxy-evidence.json");

    try {
      const result = runCli(["mcp-proxy-demo", "--evidence", "proxy-evidence.json"], { cwd: directory });

      expect(result.exitCode).toBe(0);
      expect(readFileSync(evidencePath, "utf8")).not.toContain("sk-test-REDACT-ME");
      expect(runCli(["verify-trace", "proxy-evidence.json"], { cwd: directory }).exitCode).toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("writes bench JSON output to a file without printing the report", () => {
    const directory = tempDirectory();
    const reportPath = join(directory, "report.json");

    try {
      const result = runCli(["bench", "--format", "json", "--out", "report.json"], { cwd: directory });

      expect(result).toMatchObject({
        exitCode: 0,
        stdout: "wrote benchmark report to report.json"
      });
      expect(JSON.parse(readFileSync(reportPath, "utf8"))).toMatchObject({
        failed: 0,
        total: 82
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("writes bench HTML output to a file", () => {
    const directory = tempDirectory();

    try {
      const result = runCli(["bench", "--format", "html", "--out", "report.html"], { cwd: directory });

      expect(result.exitCode).toBe(0);
      expect(readFileSync(join(directory, "report.html"), "utf8")).toContain("AgentShield Bench Report");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("writes and verifies bench evidence", () => {
    const directory = tempDirectory();
    const evidencePath = join(directory, "bench-evidence.json");

    try {
      const result = runCli(["bench", "--format", "json", "--evidence", "bench-evidence.json"], { cwd: directory });

      expect(result.exitCode).toBe(0);
      expect(JSON.parse(readFileSync(evidencePath, "utf8"))).toMatchObject({
        product: "AgentShield Veritas",
        verification: { valid: true }
      });
      expect(runCli(["verify-trace", "bench-evidence.json"], { cwd: directory }).exitCode).toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("fails verify-trace for tampered evidence", () => {
    const directory = tempDirectory();
    const evidencePath = join(directory, "demo-evidence.json");

    try {
      expect(runCli(["demo-run", "--evidence", "demo-evidence.json"], { cwd: directory }).exitCode).toBe(0);
      const bundle = JSON.parse(readFileSync(evidencePath, "utf8")) as { events: Array<{ data: Record<string, unknown> }> };
      bundle.events[0]!.data.tampered = true;
      writeFileSync(evidencePath, JSON.stringify(bundle, null, 2));

      const result = runCli(["verify-trace", "demo-evidence.json"], { cwd: directory });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain("trace invalid");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("does not overwrite bench output without force", () => {
    const directory = tempDirectory();
    const reportPath = join(directory, "report.json");

    try {
      writeFileSync(reportPath, "existing");

      const result = runCli(["bench", "--out", "report.json"], { cwd: directory });

      expect(result.exitCode).toBe(1);
      expect(readFileSync(reportPath, "utf8")).toBe("existing");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("runs bench with HTML output", () => {
    const result = runCli(["bench", "--format", "html"]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("<!doctype html>");
    expect(result.stdout).toContain("Write Then Exec");
  });

  it("validates a policy JSON file", () => {
    const directory = tempDirectory();
    const policyPath = join(directory, "policy.json");

    writeFileSync(
      policyPath,
      JSON.stringify({
        version: 1,
        defaultDecision: "deny",
        rules: []
      })
    );

    try {
      expect(runCli(["check", policyPath])).toMatchObject({
        exitCode: 0,
        stdout: "policy valid"
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("CLI check validates v2 policy", () => {
    const directory = tempDirectory();
    const policyPath = join(directory, "policy.json");

    writeFileSync(
      policyPath,
      JSON.stringify({
        version: 2,
        name: "test",
        defaultDecision: "deny",
        mode: "strict",
        rules: [
          {
            id: "allow-read",
            effect: "allow",
            priority: 1,
            match: { capability: "filesystem.read", resource: { type: "filesystem", allow: ["/mock/project/**"] } }
          }
        ]
      })
    );

    try {
      const result = runCli(["check", policyPath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("version: 2");
      expect(result.stdout).toContain("rule count: 1");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("CLI explain-policy prints deterministic explanation", () => {
    const directory = tempDirectory();
    const policyPath = join(directory, "policy.json");

    writeFileSync(
      policyPath,
      JSON.stringify({
        version: 2,
        name: "test",
        defaultDecision: "deny",
        mode: "strict",
        rules: [
          {
            id: "allow-read",
            effect: "allow",
            priority: 1,
            match: { capability: "filesystem.read", resource: { type: "filesystem", allow: ["/mock/project/**"] } }
          }
        ]
      })
    );

    try {
      const result = runCli(["explain-policy", policyPath]);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("winning rule: allow-read");
      expect(result.stdout).toContain("observed capabilities: filesystem.read");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("rejects invalid policy JSON", () => {
    const directory = tempDirectory();
    const policyPath = join(directory, "policy.json");

    writeFileSync(
      policyPath,
      JSON.stringify({
        version: 1,
        defaultDecision: "allow",
        rules: []
      })
    );

    try {
      expect(runCli(["check", policyPath])).toMatchObject({
        exitCode: 1
      });
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("initializes a sample policy file safely", () => {
    const directory = tempDirectory();
    const policyPath = join(directory, "agentshield.policy.json");

    try {
      expect(runCli(["init"], { cwd: directory })).toMatchObject({
        exitCode: 0,
        stdout: "created agentshield.policy.json"
      });
      expect(existsSync(policyPath)).toBe(true);
      expect(runCli(["check", "agentshield.policy.json"], { cwd: directory }).exitCode).toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("does not overwrite an existing policy unless force is passed", () => {
    const directory = tempDirectory();
    const policyPath = join(directory, "agentshield.policy.json");

    try {
      writeFileSync(policyPath, "existing");

      expect(runCli(["init"], { cwd: directory }).exitCode).toBe(1);
      expect(readFileSync(policyPath, "utf8")).toBe("existing");
      expect(runCli(["init", "--force"], { cwd: directory }).exitCode).toBe(0);
      expect(readFileSync(policyPath, "utf8")).toContain("\"defaultDecision\": \"deny\"");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("prints version", () => {
    expect(runCli(["version"])).toMatchObject({
      exitCode: 0,
      stdout: "0.0.0"
    });
  });

  it("prints demo message", () => {
    expect(runCli(["demo"])).toEqual({
      exitCode: 0,
      stdout: DEMO_MESSAGE,
      stderr: ""
    });
  });

  it("adapter-conformance text works", async () => {
    const cwd = join(process.cwd(), "..", "..");
    const result = await runCliAsync(
      ["adapter-conformance", "examples/custom-adapter/adapter-conformance.json"],
      { cwd }
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("AgentShield Adapter Conformance: PASS");
    expect(result.stdout).not.toContain("sk-test-REDACT-ME");
  });

  it("adapter-conformance json works", async () => {
    const cwd = join(process.cwd(), "..", "..");
    const result = await runCliAsync(
      ["adapter-conformance", "examples/custom-adapter/adapter-conformance.json", "--format", "json"],
      { cwd }
    );
    expect(result.exitCode).toBe(0);
    const report = JSON.parse(result.stdout) as { certificationStatus: string; total: number; passed: number };
    expect(report.certificationStatus).toBe("pass");
    expect(report.total).toBe(10);
    expect(report.passed).toBe(10);
    expect(result.stdout).not.toContain("sk-test-REDACT-ME");
  });

  it("adapter-conformance markdown works", async () => {
    const cwd = join(process.cwd(), "..", "..");
    const result = await runCliAsync(
      ["adapter-conformance", "examples/custom-adapter/adapter-conformance.json", "--format", "markdown"],
      { cwd }
    );
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain("# AgentShield Adapter Conformance Report");
    expect(result.stdout).toContain("PASS");
    expect(result.stdout).not.toContain("sk-test-REDACT-ME");
  });

  it("adapter-conformance --out writes markdown file", async () => {
    const directory = tempDirectory();
    try {
      const cwd = join(process.cwd(), "..", "..");
      const outPath = join(directory, "adapter-conformance-report.md");
      const result = await runCliAsync(
        [
          "adapter-conformance",
          "examples/custom-adapter/adapter-conformance.json",
          "--format", "markdown",
          "--out", outPath
        ],
        { cwd }
      );
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain("adapter-conformance-report.md");
      expect(existsSync(outPath)).toBe(true);
      const content = readFileSync(outPath, "utf8");
      expect(content).toContain("# AgentShield Adapter Conformance Report");
      expect(content).not.toContain("sk-test-REDACT-ME");
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("adapter-conformance missing suite returns exit 1", async () => {
    const result = await runCliAsync(
      ["adapter-conformance", "does-not-exist.json"],
      { cwd: process.cwd() }
    );
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toBeTruthy();
  });

  it("adapter-conformance missing path returns exit 1", async () => {
    const result = await runCliAsync(["adapter-conformance"]);
    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain("suite file path");
  });
});

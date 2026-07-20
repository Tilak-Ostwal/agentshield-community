import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import {
  approvalTicketSchema,
  approvalTokenSchema,
  createUnsignedApprovalToken,
  signApprovalToken,
  verifyApprovalToken,
  type ApprovalTicket
} from "@agentshield/core";
import { defaultProxyDemoPolicy } from "@agentshield/mcp-adapter";
import { McpProxySession } from "@agentshield/mcp-adapter";

import type { CliResult } from "../cli.js";

export const LOCAL_DEMO_APPROVAL_KEY = "agentshield-local-demo-approval-key-not-for-production";
const fakeSecretSentinel = ["sk", "test", "REDACT", "ME"].join("-");

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function resolvePath(cwd: string, filePath: string): string {
  return isAbsolute(filePath) ? filePath : resolve(cwd, filePath);
}

function writeJson(path: string, value: unknown, force: boolean): void {
  if (!force && existsSync(path)) {
    throw new Error(`${path} already exists; pass --force to overwrite`);
  }

  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function createMcpWriteApprovalTicket(): ApprovalTicket {
  const session = new McpProxySession({
    config: {
      mode: "mock",
      maxMessageBytes: 1024 * 1024,
      allowMethods: ["initialize", "initialized", "ping", "tools/list", "tools/call"]
    },
    policy: defaultProxyDemoPolicy(),
    sessionId: "mcp_proxy_demo",
    approvalSigningKey: LOCAL_DEMO_APPROVAL_KEY,
    now: () => new Date("2026-06-26T00:00:00.000Z")
  });
  const prefixRequests = [
    { jsonrpc: "2.0", id: "init", method: "initialize", params: {} },
    { jsonrpc: "2.0", id: "list", method: "tools/list" },
    {
      jsonrpc: "2.0",
      id: "read",
      method: "tools/call",
      params: { name: "filesystem.read", arguments: { path: "/mock/project/README.md" } }
    },
    { jsonrpc: "2.0", id: "unknown", method: "tools/call", params: { name: "unknown.tool", arguments: {} } },
    {
      jsonrpc: "2.0",
      id: "network",
      method: "tools/call",
      params: { name: "network.post", arguments: { url: "https://example.invalid/collect", token: fakeSecretSentinel } }
    }
  ];

  for (const request of prefixRequests) {
    session.handle(request);
  }

  const response = session.handle({
    jsonrpc: "2.0",
    id: "write",
    method: "tools/call",
    params: {
      name: "filesystem.write",
      arguments: { path: "/mock/project/out.txt", content: "safe mock content" }
    }
  });
  const ticket = typeof response.error?.data === "object" && response.error.data !== null ? (response.error.data as Record<string, unknown>).approvalTicket : undefined;
  return approvalTicketSchema.parse(ticket);
}

export function runApprovalCreateCommand(args: string[], cwd: string): CliResult {
  const scenario = argValue(args, "--scenario");
  const out = argValue(args, "--out");

  if (scenario !== "write-then-exec") {
    return { exitCode: 1, stdout: "", stderr: "approval create --scenario must be write-then-exec" };
  }
  if (out === undefined || out.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "approval create --out requires a file path" };
  }

  const ticket = createMcpWriteApprovalTicket();
  writeJson(resolvePath(cwd, out), ticket, args.includes("--force"));
  return { exitCode: 0, stdout: `approval ticket written: ${out}`, stderr: "" };
}

export function runApprovalApproveCommand(args: string[], cwd: string): CliResult {
  const [ticketPath] = args;
  const out = argValue(args, "--out");
  const approver = argValue(args, "--approver");
  const reason = argValue(args, "--reason");

  if (ticketPath === undefined || ticketPath.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "approval approve requires a ticket file" };
  }
  if (out === undefined || out.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "approval approve --out requires a file path" };
  }
  if (approver === undefined || approver.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "approval approve --approver requires a value" };
  }
  if (reason === undefined || reason.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "approval approve --reason requires a value" };
  }

  const ticket = approvalTicketSchema.parse(JSON.parse(readFileSync(resolvePath(cwd, ticketPath), "utf8")));
  const unsigned = createUnsignedApprovalToken({
    ticket,
    approvedDecision: args.includes("--deny") ? "deny" : "allow",
    approver,
    reason,
    issuedAt: "2026-06-26T00:00:01.000Z"
  });
  const token = signApprovalToken(unsigned, LOCAL_DEMO_APPROVAL_KEY);

  writeJson(resolvePath(cwd, out), token, args.includes("--force"));
  return { exitCode: 0, stdout: `approval token written: ${out}`, stderr: "" };
}

export function runApprovalVerifyCommand(args: string[], cwd: string): CliResult {
  const [ticketPath, tokenPath] = args;

  if (ticketPath === undefined || tokenPath === undefined || ticketPath.startsWith("--") || tokenPath.startsWith("--")) {
    return { exitCode: 1, stdout: "", stderr: "approval verify requires ticket and token files" };
  }

  const ticket = approvalTicketSchema.parse(JSON.parse(readFileSync(resolvePath(cwd, ticketPath), "utf8")));
  const token = approvalTokenSchema.parse(JSON.parse(readFileSync(resolvePath(cwd, tokenPath), "utf8")));
  const verification = verifyApprovalToken({
    ticket,
    token,
    signingKey: LOCAL_DEMO_APPROVAL_KEY,
    now: new Date("2026-06-26T00:00:02.000Z")
  });

  if (verification.status !== "valid") {
    return { exitCode: 1, stdout: "", stderr: `approval token ${verification.status}: ${verification.reason}` };
  }

  return { exitCode: 0, stdout: "approval token valid", stderr: "" };
}

export function runApprovalDemoCommand(): CliResult {
  const ticket = createMcpWriteApprovalTicket();
  const token = signApprovalToken(
    createUnsignedApprovalToken({
      ticket,
      approvedDecision: "allow",
      approver: "local-dev",
      reason: "Reviewed local mock action",
      issuedAt: "2026-06-26T00:00:01.000Z"
    }),
    LOCAL_DEMO_APPROVAL_KEY
  );
  const verification = verifyApprovalToken({
    ticket,
    token,
    signingKey: LOCAL_DEMO_APPROVAL_KEY,
    now: new Date("2026-06-26T00:00:02.000Z")
  });

  return {
    exitCode: verification.status === "valid" ? 0 : 1,
    stdout: [
      "AgentShield approval demo",
      `Ticket: ${ticket.ticketId}`,
      `Action Hash: ${ticket.actionHash}`,
      `Approval Status: ${verification.status}`,
      "Signing key: local fake demo key (not printed, not for production)"
    ].join("\n"),
    stderr: ""
  };
}

export function runApprovalCommand(args: string[], cwd: string): CliResult {
  const [subcommand, ...subArgs] = args;

  switch (subcommand) {
    case "create":
      return runApprovalCreateCommand(subArgs, cwd);
    case "approve":
      return runApprovalApproveCommand(subArgs, cwd);
    case "verify":
      return runApprovalVerifyCommand(subArgs, cwd);
    case "demo":
      return runApprovalDemoCommand();
    default:
      return { exitCode: 1, stdout: "", stderr: "approval command must be create, approve, verify, or demo" };
  }
}

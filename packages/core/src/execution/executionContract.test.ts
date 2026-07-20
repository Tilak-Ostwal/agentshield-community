import { describe, expect, it } from "vitest";

import { createExecutionContract } from "./executionContract.js";

const action = {
  actionId: "read",
  timestamp: "2026-06-27T00:00:00.000Z",
  actionType: "tool_call",
  toolName: "filesystem.read",
  input: { path: "/mock/project/README.md" }
};

describe("execution contract", () => {
  it("creates deterministic execution contract shape", () => {
    const contract = createExecutionContract({
      action,
      actionHash: "hash_1",
      decision: "allow",
      allowedSideEffects: ["local_read"],
      reason: "allowed read"
    });

    expect(contract).toMatchObject({
      version: 1,
      actionId: "read",
      actionHash: "hash_1",
      toolName: "filesystem.read",
      allowedSideEffects: ["local_read"]
    });
    expect(contract.contractId).toContain("execution_contract_");
  });
});

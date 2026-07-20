import { describe, expect, it } from "vitest";

import { SideEffectLedger } from "./sideEffectLedger.js";

describe("side effect ledger", () => {
  it("records forwarded false for blocked action", () => {
    const ledger = new SideEffectLedger("ledger_1", "trace_1");
    ledger.record({
      actionId: "blocked",
      actionHash: "hash",
      toolName: "network.post",
      decision: "deny",
      sideEffectsAllowed: [],
      sideEffectsObserved: ["network_write"],
      forwarded: false,
      dryRun: false,
      timestamp: "2026-06-27T00:00:00.000Z"
    });

    expect(ledger.snapshot().entries[0]).toMatchObject({ forwarded: false, decision: "deny" });
  });

  it("records dryRun true for dry-run", () => {
    const ledger = new SideEffectLedger("ledger_1", "trace_1");
    ledger.record({
      actionId: "read",
      actionHash: "hash",
      toolName: "filesystem.read",
      decision: "allow",
      sideEffectsAllowed: ["local_read"],
      sideEffectsObserved: ["local_read"],
      forwarded: false,
      dryRun: true,
      timestamp: "2026-06-27T00:00:00.000Z"
    });

    expect(ledger.snapshot().entries[0]).toMatchObject({ forwarded: false, dryRun: true });
  });
});

import { createHash } from "node:crypto";

import { canonicalJson } from "../evidence/canonicalJson.js";
import { redactSecrets } from "../redaction/redactor.js";
import type { SideEffect } from "./sideEffectTypes.js";

export interface SideEffectLedgerEntry {
  entryId: string;
  actionId: string;
  actionHash: string;
  toolName: string;
  decision: "allow" | "deny" | "require_human_review";
  sideEffectsAllowed: SideEffect[];
  sideEffectsObserved: SideEffect[];
  forwarded: boolean;
  dryRun: boolean;
  timestamp: string;
  evidenceRootHash?: string | null;
}

export interface SideEffectLedgerSnapshot {
  ledgerId: string;
  traceId: string;
  entries: SideEffectLedgerEntry[];
}

export class SideEffectLedger {
  private readonly entries: SideEffectLedgerEntry[] = [];

  public constructor(public readonly ledgerId: string, public readonly traceId: string) {}

  public record(input: Omit<SideEffectLedgerEntry, "entryId">): SideEffectLedgerEntry {
    const entryId = `ledger_entry_${createHash("sha256").update(canonicalJson(redactSecrets({ ...input, index: this.entries.length + 1 }).value)).digest("hex").slice(0, 24)}`;
    const entry = { ...input, entryId };
    this.entries.push(entry);
    return structuredClone(entry);
  }

  public snapshot(): SideEffectLedgerSnapshot {
    return {
      ledgerId: this.ledgerId,
      traceId: this.traceId,
      entries: this.entries.map((entry) => structuredClone(entry))
    };
  }
}

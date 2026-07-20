import { SessionState, type Policy } from "@agentshield/core";

import { InMemoryFingerprintStore } from "../fingerprint/inMemoryFingerprintStore.js";
import { InMemoryTraceRecorder } from "../trace/inMemoryTraceRecorder.js";
import { AttackGraphEngine } from "../attackGraph/attackGraphEngine.js";
import { RuntimeTaintStore } from "../taint/runtimeTaintStore.js";
import { EvidenceTraceRecorder } from "../evidence/evidenceTraceRecorder.js";
import type { LocalToolRegistry } from "@agentshield/registry";
import { SideEffectLedger } from "@agentshield/core";

export interface RuntimeContext {
  policy: unknown;
  session: SessionState;
  traceRecorder: InMemoryTraceRecorder;
  fingerprintStore: InMemoryFingerprintStore;
  attackGraphEngine: AttackGraphEngine;
  taintStore: RuntimeTaintStore;
  toolRegistry?: LocalToolRegistry;
  executionLedger: SideEffectLedger;
  runtimeId: string;
  traceId: string;
  now: () => Date;
  nextEventId: () => string;
}

export interface RuntimeContextOptions {
  policy?: Policy | unknown;
  sessionId?: string;
  runtimeId?: string;
  traceId?: string;
  traceRecorder?: InMemoryTraceRecorder;
  fingerprintStore?: InMemoryFingerprintStore;
  attackGraphEngine?: AttackGraphEngine;
  taintStore?: RuntimeTaintStore;
  toolRegistry?: LocalToolRegistry;
  now?: () => Date;
}

export function createRuntimeContext(options: RuntimeContextOptions = {}): RuntimeContext {
  const sessionId = options.sessionId ?? "session_01";
  let eventCounter = 0;

  return {
    policy: options.policy,
    session: new SessionState(sessionId),
    traceRecorder: options.traceRecorder ?? new EvidenceTraceRecorder(),
    fingerprintStore: options.fingerprintStore ?? new InMemoryFingerprintStore(),
    attackGraphEngine: options.attackGraphEngine ?? new AttackGraphEngine(),
    taintStore: options.taintStore ?? new RuntimeTaintStore(),
    ...(options.toolRegistry === undefined ? {} : { toolRegistry: options.toolRegistry }),
    executionLedger: new SideEffectLedger(`execution_ledger_${sessionId}`, options.traceId ?? `trace_${sessionId}`),
    runtimeId: options.runtimeId ?? "runtime",
    traceId: options.traceId ?? `trace_${sessionId}`,
    now: options.now ?? (() => new Date()),
    nextEventId: () => {
      eventCounter += 1;
      return `event_${eventCounter.toString().padStart(6, "0")}`;
    }
  };
}

import { createHash } from "node:crypto";

import { canonicalJson } from "./canonicalJson.js";

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function hashCanonical(value: unknown): string {
  return sha256Hex(canonicalJson(value));
}

export function withoutEventHash<T extends { eventHash?: string }>(event: T): Omit<T, "eventHash"> {
  const { eventHash: _eventHash, ...rest } = event;
  return rest;
}

export function computeEventHash(event: { eventHash?: string }): string {
  return hashCanonical(withoutEventHash(event));
}

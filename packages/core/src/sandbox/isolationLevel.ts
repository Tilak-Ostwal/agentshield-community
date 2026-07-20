export const ISOLATION_LEVELS = [
  "none",
  "readonly",
  "write_limited",
  "network_blocked",
  "network_allowlisted",
  "dry_run_only",
  "blocked"
] as const;

export type IsolationLevel = (typeof ISOLATION_LEVELS)[number];

export function isIsolationLevel(value: unknown): value is IsolationLevel {
  return typeof value === "string" && (ISOLATION_LEVELS as readonly string[]).includes(value);
}

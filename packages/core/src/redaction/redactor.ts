import type { TraceRedaction } from "../trace/traceEvent.js";

export const REDACTED_VALUE = "[REDACTED]";

const SECRET_KEY_NAMES = new Set([
  "password",
  "token",
  "apikey",
  "api_key",
  "secret",
  "authorization",
  "cookie"
]);

const FAKE_SECRET_SENTINEL = ["sk", "test", "REDACT", "ME"].join("-");

const SECRET_VALUE_PATTERNS = [
  new RegExp(`\\b${FAKE_SECRET_SENTINEL}\\b`, "g"),
  /\b(?:api[_-]?key|token|password|secret)\s*[:=]\s*["']?[^"'\s,;}]+/gi,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{10,}/g,
  /\bsk-[A-Za-z0-9]{16,}\b/g,
  /\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{10,}\b/g,
  /\b(?:postgres|postgresql|mysql|mongodb):\/\/[^\s"'<>]+/gi
];

export interface RedactionResult<T = unknown> {
  value: T;
  redactions: TraceRedaction[];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

function shouldRedactKey(key: string): boolean {
  return SECRET_KEY_NAMES.has(key.toLowerCase());
}

function redactString(value: string, field: string, redactions: TraceRedaction[]): string {
  let redacted = value;

  for (const pattern of SECRET_VALUE_PATTERNS) {
    redacted = redacted.replace(pattern, () => {
      redactions.push({
        field,
        reason: "secret",
        strategy: "replace"
      });
      return REDACTED_VALUE;
    });
  }

  return redacted;
}

function redactValue(value: unknown, field: string, redactions: TraceRedaction[]): unknown {
  if (typeof value === "string") {
    return redactString(value, field, redactions);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => redactValue(item, `${field}.${index}`, redactions));
  }

  if (isPlainObject(value)) {
    const output: Record<string, unknown> = {};

    for (const [key, childValue] of Object.entries(value)) {
      const childField = `${field}.${key}`;

      if (shouldRedactKey(key)) {
        output[key] = REDACTED_VALUE;
        redactions.push({
          field: childField,
          reason: "secret",
          strategy: "replace"
        });
        continue;
      }

      output[key] = redactValue(childValue, childField, redactions);
    }

    return output;
  }

  return value;
}

export function redactSecrets<T = unknown>(input: T): RedactionResult<T> {
  const redactions: TraceRedaction[] = [];
  const value = redactValue(input, "data", redactions) as T;

  return {
    value,
    redactions
  };
}

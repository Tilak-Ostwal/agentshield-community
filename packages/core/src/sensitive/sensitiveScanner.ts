import { z } from "zod";

import { REDACTED_VALUE, redactSecrets } from "../redaction/redactor.js";

export const sensitiveKindSchema = z.enum(["fake_secret_sentinel", "api_key", "jwt", "database_url"]);
export type SensitiveKind = z.infer<typeof sensitiveKindSchema>;

export const sinkDispositionSchema = z.enum(["allow", "review", "deny"]);
export type SinkDisposition = z.infer<typeof sinkDispositionSchema>;

export const sinkTypeSchema = z.enum(["local", "external", "unknown"]);
export type SinkType = z.infer<typeof sinkTypeSchema>;

export const sensitiveScanInputSchema = z
  .object({
    payload: z.unknown(),
    sink: z
      .object({
        type: sinkTypeSchema,
        name: z.string().min(1)
      })
      .strict()
      .optional()
  })
  .strict();

export type SensitiveScanInput = z.infer<typeof sensitiveScanInputSchema>;

export interface SensitiveFinding {
  readonly kind: SensitiveKind;
  readonly path: string;
  readonly redactedSample: string;
}

export interface SensitiveScanResult {
  readonly findings: readonly SensitiveFinding[];
  readonly disposition: SinkDisposition;
  readonly redactedPayload: unknown;
  readonly redactions: readonly {
    readonly field: string;
    readonly reason: string;
    readonly strategy: string;
  }[];
}

const FAKE_SECRET_SENTINEL = ["sk", "test", "REDACT", "ME"].join("-");

const SENSITIVE_PATTERNS: readonly {
  readonly kind: SensitiveKind;
  readonly pattern: RegExp;
}[] = [
  {
    kind: "fake_secret_sentinel",
    pattern: new RegExp(`\\b${FAKE_SECRET_SENTINEL}\\b`, "g")
  },
  {
    kind: "api_key",
    pattern: /\bsk-[A-Za-z0-9]{16,}\b/g
  },
  {
    kind: "jwt",
    pattern: /\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{10,}\b/g
  },
  {
    kind: "database_url",
    pattern: /\b(?:postgres|postgresql|mysql|mongodb):\/\/[^\s"'<>]+/gi
  }
];

function collectStringFindings(value: string, path: string): SensitiveFinding[] {
  const findings: SensitiveFinding[] = [];

  for (const candidate of SENSITIVE_PATTERNS) {
    const pattern = new RegExp(candidate.pattern.source, candidate.pattern.flags);
    let match = pattern.exec(value);

    while (match !== null) {
      findings.push({
        kind: candidate.kind,
        path,
        redactedSample: REDACTED_VALUE
      });
      match = pattern.exec(value);
    }
  }

  return findings;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectFindings(value: unknown, path: string): SensitiveFinding[] {
  if (typeof value === "string") {
    return collectStringFindings(value, path);
  }

  if (Array.isArray(value)) {
    return value.flatMap((item, index) => collectFindings(item, `${path}.${index}`));
  }

  if (isRecord(value)) {
    return Object.entries(value).flatMap(([key, child]) => collectFindings(child, `${path}.${key}`));
  }

  return [];
}

function dispositionFor(findings: readonly SensitiveFinding[], sinkType: SinkType): SinkDisposition {
  if (findings.length === 0) {
    return "allow";
  }

  if (sinkType === "external" || sinkType === "unknown") {
    return "deny";
  }

  return "review";
}

export function scanSensitive(input: unknown): SensitiveScanResult {
  const parsed = sensitiveScanInputSchema.parse(input);
  const redacted = redactSecrets(parsed.payload);
  const findings = collectFindings(parsed.payload, "payload");
  const sinkType = parsed.sink?.type ?? "unknown";

  return {
    findings,
    disposition: dispositionFor(findings, sinkType),
    redactedPayload: redacted.value,
    redactions: redacted.redactions
  };
}

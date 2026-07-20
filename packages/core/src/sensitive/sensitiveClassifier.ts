import type { SensitiveCategory } from "./sensitiveDataTypes.js";

export interface ClassifierMatch {
  type: SensitiveCategory;
  confidence: "low" | "medium" | "high";
  evidence: "key_name" | "value_pattern" | "path_pattern";
}

const KEY_PATTERNS = [
  { pattern: /password|pass|passwd/i, type: "password" as const },
  { pattern: /token/i, type: "session_token" as const },
  { pattern: /apikey|api_key/i, type: "api_key" as const },
  { pattern: /secret|clientsecret/i, type: "env_secret" as const },
  { pattern: /privatekey|private_key/i, type: "private_key" as const },
  { pattern: /authorization/i, type: "auth_header" as const },
  { pattern: /cookie|session/i, type: "cookie" as const },
  { pattern: /databaseurl/i, type: "database_url" as const },
  { pattern: /webhookurl/i, type: "webhook_url" as const }
];

const VALUE_PATTERNS = [
  { pattern: /^Bearer\s+[a-zA-Z0-9\-_]+$/, type: "bearer_token" as const },
  { pattern: /^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/, type: "jwt" as const },
  { pattern: /-----BEGIN PRIVATE KEY-----/, type: "private_key" as const },
  { pattern: /-----BEGIN RSA PRIVATE KEY-----/, type: "ssh_key" as const },
  { pattern: /^sk-[a-zA-Z0-9]{20,}$/, type: "api_key" as const },
  { pattern: /^[a-zA-Z][a-zA-Z0-9+-.]*:\/\/[^\s]+:[^\s]+@[^\s]+\/[^\s]+$/, type: "database_url" as const },
  { pattern: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/, type: "email_address" as const },
  { pattern: /^\+?[1-9]\d{1,14}$/, type: "phone_number" as const }, // E.164
  { pattern: /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/, type: "credit_card_like" as const }, // Basic CC regex
  { pattern: new RegExp("^" + ["sk", "test", "REDACT", "ME"].join("-") + "$"), type: "unknown_secret_like" as const }
];

const PATH_PATTERNS = [
  { pattern: /\.env$/, type: "sensitive_file_path" as const },
  { pattern: /id_rsa$/, type: "sensitive_file_path" as const },
  { pattern: /credentials\.json$/, type: "sensitive_file_path" as const },
  { pattern: /\.npmrc$/, type: "sensitive_file_path" as const },
  { pattern: /\.pypirc$/, type: "sensitive_file_path" as const },
  { pattern: /kubeconfig$/, type: "sensitive_file_path" as const }
];

export function classifyKey(key: string): ClassifierMatch | null {
  for (const { pattern, type } of KEY_PATTERNS) {
    if (pattern.test(key)) {
      return { type, confidence: "medium", evidence: "key_name" };
    }
  }
  return null;
}

export function classifyValue(value: string): ClassifierMatch | null {
  for (const { pattern, type } of VALUE_PATTERNS) {
    if (pattern.test(value)) {
      let confidence: "low" | "medium" | "high" = "high";
      if (type === "phone_number" || type === "email_address") confidence = "low"; // PII-like is low/medium
      return { type, confidence, evidence: "value_pattern" };
    }
  }
  return null;
}

export function classifyFilePath(path: string): ClassifierMatch | null {
  for (const { pattern, type } of PATH_PATTERNS) {
    if (pattern.test(path)) {
      return { type, confidence: "high", evidence: "path_pattern" };
    }
  }
  return null;
}

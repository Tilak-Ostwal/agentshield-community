import { z } from "zod";

export const sensitiveCategorySchema = z.enum([
  "api_key",
  "bearer_token",
  "jwt",
  "private_key",
  "ssh_key",
  "password",
  "auth_header",
  "cookie",
  "session_token",
  "env_secret",
  "database_url",
  "cloud_access_key",
  "webhook_url",
  "email_address",
  "phone_number",
  "ip_address",
  "credit_card_like",
  "pii_name_like",
  "sensitive_file_path",
  "unknown_secret_like"
]);

export type SensitiveCategory = z.infer<typeof sensitiveCategorySchema>;

export const sensitiveDetectionResultSchema = z.object({
  type: sensitiveCategorySchema,
  confidence: z.enum(["low", "medium", "high"]),
  path: z.string(),
  evidence: z.enum(["key_name", "value_pattern", "path_pattern"]),
  redaction: z.string()
}).strict();

export type SensitiveDetectionResult = z.infer<typeof sensitiveDetectionResultSchema>;

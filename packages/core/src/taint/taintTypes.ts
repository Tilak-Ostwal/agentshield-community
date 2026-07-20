export const TAINT_LABELS = [
  "secret",
  "credential",
  "token",
  "api_key",
  "password",
  "private_user_data",
  "filesystem_sensitive",
  "env_secret",
  "ssh_key",
  "browser_untrusted",
  "network_untrusted",
  "prompt_injection_source",
  "external_content",
  "generated_code",
  "executable_content",
  "pii_possible"
] as const;

export type TaintLabel = (typeof TAINT_LABELS)[number];

export interface TaintSource {
  label: TaintLabel;
  reason: string;
  actionId?: string;
  resource?: string;
}

export interface TaintPropagation {
  labels: TaintLabel[];
  fromActionId?: string;
  resource?: string;
  reason: string;
}

export interface TaintSinkAssessment {
  isSink: boolean;
  severity: "none" | "medium" | "high" | "critical";
  recommendedDecision?: "deny" | "require_human_review";
  reason: string;
  labels: TaintLabel[];
}

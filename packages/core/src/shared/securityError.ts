import { redactSecrets } from "../redaction/redactor.js";

export type SecurityErrorCode =
  | "AGENTSHIELD_SECURITY_ERROR"
  | "VALIDATION_ERROR"
  | "BUNDLE_SCHEMA_INVALID"
  | "BUNDLE_HASH_MISMATCH"
  | "BUNDLE_SIGNATURE_MISMATCH"
  | "POLICY_MIGRATION_INVALID";

export interface SecurityErrorDetails {
  readonly code: SecurityErrorCode;
  readonly message: string;
  readonly details?: unknown;
}

export class AgentShieldSecurityError extends Error {
  public readonly code: SecurityErrorCode;
  public readonly details?: unknown;

  public constructor(input: SecurityErrorDetails) {
    const redactedMessage = redactSecrets(input.message).value;
    super(redactedMessage);
    this.name = "AgentShieldSecurityError";
    this.code = input.code;

    if (input.details !== undefined) {
      this.details = redactSecrets(input.details).value;
    }
  }

  public toJSON(): SecurityErrorDetails {
    const base = {
      code: this.code,
      message: this.message
    };

    if (this.details === undefined) {
      return base;
    }

    return {
      ...base,
      details: this.details
    };
  }
}

export class ValidationError extends AgentShieldSecurityError {
  public constructor(message: string, details?: unknown) {
    super({
      code: "VALIDATION_ERROR",
      message,
      details
    });
    this.name = "ValidationError";
  }
}

export function serializeSecurityError(error: AgentShieldSecurityError): SecurityErrorDetails {
  return error.toJSON();
}

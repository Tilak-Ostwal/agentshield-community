export type PolicyDiagnosticSeverity = "info" | "warning" | "error";

export interface PolicyDiagnostic {
  severity: PolicyDiagnosticSeverity;
  code: string;
  message: string;
  path?: string;
  ruleId?: string;
}

export function hasPolicyErrors(diagnostics: PolicyDiagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === "error");
}

export function formatPolicyDiagnostics(diagnostics: PolicyDiagnostic[]): string[] {
  return diagnostics.map((diagnostic) => {
    const location = diagnostic.ruleId ?? diagnostic.path;
    return `${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}${location === undefined ? "" : ` (${location})`}`;
  });
}

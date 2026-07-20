export function mapSeverity(severity: string): "error" | "warning" | "information" | "hint" {
  switch (severity.toLowerCase()) {
    case "critical":
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
    case "info":
    default:
      return "information";
  }
}

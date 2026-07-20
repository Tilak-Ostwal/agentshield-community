import { detectSensitive } from "./sensitiveDetector.js";


export function evaluateSensitiveFlow(
  toolName: string,
  input: unknown,
  currentDecision: "allow" | "deny" | "require_human_review"
): "allow" | "deny" | "require_human_review" {
  if (currentDecision === "deny") return "deny"; // never weaken

  try {
    const sensitive = detectSensitive(input);
    if (sensitive.length === 0) return currentDecision;

    const isExternalSink = toolName.includes("network") || toolName.includes("github") || toolName.includes("http") || toolName.includes("external");

    if (isExternalSink) {
      let hasPii = false;
      for (const s of sensitive) {
        if (s.type === "email_address" || s.type === "phone_number") {
          hasPii = true;
        } else if (s.confidence === "high" || s.evidence === "key_name") {
          // Secret/credential/token
          return "deny";
        }
      }

      if (hasPii) {
        return "require_human_review";
      }
    }
    
    // sensitive file paths
    if (toolName.includes("read") || toolName.includes("fs")) {
      const hasSensitivePath = sensitive.some(s => s.type === "sensitive_file_path");
      if (hasSensitivePath) {
        return currentDecision === "allow" ? "require_human_review" : currentDecision;
      }
    }

    return currentDecision;
  } catch {
    // Unknown or invalid detector errors must fail closed.
    return "deny";
  }
}

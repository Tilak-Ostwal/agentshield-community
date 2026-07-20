import type { SensitiveDetectionResult } from "./sensitiveDataTypes.js";
import { classifyKey, classifyValue, classifyFilePath } from "./sensitiveClassifier.js";

export function detectSensitive(input: unknown, path = "$"): SensitiveDetectionResult[] {
  const results: SensitiveDetectionResult[] = [];

  if (typeof input === "string") {
    // Check if it's a known sensitive file path
    const pathMatch = classifyFilePath(input);
    if (pathMatch) {
      results.push({
        type: pathMatch.type,
        confidence: pathMatch.confidence,
        path,
        evidence: pathMatch.evidence,
        redaction: `[REDACTED:${pathMatch.type}]`
      });
    }

    // Check if value is sensitive
    const valMatch = classifyValue(input);
    if (valMatch) {
      results.push({
        type: valMatch.type,
        confidence: valMatch.confidence,
        path,
        evidence: valMatch.evidence,
        redaction: `[REDACTED:${valMatch.type}]`
      });
    }
  } else if (Array.isArray(input)) {
    for (let i = 0; i < input.length; i++) {
      results.push(...detectSensitive(input[i], `${path}[${i}]`));
    }
  } else if (typeof input === "object" && input !== null) {
    for (const [key, val] of Object.entries(input)) {
      const childPath = `${path}.${key}`;
      
      const keyMatch = classifyKey(key);
      if (keyMatch && typeof val === "string") {
        results.push({
          type: keyMatch.type,
          confidence: keyMatch.confidence,
          path: childPath,
          evidence: keyMatch.evidence,
          redaction: `[REDACTED:${keyMatch.type}]`
        });
      } else {
        results.push(...detectSensitive(val, childPath));
      }
    }
  }

  return results;
}

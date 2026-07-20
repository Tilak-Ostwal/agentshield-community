
import { classifyKey, classifyValue, classifyFilePath } from "./sensitiveClassifier.js";

export function redactSensitive<T>(input: T): T {
  if (typeof input === "string") {
    // Attempt value match
    const valMatch = classifyValue(input);
    if (valMatch) {
      return `[REDACTED:${valMatch.type}]` as any;
    }
    // Attempt path match
    const pathMatch = classifyFilePath(input);
    if (pathMatch) {
      return `[REDACTED:${pathMatch.type}]` as any;
    }
    // Also strip fake secret sentinel entirely as a hard rule
    const sentinel = ["sk", "test", "REDACT", "ME"].join("-");
    if (input.includes(sentinel)) {
      return input.split(sentinel).join("[REDACTED:unknown_secret_like]") as any;
    }
    return input;
  }
  
  if (Array.isArray(input)) {
    return input.map(item => redactSensitive(item)) as any;
  }
  
  if (typeof input === "object" && input !== null) {
    const redactedObj: Record<string, any> = {};
    for (const [key, val] of Object.entries(input)) {
      const keyMatch = classifyKey(key);
      if (keyMatch && typeof val === "string") {
        redactedObj[key] = `[REDACTED:${keyMatch.type}]`;
      } else {
        redactedObj[key] = redactSensitive(val);
      }
    }
    return redactedObj as any;
  }

  return input;
}

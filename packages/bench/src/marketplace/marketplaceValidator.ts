import { MarketplaceIndexSchema } from "./marketplaceIndexSchema.js";
import { MarketplaceEntrySchema } from "./marketplaceEntrySchema.js";
import { calculateMarketplaceSafetyScore } from "./marketplaceSafetyScore.js";
import * as fs from "fs";
import * as path from "path";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateMarketplaceIndex(indexPath: string, cwd: string): ValidationResult {
  const errors: string[] = [];
  if (!fs.existsSync(indexPath)) {
    return { valid: false, errors: ["Index file not found."] };
  }

  const indexContent = fs.readFileSync(indexPath, "utf-8");
  const parsed = MarketplaceIndexSchema.safeParse(JSON.parse(indexContent));
  if (!parsed.success) {
    return { valid: false, errors: parsed.error.errors.map(e => e.message) };
  }

  const indexDir = path.dirname(indexPath);
  for (const entryRel of parsed.data.entries) {
    const entryPath = path.resolve(indexDir, entryRel);
    const rel = path.relative(cwd, entryPath);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      errors.push(`Entry path out of bounds: ${entryRel}`);
      continue;
    }
    const entryResult = validateMarketplaceEntry(entryPath, cwd);
    if (!entryResult.valid) {
      errors.push(`Entry ${entryRel} invalid: ${entryResult.errors.join(", ")}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateMarketplaceEntry(entryPath: string, cwd: string): ValidationResult {
  if (!fs.existsSync(entryPath)) {
    return { valid: false, errors: ["Entry file not found."] };
  }
  const entryContent = fs.readFileSync(entryPath, "utf-8");
  
  if (entryContent.match(/sk-[a-zA-Z0-9]{32,}/) || entryContent.match(/ghp_[a-zA-Z0-9]{36,}/)) {
    return { valid: false, errors: ["Real-looking secret detected."] };
  }
  const unsafeCommands = ["npm publish", "pnpm publish", "git push", "curl "];
  for (const cmd of unsafeCommands) {
    if (entryContent.includes(cmd)) {
      return { valid: false, errors: [`Unsafe command string detected: ${cmd}`] };
    }
  }

  const parsed = MarketplaceEntrySchema.safeParse(JSON.parse(entryContent));
  if (!parsed.success) {
    return { valid: false, errors: parsed.error.errors.map(e => e.message) };
  }

  const packPath = path.resolve(cwd, parsed.data.packPath);
  if (!fs.existsSync(packPath)) {
    return { valid: false, errors: [`Referenced pack file missing: ${parsed.data.packPath}`] };
  }

  const packContent = fs.readFileSync(packPath, "utf-8");
  const safety = calculateMarketplaceSafetyScore(parsed.data, packContent);
  if (!safety.valid) {
    return { valid: false, errors: safety.notes };
  }

  return { valid: true, errors: [] };
}

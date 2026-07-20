import type { RedteamTemplate } from "./redteamTemplateSchema.js";

export type RedteamBindings = Record<string, string>;

export function variableBindings(template: RedteamTemplate): RedteamBindings[] {
  const entries = Object.entries(template.variables).sort(([left], [right]) => left.localeCompare(right));
  const results: RedteamBindings[] = [{}];

  for (const [name, values] of entries) {
    const next: RedteamBindings[] = [];
    for (const result of results) {
      for (const value of values) {
        next.push({ ...result, [name]: value });
      }
    }
    results.splice(0, results.length, ...next);
  }

  return results;
}

export function renderTemplateString(input: string, bindings: RedteamBindings): string {
  return input.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (substring: string, ...args: unknown[]) => {
    const name = typeof args[0] === "string" ? args[0] : substring;
    if (name === "secret") return "mock-redteam-token";
    return bindings[name] ?? `{{${name}}}`;
  });
}

export function renderTemplateValue(value: unknown, bindings: RedteamBindings): unknown {
  if (typeof value === "string") return renderTemplateString(value, bindings);
  if (Array.isArray(value)) return value.map((item) => renderTemplateValue(item, bindings));
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, renderTemplateValue(item, bindings)]));
  }
  return value;
}

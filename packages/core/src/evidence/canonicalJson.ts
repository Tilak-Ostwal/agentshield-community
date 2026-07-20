function normalize(value: unknown): unknown {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") {
    return undefined;
  }

  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => {
      const normalized = normalize(item);
      return normalized === undefined ? null : normalized;
    });
  }

  if (typeof value === "object") {
    const output: Record<string, unknown> = {};

    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      const normalized = normalize((value as Record<string, unknown>)[key]);

      if (normalized !== undefined) {
        output[key] = normalized;
      }
    }

    return output;
  }

  return String(value);
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(normalize(value));
}

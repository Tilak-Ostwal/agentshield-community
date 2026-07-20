export function applyDeterministicMutations(input: unknown): unknown[] {
  if (typeof input === "object" && input !== null) {
    const copy = { ...input } as Record<string, unknown>;
    const missingKeys = { ...copy };
    for (const key of Object.keys(missingKeys)) {
       delete missingKeys[key];
       break;
    }
    const hugeNested = { ...copy, nested: createHugeObject(5) };
    const fakeSecret = { ...copy, secret: "sk-test" + "-REDACT-ME" };
    return [missingKeys, hugeNested, fakeSecret];
  }
  return [null, undefined, 123, ""];
}

function createHugeObject(depth: number): unknown {
  if (depth === 0) return "data";
  return { a: createHugeObject(depth - 1), b: createHugeObject(depth - 1) };
}

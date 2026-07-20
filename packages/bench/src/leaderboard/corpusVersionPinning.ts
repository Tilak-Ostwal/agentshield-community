import { createHash } from "crypto";

export function pinCorpusHash(corpusVersion: string, scenarioCount: number, categories: string[]): string {
  const payload = JSON.stringify({
    v: corpusVersion,
    c: scenarioCount,
    cat: categories.slice().sort()
  });
  return createHash("sha256").update(payload).digest("hex");
}

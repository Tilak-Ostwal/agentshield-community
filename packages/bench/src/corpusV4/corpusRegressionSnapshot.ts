import { CorpusScenarioMetadata } from "./corpusScenarioMetadata.js";
import crypto from "crypto";

export function generateCorpusSnapshot(corpus: CorpusScenarioMetadata[]) {
  const hash = crypto.createHash("sha256").update(JSON.stringify(corpus)).digest("hex");
  return { version: 4, snapshotHash: hash, count: corpus.length };
}

import { describe, it, expect } from "vitest";
import { generateCorpusSnapshot } from "./corpusRegressionSnapshot.js";
import { generateCorpusV4 } from "./corpusData.js";

describe("corpusRegressionSnapshot", () => {
  it("regression snapshot is deterministic", () => {
    const s1 = generateCorpusSnapshot(generateCorpusV4());
    const s2 = generateCorpusSnapshot(generateCorpusV4());
    expect(s1.snapshotHash).toBe(s2.snapshotHash);
  });
  it("changing scenario metadata changes snapshot hash", () => {
    const s1 = generateCorpusSnapshot(generateCorpusV4());
    const data = generateCorpusV4();
    data[0]!.title = "Changed";
    const s2 = generateCorpusSnapshot(data);
    expect(s1.snapshotHash).not.toBe(s2.snapshotHash);
  });
});

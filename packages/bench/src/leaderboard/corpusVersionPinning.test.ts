import { expect, test } from "vitest";
import { pinCorpusHash } from "./corpusVersionPinning.js";

test("corpus pinning hash is deterministic", () => {
  const hash1 = pinCorpusHash("v3", 100, ["a", "b"]);
  const hash2 = pinCorpusHash("v3", 100, ["b", "a"]);
  expect(hash1).toBe(hash2);
});

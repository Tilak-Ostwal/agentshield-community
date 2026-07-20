import { expect, test } from "vitest";
import { generateBuildArtifactInventory } from "./buildArtifactInventory.js";
import * as path from "path";
import * as fs from "fs";

test("build artifact inventory is deterministic", () => {
  const d = path.resolve(__dirname, "test-artifacts");
  if (!fs.existsSync(d)) fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, "b.txt"), "bbb");
  fs.writeFileSync(path.join(d, "a.txt"), "aaa");
  
  const inv = generateBuildArtifactInventory(d);
  expect(inv.length).toBe(2);
  expect(inv[0]!.path).toBe("a.txt");
  expect(inv[1]!.path).toBe("b.txt");
  
  fs.rmSync(d, { recursive: true, force: true });
});

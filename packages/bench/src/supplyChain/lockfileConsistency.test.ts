import { expect, test } from "vitest";
import { checkLockfileConsistency } from "./lockfileConsistency.js";
import * as path from "path";
import * as fs from "fs";

test("lockfile consistency detects missing lockfile when required", () => {
  const d = path.resolve(__dirname, "test-lockfile");
  if (!fs.existsSync(d)) fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, "package.json"), "{}");
  fs.writeFileSync(path.join(d, "pnpm-workspace.yaml"), "");
  
  const res = checkLockfileConsistency(d);
  expect(res.valid).toBe(false);
  expect(res.error).toContain("pnpm-lock.yaml is missing");
  
  fs.rmSync(d, { recursive: true, force: true });
});

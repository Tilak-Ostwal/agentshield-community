import { expect, test } from "vitest";
import { checkPackageFilesAllowlist } from "./packageFilesAllowlist.js";
import * as path from "path";
import * as fs from "fs";

test("package files allowlist detects forbidden generated file", () => {
  const d = path.resolve(__dirname, "test-pkg-allowlist");
  if (!fs.existsSync(d)) fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, "generated-pack.policy.json"), "{}");
  
  const res = checkPackageFilesAllowlist(d, ["generated-pack.policy.json"]);
  expect(res.valid).toBe(false);
  expect(res.forbiddenFound.length).toBe(1);
  
  fs.rmSync(d, { recursive: true, force: true });
});

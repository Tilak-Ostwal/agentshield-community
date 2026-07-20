import { expect, test } from "vitest";
import { validateExportMap } from "./exportMapValidator.js";
import * as path from "path";
import * as fs from "fs";

test("export map validator passes valid package export", () => {
  const p = path.resolve(__dirname, "valid-pkg.json");
  fs.writeFileSync(p, JSON.stringify({ exports: { ".": "./dist/index.js" } }));
  const res = validateExportMap(p);
  expect(res.valid).toBe(true);
  fs.unlinkSync(p);
});

test("export map validator rejects export path outside package", () => {
  const p = path.resolve(__dirname, "invalid-pkg.json");
  fs.writeFileSync(p, JSON.stringify({ exports: { ".": "../dist/index.js" } }));
  const res = validateExportMap(p);
  expect(res.valid).toBe(false);
  fs.unlinkSync(p);
});

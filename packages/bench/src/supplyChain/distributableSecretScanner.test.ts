import { expect, test } from "vitest";
import { scanDistributableSecrets } from "./distributableSecretScanner.js";
import * as path from "path";
import * as fs from "fs";

test("distributable scanner detects raw fake secret sentinel", () => {
  const d = path.resolve(__dirname, "test-secrets");
  if (!fs.existsSync(d)) fs.mkdirSync(d);
  const rawSentinel = ["sk", "test", "REDACT", "ME"].join("-");
  fs.writeFileSync(path.join(d, "bad.json"), `{"secret": "${rawSentinel}"}`);
  
  const res = scanDistributableSecrets(d);
  expect(res.valid).toBe(false);
  expect(res.violations.some(v => v.includes("raw fake secret sentinel"))).toBe(true);
  
  fs.rmSync(d, { recursive: true, force: true });
});

test("distributable scanner detects credentials-like file path", () => {
  const d = path.resolve(__dirname, "test-secrets2");
  if (!fs.existsSync(d)) fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, ".env"), "API_KEY=123");
  
  const res = scanDistributableSecrets(d);
  expect(res.valid).toBe(false);
  expect(res.violations.some(v => v.includes("looks like a credential file"))).toBe(true);
  
  fs.rmSync(d, { recursive: true, force: true });
});

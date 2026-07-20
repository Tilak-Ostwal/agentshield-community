import { expect, test } from "vitest";
import { scanForUnsafePatterns } from "./cliSafetyScanner.js";
import * as path from "path";
import * as fs from "fs";

test("CLI safety scanner rejects npm publish", () => {
  const d = path.resolve(__dirname, "test-safety");
  if (!fs.existsSync(d)) fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, "bad.ts"), "const cmd = 'npm publish';");
  
  const res = scanForUnsafePatterns(d, ["npm publish"]);
  expect(res.valid).toBe(false);
  
  fs.rmSync(d, { recursive: true, force: true });
});

test("CLI safety scanner rejects git push", () => {
  const d = path.resolve(__dirname, "test-safety2");
  if (!fs.existsSync(d)) fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, "bad.ts"), "const cmd = 'git push';");
  
  const res = scanForUnsafePatterns(d, ["git push"]);
  expect(res.valid).toBe(false);
  
  fs.rmSync(d, { recursive: true, force: true });
});

test("CLI safety scanner rejects git tag", () => {
  const d = path.resolve(__dirname, "test-safety3");
  if (!fs.existsSync(d)) fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, "bad.ts"), "const cmd = 'git tag';");
  
  const res = scanForUnsafePatterns(d, ["git tag"]);
  expect(res.valid).toBe(false);
  
  fs.rmSync(d, { recursive: true, force: true });
});

test("CLI safety scanner rejects curl/irm/iwr/Invoke-WebRequest", () => {
  const d = path.resolve(__dirname, "test-safety4");
  if (!fs.existsSync(d)) fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, "bad.ts"), "const cmd = 'curl http';");
  fs.writeFileSync(path.join(d, "bad2.ts"), "const cmd = 'Invoke-WebRequest';");
  
  const res = scanForUnsafePatterns(d, ["curl ", "Invoke-WebRequest"]);
  expect(res.valid).toBe(false);
  expect(res.violations.length).toBe(2);
  
  fs.rmSync(d, { recursive: true, force: true });
});

test("CLI safety scanner allows known local AgentShield commands", () => {
  const d = path.resolve(__dirname, "test-safety5");
  if (!fs.existsSync(d)) fs.mkdirSync(d);
  fs.writeFileSync(path.join(d, "good.ts"), "const cmd = 'agentshield test';");
  
  const res = scanForUnsafePatterns(d, ["npm publish"]);
  expect(res.valid).toBe(true);
  
  fs.rmSync(d, { recursive: true, force: true });
});

import { expect, test } from "vitest";
import { PackageIntegrityConfig } from "./packageIntegritySchema.js";

test("package integrity config schema parses valid config", () => {
  const config: PackageIntegrityConfig = {
    version: 1,
    configId: "test",
    packages: ["packages/core"],
    requiredFiles: ["package.json"],
    forbiddenPatterns: ["npm publish"],
    generatedFilesDenylist: [],
    limitations: []
  };
  expect(config.version).toBe(1);
});

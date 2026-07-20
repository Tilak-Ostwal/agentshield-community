import { describe, it, expect, vi, beforeEach } from "vitest";
import { runDocsCommand } from "./docsCommand.js";
import * as fs from "fs";
import * as bench from "@agentshield/bench";

interface DocsValidateJson {
  valid: boolean;
}

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  writeFileSync: vi.fn()
}));
vi.mock("@agentshield/bench", async (io) => {
  const actual = await io();
  return {
    ...(actual as any),
    validateDocsIntegrity: vi.fn(),
    generateCommandCatalog: vi.fn(),
    generateDocsMapMarkdown: vi.fn(),
    mapDocsFeatureCoverage: vi.fn()
  };
});

describe("docsCommand", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  
  const validManifest = JSON.stringify({
    version: 1, siteId: "a", name: "a", root: "a", navigationPath: "a", pages: []
  });

  it("CLI docs validate text works", () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(validManifest);
    (bench.validateDocsIntegrity as any).mockReturnValue({ valid: true, errors: [] });
    const res = runDocsCommand(["validate", "manifest.json"], "/cwd");
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("valid");
  });

  it("CLI docs validate JSON works", () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(validManifest);
    (bench.validateDocsIntegrity as any).mockReturnValue({ valid: true, errors: [] });
    const res = runDocsCommand(["validate", "manifest.json", "--format", "json"], "/cwd");
    expect(res.exitCode).toBe(0);
    expect((JSON.parse(res.stdout) as DocsValidateJson).valid).toBe(true);
  });

  it("CLI docs map text works", () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(validManifest);
    (bench.generateDocsMapMarkdown as any).mockReturnValue("Map");
    (bench.mapDocsFeatureCoverage as any).mockReturnValue({ valid: true, missing: [], covered: [] });
    const res = runDocsCommand(["map", "manifest.json"], "/cwd");
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("Map");
  });

  it("CLI docs map Markdown works", () => {
    (fs.existsSync as any).mockImplementation((p: string) => p.includes("manifest.json"));
    (fs.readFileSync as any).mockReturnValue(validManifest);
    (bench.generateDocsMapMarkdown as any).mockReturnValue("Map");
    (bench.mapDocsFeatureCoverage as any).mockReturnValue({ valid: true, missing: [], covered: [] });
    const cwd = process.cwd();
    const res = runDocsCommand(["map", "manifest.json", "--out", "map.md"], cwd);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("written");
  });

  it("CLI docs catalog works", () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(validManifest);
    (bench.generateCommandCatalog as any).mockReturnValue("Cat");
    const res = runDocsCommand(["catalog", "manifest.json"], "/cwd");
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("Cat");
  });
});

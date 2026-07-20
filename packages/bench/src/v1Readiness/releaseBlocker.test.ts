import { describe, expect, it } from "vitest";
import { checkReleaseBlockers } from "./releaseBlocker.js";

describe("releaseBlocker", () => {
  it("release blocker detects raw fake secret sentinel", () => {
    const blockers = checkReleaseBlockers({
      "src/bad.ts": `const token = '${["sk", "test", "REDACT", "ME"].join("-")}';`
    });
    expect(blockers).toHaveLength(1);
    expect(blockers[0]!.blockerId).toBe("blocker-fake-secret-leak");
  });

  it("release blocker detects forbidden SOC2/ISO/HIPAA/PCI claim", () => {
    const blockers = checkReleaseBlockers({
      "README.md": "We claim SOC2 certification."
    });
    expect(blockers).toHaveLength(1);
    expect(blockers[0]!.blockerId).toBe("blocker-forbidden-claim");
  });

  it("release blocker detects generated smoke file names", () => {
    const blockers = checkReleaseBlockers({
      "v1-gap-closure-plan.md": "test"
    });
    expect(blockers).toHaveLength(1);
    expect(blockers[0]!.blockerId).toBe("blocker-smoke-file");
  });
});

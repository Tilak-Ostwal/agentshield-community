import { describe, expect, it } from "vitest";

import { dangerousAddedCapabilities } from "./capabilityDrift.js";

describe("capability drift", () => {
  it("detects dangerous added capabilities", () => {
    expect(dangerousAddedCapabilities(["filesystem.read"], ["filesystem.read", "shell.exec"])).toEqual(["shell.exec"]);
  });
});

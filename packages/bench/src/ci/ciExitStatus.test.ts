import { describe, expect, it } from "vitest";

import { ciExitCode } from "./ciExitStatus.js";

describe("CI exit status", () => {
  it("maps pass and fail to stable exit codes", () => {
    expect(ciExitCode("pass")).toBe(0);
    expect(ciExitCode("fail")).toBe(1);
  });
});

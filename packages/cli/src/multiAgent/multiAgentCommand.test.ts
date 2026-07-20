import { describe, expect, it } from "vitest";
import { runMultiAgentCommand } from "./multiAgentCommand.js";

describe("multiAgentCommand", () => {
  it("validates missing args", () => {
    const res = runMultiAgentCommand([], ".");
    expect(res.exitCode).toBe(1);
  });
});

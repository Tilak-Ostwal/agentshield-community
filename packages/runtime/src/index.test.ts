import { describe, expect, it } from "vitest";

import { evaluateAction } from "./index.js";

describe("runtime skeleton", () => {
  it("denies actions until a policy engine exists", () => {
    expect(evaluateAction({ id: "action_01", type: "tool_call" }).decision).toBe("deny");
  });
});

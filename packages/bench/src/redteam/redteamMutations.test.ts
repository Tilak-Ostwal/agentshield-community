import { describe, expect, it } from "vitest";

import { builtInRedteamTemplates } from "./redteamGenerator.js";
import { renderTemplateString, variableBindings } from "./redteamMutations.js";

describe("redteam mutations", () => {
  it("generates deterministic bindings", () => {
    const first = variableBindings(builtInRedteamTemplates[0]!);
    const second = variableBindings(builtInRedteamTemplates[0]!);
    expect(first).toEqual(second);
  });

  it("renders mock secret placeholder", () => {
    expect(renderTemplateString("token {{secret}}", {})).toBe("token mock-redteam-token");
  });
});

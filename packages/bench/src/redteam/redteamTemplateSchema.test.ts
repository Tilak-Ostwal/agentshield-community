import { describe, expect, it } from "vitest";

import { builtInRedteamTemplates } from "./redteamGenerator.js";
import { parseRedteamTemplate } from "./redteamTemplateSchema.js";

describe("redteam template schema", () => {
  it("parses valid template", () => {
    expect(parseRedteamTemplate(builtInRedteamTemplates[0]!)).toMatchObject({ ok: true });
  });

  it("rejects invalid template", () => {
    expect(parseRedteamTemplate({ ...builtInRedteamTemplates[0]!, category: "bad" })).toMatchObject({ ok: false });
  });
});

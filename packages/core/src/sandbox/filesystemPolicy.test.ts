import { describe, expect, it } from "vitest";
import { filesystemPolicySchema } from "./filesystemPolicy.js";

describe("filesystem policy", () => {
  it("parses readonly filesystem policy", () => {
    expect(filesystemPolicySchema.parse({ readonly: true, allowRead: ["/mock/project/**"] })).toMatchObject({ readonly: true });
  });
});

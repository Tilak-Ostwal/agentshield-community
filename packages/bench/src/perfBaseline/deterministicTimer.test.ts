import { describe, it, expect } from "vitest";
import { MockTimer, measureBlock } from "./deterministicTimer.js";

describe("deterministicTimer", () => {
  it("deterministic timer produces stable test measurements", () => {
    const timer = new MockTimer();
    const duration = measureBlock(timer, () => timer.advance(42));
    expect(duration).toBe(42);
  });
});

export interface Timer {
  now(): number;
}
export class RealTimer implements Timer {
  now() { return performance.now(); }
}
export class MockTimer implements Timer {
  private _now = 0;
  now() { return this._now; }
  advance(ms: number) { this._now += ms; }
}

export function measureBlock(timer: Timer, fn: () => void): number {
  const start = timer.now();
  fn();
  return timer.now() - start;
}

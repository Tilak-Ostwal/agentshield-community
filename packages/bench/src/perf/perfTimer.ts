export interface PerfSample {
  durationMs: number;
}

export interface PerfTiming {
  iterations: number;
  avgMs: number;
  p95Ms: number;
  maxMs: number;
  samples: PerfSample[];
}

function nowMs(): number {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

export function percentile(values: number[], percentileRank: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((percentileRank / 100) * sorted.length) - 1));
  return sorted[index]!;
}

export function measureIterations(iterations: number, fn: () => void): PerfTiming {
  const samples: PerfSample[] = [];

  for (let index = 0; index < iterations; index += 1) {
    const startedAt = nowMs();
    fn();
    samples.push({ durationMs: nowMs() - startedAt });
  }

  const durations = samples.map((sample) => sample.durationMs);
  const total = durations.reduce((sum, value) => sum + value, 0);

  return {
    iterations,
    avgMs: durations.length === 0 ? 0 : total / durations.length,
    p95Ms: percentile(durations, 95),
    maxMs: durations.length === 0 ? 0 : Math.max(...durations),
    samples
  };
}

export function roundMs(value: number): number {
  return Math.round(value * 1000) / 1000;
}

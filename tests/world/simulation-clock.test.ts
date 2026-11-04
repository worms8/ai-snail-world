import { describe, expect, it } from 'vitest';
import { SimulationClock } from '../../src/world/index';

describe('simulation clock', () => {
  it('runs fixed ticks and exposes the interpolation alpha', () => {
    const clock = new SimulationClock();
    const ticks: number[] = [];
    const alpha = clock.advance(0.05, (tick) => ticks.push(tick));

    expect(ticks).toEqual([1]);
    expect(alpha).toBeCloseTo(0.5, 5);
    expect(clock.tick).toBe(1);
  });

  it('runs three ticks for 100 ms', () => {
    const clock = new SimulationClock();
    let count = 0;
    clock.advance(0.1, () => {
      count += 1;
    });

    expect(count).toBe(3);
    expect(clock.tick).toBe(3);
  });

  it('caps catch-up ticks and drops the backlog', () => {
    const clock = new SimulationClock({ maxCatchUpTicks: 2 });
    let count = 0;
    const alpha = clock.advance(0.5, () => {
      count += 1;
    });

    expect(count).toBe(2);
    expect(clock.tick).toBe(2);
    expect(alpha).toBeLessThan(1);
  });

  it('ignores negative and clamps oversized frame deltas', () => {
    const clock = new SimulationClock({ maxFrameSeconds: 0.25, maxCatchUpTicks: 10 });
    let count = 0;

    clock.advance(-1, () => {
      count += 1;
    });
    expect(count).toBe(0);

    clock.advance(5, () => {
      count += 1;
    });
    expect(count).toBe(7);
  });

  it('resets tick and accumulator', () => {
    const clock = new SimulationClock();
    clock.advance(0.1, () => undefined);
    clock.reset();

    expect(clock.tick).toBe(0);
    expect(clock.alpha).toBe(0);
  });
});

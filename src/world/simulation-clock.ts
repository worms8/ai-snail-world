/**
 * Fixed-timestep accumulator. Rendering passes real frame time in and receives
 * an interpolation alpha; simulation only ever sees exact 1/30 s ticks.
 */

import { FIXED_DELTA_SECONDS, MAX_CATCH_UP_TICKS, clamp } from '../core/index';

export type TickHandler = (tick: number, deltaSeconds: number) => void;

export interface SimulationClockOptions {
  tickSeconds?: number;
  maxCatchUpTicks?: number;
  /** Longest real frame accepted; protects against tab-switch time jumps. */
  maxFrameSeconds?: number;
}

export class SimulationClock {
  private readonly tickSeconds: number;
  private readonly maxCatchUpTicks: number;
  private readonly maxFrameSeconds: number;
  private accumulatorSeconds = 0;
  private tickCount = 0;

  constructor(options: SimulationClockOptions = {}) {
    this.tickSeconds = options.tickSeconds ?? FIXED_DELTA_SECONDS;
    this.maxCatchUpTicks = options.maxCatchUpTicks ?? MAX_CATCH_UP_TICKS;
    this.maxFrameSeconds = options.maxFrameSeconds ?? 0.25;
  }

  get tick(): number {
    return this.tickCount;
  }

  /** 0..1 between the last simulated tick and the next one. */
  get alpha(): number {
    return clamp(this.accumulatorSeconds / this.tickSeconds, 0, 1);
  }

  /** Advances real time and runs at most `maxCatchUpTicks` fixed steps. */
  advance(realDeltaSeconds: number, onTick: TickHandler): number {
    const delta = clamp(realDeltaSeconds, 0, this.maxFrameSeconds);
    this.accumulatorSeconds += delta;

    let steps = 0;
    while (this.accumulatorSeconds >= this.tickSeconds && steps < this.maxCatchUpTicks) {
      this.accumulatorSeconds -= this.tickSeconds;
      this.tickCount += 1;
      steps += 1;
      onTick(this.tickCount, this.tickSeconds);
    }

    if (steps >= this.maxCatchUpTicks && this.accumulatorSeconds >= this.tickSeconds) {
      // Drop the backlog instead of spiralling; the world slows down briefly.
      this.accumulatorSeconds %= this.tickSeconds;
    }

    return this.alpha;
  }

  reset(): void {
    this.accumulatorSeconds = 0;
    this.tickCount = 0;
  }
}

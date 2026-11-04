/**
 * Small deterministic RNG. Every simulation system receives an Rng instance;
 * bare Math.random() is forbidden in logic so tests and replays are stable.
 */

export interface Rng {
  /** Uniform float in [0, 1). */
  next(): number;
  /** Uniform integer in [minInclusive, maxExclusive). */
  int(minInclusive: number, maxExclusive: number): number;
  /** Uniform pick from a non-empty list. */
  pick<T>(items: readonly T[]): T;
}

export function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createRng(seed: number | string): Rng {
  let state = (typeof seed === 'string' ? hashString(seed) : seed) >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int(minInclusive: number, maxExclusive: number): number {
      if (maxExclusive <= minInclusive) {
        throw new RangeError('maxExclusive must be greater than minInclusive');
      }
      return minInclusive + Math.floor(next() * (maxExclusive - minInclusive));
    },
    pick<T>(items: readonly T[]): T {
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) {
        throw new RangeError('Cannot pick from an empty list');
      }
      return item;
    },
  };
}

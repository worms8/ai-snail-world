import { describe, expect, it } from 'vitest';
import { createRng, hashString } from '../../src/core/index';

describe('seeded RNG', () => {
  it('is deterministic for the same seed', () => {
    const a = createRng('snail-world');
    const b = createRng('snail-world');
    const left = Array.from({ length: 6 }, () => a.next());
    const right = Array.from({ length: 6 }, () => b.next());
    expect(left).toEqual(right);
  });

  it('stays in range and varies with the seed', () => {
    const a = createRng(42);
    const b = createRng(43);
    const values = Array.from({ length: 100 }, () => a.next());
    expect(values.every((value) => value >= 0 && value < 1)).toBe(true);
    expect(a.next()).not.toBe(b.next());
  });

  it('hashes strings stably', () => {
    expect(hashString('slime')).toBe(hashString('slime'));
    expect(hashString('slime')).not.toBe(hashString('shell'));
  });
});

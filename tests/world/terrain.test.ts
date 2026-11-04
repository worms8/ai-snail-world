import { describe, expect, it } from 'vitest';
import { createTerrainMask } from '../../src/world/index';

const OPTIONS = { width: 640, height: 480, surfaceLevel: 300, amplitude: 40 };

describe('terrain mask generation', () => {
  it('is deterministic for a seed and varies between seeds', () => {
    const a = createTerrainMask('garden-test', OPTIONS);
    const b = createTerrainMask('garden-test', OPTIONS);
    const c = createTerrainMask('other-garden', OPTIONS);

    expect(Array.from(a.surfaceY)).toEqual(Array.from(b.surfaceY));
    expect(Array.from(a.surfaceY)).not.toEqual(Array.from(c.surfaceY));
  });

  it('fills solid below the surface and air above it', () => {
    const mask = createTerrainMask('garden-test', OPTIONS);
    const x = 321;
    const surface = mask.surfaceY[x] ?? 0;

    expect(surface).toBeGreaterThan(0);
    expect(surface).toBeLessThan(OPTIONS.height);
    expect(mask.isSolid(x, surface - 1)).toBe(false);
    expect(mask.isSolid(x, surface)).toBe(true);
    expect(mask.isSolid(x, OPTIONS.height - 1)).toBe(true);
    expect(mask.isSolid(-1, surface)).toBe(false);
    expect(mask.isSolid(x, OPTIONS.height)).toBe(true);
  });

  it('answers ground, body and slope queries', () => {
    const mask = createTerrainMask('garden-test', OPTIONS);
    const x = 480; // flattened spawn area
    const surface = mask.surfaceY[x] ?? 0;

    expect(mask.groundHeightBelow(x, 0)).toBe(surface);
    expect(mask.groundHeightBelow(x, surface - 20)).toBe(surface);
    expect(mask.groundHeightBelow(x + 1, surface + 5)).toBe(surface + 5);
    expect(mask.groundHeightBelow(-50, 0)).toBeNull();

    expect(mask.isBodyFree(x, surface, 48, 40)).toBe(true);
    expect(mask.isBodyFree(x, surface + 20, 48, 40)).toBe(false);

    const normal = mask.surfaceNormal(x, surface);
    expect(Math.hypot(normal.x, normal.y)).toBeCloseTo(1, 5);
    expect(Math.abs(normal.x)).toBeLessThan(0.05);
  });
});

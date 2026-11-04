import { describe, expect, it } from 'vitest';
import type { TerrainQuery } from '../../src/world/index';
import { createKinematicState, stepKinematics } from '../../src/world/index';

class FixtureTerrain implements TerrainQuery {
  readonly width = 1000;
  readonly height = 800;

  constructor(private readonly surfaceAt: (x: number) => number) {}

  isSolid(x: number, y: number): boolean {
    if (x < 0 || x >= this.width) return false;
    if (y < 0) return false;
    if (y >= this.height) return true;
    return Math.floor(y) >= this.surfaceAt(Math.floor(x));
  }

  groundHeightBelow(x: number, startY: number): number | null {
    if (x < 0 || x >= this.width) return null;
    const surface = this.surfaceAt(Math.floor(x));
    const y = Math.max(Math.floor(startY), surface);
    return y < this.height ? y : null;
  }

  surfaceNormal(): { x: number; y: number } {
    return { x: 0, y: 1 };
  }

  isBodyFree(x: number, footY: number, width: number, height: number): boolean {
    const half = width / 2;
    for (const sampleX of [x - half, x, x + half]) {
      if (this.isSolid(sampleX, footY - 1)) return false;
      if (this.isSolid(sampleX, footY - height)) return false;
    }
    return true;
  }
}

const flat = new FixtureTerrain(() => 300);

describe('snail kinematics', () => {
  it('walks at the configured speed and turns to face the direction', () => {
    const state = createKinematicState(100, 300);
    const next = stepKinematics(state, { direction: 1 }, flat, 0.5);

    expect(next.x).toBeCloseTo(145, 5);
    expect(next.y).toBe(300);
    expect(next.grounded).toBe(true);
    expect(next.facing).toBe('right');
    expect(next.vx).toBe(90);

    const left = stepKinematics(next, { direction: -1 }, flat, 0.1);
    expect(left.facing).toBe('left');
    expect(left.x).toBeCloseTo(136, 5);
  });

  it('steps up a bump no higher than the step height', () => {
    const terrain = new FixtureTerrain((x) => (x >= 105 ? 294 : 300));
    const state = createKinematicState(100, 300);
    const next = stepKinematics(state, { direction: 1 }, terrain, 0.0556);

    expect(next.x).toBeGreaterThanOrEqual(105);
    expect(next.y).toBe(294);
    expect(next.grounded).toBe(true);
  });

  it('climbs slopes even when the leading edge is above the step height', () => {
    // 1 px up per 2 px right: the centred step is small, but 24 px ahead the
    // ground is 12 px higher, which used to look like a wall to the body box.
    const terrain = new FixtureTerrain((x) => 300 - Math.floor((x - 100) / 2));
    let state = createKinematicState(100, 300);

    for (let tick = 0; tick < 20; tick += 1) {
      state = stepKinematics(state, { direction: 1 }, terrain, 1 / 30);
    }

    expect(state.x).toBeCloseTo(160, 5);
    expect(state.y).toBe(270);
    expect(state.grounded).toBe(true);
  });

  it('is blocked by a wall higher than the step height', () => {
    const terrain = new FixtureTerrain((x) => (x >= 105 ? 276 : 300));
    const state = createKinematicState(100, 300);
    const next = stepKinematics(state, { direction: 1 }, terrain, 0.0556);

    expect(next.x).toBe(100);
    expect(next.y).toBe(300);
    expect(next.vx).toBe(0);
  });

  it('walks off a ledge, falls and lands on the lower floor', () => {
    const terrain = new FixtureTerrain((x) => (x >= 110 ? 400 : 300));
    let state = createKinematicState(105, 300);

    state = stepKinematics(state, { direction: 1 }, terrain, 0.1);
    expect(state.grounded).toBe(false);
    expect(state.y).toBeGreaterThan(300);

    for (let i = 0; i < 40 && !state.grounded; i += 1) {
      state = stepKinematics(state, { direction: 0 }, terrain, 0.1);
    }
    expect(state.grounded).toBe(true);
    expect(state.y).toBe(400);
  });

  it('falls from the air and snaps to the ground', () => {
    const state = createKinematicState(100, 200, 'right', false);
    const next = stepKinematics(state, { direction: 0 }, flat, 1);

    expect(next.y).toBe(300);
    expect(next.vy).toBe(0);
    expect(next.grounded).toBe(true);
  });

  it('stays put while idle on the ground', () => {
    const state = createKinematicState(100, 300);
    const next = stepKinematics(state, { direction: 0 }, flat, 1 / 30);

    expect(next.x).toBe(100);
    expect(next.y).toBe(300);
    expect(next.grounded).toBe(true);
    expect(next.vx).toBe(0);
  });
});

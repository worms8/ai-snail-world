import { describe, expect, it } from 'vitest';
import { MAX_CARVE_RADIUS, TERRAIN_CHUNK_SIZE } from '../../src/core/index';
import { createTerrainMask } from '../../src/world/index';

const OPTIONS = { width: 512, height: 512, surfaceLevel: 256, amplitude: 0 };

describe('terrain mask carving', () => {
  it('carves a circular hole and removes solid pixels inside the radius', () => {
    const mask = createTerrainMask('carve-test', OPTIONS);
    const cx = 256;
    const cy = 300;
    const radius = 10;

    expect(mask.isSolid(cx, cy)).toBe(true);

    const dirty = mask.carveCircle(cx, cy, radius);
    expect(dirty).not.toBeNull();
    expect(mask.isSolid(cx, cy)).toBe(false);

    // Pixels inside circle are air (0)
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (dx * dx + dy * dy <= radius * radius) {
          expect(mask.isSolid(cx + dx, cy + dy)).toBe(false);
        }
      }
    }

    // Pixel strictly outside circle remains solid
    expect(mask.isSolid(cx + radius + 2, cy)).toBe(true);
    expect(mask.isSolid(cx, cy + radius + 2)).toBe(true);
  });

  it('clamps bounds and handles carves near edges and corners', () => {
    const mask = createTerrainMask('edge-test', OPTIONS);

    // Carve at top-left origin (mostly air)
    const topAir = mask.carveCircle(0, 0, 10);
    expect(topAir).toBeNull(); // All air above surfaceLevel 256

    // Carve overlapping corner of world in solid dirt
    const cornerDirty = mask.carveCircle(0, 500, 20);
    expect(cornerDirty).not.toBeNull();
    expect(cornerDirty!.x).toBe(0);
    expect(cornerDirty!.y).toBeGreaterThanOrEqual(480);
    expect(mask.isSolid(0, 500)).toBe(false);

    // Carve with zero or negative radius returns null
    expect(mask.carveCircle(256, 300, 0)).toBeNull();
    expect(mask.carveCircle(256, 300, -5)).toBeNull();
  });

  it('clamps radius to MAX_CARVE_RADIUS (64)', () => {
    const mask = createTerrainMask('clamp-r-test', OPTIONS);
    const cx = 256;
    const cy = 350;

    const dirty = mask.carveCircle(cx, cy, 200);
    expect(dirty).not.toBeNull();
    expect(dirty!.width).toBeLessThanOrEqual(MAX_CARVE_RADIUS * 2 + 1);
    expect(dirty!.height).toBeLessThanOrEqual(MAX_CARVE_RADIUS * 2 + 1);
  });

  it('returns null and does not dirty chunks when carving only air', () => {
    const mask = createTerrainMask('air-test', OPTIONS);
    const dirty = mask.carveCircle(256, 50, 20);

    expect(dirty).toBeNull();
    expect(mask.takeDirtyChunks()).toHaveLength(0);
  });

  it('marks chunks dirty across chunk seams and coalesces dirty rects', () => {
    const mask = createTerrainMask('seam-test', OPTIONS);
    // TERRAIN_CHUNK_SIZE is 256. Carving at x=256 crosses chunk column 0 and 1.
    const cx = TERRAIN_CHUNK_SIZE;
    const cy = 300;

    const dirty = mask.carveCircle(cx, cy, 14);
    expect(dirty).not.toBeNull();

    const dirtyChunks = mask.takeDirtyChunks();
    expect(dirtyChunks.length).toBeGreaterThanOrEqual(2);

    for (const chunk of dirtyChunks) {
      expect(chunk.dirty).toBe(true);
      expect(chunk.dirtyRect).not.toBeNull();
      expect(chunk.dirtyRect!.width).toBeGreaterThan(0);
    }

    // Subsequent carve in the same chunk coalesces
    mask.carveCircle(cx + 4, cy + 4, 8);
    const newDirtyChunks = mask.takeDirtyChunks();
    expect(newDirtyChunks.length).toBeGreaterThan(0);
  });

  it('updates surfaceY when carving surface, but preserves it for tunnels', () => {
    const mask = createTerrainMask('surface-test', OPTIONS);
    const col = 200;
    const originalSurface = mask.surfaceY[col]!;

    // 1. Carve a tunnel underground (well below surfaceY)
    const tunnelY = originalSurface + 50;
    mask.carveCircle(col, tunnelY, 10);
    // Tunnel leaves the surface intact
    expect(mask.surfaceY[col]).toBe(originalSurface);
    expect(mask.isSolid(col, originalSurface)).toBe(true);
    expect(mask.isSolid(col, tunnelY)).toBe(false);

    // 2. Carve a bite out of the top surface
    mask.carveCircle(col, originalSurface, 10);
    // Surface must drop down (larger y coordinate)
    expect(mask.surfaceY[col]!).toBeGreaterThan(originalSurface);
    expect(mask.isSolid(col, originalSurface)).toBe(false);
    expect(mask.isSolid(col, mask.surfaceY[col]!)).toBe(true);
  });
});

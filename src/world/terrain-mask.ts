/**
 * Phase 1 terrain: a seeded 1D heightfield rasterised into the byte mask.
 * Carving and chunk dirty tracking arrive in Phase 2; queries are already the
 * same ones collision and rendering will use.
 */

import { PLAYER_START_X, WORLD_HEIGHT, WORLD_WIDTH, clamp, createRng } from '../core/index';
import type { TerrainMaskData, TerrainQuery } from './terrain';

export interface TerrainGenerationOptions {
  width?: number;
  height?: number;
  /** Average surface height in pixels from the top of the world. */
  surfaceLevel?: number;
  /** Maximum height variation around `surfaceLevel`. */
  amplitude?: number;
}

interface NoiseOctave {
  readonly period: number;
  readonly weight: number;
}

const OCTAVES: readonly NoiseOctave[] = [
  { period: 512, weight: 1 },
  { period: 173, weight: 0.45 },
  { period: 61, weight: 0.16 },
];

const DEFAULT_SURFACE_LEVEL = 760;
const DEFAULT_AMPLITUDE = 120;
const MIN_SURFACE_Y = 240;
const SPAWN_PLATEAU_RADIUS = 180;
const SPAWN_BLEND_RADIUS = 320;

function octaveValues(seed: string, width: number, period: number): Float32Array {
  const rng = createRng(`${seed}:terrain:${period}`);
  const cells = Math.ceil(width / period) + 2;
  const values = new Float32Array(cells);
  for (let i = 0; i < cells; i += 1) values[i] = rng.next();
  return values;
}

function smoothNoise(values: Float32Array, period: number, x: number): number {
  const position = x / period;
  const cell = Math.floor(position);
  const t = position - cell;
  const smooth = t * t * (3 - 2 * t);
  const left = values[cell] ?? 0.5;
  const right = values[cell + 1] ?? 0.5;
  return left + (right - left) * smooth;
}

export class TerrainMask implements TerrainQuery {
  readonly data: TerrainMaskData;
  readonly surfaceY: Int16Array;

  constructor(seed: string, options: TerrainGenerationOptions = {}) {
    const width = options.width ?? WORLD_WIDTH;
    const height = options.height ?? WORLD_HEIGHT;
    const surfaceLevel = options.surfaceLevel ?? DEFAULT_SURFACE_LEVEL;
    const amplitude = options.amplitude ?? DEFAULT_AMPLITUDE;
    const maxSurfaceY = Math.max(MIN_SURFACE_Y, height - 140);

    const noise = OCTAVES.map((octave) => ({
      octave,
      values: octaveValues(seed, width, octave.period),
    }));
    const totalWeight = OCTAVES.reduce((sum, octave) => sum + octave.weight, 0);

    this.surfaceY = new Int16Array(width);
    for (let x = 0; x < width; x += 1) {
      let offset = 0;
      for (const entry of noise) {
        offset += (smoothNoise(entry.values, entry.octave.period, x) - 0.5) * entry.octave.weight;
      }
      const normalised = offset / totalWeight;
      let surface = surfaceLevel - normalised * 2 * amplitude;

      const spawnDistance = Math.abs(x - PLAYER_START_X);
      if (spawnDistance < SPAWN_PLATEAU_RADIUS) {
        surface = surfaceLevel;
      } else if (spawnDistance < SPAWN_BLEND_RADIUS) {
        const blend =
          (spawnDistance - SPAWN_PLATEAU_RADIUS) / (SPAWN_BLEND_RADIUS - SPAWN_PLATEAU_RADIUS);
        surface = surfaceLevel * (1 - blend) + surface * blend;
      }

      this.surfaceY[x] = Math.round(clamp(surface, MIN_SURFACE_Y, maxSurfaceY));
    }

    const pixels = new Uint8Array(width * height);
    for (let x = 0; x < width; x += 1) {
      const top = this.surfaceY[x] ?? height;
      for (let y = top; y < height; y += 1) pixels[y * width + x] = 255;
    }

    this.data = { width, height, pixels };
  }

  isSolid(x: number, y: number): boolean {
    const { width, height, pixels } = this.data;
    if (x < 0 || x >= width) return false;
    if (y < 0) return false;
    if (y >= height) return true;
    return pixels[Math.floor(y) * width + Math.floor(x)] !== 0;
  }

  groundHeightBelow(x: number, startY: number): number | null {
    const { width, height, pixels } = this.data;
    const column = Math.floor(x);
    if (column < 0 || column >= width) return null;

    let y = Math.max(0, Math.floor(startY));
    const surface = this.surfaceY[column] ?? height;
    if (y < surface) y = surface;

    for (; y < height; y += 1) {
      if (pixels[y * width + column] !== 0) return y;
    }
    return null;
  }

  surfaceNormal(x: number, y: number): { x: number; y: number } {
    const left = this.groundHeightBelow(x - 6, y - 12);
    const right = this.groundHeightBelow(x + 6, y - 12);
    if (left === null || right === null) return { x: 0, y: -1 };

    const slope = (right - left) / 12;
    const length = Math.hypot(slope, 1);
    return { x: -slope / length, y: 1 / length };
  }

  isBodyFree(x: number, footY: number, width: number, height: number): boolean {
    const half = width / 2;
    const top = footY - height;
    const sampleXs = [x - half, x, x + half];

    for (const sampleX of sampleXs) {
      if (this.isSolid(sampleX, footY - 1)) return false;
      if (this.isSolid(sampleX, top)) return false;
    }
    for (const sampleY of [top + height * 0.33, top + height * 0.66]) {
      if (this.isSolid(x - half, sampleY)) return false;
      if (this.isSolid(x + half, sampleY)) return false;
    }
    return true;
  }
}

export function createTerrainMask(
  seed: string,
  options: TerrainGenerationOptions = {},
): TerrainMask {
  return new TerrainMask(seed, options);
}

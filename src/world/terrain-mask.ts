/**
 * Destructible terrain mask: seeded 1D heightfield, byte mask, chunk grid and carving.
 * Delegates collision queries to collision.ts and carving to terrain-carver.ts.
 */

import {
  PLAYER_START_X,
  TERRAIN_CHUNK_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  clamp,
  createRng,
} from '../core/index';
import { isBodyFree, groundHeightBelow, isSolid, surfaceNormal } from './collision';
import type { Rect, TerrainCarver, TerrainChunk, TerrainMaskData } from './terrain';
import { carveCircle } from './terrain-carver';

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

function createInitialChunks(width: number, height: number): TerrainChunk[] {
  const columns = Math.ceil(width / TERRAIN_CHUNK_SIZE);
  const rows = Math.ceil(height / TERRAIN_CHUNK_SIZE);
  const chunks: TerrainChunk[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = column * TERRAIN_CHUNK_SIZE;
      const y = row * TERRAIN_CHUNK_SIZE;
      const rect: Rect = {
        x,
        y,
        width: Math.min(TERRAIN_CHUNK_SIZE, width - x),
        height: Math.min(TERRAIN_CHUNK_SIZE, height - y),
      };
      chunks.push({
        index: row * columns + column,
        column,
        row,
        rect,
        textureKey: `terrain-chunk-${column}-${row}`,
        dirty: false,
        dirtyRect: null,
      });
    }
  }
  return chunks;
}

export class TerrainMask implements TerrainCarver {
  readonly data: TerrainMaskData;
  readonly surfaceY: Int16Array;
  readonly chunks: readonly TerrainChunk[];
  private readonly mutableChunks: TerrainChunk[];

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
    this.mutableChunks = createInitialChunks(width, height);
    this.chunks = this.mutableChunks;
  }

  isSolid(x: number, y: number): boolean {
    return isSolid(this.data, x, y);
  }

  groundHeightBelow(x: number, startY: number): number | null {
    return groundHeightBelow(this.data, this.surfaceY, x, startY);
  }

  surfaceNormal(x: number, y: number): { x: number; y: number } {
    return surfaceNormal(this, x, y);
  }

  isBodyFree(x: number, footY: number, width: number, height: number): boolean {
    return isBodyFree(this, x, footY, width, height);
  }

  carveCircle(x: number, y: number, radius: number): Rect | null {
    return carveCircle(this.data, this.surfaceY, this.mutableChunks, x, y, radius);
  }

  takeDirtyChunks(): readonly TerrainChunk[] {
    return this.mutableChunks.filter((chunk) => chunk.dirty);
  }

  takeDirtyRects(): readonly Rect[] {
    const rects: Rect[] = [];
    for (const chunk of this.mutableChunks) {
      if (chunk.dirty && chunk.dirtyRect) {
        rects.push(chunk.dirtyRect);
      }
      chunk.dirty = false;
      chunk.dirtyRect = null;
    }
    return rects;
  }
}

export function createTerrainMask(
  seed: string,
  options: TerrainGenerationOptions = {},
): TerrainMask {
  return new TerrainMask(seed, options);
}

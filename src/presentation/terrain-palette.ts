/** Palette and pixel rules for the mask-derived terrain canvas. Pure functions. */

import { TERRAIN_GRASS_HEIGHT } from '../core/index';
import type { TerrainMask } from '../world/index';

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const OUTLINE: Rgb = { r: 0x3b, g: 0x2a, b: 0x20 };
const GRASS_LIGHT: Rgb = { r: 0xa8, g: 0xe0, b: 0x6b };
const GRASS_BASE: Rgb = { r: 0x6c, g: 0xc0, b: 0x4a };
const GRASS_SHADOW: Rgb = { r: 0x3f, g: 0x8f, b: 0x3a };
const SOIL_BASE: Rgb = { r: 0x9c, g: 0x6b, b: 0x43 };
const SOIL_SHADOW: Rgb = { r: 0x6b, g: 0x44, b: 0x29 };
const STONE_LIGHT: Rgb = { r: 0xb9, g: 0xb3, b: 0xa8 };

/** Stable per-pixel hash; decorations never change between frames. */
function positionHash(x: number, y: number): number {
  let hash = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
}

function hasOpenNeighbour(mask: TerrainMask, x: number, y: number): boolean {
  if (!mask.isSolid(x - 1, y) || !mask.isSolid(x + 1, y)) return true;
  if (!mask.isSolid(x, y - 1) || !mask.isSolid(x, y + 1)) return true;
  return !mask.isSolid(x - 2, y) || !mask.isSolid(x + 2, y);
}

/** Returns the colour for one world pixel, or null when the pixel is sky. */
export function terrainPixelColor(mask: TerrainMask, x: number, y: number): Rgb | null {
  if (!mask.isSolid(x, y)) return null;
  if (hasOpenNeighbour(mask, x, y)) return OUTLINE;

  const top = mask.surfaceY[x] ?? mask.data.height;
  const depth = y - top;
  if (depth >= 0 && depth < TERRAIN_GRASS_HEIGHT) {
    if (depth < 3) return GRASS_LIGHT;
    if (depth >= TERRAIN_GRASS_HEIGHT - 2) return GRASS_SHADOW;
    return GRASS_BASE;
  }

  const regionHeight = mask.data.height - top;
  if (depth > regionHeight * 0.65) return SOIL_SHADOW;

  const hash = positionHash(x, y);
  if (hash < 0.0025) return STONE_LIGHT;
  if (hash > 0.9975) return SOIL_SHADOW;
  return SOIL_BASE;
}

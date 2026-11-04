/**
 * Pure collision queries over the byte mask. Headless, deterministic, zero Phaser.
 * Used by kinematics, Tier-0 AI navigation and terrain normal sampling.
 */

import type { TerrainMaskData, TerrainQuery } from './terrain';

export function isSolid(data: TerrainMaskData, x: number, y: number): boolean {
  const { width, height, pixels } = data;
  if (x < 0 || x >= width) return false;
  if (y < 0) return false;
  if (y >= height) return true; // Bedrock: snails can never fall out of the world
  return pixels[Math.floor(y) * width + Math.floor(x)] !== 0;
}

export function groundHeightBelow(
  data: TerrainMaskData,
  surfaceY: Int16Array,
  x: number,
  startY: number,
): number | null {
  const { width, height, pixels } = data;
  const column = Math.floor(x);
  if (column < 0 || column >= width) return null;

  let y = Math.max(0, Math.floor(startY));
  const surface = surfaceY[column] ?? height;
  if (y < surface) y = surface;

  for (; y < height; y += 1) {
    if (pixels[y * width + column] !== 0) return y;
  }
  return null;
}

export function surfaceNormal(query: TerrainQuery, x: number, y: number): { x: number; y: number } {
  const left = query.groundHeightBelow(x - 6, y - 12);
  const right = query.groundHeightBelow(x + 6, y - 12);
  if (left === null || right === null) return { x: 0, y: -1 };

  const slope = (right - left) / 12;
  const length = Math.hypot(slope, 1);
  return { x: -slope / length, y: 1 / length };
}

export function isBodyFree(
  query: TerrainQuery,
  x: number,
  footY: number,
  width: number,
  height: number,
): boolean {
  const half = width / 2;
  const top = footY - height;
  const sampleXs = [x - half, x, x + half];

  for (const sampleX of sampleXs) {
    if (query.isSolid(sampleX, footY - 1)) return false;
    if (query.isSolid(sampleX, top)) return false;
  }
  for (const sampleY of [top + height * 0.33, top + height * 0.66]) {
    if (query.isSolid(x - half, sampleY)) return false;
    if (query.isSolid(x + half, sampleY)) return false;
  }
  return true;
}

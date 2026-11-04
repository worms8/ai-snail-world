/**
 * Mask carving, surface refresh and dirty-chunk coalescing.
 * Headless, deterministic logic implementing docs/TERRAIN.md §4.
 */

import { MAX_CARVE_RADIUS, clamp } from '../core/index';
import type { Rect, TerrainChunk, TerrainMaskData } from './terrain';

export function coalesceRect(existing: Rect, incoming: Rect): Rect {
  const minX = Math.min(existing.x, incoming.x);
  const minY = Math.min(existing.y, incoming.y);
  const maxX = Math.max(existing.x + existing.width, incoming.x + incoming.width);
  const maxY = Math.max(existing.y + existing.height, incoming.y + incoming.height);

  const union: Rect = {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };

  const unionArea = union.width * union.height;
  const sumArea = existing.width * existing.height + incoming.width * incoming.height;

  if (unionArea <= 1.4 * sumArea) {
    return union;
  }
  return incoming.width * incoming.height >= existing.width * existing.height ? incoming : existing;
}

export function refreshSurfaceColumn(
  data: TerrainMaskData,
  surfaceY: Int16Array,
  column: number,
  minY: number,
  maxY: number,
): void {
  const current = surfaceY[column] ?? data.height;
  if (minY > current || maxY < current) return;

  let y = current;
  while (y < data.height && data.pixels[y * data.width + column] === 0) {
    y += 1;
  }
  surfaceY[column] = y;
}

export function markChunksDirty(chunks: readonly TerrainChunk[], dirtyRect: Rect): void {
  const right = dirtyRect.x + dirtyRect.width;
  const bottom = dirtyRect.y + dirtyRect.height;

  for (const chunk of chunks) {
    const chunkRight = chunk.rect.x + chunk.rect.width;
    const chunkBottom = chunk.rect.y + chunk.rect.height;

    if (
      dirtyRect.x >= chunkRight ||
      right <= chunk.rect.x ||
      dirtyRect.y >= chunkBottom ||
      bottom <= chunk.rect.y
    ) {
      continue;
    }

    const intersectWorldX0 = Math.max(dirtyRect.x, chunk.rect.x);
    const intersectWorldY0 = Math.max(dirtyRect.y, chunk.rect.y);
    const intersectWorldX1 = Math.min(right, chunkRight);
    const intersectWorldY1 = Math.min(bottom, chunkBottom);

    const localDirty: Rect = {
      x: intersectWorldX0 - chunk.rect.x,
      y: intersectWorldY0 - chunk.rect.y,
      width: intersectWorldX1 - intersectWorldX0,
      height: intersectWorldY1 - intersectWorldY0,
    };

    chunk.dirty = true;
    chunk.dirtyRect = chunk.dirtyRect ? coalesceRect(chunk.dirtyRect, localDirty) : localDirty;
  }
}

export function carveCircle(
  data: TerrainMaskData,
  surfaceY: Int16Array,
  chunks: readonly TerrainChunk[],
  x: number,
  y: number,
  radius: number,
): Rect | null {
  if (radius <= 0) return null;
  const effectiveRadius = Math.min(radius, MAX_CARVE_RADIUS);

  const minX = clamp(Math.floor(x - effectiveRadius), 0, data.width - 1);
  const maxX = clamp(Math.ceil(x + effectiveRadius), 0, data.width - 1);
  const minY = clamp(Math.floor(y - effectiveRadius), 0, data.height - 1);
  const maxY = clamp(Math.ceil(y + effectiveRadius), 0, data.height - 1);

  if (minX > maxX || minY > maxY) return null;

  const r2 = effectiveRadius * effectiveRadius;
  let changed = false;
  let actualMinX = maxX;
  let actualMaxX = minX;
  let actualMinY = maxY;
  let actualMaxY = minY;

  for (let py = minY; py <= maxY; py += 1) {
    const dy = py - y;
    const dy2 = dy * dy;
    const rowOffset = py * data.width;
    for (let px = minX; px <= maxX; px += 1) {
      const dx = px - x;
      if (dx * dx + dy2 > r2) continue;
      const index = rowOffset + px;
      if (data.pixels[index] === 0) continue;

      data.pixels[index] = 0;
      changed = true;
      if (px < actualMinX) actualMinX = px;
      if (px > actualMaxX) actualMaxX = px;
      if (py < actualMinY) actualMinY = py;
      if (py > actualMaxY) actualMaxY = py;
    }
  }

  if (!changed) return null;

  for (let px = actualMinX; px <= actualMaxX; px += 1) {
    refreshSurfaceColumn(data, surfaceY, px, actualMinY, actualMaxY);
  }

  const dirtyRect: Rect = {
    x: actualMinX,
    y: actualMinY,
    width: actualMaxX - actualMinX + 1,
    height: actualMaxY - actualMinY + 1,
  };

  markChunksDirty(chunks, dirtyRect);
  return dirtyRect;
}

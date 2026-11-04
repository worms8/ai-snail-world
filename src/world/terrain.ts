/**
 * Destructible terrain contracts. 1 byte per pixel: 0 = air, 255 = solid.
 * The concrete mask/chunk implementation arrives in Phase 2 (see docs/TERRAIN.md).
 */

import type { PointOfInterestId } from '../core/index';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TerrainMaskData {
  width: number;
  height: number;
  /** Row-major, length = width * height. 0 = air, 255 = solid. */
  pixels: Uint8Array;
}

export interface TerrainChunk {
  readonly index: number;
  readonly column: number;
  readonly row: number;
  readonly rect: Rect;
  readonly textureKey: string;
  dirty: boolean;
  dirtyRect: Rect | null;
}

export interface TerrainQuery {
  isSolid(x: number, y: number): boolean;
  /** First solid pixel at or below (x, y), or null when the column is open. */
  groundHeightBelow(x: number, y: number): number | null;
  /** Normalised surface normal sampled around x. */
  surfaceNormal(x: number, y: number): { x: number; y: number };
  isBodyFree(x: number, y: number, width: number, height: number): boolean;
}

export interface TerrainCarver extends TerrainQuery {
  readonly data: TerrainMaskData;
  readonly chunks: readonly TerrainChunk[];
  readonly surfaceY: Int16Array;
  /** Returns the merged dirty rectangle, or null when nothing was removed. */
  carveCircle(x: number, y: number, radius: number): Rect | null;
  /** Coalesced dirty regions since the last render pass. */
  takeDirtyRects(): readonly Rect[];
  /** Chunks that need repainting since the last pass. */
  takeDirtyChunks(): readonly TerrainChunk[];
}

export interface PointOfInterest {
  id: PointOfInterestId;
  name: string;
  x: number;
  y: number;
  /** Activities snails may perform here, e.g. "look", "rest", "eat". */
  activities: readonly string[];
}

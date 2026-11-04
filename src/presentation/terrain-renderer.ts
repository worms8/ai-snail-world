/**
 * Mask → chunk canvases → Phaser textures. Chunking keeps carving cheap:
 * only dirty chunks are repainted in renderDirty().
 */

import type Phaser from 'phaser';
import { TERRAIN_CHUNK_SIZE, TERRAIN_EDGE_WIDTH } from '../core/index';
import type { Rect, TerrainMask } from '../world/index';
import { terrainPixelColor } from './terrain-palette';

export class TerrainRenderer {
  private readonly images: Phaser.GameObjects.Image[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly mask: TerrainMask,
  ) {}

  create(): void {
    const { width, height } = this.mask.data;
    const columns = Math.ceil(width / TERRAIN_CHUNK_SIZE);
    const rows = Math.ceil(height / TERRAIN_CHUNK_SIZE);

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const rect: Rect = {
          x: column * TERRAIN_CHUNK_SIZE,
          y: row * TERRAIN_CHUNK_SIZE,
          width: Math.min(TERRAIN_CHUNK_SIZE, width - column * TERRAIN_CHUNK_SIZE),
          height: Math.min(TERRAIN_CHUNK_SIZE, height - row * TERRAIN_CHUNK_SIZE),
        };
        const key = `terrain-chunk-${column}-${row}`;
        if (this.scene.textures.exists(key)) this.scene.textures.remove(key);

        const texture = this.scene.textures.createCanvas(key, rect.width, rect.height);
        if (!texture) continue;

        this.paintFull(texture, rect);
        const image = this.scene.add.image(rect.x, rect.y, key).setOrigin(0, 0).setDepth(0);
        this.images.push(image);
      }
    }
  }

  destroy(): void {
    for (const image of this.images) image.destroy();
    this.images.length = 0;
  }

  renderDirty(): void {
    const dirtyChunks = this.mask.takeDirtyChunks();
    for (const chunk of dirtyChunks) {
      if (!chunk.dirtyRect) {
        chunk.dirty = false;
        continue;
      }

      const texture = this.scene.textures.get(chunk.textureKey) as
        Phaser.Textures.CanvasTexture | undefined;
      if (!texture?.context) {
        chunk.dirty = false;
        chunk.dirtyRect = null;
        continue;
      }

      this.paintDirty(texture, chunk.rect, chunk.dirtyRect);
      chunk.dirty = false;
      chunk.dirtyRect = null;
    }
  }

  private paintFull(texture: Phaser.Textures.CanvasTexture, rect: Rect): void {
    const context = texture.context;
    const imageData = context.createImageData(rect.width, rect.height);
    const data = imageData.data;

    for (let y = 0; y < rect.height; y += 1) {
      for (let x = 0; x < rect.width; x += 1) {
        const color = terrainPixelColor(this.mask, rect.x + x, rect.y + y);
        if (!color) continue;
        const offset = (y * rect.width + x) * 4;
        data[offset] = color.r;
        data[offset + 1] = color.g;
        data[offset + 2] = color.b;
        data[offset + 3] = 255;
      }
    }

    context.putImageData(imageData, 0, 0);
    texture.refresh();
  }

  private paintDirty(
    texture: Phaser.Textures.CanvasTexture,
    chunkRect: Rect,
    dirtyRect: Rect,
  ): void {
    const x0 = Math.max(0, dirtyRect.x - TERRAIN_EDGE_WIDTH);
    const y0 = Math.max(0, dirtyRect.y - TERRAIN_EDGE_WIDTH);
    const x1 = Math.min(chunkRect.width, dirtyRect.x + dirtyRect.width + TERRAIN_EDGE_WIDTH);
    const y1 = Math.min(chunkRect.height, dirtyRect.y + dirtyRect.height + TERRAIN_EDGE_WIDTH);
    const width = x1 - x0;
    const height = y1 - y0;
    if (width <= 0 || height <= 0) return;

    const context = texture.context;
    const imageData = context.createImageData(width, height);
    const data = imageData.data;

    for (let dy = 0; dy < height; dy += 1) {
      const worldY = chunkRect.y + y0 + dy;
      for (let dx = 0; dx < width; dx += 1) {
        const worldX = chunkRect.x + x0 + dx;
        const color = terrainPixelColor(this.mask, worldX, worldY);
        const offset = (dy * width + dx) * 4;
        if (color) {
          data[offset] = color.r;
          data[offset + 1] = color.g;
          data[offset + 2] = color.b;
          data[offset + 3] = 255;
        } else {
          data[offset] = 0;
          data[offset + 1] = 0;
          data[offset + 2] = 0;
          data[offset + 3] = 0;
        }
      }
    }

    context.putImageData(imageData, x0, y0);
    texture.refresh();
  }
}

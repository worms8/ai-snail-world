/**
 * Mask → chunk canvases → Phaser textures. Chunking keeps a future carve pass
 * cheap: only dirty chunks will be repainted. Phase 1 paints every chunk once.
 */

import type Phaser from 'phaser';
import { TERRAIN_CHUNK_SIZE } from '../core/index';
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

        this.paint(texture, rect);
        const image = this.scene.add.image(rect.x, rect.y, key).setOrigin(0, 0).setDepth(0);
        this.images.push(image);
      }
    }
  }

  destroy(): void {
    for (const image of this.images) image.destroy();
    this.images.length = 0;
  }

  private paint(texture: Phaser.Textures.CanvasTexture, rect: Rect): void {
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
}

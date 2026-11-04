/**
 * Cosmetic munch FX: soil crumbs and dust puffs.
 * Purely presentation; never affects collision or simulation truth.
 * See docs/TERRAIN.md §5 and §7.
 */

import type Phaser from 'phaser';

const CRUMB_COLORS = [0x9c6b43, 0x6b4429, 0x3b2a20, 0x6cc04a];

export function spawnCrumbs(
  scene: Phaser.Scene,
  x: number,
  y: number,
  facing: 'left' | 'right',
  count = 8,
): void {
  const dir = facing === 'left' ? -1 : 1;

  for (let i = 0; i < count; i += 1) {
    const color = CRUMB_COLORS[Math.floor(Math.random() * CRUMB_COLORS.length)] ?? 0x9c6b43;
    const size = Math.random() < 0.3 ? 3 : 2;
    const crumb = scene.add
      .rectangle(x + (Math.random() - 0.5) * 8, y + (Math.random() - 0.5) * 8, size, size, color)
      .setDepth(5);

    const vx = dir * (20 + Math.random() * 80) + (Math.random() - 0.5) * 20;
    const vy = -40 - Math.random() * 80;
    const duration = 400 + Math.random() * 300;

    scene.tweens.add({
      targets: crumb,
      x: crumb.x + vx * (duration / 1000),
      y: crumb.y + vy * (duration / 1000) + 0.5 * 900 * Math.pow(duration / 1000, 2),
      alpha: 0,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        crumb.destroy();
      },
    });
  }
}

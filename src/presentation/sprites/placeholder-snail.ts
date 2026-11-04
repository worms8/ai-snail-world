/**
 * Procedural Phase 1 snail. It is deliberately a single Graphics object: final
 * art replaces this file with the layered rig from ART_BIBLE §E1, without any
 * code outside the presentation module changing.
 */

import type Phaser from 'phaser';

const OUTLINE = 0x3b2a20;
const BODY = 0xf7c9a0;
const BODY_SHADOW = 0xd9a579;
const BODY_LIGHT = 0xffe3c4;
const SHELL = 0xff8fa3;
const SHELL_LIGHT = 0xffc2cd;
const EYE_WHITE = 0xfffdf4;

function drawBody(graphics: Phaser.GameObjects.Graphics): void {
  graphics.lineStyle(2, OUTLINE, 1);

  graphics.fillStyle(BODY, 1);
  graphics.fillEllipse(0, -11, 58, 22);
  graphics.strokeEllipse(0, -11, 58, 22);

  graphics.fillStyle(BODY_SHADOW, 1);
  graphics.fillEllipse(0, -4, 54, 8);

  graphics.fillStyle(BODY_LIGHT, 1);
  graphics.fillEllipse(18, -19, 20, 20);
  graphics.strokeEllipse(18, -19, 20, 20);

  graphics.fillStyle(SHELL, 1);
  graphics.fillCircle(-9, -28, 18);
  graphics.strokeCircle(-9, -28, 18);
  graphics.fillStyle(SHELL_LIGHT, 1);
  graphics.fillCircle(-14, -34, 6);
  graphics.lineStyle(2, OUTLINE, 1);
  graphics.beginPath();
  graphics.arc(-9, -28, 12, 0.2, Math.PI * 1.75);
  graphics.strokePath();
  graphics.beginPath();
  graphics.arc(-9, -28, 5, Math.PI * 0.4, Math.PI * 2);
  graphics.strokePath();

  graphics.lineStyle(2, OUTLINE, 1);
  graphics.lineBetween(17, -25, 14, -42);
  graphics.lineBetween(22, -25, 25, -43);
  graphics.lineBetween(23, -16, 30, -20);
  graphics.lineBetween(23, -13, 30, -13);

  graphics.fillStyle(EYE_WHITE, 1);
  graphics.fillCircle(14, -43, 4.5);
  graphics.fillCircle(25, -44, 4.5);
  graphics.lineStyle(1.5, OUTLINE, 1);
  graphics.strokeCircle(14, -43, 4.5);
  graphics.strokeCircle(25, -44, 4.5);

  graphics.fillStyle(OUTLINE, 1);
  graphics.fillCircle(15, -43, 2.2);
  graphics.fillCircle(26, -44, 2.2);
  graphics.fillStyle(EYE_WHITE, 1);
  graphics.fillCircle(15.6, -43.7, 0.8);
  graphics.fillCircle(26.6, -44.7, 0.8);

  graphics.lineStyle(1.5, OUTLINE, 1);
  graphics.beginPath();
  graphics.arc(24, -15, 3, 0.2, Math.PI - 0.2);
  graphics.strokePath();
}

export function createPlaceholderSnail(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const graphics = scene.add.graphics();
  drawBody(graphics);
  return scene.add.container(0, 0, [graphics]).setDepth(10);
}

/** Cheap idle/crawl breathing; the scene owns movement interpolation. */
export function posePlaceholderSnail(
  snail: Phaser.GameObjects.Container,
  moving: boolean,
  timeSeconds: number,
): void {
  const speed = moving ? 10 : 2.5;
  const amount = moving ? 0.025 : 0.012;
  const facing = snail.scaleX < 0 ? -1 : 1;
  snail.setScale(facing, 1 + Math.sin(timeSeconds * speed) * amount);
}

import Phaser from 'phaser';
import {
  FIXED_DELTA_SECONDS,
  MUNCH_INTERVAL_MS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  lerp,
} from '../../core/index';
import type { KinematicState } from '../../world/index';
import { SimulationClock } from '../../world/index';
import { spawnCrumbs } from '../fx/crumbs';
import { DEFAULT_LOCALE, uiString } from '../i18n';
import { createPlaceholderSnail, posePlaceholderSnail } from '../sprites/placeholder-snail';
import { TerrainRenderer } from '../terrain-renderer';
import type { WorldViewContext } from '../world-view';

export class WorldScene extends Phaser.Scene {
  private readonly clock = new SimulationClock();
  private terrainRenderer: TerrainRenderer | null = null;
  private snail!: Phaser.GameObjects.Container;
  private hud!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyQ!: Phaser.Input.Keyboard.Key;
  private previousPlayer!: KinematicState;
  private currentPlayer!: KinematicState;
  private nextMunchTime = 0;

  constructor(private readonly context: WorldViewContext) {
    super('WorldScene');
  }

  create(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor('#bfe8ff');

    this.terrainRenderer = new TerrainRenderer(this, this.context.terrain);
    this.terrainRenderer.create();

    this.currentPlayer = { ...this.context.player.getPlayer() };
    this.previousPlayer = { ...this.currentPlayer };
    this.snail = createPlaceholderSnail(this);
    this.snail.setPosition(this.currentPlayer.x, this.currentPlayer.y);
    this.snail.setScale(this.currentPlayer.facing === 'left' ? -1 : 1, 1);

    this.cameras.main.setDeadzone(160, 100);
    this.cameras.main.startFollow(this.snail, true, 0.12, 0.12);

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyQ = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    }

    this.hud = this.add
      .text(16, this.scale.height - 16, uiString(DEFAULT_LOCALE, 'hud.controls'), {
        fontFamily: '"Segoe UI", system-ui, sans-serif',
        fontSize: '15px',
        color: '#3b2a20',
        backgroundColor: '#fffdf4',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0, 1)
      .setScrollFactor(0)
      .setDepth(1000);

    this.scale.on('resize', this.layoutHud, this);
    this.events.once('shutdown', () => {
      this.scale.off('resize', this.layoutHud, this);
      this.terrainRenderer?.destroy();
      this.terrainRenderer = null;
    });
  }

  override update(time: number, deltaMilliseconds: number): void {
    if (this.keyQ?.isDown && time >= this.nextMunchTime) {
      this.nextMunchTime = time + MUNCH_INTERVAL_MS;
      const carved = this.context.player.munch();
      if (carved) {
        const facingDir = this.currentPlayer.facing === 'left' ? -1 : 1;
        const mouthX = this.currentPlayer.x + facingDir * 20;
        const mouthY = this.currentPlayer.y - 8;
        spawnCrumbs(this, mouthX, mouthY, this.currentPlayer.facing);
      }
    }

    const direction = this.readDirection();
    const alpha = this.clock.advance(deltaMilliseconds / 1000, () => {
      this.previousPlayer = this.currentPlayer;
      this.context.player.stepPlayer(direction, FIXED_DELTA_SECONDS);
      this.currentPlayer = { ...this.context.player.getPlayer() };
    });

    this.snail.setPosition(
      lerp(this.previousPlayer.x, this.currentPlayer.x, alpha),
      lerp(this.previousPlayer.y, this.currentPlayer.y, alpha),
    );

    const facing = this.currentPlayer.facing === 'left' ? -1 : 1;
    if (Math.sign(this.snail.scaleX) !== facing) this.snail.setScale(facing, this.snail.scaleY);
    posePlaceholderSnail(this.snail, this.currentPlayer.vx !== 0, time / 1000);

    this.terrainRenderer?.renderDirty();
  }

  private readDirection(): number {
    if (!this.cursors) return 0;
    const left = this.cursors.left.isDown || this.keyA?.isDown;
    const right = this.cursors.right.isDown || this.keyD?.isDown;
    return Number(Boolean(right)) - Number(Boolean(left));
  }

  private layoutHud(): void {
    this.hud.setPosition(16, this.scale.height - 16);
  }
}

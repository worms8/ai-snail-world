import Phaser from 'phaser';

/** Phase 1 has no external assets; keep the loading scene in place for Phase 4. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.scene.start('WorldScene');
  }
}

import Phaser from 'phaser';
import { BootScene, WorldScene } from '../presentation/index';
import type { GameContext } from './wiring';

/** Creates the one Phaser game instance for the page. */
export function createGame(parent: HTMLElement, context: GameContext): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#bfe8ff',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: parent.clientWidth || window.innerWidth,
      height: parent.clientHeight || window.innerHeight,
    },
    render: { antialias: true, roundPixels: false },
    scene: [new BootScene(), new WorldScene(context)],
  });
}

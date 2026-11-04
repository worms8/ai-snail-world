import { createGame } from './game';
import { createGameContext } from './wiring';

/** Phase 1 bootstrap: build the world context, then hand the page to Phaser. */
export function bootstrap(root: HTMLElement): void {
  root.replaceChildren();
  const context = createGameContext();
  createGame(root, context);
}

/**
 * The only surface the presentation needs from the simulation. `app` implements
 * it; scenes read immutable snapshots and never mutate world state directly.
 */

import type { EventBus } from '../core/index';
import type { KinematicState, TerrainMask } from '../world/index';

export interface PlayerSource {
  getPlayer(): KinematicState;
  stepPlayer(direction: number, deltaSeconds: number): void;
  munch(): boolean;
}

export interface WorldViewContext {
  readonly terrain: TerrainMask;
  readonly player: PlayerSource;
  readonly eventBus?: EventBus;
}

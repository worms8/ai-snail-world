import {
  DEFAULT_WORLD_SEED,
  MUNCH_RADIUS,
  PLAYER_START_X,
  WORLD_HEIGHT,
  createEventBus,
} from '../core/index';
import type { EventBus } from '../core/index';
import type { PlayerSource, WorldViewContext } from '../presentation/index';
import { createKinematicState, createTerrainMask, stepKinematics } from '../world/index';
import type { KinematicState, TerrainMask } from '../world/index';

class PlayerSimulation implements PlayerSource {
  private state: KinematicState;

  constructor(
    private readonly terrain: TerrainMask,
    startX: number,
    private readonly eventBus: EventBus,
  ) {
    const ground = terrain.groundHeightBelow(startX, 0) ?? WORLD_HEIGHT - 40;
    this.state = createKinematicState(startX, ground);
  }

  getPlayer(): KinematicState {
    return this.state;
  }

  stepPlayer(direction: number, deltaSeconds: number): void {
    this.state = stepKinematics(this.state, { direction }, this.terrain, deltaSeconds);
  }

  munch(): boolean {
    const facingDir = this.state.facing === 'left' ? -1 : 1;
    const mouthX = this.state.x + facingDir * 20;
    const mouthY = this.state.y - 8;

    const dirty = this.terrain.carveCircle(mouthX, mouthY, MUNCH_RADIUS);
    if (!dirty) return false;

    this.eventBus.emit('TerrainCarved', {
      x: mouthX,
      y: mouthY,
      radius: MUNCH_RADIUS,
      dirty,
    });
    return true;
  }
}

export interface GameContext extends WorldViewContext {
  readonly seed: string;
  readonly eventBus: EventBus;
}

export function createGameContext(seed = DEFAULT_WORLD_SEED): GameContext {
  const eventBus = createEventBus();
  const terrain = createTerrainMask(seed);
  const player = new PlayerSimulation(terrain, PLAYER_START_X, eventBus);
  return { seed, terrain, player, eventBus };
}

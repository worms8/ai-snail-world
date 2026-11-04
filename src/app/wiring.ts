import { DEFAULT_WORLD_SEED, PLAYER_START_X, WORLD_HEIGHT } from '../core/index';
import type { PlayerSource, WorldViewContext } from '../presentation/index';
import { createKinematicState, createTerrainMask, stepKinematics } from '../world/index';
import type { KinematicState, TerrainMask } from '../world/index';

class PlayerSimulation implements PlayerSource {
  private state: KinematicState;

  constructor(
    private readonly terrain: TerrainMask,
    startX: number,
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
}

export interface GameContext extends WorldViewContext {
  readonly seed: string;
}

export function createGameContext(seed = DEFAULT_WORLD_SEED): GameContext {
  const terrain = createTerrainMask(seed);
  const player = new PlayerSimulation(terrain, PLAYER_START_X);
  return { seed, terrain, player };
}

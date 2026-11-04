/** Simulation-side entity state. Rendering reads snapshots, never mutates them. */

import type { SnailId } from '../core/index';
import type { EmotionId } from '../domain/index';

export interface KinematicState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  grounded: boolean;
}

export type LocomotionState =
  'idle' | 'crawl' | 'fast-crawl' | 'rest' | 'sleep' | 'fall' | 'land' | 'munch';

export type SnailActivity =
  | 'wander'
  | 'walk-to-poi'
  | 'rest'
  | 'sleep'
  | 'look-around'
  | 'approach-snail'
  | 'flee-hole'
  | 'talk'
  | 'munch';

export interface SnailBody {
  id: SnailId;
  kinematic: KinematicState;
  locomotion: LocomotionState;
  activity: SnailActivity;
  expression: EmotionId;
  /** Set while the player is controlling this snail. */
  playerControlled: boolean;
}

export interface WorldSnapshot {
  tick: number;
  snails: readonly SnailBody[];
}

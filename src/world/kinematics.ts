/**
 * Custom snail kinematics: slope walking with a small step-up, snap-down on
 * gentle descents and gravity for ledges. Pure headless logic, so the same code
 * runs in tests, the browser and future off-screen simulation.
 */

import {
  SNAIL_BODY_HEIGHT,
  SNAIL_BODY_WIDTH,
  SNAIL_GRAVITY,
  SNAIL_MAX_FALL_SPEED,
  SNAIL_MAX_SNAP_DOWN,
  SNAIL_STEP_HEIGHT,
  SNAIL_WALK_SPEED,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  clamp,
} from '../core/index';
import type { TerrainQuery } from './terrain';
import type { KinematicState } from './world-state';

export interface MovementIntent {
  /** -1 = left, 0 = idle, 1 = right. */
  direction: number;
}

export interface KinematicsOptions {
  walkSpeed?: number;
  gravity?: number;
  maxFallSpeed?: number;
  stepHeight?: number;
  maxSnapDown?: number;
  bodyWidth?: number;
  bodyHeight?: number;
  worldWidth?: number;
  worldHeight?: number;
}

const DEFAULTS: Required<KinematicsOptions> = {
  walkSpeed: SNAIL_WALK_SPEED,
  gravity: SNAIL_GRAVITY,
  maxFallSpeed: SNAIL_MAX_FALL_SPEED,
  stepHeight: SNAIL_STEP_HEIGHT,
  maxSnapDown: SNAIL_MAX_SNAP_DOWN,
  bodyWidth: SNAIL_BODY_WIDTH,
  bodyHeight: SNAIL_BODY_HEIGHT,
  worldWidth: WORLD_WIDTH,
  worldHeight: WORLD_HEIGHT,
};

export function createKinematicState(
  x: number,
  y: number,
  facing: KinematicState['facing'] = 'right',
  grounded = true,
): KinematicState {
  return { x, y, vx: 0, vy: 0, facing, grounded };
}

export function stepKinematics(
  state: KinematicState,
  intent: MovementIntent,
  terrain: TerrainQuery,
  deltaSeconds: number,
  options: KinematicsOptions = {},
): KinematicState {
  const config = { ...DEFAULTS, ...options };
  const direction = Math.sign(intent.direction);
  const facing = direction === 0 ? state.facing : direction < 0 ? 'left' : 'right';
  const halfBody = config.bodyWidth / 2;
  const minX = halfBody;
  const maxX = config.worldWidth - halfBody;

  let x = state.x;
  let y = state.y;
  let vy = state.vy;
  let grounded = state.grounded;
  const startX = x;

  const dx = direction * config.walkSpeed * deltaSeconds;
  if (dx !== 0) {
    const targetX = clamp(x + dx, minX, maxX);
    if (grounded) {
      const currentGround = terrain.groundHeightBelow(x, y - 1) ?? y;
      const probeStart = currentGround - config.stepHeight - 1;
      const groundAhead = terrain.groundHeightBelow(targetX, probeStart);
      const blockedByStep = groundAhead !== null && groundAhead < currentGround - config.stepHeight;
      const candidateY = groundAhead !== null && groundAhead < y ? groundAhead : y;

      // Grounded movement is constrained by the ground under the body centre only.
      // Checking the full body box here would reject every slope: on a gentle climb
      // the leading foot is one or two pixels above the centre, which reads as a
      // wall even though it is walkable. Vertical walls are caught by blockedByStep;
      // the body box still guards airborne movement.
      if (!blockedByStep) {
        x = targetX;
        if (candidateY < y) y = candidateY;
      }
    } else if (terrain.isBodyFree(targetX, y, config.bodyWidth, config.bodyHeight)) {
      x = targetX;
    }
  }

  if (grounded) {
    const ground = terrain.groundHeightBelow(x, y - 1);
    if (ground !== null && ground - y <= config.maxSnapDown) {
      y = ground;
      vy = 0;
    } else {
      grounded = false;
    }
  }

  if (!grounded) {
    vy = Math.min(vy + config.gravity * deltaSeconds, config.maxFallSpeed);
    const startY = y;
    y += vy * deltaSeconds;

    const landing = terrain.groundHeightBelow(x, Math.max(0, startY - 1));
    if (landing !== null && y >= landing) {
      y = landing;
      vy = 0;
      grounded = true;
    } else if (y >= config.worldHeight) {
      y = config.worldHeight;
      vy = 0;
      grounded = true;
    }
  }

  const moved = x !== startX;
  return {
    x,
    y,
    vx: moved ? direction * config.walkSpeed : 0,
    vy,
    facing,
    grounded,
  };
}

/** Shared constants. Runtime tuning that designers may change lives here, not inline. */

export const TICK_RATE = 30;
export const FIXED_DELTA_SECONDS = 1 / TICK_RATE;
export const MAX_CATCH_UP_TICKS = 5;

export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 1200;

export const TERRAIN_CHUNK_SIZE = 256;
export const TERRAIN_EDGE_WIDTH = 2;
export const TERRAIN_GRASS_HEIGHT = 10;

export const SNAIL_BODY_WIDTH = 48;
export const SNAIL_BODY_HEIGHT = 40;
export const SNAIL_STEP_HEIGHT = 8;

export const SNAIL_WALK_SPEED = 90;
export const SNAIL_GRAVITY = 1800;
export const SNAIL_MAX_FALL_SPEED = 900;
export const SNAIL_MAX_SNAP_DOWN = 6;

export const DEFAULT_WORLD_SEED = 'garden-01';
export const PLAYER_START_X = 480;

export const SOCIAL_UPDATE_INTERVAL_MS = 200;
export const OFFSCREEN_UPDATE_INTERVAL_MS = 200;

export const MAX_SNAILS = 30;
export const MAX_CONCURRENT_CONVERSATIONS = 3;

export const SAVE_SCHEMA_VERSION = 1;

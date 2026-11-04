/** Presentation-only contracts. Phaser types never leak outside this module. */

import type { SnailId } from '../core/index';
import type { EmotionId, GestureId } from '../domain/index';
import type { SnailBody } from '../world/index';

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface RenderSnapshot {
  tick: number;
  /** Interpolation factor 0..1 between previous and current simulation state. */
  alpha: number;
  camera: CameraState;
  snails: readonly SnailBody[];
}

export interface SpeechBubble {
  speakerId: SnailId;
  text: string;
  emotion: EmotionId;
  gesture: GestureId | null;
  /** Milliseconds the bubble should stay visible. */
  durationMs: number;
}

export interface EmotionIconRequest {
  snailId: SnailId;
  emotion: EmotionId;
  durationMs: number;
}

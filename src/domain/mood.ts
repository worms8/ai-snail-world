/** Mood is a tiny continuous state; numbers drive Tier-1 decisions, not prompts. */

import { clamp } from '../core/index';

export interface Mood {
  /** -1 (miserable) .. 1 (delighted). */
  valence: number;
  /** 0 (calm) .. 1 (worked up). */
  arousal: number;
  /** 0 (exhausted) .. 1 (fresh). */
  energy: number;
}

export interface MoodBaseline {
  valence: number;
  arousal: number;
  energy: number;
}

/** Per-second decay rates toward the personality baseline. */
export const MOOD_DECAY_PER_SECOND = {
  valence: 0.004,
  arousal: 0.01,
  energy: 0.002,
} as const;

export function decayMood(mood: Mood, baseline: MoodBaseline, deltaSeconds: number): Mood {
  return {
    valence: clamp(
      mood.valence +
        (baseline.valence - mood.valence) * MOOD_DECAY_PER_SECOND.valence * deltaSeconds,
      -1,
      1,
    ),
    arousal: clamp(
      mood.arousal +
        (baseline.arousal - mood.arousal) * MOOD_DECAY_PER_SECOND.arousal * deltaSeconds,
      0,
      1,
    ),
    energy: clamp(
      mood.energy + (baseline.energy - mood.energy) * MOOD_DECAY_PER_SECOND.energy * deltaSeconds,
      0,
      1,
    ),
  };
}

/** Aggregate snail model. All content is data-driven; this file only defines shapes. */

import type { SnailId } from '../core/index';
import type { MemoryEntry } from './memory';
import type { Mood, MoodBaseline } from './mood';
import type { ActorId, Relationship } from './relationships';

/** Big-Five-style traits, each 0..1. */
export interface Personality {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface SpeechStyle {
  /** Free-form note on vocabulary, e.g. "simple words, garden metaphors". */
  vocabulary: string;
  /** Target sentence length in words. */
  sentenceLength: 'short' | 'medium' | 'long';
  /** 1-3 signature phrases in Slovak. */
  catchphrases: readonly string[];
  /** Things this snail would never say. */
  neverSays: readonly string[];
}

export interface Preferences {
  likedPlaces: readonly string[];
  dislikedPlaces: readonly string[];
  likedTopics: readonly string[];
  dislikedTopics: readonly string[];
  likedSnails: readonly SnailId[];
  dislikedSnails: readonly SnailId[];
}

export interface Appearance {
  /** Palette id from the Art Bible, e.g. "peach". */
  bodyPalette: string;
  /** Palette id from the Art Bible, e.g. "rose". */
  shellPalette: string;
  /** Shell pattern catalog id: spiral | stripes | dots | zigzag. */
  shellPattern: string;
  /** Optional accessory catalog id, e.g. "glasses". */
  accessory: string | null;
  /** 0.9 .. 1.1 body size variance. */
  sizeScale: number;
}

export interface SnailIdentity {
  name: string;
  /** 1-2 sentences in Slovak. */
  backstory: string;
}

export interface Snail {
  id: SnailId;
  identity: SnailIdentity;
  personality: Personality;
  /** 2-3 short human-readable quirks. */
  quirks: readonly string[];
  speechStyle: SpeechStyle;
  preferences: Preferences;
  appearance: Appearance;
  mood: Mood;
  moodBaseline: MoodBaseline;
  /** Keyed by the other actor (snail or player). */
  relationships: Readonly<Record<string, Relationship>>;
  memory: readonly MemoryEntry[];
}

export type { ActorId, Relationship };

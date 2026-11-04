/** Relationship state. Numbers are the source of truth; tags are short UI hints. */

import type { SnailId } from '../core/index';
import { clamp } from '../core/index';

export type PlayerId = 'player';
export type ActorId = SnailId | PlayerId;

export interface Relationship {
  /** -100 (hate) .. 100 (adore). */
  affinity: number;
  /** -100 (distrust) .. 100 (complete trust). */
  trust: number;
  /** 0 (stranger) .. 100 (intimate). */
  familiarity: number;
  /** 0-3 short human-readable tags, e.g. "annoying", "best friend", "owes me a leaf". */
  tags: readonly string[];
  /** Simulation tick of the last interaction, 0 when never met. */
  lastInteractionTick: number;
}

export const RELATIONSHIP_RANGE = {
  affinity: { min: -100, max: 100 },
  trust: { min: -100, max: 100 },
  familiarity: { min: 0, max: 100 },
} as const;

export const NEUTRAL_RELATIONSHIP: Relationship = {
  affinity: 0,
  trust: 0,
  familiarity: 0,
  tags: [],
  lastInteractionTick: 0,
};

export function clampRelationship(relationship: Relationship): Relationship {
  return {
    ...relationship,
    affinity: clamp(
      relationship.affinity,
      RELATIONSHIP_RANGE.affinity.min,
      RELATIONSHIP_RANGE.affinity.max,
    ),
    trust: clamp(relationship.trust, RELATIONSHIP_RANGE.trust.min, RELATIONSHIP_RANGE.trust.max),
    familiarity: clamp(
      relationship.familiarity,
      RELATIONSHIP_RANGE.familiarity.min,
      RELATIONSHIP_RANGE.familiarity.max,
    ),
  };
}

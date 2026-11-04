/**
 * Conversation contracts. One LLM call returns the whole short script plus its
 * structured outcome; presentation plays lines, domain applies the outcome.
 */

import type { ConversationId, SnailId } from '../core/index';
import type { EmotionId, GestureId } from '../domain/index';

export type SpeakerSlot = 'a' | 'b';

export interface DialogueLine {
  speaker: SpeakerSlot;
  /** 1-140 characters, Slovak, with diacritics. */
  text: string;
  emotion: EmotionId;
  gesture?: GestureId;
}

export interface RelationshipDelta {
  /** -10 .. 10 */
  affinity: number;
  /** -10 .. 10 */
  trust: number;
  /** 0 .. 5 (familiarity only grows) */
  familiarity: number;
}

export interface MoodDelta {
  /** -0.5 .. 0.5 */
  valence: number;
  arousal: number;
  energy: number;
}

export interface MemoryDraft {
  speaker: SpeakerSlot;
  /** One short sentence in Slovak. */
  text: string;
  /** 1 .. 10 */
  importance: number;
}

export interface ConversationOutcome {
  relationshipDeltas: Record<SpeakerSlot, RelationshipDelta>;
  moodDeltas: Record<SpeakerSlot, MoodDelta>;
  memoryEntries: readonly MemoryDraft[];
  followUpIntent: string | null;
}

export interface ConversationScript {
  conversationId: ConversationId;
  participantIds: readonly [SnailId, SnailId];
  lines: readonly DialogueLine[];
  outcome: ConversationOutcome;
}

export type ConversationReason =
  'greeting' | 'shared_interest' | 'conflict' | 'comforting' | 'small_talk' | 'player_initiated';

export interface ConversationRequest {
  conversationId: ConversationId;
  aId: SnailId;
  bId: SnailId;
  reason: ConversationReason;
  locationTag: string;
  tick: number;
  /** 0..1, used for prompt hints and cache bucketing. */
  relationshipWarmth: number;
}

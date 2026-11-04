/**
 * Runtime validation for everything the LLM returns. Invalid output is repaired
 * once, then replaced by a canned script; it must never crash or stall the game.
 */

import { z } from 'zod';
import { EMOTION_IDS, GESTURE_IDS } from '../domain/index';

export const dialogueLineSchema = z.object({
  speaker: z.enum(['a', 'b']),
  text: z.string().trim().min(1).max(140),
  emotion: z.enum(EMOTION_IDS),
  gesture: z.enum(GESTURE_IDS).optional(),
});

export const relationshipDeltaSchema = z.object({
  affinity: z.number().min(-10).max(10),
  trust: z.number().min(-10).max(10),
  familiarity: z.number().min(0).max(5),
});

export const moodDeltaSchema = z.object({
  valence: z.number().min(-0.5).max(0.5),
  arousal: z.number().min(-0.5).max(0.5),
  energy: z.number().min(-0.5).max(0.5),
});

export const memoryDraftSchema = z.object({
  speaker: z.enum(['a', 'b']),
  text: z.string().trim().min(1).max(160),
  importance: z.number().int().min(1).max(10),
});

export const conversationOutcomeSchema = z.object({
  relationshipDeltas: z.object({ a: relationshipDeltaSchema, b: relationshipDeltaSchema }),
  moodDeltas: z.object({ a: moodDeltaSchema, b: moodDeltaSchema }),
  memoryEntries: z.array(memoryDraftSchema).min(0).max(2),
  followUpIntent: z.string().trim().max(120).nullable(),
});

export const conversationScriptSchema = z.object({
  lines: z.array(dialogueLineSchema).min(3).max(8),
  outcome: conversationOutcomeSchema,
});

export type RawConversationScript = z.infer<typeof conversationScriptSchema>;

export function parseConversationScript(raw: unknown): RawConversationScript {
  return conversationScriptSchema.parse(raw);
}

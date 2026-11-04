/**
 * Canonical emotion and gesture ids. The presentation catalog must provide a
 * variant for every id; unknown ids at runtime fall back to `neutral`.
 */

export const EMOTION_IDS = [
  'neutral',
  'joy',
  'sadness',
  'anger',
  'surprise',
  'fear',
  'shyness',
  'curiosity',
  'thinking',
  'boredom',
  'excitement',
  'love',
  'confusion',
] as const;

export type EmotionId = (typeof EMOTION_IDS)[number];

export const GESTURE_IDS = [
  'wave',
  'nod',
  'shake_head',
  'shrug',
  'point',
  'jump_for_joy',
  'shiver',
  'lean_in',
  'talk_loop',
] as const;

export type GestureId = (typeof GESTURE_IDS)[number];

export const isEmotionId = (value: string): value is EmotionId =>
  (EMOTION_IDS as readonly string[]).includes(value);

export const isGestureId = (value: string): value is GestureId =>
  (GESTURE_IDS as readonly string[]).includes(value);

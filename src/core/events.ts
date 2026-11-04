/**
 * Typed event catalog. This is the only place event names and payload shapes live.
 * Payloads use plain data (ids, numbers, strings) to keep core independent of domain.
 */

import type { ConversationId, MemoryId, SnailId } from './ids';

export interface SnailMetPayload {
  aId: SnailId;
  bId: SnailId;
  tick: number;
  distance: number;
}

export interface ConversationStartedPayload {
  conversationId: ConversationId;
  participantIds: readonly SnailId[];
  tick: number;
}

export interface DialogueLinePayload {
  conversationId: ConversationId;
  speakerId: SnailId;
  text: string;
  emotion: string;
  gesture?: string;
}

export interface ConversationEndedPayload {
  conversationId: ConversationId;
  participantIds: readonly SnailId[];
  reason: 'completed' | 'interrupted' | 'fallback';
  tick: number;
}

export interface EmotionChangedPayload {
  snailId: SnailId;
  emotion: string;
  intensity: number;
}

export interface MoodChangedPayload {
  snailId: SnailId;
  valence: number;
  arousal: number;
  energy: number;
}

export interface RelationshipChangedPayload {
  fromId: SnailId;
  toId: SnailId;
  affinity: number;
  trust: number;
  familiarity: number;
}

export interface MemoryAddedPayload {
  snailId: SnailId;
  memoryId: MemoryId;
  importance: number;
}

export interface TerrainCarvedPayload {
  x: number;
  y: number;
  radius: number;
  dirty: { x: number; y: number; width: number; height: number };
}

export interface LlmRequestFailedPayload {
  requestId: string;
  reason: 'timeout' | 'rate-limited' | 'invalid-json' | 'provider-error';
  willFallback: boolean;
}

export interface TickPayload {
  tick: number;
  deltaSeconds: number;
}

export interface EventMap {
  SnailMet: SnailMetPayload;
  ConversationStarted: ConversationStartedPayload;
  DialogueLine: DialogueLinePayload;
  ConversationEnded: ConversationEndedPayload;
  EmotionChanged: EmotionChangedPayload;
  MoodChanged: MoodChangedPayload;
  RelationshipChanged: RelationshipChangedPayload;
  MemoryAdded: MemoryAddedPayload;
  TerrainCarved: TerrainCarvedPayload;
  LlmRequestFailed: LlmRequestFailedPayload;
  Tick: TickPayload;
}

export type EventName = keyof EventMap;

export type Unsubscribe = () => void;

export interface EventBus {
  emit<K extends EventName>(name: K, payload: EventMap[K]): void;
  on<K extends EventName>(name: K, handler: (payload: EventMap[K]) => void): Unsubscribe;
}

export function createEventBus(): EventBus {
  type AnyHandler = (payload: unknown) => void;
  const listeners = new Map<EventName, Set<AnyHandler>>();

  return {
    emit<K extends EventName>(name: K, payload: EventMap[K]): void {
      const set = listeners.get(name);
      if (!set) return;
      for (const handler of set) {
        handler(payload);
      }
    },
    on<K extends EventName>(name: K, handler: (payload: EventMap[K]) => void): Unsubscribe {
      let set = listeners.get(name);
      if (!set) {
        set = new Set();
        listeners.set(name, set);
      }
      const genericHandler = handler as AnyHandler;
      set.add(genericHandler);
      return () => {
        set?.delete(genericHandler);
      };
    },
  };
}

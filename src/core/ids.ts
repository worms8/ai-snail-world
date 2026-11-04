/**
 * Branded identifiers. Branding stops accidental mixing of unrelated string ids
 * while staying JSON-friendly.
 */

export type SnailId = string & { readonly __brand: 'SnailId' };
export type ConversationId = string & { readonly __brand: 'ConversationId' };
export type MemoryId = string & { readonly __brand: 'MemoryId' };
export type PointOfInterestId = string & { readonly __brand: 'PointOfInterestId' };

export const asSnailId = (value: string): SnailId => value as SnailId;
export const asConversationId = (value: string): ConversationId => value as ConversationId;
export const asMemoryId = (value: string): MemoryId => value as MemoryId;
export const asPointOfInterestId = (value: string): PointOfInterestId => value as PointOfInterestId;

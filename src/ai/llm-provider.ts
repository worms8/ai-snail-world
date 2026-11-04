/**
 * Provider abstraction. DeepSeekProvider talks to our proxy; MockProvider returns
 * deterministic canned scripts so the game and tests run offline and for free.
 */

export type LlmRole = 'system' | 'user' | 'assistant';

export interface LlmMessage {
  role: LlmRole;
  content: string;
}

export interface LlmRequest {
  /** Correlation id, also used in server logs. */
  requestId: string;
  messages: readonly LlmMessage[];
  maxOutputTokens: number;
  temperature: number;
  /** Requests `response_format: { type: "json_object" }`. */
  jsonMode: boolean;
  /** Soft client-side deadline; the proxy enforces its own timeout too. */
  timeoutMs: number;
}

export interface LlmUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface LlmResponse {
  requestId: string;
  content: string;
  model: string;
  providerId: string;
  usage: LlmUsage;
  cacheHit: boolean;
}

export interface LlmProvider {
  readonly id: string;
  complete(request: LlmRequest): Promise<LlmResponse>;
}

export type LlmFailureReason =
  'timeout' | 'rate-limited' | 'invalid-json' | 'provider-error' | 'budget-exhausted' | 'offline';

export class LlmError extends Error {
  constructor(
    readonly reason: LlmFailureReason,
    message: string,
    readonly retryAfterMs: number | null = null,
  ) {
    super(message);
    this.name = 'LlmError';
  }
}

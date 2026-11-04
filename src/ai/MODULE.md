# ai

**Purpose:** autonomous decision-making and language generation contracts: Tier-1
utility scoring, conversation direction, prompt builders, provider abstraction, JSON
validation and fallback. The future code here must stay headless-testable.

**Public API (`index.ts`):**

- `DialogueLine`, `ConversationScript`, `ConversationOutcome`, `ConversationRequest`
- `conversationScriptSchema`, `parseConversationScript` (zod)
- `LlmProvider`, `LlmRequest`, `LlmResponse`, `LlmError`, `LlmFailureReason`

**Inputs / outputs:** takes `Snail`/`MemoryEntry`/relationship snapshots plus an `Rng`;
returns decisions, prompts and validated scripts. All network work is behind `LlmProvider`.

**May depend on:** `src/core`, `src/domain`. Never `world`, `presentation` or `app`.
No `fetch`, DOM, Phaser or `Date.now()` inside pure scoring functions.

**Events:** emits nothing directly. The app/simulation applies outcomes and emits
`ConversationStarted`, `DialogueLine`, `ConversationEnded`, `MemoryAdded`.

**Invariants:**

- Exactly one LLM call per NPC-to-NPC conversation (script + outcome together).
- Prompts are built by pure functions with a fixed token budget.
- LLM output is always schema-validated; repair once, then canned fallback.
- No LLM call is allowed to block the simulation tick.

**How to extend:** add a provider by implementing `LlmProvider`; add a dialogue reason
to `ConversationReason`; add prompt builders as new files exporting pure functions.

**Pitfalls:** never let prompt text carry full history; use the persona card + top-K
memories. Never import `src/ai/conversation-schema.ts` from outside this module.

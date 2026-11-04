# domain

**Purpose:** pure simulation state and rules: snail identity, personality, mood,
relationships and episodic memory. No Phaser, DOM, network or timers.

**Public API (`index.ts`):**

- `EmotionId`, `GestureId`, `EMOTION_IDS`, `GESTURE_IDS`, `isEmotionId`, `isGestureId`
- `Snail`, `SnailIdentity`, `Personality`, `SpeechStyle`, `Preferences`, `Appearance`
- `Mood`, `MoodBaseline`, `decayMood`
- `Relationship`, `ActorId`, `PlayerId`, `NEUTRAL_RELATIONSHIP`, `clampRelationship`
- `MemoryEntry`, `memoryRetrievalScore`, retrieval/compaction constants

**Inputs / outputs:** plain values in, plain values out. Deterministic when given an `Rng`.

**May depend on:** `src/core` only.

**Events:** none. Domain functions never emit; `ai`/`world` emit around them.

**Invariants:**

- Relationships are clamped to documented ranges (`-100..100`, familiarity `0..100`).
- Mood channels stay in range `valence -1..1`, `arousal/energy 0..1`.
- Every memory entry has a 1-10 importance and at least one participant.
- Numbers are simulation truth; LLM text never directly changes state.

**How to extend:** add a field to the interface, its default in `NEUTRAL_*`/baseline, a
validation schema for content JSON, and update `ARCHITECTURE.md` data models.

**Pitfalls:** importing `ai` or `world` here creates a cycle and breaks headless tests.
Do not store Phaser objects, DOM nodes or promises in domain state.

# core

**Purpose:** foundation types and helpers with no project dependencies: ids, typed events,
config constants, seeded RNG and math.

**Public API (`index.ts`):**

- `SnailId`, `ConversationId`, `MemoryId`, `PointOfInterestId` + `as*` constructors
- `EventMap`, `EventName`, `EventBus`, `Unsubscribe` and all payload interfaces
- `TICK_RATE`, `FIXED_DELTA_SECONDS`, world/terrain/snail constants, snail movement
  tuning, `DEFAULT_WORLD_SEED`, `PLAYER_START_X`, `SAVE_SCHEMA_VERSION`
- `createRng(seed)`, `Rng`, `hashString`
- `clamp`, `clamp01`, `lerp`, `distanceSq`, `moveToward`

**Inputs / outputs:** pure values and types. No I/O, no DOM, no Phaser, no network.

**May depend on:** nothing outside npm-free TypeScript. Never import another `src/` module.

**Events:** owns the event catalog; does not emit.

**Invariants:**

- No bare `Math.random()` anywhere in the project; use an injected `Rng`.
- Event payloads contain only plain data, never class instances.
- Constants are the single source of tuning numbers.

**How to extend:** add an event by adding its payload to `events.ts` and its entry to
`EventMap`. Add tuning numbers to `config.ts`. Never add gameplay state here.

**Pitfalls:** changing an event payload requires updating `ARCHITECTURE.md` and every
consumer. Do not put domain types in this module (it would create a cycle).

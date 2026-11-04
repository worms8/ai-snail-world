# app

**Purpose:** bootstrap and wiring only. Creates the simulation, provider, event bus,
Phaser game and presentation bridge; owns lifecycle and save loading. Contains no
gameplay rules.

**Public API (`index.ts`):**

- `bootstrap(root: HTMLElement): void` — creates the world context and the Phaser game.
- `createGameContext(seed?)` / `GameContext` and `createGame(...)` are internal wiring.

**Inputs / outputs:** browser DOM root in; running game out.

**May depend on:** every layer (`core`, `domain`, `ai`, `world`, `presentation`).
This is the only module allowed to import all of them.

**Events:** subscribes to the bus for logging/save triggers; does not define events.

**Invariants:**

- The DeepSeek API key never enters this module or the bundle.
- One simulation instance per page; fixed timestep driven by a single clock.
- No business logic here: wiring and lifecycle only.

**How to extend:** create collaborators, inject their interfaces into the simulation,
register scenes. Keep `main.ts` a three-line entry point.

**Pitfalls:** importing `server/` from here breaks the browser build. Do not use
`import.meta.env.VITE_*` for secrets; only harmless configuration may be public.

# AGENTS.md — start here

**AI Snail World** is a cozy 2D side-view browser simulation: you control one snail in a
small garden, talk to 6 AI-driven snails and watch their relationships and conversations.
Terrain is destructible (Worms-like bitmap carving). Slovak is the in-game language; code
and docs are English.

**Out of scope forever:** combat, inventory, levelling, quests, multiple game modes,
falling-sand physics, vector databases, mobile/touch support.

## Read this first (routing table)

Read only the rows that match your task, then stop reading.

| Task                            | Read exactly this                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| Terrain, carving, collision     | `docs/TERRAIN.md`, `src/world/MODULE.md`                                              |
| Snail movement / Tier 0         | `docs/AI_DESIGN.md` §2, `src/world/MODULE.md`, `src/ai/MODULE.md`                     |
| Social decisions / Tier 1       | `docs/AI_DESIGN.md` §3, `src/ai/MODULE.md`                                            |
| Conversations / LLM / prompts   | `docs/AI_DESIGN.md` §4–7, `src/ai/MODULE.md`, `ARCHITECTURE.md` §11                   |
| Memory / relationships / mood   | `docs/AI_DESIGN.md` §8, `src/domain/MODULE.md`                                        |
| Animations / emotions / sprites | `docs/ART_BIBLE.md` §4–6, `src/presentation/MODULE.md`                                |
| UI / HUD / speech bubbles       | `docs/ART_BIBLE.md` §7, `src/presentation/MODULE.md`, `src/presentation/i18n/sk.json` |
| Assets / placeholder art        | `assets/PROMPTS.md`, `assets/manifest.json`, `docs/ART_BIBLE.md`                      |
| Proxy / server / DeepSeek       | `server/MODULE.md`, `ARCHITECTURE.md` §11, `docs/DECISIONS.md` ADR-006                |
| Persistence / IndexedDB         | `ARCHITECTURE.md` §14, `src/app/MODULE.md`                                            |
| Tests                           | `docs/ROADMAP.md`, the matching `MODULE.md`, existing tests                           |
| Architecture change             | `ARCHITECTURE.md`, `docs/DECISIONS.md`, this file                                     |
| Any task                        | `docs/CHANGELOG_AI.md` (last entry only)                                              |

## Commands

```bash
npm install          # install exact pinned versions
npm run dev          # Vite dev server at http://localhost:5173
npm run server:dev   # LLM proxy at http://localhost:8787 (health only in Phase 0)
npm run build        # typecheck + production build
npm test             # Vitest (headless)
npm run lint         # ESLint + dependency-cruiser
npm run docs:check   # MODULE.md, line limits, file map, dependency gates
```

## Hard rules (all mandatory)

1. Source files: target ≤ 200 lines, hard maximum 300. Split before exceeding.
2. One responsibility per file; one purpose per module folder.
3. Every `src/<module>/` and `server/` has `MODULE.md` (≤ 60 lines).
4. Import another module only through its `index.ts` (enforced by dependency-cruiser).
5. Layers: `core` → `domain` → `ai`/`world` → `presentation` → `app`. No cycles.
6. `core`, `domain`, `ai`, `world` are headless: no Phaser, DOM, `fetch`, `Date.now()` in
   pure scoring. Only `presentation` uses Phaser.
7. Simulation is fixed-step (30 Hz) and separate from rendering (60 FPS interpolation).
8. All cross-module communication uses the typed event bus in `src/core/events.ts`.
9. All content (snails, emotions, animations, world layout, UI strings) is data/JSON.
10. All randomness comes from an injected seeded `Rng`; never bare `Math.random()`.
11. Every LLM response is schema-validated: repair once, then canned fallback.
12. The DeepSeek key lives only in `.env` and `server/`; never in the browser bundle.
13. A change is not done until the affected `MODULE.md`, `ARCHITECTURE.md` and
    `docs/CHANGELOG_AI.md` are updated.

## Code style and naming

- `kebab-case.ts` files, `PascalCase` types/classes, `SCREAMING_SNAKE_CASE` constants.
- Explicit names (`conversation-director.ts`), no clever abbreviations.
- Prefer boring, obvious code. No speculative abstractions.
- TypeScript strict mode. No `any` unless isolated at an external boundary and justified.
- Comments explain _why_, not _what_. Docs are part of the code.

## Where new files go

| Kind                                  | Location                          |
| ------------------------------------- | --------------------------------- |
| Shared types/helpers/events           | `src/core/`                       |
| Pure state/rules                      | `src/domain/`                     |
| Scoring, prompts, providers, director | `src/ai/`                         |
| Terrain, kinematics, simulation       | `src/world/`                      |
| Phaser, sprites, UI, audio            | `src/presentation/`               |
| Wiring, save manager, lifecycle       | `src/app/`                        |
| Proxy routes and DeepSeek client      | `server/`                         |
| Plain content JSON                    | co-located `data/` in its module  |
| Tests                                 | `tests/<layer>/<subject>.test.ts` |

## Workflow for every task

1. Read the routing-table row, then the relevant `MODULE.md`.
2. State the smallest change that satisfies the task; do not refactor unrelated code.
3. Implement, keeping files small and modules behind their public API.
4. Run `npm test`, `npm run lint`, `npm run docs:check` (and `npm run build` for UI/app).
5. Update the affected `MODULE.md`, `ARCHITECTURE.md` file map/data flow, and append to
   `docs/CHANGELOG_AI.md` (date, task, files, docs, next-session notes).
6. Report: what changed, verification results, open questions.

## Definition of Done

- Behaviour matches the phase's acceptance criteria in `docs/ROADMAP.md`.
- Tests cover new pure logic; all gates pass.
- No file over 300 lines; no new cross-layer import; no new dependency without an ADR.
- Docs reflect reality (file names, events, interfaces).
- Current status block below is updated.

## Do NOT

- Do not put secrets in the client or use `VITE_*` for secrets.
- Do not bypass a module `index.ts` or import `server/` from `src/`.
- Do not add combat, inventory, quests, extra modes, or a physics engine.
- Do not call the LLM per dialogue line; one call per NPC conversation.
- Do not store game truth in Phaser objects or rendered pixels.
- Do not add a dependency without pinning it and recording the reason in `DECISIONS.md`.

## Current status (Phase 1 — complete)

- **Works:** docs set, layered scaffold, pinned toolchain, seeded terrain heightfield with
  chunked renderer, procedural snail, walk/step-up/fall kinematics, fixed 30 Hz clock with
  interpolated rendering, keyboard movement, dead-zone camera, Slovak HUD hint, 17 tests.
- **Not implemented:** terrain carving, AI snails, conversations, LLM calls, persistence,
  audio, final art.
- **Next:** Phase 2 — destructive terrain. First task: implement `carveCircle` on the mask
  with dirty-rect coalescing, then repaint only the dirty chunks. See `docs/ROADMAP.md`
  Phase 2.

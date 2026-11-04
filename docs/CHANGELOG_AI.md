# AI session log

Append one entry per session, newest last. Keep it factual and short; future sessions read
the last entry first. Use the template:

```md
## YYYY-MM-DD — <phase / task>

- **Task:** one sentence.
- **Files changed:** `path`, `path` (new/modified).
- **Docs updated:** `MODULE.md`, `ARCHITECTURE.md`, `DECISIONS.md`, this file.
- **Verification:** build / test / lint / docs:check results.
- **Notes for next session:** the single most useful thing to know; next concrete step.
```

---

## 2026-11-04 — Phase 0: docs + scaffold

- **Task:** create the documentation set and a buildable, strictly layered project scaffold
  for AI Snail World; no gameplay, terrain, AI or animations yet.
- **Files changed (new):**
  - Root: `AGENTS.md`, `ARCHITECTURE.md`, `README.md`, `package.json`, `tsconfig.json`,
    `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `.dependency-cruiser.cjs`,
    `.prettierrc.json`, `.prettierignore`, `.gitignore`, `.env.example`, `index.html`.
  - `docs/`: `MASTER_PROMPT.md`, `ART_BIBLE.md`, `AI_DESIGN.md`, `TERRAIN.md`,
    `ROADMAP.md`, `DECISIONS.md`, `CHANGELOG_AI.md`.
  - `src/`: six layers (`core`, `domain`, `ai`, `world`, `presentation`, `app`), each with
    `index.ts` and `MODULE.md`; typed events, seeded RNG, domain contracts, AI schemas,
    terrain contracts, Slovak i18n seed, Phase 0 bootstrap.
  - `server/`: `index.ts`, `app.ts`, `MODULE.md` (health endpoint only).
  - `assets/`: `manifest.json`, `manifest.schema.json`, `PROMPTS.md`.
  - `scripts/docs-check.ts`; `tests/core/rng.test.ts`.
- **Docs updated:** all of the above are new; `ARCHITECTURE.md` is the blueprint,
  `AGENTS.md` the entry point.
- **Verification:** `npm install`, `npm run build`, `npm test`, `npm run lint`,
  `npm run docs:check` — all pass (run on Node 24.22.0, npm 11.19.1; versions pinned).
- **Decisions to remember:** Phaser pinned to 3.90.0 (latest 3.x; Phaser 4 exists);
  TypeScript pinned 5.9.3 for lint compatibility; DeepSeek docs verified — use
  `deepseek-flash` with thinking disabled and JSON mode, not the stale `deepseek-chat`
  (ADR-006).
- **Notes for next session:** start Phase 1 task 1.1 + 1.2. Read `docs/ROADMAP.md` Phase 1,
  `src/world/MODULE.md`, `src/presentation/MODULE.md`; add `src/app/game.ts`,
  `src/presentation/scenes/boot-scene.ts` + `world-scene.ts`, a seeded terrain mask and
  placeholder snail. Do not add AI or carving yet. Keep every new file ≤ 200 lines and
  update `ARCHITECTURE.md` §4 when adding them.

---

## 2026-11-04 — Phase 1: walking prototype

- **Task:** implement the Phase 1 player slice: seeded procedural terrain, chunked terrain
  rendering, procedural snail, custom kinematics, fixed-step clock, input and camera. No
  AI, carving or dialogue.
- **Files changed (new):** `src/world/terrain-mask.ts`, `src/world/kinematics.ts`,
  `src/world/simulation-clock.ts`,
  `src/presentation/terrain-palette.ts`, `src/presentation/terrain-renderer.ts`,
  `src/presentation/world-view.ts`, `src/presentation/sprites/placeholder-snail.ts`,
  `src/presentation/scenes/boot-scene.ts`, `src/presentation/scenes/world-scene.ts`,
  `src/app/wiring.ts`, `src/app/game.ts`,
  `tests/world/terrain.test.ts`, `tests/world/kinematics.test.ts`,
  `tests/world/simulation-clock.test.ts`.
- **Files changed (modified):** `src/core/config.ts`, `src/world/index.ts`,
  `src/presentation/index.ts`, `src/app/bootstrap.ts`, `index.html`,
  `src/presentation/i18n/sk.json`.
- **Docs updated:** `ARCHITECTURE.md` (status, file map, §7),
  `src/{core,world,presentation,app}/MODULE.md`, `docs/ROADMAP.md`, `README.md`,
  `AGENTS.md`, this file.
- **Verification:** `npm run build`, `npm test` (17 tests / 4 files), `npm run lint`,
  `npm run docs:check`, `npm run format:check` pass. Headless Edge + CDP: WebGL canvas
  rendered terrain, snail and HUD; keyboard movement and camera follow worked; no runtime
  console errors after adding the inline favicon. The 6 s walk also exposed that the snail
  stopped at the first slope — fixed in the next entry.
- **Notes for next session:** Phase 2 terrain carving. The mask is a solid-filled byte
  heightfield with no carver yet; implement `carveCircle` plus dirty-rect coalescing, then
  repaint only dirty chunks. Preserve the spawn plateau when regenerating or carving.

---

## 2026-11-04 — Phase 1 fix: slope walking

- **Task:** the snail could only walk on the flat spawn plateau; every gentle uphill was
  rejected because the body box saw the leading foot 1–2 px above the centre as a wall.
- **Files changed:** `src/world/kinematics.ts` (grounded movement now checks the centre
  ground and step height only; the body box still guards airborne movement),
  `tests/world/kinematics.test.ts` (slope regression test where the leading edge is 12 px
  above the centre).
- **Docs updated:** this file only; movement semantics are documented by the code comment.
- **Verification:** `npm test` 18 tests / 4 files pass; `npm run typecheck` passes. A pure
  simulation with the real `garden-01` mask walks from x=480 to the right world edge
  (x=3176) in 30 s and stays grounded on every slope. `npm run lint`, `docs:check`,
  `build` and `format:check` re-run after the fix.
- **Notes for next session:** when carving arrives, tunnels introduce ceilings and the
  full body box matters again for grounded movement. Revisit `stepKinematics` then; do not
  re-add the edge foot checks without making them slope-aware.

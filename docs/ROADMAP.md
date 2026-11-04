# Roadmap — AI Snail World

Each task is sized for one AI session with a limited context window. A phase is shippable
only when its acceptance criteria and manual test pass, and all quality gates are green.
Never start a later phase by adding speculative code for it earlier.

Conventions: **files touched** lists expected paths, not a limit. Every task ends with
tests/lint/docs:check and a `docs/CHANGELOG_AI.md` entry.

---

## Phase 0 — Docs and scaffold ✅ DONE (2026-11-04)

**Goal:** a project any future AI session can navigate; installs and builds.

**Delivered:** `AGENTS.md`, `ARCHITECTURE.md`, `docs/{ART_BIBLE,AI_DESIGN,TERRAIN,ROADMAP,
DECISIONS,CHANGELOG_AI,MASTER_PROMPT}.md`, `README.md`, layered `src/` with 6 modules and
`MODULE.md` files, `server/` health-only proxy, `assets/manifest.json` + schema +
`PROMPTS.md`, `scripts/docs-check.ts`, one passing test, pinned toolchain.

**Acceptance:** `npm install`, `npm run build`, `npm test`, `npm run lint`,
`npm run docs:check` all pass. **Verified:** yes — see `docs/CHANGELOG_AI.md` Phase 0.

---

## Phase 1 — Walking prototype ✅ DONE (2026-11-04)

**Goal:** one controllable placeholder snail walks on a static procedural terrain in
Phaser, with a following camera. No AI, no carving, no dialogue.

| Task                   | Files                                                                                                                                   | Done when                                                         |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 1.1 Phaser boot        | `src/app/game.ts`, `src/app/wiring.ts`, `src/presentation/scenes/boot-scene.ts`, `world-scene.ts`, `src/app/bootstrap.ts`, `index.html` | canvas fills window, Phaser loop runs, no console errors          |
| 1.2 Procedural terrain | `src/world/terrain-mask.ts`, `terrain.ts`, `tests/world/terrain.test.ts`                                                                | 3200×1200 mask from seeded height profile; solid/air query tested |
| 1.3 Terrain renderer   | `src/presentation/terrain-renderer.ts`, `terrain-palette.ts`                                                                            | soil + grass + outline visible; chunk seams invisible             |
| 1.4 Placeholder snail  | `src/presentation/sprites/placeholder-snail.ts`                                                                                         | chubby body, shell, eyestalks drawn in palette colors at 64 px    |
| 1.5 Kinematics + input | `src/world/kinematics.ts`, `src/app/wiring.ts`                                                                                          | A/D or arrows crawl; 8 px step-up; slope snap; gravity/landing    |
| 1.6 Camera             | `src/presentation/scenes/world-scene.ts`                                                                                                | dead-zone follow, clamped to world bounds                         |
| 1.7 Tests/docs         | `tests/world/{kinematics,terrain,simulation-clock}.test.ts`, module docs                                                                | unit tests for step-up/fall; all gates pass                       |

**Acceptance:** snail walks, climbs small slopes, falls off ledges and lands; camera
follows without showing outside the world; 60 FPS with the static world; no gameplay AI.

**Delivered:** `BootScene` + `WorldScene`; seeded 3200×1200 heightfield with a flat spawn
plateau; chunked canvas renderer with grass, soil and outline; procedural snail; 8 px
step-up, 6 px snap-down, gravity/landing; 30 Hz `SimulationClock` with interpolated
rendering; arrows or A/D input; dead-zone camera clamped to world bounds. Tests cover
generation/queries, step-up/wall/fall and the fixed-step clock.

**Verified:** yes — headless Edge via CDP: WebGL canvas fills the window, terrain + snail +
HUD render, 6 s of right input moved the snail ~540 px while the camera followed, no
runtime errors. Build, 17 tests, lint and docs:check pass. Sustained 60 FPS was not
profiled; a human play-test is still recommended.

**Manual test:** `npm run dev` → hold D, walk across the map; step onto a 6 px bump; walk
off a ledge; resize the window; no jitter or tunneling.

**Proposed first task:** 1.1 + 1.2 together, then 1.5, to get a moving snail quickly.

---

## Phase 2 — Destructible terrain

**Goal:** the world can be bitten away; collisions and visuals stay correct.

| Task                    | Files                                                    | Done when                                                |
| ----------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| 2.1 Mask carving        | `src/world/terrain-mask.ts`, `tests/world/carve.test.ts` | `carveCircle` exact, bounds-safe, returns dirty rect     |
| 2.2 Surface + collision | `collision.ts`, `terrain-carver.ts`                      | surface update, ground/slope/body/step queries tested    |
| 2.3 Dirty rendering     | `src/presentation/terrain-renderer.ts`                   | only dirty chunks redraw; edge outline/grass regenerated |
| 2.4 Munch input + FX    | `src/app/wiring.ts`, `src/presentation/fx/crumbs.ts`     | Q digs every 250 ms; crumbs/dust cosmetic only           |
| 2.5 React to carving    | `src/world/kinematics.ts`                                | snail under a carve falls and lands; no tunneling        |
| 2.6 Save-ready mask     | `terrain-mask.ts`, `tests/world/terrain-rle.test.ts`     | RLE roundtrip lossless                                   |

**Acceptance:** dig a pit and a sideways tunnel; grass on new top surface; outline around
tunnels; dirty-rect rendering ≤ 4 ms; no falling-sand simulation.
**Manual test:** hold Q on a slope, dig down, turn and dig sideways; walk into the tunnel;
carve under a snail and watch it fall.

---

## Phase 3 — Autonomous NPCs (Tier 0)

**Goal:** six data-driven snails live their routine without the player and without an LLM.

| Task                    | Files                                                                                       | Done when                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 3.1 Snail content       | `src/domain/data/snails.json`, `schemas/snail-schema.ts`, `tests/domain/snail-data.test.ts` | 6 valid snails matching the Art Bible casts                     |
| 3.2 World layout        | `src/world/data/world-01.json`, `src/world/points-of-interest.ts`                           | platforms/POIs load; schema validated                           |
| 3.3 Tier 0 FSM          | `src/ai/tier0/activity-fsm.ts`                                                              | wander, walk-to-poi, rest, sleep, look-around, flee-hole        |
| 3.4 Headless simulation | `src/world/simulation.ts`, `tests/world/simulation.test.ts`                                 | fixed-step world runs with no Phaser/DOM; deterministic seed    |
| 3.5 Spatial hash        | `src/world/spatial-hash.ts`                                                                 | nearby queries tested at 30 snails                              |
| 3.6 Render NPCs         | `world-scene.ts`, `placeholder-snail.ts`                                                    | 6 snails with distinct palettes/accessories, name tags on hover |

**Acceptance:** a 2-minute headless run produces no errors and plausible routines; same
seed → same positions; 6 snails visible and distinguishable; no network calls.
**Manual test:** watch for 2 minutes; snails wander, rest, sleep, approach POIs; none get
stuck in walls or fall forever.

---

## Phase 4 — Sprite and emotion system

**Goal:** layered rig, animation/emotion catalogs, bubbles and icons from data.

| Task                          | Files                                                                     | Done when                                              |
| ----------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------ |
| 4.1 Placeholder pipeline      | `scripts/generate-placeholders.ts`, `assets/generated/`, manifest entries | regenerating assets requires no code change            |
| 4.2 Catalogs                  | `src/presentation/data/animations.json`, `emotions.json`, zod loaders     | every emotion/gesture id in `domain/emotion.ts` exists |
| 4.3 Layered rig               | `src/presentation/sprites/snail-rig.ts`                                   | body/shell/face/accessory layers; flip; pivot correct  |
| 4.4 Two-channel state machine | `src/presentation/animation/state-machine.ts`, tests                      | locomotion + expression independent; unknown → neutral |
| 4.5 Bubbles/icons             | `src/presentation/ui/speech-bubble.ts`, `emotion-icon.ts`                 | typewriter, 3-line split, thought bubble with `…`      |
| 4.6 Wire events               | `src/app/wiring.ts`                                                       | `DialogueLine`/`EmotionChanged` drive playback         |

**Acceptance:** all 10 locomotion animations and 13 emotions play from catalogs; no
hard-coded sprite paths; placeholder art at correct sizes; 60 FPS with 6 snails.
**Manual test:** debug keys cycle animations/emotions; speak a test line; verify diacritics
and bubble wrapping.

---

## Phase 5 — Social layer without LLM (Tier 1)

**Goal:** snails meet, decide, converse using canned scripts, and remember; state persists.

| Task                      | Files                                                  | Done when                                           |
| ------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| 5.1 Utility AI            | `src/ai/tier1/social-scoring.ts`, tests                | formula from `AI_DESIGN.md` §3 with worked examples |
| 5.2 Encounters + slots    | `src/world/encounters.ts`, director shell              | `SnailMet`, cooldowns, max 3 conversations          |
| 5.3 MockProvider          | `src/ai/providers/mock-provider.ts`, canned JSON       | deterministic scripts by pair/situation             |
| 5.4 Playback              | `src/ai/conversation-playback.ts`, presentation        | lines play with timing; interruption works          |
| 5.5 Outcome application   | `src/domain/services/*`, tests                         | relationships/mood/memory updated and clamped       |
| 5.6 Typed event bus       | `src/core/bus.ts`                                      | on/off/emit tested; no listener leaks               |
| 5.7 IndexedDB persistence | `src/app/persistence/indexed-db.ts`, migrations, tests | save/load roundtrip; corrupt save starts fresh      |
| 5.8 Relationship UI       | name tags + hearts                                     | hearts 0–5 shown on interaction                     |

**Acceptance:** without network, conversations happen, relationships drift, memories are
retrievable, reload restores state; no LLM code called.
**Manual test:** watch two snails greet; reload the page; relationship/memory persists.

---

## Phase 6 — LLM integration

**Goal:** replace canned NPC dialogues with DeepSeek via the secure proxy, with the full
fallback ladder and budget manager.

| Task                               | Files                                                             | Done when                                             |
| ---------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------- |
| 6.1 Proxy config + DeepSeek client | `server/env.ts`, `server/lib/deepseek.ts`, `server/routes/llm.ts` | health + `/api/llm/complete`; key never leaves server |
| 6.2 Validation/limits              | `server/routes/llm.ts`, zod schemas                               | oversize/unknown fields rejected; timeout/retry       |
| 6.3 Rate limiting                  | `server/lib/rate-limit.ts`, tests                                 | per-session limit; 429 envelope with retryAfterMs     |
| 6.4 DeepSeekProvider               | `src/ai/providers/deepseek-provider.ts`                           | calls proxy, maps errors to `LlmError`                |
| 6.5 Prompt builders                | `src/ai/prompt-builders.ts`, snapshot tests                       | persona/script/outcome prompts within budgets         |
| 6.6 Director                       | `src/ai/conversation-director.ts`, tests                          | one call per conversation; validate/repair/fallback   |
| 6.7 Budget manager                 | `src/ai/budget-manager.ts`, tests                                 | concurrency, cooldowns, cache, calm-down, priority    |
| 6.8 Apply real outcomes            | `src/domain/services/*`                                           | deltas, memories, follow-up intent persisted          |

**Acceptance:** with a valid key, conversations are real Slovak and schema-valid; invalid
output repairs once then falls back; player chat priority holds; off-screen pairs make no
calls; game never stalls or crashes without network.
**Manual test:** run proxy + dev, watch a conversation; unplug network mid-run; verify
canned fallback and health endpoint; check proxy logs never contain the key.

---

## Phase 7 — Player chat, memory and reflection

**Goal:** talk to any snail in character; memory retrieval/compaction and small reflective
behaviour make relationships feel continuous.

| Task                     | Files                                             | Done when                                                 |
| ------------------------ | ------------------------------------------------- | --------------------------------------------------------- |
| 7.1 Chat UI              | `src/presentation/ui/chat-box.ts`, `i18n/sk.json` | input, send, history, Slovak placeholders                 |
| 7.2 Player prompt        | `src/ai/prompt-builders.ts`                       | persona + relationship + top-5 memories + last 4 turns    |
| 7.3 Streaming (optional) | proxy + provider                                  | tokens appear incrementally; fallback to complete         |
| 7.4 Memory compaction    | `src/ai/memory-compactor.ts`, tests               | 40-entry trigger, summary, rule fallback                  |
| 7.5 Reflection           | `src/ai/reflection.ts`                            | low-priority summary changes tags/prompt, not raw numbers |
| 7.6 Relationship hints   | UI                                                | hearts/tags update after chat; no numbers exposed         |

**Acceptance:** player chat stays in character and references memories; long sessions
compact memory without prompt bloat; failures are graceful; 60 FPS maintained.
**Manual test:** tell a snail something, leave, return, ask about it; check prompt sizes in
debug logs; fill memory past 40 entries and verify compaction.

---

## Phase 8 — Art, polish, scaling, deployment

**Goal:** replace placeholders with final art, add ambience, prove 30 snails, ship.

| Task                       | Files                                           | Done when                                                          |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| 8.1 Final art pass         | `assets/generated/` → `assets/final/`, manifest | every asset `status: final`; prompts documented                    |
| 8.2 Background/parallax/FX | presentation                                    | 4 parallax layers, day palette, crumbs/dust/slime                  |
| 8.3 Audio ambience         | `src/presentation/audio/`                       | looping ambience + UI blips, volume setting, mute                  |
| 8.4 Performance            | profiling                                       | 30 snails at 60 FPS, off-screen 5 Hz, no leaks                     |
| 8.5 Scaling test           | `tests/world/scaling.test.ts`                   | budgets/config only; architecture unchanged                        |
| 8.6 Deployment             | `README.md`, proxy deploy guide                 | static host + serverless proxy, env docs, CORS locked              |
| 8.7 Final QA               | all gates, `tests/e2e/smoke.spec.ts`            | Playwright smoke (load, move, talk), manual checklist, 2-hour soak |

**Acceptance:** final art matches `ART_BIBLE.md`; 30 snails at 60 FPS on a mid desktop;
deployment guide works from a clean checkout; no secrets in the bundle.
**Manual test:** fresh clone → install → env → build → deploy; play for 2 hours; check
memory/CPU; verify all 6 personalities are recognizable by speech and silhouette.

---

## Cross-phase rules

- A phase may ship only if the previous phase's acceptance still passes (regression test).
- Tests are pure and headless wherever possible; Playwright smoke is added in Phase 8.
- No new dependency without an ADR in `docs/DECISIONS.md` and an exact version.
- No speculative code for later phases; update this roadmap when scope changes.
- If a task would exceed 300 lines in one file, split it or split the task.

## Known risks

| Risk                   | Mitigation                                                   |
| ---------------------- | ------------------------------------------------------------ |
| LLM cost/latency       | tiers, one-call conversations, budgets, cache, Mock fallback |
| Prompt drift           | pure builders + snapshot tests + token budgets               |
| Terrain rendering bugs | mask is truth, deterministic rebuild, dirty-rect tests       |
| AI context loss        | small files, `MODULE.md`, routing table, changelog           |
| DeepSeek API changes   | verified docs, pinned request shape, proxy isolates provider |

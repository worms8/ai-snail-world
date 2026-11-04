# Decisions (lightweight ADR log)

One entry per decision that a future session might otherwise question. Status is
`accepted` unless noted. Add an ADR when adding a dependency, changing a boundary, or
deviating from `MASTER_PROMPT.md`.

---

## ADR-001 — Stack: TypeScript + Vite + Phaser 3 + Vitest

**Context:** desktop browser game, AI-maintained code, strict layering, fast iteration.
**Decision:** TypeScript strict, Vite build/dev, Phaser 3.90.0 for presentation only,
Vitest for headless logic, ESLint + Prettier + dependency-cruiser as gates.
**Alternatives:** PixiJS (more custom engine work), vanilla canvas (too much UI/scene
boilerplate), Phaser 4 (newer but the brief targets Phaser 3 and ecosystem examples).
**Consequences:** Phaser is quarantined in `presentation`; `core/domain/ai/world` stay
headless. Pinned exact versions; upgrades require an ADR and gate run.

## ADR-002 — Destructible terrain: byte mask + canvas, no physics engine

**Context:** Worms-like deformation, simple snails, 60 FPS, deterministic tests.
**Decision:** `Uint8Array` collision mask (1 byte/pixel), synchronized per-chunk canvas
for visuals, `carveCircle` mutates both via dirty rects. Custom kinematics.
**Alternatives:** pixel-perfect physics bodies, falling-sand, tile destruction, external
physics engine. All are heavier and less deterministic.
**Consequences:** trivial collision queries and tests; we own edge/grass rendering.
Mask is 3.84 MB in memory and RLE-compressed in saves. No debris physics.

## ADR-003 — Tiered cognition (Tier 0/1/2)

**Context:** LLM calls are slow, costly and non-deterministic; most behaviour is routine.
**Decision:** Tier 0 FSM/steering every tick, Tier 1 local utility AI at 5 Hz, Tier 2 LLM
only for conversations, outcomes, memory compaction and player chat.
**Alternatives:** LLM-driven movement (costly, laggy), pure scripted behaviour (boring),
behaviour trees for everything (harder to tune than utility scores).
**Consequences:** the world feels alive offline; LLM use is rare and budgeted; scoring is
testable. More code in Tier 0/1, none of it network-bound.

## ADR-004 — One LLM call per NPC↔NPC conversation

**Context:** per-line calls multiply cost/latency and make interruptions awkward.
**Decision:** request the whole 3–8 line script plus the structured outcome in one JSON
response; play lines locally with timing.
**Alternatives:** one call per line, pre-generated dialogue banks, one call per outcome.
**Consequences:** one budget slot per conversation; playback is instant and interruptible;
the schema is larger and needs strict validation/repair.

## ADR-005 — Stateless LLM proxy with the key server-side

**Context:** the browser must never hold the DeepSeek key; rate limits and validation
must be enforceable; deployment should be cheap.
**Decision:** Node + Hono proxy, stateless, OpenAI-compatible forwarding, auth-less
per-session rate limiting, validation, timeout/retry. Runs locally and as a serverless
function. Client talks only to `/api/llm/complete`.
**Alternatives:** direct browser calls with a key (unacceptable), full backend with users
DB (unnecessary for v1), edge function only (less portable locally).
**Consequences:** one extra process in dev (Vite proxies `/api`); no shared code with
`src/`; CORS/rate limits are ours to maintain.

## ADR-006 — DeepSeek API: current models and non-thinking JSON calls

**Context:** the brief says `deepseek-chat`, but official docs were verified on 2026-11-04.
**Verified facts:** OpenAI-compatible endpoint `https://api.deepseek.com/chat/completions`;
current models `deepseek-flash` (cheap, default) and `deepseek-v4-pro`; JSON Output via
`response_format: { "type": "json_object" }`; thinking mode is **enabled by default** when
`thinking`/`reasoning_effort` are omitted; `deepseek-chat` is no longer the documented
model name.
**Decision:** default to `deepseek-flash` with `thinking: { "type": "disabled" }` and
`response_format: { "type": "json_object" }` for NPC conversations. Model is configurable
via `DEEPSEEK_MODEL`; `deepseek-v4-pro` is opt-in for higher quality. Temperature 0.8 for
NPC dialogue, 0.4 for structured outcomes/compaction if split later.
**Alternatives:** `deepseek-chat` (stale name), thinking mode on (slower/costlier, output
reasoning tokens), another provider (brief specifies DeepSeek).
**Consequences:** prompts must explicitly instruct JSON (API only guarantees valid JSON,
not our schema). We validate with zod. Re-verify docs before Phase 6 and record changes.

## ADR-007 — No embeddings / vector database

**Context:** 6–30 snails, a few hundred memories each, small prompts.
**Decision:** episodic text entries + weighted retrieval (recency, importance, lexical
relevance). Compaction via low-priority LLM summary, rule-based fallback.
**Alternatives:** vector DB + embeddings (extra service, cost, privacy, overkill).
**Consequences:** zero infrastructure and deterministic tests; retrieval is less semantic.
Revisit only if memory volume or quality demonstrably demands it (new ADR).

## ADR-008 — Layered snail rig instead of per-snail animation sets

**Context:** 6–30 snails, many emotions/gestures, small asset budget.
**Decision:** layers `body + shell + face + accessory + icon`; one shared animation set,
variety via palettes, shell patterns, accessories and size. Two independent channels
(locomotion, expression). All ids in data catalogs; unknown → `neutral`.
**Alternatives:** full sprite sheets per snail (asset explosion), procedural skeletal rig
(more complexity), single flat sprite (no emotion swaps).
**Consequences:** small atlas and consistent style; art must respect pivots/anchors,
documented in `ART_BIBLE.md` §E1–E2. Shell spiral direction must not flip with facing.

## ADR-009 — Phaser 3.90.0 (not Phaser 4)

**Context:** latest Phaser on npm is 4.2.1 (verified 2026-11-04), but the brief specifies
Phaser 3 and most examples/types target 3.x.
**Decision:** pin `phaser@3.90.0`, the newest 3.x.
**Alternatives:** Phaser 4 (migration risk, less documentation), PixiJS.
**Consequences:** stable API for agents; a future upgrade is a separate ADR with a
presentation-only migration. No Phaser types leak into pure layers.

## ADR-010 — TypeScript 5.9.3 (not 6/7) for tooling compatibility

**Context:** npm `latest` is TypeScript 7.0.2 (native port) and 6.0.3 exists; the brief
requires strict typing and a mature lint stack.
**Decision:** pin TypeScript 5.9.3, the newest release supported by
`typescript-eslint@8.72.1` (`<6.1.0`) and broadly compatible with Vite 8/Vitest 5.
**Alternatives:** TS 6 (supported but newer), TS 7 (lint/type-ecosystem risk in Phase 0).
**Consequences:** predictable typecheck/lint; revisit after the ecosystem catches up.

## ADR-011 — Docs and structure are enforced by `npm run docs:check`

**Context:** future sessions have limited context and may skip documentation.
**Decision:** a TS script verifies every module has `MODULE.md`, MODULE/AGENTS line caps,
300-line source cap, the architecture file map, and runs dependency-cruiser.
**Alternatives:** convention only (drifts), heavy custom linter (overkill).
**Consequences:** cheap CI gate; docs must be updated in the same change. The script is
small and dependency-free apart from the installed toolchain.

## ADR-012 — Fixed 30 Hz simulation with rendering interpolation

**Context:** 60 FPS visuals, deterministic tests, cheap AI updates.
**Decision:** fixed simulation step 1/30 s with accumulator, max 5 catch-up ticks; render
at display rate with interpolation (alpha). Tier 1 at 5 Hz staggered; off-screen at 5 Hz.
**Alternatives:** variable timestep (nondeterministic), 60 Hz sim (2× cost, no benefit).
**Consequences:** stable physics and replayable tests; input latency ≤ 33 ms (fine for a
cozy game); presentation must interpolate positions to avoid stutter.

## ADR-013 — Persist terrain as RLE inside a versioned save

**Context:** IndexedDB save must include carved terrain without storing 3.84 MB raw.
**Decision:** RLE (run length, value) pairs, base64; save `SaveGameV1` with schema version,
snail state, world seed/tick and settings. Recompute `surfaceY`/chunks on load.
**Alternatives:** full mask blob (large), PNG data URL (async/canvas-dependent in tests),
store only carve operations (replay risk).
**Consequences:** compact saves and fast loads; RLE roundtrip must be tested. Migrations
are pure functions in `src/app/persistence/migrations/`.

## ADR-014 — Slovak in-game text with JSON localization from day one

**Context:** the game ships in Slovak, but other languages may come later; UI literals in
code are hard to audit.
**Decision:** all UI strings in `src/presentation/i18n/<locale>.json`, accessed via
`uiString(locale, key)`; prompt content stays Slovak with diacritics; code/docs English.
**Alternatives:** inline strings (fast, unmaintainable), i18n library (unnecessary for v1).
**Consequences:** typos are localized in one place; missing keys are compile-time errors
via `keyof typeof sk`. Font must support Slovak diacritics (Baloo 2, OFL).

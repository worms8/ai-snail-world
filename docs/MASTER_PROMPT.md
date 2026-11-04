# MASTER PROMPT – AI Snail World (for DeepSeek CLI)

> Paste everything below the line into DeepSeek CLI as the first prompt in an empty project folder.
> Keep this file in the repo as `docs/MASTER_PROMPT.md` – it is the origin document for the project vision and for all graphics.

---

## 0. ROLE AND MISSION

You are the lead engineer and technical writer of a small 2D browser game called **AI Snail World**. The entire game will be developed by AI coding agents (you and future sessions of you) with a **limited context window**. Therefore your first priority is NOT writing gameplay code, but creating a project whose structure and documentation allow any future AI session to make a correct change after reading only a few small files.

**This first run (Phase 0) has a strict scope:**
1. Create the documentation set listed in section 9.
2. Create the project scaffold (tooling, empty module folders with `MODULE.md`, config, scripts) – it must install and build successfully.
3. Do NOT implement gameplay, AI logic, terrain or animations yet. Only minimal stubs and type definitions where the docs need them.
4. At the end, run the verification commands, print a short summary and STOP. Wait for me to say which phase to start next.

If any requirement below conflicts, prefer: simplicity > maintainability > feature completeness.

---

## 1. GAME CONCEPT

A tiny, living 2D side-view world inhabited by AI-driven snails. It is **not** a traditional game with goals. It is a small, charming simulation the player can walk around in, talk to the inhabitants and watch their relationships evolve.

- 2D side-view platformer movement, feel and look inspired by *Worms*, but the characters are **snails**.
- The player controls one snail and moves around the world.
- Core activities: moving around, exploring, meeting other snails, talking with them, **observing** their behavior, relationships and conversations (including conversations that happen without the player).
- **Destructible terrain** (Worms-style deformable bitmap terrain). We do NOT copy Worms combat. The player can e.g. "munch" a hole into the ground / dig tunnels. Snails also react to terrain changes (fall, walk around).
- Explicitly OUT OF SCOPE (never add): combat, inventory, levelling, quest system, multiple game modes, complex mechanics.
- Priority: a small world that works really well > a big world with unfinished mechanics.

**Platform:** modern desktop web browser, as a first-class target (not a port). Desktop keyboard + mouse. 60 FPS target with ~10–20 snails visible.

**In-game language:** Slovak by default (all snail dialogue is Slovak, with proper diacritics). UI strings must live in a localization file so other languages can be added later. Code, comments and docs are in English.

---

## 2. SNAILS (NPCs) – IDENTITY MODEL

Each snail has:
- **Identity:** name, short backstory (1–2 sentences), visual look (see Art Bible).
- **Personality:** Big-Five-style numeric traits (0–1: openness, conscientiousness, extraversion, agreeableness, neuroticism) plus 2–3 short human-readable quirks and a **speech style card** (vocabulary, sentence length, catchphrases, things they never say).
- **Preferences:** likes/dislikes (places, activities, topics, other snails).
- **Mood:** a small numeric state (valence, arousal, energy) that decays toward a personality baseline.
- **Relationships:** per other snail (and the player): affinity, trust, familiarity, plus 0–3 short tags (e.g. "annoying", "best friend", "owes me a leaf").
- **Memory:** see section 5.

Snails must feel clearly different. Ship the first world with **6 distinct snails**, e.g.: shy introvert, very social chatterbox, grumpy complainer, curious explorer, joker, dreamy philosopher. Define them in data files (JSON), never hard-coded in logic.

---

## 3. TECH STACK (default – justify any deviation in `docs/DECISIONS.md`)

- **TypeScript (strict mode)**, **Vite**, **Phaser 3** for rendering, input, scene management, animation playback and asset loading. Use Phaser only through our own thin wrappers where it matters (see boundaries in section 4).
- **Destructible terrain:** our own module. Terrain = alpha-mask bitmap (a `Uint8Array` collision mask plus an offscreen canvas for visuals). Destruction = carve a circle/shape out of both. No physics engine for terrain. Snails use simple custom kinematics (gravity, slope walking, step height) against the mask.
- **Persistence (browser):** IndexedDB (via a tiny wrapper) for snail memory, relationships and world state. Versioned save format with migrations.
- **Backend:** a tiny stateless **LLM proxy** (Node + a minimal framework such as Hono, written so it can also run as a serverless function). The DeepSeek API key lives ONLY on the server in `.env`; it must never reach the browser. The proxy does: auth-less rate limiting per session, request validation, timeout, retry with backoff, and forwarding to DeepSeek (OpenAI-compatible API, `deepseek-chat`, JSON output mode). Verify current API details from official DeepSeek docs before coding; don't rely on memory.
- **LLM provider abstraction:** interface `LlmProvider` with implementations `DeepSeekProvider` (via proxy) and `MockProvider` (deterministic canned dialogues so the game and tests work offline and without cost).
- **Testing:** Vitest for pure logic (AI decision logic, memory, relationships, terrain mask math, prompt builders, JSON parsing). Playwright smoke test later.
- **Quality gates:** ESLint + Prettier + `dependency-cruiser` (or `eslint-plugin-boundaries`) enforcing the module dependency rules from `ARCHITECTURE.md`.

---

## 4. ARCHITECTURE PRINCIPLES (mandatory – they exist because of the AI context window)

1. **Small files:** target ≤ 200 lines, hard limit 300 lines per source file. Split before exceeding.
2. **One responsibility per file; one clear purpose per folder (module).**
3. **Every module folder has a `MODULE.md`** (max ~60 lines): purpose, public API (what `index.ts` exports), inputs/outputs, dependencies it may use, events it emits/consumes, invariants, "how to extend", known pitfalls. Only the module's `index.ts` may be imported from outside the module.
4. **Strict layering, no cycles.** Suggested layers (finalize in `ARCHITECTURE.md`):
   `core` (types, event bus, config, utils) → `domain` (snail model, personality, mood, relationships, memory – pure TS, NO Phaser, NO network, NO DOM) → `ai` (behavior, social decisions, conversation director, LLM client abstraction) → `world` (terrain, physics/kinematics, entities) → `presentation` (Phaser scenes, sprites, animation, UI, audio) → `app` (bootstrap, wiring).
   Pure logic (`domain`, most of `ai`) must be testable without a browser.
5. **Simulation is separated from rendering.** The simulation runs on a fixed timestep and produces state; presentation only reads state and listens to events. The simulation must be runnable headless (for tests and for fast-forwarding).
6. **Communication through a typed event bus** (`SnailMet`, `ConversationStarted`, `DialogueLine`, `EmotionChanged`, `TerrainCarved`, …). Event names and payload types live in one place (`core/events`).
7. **Data-driven content:** snails, animations, emotions, dialogue prompts, world layout and localization are JSON/TS data validated by schemas (e.g. zod). Adding a snail or an emotion must not require touching logic code.
8. **Deterministic where possible:** seeded RNG injected everywhere (no bare `Math.random()` in logic).
9. **Explicit contracts for AI output:** the LLM returns structured JSON validated by a schema; invalid output → repair attempt once → fallback to a canned line. The game must never crash or stall because of the LLM.
10. **Docs are part of the code.** A change is not done until the affected `MODULE.md`, `ARCHITECTURE.md` (file map / data flow), and `docs/CHANGELOG_AI.md` are updated. A script `npm run docs:check` must verify: every module folder has `MODULE.md`, no source file exceeds 300 lines, `ARCHITECTURE.md` file map lists every module folder, dependency rules pass.
11. **Naming:** `kebab-case` files, `PascalCase` types/classes, explicit names (`conversation-director.ts`, not `cd.ts`). No clever abstractions; prefer boring, obvious code.
12. **No big rewrites, no speculative generality.** Build the smallest thing that satisfies the current phase.

---

## 5. AI SYSTEM DESIGN (what the docs must specify precisely)

### 5.1 Tiered cognition – the LLM is the expensive last tier
- **Tier 0 – Movement/routine (no AI):** finite-state machine / steering: wander, walk to point of interest, rest, sleep, look around, approach another snail, flee a hole, fall/land. Runs every simulation tick, costs nothing.
- **Tier 1 – Social decision-making (local, no LLM):** a **utility-AI** scorer decides *whether* to start a conversation, with whom, and how to react (greet / ignore / avoid / join) from personality, mood, relationship, distance, cooldowns and time since last interaction. Cheap, runs a few times per second at most.
- **Tier 2 – Language model (rare):** used only for (a) generating conversations, (b) conversation outcome (memory + relationship/mood deltas), (c) occasional reflection/summary of memories, (d) live chat with the player.

### 5.2 Conversation director (core cost optimization)
- An NPC↔NPC conversation is generated by **ONE LLM call that returns the whole short script** (e.g. 3–8 lines, both speakers) plus the structured outcome – not one call per line.
- Each line carries `speaker`, `text`, `emotion` (enum from the emotion catalog) and optional `gesture` (enum from the animation catalog). Presentation plays lines back with timing, speech bubbles and animations. The playback is interruptible (player walks in, terrain collapses → ends politely).
- Outcome JSON: `relationship_deltas` (both directions), `mood_deltas`, `memory_entries` (1 short sentence per participant, with importance 1–10), optional `follow_up_intent`.
- **Request budget manager:** global priority queue, max concurrent requests, max requests per minute, per-snail and per-pair cooldowns, "world calm-down" if budget is exceeded, response cache keyed by (pair, situation hash), automatic degradation to canned/Mock dialogue when offline or over budget. Player chat has the highest priority.
- **Player chat:** turn-based, streaming response if feasible, short context (persona card + relationship + top-K memories + last few turns).
- **Prompt builders are pure functions** with unit tests and a hard token budget per prompt. Prompts contain a compact persona card, never the whole history.

### 5.3 Memory and relationships (no embeddings, no vector DB)
- **Episodic memory:** short text entries with timestamp, participants, location tag, emotion, importance (1–10).
- **Retrieval:** score = recency decay + importance + simple relevance (participants match, keyword/tag overlap). Top-K (≈5) go into the prompt.
- **Compaction:** when a snail exceeds N entries, low-importance old entries are merged into a short summary per relationship ("What I think about Pavol") by an occasional low-priority LLM call; falls back to rule-based truncation.
- **Relationship state** (affinity, trust, familiarity, tags) is numeric and updated by the outcome deltas, clamped and slowly decaying toward neutral without contact. Numbers drive Tier 1 decisions; text summaries drive prompts.
- Everything is persisted in IndexedDB with a schema version.

### 5.4 Scalability
Design so that going from 6 to 30+ snails only changes budgets/configuration, not architecture: spatial hashing for "who is nearby", staggered updates, conversation slots (limit simultaneous conversations), off-screen snails simulated at lower frequency, and **no LLM calls for off-screen pairs** unless explicitly enabled (instead, offscreen "abstract" encounters adjust relationships by rules).

---

## 6. DESTRUCTIBLE TERRAIN (what the docs must specify)

- Level loaded from a PNG/mask (or procedurally generated from a seeded noise function in the first prototype).
- Two synchronized representations: collision mask (`Uint8Array`, 1 byte or 1 bit per pixel) and visual canvas. `carveCircle(x, y, r)` modifies both and emits `TerrainCarved` with a dirty rectangle.
- Collision queries: point solid?, ground height below x, slope normal sampling, step-up logic, "is region free" for snail body.
- Render only dirty regions each frame; chunk the terrain (e.g. 256×256 tiles) so updates stay cheap.
- Debris/crumble particles are cosmetic only. No falling-sand physics.
- Edge outline and grass top layer are regenerated for the dirty region after carving (see Art Bible).
- World size for v1: about 3200×1200 px, scrolling camera following the player.

---

## 7. EMOTIONS, ANIMATIONS, SPRITES (architecture rules)

- **Layered snail rig** to keep sprite count manageable and allow variety:
  `body` (locomotion animations) + `shell` (separate layer, wobbles with secondary motion) + `face` (emotion layer, swappable independently) + optional `accessory` layer (hat, scarf, glasses) + `emotion bubble/icon` above the head.
  Per-snail variety comes from tinting palettes, shell patterns and accessories, not from new animation sets.
- **Animation catalog** (data file) lists every animation: id, layer, frame count, fps, loop flag, anchor points, allowed transitions. **Emotion catalog** maps each emotion to face variants, optional body gesture variants and an icon.
- **Animation state machine** per snail has two independent channels: `locomotion` (idle, crawl, fast-crawl, turn, rest, sleep, fall, land, munch) and `expression` (emotion + gesture overlays). The AI/simulation only emits *intents* (`emotion: "joy"`, `gesture: "wave"`); the presentation layer picks a concrete variant and plays it. Unknown ids fall back to `neutral`.
- Assets are described in `assets/manifest.json` (see Art Bible); code never references file paths directly.

---

## 8. VISUAL DIRECTION – MASTER ART BIBLE (SOURCE OF TRUTH FOR ALL GRAPHICS)

**Copy this section verbatim into `docs/ART_BIBLE.md` and then extend it with concrete specs.** All future graphics (sprites, terrain, backgrounds, UI) must be generated or created from this document. Whenever a new asset is added, its entry in `assets/manifest.json` must include a `prompt` field (a self-contained image-generation / illustration brief derived from this Art Bible) and `status` (`placeholder` | `final`).

### 8.1 Overall feel
Cozy, playful, warm, slightly silly. A tiny garden/meadow world seen from the side, like a living storybook diorama. Soft, friendly and readable even at small sizes. Never scary, never gritty.

### 8.2 Rendering style
- Hand-drawn 2D **cartoon** look: clean, slightly wobbly **dark-brown outlines** (#3B2A20), consistent line weight (≈3 px at 1× scale, 2 px for small details).
- **Flat colors with exactly one soft shadow tone and one highlight tone** per surface (cel-shading style). No gradients except in the sky and soft glow effects. No photo textures, no realistic noise.
- Rounded, chunky shapes; exaggerated proportions; subtle paper-like grain allowed only in the background.
- Authoring resolution: sprites at **2× logical size** and displayed downscaled for crispness. Snail frame size: **128×128 px** authored, ≈64 px logical in-world. Pivot at the bottom center of the foot. Default facing: right (left is a horizontal flip).
- Transparent PNG, premultiplied alpha off, packed into texture atlases ≤ 2048×2048.

### 8.3 Color palette (starting palette; keep it consistent)
- Outline: `#3B2A20`
- Sky top / bottom: `#BFE8FF` → `#F6FBFF`
- Grass light / base / shadow: `#A8E06B` / `#6CC04A` / `#3F8F3A`
- Soil light / base / shadow: `#C99A6B` / `#9C6B43` / `#6B4429`
- Stone: `#B9B3A8` / `#8D877C`
- Warm accent (flowers, UI highlights): `#FF8FA3`, `#FFD36B`, `#9B8CFF`
- UI paper (bubbles): `#FFFDF4`, UI text: `#3B2A20`
- Snail body palettes (each snail picks one body + one shell palette): peach `#F7C9A0`, sage `#BFD8A0`, lavender `#CDBDF0`, butter `#F9E08B`, sky `#A9D6F5`, rose `#F5B5C4`, with shell colors from the warm accent set and darker mixes of the body color.

### 8.4 The snail character
- **Chubby, soft, cute.** Long squishy body lying low to the ground, with a wide flat "foot" underneath (slightly lighter underside). A **big round spiral shell** on the back (about as tall as the body is long), with a clear hand-drawn spiral line and a highlight spot.
- **Two eyestalks** (tentacles) on the head with **big round eyes at the tips** (white sclera, large dark pupils with a small white glint). Two shorter feelers below. Eyestalks are the main expression device: they can droop (sad), shoot up (surprise), bend towards a target (curious), cross (confused), shake (angry/afraid).
- Small simple mouth on the front of the head (line / open "o" / smile / frown / tiny tongue). Optional blush ovals for shy/happy. Eyebrows are small dashes above the eyes.
- Movement look: **squash & stretch** wave along the foot while crawling, shell gently bobbing with a delay (secondary motion). A subtle shiny **slime trail** is left behind, fading after a few seconds (drawn as a thin glossy line with `#FFFFFF` at 40% alpha).
- **Silhouette must be readable and unique** per snail through: shell spiral direction and pattern (spiral, stripes, dots, zigzag), shell/body palette, body size variance (±10%), eyelash/eyebrow details and one accessory (e.g. tiny scarf, round glasses, leaf hat, flower, bow tie, tiny backpack).
- Pose and silhouette must stay readable at 64 px.

### 8.5 Animation list (minimum for v1) – every item needs at least the stated variants
**Locomotion (body+shell layers):** `idle` (3 variants: breathing, eyestalk sway, shell wiggle; 6–8 frames), `crawl` (8 frames loop), `crawl_fast` (6 frames), `turn` (6 frames, flip with squash), `rest` (curl lazily, 4 frames loop), `sleep` (retract into shell, 6 frames loop with "z" icon), `wake` (4 frames), `fall` (2–4 frames, stretched), `land` (4 frames, squash), `munch` (8 frames, player digging bite action with crumbs).
**Gestures (body/eyestalk overlays):** `wave`, `nod`, `shake_head`, `shrug`, `point`, `jump_for_joy` (small hop), `shiver`, `lean_in` (listening), `talk_loop` (mouth + slight bob).
**Emotions (face layer; 2–3 visual variants each):** `neutral`, `joy`, `sadness`, `anger`, `surprise`, `fear`, `shyness`, `curiosity`, `thinking`, `boredom`, `excitement`, plus `love` and `confusion` as extras. Each emotion defines: eyes shape + pupil position, eyebrows, mouth, eyestalk posture, optional blush/sweat/tear/steam effect, and an icon (see 8.7).
Animation frame naming: `snail/<layer>/<animation>_<variant>_<frame 00>` (e.g. `snail/body/crawl_a_03`, `snail/face/joy_b_00`). Emotion/face variants: `snail/face/<emotion>_<variant>`.

### 8.6 Environment
- **Terrain (destructible):** thick soil slab with a **grass cap** on top (a bumpy outlined grass fringe with little tufts) and a darker **inner edge outline** wherever soil meets air, including freshly carved tunnels (outline regenerated after carving). Soil interior: layered brown tones with hand-drawn pebbles, tiny roots, small bones-free decoration (no skeletons), occasional embedded stones. Carved cavities show a darker back-wall tint so tunnels read as depth.
- **Destruction FX:** soft crumbs/particles in soil colors, a small puff of dust, brief screen-space squash on the carve circle. Cosmetic only.
- **Background (parallax, 4 layers):** sky gradient with fluffy cartoon clouds drifting slowly; far hills in desaturated blue-green; mid hills with big mushrooms and tree trunks; near foreground grass blades/flowers framing the bottom edge (slight sway). Day/night variants are a later extra (soft dusk palette).
- **Props (decor + points of interest for snails):** giant mushrooms (platforms/benches), flowers, daisies, pebbles, leaves, a puddle/pond, a log, a lantern, a tiny wooden sign, a mailbox-sized "snail café" stump. Props are non-interactive in v1 except as snail points of interest (sit near, look at).
- Water/puddle: simple animated wavy line in light blue; no physics.

### 8.7 UI and communication visuals
- **Speech bubbles:** rounded paper-colored bubbles with a thin dark-brown outline and a small tail pointing at the speaker, text in dark brown. Slight wobble in. Max ~3 lines; long lines split across bubbles. Typewriter reveal with small per-letter bounce.
- **Thought bubble:** cloud-shaped with small trailing circles, used for `thinking` and for the "LLM is generating" state (animated "…" so the delay looks natural).
- **Emotion icons** above the head (hand-drawn symbols in the same outline style): heart, sweat drop, exclamation, question mark, anger vein/steam, musical note, "z", sparkle, lightbulb, sad cloud. Pop-in with a tiny bounce and fade out.
- **Name tags:** small rounded label under or above the snail, shown on hover/near the player; relationship hearts (0–5) can appear when interacting.
- **Font:** a rounded hand-written open-license font that supports Slovak diacritics (e.g. Baloo 2, Patrick Hand, Nunito). Document the chosen font and license.
- **HUD:** minimal. Chat input box styled like a bubble, small hint line for controls. No health bars, no menus beyond pause/settings.

### 8.8 Asset pipeline rules
- Until final art exists, generate **placeholder graphics procedurally** (code-generated shapes in the correct palette and correct frame sizes, written by a script into `assets/generated/`) so the game is playable from the first prototype, and replace them later without code changes.
- `assets/manifest.json` lists every asset: `id`, `type`, `path`, `frame size`, `frames`, `anchor`, `layer`, `variants`, `status`, `prompt`.
- Provide `docs/ART_BIBLE.md` + `assets/PROMPTS.md` (one ready-to-use image-generation prompt per asset group, always starting with the shared style header: *"hand-drawn cartoon, thick dark-brown outline, flat colors with one soft shadow tone, cozy storybook garden, chubby cute snail with big spiral shell and eyestalk eyes, transparent background, side view facing right"*).
- Never use copyrighted characters, brands or art from other games (including Worms). "Worms-like" refers to the camera/terrain concept only.

---

## 9. DELIVERABLES OF THIS FIRST RUN (Phase 0)

Create exactly these (keep each doc tight, concrete, and skimmable – use tables, file maps and short code-signature snippets for interfaces; no fluff):

1. **`AGENTS.md`** (repo root, ≤ 150 lines) – the entry point every future AI session reads first. Must contain:
   - 5-line project summary and what is out of scope.
   - **"Read this first" routing table:** for each kind of task (terrain, snail behavior, conversation/LLM, memory, animations, UI, assets, proxy/server, tests, docs) → the exact 1–3 files/docs to read, and nothing more.
   - Commands: install, dev, build, test, lint, `docs:check`.
   - Hard rules (the principles from section 4 in checklist form), code style, naming, where new files go.
   - Workflow for every task: (1) read routing table → (2) read relevant `MODULE.md` → (3) make the smallest change → (4) run tests/lint/docs:check → (5) update docs + `CHANGELOG_AI.md` → (6) report.
   - Definition of Done, "Do NOT" list (no secrets in client, no cross-module imports bypassing `index.ts`, no giant files, no new dependencies without a note in `DECISIONS.md`).
   - **Current status block:** current phase, what works, what is next (updated at the end of each session).
2. **`ARCHITECTURE.md`** (repo root) – the complete technical blueprint: goals and constraints, layer diagram (ASCII or Mermaid), **complete file/folder map with a one-line purpose per module and per planned key file**, dependency rules matrix (who may import whom), simulation loop and timing (fixed timestep, update order, tick frequencies per tier), event catalog (name → payload → emitter → consumers), data models (TypeScript interfaces for Snail, Personality, Mood, Relationship, MemoryEntry, ConversationScript, ConversationOutcome, EmotionDef, AnimationDef), sequence diagrams for: (a) NPC meets NPC → conversation → outcome → memory, (b) player chat, (c) terrain carve → collision/visual update, (d) LLM failure/fallback, the AI tier model, the request budget manager, persistence/save format, error handling strategy, performance budgets, and security (API key only on the server).
3. **`docs/ART_BIBLE.md`** – section 8 copied verbatim and extended with exact frame lists, pivot/anchor tables, palettes per snail, shell pattern catalog, and the asset naming convention.
4. **`docs/AI_DESIGN.md`** – detailed design of section 5: utility-AI scoring formulas (with example numbers), conversation director flow, prompt templates (persona card, conversation script request, outcome schema, player chat, memory compaction) with token budgets, JSON schemas, fallback ladder, budget manager parameters (defaults), memory retrieval formula, relationship update rules. Include the 6 starter snail persona cards (Slovak speech-style notes).
5. **`docs/TERRAIN.md`** – detailed design of section 6 incl. data structures, algorithms, chunking, dirty-rect rendering, collision queries and edge cases.
6. **`docs/ROADMAP.md`** – development phases (below) each with: goal, tasks (small enough for one AI session each), files touched, acceptance criteria, manual test steps. Mark Phase 0 as done at the end of this run.
7. **`docs/DECISIONS.md`** – lightweight ADR log: each major decision (stack, terrain approach, tiered AI, one-call conversations, proxy, no vector DB, layered sprite rig) with context, decision, alternatives, consequences.
8. **`docs/CHANGELOG_AI.md`** – session log template (date, task, files changed, docs updated, notes for the next session) with the Phase 0 entry filled in.
9. **`docs/MASTER_PROMPT.md`** – a copy of this prompt.
10. **Scaffold:** `package.json`, `tsconfig.json`, `vite.config.ts`, ESLint/Prettier/dependency-cruiser configs, `.env.example` (`DEEPSEEK_API_KEY=`, proxy settings), `.gitignore`, `src/` folder tree matching `ARCHITECTURE.md` with an `index.ts` stub and a `MODULE.md` in every module, `server/` (proxy skeleton with health endpoint only), `assets/manifest.json` (empty but valid, with schema), `scripts/docs-check.ts`, `tests/` with one trivial passing test, and a `README.md` for humans (how to run, one paragraph about the project).

**Roadmap phases to write in `docs/ROADMAP.md`** (adjust granularity as you see fit, but keep each phase shippable and testable):
- **Phase 0:** docs + scaffold (this run).
- **Phase 1:** Walking prototype – Phaser scene, procedural placeholder snail, procedural terrain mask, kinematics (walk/slopes/fall), camera, keyboard controls.
- **Phase 2:** Destructible terrain – `carveCircle`, dirty-rect rendering, edge outline regeneration, munch action, FX.
- **Phase 3:** Autonomous NPCs (Tier 0) – 6 snails from data files, wander/rest/sleep/look-around, points of interest, spatial hashing, headless simulation test.
- **Phase 4:** Sprite & emotion system – layered rig, animation + emotion catalogs, state machines, speech/thought bubbles, emotion icons, placeholder art pipeline + manifest.
- **Phase 5:** Social layer without LLM (Tier 1) – utility-AI, encounter detection, MockProvider scripted dialogues, conversation playback, relationships & mood update, persistence in IndexedDB.
- **Phase 6:** LLM integration – proxy, DeepSeekProvider, prompt builders, JSON validation + repair + fallback, budget manager, one-call NPC↔NPC conversations, outcome → memory/relationships.
- **Phase 7:** Player chat + memory retrieval + compaction, relationship UI hints, reflective behavior.
- **Phase 8:** Final art pass (replace placeholders using `assets/PROMPTS.md`), polish, audio ambience, performance tuning, scaling test with 30 snails, deployment guide.

---

## 10. WORKING RULES FOR THIS RUN

- Ask me NO questions unless something blocks you; make sensible decisions and record them in `DECISIONS.md`.
- Verify current versions/APIs (Phaser 3, Vite, DeepSeek API) from official docs or package registry info rather than memory; pin versions.
- Keep every document concrete: names of real files, real interfaces, real numbers. Avoid generic advice.
- Before finishing: run `npm install`, `npm run build`, `npm test`, `npm run lint`, `npm run docs:check` and fix everything until all pass.
- Final output: a short summary (≤ 25 lines) listing created files, the verification results, open questions, and the proposed first task for Phase 1. Then STOP.
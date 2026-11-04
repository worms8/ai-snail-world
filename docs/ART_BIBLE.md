# Art Bible — AI Snail World

This is the source of truth for all graphics and UI. Section 8.1–8.8 is copied verbatim
from `docs/MASTER_PROMPT.md`; the extensions below make it executable. Future graphics
must be derived from this document, and every entry in `assets/manifest.json` needs a
`prompt` (from `assets/PROMPTS.md`) and a `status` (`placeholder` | `final`).

---

## 8. VISUAL DIRECTION – MASTER ART BIBLE (SOURCE OF TRUTH FOR ALL GRAPHICS)

**Copy this section verbatim into `docs/ART_BIBLE.md` and then extend it with concrete specs.**
All future graphics (sprites, terrain, backgrounds, UI) must be generated or created from this document. Whenever a new asset is added, its entry in `assets/manifest.json` must include a `prompt` field (a self-contained image-generation / illustration brief derived from this Art Bible) and `status` (`placeholder` | `final`).

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
- Provide `docs/ART_BIBLE.md` + `assets/PROMPTS.md` (one ready-to-use image-generation prompt per asset group, always starting with the shared style header: _"hand-drawn cartoon, thick dark-brown outline, flat colors with one soft shadow tone, cozy storybook garden, chubby cute snail with big spiral shell and eyestalk eyes, transparent background, side view facing right"_).
- Never use copyrighted characters, brands or art from other games (including Worms). "Worms-like" refers to the camera/terrain concept only.

---

# Extensions (concrete specs)

## E1. Canvas, scale and pivots

| Layer            | Source size | Logical size | Pivot (normalised) | Notes                                       |
| ---------------- | ----------- | ------------ | ------------------ | ------------------------------------------- |
| `body`           | 128×128     | 64×64        | `{0.5, 1.0}`       | bottom center of foot; origin of all motion |
| `shell`          | 128×128     | 64×64        | `{0.55, 0.85}`     | overlay, 1–2 frame delayed wobble           |
| `face`           | 128×128     | 64×64        | `{0.72, 0.55}`     | head-anchored; swaps per emotion            |
| `accessory`      | 128×128     | 64×64        | `{0.5, 0.5}`       | per-item offset from manifest `anchor`      |
| `bubble`         | 96×64       | 48×32        | `{0.5, 1.0}`       | 9-slice, tail points down                   |
| `emotion icon`   | 32×32       | 16×16        | `{0.5, 1.0}`       | floats 8 px above head                      |
| terrain chunk    | 512×512     | 256×256      | `{0, 0}`           | 2× authoring, chunk grid 256 logical        |
| background layer | 6400×1200   | 3200×600     | `{0, 0}`           | 2× wide for parallax bleed                  |

Rules: never rotate the body sprite; flip horizontally for facing. Shell overlays are not
flipped (spiral direction is identity). Anchor coordinates are stored in the manifest and
in each `AnimationDef`; if they disagree, the manifest wins.

## E2. Exact animation frame lists

`<variant>` is `a`, `b` or `c`; frames are `00..NN`. All loops play at the listed fps.

| Animation      | Layer(s)        | Variants                                     | Frames    | FPS | Loop | Allowed next                  |
| -------------- | --------------- | -------------------------------------------- | --------- | --- | ---- | ----------------------------- |
| `idle`         | body+shell+face | a breathing, b eyestalk sway, c shell wiggle | 6 / 8 / 6 | 6   | yes  | crawl, rest, sleep, turn      |
| `crawl`        | body+shell      | a                                            | 8         | 12  | yes  | idle, crawl_fast, turn, munch |
| `crawl_fast`   | body+shell      | a                                            | 6         | 18  | yes  | crawl, idle, fall             |
| `turn`         | body+shell      | a                                            | 6         | 14  | no   | idle, crawl                   |
| `rest`         | body+shell+face | a                                            | 4         | 4   | yes  | idle, sleep, wake             |
| `sleep`        | body+shell+face | a                                            | 6         | 4   | yes  | wake                          |
| `wake`         | body+shell+face | a                                            | 4         | 10  | no   | idle, rest                    |
| `fall`         | body            | a                                            | 4         | 12  | no   | land                          |
| `land`         | body            | a                                            | 4         | 14  | no   | idle, crawl                   |
| `munch`        | body+face       | a                                            | 8         | 12  | no   | idle, crawl                   |
| `wave`         | body+face       | a                                            | 6         | 10  | no   | idle, talk_loop               |
| `nod`          | body+face       | a                                            | 4         | 10  | no   | idle                          |
| `shake_head`   | body+face       | a                                            | 4         | 10  | no   | idle                          |
| `shrug`        | body+face       | a                                            | 5         | 10  | no   | idle                          |
| `point`        | body+face       | a                                            | 4         | 10  | no   | idle                          |
| `jump_for_joy` | body+face       | a                                            | 6         | 14  | no   | land                          |
| `shiver`       | body+face       | a                                            | 4         | 16  | yes  | idle                          |
| `lean_in`      | body+face       | a                                            | 2         | 6   | yes  | idle                          |
| `talk_loop`    | face            | a                                            | 4         | 10  | yes  | idle                          |

Face-only variants do not animate the body; body gestures do not change the face, so the
two channels can run simultaneously. An emotion always selects a face variant; a gesture
may add a body overlay. Unknown ids resolve to `neutral` (face) or no gesture.

## E3. Emotion catalog (13 ids)

| Emotion      | Eyes / pupils              | Eyebrows       | Mouth        | Eyestalks            | Extra     | Icon                   |
| ------------ | -------------------------- | -------------- | ------------ | -------------------- | --------- | ---------------------- |
| `neutral`    | round, centred             | flat dashes    | small line   | upright              | —         | none                   |
| `joy`        | happy arcs                 | raised         | wide smile   | up, relaxed          | blush     | musical note / sparkle |
| `sadness`    | droopy, pupils down        | inner-up       | frown        | drooped              | tear      | sad cloud              |
| `anger`      | narrowed, pupils forward   | angled down-in | gritted line | stiff, back          | steam     | anger vein             |
| `surprise`   | wide, small pupils         | high arcs      | open "o"     | shot up              | —         | exclamation            |
| `fear`       | wide, pupils averted       | worried        | wavy line    | shaking              | sweat     | sweat drop             |
| `shyness`    | half-lidded, pupils away   | soft           | tiny smile   | bent inward          | big blush | heart (small)          |
| `curiosity`  | wide, pupils toward target | one raised     | small "o"    | bent toward target   | —         | question mark          |
| `thinking`   | pupils up-side             | one raised     | pursed       | one bent             | —         | lightbulb              |
| `boredom`    | half-lidded                | flat           | flat line    | drooped              | —         | "z" / none             |
| `excitement` | sparkle pupils             | raised         | open smile   | up, vibrating        | —         | sparkle                |
| `love`       | heart-shaped pupils        | soft           | smile        | curled toward target | blush     | heart                  |
| `confusion`  | crossed pupils             | mismatched     | wavy         | crossed              | —         | question mark          |

## E4. Snail palettes and identities

Every snail uses one body palette and one shell palette; shell patterns come from E5.
These six are the Phase 3 starter cast (persona details in `docs/AI_DESIGN.md` §10).

| Snail    | Role               | Body                 | Shell     | Pattern                    | Accessory     | Size |
| -------- | ------------------ | -------------------- | --------- | -------------------------- | ------------- | ---- |
| Tichomír | shy introvert      | `sage` `#BFD8A0`     | `#9B8CFF` | spiral (clockwise)         | round glasses | 0.94 |
| Barbora  | social chatterbox  | `peach` `#F7C9A0`    | `#FF8FA3` | dots                       | bow           | 1.00 |
| Ľubomír  | grumpy complainer  | `butter` `#F9E08B`   | `#6B4429` | stripes                    | scarf         | 1.06 |
| Zorka    | curious explorer   | `sky` `#A9D6F5`      | `#FFD36B` | zigzag                     | tiny backpack | 0.96 |
| Miško    | joker              | `peach` `#F7C9A0`    | `#6CC04A` | dots                       | leaf hat      | 1.02 |
| Filoména | dreamy philosopher | `lavender` `#CDBDF0` | `#9B8CFF` | spiral (counter-clockwise) | flower        | 0.98 |

Derived tones: each surface gets `base`, `shadow = base darkened 18%`, `highlight = base
lightened 12%`. Shell accent must keep ≥ 3:1 contrast against the body at 64 px.

## E5. Shell pattern catalog

| Id        | Description                                                                 | Readability rule                       |
| --------- | --------------------------------------------------------------------------- | -------------------------------------- |
| `spiral`  | single hand-drawn spiral line from centre to rim, highlight spot upper-left | line ≥ 2 px, never more than 2.5 turns |
| `stripes` | 3–5 radial wedge stripes along the spiral direction                         | no stripe thinner than 4 px at 1×      |
| `dots`    | 5–7 round dots following the spiral                                         | dot diameter 3–5 px at 1×              |
| `zigzag`  | one zigzag band around the shell                                            | 2 px line, 3 peaks maximum             |

Spiral direction is part of identity and must not be flipped with facing.

## E6. Accessory catalog

`glasses` (round, dark-brown), `scarf` (warm accent), `leaf-hat` (grass green),
`flower` (rose/butter), `bow` (rose), `backpack` (soil brown). Exactly one accessory per
snail. Accessories are separate 128×128 layers with manifest anchors so final art can
replace them without touching the rig.

## E7. Naming and manifest convention

- Animation: `snail/<layer>/<animation>_<variant>_<frame 00>`.
- Face: `snail/face/<emotion>_<variant>_<frame 00>`.
- Accessory: `snail/accessory/<id>_00`.
- Terrain: `terrain/chunk_<col>_<row>`; background `bg/<layer>_00`; UI `ui/<name>_00`.
- Manifest `id` uses kebab-case and matches the folder: `snail-body-crawl`, `ui-speech-bubble`.
- Every asset entry includes `prompt` (from `assets/PROMPTS.md`) and `status`.
- Atlases are packed ≤ 2048×2048, PNG, transparent, premultiplied alpha off.

## E8. Placeholder art

`scripts/generate-placeholders.ts` (Phase 4) draws simple vector shapes into
`assets/generated/` at the exact frame sizes and palette colors: ellipse body, circle
shell with spiral stroke, two stalk lines with white circle eyes, colored rectangle
accessory. Placeholder animations use 2–4 frames with squash offsets. The game must be
fully playable with placeholders; replacing them is a data/manifest change only.

## E9. UI specification

- **Font:** Baloo 2 (SIL Open Font License 1.1), weights 500/700; fallback `Nunito`,
  then system rounded sans. Must render `á ä č ď é í ĺ ľ ň ó ô ŕ š ť ú ý ž` correctly.
- **Speech bubble:** `#FFFDF4` fill, 2 px `#3B2A20` outline, 16 px corner radius at 1×,
  9-slice; max 3 lines, 42 characters per line target; tail 8×6 px; typewriter 28 ms per
  character with a 1 px bounce; long text splits into consecutive bubbles.
- **Thought bubble:** cloud outline, trailing 4/3/2 px circles, animated `…` while the
  LLM request is in flight; maximum 1 per snail.
- **Emotion icons:** 16×16 logical, pop-in 120 ms with 1.15 overshoot, fade out 200 ms.
- **Name tag:** 12 px text, paper fill, shown within 96 px of the player or on hover;
  relationship hearts 0–5 only during interaction.
- **HUD:** bottom-center chat input (bubble style), one hint line, pause/settings top-right.
  No health bars, no minimap, no inventory.

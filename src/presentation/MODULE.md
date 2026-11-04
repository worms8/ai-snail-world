# presentation

**Purpose:** everything the player sees and hears: Phaser scenes, sprites, layered
snail rig, animation/emotion playback, speech bubbles, HUD, camera, audio and
localization. Reads simulation snapshots and listens to events; never owns truth.

**Public API (`index.ts`):**

- `LOCALES`, `DEFAULT_LOCALE`, `uiString`, `UiStringKey`, `LocaleId`
- `RenderSnapshot`, `CameraState`, `SpeechBubble`, `EmotionIconRequest`
- `BootScene`, `WorldScene`, `WorldViewContext`, `PlayerSource` (Phase 1)
- `TerrainRenderer`, `createPlaceholderSnail`, `posePlaceholderSnail` stay internal

**Inputs / outputs:** `WorldSnapshot` + event stream in; draw calls, tweens, audio and
UI DOM out. Phaser is allowed only here.

**May depend on:** `src/core`, `src/domain`, `src/ai` (types/dialogue DTOs),
`src/world`, and its own internals.

**Events:** consumes `DialogueLine`, `EmotionChanged`, `MoodChanged`, `TerrainCarved`,
`ConversationStarted`, `ConversationEnded`; emits no simulation events.

**Invariants:**

- Animation and emotion ids always come from data catalogs; unknown ids → `neutral`.
- Presentation never mutates `Snail`, `SnailBody` or terrain state.
- UI strings come from `i18n/*.json`; no user-facing literals in code.
- All assets are referenced via `assets/manifest.json` ids, never file paths.

**How to extend:** add a scene under `scenes/`, register it in the scene list, add
catalog data under `data/`, add asset ids to the manifest, then update this file.

**Pitfalls:** importing Phaser from `core`/`domain`/`ai`/`world` breaks headless tests.
Do not put simulation timers in scenes; they must use the shared tick clock.

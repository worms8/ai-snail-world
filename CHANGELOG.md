# Changelog

All notable changes to **AI Snail World** are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
For the AI agent session logs, see [`docs/CHANGELOG_AI.md`](docs/CHANGELOG_AI.md).

## [0.2.0] — 2026-11-04 — Phase 2: Destructible Terrain

### Added

- **Bitmap Carving**: Circle carving on the 1-byte terrain mask with bounds-clamping and dirty-rectangle tracking (`carveCircle` in `src/world/terrain-carver.ts`).
- **Surface Refresh**: Dynamic top-surface updates (`surfaceY`) when carving from above; underground tunnels preserve roof surface and grass.
- **Dirty-Chunk Rendering**: Selective chunk repainting in `src/presentation/terrain-renderer.ts`, redrawing only changed rectangles with a 2 px margin for outline and grass regeneration.
- **Player Munch Input**: Pressing or holding `Q` triggers mouth-centered carving every 250 ms.
- **Crumb FX**: Cosmetic soil crumbs and dust puff particles on munching (`src/presentation/fx/crumbs.ts`).
- **Kinematics Carve Reaction**: Snail kinematics detect when ground is carved away from underneath; snails fall under gravity and land safely on the new floor.
- **Mask Persistence Codec**: Lossless RLE compression and decompression (`src/world/terrain-rle.ts`) for saving the terrain mask.
- **Event Bus**: Type-safe event bus factory (`createEventBus` in `src/core/events.ts`).
- **Tests**: Comprehensive unit tests covering carving, seam crossing, bounds safety, RLE roundtrip, and fall-after-carve reaction (29 total tests).

## [0.1.0] — 2026-11-04 — Phase 1: Walking Prototype

### Added

- **Procedural Heightfield**: Seeded multi-octave terrain mask with a flat spawn plateau.
- **Chunked Terrain Renderer**: 256×256 px chunk grid painted to Phaser canvas textures with grass, soil, and outlines.
- **Procedural Snail**: Placeholder geometric snail sprite with procedural bobbing and eye stalks.
- **Kinematics**: 30 Hz fixed-step kinematics with slope walking, 8 px step-up, snap-down on descents, and gravity.
- **Controls & Camera**: Keyboard movement (A/D and arrow keys) with smooth camera follow and dead zone.
- **HUD**: Slovak control hint overlay.

## [0.0.1] — 2026-11-04 — Phase 0: Project Scaffold & Documentation

### Added

- Full documentation suite (`AGENTS.md`, `ARCHITECTURE.md`, `docs/AI_DESIGN.md`, `docs/ART_BIBLE.md`, `docs/TERRAIN.md`, `docs/ROADMAP.md`, `docs/DECISIONS.md`).
- Layered headless architecture (`core`, `domain`, `ai`, `world`, `presentation`, `app`).
- Quality gates with TypeScript, Vite, Vitest, ESLint, dependency-cruiser, and Prettier.
- Node.js + Hono server scaffold for future LLM proxying.

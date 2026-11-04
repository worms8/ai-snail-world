# AI Snail World

A tiny, cozy 2D side-view garden simulated in your browser. You play one snail: crawl
around, dig tunnels, meet six AI-driven snails, talk to them, and watch their relationships
and conversations unfold — including the ones that happen without you. There is no combat,
no inventory and no quest log; the goal is to hang out.

The game is built by AI agents, so the repository is organized for small context windows:
small files, one `MODULE.md` per module, strict layering, a routing table in `AGENTS.md`,
and a `docs/` set (art bible, AI design, terrain, roadmap, decisions, changelog).

**Status:** Phase 1 — walking prototype. A placeholder snail walks on a seeded procedural
terrain with a following camera. Carving, AI snails and dialogue arrive in later phases.

## Quick start

```bash
npm install
npm run dev            # http://localhost:5173
npm run server:dev     # optional proxy on http://localhost:8787 (health only)
```

Copy `.env.example` to `.env` only when working on the proxy; never commit `.env`.

## Quality gates

```bash
npm run build          # TypeScript typecheck + Vite production build
npm test               # Vitest headless logic tests
npm run lint           # ESLint + dependency-cruiser boundaries
npm run docs:check     # MODULE.md, line limits, architecture map, deps
```

## Where to read next

- `AGENTS.md` — entry point and task routing (start here).
- `ARCHITECTURE.md` — layers, file map, events, simulation loop, save format.
- `docs/AI_DESIGN.md` — cognition tiers, prompts, personas.
- `docs/TERRAIN.md` — destructible bitmap design.
- `docs/ART_BIBLE.md` — visual source of truth.
- `docs/ROADMAP.md` — phases and acceptance criteria.

Tech: TypeScript (strict), Vite, Phaser 3, Vitest, Hono proxy, DeepSeek (server-side only).
In-game language is Slovak; code and docs are English.

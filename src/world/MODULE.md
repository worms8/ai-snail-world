# world

**Purpose:** destructible terrain, simple snail kinematics and world entity state.
No Phaser objects, no drawing, no LLM.

**Public API (`index.ts`):**

- `Rect`, `TerrainMaskData`, `TerrainChunk`, `TerrainQuery`, `TerrainCarver`,
  `PointOfInterest`
- `TerrainMask`, `createTerrainMask`, `TerrainGenerationOptions`
- `isSolid`, `groundHeightBelow`, `surfaceNormal`, `isBodyFree`
- `carveCircle`, `refreshSurfaceColumn`, `markChunksDirty`, `coalesceRect`
- `encodeTerrainRle`, `decodeTerrainRle`
- `createKinematicState`, `stepKinematics`, `MovementIntent`, `KinematicsOptions`
- `SimulationClock`, `SimulationClockOptions`, `TickHandler`
- `KinematicState`, `LocomotionState`, `SnailActivity`, `SnailBody`, `WorldSnapshot`

**Inputs / outputs:** terrain mask + body state in, updated positions and dirty rects
out. Deterministic; Phase 1 generation uses `createRng` per noise octave.

**May depend on:** `src/core`, `src/domain`.

**Events:** emits `TerrainCarved` (from the carver) and `SnailMet` (from encounter
detection); consumes `Tick`.

**Invariants:**

- Collision truth is the `Uint8Array` mask; the canvas is a mirror.
- A carve mutates mask and visual dirty region in the same operation.
- The simulation is headless and fixed-step; rendering never mutates world state.
- No physics engine and no falling-sand simulation.
- The spawn plateau is flat so the player can start without a step-up failure.

**How to extend:** implement functions against `TerrainQuery`/`TerrainCarver`; add new
activities to `SnailActivity` and their Tier-0 transition to `docs/AI_DESIGN.md`.

**Pitfalls:** never sample rendered pixels for collision. Do not import `presentation`
or Phaser; that would make headless tests impossible.

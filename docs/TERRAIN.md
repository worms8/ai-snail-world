# Terrain — destructible bitmap design

Worms-like deformable terrain, implemented ourselves. No physics engine, no falling sand.
Collision truth is a byte mask; visuals are a synchronized canvas. See
`ARCHITECTURE.md` §14 for the carve sequence.

## 1. World and coordinates

- World: `3200 × 1200` logical px, origin top-left, y grows down.
- Entity positions are floats in world space; terrain queries floor to pixels.
- A snail's foot pivot is its `(x, y)`; body box is 48×40 logical px.
- Camera follows the player with a dead zone, clamped to world bounds.
- Chunk grid: 256×256 px. For v1 that is 13 columns × 5 rows (last column 128 px wide,
  last row 176 px tall); out-of-range pixels are simply not addressable.

## 2. Data structures

```ts
interface TerrainMaskData {
  width: number; // 3200
  height: number; // 1200
  pixels: Uint8Array; // length width*height, 0 = air, 255 = solid
}

interface TerrainChunk {
  index: number; // row-major: row * columns + col
  rect: { x: number; y: number; width: number; height: number };
  textureKey: string; // presentation registers a Phaser texture with this key
  dirty: boolean;
  dirtyRect: { x: number; y: number; width: number; height: number } | null;
}

class TerrainMask implements TerrainCarver {
  readonly data: TerrainMaskData;
  readonly chunks: TerrainChunk[];
  readonly surfaceY: Int16Array; // per column, first solid y (height when empty)
}
```

`world` stays headless: it owns the mask, chunk flags and dirty rects. The presentation
`TerrainRenderer` owns the per-chunk canvases/Phaser textures; it reads the mask and redraws
dirty rectangles. Memory: 3200×1200 = 3.84 MB for the mask, plus `surfaceY` (6.4 KB).
Presentation canvases are 13×5 at 512² (about 17 MB GPU/RAM) — acceptable for desktop; do
not increase chunk resolution without measuring.

## 3. Generation and layers

V1 terrain comes from `src/world/data/world-01.json` (height profile + material hints) or a
seeded noise prototype. Generation writes `pixels` and `surfaceY` once; rendering is fully
derived from the mask, so carving and generation share the same visual code.

Visual stack per chunk, bottom to top:

1. **Backwall** (`#4A3020` at 55% alpha) for air pixels that are enclosed by terrain
   (tunnels), so cavities read as depth. Surface-open sky stays transparent.
2. **Soil body** — flat base `#9C6B43`; a shadow tone `#6B4429` in the lower 35 % of each
   solid region; deterministic hand-drawn pebbles/roots from a seeded hash of chunk+index.
3. **Inner edge** — 2 px `#3B2A20` on every solid pixel with at least one 4-neighbour air
   pixel; regenerated for the dirty rect after every carve.
4. **Grass cap** — for solid pixels with `y >= surfaceY[x]` and `y < surfaceY[x] + 10`:
   base `#6CC04A`, top 3 px `#A8E06B`, bottom 2 px `#3F8F3A`, plus tufts every 12–20 px.
   `surfaceY` is refreshed for carved columns, so a new top gets grass; tunnel roofs do not.
5. **Decorations** — stones `#B9B3A8`/`#8D877C`, roots, no skeletons or text.

The renderer never reads back the displayed canvas. It redraws chunk regions from `pixels`.

## 4. `carveCircle(x, y, r)`

```text
if r <= 0: return null
minX = clamp(floor(x - r), 0, width - 1)
maxX = clamp(ceil(x + r), 0, width - 1)
minY = clamp(floor(y - r), 0, height - 1)
maxY = clamp(ceil(y + r), 0, height - 1)
r2 = r * r
changed = false
for py in minY..maxY:
  for px in minX..maxX:
    if (px - x)^2 + (py - y)^2 > r2: continue
    i = py * width + px
    if pixels[i] == 0: continue
    pixels[i] = 0
    changed = true
if not changed: return null
for px in minX..maxX: refreshSurface(px, minY, maxY)
markChunksDirty({minX, minY, maxX, maxY})
return { x: minX, y: minY, width: maxX-minX+1, height: maxY-minY+1 }
```

`refreshSurface(column, fromY, toY)` scans from `max(0, surfaceY[column] - 2)` down to the
last solid pixel (or `height` when the column is empty) and updates `surfaceY`. This is
O(column height) only for affected columns, not the whole world.

Typical radii: munch 14, explosion/fx 20–32, max accepted 64. Complexity is O(r²); at
r=32 that is ~3.2k pixel tests, well under the 2 ms budget.

`markChunksDirty` sets `dirty = true` and merges the world rect into each chunk's local
`dirtyRect`. Merge rule: if the union area ≤ 1.4 × (areaA + areaB), merge; otherwise keep
the larger/recent rect. Each chunk redraws at most one rect per frame.

## 5. Dirty-rect rendering

Per frame (presentation layer):

1. Ask the carver for dirty chunks (do not scan all 65 chunks).
2. For each dirty chunk, clear only `dirtyRect`, redraw layers 1–5 clipped to that rect.
3. Call `texture.refresh()` (or redraw into the chunk's Phaser texture) once.
4. Reset chunk dirty state.
5. Emit cosmetic FX separately: 6–12 crumbs with velocity, gravity, 0.4–0.8 s lifetime;
   dust puff; 120 ms camera-space squash. FX never affect collision.

Chunk seams: edge detection samples 1 px outside the dirty rect (clamped to the chunk, or
the neighbouring mask pixel at chunk borders). Outline pixels at the seam are included in
the dirty rect with a 2 px margin to avoid missing edges.

## 6. Collision queries

```ts
isSolid(x, y): boolean
  if x < 0 || x >= width: return false
  if y < 0: return false
  if y >= height: return true            // bedrock: never fall out of the world
  return pixels[floor(y) * width + floor(x)] !== 0

groundHeightBelow(x, startY): number | null
  if x out of bounds: return null
  y = max(0, floor(startY))
  // fast path: start at surfaceY[x] when it is at/below startY
  for (; y < height; y++): if isSolid(x, y) return y
  return null

surfaceNormal(x, y): { x, y }
  hl = groundHeightBelow(x - 6, y - 12)
  hr = groundHeightBelow(x + 6, y - 12)
  if hl == null || hr == null: return { x: 0, y: -1 }
  slope = (hr - hl) / 12
  length = sqrt(slope*slope + 1)
  return { x: -slope / length, y: 1 / length }   // points up out of the ground

isBodyFree(x, footY, w = 48, h = 40): boolean
  sample foot line (x-w/2 .. x+w/2 at footY-1) and head box corners
  return false if any sample is solid
```

Slope walking: sample ground at `footX + direction * 6`; if the height difference is
≤ `SNAIL_STEP_HEIGHT` (8 px), snap to it. If blocked, try an 8 px step-up; if still
blocked, stop and pick a new wander target. Slopes steeper than ~45° are not walkable.

Gravity: `vy += 1800 * dt`, terminal 900 px/s. A snail is grounded when
`groundHeightBelow(footX, footY + 2)` is within 4 px; then snap `y` and set `vy = 0`.
After any carve, re-check every snail whose body box intersects the dirty rect; if the
ground vanished, switch to `fall`.

## 7. Munch and destruction

Player presses `Q`: mouth point = `footX + facing * 20`, `footY - 8`. While held, every
250 ms call `carveCircle(mouthX, mouthY, 14)`, play `munch`, spawn crumbs. Carving from the
surface digs a pit; carving sideways digs a tunnel. Snails within 96 px of a `TerrainCarved`
event may enter `flee-hole` (Tier 0). No damage, no combat.

## 8. Edge cases

| Case                               | Rule                                                       |
| ---------------------------------- | ---------------------------------------------------------- |
| Carve fully outside world          | clamp bbox; if empty → `null`, no event                    |
| Carve radius > 64                  | clamp to 64 and log once in dev                            |
| Carve changes nothing (all air)    | return `null`, no dirty chunks                             |
| Carve removes ground under a snail | body recheck → `fall` state                                |
| Carve creates a 1 px ceiling       | allowed; outline still drawn; collapse is not simulated    |
| Carve at chunk seam                | mark both chunks; redraw with 2 px margin                  |
| Column fully carved                | `surfaceY = height`; no grass                              |
| Save/load                          | persist mask only; recompute `surfaceY` and chunks on load |
| Tiny radius (<1 px)                | still processes; caller avoids spamming                    |

## 9. Persistence

Save terrain as RLE over the byte mask: `[runLength, value]` pairs (values 0 or 255),
serialized as a base64 string. Typical garden scenes compress to tens of KB instead of
3.84 MB. Versioned inside `SaveGameV1` (see `ARCHITECTURE.md` §16). On load: validate
length, rebuild `pixels`, recompute `surfaceY`, mark every chunk dirty once.

## 10. Performance budgets

| Operation                     | Budget                        |
| ----------------------------- | ----------------------------- |
| `carveCircle(r=14)`           | ≤ 0.5 ms                      |
| `carveCircle(r=32)`           | ≤ 2 ms                        |
| `isSolid`                     | O(1)                          |
| `groundHeightBelow` fast path | ≤ 32 px scan                  |
| Dirty redraw per chunk        | ≤ 4 ms total per frame        |
| Chunk texture refresh         | only dirty chunks             |
| Full-world regen (load)       | ≤ 50 ms, off the render frame |

## 11. Tests (Phase 2)

- Carve removes exactly the pixels inside the circle; outside pixels untouched.
- Bounds clamping at all four edges; zero/negative radius; all-air carve returns null.
- Dirty rect covers every changed pixel; chunk flags set for seam carves.
- `surfaceY` update: surface carve lowers it, tunnel carve does not.
- Ground/slope/body queries on a fixture mask; step-up at 8 px, blocked at 24 px.
- Snail falls when ground is carved away; lands on the new floor.
- RLE roundtrip is lossless for random and mostly-uniform masks.
- Visual layer functions are pure (given mask + rect → colors) and snapshot-tested.

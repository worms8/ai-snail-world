# Asset generation prompts

Every prompt starts with the shared style header, then adds the asset-specific brief.
Keep this file in sync with `assets/manifest.json`. New assets get a `prompt` field
derived from the matching group below.

## Shared style header (prepend to every prompt)

> hand-drawn cartoon, thick dark-brown outline, flat colors with one soft shadow tone,
> cozy storybook garden, chubby cute snail with big spiral shell and eyestalk eyes,
> transparent background, side view facing right

## Snail body + shell + face layers

> …shared header…, layered character rig for a chubby garden snail, 128×128 px frame,
> soft squishy body low to the ground, wide flat foot, big round spiral shell on the
> back, two long eyestalks with big round eyes at the tips, two short feelers, simple
> mouth, clean silhouette readable at 64 px, pivot at bottom center of the foot,
> {palette: peach | sage | lavender | butter | sky | rose}, {shell pattern: spiral |
> stripes | dots | zigzag}, neutral pose facing right

Variants needed: `idle_a/b/c`, `crawl`, `crawl_fast`, `turn`, `rest`, `sleep`, `wake`,
`fall`, `land`, `munch`; face emotions from `docs/ART_BIBLE.md`.

## Gesture overlays

> …shared header…, single gesture pose for the same snail rig, {gesture: wave | nod |
> shake_head | shrug | point | jump_for_joy | shiver | lean_in | talk_loop}, 128×128 px,
> readable silhouette, no background

## Terrain chunk

> …shared header…, seamless 256×256 editable terrain chunk, thick soil slab with a
> bumpy grass cap and small tufts, layered brown soil with hand-drawn pebbles and roots,
> 2 px dark inner edge outline wherever soil meets open air, flat colors, no text, no
> characters, tileable top edge, transparent sky area

## Background parallax layers

> …shared header…, single parallax layer, {far hills | mid hills with mushrooms and
> tree trunks | sky with fluffy clouds | foreground grass blades and flowers}, soft
> storybook palette, no characters, no text, transparent where needed, 3200×1200 px
> source, seamless horizontal repeat

## Props and points of interest

> …shared header…, single garden prop, {giant mushroom | flower | daisy | pebble |
> leaf | puddle | log | lantern | wooden sign | snail café stump}, thick dark-brown
> outline, flat colors with one shadow tone, transparent background, side view

## UI: speech bubble, thought bubble, icons, name tag

> …shared header…, cozy UI asset, {rounded paper speech bubble with small tail |
> cloud thought bubble | emotion icon: heart/sweat drop/exclamation/question mark/anger
> vein/musical note/z/sparkle/lightbulb/sad cloud | rounded name tag}, paper `#FFFDF4`
> fill, 2 px dark-brown outline, dark-brown text-free art, slight wobble, no text

## Audio (described, generated separately)

> cozy garden ambience, soft wind, distant birds, tiny squishy snail footsteps, gentle
> ukulele and music box, loopable, no voices, warm and never scary

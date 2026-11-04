# AI Design — cognition, conversation and memory

Companion to `ARCHITECTURE.md` §10–15. This file specifies _how_ snails decide, talk and
remember. Keep formulas and prompt templates here in sync with `src/ai` and `src/domain`.

## 1. Principles

1. The LLM is the expensive last tier, never the default.
2. One call per NPC↔NPC conversation returns the whole script **and** its outcome.
3. The simulation never waits for the network; outcomes are applied on a later tick.
4. Numbers drive decisions; text drives prompts. LLM text never directly mutates state.
5. Everything is seeded, budgeted, schema-validated and falls back to canned content.
6. Off-screen pairs do not consume LLM calls (rule-based abstract encounters only).

## 2. Tier 0 — movement and routine (no AI)

A finite-state machine per snail, updated every simulation tick. Movement is simple custom
kinematics against the terrain mask (see `docs/TERRAIN.md`).

| State            | Enter when                     | Behaviour                                              | Exit                                      |
| ---------------- | ------------------------------ | ------------------------------------------------------ | ----------------------------------------- |
| `wander`         | default                        | pick a nearby reachable x every 3–8 s, crawl toward it | reached, new state timer, threat          |
| `walk-to-poi`    | idle + liked POI within 600 px | path by ground sampling, crawl to POI                  | arrive, unreachable, threat               |
| `look-around`    | after arrive/idle 4–10 s       | stop, rotate eyestalks toward POI/neighbour            | timer                                     |
| `rest`           | energy < 0.35 or night-ish     | curl, slow breathing, no movement                      | energy > 0.6, threat, social invite       |
| `sleep`          | energy < 0.12                  | retract into shell, "z" icon                           | energy > 0.45, terrain carve nearby       |
| `approach-snail` | Tier 1 chose a target          | crawl to within 48 px                                  | in range, target moved away, timeout 15 s |
| `flee-hole`      | `TerrainCarved` within 96 px   | fast-crawl away for 1.5–3 s                            | safe distance                             |
| `fall`           | no ground under body           | gravity, stretched pose                                | ground contact                            |
| `land`           | ground contact after fall      | squash 4 frames                                        | idle                                      |
| `munch`          | player input only              | bite loop, carve every 250 ms                          | key released                              |
| `talk`           | conversation playback          | face partner, `talk_loop` while speaking               | conversation end                          |

Threats are local only (terrain carve, fast approach by a disliked snail). There is no
combat and no damage. State changes come from a small transition function with a seeded
RNG; the same seed + same inputs produce the same routine.

Tier 0 stays in `src/ai` without importing `src/world`: it receives a read-only
`Tier0WorldView` (`groundHeight(x)`, `isBodyFree(...)`, `nearbySnails`, `pointsOfInterest`)
and returns movement intents. The world applies those intents through kinematics and
terrain collision, then reports back the resulting body state each tick.

## 3. Tier 1 — utility AI for social decisions

Runs at 5 Hz, staggered: each tick updates 1/6 of snails, so each snail thinks every
200 ms and the work is spread. It is pure TypeScript, no LLM.

### 3.1 Score a potential partner

```
proximity        = clamp01(1 - distance / 320)
affinityNorm     = (affinity + 100) / 200
trustNorm        = (trust + 100) / 200
familiarityNorm  = familiarity / 100
moodNorm         = (valence + 1) / 2
novelty          = 1 - min(1, interactionsInLast10Min / 3)

raw = 0.28 * proximity
    + 0.18 * extraversion
    + 0.14 * affinityNorm
    + 0.08 * trustNorm
    + 0.07 * familiarityNorm
    + 0.10 * moodNorm
    + 0.05 * novelty
    + 0.10 * energy

score = clamp01(raw - penalties)
```

Hard gates (score → 0): per-pair cooldown active, all conversation slots busy, target is
in a conversation, target is the player currently chatting, snail is asleep/falling.

Soft penalties: disliked snail `-0.30`, disliked topic/place context `-0.10`,
`neuroticism > 0.7` and unfamiliar target `-0.10`, currently resting `-0.15`.

Decision thresholds: `≥ 0.55` greet/start; `≥ 0.70` join an ongoing pair conversation;
otherwise ignore. A "greet" also requires line of sight (same terrain surface ±24 px).

**Worked examples**

- Barbora (extraversion 0.9, energy 0.8), friendly neighbour at 64 px (proximity 0.8),
  affinity 60 → 0.8, trust 50 → 0.75, familiarity 40 → 0.4, mood 0.6, novelty 1:
  `0.224 + 0.162 + 0.112 + 0.060 + 0.028 + 0.060 + 0.050 + 0.080 = 0.776` → greet.
- Ľubomír (extraversion 0.2, energy 0.5), stranger at 224 px (proximity 0.3), neutral
  relationship, mood −0.3 → 0.35, novelty 0.66:
  `0.084 + 0.036 + 0.070 + 0.040 + 0.000 + 0.035 + 0.033 + 0.050 = 0.348` → ignore.
- Same as above but the target is disliked: `0.348 − 0.30 = 0.048` → avoid.

### 3.2 Reaction choice

If a conversation is offered: `accept` when score ≥ 0.55 and relationship is not hostile
(affinity > −40); `avoid` when affinity < −40 or fear emotion is active; otherwise
`ignore` with a small `sadness` mood delta (−0.02 valence).

## 4. Conversation director

One asynchronous job per conversation. Steps:

1. Tier 1 enqueues `ConversationRequest` (pair, reason, location, tick, warmth).
2. Director checks hard gates: budget, cooldowns, slots, cache.
3. If denied → canned script from `MockProvider`, reason `fallback`, still play.
4. If allowed → build one prompt: persona cards + relationship + situation + top-5
   memories per snail + output contract.
5. Send via `LlmProvider` (DeepSeek proxy) with `jsonMode`, 12 s deadline.
6. On HTTP/schema failure: one repair turn, then canned fallback.
7. Validate with `conversationScriptSchema`; map speakers `a`/`b` to snail ids.
8. Apply outcome to domain: relationship deltas both directions, mood deltas, memories.
9. Emit `ConversationStarted`, then `DialogueLine` per line on the playback timer.
10. Emit `ConversationEnded` with `completed` | `interrupted` | `fallback`.

Playback timing: `max(1800, 45 * text.length)` ms per line, capped at 6000 ms; a line is
interruptible. If interrupted, remaining lines are skipped but the outcome is applied
(the conversation still happened).

## 5. Prompt templates and budgets

All prompt builders are pure functions in `src/ai/prompt-builders.ts`. Hard input budgets
are enforced by truncation before sending; a prompt is never built from full history.

| Prompt                         | System | User         | Max output | Notes                          |
| ------------------------------ | ------ | ------------ | ---------- | ------------------------------ |
| Persona card (shared block)    | —      | ≤ 220 tokens | —          | reused in all prompts          |
| NPC↔NPC conversation + outcome | 220    | 420          | 700        | one call, JSON object          |
| Player chat                    | 260    | 640          | 250        | streaming if feasible          |
| Memory compaction              | 140    | 460          | 150        | low priority, per relationship |
| Reflection summary             | 120    | 300          | 120        | optional, Phase 7              |

### 5.1 Persona card (compact, never full history)

```text
SI SLIMÁK: {name}. {backstory}
ČRTY: otvorenosť {o}, svedomitosť {c}, extraverzia {e}, prívetivosť {a}, neurotizmus {n} (0-1)
ZVLÁŠTNOSTI: {quirks joined by "; "}
REČ: {vocabulary}; vety {sentenceLength}; obľúbené frázy: {catchphrases};
      nikdy nepovie: {neverSays}
MÁ RÁD: {likedPlaces/topics}; NEMÁ RÁD: {disliked...}
VZŤAH K {other}: afinita {affinity}, dôvera {trust}, známosť {familiarity}, štítky {tags}
SPOMIENKY (top 5): {memory lines with age and importance}
NÁLADA: valence {v}, nabudenie {ar}, energia {en}
```

### 5.2 NPC↔NPC conversation request

System (English instructions, Slovak output):

```text
You write one short, natural, cozy conversation between two garden snails.
Output ONLY a JSON object matching the contract. 3-8 lines, alternating speakers,
1-140 characters per line, Slovak with correct diacritics. Keep it gentle and in
character. No narration, no markdown, no combat, no humans. Each line has an emotion
from the allowed list and optionally a gesture. Then give the outcome.
Allowed emotions: {EMOTION_IDS}
Allowed gestures: {GESTURE_IDS}
```

User: persona card A, persona card B, situation, reason, location, relationship warmth,
then the JSON contract. Example contract:

```json
{
  "lines": [
    { "speaker": "a", "text": "Ahoj, Zorka! Videla si ten nový tunel?", "emotion": "joy" },
    {
      "speaker": "b",
      "text": "Videla. Voňal po daždi a trochu po dobrodružstve.",
      "emotion": "curiosity",
      "gesture": "lean_in"
    }
  ],
  "outcome": {
    "relationshipDeltas": {
      "a": { "affinity": 2, "trust": 1, "familiarity": 2 },
      "b": { "affinity": 1, "trust": 1, "familiarity": 2 }
    },
    "moodDeltas": {
      "a": { "valence": 0.06, "arousal": 0.03, "energy": -0.01 },
      "b": { "valence": 0.05, "arousal": 0.02, "energy": -0.01 }
    },
    "memoryEntries": [
      { "speaker": "a", "text": "Zorka sa tešila z nového tunela.", "importance": 3 }
    ],
    "followUpIntent": "ukázať Zorke tunel"
  }
}
```

Schema: `src/ai/conversation-schema.ts`. Ranges: lines 3–8; text 1–140; affinity/trust
−10..10; familiarity 0..5; mood deltas −0.5..0.5; 0–2 memory entries, importance 1–10.
`followUpIntent` ≤ 120 characters or null.

### 5.2b JSON output schema (abbreviated)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "additionalProperties": false,
  "required": ["lines", "outcome"],
  "properties": {
    "lines": {
      "type": "array",
      "minItems": 3,
      "maxItems": 8,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["speaker", "text", "emotion"],
        "properties": {
          "speaker": { "enum": ["a", "b"] },
          "text": { "type": "string", "minLength": 1, "maxLength": 140 },
          "emotion": {
            "enum": [
              "neutral",
              "joy",
              "sadness",
              "anger",
              "surprise",
              "fear",
              "shyness",
              "curiosity",
              "thinking",
              "boredom",
              "excitement",
              "love",
              "confusion"
            ]
          },
          "gesture": {
            "enum": [
              "wave",
              "nod",
              "shake_head",
              "shrug",
              "point",
              "jump_for_joy",
              "shiver",
              "lean_in",
              "talk_loop"
            ]
          }
        }
      }
    },
    "outcome": {
      "type": "object",
      "additionalProperties": false,
      "required": ["relationshipDeltas", "moodDeltas", "memoryEntries", "followUpIntent"],
      "properties": {
        "relationshipDeltas": {
          "type": "object",
          "required": ["a", "b"],
          "properties": {
            "a": { "$ref": "#/$defs/relationshipDelta" },
            "b": { "$ref": "#/$defs/relationshipDelta" }
          }
        },
        "moodDeltas": {
          "type": "object",
          "required": ["a", "b"],
          "properties": {
            "a": { "$ref": "#/$defs/moodDelta" },
            "b": { "$ref": "#/$defs/moodDelta" }
          }
        },
        "memoryEntries": {
          "type": "array",
          "maxItems": 2,
          "items": {
            "type": "object",
            "required": ["speaker", "text", "importance"],
            "properties": {
              "speaker": { "enum": ["a", "b"] },
              "text": { "type": "string", "minLength": 1, "maxLength": 160 },
              "importance": { "type": "integer", "minimum": 1, "maximum": 10 }
            }
          }
        },
        "followUpIntent": { "type": ["string", "null"], "maxLength": 120 }
      }
    }
  },
  "$defs": {
    "relationshipDelta": {
      "type": "object",
      "required": ["affinity", "trust", "familiarity"],
      "properties": {
        "affinity": { "type": "number", "minimum": -10, "maximum": 10 },
        "trust": { "type": "number", "minimum": -10, "maximum": 10 },
        "familiarity": { "type": "number", "minimum": 0, "maximum": 5 }
      }
    },
    "moodDelta": {
      "type": "object",
      "required": ["valence", "arousal", "energy"],
      "properties": {
        "valence": { "type": "number", "minimum": -0.5, "maximum": 0.5 },
        "arousal": { "type": "number", "minimum": -0.5, "maximum": 0.5 },
        "energy": { "type": "number", "minimum": -0.5, "maximum": 0.5 }
      }
    }
  }
}
```

The runtime validator is the zod schema (single source of truth); this JSON Schema is the
documented contract for prompt authors and tests.

### 5.3 Player chat

System: persona card + "Si v rozhovore s hráčom. Odpovedz 1–3 krátkymi vetami po
slovensky, v postave. Nepíš scénické poznámky." User: relationship to player, top-5
memories, last 4 turns, new message. Output is plain text (not JSON), max 250 tokens.
Highest priority in the queue; reserved budget even during calm-down.

### 5.4 Memory compaction

Input: the snail's relationship summary for one target + up to 20 low-importance entries.
Output JSON `{ "summary": "≤ 2 vety po slovensky", "keptEntryIds": ["..."] }`.
Runs at low priority when a snail exceeds 40 entries. On failure, rule-based truncation
keeps the 15 highest retrieval scores.

## 6. Output contract and fallback ladder

| Step | Action                                                       | On failure                                 |
| ---- | ------------------------------------------------------------ | ------------------------------------------ |
| 1    | Provider call, 12 s timeout                                  | go to 2                                    |
| 2    | One retry with 300–900 ms jittered backoff                   | go to 3                                    |
| 3    | Schema invalid → one repair prompt with the validation error | go to 4                                    |
| 4    | Canned script from `MockProvider`                            | always succeeds                            |
| 5    | Emit `LlmRequestFailed`                                      | UI shows thinking/fallback, game continues |

Never throw out of the async job. Never block a simulation tick. Canned scripts are
data (`src/ai/data/canned-dialogues.sk.json`), deterministic by pair + situation hash.

## 7. Nice-to-have: cache and calm-down

Cache key: `hash(sortedPairIds | reason | locationTag | moodBucket | relationshipBucket |
topMemoryIds)`, buckets: mood valence in 0.25 steps, affinity in 20-point steps. TTL 10 min.
Identical situations reuse the script but still apply outcome deltas (clamped).

Calm-down: if queue > 6 or HTTP 429, block new NPC calls for 60 s; player chat remains.
Off-screen pairs use abstract encounters: e.g. affinity +1 if both like the same place,
−1 if disliked, capped at ±2 per in-game day. No text is generated off-screen.

## 8. Memory and relationships

### 8.1 Episodic memory

`MemoryEntry` fields: id, tick, wall-clock timestamp, participants, locationTag, text
(one Slovak sentence), emotion, importance 1–10, keywords. No embeddings.

### 8.2 Retrieval

```
recency     = exp(-ageHours / 72)
importance  = importance / 10
relevance   = 0.5 * participantMatch
            + 0.3 * tagOverlap
            + 0.2 * keywordJaccard
score       = 0.45 * recency + 0.30 * importance + 0.25 * relevance
```

Top 5 by score, always including at least one memory about the current partner if one
exists. Implemented as `memoryRetrievalScore` in `src/domain/memory.ts`.

### 8.3 Compaction

At 40 entries: one low-priority LLM call per relationship merges old low-importance
entries into a 1–2 sentence Slovak summary ("Čo si myslím o Pavlovi"). Keep the 15 highest
scoring entries plus summaries. Rule-based fallback: keep top 15 by score, drop the rest.

### 8.4 Relationship updates

- Apply `relationshipDeltas` in both directions, then clamp: affinity/trust −100..100,
  familiarity 0..100.
- Familiarity never decreases from conversation outcomes.
- Decay without contact, once per in-game day: affinity and trust move 0.5 toward 0;
  familiarity moves 0.1 toward 0 only after 3 days without contact.
- Tags: at most 3. Replace only when the event importance ≥ 6 or the same tag was implied
  3 times; never invent more than 3.
- Numbers drive Tier 1; the text summary only enters prompts.

### 8.5 Mood

Mood deltas are clamped to [−1,1]/[0,1]/[0,1] after application, then decay toward the
personality baseline (`MOOD_DECAY_PER_SECOND`). Emotion is presentation-only and selected
from mood + last event: valence < −0.3 → sadness/anger/fear depending on arousal and
agreeableness; valence > 0.4 → joy/excitement; curiosity when a novel POI is nearby.

## 9. Budget manager defaults

| Parameter              | Default                    |
| ---------------------- | -------------------------- |
| Max concurrent         | 2                          |
| Max requests/minute    | 8                          |
| Player chat reserve    | 2/minute                   |
| Per-snail cooldown     | 90 s                       |
| Per-pair cooldown      | 180 s                      |
| Cache TTL              | 10 min                     |
| Timeout                | 12 s                       |
| Repair attempts        | 1                          |
| Calm-down              | 60 s when queue > 6 or 429 |
| Off-screen LLM         | disabled                   |
| Max conversation slots | 3 simultaneous             |

Priority: player chat > observed conversation > visible NPC pair > reflection/compaction.
Every denial degrades gracefully; the world never stalls.

## 10. Starter snail personas

Names and speech are Slovak. `o/c/e/a/n` are the Big Five values 0–1. These are content
specs for `src/domain/data/snails.json` (Phase 3), not logic.

### Tichomír — shy introvert

`o .62 / c .78 / e .18 / a .70 / n .65` · sage body, lavender spiral shell, round glasses.
Backstory: _Žije pod starým machom a najradšej pozoruje dážď z bezpečia svojho kamienka._
Quirks: _pozdraví až na druhý pokus; zbierá maličké kamienky; bojí sa hlasných slov._
Reč: tiché, krátke vety, veľa „prepáč“ a „možno“; nikdy nepovie „Poď sem hneď!“.
Má rád: dážď, mach, ticho. Nemá rád: hádky, ostré svetlo, davy.
Sample: „Ahoj… ja len… chcel som sa pozrieť, či tu nie si. Ale nemusíš nič.“

### Barbora — social chatterbox

`o .55 / c .40 / e .95 / a .82 / n .30` · peach body, rose dotted shell, bow.
Backstory: _Vie o každom kvete v záhrade a každému povie, čo sa tam stalo._
Quirks: _skáče z témy na tému; pamätá si mená všetkých kameňov; rozdáva komplimenty._
Reč: dlhé veselé vety, zvolania „Jéj!“ a „Počúvaj!“; nikdy nepovie „Nechcem sa rozprávať.“
Má rád: novinky, kvety, spoločnosť. Nemá rád: ticho, čakanie, samotu.
Sample: „Jéj, ty musíš počúvať! Pri potoku sa dnes ráno niečo stalo a ja to viem celé!“

### Ľubomír — grumpy complainer

`o .28 / c .72 / e .32 / a .22 / n .78` · butter body, dark stripes shell, scarf.
Backstory: _Celý život sa sťažuje na vlhkosť, hoci pod listom býva práve preto._
Quirks: _meria každú mláku; mrmle si pod fúzy; tajne pomáha, ale nikdy to neprizná._
Reč: krátke podráždené vety, „zase“, „ako vždy“; nikdy nepovie „To bolo úžasné!“
Má rád: suché miesto, poriadok, pokoj. Nemá rád: blato, hluk, optimistov.
Sample: „Zase mokro. Samozrejme. Kto by to bol povedal, že v záhrade bude vlhko.“

### Zorka — curious explorer

`o .92 / c .55 / e .68 / a .60 / n .35` · sky body, butter zigzag shell, tiny backpack.
Backstory: _Každý tunel považuje za pozvánku a každý kopec za otázku._
Quirks: _strká tykadlá do všetkého; kreslí si mapy v hlave; nevydrží sedieť._
Reč: zvedavé otázky, „čo ak“, „skúsme“; nikdy nepovie „To ma nezaujíma.“
Má rád: tunely, objavovanie, výšky. Nemá rád: opakovanie, sedenie, ploty.
Sample: „Počkaj… a čo ak je za tým kopcom ešte jeden kopec? Musíme to zistiť!“

### Miško — joker

`o .74 / c .30 / e .85 / a .66 / n .25` · peach body, green dotted shell, leaf hat.
Backstory: _Myslí si, že každý deň je najlepší deň na hlúpy vtip._
Quirks: _robí grimasy do kvapky rosy; vymýšľa prezývky; smeje sa vlastným vtipom._
Reč: hravé, krátke vtipy, zdrobneniny; nikdy nepovie „Nerob si srandu.“
Má rád: smiech, prekvapenia, kamarátov. Nemá rád: vážne ticho, pravidlá.
Sample: „Vieš, prečo slimák nenosí dáždnik? Lebo si ho nechá doma… v ulite!“

### Filoména — dreamy philosopher

`o .88 / c .48 / e .42 / a .76 / n .45` · lavender body, spiral shell, flower.
Backstory: _Počíta kvapky dažďa a rozmýšľa, či aj kameň niekam kráča._
Quirks: _hovorí v metaforách; zastaví sa uprostred vety; miluje západy slnka._
Reč: pomalé, obrazné vety, „možno“, „ako keby“; nikdy nepovie „Je to zbytočné.“
Má rád: súmrak, mláky, ticho. Nemá rád: uponáhľanie, ostré hrany, hluk.
Sample: „Každá mláka je malé nebo, ktoré si ľahlo na zem. Nemyslíš?“

## 11. Testing strategy (pure logic)

- Utility scoring: table tests for thresholds, hard gates, worked examples.
- Prompt builders: snapshot tests for size limits and required blocks; no network.
- Conversation schema: valid script, each range violation, unknown emotion.
- Fallback ladder: timeout, 429, invalid JSON, repair success/failure (fake provider).
- Memory retrieval: recency/importance/relevance ordering and top-K.
- Relationship: clamping, decay, tag limit.
- Conversation director: one call per conversation, no call when off-screen.

# Level 4 builds — design (2024 PHB)

How the site knows, for every class × subclass × species combination, which spells,
feats, actions, uses and choices a character has at level 1–4, and how that is stored.
Overviews of all combinations: `L4-Combinations.md` and `L5-Combinations.md` (`node Metadocs/LevelingUp/build-overview.mjs 4|5`). Tests: `node Metadocs/LevelingUp/build-smoke.mjs 4|5` against `build-facts.json` (facts from the 2024 PHB data, levels 1–5).

## What a combination is

| Dimension | Values | Where |
|---|---|---|
| Class | 12 | `DATA.<class>` in `data.js` |
| Subclass | 48 (4 per class, L3) | `DATA.<class>.subclasses` |
| Species | 10 | `DATA.<species>` |
| Lineage / ancestry | Elf 3, Gnome 2, Tiefling 3, Goliath 6, Dragonborn 10 | `DATA.<species>.lineages` |
| Species spellcasting ability | INT/WIS/CHA for Elf, Gnome, Tiefling | `config.speciesAbility` |
| Origin feat | from the background (Human: + Versatile feat) | `state.asiChoices[1]`, `state.speciesFeat` |
| Level 4 | Ability Score Improvement or a feat | `state.asiChoices[4]` |
| Class options | Divine/Primal Order, Fighting Style, Weapon Mastery, Maneuvers, Invocations, Metamagic, Wild Shape forms, Land type, Hunter's Prey, Expertise | `config` / `state` (below) |

48 subclasses × 15 species variants = 720 level-4 combinations; with the personal
choices above the number of real builds is effectively unlimited. That is why no
combination is stored — the engine composes it.

## Three layers

1. **Rules (code, in git)** — `data.js` (classes, subclasses, species, feats,
   invocations, metamagic, spells, `classResources`) and `data-rules.js`
   (`choiceTotals`, `swapRules`, `spellMeta`, maneuvers, weapon masteries, feat aliases).
   Every rule block is written once; a new species automatically works with all 48
   subclasses.
2. **Engine (pure functions, `engine.js`)** — combines rules + choices:
   `getGrantedSpells`, `getClassResources`, `featInstances`/`hasFeat`, `featPrereqMet`,
   `getLevelUpDelta` (what a level-up adds and asks), `getBuildProfile` (the full level-N
   picture used by the Build window and `L4-Combinations.md`).
3. **Choices (Firebase, per character)** — only what a player picked, never derived values.

## Rule formats (in `data.js`)

- **Feature**: `{ name, level, desc, act }` — `act` = `'action' | 'bonus' | 'reaction' | 'attack' | 'free'`
  (no `act` = passive).
- **Spell grant** (class, subclass, species, lineage, feat, invocation):
  `{ name, lvl, kind, free, recharge, slots, res, land, ifKnown, key }`
  - `lvl` = character level it arrives at; the spell's own level comes from the spell list.
  - `kind` = `'cantrip' | 'prepared'` (always prepared, does not count against the limit) `| 'innate'` (free casts) `| 'ritual'` (ritual only).
  - `free` + `recharge` (`'long' | 'short'`) = casts without a slot; `slots: true` = can also use slots.
  - Pick grants: `{ pick: 'spells' | 'cantrips', count, level, list, schools }` — the player chooses.
    On a class or subclass: `list` may be an array, `level: 'slot'` = any level you have slots
    for (`cantrips: true` adds cantrips), `key` + `label` name the store (`state.featurePicks[key]`)
    and the level-up step (Lore's Magical Discoveries; later Mystic Arcanum, Signature Spells).
- **Option choice** (`optionChoices` in `data-rules.js`): `{ id, label, appliesTo, stateKey, swap, options: [{ name, desc, act }] }` —
  a one-of-N pick asked when `appliesTo` first holds (Blessed Strikes, Elemental Fury, Elemental Affinity,
  Defensive Tactics, Aspect of the Wilds); the picked option appears as a feature with its `act`.
- **Level-up choice** (`levelUpChoices[class][level]`): `{ id, count | total, subclass }` — `subclass` limits it
  to one subclass (Champion's second Fighting Style: `{ id: 'fightingStyle', total: 2, subclass: 'champion' }`).
- **Resource** (`classResources`): `{ id, label, max(cfg, st), die(st), stateKey, recharge, featureNames }` with
  `recharge` = `'long' | 'short' | 'short-one'` (one use back on a Short Rest). Free spell casts
  get a dynamic counter `fc_<source>_<spell>` (e.g. `fc_featFeyTouched_mistyStep`); `res` links a grant to a class resource instead (Divine Smite → Paladin's Smite).
- **Feat**: `{ name, category: 'origin' | 'general' | 'fighting' | 'epic', prereq, ability,
  spells, spellAbility, choices, actions }`.
- **Swap rule** (`swapRules`): `{ id, what, when: 'levelUp' | 'longRest' | 'shortRest' | 'eachUse', applies }`.

## Storage (Firebase `dw/characters/<id>/…`)

| Path | Field | Example |
|---|---|---|
| `config` | `className`, `subclass`, `race`, `lineage`, `speciesAbility`, `divineOrder`/`primalOrder`, `skills`, `expertSkills` | `lineage: "infernal"` |
| `state` | `level`, `asiChoices/<N>` (`1` = origin feat) | `{ type: "feat", feat: "Fey-Touched", ability: "cha", spells: ["Charm Person"] }` or `{ type: "asi", abilities: { str: 2 } }` |
| `state` | `speciesFeat` (Human Versatile), `fightingStyles`, `weaponMasteries`, `maneuvers`, `invocations`, `invocationPicks`, `metamagic`, `wildShapeForms` | `weaponMasteries: ["Longsword","Shortbow"]` |
| `state` | swap-on-rest choices: `landType`, `huntersPrey`, `speciesCantrip` | `landType: "temperate"` |
| `state` | `replacementCantrips/<spell>` (Improved Illusions when you already know Minor Illusion) | `{ "Minor Illusion": "Mage Hand" }` |
| `state` | `featurePicks/<key>/<pick>` (spells a class/subclass feature lets you choose) | `featurePicks: { magicalDiscoveries: { spells: ["Revivify","Guidance"] } }` |
| `state` | option choices: `blessedStrikes`, `elementalFury`, `elementalAffinity`, `defensiveTactics`, `aspectOfTheWilds` | `elementalFury: "Primal Strike"` |
| `state` | uses spent: `<stateKey>` per resource, `fc_<source>_<spell>` per free cast | `rageUsed: 1`, `fc_featFeyTouched_mistyStep: 1` |
| `state` | `levelChoices/<N>` = what level N added (for level-down rollback) | `{ asi: …, spells: […] }` |

Level-down reads `levelChoices/<N>` and removes exactly that. A level-up with missing
earlier choices shows **"Complete missing choices"** (fix mode) instead of guessing.

## Display on the site

- **Build window** (level tile → "Level N · Build"): who/size/speed, spellcasting (DC,
  attack, slots, prepared count), granted spells with source + level + free uses + reset,
  feats, features, **actions grouped by Action / Bonus Action / Reaction / On a hit**, uses
  and resets, choices made, open choices, what you can swap and when, and notes for
  unusual combinations (duplicate spells, Rage or Wild Shape vs. spells, no slots).
- **Explore builds** (same window): preview any class/subclass/species variant at level
  1–4 without creating a character.
- **Prepared Spells widget**: granted spells marked ★ with their own DC and a free-cast button.
- **Features widget**: feats (T) and maneuvers (B) next to class features; action type in the tooltip.
- **Level-up flow**: one step per open choice (lineage, ASI/feat + feat sub-choices,
  weapon mastery, maneuvers, invocations, land type, replacement cantrip, swaps).

## Efficiency

- **Good**: ~150 rule blocks instead of 720 stored combinations; Firebase holds only
  choices (a few hundred bytes per character), so a rules fix updates every character
  and derived values can't go out of sync. The engine is pure, so the same code runs
  in the browser, in `build-smoke.mjs` (27 715 checks at level 4, 33 391 at level 5) and in the overview generator.
- **Cost**: the profile is recomputed on render (milliseconds — fine).
- **Weak spots** (in `Todo.md`): `data.js` is 435 kB and loads on every page (split per
  domain later); ~20 legacy `{nl, en}` description objects; mixed skill keys
  (`'sleight of hand'` vs `sleightOfHand`); dynamic `fc_*` counter keys depend on spell
  names; L5+ features and higher-level spells are not yet fully 2024.

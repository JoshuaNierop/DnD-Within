# Monster database — rules

Decisions for the Monster Manual base of Creatures (`monster-db.js` + `monsters-data.js`).
Where the request left something open, the choice below follows what DMs usually do
and is written down here so later work stays consistent.

## Source and licence
- **Rules version:** 2024 only (Monster Manual 2025 stat blocks, 2024 stat-block layout).
- **All 503 MM 2025 monsters are shipped** (`src` per record):
  - `SRD` (330): in the **SRD 5.2** (CC-BY-4.0) → original text.
  - `MM` (173, Twig Blight, Beholder, …): the game statistics (numbers, size, type, defenses,
    senses, languages, CR, block names) come from the data; every trait/action/spellcasting
    text is **our own paraphrase** in `Metadocs/Monsters/mm-own-words.json`. The original MM
    wording never goes into the repo or the site (public repo; the site serves every file
    without a login). Same approach as the spells and class features in `data.js`.
- Paraphrase rules: same mechanics (every number, die, DC, range, damage type, condition,
  spell name), same block names, different wording. The fixed 2024 formulas ("Melee Attack
  Roll: +6, reach 5 ft. Hit: 10 (2d6 + 3) Slashing damage", "Dexterity Saving Throw: DC 16",
  spell-list lines) are mechanics and stay as they are.
- `check-own-words.js` guards this: same blocks, no lost numbers, no run of more than 7
  copied words outside the formulas. Short rule sentences can stay close in structure to
  the original (there are only so many ways to say "can breathe air and water").
- **Attribution** (CC-BY): data-file header, footer of the picker, tooltip of the base chip.
- **Spell names** follow the SRD 5.2 (Acid Arrow, Arcane Hand, Hideous Laughter, …).
- **No images** from the books; creatures keep the campaign's own images.

## Build
- `XPHB_DATA=<folder with bestiary/bestiary-xmm.json> node Metadocs/Monsters/build-monster-db.js`
  (5etools data in the scratchpad, never in the repo — same source as `Metadocs/LevelingUp/tools`).
  The build stops if a non-SRD monster has no paraphrase or its blocks don't match the data.
- New/changed non-SRD monsters: `DUMP_DIR=<scratch> ... build-monster-db.js` writes the source
  text in batches (scratchpad only, never commit) → paraphrase → `node check-own-words.js
  <source.json> <own.json>` → merge into `mm-own-words.json`.
- After a rebuild: bump `MONSTER_DB_VERSION` in `monster-db.js` (the lazy-loaded file is not
  covered by the `?v=` hook in `index.html`).
- Initiative = DEX modifier + PB × initiative proficiency (the "Initiative +X" line of a 2024
  stat block); stored as a number, like PB.

## How a creature uses a base
- A creature stores a **flat copy** of the stat block plus `base: {id, name, cr, v}`. Every
  consumer (cards, fog of war, hypotheses, combat) keeps reading the flat fields; the base is
  a starting point, like a DM copying a stat block onto an index card and then changing it.
- Every field stays editable — "variable" stats are simply edited, the link stays.
- **New creature:** picking a monster fills every stat-block field. **Existing creature:** only
  empty fields, unless the DM ticks "Overwrite fields that already have a value".
- First name and Species are only filled when empty (a named NPC keeps its name).
- Filling happens in the editor only; nothing is stored until Save. Per-field visibility
  toggles are not changed by a fill.
- **Fog of war:** the base row in the editor and the "Base: …" chip on the card are DM-only.
  Default visibility is unchanged: size, type, speed, description public; the rest private
  (alignment included).
- Existing campaign creatures are **not** linked automatically (live data, no migration).
  The DM links them in the editor ("Start from Monster Manual", fill empty only).

## Scaling for higher party levels (phase 2, not built yet)
- What DMs do: (1) use a stronger monster of the same family (Goblin Warrior → Goblin Boss,
  Young → Adult dragon), (2) add Hit Dice / HP, (3) raise damage, to-hit and save DCs.
- Chosen direction: a "Scale to CR" helper that uses the base link — PB from the CR
  (CR 0–4 +2 … 29–30 +9), to-hit and DCs shifted by the PB difference, HP by hit dice. Values
  for HP/damage per CR still need a checked source (flagged for review; not built on a guess).

## Combat
- The combat picker has a **Monster Manual** tab: an SRD monster can go straight into the
  initiative without making a Creature first (HP/AC from the stat block).

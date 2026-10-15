# D&D Within — Changelog

User-facing changes, newest first. Written in English to match the rest of the app.

## 2026-10-15 — Level 5 for every class, subclass and species (2024 rules)

- Level 5 features follow the 2024 rules: Extra Attack, Fast Movement, **Font of
  Inspiration** (Bardic Inspiration returns on a Short Rest; spend a slot for one more
  use), **Sear Undead**, **Wild Resurgence**, Stunning Strike, Tactical Shift,
  **Cunning Strike** (Poison, Trip, Withdraw), Uncanny Dodge, Faithful Steed (Find
  Steed always prepared plus one free cast), the new **Sorcerous Restoration** and
  Memorize Spell. New uses are tracked: Wild Resurgence and Sorcerous Restoration.
- Subclass and species spells that arrive at level 5 are added automatically.
- Warlocks can pick the level 5 invocations: Ascendant Step, Eldritch Smite, Gaze of
  Two Minds, Gift of the Depths, Investment of the Chain Master, Master of Myriad Forms,
  One with Shadows and Thirsting Blade (Pact prerequisites are enforced).
- Level 3 spells follow the 2024 rules (Counterspell is a Constitution save, Mass
  Healing Word heals 2d4, Blink, Slow, Sleet Storm, Stinking Cloud and more).
- Ritual Caster lets you add a ritual each time your Proficiency Bonus grows.
- Font of Magic lists every slot cost up to level 5, and Wizards see Memorize Spell as a
  Short Rest swap from level 5.

## 2026-10-15 — Every class, subclass and species up to level 4 (2024 rules)

### Your build at a glance
The level tile now opens **Level N · Build**: everything your character has at their
current level in one window — spellcasting (DC, attack, slots), every spell you get
from your class, subclass, species or feats (with its level, free casts and when they
come back), feats, features, **actions sorted by Action, Bonus Action, Reaction and On
a hit**, uses and resets, the choices you made, choices still open, what you can swap
and when, and warnings for unusual combinations (for example a Barbarian whose species
spells don't work while raging). **Explore builds** lets you preview any class,
subclass and species at level 1–4 without making a character.

### Level 4 and everything before it, 2024 rules
- **All 77 feats** follow the 2024 Player's Handbook: Origin feats, General feats with
  their prerequisites and +1 ability choice, Fighting Styles and Epic Boons. Feats that
  grant spells (Magic Initiate, Fey-Touched, Shadow-Touched, Telepathic, Telekinetic,
  Ritual Caster) let you pick them and add them to your spells.
- **All 10 species** with their 2024 traits and lineages: Elf, Gnome and Tiefling
  lineages (with a spellcasting ability you choose), Goliath giant ancestry and the ten
  Dragonborn ancestries.
- **All 12 classes and 48 subclasses** have their level 1–4 features, always-prepared
  subclass spells, resources and action types.
- Level-up asks for every level 4 choice: Ability Score Improvement or feat (and the
  feat's own choices), Weapon Mastery, maneuvers, invocations, Land type, Hunter's Prey,
  a replacement cantrip when you already know one, and optional swaps.
- Characters that missed a choice earlier get **Complete missing choices** instead of a
  silent gap.
- Granted spells appear in **Prepared Spells** with a ★, their own DC and a free-cast
  button; Short Rest now restores what recharges on a Short Rest.
- Level-up now asks for the extra skills some features give: Primal Knowledge
  (Barbarian), Bonus Proficiencies (College of Lore), Student of War (Battle Master) and
  Otherworldly Glamour (Fey Wanderer); Warrior of Mercy gets Insight and Medicine
  automatically. The Fighter, Rogue and Wizard skill lists now match the 2024 rules.
- After picking a subclass during a level-up you can go back and change it again.
- **Ability Scores, Skills and Attacks** now use your real scores, including Ability
  Score Improvements and feat bonuses (the tooltip shows base + bonus), and your
  proficiency bonus follows your level. Skills add Jack of All Trades (Bard), the
  Thaumaturge and Magician bonus to Arcana/Religion/Nature, and Otherworldly Glamour
  (Fey Wanderer) to Charisma checks.
- The last spell texts that were still in Dutch or used 2014 numbers are now English
  and follow the 2024 rules (among them Cure Wounds 2d8, Inflict Wounds as a
  Constitution save, Spirit Guardians, Moonbeam and Ice Knife), including their
  material components.
- Speed in the Build window now includes the Monk's Unarmored Movement, the
  Barbarian's Fast Movement (level 5) and the Speedy feat; Darkvision includes Shadow
  Arts (Warrior of Shadow) and Umbral Sight (Gloom Stalker).
- The Build window shows your **Initiative** bonus: Dexterity plus Alert and the Gloom
  Stalker's Dread Ambusher, and Advantage for a Champion or an Assassin.

## 2026-09-23 — Eldritch Knight spells, familiars and a fuller initiative tracker

### Eldritch Knight and Arcane Trickster can finally cast
Both subclasses were treated as non-casters, so the entire spell side of the sheet
stayed hidden for them. They are now full third casters:

- **Spell slots** from level 3, on the third-caster progression up to level-4 slots.
- **Prepared spells** from the fixed 2024 table (3 at level 3, rising to 13 at 20).
  It is a fixed column, not Intelligence modifier plus level.
- **Cantrips**: Eldritch Knight gets 2 at level 3 and a 3rd at level 10; Arcane
  Trickster gets 3 at level 3 and a 4th at level 10.
- **Mage Hand** is granted automatically to an Arcane Trickster and counts against
  the cantrip maximum, exactly as the rules require.
- Spells are prepared **from the Wizard list**, with no school restriction — the
  2024 rules dropped the old Abjuration/Evocation and Enchantment/Illusion limits.
- The prepare window, the level-up spell pickers and the character wizard all use
  the Wizard list for these two subclasses.

Nine subclass feature descriptions were still quoting the 2014 rules and have been
rewritten: War Magic, Improved War Magic, both Spellcasting blurbs, Mage Hand
Legerdemain, Magical Ambush, Versatile Trickster and Spell Thief.

### Background ability bonus now actually applies
Characters created through the wizard kept their raw ability scores: the +2/+1 from
their background was recorded but never added. Varragoth, for instance, showed
Strength 15 instead of 17 and Intelligence 13 instead of 14, which quietly dragged
down AC, hit points, attack bonuses and the prepared-spell count.

The bonus is now part of the stored scores, and affected characters are repaired
automatically the first time they load. Characters that were already correct are
left alone, and re-editing a character in the wizard no longer stacks the bonus.

### Familiars are a creature type of their own
The initiative tracker knew players, NPCs and monsters. Familiars now sit alongside
them:

- A **Familiars tab** in the add-participant panel, drawing on the same statblocks
  as monsters, so an Owl or Imp can join the initiative without extra data entry.
- Familiars count as allies: they sort with the party, start visible to players
  instead of hidden, and use the ally styling when they drop.
- The **type badge on any non-player row is now a button** that cycles familiar →
  NPC → monster, so a creature added as a monster can be turned into a familiar
  without removing and re-adding it.

### Concentration tracking, and a player tracker worth reading
- A **Concentration column** in the DM tracker: type the spell being concentrated
  on, leave it empty for none. It clears itself when a creature drops to 0 HP,
  which is what the rules say happens.
- The **player-side initiative tracker** used to show only a portrait and a name.
  It now shows the initiative score, the creature type, health and concentration.
  Exact hit points appear for player characters and familiars; monsters only reveal
  a status (Healthy / Wounded / Critical / Down) so no statblock leaks. Silhouetted
  creatures stay fully masked.

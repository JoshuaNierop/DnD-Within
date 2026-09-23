# D&D Within — Changelog

User-facing changes, newest first. Written in English to match the rest of the app.

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

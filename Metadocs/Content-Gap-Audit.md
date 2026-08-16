# Content-Gap-Audit — D&D Within vs 2024 PHB (E5.5)

> **STATUS 2026-08-16: spells-deel UITGEVOERD** — 88 nieuwe spellPool-entries + 339
> lijst-toevoegingen (volledige PHB-parity, alle 8 classes, alle levels), renames toegepast
> (Shining Smite, Befuddlement, Mordenkainen's Magnificent Mansion), Summon Beast-fout
> (ranger L4) gefixt. FR "Heroes of Faerûn" + SCAG/Tasha's blade-cantrips bewust
> overgeslagen. Validatie: elke lijst-naam bestaat in de pool, levels matchen, geen dupes.
> Access-check: alle pickers (creation/level-up/prepare) filteren op `DATA.spells[className]`;
> spellPool is nergens direct browsebaar. **Nog open: feats + invocations (fase 1).**
> Spot-check-flags voor fysieke PHB: Mordenkainen's Private Sanctum upcast-clausule,
> Phantom Steed L5/L7-upgrades, Tasha's Bubbling Cauldron zonder concentration.

> 2026-08-16. Referentie: campagne-wiki `nilsvmulekom.github.io/dnd` (spiegelt 2024 PHB
> voor hun 5 classes + feats + spells, plus supplement-content), gecross-checkt tegen
> internet-bronnen. Diff-methode: site-lijsten vs `DATA.spells`/`DATA.spellPool`/
> `DATA.feats`/`DATA.invocations` in `data.js`.

## TL;DR
- **Spells = het grote gat**: 419 ontbrekende class/level-entries t.o.v. de site; 283 spells
  ontbreken volledig uit `spellPool` (nieuwe entry nodig). DW-lijsten zijn gecureerde subsets.
- **Feats**: 7 general feats uit 2024 PHB ontbreken + 1 rename (Mobile→Speedy).
- **Invocations**: alle 14 PHB-invocations boven L3 ontbreken (bekend fase-F+-gat; Nero heeft ze bij L5 nodig).
- **Geen gaten**: backgrounds (16/16), fighting styles (10/10), epic boons (12/12), origin feats,
  weapon mastery (gemodelleerd in attacks + features), alle 12 classes + subclasses.
- **Alles is database-werk (`data.js`) — geen widget-wijzigingen of nieuwe widgets nodig.**
  Pickers (level-up, prepare-window, cast-modal, tooltips) lezen de data en doen automatisch mee.

## Niet-gaten (geverifieerd)
- **"Eldritch Hex"** (aanleiding van deze audit): 2024 *playtest-UA* warlock-feature, heeft de
  finale PHB niet gehaald — site bewaart hem als huisregel. Niets te doen.
- **Artificer**: site-campagne speelt er een; DW-party niet. Skip tenzij ooit gewenst.
- Site-spells als Wardaway, Distort Value, Warp Sense, Syluné's Viper, Backlash, Doomtide,
  Spellfire Flare/Storm, Alustriel's Mooncloak, Songal's Elemental Suffusion, Elminster's
  Effulgent Spheres, Simbul's Synostodweomer, Holy Star of Mystra, Incite Greed, Gift of Gab,
  Fast Friends, Motivational Speech = **Forgotten Realms: Heroes of Faerûn** (nov 2025) /
  Acquisitions-Inc-reprints — officieel supplement, geen PHB-kern. Aparte keuze (zie Scoping).

## Renames / data-fixes (klein, meteen te doen)
- `Mobile` (2014) → **Speedy** (2024) in `DATA.feats` general.
- Paladin L2 `Branding Smite` (2014) → **Shining Smite** (2024).
- Bard/Wizard L7 `Magnificent Mansion` → **Mordenkainen's Magnificent Mansion** (2024-naam).
- Cleric L2 `BlindnessDeafness` → vermoedelijk typo voor `Blindness/Deafness` — check data.js.
- Cleric L7 `Temple of the Gods` (XGE, niet 2024 PHB) — houden of strippen = keuze.
- DW-only 2014/Tasha's-holdovers (Silvery Barbs, Absorb Elements, Chaos Bolt, Shatter@warlock,
  Thunder Step, Spirit Shroud, Shadow of Moil, Sickening Radiance, Find Greater Steed, Holy
  Weapon, Enervation, Far Step, Wall of Light, Guardian of Nature, Psychic Scream, Mass
  Polymorph, Dream of the Blue Veil, Feeblemind (2024: Befuddlement), …) — huisregel-keuze:
  laten staan (DM-allowed) of vervangen door 2024-equivalenten.

## Feats — ontbrekend (2024 PHB, categorie general)
Heavy Armor Master, Lightly Armored, Medium Armor Master, Martial Weapon Training,
Mounted Combatant, Shield Master, Spell Sniper (+ Speedy via rename).
→ toevoegen aan `DATA.feats` met `category:'general'`. Picker verschijnt vanzelf bij de
ASI/feat-stap (fase F+, L4). Geen widget-werk.

## Invocations — ontbrekend (2024 PHB, prereq > L3)
Ascendant Step (L5), Devouring Blade (L12, Blade), Eldritch Smite (L5, Blade),
Gaze of Two Minds (L5), Gift of the Depths (L5), Gift of the Protectors (L9, Tome),
Investment of the Chain Master (L5, Chain), Lifedrinker (L9, Blade), Master of Myriad
Forms (L5), One with Shadows (L5), Thirsting Blade (L5, Blade), Visions of Distant
Realms (L9), Whispers of the Grave (L7), Witch Sight (L15).
→ toevoegen aan `DATA.invocations` met `minLevel` (+ pact-prereq-veld); de level-up-picker
filtert al op `minLevel`. Geen widget-werk. Nodig vóór Nero L5.

## Spells — ontbrekend per class (site heeft, DW-lijst niet)
`*` = ontbreekt ook volledig uit `spellPool` (volledige entry authoren, incl. desc/time/range/comp/dur).
Zonder `*` = bestaat al in spellPool, alleen aan `DATA.spells[class][level]` toevoegen.
FR-supplement-spells hierin laten staan als aparte keuze (zie Niet-gaten).

### Warlock (Nero — prioriteit L0–L2 nu, L3 bij L5)
- L0: Blade Ward, Green-Flame Blade*, Lightning Lure*, Sword Burst*, Thunderclap*
- L1: Bane, Comprehend Languages, Detect Magic, Distort Value*, Illusory Script*, Speak with Animals, Tasha's Hideous Laughter, Unseen Servant
- L2: Cloud of Daggers, Enthrall*, Mind Spike*, Ray of Enfeeblement*, Warp Sense*
- L3: Gaseous Form, Incite Greed*, Magic Circle, Major Image, Remove Curse*, Summon Undead*, Tongues, Vampiric Touch*
- L4: Backlash*, Blight, Charm Monster*, Doomtide*, Gate Seal*, Hallucinatory Terrain*
- L5: Contact Other Plane*, Dream*, Jallarzi's Storm of Radiance*, Mislead*, Planar Binding*, Scrying, Teleportation Circle
- L6: Summon Fiend*, Tasha's Bubbling Cauldron* · L8: Befuddlement* · L9: Gate, Weird*
- DW-only check: Conjure Fey/Flesh to Stone/Mass Suggestion @L6 mogelijk mis-assigned.

### Druid (Io)
- L0: Message, Spare the Dying, Starry Wisp*, Thunderclap*
- L1: Detect Poison and Disease*
- L2: Aid, Air Bubble*, Animal Messenger*, Augury, Beast Sense*, Continual Flame*, Darkvision, Enlarge/Reduce, Find Traps*, Locate Animals or Plants*, Protection from Poison
- L3: Aura of Vitality, Daylight, Elemental Weapon*, Feign Death*, Meld into Stone*, Protection from Energy, Revivify, Speak with Plants*, Summon Fey, Syluné's Viper*
- L4: Blight, Charm Monster*, Confusion, Conjure Minor Elementals*, Control Water*, Divination*, Dominate Beast, Fire Shield*, Fount of Moonlight*, Freedom of Movement, Grasping Vine*, Hallucinatory Terrain*, Locate Creature*, Stone Shape*, Stoneskin, Summon Elemental*
- L5: Alustriel's Mooncloak*, Antilife Shell*, Awaken*, Commune with Nature*, Cone of Cold, Contagion, Geas*, Insect Plague, Planar Binding*, Reincarnate*, Scrying, Songal's Elemental Suffusion*, Tree Stride*
- L6: Elminster's Effulgent Spheres*, Flesh to Stone · L7: Symbol · L8: Befuddlement*, Incendiary Cloud

### Paladin (Bastion)
- L1: Detect Poison and Disease*, Divine Favor*, Heroism, Searing Smite*, Wardaway*
- L2: Prayer of Healing, Shining Smite (rename van Branding Smite)
- L3: Create Food and Water*, Elemental Weapon*, Magic Circle, Remove Curse*
- L4: Locate Creature* · L5: Circle of Power*, Dispel Evil and Good*, Geas*, Greater Restoration

### Ranger (Ancha)
- L1: Alarm*, Detect Poison and Disease*, Entangle, Jump
- L2: Air Bubble*, Animal Messenger*, Barkskin, Beast Sense*, Cordon of Arrows*, Find Traps*, Gust of Wind, Locate Animals or Plants*, Protection from Poison
- L3: Dispel Magic, Elemental Weapon*, Meld into Stone*, Nondetection*, Protection from Energy, Speak with Plants*, Water Breathing, Water Walk, Wind Wall
- L4: Conjure Woodland Beings, Dominate Beast, Grasping Vine*, Locate Creature*, Summon Elemental*
- L5: Alustriel's Mooncloak*, Commune with Nature*, Greater Restoration, Tree Stride*
- DW-only check: Misty Step @L2 staat niet op de 2024 ranger-lijst.

### Sorcerer (Saya)
- L0: Booming Blade, Green-Flame Blade*, Lightning Lure*, Sword Burst*, Thunderclap*
- L1: Distort Value*, Spellfire Flare*
- L2: Air Bubble*, Arcane Vigor*, Death Armor*, Dragon's Breath*, Flame Blade, Flaming Sphere, Magic Weapon, Mind Spike*, Warp Sense*
- L3: Cacophonic Shield*, Laeral's Silver Lance*, Vampiric Touch*
- L4: Backlash*, Charm Monster*, Fire Shield*, Gate Seal*, Spellfire Storm*, Vitriolic Sphere*
- L5: Bigby's Hand*, Songal's Elemental Suffusion* · L6: Elminster's Effulgent Spheres*, Flesh to Stone, Otiluke's Freezing Sphere* · L7: Simbul's Synostodweomer* · L8: Demiplane

### Wizard (Varragoth)
- L0: Acid Splash, Elementalism, Green-Flame Blade*, Lightning Lure*, Poison Spray, Sword Burst*, Thunderclap*
- L1: Alarm*, Distort Value*, Expeditious Retreat, Illusory Script*, Jim's Magic Missile*, Jump, Protection from Evil and Good, Ray of Sickness, Spellfire Flare*, Tenser's Floating Disk*, Wardaway*, Witch Bolt
- L2: Air Bubble*, Arcane Lock*, Arcane Vigor*, Augury, Continual Flame*, Death Armor*, Deryan's Helpful Homunculi*, Dragon's Breath*, Elminster's Elusion*, Enhance Ability, Gentle Repose, Gift of Gab*, Jim's Glowing Coin*, Locate Object, Magic Mouth*, Magic Weapon, Melf's Acid Arrow*, Mind Spike*, Nystul's Magic Aura*, Ray of Enfeeblement*, Rope Trick*, Warp Sense*
- L3: Bestow Curse, Cacophonic Shield*, Conjure Constructs*, Fast Friends*, Feign Death*, Glyph of Warding*, Incite Greed*, Laeral's Silver Lance*, Leomund's Tiny Hut*, Magic Circle, Nondetection*, Phantom Steed*, Remove Curse*, Speak with Dead, Summon Fey, Summon Undead*, Syluné's Viper*, Vampiric Touch*, Water Breathing
- L4–L9: zie diff-details (23 + 25 + 7 + 3 + 3 + 1 items; grotendeels `*`)

### Bard & Cleric (geen party-member — laagste prioriteit)
- Bard: L0 5 items, L1 5, L2 15, L3 13, L4 9, L5 15, L6 2, L7 5, L8 1
- Cleric: L0 Resistance; L1 2; L2 5; L3 16; L4 7; L5 9; L6 2; L7 1; L8 1
  (details in de per-class diff; grotendeels zelfde patroon)

## Hoe & waar aanvullen — advies
1. **Alleen `data.js`** — geen widget-uitbreiding, geen nieuwe widget. De hele keten
   (level-up-picker, prepare-window, cast-modal, tooltips, Magic Initiate-lijsten) leest
   `DATA.spells` + `DATA.spellPool` + `DATA.feats` + `DATA.invocations`.
2. **Fase 1 (klein, nu)**: renames/typo's (Speedy, Shining Smite, Mordenkainen's, BlindnessDeafness)
   + 7 general feats + 14 invocations. ~25 data-entries.
3. **Fase 2 (party-relevant)**: PHB-gaten L0–L3 voor de 6 caster-party-classes
   (warlock/druid/paladin/ranger/sorcerer/wizard). Grofweg ~90 entries waarvan ~45 nieuwe
   spellPool-authoring. Direct zichtbaar in de prepare-window.
4. **Fase 3 (on-demand)**: L4+ per class zodra de party richting die levels gaat (sluit aan
   op fase F+); bard/cleric-lijsten alleen voor Magic Initiate-volledigheid.
5. **Scoping-keuze (Joshua)**: (a) volledige 2024-PHB-parity (283 nieuwe spellPool-entries =
   bulk-authoring, aparte sessie(s) met agent-hulp), of (b) bewuste curated subset en alleen
   fase 1+2 doen. (c) FR "Heroes of Faerûn"-supplement wel/niet meenemen.
6. Engels-only regel geldt voor alle nieuwe descs (`dnd_within_english_only`).

## Bronnen
- Site: https://nilsvmulekom.github.io/dnd/ (rules → classes/feats/spells/backgrounds)
- Eldritch Hex = UA, niet PHB: dndbeyond.com forum "2024 Warlock — Eldritch Hex"
- FR-supplement: Forgotten Realms: Heroes of Faerûn (2025-11-11), 19 nieuwe/vernieuwde spells
  (o.a. Wardaway) — forgottenrealms.fandom.com + enworld.org
- 2024 invocation-lijst: rpgbot.net / arcaneeye.com (2024 rules)

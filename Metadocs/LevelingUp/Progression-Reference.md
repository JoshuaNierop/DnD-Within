# Progression Reference — L1–3 (2024 PHB)

> Bron: dnd-5.5e-mechanics agents (2026-07-31), gecheckt tegen `data.js` waar mogelijk.
> ⚠️-markers = niet geverifieerd tegen fysieke 2024 PHB. Zie ook `Status.md` review-lijst.
> Scope batch 1: Human, High Elf, Aasimar, Tiefling · Rogue, Paladin, Sorcerer, Wizard, Fighter, Druid, Warlock, Ranger.

---

# DEEL 1 — SPECIES

## Human
**L1:** Size M/S · Speed 30ft · geen darkvision/resistances/spells.
- **Resourceful** — Heroic Inspiration na elke Long Rest.
- **Skillful** — proficiency in 1 skill naar keuze (CHOICE).
- **Versatile** — 1 extra Origin feat (CHOICE; bovenop background-feat → Human heeft er 2).

**L2:** geen wijziging. **L3:** geen wijziging. Alles front-loaded op L1.

## High Elf (Elf, High Elf lineage)
**L1:** Size M/S · Speed 30ft · Darkvision 60ft.
- **Fey Ancestry** — advantage op saves vs Charmed; magie kan je niet in slaap brengen.
- **Keen Senses** — proficiency in Insight, Perception of Survival (CHOICE).
- **Trance** — Long Rest in 4 uur, bij bewustzijn.
- **High Elf cantrip** — kent **Prestidigitation**; casting ability INT/WIS/CHA (CHOICE bij creation). Na elke Long Rest optioneel te wisselen voor een andere wizard-cantrip (uniek swap-mechanisme, ≠ prepared-swap).

**L2:** geen wijziging.
**L3:** **Detect Magic** — 1×/Long Rest gratis castbaar (ook via slots). *(L5: Misty Step — buiten scope.)*
> ✅ Web-geverifieerd (2026-07-31): L3 Detect Magic + L5 Misty Step kloppen; de eerdere agent-claim van het tegendeel was fout.

## Aasimar
**L1:** Size M/S · Speed 30ft · Darkvision 60ft.
- **Celestial Resistance** — resistance Necrotic + Radiant.
- **Healing Hands** — Magic action, touch: PB×d4 HP herstel. 1×/Long Rest.
- **Light Bearer** — kent **Light** cantrip; casting ability CHA/WIS/INT (CHOICE).

**L2:** geen wijziging.
**L3:** **Celestial Revelation** ✅ geverifieerd (web, 2026-07-31): Bonus Action-transformatie, 1 min, 1×/Long Rest. **Optie wordt bij elke transformatie opnieuw gekozen (NIET vast!)**. Alle drie: 1×/beurt extra damage = PB.
1. **Heavenly Wings** — fly speed = speed; extra damage Radiant.
2. **Inner Radiance** — 10ft bright + 10ft dim light; einde eigen beurt: creatures binnen 10ft nemen PB radiant; extra damage Radiant.
3. **Necrotic Shroud** — extra damage Necrotic; Frightened-effect, CHA save DC 8 + CHA mod + PB.
> Let op: 2014-namen (Radiant Soul/Radiant Consumption) zijn in 2024 vervangen. Geen keuze-opslag in levelChoices nodig — runtime-keuze.

## Tiefling
**L1:** Size M/S · Speed 30ft · Darkvision 60ft.
- **Otherworldly Presence** — kent **Thaumaturgy** ✅ (los van legacy, geverifieerd).
- **Fiendish Legacy** (CHOICE bij creation, permanent) — resistance + cantrip; casting ability INT/WIS/CHA (CHOICE). ✅ geverifieerd, L3-kolom gecorrigeerd:

| Legacy | Resistance | Cantrip (L1) | Spell (L3, 1×/LR of via slot) | (L5 — buiten scope) |
|---|---|---|---|---|
| Abyssal | Poison | Poison Spray | Ray of Sickness | Hold Person |
| Chthonic | Necrotic | Chill Touch | **False Life** | Ray of Enfeeblement |
| Infernal | Fire | Fire Bolt | Hellish Rebuke | Darkness |

**L2:** geen wijziging.
**L3:** legacy-spell unlocked (zie tabel), 1×/Long Rest gratis of via spell slot.

## Implementatie-notities species
- 2024: species geven GEEN ability score increases (die komen uit background).
- Species-spells horen NIET in de class prepared-lijst → eigen `innateSpells[]`-shape: `{spell, castingAbility, usesPerLongRest, canRecastWithSlot}`.
- High Elf cantrip-swap-op-long-rest is een apart UI-mechanisme.

---

# DEEL 2 — CLASSES

Algemeen L1–3: prof bonus **+2** op alle levels 1–3 · **subclass-keuze op L3** voor alle 8 classes · HP na L1 = gemiddeld (die÷2)+1+CON of rollen (min 1) · geen feats/ASI op L1–3 (alleen background Origin feat + Human Versatile) · ritual-regel 2024: prepared spell met Ritual-tag = ritual castbaar (Wizard ook direct uit spellbook).

## Rogue (d8)
**L1:** HP 8+CON · **Expertise** (CHOICE 2 skills, dubbele prof) · **Sneak Attack 1d6** (1×/beurt, finesse/ranged, advantage of ally binnen 5ft) · **Thieves' Cant** (+1 taal) · **Weapon Mastery 2** (swap 1 per Long Rest). Geen spells.
**L2:** **Cunning Action** — Dash/Disengage/Hide als Bonus Action.
**L3:** **Subclass** (CHOICE 4: Arcane Trickster, Assassin, Soulknife, Thief — Soulknife zit in 2024 PHB) · **Sneak Attack → 2d6** · **Steady Aim** (BA: advantage op volgende attack; niet bewogen; speed 0).
- *Arcane Trickster:* 3 cantrips (Mage Hand + 2 wizard, CHOICE), 3 prepared wizard L1-spells (CHOICE), slots 2×1st, INT; ⚠️ 2014 school-restrictie vervallen.
- *Soulknife:* **Psionic Power** — Psionic Energy Dice = 2×PB = **4×d6** (d8@5, d10@11, d12@17); alles terug op Long Rest; BA om 1 die terug te krijgen 1×/Short-of-Long Rest. *Psi-Bolstered Knack* (failed check: +die, alleen verbruikt als het slaagt), *Psychic Whispers* (telepathie, PB creatures, die-roll uren; 1e keer per LR gratis). **Psychic Blades** — 1d6 psychic finesse thrown 60ft, Vex mastery; BA tweede blade 1d4 (geen mod).

## Paladin (d10)
**L1:** HP 10+CON · **Lay On Hands** pool 5×level · **Spellcasting v.a. L1** (2024): CHA, 2 prepared, slots 2×1st, geen cantrips; swap 1 prepared per Long Rest · **Weapon Mastery 2**.
**L2:** **Fighting Style** (CHOICE: style-feat of Blessed Warrior = 2 cleric cantrips CHA) · **Paladin's Smite** (Divine Smite altijd prepared, 1×/LR gratis) · prepared 3.
**L3:** **Subclass** (CHOICE 4: Devotion, Glory, Ancients, Vengeance) · **Channel Divinity** 2×, +Divine Sense · oath-spells altijd prepared (tellen niet mee) · prepared 4, slots 3×1st.

## Sorcerer (d6)
**L1:** HP 6+CON · CHA · **4 cantrips** (CHOICE), **2 prepared** (CHOICE), slots 2×1st · swap 1 spell + 1 cantrip per **level-up** (niet op rest) · **Innate Sorcery** (BA, 1 min, +1 DC + adv op spell attacks, 2×/LR).
**L2:** **Font of Magic** — Sorcery Points = level (2) · **Metamagic** (CHOICE 2 uit 10; 1 wisselbaar per level-up) · prepared 4, slots 3×1st.
**L3:** **Subclass** (CHOICE 4: Aberrant, Clockwork, Draconic, Wild Magic; bonus-spells altijd prepared) · prepared 6, slots 4×1st + 2×2nd · SP 3.

## Wizard (d6)
**L1:** HP 6+CON · INT · **3 cantrips** · **spellbook 6 spells** (CHOICE), **prepare 4** eruit, slots 2×1st · hele prepared-lijst wisselbaar per Long Rest; 1 cantrip-swap op LR ⚠️ · +2 spellbook-spells per level-up · **Ritual Adept** (rituals direct uit spellbook) · **Arcane Recovery** (1×/dag na Short Rest, slots ≤ ⌈level/2⌉).
**L2:** **Scholar** (CHOICE: Expertise in 1 van Arcana/History/Investigation/Medicine/Nature/Religion) · prepared 5, slots 3×1st, spellbook 8.
**L3:** **Subclass** (CHOICE 4: Abjurer, Diviner, Evoker, Illusionist) · prepared 6, slots 4×1st + 2×2nd, spellbook 10 (mag L2-spells).

## Fighter (d10)
**L1:** HP 10+CON · **Fighting Style** (CHOICE ~10 ⚠️) · **Second Wind** (BA 1d10+level, 2×, 1 terug per Short Rest) · **Weapon Mastery 3**. Geen spells.
**L2:** **Action Surge** (1 extra action, géén Magic action — 2024; 1×/Short-of-Long Rest) · **Tactical Mind** (failed check: Second Wind-use voor +1d10; faalt alsnog → use niet verbruikt).
**L3:** **Subclass** (CHOICE 4: Battle Master, Champion, Eldritch Knight, Psi Warrior).
- *Battle Master:* 4 superiority dice d8, 3 maneuvers ⚠️. *EK:* INT, 2 wizard cantrips, 3 prepared, slots 2×1st ⚠️ schoolrestrictie vervallen. *Psi Warrior:* Psionic Energy Dice 4×d6.

## Druid (d8)
**L1:** HP 8+CON · WIS · **2 cantrips**, **prepare 4**, slots 2×1st · hele lijst wisselbaar per Long Rest; cantrip-swap per level-up ⚠️ · **Druidic** (+ Speak with Animals altijd prepared) · **Primal Order** (CHOICE: Magician of Warden).
**L2:** **Wild Shape** (BA, 2×, 1 terug/SR; 4 forms CHOICE, swap 1/LR ⚠️; L2–3 max CR 1/4, geen fly; temp HP = level ⚠️) · **Wild Companion** (Find Familiar via slot/WS-use) · prepared 5, slots 3×1st.
**L3:** **Subclass** (CHOICE 4: Land, Moon, Sea, Stars) · prepared 6, slots 4×1st + 2×2nd.

## Warlock (d8) — Pact Magic
**L1:** HP 8+CON · CHA · **2 cantrips**, **2 prepared**, **1 pact-slot (slot-level 1)**, terug op **Short of Long Rest** · swap 1 spell + 1 cantrip per level-up · **Eldritch Invocations: 1** (2024: al op L1; pact-boons zijn invocations; 1 wisselbaar per level-up; sommige met level-prereq ⚠️).
**L2:** **Invocations → 3** (CHOICE +2) · **Magical Cunning** (1-min rite: helft pact-slots terug, 1×/LR) · prepared 3, slots 2×L1.
**L3:** **Subclass** (CHOICE 4: Archfey, Celestial, Fiend, Great Old One) · **pact-slots → 2× slot-level 2** · prepared 4.

## Ranger (d10)
**L1:** HP 10+CON · WIS, **v.a. L1** (2024) · geen cantrips (tenzij Druidic Warrior op L2) · **2 prepared**, slots 2×1st · swap 1 prepared per Long Rest · **Favored Enemy** = Hunter's Mark altijd prepared, 2×/LR gratis · **Weapon Mastery 2**.
**L2:** **Deft Explorer** (CHOICE: Expertise 1 skill + 2 talen) · **Fighting Style** (CHOICE: style-feat of Druidic Warrior = 2 druid cantrips WIS) · prepared 3.
**L3:** **Subclass** (CHOICE 4: Beast Master, Fey Wanderer, Gloom Stalker, Hunter) · prepared 4, slots 3×1st.

## Prepared-spells tabel L1–3 ✅ (web-geverifieerd, single-source aidedd.org — spot-check tegen fysieke PHB gewenst)
| Class | L1 | L2 | L3 |
|---|---|---|---|
| Wizard | 4 | 5 | 6 |
| Sorcerer | 2 | 4 | 6 |
| Druid | 4 | 5 | 6 |
| Warlock | 2 | 3 | 4 |
| Paladin | — | 2 | 3 |
| Ranger | — | 3 | 4 |

2024 = **vaste tabel**, niet ability-mod+level → `engine.js getMaxPrepared()` moet om (bestaande blocker, nu gedeblokkeerd).
⚠️ Soulknife "Bonus Action om 1 die terug te krijgen per Short Rest": verifier zegt dat die recharge pas op hoger level komt — op L3 alleen Long Rest. Aanhouden: Long Rest only.

## Herkies-momenten samengevat (voor de level-up/down-engine)
- **Per level-up:** Sorcerer/Warlock: 1 spell + 1 cantrip (Warlock +1 invocation, Sorcerer +1 metamagic); Wizard: +2 spellbook-spells.
- **Per Long Rest (géén level-up-menu nodig):** Wizard/Druid hele prepared-lijst; Paladin/Ranger 1 spell; Weapon Mastery 1 wapen; High Elf cantrip; Druid 1 wild-shape-form.
- **Permanent:** Expertise-keuzes, subclass, Primal Order, Fiendish Legacy, Celestial Revelation ⚠️.

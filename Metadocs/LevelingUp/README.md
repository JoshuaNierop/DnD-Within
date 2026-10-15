# Leveling Up — subproject

> Geïsoleerd subproject van D&D Within. Doel: volledige level-up / level-down flow
> met BG3-achtig keuzemenu, progression-referentie per class/race, en widgets voor
> feature-uitleg en subclass-resources (o.a. Soulknife Psionic Energy Dice).
> Bouwt voort op `../LevelUp-SpellPrepare-Design.md` (2026-06-19).

## Documenten
- `Progression-Reference.md` — per class/race/subclass wat er per level verandert (L1–3 volledig voor de eerste batch; L4+ later)
- `Design.md` — datamodel, level-up/down-mechanic, menu-UX, widget-ontwerp
- `Status.md` — voortgang, gedane stappen, volgende stappen, review-flags
- `L4-Design.md` — L4-builds: datamodel (regels/engine/keuzes), opslag, weergave, efficiëntie
- `L4-Combinations.md` + `L5-Combinations.md` — gegenereerd overzicht van alle class × subclass × species op level 4 en 5 (`node Metadocs/LevelingUp/build-overview.mjs 4` of `5`)
- `build-smoke.mjs` + `harness.mjs` + `build-facts.json` — test van alle 720 builds L1→4 of L1→5 (`node Metadocs/LevelingUp/build-smoke.mjs 5`) tegen feiten uit de 2024 PHB

## Scope eerste batch
- **Races:** Human, High Elf, Aasimar, Tiefling
- **Classes:** Rogue, Paladin, Sorcerer, Wizard, Fighter, Druid, Warlock, Ranger
- **Levels:** 1, 2, 3 (subclass-keuze op L3, 2024-regels)
- **Minimum deliverable (eerst af):** Aasimar Rogue incl. Soulknife Psionic Energy Dice widget

## Fasering
| Fase | Inhoud | Status |
|---|---|---|
| A | Verkenning bestaand systeem + rules-research L1–3 | ✓ |
| B | Progression-Reference.md + Design.md | ✓ |
| C | Data-laag: progression-data in data.js + engine `getLevelUpDelta` | ✓ |
| D | Level-up knop + menu (Aasimar Rogue eerst) + level-down met confirm | ✓ |
| E | Feature-uitleg widget (algemeen) + Psionic Dice widget (Soulknife-only) | ✓ |
| F | Overige classes/races doorlopen + verificatie | ✓ |
| F+ | L4: alle 48 subclasses × 10 species (2024), Build-venster | ✓ (review per batch loopt) |

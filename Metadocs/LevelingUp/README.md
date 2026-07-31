# Leveling Up — subproject

> Geïsoleerd subproject van D&D Within. Doel: volledige level-up / level-down flow
> met BG3-achtig keuzemenu, progression-referentie per class/race, en widgets voor
> feature-uitleg en subclass-resources (o.a. Soulknife Psionic Energy Dice).
> Bouwt voort op `../LevelUp-SpellPrepare-Design.md` (2026-06-19).

## Documenten
- `Progression-Reference.md` — per class/race/subclass wat er per level verandert (L1–3 volledig voor de eerste batch; L4+ later)
- `Design.md` — datamodel, level-up/down-mechanic, menu-UX, widget-ontwerp
- `Status.md` — voortgang, gedane stappen, volgende stappen, review-flags

## Scope eerste batch
- **Races:** Human, High Elf, Aasimar, Tiefling
- **Classes:** Rogue, Paladin, Sorcerer, Wizard, Fighter, Druid, Warlock, Ranger
- **Levels:** 1, 2, 3 (subclass-keuze op L3, 2024-regels)
- **Minimum deliverable (eerst af):** Aasimar Rogue incl. Soulknife Psionic Energy Dice widget

## Fasering
| Fase | Inhoud | Status |
|---|---|---|
| A | Verkenning bestaand systeem + rules-research L1–3 | ~ |
| B | Progression-Reference.md + Design.md | open |
| C | Data-laag: progression-data in data.js + engine `getLevelUpDelta` | open |
| D | Level-up knop + menu (Aasimar Rogue eerst) + level-down met confirm | open |
| E | Feature-uitleg widget (algemeen) + Psionic Dice widget (Soulknife-only) | open |
| F | Overige classes/races doorlopen + verificatie | open |

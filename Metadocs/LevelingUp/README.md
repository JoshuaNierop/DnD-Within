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
- `build-smoke.mjs` + `harness.mjs` + `build-facts.json` — test van alle 720 builds L1→4 of L1→5 (`node Metadocs/LevelingUp/build-smoke.mjs 5`) tegen feiten uit de 2024 PHB; bewaakt ook de huisregel "alleen 2024 PHB-spells" (pool, levels, class-lijsten) en de Wild Shape-vormen tegen de MM 2025-beasts
- `tools/` — scripts op de 5etools-data (staat vanwege de licentie buiten de repo, map via `XPHB_DATA=<map>`; nodig: `class/class-<class>.json` ×12, `races.json`, `feats.json`, `optionalfeatures.json`, `backgrounds.json`, `spells/spells-xphb.json`, `spells/sources.json`, `bestiary/bestiary-xmm.json`): `extract-facts.js build-facts.json [maxLevel]` maakt de feiten voor `build-smoke` opnieuw (incl. 2024-spelllijsten en MM 2025-beasts), `spellcheck.js data.js 9` vergelijkt casting time/range/duration met 2024, `spelldump.js data.js <level>` zet onze spelltekst naast de 2024-tekst om in eigen woorden te herschrijven, `featdump.js data.js <class> <van> [tot]` doet hetzelfde voor class- en subclass-features (output van beide nooit committen). `build-facts.json` loopt sinds 2026-10-15 tot L20 (`extract-facts.js build-facts.json 20`), met per class de ASI-levels en per level de featurenamen van class en subclass; `build-smoke.mjs <T>` vergelijkt die namen tot en met level T
- Huisregels: alleen spells uit de 2024 PHB, op de 2024 class-lijsten; Wild Shape-vormen = alle Beasts t/m CR 6 uit het Monster Manual 2025

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
| F+ | L4: alle 48 subclasses × 10 species (2024), Build-venster | ✓ |
| F++ | L5: dezelfde 720 combinaties op level 5 | ✓ |
| G0 | L6–20 fase 0: feiten + tests tot L20, `featdump.js` | ✓ |
| G1 | Tier 1 (L6–10): engine (opties, feature-spellkeuzes, Magical Secrets) + alle features + spells level 4–5 | ✓ |
| G2 | Tier 2 (L11–16): Mystic Arcanum, features, spells level 6–8 | ✓ |
| G3 | Tier 3 (L17–20): Epic Boon + scores tot 30, capstones, spells level 9 | ✓ |

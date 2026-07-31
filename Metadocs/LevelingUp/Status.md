# Leveling Up — Status

_Laatst bijgewerkt: 2026-07-31_

## Gedaan
- [x] P1 — Fase A: codebase-verkenning (widget-systeem, wizard-modal, tooltips, Firebase-patroon; conclusie: nul bestaande level-up-mechaniek)
- [x] P1 — Fase A: species- + classes-research L1–3 → `Progression-Reference.md`
- [x] P1 — Fase A: web-verificatiepass — 5× confirmed, 2 correcties (Aasimar Revelation herkiesbaar + 2024-namen; Tiefling Chthonic L3 = False Life)
- [x] P0 — Fase B: `Design.md` (levelChoices-datamodel, getLevelUpDelta, wizard-menu, generieke resource-widget)

## Open
- [ ] P0 — Fase C: progression-data in `data.js` + `getLevelUpDelta` + `getMaxPrepared`→2024-tabel in `engine.js`
- [ ] P0 — Fase D: `wg-levelup.js` — Level Up knop (glow bij < party level) + BG3-stapmenu + Level Down met confirm — Aasimar Rogue eerst
- [ ] P1 — Fase E: `wg-resource.js` (generiek; Psionic Dice voor Soulknife) + `wg-features.js` (feature-uitleg)
- [ ] P1 — Fase F: overige classes/races end-to-end + Engelse strings `wg-rest.js`

## Review-lijst (Joshua / fysieke PHB)
1. Prepared-tabel L1–3 is single-source geverifieerd (aidedd.org) — spot-check tegen fysieke 2024 PHB gewenst.
2. Soulknife: Bonus-Action-die-regain op L3 wél/niet (verifier: pas hoger level; aangenomen Long Rest only).
3. Fighting Style opties-aantal (~10) en Battle Master maneuvers op L3 (3 vs 4) — pas relevant bij fase F.
4. `wg-rest.js` UI-strings Nederlands — vertalen bij fase D/F.
5. Level-down "tijdelijke opslag om te resetten" (demotedChoices) is ontworpen maar bewust nog niet gebouwd.

## Volgende stappen
1. Fase C bouwen, dan D (Aasimar Rogue: L1→2→3 incl. Soulknife + Psionic Dice widget), dan E.
2. Daarna F: data voor overige 7 classes + 3 races invullen via Progression-Reference.

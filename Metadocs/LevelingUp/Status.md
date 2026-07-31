# Leveling Up — Status

_Laatst bijgewerkt: 2026-08-01_

## Gedaan
- [x] P1 — Fase A: codebase-verkenning (widget-systeem, wizard-modal, tooltips, Firebase-patroon; conclusie: nul bestaande level-up-mechaniek)
- [x] P1 — Fase A: species- + classes-research L1–3 → `Progression-Reference.md`
- [x] P1 — Fase A: web-verificatiepass — 5× confirmed, 2 correcties (Aasimar Revelation herkiesbaar + 2024-namen; Tiefling Chthonic L3 = False Life)
- [x] P0 — Fase B: `Design.md` (levelChoices-datamodel, getLevelUpDelta, wizard-menu, generieke resource-widget)

## Open
- [x] P0 — Fase C: `DATA.preparedTable/levelUpChoices/speciesProgression/classResources` + `getLevelUpDelta`/`getClassResources` + `getMaxPrepared`→2024-tabel (fallback naar oude formule boven L3)
- [x] P0 — Fase D: `wg-levelup.js` — Level Up-tegel (glow bij < party level) + stapmenu (overview → choices → confirm) + Level Down met Are-you-sure — node-smoke-test groen voor Aasimar Rogue L1→2→3
- [x] P1 — Fase E: `wg-resource.js` (generiek; toont Psionic Dice alléén voor Soulknife L3+) + `wg-features.js` (alle features + tooltip-uitleg)
- [x] P1 — Fase F/Sorcerer: metamagic-picker in level-up modal (count-gated, toont known options grijs), keuzes → `state.metamagic` + `levelChoices`, Level Down verwijdert ze weer; Innate Sorcery als classResource (2×/LR); rests resetten nu álle classResource-tellers (long = alles, short = 1 use voor short-one) + Short Rest-knop voor elke class met short-one resources; metamagic zichtbaar in features-widget (badge M); sorcerer L1–3 + subclass-L3 descs nu {nl,en}; `wg-rest.js`/`wg-hp.js` strings Engels — node-smoke-test groen (Sorcerer L1→2→3, 17 checks)
- [~] P1 — Fase D2: browser-test — level-up modal live geverifieerd op Saya (open → overview → metamagic-picker 2/2 → confirm-stap, alle knoppen werken; NIET door-bevestigd i.v.m. live data); nog open: confirm-flow + level-down + resources/rest-widgets live testen
- [ ] P1 — Fase F (rest): Warlock invocations-picker, fightingStyle-picker (Paladin/Ranger), Druid wildShapeForms, Ranger expertise, Wizard scholar, spell-keuze bij level-up

## Review-lijst (Joshua / fysieke PHB)
0. Resource-widget interactie: klik = 1 use verbruiken, klik-bij-leeg = alles herstellen — simpel maar onconventioneel; akkoord of liever ± knoppen?
0b. Choice-types zonder picker (invocations, fighting style, spell-keuze) tonen nu een informatieve stap ("record with your DM") — bewust niet blokkerend; metamagic heeft nu wél een echte picker (die blokkeert tot het juiste aantal gekozen is, zoals subclass).
0c. Innate Sorcery: data zei "PB uses per Long Rest", 2024 PHB/verificatiepass zegt 2×/LR — aangepast naar 2. Spot-check fysieke PHB gewenst.
0d. Draconic Resilience (max HP +1 per sorcerer level) wordt getoond maar NIET verrekend in de HP-berekening — bewust; verrekening vergt subclass-aware getHP (open punt).
0e. Sorcerer 2024 "swap 1 spell + 1 cantrip + 1 metamagic per level-up" is nog niet in het menu — alleen nieuwe picks, geen swaps.
1. Prepared-tabel L1–3 is single-source geverifieerd (aidedd.org) — spot-check tegen fysieke 2024 PHB gewenst.
2. Soulknife: Bonus-Action-die-regain op L3 wél/niet (verifier: pas hoger level; aangenomen Long Rest only).
3. Fighting Style opties-aantal (~10) en Battle Master maneuvers op L3 (3 vs 4) — pas relevant bij fase F.
4. `wg-rest.js` UI-strings Nederlands — vertalen bij fase D/F.
5. Level-down "tijdelijke opslag om te resetten" (demotedChoices) is ontworpen maar bewust nog niet gebouwd.

## Volgende stappen
1. Fase C bouwen, dan D (Aasimar Rogue: L1→2→3 incl. Soulknife + Psionic Dice widget), dan E.
2. Daarna F: data voor overige 7 classes + 3 races invullen via Progression-Reference.

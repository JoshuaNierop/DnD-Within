# Leveling Up — Status

_Laatst bijgewerkt: 2026-08-14 (combo-smoketest: 12 classes × 4 species, committed)_

## Combo-smoketest (2026-08-14) — `Metadocs/LevelingUp/combo-smoke.mjs`
Gecommitteerde vervanging van de eerdere scratchpad-smoketest (die verloren ging).
Run: `node Metadocs/LevelingUp/combo-smoke.mjs` vanuit de project-root.
- **Matrix: alle 12 classes × {tiefling, aasimar, highElf, human}** = 48 combinaties (gevraagd: paladin/druid/sorcerer/wizard/rogue/warlock × tiefling/aasimar; de rest kost niets extra) — **801/801 checks groen**
- Per combo: verse L1-char → auto-picked level-up L1→2→3 via de échte pure builders (`wgxLevelUpSteps`/`wgxBuildLevelUpPatch`) → checks → level-down 3→2→1 met **exacte snapshot-rollback-vergelijking**
- Checks per level: level/levelChoices/hp.current=newMax, prepared-count = 2024-tabel, cantrip-count (incl. Blessed/Druidic Warrior bonus-cantrips), class-totalen (2 metamagic, 3 invocations, 4 wild-shape-forms, scholar-expertise), subclass gezet op L3, species-feature + species-resource in L3-delta (human = negatieve controle), actieve resources per class op L3
- Firebase-semantiek nagebootst in `applyPatch`: deep paths (`a/b`), null én lege containers = delete (RTDB slaat `{}`/`[]` nooit op) — nodig voor exacte rollback-vergelijking
- Mutatie-getest: data-fout (wildShapeForms total 4→99) → 4 combo-failures met duidelijke melding; herstel → groen

## Compleetheidsaudit L1–3 (2026-08-04) — per class
| Class | L1 (creation) | L2 | L3 | Resources | Status |
|---|---|---|---|---|---|
| Rogue | expertise/skills (wizard) | — | subclass-picker ✓, Soulknife→Psionic Dice ✓ | ✓ | **Compleet** (AT-spells = F+) |
| Paladin | L1-spells ✓ (na fix) | Fighting Style + Blessed Warrior ✓, Paladin's Smite ✓ | subclass ✓, Channel Divinity ✓ | LoH/Smite/CD ✓ | **Compleet** |
| Sorcerer | cantrips/spells (wizard) | Metamagic ✓, SP ✓ | subclass ✓ | Innate Sorcery/SP ✓ | **Compleet** (swaps=0e, Draconic HP=0d) |
| Wizard | spellbook=informatief | Scholar ✓ | subclass ✓ | Arcane Recovery ✓ | **Compleet** |
| Fighter | style self-healt op L2 | Tactical Mind→Second Wind ✓ | subclass ✓ | Second Wind 2/3/4 ✓ | **Compleet** (BM-maneuvers = F+, informatieve stap) |
| Druid | Primal Order = feature-info (geen creation-keuze-opslag) | Wild Shape forms ✓ | subclass ✓ | Wild Shape ✓ | **Compleet** |
| Warlock | invocation self-healt op L2 (total 3) | Magical Cunning ✓ | subclass ✓, pact→lvl2 ✓ | ✓ | **Compleet** |
| Ranger | L1-spells ✓ (na fix) | Expertise + Fighting Style + Druidic Warrior ✓ | subclass ✓ | Favored Enemy ✓ | **Compleet** |
| Bard/Cleric/Monk/Barbarian | — | Bard: Expertise ×2 ✓ | subclass ✓ (toegevoegd 3e sessie) | — | **Menu-compleet** (geen party-leden; resources t.z.t.) |

Species: Aasimar (Healing Hands + Celestial Revelation) ✓ · Tiefling (L3 legacy-spell) ✓ · High Elf (L3 Detect Magic) ✓ · Human (front-loaded) ✓.
Bekende gaten → fase F+: Battle Master maneuvers-picker, Arcane Trickster/Eldritch Knight spell-keuze, L4+ (ASI/feat-stap), sorcerer/warlock swaps (0e), wizard-spellbook-store.

## Sessie 2026-08-04-b — Spells/Features-widgets + cast-flow (op Joshua's verzoek)
- [x] **Cast-flow**: Prepared Spells-widget klikbaar → cast-window per spell (meta-balk time/range/components/duration + ◆Concentration/(R)Ritual, beschrijving, DC/attack) met opties: Cast (cantrip, at will) · Cast/Upcast per beschikbaar slot-level (x/y left, disabled bij 0) · Warlock Pact-slot · Cast as Ritual (best-effort ritual-tag) · **Cast without a slot** via gekoppelde resource (Favored Enemy→Hunter's Mark, Paladin's Smite→Divine Smite, species-spells). Cast schrijft `spellSlotsUsed[lvl]` / `pactSlotsUsed` / resource-teller.
- [x] **Spell Slots-widget** (nieuw): rij per slot-level met pips; Warlock = één Pact Magic-rij (toont slot-level); klik = 1 slot handmatig verbruiken, klik-bij-leeg = herstel (correctie); long/short rest reset zoals altijd.
- [x] **Features-widget**: gesplitst in **ACTIVE** (features met use-counter; pips of x/y in eigen kolom; klik op de teller = 1 use verbruiken, zelfde semantiek als Resources-widget) en **PASSIVE**; volledige tooltips incl. uses/recharge/klik-uitleg.
- [x] **Resource-registry uitgebreid** (featureNames/spellNames-koppeling): + Lay On Hands (pool 5×level), Paladin's Smite (1×/LR), Favored Enemy (2×/LR, schaalt), Arcane Recovery, Magical Cunning, Fiendish Legacy Spell (tiefling L3), Detect Magic (high elf L3). Rest-resets pakken ze automatisch mee (generiek).
- [x] **Widget-delete**: native confirm() vervangen door gestylede modal met "Don't ask again this session" (sessionStorage; `wgxConfirmModal` is generiek herbruikbaar).
- [x] **2024-fixes**: paladin features herschikt (Spellcasting→L1, Divine Sense weg als losse L1-feature → zit in Channel Divinity L3, L2=Paladin's Smite), ranger (Spellcasting→L1, Deft Explorer L1→L2), Wild Shape/Second Wind/Channel Divinity-descs (waren "PB uses" = 2014) → 2024-aantallen, EN.
- [x] **Vertaald**: 23 party-zichtbare spell-descs (alle prepared/cantrips van de 8 chars + Divine Smite/Hunter's Mark) + álle dur/time-velden in spellPool → Engels. Rest van de desc-bodies (~230) = 0k-debt.
- [x] **Data-fixes op verzoek**: io's cantrips 4→2 (Guidance uit haar creation-record + Produce Flame als damage-optie — wisselen kan altijd); "Barius" → **Bastion** (naamvelden) in config-naam, DM-initiative, family-member, 9 timeline-scenes + core.js-fallback. Technische id `barius` (chat-keys, refs, URL) bewust ongemoeid; 2 Cloudinary-image-URLs bevatten "Barius" in de bestandsnaam — hernoemen zou de afbeeldingen breken.
- **Verified**: node-smoketest 103/103; live browser: cast lvl-1 + upcast lvl-2 (sorcerer), cantrip-cast, free-cast Divine Smite via Paladin's Smite (knop disabled na gebruik), slots-widget spend, features active/passive-model + Lay On Hands-klik (15-punts pool), confirm-modal incl. session-skip. Testchars verwijderd, 0 console-errors.

## Gedaan
- [x] P1 — Fase A: codebase-verkenning (widget-systeem, wizard-modal, tooltips, Firebase-patroon; conclusie: nul bestaande level-up-mechaniek)
- [x] P1 — Fase A: species- + classes-research L1–3 → `Progression-Reference.md`
- [x] P1 — Fase A: web-verificatiepass — 5× confirmed, 2 correcties (Aasimar Revelation herkiesbaar + 2024-namen; Tiefling Chthonic L3 = False Life)
- [x] P0 — Fase B: `Design.md` (levelChoices-datamodel, getLevelUpDelta, wizard-menu, generieke resource-widget)
- [x] P0 — Fase C: `DATA.preparedTable/levelUpChoices/speciesProgression/classResources` + `getLevelUpDelta`/`getClassResources` + `getMaxPrepared`→2024-tabel (fallback naar oude formule boven L3)
- [x] P0 — Fase D: `wg-levelup.js` — Level Up-tegel (glow bij < party level) + stapmenu (overview → choices → confirm) + Level Down met Are-you-sure
- [x] P1 — Fase E: `wg-resource.js` (generiek) + `wg-features.js` (alle features + tooltip-uitleg)
- [x] P1 — Fase F/Sorcerer: metamagic-picker, Innate Sorcery classResource (2×/LR), rest-resets voor alle classResources, Short Rest-knop
- [x] P1 — Fase F (rest, 2026-08-04): álle resterende pickers + spell-keuze:
  - **Invocations** (Warlock L2): `DATA.invocations` (14 stuks, minLevel≤3) — `total: 3`-semantiek: picker vraagt (3 − bekend), self-healt dus nero's nooit-vastgelegde L1-invocation
  - **Fighting Style** (Paladin/Ranger L2): picker op de 10 `category:"fighting"`-feats (descs → Engels + 2024-wording: GWF = 1/2 wordt 3, TWF = Light-property extra attack, Thrown zonder quick-draw) + class-opties **Blessed Warrior / Druidic Warrior** (`DATA.classFightingBonus`) → dynamische vervolg-stap: 2 cleric/druid-cantrips kiezen
  - **Wild Shape forms** (Druid L2): `DATA.wildShapeForms` (20 CR≤1/4 beasts zonder fly), `total: 4`; bekende forms in de Wild Shape-resource-tooltip (`extraDesc`-hook)
  - **Expertise** (Ranger L2): kies uit proficient niet-expert skills → `config.expertSkills`; note over +2 talen (DM)
  - **Scholar** (Wizard L2): kies uit Arcana/History/Investigation/Medicine/Nature/Religion ∩ proficient → `config.expertSkills`; 0 eligible → informatieve niet-blokkerende stap
  - **Spell-keuze**: nieuwe prepared spells + cantrips als count-gated picker-stappen; aantal = (2024-tabel − al bekend), self-healt dus characters zonder vastgelegde creation-picks (lira/ancha/barius); spell-level-cap uit nieuwe slots (Warlock pact-special: L3→lvl 2); Wizard krijgt spellbook-note (+2, app trackt alleen prepared)
  - Confirm/level-down gerefactord naar pure builders (`wgxBuildLevelUpPatch`/`wgxBuildLevelDownPatch`) — level-down rolt nu óók invocations/forms/style/expertise/scholar/spells/cantrips terug en benoemt ze in de confirm-dialoog
  - `wg-features.js`: badges **I** (Invocation) en **F** (Fighting Style) met tooltips
  - **2024-datafixes**: druid `cantripsKnown` 4→2 (L1–3); `preparedTable` paladin/ranger → `[_,2,3,4]`; `halfCasterSlots[1] = 2×1st`; `spellcastingStart` paladin/ranger 2→1 (creation-wizard toont nu "Yes" + L1-spell-keuze)
  - Node-smoketest **77/77 groen** (alle party-classes L1→2→3 + level-down rollback + data-integriteit); live browser-test op wegwerp-ranger: volledige flow expertise→Druidic Warrior→cantrips→spells→confirm→Firebase ✓, Level Down rolt alles terug ✓, 0 console-errors

## Sessie 2026-08-14 — D2-rest live-test + widget-fixes + spellPool EN
- [x] **D2-rest live geverifieerd** (wegwerp-paladin/aasimar L3, admin, localhost): Resources-widget klik op pips-kolom = 1 use spend (Firebase ✓, live re-render ✓), klik-bij-leeg = restore ✓; Features ACTIVE-teller klik = spend ✓ (Lay On Hands 15/15 → 14/15). **Short Rest**: short-one resources +1 (Channel Divinity 2→1 used), long-rest resources onaangetast, HP/slots ongemoeid ✓. **Long Rest**: álle tellers → 0 (incl. species Healing Hands/Celestial Revelation), spellSlotsUsed reset, HP → derived max ✓. 0 console-errors; testchar + server opgeruimd.
- [x] **Fix — lege "alert"-widget zonder uitleg**: een infobox-widget die te klein is voor zijn content (bv. Resources met Lay On Hands = 15 pips) rendert als lege oranje glow-box. Nu met hint-tekst "Enlarge widget to show content" (`wg-render.js` + `.widget-alert-hint` in `wg-style.css`). ⚠ Bastion (paladin) kan dit op zijn echte dashboard raken — resource-content is breder dan ren's (soulknife) formaat.
- [x] **Fix — Celestial Revelation dubbel in Features**: aasimar base-features bevatten "Celestial Revelation" ("from level 3: …") én speciesProgression L3 voegt de echte toe → stond 2× in ACTIVE op L3+. `wgxCollectFeatures` dedupet base-features nu op naam tegen progression-entries (progression wint).

## Open
- [x] P1 — Fase D2: browser-test — level-up confirm-flow + level-down live geverifieerd (2026-08-04); resources/rest-widgets klik-interactie + rest-resets live geverifieerd (2026-08-14, zie hierboven)
- [ ] P2 — Fase F+: hogere levels (L4+): ASI/feat-stap in het menu, preparedTable/invocations/metamagic uitbreiden boven L3, Battle Master maneuvers, Arcane Trickster/EK spells

## Review-lijst (Joshua / fysieke PHB)
0. Resource-widget interactie: klik = 1 use verbruiken, klik-bij-leeg = alles herstellen — simpel maar onconventioneel; akkoord of liever ± knoppen?
0b. ~~Choice-types zonder picker tonen een informatieve stap~~ → alle L1–3 choice-types hebben nu een echte picker; de informatieve fallback blijft alleen voor onbekende toekomstige types.
0c. Innate Sorcery: data zei "PB uses per Long Rest", 2024 PHB/verificatiepass zegt 2×/LR — aangepast naar 2. Spot-check fysieke PHB gewenst.
0d. Draconic Resilience (max HP +1 per sorcerer level) wordt getoond maar NIET verrekend in de HP-berekening — bewust; verrekening vergt subclass-aware getHP (open punt).
0e. Sorcerer 2024 "swap 1 spell + 1 cantrip + 1 metamagic per level-up" is nog niet in het menu — alleen nieuwe picks, geen swaps. (Geldt ook voor Warlock-swaps.) **UPDATE 2026-08-15:** de long-rest-herprepare is nu wél gebouwd (fase 2, `wg-prepare.js` prepare-window): opent automatisch na Long Rest voor casters + handmatig via "⚙ Change spells"-rij in de Prepared Spells-widget. Volledige herpick tot `getMaxPrepared`; per-class RAW-note in de UI, niet hard-enforced (DM's call). **Review:** paladin/ranger-note zegt "replace one per Long Rest" — bronnen spraken elkaar tegen (hele lijst vs. één), spot-check fysieke 2024 PHB.
0f. **NIEUW 2026-08-04:** `preparedTable` paladin/ranger van `[-,2,3]`/`[-,3,4]` naar `[2,3,4]` + `halfCasterSlots[1]=2×1st` + `spellcastingStart` 2→1. De eerdere aidedd-tabel volgde de 2014-start-op-L2-layout en sprak de geverifieerde class-research in dit document tegen (Paladin/Ranger L1: "Spellcasting v.a. L1, 2 prepared, slots 2×1st"). **Spot-check fysieke 2024 PHB gewenst** — dit raakt barius (L3-cap 3→4) en ancha.
0g. **NIEUW:** druid `cantripsKnown` L1–3 van 4 naar 2 (2024-tabel; was een sorcerer-kopie). **io heeft 4 cantrips in state** — bewust NIET gestript; DM-besluit welke 2 blijven (of laten zoals het is).
0h. **NIEUW:** `DATA.invocations` (14, L≤3) en `DATA.wildShapeForms` (20) teksten zijn agent-kennis 2024 PHB / 2025 MM — spot-check namen/regels (m.n. Eldritch Spear range ×30/level, Fiendish Vigor max-temp-HP, Pact of the Chain vormen; wild-shape speeds).
0i. **NIEUW:** Bastion (id `barius`, Paladin L3) heeft géén prepared spells vastgelegd; de self-heal biedt pas picks bij de vólgende level-up. Workaround als je het nu wil vullen: prepare-window ("⚙ Change spells" of Long Rest) vult prepared direct; fighting style vergt nog wel Level Down → Level Up. Boven L3 valt de prepared-tabel terug op de legacy-formule → discontinuïteit mogelijk bij L3→4 (fase F+).
0j. **NIEUW (pre-existing, gesignaleerd):** skills-data-dualiteit: widgets/pickers gebruiken `config.defaultSkills`/`config.expertSkills` (camelCase keys), maar legacy state heeft óók `state.skills`/`state.expertise` — en ren's config bevat `'sleight of hand'` (spaties) die nooit matcht met WG_SKILLS-key `sleightOfHand`. Opruimactie nodig (aparte fix).
0k. **Data-debt (deels gedaan):** `spellPool`: dur/time-velden + 23 party-zichtbare descs zijn nu Engels; **~230 desc-bodies nog NL** (zichtbaar in level-up spell-pickers voor niet-geprepairde spells). Bulk-vertaalslag = aparte sessie. Ook nog NL: material-component-teksten in `comp` ("een beetje fosforus") en veel class-feature-descs buiten paladin/ranger/druid/fighter-geraakte.
1. Prepared-tabel L1–3: wizard/sorcerer/druid/warlock-kolommen single-source geverifieerd; paladin/ranger nu per 0f. Spot-check fysieke 2024 PHB gewenst.
2. Soulknife: Bonus-Action-die-regain op L3 wél/niet (verifier: pas hoger level; aangenomen Long Rest only).
3. Fighting Style opties-aantal (10 feats + class-optie) en Battle Master maneuvers op L3 (3 vs 4) — maneuvers pas relevant bij fase F+.
4. ~~`wg-rest.js` UI-strings Nederlands~~ — Engels sinds fase F/Sorcerer.
5. Level-down "tijdelijke opslag om te resetten" (demotedChoices) is ontworpen maar bewust nog niet gebouwd.

## Volgende stappen
1. D2-rest: resources/rest-widgets live testen in de browser.
2. Review-lijst 0f/0g/0h met fysieke PHB; daarna evt. io's cantrips normaliseren.
3. Fase F+ (L4+) pas wanneer de party richting L4 gaat.

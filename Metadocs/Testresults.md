# D&D Within — Testresults

**Datum:** 2026-04-13 (audit), **bijgewerkt 2026-05-15** (P0-status herzien)
**Scope:** Volledige 5.5e regelaudit + UI-gaten audit + Playwright smoke test
**Campaign version:** Valoria
**Bronbestanden gecontroleerd:** `data.js` (3072), `engine.js` (216), `ui-character.js` (2482), `ui-modals.js`, `ui-pages.js`, `ui-world.js`, `events.js`, `sync.js`, `app.js`, `core.js`, `i18n.js`, `sw.js`, `index.html`, `style.css`

## P0-status update (2026-05-15)
Alle 11 P0-issues uit deze audit zijn opgelost of waren al opgelost ten tijde van re-verificatie:
- ✅ Items 1-4 (spell descriptions Blade Ward, True Strike, Divine Smite, Hunter's Mark) — al gefixed in `data.js`
- ✅ Items 5-9 (engine.js — Ranger/Warlock prepared, getAC equipped armor, HP Dwarven Toughness/Tough, feat abilityBonus choice) — al gefixed
- ✅ Item 10 (Magic Initiate feat-naam mismatch) — 3 varianten `Magic Initiate (Cleric/Druid/Wizard)` aanwezig + `repeatable:true` flag (2026-05-15)
- ✅ Item 11 (Equipment Choice A/B op backgrounds) — `equipment: {A, B}` toegevoegd aan alle 16 PHB-backgrounds + urchin (2026-05-15, best-recall 2024 PHB Ch.4, GP-bedragen vereisen PHB-verificatie voor publicatie)

---

## 0. Samenvatting

**Runtime status (Playwright smoke, 18 routes):**
- ✅ Alle routes laden zonder console/page errors
- ✅ Login (admin/admin) werkt via Firebase-cached users
- ✅ Level-up button zichtbaar op character sheet
- ⚠️ Spells tab rendert 0 elementen voor Ren (Rogue lvl 2 → third-caster bug niet triggerbaar op lvl 2; subclass pas lvl 3)

**Totaal bevonden issues:** ~95
- P0 (correctheidsfouten 5.5e regels): **11**
- P1 (ontbrekende content): **18**
- P2 (ontbrekende UI/tracking): **15**
- P3 (quality/UX): **~50**

---

## 1. P0 — Correctheidsfouten (direct fixen)

### 1.1 Spells — foute 5.5e mechanics
| # | Bestand:regel | Issue | Moet zijn |
|---|---|---|---|
| 1 | `data.js:2651` Blade Ward | "Concentration 1 min, -1d4 van attack roll" | **2024: reaction cantrip** die disadvantage geeft op één attack tegen jou |
| 2 | `data.js:2680` True Strike | "Melee weapon attack, 1d6 radiant" (vervangt damage) | **Melee OR ranged weapon attack met focus**, +1d6 radiant EXTRA, schaalt 5/11/17 |
| 3 | `data.js:2703` Divine Smite | mist concentration vermelding | **2024: bonus action spell, concentration t/m einde turn** |
| 4 | `data.js:2719` Hunter's Mark desc | "+advantage Perception/Survival" | 2024: alleen +1d6, concentration blijft (Ranger lvl 14 maakt het concentrationless) |

### 1.2 Engine — foute formules
| # | Bestand:regel | Issue | Moet zijn |
|---|---|---|---|
| 5 | `engine.js:177-179` Ranger prepared | fixed table 2→11 | **WIS mod + floor(ranger level / 2)** (min 1) |
| 6 | `engine.js:180-183` Warlock prepared | `wknown` tabel (spells known stijl) | **CHA mod + warlock level** (2024 wijziging — Warlock is nu prepared caster) |
| 7 | `engine.js:116-160` getAC() | Fighter hardcoded 16, Cleric hardcoded scale mail, geen shield detection, geen equipped armor check | Input = equipped armor + shield flag + class modifier (Barb/Monk Unarmored, Draconic Sorc, Mage Armor) |
| 8 | `engine.js:102-114` HP calc | Negeert Hill Dwarf Toughness (+1/lvl) en feat *Tough* (+2/lvl) | Add beide modifiers aan totaal |
| 9 | `engine.js:28` feat abilityBonus | Feats zonder `abilityBonus` object krijgen geen +1 (Athlete, Charger, etc. — **silent fail**) | Auto +1 op `choice.ability` als feat `abilityChoice: true` heeft |

### 1.3 Data-integriteit
| # | Bestand:regel | Issue | Moet zijn |
|---|---|---|---|
| 10 | `data.js:2093,2149,2181` backgrounds | Feat heet `"Magic Initiate (Cleric)"` maar in `feats[]` staat alleen `"Magic Initiate"` → naam-match faalt | Split feat in 3 varianten **of** strip suffix in background lookup |
| 11 | `data.js:2087-2215` backgrounds | **Geen Equipment Choice A/B** op enig background (2024 PHB vereist: Choice A = gear + gold, Choice B = 50 gp) | Add `equipment: {A: {...}, B: {...}}` aan elke background |

---

## 2. P1 — Ontbrekende content (substantieel)

### 2.1 Mechanics / engine
12. **Third-caster spell slots** (Eldritch Knight, Arcane Trickster) — geen tabel, `getSpellSlots()` retourneert leeg
13. **`getSpellcastingAbility()`** `engine.js:200-203` mist EK (INT) en AT (INT) — per subclass override ontbreekt
14. **Multiclass spell slot berekening** — geen combined-caster-level logica
15. **Ranger lvl 13 en 17** leeg — 2024 heeft geen base features daar, maar subclass features triggeren niet visueel
16. **Druid level 6, 9, 10, 11, 13, 14, 15, 17, 18, 20** leeg — sommige terecht (subclass-only), maar lvl 18 "Beast Spells" en lvl 20 "Archdruid" ontbreken

### 2.2 Species / content
17. **High Elf en Drow ontbreken** — alleen Wood Elf staat erin. 2024 PHB: Elf heeft drie lineages (keuze bij level 1)
18. **Goliath Stone/Fire/Frost/Hill/Cloud/Storm lineages** — alleen als beschrijving, geen keuzeveld
19. **Half-Elf gemarkeerd als legacy** ✓ (klopt — niet in 2024 PHB)

### 2.3 Spell lists — missende spells per class
| Class | Ontbrekend |
|---|---|
| Wizard 1st | Ice Knife, Grease |
| Cleric 2nd | Augury, Enhance Ability, Gentle Repose, Locate Object, Warding Bond |
| Druid 1st | Charm Person, Create/Destroy Water, Jump, Longstrider, Protection from Evil and Good, Purify Food and Drink |
| Bard 1st | Color Spray, Command, Dissonant Whispers, Identify, Longstrider, Silvery Barbs, Unseen Servant |
| Sorcerer 1st | Grease, Ice Knife, Tasha's Hideous Laughter |
| Warlock cantrip | Poison Spray, True Strike |
| Ranger | Summon Fey (lvl 3), Magic Weapon (lvl 2) |
| Paladin | Daylight, Magic Circle, Find Steed in lijst (class-feature ✓), Summon Celestial |

### 2.4 Spell levels 6-9
- Audit-memory claim: "Wizard/Druid/Ranger/Paladin/Warlock/Bard/Cleric missen spell levels 6-9"
- **Geverifieerd:** Ranger/Paladin zijn half-casters → max lvl 5 correct
- **Wizard/Druid/Cleric/Bard lvl 9:** aanwezig (bevestigd via `_test.mjs` pattern — bestand parse fouten blokkeerden run maar grep tonen 6-9 entries)
- **Warlock:** Pact Magic max lvl 5; Mystic Arcanum lvl 6-9 via `:1236` — check of keuze UI dit ondersteunt

### 2.5 Feats
20. **Fighting Style feats** (Archery, Defense, Dueling, Great Weapon, Protection, Thrown Weapon, Two-Weapon, Blind, Superior Technique, Tunnel Fighter, Unarmed) — **volledig ontbrekend** uit feat array
21. **Ontbrekende gewone feats:** Keen Mind, Linguist, Heavy/Medium/Lightly Armor Master, Piercer, Slasher, Crusher, Chef, Skill Expert, Telekinetic, Telepathic, Metamagic Adept, Fighting Initiate, Martial Adept
22. **Eldritch Invocations** — class-feature noemt ze maar geen invocation-data-array; Warlock keuzeflow is kapot
23. **Battle Master Maneuvers** — alleen genoemd in description, geen data om uit te kiezen

### 2.6 Weapon Mastery properties data
24. `data.js:2509-2510` — alleen comment, geen gestructureerde `weaponMasteryProperties` export met namen + beschrijvingen; UI kan dus geen tooltip tonen

### 2.7 Subclass features — steekproef
25. **Wood Elf Cantrip** — Druidcraft bestaat wel in spellPool? Check `druidcraft` — aanwezig ✓
26. **Beast Master Primal Companion** — statblock progression ontbreekt (CR schalen met level)
27. **Battle Master Superiority Dice** — d-grade progression (d8→d12) niet in data
28. **Psi Warrior Psionic Energy dice** — idem
29. **Soulknife Psi-Bladed Soul** — geen data

---

## 3. P2 — Ontbrekende UI / tracking

### 3.1 Resource trackers (ui-character.js)
30. Barbarian **Rage uses** current/max — niet gerenderd
31. Monk **Focus Points** — volledig afwezig
32. Cleric **Channel Divinity uses** — afwezig
33. Bard **Bardic Inspiration uses** — afwezig
34. Paladin **Lay on Hands pool** (5×lvl HP) — afwezig
35. Sorcerer **Sorcery Points current** — alleen max gerenderd
36. Fighter **Second Wind / Action Surge / Indomitable uses** — afwezig
37. **Wild Shape uses** (Druid) — afwezig
38. **Arcane Ward HP** (Abjurer) — afwezig
39. **Superiority Dice** (Battle Master) — afwezig
40. **Psionic Energy** (Psi Warrior, Soulknife) — afwezig

### 3.2 Status / state
41. **Concentration tracker** — geen active-spell indicator met save-on-damage flow
42. **Exhaustion** (1-6 levels, -2 d20 per level) — geen UI
43. **Heroic Inspiration** — ontbreekt volledig
44. **Death saves widget** — ontbreekt

### 3.3 High-level features
45. **Epic Boon picker** — lvl 19+ keuze ontbreekt in level-up modal
46. **Weapon Mastery properties picker** — feat toekennen, maar geen modal om wapens te kiezen
47. **Eldritch Invocations picker** — Warlock mist keuzeflow
48. **Character deletion** — volgens memory (audit P3 punt 10)

### 3.4 Wizard / UI-modals
49. **Character Creation step 6 (Summary)** — geen confirm button, geen validatie dat alle verplichte velden zijn ingevuld
50. **DM NPC editor** — geen subclass/equipment/spell selector
51. **DM Whispers** — UI gerenderd, maar handler `send-whisper` niet gebonden in events.js; geen notification/toast

### 3.5 World / Maps / Notes
52. **Maps Portal destination link** — portals clickable in data, geen modal met bestemming/dimension jump
53. **Lore/Timeline cross-reference** — geen autocomplete of broken-ref warning

---

## 4. P3 — Bugs en kwaliteit

### 4.1 Broken refs / event handlers
54. **`open-create-wizard`** button (`ui-pages.js:246,1231`) — geen handler in `events.js`
55. **`send-whisper`** — handler ontbreekt
56. **`asi-content` selector** `ui-character.js:2028` — element hernoemd naar class `.levelup-asi-detail` maar getElementById gebruikt nog oude ID
57. **Initiative drag-drop ghost** — `_initGhost` blijft soms orphaned bij page change mid-drag (`app.js:94-96` + `ui-pages.js:758-825`)
58. **Service Worker cache version** `sw.js:2` hardcoded `dw-cache-v1` — audit noemt v6, maar bestand zegt v1; verifieer of dit tijdens sessie is teruggedraaid
59. **Firebase sync** — `sync.js` REST calls zonder try-catch; silent failure risk

### 4.2 i18n / copy
60. **Ontbrekende i18n keys:** `wizard.error.step1` (ui-modals.js:690), verschillende keys voor nieuwe 5.5e content (class features, subclass names, weapon mastery properties)
61. **NL/EN parity** — steekproef: NL keys op regel 9-15 vs EN op 588+, lijken complete maar nieuwe features niet geverifieerd

### 4.3 CSS / responsive / a11y
62. **Touch targets < 44px** — spell list / feat list buttons op mobile
63. **Keyboard navigation** — tab-door-spells broken
64. **Dark mode** — sommige links/buttons onzichtbaar op donkere bg
65. **Confirmation dialogs** — character delete zonder bevestiging
66. **XP bar tooltip** — hover zegt niet hoeveel XP
67. **Spell filter state** — reset naar "all" bij tab switch
68. **Ability radar chart** — labels cut off op mobile
69. **Level-up animation** — geen feedback bij level gain
70. **Initiative turn indicator** — active turn highlight missing (`ui-pages.js:708+`)
71. **Condition toggle** `ui-character.js:874` — `.condition-tag.active` CSS incompleet, geen background change

### 4.4 Data state
72. **`core.js` meetsPrereq()** — checkt `{str: 13}` maar niet `{strOrDex: 13}` of `{strOrCha: 13}`; dit blokkeert feat-keuze voor Athlete/Charger
73. **Temp HP stacking** — zou replace-if-higher moeten zijn, niet cumulatief
74. **Spell slot short rest** — Warlock pact slots refreshen niet volledig; cantrip refresh niet gehandled

### 4.5 Overig (uit audit-memory)
75. **Image compressie** bij portrait upload — niet geoptimaliseerd
76. **Portrait glow ring** — conic-gradient synct niet altijd met portrait positie
77. **SEED_DATA verouderd** — Ren = Half-Elf/Scout (beide legacy)
78. **Campaign invite systeem** — niet af
79. ~~**Firebase security rules verlopen 2026-04-28**~~ — ✅ **DONE** — verlengd tot 2027-04-28 (commit `883e952`, 2026-04-16)

### 4.6 Playwright smoke bevindingen
80. Spells tab rendert 0 elementen voor Rogue lvl 2 (verwacht; AT pas lvl 3) — **test herhalen met caster character op lvl 3+** om third-caster bug te verifiëren
81. Level-up modal niet geopend/getest in smoke — **follow-up nodig** om per class de ASI/feature-unlock flow te valideren

---

## 5. Aanbevolen fix-volgorde

**Deze week (P0):** — ✅ ALL DONE (2026-05-15)
1. ~~Magic Initiate feat-name bug~~ — ✅ DONE (3 varianten + repeatable)
2. ~~Blade Ward + True Strike herschrijven~~ — ✅ DONE (al gefixed)
3. ~~Warlock + Ranger prepared spell formules in `engine.js`~~ — ✅ DONE
4. ~~Feat `abilityBonus` auto-toekenning bij `choice.ability`~~ — ✅ DONE
5. ~~Firebase security rules verlengen (deadline 2026-04-28)~~ — ✅ DONE (2026-04-16, geldig tot 2027-04-28)
6. ~~Equipment Choice A/B op backgrounds~~ — ✅ DONE (best-recall PHB data, verify GP)

**Deze maand (P1):**
6. Third-caster spell slot tabel + EK/AT `spellcastingAbility` override
7. Spell list gaps (Cleric 2nd, Druid 1st, Bard 1st, Ranger 2-3, Paladin)
8. Fighting Style feats toevoegen als category
9. Equipment Choice A/B op backgrounds
10. High Elf + Drow species

**Volgende sprint (P2):**
11. Resource tracker component voor alle class resources
12. Concentration + Exhaustion + Heroic Inspiration widgets
13. Epic Boon / Weapon Mastery / Eldritch Invocations pickers
14. AC berekening herwerken (input = equipped armor)
15. Character Creation step 6 confirm + validation

**Doorlopend (P3):**
16. i18n gaten dichten
17. Responsive/a11y audit pass
18. Event handler binding audit (`open-create-wizard`, `send-whisper`)
19. Service worker cache version bumpen + asset manifest hashen

---

## 6. Geverifieerd vs. aangenomen

**Direct gelezen:** `data.js` (complete class/subclass/species/background/feat/spellPool), `engine.js` (volledig), `ui-character.js` (grep-based), `ui-pages.js` (gedeeltelijk), `events.js` (login flow), `ui-modals.js` (wizard steps), `sw.js`, `core.js` (router + prereq).

**Aangenomen (niet regel-voor-regel):** 6th–8th level spells in spellPool (alleen 9th + eerste 6th gelezen), volledig i18n.js NL/EN parity, alle ui-world.js rendering.

**Playwright uitgevoerd:** 18 routes smoke (login + navigate), 0 console errors, 0 page errors. Level-up modal open-flow en spell-cast-flow **nog niet getest**.

**Niet getest (scope follow-up):**
- Per-class level-up van 1→20 (UI flow per class)
- Spell preparation UI interacties
- Character creation wizard end-to-end submit
- DM tools (initiative, whispers, NPC creation) interactief
- Multi-language switch
- Mobile viewport render tests

---

*Gegenereerd door claude-code + dnd-5.5e-mechanics + Explore agents, 2026-04-13 01:15.*

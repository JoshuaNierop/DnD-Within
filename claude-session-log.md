# Session Log — DnD Vashara Characters

### Recap — 2026-03-27

**What was done:**
- Complete overhaul naar interactief character sheet systeem
- Beide characters starten nu op level 1 met level-up/down knoppen (tot level 20)
- Sorcerer spell preparation systeem: toggle buttons voor alle sorcerer spells per spell level, met prepared counter
- Cantrip selectie met maximum gebaseerd op level
- Metamagic selectie (level 2+, extra keuzes op 10 en 17)
- ASI/Feat systeem op de juiste levels (4, 8, 12, 16, 19 voor sorcerer; 4, 8, 10, 12, 16, 19 voor rogue)
- Correcte D&D 5e stats: ability scores, saving throws, skills, combat stats berekend op basis van level
- Dolken hernoemd van "Beet" & "Kras" naar "Vraag" & "Antwoord"
- "Ouwe" veranderd naar "Oud" in running gags
- Comic strips uitgebreid naar 4-6 horizontaal scrollbare panels per verhaal (6 verhalen)
- Uiterlijk beschrijvingen veel gedetailleerder gemaakt
- Alle states opgeslagen in localStorage

**Files modified:**
- `data.js` — NIEUW: Volledige D&D 5e data (spells level 0-9, class features, feats, metamagic, skills)
- `app.js` — NIEUW: Interactive character sheet engine (state management, rendering, event handling)
- `saya.html` — Herschreven als dynamisch template met JS containers
- `ren.html` — Herschreven als dynamisch template met JS containers
- `index.html` — Content fixes + uitgebreide comic strips
- `style.css` — Interactieve UI styles (level control, spell toggles, ASI panels, feat grid, metamagic, feature cards)
- `claude-session-log.md` — NIEUW: Dit bestand

**Current state:**
- Site is functioneel met interactief level systeem
- Spell preparation toggles werken met prepared/cantrip counts
- Stats updaten dynamisch bij level verandering
- Comic strips hebben placeholder frames voor afbeeldingen

**Next steps:**
- Afbeeldingen maken voor de comic strip panels
- Eventueel expertise selectie UI toevoegen (nu hardcoded defaults)
- Testen van edge cases bij level up/down
- Eventueel skill proficiency selectie UI toevoegen

---

### Recap — 2026-03-27 (sessie 2)

**What was done:**
- Dolken opnieuw hernoemd: "Vraag" & "Antwoord" → "Woord" & "Daad" (Nederlands gezegde: "Geen woorden maar daden")
- Skills tonen nu ability type (DEX, WIS, INT, etc.) achter de naam
- Ability scores bewerkbaar: edit knop met +/- pijltjes en save/cancel
- Ability score hover tooltip: toont breakdown (base + racial + ASI = totaal)
- Basis info tooltips: hover over ras, klasse, subklasse, achtergrond toont details
- Spell tooltips uitgebreid: hover toont casting time, range, components, duration, beschrijving + afbeeldingsruimte
- Spell favorites: ster-icoon per spell, filter op favorieten
- Spell filter bar: Alle / Voorbereid / Favorieten (vervangt oude 2-knops toggle)
- Items systeem: toevoegen/verwijderen van items, gewicht tracking, encumbrance berekening
- Reset knop met "weet je het zeker?" modal + optie om eerst op te slaan
- Character export/import als JSON bestanden
- Portret placeholder (rond frame) bij naam/level
- Wisselende quotes per karakter (6 quotes per character, refresh knop)
- Afbeeldingsruimte bij uiterlijk kopje
- "Aan Tafel" hernoemd naar "Samen In Actie" met subtitel
- "Ik tel tot drie" → "Tel je messen" (subtieler, klinkt als moeder-quote)
- Hero quote veranderd van "Huilen mag..." naar "Tel je messen. Tel je uitgangen. Tel je vrienden."
- 2 extra moeder-quotes toegevoegd
- Data.js uitgebreid: alle spells hebben nu time, range, comp, dur velden + items database + tooltip data

**Files modified:**
- `data.js` — Spell data uitgebreid met casting time/range/components/duration, tooltip data, items database
- `app.js` — Grote update: editable stats, tooltip systeem, favorites, items, reset, export/import, portret, quotes
- `saya.html` — data-tooltip attributen, afbeeldingsruimte uiterlijk, dynamische items sectie
- `ren.html` — data-tooltip attributen, afbeeldingsruimte uiterlijk, dynamische items sectie
- `index.html` — Dolknamen, "Tel je messen", hero quote, "Samen In Actie", extra quotes
- `style.css` — Nieuwe styles: portret, tooltips, spell filter, favorites, items grid, edit mode, modals, appearance image

**Current state:**
- Volledig interactieve character sheets met alle gevraagde features
- JS syntax gevalideerd (node -c passes)
- Alle bestanden consistent met nieuwe dolknamen "Woord" & "Daad"

**Next steps:**
- Afbeeldingen toevoegen (portret, uiterlijk, comic panels)
- Visueel testen in browser
- Eventueel finetuning van tooltip positionering

**TODO:**
- [ ] Uiterlijk layout: tekst linker kolom (mag doorlopen onder afbeelding), afbeelding rechter kolom (iets smaller)
- [ ] Save/Cancel knoppen bij ability scores mooier maken (Engels: Save/Cancel)
- [ ] Check: Scout en Wild Magic staan al bij level 1 — klopt dat? Scout is subclass op level 3 bij Rogue. Subclass label pas tonen vanaf het juiste level?
- [ ] Rond portret ~2x zo groot maken (~200px)

---

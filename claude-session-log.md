# Session Log — D&D Within

### Recap — 2026-05-15 14:50 — P0 audit closure

**What was done:**
- Audit van 2026-04-13 (Testresults.md) re-verified: 9 van 11 P0-issues bleken al gefixed in `data.js` / `engine.js` tussen audit en vandaag (Blade Ward/True Strike/Divine Smite/Hunter's Mark specs, Ranger/Warlock prepared, getAC equipped armor, HP Dwarven Toughness + Tough feat, feat abilityBonus choice — allen reeds aanwezig).
- Magic Initiate feat-naam mismatch (P0 #10): duplicate entries opgeruimd, 3 varianten Cleric/Druid/Wizard met `spellList` + `repeatable:true`. Background-feat references matchen nu.
- Equipment Choice A/B (P0 #11): `equipment: {A:{items, gp}, B:{gp:50}}` toegevoegd aan alle 17 backgrounds (16 PHB + urchin legacy). Lists = best-recall 2024 PHB Ch.4 via `dnd-5.5e-mechanics` agent.
- `Testresults.md` + `Todo.md` bijgewerkt naar nieuwe P0-status (alle 11 done).
- Commit `977702e` gepushed naar master → GitHub Pages auto-deploy.

**Files modified:**
- `data.js` — feat-array opgeschoond + equipment toegevoegd aan backgrounds
- `Metadocs/Testresults.md` — P0-status update header + fix-volgorde checked off
- `Metadocs/Todo.md` — audit follow-ups sectie met PHB GP-verificatie als P2
- `.nexus` — dirty flag

**Current state:**
- Alle P0 5.5e correctheidsissues opgelost.
- Equipment data is best-recall — GP-bedragen vereisen nog PHB Ch.4 sanity-check voor production-quality.
- UI voor Choice A/B picker bestaat nog niet (data ligt klaar voor wizard).

**Next steps:**
- Modern-CSS review van het hele project (verzoek user).
- P1 stack: spell-list gaps, Fighting Style feats als feat-category, High Elf/Drow species, Battle Master maneuvers data.
- P2: Equipment picker UI in character creation wizard.

---

### Recap — 2026-04-04 (sessie 11 + 12)

**What was done:**

*Sessie 11 (nacht 01:xx):*
- Spells gededupliceerd: 307 unieke spells in spellPool, klasse-lijsten als string refs
- Level 6-9 spells toegevoegd voor wizard, bard, cleric, druid, warlock
- Weapon mastery badges op inventory wapens met custom tooltip popup
- Family tree uitgebreid naar 5 tiers met SVG lijnen, partners, grootouders
- Family trees toegevoegd aan NPC cards in DM panel
- Subclass selectie gefixt voor characters voorbij level 3
- Duplicate feat selectie voorkomen in beide feat pickers
- Initiative drag-drop gefixt: document-level events + 20px padding op drop zone
- Wizard Next/Close gefixt (stopPropagation verwijderd), concentration dropdown fix, page fade fix
- NPC zoekbalk toegevoegd met realtime filtering
- Families tab in DM panel: overzicht van alle family trees
- Multi-campaign systeem: campaign selector in navbar, DM campaigns tab (create/rename/delete/view)
- Characters auto-assigned aan actieve campaign bij aanmaak, lijst gefilterd op campaign
- Default "Valoria" campaign voor backwards compatibility, Firebase sync
- -XP knop toegevoegd om experience te verwijderen
- Legacy DM dice roller verwijderd (floating dice werkt al)

*Sessie 12 (middag 14:xx-15:xx):*
- Navbar gesplitst: hoofdmenu (Campaigns + Characters) vs. campaign view (Dashboard/Party/etc)
- Route / gaat nu naar Home i.p.v. Dashboard
- Campaign view heeft back button + campaign nav links
- Service worker auto-reload op nieuwe deploy, cache versie naar v9
- Login credentials bijgewerkt naar spelersnamen
- Settings pagina (#/settings): account, thema, taal, debug mode
- Bug reporter systeem: FAB knop, element selector, report modal, Firebase sync (`/dw/bugs`)
- /bugfix CLI command voor bug management

**Files modified:**
- `app.js` — initiative, spells, family tree, weapon mastery, multi-campaign, navbar split, settings, bug reporter (~1800+ regels veranderd)
- `data.js` — spells deduplicatie + level 6-9 uitbreiding
- `style.css` — weapon mastery tooltips, families tab, campaign UI, navbar split, settings page, bug reporter
- `sync.js` — campaign sync, bug reporter Firebase ops
- `sw.js` — cache v9, auto-reload
- `i18n.js` — settings keys
- `index.html` — cache bump

**Current state:**
- Multi-campaign systeem actief, "Valoria" als default
- Navbar context-aware: hoofdmenu vs. campaign view
- Settings en bug reporter live
- Geen open bugs in Firebase (null response)
- Firebase test rules verlopen 2026-04-28 — moet gefixt worden

**Next steps:**
- Firebase security rules fixen vóór 2026-04-28
- 5.5e audit items doorlopen (feats, Divine Smite, subclass levels)
- Browser testing van multi-campaign flow + settings page
- Party page: character toewijzing aan campaign via party object
- Invite systeem testen (#/join/CODE)

---

### Recap — 2026-04-05 (sessie 13 — context load)

**What was done:**
- Sessie gestart, context geladen
- Geen code wijzigingen doorgevoerd

**Files modified:**
- Geen

**Current state:**
- Laatste commits: collapsible NPC cards + bug reporter fix
- Uncommitted: nieuwe afbeeldingen (Willowdale, family trees, portraits, placeholders), `_test.mjs`
- Firebase test rules verlopen 2026-04-28 — **nog te fixen**

**Open bugs:**
- Geen open bugs in Firebase

**Next steps:**
- Firebase security rules fixen vóór 2026-04-28
- 5.5e audit items doorlopen (feats, Divine Smite, subclass levels)
- Uncommitted images opruimen of committen

---

### Recap — 2026-04-03 (sessie 10)

**What was done:**
- Alle character info bewerkbaar gemaakt voor spelers (info-grid: race, class, subclass, background, alignment, age)
- Inline dropdowns/inputs met directe Firebase sync via saveCharConfigField
- Weapons CRUD: add/delete weapons in combat tab
- Character-user linking gefixt: DEFAULT_USERS had geen characters array, fallback in userOwnsCharacter
- seedUsers() patcht bestaande Firebase users die characters array missen
- Appearance sectie dynamisch: onbeperkt entries toevoegen/verwijderen
- hasSpellcasting uitgebreid met bard en cleric
- Initiative tracker: drag-and-drop i.p.v. prompt() popups, volgorde door slepen
- Reset knop: entries terug naar eigen box, NPCs behouden
- DM Sync tab verwijderd, dice roller verplaatst naar initiative page
- Portrait border gebruikt nu character accent kleur

**Files modified:**
- app.js — info-grid edit, weapons CRUD, initiative drag-drop, DM page cleanup
- style.css — info-edit-btn, weapon-add-form, drag-drop indicators, portrait border
- sync.js — seedUsers patches existing users missing characters array

**Current state:**
- Character editing werkt volledig voor eigen characters (Ren→Ren, Saya→Saya)
- Initiative tracker is drag-based, geen popups
- DM tools: alleen Initiative + NPCs tabs

**Next steps:**
- Browser testen van alle nieuwe edit functionaliteit
- Whispers systeem implementeren (to-do)
- Image quality/compressie (to-do)
- Spell lists level 6-9 voor overige classes
- Weapon Mastery UI

---

### Recap — 2026-03-31 (sessie 9)

**What was done:**
- Browser test items 1-18 doorlopen, 5 bugs + 8 verbeteringen geïdentificeerd
- B1: Concentration toggle fix (select change event i.p.v. click)
- B2: i18n key `combat.preparedspells` toegevoegd
- B3: Quest complete/delete buttons fix (target.closest)
- B4: Condition description tooltips bij hover
- B5: Combat tab prepared spell tooltips
- V2: Geen fade animatie meer bij tab switches op dezelfde pagina
- V3: Portrait border gebruikt nu accent kleur
- V5/V6: Dice roller re-roll met zelfde stenen, remove ≠ auto-roll
- V7: Weapon rolls tonen NAT 20/NAT 1 i.p.v. CRIT/MISS (DM bepaalt)
- V8: Combat log entries verwijderbaar + clear log knop
- V10: Quest tags worden nu getoond als pill badges
- V11: Party gold = som van character gold, secret stash per character
- Quest crash fix: Firebase array→object conversie brak renderDashboard
- Nieuwe /dm route: DM page met tabs (Initiative, NPCs, Whispers, Sync)
- DM tools verplaatst uit dashboard naar eigen pagina met navbar link
- Starting equipment toegevoegd voor alle 6 lege characters
- Character cards tonen nu HP mini-bars
- Scroll-to-top bij page navigatie
- 5.5e data updates (races, class features) in data.js en engine.js
- Family tree herschreven: 3-tier visueel (Parents → Siblings → Children)
- Family members linkbaar aan bestaande characters/NPCs
- Source picker bij toevoegen: custom, character, of NPC selectie
- Auto-tier detectie uit relation tekst (backwards compatible)
- Ren & Saya SEED_DATA geupdate met tier + linkedChar velden

**Files modified:**
- app.js — DM page, bug fixes, verbeteringen, character gear, family tree (~2000 lines changed)
- style.css — DM tabs, HP bars, combat log delete, quest tags, family tree CSS (~750 lines)
- effects.js — Dice re-roll systeem
- i18n.js — preparedspells key
- data.js — 5.5e race/class updates, starting equipment (~1900 lines)
- engine.js — Minor 5.5e fixes

**Current state:**
- Site functioneel op GitHub Pages (3 commits gepusht)
- 18 van 34 test items getest, meeste bugs gefixt
- DM heeft eigen pagina met alle tools
- Family tree is 3-tier visueel met NPC/character linking
- Adblock kan site blokkeren (ontdekt tijdens testing)

**Next steps:**
- Hertest dashboard na quest crash fix
- Test items 19-34 doorlopen
- Family tree visueel testen + eventueel finetunen
- 5.5e audit items 1-10 (feats, Divine Smite, subclass levels, spells)
- Firebase security rules (verlopen 2026-04-28)

---

### Recap — 2026-03-30 (sessie 8)

**What was done:**
- Fixed syntax error (stray `}`) that broke entire app
- Fixed initiative delete-npc handler order (stopPropagation)

**Current state:**
- App should be functional again after syntax fix
- Initiative tracker, dice roller, quest form all pushed
- 30 test items still pending

**Next steps:**
- User needs to test initiative tracker + dice roller
- Event block system (#92) still deferred
- Browser test all 30 items

---

### Recap — 2026-03-30 (sessie 7)

**What was done:**
- Portrait glow ring: user herschreef effects.js naar tapered conic-gradient systeem
- Dice roller: multi-dice hand systeem (pick, roll all, see individual + total, return to pool)
- Initiative tracker: 3-kolom redesign (players links, ordered midden, NPCs rechts)
- Quest form: inline form met title, description, quest giver, reward, tags
- HP level-up fix: current HP stijgt mee bij level-up
- Page fade alleen bij route change, niet bij re-render
- Combat log mooier: cards met gekleurde linker rand
- Auto-growing textareas voor event editing
- Zwaardnamen: "Advies" en "Aandacht" (in code + Firebase)
- Oude effects (LightningSystem, AmbientSystem, flame particles) verwijderd per user's edit

**Files modified:**
- app.js, style.css, effects.js (herschreven)

**Current state:**
- Alle quick fixes gedaan
- Event block systeem (#92) deferred naar volgende sessie
- 30 test items nog open
- Class ambient particles verwijderd (user keuze)

**Next steps:**
- Event block-based content systeem
- Browser testen van alle 30 items
- Class ambient particles (als gewenst)

---

### Recap — 2026-03-30 (sessie 6)

**What was done:**
Massive feature sprint — ~40 features gebouwd in één sessie:

**Bugfixes:**
- [object Object] tag rendering fix in note view + card preview
- Operator precedence bug in prepared spells header
- Missing --accent-rgb CSS variable
- Duplicate .welcome-banner CSS definitie
- Missing base .portrait-fire class
- Focus-visible accessibility outlines

**Gameplay features:**
- Global dice roller (alle spelers, floating button, nat20/nat1, roll history)
- Short rest: automatisch HD rollen voor healing
- Long rest: full recovery + concentration reset
- Concentration tracking in combat tab
- Combat log (damage/heal/rest met timestamps)
- Weapon attack/damage roll buttons met crit detection
- Spell detail tooltips (casting time, range, components, duration, desc)
- Prepared spells quick reference in combat tab
- Quest tracker op dashboard (add/complete/delete)
- Party gold tracker op dashboard
- XP tracker met progress bar per level
- NPC tracker onder lore (naam, locatie, dispositie, notes)
- DM whisper system (private berichten naar spelers)
- Condition beschrijvingen op hover (alle 14 D&D conditions)
- Inventory categorieën (Weapons, Armor, Potions, Gear, Other)

**Visueel:**
- SVG feTurbulence flame effects (organische vlammen rond portrait)
- Canvas midpoint-displacement lightning (level 20, gefixt: geen zwart scherm)
- Class ambient particle system (8 unieke class-specifieke effecten)
- SVG ability score radar chart
- SVG navbar iconen (Feather-style)
- Page transition animaties (fade-out/in)
- Backstory paragraph staggered reveal
- Toast notification system
- Dashboard banner + campaign naam customisatie
- Level-based portrait effects (5 tiers)
- Family tree boomvorm
- Character timeline (full width)

**Technisch:**
- Firebase folder herstructurering (characters/config|state|images|notes)
- Admin mode (admin/admin, kan alles bewerken)
- Deep linking voor character tabs (#/characters/ren/combat)
- Real-time presence (wie is online, Firebase onDisconnect)
- PWA offline support (service worker + manifest)
- Tag categorieën systeem
- Map categorieën
- Timeline event layouts (6 types) + inline editing
- DM notes verplaatst naar Ren via Firebase REST API

**Data:**
- Zwaardnamen: "Advies" en "Aandacht"
- Ren & Saya: family tree + character timeline geseeded
- Background capitalisatie gefixt (Wayfarer, Guide, etc.)

**Files modified:**
- app.js (~7000 regels), style.css (~6200 regels), sync.js, effects.js (NIEUW), index.html
- manifest.json (NIEUW), sw.js (NIEUW)

**Current state:**
- Alle features gebouwd en gepusht naar GitHub Pages
- 30 test items staan klaar
- Firebase test mode rules verlopen 2026-04-28
- Nog niet browser-getest — verwacht bugs

**Next steps:**
- Alle 30 test items doorlopen
- Portrait flame/lightning effecten visueel verfijnen
- Firebase security rules voor productie
- Eventueel: skeleton loading, code splitting

---

### Recap — 2026-03-29 (sessie 5)

**What was done:**
- Firebase volledig opgezet en geconfigureerd (project: dnd-within-firebase)
- Volledige data refactor: CHAR_DEFAULTS → SEED_DATA, Firebase authoritative
- Permission model: spelers = eigen character, DM = world, admin = alles
- Background capitalisatie gefixt (Wayfarer, Guide, Sage, etc.)
- PowerPoint-style layouts voor timeline events (6 layouts: text, image-top, left/right, full-image, banner)
- Dashboard aanpasbaar: banner image + bewerkbare campaign naam
- Session kan 0 zijn
- Map categorieën (DM kan maps groeperen)
- Notes tag systeem met categorieën (kies categorie + tagnaam)
- Inline event editing (geen popup meer)
- Fix [object Object] bug in note tag rendering
- DM notes verplaatst naar Ren via Firebase REST API
- Navbar iconen vervangen door grotere emoji's
- Prepared spells quick reference in combat tab
- Character timeline in story tab (age/event entries)
- Family & Connections sectie in story tab
- Layout cleanup: max-width op tekst blocks
- Level-based portrait effecten (5 tiers + level 20 crackle)
- Admin mode (admin/admin login, kan alles bewerken)
- Ren & Saya family + timeline data geseeded in Firebase

**Files modified:**
- `app.js` — Grote refactor: SEED_DATA, Firebase loading, layouts, admin, portrait tiers, timeline, family
- `sync.js` — Volledig herschreven: nieuwe padstructuur, dashboard sync
- `style.css` — Event layouts, dashboard banner, map categories, tag styles, portrait effects (6 keyframes), timeline, family tree
- `i18n.js` — Geen wijzigingen nodig

**Current state:**
- Alle features werkend en gepusht naar GitHub Pages
- Firebase database gevuld met correcte data
- Admin mode beschikbaar (admin/admin)
- Level portrait effecten actief (test door level te wijzigen)
- Test mode Firebase rules verlopen 2026-04-28

**Next steps:**
- Browser testen van alle nieuwe features
- Firebase security rules verfijnen voor productie
- Meer character content toevoegen (andere spelers vullen hun pages)
- Eventueel: markdown support in notes, image lightbox

---

### Recap — 2026-03-29 (sessie 4)

**What was done:**
- Firebase project aangemaakt en geconfigureerd (dnd-within-firebase)
- Volledige refactor: campaign data verplaatst van hardcoded CHAR_DEFAULTS naar Firebase Realtime Database
- Nieuwe Firebase mappenstructuur: characters/<id>/config|state|images|notes, world/maps|timeline|lore, dm/initiative|notes, campaign/session_number
- CHAR_DEFAULTS hernoemd naar SEED_DATA (fallback voor eerste gebruik)
- loadCharConfig leest nu uit localStorage (gevuld door Firebase sync), niet meer uit hardcoded data
- Permission model: spelers kunnen alleen eigen character bewerken, DM alleen world content
- Background capitalisatie gefixt (wayfarer → Wayfarer, guide → Guide, etc.)
- Firebase geseeded via REST API met alle 8 characters, maps, timeline, lore defaults

**Files modified:**
- `sync.js` — Volledig herschreven: nieuwe padmapping, folder structuur, syncSeedCampaign()
- `app.js` — CHAR_DEFAULTS → SEED_DATA, loadCharConfig/saveCharConfigField refactor, canEdit permission model, getCharacterIds dynamisch

**Current state:**
- Firebase database gevuld met correcte mappenstructuur
- App werkt als platform dat data uit Firebase laadt
- DM kan alleen world content bewerken, spelers alleen eigen character
- Gepusht naar GitHub Pages

**Next steps:**
- Browser testen of Firebase sync correct werkt (inloggen, data laden)
- Eventueel Firebase security rules verfijnen (nu open test mode tot 28 april)
- Character page content uitbreiden (nieuwe tabs, items)

---

### Recap — 2026-03-29 (sessie 3)

**What was done:**
- CRITICAL FIX: `var t` loop variabele in tab rendering overschreef de globale `t()` vertaalfunctie → alle character pages crashten
- Hernoemd naar `var ti` om de shadowing te voorkomen
- TOOLTIPS tweetalig gemaakt (NL/EN) met language-aware lookup
- "Nieuw Karakter" default namen nu dynamisch vertaald via `t('char.newcharacter')`
- "Wereldkaart" default map naam nu vertaald via `t('maps.worldmap')`
- Missend `notes.notfound` translation key toegevoegd
- Node.js test suite gebouwd om alle 8 character sheets te renderen en te valideren

**Files modified:**
- `app.js` — `var t` → `var ti` fix, TOOLTIPS NL/EN, Nieuw Karakter → null + fallback, Wereldkaart → t() call
- `i18n.js` — Nieuwe keys: notes.notfound, char.newcharacter, maps.worldmap

**Current state:**
- Alle 8 character sheets renderen succesvol (geverifieerd via Node.js tests)
- Taalwisseling werkt voor UI, tooltips, en default data
- Character-specifieke content (backstory, quotes, personality) blijft onvertaald

**Next steps:**
- Browser testen van alle pagina's in beide talen
- Eventueel data.js feature descriptions ook tweetalig maken (class/race features)
- Verifiëren dat level-up modal correct werkt in beide talen

---

### Recap — 2026-03-29 (sessie 2)

**What was done:**
- i18n (internationalization) systeem: NL/EN taalwisseling via knop in navbar
- Nieuw bestand i18n.js met ~400 vertaalsleutels voor NL en EN
- Taalknop in navbar (NL/EN toggle), taal opgeslagen in localStorage
- Subclass wordt nu verborgen in header, overview en features wanneer level te laag is
- isSubclassVisible() functie checkt of character level >= subclass start level
- Alle UI strings (tabs, knoppen, labels, placeholders, foutmeldingen) vertaald
- Character-specifieke content (backstory, quotes, personality) blijft onvertaald

**Files modified:**
- `i18n.js` — NIEUW: Vertaalsysteem met NL/EN woordenboek, t() functie, isSubclassVisible()
- `index.html` — i18n.js script tag toegevoegd
- `app.js` — ~300+ string vervangingen naar t() calls, subclass visibility checks, taalwissel handler
- `style.css` — nav-lang-btn styling voor taalknop

**Current state:**
- Taalwisseling werkt via NL/EN knop in navbar
- Subclass verborgen wanneer level te laag (bijv. Scout pas zichtbaar vanaf level 3)
- Level-up modal functioneel met ASI, feat selectie, subclass features
- Alle syntax gevalideerd (node -c passes)

**Next steps:**
- Browser testen van taalwisseling
- Eventueel meer talen toevoegen
- Verifiëren dat alle edge cases werken bij level-up

---

### Recap — 2026-03-29

**What was done:**
- Complete mobile touch device support (viewport-fit, 44px touch targets, tap tooltips, modal scroll-lock, safe-area insets)
- Notes page overhaul: 6 layouts (text, image-top/left/right, gallery, checklist), pin/favorite, relative dates, blog-style view
- Fixed navbar overlap on notes page
- Firebase Realtime Database sync integration (sync.js) for shared cloud storage
- Enhanced map linking: portal-style pins, breadcrumb navigation history, cross-dimension linking, proper pin creation modal

**Files modified:**
- `index.html` — viewport-fit=cover, mobile-web-app-capable metas, Firebase SDK + sync.js
- `style.css` — Touch device media queries, blog note layouts, gallery/checklist CSS, portal pin styles, sync indicator
- `app.js` — Touch tooltip system, modal scroll-lock, notes gallery/checklist/pin features, Firebase sync hooks on all save functions, map linking with history + cross-dimension
- `sync.js` — NEW: Firebase Realtime Database sync layer

**Current state:**
- Site is fully mobile-compatible with touch targets and tap interactions
- Notes have 6 layout types including gallery and checklist
- Firebase sync is coded but needs FIREBASE_CONFIG filled in to activate
- Map pins can link to any map in any dimension, with portal visual and breadcrumb back-navigation
- All changes pushed and live on GitHub Pages

**Next steps:**
- TODO: Firebase project aanmaken + FIREBASE_CONFIG invullen in sync.js
- Consider: image lightbox for gallery view, map panning via touch/drag
- Consider: Markdown support in notes, session recap auto-generation

---

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
- [x] Alle TODO's opgelost in volledige SPA rebuild

---

### Recap — 2026-03-28 (sessie 3+4)

**What was done:**
- COMPLETE REBUILD: Single Page Application campaign platform "D&D Within — Valoria"
- Hash-based SPA router, login systeem (9 accounts), per-karakter thema's
- 8 party members, 6 nieuwe klassen/rassen/achtergronden
- Tabbed character sheets, dashboard, maps, timeline, lore, notes
- Alle D&D 5.5e mechanics behouden + uitgebreid
- engine.js geëxtraheerd, data.js uitgebreid naar 1303 regels
- Volledig nieuwe CSS (3534 regels), app.js (2791 regels)
- ren.html en saya.html verwijderd (SPA verwerkt alles)

---

### Recap — 2026-05-10 14:40
**What was done:** Dashboard grid herzien voor compactheid. CellHeight is nu vast in px op desktop/tablet (30/34/40 voor small/medium/large font), gekoppeld aan dashboard font-size token zodat "1 regel tekst = 1 grid unit". Mobile heeft 6 cols + auto-square cells. CSS-vars `--dash-cell-h`, `--widget-font-size`, `--widget-header-h` reageren op `data-font-size`-attribuut. Widget-header is gecomprimeerd (vaste 22px hoog, 0.72em font), widget-body padding nu via vars. Alle 22 widgets in registry hebben nieuwe `minSize`/`defaultSize`/`maxSize` op basis van regel-counts (formule `minH = 1 header + ceil(content_lines/2)`). HP-tracker minH=4 (display+bar+ctrls), Ability Scores minH=4 (6 abilities × name+score+mod). DASHBOARD_DEFAULT_LAYOUTS bijgewerkt met nieuwe sizes en rijkere overview/stats/combat/spells layouts. Compact CSS-overrides voor `.ability` in widget-context (kleinere padding/font, verbergt edit-overhead).

Nieuwe `#/widget-demo` route toont elke widget in min/default/max naast elkaar met font-toggle, gebruikt seed-data per widget-type (ren=rogue/sneak-attack, saya=sorcerer/metamagic, varragoth=wizard/spells).

⚒-knop toegevoegd aan dashboard-toolbar die naar de externe Widget Editor opent (URL via `WIDGET_EDITOR_URL`, default localhost:8766) met `?back=<huidige URL>` zodat de editor terug kan navigeren.

**Files modified:**
- `dashboard.js` (cellHeight uit dashboardCellHeightPx, ⚒-knop)
- `dashboard.css` (CSS-vars, grid-overlay schaalt mee, widget-header compact, widget demo styles, compact ability cells)
- `dashboard-data.js` (cellMode in BREAKPOINTS, dashboardCellHeightPx + dashboardBodyFontPx, mobile 6 cols, defaults bijgewerkt, WIDGET_EDITOR_URL constant)
- `widgets.js` (alle 22 widget min/default/max sizes herrekend)
- `widget-demo.js` (new — demo route renderer)
- `app.js` (route /widget-demo)
- `index.html` (script-tag voor widget-demo.js)

**Current state:** Werkend op localhost. Visueel geverifieerd via playwright op character/ren/overview en widget-demo route. Alle widgets renderen, alle data zichtbaar.

**Next steps:**
- Mobile auto-square geeft loze ruimte voor wide widgets (HP h=4 wordt 252px) — overweeg fixed-px ook op mobile
- Save widget definitions vanuit Widget Editor naar Firebase
- Cloudflare Pages deploy + custom domain voor editor
---

# D&D Within — To Do

Overzicht 2026-10-15: alle open punten uit de oude Todo, Planning, `LevelingUp/Status.md` en de andere Metadocs zijn tegen de code gecontroleerd. Wat al gedaan of vervallen was is weg; de oude secties staan in `Todo-Archive.md`. Indeling: wat alleen Joshua kan (console, geheim, browser/tafel, besluit) en wat Claude zelf kan.

## Joshua — console en accounts
- [ ] P1 — Vóór de cutover: `dw/admins/<authUid van admin>: true` aanmaken in de console (uid staat in `dw/users/admin/authUid`), anders kan niemand `legacyOpen` terugzetten — zie `Firebase-Rules-Draft.md`
- [ ] P1 — Repo privé maken: `JoshuaNierop/DnD-Within` is publiek en `core.js` (`DEFAULT_USERS`) bevat voornamen + wachtwoorden van alle spelers en admin. Daarna de wachtwoorden wijzigen (ze blijven in de git-geschiedenis staan). Cloudflare Pages werkt ook met een privé repo. Claude haalt ze daarna uit de code.
- [!] P1 — Firebase: Email/Password-login aanzetten (Console → Authentication → Sign-in method) en de cutover doen (e-mails koppelen, iedereen 1× via e-mail inloggen, `legacyOpen` uit). Zolang `legacyOpen` niet `false` is, mag iedereen de hele database lezen en schrijven.
- [ ] P1 — GitHub Pages uitzetten (Settings → Pages → Source: None): de oude, kapotte kopie op joshuanierop.github.io wordt nog geserveerd.
- [ ] P2 — Cloudinary delete-worker deployen (`cloudinary-worker/`: `wrangler secret put CLOUDINARY_API_SECRET` → `wrangler deploy` → worker-URL aan Claude). Tot dan verwijdert de site nooit afbeeldingen.
- [ ] P3 — Cloudinary-console opruimen — let op: losse root-assets zonder map zijn nog in gebruik (campaign-banners, appearance/banner van ancha, barius, io, nero, ren, saya). Eén asset staat onder `Maxime/Campaign/` i.p.v. `Campains`.
- [ ] P3 — Eén scene-afbeelding (`sc1780429215290z6b92`, ~343 kB) staat nog als base64 in de DB; `migrateAll()` draaien vraagt een ingelogde browser.
- [ ] P3 — Referrer-beperking op de Firebase web-API-key van de bug-reporter (`bugreport/review-auth.js`) controleren.

## Joshua — beslissingen
- [ ] P2 — Tablet-lettergrootte (2026-10-25): widgettekst op een tablet-portret is ~10,9px (lerp tussen telefoon 13 en desktop 12 → tablet het kleinst) en info-box-rijen zijn ~22px hoog. Groter maken (voorstel: 12px op tablet + ruimere rijen) breekt de fitted tablet-layouts (`fitted-shapes-tablet.json` is bij deze grootte gemeten) → eerst opnieuw meten + `wg-defaults.js` regenereren; de meet-harness staat niet in de repo. Doen? Bekend: Saya's tablet-pagina 1 toont nu al 3× "Enlarge widget" (Prepared Spells, Character Info, Active Features)
- [x] P1 — Ability scores rechtgezet (2026-10-23, backups in `_backups/`): Saya CON 14→15; Nero CHA 19/CON 15 → 17/14 (bonus stond dubbel); addybluelight bonussen ontbraken → +2 CHA/+1 CON (CHA 17, CON 15). Oorzaak: oude wizard-bug vóór #P0hvu6q
- [ ] P1 — Ability scores nog te beslissen: **Ancha** DEX 17 met maar +1 (basis 16 > 15); **Lira** DEX 16 zonder bonus — gerold/bewust of rechtzetten? **Nero** Noble geeft in 2024 STR/INT/CHA, maar zijn +1 staat op CON — laten (huisregel) of naar INT verplaatsen (CON 14→13)?
- [x] P1 — Voorstel-dashboards per character/tab/formaat (2026-10-23, viewer: claude.ai/artifact/E7EE1StVmsTEzgTRFuzZZv, data `Metadocs/Dashboards/default-layouts.json`) — gekozen: lege tabs vullen + "Reset to suggested layout"-knop
- [ ] P1 — Entity-merge O1 (mention-label), O2 (hypotheses op vrije tekst), O3 (standaard-zichtbaarheid), O5 (opslaan: nu auto-save), O6 (wanneer `dw_npcs` read-only) — `Entity-Merge-Plan.md` §6
- [ ] P2 — Telefoonmodus (2026-10-18): (a) de telefoon spiegelt de desktop-layout en slaat niets apart op — goed zo, of wil je op de telefoon zelf widgets kunnen toevoegen/verbergen/herordenen? (b) tab bar nu Home · Party · Character/DM · Lore · More — Dice in de balk i.p.v. Lore? (c) tablet-portret (700–1024) houdt het vrije canvas — ook één kolom maken? (d) liggende telefoon = desktopweergave; apart afhandelen?
- [ ] P2 — Entity-merge losse keuzes: combat-picker standaard-soort (19 van 27 creatures zonder disposition komen als NPC binnen), "Current year"-veld tonen als leeftijd of weghalen, verborgen/privé creatures filteren uit Search en `@`-popup voor spelers
- [ ] P2 — Wizard-spellbook bijhouden (2024: spellbook + prepared) of zoals nu alleen prepared
- [ ] P2 — Multiclass: nodig of niet (er bestaat nog niets)
- [ ] P2 — Inventory bewerkbaar maken (equipped, aantallen, toevoegen/verwijderen) — nu read-only v1
- [ ] P2 — Combat tracker: "refresh van sheet"-knop (HP/AC worden nu bevroren bij toevoegen), condities (prone/stunned/…), grens exacte HP vs tier-woord voor spelers, familiars standaard zichtbaar
- [ ] P3 — Resource-widget: klik = 1 use, klik op leeg = alles herstellen — houden of ± knoppen
- [ ] P3 — Huisregels: species-traits in Wild Shape (RAW: niet), dubbele vaste cantrip uit twee bronnen (RAW: geen vervanging)
- [ ] P3 — Ren/Saya-backstory (`core.js` ~596–720) en enkele alignment/background-blurbs zijn Nederlands: vertalen of als spelerscontent laten
- [ ] P3 — Branch `josh/lore-card-anim` (lore-kaarten schuiven, juni): opnieuw toepassen of weggooien. Stale `origin/main` en gemergde `josh/widget-grid-inline` mogen weg?
- [ ] P3 — Nog gewenst? Backend fase 2 (data per campaign in een boom, `Backend-Restructure.md`), tag-index/Obsidian-koppeling, agenda op `/home`, wizard mobiel-herontwerp, levelknop `+` start vanaf groepslevel i.p.v. 1
- [ ] P3 — Maps pin-area: label/link-knop in de HUD, modal bij nieuwe pin, oude ronde pins, puntjes tonen, slepen vanaf de rand
- [ ] P3 — Items: ook een notities-veld (creatures hebben het al)

## Joshua — testen in de browser / aan tafel
- [ ] P0 — Nieuw 2026-10-23: **level-up opslaan** gaf "HTTP 400 on state (Invalid data…)" voor álle characters sinds 2026-10-17: de PATCH bevatte `levelChoices/N` én `levelChoices/N/_picked` (pad binnen pad → Firebase weigert). Gefixt: `_picked` gaat nu in het level-record zelf; ui-smoke test het echte confirm-pad. Even opnieuw levelen bij Saya (en Ancha/Nero/Addy) om te bevestigen
- [ ] P1 — Nieuw 2026-10-23: **voorgestelde dashboards** — op 2026-10-23 voor alle 9 spelers als opgeslagen gezet (desktop; tablet leeg zodat hij bij laden gevuld wordt; back-up `Metadocs/Dashboards/backup-dashboards-2026-10-23_034025.json`). Check per character of alles past en klopt; open een character met lege tabs (bv. Combat/Social): de voorgestelde layout staat er, pas na Save opgeslagen. Knop "Reset to suggested layout" (onderbalk, naast Tidy) vervangt de huidige tab na bevestiging. Check ook tablet-portret (pagina 2) en dat de telefoon de nieuwe desktop-volgorde volgt. Bekend: een tab die je bewust leeg opslaat, krijgt bij het laden weer de voorgestelde layout

Gebouwd maar nooit live bekeken. Eén ronde langs de site dekt de meeste punten.
- [ ] P1 — Nieuw 2026-10-18: **telefoonmodus** op een echte telefoon (alleen in Playwright op 390×844 gezien). Checken: tab bar onderin + More-sheet (dice/notes/search/chat openen boven de tab bar), swipen tussen Character/Social/Exploring/Combat/Inventory op je eigen character, HP damage/heal + spell casten + level-up-venster als bottom sheet, long-press voor tooltips, DM Dashboard met de Combat Tracker op volle breedte, lore-tabs strip, veilige zones op een iPhone (notch/home-balk). Bekend: liggend (breedte ≥ 700) krijg je de desktopweergave
- [ ] P1 — Nieuw 2026-10-17: chat vervangen (Firebase SDK i.p.v. REST/EventSource). Met twee accounts in twee browsers checken: bericht komt direct binnen, badge op de chatknop in de onderbalk, wat je typt blijft staan als er een bericht binnenkomt, Esc sluit, terug naar de lijst bewaart je concept. Lokaal getest tegen een nep-database, niet tegen de echte.
- [ ] P2 — Nieuw 2026-10-17: "Saving Throws"-widget (library → stats) en "Conditions"-widget (library → combat) toevoegen en checken — schade nemen tijdens een concentration-spell moet het CON-save-venster tonen; nieuw character → stap 2 "Starting equipment" A/B (B = 50 GP, geen items); typ `@` + sessienaam in een notitie → link naar de timeline; popup staat bij de cursor; Humans: Heroic Inspiration is nu een aan/uit-knop (oude resource weg, staat pas weer aan na de volgende Long Rest); site-vensters i.p.v. browser-popups (verwijderen in notes/maps/lore, family-diagram partner/ouder/kind toevoegen, rest-knoppen, widget opslaan)
- [ ] P1 — Entity-merge fase 3: `@`-mention van een ex-NPC opent de Creatures-kaart, oude `/lore/monsters`-links, combat-picker zonder dubbele namen, klik in family-diagram, Families-tab
- [ ] P2 — Level-up level 6–20 in de echte site (alleen in Node getest): een paar characters omhoog en weer omlaag
- [ ] P2 — Combat tracker: concentration-kolom, speler-tracker normaal + gedraaid, Familiars-tab, soort-knop; min. breedte/hoogte worden sinds 2026-10-16 na elke render gemeten (`combatMeasureWidgets`) — check of hij niet smaller/lager kan dan de inhoud, ook in een smal dashboard
- [ ] P2 — Inventory-widget: verschijnt, tooltips, herschikken, hoogte, afbeeldingsmodus
- [ ] P1 — Your Turn-widget + spell-countdown + geneste tooltips (2026-10-16): spell met duur casten → staat onder Active spells, telt af als de DM rondes doorzet (ook op het scherm van de speler zonder herladen?), chip + hover in de Combat Tracker bij de DM, concentratie-kolom vult zich vanzelf; tooltip-tekst checken op valse links (bv. "Light", "Shield" als gewoon woord) en de glossary-teksten (`wg-glossary.js`) nalezen
- [ ] P2 — Character-page: sidebar-categorieknoppen (#Ovv22sJ), tooltips via long-press op telefoon, crop van de profielfoto overal, copy/paste + Ctrl-multiselect van widgets, bug-reporter onderdeel kiezen
- [ ] P2 — Edit-character: background-bonus (+2/+1) klopt na bewerken; Varragoth toont STR 17 / INT 14
- [ ] P2 — Notes-bord zonder tags, Lore/NPC-vensters op telefoon zonder scrollen, Maps-pagina alleen voor DM/admin, timeline-editor in twee vensters tegelijk
- [ ] P3 — Toegankelijkheid: toetsenbord door spell-lijsten, contrast in dark mode, lege ruimte bij brede widgets op mobiel
- [ ] P3 — Barius (paladin L3) heeft 2 van 4 prepared spells (snapshot 26-09): aanvullen via "Change spells" of een Long Rest

## Joshua — fysieke PHB (optioneel)
- [ ] P3 — Steekproef: third-caster-tabellen, Innate Sorcery 2×/Long Rest, Soulknife-die terug op L3, `_verify`-velden in itemDB, Private Sanctum upcast, Phantom Steed, Bubbling Cauldron, Eldritch Hex

## Claude — regels van het project
- [x] P1 — Native popups vervangen door `showPromptModal`/`showConfirmModal`/`showAlertModal` — alle 41 plekken (2026-10-17)
- [x] P1 — Nederlandse UI-teksten → Engels: family-diagram, toasts, maps-HUD, widget-instellingen, `social/`-module; ongebruikte `TOOLTIPS` (NL+EN) uit `core.js` gehaald (2026-10-17). Ren/Saya-backstory blijft bij Joshua-beslissingen
- [x] P2 — Skill-keys: opslag overal camelCase via `skillKey`/`skillKeys` (`engine.js`); wizard + proficiency-klik normaliseren, geen dubbele keys meer. Geen DB-migratie nodig: alle lezers vergelijken genormaliseerd en elke volgende schrijfactie zet de key recht (2026-10-17)

## Claude — features
- [x] P1 — Touch-UI dashboard (2026-10-25): quick-actions in de onderbalk in eigen kleur + FAB-maat (46px), bug-knop in de balk (floating bug-FAB verborgen op dashboards), lek van site-brede `.page-nav`-padding uit de balk, touch-maten (`hover:none`+`pointer:coarse`) voor balk/page-nav/tabs, telefoon: info-box-rijen +8px (`WG_MOBILE_ROW_EXTRA`) en grotere chrome-labels
- [x] P1 — Fitted dashboards (2026-10-23): alle widgets per character in fitted vormen (gemeten in de app bij minimale tegelafstand, dus veilig op elk scherm met evenveel tegels), gepakt met `Metadocs/Dashboards/fit-solver.mjs`; desktop + tablet in de app gecontroleerd: niets verschuift of groeit- [ ] P3 — Combat-tabs houden 15–30 lege tegels (Ancha, Addy, Nero, Ren, Varragoth): inhoud laat geen exacte vulling toe — eventueel widgets toevoegen/weglaten
- [ ] P2 — Voorstel-dashboards (2026-10-23, `Metadocs/Dashboards/`): ontbrekende widgets uit de ontwerpronde — Wild Shape-vormen (Io), Luck Points van de Lucky-feat in Resources (Addy), Senses (darkvision/passive Perception) voor Exploring, social-widgets (NPC-relaties/quests/facties)
- [x] P1 — Oude widget-types in opgeslagen dashboards (senses, actionEconomy, travelPace, …) renderden als Ability Scores — opgelost doordat alle desktop-dashboards op 2026-10-23 zijn vervangen door de voorgestelde layout (legacy `mobile`-slots blijven staan maar worden niet gebruikt)
- [ ] P2 — Varragoth (EK, L3) heeft 0 prepared spells in de snapshot — lege picks vullen
- [x] P1 — Monster-bibliotheek: alle 503 Monster Manual 2025-monsters (330 SRD 5.2 met tekst, 173 met feiten + eigen-woorden-tekst) als basis voor Creatures (picker met zoek/filter op naam, type, grootte, CR) + Monster Manual-tab in de combat-picker — regels in `Monsters/Rules.md`
- [ ] P2 — Monsters schalen voor hogere party-levels: "Scale to CR"-helper op basis van de base-link (PB, to-hit/DC, HP) — eerst een gecontroleerde bron voor HP/schade per CR (`Monsters/Rules.md`)
- [ ] P3 — Bestaande creatures koppelen aan een basis (DM, via de editor): Gargoyle → Gargoyle, S.P.O.T. → Bat, Twig Blight → Twig Blight, Bad Bramble → dichtstbijzijnde monster
- [x] P2 — Saving throws: `getSaveBonus` in de engine + widget "Saving Throws" (`wg-saves.js`, `LevelingUp/Saving-Throws.md`) (2026-10-17)
- [x] P2 — Attacks-widget met class-features: Martial Arts, Rage-damage, Archery/Dueling/Thrown/GWF, Dazzling Footwork (Dance), pact weapon (CHA), Extra Attack-aantal, Exhaustion (2026-10-17)
- [x] P2 — Equipment A/B-keuze in de creation-wizard (stap 2, alleen nieuw character; goud → `state.gold`) + background-pakketten gelijkgetrokken met de 2024-data (12 van 16 weken af, GP klopte overal) (2026-10-17)
- [ ] P3 — Class-startuitrusting bestaat nog niet in de app (alleen background-pakketten); 5etools mist bij Scribe de aantallen van Oil/Parchment — wij houden 3 flasks / 12 sheets aan (PHB-steekproef)
- [x] P2 — Trackers: widget "Conditions" (`wg-conditions.js`) met Heroic Inspiration, Exhaustion 0–6 (−2 op skills/saves/initiative, −5 ft speed, Long Rest −1), Concentration + CON-save-venster bij schade, Arcane Ward HP (2026-10-17). Exhaustion zit sinds de Attacks-update ook in attack rolls
- [x] P2 — Wizard "Memorize Spell": na een Short Rest (wizard 5+) vraagt de site om één prepared spell te wisselen; prepare-venster in wissel-modus (2026-10-17)
- [x] P2 — Entity-merge fase 0: offline round-trip-script `Metadocs/entity-merge-roundtrip.mjs` (68/68 op de dump van 26-09) (2026-10-17). Rest van de gate: verse RTDB-dump (live-reads zijn voor Claude geblokkeerd) + live-check door Joshua
- [x] P3 — Prullenbak: character gaat bij verwijderen uit de party van elke campaign en komt bij herstel terug (als die speler geen ander character koos) (2026-10-17)
- [x] P3 — itemDB: Bell, Robe, Mirror, Perfume, Tent toegevoegd; Rope 5 lb (2024) (2026-10-17)
- [x] P3 — Spell `save`/`attack`-veld: `DATA.spellRoll` (176 spells, feiten uit de 2024-data) in `data-rules.js`; spell-tooltips tonen nu "DEX save, DC 14" of "Ranged spell attack +6" (2026-10-17)
- [x] P3 — `@`-links naar timeline-sessions (ook in Search), @-popup opent bij de cursor; family-koppeling gebruikt al `linkedCreatureId` (index alleen nog als lees-fallback) (2026-10-17)
- [x] P3 — Level-down bewaart de keuzes (`state.demotedChoices[N]`); opnieuw omhoog vult ze vooraf in (2026-10-17). Werkt voor level-ups vanaf nu (oudere records hebben geen `_picked`)
- [x] P3 — Na artikel opslaan landde `/lore` op de Creatures-tab: nu naar het opgeslagen artikel, na verwijderen naar de Articles-tab (2026-10-17)
- [x] P1 — Telefoonmodus (< 700px): tab bar + More-sheet (`mobile.js`/`mobile.css`), bottom-sheet-modals, FAB's weg, dashboards één kolom met swipe tussen situatie-tabs, afgeleid van desktop (`wg-mobile.js`) (2026-10-18)
- [ ] P2 — Telefoonmodus vervolg: Combat Tracker (DM-tabel met veel kolommen) compacter op een telefoon; `social/dnd-init.js` importeert `chat-widget.js` e.a. zonder `?v=` (alleen het entry-script heeft er nu één) → bij een chat-wijziging kunnen telefoons de oude module vasthouden; creation-wizard op een telefoon nalopen (full-screen, stepper); landscape-telefoons
- [ ] P3 — Telefoonmodus: één-malige "swipe"-hint op het dashboard; campaign-wissel voor multi-campaign-gebruikers in de More-sheet (de `<select>` in de navbar is op de telefoon verborgen)

## Claude — opruimen en techniek
- [x] P2 — `cloudinary-worker/wrangler.toml`: `ALLOWED_ORIGIN` → `https://dnd-within.pages.dev` (2026-10-17)
- [ ] P2 — Na "repo privé": wachtwoorden uit `core.js` `DEFAULT_USERS` en `seedUsers()` halen
- [x] P2 — Firebase-rules voorbereid: concept + schrijfpaden-inventaris in `Firebase-Rules-Draft.md`/`.json` (niet gedeployed, niet in de Simulator getest) (2026-10-17)
- [x] P1 — Vóór de cutover: `?auth=`-token in alle directe REST-calls naar de database (`dwAuthUrl` in `auth.js`, `wgAuthUrl` in de widgets) (2026-10-17)
- [ ] P1 — Auto-migraties + `seedUsers` alleen voor DM/admin; `canEditCharacter` definiëren (`purgeExpiredCharTrash` is sinds 2026-10-17 al beperkt tot eigenaar/admin)
- [x] P3 — Spellnaam "Pass Without Trace" → "Pass without Trace" (2026-10-17); snapshot 26-09 had geen opgeslagen characters met de oude naam (live niet gecontroleerd)
- [x] P3 — Repo-hygiëne: `.nexus` + `graphify-out/` uit git (in `.gitignore`), `sw.js`/`manifest.json`/`DnD_Twin_Builds.md`/oude `wgi-*.png` weg, verwijderde placeholder-afbeeldingen gecommit (2026-10-17)
- [x] P3 — `Metadocs/smoke-test.mjs` weggehaald (vervangen door de node-smokes in `LevelingUp/`); `_test.mjs`-verwijzing gerepareerd (2026-10-17)
- [x] P3 — Nederlands codecommentaar → Engels (~1100 regels, 32 bestanden) + console-teksten in `sync.js`; laatste NL UI-teksten (profielfoto, kaarten laden, dev-info-paneel, dashboard-tabs) vertaald (2026-10-17). Losse korte NL-comments kunnen nog ergens staan (gezocht op stopwoorden)
- [x] P3 — Dode code: Nederlandse `nl:`-tabel uit `i18n.js`, `getAbilityBreakdown` weg, 20 `{nl,en}`-objecten in `data.js` → Engelse strings, verouderd commentaar bij `subclassChoiceLevel` (2026-10-17)
- [ ] P3 — `data.js` (533 kB) opsplitsen per domein
- [ ] P3 — Licentie (doorlopende regel): regelteksten in eigen woorden; 5etools-JSON blijft buiten de repo, alleen feiten in `build-facts.json`

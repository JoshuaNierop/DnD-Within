# WGI Test Checklist

Test-lijst voor Widget Grid V8/V11 inline-integratie. Loop deze door voor je `josh/widget-grid-inline` naar `master` mergt.

**Setup vóór testen:**
1. Pull laatste `josh/widget-grid-inline` branch
2. `python -m http.server 8124` in DnD-root
3. Open `http://localhost:8124/` in browser
4. **Hard reload** (Ctrl+Shift+R) bij elke aanpassing — cache-bust is `?v=27`
5. Login indien nodig

**Bij fail:** noteer error/console-output achter het item. Voor screenshots: drop in `Metadocs/wgi-test-*.png`.

**Rollback indien nodig:** `git checkout master && git reset --hard pre-widget-grid` (tag op `ce609f7`).

---

## 1. Golden path

- [ ] **Home rendert normaal** — `http://localhost:8124/` → "Welkom Joshua" banner, Mijn Campaigns (Serpent of Valoria), Mijn Characters. Navbar zichtbaar boven.
- [ ] **`/#characters/saya` mount** — V8 dashboard verschijnt. Top: 5 situation-tabs (CHARACTER actief / SOCIAL / EXPLORING / COMBAT / INVENTORY). Saya's abilities widget: STR 8(-1) DEX 13(+1) CON 15(+2) INT 12(+1) WIS 10(+0) CHA 17(+3). Zilver accent (#b8c5d1) op active-tab onderlijn.
- [ ] **`/#characters/ren` mount** — Re-mount met Ren's 3-widget dashboard (Profile Picture + Ability Scores + Skills). Goud accent (#d4a017).
- [ ] **Andere characters** — `/#characters/ancha`, `/lira`, `/nero`, `/io`, `/tab`, `/dfppklgdf`, `/placeholder` — elk laadt z'n eigen dashboard (kan leeg zijn).
- [ ] **Navigate weg = unmount** — Klik nav-link "Home" → V8 verdwijnt, navbar terug zichtbaar, geen V8-elementen in DOM.
- [ ] **Browser back/forward** — Saya → Home → Back → Saya re-mount correct met data.
- [ ] **Navbar zichtbaar op niet-character pages** — Home/Party/Maps/Timeline/Lore/Notes/DM/Settings allemaal nav-bar tonen.
- [ ] **Navbar verborgen op character-page** — Op `#characters/<id>` is DnD-navbar `display: none`.

## 2. V8 interactiviteit binnen DnD

### Layout/Navigation
- [ ] **Situation-tabs klikken** — Klik SOCIAL, EXPLORING, COMBAT, INVENTORY. Elk laadt eigen widget-set (leeg als nog niets geconfigureerd). Active-class wisselt mee.
- [ ] **Linker sidebar — categorieën** — Klik op de 8 category-icons links. Sidebar-panel klapt uit met widget-list. Hover toont preview.
- [ ] **Linker sidebar — widget toevoegen** — Klik op widget in library → nieuwe widget verschijnt op dashboard op vrije plek.
- [ ] **Right sidebar buttons** — Klik tidy (raster-icon), settings (tandwiel), edit-values (potlood), save (disk). Elk reageert.

### Widget manipulatie
- [ ] **Drag widget** — Sleep widget naar andere plek. Ghost-preview tijdens drag, drop-indicator. Bij release: widget verplaatst.
- [ ] **Resize east** — Sleep right edge horizontaal → widget wordt breder/smaller. Span-lock voorkomt te-smal.
- [ ] **Resize south** — Sleep bottom edge verticaal → widget hoger/lager.
- [ ] **Swap widgets** — Sleep widget volledig op andere → wisselen positie.
- [ ] **Delete widget** — Klik op widget (active glow) → Delete/Backspace toets → confirm prompt → widget weg.
- [ ] **Tidy/Opruimen** — Klik tidy-icon → widgets compact herindelen, geen gaten.

### Paginering (V9)
- [ ] **Overflow naar pagina 2** — Voeg widgets toe tot ze niet meer op één pagina passen. Pagina-dots verschijnen onder canvas.
- [ ] **Swipe/pijl-navigatie** — Klik pagina-dots of swipe horizontaal → pagina 2 wordt zichtbaar.
- [ ] **Cross-page drag** — Sleep widget naar randwand → na ~350ms flipt naar volgende pagina.

### Settings dialog
- [ ] **Settings openen via gear** — Klik tandwiel → settings-panel slidet uit rechts.
- [ ] **Settings tabs werken** — Data / Widget / Stijl / Dev tabs wisselen content.
- [ ] **Palette wisselen** — Stijl-tab → Kleuren-palet dropdown → wissel positiveGold ↔ parchment. Visueel verandert.
- [ ] **Settings sluiten via ×** — Klik close-knop of klik buiten panel → panel sluit.
- [ ] **Escape sluit settings** — Open settings → press Escape → sluit.

### V11 edit-mode (de spannende)
- [ ] **Edit-values mode aan** — Right sidebar potlood-icon → edit-mode actief (visuele indicatie?).
- [ ] **Ability score editen** — Klik op een ability-cel (bv. STR 8) → numeric input verschijnt. Wijzig naar 12, Enter. Toast "Opgeslagen". Widget rerendert met nieuwe waarde.
- [ ] **Ability range-check** — Probeer een waarde buiten 1-30 → toast "Range 1-30" + clamped naar bound.
- [ ] **Skill cycle ○→●→★→○** — Klik op skill-prof-bolletje (○). Wordt ● (proficient). Klik nog eens → ★ (expertise). Klik nog eens → ○ (terug).
- [ ] **Skill bonus update** — Na proficient: total bonus +2 (lvl 1-4). Na expertise: dubbele prof bonus.
- [ ] **Edit-mode uit** — Klik potlood weer → terug naar normale modus.
- [ ] **Reload na edit** — Edit ability → hard reload → toont nieuwe waarde direct (geen "Loading..." flash). Test M6 round-trip.

### Save dashboard (V11)
- [ ] **Save knop** — Voeg widget toe, verplaats, klik disk-icon → toast "Dashboard opgeslagen".
- [ ] **Reload behoudt layout** — Hard reload → zelfde dashboard layout zoals voor save.
- [ ] **Per-device** — Save op desktop → resize browser naar mobile → ander dashboard slot (of leeg). Aparte per-device persistence.
- [ ] **Per-situation** — Save op CHARACTER tab → switch naar COMBAT → leeg/anders. Per-tab persistence.

### Map widget
- [ ] **Voeg map widget toe** — Vanuit sidebar library, kies Map widget. Map laadt uit Firebase.
- [ ] **Pin click navigeert** — Klik op een pin op de map → navigeer naar target-map (als pin er een heeft).
- [ ] **Dimension toggle** — Wissel dimensies → andere maps.
- [ ] **Add pin (edit-mode)** — Edit-mode aan → klik add-pin in map-widget topbar → klik op map → popover voor label + target. Save → pin geplaatst.
- [ ] **Edit existing pin** — Edit-mode aan → klik bestaande pin → popover met edit + delete.
- [ ] **Upload map image** — Edit-mode aan → upload-knop → kies image → uploadt naar Firebase, map shows new image.
- [ ] **Delete map** — Edit-mode aan → delete-knop → confirm → map wordt verwijderd uit Firebase.

### Profielfoto
- [ ] **Voeg profile-picture widget toe** — Vanuit sidebar.
- [ ] **Upload portret (edit-mode)** — Edit-mode aan → upload-knop → kies image → wordt opgeslagen naar Firebase.
- [ ] **Reload toont portret** — Hard reload → portret nog steeds zichtbaar (test M6).

---

## 3. Theme + responsive

- [ ] **Saya zilver-accent doorwerkt** — Saya widget glow + drag-handle proximity → zilver-tint zichtbaar bij interactie.
- [ ] **Ren goud-accent doorwerkt** — Op Ren character: goud-tint zichtbaar bij interactie.
- [ ] **V8 kleuren passen bij DnD** — Donker bg (#0c0a08), beige widget-cellen (V8's parchment palette overheerst). Geen botsing.
- [ ] **Mobile breakpoint (<600px)** — Resize browser of mobile-emulate. V8 layout schaalt mee. Situation-tabs blijven leesbaar.
- [ ] **Tablet breakpoint (600-1024px)** — Resize browser. Tussenliggende layout, sidebars compact.
- [ ] **Desktop (1024px+)** — Volledige sidebars zichtbaar.

---

## 4. DnD regressies (mag NIET kapot)

- [ ] **DM tools — Initiative** — `/#dm` of via dashboard → Initiative tracker. Drag-drop volgorde werkt nog. Geen V8-bleed.
- [ ] **DM tools — NPCs** — NPC list, add/edit/delete. Family trees op NPCs.
- [ ] **Maps page** — `/#maps` → DnD's eigen map-viewer (niet V8). Pins clickbaar. Letterbox-correctie werkt.
- [ ] **Timeline** — `/#timeline` → sessions/events lijst.
- [ ] **Lore** — `/#lore` → entries renderen, edit-mode werkt.
- [ ] **Notes** — `/#notes` → notes list, edit, view. Layouts.
- [ ] **Quick Notes FAB** — Klik notes-FAB rechtsonder → panel uitklap.
- [ ] **Dice roller FAB** — Klik dice-FAB → panel + roll werkt.
- [ ] **Bug-reporter FAB** — In debug-mode: report-knop schrijft naar Nexus hub.
- [ ] **Login/logout** — Logout → login pagina. Login terug.
- [ ] **Settings page** — `/#settings` → account, thema, taal, debug-mode toggles.
- [ ] **Multi-campaign switch** — Wissel naar andere campaign (als beschikbaar) → werkt.

---

## 5. Edge cases + bekende risico's

- [ ] **Page-transition flicker** — Navigate Saya → Ren snel achter elkaar. V8 unmount + remount tijdens 120ms fade-window. Verwacht: geen visuele flicker; als wel → setTimeout in `postRenderEffects`.
- [ ] **Idempotent mount** — Navigate Saya → settings → terug naar Saya. `_wgMounted`-flag voorkomt dubbele mount; geen errors.
- [ ] **Browser back/forward stress** — Saya → Ren → Home → Back → Back → Forward. Geen stale mount-state, geen Firebase race-errors.
- [ ] **Character-switch tijdens async** — Open Saya, edit-mode ability, klik snel naar Ren tijdens save → race-guard moet aborten (toast "Character gewijzigd").
- [ ] **Empty dashboard** — Eerste open van Saya CHARACTER tab (geen widgets) → linker sidebar pulseert 1× amber.
- [ ] **FAB-stack overlap** — V8 right-sidebar + DnD FAB-stack (chat/notes/dice/bug) niet visueel botsend. Beide clickbaar.
- [ ] **DnD's `.widget :is(h1,h2,h3,h4)` rule** — Style.css:665 zou V8 widget-titles kunnen raken. V8 gebruikt SVG dus geen impact verwacht, maar verifieer.
- [ ] **Console errors** — Door alle tests heen: F12 console open, geen rode errors. Pre-bestaande `[issue]` warnings over form-field labels zijn OK.

---

## 6. Resultaten

Vul hieronder in tijdens/na het testen:

### Working
_(items die slaagden, evt. met opmerkingen)_

### Failures
_(items die faalden, met error-bericht + reproductie-steps)_

### Onverwachte ontdekkingen
_(dingen die wel werken maar verrassend zijn, of subtle bugs)_

---

## 7. Volgende stappen na testing

- Bij <3 failures: fix die, merge `josh/widget-grid-inline` → `master`, deploy
- Bij meer failures: backport-fixes naar `josh/widget-grid-inline`, herhaal relevante tests
- Bij architectural issue: tag `pre-widget-grid` (op `ce609f7`) is rollback-anker

**Cleanup post-merge:**
- Delete `josh/widget-grid-inline` branch lokaal + remote
- Tag `wgi-complete` op merge-commit
- Update `Metadocs/Planning.md` Milestone 5b status naar volledig done

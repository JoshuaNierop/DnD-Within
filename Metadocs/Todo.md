# D&D Within — To Do

## Dashboard / Widget System (2026-05-07 — fase 1 gestart)

- [x] P1 — Data layer: `dashboard-data.js` (per-character tabs config + per-bp layouts + reflow + templates)
- [x] P1 — Widget registry: `widgets.js` (12 starter widgets — hp/core-stats/abilities/saves/skills/slots/prepared/weapons/quote/text/image/inventory + family-diagram + xp + class-resources)
- [x] P1 — Dashboard renderer + grid CSS: `dashboard.js` + `dashboard.css` (12/8/4 cols, breakpoint toolbar, grid toggle)
- [x] P1 — Edit-mode: `dashboard-edit.js` (sidebar palette met categorieën, drag-from-palette, in-grid drag, corner resize, save per breakpoint, clear bp, save-as-template)
- [x] P1 — Tab-management modal (add/hide/rename/reorder/delete custom tabs) + nieuwe defaults: Overview, Stats, Social, Exploring, Combat, Spells, Story, Family, Inventory
- [x] P1 — Convert-to-dashboard knop voor legacy tabs (Overview/Stats/Combat/Spells/Story/Inventory)
- [x] P1 — Auto-reflow algoritme (starred-first + bottom-left-fill, geen lege vlakken)
- [x] P2 — Size picker in palette (3-5 size opties per widget, klik = active, daarna drag)
- [x] P2 — Widget configuratie-UI (text widget title/body editen via contentEditable, image upload binnen widget)
- [x] P3 — Compact-knop (pull widgets up, geen gaps)
- [x] P3 — Meer widgets: combat-log, death-saves, exhaustion, inspiration, metamagic, sneak-attack, ability-radar
- [x] P2 — Edit-mode UX: drag werkt vanaf hele widget (interactive children opt-out via tag check), niet meer overlay
- [x] P2 — Tab-switch tijdens edit mode: auto-save current bp
- [ ] P2 — Touch drag verfijnen voor mobiel (pointer events werken al; testen op echt device)
- [ ] P2 — Templates: gebruiker kan opgeslagen template kopiëren naar andere character via Tab manage modal
- [ ] P2 — Family-diagram widget hooken aan de bestaande family system zodra een character een family heeft
- [ ] P3 — Undo/redo binnen edit mode
- [ ] P3 — Default layouts voor Overview/Combat opnieuw bekijken (nu nog naïef — willen meer dichtgeplaatste defaults)
- [ ] P3 — Visual feedback voor "unsaved changes" indicator in edit mode

## Bug Tracker — Migrated to Central Hub (2026-04-22)

- [x] P1 — In-app reporter schrijft nu naar Nexus `/shared/bugs` ipv `dw/bugs` (`sync.js` + `ui-settings.js`)
- [x] P1 — `syncUploadBugs`/`syncDownloadBugs`/`syncListenBugs` gedeprecateerd tot no-ops
- [ ] P3 — Oude `dw/bugs` (74 fixed bugs) migreren als archive naar `/shared/bugs` of als read-only archive laten staan
- [ ] P3 — Oude localStorage `dw_bugs` cleanup bij volgende user-login (migration snippet in app.js)

## Hosting

- [ ] P1 — Migratie van GitHub Pages naar Cloudflare Pages. Workspace-default is nu Cloudflare. Sanctum is de opvolger; overweeg of migratie zin heeft of dat legacy op GitHub Pages blijft tot Sanctum klaar is. Als migratie: Cloudflare Pages koppelen aan `JoshuaNierop/DnD-Within`.

## Firebase

- [x] P0 — Firebase rules deployen vóór 28 april 2026 (huidige regels lopen af). `database.rules.json` staat klaar, verlengt tot april 2027. Run `firebase login && firebase deploy --only database` vanuit project root.

## Migratie naar Sanctum

- [ ] P2 — Repo privé maken (zie `project_dnd_within_migration.md` memory)

## Characters

- [x] P1 — Ren & Saya Ashvane herzien naar Aasimar tweeling (2024 PHB). Ren: Rogue/Soulknife/Criminal. Saya: Sorcerer/Draconic/Hermit. Build + config + state gesynced naar Firebase op 2026-04-18. Bron: `~/Documents/Claude/Projects/Hobby/Ashvane-Twins/Characters.md`.

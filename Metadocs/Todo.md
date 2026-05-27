# D&D Within — To Do

## WGI — Widget Grid V8/V11 Inline Integration (2026-05-27 gestart)

Plan via `vanilla-js-architect` agent. Joshua's keuzes: direct REST-PATCH + targeted localStorage update; DnD-navbar verbergen op character-route; `.character-page` grid slopen voor volle flex-shell. Zie Planning.md Milestone 5b.

- [x] P0 — WGI-M1: V8 monoliet (5145 r) split → 8 `.js` + `wg-style.css` in `Tools/Widget Grid V8/dist/` (V8 commit `b6e3b68`).
- [x] P0 — WGI-M2: WG_*-prefix + shim-merges (`FIREBASE_DB`/`showToast`/`WG_MAPS_CACHE`). Standalone V8 werkt nog identiek.
- [x] P0 — WGI-M3: wg-* naar DnD-root + script/link tags + DEFER-flag-gate. Tag `pre-widget-grid` op `ce609f7`. Branch `josh/widget-grid-inline`. WidgetGrid namespace/IIFE doorgeschoven naar M4 (samen met mount-API).
- [x] P0 — WGI-M4: `WidgetGrid.mount/unmount` API in `wg-mount.js` (body-template injection + `_wgMounted`-flag idempotency); bedraad in `app.js postRenderEffects` + cleanup-call in `renderApp`. `.character-page` grid gesloopt naar volle flex-shell. `body[data-route^="characters/"] .navbar { display: none }` verbergt DnD-navbar.
- [x] P1 — WGI-M5: `wg-style.css` wrapped in `@scope (.character-page)`. Theme-bridge (buiten scope) mapt V8-tokens (`--bg`/`--panel`/`--text`/`--muted`/`--border`/`--accent`) op DnD-tokens (`--bg-dark`/`--bg-card`/`--text-main`/`--text-dim`/`--border-light`/`--char-accent`). V8-eigen tokens (`--tile-dash`/`--user-bg-*`/etc.) behouden; `--tile-dash` ook gebonden aan `--char-accent`. Per-character accent doorwerkt: Saya=#b8c5d1 (zilver), Ren=#d4a017 (goud). Geen regressie op DnD home.
- [ ] P1 — WGI-M6: V11 edit-flow via direct REST-PATCH + targeted localStorage update
- [ ] P1 — WGI-M7: polish — verwijder V8 `#characterSelect`, opruimen `.is-edit-mode` dode code, smoke-test 5×3

## Legacy Dashboard (archief — verwijderd 2026-05-26/27 in nuke)

Oude `dashboard.js` / `widgets.js` / etc. systeem gestript in commits `41e4257` + `bf35f2a`. Open items uit oude systeem (touch drag, templates, family-hook, undo/redo, unsaved-indicator) overgedragen naar WGI-M7 polish-fase, of opnieuw geëvalueerd in V8-context.

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

## Audit Follow-ups (2026-05-15)

- [x] P0 — Magic Initiate feat-naam mismatch (3 backgrounds) — split in Cleric/Druid/Wizard varianten + repeatable
- [x] P0 — Equipment Choice A/B op alle 17 backgrounds toegevoegd
- [ ] P2 — Verifieer GP-bedragen + item-counts van background Equipment Choice A tegen 2024 PHB Ch.4 (huidige data is best-recall, geen PHB-bron-check)
- [ ] P2 — UI voor Equipment Choice A/B in character creation wizard (data staat er, picker ontbreekt)

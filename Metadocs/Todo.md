# D&D Within — To Do

## Homepage & UI tweaks — ronde 5 (2026-05-29 22:30)

- [x] P1 — Right sidebar (`#rightSidebar`): uitklappend `.sidebar-panel` weggehaald (CSS-only, `display:none`); de `#rs-char-toggle` knop die het opende ook verborgen. `characterSelect` element blijft in DOM voor binding-compat.
- [x] P1 — Dashboard L/R padding op character-pages: defensive sweep (`body[data-route^="characters/"] .main-content/.character-page { padding-inline: 0 !important }`) zodat sidebars aansluiten op viewport-randen ondanks cascade-conflicten of `:has()`-onverbreekbaarheid.
- [x] P1 — Banner upload-knoppen vertical stack (kolom rechtsbovenin, 130px breed, `flex-direction: column`).
- [x] P1 — Character page block-size `100dvh` → `calc(100dvh - 5rem)` om FAB-clearance (dice/notes/bug-report) te garanderen. Skills widget default size `spanUnits: 3, spanUnitsY: 10` → `5, 15`.
- [x] P1 — Campaign cards breder (`minmax(250px, 1fr)` → `340px`). Edit-pencil modal uitgebreid van 2 velden (count+date) naar 4 (Title, Next Session, World name, DM-select). DM-dropdown leest uit `usersCache`; fallback naar text-only als cache leeg is.
- [x] P0 — Timeline events → **Sessions** met **Scene blocks**. Nieuwe data-model `{title, session, scenes:[{layout, text, image}]}`; legacy events worden via `migrateTimelineEvent()` on-read gemigreerd. Vier scene-layouts: Just Text / Image Left / Image Right / Just Image. Form: Chapter dropdown + Session# + Title + N scene-blokken (add/remove) + Save/Cancel/Delete. "Add Session" knop. Edit-flow gebruikt zelfde form inline. Home Recent links: nieuw `data-action="view-session"` zet `dw_timeline_focus_session` in localStorage; `postRenderEffects` op `/timeline` route scrollt naar `#session-<id>` met flash-animatie.

## Homepage & UI tweaks — ronde 4 (2026-05-29 22:00)

- [x] P0 — Profile Picture upload-knop: hover werkte, click niet. Root cause was **niet** de canvas-listener (ronde 1-fix was correct maar onvoldoende): `onPointerDown` zet voor de upload-knop `pendingGesture: 'select'` (geen `data-handle`), `onPointerUp` roept dan `render()` aan dat de SVG-target vervangt vóór de click-event fires. Combinatie van re-render race + verloren transient user-activation in de `async` click-handler → file picker opent nooit. Fix: map-action knoppen synchroon afhandelen in `onPointerDown` (preventDefault + `handleMapAction()` sync + return zonder pendingGesture). De delegated document-click listener blijft als fallback.

## Homepage & UI tweaks — ronde 3 (2026-05-29 21:50)

- [x] P2 — Homepage Recent events: ook gesorteerd op sessie-nummer descending (was: laatste-3-in-storage-order). Events zonder session-# zakken naar onder. Consistent met Timeline.
- [x] P1 — Mobile: tap op `.welcome-banner` toggle `show-upload-slots` class (revealen/sluiten van banner upload-knoppen). Alleen geactiveerd op `(pointer: coarse)` devices via `matchMedia`. Tap buiten de banner sluit hem weer; tap op een upload-slot zelf of op de clear-knop wordt genegeerd zodat de file-picker / verwijder-actie doorgaat.

## Homepage & UI tweaks — ronde 2 (2026-05-29 21:30)

Vervolg-correcties na eerste pas. Wacht op live browser-verificatie.

- [x] P1 — Banner-upload-knoppen: Engels (Night/Morning/Afternoon/Evening, één woord) + hover-only (zichtbaar bij `:hover` / `:focus-within` op `.welcome-banner`).
- [x] P1 — Session/Level `-/+` knoppen alleen zichtbaar bij hover over hun eigen `.session-card` / `.level-card`. Standaard opacity 0 + pointer-events none + lichte scale-in op hover.
- [x] P1 — Recent events op homepage: max 9 regels desc met ellipsis (`-webkit-line-clamp: 9`), elk event is nu een `<a href="#/timeline">` → klik navigeert naar Timeline.
- [x] P1 — Timeline events gesorteerd op sessie-nummer descending (recent bovenaan). Events zonder session-nummer zakken naar beneden. Originele indices behouden voor edit/delete handlers.
- [x] P0 — Navbar-context fix: route `/home` ontbrak in de `inCampaignView` array, waardoor na klik op campagne de Welcome-navbar zichtbaar bleef i.p.v. de campaign-navbar. `'home'` toegevoegd aan de lijst (`['home', 'dashboard', 'party', 'maps', 'timeline', 'lore', 'notes', 'dm']`), fallback `routePart` van `'dashboard'` → `'home'`.

## Homepage & UI tweaks — ronde 1 (2026-05-29)

Joshua's 7-puntenlijst doorgevoerd in één sessie. Wacht op live browser-verificatie.

- [x] P1 — Route-rename: huidige Dashboard → `/home`, oude `/home` (campaigns-keuze) → `/welcome`. Navbar logo + back-button + login-redirect + enter-campaign aangepast; `nav.welcome` toegevoegd in `i18n.js`.
- [x] P1 — Time-based banner: 4 upload-slots op homepage (night 00–06, morning 06–12, afternoon 12–18, evening 18–24). DM ziet 4 labels met `current`-highlight; data in `dw_dashboard.bannerImages.{slot}`. Legacy `bannerImage` blijft als fallback voor bestaande data.
- [x] P1 — Grote nav-cards (Party/Timeline/Maps/Lore/Notes) van homepage verwijderd — staan al in navbar.
- [x] P1 — Sessie-indicator: `-/+` naast cijfer i.p.v. onder label. Nieuwe `.dash-stat-value-row` flex-layout in `style.css`.
- [x] P1 — Level-indicator op homepage: `-/+` knoppen (DM/Admin only). Storage `dw_party_level` (1–20). Fallback naar berekende `groupLevel` als geen override. `isDM()` includeert al `role === 'admin'`.
- [x] P0 — Profile Picture "Upload Image" knop fix: canvas-click listener werd top-level gebound vóór WGI mount-tijd → `?.` op `null` → listener nooit gekoppeld. Vervangen door delegated listener op `document` met `closest('#canvas')`-filter. Lost waarschijnlijk ook latent stille bugs op in skill-cycle, ability-edit en pin-edit clicks.
- [x] P1 — Map Widget: Add Pin / Upload Map / Delete Map knoppen weggehaald uit topbar (`wg-render.js`). Edit-acties horen alleen op de Maps-page.

### Verificatie (open)
- [ ] P1 — Live browser-test alle 7 punten (banner upload per slot, sessie+/-, level+/- als DM, profile picture upload knop, map widget zonder action-buttons).
- [ ] P2 — Maps-page DM/Admin gate verifiëren — Add Pin / Upload / Delete moeten daar wél werken, maar alleen voor DM/Admin.
- [ ] P3 — Level-override init-flow: eerste klik op `+` start vanaf 1 (bij geen override). Overwegen: start vanaf huidige `groupLevel` zodat je geen "reset" krijgt.
- [ ] P3 — Banner-data grootte: 4× base64 JPEG kan `dw_dashboard` flink laten groeien (~0.5–2 MB). Firebase REST sync moet dit aankunnen; monitor in praktijk.

## WGI — Widget Grid V8/V11 Inline Integration (2026-05-27 gestart)

Plan via `vanilla-js-architect` agent. Joshua's keuzes: direct REST-PATCH + targeted localStorage update; DnD-navbar verbergen op character-route; `.character-page` grid slopen voor volle flex-shell. Zie Planning.md Milestone 5b.

- [x] P0 — WGI-M1: V8 monoliet (5145 r) split → 8 `.js` + `wg-style.css` in `Tools/Widget Grid V8/dist/` (V8 commit `b6e3b68`).
- [x] P0 — WGI-M2: WG_*-prefix + shim-merges (`FIREBASE_DB`/`showToast`/`WG_MAPS_CACHE`). Standalone V8 werkt nog identiek.
- [x] P0 — WGI-M3: wg-* naar DnD-root + script/link tags + DEFER-flag-gate. Tag `pre-widget-grid` op `ce609f7`. Branch `josh/widget-grid-inline`. WidgetGrid namespace/IIFE doorgeschoven naar M4 (samen met mount-API).
- [x] P0 — WGI-M4: `WidgetGrid.mount/unmount` API in `wg-mount.js` (body-template injection + `_wgMounted`-flag idempotency); bedraad in `app.js postRenderEffects` + cleanup-call in `renderApp`. `.character-page` grid gesloopt naar volle flex-shell. `body[data-route^="characters/"] .navbar { display: none }` verbergt DnD-navbar.
- [x] P1 — WGI-M5: `wg-style.css` wrapped in `@scope (.character-page)`. Theme-bridge (buiten scope) mapt V8-tokens (`--bg`/`--panel`/`--text`/`--muted`/`--border`/`--accent`) op DnD-tokens (`--bg-dark`/`--bg-card`/`--text-main`/`--text-dim`/`--border-light`/`--char-accent`). V8-eigen tokens (`--tile-dash`/`--user-bg-*`/etc.) behouden; `--tile-dash` ook gebonden aan `--char-accent`. Per-character accent doorwerkt: Saya=#b8c5d1 (zilver), Ren=#d4a017 (goud). Geen regressie op DnD home.
- [x] P1 — WGI-M6: V11 edit-flow via direct REST-PATCH + targeted localStorage update. `wgSyncCharToLocal(id)` + `wgSyncMapsToLocal()` helpers in `wg-firebase.js` schrijven na elke succesvolle REST-write naar DnD's `dw_charconfig_{id}`/`dw_charstate_{id}`/`dw_img_{id}_{type}`/`dw_maps`. Wired in alle 6 V11 write-flows: writeAbilityScore, writeSkillProficiency, savePinsToFirebase, uploadMapImage, deleteMapFromFirebase, uploadPortrait. Standalone V8: helpers no-op (geen dw_* keys). Niet getest in browser — testen komt later.
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

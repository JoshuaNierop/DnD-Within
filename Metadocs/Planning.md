# D&D Within — Planning

Roadmap voor de Valoria-campaign SPA. Statuses per `~/.claude/rules/todo-notation.md`.

## Milestone 1 — 5.5e correctheidsbasis (audit P0)
Status: ✅ **DONE** (2026-05-15)

- [x] P0 — Firebase rules verlenging (2027-04-28)
- [x] P0 — Spell descriptions corrigeren (Blade Ward, True Strike, Divine Smite, Hunter's Mark)
- [x] P0 — Engine formules (Ranger/Warlock prepared, getAC equipped armor, HP Dwarven Toughness + Tough, feat abilityBonus choice)
- [x] P0 — Magic Initiate feat-naam splitsing (Cleric/Druid/Wizard)
- [x] P0 — Background Equipment Choice A/B data

## Milestone 2 — 5.5e content uitbreiding (audit P1)
Status: in progress — ~18 items

- [ ] P1 — Third-caster spell slot tabel + EK/AT spellcasting ability (engine reeds bijgewerkt; data verifiëren)
- [ ] P1 — Spell list gaps dichten (Cleric 2nd, Druid 1st, Bard 1st, Ranger 2-3, Paladin)
- [ ] P1 — Fighting Style feats als losse feat-category in pickers (data bestaat al, UI ontbreekt)
- [ ] P1 — Equipment Choice A/B picker in character creation wizard
- [ ] P1 — Verifieer GP-bedragen + item-counts van background Equipment tegen 2024 PHB Ch.4
- [ ] P1 — Eldritch Invocations data + Warlock keuzeflow
- [ ] P1 — Battle Master Maneuvers data + selectie-UI
- [ ] P1 — High Elf + Drow species toevoegen (Elf lineages)
- [ ] P1 — Weapon Mastery properties als gestructureerde data + tooltips

## Milestone 3 — Resource trackers (audit P2)
Status: open — ~12 trackers

- [ ] P1 — Rage uses, Focus Points, Channel Divinity, Bardic Inspiration, Lay on Hands pool
- [ ] P1 — Sorcery Points current/max, Second Wind / Action Surge / Indomitable
- [ ] P1 — Wild Shape, Arcane Ward HP, Superiority Dice, Psionic Energy
- [ ] P1 — Concentration tracker met save-on-damage flow
- [ ] P1 — Exhaustion (1-6 levels, -2 d20 per level)
- [ ] P1 — Heroic Inspiration toggle
- [ ] P1 — Death saves widget

## Milestone 4 — High-level features (audit P2)
- [ ] P2 — Epic Boon picker (lvl 19+)
- [ ] P2 — Eldritch Invocations picker
- [ ] P2 — Weapon Mastery properties picker
- [ ] P2 — Character creation Step 6 confirm + validatie
- [ ] P2 — DM NPC editor (subclass/equipment/spells)
- [ ] P2 — DM Whispers handler binding

## Milestone 5 — Dashboard/Widget polish
Status: ⛔ vervangen door Milestone 5b (WGI). Oude widget-grid is genukket in `41e4257` + `bf35f2a` (2026-05-26/27). Oude items verplaatst naar Changelog/archief.

## Milestone 5b — WGI (Widget Grid V8/V11 Inline Integration)
Status: 🚧 gestart 2026-05-27. Plan via `vanilla-js-architect` agent.

**Doel:** Widget Grid V8 (intussen V11-compleet) inline mounten in `<div class="character-page">` als character-dashboard, met merges/splits van overlappende identifiers.

**Joshua's keuzes (2026-05-27 02:00):**
1. Edit-mode writes: direct REST-PATCH + targeted localStorage update (geen full `syncUpload`)
2. DnD-navbar verbergen op `#characters/<id>` route — V8 situation-tabs zijn de enige topbar
3. `.character-page` grid slopen — V8 krijgt volle flex-shell

**Fases:**
- [x] P0 — WGI-M1: V8 monoliet (5145 r) split naar 8 `.js` + `wg-style.css` in `Tools/Widget Grid V8/dist/` (V8 commit `b6e3b68`).
- [x] P0 — WGI-M2: WG_*-prefix op alle collision-risk constants + shim-merges (`FIREBASE_DB` via `window.FIREBASE_CONFIG`, `showToast` via `window.showToast`, `WG_MAPS_CACHE` via `localStorage('dw_maps')`). Standalone V8 werkt nog identiek. Namespace/IIFE doorgeschoven naar M3.
- [x] P0 — WGI-M3: wg-* gekopieerd naar DnD-root, `<link>` + `<script>` tags in `index.html` (na DnD's eigen scripts zodat shims werken), `window.WIDGET_GRID_DEFER_INIT = true` vóór de wg-* loads, `wg-mount.js` bootstrap gewrapped in `WidgetGridInit()`. Tag `pre-widget-grid` op `ce609f7`. Branch `josh/widget-grid-inline`. Inline-fixes: `const showToast` → `var` (DnD declareerde 'm al), `_settings*` listeners optional-chained voor wanneer DOM nog niet bestaat. Namespace/IIFE doorgeschoven naar M4.
- [x] P0 — WGI-M4: `WidgetGrid` namespace met `mount(rootEl, opts)` + `unmount()` in `wg-mount.js`. Body-template als JS string (~180 r markup), idempotent via `_wgMounted`-flag. Bedraad in `app.js renderApp` (`unmount()` voor `app.innerHTML = html`) + `postRenderEffects` (mount-call op `.character-page` div met characterId uit route). `style.css:830-872` `.character-page` grid gesloopt → volle flex-shell. `body[data-route^="characters/"] .navbar { display: none }` verbergt DnD-navbar op character-routes. `_settings*` refs van `const` → `let` + `WidgetGridInitSettingsRefs(scope)` voor herinitialisatie binnen mount-root. Smoke-test geverifieerd: Saya (1 widget) + Ren (3 widgets) mounten correct, navigate-away unmounteert, navbar wisselt zichtbaarheid.
- [x] P1 — WGI-M5: `wg-style.css` wrapped in `@scope (.character-page) { … }`. Original `:root { --bg/--panel/--accent/etc. }` block vervangen door theme-bridge `.character-page { --bg: var(--bg-dark); --panel: var(--bg-card); --text: var(--text-main); --muted: var(--text-dim); --border: var(--border-light); --accent: var(--char-accent, var(--accent, #6cf)); --tile-dash: var(--char-accent, #6cf); …V8-eigen tokens behouden… }`. Per-character accent flows door: Saya zilver (#b8c5d1) en Ren goud (#d4a017) verifieerd in `--accent` + `--tile-dash`. Body bg blijft DnD's --bg-dark; geen regressie op home/campaigns/characters pagina's.
- [x] P1 — WGI-M6: V11 edit-flow via direct REST-PATCH + targeted localStorage update (geen full `syncUpload`). Twee helpers in `wg-firebase.js`: `wgSyncCharToLocal(charId)` splitst `WG_CHAR_CACHE[id]` naar DnD's split-storage (`dw_charconfig_{id}`/`dw_charstate_{id}`/`dw_img_{id}_portrait`/`_banner`/`_appearance`); `wgSyncMapsToLocal()` schrijft `WG_MAPS_CACHE` naar `dw_maps`. Aanroep na elke succesvolle REST-write in 6 V11 functies (writeAbilityScore, writeSkillProficiency, savePinsToFirebase, uploadMapImage, deleteMapFromFirebase, uploadPortrait). Bij standalone V8 no-op (geen localStorage `dw_*` keys aanwezig). Code-niveau verifieerbaar; live browser-test in interactieve sessie volgt.
- [ ] P1 — WGI-M7: polish — verwijder V8 `#characterSelect`, opruimen dode `.is-edit-mode` rules, smoke-test alle 5 situations × 3 devices
- [x] P0 — WGI-M4 bugfix (2026-05-29): canvas-click listener werd top-level gebound vóór mount-tijd (`document.getElementById("canvas")?.addEventListener` met `?.` op `null`). Vervangen door `document`-delegated listener met `closest('#canvas')`-filter in `wg-events.js:690`. Profile Picture upload-knop werkt nu; vermoedelijk ook latent stille bugs in skill-cycle, ability-edit en pin-edit clicks opgelost.
- [x] P1 — WGI: Map Widget action-buttons (add-pin / upload-image / delete-map) uit topbar verwijderd (`wg-render.js`). Deze acties horen alleen op de Maps-page (DM/Admin only).

**Branch:** `josh/widget-grid-inline`, 7 commits (één per M-fase).
**Architect-rapport:** zie sessie-notes 2026-05-27 (vanilla-js-architect opus max).
**Originele V8 Metadocs:** `Projects/Tools/Widget Grid V8/Metadocs/` — Architecture.md (V9-paginering), V11-Handoff.md (afgesloten V11-features), V11-Dashboards-Spec.md.

## Milestone 5-legacy — Dashboard (archief)
- [x] P1 — Widget grid + 22 widgets in registry (verwijderd in nuke)
- [x] P1 — Drag/resize edit mode + per-breakpoint layouts (verwijderd in nuke)
- [x] P1 — Widget Editor externe app (Cloudflare Pages) (verwijderd in nuke)

## Milestone 5c — Homepage & UI tweaks (2026-05-29)
Status: ✅ code-niveau **DONE** (twee rondes), wacht op live browser-verificatie.

Joshua's 7-puntenlijst + 5 follow-up correcties in twee rondes doorgevoerd. Zie `Todo.md` secties "Homepage & UI tweaks ronde 1/2" voor de verificatiepunten.

**Ronde 1:**
- [x] P1 — Route-rename: huidige Dashboard → `/home`, oude `/home` → `/welcome`. Logo + login + back-button + campaign-enter doorbedraad. `nav.welcome` toegevoegd.
- [x] P1 — Time-based banner met 4 slots (night/morning/afternoon/evening). `dw_dashboard.bannerImages.{slot}`; current-slot highlighted; legacy `bannerImage` blijft als fallback.
- [x] P1 — Grote nav-cards op homepage verwijderd (Party/Timeline/Maps/Lore/Notes — duplicaat met navbar).
- [x] P1 — Sessie-indicator: `-/+` direct naast cijfer (nieuwe `.dash-stat-value-row` layout).
- [x] P1 — Level-indicator: `-/+` naast cijfer (DM/Admin only). Storage `dw_party_level` (1–20), fallback naar berekende groupLevel.

**Ronde 7 (follow-up):**
- [x] P1 — Character page sidebars tot bodem; dashboard onder net boven FABs. `.character-page` `block-size: 100dvh`; `main.app-main` krijgt `padding-block-end: 5rem` + `overflow-y: auto`.
- [x] P0 — Scene save QuotaExceededError fix. Migratie schrijft geen `dw_timeline_legacy_backup` meer en verwijdert hem als hij bestaat. `_saveSceneBlob` heeft 3-traps fallback: normale save → free legacy backup + retry → shrink image (700px/0.6) + retry.

**Ronde 6 (follow-up):**
- [x] P1 — Welcome banner: dunner (`min-height: 140-160px`, `max 200-220px`), `background-size: auto 100%` zodat image op hoogte fit.
- [x] P1 — Scene split image-left/right: `float: inline-start/end` zodat tekst onder image doorloopt; `text-align: justify` + `hyphens: auto`.
- [x] P0 — **Timeline storage split** per scene. `dw_chapters` (index) + `dw_scene_<id>` (per scene blob). Firebase paths: `world/timeline/chapters` + `world/timeline/scenes/<id>`. Migratie van oude `dw_timeline` via `_migrateMonolithicTimeline()`.
- [x] P0 — **Per-scene edit UI**: scenes hebben expanded/collapsed mode, edit-knop per scene, switch tussen scenes commit huidige scene direct (image-upload + image-remove ook). Save-Session commit alleen de index.
- [x] P1 — Image compression scene uploads: `maxW 1200→1000`, `quality 0.8→0.72`.

**Ronde 5 (follow-up):**
- [x] P1 — Right sidebar `.sidebar-panel` weg (CSS-only, `display:none`); `#rs-char-toggle` ook verborgen.
- [x] P1 — Character page L/R padding sweep (`body[data-route^="characters/"] .main-content/.character-page { padding-inline: 0 !important }`).
- [x] P1 — Banner upload-knoppen vertical stack (kolom rechtsboven, 130px breed).
- [x] P1 — Character page `block-size: calc(100dvh - 5rem)` voor FAB-clearance. Skills default size `5×15` (was `3×10`).
- [x] P1 — Campaign cards `minmax(340px,1fr)`. Edit modal uitgebreid naar 4 velden (Title, Next Session, World name, DM-select).
- [x] P0 — Timeline events → **Sessions + Scenes**. Nieuwe data model `{title, session, scenes:[{layout, text, image}]}`; legacy migratie via `migrateTimelineEvent()`. 4 scene-layouts (Just Text / Image Left / Image Right / Just Image). Form: Chapter dropdown + Session# + Title + dynamische scene-blokken + Save/Cancel/Delete. Home Recent links scrollen naar specifieke session via `dw_timeline_focus_session` flag.

**Ronde 4 (follow-up):**
- [x] P0 — Profile Picture upload-knop écht gefixt. Ronde-1 canvas-listener fix was correct maar onvoldoende. Echte cause: pointerup → `render()` vervangt SVG vóór click; async handler verliest transient user-activation → file picker opent nooit. Fix: map-action sync in `onPointerDown` (preventDefault + sync handleMapAction + return zonder pendingGesture).

**Ronde 3 (follow-up):**
- [x] P2 — Homepage Recent events ook op session-# desc (was storage-order).
- [x] P1 — Mobile/coarse-pointer: tap op `.welcome-banner` toggle `show-upload-slots` class (revealen upload-knoppen). Tap buiten sluit hem; tap op slot/clear wordt genegeerd zodat de eigen actie doorgaat.

**Ronde 2 (follow-up):**
- [x] P0 — Navbar-context fix: route `/home` was niet opgenomen in `inCampaignView`-array → na campagne-klik bleef de Welcome-navbar zichtbaar. `'home'` toegevoegd; fallback routePart `'dashboard'` → `'home'`.
- [x] P1 — Banner-knoppen Engels (één-woord) + hover-only zichtbaar (`:hover`/`:focus-within` op `.welcome-banner`).
- [x] P1 — Session/Level `-/+` alleen visible bij hover over eigen card.
- [x] P1 — Recent-events op homepage: 9-regel ellipsis (`-webkit-line-clamp`), card is nu `<a href="#/timeline">`.
- [x] P1 — Timeline events gesorteerd op session-nummer descending (recent bovenaan); events zonder session-# zakken naar beneden.

## Milestone 6 — Modern CSS / responsive / a11y polish
Status: gepland — onderzoek loopt 2026-05-15 (modern-css skill)

- [ ] P2 — CSS-modernization audit (cascade layers, container queries, :has(), color-mix, light-dark())
- [ ] P2 — Touch targets <44px op spell/feat lists (mobile)
- [ ] P2 — Keyboard nav broken (tab-door-spells)
- [ ] P2 — Dark mode contrast-issues (sommige links/buttons onzichtbaar)
- [ ] P2 — Mobile auto-square widgets geven loze ruimte voor wide widgets
- [ ] P3 — Ability radar chart labels cut off op mobile
- [ ] P3 — Level-up animation feedback

## Milestone 7 — Infrastructure
- [ ] P1 — Migratie GitHub Pages → Cloudflare Pages (workspace-default), of beslis: legacy houden tot Sanctum klaar is
- [ ] P2 — Repo privé maken (bij Sanctum migratie — zie `project_dnd_within_migration.md` memory)
- [ ] P3 — `sw.js` cache version → hash-based asset manifest (geen handmatig bumpen)
- [ ] P3 — Oude `dw/bugs` (74 fixed) archiveren onder Nexus `/shared/bugs` of read-only laten

## Milestone 8 — Quality / bugs (audit P3)
- [ ] P3 — `open-create-wizard` button handler binden
- [ ] P3 — `send-whisper` handler binden
- [ ] P3 — `asi-content` selector hernoemen naar `.levelup-asi-detail`
- [ ] P3 — Initiative drag-drop ghost cleanup bij page change
- [ ] P3 — Firebase sync error-handling (`sync.js` try/catch)
- [ ] P3 — i18n keys voor wizard.error.step1 + nieuwe 5.5e content
- [ ] P3 — meetsPrereq() strOrDex/strOrCha logica
- [ ] P3 — Temp HP stacking = replace-if-higher
- [ ] P3 — Warlock pact slots short rest refresh

Zie `Testresults.md` voor de volledige issue-lijst met file:line referenties.

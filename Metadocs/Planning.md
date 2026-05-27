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
- [~] P0 — WGI-M1: V8 monoliet (5145 r) split naar 8 `.js` + `wg-style.css` in `Tools/Widget Grid V8/dist/`. Standalone test. Géén DnD-impact.
- [ ] P0 — WGI-M2: symbool-merges (`showToast` → DnD, `FIREBASE_DB` → `FIREBASE_CONFIG.databaseURL`, `MAPS_CACHE` → localStorage, `WG_CHAR_CACHE` leest via `loadCharConfig/State/Image`)
- [ ] P0 — WGI-M3: kopiëer `wg-*` naar DnD-root + `<script>`/`<link>` tags. Tag `pre-widget-grid` vóór commit.
- [ ] P0 — WGI-M4: `WidgetGrid.mount/unmount` bedraden in `app.js`. Slop `.character-page` grid (`style.css:830-872`). Verberg DnD-navbar op character-route.
- [ ] P1 — WGI-M5: `@scope (.character-page)` om `wg-style.css` + theme-bridge naar DnD-tokens incl. `--char-accent`
- [ ] P1 — WGI-M6: V11 edit-flow via direct REST-PATCH + targeted localStorage update (geen full `syncUpload`)
- [ ] P1 — WGI-M7: polish — verwijder V8 `#characterSelect`, opruimen dode `.is-edit-mode` rules, smoke-test alle 5 situations × 3 devices

**Branch:** `josh/widget-grid-inline`, 7 commits (één per M-fase).
**Architect-rapport:** zie sessie-notes 2026-05-27 (vanilla-js-architect opus max).
**Originele V8 Metadocs:** `Projects/Tools/Widget Grid V8/Metadocs/` — Architecture.md (V9-paginering), V11-Handoff.md (afgesloten V11-features), V11-Dashboards-Spec.md.

## Milestone 5-legacy — Dashboard (archief)
- [x] P1 — Widget grid + 22 widgets in registry (verwijderd in nuke)
- [x] P1 — Drag/resize edit mode + per-breakpoint layouts (verwijderd in nuke)
- [x] P1 — Widget Editor externe app (Cloudflare Pages) (verwijderd in nuke)

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

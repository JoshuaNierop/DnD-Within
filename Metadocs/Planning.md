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
Status: in progress sinds 2026-05-07

- [x] P1 — Widget grid + 22 widgets in registry
- [x] P1 — Drag/resize edit mode + per-breakpoint layouts
- [x] P1 — Widget Editor externe app (Cloudflare Pages)
- [ ] P2 — Touch drag verfijnen op mobiel (echt device testen)
- [ ] P2 — Templates kopiëren tussen characters via Tab manage modal
- [ ] P2 — Family-diagram widget hooken aan family system
- [ ] P2 — Save widget defs vanuit Widget Editor naar Firebase
- [ ] P3 — Undo/redo in edit mode
- [ ] P3 — "Unsaved changes" indicator
- [ ] P3 — Default layouts Overview/Combat dichter plaatsen

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

# D&D Within — Valoria Campaign

Interactive D&D 5.5e character sheet en campaign management SPA voor 8 spelers.

## ⚠️ Taal — ALTIJD Engels (uitzondering op global rule)
**Alle gebruiker-zichtbare UI-teksten én content in D&D Within zijn in het Engels** — knoppen, labels, placeholders, toasts, confirm/prompt/alert-dialogen, lege-staat-teksten, én game-content/data: feature-descriptions, spell-teksten, tooltips, metamagic/feats/subclass-uitleg in `data.js`. Dit overschrijft de global conventie "Nederlandse UI-teksten voor personal projecten". Denk hier altijd aan bij werk aan dit project, ook zonder dat Joshua het benoemt.
- Nieuwe strings: Engels, of via de i18n-laag (NL/EN); bij `{nl, en}`-objecten is `en` verplicht en leidend (widgets renderen `desc.en` eerst).
- Nieuwe `data.js`-entries: descriptions in het Engels (dual `{nl, en}` mag, Engels-only volstaat).
- Code/comments blijven Engels zoals altijd.
- Bij twijfel of je een Nederlandse string/description tegenkomt → vertalen naar Engels.

## Tech Stack
- Vanilla JavaScript + Firebase Realtime Database (REST API)
- Clean-URL SPA router (History API: `navigate()`/`getRoute()`/`initRouter()` in `core.js`) — links zijn echte paden `/maps`, een document-level click-interceptor vangt interne `<a href="/...">`. `<base href="/">` in index.html zodat relatieve assets op diepe routes laden.
- Custom CSS met responsive/touch support
- Geen build tools — direct browser

## Key Files
- `index.html` — SPA shell
Alles staat in de repo-root (geen `js/`- of `css/`-map).
- `app.js` / `core.js` / `events.js` / `ui-*.js` — router, auth, pagina's, vensters (`ui-modals.js` heeft `showPromptModal`/`showConfirmModal`/`showAlertModal`)
- `engine.js` — D&D-regels (scores, HP/AC, spells, level-up-delta, skills)
- `data.js` (~530 kB) + `data-rules.js` — classes, species, feats, spells, items, resources
- `monster-db.js` + `monsters-data.js` (lazy, gegenereerd) — Monster Manual 2025-basis voor Creatures (503 monsters; niet-SRD-tekst in eigen woorden); regels + build in `Metadocs/Monsters/`
- `wg-*.js` + `wg-style.css` — character-dashboard (widget grid, level-up, prepare, rest, combat)
- `wg-defaults.js` — GEGENEREERD (niet met de hand bewerken): fitted vormen gemeten in de app met `Metadocs/Dashboards/measure-shapes.js` (in de browser: `await wgMeasureShapes()` op een character-pagina in tablet- of desktopmodus → `fitted-shapes-<device>.json`) → `build-fitted.mjs <device> <id>` pakt ze (desktop: `fit-solver.mjs` exact; tablet: `page-packer.mjs` in prioriteitsvolgorde over 23 × 30-pagina's; `ascii.mjs <id>` toont het resultaat) → `node Metadocs/Dashboards/default-layouts.mjs`. Tablet gebruikt vaste maten `WG_TABLET_CFG` (13px font) — wie die wijzigt moet opnieuw meten. Resultaat: voorgestelde layout per character/tab/device; lege tabs worden bij laden gevuld (`wgSeedEmptySlots` in `wg-firebase.js`), knop "Reset to suggested layout"
- `wg-conditions.js` — Conditions-widget (Heroic Inspiration, Exhaustion via `getExhaustion`, Concentration + CON-save bij schade, Arcane Ward HP)
- `wg-saves.js` — Saving Throws-widget (bonus uit `getSaveBonus` in `engine.js`, situationele effecten als hover)
- `wg-turn.js` — Your Turn-widget + actieve spell-effecten (`state.activeEffects`, aftellen via encounter-rondes); `wg-glossary.js` — regels-glossary + term-index voor geneste tooltips (tooltip-laag zelf in `wg-events.js`)
- `style.css` — overige styles
- `mobile.css` + `mobile.js` (`DWMobile`) + `wg-mobile.js` — telefoonmodus (< 700px, `html.is-mobile`): tab bar onderin, More-sheet (nav + dice/notes/search/chat), alle modals als bottom sheet, dashboards één kolom afgeleid van de desktop-layout (nooit opgeslagen), swipe tussen situatie-tabs. Mobiele regels die wg-style's `@scope (.character-page)` moeten overrulen krijgen de prefix `html.is-mobile`
- Tests: `node Metadocs/LevelingUp/build-smoke.mjs [level]`, `node Metadocs/LevelingUp/ui-smoke.mjs` en `node Metadocs/LevelingUp/turn-smoke.mjs` (Your Turn, spell-countdown, tooltip-termen)

## Firebase
- Project: `dnd-within-firebase`
- Realtime Database met REST API
- Security rules — ✅ verlengd tot 2027-04-28 (deployed 2026-04-16, commit `883e952`)

## Bug Tracker
- In-app reporter (debug-mode FAB) schrijft naar **centrale Nexus hub**: `/shared/bugs` op `nexus-12fc7-default-rtdb.europe-west1.firebasedatabase.app`
- Project-key in hub: `dnd-within`
- Read/fix flow: gebruik `/bugfix dnd-within` slash-command
- Legacy endpoint `dnd-within-firebase/dw/bugs` is read-only archive (74 historische fixed bugs); geen writes meer
- Zie `~/Documents/Claude/Modules/bugreport/README.md` voor schema + integratie

## Party
9 characters (ren, saya, ancha, varragoth, barius, io, lira, nero, addybluelight) — elk met unieke class/species/subclass

## Features
- Animated glow ring portrait border (conic-gradient, rotating taper)
- Spell prep system, item tracking, combat stats
- Maps met portal linking tussen dimensies
- Notes (6 layouts), Timeline events
- Engels-only (i18n-laag staat vast op `en`)

## Deploy
- Live: **Cloudflare Pages** `https://dnd-within.pages.dev` (Git-gekoppeld aan `JoshuaNierop/DnD-Within`, branch `master`, geen build; `_redirects` levert de SPA-fallback).
- De oude GitHub Pages-kopie (joshuanierop.github.io/DnD-Within) is kapot door de clean URLs en moet nog uitgezet worden (Todo).

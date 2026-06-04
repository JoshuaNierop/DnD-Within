---
name: dnd-within
category: Sites
complexity: high
stack: [vanilla-js, firebase-rtdb, clean-url-router, custom-css, spa]
---

# D&D Within — Valoria Campaign

Interactive D&D 5.5e (2024 PHB) character sheet + campaign management SPA voor 8 spelers.

## Wat het is
- Per-character sheets met full 2024-PHB mechanics (ability scores, ASI/feat tracks, spell prep, weapon mastery, third-caster slots, etc.)
- Dashboard met drag-and-drop widget grid (22 widget types, per-breakpoint layouts)
- Multi-campaign systeem met DM panel (NPC management, family trees, initiative tracker, dice tools)
- Maps met portal-linking tussen dimensies, Notes (6 layouts), Timeline events
- Multi-language (NL/EN), Admin mode, in-app bug reporter naar Nexus hub
- Externe Widget Editor in aparte repo (Cloudflare Pages) — bewerkt widget defs

## Stack
- **Frontend:** Vanilla JS (ES6+), geen build tools, **clean-URL SPA router** (History API: `navigate()`/`getRoute()`/`initRouter()` in `core.js` + document-level link-interceptor; `<base href="/">`). Geen `#` meer in de URL.
- **Backend:** Firebase Realtime Database via REST API (geen SDK), shared `nexus-12fc7` voor bugs
- **Hosting:** **Cloudflare Pages** — live op `dnd-within.pages.dev` (sinds 2026-06-04). `_redirects` (`/* /index.html 200`) levert de SPA-fallback zodat clean URLs op refresh/deeplink werken. ⚠️ GitHub Pages nog uitzetten (serveert anders de oude broken `/DnD-Within/`-subpath).
- **CSS:** ~8600 regels in `style.css` + ~900 in `dashboard.css`, custom properties, dark-mode (hardcoded — light-dark() nog niet), responsive + touch
- **Hardware:** Geen build/test pipeline, draait direct in browser

## Key files
- `index.html` — SPA shell, `<base href="/">`, script-tags + `?v=N` cache-busters (auto-bump hook)
- `core.js` — **clean-URL router** (`navigate`/`getRoute`/`initRouter` + link-interceptor), auth, state, utils
- `app.js` — DOMContentLoaded bootstrap, page handlers, modal flow
- `engine.js` — pure 5.5e mechanics (ability score calc, HP, AC, spell slots, prepared count)
- `data.js` (~3000+ LOC) — classes, subclasses, species, backgrounds, feats, spells, items
- `style.css` (~8800 LOC) + `wg-style.css` — alle UI styles
- `wg-*.js` (`wg-state/engine/render/events/ui/firebase/data/mount`) — widget-grid dashboard systeem
- `ui-pages.js`, `ui-modals.js`, `ui-world.js`, `ui-settings.js` — views (lore/maps/timeline/notes/settings/modals)
- `events.js` — event delegation (`#app` click) + maps/timeline/lore handlers
- `sync.js` — Firebase REST integratie + realtime listeners (`applyLeaves` order-onafhankelijke compare)
- `storage.js` — Cloudinary image-abstractie (`buildFolder` = single source voor de media-tree)
- `i18n.js` — NL/EN translation keys
- `mentions.js`, `effects.js`, `families.js`, `familyDiagram.js`, `familyLayout.js` — extras
- `_redirects` — Cloudflare Pages SPA-fallback
- `sw.js` — service worker (online-only: index.html unregistert 'm actief)
- `database.rules.json` — Firebase rules (verlengd tot 2027-04-28)

## Run
```
git clone <repo> && cd "D&D Within"
# open index.html in browser, OR:
python -m http.server 8765   # localhost:8765
```

Login: `admin/admin` (DM mode) of een spelernaam (per-character login).

## Deploy
`git push origin master` → **Cloudflare Pages** auto-deploy (`dnd-within.pages.dev`). `?v=N` op css/js wordt auto-gebumpt door PostToolUse-hook. ⚠️ GitHub Pages nog uitzetten (Settings → Pages → Source: None).

## Bug tracking
In-app FAB (debug-mode) → `/shared/bugs` op centrale Nexus Firebase hub. Project-key `dnd-within`. Fix-flow: `/bugfix dnd-within` slash-command.

## Status
- Complexity: **high** — multi-module, Firebase sync, complex 5.5e calculations, shared state
- Hot file: `data.js` (3072+ regels, regelmatig gewijzigd)
- P0 audit (2026-04-13): ✅ alle 11 opgelost (2026-05-15)
- P1 ~18 items open (Testresults.md sectie 2)
- P2 ~15 items open (resource trackers, concentration, exhaustion)

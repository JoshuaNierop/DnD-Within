# D&D Within — Valoria Campaign

Interactive D&D 5.5e character sheet en campaign management SPA voor 8 spelers.

## Tech Stack
- Vanilla JavaScript + Firebase Realtime Database (REST API)
- Hash-based SPA router
- Custom CSS met responsive/touch support
- Geen build tools — direct browser

## Key Files
- `index.html` — SPA shell
- `js/app.js` — Router, auth, UI logic (~2800 lines)
- `js/engine.js` — D&D mechanics (ability scores, combat, leveling)
- `js/data.js` — Character/spell/item/race/class data (~1300 lines)
- `css/style.css` — Alle styles (~3500 lines)

## Firebase
- Project: `dnd-within-firebase`
- Realtime Database met REST API
- Test security rules — **verlopen 2026-04-28, moet voor die tijd gefixt worden!**

## Party
8 characters: Ren, Saya + 6 anderen — elk met unieke class/race/subclass

## Features
- Animated glow ring portrait border (conic-gradient, rotating taper)
- Spell prep system, item tracking, combat stats
- Maps met portal linking tussen dimensies
- Notes (6 layouts), Timeline events
- Multi-language (NL/EN), Admin mode (admin/admin)

## Deploy
GitHub Pages: `Spellforce1992/DnD-Within`
- `git push origin main` → auto-deploy

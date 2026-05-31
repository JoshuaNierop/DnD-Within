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
- Security rules — ✅ verlengd tot 2027-04-28 (deployed 2026-04-16, commit `883e952`)

## Bug Tracker
- In-app reporter (debug-mode FAB) schrijft naar **centrale Nexus hub**: `/shared/bugs` op `nexus-12fc7-default-rtdb.europe-west1.firebasedatabase.app`
- Project-key in hub: `dnd-within`
- Read/fix flow: gebruik `/bugfix dnd-within` slash-command
- Legacy endpoint `dnd-within-firebase/dw/bugs` is read-only archive (74 historische fixed bugs); geen writes meer
- Zie `~/Documents/Claude/Modules/bugreport/README.md` voor schema + integratie

## Party
8 characters: Ren, Saya + 6 anderen — elk met unieke class/race/subclass

## Features
- Animated glow ring portrait border (conic-gradient, rotating taper)
- Spell prep system, item tracking, combat stats
- Maps met portal linking tussen dimensies
- Notes (6 layouts), Timeline events
- Multi-language (NL/EN), Admin mode (admin/admin)

## Deploy
GitHub Pages: `JoshuaNierop/DnD-Within` — source branch `master`, path `/`
- `git push origin master` → auto-deploy
- Live: https://joshuanierop.github.io/DnD-Within/
- ⚠️ Cloudflare Pages migratie staat open (Todo "Hosting" P1) — nog niet geconfigureerd; geen `wrangler.toml` in repo, alleen stray `.wrangler/` cache (gitignored)

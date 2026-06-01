# Ontwerp — @-mention links + afbeelding-hergebruik (architect, 2026-06-01)

## Kernbevinding (raakt beide features)
De app heeft een **identiteit-probleem**: Characters / Timeline-sessions / Lore-articles hebben een **stabiele id**, maar **NPC's en lore-cat-entries worden via array-index aangesproken** (`data-npc-idx`, `data-entry-idx`). Ook de familie-koppeling van NPC's loopt via index (`findPrimaryFamilyByLink(null, String(idx))`) en is dus al fragiel.
➡️ **Fundering voor beide features: NPC's + lore-entries een stabiele `id` geven (+ eenmalige migratie).**

## Feature A — @-mention links
- **Linkbare types (MVP→later):**
  - MVP: **Characters** (id+route klaar), **NPCs** (id nodig + deep-link-focus), **Timeline sessions** (focus-flow bestaat al via `dw_timeline_focus_session`).
  - Fase 2: lore-cat entries (locations/items/factions/…), lore-articles.
  - Later/skip: families, maps.
- **Autocomplete op `<textarea>`:** `input`-listener → laatste `@woord` vóór cursor als zoekterm → popup met max ~8 hits (naam + type-badge + thumbnail) → ↑/↓/Enter/Esc. Popup-positie: **simpel** (onder het veld) voor MVP; "mooi" (exact bij cursor via mirror-div) is fase 2.
- **Opslagformaat:** `[[type:id|Weergavenaam]]` — id leidend (rename-proof), naam als snapshot/of live uit store.
- **Render zonder XSS (belangrijk):** eerst `escapeHtml` op hele string, dán token→veilige `<a>` (href zelf opbouwen uit type+id, id valideren `[a-z0-9_]`). Nieuwe helper `renderRichText()` vervangt kale `escapeHtml` op: scene-tekst, NPC-notes, lore-desc/notes, lore-article, Notes.
- **Landen:** kopieer de bestaande `dw_timeline_focus_session`-flow (`postRenderEffects` in app.js) → bij klik op een NPC/entry-link navigeer + open de juiste card + flash. Vereist stabiele id in de DOM.

## Feature B — Bestaande afbeelding hergebruiken
- **Bron = app-eigen stores, NIET Cloudinary listen** (unsigned kan niet listen; Admin API vereist secret). De app kent alle URLs al: `dw_img_<id>_<type>`, `npc.image`, lore `entry.image`, `scene.image`, banners, maps.
- **Gedeelde laag:** één `collectEntities()` → `{type,id,name,image,route}` voedt zowel de @-autocomplete als de image-picker (UI's blijven gescheiden).
- **UI:** "Kies bestaande"-knop naast elke upload-knop → modal met categorie-tabs + zoek + thumbnails → selecteren kopieert de URL (geen re-upload). Consistent met `renderNPCModal`/document-modal-handlers.
- **MVP-velden:** NPC-modal, lore-entry-modal, timeline-scene.
- **Delete-risico:** zelfde URL op meerdere plekken → verwijderen kan elders breken. Nu veilig (`del()` is no-op). Advies: bij live-delete alleen **ontkoppelen** (URL uit dat ene veld), asset laten staan (orphans onschadelijk op free tier).

## Beslissingen/vragen voor Joshua
1. Stabiele id's toevoegen aan NPC's + lore-entries als eerste stap (+ migratie)?
2. MVP-link-types = Characters + NPCs + Timeline-sessions — akkoord / mist er iets?
3. Bij hernoemen: link toont **actuele** naam of **snapshot**?
4. Autocomplete-popup simpel (onder veld) of mooi (bij cursor)?
5. Image-picker eerst bij NPC/lore-entry/scene — ook bij character-portret/banner?
6. Verwijderen van gedeelde afbeelding = alleen ontkoppelen (asset blijft)?

_(Volledige analyse met regelnummers: architect-run 2026-06-01.)_

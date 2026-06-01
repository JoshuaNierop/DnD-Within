# D&D Within — To Do

## Cloudinary hiërarchie + @-links + afbeelding-hergebruik (2026-06-01)
Volledig ontwerp: `Metadocs/Design-Links-en-Image-Reuse.md`. Keuzes Joshua: vaste id's eerst · MVP-link-types = Characters + NPCs + Lore-kaarten · link toont actuele naam · image-picker bij NPC/Lore/Character-profiel (banners niet).

- [x] P1 — **Cloudinary-hiërarchie** mirror't lokale `DnD Within`-tree. `storage.js buildFolder()` = single source: `Characters/<Naam>/<type>` + `Campains/<Campagne>/{NPCs,Monsters,Items,Places,Religions,Factions,Events,Session,Backgrounds}/<entiteit>`. Cities+Locations+maps → Places. NPC/lore-uploads geven entiteitsnaam mee. Geverifieerd in browser. ⚠️ unsigned-upload kan bestandsnaam niet zetten → mapnaam = entiteit, file = auto-naam. ⚠️ 26 oude migratie-images staan nog onder oude root `dnd-within/`.
- [x] P1 — **Stabiele entity-id's** (fundering): `ensureEntityIds()` backfillt NPC's + lore-entries idempotent na Firebase-download (+ offline fallback). Alle bestaande NPC's hadden al id.
- [x] P1 — **Feature B — afbeelding hergebruiken (live referenties)**: gedeelde `collectEntities()` + image-picker. Model: originelen (Character-profiel + Lore-entiteiten) = alleen uploaden; verwijzende plekken (Timeline-scenes + Notes) krijgen "Kies bestaande" (naast eigen upload). Verwijzing = `@ref:type:id`, opgelost via `resolveImageSrc()` naar de actuele bron-afbeelding (live: bron wijzigen → overal bij). Geverifieerd in browser.
- [x] P1 — **Feature A — @-mention links**: `mentions.js` autocomplete in `.edit-textarea` → token `[[type:id|Naam]]`; `renderRichText()` rendert veilige links met live naam (toegepast op scene-tekst, NPC-notes, lore-desc/notes, lore-articles, Notes). Klik → `applyEntityFocus()` opent/markeert de kaart. Types: Characters, NPCs, Lore-kaarten. Geverifieerd (incl. XSS-escaping).

### Lore-tabs + links + Search + Cloudinary spaties (2026-06-01, ronde 2)
- [x] P1 — Lore: **Families**-tab toegevoegd (rendert family-diagrams via `renderDMFamilies`); **The Party**-tab verwijderd; default-tab = NPCs.
- [x] P2 — @-mention links: `@`-teken weg + subtielere styling (zachte tint + fijne onderlijn, feller bij hover; geen felle per-type kleuren).
- [x] P2 — Suggestie/zoek type-badge nu **enkelvoud + hoofdletters** (CHARACTER/NPC/LOCATION/ITEM/…) via gedeelde `entityTypeLabel()`.
- [x] P1 — **Globale Search**: groene FAB (slot-4) opent command-palette overlay. Compacte klikbare referentielijst (top 8) + "Toon alle resultaten" (vol overzicht met omschrijving). Klik → navigeren + kaart oplichten. `collectEntities` verrijkt met `desc`.
- [x] P1 — Cloudinary: folder-namen **met spaties** (geen underscores) via `sanitizeFolder`; `migrateAll` naar nieuwe root; audit → niets schrijft nog naar oude mappen.

#### Cloudinary opschoning — TODO Joshua (handmatig, ik heb geen API-secret)
Keuze: **alleen junk weg, `DnD_Within` (underscore) laten staan**. Verwijder in de Cloudinary Media Library deze mappen:
- `dnd-within` (hyphen, oude migratie-root) — ⚠️ character-portretten/banner die hier nog uit geladen worden breken → opnieuw uploaden (zijn originelen).
- de oude `DnD Within`-junk subfolders: `campaign`, `test`, `world` (NIET de hele `DnD Within`-root: daar landen nieuwe spatie-uploads in `Campains`/`Characters`).
- losse `test`-root + map-afbeeldingen (komen voortaan onder Locations/Places).
- `DnD_Within` (underscore) **laten staan** — die URL's staan nog in de DB en werken; later evt. consolideren naar spaties (vereist DB-URL-herschrijving).
Niets in de code herstelt deze mappen (audit ok). Mist er daarna een afbeelding → opnieuw uploaden in de juiste (spatie-)map.

#### Cloudinary tree-migratie (2026-06-01, ronde 3)
- [x] P1 — `DWImages.migrateImagesToTree({dryRun})` (storage.js): re-homed alle entity-afbeeldingen naar de spatie-tree via unsigned upload-by-URL + DB-URL-herschrijving (browser-only, geen secret). **Live uitgevoerd**: 8 character-portretten → `DnD Within/Characters/<Naam>/portrait`. Idempotent (decodeert %20).
- [!] P1 — **Mara Veldin + Borin Stonehand NPC-afbeeldingen zijn weg** (stonden onder `dnd-within/world/npcs/`, server-side 404 → al verwijderd bij junk-cleanup; leken te laden door browser-cache). DB wijst nog naar de dode URL → **Joshua moet die 2 opnieuw uploaden** in de NPC-editor (landen dan in `DnD Within/.../NPCs/<naam>`).
- [ ] P3 — Bevinding: de `DnD_Within` (underscore) mappen die in Cloudinary zichtbaar waren, waren **leeg/orphan** (geen DB-refs). Character-portretten stonden los in de root, NPC's onder `dnd-within`. Na de tree-migratie kan Joshua de losse root-assets + lege `DnD_Within`/`dnd-within` resten in de UI opruimen.
- [ ] P3 — Tree-URL's bevatten `%20` (spatie-encoding); `del()` (no-op nu) moet bij live-gaan de public_id decoderen voor een match.
- [~] P2 — Character-profielfoto = **originele bron** (alleen uploaden, geen pick-knop) → conform model, niets te doen. (Eerder dacht ik picker hier toe te voegen; vervalt.)
- [ ] P3 — @-links **Timeline-sessions** als type toevoegen (fase 2; focus-flow bestaat al via `dw_timeline_focus_session`).
- [ ] P3 — Familie-koppeling van NPC's loopt nog via array-index (`findPrimaryFamilyByLink(null, String(idx))`); migreren naar stabiele id (nu hebben NPC's wél id's).
- [ ] P3 — Bij live-delete van gedeelde afbeelding: alleen ontkoppelen (asset laten staan) — nu nog n.v.t. (`del()` is no-op).
- [ ] P3 — Oude 26 Cloudinary-images onder `dnd-within/` herinpassen in nieuwe `DnD Within/`-tree.
- [ ] P2 — Autocomplete-popup mooier positioneren (nu onder het veld; "bij cursor" = mirror-div, fase 2).

## Timeline & Lore overhaul (2026-06-01)
Volledige prompt: `Metadocs/Prompt-Timeline-Lore-2026-06-01.md`. Keuzes Joshua: bug#3 = 50% grotere gap afbeelding↔tekst · NPC-expand = inline isotope-stijl · extra lore-tabs = Locations/Places, Events/History, Articles (vrije tekst).

### Timeline
- [x] P0 — Bug: editor sluit bij scene-commit. Root cause: `sync.js` `firebasePathToLocalKey` regel 161 catch-all `world/timeline` → `dw_timeline` (legacy key). Eigen scene-write echoot via `child_changed` op `world`, mapt fout naar `dw_timeline` (niet in localStorage) → `changed>0` → `renderApp()` → editor dicht. Fix: container `world/timeline` (+ `world/timeline/scenes`) → `return null` zodat `extractLeaves` naar `dw_chapters`/`dw_scene_<id>` recurst (die matchen → changed 0). ⚠️ Live browser-verificatie open.
- [x] P1 — CSS: scene-afbeelding top-align met `.scene-split-text` (eerste `<p>` `margin-top:0`). `style.css` ~4585.
- [x] P2 — CSS: gap afbeelding↔tekst 50% groter (1rem → 1.5rem) op `.scene-split-img` margin.
- [x] P1 — Sessie-volgorde op timeline van laag→hoog (chronologisch top→beneden). `ui-world.js` `renderTimeline` sort `nb-na` → `na-nb`. Content ongemoeid.

### Lore
- [x] P1 — Lore-pagina met tabbladen (`ui-world.js` `LORE_TABS` + `renderLoreTabBar`): Party, NPCs, Items, Religions, Factions, Cities, Locations, Monsters, Events, Articles. NPCs verplaatst van DM tools → Lore-tab (`renderDMPage` npcs-sectie redirect naar `#/lore/npcs`). Getest in browser: 10 tabs renderen, geen console-errors.
- [x] P1 — NPC-tab (`renderNPCTracker`): searchbar (`#npc-search`) + disposition-chips + faction-dropdown + DM "huidig jaar"-veld voor age-berekening. Vaste 2:3 portret-cards (naam + afbeelding/initiaal). Inline expand (isotope-benadering: `grid-column:1/-1` + `grid-auto-flow:row dense`, accordion-gedrag). Velden: born+age, race, class, relation, family, faction, religion, location, likes, dislikes, pets, notes + familie-diagram als gelinkt. Getest: add→render→expand werkt.
- [x] P2 — NPC edit-form: `prompt()`-keten → echte modal (`renderNPCModal`/`openNPCModal`/`saveNPCModal`) met alle velden + image-upload (DWImages → `world/npcs/...`). Modal-handlers op document-niveau (modal hangt aan body).
- [x] P1 — Generieke categorie-tabs (items/religions/factions/cities/locations/monsters/events): gedeeld entry-model (naam+afbeelding+omschrijving+notities) via `renderLoreCategory` + `dw_lore_cats` store, search + CRUD-modal. Getest: add→persist→expand werkt. `dw_lore_cats` toegevoegd aan `sync.js` (→ `world/lore_cats`).

#### Open voor review (Joshua)
- [ ] P1 — **Bug #1 live-verificatie**: editor-close fix is de self-echo van de eigen client (`world/timeline` mapte fout naar `dw_timeline`). Statisch + single-client gefixt; het multi-client scenario (2 windows tegelijk) kon ik niet reproduceren — graag in de praktijk testen.
- [ ] P3 — Cities vs Locations overlappen (beide tabs op jouw verzoek). Eventueel later Cities als subset van Locations.
- [ ] P3 — Generieke categorieën delen één simpel entry-model. Categorie-specifieke velden (bv. Monsters: CR/HP/type, Religions: pantheon) zijn later toe te voegen.
- [ ] P3 — NPC-age leunt op een handmatig "huidig jaar"-veld in de NPC-toolbar (opgeslagen in `dw_npcs.currentYear`). Overweeg dit campagne-breed te koppelen aan een wereld-kalender.
- [ ] P3 — Na artikel-save landt de redirect op de Party-tab i.p.v. Articles-tab (bestaande `save-lore` navigeert naar `#/lore`). Kosmetisch.

## Homepage & UI tweaks — ronde 9 (2026-05-30 12:30)

- [x] P1 — Recent-event description was all-caps. Root cause: `<a class="dash-recent-event timeline-session">` erfde de bestaande `.timeline-session { text-transform: uppercase }` regel (regel 5279 — bedoeld voor de session-badge in de timeline). De `timeline-session` modifier-class is uit het anchor weggehaald (border-left was al gold via base rule), en een defensieve override op `.dash-recent-event` + `.dash-recent-desc` + `p` zet text-transform/letter-spacing terug naar normaal.
- [x] P0 — Image storage backend: `storage.js` (DWImages) LIVE met base64-fallback. Volledig plan + taxonomie → `Metadocs/Backend-Restructure.md`.
- [x] P1 — Bug: profielfoto zichtbaar in widget maar niet op home char-card (`lira`/Lyra). Root cause: RTDB ~6MB > localStorage ~5MB → `applyLeaves` setItem crashte op quota zonder catch → latere images landden niet lokaal. Fix: try-catch in `sync.js applyLeaves` + `hydrateCharCardPortraits()` haalt ontbrekende portretten direct uit Firebase (zonder lokaal te cachen). Commit `9e0b751`. ⚠️ pas volledig bevestigd na browser-check.
- [x] P1 — Bug: banner-upload-slots te breed, overlappen "Welcome to Valoria". Fix: slots smaller (104px/0.62rem/krappere padding). Commit `9e0b751`.
- [x] P2 — Image-upload: jpg-conversie nu op álle paden. `events.js` had het al (canvas→jpeg); `wg-events.js` (widget portrait + map) nu ook via nieuwe `wgFileToJpeg()` helper (max 1200px, q0.8).
- [x] P2 — Timeline scene-afbeeldingen 75% kleiner weergegeven in sessies (CSS `.timeline-session-block`/`.scene-block-readonly`: split-img clamp 26%, image-only max-width 75%). Editor-preview ongewijzigd.

## Backend 4-categorie restructure (2026-05-30)
Beslissingen bevestigd: E5.0=2014 PHB / E5.5=2024 PHB · gamedata blijft in code · **multi-campaign vanaf start**.
- [x] P0 — ~~Firebase Storage activeren~~ → **vervangen door Cloudinary**. Firebase Storage vereist sinds eind 2024 het Blaze-plan (creditcard); Joshua wil geen card. `storage.js` (DWImages) herschreven naar Cloudinary unsigned upload (REST, geen SDK). Publieke API + base64-fallback ongewijzigd → callers (core/events/sync/wg-events) intact. `firebase-storage-compat.js` SDK + `storage.rules` verwijderd.
- [x] P0 — **Cloudinary account-setup**: account live, cloud `dqmdh3b4d`, unsigned preset `dnd_within`. `CLOUD_NAME` + `UPLOAD_PRESET` ingevuld in `storage.js`. Code geeft elke live upload een unieke public_id (we leunen NIET op de overwrite-instelling — unsigned mag niet overschrijven).
- [x] P1 — **Migratie gedraaid + geverifieerd** (2026-06-01, via Playwright op live site als admin): `migrateAll()` → 26/26 base64-images naar Cloudinary, 0 failed, ~5,6 MB bespaard. localStorage **~6 MB → 46 KB**, 0 base64 over in DB. Alle 8 portretten + banner laden van Cloudinary, 0 broken.
- [x] P3 — Cosmetisch opgelost: uploads sturen nu `folder` mee (unsigned honoreert dat wél, `public_id` niet). Nieuwe assets landen in `dnd-within/<cat>/<subpath>/<auto-naam>`. De 26 al-gemigreerde images staan nog met random naam in root — herschikken kan zodra delete live is (re-upload + oude weggooien).
- [~] P1 — **Cloudinary delete via Cloudflare Worker** — gebouwd in `cloudinary-worker/` (worker.js + wrangler.toml + README). Prefix-locked op `dnd-within/`, Origin-check + shared-token. `storage.js del()` werkt nu echt (parse public_id uit URL → POST naar Worker), ingehaakt in map-delete (events.js + wg-events.js) + scene-delete (ui-world.js). **Wacht op Joshua**: `wrangler secret put CLOUDINARY_API_SECRET` + `wrangler deploy`, dan Worker-URL doorgeven → invullen in `storage.js` `DELETE_WORKER_URL`. Tot dan is `del()` veilige no-op.
- [ ] P3 — Orphan-cleanup bij vervangen: bij upload van een nieuw portret/map/banner over een oude wordt de oude Cloudinary-image nu nog niet opgeruimd (alleen expliciete deletes). Old URL grijpen vóór overwrite in de save-handlers (core.js, wg-events.js uploadPortrait, events.js banner/scene).
- [ ] P3 — 26 root-orphans + test-assets (`dnd-within/test/*`, `_selftest`) opruimen zodra delete live is.
- [x] P2 — Repo-cleanup: 17 ongebruikte campagne-images (Ren/Saya/Banners/Valoria Map/etc., 0 refs in actieve code) verwijderd; `.wrangler/` (build-cache) + `_backups/` (lokale DB-backups, 6MB) gegitignored. Commit `3929f3e`.
- [ ] P1 — Fase 2: multi-campaign tekst-tree via sync.js keyToPath/pathToKey met dual-read fallback + Node round-trip test tegen `_backups/rtdb-full-*.json` (NIET blind live duwen — eerst offline bewezen)
- [ ] P3 — Fase 3: Obsidian-linking (stabiele entity-IDs + tag-index + [[npc:id]] in notes)

## Image storage — brainstorm (2026-05-30)

Joshua hit `QuotaExceededError` opnieuw na de migration-backup-cleanup. Per-scene blobs + base64 images blijven sneller groeien dan de 5 MB localStorage quota toelaat. Tijd om images naar een echte backend te verplaatsen — Realtime DB en localStorage zijn niet de juiste plek voor blob storage.

### Free-tier opties (ranked)

1. **Firebase Storage** (huidige stack) — 5 GB storage + 1 GB/dag download op Spark plan. Zelfde Firebase project; REST API werkt zonder SDK. Drop-in replacement: image upload → Firebase Storage URL → URL in scene-blob. Realtime DB sync stuurt alleen URLs rond.
2. **Cloudinary** — 25 GB storage + 25 GB bandwidth/maand. Anonymous upload via unsigned upload preset; automatic format conversion (webp/avif) + resize. Krachtigste optie maar extra service.
3. **Cloudflare R2** — 10 GB storage + zero egress. S3-compat; goedkoopste op lange termijn maar meeste setup (API keys, signed uploads).
4. **IndexedDB lokaal** — 50% van vrije disk per origin (honderden MB+). Geen sync tussen devices/spelers. Alleen geschikt als lokale cache, niet als source of truth.
5. **Imgur anonymous upload** — werkt direct, gratis API. Risico: ToS rond hot-linking, geen "private" content.

### Aanbevolen aanpak: Firebase Storage (optie 1) + lazy-load

- **Schrijf-pad**: scene-image upload → `PUT` naar `https://firebasestorage.googleapis.com/v0/b/<bucket>/o/scenes%2F<sceneId>.jpg?uploadType=media` met content-type `image/jpeg`. Response geeft `downloadTokens`; bouw publieke URL `https://firebasestorage.googleapis.com/v0/b/<bucket>/o/scenes%2F<sceneId>.jpg?alt=media&token=<t>`.
- **Lees-pad**: scene-blob bevat `imageUrl: "<firebase storage url>"` ipv data-URL. `<img src="...">` werkt direct (CDN cached).
- **localStorage**: alleen meta + URL — meestal <1 KB per scene. Quota probleem opgelost.
- **Realtime DB sync**: stuurt alleen scene-meta + URL. Geen 200 KB payloads meer.
- **Security rules**: Spark plan staat default open; voor publieke campagnes is dat OK. Voor private: rules op `scenes/*.jpg` zetten (alleen ingelogde users). Reads kunnen authenticated zijn — nu sync.js gebruikt geen Firebase Auth maar databaseURL met security rules die `auth != null` checken. Storage rules werken hetzelfde.
- **Migration**: bestaande base64 data-URLs in `dw_scene_*` automatisch uploaden naar Storage bij volgende load — `_migrateSceneImagesToStorage()`. Per scene: extract image, upload, vervang met URL.
- **Cleanup**: bij `deleteScene()` ook `DELETE` naar Storage URL.

### Risico's / open vragen

- Firebase Spark bandwidth: 1 GB/dag download. Bij 5 spelers + 30 scenes met afgemeten 200 KB images: ~30 MB per gebruiker per dag → 150 MB totaal → ruim binnen limit, behalve bij heel image-zware sessies.
- Cache headers: Firebase Storage stuurt by default 60s cache. Wil je langer (1 dag, 1 week) → metadata setten bij upload (`cacheControl: 'public, max-age=86400'`).
- Storage Security rules: standaard open op Spark — bij private campaigns moeten regels worden gezet. Niet kritiek voor MVP, wel pre-deploy.

## Homepage & UI tweaks — ronde 8 (2026-05-30 12:15)

- [x] P0 — **Scene image upload werkte niet bij eerste klik** (image was wel opgeslagen, maar pas zichtbaar na 2× klikken). Root cause: handler stond in `app.onclick`, terwijl `<input type="file">` zijn selectie via `change` aflevert. Eerste klik → `target.files` leeg → handler returnt zonder iets te doen. Tweede klik → files heeft nog de vorige selectie → handler werkt alsnog. Fix: handler verplaatst naar `app.onchange`; input wordt na succes gereset zodat dezelfde file kan worden gekozen.
- [x] P0 — **Edit Session: scene-tekst werd truncated weergegeven en bij klik op Edit Scene daadwerkelijk verloren**. Twee fixes:
  1. Collapsed scene-block toont nu de **volledige** scene-inhoud (full image, full text, met de echte layout — `.scene-block-readonly` deelt de timeline-rendering CSS). Geen `slice(0, 120)` meer.
  2. `_readSceneBlock()` voor een **collapsed** block leest niet meer uit de DOM-preview maar uit de per-scene blob (`_loadSceneBlob(sceneId)`). Switchen tussen scenes kan dus nooit tekst of een image downgraden.
- [x] P1 — Recent events op homepage: section title (`.dash-recent-section > .section-title`) niet meer uppercase; `.dash-recent-title` ook `text-transform: none` + `letter-spacing: normal` als safety override.

## Homepage & UI tweaks — ronde 7 (2026-05-30 12:00)

- [x] P1 — Character page: sidebars lopen tot bottom screen, dashboard grid loopt iets lager door (net boven FAB-buttons). Fix: `.character-page` weer op `block-size: 100dvh`; FAB-clearance verplaatst van `.character-page` naar `main.app-main` als `padding-block-end: 5rem` + `overflow-y: auto`. Sidebars (links + rechts) krijgen de volle 100dvh via flex-stretch.
- [x] P0 — Timeline scene save faalde met `QuotaExceededError` (`setItem 'dw_scene_<id>' exceeded the quota`). Root cause: migratie schreef de scenes naar nieuwe `dw_scene_*` blobs **én** bewaarde de oude monolithische timeline onder `dw_timeline_legacy_backup` — dat verdubbelde de localStorage-footprint en blies de 5 MB quota op. Fix:
  - `_migrateMonolithicTimeline()` schrijft geen backup meer en verwijdert eagerly elke gevonden `dw_timeline_legacy_backup` als de chapters-index al bestaat.
  - `_saveSceneBlob()` heeft een drietraps fallback: (1) probeer normale save → (2) bij quota error: `_freeUpStorage()` (drop legacy backup + leftover `dw_timeline`) en retry → (3) bij image-payload: `_shrinkDataUrl()` naar 700px / quality 0.6 en retry. Toast-feedback per pad.

## Homepage & UI tweaks — ronde 6 (2026-05-30 01:00)

- [x] P1 — Welcome banner dunner (`min-height: 140px`, `max-height: 200px` → 160/220 vanaf 700px), `padding: 1.25rem 1.5rem`. Image fit op hoogte via `background-size: auto 100%` + `background-position: center` + `background-repeat: no-repeat` zodat de afbeelding niet wordt gestrekt of gecropt.
- [x] P1 — Scene split image-left/right: tekst loopt nu **onder** de afbeelding door over de volle breedte. Implementatie via `float: inline-start/end` op `.scene-split-img` met `inline-size: clamp(140px, 35%, 320px)` + `text-align: justify; hyphens: auto;` op zowel `.scene-split-text` als `.scene p`.
- [x] P0 — **Timeline storage gesplitst per scene** om localStorage-quota en grote Firebase-write payloads te omzeilen. Nieuwe layout:
  - `dw_chapters` (klein, alleen index) ↔ Firebase `world/timeline/chapters`
  - `dw_scene_<id>` (één blob per scene incl. image) ↔ Firebase `world/timeline/scenes/<id>`
  - Migratie van oude monolithische `dw_timeline` gebeurt one-shot in `_migrateMonolithicTimeline()`; legacy blob bewaard onder `dw_timeline_legacy_backup` als safety net.
  - `sync.js` learns about `dw_chapters` + `dw_scene_*` prefix en mapping van/naar de Firebase paths.
  - `dw_party_level` ook toegevoegd aan sync (was P1 ronde 5 maar nog niet sync-known).
- [x] P0 — **Per-scene edit/save UI**. Scene-blokken hebben twee modes: expanded editor (layout-picker + image + textarea) en collapsed preview (layout-badge + thumbnail + first-line text + "Edit" knop). Eén scene tegelijk in edit-mode. Switch via "Edit Scene" op een ander blok of "+ Add Scene" → `_commitActiveScene()` schrijft de huidige scene naar zijn eigen blob (`saveScene(sceneId, …)`) voordat de DOM wordt herschikt. Image-upload + image-remove triggeren ook een direct per-scene save. Save-Session knop commit nog één keer de actieve scene en schrijft daarna alleen de chapters/sessions-index (tiny payload).
- [x] P1 — Image compression voor scene uploads: `maxW 1200 → 1000` + `quality 0.8 → 0.72` om per-scene payload kleiner te houden.

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

# D&D Within — Backend Restructure & Image Separation

Gestart 2026-05-30. Doel (Joshua): afbeeldingen los van de tekst-database opslaan, en
de backend indelen in 4 categorieën — **DnD General / DnD Version E5.0·E5.5 /
Campaign / Player** — zonder dataverlies en zonder de live site te breken. Op termijn:
Obsidian-stijl linking (tag-searchbar, naam-in-notes → NPC-page).

---

## Status

| Onderdeel | Status |
|---|---|
| Image-storage laag (`storage.js` + handlers) | ✅ **Live** (commit `67b75ca`) — veilig met base64-fallback |
| Firebase Storage geactiveerd | ❌ **Wacht op handmatige stap Joshua** (zie hieronder) |
| Migratie bestaande base64 → Storage | ⏸ Klaar (`DWImages.migrateAll()`), draaien ná activatie |
| 4-categorie tekst-DB re-tree | 📋 Ontworpen (hieronder), nog niet uitgevoerd — fase 2 |
| Obsidian-linking groundwork | 📋 Ontworpen, fase 3 |

---

## Probleemdiagnose (geverifieerd)

- RTDB ≈ **5.95 MB**, waarvan ~80% **base64-afbeeldingen**.
- De echte pijn is **localStorage-quota**: `sync.js` spiegelt de héle `dw/`-tree naar
  localStorage van **elke** gebruiker. Iedereen draagt dus alle 8 portretten + banners +
  scenes + maps lokaal mee → quota loopt vol → opslaan faalt.
- Afbeeldingen komen via **3 mechanismen** binnen:
  1. **Embedded base64 in JSON-blobs** (`events.js`): `scene.image`, `map.image`,
     `event.image`, `note.image`, `dashboard.bannerImages`, gallery.
  2. **Directe REST PUT** naar RTDB (`wg-events.js`): widget-portrait + widget-map.
  3. **`core.js saveImage()`** → `dw_img_`-keys (had geen callers; nu wel via DWImages).
- Weergave gebruikt overal `<img src="${value}">` → werkt met **zowel base64 als https-URL**.
  Daarom is het veranderen van alléén het opslagformaat (base64 → URL) transparant voor display.

---

## Oplossing fase 1 — Image-storage (LIVE)

Nieuwe module **`storage.js`** met globale `window.DWImages`:

- `DWImages.save(category, subpath, dataUrl)` → `Promise<value>`.
  Uploadt binair naar Firebase Storage en geeft een **https download-URL** terug; de
  tekst-DB bewaart alleen die korte URL i.p.v. een dikke base64-blob.
- **Veilig bij ontwerp:** als Storage uit staat / SDK ontbreekt / upload faalt, geeft
  `save()` de **originele base64 dataURL** terug. De caller slaat die op precies zoals
  vroeger → gedrag identiek, niets breekt. (Bewezen: 11/11 unit-tests PASS.)
- `DWImages.migrateAll({dryRun})` → eenmalige, **idempotente**, non-destructieve migratie
  van bestaande base64 in de RTDB naar Storage (base64 blijft staan tot upload slaagt).

Aangepaste upload-handlers (allemaal met fallback):
`wg-events.js` (portrait, widget-map), `events.js` (world map, scene, timeline-event,
dashboard-banner), `core.js saveImage` (player portrait/banner).

Image-taxonomie in Storage (spiegelt de 4 categorieën):
```
images/player/<charId>/<type>.<ext>
images/campaign/<campId>/maps/<id>.<ext>
images/campaign/<campId>/timeline/<id>.<ext>
images/campaign/<campId>/dashboard/<slot>.<ext>
images/campaign/<campId>/notes/<id>.<ext>
images/general/...           (gereserveerd)
images/version/<e50|e55>/... (gereserveerd)
```

Rules: `storage.rules` — publieke read, schrijven onder `images/**` (max 8 MB, alleen
`image/*`, time-gate 2027-04-28; spiegelt `database.rules.json`).

---

## ⚠️ Eenmalige handmatige stap (alleen Joshua kan dit)

Firebase Storage is nog niet geactiveerd op het project. De Storage-API kan **niet** via
CLI/REST aangezet worden — het vereist één klik in de console:

1. Ga naar **https://console.firebase.google.com/project/dnd-within-firebase/storage**
2. Klik **"Get Started"** → kies locatie (bv. `europe-west` of `us-central1`) → bevestig.
3. **Caveat (flag):** sinds ~okt 2024 vereisen *nieuwe* Storage-buckets vaak het
   **Blaze-plan** (pay-as-you-go). Er is een ruime gratis tier (≈5 GB opslag / 1 GB
   download per dag), dus voor 8 spelers blijft het in de praktijk gratis — maar je
   moet wél een creditcard koppelen. *Niet 100% zeker of Spark hier nog volstaat; de
   console wijst het uit bij "Get Started".*

Daarna draait Claude (of jij):
```bash
firebase deploy --only storage     # publiceert storage.rules
```
en in de browser-console van de live site (als admin ingelogd):
```js
await DWImages.migrateAll({ dryRun: true });  // telt base64-images, schrijft niets
await DWImages.migrateAll();                    // migreert echt naar Storage
```
Migratie is idempotent en non-destructief — veilig te herhalen.

**Tot deze stap gedaan is, draait de site gewoon door op base64 (huidige gedrag).**

---

## Fase 2 — 4-categorie tekst-DB re-tree (ontworpen, nog niet uitgevoerd)

### De 4 categorieën

1. **DnD General** — versie-onafhankelijke regels/content.
2. **DnD Version E5.0 / E5.5** — content die per versie verschilt.
3. **Campaign** — DM-content (maps, monsters, NPCs, naam, timeline, lore, quests, families).
4. **Player** — speler-content (naam, avatar, race-keuze, prepared spells, level, notes, dashboards).

### Bevestigde beslissingen (Joshua, 2026-05-30)

1. ✅ **E5.0 = 2014 PHB (origineel 5e), E5.5 = 2024 PHB (5.5e / "5.24").**
   Onderbouwing: `data.js` bevat al impliciete versie-markers — *"Half-Elf is VERWIJDERD
   in 5.5e (2024 PHB)"*, *"Ki hernoemd naar Focus Points"*, en `legacy: true`-vlaggen.
2. ✅ **Statische gamedata blijft in code** (`data.js`). De 4-categorie-tree gaat (voorlopig)
   alleen over Firebase-data (campaign/player). `general/` + `version/` worden gereserveerde,
   lege top-level nodes — klaar voor latere SRD-migratie, maar nu niet gevuld.
3. ✅ **Multi-campaign vanaf de start.** Alle campagne- én speler-data wordt fysiek genest
   onder een `campaignId`. Dit is invasiever dan single-campaign en vereist een grondige
   offline round-trip-test vóór het live gaat.

### Statische gamedata: General vs Version

| Entity | Categorie | Reden |
|---|---|---|
| Ability-mod formule, proficiency-bonus tabel | General | Nooit veranderd tussen versies |
| Spell-slot progressie (full/half/third/pact) | General | Identiek in beide versies |
| Skills-lijst (18 + ability-koppeling) | General | Stabiel |
| Damage-types, creature-types | General | Stabiele ontologie |
| Items (basis-stats, gewichten) | General | Basislijst stabiel… |
| Weapon-mastery properties | **Version (E5.5)** | …maar mastery bestaat niet in 2014 |
| Conditions | Split | 17 stabiel → General; **Exhaustion** herzien in 2024 → Version |
| Species/races (traits, speed, bonuses) | Version | 2024 anders + half-elf weg |
| Classes (features per level, Ki→Focus, ASI-levels) | Version | Substantieel verschillend |
| Subclasses | Version | Veel herschreven; scout = E5.0-legacy |
| Spells | Split | naam+level → General; mechanica/tekst → Version |
| Feats | Version | Origin-feats zijn 2024-nieuw |
| Backgrounds | Version | 2024 geeft ability-bonus + origin-feat |
| Monster statblocks | Split | generieke (MM) → Version; campagne-eigen → Campaign (`basedOn` ref) |

> **Belangrijk:** statische gamedata staat nu in **code** (`data.js`, 262 KB), niet in
> Firebase. Aanbeveling: laat 'm voorlopig in code; de 4-categorie-tree gaat eerst over
> de Firebase-data (campaign/player). Migratie van SRD-content naar Firebase is optioneel
> en pas zinvol als je 'm runtime wilt kunnen bewerken/versie-switchen.

### Player slaat keuzes op, niet definities

De speler kiest; de definitie leeft in General/Version. Engine zoekt op via ID (doet
`engine.js` al: `DATA.feats.find(f => f.name === choice.feat)`).

| Player slaat op | Definitie staat in |
|---|---|
| `race: "woodElf"` | Version → species.woodElf |
| `class: "ranger"`, `subclass: "gloomStalker"` | Version → classes.* |
| `background: "criminal"` | Version → backgrounds.* |
| `spellsPrepared: ["Fireball", …]` | Version → spellPool.* |
| `feats: ["Alert", …]` | Version → feats[name] |
| `proficiencies: ["Stealth", …]` | General → skills[name] |

Berekende scores (HP/AC/ability totals) **nooit** opslaan — engine herberekent uit inputs.

### Voorgestelde RTDB-boom (MULTI-campaign)

Multi-campaign vereist dat álle campagne- én speler-data onder een `campaignId` hangt.
Een speler kan in meerdere campagnes een character hebben; daarom hangt het character
onder de campagne (niet andersom), met een `userId`-veld voor eigenaarschap.

```
dw/
  general/                       # gereserveerd, leeg (SRD blijft in data.js)
  version/ e50/ e55/             # gereserveerd, leeg
  campaigns/<campId>/
    meta/                        # naam, dm, inviteCode, session_number, party_gold/level
    world/  maps/ timeline/ npcs/ quests/ families/ lore/ monsters/
    dm/                          # initiative, dm-notes
    characters/<charId>/         # config state dashboard notes whispers images(refs)
                                 #   + owner: <userId>
  users/<userId>/                # account-data (naam, rol) — campagne-onafhankelijk
    memberships/<campId>: true   # in welke campagnes zit deze user
  tags/<campId>/                 # Obsidian-index per campagne (fase 3)
  presence/                      # ongewijzigd (top-level)
```

**Migratiekeuze:** bestaande flat data (`dw/characters`, `dw/world`, `dw/campaign`,
`dw/dm`) wordt onder `dw/campaigns/valoria/` genest. De huidige `dw_campaigns`-lijst
(met `party`/`members`) levert de campagne-IDs; alles wat nu niet expliciet aan een
campagne hangt valt default naar `valoria`. De historische `dw/dw`-rommel + stray waarde
worden tijdens de migratie opgeruimd.

> **Risico (geflagd):** dit is de meest invasieve wijziging. `sync.js` listent op vaste
> top-level folders (`['characters','world','dm','campaign']`, regel ~322) — die moeten
> mee veranderen naar campaign-scoped refs, anders stopt realtime-sync. Daarom: eerst
> volledig offline bewijzen via Node round-trip tegen de backup, dual-read fallback live,
> en pas oude paden opruimen als de nieuwe geverifieerd zijn. **Niet blind live duwen.**

### Backward-compat strategie (breekt niets)

De hele app praat met Firebase via **één** mappingspunt: `keyToPath()` / `firebasePathToLocalKey()`
in `sync.js`. De re-tree gebeurt dáár, met **dual-read fallback**:
1. `keyToPath` schrijft naar het **nieuwe** pad.
2. `firebasePathToLocalKey` leest het nieuwe pad **én** valt terug op het oude pad zolang
   data nog niet gemigreerd is.
3. Eenmalig migratie-script (Node, getest tegen `_backups/rtdb-full-*.json` vóór live)
   kopieert oud → nieuw + ruimt op (incl. de historische `dw/dw`-rommel + stray waarde).

Volgorde: dual-read live → migreren → oude paden opruimen. Nooit oud weggooien vóór nieuw
geverifieerd is.

---

## Fase 3 — Obsidian-linking groundwork

Stabiele entity-IDs + een tag-index. Voorgestelde tag-dimensies:

| Dimensie | Voorbeelden | Op |
|---|---|---|
| `type` | spell, item, npc, location, monster, faction | alles |
| `school` | evocation, illusion, … | spells |
| `damage-type` | fire, cold, necrotic, … | spells, monsters, items |
| `creature-type` | undead, fey, fiend, … | monsters, NPCs |
| `faction` / `location` | campagne-specifiek | NPCs, locaties, events |
| `rarity` | common…artifact | items |
| `version` | E5.0, E5.5 | versie-delta-content |
| `status` | legacy, current, homebrew | speciale entities |

Notes verwijzen via `[[type:id]]` (bv. `[[npc:vraxthrell]]`); een tag-index
(`dw/tags/<tag> → [entityRefs]`) voedt de searchbar. NPC-namen in notes worden links
zodra elke NPC een stabiele ID heeft.

### Wrijfpunten (geflagd)
- Monster-statblocks zijn hybride (generiek=Version, campagne-variant=Campaign met `basedOn`).
- Ability-bonus komt in 2024 van **background**, niet race — bonus-tabel=Version, keuze=Player, resultaat=berekend.
- Custom DM-conditions = Campaign; de 17 PHB-conditions = General.
- Campaign-data linkt altijd via ID-refs naar andere categorieën, nooit dupliceren.

---

## Beslissingen — afgehandeld (2026-05-30)
1. ✅ E5.0 = 2014 PHB, E5.5 = 2024 PHB.
2. ✅ Gamedata blijft in code (`general/`+`version/` gereserveerd leeg).
3. ✅ Multi-campaign vanaf de start.
4. ⏳ **Open / actie Joshua:** Firebase Storage activeren in de console (zie boven). Dit is
   de enige resterende handmatige stap; tot dan draait de site veilig op base64.

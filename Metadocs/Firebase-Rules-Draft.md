# Firebase-rules na de e-mail-cutover — concept (2026-10-17)

Concept: `Metadocs/Firebase-Rules-Draft.json`. **Niet gedeployed** en niet getest in de Rules Simulator. Deploy = Joshua.
Elke regel begint met de `legacyOpen`-uitzondering, dus zolang `dw/config/legacyOpen !== false` gedraagt alles zich zoals nu.

## Wat het doet
- Schrijven per rol:
  - **Eigen character:** eigenaar is `config/player`. De DM van `valoria` en admins mogen ook.
  - **`dm/*`, `world/*` (behalve families en kaart-pins), `campaign/*` (behalve campaigns en char_trash):** alleen de DM van `valoria`.
  - **`dmDashboards/<cid>`:** alleen de DM van die campaign.
  - **Social:** elke speler schrijft alleen onder zijn eigen sleutel.
- **Noodpad:** `dw/admins/<firebaseAuthUid>: true` mag alles. `dw/config`, `dw/admins`, `dw/authMap` en `dw/bugs` zijn alleen voor admins.
- **`dm/initiative` is alleen voor de DM.** Nagelopen: spelers schrijven daar niet. De speler-tracker leest alleen, en de concentration-kolom zit alleen in de DM-tabel.
- **Lezen blijft alles-of-niets.** `syncDownloadAll` leest heel `/dw` in één keer, en RTDB kan geen kindpaden verbergen. Alleen schrijven wordt dus beperkt.

## Vóór de cutover in de code (Claude)
- [x] P1 — (gedaan 2026-10-17) `?auth=`-token toevoegen aan REST-calls die hem missen:
  - **Schrijven:** `wg-events.js` (ability scores, config, skills, map pins/image/delete, portrait), `wg-hp.js` (HP), `wg-rest.js` (`wgxPatchState`), `wg-levelup.js` (config-PATCH), `core.js` (portraitCrop), `ui-modals.js` (portrait2 DELETE).
  - **Lezen:** `wg-engine.js` (maps), `ui-pages.js` (portrait-hydration).
  - Zonder dit breekt alles na `legacyOpen=false`, ook met de huidige rules.
- [x] P1 — (gedaan 2026-10-17) `purgeExpiredCharTrash` alleen voor de eigenaar of een admin (nu draait hij bij iedere bezoeker).
- [ ] P2 — Auto-migraties alleen laten draaien bij DM of admin: `getCampaigns`-migratie, `migrateCharConfigAbilities`, `ensureEntityIds`/`migrateNpcsIntoCreatures`, `seedUsers` (dat laatste draait nu bij elke load).
- [ ] P2 — `canEditCharacter` bestaat niet (`app.js`), dus elk dashboard is bewerkbaar. Definiëren als eigenaar, DM of admin.
- [ ] P2 — Wachtwoorden, in deze volgorde:
  - (a) Wachtwoord wijzigen via Firebase Auth (`updatePassword` na herauthenticatie, of een reset-mail).
  - (b) `password` uit `DEFAULT_USERS`, `seedUsers` en de fallbacks halen.
  - (c) `syncSaveUser` laat `password` weg.
  - (d) De legacy-login weghalen.
  - (e) Daarna `dw/users/*/password` in de console wissen (Joshua).

## Joshua — console
1. `dw/admins/<authUid van admin>: true` aanmaken (de uid staat in `dw/users/admin/authUid`). Anders kan niemand `legacyOpen` terugzetten.
2. Na de code-fixes en de cutover: rules deployen en in de Simulator checken:
   - speler schrijft eigen state → mag
   - speler schrijft een ander character → geweigerd
   - speler schrijft `dm/initiative` → geweigerd
   - DM schrijft `world/lore` → mag
   - chat versturen (één multi-path `update` op `dw/social`: bericht, meta, beide index-items) → mag

## Open beslissingen
- **De DM mag elk character bewerken** (HP, level-up). Gewenst? Zo niet, dan de `valoria/dm`-clausule bij `characters/$charId` weghalen.
- **Families-editor en kaart-pins staan open voor alle spelers** (er zit geen DM-check in de UI). Zo laten?
- **Campaigns worden als één blob opgeslagen.** Spelers kunnen daardoor campaigns nog hernoemen of verwijderen; alleen het overnemen van `dm` is geblokkeerd. Echte fix: per-pad-updates.
- **World-data hangt aan de DM van `valoria`.** Een speler met een eigen campaign kan daar geen world-data schrijven. Het echte antwoord is backend fase 2 (data per campaign).
- **Nieuwe accounts na de cutover kunnen zichzelf niet koppelen** (`authMap` is alleen voor admins). De admin moet `authMap/<uid>` dan met de hand toevoegen.
- **Bestaande bug:** whispers gaan naar de charId, maar worden weggeklikt onder de userId (yoeri/addybluelight).

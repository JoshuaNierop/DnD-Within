# NPC + Monster → één Creature-entity (#OvywGWk)

**Status: fase 1 en 2 zijn al gebouwd en gepusht (juni 2026), maar nooit live geverifieerd.**
Dit document beschrijft daarom waar het nu staat en wat er nog moet gebeuren, niet
een groenveld-ontwerp. Opgesteld 2026-09-23 door de architect-agent op basis van
code-lezing; alles wat niet in de code te verifiëren was, is als zodanig gemarkeerd.

## 1. Huidige staat

### 1.1 Twee stores, allebei nog live

| Store | localStorage | Firebase-pad | Vorm |
|---|---|---|---|
| Legacy NPC's | `dw_npcs` | `dw/world/npcs` | `{ npcs: [ … ], currentYear }` — array |
| Creatures (ex-monsters) | `dw_lore_cats` | `dw/world/lore_cats` | `{ monsters: [ … ], items: [], places: [], … }` |

Mapping in `sync.js:129` / `sync.js:163` en `sync.js:116`; whitelist `sync.js:58-63`.
Sync is whole-key JSON zonder per-record granulariteit — elke schrijfactie herschrijft
de hele array. Dat is de belangrijkste data-loss-risicofactor (zie §5).

Accessors: `getNPCData()` / `saveNPCData()` (`ui-world.js:1701`, `:1769`),
`getLoreCatsData()` / `saveLoreCatsData()` / `getLoreCatEntries(cat)`
(`ui-world.js:2985`, `:3012`, `:3016`).

### 1.2 Wat er al staat

- **Unified schema** — `LORE_CAT_FIELDS.monsters` (`ui-world.js:2569-2609`): 36 velden,
  NPC-identiteit + statblock + narratief in één lijst; paginering in
  `LORE_CAT_PAGES.monsters` (`:2694-2707`).
- **Editor** — `renderLoreEntryModal` rendert voor categorie `monsters` een
  `firstName`/`lastName`-header plus tweede (hover-)afbeelding; `saveLoreEntryModal`
  (`:2865-2950`) stelt `name = first + ' ' + last` samen.
- **Migratie** — `migrateNpcsIntoCreatures()` (`ui-world.js:1774-1846`): idempotent,
  guard op id, kopieert NPC-velden 1:1, zet `_fromNpc: true` en zet ingevulde velden
  op `visibility: 'public'`. `dw_npcs` wordt niet gewijzigd of geleegd — het
  rollback-net blijft dus intact.
- **ID-backfill + naamsplitsing** — `ensureEntityIds()` (`:1731-1768`), `splitNpcName`
  en `npcFirstLast` (`:1709`, `:1716`).
- **Tabs samengevoegd** — `LORE_TABS` (`:1541-1550`) heeft nog één creature-tab
  (id `npcs`, label "Creatures"); `LORE_CATEGORY_TABS` bevat `monsters` niet meer.
- **Per-veld visibility** — `visibility: { <fieldKey>: 'public' | 'private' }` op de
  entry, defaults in `MONSTER_PUBLIC_DEFAULTS` (`:3034`). Entry-niveau privé via
  `e.hidden`.
- **Hypotheses** — apart Firebase-pad `monster_hypotheses/<entryId>/<fieldKey>`
  (`sync.js:572-618`); de DM abonneert bewust niet.
- **Family-links** — `resolveMemberLink` (`families.js:368-390`) probeert eerst
  `member.linkedCreatureId` en valt terug op de legacy `linkedNpcKey` (array-index).

### 1.3 Wat nog aan de oude NPC-store hangt

| Plek | Regel | Situatie |
|---|---|---|
| `collectEntities()` | `ui-world.js:2124-2149` | Somt NPC's nog uit `dw_npcs` op; gemigreerde creatures zijn niet mentionbaar via hun creature-record |
| Combat-picker | `wg-combat.js` tabs `npcs` / `monsters` | Twee bronnen → elke gemigreerde NPC staat er dubbel in |
| Family-fallback | `families.js:384-387`, `:531-546`, `:661-671` | Legacy index-links + ego-picker lezen nog `getNPCData()` |
| Dode code | `renderNPCResultsInner`, `renderNPCDetailRows`, `renderNPCModal`/`openNPCModal`, `renderDMNPCs`, handlers `add-npc`/`edit-npc`/`delete-npc` (`events.js:1263-1280`) | Geen render-callsites meer |
| Mention-tokens | `mentions.js:173` | Namespace `npc:` moet blijven bestaan, anders breken bestaande `[[npc:id\|Naam]]`-tokens |

## 2. Doelschema

Locatie blijft `lore_cats.monsters[]` (interne key `monsters`, UI-label "Creatures").
De key niet hernoemen — dat raakt mentions, hypothese-pad, image-mappen en
combat-picker tegelijk zonder functionele winst.

```
{
  id, firstName, lastName, name (afgeleid), image, image2,
  hidden: bool,
  visibility: { <fieldKey>: 'public' | 'private' },
  _fromNpc: true,
  … velden …
}
```

| Groep | Velden |
|---|---|
| Identiteit/sociaal | race, npcClass, profession, alive, disposition, faction, religion, location, birthYear, relation |
| Statblock | size, mtype, cr, profBonus, initiative, ac, hp, speed, abilities{str…cha} |
| Defenses/senses | saves, skills, resistances, immunities, condImmunities, vulnerabilities, senses, languages |
| Narratief | traits, actions, legendary, spellcasting, preferences, dislikes, pets, description, notes |

Geen enkel veld is hard NPC-only of monster-only; het onderscheid is "leeg laten".
Dat past bij de bug-intentie (Rain Shade krijgt een voor- en achternaam en een race).

**Zichtbaarheid, drie lagen:** `hidden` verbergt de hele kaart; `public` toont de
echte waarde; `private` toont de speler het gedeelde hypothese-veld in plaats van
de waarde. De DM ziet altijd alles en ziet de hypotheses bewust niet.

## 3. Migratiepad

Huidige strategie is dual-read, single-write: de creature-UI leest alleen
`lore_cats.monsters`, mentions/combat/families lezen daarnaast nog `dw_npcs`, en er
wordt uitsluitend naar `lore_cats.monsters` geschreven. **Gevolg, nu al waar in
productie:** bewerkingen in de creature-editor propageren niet terug naar `dw_npcs`,
dus de plekken uit §1.3 tonen bevroren oude waarden. Dat is de reden dat fase 3
niet oneindig kan wachten.

Rollback blijft mogelijk zolang `dw_npcs` intact is en `_fromNpc` de herkomst markeert.

**Backups.** De enige snapshot in de repo (`Metadocs/rtdb-full-2026-05-30_204650.json`)
bevat wél `dw/world/{families,maps,npcs,quests,timeline}` maar **geen `lore_cats` en
geen `lore`** — hij is dus geen bruikbaar herstelpunt voor de creature-store. Een
verse full-RTDB-dump is vereist vóór elke verdere fase.

**Offline round-trip-test (ontbreekt nog).** Een node-script dat zonder browser de
dump inleest, `ensureEntityIds` + `migrateNpcsIntoCreatures` naspeelt met gestubde
`localStorage`/`syncUpload`, en dan assert: elke NPC-id komt exact één keer voor in
`lore_cats.monsters`; geen veld verdwenen; tweede run levert nul mutaties; elke
`linkedNpcKey` heeft een `linkedCreatureId`; `dw_npcs` ongewijzigd op de
backfill-velden na. Dit is de enige ontbrekende schakel tussen "gebouwd" en
"veilig verklaard".

## 4. Fasering

### Fase 0 — Verificatie-gate (moet eerst, nog niet gedaan)
Verse RTDB-dump maken en committen; round-trip-testscript schrijven tot groen;
live-check door Joshua (migreren de NPC's correct, geen dubbele of verdwenen
records, family-diagrammen nog zichtbaar, `[[npc:id]]`-mentions resolven nog).
Geen app-code: één script plus één dump.

### Fase 1 — Datamodel + migratie — GEBOUWD, wacht op de gate
`ui-world.js`, `families.js`, `sync.js`.

### Fase 2 — Unified editor — GEBOUWD
`ui-world.js`, `ui-modals.js`, `style.css`.

### Fase 3 — Consumenten omzetten naar de creature-store
1. `collectEntities()` uit `lore_cats.monsters` laten lezen, met behoud van
   `type: 'npc'` als mention-namespace; `_fromNpc`-skip weg; dedupe op id.
2. Combat-picker naar één creature-bron; `kind` afleiden uit `disposition`/`alive`
   in plaats van uit de store-herkomst.
3. Ego-picker in `families.js` naar de creature-store; legacy fallback laten staan.

Files: `ui-world.js`, `wg-combat.js`, `families.js`, mogelijk `i18n.js`.

### Fase 4 — Speler-view en hypotheses afmaken
Expliciete save-knop per hypothese; `renderMonsterHypRow`-teksten van Nederlands
naar Engels (projectregel); eventueel hypotheses op vrije-tekstvelden; alive/dead
op de kaart tonen. Files: `ui-world.js`, `events.js`, `style.css`.

### Fase 5 — Opruimen
Dode code weg; `dw_npcs` read-only verklaren (Firebase-data laten staan als
archief); labels en image-mapnamen harmoniseren. Files: `ui-world.js`,
`ui-pages.js`, `events.js`, `sync.js`, `storage.js`.

**Aanbevolen volgorde:** fase 0 → 3 → 4 → 5. Fase 1 en 2 alleen heropenen als de
gate rood is.

## 5. Risico's

1. **Whole-key sync + gelijktijdige vensters.** `dw_lore_cats` en `dw_npcs` worden als
   één blob geschreven; twee sessies kunnen elkaars array overschrijven. Dit is
   precies het patroon van de eerdere timeline-data-loss.
2. **Drift tussen de twee stores** (§3) — nu al waar.
3. **Dubbele NPC's in de combat-picker** — nu al zichtbaar gedrag.
4. **Visibility-default is private**: een DM die na de migratie een leeg veld invult,
   maakt dat veld onbedoeld onzichtbaar voor spelers.
5. **Verouderde backup**: er is op dit moment geen bruikbaar herstelpunt voor de
   creature-store.
6. **Onverifieerd**: of de migratie in de live app daadwerkelijk correct gedraaid
   heeft. Alle uitspraken hierboven komen uit code-lezing, niet uit observatie.

## 6. Beslissingen die Joshua moet nemen vóór fase 3

- **O1** — Blijft het mention-label "NPC" voor alle creatures, of wordt het
  "CREATURE"? (Of afleiden uit disposition/CR.) Tokens blijven hoe dan ook `npc:`.
- **O2** — Hypotheses op vrije-tekstvelden (traits/actions/description): ja of nee?
- **O3** — Default-visibility voor nieuw ingevulde velden bij een creature die uit
  een NPC komt: public of private? Of een social/statblock-vlag per creature?
- **O4** — Combat-picker: één "Creatures"-tab, of twee tabs die op disposition
  filteren?
- **O5** — Hypothese-save: knop per veld, één knop per kaart, of auto-save met
  alleen een bevestiging?
- **O6** — Mag `dw_npcs` uiteindelijk uit de sync-whitelist, en na hoeveel
  bewezen-stabiele sessies?

# NPC + Monster → één Creature-entity (#OvywGWk)

**Status (2026-09-26): fase 1, 2 en 3 zijn gebouwd en gepusht. Fase 3 is offline tegen een
verse dump gecontroleerd, maar nog niet live in de app met login geverifieerd.** Zie §7
voor wat er in fase 3 veranderd is.
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

### 1.3 Wat nog aan de oude NPC-store hing (vóór fase 3 — zie §7 voor de huidige stand)

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

### Fase 3 — Consumenten omzetten naar de creature-store — GEBOUWD 2026-09-26
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

## 6. Open beslissingen voor Joshua

Fase 3 is gebouwd zonder O1, O2, O3, O5 en O6 te beslissen; die staan nog open. O4 is
door Joshua's opdracht ingevuld (één Creatures-bron in de combat-picker).

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

## 7. Fase 3 — wat er veranderd is (2026-09-26)

**Uitgangspunt:** alleen lezers (en de schrijvers van family/UI-acties) verplaatst naar de
creature-store. `dw_npcs` is niet aangeraakt: niet beschreven, niet geleegd, niet uit de
sync-whitelist. `migrateNpcsIntoCreatures()` en `ensureEntityIds()` zijn ongewijzigd.
Geen nieuw codepad schrijft de hele creature-array, behalve het bestaande
console-script `DWImages.migrateImagesToTree` dat al via `saveLoreCatsData` liep.

### Omgezet
| Plek | Nu |
|---|---|
| `collectEntities()` (`ui-world.js`) | Elke creature één keer uit `lore_cats.monsters`. `_fromNpc` → `type:'npc'` (bestaande `[[npc:id]]`-tokens blijven werken), overige → `type:'lore', loreCat:'monsters'`. Beide met `cat:'Creatures'` en route `/lore/npcs`. De `_fromNpc`-skip is weg. |
| `entityById()` | Accepteert voor een creature zowel `npc:` als `lore:`, zodat een token blijft resolven ongeacht de namespace waarin hij geschreven is. |
| Route `/lore/monsters` | Wordt in `renderLore` naar de Creatures-tab (`npcs`) gestuurd; was een "not found". |
| `applyEntityFocus()` (`app.js`) | `npc:`- en `lore:`-creatures openen de `.lore-entry-card` (de oude `.npc-card`-selector matchte niets meer). |
| Combat-picker (`wg-combat.js`) | Eén tab "Creatures" uit de creature-store i.p.v. "NPCs" + "Monsters". Default kind: `hostile` → monster, anders npc (badge wisselt nog). Familiars-tab ongewijzigd. i18n-key `combat.tab.creatures`. |
| `resolveMemberLink()` (`families.js`) | `linkedCreatureId` eerst. Legacy `linkedNpcKey` (array-index) leest nog `dw_npcs` (read-only) maar toont het creature-record met dezelfde id als dat bestaat. |
| `migrateFamilies()` | Ego's uit creatures met `_fromNpc`; nieuwe leden krijgen `linkedCreatureId` i.p.v. een array-index. Draait alleen bij een lege families-store. |
| `famdiag-open-link` (`events.js`) | Klik op een gelinkt creature-lid opent de juiste creature-kaart. |
| `migrateImagesToTree` (`storage.js`) | Creature-afbeeldingen worden in de lore-store herschreven, niet meer in `dw_npcs`. |
| Hypothese-rij | Teksten Engels ("guess, e.g. 15 or 14-16", "enter a guess", "group guess"). |

### Verwijderd (geen callers, gecontroleerd incl. `index.html` en inline strings)
`renderNPCResultsInner`, `renderNPCDetailRows`, `npcAge`, `npcDispColor`, `dwImgFallback`,
`renderNPCModal`/`openNPCModal`/`closeNPCModal`/`saveNPCModal`/`npcModalField(Inner)`,
`renderDMNPCs`; handlers `add-npc`/`edit-npc`/`delete-npc` (die laatste gebruikte `confirm()`),
`toggle-npc-card`, `add-family`/`save-family`/`cancel-family`/`remove-family`, `#fam-source`,
`close-npc-modal`/`save-npc-modal`/`remove-npc-image`/`upload-npc-image`; bijbehorende CSS
(`.npc-grid`, `.npc-card*`, `.npc-expanded*`, `.npc-detail-*`, `.npc-form-grid`, `.modal-npc`,
`.npc-family-section`, `.npc-section-head`, …). `.npc-portrait-empty`, `.npc-form-field` en
`.npc-form-image-preview` blijven (worden door maps/lore gebruikt).

### Bewust nog op `dw_npcs`
- `ensureEntityIds()` / `migrateNpcsIntoCreatures()` — migratie, ongewijzigd.
- `resolveMemberLink()` legacy fallback — alleen lezen, voor oude index-links.
- `currentYear` — veld op de Creatures-tab schrijft nog naar `dw_npcs.currentYear`. Wordt op dit
  moment nergens getoond (leeftijden stonden alleen op de verwijderde NPC-kaart).

### Controle
`node --check` op alle gewijzigde JS. Offline check tegen de dump van 2026-09-26: 35 creatures
→ 35 entities met unieke id's (8 `npc`, 27 `lore`); alle 8 legacy NPC-id's resolven exact één
keer; alle `[[npc:]]`/`[[lore:]]`-tokens in de dump resolven; 6/6 `linkedCreatureId`- en 6/6
`linkedNpcKey`-links resolven naar het creature-record; combat-picker geeft 35 unieke items.
Niet geverifieerd: de live app met login (rendering, klik-navigatie, combat-panel).

### Over voor fase 4-5
- Fase 4: save-knop per hypothese (O5), alive/dead op de kaart, hypotheses op vrije-tekstvelden (O2).
- Privé creatures (`hidden`/privé naam) staan nog in Search en de `@`-popup voor spelers — checken.
- `currentYear` een zichtbaar doel geven of weghalen.
- Family-diagram: nog `prompt()`/`confirm()` en Nederlandse teksten in de famdiag-handlers.
- Fase 5: `dw_npcs` read-only/uit de whitelist (O6), labels + image-mapnamen harmoniseren.

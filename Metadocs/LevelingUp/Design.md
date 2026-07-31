# Leveling Up — Design

> Fase B. Gebaseerd op: codebase-verkenning (2 Explore-agents), rules-research
> (`Progression-Reference.md`), en `../LevelUp-SpellPrepare-Design.md` (2026-06-19).

## 1. Waar staat de data? (bestaand)

- **Firebase:** `dw/characters/<id>/config` (statisch: race, className, subclass, baseAbilities, originFeat, …) en `…/state` (mutabel: `level`, `hp`, `cantrips[]`, `prepared[]`, `asiChoices{}`, `expertise[]`, `metamagic[]`, `spellSlotsUsed{}`, `hitDiceUsed`, …). localStorage-mirror via `sync.js`.
- **Rules-data:** `DATA` in `data.js` — per class `features:{level:[...]}`, `subclasses:{key:{level, features}}`, spell slots, `DATA.races.*`, `DATA.spellPool`, `DATA.feats`.
- **Engine:** `engine.js` is al level-aware (loopt 1..level voor HP/ASI/slots) — level verhogen werkt daar automatisch in door.
- **Vandaag ontbreekt:** iets dat `state.level` muteert. Geen XP (bewust: level-based, DM zet party level via `dw_party_level`).

## 2. Datamodel-uitbreidingen (nieuw)

### `state.levelChoices` — hart van up én down
Alle keuzes die bij een level horen, gekeyed **per level**:
```js
state.levelChoices = {
  3: {
    subclass: "soulknife",              // ook gespiegeld naar config.subclass (bestaande read-sites)
    // NB: Aasimar Celestial Revelation is GEEN level-keuze (2024: optie per transformatie herkiesbaar)
    spellsAdded: ["Misty Step"],        // nieuwe prepared-keuzes bij dit level
    spellSwapped: { out: "Sleep", in: "Shield" },
    cantripSwapped: { out: null, in: null },
    expertise: [...], metamagic: [...], invocations: [...], fightingStyle: "...",
  }
}
```
**Level-down = `level--` + delete `levelChoices[level]` + afgeleide state terugrollen** (prepared/cantrips die bij dat level zijn toegevoegd verwijderen, subclass wissen als het keuze-level wegvalt). Omdat keuzes per level gekeyed zijn is demote verliesvrij beperkt tot dat ene level. `asiChoices` (bestaand, per level) blijft zoals het is — zelfde principe.

Toekomst (Joshua's wens "tijdelijk opslaan om te resetten"): bij demote de verwijderde entry parkeren in `state.demotedChoices[level]` zodat een re-promote hem kan aanbieden als default. **Nu**: alleen ontwerpen, veld reserveren, niet bouwen.

### `DATA` — progression-metadata per class/species
Features per level bestaan al. Nieuw nodig:
```js
DATA.rogue.progression = {
  1: { choices: [{ id:'expertise', count:2 }] },
  3: { choices: [{ id:'subclass' }], sneakAttack:'2d6' },
};
DATA.rogue.preparedTable = null;                 // caster-classes: [., 4, 5, 6, ...] (2024 vaste tabel — NA verificatie)
DATA.races.aasimar.progression = {
  3: { feature:'Celestial Revelation', choices:[{ id:'revelation', options:['necroticShroud','radiantSoul','radiantConsumption'] }] },
};
```
Choice-renderers in de UI zijn generiek per `id` (subclass, expertise, spells, cantrip, revelation, fightingStyle, metamagic, invocations, …).

### `DATA.classResources` — generieke resource-registry (voor widget, §5)
```js
DATA.classResources = [
  { id:'psionicDice', label:'Psionic Energy Dice', appliesTo:{ className:'rogue', subclass:'soulknife', minLevel:3 },
    max: (cfg,st)=> 2*getProfBonus(st.level), die: (st)=> st.level>=17?'d12':st.level>=11?'d10':st.level>=5?'d8':'d6',
    stateKey:'psionicDiceUsed', recharge:'long', desc:'…uitleg…' },
  { id:'sorceryPoints', appliesTo:{ className:'sorcerer', minLevel:2 }, max:(c,s)=>s.level, stateKey:'sorceryPointsUsed', … },
  { id:'secondWind', … }, { id:'layOnHands', … }, { id:'channelDivinity', … },
];
```

## 3. Level-up mechanic (`engine.js` + `wg-levelup.js`)

`getLevelUpDelta(config, state, toLevel)` (pure, engine.js) verzamelt uit class + subclass + species:
```js
{ hp:{gain, newMax}, profBonus:{old,new}, features:[{source:'class'|'subclass'|'species', name, desc}],
  slots:{old, new}, prepared:{old,new}, cantrips:{old,new}, spellbookAdds, sneakAttack:{old,new},
  choices:[{id, source, count, options}], resources:[gewijzigde classResources] }
```
Bevestigen in het menu → één Firebase PATCH op `/state`: `level`, `levelChoices[N]`, bijgewerkte `prepared/cantrips/expertise/metamagic`, `hp.current += gain` (HP-keuze: **vast gemiddelde**, consistent met `getHP()`; geen roll-optie in v1). `config.subclass` apart PATCHen als subclass gekozen. Daarna standaard refresh-pipeline (`wgxPatchState`-patroon uit wg-rest.js).

**Level-down:** confirm-dialoog ("Are you sure? This removes everything gained at level N.") → PATCH: `level--`, `levelChoices[N]=null`, afgeleide arrays teruggerold, `config.subclass=null` indien N==3, `hp.current = min(hp.current, nieuwe max)`.

## 4. UI

### Knoppen — widget `levelUp` in `wg-levelup.js` (patroon = wg-rest.js)
Infobox-tegels op de character-page:
- **`⬆ Level Up`** — altijd zichtbaar; **glow-animatie** wanneer `state.level < dw_party_level` (CSS-klasse op de rij, pulse zoals `pulseSidebar`). Klik → level-up-menu.
- **`⬇ Level Down`** — kleiner/gedempt; klik → Are-you-sure confirm → demote.
Alle strings **Engels** (en de bestaande NL-strings in wg-rest.js worden meegenomen/vertaald).

### Level-up-menu — modal wizard (patroon = character-creation wizard, ui-modals.js)
BG3-inspiratie: één scherm per keuze, permanente summary-sidebar, stepper-dots.
1. **Overview** — "Level N → N+1": alles wat je krijgt als kaartjes met source-badge **Class / Subclass / Species** (dit combineert race- en class-veranderingen in één menu; species-items staan gewoon tussen de class-items, badge maakt de bron zichtbaar). HP-gain, prof bonus, slots-diff, sneak attack, features met tooltip-uitleg (bestaande tooltip-laag: `data-tip-title/body`).
2. **Eén stap per CHOICE** uit de delta (subclass-keuze toont 4 kaarten met L3-features; revelation toont 3 opties; spell-keuzes tonen de class-lijst met spellPool-tooltips; swap-stappen zijn optioneel/skipbaar).
3. **Summary + Confirm** — alles nog eens, dan pas de PATCH.
Geen aparte race-flow: species-choices zijn gewoon steps in dezelfde wizard.

### Feature-uitleg — generiek
Geen aparte uitleg-widget nodig als eerste stap: de **bestaande tooltip-laag** levert uitleg overal (menu, widgets). Daarnaast komt een algemene **`features`-widget** (`wg-features.js`): infobox met alle features (class+subclass+species) t/m huidig level, rij per feature, tooltip met volledige tekst. Algemeen toepasbaar op elk character.

### Resources — generiek + Psionic Dice
**`wg-resource.js`**: één widget-type `classResource` dat álle op dit character toepasselijke entries uit `DATA.classResources` toont (rij per resource: naam · pips/teller · die-size). Klik = spend, klik op teller/lang-press = restore; tooltip = uitleg. Voor **Soulknife** verschijnt automatisch **Psionic Energy Dice** (4×d6 op L3) — widget toont niets (of verbergt zich) voor characters zonder resources → "alleen zichtbaar voor deze subclass" zit gratis in het generieke ontwerp.

## 5. Bouwvolgorde (fase C–F)
1. **C1** `data.js`: progression-metadata Rogue (all subclasses aanwezig) + Aasimar; preparedTable-kolommen NA verificatie-agent.
2. **C2** `engine.js`: `getLevelUpDelta` + `getMaxPrepared` → 2024-tabel (blocker uit oud design; verificatie loopt).
3. **D1** `wg-levelup.js`: widget + glow + demote-confirm + wizard-modal — eerst werkend voor **Aasimar Rogue** L1→2→3 (incl. subclass-keuze Soulknife + Celestial Revelation).
4. **E1** `wg-resource.js` (Psionic Dice) + **E2** `wg-features.js`.
5. **F** overige 7 classes + 3 races data-vulling + end-to-end test per combinatie + Engelse strings wg-rest.js.

## 6. Risico's / vooruitgedacht
- **Concurrency:** ander window kan zelfde repo/char bewerken → alle writes zijn smalle PATCHes, geen hele-state PUT; geen `git add -A` (memory-regel).
- **Backwards-compat:** bestaande 8 party-characters hebben geen `levelChoices` → alle reads defensief (`|| {}`); demote onder het laagste bekende level blokkeren op L1.
- **Subclass-spiegeling:** `config.subclass` heeft bestaande read-sites → bij demote óók config patchen, anders toont de sheet een spook-subclass (zelfde bug-familie als #OvVZiZ).
- **Wizard-edit-flow:** creation-wizard in edit-mode mag `level`/`levelChoices` nooit overschrijven (doet hij nu al niet — bewaken).
- **i18n:** alle nieuwe UI-strings Engels (project-regel).

# Level-Up & Spell-Prepare — Ontwerp (E5.5 / 2024)

> BG3-achtige level-up + spell-prepare flow voor D&D Within. Bron: research door
> de D&D 5.5e-mechanics agents + architect-decompositie (2026-06-19).
> Status: **fase 1 (long-rest widget) gebouwd**, rest ontworpen.

---

## 1. Spell-mechanics per class (2024) — de kern­bevinding

De grootste 2014→2024-breuk: **vrijwel alles is nu "prepared"**. De aparte
"spells known"-categorie (Bard, Sorcerer, Ranger in 2014) bestaat niet meer.
Bijna elke caster stelt na een **long rest** zijn voorbereide lijst opnieuw samen
uit de **hele class-spellijst**, tot een maximum dat een **vaste tabelkolom** per
level is (NIET de oude formule `ability-mod + level`).

Daardoor vallen alle 13 classes in **6 mechaniek-categorieën**:

| Categorie | Classes | Hoe ze aan spells komen | Prepare-window? |
|---|---|---|---|
| **Full (prepared)** | Cleric, Druid, Sorcerer, Bard | Hele class-lijst, long-rest re-prepare tot tabel-max | Ja, elke long rest |
| **Spellbook** | Wizard | Spellbook-pool (+2/level) → prepared subset op long rest | Ja (uit spellbook) |
| **Pact** | Warlock | Hele lijst prepared + **aparte pact-slots** (short-rest reset) + invocations | Ja + short-rest tracker |
| **Half (prepared)** | Paladin, Ranger | Hele lijst vanaf **L2**, vaste tabel-max | Ja, vanaf L2 |
| **Subclass/third** | Eldritch Knight, Arcane Trickster | Vanaf **L3** (subclass-gate); op L1-2 = pure non-caster | Ja, vanaf L3 |
| **Non-caster** | Barbarian, Fighter, Monk, Rogue | Geen spells | Nooit — alleen level-up |

**Cantrips:** vaste set per class (Sorcerer 4 op L1, de meeste 2-3, Druid 2,
half-casters 0), met meestal **1 swap per level-up**.

**Subclass-keuze: op L3** voor bijna elke class (grote 2024-shift — was vaak L1/L2).

**Artificer:** zit **niet** in de 2024 PHB → buiten scope.

### Spells leerbaar op L1 en L2 (cantrips + 1st-level)
Per class is een representatieve L1-2 lijst opgesteld (cantrips + 1st-level spells).
Volledige lijsten leven in `data.js → DATA.spells[className]`. Voorbeelden:
- **Wizard** cantrips: Fire Bolt, Ray of Frost, Mind Sliver, Minor Illusion, Mage Hand, Prestidigitation… | 1st: Magic Missile, Shield, Mage Armor, Sleep, Chromatic Orb, Find Familiar…
- **Cleric** cantrips: Sacred Flame, Guidance, Spare the Dying, Toll the Dead… | 1st: Bless, Cure Wounds, Healing Word, Guiding Bolt, Shield of Faith…
- **Sorcerer** cantrips (4): Fire Bolt, Sorcerous Burst, Ray of Frost, Prestidigitation… | 1st: Magic Missile, Shield, Chromatic Orb, Burning Hands…
- **Warlock** cantrips: Eldritch Blast, Mind Sliver, Chill Touch… | 1st: Hex, Armor of Agathys, Hellish Rebuke, Witch Bolt…
- **Paladin/Ranger:** géén cantrips; spellcasting start L2 (Paladin: Bless, Cure Wounds, Divine Smite-als-spell; Ranger: Hunter's Mark, Cure Wounds, Ensnaring Strike).
- **EK/Arcane Trickster:** géén spells op L1-2 (subclass pas L3).

### Wisselen — wanneer en hoeveel
- **Long rest:** alle prepared-casters herzien hun **volledige** voorbereide lijst (tot tabel-max). Dit is dé trigger voor de prepare-window.
- **Level-up:** prepared-max stijgt volgens tabel; +1 cantrip-swap; Wizard +2 spellbook-spells.
- **Warlock pact-slots:** herstellen op **short rest** (aparte tracker).

### Multiclass (2024)
Gecombineerde caster-level voor **gedeelde** slots:
`full ×1  +  half ×½ (afgerond omlaag)  +  third ×⅓ (afgerond omlaag)`.
**Warlock Pact Magic blijft een aparte pool** (telt niet mee). Known/prepared
wordt **per class apart** bepaald (eigen ability), maar de slots zijn gedeeld.

---

## 2. Integratie in D&D Within

De app heeft al alle mechanica (`engine.js`) en data (`data.js`); wat **volledig
ontbrak**: een level-up-flow, een long-rest-handler, een runtime spell-prepare
scherm, en een party-vs-character-level-signaal. Alles wordt gebouwd als nieuwe
`wg-*.js` widget-extensies (zelfde patroon als `wg-hp.js`): registreer een
widget-type, een infobox-builder en een click-handler, en schrijf via REST PATCH
naar Firebase met de bestaande refresh-loop.

### Drie componenten
1. **Long-rest knop** *(wg-rest.js — GEBOUWD, fase 1)* — reset HP/slots/hit-dice; opent straks de prepare-window voor casters.
2. **Spell-prepare window** *(wg-prepare.js — fase 2)* — per categorie de juiste flow; verschijnt bij de long-rest knop.
3. **Level-up knop** *(wg-levelup.js — fase 3)* — **glowt als character-level < party-level**; klik → BG3-achtig stap-voor-stap window dat per nieuw level toont wat nieuw is (features, ASI/feat, cantrips/spells, Weapon Mastery, subclass op L3, proficiencies/skills). Bevestigen → `state.level++` + keuzes wegschrijven.

### Datamodel-uitbreidingen (fase 0)
- Per class in `data.js`: `casterCategory` + `preparedSpells`-tabel (L1-20-kolom). Wizard krijgt `spellbookAdds: 2`.
- `engine.js`: `getMaxPrepared()` van **2014-formule → vaste tabel** herschrijven; nieuwe `getLevelUpDelta(class, subclass, from, to)` (leest de bestaande `features:{level:[…]}`-structuur, dus géén data-migratie) en `getCombinedCasterLevel(classes)` voor multiclass.
- Nieuwe (optionele, backward-compatible) state-velden: `spellbook[]`, `pactSlotsUsed`, `weaponMastery[]`, `levelChoices{}`. Bestaande `asiChoices` wordt hergebruikt.

---

## 3. Fasering

| Fase | Files | Inhoud | Status |
|---|---|---|---|
| **1 — long-rest proof** | `wg-rest.js`, `wg-style.css`, `index.html`, `wg-ui.js` | Long/Short-rest widget; state-reset | ✅ **gebouwd** |
| **0 — data + bugfixes** | `engine.js`, `data.js` | `getMaxPrepared`→tabel, `casterCategory`+`preparedSpells` per class, cantrip-correcties | open |
| **2 — prepare window** | `wg-prepare.js` | 5 caster-categorieën, opent vanuit long rest | open (hangt op fase 0) |
| **3 — level-up + glow** | `wg-levelup.js`, `engine.js` | `getLevelUpDelta`, keuze-window, glow-signaal | open (hangt op fase 0) |
| **4 — multiclass** | `engine.js`, config-model | aggregator wire-up | uitgesteld (vereist multiclass config-model) |

**Waarom long-rest eerst:** nul nieuwe data nodig, laagste risico, en het oefent
de volledige nieuwe-widget-pipeline die fase 2 en 3 hergebruiken.

---

## 4. Te reviewen / open beslissingen (input Joshua nodig)

Deze flag ik bewust — ze zijn nog niet zeker of nog te beslissen:

1. **Prepared-max = vaste tabel of `ability-mod + level`?** De agents zijn er sterk van overtuigd dat 2024 een vaste tabelkolom gebruikt, maar dit moet tegen de fysieke 2024 PHB geverifieerd worden vóór we 13×20 tabellen invoeren. **Blokkerend voor fase 0.**
2. **Multiclass-diepte.** Je koos "direct meenemen". Het rekenmodel (aggregator) kan nu al, maar de **UI** vereist een multiclass config-model (nu is `className` enkelvoudig). Voorstel: aggregator nu, multiclass-UI als fase 4. Akkoord?
3. **HP bij level-up:** vast gemiddelde (zoals de engine nu doet, deterministisch) of laten rollen (BG3-stijl)? Voorstel: vast gemiddelde.
4. **EK/Arcane Trickster spell-lijst:** eigen subset of gefilterde Wizard-lijst (abjuration/evocation resp. enchantment/illusion)? Data-beslissing vóór fase 3.

## 5. Codebase-bugs gevonden (2014-resten, fase 0)
- `engine.js getMaxPrepared()` gebruikt 2014-formules i.p.v. 2024-tabellen.
- Druid `cantripsKnown` toont 3 op L1 → 2024 = 2 (verifiëren).
- Bard "Magical Secrets" als losse spells (L10/L14) = 2014; 2024 = geïntegreerd in prepared-pool.
- Wizard "Memorize Spell na short rest" = 2014/homebrew, geen standaard 2024-feature.
- Subclass-levels: controleren dat álle 6 full casters hun subclass op **L3** kiezen.

Geen van deze blokkeert de gebouwde fase-1 long-rest widget.

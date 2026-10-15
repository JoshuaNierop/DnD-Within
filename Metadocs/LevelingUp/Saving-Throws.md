# Saving throws — wat ze beïnvloedt (voor een toekomstige integratie)

De site berekent of toont saving throws nergens (zie Todo). Deze lijst houdt bij wat een
saving throw van het eigen personage verandert, zodat een saves-widget/`getSaveBonus` later
alles in één keer kan meenemen. Bijwerken wanneer er features, feats of spells bijkomen.

## A. Vaste getallen (direct in een save-bonus te verrekenen)
| Bron | Effect | Waar |
|---|---|---|
| Class-saves (2 per class) | + Proficiency Bonus | `DATA.<class>.savingThrows` |
| Resilient (feat) | proficiency in de save van de gekozen ability | feat-record `ability` |
| Aura of Protection (Paladin 6) | + CHA-mod (min +1) op álle saves, ook voor bondgenoten in 10 ft (30 ft vanaf 18, Aura Expansion) | paladin features |
| Disciplined Survivor (Monk 14) | proficiency in álle saves | monk features |
| Slippery Mind (Rogue 15) | proficiency in WIS- en CHA-saves | rogue features |
| Iron Mind (Gloom Stalker 7) | proficiency in WIS-saves (al had: INT of CHA, eigen keuze) | ranger/gloomStalker |
| Fanatical Focus (Zealot 6) | 1× per Rage herrollen met + Rage Damage-bonus | barbarian/zealot |
| Indomitable (Fighter 9/13/17) | herrollen met + Fighter-level (1/2/3× per Long Rest) | fighter, resource `indomitable` |
| Capstones (Primal Champion, Body and Mind) | ability +4 → hogere mod | `capstoneScore` (al verrekend in scores) |

## B. Advantage / herrollen (situatie, als tag tonen)
- **Rage** (Barbarian 1): Advantage op STR-saves tijdens Rage
- **Danger Sense** (Barbarian 2): Advantage op DEX-saves (niet Incapacitated)
- **Indomitable Might** (Barbarian 18): STR-save-totaal minimaal je STR-score
- **Psychic Defenses** (Aberrant 6), **Beguiling Twist** (Fey Wanderer 7): Advantage tegen Charmed/Frightened
- **Spell Resistance** (Abjurer 14): Advantage op saves tegen spells
- **Holy Nimbus** (Devotion 20): Advantage op saves die Fiends/Undead afdwingen; **Living Legend** (Glory 20): mislukte save herrollen (Reaction)
- **Survivor** (Champion 18): Advantage op Death Saving Throws, 18-20 telt als 20
- **War Caster**, **Eldritch Mind** (invocation): Advantage op CON-saves voor Concentration
- **Mage Slayer**: 1× per Short/Long Rest een mislukte INT/WIS/CHA-save slagen; Advantage tegen spells van naburige casters
- **Durable**: Advantage op Death Saving Throws
- **Mounted Combatant**: rijdier ontwijkt bij geslaagde DEX-save alle schade
- **Lucky** (luck points), **Boon of Fate** (2d4), **Boon of Recovery** (Last Stand bij 0 HP)
- Species: **Brave** (Halfling, Frightened), **Fey Ancestry** (Elf, Charmed), **Dwarven Resilience** (Poisoned), **Gnomish Cunning** (INT/WIS/CHA)
- Spells op jezelf/bondgenoten: Bless (+1d4), Resistance (+1d4), Circle of Power, Aura of Purity, Holy Aura, Foresight, Heroism (Frightened)

## C. Effecten op saves van ánderen (niet voor de eigen save-bonus)
Eldritch Strike (EK 10), Magical Ambush (Arcane Trickster 9), Sculpt Spells (Evoker 6), Corona of Light (Light 17),
Elder Champion (Ancients 20), Eldritch Hex (Great Old One 10), Brutal Strike (Staggering Blow), Intimidating
Presence / Zealous Presence / Mantle of Majesty / Searing Vengeance (save-DC's of buffs), Contact Patron (auto-succes).

_Opgesteld 2026-10-15 uit `data.js` (zoektocht op save-teksten) + handmatig aangevuld met feats/spells._

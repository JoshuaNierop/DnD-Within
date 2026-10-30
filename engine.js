// ============================================================
// D&D Within — Pure D&D Mechanics Engine
// Extracted from app.js. Requires data.js (global DATA object).
// ============================================================

function getMod(score) {
    return Math.floor((score - 10) / 2);
}

function getProfBonus(level) {
    return DATA.profBonus[level] || 2;
}

function getAbilityScore(config, state, ability) {
    // Check for manual override first
    if (state.customAbilities && state.customAbilities[ability] !== undefined && state.customAbilities[ability] !== null) {
        return state.customAbilities[ability];
    }
    // Firebase drops empty objects — characters without ASI picks miss
    // state.asiChoices entirely; never let that crash a derived stat.
    let score = (config.baseAbilities || {})[ability] || 10;
    const asiChoices = state.asiChoices || {};
    // Add ASI bonuses from all levels up to current
    for (let lvl = 1; lvl <= state.level; lvl++) {
        const choice = asiChoices[lvl];
        if (!choice) continue;
        if (choice.type === 'asi' && choice.abilities) {
            score += (choice.abilities[ability] || 0);
        }
        if (choice.type === 'feat' && choice.feat) {
            const feat = findFeat(choice.feat);
            if (feat && feat.abilityBonus && feat.abilityBonus[ability]) {
                score += feat.abilityBonus[ability];
            }
            // Choice-based +1 (feats offering "+1 STR or DEX"): the picked ability
            // is stored as choice.ability.
            if (feat && !feat.abilityBonus && choice.ability && choice.ability === ability) {
                score += 1;
            }
        }
    }
    return capstoneScore(config, state, ability, score);
}

// Level 20 capstones (Primal Champion, Body and Mind): +4 to two abilities, to a maximum of 25.
function capstoneScore(config, state, ability, score) {
    var cap4 = (config.className === 'barbarian' && (ability === 'str' || ability === 'con')) ||
        (config.className === 'monk' && (ability === 'dex' || ability === 'wis'));
    return cap4 && ((state && state.level) || 1) >= 20 ? Math.max(score, Math.min(score + 4, 25)) : score;
}

// Skill keys: the stored form is camelCase ('sleightOfHand', as WG_SKILLS);
// older characters and the creation wizard use 'sleight of hand'.
var SKILL_KEYS = ['acrobatics', 'animalHandling', 'arcana', 'athletics', 'deception', 'history', 'insight',
    'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion',
    'religion', 'sleightOfHand', 'stealth', 'survival'];
function skillKey(k) {
    var n = String(k || '').toLowerCase().replace(/[^a-z]/g, '');
    for (var i = 0; i < SKILL_KEYS.length; i++) if (SKILL_KEYS[i].toLowerCase() === n) return SKILL_KEYS[i];
    return k;
}
// Canonical keys, duplicates (in any spelling) removed.
function skillKeys(list) {
    var out = [];
    listOf(list).forEach(function (s) { var k = skillKey(s); if (out.indexOf(k) === -1) out.push(k); });
    return out;
}
// Wizard form: 'sleightOfHand' → 'sleight of hand'.
function skillLabelKey(k) { return String(skillKey(k)).replace(/([A-Z])/g, ' $1').toLowerCase(); }

// Skill check bonus (2024): ability modifier + Proficiency (doubled with
// Expertise), Jack of All Trades (Bard 2+, skills you lack) and flat feature
// bonuses — Thaumaturge (Arcana, Religion), Magician (Arcana, Nature) and
// Otherworldly Glamour (Charisma checks) add your Wisdom modifier (min +1).
// Returns { total, parts: [{ label, value }], prof, expert }.
function getSkillBonus(config, state, skill, ability) {
    var st = Object.assign({ asiChoices: {}, level: 1 }, state || {});
    var lvl = st.level || 1, pb = getProfBonus(lvl);
    var norm = function (s) { return String(s || '').toLowerCase().replace(/[^a-z]/g, ''); };
    var k = norm(skill);
    var has = function (list) { return listOf(list).some(function (s) { return norm(s) === k; }); };
    var prof = has(config.defaultSkills) || hasFeat(st, 'Boon of Skill', config), expert = has(config.expertSkills);
    var mod = getMod(getAbilityScore(config, st, ability));
    var parts = [{ label: ability.toUpperCase() + ' modifier', value: mod }];
    if (expert) parts.push({ label: 'Expertise (2 × proficiency)', value: 2 * pb });
    else if (prof) parts.push({ label: 'Proficiency', value: pb });
    else if (config.className === 'bard' && lvl >= 2) parts.push({ label: 'Jack of All Trades (half proficiency)', value: Math.floor(pb / 2) });
    var wisB = Math.max(1, getMod(getAbilityScore(config, st, 'wis')));
    if (config.className === 'cleric' && config.divineOrder === 'thaumaturge' && (k === 'arcana' || k === 'religion')) parts.push({ label: 'Thaumaturge (Wisdom modifier)', value: wisB });
    if (config.className === 'druid' && config.primalOrder === 'magician' && (k === 'arcana' || k === 'nature')) parts.push({ label: 'Magician (Wisdom modifier)', value: wisB });
    if (config.className === 'ranger' && config.subclass === 'feyWanderer' && lvl >= 3 && ability === 'cha') parts.push({ label: 'Otherworldly Glamour (Wisdom modifier)', value: wisB });
    if (getExhaustion(st)) parts.push({ label: 'Exhaustion', value: -2 * getExhaustion(st) });
    return { total: parts.reduce(function (a, p) { return a + p.value; }, 0), parts: parts, prof: prof, expert: expert };
}

// Exhaustion level 0-6 (state.exhaustion): −2 per level on every D20 Test, −5 ft Speed per level.
function getExhaustion(state) {
    var n = parseInt((state && state.exhaustion) || 0, 10);
    return n > 0 ? Math.min(6, n) : 0;
}

// Saving throw bonus (2024): ability modifier + Proficiency for the class saves,
// Resilient, Disciplined Survivor (Monk 14, all saves), Slippery Mind (Rogue 15,
// WIS/CHA) and Iron Mind (Gloom Stalker 7, WIS) + Aura of Protection (Paladin 6,
// CHA modifier, min +1). Situational effects (Advantage, rerolls) come back as
// notes; they are not added to the total. See Metadocs/LevelingUp/Saving-Throws.md.
// Returns { total, parts: [{ label, value }], prof, notes: [string] }.
function getSaveBonus(config, state, ability) {
    var st = Object.assign({ asiChoices: {}, level: 1 }, state || {});
    var cn = config.className, sub = config.subclass, lvl = st.level || 1, pb = getProfBonus(lvl);
    var classSaves = ((DATA[cn] || {}).savingThrows) || [];
    var profFrom = null;
    if (classSaves.indexOf(ability) !== -1) profFrom = 'Proficiency';
    else if (featInstances(config, st).some(function (f) { return f.name === 'Resilient' && f.rec && f.rec.ability === ability; })) profFrom = 'Proficiency (Resilient)';
    else if (cn === 'monk' && lvl >= 14) profFrom = 'Proficiency (Disciplined Survivor)';
    else if (cn === 'rogue' && lvl >= 15 && (ability === 'wis' || ability === 'cha')) profFrom = 'Proficiency (Slippery Mind)';
    else if (cn === 'ranger' && sub === 'gloomStalker' && lvl >= 7 && ability === 'wis') profFrom = 'Proficiency (Iron Mind)';
    var parts = [{ label: ability.toUpperCase() + ' modifier', value: getMod(getAbilityScore(config, st, ability)) }];
    if (profFrom) parts.push({ label: profFrom, value: pb });
    if (cn === 'paladin' && lvl >= 6) parts.push({ label: 'Aura of Protection (Charisma modifier)', value: Math.max(1, getMod(getAbilityScore(config, st, 'cha'))) });
    if (getExhaustion(st)) parts.push({ label: 'Exhaustion', value: -2 * getExhaustion(st) });

    var notes = [], race = config.race, feat = function (n) { return hasFeat(st, n, config); };
    var mental = ability === 'int' || ability === 'wis' || ability === 'cha';
    if (cn === 'barbarian' && ability === 'str') notes.push('Rage: Advantage while raging');
    if (cn === 'barbarian' && lvl >= 18 && ability === 'str') notes.push('Indomitable Might: total is at least your Strength score');
    if (cn === 'barbarian' && lvl >= 2 && ability === 'dex') notes.push('Danger Sense: Advantage unless Incapacitated');
    if (cn === 'barbarian' && sub === 'zealot' && lvl >= 6) notes.push('Fanatical Focus: reroll a failed save once per Rage, + Rage Damage');
    if (cn === 'fighter' && lvl >= 9) notes.push('Indomitable: reroll a failed save with + Fighter level (' + (lvl >= 17 ? 3 : lvl >= 13 ? 2 : 1) + '/Long Rest)');
    if (cn === 'wizard' && sub === 'abjuration' && lvl >= 14) notes.push('Spell Resistance: Advantage on saves against spells');
    if (cn === 'paladin' && sub === 'devotion' && lvl >= 20) notes.push('Holy Nimbus: Advantage on saves forced by Fiends or Undead');
    if (cn === 'paladin' && sub === 'glory' && lvl >= 20) notes.push('Living Legend: reroll a failed save (Reaction)');
    if (cn === 'sorcerer' && sub === 'aberrant' && lvl >= 6 && mental) notes.push('Psychic Defenses: Advantage against Charmed and Frightened');
    if (cn === 'ranger' && sub === 'feyWanderer' && lvl >= 7 && mental) notes.push('Beguiling Twist: Advantage against Charmed and Frightened');
    if (ability === 'con' && feat('War Caster')) notes.push('War Caster: Advantage to keep Concentration');
    if (ability === 'con' && listOf(st.invocations).indexOf('Eldritch Mind') !== -1) notes.push('Eldritch Mind: Advantage to keep Concentration');
    if (mental && feat('Mage Slayer')) notes.push('Mage Slayer: turn a failed save into a success (1/Short or Long Rest)');
    if (feat('Lucky')) notes.push('Lucky: spend a Luck Point for Advantage');
    if (mental && race === 'gnome') notes.push('Gnomish Cunning: Advantage');
    if (race === 'halfling') notes.push('Brave: Advantage against Frightened');
    if (race === 'dwarf' && ability === 'con') notes.push('Dwarven Resilience: Advantage against Poisoned');
    if ((race === 'highElf' || race === 'woodElf' || race === 'drow' || race === 'halfElf') && mental) notes.push('Fey Ancestry: Advantage against Charmed');
    return { total: parts.reduce(function (a, p) { return a + p.value; }, 0), parts: parts, prof: !!profFrom, notes: notes };
}

// Walking speed: species + Unarmored Movement (Monk 2+, no armor or Shield) +
// Fast Movement (Barbarian 5+) / Roving (Ranger 6+), both without Heavy armor + Speedy (+10 ft).
function getSpeed(config, state) {
    var st = state || {};
    var lvl = st.level || 1;
    var spd = (DATA[config.race] || {}).speed || 30;
    if (config.className === 'monk' && lvl >= 2) spd += lvl >= 18 ? 30 : lvl >= 14 ? 25 : lvl >= 10 ? 20 : lvl >= 6 ? 15 : 10;
    if (config.className === 'barbarian' && lvl >= 5) spd += 10;
    if (config.className === 'ranger' && lvl >= 6) spd += 10;
    if (hasFeat(st, 'Speedy', config)) spd += 10;
    if (hasFeat(st, 'Boon of Speed', config)) spd += 30;
    return Math.max(0, spd - 5 * getExhaustion(st));
}

// Darkvision: species range; Shadow Arts (Warrior of Shadow) and Umbral Sight
// (Gloom Stalker) give 60 ft, or +60 ft if you already have Darkvision.
function getDarkvision(config, state) {
    var lvl = (state && state.level) || 1;
    var dv = (DATA[config.race] || {}).darkvision || 0;
    if (lvl >= 3 && ((config.className === 'monk' && config.subclass === 'shadow') || (config.className === 'ranger' && config.subclass === 'gloomStalker'))) dv = dv ? dv + 60 : 60;
    // Aspect of the Wilds: Owl (Wild Heart 6+)
    if (lvl >= 6 && config.subclass === 'wildHeart' && state && state.aspectOfTheWilds === 'Owl') dv = dv ? dv + 60 : 60;
    return dv;
}

// Initiative: Dexterity modifier + Alert (Proficiency Bonus) + Dread Ambusher
// (Gloom Stalker 3+, Wisdom modifier); Remarkable Athlete (Champion 3+) and
// Assassinate (Assassin 3+) give Advantage. Returns { bonus, advantage, parts: [{ label, value }] }.
function getInitiative(config, state) {
    var st = Object.assign({ asiChoices: {}, level: 1 }, state || {});
    var lvl = st.level || 1;
    var dex = getMod(getAbilityScore(config, st, 'dex'));
    var parts = [{ label: 'DEX modifier', value: dex }];
    if (hasFeat(st, 'Alert', config)) parts.push({ label: 'Alert', value: getProfBonus(lvl) });
    if (config.className === 'ranger' && config.subclass === 'gloomStalker' && lvl >= 3) parts.push({ label: 'Dread Ambusher (WIS modifier)', value: getMod(getAbilityScore(config, st, 'wis')) });
    if (getExhaustion(st)) parts.push({ label: 'Exhaustion', value: -2 * getExhaustion(st) });
    return {
        bonus: parts.reduce(function (a, p) { return a + p.value; }, 0),
        advantage: lvl >= 3 && ((config.className === 'fighter' && config.subclass === 'champion') || (config.className === 'rogue' && config.subclass === 'assassin')),
        parts: parts
    };
}

// Effective ability scores (base + ASI/feat bonuses), for widgets.
function getEffectiveAbilities(config, state) {
    var st = Object.assign({ asiChoices: {}, level: 1 }, state || {});
    var out = {};
    ['str', 'dex', 'con', 'int', 'wis', 'cha'].forEach(function (a) { out[a] = getAbilityScore(config, st, a); });
    return out;
}

// Get the calculated (non-override) score for tooltip breakdown
function getCalculatedAbilityScore(config, state, ability) {
    let score = (config.baseAbilities || {})[ability] || 10;
    const asiChoices = state.asiChoices || {};
    for (let lvl = 1; lvl <= state.level; lvl++) {
        const choice = asiChoices[lvl];
        if (!choice) continue;
        if (choice.type === 'asi' && choice.abilities) {
            score += (choice.abilities[ability] || 0);
        }
        if (choice.type === 'feat' && choice.feat) {
            const feat = findFeat(choice.feat);
            if (feat && feat.abilityBonus && feat.abilityBonus[ability]) {
                score += feat.abilityBonus[ability];
            }
            if (feat && !feat.abilityBonus && choice.ability && choice.ability === ability) {
                score += 1;
            }
        }
    }
    return capstoneScore(config, state, ability, score);
}

function getAllAbilityScores(config, state) {
    const abilities = {};
    for (const ab of ['str', 'dex', 'con', 'int', 'wis', 'cha']) {
        abilities[ab] = getAbilityScore(config, state, ab);
    }
    return abilities;
}

function getHP(config, state) {
    const conScore = getAbilityScore(config, state, 'con');
    const conMod = getMod(conScore);
    const classData = DATA[config.className];
    const hitDie = classData ? classData.hitDie : (config.className === 'rogue' ? 8 : 6);
    // Level 1: max hit die + CON mod
    let hp = hitDie + conMod;
    // Each additional level: average (hitDie/2 + 1) + CON mod
    for (let i = 2; i <= state.level; i++) {
        hp += Math.floor(hitDie / 2) + 1 + conMod;
    }
    // Dwarven Toughness: +1 per level (Dwarf species)
    if (config.race === 'dwarf') {
        hp += state.level;
    }
    // Draconic Resilience (2024): +3 at Sorcerer level 3, +1 per level after.
    if (config.className === 'sorcerer' && config.subclass === 'draconic' && state.level >= 3) {
        hp += state.level;
    }
    // Feats from every source (background, Human Versatile, ASI levels):
    // Tough +2 per level (retroactive), Boon of Fortitude +40.
    if (hasFeat(state, 'Tough', config)) hp += state.level * 2;
    if (hasFeat(state, 'Boon of Fortitude', config)) hp += 40;
    return Math.max(hp, 1);
}

// Effective max HP: manual override (config.hp.max) wins if it is a
// positive number; otherwise the rules-derived value from getHP().
function getMaxHP(config, state) {
    var override = config && config.hp && config.hp.max;
    if (typeof override === 'number' && override > 0) return override;
    return getHP(config, state);
}

// Equipped armor/shield from state.items, resolved against DATA.itemDB.
function getEquippedGear(state) {
    var out = { armor: null, shield: null };
    var items = (state && Array.isArray(state.items)) ? state.items : [];
    var db = (typeof DATA !== 'undefined' && Array.isArray(DATA.itemDB)) ? DATA.itemDB : [];
    items.forEach(function (it) {
        if (!it || !it.equipped) return;
        var n = String(it.name || '').toLowerCase().replace(/ armor$/, '');
        var def = db.find(function (d) { return (it.ref && d.id === it.ref) || d.name.toLowerCase().replace(/ armor$/, '') === n; });
        if (!def) return;
        if (def.type === 'armor' && !out.armor) out.armor = def;
        if (def.type === 'shield' && !out.shield) out.shield = def;
    });
    return out;
}

// Carrying capacity (2024): Str × 15 lb for Small/Medium creatures.
function getCarryingCapacity(config, state) {
    return getAbilityScore(config, state, 'str') * 15;
}

// Attunement slots: 3, Thief's Use Magic Device (level 13) raises it to 4.
function getAttunementMax(config, state) {
    return (config && config.className === 'rogue' && config.subclass === 'thief' && ((state && state.level) || 1) >= 13) ? 4 : 3;
}

function getAC(config, state) {
    var dexMod = getMod(getAbilityScore(config, state, 'dex'));
    var className = config.className;
    var shieldBonus = state.equippedShield ? 2 : 0;
    // Fighting Style "Defense": +1 AC while wearing armor. Styles picked at
    // level-up live in state.fightingStyles; hasFeat checks every feat source.
    var defenseStyle = hasFeat(state, 'Defense', config) ? 1 : 0;
    // (2024: Dual Wielder no longer grants +1 AC — the old bonus was 2014.)
    var chaMod = getMod(getAbilityScore(config, state, 'cha'));

    // Items marked equipped in the inventory win over the per-class defaults below.
    var worn = getEquippedGear(state);
    if (worn.shield) shieldBonus = Math.max(shieldBonus, worn.shield.acBonus || 2);
    if (worn.armor) {
        var a = worn.armor;
        var dexPart = a.dexCap === null || a.dexCap === undefined ? dexMod : Math.min(dexMod, a.dexCap);
        return a.baseAC + dexPart + shieldBonus + defenseStyle;
    }

    if (className === 'rogue' || className === 'bard') {
        // Studded leather: 12 + DEX + shield
        var lightAc = 12 + dexMod + shieldBonus + defenseStyle;
        // College of Dance — Dazzling Footwork: no armor, no Shield: 10 + DEX + CHA.
        if (className === 'bard' && config.subclass === 'dance' && (state.level || 1) >= 3) {
            return Math.max(lightAc, 10 + dexMod + chaMod);
        }
        return lightAc;
    }
    if (className === 'sorcerer' || className === 'wizard' || className === 'warlock') {
        // Mage Armor (prepared, or Armor of Shadows invocation): 13 + DEX, otherwise 10 + DEX
        var hasMageArmor = (state.prepared && state.prepared.indexOf('Mage Armor') !== -1) ||
            (state.invocations && state.invocations.indexOf('Armor of Shadows') !== -1);
        var base = (hasMageArmor ? 13 : 10) + dexMod + shieldBonus;
        // Draconic Resilience (2024): unarmored base AC 10 + DEX + CHA.
        if (className === 'sorcerer' && config.subclass === 'draconic' && (state.level || 1) >= 3) {
            base = Math.max(base, 10 + dexMod + chaMod + shieldBonus);
        }
        return base;
    }
    if (className === 'fighter' || className === 'paladin') {
        // Check equipped armor type via state.equippedArmor; default chain mail 16 (no DEX)
        var armor = (state.equippedArmor || 'chain').toLowerCase();
        var acBase = 16; var acDex = 0;
        if (armor === 'plate') { acBase = 18; acDex = 0; }
        else if (armor === 'splint') { acBase = 17; acDex = 0; }
        else if (armor === 'half plate') { acBase = 15; acDex = Math.min(dexMod, 2); }
        else if (armor === 'breastplate') { acBase = 14; acDex = dexMod; }
        else if (armor === 'scale mail') { acBase = 14; acDex = Math.min(dexMod, 2); }
        else if (armor === 'chain shirt') { acBase = 13; acDex = dexMod; }
        else if (armor === 'studded leather') { acBase = 12; acDex = dexMod; }
        return acBase + acDex + shieldBonus + defenseStyle;
    }
    if (className === 'cleric') {
        // Default scale mail (14 + DEX max 2). 2024: the Protector Divine Order
        // grants Heavy armor training (chain mail 16) — the old check looked at a
        // non-existent state.subclass === 'war' (2014 War Domain heavy armor).
        if (config.divineOrder === 'protector' || state.equippedArmor === 'chain mail') return 16 + shieldBonus + defenseStyle;
        return 14 + Math.min(dexMod, 2) + shieldBonus + defenseStyle;
    }
    if (className === 'ranger') {
        // Studded leather: 12 + DEX, scale mail: 14 + min(dex,2)
        var rArmor = (state.equippedArmor || 'studded leather').toLowerCase();
        if (rArmor === 'scale mail') return 14 + Math.min(dexMod, 2) + shieldBonus + defenseStyle;
        return 12 + dexMod + shieldBonus + defenseStyle;
    }
    if (className === 'druid') {
        // Leather armor: 11 + DEX (druids don't wear metal in tradition, 2024 is free but default leather)
        return 11 + dexMod + shieldBonus + defenseStyle;
    }
    if (className === 'barbarian') {
        // Unarmored Defense: 10 + DEX + CON
        var conMod = getMod(getAbilityScore(config, state, 'con'));
        return 10 + dexMod + conMod + shieldBonus;
    }
    if (className === 'monk') {
        // Unarmored Defense: 10 + DEX + WIS (no shield allowed)
        var wisMod = getMod(getAbilityScore(config, state, 'wis'));
        return 10 + dexMod + wisMod;
    }
    // Default: 10 + DEX
    return 10 + dexMod + shieldBonus;
}

// True when the character has the feat from ANY source (background origin
// feat, Human Versatile, ASI levels, Fighting Style, Lessons of the First Ones).
// cfg is optional (only needed for the config.originFeat fallback).
function hasFeat(state, featName, cfg) {
    var want = resolveFeatName(featName);
    var list = featInstances(cfg || {}, state || {});
    for (var i = 0; i < list.length; i++) if (list[i].name === want) return true;
    return false;
}

function getMaxPrepared(state, abilityMod, className, subclass) {
    if (!className) className = 'sorcerer';
    // #P0hwaBZ — Third casters before the class check: fighter/rogue otherwise fall
    // into the non-caster branch below and always got 0. The 2024 column is fixed
    // (no ability mod) and identical for Eldritch Knight and Arcane Trickster.
    if (isThirdCaster(className, subclass)) {
        var tc = DATA.thirdCasterPrepared || [];
        return tc[state.level] || 0;
    }
    // 2024 PHB: fixed table per class level (Leveling Up subproject). Falls
    // through to the legacy 2014-style formula for levels beyond the table.
    var tbl = DATA.preparedTable && DATA.preparedTable[className];
    if (tbl && typeof tbl[state.level] === 'number') return tbl[state.level];
    // Full prepared casters: ability mod + class level
    if (className === 'sorcerer' || className === 'wizard' || className === 'druid' || className === 'cleric') {
        return Math.max(1, abilityMod + state.level);
    }
    // Bard: CHA mod + level (5.5e: prepares spells, swaps 1 per level-up)
    if (className === 'bard') {
        return Math.max(1, abilityMod + state.level);
    }
    // Half casters: ability mod + half class level
    if (className === 'paladin') {
        return Math.max(1, abilityMod + Math.floor(state.level / 2));
    }
    if (className === 'ranger') {
        // 2024: WIS mod + floor(ranger level / 2), min 1
        return Math.max(1, abilityMod + Math.floor(state.level / 2));
    }
    if (className === 'warlock') {
        // 2024: Warlock is prepared caster — CHA mod + warlock level (min 1)
        return Math.max(1, abilityMod + state.level);
    }
    // Non-casters (barbarian, fighter, monk, rogue): 0
    if (className === 'barbarian' || className === 'fighter' || className === 'monk' || className === 'rogue') {
        return 0;
    }
    return Math.max(1, abilityMod + state.level);
}

// cfg (optional): the Thaumaturge (Cleric) and Magician (Druid) orders add one
// cantrip of the class list, counted with the class cantrips.
function getMaxCantrips(level, className, subclass, cfg) {
    if (!className) className = 'sorcerer';
    // Third casters have no cantripsKnown on the class itself — it hangs off
    // the subclass (EK 2→3, AT 3→4, both with the jump at level 10).
    if (isThirdCaster(className, subclass)) {
        var tbl = (DATA.thirdCasterCantrips || {})[subclass] || [];
        return tbl[level] || 0;
    }
    var classData = DATA[className];
    var n = (classData && classData.cantripsKnown) ? (classData.cantripsKnown[level] || 0) : 0;
    if (cfg && ((className === 'cleric' && cfg.divineOrder === 'thaumaturge') ||
                (className === 'druid' && cfg.primalOrder === 'magician'))) n += 1;
    return n;
}

// Which class list does this character pick its spells from? Eldritch Knight and
// Arcane Trickster prepare from the WIZARD list. In 2024 the old
// school restriction (abjuration/evocation resp. enchantment/illusion) was dropped,
// so the full wizard list is the right source — no filter.
function getSpellListClass(className, subclass) {
    if (isThirdCaster(className, subclass)) return 'wizard';
    return className;
}
// Class lists you prepare (non-cantrip) spells from. Magical Secrets (Bard 10,
// 2024): the Cleric, Druid and Wizard lists too; those spells count as Bard spells.
function getSpellLists(className, subclass, level) {
    var base = getSpellListClass(className, subclass);
    if (className === 'bard' && (level || 1) >= 10) return [base, 'cleric', 'druid', 'wizard'];
    return [base];
}

function getSpellcastingAbility(className, subclass) {
    // Third-caster subclasses override class default
    if (subclass === 'eldritchKnight' || subclass === 'arcaneTrickster') return 'int';
    var map = { sorcerer: 'cha', wizard: 'int', druid: 'wis', paladin: 'cha', ranger: 'wis', warlock: 'cha', bard: 'cha', cleric: 'wis' };
    return map[className] || 'cha';
}

function isThirdCaster(className, subclass) {
    return (className === 'fighter' && subclass === 'eldritchKnight') ||
           (className === 'rogue' && subclass === 'arcaneTrickster');
}

function getSpellSlots(className, level, subclass) {
    if (className === 'warlock') return [];
    // Third-caster subclasses (Eldritch Knight, Arcane Trickster) — start level 3
    if (isThirdCaster(className, subclass)) {
        if (level < 3) return [];
        return (DATA.thirdCasterSlots && DATA.thirdCasterSlots[level]) || [];
    }
    var classData = DATA[className];
    if (!classData) return [];
    if (classData.spellSlots) return classData.spellSlots[level] || [];
    if (classData.spellcasting === 'half') return DATA.halfCasterSlots[level] || [];
    return [];
}

function formatMod(mod) {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ============================================================
// LEVELING UP (Metadocs/LevelingUp/) — level-up/down engine
// ============================================================

// ---- Small shared helpers (2024 build model) ----

// Firebase RTDB returns numeric-key maps (asiChoices, levelChoices) as ARRAYS
// when more than half of the keys 0..max exist. Normalise to a plain object
// keyed by level, without null holes.
function numMap(x) {
    var out = {};
    if (!x || typeof x !== 'object') return out;
    for (var k in x) if (x[k] != null) out[k] = x[k];
    return out;
}
function listOf(x) {
    if (Array.isArray(x)) return x.filter(function (v) { return v != null; });
    if (x && typeof x === 'object') return Object.keys(x).map(function (k) { return x[k]; }).filter(function (v) { return v != null; });
    return [];
}
// Firebase-safe key fragment: letters and digits only (spell names such as
// "Enlarge/Reduce" would otherwise create nested paths in a PATCH).
function slugKey(s) {
    var parts = String(s || '').replace(/[^A-Za-z0-9]+/g, ' ').trim().split(' ');
    return parts.map(function (p, i) { return i ? p.charAt(0).toUpperCase() + p.slice(1) : p.charAt(0).toLowerCase() + p.slice(1); }).join('');
}
function _inList(v, want) { return Array.isArray(want) ? want.indexOf(v) !== -1 : v === want; }

// ---- Feats ----
function resolveFeatName(name) {
    var al = (typeof DATA !== 'undefined' && DATA.featAliases) || {};
    return al[name] || name;
}
function findFeat(name) {
    var n = resolveFeatName(name);
    var list = DATA.feats || [];
    for (var i = 0; i < list.length; i++) if (list[i].name === n) return list[i];
    return null;
}

// Every feat the character has, from every source, as one list:
// { src: 'origin'|'species'|'asi'|'style'|'invocation', level, name, feat, rec }
// rec is the stored choice record (picks such as ability, spells, cantrips).
//   origin  → state.asiChoices[1] (creation wizard) or config.originFeat
//   species → state.speciesFeat (Human Versatile)
//   asi     → state.asiChoices[N] type 'feat' for N ≥ 2 (Ability Score Improvement levels)
//   style   → state.fightingStyles (Fighting Style feats picked at level-up)
//   invocation → state.invocationPicks['Lessons of the First Ones'].feats
function featInstances(cfg, st) {
    cfg = cfg || {}; st = st || {};
    var out = [];
    var asi = numMap(st.asiChoices);
    var lvl = st.level || 1;
    var o = asi[1];
    if (o && o.type === 'feat' && o.feat) out.push({ src: 'origin', level: 1, name: resolveFeatName(o.feat), feat: findFeat(o.feat), rec: o });
    else if (cfg.originFeat) out.push({ src: 'origin', level: 1, name: resolveFeatName(cfg.originFeat), feat: findFeat(cfg.originFeat), rec: {} });
    if (st.speciesFeat && st.speciesFeat.feat) out.push({ src: 'species', level: 1, name: resolveFeatName(st.speciesFeat.feat), feat: findFeat(st.speciesFeat.feat), rec: st.speciesFeat });
    for (var k in asi) {
        var n = parseInt(k, 10);
        if (!(n >= 2) || n > lvl) continue;
        var c = asi[k];
        if (c && c.type === 'feat' && c.feat) out.push({ src: 'asi', level: n, name: resolveFeatName(c.feat), feat: findFeat(c.feat), rec: c });
    }
    listOf(st.fightingStyles).forEach(function (s) {
        var f = findFeat(s);
        if (f) out.push({ src: 'style', level: 0, name: f.name, feat: f, rec: {} });
    });
    var lp = (st.invocationPicks || {})['Lessons of the First Ones'];
    listOf(lp && lp.feats).forEach(function (s) {
        out.push({ src: 'invocation', level: 0, name: resolveFeatName(s), feat: findFeat(s), rec: (lp.rec && lp.rec[s]) || {} });
    });
    return out;
}

// Armor training from class (+ Divine/Primal Order, College of Valor) and feats.
function getArmorTraining(cfg, st) {
    var cn = cfg.className, sub = cfg.subclass, lvl = (st && st.level) || 1;
    var t = { light: false, medium: false, heavy: false, shield: false };
    var set = function (keys) { keys.forEach(function (k) { t[k] = true; }); };
    var byClass = {
        barbarian: ['light', 'medium', 'shield'], bard: ['light'], cleric: ['light', 'medium', 'shield'],
        druid: ['light', 'shield'], fighter: ['light', 'medium', 'heavy', 'shield'], monk: [],
        paladin: ['light', 'medium', 'heavy', 'shield'], ranger: ['light', 'medium', 'shield'],
        rogue: ['light'], sorcerer: [], warlock: ['light'], wizard: []
    };
    set(byClass[cn] || []);
    if (cn === 'cleric' && cfg.divineOrder === 'protector') set(['heavy']);
    if (cn === 'druid' && cfg.primalOrder === 'warden') set(['medium']);
    if (cn === 'bard' && sub === 'valor' && lvl >= 3) set(['medium', 'shield']);
    featInstances(cfg, st).forEach(function (fi) {
        if (fi.name === 'Lightly Armored') set(['light', 'shield']);
        if (fi.name === 'Moderately Armored') set(['medium']);
        if (fi.name === 'Heavily Armored') set(['heavy']);
    });
    return t;
}

// Has the Spellcasting or Pact Magic FEATURE at this level (feat prerequisite);
// spells from species or feats don't count.
function hasCastingFeature(cfg, level) {
    var cn = cfg.className;
    if (isThirdCaster(cn, cfg.subclass)) return level >= 3;
    return ['bard', 'cleric', 'druid', 'paladin', 'ranger', 'sorcerer', 'warlock', 'wizard'].indexOf(cn) !== -1;
}
function hasFightingStyleFeature(cfg, level) {
    var cn = cfg.className;
    return cn === 'fighter' || ((cn === 'paladin' || cn === 'ranger') && level >= 2);
}

// Can this character take `feat` when reaching `level`? → { ok, reason }.
// Ability prerequisites use the current scores (before this level's pick).
function featPrereqMet(feat, cfg, st, level) {
    if (!feat) return { ok: false, reason: 'Unknown feat' };
    level = level || (st && st.level) || 1;
    if (feat.category === 'epic' && level < 19) return { ok: false, reason: 'Level 19+' };
    if (feat.category === 'fighting' && !hasFightingStyleFeature(cfg, level)) return { ok: false, reason: 'Needs the Fighting Style feature' };
    var p = feat.prereq || {};
    if (p.level && level < p.level) return { ok: false, reason: 'Level ' + p.level + '+' };
    if (p.abilities) {
        var keys = Object.keys(p.abilities), okAb = false;
        for (var i = 0; i < keys.length; i++) if (getAbilityScore(cfg, st, keys[i]) >= p.abilities[keys[i]]) okAb = true;
        if (!okAb) return { ok: false, reason: keys.map(function (k) { return k.toUpperCase(); }).join(' or ') + ' ' + p.abilities[keys[0]] + '+' };
    }
    if (p.spellcasting && !hasCastingFeature(cfg, level)) return { ok: false, reason: 'Needs the Spellcasting or Pact Magic feature' };
    if (p.armor) {
        var tr = getArmorTraining(cfg, st);
        if (!tr[p.armor]) return { ok: false, reason: (p.armor === 'shield' ? 'Shield' : p.armor.charAt(0).toUpperCase() + p.armor.slice(1) + ' armor') + ' training' };
    }
    if (!feat.repeatable && !feat.asi) {
        var have = featInstances(cfg, st).some(function (fi) { return fi.name === feat.name; });
        if (have) return { ok: false, reason: 'Already taken' };
    }
    return { ok: true, reason: '' };
}

// ---- Species / lineage ----
var SPECIES_OF_RACE = { woodElf: 'elf', highElf: 'elf', drow: 'elf' };
var SPECIES_LABEL = { aasimar: 'Aasimar', dragonborn: 'Dragonborn', dwarf: 'Dwarf', elf: 'Elf', gnome: 'Gnome', goliath: 'Goliath', halfling: 'Halfling', human: 'Human', orc: 'Orc', tiefling: 'Tiefling', halfElf: 'Half-Elf' };
var ELF_LINEAGE_LABEL = { woodElf: 'Wood Elf', highElf: 'High Elf', drow: 'Drow' };
function speciesOf(race) { return SPECIES_OF_RACE[race] || race; }
// { key, name } of the chosen lineage, or null. Elves: the race key itself.
function getLineage(cfg) {
    if (ELF_LINEAGE_LABEL[cfg.race]) return { key: cfg.race, name: ELF_LINEAGE_LABEL[cfg.race], data: DATA[cfg.race] };
    var r = DATA[cfg.race] || {};
    if (!r.lineages || !cfg.lineage || !r.lineages[cfg.lineage]) return null;
    return { key: cfg.lineage, name: r.lineages[cfg.lineage].name, data: r.lineages[cfg.lineage] };
}
function speciesNeedsLineage(cfg) { var r = DATA[cfg.race] || {}; return !!(r.lineages && !(cfg.lineage && r.lineages[cfg.lineage])); }
function speciesNeedsAbility(cfg) { var r = DATA[cfg.race] || {}; return r.spellAbility === 'choose' && ['int', 'wis', 'cha'].indexOf(cfg.speciesAbility) === -1; }

// ---- Counted choices that grow with level (DATA.choiceTotals) ----
var CHOICE_STATE_KEY = { invocations: 'invocations', metamagic: 'metamagic', wildShapeForms: 'wildShapeForms', maneuvers: 'maneuvers', weaponMasteries: 'weaponMasteries' };
function choiceTotal(id, cfg, level) {
    var t = (DATA.choiceTotals || {})[id] || {};
    var col = t[cfg.className] || t[cfg.subclass];
    if (!col) return 0;
    if (t[cfg.subclass] && !t[cfg.className] && level < 3) return 0;
    return col[Math.min(level, col.length - 1)] || 0;
}

// ---- Generic appliesTo matcher (resources + swap rules) ----
function ruleApplies(a, cfg, st) {
    a = a || {};
    var lvl = (st && st.level) || 1;
    if (a.className && !_inList(cfg.className, a.className)) return false;
    if (a.subclass && !_inList(cfg.subclass, a.subclass)) return false;
    if (a.race && !_inList(cfg.race, a.race)) return false;
    if (a.lineage && cfg.lineage !== a.lineage) return false;
    if (a.minLevel && lvl < a.minLevel) return false;
    if (a.maxLevel && lvl > a.maxLevel) return false;
    if (a.feat || a.featPrefix) {
        var fis = featInstances(cfg, st);
        if (a.feat && !fis.some(function (fi) { return fi.name === resolveFeatName(a.feat); })) return false;
        if (a.featPrefix && !fis.some(function (fi) { return fi.name.indexOf(a.featPrefix) === 0; })) return false;
    }
    if (a.invocation && listOf(st && st.invocations).indexOf(a.invocation) === -1) return false;
    if (a.fightingStyle) {
        var fs = listOf(st && st.fightingStyles);
        if (!fs.some(function (s) { return _inList(s, a.fightingStyle); })) return false;
    }
    return true;
}

// ---- Granted spells: class, subclass, species, lineage, feats, invocations ----
// One entry per (spell, source). kind: 'cantrip' | 'prepared' (always prepared,
// cast with slots) | 'innate' (always prepared + free casts / special casting)
// | 'ritual' (cast as a Ritual) | 'atWill' (no slot, no limit). Never counts
// against the class's prepared/cantrip maximum. Picks that are still open are
// returned as { open: true, count, filter } placeholders.
function _grantAbility(spec, ownerAbility, cfg, rec) {
    var ab = spec.ability || ownerAbility || 'class';
    if (ab === 'class') return getSpellcastingAbility(cfg.className, cfg.subclass);
    if (ab === 'species') return cfg.speciesAbility || null;
    if (ab === 'choose') return (rec && rec.spellAbility) || null;
    if (ab === 'ability') return (rec && rec.ability) || null;
    return ab;
}
function getGrantedSpells(cfg, st) {
    cfg = cfg || {}; st = st || {};
    var lvl = st.level || 1, out = [];
    var cn = cfg.className, cd = DATA[cn] || {};
    var push = function (spec, source, from, ownerAbility, rec, keyBase) {
        if (spec.lvl && spec.lvl > lvl) return;
        var ability = _grantAbility(spec, ownerAbility, cfg, rec);
        var names = [];
        if (spec.name) names = [spec.name];
        else if (spec.pick) {
            var picked = listOf(rec && rec[spec.pick]);
            var count = spec.count === 'pb' ? getProfBonus(lvl) : (spec.count || 1);
            if (!picked.length && spec.def) picked = [spec.def];
            names = picked.slice(0, count);
            if (names.length < count) out.push({ open: true, source: source, from: from, pick: spec.pick, count: count - names.length, kind: spec.kind, spec: spec });
        }
        names.forEach(function (nm) {
            var sp = (DATA.spellPool || {})[nm];
            out.push({
                name: nm, spellLevel: sp ? sp.level : (spec.kind === 'cantrip' ? 0 : (spec.level || 1)), kind: spec.kind,
                source: source, from: from, ability: ability, gained: spec.lvl || 1,
                free: spec.free != null ? spec.free : null, recharge: spec.recharge || null, slots: !!spec.slots,
                res: spec.res || null, cost: spec.cost || null, note: spec.note || '', swap: spec.swap || null,
                key: spec.free != null && !spec.res ? (spec.key || ('fc_' + slugKey(keyBase) + '_' + slugKey(nm))) : null
            });
        });
    };
    // Spells a class/subclass feature lets you choose live in st.featurePicks[key][pick]
    // (key = the grant's key, else the class or subclass id).
    var fPicks = st.featurePicks || {};
    (cd.spells || []).forEach(function (s) { push(s, 'class', (DATA[cn] && classLabel(cn)) || cn, cd.spellAbility, fPicks[s.key || cn] || {}, cn); });
    var sub = cfg.subclass && cd.subclasses && cd.subclasses[cfg.subclass];
    var deferred = [];
    if (sub && lvl >= (sub.level || 3)) {
        (sub.spells || []).forEach(function (s) {
            if (s.land && s.land !== st.landType) return;
            if (s.ifKnown) { deferred.push(s); return; }   // resolved after all other grants
            push(s, 'subclass', sub.name, sub.spellAbility, fPicks[s.key || cfg.subclass] || {}, cfg.subclass);
        });
    }
    var race = DATA[cfg.race] || {};
    var lin = getLineage(cfg);
    var spRec = { speciesCantrip: st.speciesCantrip ? [st.speciesCantrip] : [] };
    (race.spells || []).forEach(function (s) { push(s, 'species', speciesLabel(cfg), race.spellAbility === 'choose' ? 'species' : race.spellAbility, spRec, 'species'); });
    if (lin && lin.data && lin.data !== race && lin.data.spells) {
        lin.data.spells.forEach(function (s) { push(s, 'species', speciesLabel(cfg), 'species', spRec, 'species'); });
    }
    featInstances(cfg, st).forEach(function (fi) {
        if (!fi.feat || !fi.feat.spells) return;
        fi.feat.spells.forEach(function (s) { push(s, 'feat', fi.name, fi.feat.spellAbility || 'choose', fi.rec, 'feat' + fi.name); });
    });
    // "You know X — if you already know it, learn another <list> cantrip"
    // (Improved Illusions): checked against every cantrip known so far; the
    // replacement is stored in state.replacementCantrips[X].
    deferred.forEach(function (s) {
        var knownC = listOf(st.cantrips).concat(out.filter(function (g) { return !g.open && g.kind === 'cantrip'; }).map(function (g) { return g.name; }));
        if (knownC.indexOf(s.name) === -1) { push(s, 'subclass', sub.name, sub.spellAbility, null, cfg.subclass); return; }
        var repl = (st.replacementCantrips || {})[s.name];
        if (repl) push({ name: repl, lvl: s.lvl, kind: 'cantrip', note: 'instead of ' + s.name }, 'subclass', sub.name, sub.spellAbility, null, cfg.subclass);
        else out.push({ open: true, source: 'subclass', from: sub.name, pick: 'replacement', replaces: s.name, count: 1, kind: 'cantrip', spec: { list: s.ifKnown, level: 0 }, note: 'You already know ' + s.name + ': learn another ' + s.ifKnown.charAt(0).toUpperCase() + s.ifKnown.slice(1) + ' cantrip instead' });
    });
    var invPicks = st.invocationPicks || {};
    listOf(st.invocations).forEach(function (iv) {
        var inv = (DATA.invocations || []).filter(function (x) { return x.name === iv; })[0];
        if (!inv || !inv.spells) return;
        inv.spells.forEach(function (s) { push(s, 'invocation', inv.name, 'cha', invPicks[iv] || {}, 'inv' + inv.name); });
    });
    return out;
}

// ---- Resources (static registry + free casts generated from grants) ----
function _freeMax(free, cfg, st) {
    if (typeof free === 'number') return free;
    if (free === 'pb') return getProfBonus(st.level || 1);
    if (free === 'int' || free === 'wis' || free === 'cha') return Math.max(1, getMod(getAbilityScore(cfg, st, free)));
    return 1;
}
// All class/subclass/species/feat resources that apply to this character now.
function getClassResources(config, state) {
    config = config || {}; state = state || {};
    var out = (DATA.classResources || []).filter(function (r) { return ruleApplies(r.appliesTo, config, state); });
    var seen = {};
    out.forEach(function (r) { seen[r.stateKey] = true; });
    getGrantedSpells(config, state).forEach(function (g) {
        if (g.open || !g.key || seen[g.key]) return;
        seen[g.key] = true;
        out.push({
            id: g.key, label: g.name + ' — ' + g.from, dynamic: true,
            max: (function (free) { return function (c, s) { return _freeMax(free, c, s); }; })(g.free),
            stateKey: g.key, recharge: g.recharge || 'long', spellNames: [g.name], featureNames: [],
            desc: 'Cast ' + g.name + ' without a spell slot' + (g.free === 1 ? ' once' : '') + ' (' + g.from + '); ' +
                (g.recharge === 'short' ? 'regained on a Short or Long Rest.' : 'regained on a Long Rest.') +
                (g.slots ? ' You can also cast it with spell slots.' : '')
        });
    });
    return out;
}

// Display labels (core.js has the UI versions; the engine must run standalone).
function classLabel(cn) { return cn ? cn.charAt(0).toUpperCase() + cn.slice(1) : ''; }
function speciesLabel(cfg) {
    var sp = speciesOf(cfg.race);
    var base = SPECIES_LABEL[sp] || (cfg.race ? cfg.race.charAt(0).toUpperCase() + cfg.race.slice(1) : '');
    var lin = getLineage(cfg);
    return lin ? base + ' (' + lin.name + ')' : base;
}

// ---- Level-up delta ----
// Everything that changes when going from state.level to toLevel (single-class,
// combines class + subclass + species). Pure — no writes.
function getLevelUpDelta(config, state, toLevel) {
    // Older characters miss asiChoices in Firebase (empty objects are dropped)
    // — normalize so getAbilityScore/getHP never throw.
    state = Object.assign({ asiChoices: {} }, state);
    if (!state.asiChoices) state.asiChoices = {};
    var from = state.level || 1;
    var cn = config.className;
    var classData = DATA[cn] || {};
    var conMod = getMod(getAbilityScore(config, state, 'con'));
    var hitDie = classData.hitDie || 8;
    var levels = [];
    for (var l = from + 1; l <= toLevel; l++) levels.push(l);

    var features = [];   // { source: 'class'|'subclass'|'species', name, desc, level, act }
    var choices = [];    // { id, count?, total?, level, source }
    for (var i = 0; i < levels.length; i++) {
        var lvl = levels[i];
        var fl = (classData.features || {})[lvl] || [];
        for (var f = 0; f < fl.length; f++) features.push({ source: 'class', name: fl[f].name, desc: fl[f].desc, act: fl[f].act, level: lvl });
        // Subclass features (only when a subclass is already set — the L3 choice itself is in `choices`)
        var sub = config.subclass && classData.subclasses && classData.subclasses[config.subclass];
        var sfl = sub && sub.features && sub.features[lvl] || [];
        for (var s = 0; s < sfl.length; s++) features.push({ source: 'subclass', name: sfl[s].name, desc: sfl[s].desc, act: sfl[s].act, level: lvl });
        // Species
        var spl = (DATA.speciesProgression && DATA.speciesProgression[config.race] || {})[lvl] || [];
        for (var p = 0; p < spl.length; p++) features.push({ source: 'species', name: spl[p].name, desc: spl[p].desc, act: spl[p].act, level: lvl });
        // Choices
        var chl = (DATA.levelUpChoices && DATA.levelUpChoices[cn] || {})[lvl] || [];
        for (var c = 0; c < chl.length; c++) {
            if (chl[c].subclass && chl[c].subclass !== config.subclass) continue;   // subclass-only (Champion style)
            choices.push(Object.assign({ level: lvl, source: 'class' }, chl[c]));
        }
        // Ability Score Improvement / feat (level 19: Epic Boon or another feat)
        if ((classData.asiLevels || []).indexOf(lvl) !== -1) choices.push({ id: 'asi', level: lvl, source: 'class' });
    }
    // Fix mode (toLevel === current level, "Complete missing choices"): offer
    // Ability Score Improvement records that are missing at levels already reached.
    if (toLevel === from) {
        var asiRec = numMap(state.asiChoices);
        var missingAsi = (classData.asiLevels || []).filter(function (L) { return L <= from && !asiRec[L]; })[0];
        if (missingAsi) choices.push({ id: 'asi', level: missingAsi, source: 'class' });
    }
    // Counted choices that grow with level: ask for (total at toLevel − known).
    // The subclass ones (maneuvers) are re-evaluated by the steps builder once a
    // subclass is picked in this same level-up.
    Object.keys(DATA.choiceTotals || {}).forEach(function (id) {
        var col = (DATA.choiceTotals[id] || {});
        if (col[cn] || (config.subclass && col[config.subclass]) || (id === 'maneuvers' && cn === 'fighter')) {
            choices.push({ id: id, level: toLevel, source: 'class', totalAt: toLevel });
        }
    });
    // Self-healing: creation-time picks that were never recorded.
    if (speciesNeedsLineage(config)) choices.unshift({ id: 'lineage', level: toLevel, source: 'species', fix: true });
    if (speciesNeedsAbility(config)) choices.unshift({ id: 'speciesAbility', level: toLevel, source: 'species', fix: true });
    if ((cn === 'cleric' && !config.divineOrder) || (cn === 'druid' && !config.primalOrder)) choices.unshift({ id: 'order', level: toLevel, source: 'class', fix: true });
    if (config.race === 'human' && !(state.speciesFeat && state.speciesFeat.feat)) choices.unshift({ id: 'versatileFeat', level: toLevel, source: 'species', fix: true });
    // at the target level: picks that grow with Proficiency Bonus (Ritual Caster) open up here too
    if (openFeatPicks(config, Object.assign({}, state, { level: toLevel })).length) choices.unshift({ id: 'featPicks', level: toLevel, source: 'feat', fix: true });
    if (openInvocationPicks(config, state).length) choices.unshift({ id: 'invocationPicks', level: toLevel, source: 'class', fix: true });

    // Spellcasting deltas (uses a state clone at each level to query pure fns)
    var stFrom = Object.assign({}, state, { level: from });
    var stTo = Object.assign({}, state, { level: toLevel });
    var ability = getSpellcastingAbility(cn, config.subclass);
    var mod = getMod(getAbilityScore(config, state, ability));
    var grantsFrom = getGrantedSpells(config, stFrom).filter(function (g) { return !g.open; }).map(function (g) { return g.name + '|' + g.source; });
    var newGrants = getGrantedSpells(config, stTo).filter(function (g) { return !g.open && grantsFrom.indexOf(g.name + '|' + g.source) === -1; });
    var delta = {
        from: from, to: toLevel,
        hpGain: getHP(config, stTo) - getHP(config, stFrom),
        newMaxHp: getHP(config, stTo),
        profBonus: { old: getProfBonus(from), new: getProfBonus(toLevel) },
        features: features,
        choices: choices,
        slots: { old: getSpellSlots(cn, from, config.subclass), new: getSpellSlots(cn, toLevel, config.subclass) },
        prepared: { old: getMaxPrepared(stFrom, mod, cn, config.subclass), new: getMaxPrepared(stTo, mod, cn, config.subclass) },
        cantrips: { old: getMaxCantrips(from, cn, config.subclass, config), new: getMaxCantrips(toLevel, cn, config.subclass, config) },
        spellbookAdds: (cn === 'wizard') ? 2 * levels.length : 0,
        sneakAttack: classData.sneakAttack ? { old: classData.sneakAttack[from], new: classData.sneakAttack[toLevel] } : null,
        newGrantedSpells: newGrants,
        // Class/subclass/species resources that newly unlock in this level range
        newResources: (DATA.classResources || []).filter(function (r) {
            var a = r.appliesTo || {};
            if (!a.minLevel || a.minLevel <= from || a.minLevel > toLevel) return false;
            return ruleApplies(Object.assign({}, a, { minLevel: 0, maxLevel: 0 }), config, stTo);
        })
    };
    return delta;
}

// One-of-N feature picks (DATA.optionChoices): the stored option, and the ones
// that apply now but have no pick yet.
function optionPicked(o, st) {
    var v = (st || {})[o.stateKey];
    return v ? (o.options.filter(function (x) { return x.name === v; })[0] || null) : null;
}
function openOptionChoices(cfg, st) {
    return (DATA.optionChoices || []).filter(function (o) { return ruleApplies(o.appliesTo, cfg, st) && !(st || {})[o.stateKey]; });
}

// Invocation spell picks still missing (Pact of the Tome: 3 cantrips + 2 rituals).
function openInvocationPicks(cfg, st) {
    var open = [], picks = st.invocationPicks || {};
    listOf(st.invocations).forEach(function (iv) {
        var inv = (DATA.invocations || []).filter(function (x) { return x.name === iv; })[0];
        (inv && inv.spells || []).forEach(function (s) {
            if (!s.pick) return;
            var have = listOf((picks[iv] || {})[s.pick]).length;
            if (have < s.count) open.push({ invocation: iv, pick: s.pick, need: s.count - have, spec: s });
        });
    });
    return open;
}

// Feat picks (spells/cantrips) that a stored feat still needs — e.g. a
// background Magic Initiate whose spells were never recorded.
function openFeatPicks(cfg, st) {
    var open = [];
    featInstances(cfg, st).forEach(function (fi) {
        if (!fi.feat || !fi.feat.spells || fi.src === 'style') return;
        fi.feat.spells.forEach(function (s) {
            if (!s.pick) return;
            var have = listOf(fi.rec && fi.rec[s.pick]).length;
            var count = s.count === 'pb' ? getProfBonus(st.level || 1) : (s.count || 1);
            if (have < count) open.push({ src: fi.src, level: fi.level, feat: fi.name, pick: s.pick, need: count - have, spec: s });
        });
        if (fi.feat.spellAbility === 'choose' && !(fi.rec && fi.rec.spellAbility)) open.push({ src: fi.src, level: fi.level, feat: fi.name, pick: 'spellAbility', need: 1 });
    });
    return open;
}

// ============================================================
// BUILD PROFILE (2024) — everything a character has at its level:
// spells (class + granted), feats, actions by action type, resources,
// what was chosen, what is granted, and what can be swapped when.
// Pure; works on a real character or on a synthetic template character
// (empty picks → open choices are reported instead of failing).
// ============================================================
var ACT_ORDER = ['action', 'bonus', 'reaction', 'attack', 'free', 'other'];
function _castAct(sp) {
    var t = String((sp && sp.time) || '').toLowerCase();
    if (/bonus/.test(t)) return 'bonus';
    if (/reaction/.test(t)) return 'reaction';
    if (/action/.test(t)) return 'action';
    return 'other';  // 1 minute or longer (rituals, utility)
}
function getBuildProfile(cfg, st) {
    cfg = cfg || {}; st = Object.assign({ asiChoices: {} }, st || {});
    var lvl = st.level || 1, pb = getProfBonus(lvl);
    var cn = cfg.className, cd = DATA[cn] || {};
    var sub = cfg.subclass && cd.subclasses && cd.subclasses[cfg.subclass];
    if (sub && lvl < (sub.level || 3)) sub = null;
    var race = DATA[cfg.race] || {};
    var lin = getLineage(cfg);
    var abilityMod = function (ab) { return ab ? getMod(getAbilityScore(cfg, st, ab)) : null; };
    var prof = {
        level: lvl, pb: pb,
        who: {
            className: cn, classLabel: classLabel(cn), subclass: sub ? cfg.subclass : null, subclassLabel: sub ? sub.name : null,
            race: cfg.race, species: speciesOf(cfg.race), speciesLabel: speciesLabel(cfg), lineage: lin ? lin.key : null,
            size: race.size || '', speed: getSpeed(cfg, st), darkvision: getDarkvision(cfg, st), initiative: getInitiative(cfg, st),
            hp: getMaxHP(cfg, st), ac: getAC(cfg, st)
        },
        casting: null, granted: [], feats: [], features: [], actions: {}, resources: [],
        chosen: [], open: [], swaps: { longRest: [], shortRest: [], levelUp: [], use: [] }, notes: []
    };
    ACT_ORDER.forEach(function (a) { prof.actions[a] = []; });

    // --- Class spellcasting ---
    var castsNow = hasCastingFeature(cfg, lvl) && (getSpellcastingStart_(cfg) <= lvl);
    if (castsNow) {
        var ab = getSpellcastingAbility(cn, cfg.subclass), mod = abilityMod(ab);
        var maxC = getMaxCantrips(lvl, cn, cfg.subclass, cfg);
        var maxP = getMaxPrepared(st, mod, cn, cfg.subclass);
        var slots = cn === 'warlock' ? [] : getSpellSlots(cn, lvl, cfg.subclass);
        var pact = cn === 'warlock' ? { count: (cd.pactSlots || {})[lvl] || 0, level: (cd.pactSlotLevel || {})[lvl] || 1 } : null;
        var maxSpellLevel = pact ? pact.level : (function () { var m = 0; (slots || []).forEach(function (n, i) { if (n > 0) m = i + 1; }); return m; })();
        prof.casting = {
            list: getSpellListClass(cn, cfg.subclass), ability: ab, dc: 8 + pb + mod, atk: pb + mod,
            cantrips: { max: maxC, known: listOf(st.cantrips) },
            prepared: { max: maxP, known: listOf(st.prepared), maxLevel: maxSpellLevel },
            slots: slots, pact: pact
        };
        if (maxC > listOf(st.cantrips).length) prof.open.push({ id: 'cantrips', what: 'Choose ' + (maxC - listOf(st.cantrips).length) + ' more cantrip(s) from the ' + classLabel(prof.casting.list) + ' list' });
        if (maxP > listOf(st.prepared).length) prof.open.push({ id: 'prepared', what: 'Prepare ' + (maxP - listOf(st.prepared).length) + ' more spell(s) (level ' + maxSpellLevel + ' or lower)' });
    }

    // --- Granted spells ---
    var granted = getGrantedSpells(cfg, st);
    granted.forEach(function (g) {
        // Feat picks are reported once, via openFeatPicks() below.
        if (g.open) { if (g.source !== 'feat') prof.open.push({ id: 'grantPick', what: (g.note || ('Choose ' + g.count + ' ' + (g.kind === 'cantrip' ? 'cantrip(s)' : 'spell(s)'))) + ' — ' + g.from, source: g.source }); return; }
        var m = abilityMod(g.ability);
        prof.granted.push(Object.assign({}, g, { dc: m == null ? null : 8 + pb + m, atk: m == null ? null : pb + m, freeMax: g.free != null ? _freeMax(g.free, cfg, st) : null }));
        if (g.ability == null && g.source === 'species') prof.open.push({ id: 'speciesAbility', what: 'Choose INT, WIS or CHA as the spellcasting ability for your ' + g.from + ' spells' });
    });
    // de-duplicate species-ability prompts
    prof.open = prof.open.filter(function (o, i, arr) { return o.id !== 'speciesAbility' || arr.findIndex(function (x) { return x.id === 'speciesAbility'; }) === i; });

    // --- Feats ---
    featInstances(cfg, st).forEach(function (fi) {
        var srcLabel = { origin: 'Background (origin feat)', species: 'Human Versatile', asi: 'Level ' + fi.level, style: 'Fighting Style', invocation: 'Lessons of the First Ones' }[fi.src] || fi.src;
        prof.feats.push({ name: fi.name, src: fi.src, sourceLabel: srcLabel, level: fi.level, category: fi.feat ? fi.feat.category : '?', desc: fi.feat ? fi.feat.desc : '', rec: fi.rec, unknown: !fi.feat });
        if (!fi.feat) prof.notes.push('Feat "' + fi.name + '" is not in the 2024 feat list — check the name.');
        else if (fi.src === 'asi') {
            var pr = featPrereqMet(fi.feat, cfg, Object.assign({}, st, { asiChoices: {} }), fi.level);
            if (!pr.ok && pr.reason !== 'Already taken') prof.notes.push(fi.name + ': prerequisite not met (' + pr.reason + ').');
        }
        (fi.feat && fi.feat.actions || []).forEach(function (a) { prof.actions[a.act] && prof.actions[a.act].push({ name: a.name, source: 'feat', from: fi.name, desc: a.desc }); });
    });
    openFeatPicks(cfg, st).forEach(function (o) { prof.open.push({ id: 'featPicks', what: o.feat + ': ' + (o.pick === 'spellAbility' ? 'choose the spellcasting ability' : 'choose ' + o.need + ' ' + o.pick) }); });
    // Feats due at ASI levels that have no record yet
    (cd.asiLevels || []).forEach(function (L) { if (L <= lvl && !numMap(st.asiChoices)[L]) prof.open.push({ id: 'asi', what: 'Level ' + L + (L === 19 ? ': Epic Boon (or another feat)' : ': Ability Score Improvement or a feat') }); });

    // --- Features (class, subclass, species, lineage) with action type ---
    var resList = getClassResources(cfg, st);
    var resByFeature = {};
    resList.forEach(function (r) { (r.featureNames || []).forEach(function (n) { resByFeature[n.toLowerCase()] = r; }); });
    var addFeature = function (f, source, level) {
        var r = resByFeature[f.name.toLowerCase()] || null;
        prof.features.push({ name: f.name, source: source, level: level, act: f.act || null, desc: typeof f.desc === 'object' ? (f.desc.en || f.desc.nl) : f.desc, res: r ? r.id : null });
        if (f.act && prof.actions[f.act]) prof.actions[f.act].push({ name: f.name, source: source, desc: typeof f.desc === 'object' ? f.desc.en : f.desc, res: r ? r.label : null });
    };
    for (var L = 1; L <= lvl; L++) {
        ((cd.features || {})[L] || []).forEach(function (f) { addFeature(f, 'class', L); });
        if (sub) ((sub.features || {})[L] || []).forEach(function (f) { addFeature(f, 'subclass', L); });
        (((DATA.speciesProgression || {})[cfg.race] || {})[L] || []).forEach(function (f) { addFeature(f, 'species', L); });
    }
    (race.features || []).forEach(function (f) { addFeature(f, 'species', 1); });
    if (lin && lin.data && lin.data !== race) (lin.data.features || []).forEach(function (f) { addFeature(f, 'species', 1); });
    listOf(st.invocations).forEach(function (iv) {
        var inv = (DATA.invocations || []).filter(function (x) { return x.name === iv; })[0];
        if (inv) addFeature({ name: inv.name, act: inv.act, desc: inv.desc }, 'invocation', 1);
    });
    listOf(st.maneuvers).forEach(function (mn) {
        var m = (DATA.maneuvers || []).filter(function (x) { return x.name === mn; })[0];
        if (m) addFeature({ name: m.name, act: m.act, desc: m.desc }, 'maneuver', 3);
    });
    listOf(st.metamagic).forEach(function (mm) {
        var m = (DATA.metamagic || []).filter(function (x) { return x.name === mm; })[0];
        if (m) prof.features.push({ name: m.name, source: 'metamagic', level: 2, act: null, desc: (typeof m.desc === 'object' ? m.desc.en : m.desc) + ' (' + m.cost + ' Sorcery Point' + (m.cost === 1 ? '' : 's') + ')' });
    });
    // The option picked for a one-of-N feature (Blessed Strikes, Elemental Fury, …)
    (DATA.optionChoices || []).forEach(function (o) {
        var op = optionPicked(o, st);
        if (op && ruleApplies(o.appliesTo, cfg, st)) addFeature({ name: o.label + ': ' + op.name, act: op.act, desc: op.desc }, 'option', (o.appliesTo || {}).minLevel || 1);
    });

    // --- Spells as actions (by casting time) ---
    var spellAct = function (nm, source, from) {
        var sp = (DATA.spellPool || {})[nm];
        if (!sp) return;
        prof.actions[_castAct(sp)].push({ name: nm, source: source, from: from, spell: true, level: sp.level });
    };
    if (prof.casting) {
        prof.casting.cantrips.known.forEach(function (n) { spellAct(n, 'class', 'cantrip'); });
        prof.casting.prepared.known.forEach(function (n) { spellAct(n, 'class', 'prepared'); });
    }
    prof.granted.forEach(function (g) { if (g.kind !== 'ritual') spellAct(g.name, g.source, g.from); });
    // One row per name per action type; merge the sources ("Misty Step — Archfey Patron, Fey-Touched").
    ACT_ORDER.forEach(function (a) {
        var merged = [], byName = {};
        prof.actions[a].forEach(function (x) {
            var k = (x.spell ? 's:' : 'f:') + x.name;
            if (byName[k]) { var f = x.from || x.source; if (f && byName[k].froms.indexOf(f) === -1) byName[k].froms.push(f); return; }
            byName[k] = Object.assign({}, x, { froms: [x.from || x.source] });
            merged.push(byName[k]);
        });
        prof.actions[a] = merged;
    });

    // --- Resources ---
    resList.forEach(function (r) {
        prof.resources.push({ id: r.id, label: r.label, max: r.max(cfg, st), recharge: r.recharge, unit: r.unit || null, die: r.die ? r.die(st) : null, dynamic: !!r.dynamic });
    });

    // --- Chosen (stored picks) ---
    var chosen = function (what, value, swapId) { if (value && (!Array.isArray(value) || value.length)) prof.chosen.push({ what: what, value: Array.isArray(value) ? value.join(', ') : value, swap: swapId || null }); };
    if (sub) chosen('Subclass', sub.name);
    if (lin) chosen((race.lineageLabel || 'Lineage'), lin.name);
    if (cfg.speciesAbility) chosen('Species spellcasting ability', cfg.speciesAbility.toUpperCase());
    if (cfg.divineOrder) chosen('Divine Order', cfg.divineOrder.charAt(0).toUpperCase() + cfg.divineOrder.slice(1));
    if (cfg.primalOrder) chosen('Primal Order', cfg.primalOrder.charAt(0).toUpperCase() + cfg.primalOrder.slice(1));
    chosen('Skills', listOf(cfg.defaultSkills));
    chosen('Expertise', listOf(cfg.expertSkills));
    chosen('Fighting Style', listOf(st.fightingStyles), 'fightingStyle');
    chosen('Weapon Mastery', listOf(st.weaponMasteries), 'mastery');
    chosen('Metamagic', listOf(st.metamagic), 'metamagic');
    chosen('Eldritch Invocations', listOf(st.invocations), 'invocation');
    chosen('Maneuvers', listOf(st.maneuvers), 'maneuver');
    chosen('Wild Shape forms', listOf(st.wildShapeForms), 'wildShapeForm');
    if (prof.casting) { chosen('Cantrips', prof.casting.cantrips.known, 'cantrip'); chosen('Prepared spells', prof.casting.prepared.known, 'prepared'); }
    if (st.landType) chosen('Land type', st.landType.charAt(0).toUpperCase() + st.landType.slice(1), 'landType');
    if (st.huntersPrey) chosen("Hunter's Prey", st.huntersPrey, 'huntersPrey');
    (DATA.optionChoices || []).forEach(function (o) {
        if (!ruleApplies(o.appliesTo, cfg, st)) return;
        if (st[o.stateKey]) chosen(o.label, st[o.stateKey], o.swap ? o.id : null);
        else prof.open.push({ id: 'option', what: 'Choose your ' + o.label + ' option (' + o.options.map(function (x) { return x.name; }).join(' or ') + ')' });
    });
    var asi = numMap(st.asiChoices);
    Object.keys(asi).forEach(function (k) {
        var c = asi[k];
        if (c && c.type === 'asi' && c.abilities) chosen('Level ' + k + ' Ability Score Improvement', Object.keys(c.abilities).map(function (a) { return a.toUpperCase() + ' +' + c.abilities[a]; }).join(', '));
    });

    // --- Counted choices still open (total semantics) ---
    Object.keys(CHOICE_STATE_KEY).forEach(function (id) {
        var tot = choiceTotal(id, cfg, lvl);
        var have = listOf(st[CHOICE_STATE_KEY[id]]).length;
        if (tot > have) prof.open.push({ id: id, what: 'Choose ' + (tot - have) + ' more ' + ({ invocations: 'Eldritch Invocation(s)', metamagic: 'Metamagic option(s)', wildShapeForms: 'Wild Shape form(s)', maneuvers: 'maneuver(s)', weaponMasteries: 'Weapon Mastery weapon(s)' }[id]) + ' (' + tot + ' known at level ' + lvl + ')' });
    });
    if (speciesNeedsLineage(cfg)) prof.open.unshift({ id: 'lineage', what: 'Choose your ' + (race.lineageLabel || 'lineage') });
    if (cn === 'cleric' && !cfg.divineOrder) prof.open.unshift({ id: 'order', what: 'Choose your Divine Order (Protector or Thaumaturge)' });
    if (cn === 'druid' && !cfg.primalOrder) prof.open.unshift({ id: 'order', what: 'Choose your Primal Order (Magician or Warden)' });
    if (cfg.race === 'human' && !(st.speciesFeat && st.speciesFeat.feat)) prof.open.unshift({ id: 'versatileFeat', what: 'Choose your Human Versatile origin feat' });
    if (sub && cfg.subclass === 'land' && !st.landType) prof.open.push({ id: 'landType', what: 'Choose a land type (Arid, Polar, Temperate or Tropical) for your Circle Spells — you can change it on every Long Rest' });

    // --- Swaps ---
    (DATA.swapRules || []).forEach(function (r) {
        if (ruleApplies(r.appliesTo, cfg, st) && prof.swaps[r.when]) prof.swaps[r.when].push({ id: r.id, what: r.what });
    });

    // --- Interaction notes (unusual combinations) ---
    var bySpell = {};
    var addSrc = function (nm, src) { (bySpell[nm] = bySpell[nm] || []).push(src); };
    if (prof.casting) { prof.casting.cantrips.known.forEach(function (n) { addSrc(n, classLabel(cn) + ' cantrip'); }); prof.casting.prepared.known.forEach(function (n) { addSrc(n, classLabel(cn) + ' prepared'); }); }
    prof.granted.forEach(function (g) { addSrc(g.name, g.from); });
    Object.keys(bySpell).forEach(function (nm) {
        var srcs = bySpell[nm].filter(function (s, i, a) { return a.indexOf(s) === i; });
        if (srcs.length < 2) return;
        var ownPick = srcs.some(function (s) { return / (cantrip|prepared)$/.test(s); });
        var isCantrip = ((DATA.spellPool || {})[nm] || {}).level === 0;
        prof.notes.push(nm + ' comes from ' + srcs.join(' and ') + ' — ' + (!isCantrip ? 'you only need it once; free casts from each source still apply.'
            : ownPick ? 'swap the copy you picked yourself the next time your class lets you replace a cantrip.'
            : 'you simply know it once; the second source adds nothing (the 2024 rules have no replacement for this).'));
    });
    // "If you already know it, learn another cantrip" (Improved Illusions).
    getGrantedSpells(cfg, st).forEach(function (g) {
        if (g.open && g.pick === 'replacement') prof.notes.push('You already know ' + g.replaces + ' from another source, so ' + g.from + ' lets you pick a different ' + classLabel(g.spec.list) + ' cantrip instead.');
        else if (/^instead of /.test(g.note || '')) prof.notes.push('You already knew ' + g.note.slice(11) + ' from another source, so ' + g.from + ' gave you ' + g.name + ' instead.');
    });
    var anySpells = !!prof.casting || prof.granted.length > 0;
    if (cn === 'barbarian' && anySpells) prof.notes.push("While raging you can't cast spells or keep Concentration — spells you get only work outside your Rage.");
    // 2024 Wild Shape keeps class features and feats but doesn't list species traits.
    if (cn === 'druid' && lvl >= 2) {
        prof.notes.push("In Wild Shape you keep your class features and feats; the 2024 rules don't list species traits, so your species abilities likely don't work in beast form (ask your DM).");
    }
    if (cn === 'druid' && lvl >= 2) prof.notes.push(cfg.subclass === 'moon' && sub ? 'In Wild Shape you can cast only your Circle of the Moon spells.' : "In Wild Shape you can't cast spells (Concentration on a spell you already cast continues).");
    if (cn === 'druid' && lvl >= 3 && sub && (cfg.subclass === 'stars' || cfg.subclass === 'sea')) prof.notes.push((cfg.subclass === 'stars' ? 'Starry Form' : 'Wrath of the Sea') + ' spends a Wild Shape use but is not a beast shape — you keep your own statistics and can still cast spells.');
    if (!prof.casting && prof.granted.some(function (g) { return g.slots && g.kind === 'innate'; })) prof.notes.push('You have no spell slots, so granted spells can only be cast with their free uses.');
    return prof;
}
// Class spellcasting start level (core.js has the UI helper; standalone copy).
function getSpellcastingStart_(cfg) {
    if (isThirdCaster(cfg.className, cfg.subclass)) return 3;
    var cd = DATA[cfg.className];
    return (cd && cd.spellcastingStart) || 1;
}

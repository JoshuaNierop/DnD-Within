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
    let score = config.baseAbilities[ability] || 10;
    // Add ASI bonuses from all levels up to current
    for (let lvl = 1; lvl <= state.level; lvl++) {
        const choice = state.asiChoices[lvl];
        if (!choice) continue;
        if (choice.type === 'asi' && choice.abilities) {
            score += (choice.abilities[ability] || 0);
        }
        if (choice.type === 'feat' && choice.feat) {
            const feat = DATA.feats.find(f => f.name === choice.feat);
            if (feat && feat.abilityBonus && feat.abilityBonus[ability]) {
                score += feat.abilityBonus[ability];
            }
            // Choice-based abilityBonus: feats die "+1 STR of DEX" bieden (geen vaste abilityBonus)
            // Gebruik choice.ability uit state als gekozen
            if (feat && !feat.abilityBonus && choice.ability && choice.ability === ability) {
                score += 1;
            }
        }
    }
    return score;
}

// Get the calculated (non-override) score for tooltip breakdown
function getCalculatedAbilityScore(config, state, ability) {
    let score = config.baseAbilities[ability] || 10;
    for (let lvl = 1; lvl <= state.level; lvl++) {
        const choice = state.asiChoices[lvl];
        if (!choice) continue;
        if (choice.type === 'asi' && choice.abilities) {
            score += (choice.abilities[ability] || 0);
        }
        if (choice.type === 'feat' && choice.feat) {
            const feat = DATA.feats.find(f => f.name === choice.feat);
            if (feat && feat.abilityBonus && feat.abilityBonus[ability]) {
                score += feat.abilityBonus[ability];
            }
            // Choice-based abilityBonus: feats die "+1 STR of DEX" bieden (geen vaste abilityBonus)
            // Gebruik choice.ability uit state als gekozen
            if (feat && !feat.abilityBonus && choice.ability && choice.ability === ability) {
                score += 1;
            }
        }
    }
    return score;
}

function getAbilityBreakdown(config, state, ability) {
    const base = config.baseAbilities[ability] || 10;

    // Background bonuses - check config or default to empty
    const bgBonuses = config.backgroundBonuses || {};
    let racialBonus = bgBonuses[ability] || 0;
    let baseWithoutRacial = base - racialBonus;

    // ASI bonuses
    let asiTotal = 0;
    let asiDetails = [];
    for (let lvl = 1; lvl <= state.level; lvl++) {
        const choice = state.asiChoices[lvl];
        if (!choice) continue;
        if (choice.type === 'asi' && choice.abilities && choice.abilities[ability]) {
            asiTotal += choice.abilities[ability];
            asiDetails.push(`Level ${lvl} ASI: +${choice.abilities[ability]}`);
        }
        if (choice.type === 'feat' && choice.feat) {
            const feat = DATA.feats.find(f => f.name === choice.feat);
            if (feat && feat.abilityBonus && feat.abilityBonus[ability]) {
                asiTotal += feat.abilityBonus[ability];
                asiDetails.push(`${choice.feat}: +${feat.abilityBonus[ability]}`);
            }
        }
    }

    const total = baseWithoutRacial + racialBonus + asiTotal;

    return {
        baseArray: baseWithoutRacial,
        racialBonus,
        asiTotal,
        asiDetails,
        total
    };
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
    // Tough feat: +2 per level (retroactive)
    if (state.asiChoices) {
        for (let lvl = 1; lvl <= state.level; lvl++) {
            const choice = state.asiChoices[lvl];
            if (choice && choice.type === 'feat' && choice.feat === 'Tough') {
                hp += state.level * 2;
                break;
            }
        }
    }
    // Hill Dwarf (legacy) — +1/lvl already via Dwarven Toughness in 2024
    // Boon of Fortitude: +40 max HP
    if (state.asiChoices) {
        for (let lvl = 1; lvl <= state.level; lvl++) {
            const choice = state.asiChoices[lvl];
            if (choice && choice.type === 'feat' && choice.feat === 'Boon of Fortitude') {
                hp += 40;
                break;
            }
        }
    }
    return Math.max(hp, 1);
}

// Effectieve max HP: handmatige override (config.hp.max) wint als die een
// positief getal is; anders de rules-afgeleide waarde uit getHP().
function getMaxHP(config, state) {
    var override = config && config.hp && config.hp.max;
    if (typeof override === 'number' && override > 0) return override;
    return getHP(config, state);
}

function getAC(config, state) {
    var dexMod = getMod(getAbilityScore(config, state, 'dex'));
    var className = config.className;
    var shieldBonus = state.equippedShield ? 2 : 0;
    var defenseStyle = 0;
    // Fighting Style "Defense": +1 AC terwijl je armor draagt
    if (state.asiChoices) {
        for (var lvl in state.asiChoices) {
            var c = state.asiChoices[lvl];
            if (c && c.type === 'feat' && c.feat === 'Defense') { defenseStyle = 1; break; }
        }
    }
    // Dual Wielder: +1 AC als state.dualWielding
    var dualWieldBonus = state.dualWielding && hasFeat(state, 'Dual Wielder') ? 1 : 0;

    if (className === 'rogue' || className === 'bard') {
        // Studded leather: 12 + DEX + shield
        return 12 + dexMod + shieldBonus + defenseStyle + dualWieldBonus;
    }
    if (className === 'sorcerer' || className === 'wizard' || className === 'warlock') {
        // Mage Armor if prepared: 13 + DEX, otherwise 10 + DEX
        var base = (state.prepared && (state.prepared.includes('Mage Armor') || state.prepared.includes('Armor of Agathys'))) ? 13 : 10;
        return base + dexMod + shieldBonus + dualWieldBonus;
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
        return acBase + acDex + shieldBonus + defenseStyle + dualWieldBonus;
    }
    if (className === 'cleric') {
        // Default scale mail (14 + DEX max 2); Protector Cleric krijgt chain mail proficiency (16)
        if (state.subclass === 'war' || state.equippedArmor === 'chain mail') return 16 + shieldBonus + defenseStyle;
        return 14 + Math.min(dexMod, 2) + shieldBonus + defenseStyle;
    }
    if (className === 'ranger') {
        // Studded leather: 12 + DEX, scale mail: 14 + min(dex,2)
        var rArmor = (state.equippedArmor || 'studded leather').toLowerCase();
        if (rArmor === 'scale mail') return 14 + Math.min(dexMod, 2) + shieldBonus + defenseStyle;
        return 12 + dexMod + shieldBonus + defenseStyle + dualWieldBonus;
    }
    if (className === 'druid') {
        // Leather armor: 11 + DEX (druids don't wear metal in tradition, 2024 is vrij maar default leather)
        return 11 + dexMod + shieldBonus + defenseStyle;
    }
    if (className === 'barbarian') {
        // Unarmored Defense: 10 + DEX + CON
        var conMod = getMod(getAbilityScore(config, state, 'con'));
        return 10 + dexMod + conMod + shieldBonus;
    }
    if (className === 'monk') {
        // Unarmored Defense: 10 + DEX + WIS (geen shield toegestaan)
        var wisMod = getMod(getAbilityScore(config, state, 'wis'));
        return 10 + dexMod + wisMod;
    }
    // Default: 10 + DEX
    return 10 + dexMod + shieldBonus;
}

function hasFeat(state, featName) {
    if (!state.asiChoices) return false;
    for (var lvl in state.asiChoices) {
        var c = state.asiChoices[lvl];
        if (c && c.type === 'feat' && c.feat === featName) return true;
    }
    return false;
}

function getMaxPrepared(state, abilityMod, className) {
    if (!className) className = 'sorcerer';
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

function getMaxCantrips(level, className) {
    if (!className) className = 'sorcerer';
    var classData = DATA[className];
    if (classData && classData.cantripsKnown) {
        return classData.cantripsKnown[level] || 0;
    }
    return 0;
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

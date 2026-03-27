// ============================================================
// D&D 5e Interactive Character Sheet Engine — Ashvane Twins
// Requires data.js (global DATA object) to be loaded first.
// ============================================================

const CHARACTERS = {
    ren: {
        name: "Ren Ashvane",
        className: "rogue",
        subclass: "scout",
        background: "Urchin",
        alignment: "Chaotic Good",
        age: 19,
        baseAbilities: { str: 10, dex: 16, con: 14, int: 14, wis: 12, cha: 10 },
        defaultSkills: ["stealth", "sleight of hand", "perception", "acrobatics", "investigation", "athletics"],
        defaultExpertise: ["stealth", "sleight of hand"],
        weapons: [
            { name: 'Shortsword "Woord"', hit: null, dmg: "1d6", type: "piercing", finesse: true },
            { name: 'Shortsword "Daad"', hit: null, dmg: "1d6", type: "piercing", finesse: true },
            { name: 'Shortbow', hit: null, dmg: "1d6", type: "piercing" },
            { name: 'Dagger (thrown)', hit: null, dmg: "1d4", type: "piercing", finesse: true }
        ],
        quotes: [
            "Er is altijd een uitweg. En als die er niet is, maak je er een.",
            "Vertrouwen is duur. Ik betaal liever met staal.",
            "Stilte is geen leegte. Het is informatie.",
            "Plan A werkt nooit. Daarom heb ik er zesentwintig.",
            "Je hoeft niet onzichtbaar te zijn. Je hoeft alleen maar oninteressant te lijken.",
            "Ik slaap niet. Ik wacht met mijn ogen dicht."
        ],
        defaultItems: [
            { name: 'Studded leather armor', weight: 13, notes: 'Zelf in elkaar gezet' },
            { name: 'Shortsword "Woord"', weight: 2, notes: '' },
            { name: 'Shortsword "Daad"', weight: 2, notes: '' },
            { name: 'Shortbow', weight: 2, notes: '' },
            { name: 'Arrows (20)', weight: 1, notes: '' },
            { name: 'Dagger', weight: 1, notes: '' },
            { name: 'Dagger', weight: 1, notes: '' },
            { name: 'Dagger', weight: 1, notes: '"Tel je messen"' },
            { name: "Thieves' tools", weight: 1, notes: '' },
            { name: 'Vaders leren jas', weight: 4, notes: 'Twee maten te groot, onvervangbaar' },
            { name: 'Houten drakenbeeldje', weight: 0.25, notes: 'Gesneden door vader' },
            { name: 'Rope (50ft)', weight: 10, notes: '"Je hebt altijd touw nodig"' },
            { name: "Burglar's pack", weight: 0, notes: 'Inhoud al verdeeld' }
        ]
    },
    saya: {
        name: "Saya Ashvane",
        className: "sorcerer",
        subclass: "wildMagic",
        background: "Urchin",
        alignment: "Chaotic Good",
        age: 19,
        baseAbilities: { str: 8, dex: 15, con: 14, int: 12, wis: 10, cha: 17 },
        defaultSkills: ["deception", "persuasion", "arcana", "sleight of hand"],
        defaultCantrips: ["Fire Bolt", "Prestidigitation", "Minor Illusion", "Mage Hand"],
        defaultPrepared: ["Shield", "Mage Armor", "Chaos Bolt", "Disguise Self"],
        quotes: [
            "Magie is niet iets wat ik heb geleerd. Het is iets wat weigerde om stil te zijn.",
            "Controle is een illusie. Maar het is m\u00edjn illusie, en ik ben er goed in.",
            "Ik teken kaarten van plekken die niet meer bestaan. Zo weet ik waar ik ben geweest.",
            "Vuur lost meer op dan je denkt. Niet alles. Maar meer dan je denkt.",
            "Elke stilte is een vraag. Ik geef liever antwoord dan dat ik wacht.",
            "Als de magie me niet gehoorzaamt, gehoorzaam ik de magie. We komen er wel uit."
        ],
        defaultItems: [
            { name: 'Component pouch', weight: 2, notes: 'Rammelt als ze loopt' },
            { name: 'Dagger', weight: 1, notes: '"Nooit naar buiten zonder je dolk"' },
            { name: 'Schetsboek', weight: 1, notes: '' },
            { name: 'Schetsboek', weight: 1, notes: '' },
            { name: 'Schetsboek', weight: 1, notes: '' },
            { name: 'Schetsboek', weight: 1, notes: 'Vol kaarten van elke plek' },
            { name: 'Inkt & pen set', weight: 0.5, notes: '' },
            { name: 'Koperen ring (aan koord)', weight: 0, notes: "Moeders ring" },
            { name: "Burglar's pack", weight: 0, notes: 'Inhoud al verdeeld' },
            { name: 'Set versleten kleding', weight: 3, notes: '' },
            { name: 'Nette outfit', weight: 4, notes: 'Voor als ze iemand moet oplichten' }
        ]
    }
};

// ============================================================
// Tooltip Data (for basic info hover tooltips)
// ============================================================

const TOOLTIPS = {
    'Half-Elf': 'Darkvision 60ft. Fey Ancestry: advantage op saves tegen charmed. 2 extra skill proficiencies. +2 CHA, +1 op 2 andere abilities.',
    'Rogue': 'Hit Die: d8. Saving Throws: DEX, INT. Sneak Attack, Expertise, Cunning Action. Skills: 4 proficiencies.',
    'Sorcerer': 'Hit Die: d6. Saving Throws: CON, CHA. Sorcery Points, Metamagic. Spellcasting met Charisma.',
    'Scout': 'Rogue subclass. Survivalist: proficiency in Nature & Survival. Skirmisher: reaction om weg te bewegen. Superior Mobility op level 9.',
    'Wild Magic': 'Sorcerer subclass. Wild Magic Surge: kans op willekeurig magisch effect. Tides of Chaos: advantage 1x per long rest. Bend Luck op level 6.',
    'Urchin': 'Achtergrond: opgegroeid op straat. Proficiency: Sleight of Hand, Stealth. Tool: Disguise kit, Thieves\' tools. Feature: City Secrets.',
    'Chaotic Good': 'Volgt het eigen geweten met weinig respect voor regels. Doet het juiste, ook als het niet de wet is.'
};

// ============================================================
// State Management
// ============================================================

function loadState(charId) {
    const key = `ashvane_${charId}`;
    const saved = localStorage.getItem(key);
    const config = CHARACTERS[charId];
    const defaults = {
        level: 1,
        skills: [...(config.defaultSkills || [])],
        expertise: [...(config.defaultExpertise || [])],
        cantrips: [...(config.defaultCantrips || [])],
        prepared: [...(config.defaultPrepared || [])],
        metamagic: [],
        asiChoices: {},
        favorites: [],
        items: [...(config.defaultItems || []).map(i => ({...i}))],
        customAbilities: null
    };
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge with defaults to ensure new fields exist
            for (const key of Object.keys(defaults)) {
                if (!(key in parsed)) {
                    parsed[key] = defaults[key];
                }
            }
            return parsed;
        } catch (e) { /* fall through to default */ }
    }
    return defaults;
}

function saveState(charId, state) {
    const key = `ashvane_${charId}`;
    localStorage.setItem(key, JSON.stringify(state));
}

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
        }
    }
    return score;
}

function getAbilityBreakdown(config, state, ability) {
    const base = config.baseAbilities[ability] || 10;
    // Determine racial bonus based on Half-Elf rules
    // Half-Elf: +2 CHA, then the two +1s are already baked into baseAbilities
    // For display purposes, we show the standard array value vs what's in base
    // The baseAbilities already include racial bonuses, so we need to deduce them
    // Standard array: 15, 14, 13, 12, 10, 8
    // Half-Elf racial: +2 CHA, +1 to two others (DEX and CON for both characters)
    const standardArray = [15, 14, 13, 12, 10, 8];

    // Determine which standard array value was assigned to this ability
    let racialBonus = 0;
    let baseWithoutRacial = base;

    // For Ren: STR 10, DEX 16(15+1), CON 14(13+1), INT 14, WIS 12, CHA 10(8+2)
    // For Saya: STR 8, DEX 15(14+1), CON 14(13+1), INT 12, WIS 10, CHA 17(15+2)
    if (config.name === "Ren Ashvane") {
        const racials = { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 2 };
        racialBonus = racials[ability] || 0;
    } else if (config.name === "Saya Ashvane") {
        const racials = { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 2 };
        racialBonus = racials[ability] || 0;
    }
    baseWithoutRacial = base - racialBonus;

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
    return Math.max(hp, 1);
}

function getAC(config, state) {
    const dexMod = getMod(getAbilityScore(config, state, 'dex'));
    if (config.className === 'rogue') {
        // Studded leather: 12 + DEX mod
        return 12 + dexMod;
    }
    if (config.className === 'sorcerer') {
        // Mage Armor prepared? 13 + DEX, otherwise 10 + DEX
        if (state.prepared && state.prepared.includes('Mage Armor')) {
            return 13 + dexMod;
        }
        return 10 + dexMod;
    }
    return 10 + dexMod;
}

function getMaxPrepared(state, chaMod) {
    return Math.max(1, chaMod + state.level);
}

function getMaxCantrips(level) {
    return DATA.sorcerer.cantripsKnown[level] || 4;
}

function formatMod(mod) {
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

// ============================================================
// Spell Filter Mode (module-level)
// ============================================================
let spellFilter = 'all'; // 'all', 'prepared', or 'favorites'

// ============================================================
// Edit Mode State (module-level)
// ============================================================
let abilityEditMode = false;
let editAbilities = null; // temp storage during edit

// ============================================================
// Rendering Functions
// ============================================================

function renderHeader(config, state) {
    const el = document.getElementById('char-header-content');
    if (!el) return;

    const classLabel = config.className.charAt(0).toUpperCase() + config.className.slice(1);
    const subLabel = config.subclass === 'scout' ? 'Scout'
        : config.subclass === 'wildMagic' ? 'Wild Magic'
        : config.subclass;

    // Pick a random quote
    const quotes = config.quotes || [];
    const quoteText = quotes.length > 0 ? quotes[Math.floor(Math.random() * quotes.length)] : '';

    el.innerHTML = `
        <div class="header-top-row">
            <div class="portrait-frame" id="portrait-frame">
                <span class="portrait-placeholder">&#128100;</span>
            </div>
            <div class="header-info">
                <h1>${config.name}</h1>
                <p class="char-title">${classLabel} &mdash; ${subLabel}</p>
                <div class="level-control">
                    <button class="level-btn" data-action="level-down" ${state.level <= 1 ? 'disabled' : ''}>&minus;</button>
                    <span class="level-display">Level ${state.level}</span>
                    <button class="level-btn" data-action="level-up" ${state.level >= 20 ? 'disabled' : ''}>&plus;</button>
                </div>
            </div>
            <div class="header-actions" id="options-dropdown">
                <button class="options-toggle" data-action="toggle-options">&#9881;</button>
                <div class="options-menu">
                    <button class="header-btn" data-action="export-char">&#128190; Opslaan</button>
                    <label class="header-btn">&#128194; Laden<input type="file" accept=".json" data-action="import-char" style="display:none;"></label>
                    <button class="header-btn header-btn-danger" data-action="reset-char">&#128260; Reset</button>
                </div>
            </div>
        </div>
        <div class="header-quote-row">
            <p class="char-quote-dynamic">"${escapeHtml(quoteText)}"</p>
            <button class="quote-refresh-btn" data-action="refresh-quote" title="Ander citaat">&#8635;</button>
        </div>
    `;
}

function renderAbilityScores(config, state) {
    const el = document.getElementById('ability-scores-content');
    if (!el) return;

    const abilities = getAllAbilityScores(config, state);
    const primaryAbility = config.className === 'rogue' ? 'dex' : 'cha';
    const primaryClass = config.className === 'rogue' ? 'ability-primary' : 'ability-primary-saya';

    const abNames = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

    if (abilityEditMode) {
        // Edit mode
        if (!editAbilities) {
            editAbilities = {};
            for (const ab of Object.keys(abNames)) {
                editAbilities[ab] = abilities[ab];
            }
        }
        el.innerHTML = `
            <div class="ability-scores edit-mode-active">
                ${Object.entries(abNames).map(([key, label]) => {
                    const score = editAbilities[key];
                    const mod = getMod(score);
                    const highlight = key === primaryAbility ? ` ${primaryClass}` : '';
                    return `
                        <div class="ability edit-mode${highlight}">
                            <span class="ability-name">${label}</span>
                            <button class="ability-adj" data-ab="${key}" data-dir="up">&#9650;</button>
                            <span class="ability-score">${score}</span>
                            <button class="ability-adj" data-ab="${key}" data-dir="down">&#9660;</button>
                            <span class="ability-mod">${formatMod(mod)}</span>
                        </div>`;
                }).join('')}
            </div>
            <div class="ability-edit-actions">
                <button class="ability-edit-btn" data-action="ability-save">Opslaan</button>
                <button class="ability-edit-btn ability-edit-cancel" data-action="ability-cancel">Annuleren</button>
            </div>
        `;
    } else {
        el.innerHTML = `
            <div class="ability-edit-header">
                <button class="edit-toggle-btn" data-action="ability-edit" title="Bewerken">&#9998;</button>
            </div>
            <div class="ability-scores">
                ${Object.entries(abNames).map(([key, label]) => {
                    const score = abilities[key];
                    const mod = getMod(score);
                    const highlight = key === primaryAbility ? ` ${primaryClass}` : '';
                    return `
                        <div class="ability${highlight}" data-ability="${key}">
                            <span class="ability-name">${label}</span>
                            <span class="ability-score">${score}</span>
                            <span class="ability-mod">${formatMod(mod)}</span>
                        </div>`;
                }).join('')}
            </div>
        `;
    }
}

function renderCombatStats(config, state) {
    const el = document.getElementById('combat-stats-content');
    if (!el) return;

    const hp = getHP(config, state);
    const ac = getAC(config, state);
    const dexMod = getMod(getAbilityScore(config, state, 'dex'));
    const profBonus = getProfBonus(state.level);
    const hitDie = config.className === 'rogue' ? 'd8' : 'd6';

    el.innerHTML = `
        <div class="combat-stats">
            <div class="combat-stat">
                <span class="stat-value">${hp}</span>
                <span class="stat-label">HP</span>
            </div>
            <div class="combat-stat">
                <span class="stat-value">${ac}</span>
                <span class="stat-label">AC</span>
            </div>
            <div class="combat-stat">
                <span class="stat-value">30ft</span>
                <span class="stat-label">Speed</span>
            </div>
            <div class="combat-stat">
                <span class="stat-value">${formatMod(dexMod)}</span>
                <span class="stat-label">Initiative</span>
            </div>
            <div class="combat-stat">
                <span class="stat-value">+${profBonus}</span>
                <span class="stat-label">Prof.</span>
            </div>
            <div class="combat-stat">
                <span class="stat-value">${state.level}${hitDie}</span>
                <span class="stat-label">Hit Dice</span>
            </div>
        </div>
    `;
}

function renderSavingThrows(config, state) {
    const el = document.getElementById('saving-throws-content');
    if (!el) return;

    const profSaves = config.className === 'rogue'
        ? ['dex', 'int']
        : ['con', 'cha'];

    const profBonus = getProfBonus(state.level);
    const abNames = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

    el.innerHTML = `
        <div class="saves-list">
            ${Object.entries(abNames).map(([key, label]) => {
                const mod = getMod(getAbilityScore(config, state, key));
                const isProf = profSaves.includes(key);
                const total = isProf ? mod + profBonus : mod;
                return `<div class="save${isProf ? ' prof' : ''}"><span>${label}</span><span>${formatMod(total)}</span></div>`;
            }).join('')}
        </div>
    `;
}

function renderSkills(config, state) {
    const el = document.getElementById('skills-content');
    if (!el) return;

    const profBonus = getProfBonus(state.level);
    const abilities = getAllAbilityScores(config, state);

    // Build skills list from DATA.skills
    const skillRows = DATA.skills.map(skill => {
        const abilityMod = getMod(abilities[skill.ability]);
        const skillNameLower = skill.name.toLowerCase();
        const isExpertise = state.expertise.includes(skillNameLower);
        const isProf = state.skills.includes(skillNameLower);

        let total = abilityMod;
        let cssClass = 'skill';
        if (isExpertise) {
            total += profBonus * 2;
            cssClass += ' expertise';
        } else if (isProf) {
            total += profBonus;
            cssClass += ' prof';
        }

        return `<div class="${cssClass}"><span>${skill.name} <span class="skill-ability">(${skill.ability.toUpperCase()})</span></span><span>${formatMod(total)}</span></div>`;
    });

    el.innerHTML = `
        <div class="skills-list">
            ${skillRows.join('')}
        </div>
        ${state.expertise.length > 0 ? '<p class="block-note" style="margin-top: 0.75rem;">&#9733; = Expertise (dubbele proficiency)</p>' : ''}
    `;
}

function renderWeapons(config, state) {
    const el = document.getElementById('weapons-content');
    if (!el) return;
    if (config.className !== 'rogue') { el.innerHTML = ''; return; }

    const dexMod = getMod(getAbilityScore(config, state, 'dex'));
    const strMod = getMod(getAbilityScore(config, state, 'str'));
    const profBonus = getProfBonus(state.level);
    const sneakAttack = DATA.rogue.sneakAttack[state.level] || '1d6';

    const rows = config.weapons.map(w => {
        const attackMod = w.finesse ? Math.max(dexMod, strMod) : strMod;
        const hitBonus = attackMod + profBonus;
        const damageMod = w.finesse ? Math.max(dexMod, strMod) : strMod;
        const dmgStr = damageMod >= 0 ? `${w.dmg}+${damageMod}` : `${w.dmg}${damageMod}`;
        return `
            <div class="weapon">
                <span class="weapon-name">${w.name}</span>
                <span class="weapon-hit">${formatMod(hitBonus)}</span>
                <span class="weapon-dmg">${dmgStr} ${w.type}</span>
            </div>`;
    });

    el.innerHTML = `
        <div class="weapons-table">
            ${rows.join('')}
        </div>
        <p class="block-note" style="margin-top: 0.75rem;">+ Sneak Attack: ${sneakAttack} extra damage bij advantage of adjacent ally</p>
    `;
}

function renderSpellcasting(config, state) {
    const el = document.getElementById('spell-section-content');
    if (!el) return;
    if (config.className !== 'sorcerer') { el.innerHTML = ''; return; }

    const chaMod = getMod(getAbilityScore(config, state, 'cha'));
    const profBonus = getProfBonus(state.level);
    const spellDC = 8 + profBonus + chaMod;
    const spellAttack = profBonus + chaMod;
    const sorcPts = DATA.sorcerer.sorceryPoints[state.level] || 0;
    const maxPrepared = getMaxPrepared(state, chaMod);
    const maxCantrips = getMaxCantrips(state.level);
    const maxSpellLevel = DATA.sorcerer.maxSpellLevel[state.level] || 1;
    const spellSlots = DATA.sorcerer.spellSlots[state.level] || [];
    const preparedCount = state.prepared.length;

    // Spell stats header
    let html = `
        <div class="spell-header">
            <div class="spell-stat"><span class="label">Save DC</span><span class="value">${spellDC}</span></div>
            <div class="spell-stat"><span class="label">Attack</span><span class="value">${formatMod(spellAttack)}</span></div>
            <div class="spell-stat"><span class="label">Sorc Pts</span><span class="value">${sorcPts}</span></div>
            <div class="spell-stat prepared-counter"><span class="label">Voorbereid</span><span class="value">${preparedCount}/${maxPrepared}</span></div>
        </div>
    `;

    // Filter bar (replaces old view toggle)
    html += `
        <div class="spell-filter-bar">
            <button class="filter-btn${spellFilter === 'all' ? ' active' : ''}" data-filter="all">Alle</button>
            <button class="filter-btn${spellFilter === 'prepared' ? ' active' : ''}" data-filter="prepared">Voorbereid</button>
            <button class="filter-btn${spellFilter === 'favorites' ? ' active' : ''}" data-filter="favorites">&#9733; Favorieten</button>
        </div>
    `;

    const favorites = state.favorites || [];

    // Cantrips (level 0)
    const cantrips = (DATA.spells.sorcerer[0] || []);
    html += `<h3 class="spell-level-header">Cantrips <span class="slots">altijd bekend &mdash; ${state.cantrips.length}/${maxCantrips}</span></h3>`;
    html += `<div class="spell-grid">`;
    for (const spell of cantrips) {
        const isSelected = state.cantrips.includes(spell.name);
        const isFav = favorites.includes(spell.name);
        if (spellFilter === 'prepared' && !isSelected) continue;
        if (spellFilter === 'favorites' && !isFav) continue;
        const cls = isSelected ? 'spell-toggle selected' : 'spell-toggle';
        const starCls = isFav ? 'spell-star favorited' : 'spell-star';
        html += `<button class="${cls}" data-spell="${escapeAttr(spell.name)}" data-level="0"><span class="${starCls}" data-spell-star="${escapeAttr(spell.name)}">&#9733;</span> ${escapeHtml(spell.name)}</button>`;
    }
    html += `</div>`;

    // Spell levels 1 through maxSpellLevel
    const levelNames = ['Cantrips', '1st Level', '2nd Level', '3rd Level', '4th Level', '5th Level', '6th Level', '7th Level', '8th Level', '9th Level'];

    for (let lvl = 1; lvl <= maxSpellLevel; lvl++) {
        const slots = spellSlots[lvl - 1] || 0;
        const spells = (DATA.spells.sorcerer[lvl] || []);

        html += `<h3 class="spell-level-header">${levelNames[lvl]} <span class="slots">${slots} slots</span></h3>`;
        html += `<div class="spell-grid">`;
        for (const spell of spells) {
            const isPrepared = state.prepared.includes(spell.name);
            const isFav = favorites.includes(spell.name);
            if (spellFilter === 'prepared' && !isPrepared) continue;
            if (spellFilter === 'favorites' && !isFav) continue;
            const cls = isPrepared ? 'spell-toggle prepared' : 'spell-toggle';
            const starCls = isFav ? 'spell-star favorited' : 'spell-star';
            html += `<button class="${cls}" data-spell="${escapeAttr(spell.name)}" data-level="${lvl}"><span class="${starCls}" data-spell-star="${escapeAttr(spell.name)}">&#9733;</span> ${escapeHtml(spell.name)}</button>`;
        }
        html += `</div>`;
    }

    // Show locked higher levels hint
    if (maxSpellLevel < 9) {
        html += `<p class="block-note" style="margin-top:1rem;opacity:0.5;">Hogere spell levels worden beschikbaar bij hogere levels.</p>`;
    }

    el.innerHTML = html;
}

function renderFeatures(config, state) {
    const el = document.getElementById('features-content');
    if (!el) return;

    const classData = DATA[config.className];
    if (!classData) return;

    let html = '';

    // Class features
    html += '<h3 style="margin-bottom:0.5rem;">Klasse Features</h3>';
    for (let lvl = 1; lvl <= state.level; lvl++) {
        const features = classData.features[lvl] || [];
        for (const feat of features) {
            const isNew = lvl === state.level;
            html += `<div class="feature-card${isNew ? ' new-feature' : ''}">
                <h4>${feat.name}${lvl > 1 ? ` <span class="feature-level">(Level ${lvl})</span>` : ''}</h4>
                <p>${feat.desc}</p>
            </div>`;
        }
    }

    // Subclass features
    const subData = classData.subclasses && classData.subclasses[config.subclass];
    if (subData) {
        html += '<h3 style="margin:1rem 0 0.5rem;">Subklasse Features</h3>';
        for (let lvl = 1; lvl <= state.level; lvl++) {
            const features = subData.features[lvl] || [];
            for (const feat of features) {
                const isNew = lvl === state.level;
                html += `<div class="feature-card${isNew ? ' new-feature' : ''}">
                    <h4>${feat.name} <span class="feature-level">(Level ${lvl})</span></h4>
                    <p>${feat.desc}</p>
                </div>`;
            }
        }
    }

    // Racial features (Half-Elf)
    if (DATA.halfElf && DATA.halfElf.features) {
        html += '<h3 style="margin:1rem 0 0.5rem;">Raciale Traits (Half-Elf)</h3>';
        for (const feat of DATA.halfElf.features) {
            html += `<div class="feature-card">
                <h4>${feat.name}</h4>
                <p>${feat.desc}</p>
            </div>`;
        }
    }

    el.innerHTML = html;
}

function renderMetamagic(config, state) {
    const el = document.getElementById('metamagic-content');
    if (!el) return;
    if (config.className !== 'sorcerer') { el.innerHTML = ''; return; }
    if (state.level < 2) { el.innerHTML = '<p class="block-note">Metamagic wordt beschikbaar op level 2.</p>'; return; }

    // Determine max metamagic choices based on level
    let maxChoices = 0;
    if (state.level >= 2) maxChoices = 2;
    if (state.level >= 10) maxChoices = 3;
    if (state.level >= 17) maxChoices = 4;

    const allMetamagic = DATA.metamagic || [];
    const chosen = state.metamagic || [];
    const canChooseMore = chosen.length < maxChoices;

    let html = `<p class="block-note" style="margin-bottom:0.75rem;">Gekozen: ${chosen.length}/${maxChoices}</p>`;
    html += `<div class="metamagic-grid">`;
    for (const mm of allMetamagic) {
        const isChosen = chosen.includes(mm.name);
        let cls = 'metamagic-option';
        if (isChosen) cls += ' chosen';
        if (!isChosen && !canChooseMore) cls += ' locked';
        html += `<button class="${cls}" data-metamagic="${escapeAttr(mm.name)}" title="${escapeAttr(mm.desc || '')}">
            <strong>${mm.name}</strong>
            <span class="meta-cost">${mm.cost}</span>
        </button>`;
    }
    html += `</div>`;

    el.innerHTML = html;
}

function renderASI(config, state) {
    const el = document.getElementById('asi-content');
    if (!el) return;

    const classData = DATA[config.className];
    const asiLevels = classData ? classData.asiLevels : [4, 8, 12, 16, 19];
    const abilities = getAllAbilityScores(config, state);

    // Only show ASI panels for levels the character has reached
    const relevantLevels = asiLevels.filter(lvl => lvl <= state.level);

    if (relevantLevels.length === 0) {
        el.innerHTML = `<p class="block-note">Ability Score Improvement beschikbaar op level ${asiLevels[0]}.</p>`;
        return;
    }

    let html = '';
    for (const lvl of relevantLevels) {
        const choice = state.asiChoices[lvl];
        html += `<div class="asi-panel" data-asi-level="${lvl}">`;
        html += `<h4>Level ${lvl} — Ability Score Improvement</h4>`;

        if (!choice) {
            // No choice made yet — show options
            html += `<div class="asi-options">
                <button class="asi-option" data-asi-level="${lvl}" data-asi-type="asi-two">+2 op 1 ability</button>
                <button class="asi-option" data-asi-level="${lvl}" data-asi-type="asi-split">+1 op 2 abilities</button>
                <button class="asi-option" data-asi-level="${lvl}" data-asi-type="feat">Feat kiezen</button>
            </div>`;
        } else if (choice.type === 'asi') {
            // Show the ASI choice made
            const parts = Object.entries(choice.abilities || {})
                .filter(([, v]) => v > 0)
                .map(([ab, v]) => `${ab.toUpperCase()} +${v}`);
            html += `<p class="asi-chosen">Gekozen: ${parts.join(', ')}</p>`;
            html += `<button class="asi-option asi-reset" data-asi-level="${lvl}" data-asi-type="reset">Opnieuw kiezen</button>`;
        } else if (choice.type === 'feat') {
            html += `<p class="asi-chosen">Feat: <strong>${choice.feat}</strong></p>`;
            html += `<button class="asi-option asi-reset" data-asi-level="${lvl}" data-asi-type="reset">Opnieuw kiezen</button>`;
        }

        html += `</div>`;
    }

    el.innerHTML = html;
}

// ============================================================
// Items System
// ============================================================

function renderItems(config, state) {
    const el = document.getElementById('items-content');
    if (!el) return;

    const strScore = getAbilityScore(config, state, 'str');
    const capacity = strScore * 15;
    const totalWeight = (state.items || []).reduce((sum, item) => sum + (item.weight || 0), 0);

    let encStatus = '';
    let encClass = '';
    if (totalWeight > strScore * 10) {
        encStatus = '&#128308; Overbelast (-20ft speed, disadvantage)';
        encClass = 'enc-heavy';
    } else if (totalWeight > strScore * 5) {
        encStatus = '&#9888;&#65039; Belast (-10ft speed)';
        encClass = 'enc-medium';
    } else {
        encStatus = '&#10003; OK';
        encClass = 'enc-ok';
    }

    // Build datalist options from DATA.items if available
    let datalistOptions = '';
    if (typeof DATA !== 'undefined' && DATA.items) {
        for (const category of Object.keys(DATA.items)) {
            const items = DATA.items[category];
            if (Array.isArray(items)) {
                for (const item of items) {
                    const itemName = typeof item === 'string' ? item : item.name;
                    const itemWeight = typeof item === 'object' && item.weight !== undefined ? item.weight : '';
                    datalistOptions += `<option value="${escapeAttr(itemName)}" data-weight="${itemWeight}">`;
                }
            }
        }
    }

    let html = `
        <div class="items-header">
            <span class="weight-total">Gewicht: ${totalWeight.toFixed(2)} / ${capacity} lbs</span>
            <span class="encumbrance-status ${encClass}">${encStatus}</span>
            <button class="item-add-btn" data-action="add-item">+ Item toevoegen</button>
        </div>
        <div class="item-add-form" style="display:none;">
            <input type="text" class="item-name-input" placeholder="Item naam..." list="item-suggestions">
            <datalist id="item-suggestions">${datalistOptions}</datalist>
            <input type="number" class="item-weight-input" placeholder="Gewicht (lbs)" step="0.25" min="0">
            <input type="text" class="item-notes-input" placeholder="Notities...">
            <button class="item-confirm-btn" data-action="confirm-item">&#10003;</button>
            <button class="item-cancel-btn" data-action="cancel-item">&#10005;</button>
        </div>
        <div class="items-grid">
    `;

    (state.items || []).forEach((item, idx) => {
        html += `
            <div class="item-row">
                <span class="item-name">${escapeHtml(item.name)}</span>
                <span class="item-weight">${item.weight} lbs</span>
                <span class="item-notes">${item.notes ? escapeHtml(item.notes) : '-'}</span>
                <button class="item-remove" data-item-idx="${idx}">&#10005;</button>
            </div>`;
    });

    html += `</div>`;
    el.innerHTML = html;
}

// ============================================================
// ASI Sub-dialogs
// ============================================================

function showASIAbilityPicker(charId, config, state, level, mode, renderCallback) {
    const el = document.getElementById('asi-content');
    if (!el) return;

    const abilities = getAllAbilityScores(config, state);
    const abNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    const abLabels = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

    let selected = {};
    const maxPoints = mode === 'asi-two' ? 2 : 2; // 2 points total either way
    const maxPerAbility = mode === 'asi-two' ? 2 : 1;

    function renderPicker() {
        const totalSpent = Object.values(selected).reduce((s, v) => s + v, 0);
        let html = `<div class="asi-panel" data-asi-level="${level}">`;
        html += `<h4>Level ${level} — ${mode === 'asi-two' ? '+2 op 1 ability' : '+1 op 2 abilities'}</h4>`;
        html += `<p class="block-note">Punten over: ${maxPoints - totalSpent}</p>`;
        html += `<div class="asi-ability-picker">`;
        for (const ab of abNames) {
            const current = abilities[ab];
            const added = selected[ab] || 0;
            const canAdd = (current + added) < 20 && added < maxPerAbility && totalSpent < maxPoints;
            html += `<div class="asi-ability-row">
                <span>${abLabels[ab]} (${current}${added > 0 ? ' +' + added : ''})</span>
                <button class="asi-ability-btn" data-ab="${ab}" ${canAdd ? '' : 'disabled'}>+1</button>
            </div>`;
        }
        html += `</div>`;
        html += `<div style="display:flex;gap:0.5rem;margin-top:0.75rem;">`;
        html += `<button class="asi-option" data-action="asi-confirm" ${totalSpent === maxPoints ? '' : 'disabled'}>Bevestigen</button>`;
        html += `<button class="asi-option asi-reset" data-action="asi-cancel">Annuleren</button>`;
        html += `</div></div>`;

        // Replace just this ASI panel
        const panel = el.querySelector(`[data-asi-level="${level}"]`);
        if (panel) {
            panel.outerHTML = html;
        } else {
            el.innerHTML = html;
        }

        // Bind events for this picker
        const newPanel = el.querySelector(`[data-asi-level="${level}"]`);
        if (!newPanel) return;

        newPanel.querySelectorAll('.asi-ability-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const ab = btn.dataset.ab;
                selected[ab] = (selected[ab] || 0) + 1;
                renderPicker();
            });
        });

        const confirmBtn = newPanel.querySelector('[data-action="asi-confirm"]');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                state.asiChoices[level] = { type: 'asi', abilities: { ...selected } };
                saveState(charId, state);
                renderCallback();
            });
        }

        const cancelBtn = newPanel.querySelector('[data-action="asi-cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                renderCallback();
            });
        }
    }

    renderPicker();
}

function showFeatPicker(charId, config, state, level, renderCallback) {
    const el = document.getElementById('asi-content');
    if (!el) return;

    const abilities = getAllAbilityScores(config, state);
    const feats = DATA.feats || [];

    let html = `<div class="asi-panel" data-asi-level="${level}">`;
    html += `<h4>Level ${level} — Feat kiezen</h4>`;
    html += `<div class="feat-grid">`;

    for (const feat of feats) {
        const meetsPrereq = checkPrerequisite(feat, abilities, config);
        const cls = meetsPrereq ? 'feat-card' : 'feat-card unavailable';
        html += `<button class="${cls}" data-feat="${escapeAttr(feat.name)}" ${meetsPrereq ? '' : 'disabled'} title="${escapeAttr(feat.desc || '')}">
            <strong>${feat.name}</strong>
            ${feat.prereq ? `<span class="feat-prereq">${feat.prereq}</span>` : ''}
        </button>`;
    }

    html += `</div>`;
    html += `<button class="asi-option asi-reset" data-action="feat-cancel" style="margin-top:0.75rem;">Annuleren</button>`;
    html += `</div>`;

    const panel = el.querySelector(`[data-asi-level="${level}"]`);
    if (panel) {
        panel.outerHTML = html;
    } else {
        el.innerHTML = html;
    }

    // Bind events
    const newPanel = el.querySelector(`[data-asi-level="${level}"]`);
    if (!newPanel) return;

    newPanel.querySelectorAll('.feat-card:not(.unavailable)').forEach(btn => {
        btn.addEventListener('click', () => {
            state.asiChoices[level] = { type: 'feat', feat: btn.dataset.feat };
            saveState(charId, state);
            renderCallback();
        });
    });

    const cancelBtn = newPanel.querySelector('[data-action="feat-cancel"]');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            renderCallback();
        });
    }
}

function checkPrerequisite(feat, abilities, config) {
    if (!feat.prereq) return true;
    const prereq = feat.prereq.toLowerCase();

    // Check ability score prerequisites like "STR 13"
    for (const [ab, score] of Object.entries(abilities)) {
        const pattern = new RegExp(`${ab}\\s+(\\d+)`, 'i');
        const altPattern = new RegExp(`${ab.toUpperCase()}\\s+(\\d+)`);
        const match = prereq.match(pattern) || prereq.match(altPattern);
        if (match && score < parseInt(match[1])) return false;
    }

    // Full ability name checks
    const abilityNames = {
        strength: 'str', dexterity: 'dex', constitution: 'con',
        intelligence: 'int', wisdom: 'wis', charisma: 'cha'
    };
    for (const [name, ab] of Object.entries(abilityNames)) {
        const pattern = new RegExp(`${name}\\s+(\\d+)`, 'i');
        const match = prereq.match(pattern);
        if (match && abilities[ab] < parseInt(match[1])) return false;
    }

    // Spellcasting prereq
    if (prereq.includes('spellcasting') || prereq.includes('spell')) {
        if (config.className !== 'sorcerer') return false;
    }

    return true;
}

// ============================================================
// Tooltip Systems
// ============================================================

let activeTooltip = null;

function showTooltipPopup(html, anchorEl) {
    removeTooltipPopup();
    const popup = document.createElement('div');
    popup.className = 'stat-tooltip';
    popup.innerHTML = html;
    document.body.appendChild(popup);

    // Position near the anchor element
    const rect = anchorEl.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';

    // Determine position: try below, then above
    const popupRect = popup.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left + (rect.width / 2) - (popupRect.width / 2);

    // Keep within viewport
    if (top + popupRect.height > window.innerHeight) {
        top = rect.top - popupRect.height - 8;
    }
    if (left < 8) left = 8;
    if (left + popupRect.width > window.innerWidth - 8) {
        left = window.innerWidth - popupRect.width - 8;
    }

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';

    activeTooltip = popup;
}

function removeTooltipPopup() {
    if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
    }
    // Also remove any lingering ones
    document.querySelectorAll('.stat-tooltip, .spell-tooltip-popup, .info-tooltip-popup').forEach(el => el.remove());
}

function showSpellTooltip(spellName, anchorEl) {
    // Find spell data
    let spellData = null;
    if (DATA.spells && DATA.spells.sorcerer) {
        for (let lvl = 0; lvl <= 9; lvl++) {
            const spells = DATA.spells.sorcerer[lvl] || [];
            const found = spells.find(s => s.name === spellName);
            if (found) { spellData = found; break; }
        }
    }
    if (!spellData) return;

    const html = `
        <div class="spell-tooltip-popup">
            <h4>${escapeHtml(spellData.name)}</h4>
            <p class="spell-desc">${escapeHtml(spellData.desc)}</p>
        </div>
    `;

    removeTooltipPopup();
    const popup = document.createElement('div');
    popup.className = 'stat-tooltip spell-tooltip-popup-wrap';
    popup.innerHTML = html;
    document.body.appendChild(popup);

    const rect = anchorEl.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';

    const popupRect = popup.getBoundingClientRect();
    let top = rect.bottom + 8;
    let left = rect.left + (rect.width / 2) - (popupRect.width / 2);

    if (top + popupRect.height > window.innerHeight) {
        top = rect.top - popupRect.height - 8;
    }
    if (left < 8) left = 8;
    if (left + popupRect.width > window.innerWidth - 8) {
        left = window.innerWidth - popupRect.width - 8;
    }

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';

    activeTooltip = popup;
}

function showAbilityTooltip(ability, config, state, anchorEl) {
    const breakdown = getAbilityBreakdown(config, state, ability);
    const abLabel = ability.toUpperCase();

    let lines = `<strong>${abLabel} Breakdown</strong><br>`;
    lines += `Base (Standard Array): ${breakdown.baseArray}<br>`;
    if (breakdown.racialBonus > 0) {
        lines += `Half-Elf Racial: +${breakdown.racialBonus}<br>`;
    }
    if (breakdown.asiDetails.length > 0) {
        for (const detail of breakdown.asiDetails) {
            lines += `${detail}<br>`;
        }
    }
    lines += `<strong>Totaal: ${breakdown.total}</strong>`;

    if (state.customAbilities && state.customAbilities[ability] !== undefined && state.customAbilities[ability] !== null) {
        lines += `<br><em>(Handmatig overschreven naar ${state.customAbilities[ability]})</em>`;
    }

    showTooltipPopup(lines, anchorEl);
}

function showInfoTooltip(value, anchorEl) {
    const tip = TOOLTIPS[value];
    if (!tip) return;
    showTooltipPopup(`<strong>${escapeHtml(value)}</strong><br>${escapeHtml(tip)}`, anchorEl);
}

// ============================================================
// Export / Import
// ============================================================

function exportCharacter(charId, state) {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${charId}_character.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importCharacter(charId, file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const imported = JSON.parse(e.target.result);
            callback(imported);
        } catch (err) {
            showWarning('Ongeldig JSON bestand.');
        }
    };
    reader.readAsText(file);
}

// ============================================================
// Reset Modal
// ============================================================

function showResetModal(charId, config, state, render) {
    // Remove existing modal if any
    const existing = document.getElementById('reset-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'reset-modal';
    modal.className = 'reset-modal-overlay';
    modal.innerHTML = `
        <div class="reset-modal-content">
            <h3>Karakter Resetten</h3>
            <p>Weet je het zeker? Dit zet het karakter terug naar level 1.</p>
            <div class="reset-modal-actions">
                <button class="reset-modal-btn" data-modal-action="save-then-reset">Opslaan voor reset</button>
                <button class="reset-modal-btn reset-modal-btn-danger" data-modal-action="confirm-reset">Reset</button>
                <button class="reset-modal-btn reset-modal-btn-cancel" data-modal-action="cancel-reset">Annuleren</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', function (e) {
        const action = e.target.dataset.modalAction;
        if (!action) {
            // Click on overlay background
            if (e.target === modal) {
                modal.remove();
            }
            return;
        }
        if (action === 'save-then-reset') {
            exportCharacter(charId, state);
            // Then reset
            performReset(charId, config, state, render);
            modal.remove();
        } else if (action === 'confirm-reset') {
            performReset(charId, config, state, render);
            modal.remove();
        } else if (action === 'cancel-reset') {
            modal.remove();
        }
    });
}

function performReset(charId, config, stateRef, render) {
    localStorage.removeItem(`ashvane_${charId}`);
    const newState = loadState(charId);
    // Copy all properties to the existing state reference so render() uses the new state
    for (const key of Object.keys(stateRef)) {
        delete stateRef[key];
    }
    Object.assign(stateRef, newState);
    spellFilter = 'all';
    abilityEditMode = false;
    editAbilities = null;
    saveState(charId, stateRef);
    render();
}

// ============================================================
// Utility
// ============================================================

function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// Event Handling
// ============================================================

function bindEvents(charId, config, state, render) {

    // Use event delegation on the main content area
    document.addEventListener('click', function (e) {
        const target = e.target;

        // Options dropdown toggle
        if (target.matches('[data-action="toggle-options"]') || target.closest('[data-action="toggle-options"]')) {
            const dropdown = document.getElementById('options-dropdown');
            if (dropdown) dropdown.classList.toggle('open');
            return;
        }

        // Close dropdown when clicking elsewhere
        if (!target.closest('.header-actions')) {
            const dropdown = document.getElementById('options-dropdown');
            if (dropdown) dropdown.classList.remove('open');
        }

        // Level up/down
        if (target.matches('[data-action="level-up"]')) {
            if (state.level < 20) {
                state.level++;
                saveState(charId, state);
                render();
            }
            return;
        }

        if (target.matches('[data-action="level-down"]')) {
            if (state.level > 1) {
                // Clean up choices from the level being removed
                cleanupLevelDown(config, state);
                state.level--;
                saveState(charId, state);
                render();
            }
            return;
        }

        // Refresh quote
        if (target.matches('[data-action="refresh-quote"]') || target.closest('[data-action="refresh-quote"]')) {
            renderHeader(config, state);
            return;
        }

        // Export character
        if (target.matches('[data-action="export-char"]') || target.closest('[data-action="export-char"]')) {
            exportCharacter(charId, state);
            return;
        }

        // Reset character
        if (target.matches('[data-action="reset-char"]') || target.closest('[data-action="reset-char"]')) {
            showResetModal(charId, config, state, render);
            return;
        }

        // Ability edit mode toggle
        if (target.matches('[data-action="ability-edit"]') || target.closest('[data-action="ability-edit"]')) {
            abilityEditMode = true;
            editAbilities = null; // will be initialized from current scores
            renderAbilityScores(config, state);
            return;
        }

        // Ability adjustment in edit mode
        if (target.matches('.ability-adj')) {
            const ab = target.dataset.ab;
            const dir = target.dataset.dir;
            if (editAbilities && ab) {
                if (dir === 'up' && editAbilities[ab] < 30) {
                    editAbilities[ab]++;
                } else if (dir === 'down' && editAbilities[ab] > 1) {
                    editAbilities[ab]--;
                }
                renderAbilityScores(config, state);
            }
            return;
        }

        // Ability edit save
        if (target.matches('[data-action="ability-save"]')) {
            if (editAbilities) {
                state.customAbilities = { ...editAbilities };
                saveState(charId, state);
            }
            abilityEditMode = false;
            editAbilities = null;
            render();
            return;
        }

        // Ability edit cancel
        if (target.matches('[data-action="ability-cancel"]')) {
            abilityEditMode = false;
            editAbilities = null;
            renderAbilityScores(config, state);
            return;
        }

        // Spell star/favorite toggle
        if (target.matches('[data-spell-star]') || target.closest('[data-spell-star]')) {
            const starEl = target.matches('[data-spell-star]') ? target : target.closest('[data-spell-star]');
            const spellName = starEl.dataset.spellStar;
            if (spellName) {
                if (!state.favorites) state.favorites = [];
                const idx = state.favorites.indexOf(spellName);
                if (idx >= 0) {
                    state.favorites.splice(idx, 1);
                } else {
                    state.favorites.push(spellName);
                }
                saveState(charId, state);
                renderSpellcasting(config, state);
                e.stopPropagation();
                return;
            }
        }

        // Spell toggles (but not if clicking the star)
        if ((target.matches('.spell-toggle') || target.closest('.spell-toggle')) && !target.matches('[data-spell-star]') && !target.closest('[data-spell-star]')) {
            const btn = target.closest('.spell-toggle') || target;
            const spellName = btn.dataset.spell;
            const spellLevel = parseInt(btn.dataset.level);

            if (spellLevel === 0) {
                // Cantrip toggle
                toggleCantrip(charId, config, state, spellName, render);
            } else {
                // Prepared spell toggle
                togglePrepared(charId, config, state, spellName, render);
            }
            return;
        }

        // Filter bar clicks
        if (target.matches('.filter-btn')) {
            spellFilter = target.dataset.filter || 'all';
            renderSpellcasting(config, state);
            return;
        }

        // Metamagic toggle
        if (target.matches('.metamagic-option') || target.closest('.metamagic-option')) {
            const btn = target.closest('.metamagic-option') || target;
            if (btn.classList.contains('locked')) return;
            const mmName = btn.dataset.metamagic;
            toggleMetamagic(charId, config, state, mmName, render);
            return;
        }

        // ASI option buttons
        if (target.matches('.asi-option') || target.closest('.asi-option')) {
            const btn = target.closest('.asi-option') || target;
            const level = parseInt(btn.dataset.asiLevel);
            const type = btn.dataset.asiType;

            if (type === 'reset') {
                delete state.asiChoices[level];
                saveState(charId, state);
                render();
                return;
            }

            if (type === 'asi-two') {
                showASIAbilityPicker(charId, config, state, level, 'asi-two', render);
                return;
            }

            if (type === 'asi-split') {
                showASIAbilityPicker(charId, config, state, level, 'asi-split', render);
                return;
            }

            if (type === 'feat') {
                showFeatPicker(charId, config, state, level, render);
                return;
            }
        }

        // Item add button
        if (target.matches('[data-action="add-item"]')) {
            const form = document.querySelector('.item-add-form');
            if (form) {
                form.style.display = form.style.display === 'none' ? 'flex' : 'none';
                if (form.style.display !== 'none') {
                    const nameInput = form.querySelector('.item-name-input');
                    if (nameInput) nameInput.focus();
                }
            }
            return;
        }

        // Item confirm
        if (target.matches('[data-action="confirm-item"]')) {
            const form = document.querySelector('.item-add-form');
            if (form) {
                const nameInput = form.querySelector('.item-name-input');
                const weightInput = form.querySelector('.item-weight-input');
                const notesInput = form.querySelector('.item-notes-input');
                const name = (nameInput ? nameInput.value : '').trim();
                const weight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
                const notes = notesInput ? notesInput.value.trim() : '';
                if (name) {
                    if (!state.items) state.items = [];
                    state.items.push({ name, weight, notes });
                    saveState(charId, state);
                    renderItems(config, state);
                }
            }
            return;
        }

        // Item cancel
        if (target.matches('[data-action="cancel-item"]')) {
            const form = document.querySelector('.item-add-form');
            if (form) form.style.display = 'none';
            return;
        }

        // Item remove
        if (target.matches('.item-remove')) {
            const idx = parseInt(target.dataset.itemIdx);
            if (!isNaN(idx) && state.items && state.items[idx] !== undefined) {
                state.items.splice(idx, 1);
                saveState(charId, state);
                renderItems(config, state);
            }
            return;
        }
    });

    // Import character file input
    document.addEventListener('change', function (e) {
        if (e.target.matches('[data-action="import-char"]')) {
            const file = e.target.files && e.target.files[0];
            if (file) {
                importCharacter(charId, file, function (imported) {
                    // Copy imported state to current state reference
                    for (const key of Object.keys(state)) {
                        delete state[key];
                    }
                    // Merge with defaults
                    const config = CHARACTERS[charId];
                    const defaults = {
                        level: 1, skills: [], expertise: [], cantrips: [], prepared: [],
                        metamagic: [], asiChoices: {}, favorites: [],
                        items: [...(config.defaultItems || []).map(i => ({...i}))],
                        customAbilities: null
                    };
                    for (const key of Object.keys(defaults)) {
                        state[key] = imported[key] !== undefined ? imported[key] : defaults[key];
                    }
                    saveState(charId, state);
                    spellFilter = 'all';
                    abilityEditMode = false;
                    editAbilities = null;
                    render();
                });
            }
            // Reset file input so same file can be re-selected
            e.target.value = '';
        }
    });

    // Tooltip event delegation using mouseenter/mouseleave
    document.addEventListener('mouseover', function (e) {
        const target = e.target;

        // Ability score hover tooltip (not in edit mode)
        if (!abilityEditMode) {
            const abilityEl = target.closest('.ability[data-ability]');
            if (abilityEl) {
                const ab = abilityEl.dataset.ability;
                if (ab) {
                    showAbilityTooltip(ab, config, state, abilityEl);
                    return;
                }
            }
        }

        // Spell button hover tooltip
        const spellBtn = target.closest('.spell-toggle');
        if (spellBtn && !target.matches('[data-spell-star]') && !target.closest('[data-spell-star]')) {
            const spellName = spellBtn.dataset.spell;
            if (spellName) {
                showSpellTooltip(spellName, spellBtn);
                return;
            }
        }

        // Info item hover tooltip
        const infoItem = target.closest('.info-item');
        if (infoItem) {
            const valueEl = infoItem.querySelector('.value');
            if (valueEl) {
                const value = valueEl.textContent.trim();
                showInfoTooltip(value, infoItem);
                return;
            }
        }
    });

    document.addEventListener('mouseout', function (e) {
        const target = e.target;
        const abilityEl = target.closest('.ability[data-ability]');
        const spellBtn = target.closest('.spell-toggle');
        const infoItem = target.closest('.info-item');
        if (abilityEl || spellBtn || infoItem) {
            // Check if we're moving to a child of the same element
            const related = e.relatedTarget;
            if (abilityEl && abilityEl.contains(related)) return;
            if (spellBtn && spellBtn.contains(related)) return;
            if (infoItem && infoItem.contains(related)) return;
            removeTooltipPopup();
        }
    });

    // Auto-fill weight when item name matches datalist
    document.addEventListener('input', function (e) {
        if (e.target.matches('.item-name-input')) {
            const val = e.target.value.trim();
            // Try to find weight from DATA.items
            if (typeof DATA !== 'undefined' && DATA.items) {
                for (const category of Object.keys(DATA.items)) {
                    const items = DATA.items[category];
                    if (Array.isArray(items)) {
                        for (const item of items) {
                            const itemName = typeof item === 'string' ? item : item.name;
                            const itemWeight = typeof item === 'object' ? item.weight : undefined;
                            if (itemName === val && itemWeight !== undefined) {
                                const weightInput = document.querySelector('.item-weight-input');
                                if (weightInput) weightInput.value = itemWeight;
                                return;
                            }
                        }
                    }
                }
            }
        }
    });
}

function toggleCantrip(charId, config, state, spellName, render) {
    const idx = state.cantrips.indexOf(spellName);
    if (idx >= 0) {
        state.cantrips.splice(idx, 1);
    } else {
        const maxCantrips = getMaxCantrips(state.level);
        if (state.cantrips.length >= maxCantrips) {
            showWarning(`Maximum aantal cantrips bereikt (${maxCantrips}). Verwijder er eerst een.`);
            return;
        }
        state.cantrips.push(spellName);
    }
    saveState(charId, state);
    render();
}

function togglePrepared(charId, config, state, spellName, render) {
    const idx = state.prepared.indexOf(spellName);
    if (idx >= 0) {
        state.prepared.splice(idx, 1);
    } else {
        const chaMod = getMod(getAbilityScore(config, state, 'cha'));
        const maxPrepared = getMaxPrepared(state, chaMod);
        if (state.prepared.length >= maxPrepared) {
            showWarning(`Maximum aantal voorbereide spells bereikt (${maxPrepared}). Verwijder er eerst een.`);
            return;
        }
        state.prepared.push(spellName);
    }
    saveState(charId, state);
    render();
}

function toggleMetamagic(charId, config, state, mmName, render) {
    const idx = state.metamagic.indexOf(mmName);
    if (idx >= 0) {
        state.metamagic.splice(idx, 1);
    } else {
        // Check max
        let maxChoices = 0;
        if (state.level >= 2) maxChoices = 2;
        if (state.level >= 10) maxChoices = 3;
        if (state.level >= 17) maxChoices = 4;
        if (state.metamagic.length >= maxChoices) {
            showWarning(`Maximum aantal metamagic opties bereikt (${maxChoices}).`);
            return;
        }
        state.metamagic.push(mmName);
    }
    saveState(charId, state);
    render();
}

function cleanupLevelDown(config, state) {
    const lvl = state.level; // the level being removed

    // Remove ASI choice for this level
    delete state.asiChoices[lvl];

    // Trim cantrips if over the new max
    if (config.className === 'sorcerer') {
        const newMaxCantrips = getMaxCantrips(lvl - 1);
        while (state.cantrips.length > newMaxCantrips) {
            state.cantrips.pop();
        }

        // Trim prepared spells if over the new max
        const chaMod = getMod(getAbilityScore(config, state, 'cha'));
        const newMaxPrepared = Math.max(1, chaMod + (lvl - 1));
        while (state.prepared.length > newMaxPrepared) {
            state.prepared.pop();
        }

        // Remove spells of now-unavailable levels
        const newMaxSpellLevel = DATA.sorcerer.maxSpellLevel[lvl - 1] || 1;
        state.prepared = state.prepared.filter(spellName => {
            // Find the spell's level
            for (let sl = 1; sl <= 9; sl++) {
                const spells = DATA.spells.sorcerer[sl] || [];
                if (spells.some(s => s.name === spellName)) {
                    return sl <= newMaxSpellLevel;
                }
            }
            return true;
        });

        // Trim metamagic if losing level 2
        if (lvl - 1 < 2) {
            state.metamagic = [];
        }
        // Trim extra metamagic choices
        let maxMM = 0;
        if (lvl - 1 >= 2) maxMM = 2;
        if (lvl - 1 >= 10) maxMM = 3;
        if (lvl - 1 >= 17) maxMM = 4;
        while (state.metamagic.length > maxMM) {
            state.metamagic.pop();
        }
    }

    // Remove expertise gained at this level (rogue)
    if (config.className === 'rogue') {
        const expertiseLevels = DATA.rogue.expertiseLevels || [1, 6];
        if (expertiseLevels.includes(lvl)) {
            // For simplicity, trim to previous count
            const prevCount = expertiseLevels.filter(l => l < lvl).length * 2;
            while (state.expertise.length > prevCount) {
                state.expertise.pop();
            }
        }
    }
}

function showWarning(message) {
    // Create a temporary warning tooltip
    let warning = document.getElementById('spell-warning');
    if (!warning) {
        warning = document.createElement('div');
        warning.id = 'spell-warning';
        warning.className = 'tooltip';
        warning.style.cssText = 'position:fixed;top:5rem;left:50%;transform:translateX(-50%);z-index:1000;background:#2a1a1a;color:#f87171;border:1px solid #7f1d1d;padding:0.75rem 1.5rem;border-radius:8px;font-size:0.9rem;pointer-events:none;transition:opacity 0.3s;';
        document.body.appendChild(warning);
    }
    warning.textContent = message;
    warning.style.opacity = '1';
    clearTimeout(warning._timeout);
    warning._timeout = setTimeout(() => {
        warning.style.opacity = '0';
    }, 2500);
}

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const charId = document.body.dataset.character; // 'ren' or 'saya'
    if (!charId || !CHARACTERS[charId]) return;

    const config = CHARACTERS[charId];
    let state = loadState(charId);

    function render() {
        renderHeader(config, state);
        renderAbilityScores(config, state);
        renderCombatStats(config, state);
        renderSavingThrows(config, state);
        renderSkills(config, state);

        if (config.className === 'rogue') {
            renderWeapons(config, state);
        }
        if (config.className === 'sorcerer') {
            renderSpellcasting(config, state);
            renderMetamagic(config, state);
        }

        renderFeatures(config, state);
        renderASI(config, state);
        renderItems(config, state);
        saveState(charId, state);
    }

    bindEvents(charId, config, state, render);
    render();
});

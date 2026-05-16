// D&D Within — Widget Registry
// Each widget: id, label, category, icon, sizes (allowed grid units), defaultSize, render(ctx)
// ctx = { charId, config, state, editable, instance, breakpoint }
// Requires: core.js, engine.js, ui-character.js (legacy renderers reused).

var WIDGET_CATEGORIES = [
    { id: 'core',      label: 'Core',      icon: '✦' },
    { id: 'combat',    label: 'Combat',    icon: '⚔' },
    { id: 'spells',    label: 'Spells',    icon: '✨' },
    { id: 'social',    label: 'Social',    icon: '♠' },
    { id: 'exploring', label: 'Exploring', icon: '⚑' },
    { id: 'story',     label: 'Story',     icon: '✎' },
    { id: 'family',    label: 'Family',    icon: '⚶' },
    { id: 'custom',    label: 'Custom',    icon: '○' }
];

// Size = [w, h] in grid units (1 col ≈ 1/12 dashboard width, 1 row = 3.25rem).
//
// Sizing philosophy (#TC68b2):
//   - min  = smallest readable. Below this content gets cramped.
//   - max  = at this size adding more is wasted space.
//   - default = sweet spot for typical layouts.
// Widgets re-arrange their inner grid based on the W×H ratio via @container queries.
var WIDGET_REGISTRY = {

    // ---- Core ----
    'hp-tracker': {
        // Layout: HP value (big) + bar + 3 control groups. Aspect-aware controls.
        label: 'HP Tracker',
        category: 'combat',
        icon: '♥',
        description: 'Current/max HP + damage/heal controls.',
        defaultSize: [4, 3],
        minSize:    [3, 3],
        maxSize:    [12, 4],
        render: function(ctx) { return renderWidgetHP(ctx); }
    },
    'core-stats': {
        // 5 items (AC/Speed/Init/Prof/Hit Dice). Each cell ~50px wide / 2.5rem tall.
        label: 'Core Stats',
        category: 'combat',
        icon: '◈',
        description: 'AC / Speed / Init / Prof / Hit Dice.',
        defaultSize: [8, 2],
        minSize:    [2, 2],
        maxSize:    [12, 3],
        render: function(ctx) { return renderWidgetCoreStats(ctx); }
    },
    'ability-scores': {
        // 6 items. Reflow 6×1 / 3×2 / 2×3 / 1×6 via aspect queries.
        label: 'Ability Scores',
        category: 'core',
        icon: '◇',
        description: 'STR / DEX / CON / INT / WIS / CHA.',
        defaultSize: [12, 3],
        minSize:    [2, 3],
        maxSize:    [12, 4],
        render: function(ctx) { return renderWidgetAbilityScores(ctx); }
    },
    'saving-throws': {
        // 6 saves; same reflow story as abilities.
        label: 'Saving Throws',
        category: 'combat',
        icon: '⛨',
        description: 'Saving throw proficiencies + modifiers.',
        defaultSize: [4, 4],
        minSize:    [2, 3],
        maxSize:    [12, 4],
        render: function(ctx) { return renderWidgetSavingThrows(ctx); }
    },
    'skills': {
        // 18 items. Min needs to fit ~9 rows (2 cols × 9 = 18 visible at 4×6).
        label: 'Skills',
        category: 'core',
        icon: '✓',
        description: 'All skills + proficiency + modifiers.',
        defaultSize: [4, 7],
        minSize:    [3, 5],
        maxSize:    [12, 8],
        render: function(ctx) { return renderWidgetSkills(ctx); }
    },
    'xp-tracker': {
        // Bar + label + ± controls. Always 1 row of content.
        label: 'XP Tracker',
        category: 'core',
        icon: '⚡',
        description: 'Current XP, progress bar, level controls.',
        defaultSize: [6, 2],
        minSize:    [4, 2],
        maxSize:    [12, 2],
        render: function(ctx) { return renderWidgetXP(ctx); }
    },

    // ---- Spells ----
    'spell-slots': {
        // 1 row per slot level (1-9). Typical lvl-1 caster: 1 level, lvl-20: 9.
        label: 'Spell Slots',
        category: 'spells',
        icon: '◉',
        description: 'Per-level spell slot tracker.',
        defaultSize: [5, 4],
        minSize:    [3, 3],
        maxSize:    [12, 5],
        render: function(ctx) { return renderWidgetSpellSlots(ctx); }
    },
    'spells-prepared': {
        // Variable list. Truncates with "more →" link instead of scroll.
        label: 'Prepared Spells',
        category: 'spells',
        icon: '✦',
        description: 'List of prepared spells.',
        defaultSize: [6, 5],
        minSize:    [3, 3],
        maxSize:    [12, 8],
        render: function(ctx) { return renderWidgetSpellsPrepared(ctx); }
    },

    // ---- Combat ----
    'weapons': {
        // ~2 rows per weapon (name + attack/dmg line). Truncates with "more →".
        label: 'Weapons',
        category: 'combat',
        icon: '⚔',
        description: 'Equipped weapons + attack/damage rolls.',
        defaultSize: [6, 4],
        minSize:    [4, 3],
        maxSize:    [12, 6],
        render: function(ctx) { return renderWidgetWeapons(ctx); }
    },
    'class-resources': {
        // 1-3 small trackers depending on class.
        label: 'Class Resources',
        category: 'combat',
        icon: '◆',
        description: 'Rage, ki, sorcery points, etc.',
        defaultSize: [4, 3],
        minSize:    [3, 2],
        maxSize:    [8, 4],
        render: function(ctx) { return renderWidgetClassResources(ctx); }
    },
    'death-saves': {
        // 2 short rows of 3 dots each.
        label: 'Death Saves',
        category: 'combat',
        icon: '☠',
        description: '3 successes / 3 failures tracker.',
        defaultSize: [4, 2],
        minSize:    [3, 2],
        maxSize:    [8, 3],
        render: function(ctx) { return renderWidgetDeathSaves(ctx); }
    },
    'inspiration': {
        // Single big star toggle.
        label: 'Inspiration',
        category: 'combat',
        icon: '★',
        description: 'Heroic Inspiration toggle.',
        defaultSize: [2, 2],
        minSize:    [2, 2],
        maxSize:    [4, 3],
        render: function(ctx) { return renderWidgetInspiration(ctx); }
    },
    'exhaustion': {
        // 6-dot row + penalty caption.
        label: 'Exhaustion',
        category: 'combat',
        icon: '⚠',
        description: 'Exhaustion level (0–6).',
        defaultSize: [4, 2],
        minSize:    [3, 2],
        maxSize:    [8, 3],
        render: function(ctx) { return renderWidgetExhaustion(ctx); }
    },
    'combat-log': {
        // List of recent events (capped at ~30 in render, see-more link).
        label: 'Combat Log',
        category: 'combat',
        icon: '⌬',
        description: 'Recent damage/heal/rest events.',
        defaultSize: [5, 4],
        minSize:    [4, 3],
        maxSize:    [12, 7],
        render: function(ctx) { return renderWidgetCombatLog(ctx); }
    },
    'ability-radar': {
        // SVG hex chart — wants square aspect ratio.
        label: 'Ability Radar',
        category: 'core',
        icon: '⬡',
        description: '6-axis radar chart of abilities.',
        defaultSize: [4, 4],
        minSize:    [3, 3],
        maxSize:    [6, 6],
        render: function(ctx) { return renderWidgetAbilityRadar(ctx); }
    },
    'sneak-attack': {
        // Big number + tiny caption.
        label: 'Sneak Attack',
        category: 'combat',
        icon: '🗡',
        description: 'Sneak attack damage (rogue).',
        defaultSize: [2, 2],
        minSize:    [2, 2],
        maxSize:    [4, 3],
        render: function(ctx) { return renderWidgetSneakAttack(ctx); }
    },
    'metamagic': {
        // Sorcerer-only list.
        label: 'Metamagic',
        category: 'spells',
        icon: '◈',
        description: 'Sorcerer metamagic options.',
        defaultSize: [5, 4],
        minSize:    [3, 3],
        maxSize:    [12, 6],
        render: function(ctx) { return renderWidgetMetamagic(ctx); }
    },

    // ---- Custom / generic ----
    'text': {
        // Free contentEditable; user picks comfortable size.
        label: 'Text Block',
        category: 'custom',
        icon: '✎',
        description: 'Editable text with optional title.',
        defaultSize: [4, 4],
        minSize:    [2, 2],
        maxSize:    [12, 10],
        render: function(ctx) { return renderWidgetText(ctx); }
    },
    'image': {
        // Aspect-cover fills any rectangle.
        label: 'Image',
        category: 'custom',
        icon: '▣',
        description: 'Custom image or character portrait.',
        defaultSize: [4, 4],
        minSize:    [2, 2],
        maxSize:    [12, 8],
        render: function(ctx) { return renderWidgetImage(ctx); }
    },
    'quote': {
        // 1-2 line italic text.
        label: 'Quote',
        category: 'story',
        icon: '❝',
        description: 'Random character quote.',
        defaultSize: [8, 2],
        minSize:    [4, 2],
        maxSize:    [12, 3],
        render: function(ctx) { return renderWidgetQuote(ctx); }
    },

    // ---- Inventory / story ----
    'inventory': {
        // Gold + item list with "manage →" link.
        label: 'Inventory',
        category: 'core',
        icon: '⛂',
        description: 'Item list + gold.',
        defaultSize: [6, 5],
        minSize:    [4, 3],
        maxSize:    [12, 8],
        render: function(ctx) { return renderWidgetInventory(ctx); }
    },

    // ---- Family ----
    'family-diagram': {
        label: 'Family Diagram',
        category: 'family',
        icon: '⚶',
        description: 'Family tree for this character.',
        defaultSize: [10, 6],
        minSize:    [5, 4],
        maxSize:    [12, 10],
        render: function(ctx) { return renderWidgetFamilyDiagram(ctx); }
    },

    // =====================================================================
    // Universal widgets — every class benefits from these
    // =====================================================================
    'passive-scores': {
        label: 'Passive Scores',
        category: 'core',
        icon: '◍',
        description: 'Passive Perception / Investigation / Insight.',
        defaultSize: [4, 2],
        minSize:    [2, 2],
        maxSize:    [12, 3],
        render: function(ctx) { return renderWidgetPassiveScores(ctx); }
    },
    'conditions': {
        label: 'Conditions',
        category: 'combat',
        icon: '⊘',
        description: 'Active conditions tracker (Poisoned, Frightened, etc.).',
        defaultSize: [6, 3],
        minSize:    [3, 2],
        maxSize:    [12, 5],
        render: function(ctx) { return renderWidgetConditions(ctx); }
    },
    'concentration': {
        label: 'Concentration',
        category: 'combat',
        icon: '∾',
        description: 'Active concentration spell + drop control.',
        defaultSize: [4, 2],
        minSize:    [3, 2],
        maxSize:    [8, 3],
        render: function(ctx) { return renderWidgetConcentration(ctx); }
    },
    'senses': {
        label: 'Senses',
        category: 'exploring',
        icon: '◎',
        description: 'Darkvision / Tremorsense / other senses + walking speed.',
        defaultSize: [4, 3],
        minSize:    [3, 2],
        maxSize:    [8, 4],
        render: function(ctx) { return renderWidgetSenses(ctx); }
    },
    'tibf': {
        label: 'Personality',
        category: 'social',
        icon: '☷',
        description: 'Traits / Ideals / Bonds / Flaws.',
        defaultSize: [6, 5],
        minSize:    [3, 4],
        maxSize:    [12, 8],
        render: function(ctx) { return renderWidgetTIBF(ctx); }
    },
    'currency': {
        label: 'Currency',
        category: 'core',
        icon: '◉',
        description: 'PP / GP / EP / SP / CP breakdown.',
        defaultSize: [5, 2],
        minSize:    [2, 2],
        maxSize:    [10, 3],
        render: function(ctx) { return renderWidgetCurrency(ctx); }
    },
    'attuned-items': {
        label: 'Attuned Items',
        category: 'core',
        icon: '✧',
        description: 'Up to 3 attuned magic items.',
        defaultSize: [4, 3],
        minSize:    [3, 3],
        maxSize:    [12, 4],
        render: function(ctx) { return renderWidgetAttuned(ctx); }
    },
    'proficiencies': {
        label: 'Proficiencies',
        category: 'social',
        icon: '✓',
        description: 'Armor / Weapons / Tools / Languages proficiencies.',
        defaultSize: [5, 4],
        minSize:    [3, 3],
        maxSize:    [12, 6],
        render: function(ctx) { return renderWidgetProficiencies(ctx); }
    },
    'class-features': {
        label: 'Class Features',
        category: 'core',
        icon: '✦',
        description: 'Class features unlocked at current level.',
        defaultSize: [6, 6],
        minSize:    [4, 3],
        maxSize:    [12, 10],
        render: function(ctx) { return renderWidgetClassFeatures(ctx); }
    }
};

function widgetTypesByCategory() {
    var grouped = {};
    var keys = Object.keys(WIDGET_REGISTRY);
    for (var i = 0; i < keys.length; i++) {
        var w = WIDGET_REGISTRY[keys[i]];
        if (!grouped[w.category]) grouped[w.category] = [];
        grouped[w.category].push({ type: keys[i], def: w });
    }
    return grouped;
}

// =============================================================================
// Widget render functions — kept thin; reuse legacy renderers in ui-character.js.
// =============================================================================

function widgetEmpty(label) {
    return '<div class="widget-empty"><span class="widget-empty-icon">∅</span><span>' + escapeHtml(label || 'No data') + '</span></div>';
}

function renderWidgetHP(ctx) {
    var config = ctx.config, state = ctx.state, editable = ctx.editable;
    var maxHP = getHP(config, state);
    var currentHP = (state.currentHP === null || state.currentHP === undefined) ? maxHP : state.currentHP;
    var tempHP = state.tempHP || 0;
    var hpPct = maxHP > 0 ? Math.max(0, Math.min(100, Math.round((currentHP / maxHP) * 100))) : 0;
    var hpColor = hpPct > 50 ? 'var(--success)' : (hpPct > 25 ? 'var(--warning)' : 'var(--danger)');

    var html = '<div class="widget-body widget-hp">';
    html += '<div class="hp-display">';
    html += '<span class="hp-current" style="color:' + hpColor + '">' + currentHP + '</span>';
    html += '<span class="hp-separator">/</span>';
    html += '<span class="hp-max">' + maxHP + '</span>';
    if (tempHP > 0) html += '<span class="hp-temp">+' + tempHP + ' temp</span>';
    html += '</div>';
    html += '<div class="hp-bar"><div class="hp-bar-fill" style="width:' + hpPct + '%;background:' + hpColor + '"></div></div>';
    if (editable) {
        // Compact 3-col controls: each column is input + button stacked.
        // Container query collapses to 1 col on narrow widgets / wide row on landscape.
        html += '<div class="hp-controls">';
        html += '<div class="hp-control-group">';
        html += '<input type="number" class="hp-input" id="damage-input" min="0" placeholder="0">';
        html += '<button class="hp-btn hp-btn-damage" data-action="take-damage">Damage</button>';
        html += '</div>';
        html += '<div class="hp-control-group">';
        html += '<input type="number" class="hp-input" id="heal-input" min="0" placeholder="0">';
        html += '<button class="hp-btn hp-btn-heal" data-action="heal">Heal</button>';
        html += '</div>';
        html += '<div class="hp-control-group">';
        html += '<input type="number" class="hp-input" id="temp-hp-input" min="0" placeholder="0" value="' + tempHP + '">';
        html += '<button class="hp-btn hp-btn-temp" data-action="set-temp-hp">Temp</button>';
        html += '</div>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderWidgetCoreStats(ctx) {
    var config = ctx.config, state = ctx.state;
    var ac = getAC(config, state);
    var dexMod = getMod(getAbilityScore(config, state, 'dex'));
    var profBonus = getProfBonus(state.level);
    var classData = DATA[config.className];
    var hitDieNum = classData ? classData.hitDie : 8;
    var raceData = DATA[config.race];
    var speed = (raceData && raceData.speed) ? raceData.speed + 'ft' : '30ft';
    var hitDiceRemaining = state.level - (state.hitDiceUsed || 0);

    var html = '<div class="widget-body combat-stats">';
    html += '<div class="combat-stat"><span class="stat-value">' + ac + '</span><span class="stat-label">AC</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">' + speed + '</span><span class="stat-label">Speed</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">' + formatMod(dexMod) + '</span><span class="stat-label">Init</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">+' + profBonus + '</span><span class="stat-label">Prof</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">' + hitDiceRemaining + 'd' + hitDieNum + '</span><span class="stat-label">Hit Dice</span></div>';
    html += '</div>';
    return html;
}

function renderWidgetAbilityScores(ctx) {
    if (typeof renderAbilityScoresHTML === 'function') {
        return '<div class="widget-body">' + renderAbilityScoresHTML(ctx.charId, ctx.config, ctx.state) + '</div>';
    }
    return widgetEmpty('Ability scores unavailable');
}

function renderWidgetSavingThrows(ctx) {
    if (typeof renderSavingThrowsHTML === 'function') {
        return '<div class="widget-body">' + renderSavingThrowsHTML(ctx.config, ctx.state) + '</div>';
    }
    return widgetEmpty('Saving throws unavailable');
}

function renderWidgetSkills(ctx) {
    if (typeof renderSkillsHTML === 'function') {
        return '<div class="widget-body">' + renderSkillsHTML(ctx.config, ctx.state) + '</div>';
    }
    return widgetEmpty('Skills unavailable');
}

function renderWidgetXP(ctx) {
    var state = ctx.state, editable = ctx.editable;
    var xpThresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
    var currentXP = state.xp || 0;
    var xpForCurrent = xpThresholds[state.level - 1] || 0;
    var xpForNext = xpThresholds[state.level] || xpThresholds[19];
    var xpProgress = state.level >= 20 ? 100 : Math.min(100, Math.round((currentXP - xpForCurrent) / (xpForNext - xpForCurrent) * 100));

    var html = '<div class="widget-body xp-tracker">';
    html += '<div class="xp-bar"><div class="xp-bar-fill" style="width:' + xpProgress + '%"></div></div>';
    html += '<span class="xp-label">Lvl ' + state.level + ' — ' + currentXP.toLocaleString() + ' / ' + (state.level >= 20 ? 'MAX' : xpForNext.toLocaleString()) + ' XP</span>';
    if (editable) {
        html += '<div class="xp-controls">';
        html += '<button class="btn btn-ghost btn-sm xp-btn-minus" data-action="remove-xp">−XP</button>';
        html += '<input type="number" class="xp-input" id="xp-add-input" value="100" min="1" style="width:70px;">';
        html += '<button class="btn btn-ghost btn-sm xp-btn-plus" data-action="add-xp">+XP</button>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderWidgetSpellSlots(ctx) {
    var config = ctx.config, state = ctx.state;
    if (!hasSpellcasting(config.className)) return widgetEmpty('No spellcasting');
    var classData = DATA[config.className];
    var slotsUsed = state.spellSlotsUsed || {};
    var html = '<div class="widget-body slot-tracker">';
    if (config.className === 'warlock') {
        var warlockData = DATA.warlock;
        var pactNum = warlockData ? (warlockData.pactSlots[state.level] || 1) : 1;
        var pactLvl = warlockData ? (warlockData.pactSlotLevel[state.level] || 1) : 1;
        var pactUsed = slotsUsed['pact'] || 0;
        html += '<div class="slot-level"><span class="slot-level-label">Pact (Lvl ' + pactLvl + ')</span><div class="slot-dots">';
        for (var pi = 0; pi < pactNum; pi++) {
            html += '<div class="slot-dot' + (pi < pactUsed ? ' used' : '') + '" data-action="toggle-spell-slot" data-slot-level="pact" data-slot-idx="' + pi + '"></div>';
        }
        html += '</div></div>';
    } else {
        var slotTable = null;
        if (classData && classData.spellSlots) slotTable = classData.spellSlots[state.level] || null;
        else if (classData && classData.spellcasting === 'half') slotTable = DATA.halfCasterSlots[state.level] || null;
        if (slotTable) {
            for (var sl = 0; sl < slotTable.length; sl++) {
                var totalSlots = slotTable[sl];
                if (totalSlots <= 0) continue;
                var lvlUsed = slotsUsed[sl + 1] || 0;
                html += '<div class="slot-level"><span class="slot-level-label">Lvl ' + (sl + 1) + '</span><div class="slot-dots">';
                for (var sd = 0; sd < totalSlots; sd++) {
                    html += '<div class="slot-dot' + (sd < lvlUsed ? ' used' : '') + '" data-action="toggle-spell-slot" data-slot-level="' + (sl + 1) + '" data-slot-idx="' + sd + '"></div>';
                }
                html += '</div></div>';
            }
        }
    }
    html += '</div>';
    return html;
}

function renderWidgetSpellsPrepared(ctx) {
    var config = ctx.config, state = ctx.state;
    if (!hasSpellcasting(config.className)) return widgetEmpty('No spellcasting');
    var prepared = state.prepared || [];
    var html = '<div class="widget-body widget-spells-list">';
    if (!prepared.length) {
        html += '<p class="block-note">No spells prepared.</p>';
    } else {
        html += '<div class="widget-list-clip">';
        html += '<ul class="spells-prepared-list">';
        for (var i = 0; i < prepared.length; i++) {
            html += '<li class="spell-prepared-item"><span class="spell-name">' + escapeHtml(prepared[i]) + '</span></li>';
        }
        html += '</ul>';
        html += '<button class="widget-more" data-action="goto-spells-tab" title="Open Spells tab">Manage →</button>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderWidgetWeapons(ctx) {
    var config = ctx.config, state = ctx.state, editable = ctx.editable, charId = ctx.charId;
    if (typeof renderWeaponsHTML !== 'function') return widgetEmpty('Weapons unavailable');
    var hasWeapons = !!(config.weapons && config.weapons.length > 0);
    var html = '<div class="widget-body widget-weapons">';
    if (!hasWeapons) {
        html += '<p class="block-note">No weapons equipped.</p>';
        if (editable) html += '<button class="widget-more" data-action="add-weapon">+ Add →</button>';
    } else {
        html += '<div class="widget-list-clip">';
        html += renderWeaponsHTML(config, state, editable, charId);
        if (editable) html += '<button class="widget-more" data-action="add-weapon">+ Add →</button>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderWidgetClassResources(ctx) {
    if (typeof renderClassResourcesHTML !== 'function') return widgetEmpty('Class resources unavailable');
    return '<div class="widget-body">' + renderClassResourcesHTML(ctx.config, ctx.state, ctx.editable) + '</div>';
}

function renderWidgetText(ctx) {
    var inst = ctx.instance || {};
    var cfg = inst.config || {};
    var title = cfg.title || '';
    var body = cfg.body || '';
    var editable = ctx.editable;
    var html = '<div class="widget-body widget-text">';
    if (title || editable) {
        html += '<h3 class="widget-text-title"' + (editable ? ' contenteditable="true" data-action="widget-text-title" data-wid="' + inst.wid + '"' : '') + '>' + escapeHtml(title) + '</h3>';
    }
    html += '<div class="widget-text-body"' + (editable ? ' contenteditable="true" data-action="widget-text-body" data-wid="' + inst.wid + '"' : '') + '>';
    if (body) html += escapeHtml(body).replace(/\n/g, '<br>');
    html += '</div>';
    html += '</div>';
    return html;
}

function renderWidgetImage(ctx) {
    var inst = ctx.instance || {};
    var cfg = inst.config || {};
    var src = cfg.src || loadImage(ctx.charId, 'portrait');
    var editable = ctx.editable;
    var html = '<div class="widget-body widget-image">';
    if (src) html += '<img src="' + src + '" alt="">';
    else html += '<div class="widget-image-placeholder">No image</div>';
    if (editable) {
        html += '<label class="widget-image-upload" title="Upload image"><span>📷</span>';
        html += '<input type="file" accept="image/*" data-action="widget-image-upload" data-wid="' + inst.wid + '" style="display:none">';
        html += '</label>';
    }
    html += '</div>';
    return html;
}

function renderWidgetQuote(ctx) {
    var quotes = (ctx.config.quotes || []);
    var quoteText = quotes.length ? quotes[Math.floor(Math.random() * quotes.length)] : '';
    var html = '<div class="widget-body widget-quote">';
    if (quoteText) {
        html += '<p class="char-quote-dynamic">&ldquo;' + escapeHtml(quoteText) + '&rdquo;</p>';
        html += '<button class="quote-refresh-btn" data-action="refresh-quote" title="New quote">↻</button>';
    } else {
        html += '<p class="block-note">No quotes added yet.</p>';
    }
    html += '</div>';
    return html;
}

function renderWidgetInventory(ctx) {
    var state = ctx.state, editable = ctx.editable;
    var items = state.items || [];
    var html = '<div class="widget-body widget-inventory">';
    html += '<div class="widget-inv-gold">Gold: ' + (state.gold || 0) + '</div>';
    if (!items.length) {
        html += '<p class="block-note">No items.</p>';
    } else {
        html += '<div class="widget-list-clip">';
        html += '<ul class="widget-inv-list">';
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            html += '<li><span>' + escapeHtml(it.name || '?') + '</span>';
            if (it.quantity > 1) html += ' <span class="text-dim">×' + it.quantity + '</span>';
            html += '</li>';
        }
        html += '</ul>';
        if (editable) html += '<button class="widget-more" data-action="goto-inventory-tab" title="Open Inventory tab">Manage →</button>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderWidgetDeathSaves(ctx) {
    var state = ctx.state, editable = ctx.editable;
    var ds = state.deathSaves || { successes: 0, failures: 0 };
    var html = '<div class="widget-body widget-death-saves">';
    html += '<div class="death-save-group"><label>Successes</label><div class="death-save-dots">';
    for (var si = 0; si < 3; si++) {
        var sFilled = si < ds.successes ? ' filled' : '';
        html += '<div class="death-save-dot success' + sFilled + '" ' + (editable ? 'data-action="toggle-death-save" data-save-type="successes" data-save-idx="' + si + '"' : '') + '></div>';
    }
    html += '</div></div>';
    html += '<div class="death-save-group"><label>Failures</label><div class="death-save-dots">';
    for (var fi = 0; fi < 3; fi++) {
        var fFilled = fi < ds.failures ? ' filled' : '';
        html += '<div class="death-save-dot failure' + fFilled + '" ' + (editable ? 'data-action="toggle-death-save" data-save-type="failures" data-save-idx="' + fi + '"' : '') + '></div>';
    }
    html += '</div></div>';
    if (editable) html += '<button class="btn btn-ghost btn-sm" data-action="reset-death-saves">Reset</button>';
    html += '</div>';
    return html;
}

function renderWidgetInspiration(ctx) {
    var state = ctx.state, editable = ctx.editable;
    var html = '<div class="widget-body widget-inspiration">';
    html += '<div class="inspiration-toggle" ' + (editable ? 'data-action="toggle-inspiration"' : '') + '>';
    html += '<span class="inspiration-star' + (state.inspiration ? ' active' : '') + '">★</span>';
    html += '<span class="inspiration-label">Heroic Inspiration</span>';
    html += '</div>';
    html += '</div>';
    return html;
}

function renderWidgetExhaustion(ctx) {
    var state = ctx.state, editable = ctx.editable;
    var lvl = state.exhaustion || 0;
    var html = '<div class="widget-body widget-exhaustion">';
    html += '<div class="exhaustion-row">';
    html += '<span class="exhaustion-current-label">Lvl ' + lvl + '</span>';
    html += '<div class="exhaustion-dots">';
    for (var i = 1; i <= 6; i++) {
        var filled = i <= lvl ? ' filled' : '';
        html += '<div class="exhaustion-dot' + filled + '" ' + (editable ? 'data-action="set-exhaustion" data-level="' + i + '"' : '') + ' title="Level ' + i + ': −' + (i * 2) + ' op d20 rolls"></div>';
    }
    html += '</div>';
    if (lvl > 0) html += '<span class="exhaustion-penalty">−' + (lvl * 2) + ' op d20</span>';
    if (editable && lvl > 0) html += '<button class="btn btn-ghost btn-sm" data-action="set-exhaustion" data-level="0">Clear</button>';
    html += '</div>';
    html += '</div>';
    return html;
}

function renderWidgetCombatLog(ctx) {
    var state = ctx.state, editable = ctx.editable;
    var log = state.combatLog || [];
    var html = '<div class="widget-body widget-combat-log">';
    if (!log.length) {
        html += '<p class="block-note">No combat events yet.</p>';
    } else {
        html += '<div class="widget-list-clip">';
        html += '<div class="combat-log">';
        for (var i = 0; i < Math.min(log.length, 30); i++) {
            var e = log[i];
            var icon = e.type === 'damage' ? '🔴' : e.type === 'heal' ? '🟢' : '😴';
            var text = e.type === 'damage' ? '−' + e.amount + ' damage' : e.type === 'heal' ? '+' + e.amount + ' healed' : (e.source || 'Rest');
            if (e.source && e.type !== 'rest') text += ' (' + e.source + ')';
            var time = e.time ? new Date(e.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            html += '<div class="combat-log-entry combat-log-' + e.type + '">' + icon + ' ' + escapeHtml(text) + '<span class="combat-log-time">' + time + '</span>';
            if (editable) html += '<button class="btn-inline-delete" data-action="delete-combat-log" data-log-idx="' + i + '" title="Remove">×</button>';
            html += '</div>';
        }
        html += '</div>';
        if (editable) html += '<button class="widget-more" data-action="clear-combat-log" title="Clear all entries">Clear →</button>';
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderWidgetAbilityRadar(ctx) {
    if (typeof renderAbilityRadar !== 'function') return widgetEmpty('Radar unavailable');
    var html = '<div class="widget-body widget-ability-radar">';
    try { html += renderAbilityRadar(ctx.config, ctx.state); } catch (e) { html += widgetEmpty('Radar render failed'); }
    html += '</div>';
    return html;
}

function renderWidgetSneakAttack(ctx) {
    var config = ctx.config, state = ctx.state;
    if (config.className !== 'rogue') return widgetEmpty('Rogue only');
    var dmg = (DATA.rogue && DATA.rogue.sneakAttack) ? DATA.rogue.sneakAttack[state.level] || '1d6' : '1d6';
    return '<div class="widget-body widget-sneak-attack"><div class="sneak-amount">' + dmg + '</div><div class="sneak-label">Sneak Attack</div></div>';
}

function renderWidgetMetamagic(ctx) {
    var config = ctx.config;
    if (config.className !== 'sorcerer') return widgetEmpty('Sorcerer only');
    if (typeof renderMetamagicHTML !== 'function') return widgetEmpty('Metamagic unavailable');
    return '<div class="widget-body widget-metamagic">'
         + '<div class="widget-list-clip">'
         +   renderMetamagicHTML(ctx.charId, ctx.config, ctx.state)
         + '</div>'
         + '</div>';
}

function renderWidgetFamilyDiagram(ctx) {
    if (typeof getFamilyForMember !== 'function' || typeof renderFamilyDiagram !== 'function') {
        return widgetEmpty('Families module unavailable');
    }
    var fam = null;
    try { fam = getFamilyForMember(ctx.charId); } catch (e) { fam = null; }
    if (!fam) return widgetEmpty('No family configured. Add via Family page.');
    var html = '<div class="widget-body widget-family">';
    try { html += renderFamilyDiagram(fam.id, ctx.editable); } catch (e) { html += widgetEmpty('Family render failed'); }
    html += '</div>';
    return html;
}

// =============================================================================
// Universal widgets (added 2026-05-15)
// =============================================================================

// Passive scores — Perception / Investigation / Insight = 10 + mod + (prof if skilled)
function renderWidgetPassiveScores(ctx) {
    var config = ctx.config, state = ctx.state;
    var wisMod = getMod(getAbilityScore(config, state, 'wis'));
    var intMod = getMod(getAbilityScore(config, state, 'int'));
    var prof = getProfBonus(state.level || 1);
    var skills = (state.skills || []).map(function(s) { return String(s).toLowerCase(); });
    function passive(mod, skillName) {
        return 10 + mod + (skills.indexOf(skillName.toLowerCase()) !== -1 ? prof : 0);
    }
    var perception     = passive(wisMod, 'perception');
    var investigation  = passive(intMod, 'investigation');
    var insight        = passive(wisMod, 'insight');
    var html = '<div class="widget-body widget-passives">';
    html += '<div class="passives-grid">';
    html += '<div class="passive-cell"><span class="w-value">' + perception + '</span><span class="w-label">Perception</span></div>';
    html += '<div class="passive-cell"><span class="w-value">' + investigation + '</span><span class="w-label">Investigation</span></div>';
    html += '<div class="passive-cell"><span class="w-value">' + insight + '</span><span class="w-label">Insight</span></div>';
    html += '</div>';
    html += '</div>';
    return html;
}

// 14 D&D 5e conditions — toggleable. Reuses existing toggle-condition action.
var DND_CONDITIONS = [
    'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated',
    'Invisible', 'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained',
    'Stunned', 'Unconscious'
];
function renderWidgetConditions(ctx) {
    var state = ctx.state;
    var active = state.conditions || [];
    var html = '<div class="widget-body widget-conditions">';
    html += '<div class="widget-list-clip">';
    html += '<div class="conditions-pills">';
    for (var i = 0; i < DND_CONDITIONS.length; i++) {
        var c = DND_CONDITIONS[i];
        var isActive = active.indexOf(c) !== -1;
        html += '<button class="condition-pill' + (isActive ? ' active' : '') + '" data-action="toggle-condition" data-condition="' + escapeAttr(c) + '" title="' + escapeAttr(c) + '">' + escapeHtml(c) + '</button>';
    }
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
}

// Concentration — single active spell + drop. Reuses drop-concentration / set-concentration.
function renderWidgetConcentration(ctx) {
    var config = ctx.config, state = ctx.state, editable = ctx.editable;
    if (!hasSpellcasting(config.className)) return widgetEmpty('No spellcasting');
    var concentrating = state.concentrating || null;
    var html = '<div class="widget-body widget-concentration">';
    if (concentrating) {
        html += '<div class="conc-active">';
        html += '<span class="w-label">Concentrating on</span>';
        html += '<span class="conc-spell">' + escapeHtml(concentrating) + '</span>';
        if (editable) html += '<button class="widget-more" data-action="drop-concentration" title="Drop concentration" style="color:var(--danger);">Drop ✕</button>';
        html += '</div>';
    } else {
        html += '<div class="conc-empty"><span class="w-label">Not concentrating</span>';
        if (editable) {
            var prep = state.prepared || [];
            if (prep.length) {
                html += '<select class="conc-select" data-action="set-concentration"><option value="">Set…</option>';
                for (var i = 0; i < prep.length; i++) {
                    html += '<option value="' + escapeAttr(prep[i]) + '">' + escapeHtml(prep[i]) + '</option>';
                }
                html += '</select>';
            }
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

// Senses — walking speed + race-derived darkvision/etc.
function renderWidgetSenses(ctx) {
    var config = ctx.config;
    var race = DATA[config.race] || {};
    var speed = (race.speed || 30) + 'ft';
    var senses = [];
    if (race.darkvision)  senses.push({ label: 'Darkvision',  val: race.darkvision  + 'ft' });
    if (race.tremorsense) senses.push({ label: 'Tremorsense', val: race.tremorsense + 'ft' });
    if (race.blindsight)  senses.push({ label: 'Blindsight',  val: race.blindsight  + 'ft' });
    if (race.truesight)   senses.push({ label: 'Truesight',   val: race.truesight   + 'ft' });
    if (race.flying)      senses.push({ label: 'Flying',      val: race.flying + 'ft' });
    if (race.swimming)    senses.push({ label: 'Swimming',    val: race.swimming + 'ft' });
    if (race.climbing)    senses.push({ label: 'Climbing',    val: race.climbing + 'ft' });
    var html = '<div class="widget-body widget-senses">';
    html += '<div class="senses-grid">';
    html += '<div class="sense-cell"><span class="w-value">' + speed + '</span><span class="w-label">Walking</span></div>';
    for (var i = 0; i < senses.length; i++) {
        html += '<div class="sense-cell"><span class="w-value">' + escapeHtml(senses[i].val) + '</span><span class="w-label">' + escapeHtml(senses[i].label) + '</span></div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
}

// Traits / Ideals / Bonds / Flaws — 4 contentEditable fields.
function renderWidgetTIBF(ctx) {
    var state = ctx.state, editable = ctx.editable;
    var traits = state.traits || {};
    function field(key, label) {
        var val = traits[key] || '';
        var attrs = editable ? ' contenteditable="true" data-action="set-trait" data-key="' + key + '"' : '';
        var placeholder = editable && !val ? ' data-empty="' + label + '…"' : '';
        return '<section class="tibf-field">'
             + '<h4 class="w-label">' + label + '</h4>'
             + '<div class="tibf-body"' + attrs + placeholder + '>' + escapeHtml(val).replace(/\n/g, '<br>') + '</div>'
             + '</section>';
    }
    var html = '<div class="widget-body widget-tibf">';
    html += '<div class="widget-list-clip">';
    html += field('personality', 'Personality Traits');
    html += field('ideals',      'Ideals');
    html += field('bonds',       'Bonds');
    html += field('flaws',       'Flaws');
    html += '</div>';
    html += '</div>';
    return html;
}

// Currency — PP / GP / EP / SP / CP inputs. Falls back to legacy state.gold for GP.
function renderWidgetCurrency(ctx) {
    var state = ctx.state, editable = ctx.editable;
    var currency = state.currency || {};
    var legacyGold = parseInt(state.gold, 10);
    if (!isNaN(legacyGold) && (currency.gp === undefined || currency.gp === null)) currency.gp = legacyGold;
    var denoms = [
        { key: 'pp', label: 'PP', tint: 'oklch(85% 0.05 250)'  },
        { key: 'gp', label: 'GP', tint: 'var(--warning)' },
        { key: 'ep', label: 'EP', tint: 'oklch(75% 0.10 100)'  },
        { key: 'sp', label: 'SP', tint: 'oklch(80% 0.02 0)'   },
        { key: 'cp', label: 'CP', tint: 'oklch(60% 0.15 40)'   }
    ];
    var html = '<div class="widget-body widget-currency">';
    html += '<div class="currency-grid">';
    for (var i = 0; i < denoms.length; i++) {
        var d = denoms[i];
        var v = currency[d.key];
        if (v === undefined || v === null) v = 0;
        html += '<div class="currency-cell">';
        if (editable) {
            html += '<input type="number" class="currency-input" min="0" data-action="set-currency" data-denom="' + d.key + '" value="' + v + '" style="color:' + d.tint + '">';
        } else {
            html += '<span class="w-value" style="color:' + d.tint + '">' + v + '</span>';
        }
        html += '<span class="w-label">' + d.label + '</span>';
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
}

// Attuned items — exactly 3 slots, editable label per slot.
function renderWidgetAttuned(ctx) {
    var state = ctx.state, editable = ctx.editable;
    var attuned = state.attuned || ['', '', ''];
    while (attuned.length < 3) attuned.push('');
    var html = '<div class="widget-body widget-attuned">';
    for (var i = 0; i < 3; i++) {
        var val = attuned[i] || '';
        html += '<div class="attuned-slot' + (val ? ' filled' : ' empty') + '">';
        html += '<span class="w-label">' + (i + 1) + '</span>';
        if (editable) {
            html += '<input class="attuned-input" data-action="set-attuned" data-idx="' + i + '" value="' + escapeAttr(val) + '" placeholder="Empty slot">';
        } else {
            html += '<span class="attuned-name">' + (val ? escapeHtml(val) : '—') + '</span>';
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

// Proficiencies — armor / weapons / tools / languages. Pulls from class + race + background.
function renderWidgetProficiencies(ctx) {
    var config = ctx.config;
    var cls = DATA[config.className] || {};
    var race = DATA[config.race] || {};
    var bg = (DATA.backgrounds && DATA.backgrounds[config.background]) || {};

    function gather(field) {
        var out = [];
        function push(arr) { if (Array.isArray(arr)) for (var i = 0; i < arr.length; i++) if (out.indexOf(arr[i]) === -1) out.push(arr[i]); }
        push(cls[field]); push(race[field]); push(bg[field]);
        return out;
    }
    var armor = gather('armorProfs');
    var weapons = gather('weaponProfs');
    var tools = gather('toolProfs');
    if (bg.tool) tools.push(bg.tool);
    var languages = gather('languages');

    function row(label, arr) {
        return '<div class="prof-row">'
             + '<h4 class="w-label">' + label + '</h4>'
             + '<p class="prof-list">' + (arr.length ? escapeHtml(arr.join(', ')) : '<em class="text-dim">None</em>') + '</p>'
             + '</div>';
    }
    var html = '<div class="widget-body widget-proficiencies">';
    html += '<div class="widget-list-clip">';
    html += row('Armor',     armor);
    html += row('Weapons',   weapons);
    html += row('Tools',     tools);
    html += row('Languages', languages);
    html += '</div>';
    html += '</div>';
    return html;
}

// Class features — from DATA[className].features filtered by current level.
function renderWidgetClassFeatures(ctx) {
    var config = ctx.config, state = ctx.state;
    var cls = DATA[config.className];
    if (!cls) return widgetEmpty('Unknown class');
    var feats = [];
    if (Array.isArray(cls.features)) {
        feats = cls.features.filter(function(f) { return (f.level || 1) <= (state.level || 1); });
    } else if (cls.features && typeof cls.features === 'object') {
        for (var lvl in cls.features) {
            if (!Object.prototype.hasOwnProperty.call(cls.features, lvl)) continue;
            if (parseInt(lvl, 10) > (state.level || 1)) continue;
            var list = cls.features[lvl];
            if (Array.isArray(list)) {
                for (var i = 0; i < list.length; i++) {
                    feats.push({ level: parseInt(lvl, 10), name: list[i].name || list[i], desc: list[i].desc || '' });
                }
            }
        }
    }
    if (!feats.length) return widgetEmpty('No features at this level');
    feats.sort(function(a, b) { return (b.level || 0) - (a.level || 0); });
    var html = '<div class="widget-body widget-classfeats">';
    html += '<div class="widget-list-clip"><ul class="classfeats-list">';
    for (var i = 0; i < feats.length; i++) {
        var f = feats[i];
        html += '<li class="classfeat-row">';
        html += '<span class="classfeat-level">L' + (f.level || '?') + '</span>';
        html += '<span class="classfeat-name">' + escapeHtml(f.name) + '</span>';
        html += '</li>';
    }
    html += '</ul></div>';
    html += '</div>';
    return html;
}

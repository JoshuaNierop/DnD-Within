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

// Size = [w, h] in grid units. Aspect-friendly defaults; min/max define resize range.
var WIDGET_REGISTRY = {

    // ---- Core ----
    'hp-tracker': {
        label: 'HP Tracker',
        category: 'combat',
        icon: '♥',
        description: 'Current/max HP with damage and heal controls.',
        defaultSize: [4, 3],
        minSize: [3, 2],
        maxSize: [12, 4],
        render: function(ctx) { return renderWidgetHP(ctx); }
    },
    'core-stats': {
        label: 'Core Stats',
        category: 'combat',
        icon: '◈',
        description: 'AC / Speed / Initiative / Prof. Bonus / Hit Dice.',
        defaultSize: [8, 2],
        minSize: [4, 2],
        maxSize: [12, 2],
        render: function(ctx) { return renderWidgetCoreStats(ctx); }
    },
    'ability-scores': {
        label: 'Ability Scores',
        category: 'core',
        icon: '◇',
        description: 'STR / DEX / CON / INT / WIS / CHA grid.',
        defaultSize: [12, 2],
        minSize: [6, 2],
        maxSize: [12, 4],
        render: function(ctx) { return renderWidgetAbilityScores(ctx); }
    },
    'saving-throws': {
        label: 'Saving Throws',
        category: 'combat',
        icon: '⛨',
        description: 'Saving throw proficiencies and modifiers.',
        defaultSize: [6, 4],
        minSize: [3, 3],
        maxSize: [12, 6],
        render: function(ctx) { return renderWidgetSavingThrows(ctx); }
    },
    'skills': {
        label: 'Skills',
        category: 'core',
        icon: '✓',
        description: 'All skills with proficiency and modifiers.',
        defaultSize: [6, 6],
        minSize: [3, 4],
        maxSize: [12, 10],
        render: function(ctx) { return renderWidgetSkills(ctx); }
    },
    'xp-tracker': {
        label: 'XP Tracker',
        category: 'core',
        icon: '⚡',
        description: 'Current XP, progress bar, level controls.',
        defaultSize: [6, 1],
        minSize: [3, 1],
        maxSize: [12, 2],
        render: function(ctx) { return renderWidgetXP(ctx); }
    },

    // ---- Spells ----
    'spell-slots': {
        label: 'Spell Slots',
        category: 'spells',
        icon: '◉',
        description: 'Per-level spell slot tracker.',
        defaultSize: [6, 2],
        minSize: [3, 1],
        maxSize: [12, 4],
        render: function(ctx) { return renderWidgetSpellSlots(ctx); }
    },
    'spells-prepared': {
        label: 'Prepared Spells',
        category: 'spells',
        icon: '✦',
        description: 'List of prepared spells with quick-cast.',
        defaultSize: [12, 6],
        minSize: [4, 3],
        maxSize: [12, 12],
        render: function(ctx) { return renderWidgetSpellsPrepared(ctx); }
    },

    // ---- Combat ----
    'weapons': {
        label: 'Weapons',
        category: 'combat',
        icon: '⚔',
        description: 'Equipped weapons with attack and damage rolls.',
        defaultSize: [6, 3],
        minSize: [4, 2],
        maxSize: [12, 6],
        render: function(ctx) { return renderWidgetWeapons(ctx); }
    },
    'class-resources': {
        label: 'Class Resources',
        category: 'combat',
        icon: '◆',
        description: 'Class-specific trackers (rage, ki, sorcery points, etc.).',
        defaultSize: [4, 2],
        minSize: [2, 1],
        maxSize: [12, 4],
        render: function(ctx) { return renderWidgetClassResources(ctx); }
    },
    'death-saves': {
        label: 'Death Saves',
        category: 'combat',
        icon: '☠',
        description: '3 successes / 3 failures tracker (visible when HP ≤ 0).',
        defaultSize: [4, 2],
        minSize: [3, 2],
        maxSize: [12, 3],
        render: function(ctx) { return renderWidgetDeathSaves(ctx); }
    },
    'inspiration': {
        label: 'Inspiration',
        category: 'combat',
        icon: '★',
        description: 'Heroic Inspiration toggle.',
        defaultSize: [3, 1],
        minSize: [2, 1],
        maxSize: [6, 2],
        render: function(ctx) { return renderWidgetInspiration(ctx); }
    },
    'exhaustion': {
        label: 'Exhaustion',
        category: 'combat',
        icon: '⚠',
        description: 'Exhaustion level tracker (0–6).',
        defaultSize: [4, 1],
        minSize: [3, 1],
        maxSize: [8, 2],
        render: function(ctx) { return renderWidgetExhaustion(ctx); }
    },
    'combat-log': {
        label: 'Combat Log',
        category: 'combat',
        icon: '⌬',
        description: 'Recent damage/heal/rest events.',
        defaultSize: [6, 4],
        minSize: [4, 2],
        maxSize: [12, 8],
        render: function(ctx) { return renderWidgetCombatLog(ctx); }
    },
    'ability-radar': {
        label: 'Ability Radar',
        category: 'core',
        icon: '⬡',
        description: '6-axis radar chart of ability scores.',
        defaultSize: [4, 4],
        minSize: [3, 3],
        maxSize: [8, 8],
        render: function(ctx) { return renderWidgetAbilityRadar(ctx); }
    },
    'sneak-attack': {
        label: 'Sneak Attack',
        category: 'combat',
        icon: '🗡',
        description: 'Sneak attack damage by level (rogue).',
        defaultSize: [3, 1],
        minSize: [2, 1],
        maxSize: [6, 2],
        render: function(ctx) { return renderWidgetSneakAttack(ctx); }
    },
    'metamagic': {
        label: 'Metamagic',
        category: 'spells',
        icon: '◈',
        description: 'Sorcerer metamagic options.',
        defaultSize: [6, 3],
        minSize: [4, 2],
        maxSize: [12, 6],
        render: function(ctx) { return renderWidgetMetamagic(ctx); }
    },

    // ---- Custom / generic ----
    'text': {
        label: 'Text Block',
        category: 'custom',
        icon: '✎',
        description: 'Editable rich text with optional title.',
        defaultSize: [4, 4],
        minSize: [2, 2],
        maxSize: [12, 12],
        render: function(ctx) { return renderWidgetText(ctx); }
    },
    'image': {
        label: 'Image',
        category: 'custom',
        icon: '▣',
        description: 'Custom image (uploaded base64 or character portrait).',
        defaultSize: [4, 4],
        minSize: [2, 2],
        maxSize: [12, 8],
        render: function(ctx) { return renderWidgetImage(ctx); }
    },
    'quote': {
        label: 'Quote',
        category: 'story',
        icon: '❝',
        description: 'Random rotating character quote.',
        defaultSize: [12, 1],
        minSize: [4, 1],
        maxSize: [12, 2],
        render: function(ctx) { return renderWidgetQuote(ctx); }
    },

    // ---- Inventory / story ----
    'inventory': {
        label: 'Inventory',
        category: 'core',
        icon: '⛂',
        description: 'Item list with quantities and gold.',
        defaultSize: [8, 6],
        minSize: [4, 3],
        maxSize: [12, 12],
        render: function(ctx) { return renderWidgetInventory(ctx); }
    },

    // ---- Family ----
    'family-diagram': {
        label: 'Family Diagram',
        category: 'family',
        icon: '⚶',
        description: 'Family tree/diagram for this character.',
        defaultSize: [12, 8],
        minSize: [6, 4],
        maxSize: [12, 12],
        render: function(ctx) { return renderWidgetFamilyDiagram(ctx); }
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
        html += '<div class="hp-controls">';
        html += '<input type="number" class="hp-input" id="damage-input" min="0" placeholder="0">';
        html += '<button class="hp-btn hp-btn-damage" data-action="take-damage">Damage</button>';
        html += '<input type="number" class="hp-input" id="heal-input" min="0" placeholder="0">';
        html += '<button class="hp-btn hp-btn-heal" data-action="heal">Heal</button>';
        html += '<input type="number" class="hp-input" id="temp-hp-input" min="0" placeholder="0" value="' + tempHP + '">';
        html += '<button class="hp-btn hp-btn-temp" data-action="set-temp-hp">Temp HP</button>';
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
    if (!prepared.length) html += '<p class="block-note">No spells prepared.</p>';
    else {
        html += '<ul class="spells-prepared-list">';
        for (var i = 0; i < prepared.length; i++) {
            html += '<li class="spell-prepared-item"><span class="spell-name">' + escapeHtml(prepared[i]) + '</span></li>';
        }
        html += '</ul>';
    }
    html += '<button class="btn btn-ghost btn-sm" data-action="goto-spells-tab">Manage spells →</button>';
    html += '</div>';
    return html;
}

function renderWidgetWeapons(ctx) {
    var config = ctx.config, state = ctx.state, editable = ctx.editable, charId = ctx.charId;
    if (typeof renderWeaponsHTML !== 'function') return widgetEmpty('Weapons unavailable');
    var inner = (config.weapons && config.weapons.length > 0) ? renderWeaponsHTML(config, state, editable, charId) : '<p class="block-note">No weapons equipped.</p>';
    var html = '<div class="widget-body">' + inner;
    if (editable) html += '<button class="btn btn-ghost btn-sm" data-action="add-weapon" style="margin-top:0.5rem;">+ Add Weapon</button>';
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
    if (!items.length) html += '<p class="block-note">No items.</p>';
    else {
        html += '<ul class="widget-inv-list">';
        for (var i = 0; i < items.length; i++) {
            var it = items[i];
            html += '<li><span>' + escapeHtml(it.name || '?') + '</span>';
            if (it.quantity > 1) html += ' <span class="text-dim">×' + it.quantity + '</span>';
            html += '</li>';
        }
        html += '</ul>';
    }
    if (editable) html += '<button class="btn btn-ghost btn-sm" data-action="goto-inventory-tab">Manage →</button>';
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
        if (editable) html += '<button class="btn btn-ghost btn-sm" data-action="clear-combat-log">Clear log</button>';
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
    return '<div class="widget-body">' + renderMetamagicHTML(ctx.charId, ctx.config, ctx.state) + '</div>';
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

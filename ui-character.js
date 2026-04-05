// D&D Within — Character Sheet (tabs, level-up, ASI, spell toggles)
// Requires: core.js

// ============================================================
// Section 13: Character Sheet
// ============================================================

function renderCharacterSheet(charId) {
    var config = loadCharConfig(charId);
    if (!config) {
        return '<div class="page-placeholder"><h2>' + t('char.notfound') + '</h2></div>';
    }

    var state = loadCharState(charId);
    var editable = canEdit(charId);

    var classLabel = classDisplayName(config.className);
    var subLabel = subclassDisplayName(config.subclass);
    var raceLabel = raceDisplayName(config.race);

    // Banner
    var banner = loadImage(charId, 'banner');
    var portrait = loadImage(charId, 'portrait');

    var html = '<div class="character-page" data-char-id="' + charId + '" style="--char-accent:' + (config.accentColor || 'var(--accent)') + '">';

    // Banner section
    html += '<div class="char-banner">';
    if (banner) {
        html += '<img src="' + banner + '" alt="">';
    } else {
        html += '<div class="banner-placeholder">Banner</div>';
    }
    if (editable) {
        html += '<label class="image-upload-overlay" title="' + t('banner.upload') + '"><span class="upload-icon">&#128247;</span><input type="file" accept="image/*" data-action="upload-banner" style="display:none"></label>';
    }
    html += '</div>';

    // Portrait overlapping banner
    html += '<div class="char-portrait-wrap">';

    html += '<div class="char-portrait">';
    if (portrait) {
        html += '<img src="' + portrait + '" alt="">';
    } else {
        html += '<span class="portrait-placeholder">&#128100;</span>';
    }
    if (editable) {
        html += '<label class="image-upload-overlay" title="' + t('portrait.upload') + '"><span class="upload-icon">&#128247;</span><input type="file" accept="image/*" data-action="upload-portrait" style="display:none"></label>';
    }
    html += '</div>';
    html += '</div>';

    // Header
    html += '<div class="char-header">';
    html += '<div class="header-info">';
    html += '<h1 class="char-name-wrap">';
    html += '<span class="char-name-display">' + escapeHtml(config.name) + '</span>';
    if (editable) {
        html += '<button class="edit-trigger" data-action="edit-name" title="' + t('char.editname') + '">&#9998;</button>';
        var colorOptions = ['#22d3ee','#f472b6','#4ade80','#818cf8','#fbbf24','#34d399','#f87171','#a78bfa','#fb923c','#e879f9','#38bdf8','#facc15'];
        html += '<span class="color-picker-wrap">';
        html += '<span class="color-dot" data-action="pick-color" style="background:' + config.accentColor + ';" title="' + t('char.pickcolor') + '"></span>';
        html += '<div class="color-picker-popup" style="display:none;">';
        for (var ci = 0; ci < colorOptions.length; ci++) {
            var selClass = colorOptions[ci] === config.accentColor ? ' selected' : '';
            html += '<span class="color-option' + selClass + '" data-action="select-color" data-color="' + colorOptions[ci] + '" style="background:' + colorOptions[ci] + ';"></span>';
        }
        html += '</div></span>';
    }
    html += '</h1>';
    html += '<p class="char-title">';
    html += '<span class="info-item" data-tip="' + escapeAttr(raceLabel) + '"><span class="value">' + raceLabel + '</span></span>';
    html += ' &mdash; ';
    html += '<span class="info-item" data-tip="' + escapeAttr(classLabel) + '"><span class="value">' + classLabel + '</span></span>';
    if (isSubclassVisible(config, state)) {
        html += ' &mdash; ';
        html += '<span class="info-item" data-tip="' + escapeAttr(subLabel) + '"><span class="value">' + subLabel + '</span></span>';
    }
    html += '</p>';

    // Level control
    if (editable) {
        html += '<div class="level-control">';
        html += '<button class="level-btn" data-action="level-down"' + (state.level <= 1 ? ' disabled' : '') + '>&minus;</button>';
        html += '<span class="level-display">Level ' + state.level + '</span>';
        html += '<button class="level-btn" data-action="level-up"' + (state.level >= 20 ? ' disabled' : '') + '>&plus;</button>';
        html += '</div>';
    } else {
        html += '<div class="level-control"><span class="level-display">Level ' + state.level + '</span></div>';
    }

    // XP tracker
    var xpThresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
    var currentXP = state.xp || 0;
    var xpForCurrent = xpThresholds[state.level - 1] || 0;
    var xpForNext = xpThresholds[state.level] || xpThresholds[19];
    var xpProgress = state.level >= 20 ? 100 : Math.min(100, Math.round((currentXP - xpForCurrent) / (xpForNext - xpForCurrent) * 100));
    html += '<div class="xp-tracker">';
    html += '<div class="xp-bar"><div class="xp-bar-fill" style="width:' + xpProgress + '%"></div></div>';
    html += '<span class="xp-label">' + currentXP.toLocaleString() + ' / ' + (state.level >= 20 ? 'MAX' : xpForNext.toLocaleString()) + ' XP</span>';
    if (editable) {
        html += '<div class="xp-controls">';
        html += '<button class="btn btn-ghost btn-sm xp-btn-minus" data-action="remove-xp">&minus;XP</button>';
        html += '<input type="number" class="xp-input" id="xp-add-input" value="100" min="1" style="width:70px;">';
        html += '<button class="btn btn-ghost btn-sm xp-btn-plus" data-action="add-xp">+XP</button>';
        html += '</div>';
    }
    html += '</div>';

    html += '</div>';

    // Header actions (inside char-header for absolute positioning)
    if (editable) {
        html += '<div class="header-actions" id="options-dropdown">';
        html += '<button class="options-toggle" data-action="toggle-options">&#9881;</button>';
        html += '<div class="options-menu">';
        html += '<button class="header-btn" data-action="export-char">&#128190; ' + t('char.save') + '</button>';
        html += '<label class="header-btn">&#128194; ' + t('char.load') + '<input type="file" accept=".json" data-action="import-char" style="display:none"></label>';
        html += '<button class="header-btn header-btn-danger" data-action="reset-char">&#128260; ' + t('char.reset') + '</button>';
        html += '</div>';
        html += '</div>';
    }

    html += '</div>';

    // Quote
    var quotes = config.quotes || [];
    if (quotes.length > 0) {
        var quoteText = quotes[Math.floor(Math.random() * quotes.length)];
        html += '<div class="header-quote-row">';
        html += '<p class="char-quote-dynamic">&ldquo;' + escapeHtml(quoteText) + '&rdquo;</p>';
        html += '<button class="quote-refresh-btn" data-action="refresh-quote" title="' + t('char.refreshquote') + '">&#8635;</button>';
        html += '</div>';
    }

    // Tab bar
    var tabs = [
        { id: 'overview', label: t('tab.overview') },
        { id: 'stats', label: t('tab.stats') },
        { id: 'combat', label: t('tab.combat') }
    ];
    if (hasSpellcasting(config.className)) {
        tabs.push({ id: 'spells', label: t('tab.spells') });
    }
    tabs.push({ id: 'story', label: t('tab.story') });
    tabs.push({ id: 'inventory', label: t('tab.inventory') });

    html += '<div class="tab-bar">';
    for (var ti = 0; ti < tabs.length; ti++) {
        html += '<button class="tab-btn' + (activeTab === tabs[ti].id ? ' active' : '') + '" data-tab="' + tabs[ti].id + '">' + tabs[ti].label + '</button>';
    }
    html += '</div>';

    // Tab content
    html += '<div class="tab-content">';

    if (activeTab === 'overview') {
        html += renderTabOverview(charId, config, state);
    } else if (activeTab === 'stats') {
        html += renderTabStats(charId, config, state);
    } else if (activeTab === 'combat') {
        html += renderTabCombat(charId, config, state);
    } else if (activeTab === 'spells') {
        html += renderTabSpells(charId, config, state);
    } else if (activeTab === 'story') {
        html += renderTabStory(charId, config, state);
    } else if (activeTab === 'inventory') {
        html += renderTabInventory(charId, config, state);
    }

    html += '</div>';
    html += '</div>';
    return html;
}

// ============================================================
// Section 14: Tab — Overview
// ============================================================

function renderTabOverview(charId, config, state) {
    var html = '<div class="sheet-grid">';

    // Quick stats row
    var hp = getHP(config, state);
    var ac = getAC(config, state);
    var profBonus = getProfBonus(state.level);
    var dexMod = getMod(getAbilityScore(config, state, 'dex'));

    html += '<div class="combat-stats">';
    html += '<div class="combat-stat"><span class="stat-value">' + hp + '</span><span class="stat-label">HP</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">' + ac + '</span><span class="stat-label">AC</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">' + formatMod(dexMod) + '</span><span class="stat-label">Initiative</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">+' + profBonus + '</span><span class="stat-label">Prof. Bonus</span></div>';
    html += '</div>';

    // Info grid
    var editable = canEdit(charId);
    html += '<div class="info-grid">';

    // Race
    html += '<div class="info-item" data-tip="' + escapeAttr(raceDisplayName(config.race)) + '">';
    html += '<span class="label">' + t('overview.race') + '</span>';
    html += '<span class="value info-value-display" data-info-field="race">' + raceDisplayName(config.race) + '</span>';
    if (editable) html += '<button class="info-edit-btn" data-action="edit-info" data-info-field="race" title="' + t('generic.edit') + '">&#9998;</button>';
    html += '</div>';

    // Class
    html += '<div class="info-item" data-tip="' + escapeAttr(classDisplayName(config.className)) + '">';
    html += '<span class="label">' + t('overview.class') + '</span>';
    html += '<span class="value info-value-display" data-info-field="className">' + classDisplayName(config.className) + '</span>';
    if (editable) html += '<button class="info-edit-btn" data-action="edit-info" data-info-field="className" title="' + t('generic.edit') + '">&#9998;</button>';
    html += '</div>';

    // Subclass
    if (isSubclassVisible(config, state) || editable) {
        html += '<div class="info-item" data-tip="' + escapeAttr(subclassDisplayName(config.subclass)) + '">';
        html += '<span class="label">' + t('overview.subclass') + '</span>';
        html += '<span class="value info-value-display" data-info-field="subclass">' + (config.subclass ? subclassDisplayName(config.subclass) : '-') + '</span>';
        if (editable) html += '<button class="info-edit-btn" data-action="edit-info" data-info-field="subclass" title="' + t('generic.edit') + '">&#9998;</button>';
        html += '</div>';
    }

    // Background
    html += '<div class="info-item" data-tip="' + escapeAttr(config.background || '') + '">';
    html += '<span class="label">' + t('overview.background') + '</span>';
    html += '<span class="value info-value-display" data-info-field="background">' + escapeHtml(config.background || '-') + '</span>';
    if (editable) html += '<button class="info-edit-btn" data-action="edit-info" data-info-field="background" title="' + t('generic.edit') + '">&#9998;</button>';
    html += '</div>';

    // Alignment
    html += '<div class="info-item" data-tip="' + escapeAttr(config.alignment || '') + '">';
    html += '<span class="label">' + t('overview.alignment') + '</span>';
    html += '<span class="value info-value-display" data-info-field="alignment">' + escapeHtml(config.alignment || '-') + '</span>';
    if (editable) html += '<button class="info-edit-btn" data-action="edit-info" data-info-field="alignment" title="' + t('generic.edit') + '">&#9998;</button>';
    html += '</div>';

    // Age
    html += '<div class="info-item">';
    html += '<span class="label">' + t('overview.age') + '</span>';
    html += '<span class="value info-value-display" data-info-field="age">' + (config.age || '-') + '</span>';
    if (editable) html += '<button class="info-edit-btn" data-action="edit-info" data-info-field="age" title="' + t('generic.edit') + '">&#9998;</button>';
    html += '</div>';

    html += '</div>';

    // Appearance
    var appearanceArr = config.appearance || [];
    var hasAppearance = appearanceArr.some(function(a) { return !!a; });
    if (hasAppearance || editable) {
        html += '<div class="sheet-block appearance-mini">';
        html += '<h2>' + t('overview.appearance') + '</h2>';
        var appearImg = loadImage(charId, 'appearance');
        if (appearImg) {
            html += '<img class="appearance-img" src="' + appearImg + '" alt="">';
        }
        if (editable) {
            for (var ai = 0; ai < appearanceArr.length; ai++) {
                html += '<div class="editable-field" data-edit-field="appearance' + ai + '" data-char-id="' + charId + '">';
                html += '<p class="field-display">' + escapeHtml(appearanceArr[ai] || '') + (!appearanceArr[ai] ? '<em class="placeholder-text">' + t('overview.appearance.add') + '</em>' : '') + '</p>';
                html += '<button class="edit-trigger" data-action="edit-field" data-field="appearance' + ai + '" title="' + t('generic.edit') + '">&#9998;</button>';
                html += '<button class="btn-inline-delete" data-action="remove-appearance" data-appear-idx="' + ai + '" title="Remove">&times;</button>';
                html += '</div>';
            }
            if (appearanceArr.length === 0) {
                html += '<div class="editable-field" data-edit-field="appearance0" data-char-id="' + charId + '">';
                html += '<p class="field-display"><em class="placeholder-text">' + t('overview.appearance.add') + '</em></p>';
                html += '<button class="edit-trigger" data-action="edit-field" data-field="appearance0" title="' + t('generic.edit') + '">&#9998;</button>';
                html += '</div>';
            }
            html += '<button class="btn btn-ghost btn-sm" data-action="add-appearance" style="margin-top:0.3rem;">+ Add description</button>';
        } else {
            for (var ai2 = 0; ai2 < appearanceArr.length; ai2++) {
                if (appearanceArr[ai2]) html += '<p>' + escapeHtml(appearanceArr[ai2]) + '</p>';
            }
        }
        if (editable) {
            html += '<label class="btn btn-ghost btn-sm appearance-upload-btn">&#128247; ' + t('overview.appearance.image') + '<input type="file" accept="image/*" data-action="upload-appearance" style="display:none"></label>';
        }
        html += '</div>';
    }

    // Features summary
    html += renderFeaturesSummary(config, state);

    html += '</div>';
    return html;
}

function renderFeaturesSummary(config, state) {
    var classData = DATA[config.className];
    if (!classData) return '';

    var html = '<div class="sheet-block features-summary">';
    html += '<h2>' + t('overview.classfeatures') + '</h2>';

    // Class features category
    html += '<div class="features-category">';
    html += '<h3>' + t('overview.classfeatures') + '</h3>';
    for (var lvl = 1; lvl <= state.level; lvl++) {
        var features = classData.features ? (classData.features[lvl] || []) : [];
        for (var f = 0; f < features.length; f++) {
            var feat = features[f];
            var isNew = (lvl === state.level);
            html += '<div class="feature-card' + (isNew ? ' new-feature' : '') + '">';
            html += '<h4>' + escapeHtml(feat.name) + (lvl > 1 ? ' <span class="feature-level">(Level ' + lvl + ')</span>' : '') + '</h4>';
            html += '<p>' + escapeHtml(feat.desc) + '</p>';
            html += '</div>';
        }
    }
    // Subclass features inside class category
    if (isSubclassVisible(config, state)) {
        var subData = classData.subclasses && classData.subclasses[config.subclass];
        if (subData) {
            html += '<h4 style="margin-top:0.75rem; color:var(--text-dim); font-size:0.85rem;">' + t('overview.subclassfeatures') + '</h4>';
            for (var lvl2 = 1; lvl2 <= state.level; lvl2++) {
                var subFeatures = subData.features ? (subData.features[lvl2] || []) : [];
                for (var sf = 0; sf < subFeatures.length; sf++) {
                    var sfeat = subFeatures[sf];
                    var isNew2 = (lvl2 === state.level);
                    html += '<div class="feature-card' + (isNew2 ? ' new-feature' : '') + '">';
                    html += '<h4>' + escapeHtml(sfeat.name) + ' <span class="feature-level">(Level ' + lvl2 + ')</span></h4>';
                    html += '<p>' + escapeHtml(sfeat.desc) + '</p>';
                    html += '</div>';
                }
            }
        }
    }
    html += '</div>';

    // Racial traits category
    var raceKey = config.race;
    var raceData = DATA[raceKey];
    if (raceData && raceData.features) {
        html += '<div class="features-category">';
        html += '<h3>' + t('overview.racialtraits') + ' (' + raceDisplayName(config.race) + ')</h3>';
        for (var rf = 0; rf < raceData.features.length; rf++) {
            var rfeat = raceData.features[rf];
            html += '<div class="feature-card">';
            html += '<h4>' + escapeHtml(rfeat.name) + '</h4>';
            html += '<p>' + escapeHtml(rfeat.desc) + '</p>';
            html += '</div>';
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

// ============================================================
// Section 15: Tab — Stats
// ============================================================

function renderAbilityRadar(config, state) {
    var abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    var labels = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];
    var cx = 90, cy = 90, r = 70;
    var maxVal = 20;

    function polarToXY(angle, radius) {
        var rad = (angle - 90) * Math.PI / 180;
        return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
    }

    var svg = '<svg class="ability-radar" viewBox="0 0 180 180" width="180" height="180">';

    // Grid rings
    for (var ring = 1; ring <= 4; ring++) {
        var ringR = r * ring / 4;
        var ringPts = [];
        for (var i = 0; i < 6; i++) {
            var p = polarToXY(i * 60, ringR);
            ringPts.push(p.x + ',' + p.y);
        }
        svg += '<polygon points="' + ringPts.join(' ') + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>';
    }

    // Axis lines
    for (var i = 0; i < 6; i++) {
        var p = polarToXY(i * 60, r);
        svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + p.x + '" y2="' + p.y + '" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>';
    }

    // Data polygon
    var dataPts = [];
    for (var i = 0; i < 6; i++) {
        var score = getAbilityScore(config, state, abilities[i]);
        var dataR = Math.min(score / maxVal, 1) * r;
        var p = polarToXY(i * 60, dataR);
        dataPts.push(p.x + ',' + p.y);
    }
    svg += '<polygon points="' + dataPts.join(' ') + '" fill="rgba(var(--accent-rgb, 34,211,238), 0.2)" stroke="var(--char-accent, var(--accent))" stroke-width="2"/>';

    // Labels + values
    for (var i = 0; i < 6; i++) {
        var score = getAbilityScore(config, state, abilities[i]);
        var lp = polarToXY(i * 60, r + 16);
        svg += '<text x="' + lp.x + '" y="' + lp.y + '" text-anchor="middle" dominant-baseline="middle" fill="var(--text-dim)" font-size="9" font-weight="600">' + labels[i] + '</text>';
        var vp = polarToXY(i * 60, r + 28);
        svg += '<text x="' + vp.x + '" y="' + vp.y + '" text-anchor="middle" dominant-baseline="middle" fill="var(--accent)" font-size="10" font-weight="700">' + score + '</text>';
    }

    svg += '</svg>';
    return '<div class="radar-container">' + svg + '</div>';
}

function renderTabStats(charId, config, state) {
    var html = '<div class="sheet-grid">';

    // Ability Score Radar Chart
    html += '<div class="sheet-block radar-block">';
    html += '<h2>' + t('stats.abilityscores') + '</h2>';
    html += renderAbilityRadar(config, state);
    html += renderAbilityScoresHTML(charId, config, state);
    html += '</div>';

    // Saving Throws
    html += '<div class="sheet-block">';
    html += '<h2>' + t('stats.savingthrows') + '</h2>';
    html += renderSavingThrowsHTML(config, state);
    html += '</div>';

    // Skills
    html += '<div class="sheet-block">';
    html += '<h2>' + t('stats.skills') + '</h2>';
    html += renderSkillsHTML(config, state);
    html += '</div>';

    // ASI
    html += '<div class="sheet-block" id="asi-content">';
    html += '<h2>' + t('stats.asi') + '</h2>';
    html += renderASIHTML(charId, config, state);
    html += '</div>';

    html += '</div>';
    return html;
}

function renderAbilityScoresHTML(charId, config, state) {
    var abilities = getAllAbilityScores(config, state);
    var classData = DATA[config.className];
    // Determine primary ability
    var primaryAbility = 'str';
    if (config.className === 'rogue' || config.className === 'ranger') primaryAbility = 'dex';
    else if (config.className === 'sorcerer' || config.className === 'warlock' || config.className === 'paladin') primaryAbility = 'cha';
    else if (config.className === 'wizard') primaryAbility = 'int';
    else if (config.className === 'druid') primaryAbility = 'wis';
    else if (config.className === 'fighter') primaryAbility = 'str';

    var abNames = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };
    var editable = canEdit(charId);
    var html = '';

    if (abilityEditMode && editable) {
        if (!editAbilities) {
            editAbilities = {};
            var abs = Object.keys(abNames);
            for (var i = 0; i < abs.length; i++) {
                editAbilities[abs[i]] = abilities[abs[i]];
            }
        }
        html += '<div class="ability-scores edit-mode-active">';
        var keys = Object.keys(abNames);
        for (var k = 0; k < keys.length; k++) {
            var key = keys[k];
            var label = abNames[key];
            var score = editAbilities[key];
            var mod = getMod(score);
            var highlight = key === primaryAbility ? ' ability-primary' : '';
            html += '<div class="ability edit-mode' + highlight + '">';
            html += '<span class="ability-name">' + label + '</span>';
            html += '<button class="ability-adj" data-ab="' + key + '" data-dir="up">&#9650;</button>';
            html += '<span class="ability-score">' + score + '</span>';
            html += '<button class="ability-adj" data-ab="' + key + '" data-dir="down">&#9660;</button>';
            html += '<span class="ability-mod">' + formatMod(mod) + '</span>';
            html += '</div>';
        }
        html += '</div>';
        html += '<div class="ability-edit-actions">';
        html += '<button class="ability-edit-btn" data-action="ability-save">' + t('generic.save') + '</button>';
        html += '<button class="ability-edit-btn ability-edit-cancel" data-action="ability-cancel">' + t('generic.cancel') + '</button>';
        html += '</div>';
    } else {
        if (editable) {
            html += '<div class="ability-edit-header"><button class="edit-toggle-btn" data-action="ability-edit" title="' + t('stats.edit') + '">&#9998;</button></div>';
        }
        html += '<div class="ability-scores">';
        var keys2 = Object.keys(abNames);
        for (var k2 = 0; k2 < keys2.length; k2++) {
            var key2 = keys2[k2];
            var label2 = abNames[key2];
            var score2 = abilities[key2];
            var mod2 = getMod(score2);
            var highlight2 = key2 === primaryAbility ? ' ability-primary' : '';
            html += '<div class="ability' + highlight2 + '" data-ability="' + key2 + '">';
            html += '<span class="ability-name">' + label2 + '</span>';
            html += '<span class="ability-score">' + score2 + '</span>';
            html += '<span class="ability-mod">' + formatMod(mod2) + '</span>';
            html += '</div>';
        }
        html += '</div>';
    }

    return html;
}

function renderSavingThrowsHTML(config, state) {
    var classData = DATA[config.className];
    var profSaves = classData ? classData.savingThrows : [];
    var profBonus = getProfBonus(state.level);
    var abNames = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

    var html = '<div class="saves-list">';
    var keys = Object.keys(abNames);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var label = abNames[key];
        var mod = getMod(getAbilityScore(config, state, key));
        var isProf = profSaves.indexOf(key) !== -1;
        var total = isProf ? mod + profBonus : mod;
        html += '<div class="save' + (isProf ? ' prof' : '') + '"><span>' + label + '</span><span>' + formatMod(total) + '</span></div>';
    }
    html += '</div>';
    return html;
}

function renderSkillsHTML(config, state) {
    var profBonus = getProfBonus(state.level);
    var abilities = getAllAbilityScores(config, state);

    var html = '<div class="skills-list">';
    var skills = DATA.skills || [];
    for (var i = 0; i < skills.length; i++) {
        var skill = skills[i];
        var abilityMod = getMod(abilities[skill.ability]);
        var skillNameLower = skill.name.toLowerCase();
        var isExpertise = state.expertise.indexOf(skillNameLower) !== -1;
        var isProf = state.skills.indexOf(skillNameLower) !== -1;

        var total = abilityMod;
        var cssClass = 'skill';
        if (isExpertise) {
            total += profBonus * 2;
            cssClass += ' expertise';
        } else if (isProf) {
            total += profBonus;
            cssClass += ' prof';
        }

        html += '<div class="' + cssClass + '"><span>' + escapeHtml(skill.name) + ' <span class="skill-ability">(' + skill.ability.toUpperCase() + ')</span></span><span>' + formatMod(total) + '</span></div>';
    }
    html += '</div>';

    if (state.expertise && state.expertise.length > 0) {
        html += '<p class="block-note" style="margin-top:0.75rem;">&#9733; = ' + t('stats.expertise') + '</p>';
    }

    return html;
}

function renderASIHTML(charId, config, state) {
    var classData = DATA[config.className];
    var asiLevels = classData ? classData.asiLevels : [4, 8, 12, 16, 19];
    if (!asiLevels) asiLevels = [4, 8, 12, 16, 19];

    var relevantLevels = [];
    for (var i = 0; i < asiLevels.length; i++) {
        if (asiLevels[i] <= state.level) relevantLevels.push(asiLevels[i]);
    }

    if (relevantLevels.length === 0) {
        return '<p class="block-note">' + t('stats.asi.available') + ' ' + asiLevels[0] + '.</p>';
    }

    var html = '';
    for (var r = 0; r < relevantLevels.length; r++) {
        var lvl = relevantLevels[r];
        var choice = state.asiChoices[lvl];
        html += '<div class="asi-panel" data-asi-level="' + lvl + '">';
        html += '<h4>Level ' + lvl + ' \u2014 ' + t('stats.asi') + '</h4>';

        if (!choice) {
            html += '<div class="asi-options">';
            html += '<button class="asi-option" data-asi-level="' + lvl + '" data-asi-type="asi-two">' + t('stats.asi.plus2') + '</button>';
            html += '<button class="asi-option" data-asi-level="' + lvl + '" data-asi-type="asi-split">' + t('stats.asi.split') + '</button>';
            html += '<button class="asi-option" data-asi-level="' + lvl + '" data-asi-type="feat">' + t('stats.asi.feat') + '</button>';
            html += '</div>';
        } else if (choice.type === 'asi') {
            var parts = [];
            var abKeys = Object.keys(choice.abilities || {});
            for (var a = 0; a < abKeys.length; a++) {
                if (choice.abilities[abKeys[a]] > 0) {
                    parts.push(abKeys[a].toUpperCase() + ' +' + choice.abilities[abKeys[a]]);
                }
            }
            html += '<p class="asi-chosen">' + t('stats.asi.chosen') + ': ' + parts.join(', ') + '</p>';
            if (canEdit(charId)) {
                html += '<button class="asi-option asi-reset" data-asi-level="' + lvl + '" data-asi-type="reset">' + t('stats.asi.rechoose') + '</button>';
            }
        } else if (choice.type === 'feat') {
            html += '<p class="asi-chosen">Feat: <strong>' + escapeHtml(choice.feat) + '</strong></p>';
            if (canEdit(charId)) {
                html += '<button class="asi-option asi-reset" data-asi-level="' + lvl + '" data-asi-type="reset">' + t('stats.asi.rechoose') + '</button>';
            }
        }
        html += '</div>';
    }
    return html;
}

// ============================================================
// Section 16: Tab — Combat
// ============================================================

function renderTabCombat(charId, config, state) {
    var html = '<div class="tab-combat">';
    var maxHP = getHP(config, state);
    var currentHP = (state.currentHP === null || state.currentHP === undefined) ? maxHP : state.currentHP;
    var tempHP = state.tempHP || 0;
    var ac = getAC(config, state);
    var dexMod = getMod(getAbilityScore(config, state, 'dex'));
    var profBonus = getProfBonus(state.level);
    var classData = DATA[config.className];
    var hitDieNum = classData ? classData.hitDie : (config.className === 'rogue' ? 8 : 6);
    var hitDie = 'd' + hitDieNum;
    var speed = '30ft';
    var raceData = DATA[config.race];
    if (raceData && raceData.speed) speed = raceData.speed + 'ft';
    var editable = canEdit(charId);

    // === HP Tracker ===
    var hpPct = maxHP > 0 ? Math.max(0, Math.min(100, Math.round((currentHP / maxHP) * 100))) : 0;
    var hpColor = hpPct > 50 ? 'var(--success)' : (hpPct > 25 ? 'var(--warning)' : 'var(--danger)');
    html += '<div class="hp-tracker">';
    html += '<div class="hp-display">';
    html += '<span class="hp-current" style="color:' + hpColor + '">' + currentHP + '</span>';
    html += '<span class="hp-separator">/</span>';
    html += '<span class="hp-max">' + maxHP + '</span>';
    if (tempHP > 0) {
        html += '<span class="hp-temp">+' + tempHP + ' temp</span>';
    }
    html += '</div>';
    html += '<div class="hp-bar"><div class="hp-bar-fill" style="width:' + hpPct + '%;background:' + hpColor + '"></div></div>';
    if (editable) {
        html += '<div class="hp-controls">';
        html += '<input type="number" class="hp-input" id="damage-input" min="0" placeholder="0">';
        html += '<button class="hp-btn hp-btn-damage" data-action="take-damage">' + t('combat.damage') + '</button>';
        html += '<input type="number" class="hp-input" id="heal-input" min="0" placeholder="0">';
        html += '<button class="hp-btn hp-btn-heal" data-action="heal">' + t('combat.heal') + '</button>';
        html += '<input type="number" class="hp-input" id="temp-hp-input" min="0" placeholder="0" value="' + tempHP + '">';
        html += '<button class="hp-btn hp-btn-temp" data-action="set-temp-hp">' + t('combat.temphp') + '</button>';
        html += '</div>';
    }
    html += '</div>';

    // === Combat Log ===
    var combatLog = state.combatLog || [];
    if (combatLog.length > 0) {
        html += '<details class="combat-log-section"><summary class="text-dim" style="cursor:pointer;font-size:0.8rem;margin-top:0.5rem;">Combat Log (' + combatLog.length + ')</summary>';
        html += '<div class="combat-log">';
        for (var cli = 0; cli < Math.min(combatLog.length, 10); cli++) {
            var logE = combatLog[cli];
            var logIcon = logE.type === 'damage' ? '&#128308;' : logE.type === 'heal' ? '&#128994;' : '&#128564;';
            var logText = logE.type === 'damage' ? '-' + logE.amount + ' damage' : logE.type === 'heal' ? '+' + logE.amount + ' healed' : logE.source || 'Rest';
            if (logE.source && logE.type !== 'rest') logText += ' (' + logE.source + ')';
            var logTime = logE.time ? new Date(logE.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
            html += '<div class="combat-log-entry combat-log-' + logE.type + '">' + logIcon + ' ' + logText + '<span class="combat-log-time">' + logTime + '</span>';
            if (editable) html += '<button class="btn-inline-delete" data-action="delete-combat-log" data-log-idx="' + cli + '" title="Remove">&times;</button>';
            html += '</div>';
        }
        if (editable) html += '<button class="btn btn-ghost btn-sm" data-action="clear-combat-log" style="margin-top:0.3rem;font-size:0.75rem;">Clear log</button>';
        html += '</div></details>';
    }

    // === Death Saves (only when HP <= 0) ===
    if (currentHP <= 0) {
        var ds = state.deathSaves || { successes: 0, failures: 0 };
        html += '<div class="death-saves">';
        html += '<div class="death-save-group"><label>' + t('combat.successes') + '</label><div class="death-save-dots">';
        for (var si = 0; si < 3; si++) {
            var sFilled = si < ds.successes ? ' filled' : '';
            html += '<div class="death-save-dot success' + sFilled + '" data-action="toggle-death-save" data-save-type="successes" data-save-idx="' + si + '"></div>';
        }
        html += '</div></div>';
        html += '<div class="death-save-group"><label>' + t('combat.failures') + '</label><div class="death-save-dots">';
        for (var fi = 0; fi < 3; fi++) {
            var fFilled = fi < ds.failures ? ' filled' : '';
            html += '<div class="death-save-dot failure' + fFilled + '" data-action="toggle-death-save" data-save-type="failures" data-save-idx="' + fi + '"></div>';
        }
        html += '</div></div>';
        if (editable) {
            html += '<button class="hp-btn" data-action="reset-death-saves" style="margin-left:auto;">' + t('combat.deathsaves.reset') + '</button>';
        }
        html += '</div>';
    }

    // === Inspiration ===
    html += '<div class="inspiration-toggle" ' + (editable ? 'data-action="toggle-inspiration"' : '') + '>';
    html += '<span class="inspiration-star' + (state.inspiration ? ' active' : '') + '">&#9733;</span>';
    html += '<span style="font-size:0.9rem;color:var(--text-dim)">' + t('combat.inspiration') + '</span>';
    html += '</div>';

    // === Core Stats Grid ===
    html += '<div class="combat-stats">';
    html += '<div class="combat-stat"><span class="stat-value">' + ac + '</span><span class="stat-label">AC</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">' + speed + '</span><span class="stat-label">' + t('combat.speed') + '</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">' + formatMod(dexMod) + '</span><span class="stat-label">Initiative</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">+' + profBonus + '</span><span class="stat-label">Prof.</span></div>';
    var hitDiceRemaining = state.level - (state.hitDiceUsed || 0);
    html += '<div class="combat-stat"><span class="stat-value">' + hitDiceRemaining + hitDie + '</span><span class="stat-label">Hit Dice</span></div>';
    html += '</div>';

    // === Weapons ===
    html += '<div class="sheet-block">';
    html += '<h2>' + t('combat.weapons') + '</h2>';
    if (config.weapons && config.weapons.length > 0) {
        html += renderWeaponsHTML(config, state, editable, charId);
    }
    if (editable) {
        html += '<button class="btn btn-ghost btn-sm" data-action="add-weapon" style="margin-top:0.5rem;">+ Add Weapon</button>';
        html += '<div class="weapon-add-form" style="display:none;">';
        html += '<input type="text" class="edit-input weapon-name-input" placeholder="Weapon name">';
        html += '<input type="text" class="edit-input weapon-dmg-input" placeholder="Damage (e.g. 1d8)" style="width:80px;">';
        html += '<select class="edit-input weapon-type-input">';
        html += '<option value="slashing">Slashing</option><option value="piercing">Piercing</option><option value="bludgeoning">Bludgeoning</option>';
        html += '</select>';
        html += '<label class="weapon-finesse-label"><input type="checkbox" class="weapon-finesse-input"> Finesse</label>';
        html += '<div class="edit-actions">';
        html += '<button class="edit-save" data-action="confirm-weapon">&#10003;</button>';
        html += '<button class="edit-cancel" data-action="cancel-weapon">&#10005;</button>';
        html += '</div></div>';
    }
    html += '</div>';

    // === Sneak Attack for rogues ===
    if (config.className === 'rogue') {
        var sneakAttack = (DATA.rogue && DATA.rogue.sneakAttack) ? DATA.rogue.sneakAttack[state.level] || '1d6' : '1d6';
        html += '<div class="sheet-block">';
        html += '<p class="block-note">' + t('combat.sneakattack') + ': ' + sneakAttack + ' ' + t('combat.sneakattack.desc') + '</p>';
        html += '</div>';
    }

    // === Metamagic for sorcerer ===
    if (config.className === 'sorcerer') {
        html += '<div class="sheet-block">';
        html += '<h2>' + t('combat.metamagic') + '</h2>';
        html += renderMetamagicHTML(charId, config, state);
        html += '</div>';
    }

    // === Spell Slot Tracker (for casters) ===
    if (hasSpellcasting(config.className)) {
        html += '<div class="sheet-block">';
        html += '<h2>' + t('combat.spellslots') + '</h2>';
        html += '<div class="slot-tracker">';
        var slotsUsed = state.spellSlotsUsed || {};

        if (config.className === 'warlock') {
            var warlockData = DATA.warlock;
            var pactNum = warlockData ? (warlockData.pactSlots[state.level] || 1) : 1;
            var pactLvl = warlockData ? (warlockData.pactSlotLevel[state.level] || 1) : 1;
            var pactUsed = slotsUsed['pact'] || 0;
            html += '<div class="slot-level">';
            html += '<span class="slot-level-label">Pact (Lvl ' + pactLvl + ')</span>';
            html += '<div class="slot-dots">';
            for (var pi = 0; pi < pactNum; pi++) {
                var pUsed = pi < pactUsed ? ' used' : '';
                html += '<div class="slot-dot' + pUsed + '" data-action="toggle-spell-slot" data-slot-level="pact" data-slot-idx="' + pi + '"></div>';
            }
            html += '</div></div>';
        } else {
            var slotTable = null;
            if (classData && classData.spellSlots) {
                slotTable = classData.spellSlots[state.level] || null;
            } else if (classData && classData.spellcasting === 'half') {
                slotTable = DATA.halfCasterSlots[state.level] || null;
            }
            if (slotTable) {
                for (var sl = 0; sl < slotTable.length; sl++) {
                    var totalSlots = slotTable[sl];
                    if (totalSlots <= 0) continue;
                    var lvlUsed = slotsUsed[sl + 1] || 0;
                    html += '<div class="slot-level">';
                    html += '<span class="slot-level-label">Level ' + (sl + 1) + '</span>';
                    html += '<div class="slot-dots">';
                    for (var sd = 0; sd < totalSlots; sd++) {
                        var sdUsed = sd < lvlUsed ? ' used' : '';
                        html += '<div class="slot-dot' + sdUsed + '" data-action="toggle-spell-slot" data-slot-level="' + (sl + 1) + '" data-slot-idx="' + sd + '"></div>';
                    }
                    html += '</div></div>';
                }
            }
        }
        html += '</div>';

        if (editable) {
            html += '<div class="rest-buttons">';
            html += '<button class="rest-btn" data-action="short-rest">' + t('combat.shortrest') + '</button>';
            html += '<button class="rest-btn" data-action="long-rest">' + t('combat.longrest') + '</button>';
            html += '</div>';
        }
        html += '</div>';

        // === Prepared Spells Quick Reference ===
        var preparedSpells = state.prepared || [];
        if (preparedSpells.length > 0) {
            html += '<div class="sheet-block">';
            html += '<h2>' + (t('combat.preparedspells') || 'Prepared Spells') + '</h2>';
            html += '<div class="prepared-spells-compact">';
            for (var psi = 0; psi < preparedSpells.length; psi++) {
                html += '<span class="prepared-spell-tag" data-spell="' + escapeAttr(preparedSpells[psi]) + '">' + escapeHtml(preparedSpells[psi]) + '</span>';
            }
            html += '</div></div>';
        }
    } else if (editable) {
        html += '<div class="rest-buttons">';
        html += '<button class="btn btn-ghost btn-sm" data-action="short-rest">' + t('combat.shortrest') + '</button>';
        html += '<button class="btn btn-ghost btn-sm" data-action="long-rest">' + t('combat.longrest') + '</button>';
        html += '</div>';
    }

    // === Conditions ===
    // === Concentration Tracking ===
    if (hasSpellcasting(config.className)) {
        var concentrating = state.concentrating || null;
        html += '<div class="sheet-block concentration-block">';
        html += '<h2>Concentration</h2>';
        if (concentrating) {
            html += '<div class="concentration-active">';
            html += '<span class="concentration-spell">' + escapeHtml(concentrating) + '</span>';
            if (editable) {
                html += '<button class="btn btn-ghost btn-sm" data-action="drop-concentration" style="color:var(--danger);">Drop</button>';
            }
            html += '</div>';
        } else {
            html += '<p class="text-dim" style="font-size:0.85rem;">No active concentration</p>';
        }
        if (editable) {
            var prepSpells = state.prepared || [];
            var concSpells = prepSpells.filter(function(s) { return s; }); // all prepared as options
            if (concSpells.length > 0) {
                html += '<select class="edit-input" data-action="set-concentration" style="margin-top:0.5rem;">';
                html += '<option value="">Set concentration...</option>';
                for (var csi = 0; csi < concSpells.length; csi++) {
                    html += '<option value="' + escapeAttr(concSpells[csi]) + '">' + escapeHtml(concSpells[csi]) + '</option>';
                }
                html += '</select>';
            }
        }
        html += '</div>';
    }

    var CONDITION_DESC = {
        'Blinded': 'Auto-fail sight checks. Attack rolls have disadvantage. Attacks against you have advantage.',
        'Charmed': "Can't attack the charmer. Charmer has advantage on social checks against you.",
        'Deafened': 'Auto-fail hearing checks.',
        'Frightened': 'Disadvantage on ability checks and attacks while source of fear is in line of sight. Cannot move closer to source.',
        'Grappled': 'Speed becomes 0. Ends if grappler is incapacitated or moved out of reach.',
        'Incapacitated': "Can't take actions or reactions.",
        'Invisible': "Can't be seen. Advantage on attacks. Attacks against you have disadvantage.",
        'Paralyzed': "Incapacitated, can't move or speak. Auto-fail STR/DEX saves. Attacks have advantage. Melee hits are auto-crits.",
        'Petrified': 'Turned to stone. Weight x10. Incapacitated, unaware. Attacks have advantage. Auto-fail STR/DEX saves. Resistance to all damage.',
        'Poisoned': 'Disadvantage on attack rolls and ability checks.',
        'Prone': 'Disadvantage on attacks. Melee attacks against you have advantage. Ranged attacks against you have disadvantage. Must use half movement to stand.',
        'Restrained': 'Speed 0. Attacks have disadvantage. Attacks against you have advantage. Disadvantage on DEX saves.',
        'Stunned': "Incapacitated, can't move, can barely speak. Auto-fail STR/DEX saves. Attacks against you have advantage.",
        'Unconscious': "Incapacitated, can't move or speak, unaware. Drop what you're holding, fall prone. Auto-fail STR/DEX saves. Attacks have advantage. Melee hits are auto-crits."
    };
    var allConditions = Object.keys(CONDITION_DESC);
    var activeConditions = state.conditions || [];
    html += '<div class="sheet-block">';
    html += '<h2>' + t('combat.conditions') + '</h2>';
    html += '<div class="conditions-grid">';
    for (var ci = 0; ci < allConditions.length; ci++) {
        var cond = allConditions[ci];
        var isActive = activeConditions.indexOf(cond) !== -1;
        html += '<span class="condition-tag' + (isActive ? ' active' : '') + '" data-action="toggle-condition" data-condition="' + escapeAttr(cond) + '" data-tip="' + escapeAttr(CONDITION_DESC[cond]) + '">' + escapeHtml(cond) + '</span>';
    }
    html += '</div></div>';

    html += '</div>';
    return html;
}
function renderWeaponsHTML(config, state, editable, charId) {
    var dexMod = getMod(getAbilityScore(config, state, 'dex'));
    var strMod = getMod(getAbilityScore(config, state, 'str'));
    var profBonus = getProfBonus(state.level);

    var html = '<div class="weapons-table">';
    var weapons = config.weapons || [];
    for (var w = 0; w < weapons.length; w++) {
        var weapon = weapons[w];
        var attackMod = weapon.finesse ? Math.max(dexMod, strMod) : strMod;
        var hitBonus = attackMod + profBonus;
        var damageMod = weapon.finesse ? Math.max(dexMod, strMod) : strMod;
        var dmgStr = weapon.dmg;
        if (weapon.dmg !== '-') {
            dmgStr = damageMod >= 0 ? weapon.dmg + '+' + damageMod : weapon.dmg + damageMod;
        }
        html += '<div class="weapon">';
        html += '<span class="weapon-name">' + escapeHtml(weapon.name) + '</span>';
        html += '<span class="weapon-hit">' + formatMod(hitBonus) + '</span>';
        html += '<span class="weapon-dmg">' + dmgStr + (weapon.type && weapon.type !== '-' ? ' ' + weapon.type : '') + '</span>';
        html += '<button class="weapon-roll-btn" data-action="roll-attack" data-hit="' + hitBonus + '" data-dmg="' + escapeAttr(weapon.dmg) + '" data-dmg-mod="' + damageMod + '" data-weapon="' + escapeAttr(weapon.name) + '" title="Roll Attack">&#127922;</button>';
        if (editable) {
            html += '<button class="btn-inline-delete" data-action="delete-weapon" data-weapon-idx="' + w + '" title="Remove">&times;</button>';
        }
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderMetamagicHTML(charId, config, state) {
    if (state.level < 2) return '<p class="block-note">' + t('combat.metamagic.available') + '</p>';

    var maxChoices = 0;
    if (state.level >= 2) maxChoices = 2;
    if (state.level >= 10) maxChoices = 3;
    if (state.level >= 17) maxChoices = 4;

    var allMetamagic = DATA.metamagic || [];
    var chosen = state.metamagic || [];
    var canChooseMore = chosen.length < maxChoices;

    var html = '<p class="block-note" style="margin-bottom:0.75rem;">' + t('combat.metamagic.chosen') + ': ' + chosen.length + '/' + maxChoices + '</p>';
    html += '<div class="metamagic-grid">';
    for (var m = 0; m < allMetamagic.length; m++) {
        var mm = allMetamagic[m];
        var isChosen = chosen.indexOf(mm.name) !== -1;
        var cls = 'metamagic-option';
        if (isChosen) cls += ' chosen';
        if (!isChosen && !canChooseMore) cls += ' locked';
        html += '<button class="' + cls + '" data-metamagic="' + escapeAttr(mm.name) + '" title="' + escapeAttr(mm.desc || '') + '">';
        html += '<strong>' + escapeHtml(mm.name) + '</strong>';
        html += '<span class="meta-cost">' + mm.cost + '</span>';
        html += '</button>';
    }
    html += '</div>';
    return html;
}

// ============================================================
// Section 17: Tab — Spells
// ============================================================

function renderTabSpells(charId, config, state) {
    var className = config.className;
    if (!hasSpellcasting(className)) {
        return '<div class="tab-spells"><p class="block-note">' + t('spells.nospellcasting') + '</p></div>';
    }

    var spellAbility = getSpellcastingAbility(className);
    var abilityMod = getMod(getAbilityScore(config, state, spellAbility));
    var profBonus = getProfBonus(state.level);
    var spellDC = 8 + profBonus + abilityMod;
    var spellAttack = profBonus + abilityMod;
    var maxPrepared = getMaxPrepared(state, abilityMod, className);
    var preparedCount = state.prepared.length;
    var favorites = state.favorites || [];
    var classData = DATA[className];
    var spellList = getSpellListForClass(className);
    var hasCantrips = spellList[0] && spellList[0].length > 0;
    var maxCantrips = hasCantrips ? getMaxCantrips(state.level, className) : 0;

    // Determine spell slot info and max spell level
    var isWarlock = (className === 'warlock');
    var isHalfCaster = (classData && classData.spellcasting === 'half');
    var spellcastingStart = (classData && classData.spellcastingStart) ? classData.spellcastingStart : 1;
    var spellSlots = [];
    var maxSpellLevel = 0;

    if (isWarlock) {
        var pactSlotLevel = DATA.warlock.pactSlotLevel[state.level] || 1;
        var pactSlotCount = DATA.warlock.pactSlots[state.level] || 0;
        maxSpellLevel = pactSlotLevel;
    } else if (isHalfCaster) {
        spellSlots = DATA.halfCasterSlots[state.level] || [];
        for (var hi = spellSlots.length - 1; hi >= 0; hi--) {
            if (spellSlots[hi] > 0) { maxSpellLevel = hi + 1; break; }
        }
    } else {
        // Full caster (sorcerer, wizard, druid)
        if (classData && classData.maxSpellLevel) {
            maxSpellLevel = classData.maxSpellLevel[state.level] || 1;
        }
        spellSlots = getSpellSlots(className, state.level);
    }

    // Check if character is below spellcasting start level
    if (state.level < spellcastingStart) {
        return '<div class="tab-spells"><p class="block-note">' + classDisplayName(className) + ' ' + t('spells.spellcastingat') + ' ' + spellcastingStart + '.</p></div>';
    }

    // Determine prepared/known label
    var isPreparedCaster = (className === 'wizard' || className === 'druid' || className === 'paladin' || className === 'sorcerer');
    var preparedLabel = isPreparedCaster ? t('spells.prepared') : t('spells.known');

    var html = '<div class="tab-spells">';

    // Spell stats header
    html += '<div class="spell-header">';
    html += '<div class="spell-stat"><span class="label">' + t('spells.savedc') + '</span><span class="value">' + spellDC + '</span></div>';
    html += '<div class="spell-stat"><span class="label">' + t('spells.attack') + '</span><span class="value">' + formatMod(spellAttack) + '</span></div>';
    // Sorcerer-specific: sorcery points
    if (className === 'sorcerer') {
        var sorcPts = DATA.sorcerer.sorceryPoints[state.level] || 0;
        html += '<div class="spell-stat"><span class="label">' + t('spells.sorcpts') + '</span><span class="value">' + sorcPts + '</span></div>';
    }
    // Warlock-specific: pact slots
    if (isWarlock) {
        var wPactSlots = DATA.warlock.pactSlots[state.level] || 0;
        var wPactLevel = DATA.warlock.pactSlotLevel[state.level] || 1;
        html += '<div class="spell-stat"><span class="label">' + t('spells.pactslots') + '</span><span class="value">' + wPactSlots + ' (lvl ' + wPactLevel + ')</span></div>';
    }
    html += '<div class="spell-stat prepared-counter"><span class="label">' + preparedLabel + '</span><span class="value">' + preparedCount + '/' + maxPrepared + '</span></div>';
    html += '</div>';

    // Warlock note about short rest recovery
    if (isWarlock) {
        html += '<p class="block-note" style="margin-bottom:0.5rem;opacity:0.7;">' + t('combat.pactslots.note') + '</p>';
    }

    // Filter bar
    html += '<div class="spell-filter-bar">';
    html += '<button class="filter-btn' + (spellFilter === 'all' ? ' active' : '') + '" data-filter="all">' + t('spells.filter.all') + '</button>';
    html += '<button class="filter-btn' + (spellFilter === 'prepared' ? ' active' : '') + '" data-filter="prepared">' + preparedLabel + '</button>';
    html += '<button class="filter-btn' + (spellFilter === 'favorites' ? ' active' : '') + '" data-filter="favorites">&#9733; ' + t('spells.filter.favorites') + '</button>';
    html += '</div>';

    // Cantrips (level 0)
    if (hasCantrips && maxCantrips > 0) {
        var cantripList = spellList[0] || [];
        html += '<h3 class="spell-level-header">Cantrips <span class="slots">' + t('spells.cantrips.always') + ' &mdash; ' + state.cantrips.length + '/' + maxCantrips + '</span></h3>';
        html += '<div class="spell-grid">';
        for (var c = 0; c < cantripList.length; c++) {
            var spell = cantripList[c];
            var isSelected = state.cantrips.indexOf(spell.name) !== -1;
            var isFav = favorites.indexOf(spell.name) !== -1;
            if (spellFilter === 'prepared' && !isSelected) continue;
            if (spellFilter === 'favorites' && !isFav) continue;
            var cls = isSelected ? 'spell-toggle selected' : 'spell-toggle';
            var starCls = isFav ? 'spell-star favorited' : 'spell-star';
            var spellTip = spell.time + ' | ' + spell.range + ' | ' + spell.comp + ' | ' + spell.dur;
            html += '<button class="' + cls + '" data-spell="' + escapeAttr(spell.name) + '" data-level="0" data-tip="' + escapeAttr(spellTip + '\n' + (spell.desc || '')) + '">';
            html += '<span class="' + starCls + '" data-spell-star="' + escapeAttr(spell.name) + '">&#9733;</span> ';
            html += escapeHtml(spell.name) + '</button>';
        }
        html += '</div>';
    }

    // Spell levels
    var levelNames = ['Cantrips', '1st Level', '2nd Level', '3rd Level', '4th Level', '5th Level', '6th Level', '7th Level', '8th Level', '9th Level'];

    // Determine max level to show based on available spell data
    var dataMaxLevel = 0;
    for (var dl = 9; dl >= 1; dl--) {
        if (spellList[dl] && spellList[dl].length > 0) { dataMaxLevel = dl; break; }
    }
    var displayMaxLevel = Math.min(maxSpellLevel, dataMaxLevel);

    for (var lvl = 1; lvl <= displayMaxLevel; lvl++) {
        var slotCount = 0;
        var slotLabel = '';
        if (isWarlock) {
            // Warlock: pact slots only apply at or below pact slot level
            if (lvl <= pactSlotLevel) {
                slotLabel = '(' + t('spells.pact.at') + ' ' + pactSlotLevel + ')';
            } else {
                slotLabel = '0 ' + t('spells.slots');
            }
        } else {
            slotCount = spellSlots[lvl - 1] || 0;
            slotLabel = slotCount + ' ' + t('spells.slots');
        }

        var spells = spellList[lvl] || [];

        html += '<h3 class="spell-level-header">' + levelNames[lvl] + ' <span class="slots">' + slotLabel + '</span></h3>';
        html += '<div class="spell-grid">';
        for (var s = 0; s < spells.length; s++) {
            var sp = spells[s];
            var isPrepared = state.prepared.indexOf(sp.name) !== -1;
            var isFav2 = favorites.indexOf(sp.name) !== -1;
            if (spellFilter === 'prepared' && !isPrepared) continue;
            if (spellFilter === 'favorites' && !isFav2) continue;
            var cls2 = isPrepared ? 'spell-toggle prepared' : 'spell-toggle';
            var starCls2 = isFav2 ? 'spell-star favorited' : 'spell-star';
            var spTip = sp.time + ' | ' + sp.range + ' | ' + sp.comp + ' | ' + sp.dur;
            html += '<button class="' + cls2 + '" data-spell="' + escapeAttr(sp.name) + '" data-level="' + lvl + '" data-tip="' + escapeAttr(spTip + '\n' + (sp.desc || '')) + '">';
            html += '<span class="' + starCls2 + '" data-spell-star="' + escapeAttr(sp.name) + '">&#9733;</span> ';
            html += escapeHtml(sp.name) + '</button>';
        }
        html += '</div>';
    }

    if (displayMaxLevel < 9 && displayMaxLevel < maxSpellLevel) {
        html += '<p class="block-note" style="margin-top:1rem;opacity:0.5;">' + t('spells.higherlater') + '</p>';
    }

    html += '</div>';
    return html;
}

// ============================================================
// Section 18: Tab — Story
// ============================================================

function renderTabStory(charId, config, state) {
    var html = '<div class="sheet-grid">';
    var editable = canEdit(charId);

    // Personality
    var personality = config.personality || {};
    var hasPersonality = personality.traits || personality.ideal || personality.bond || personality.flaw || personality.fear;
    if (hasPersonality || editable) {
        html += '<div class="sheet-block personality-block">';
        html += '<h2>' + t('story.personality') + '</h2>';
        var pFields = [
            { key: 'traits', label: t('story.traits') },
            { key: 'ideal', label: t('story.ideal') },
            { key: 'bond', label: t('story.bond') },
            { key: 'flaw', label: t('story.flaw') },
            { key: 'fear', label: t('story.fear') }
        ];
        for (var pf = 0; pf < pFields.length; pf++) {
            var pfKey = pFields[pf].key;
            var pfLabel = pFields[pf].label;
            var pfVal = personality[pfKey] || '';
            if (editable) {
                html += '<div class="personality-item editable-field" data-edit-field="personality.' + pfKey + '" data-char-id="' + charId + '">';
                html += '<h3>' + pfLabel + '</h3>';
                html += '<p class="field-display">' + escapeHtml(pfVal) + (!pfVal ? '<em class="placeholder-text">' + t('story.clicktoadd') + '</em>' : '') + '</p>';
                html += '<button class="edit-trigger" data-action="edit-field" data-field="personality.' + pfKey + '" title="' + t('generic.edit') + '">&#9998;</button>';
                html += '</div>';
            } else if (pfVal) {
                html += '<div class="personality-item"><h3>' + pfLabel + '</h3><p>' + escapeHtml(pfVal) + '</p></div>';
            }
        }
        html += '</div>';
    }

    // Backstory
    if (config.backstory || editable) {
        html += '<div class="sheet-block">';
        html += '<h2>' + t('story.backstory') + '</h2>';
        if (editable) {
            html += '<div class="editable-field" data-edit-field="backstory" data-char-id="' + charId + '">';
            html += '<p class="field-display">' + escapeHtml(config.backstory || '') + (!config.backstory ? '<em class="placeholder-text">' + t('story.addbackstory') + '</em>' : '') + '</p>';
            html += '<button class="edit-trigger" data-action="edit-field" data-field="backstory" title="' + t('generic.edit') + '">&#9998;</button>';
            html += '</div>';
        } else {
            var bsParagraphs = config.backstory.split('\n\n');
            for (var bsi = 0; bsi < bsParagraphs.length; bsi++) {
                if (bsParagraphs[bsi].trim()) {
                    html += '<p class="backstory-para" style="animation-delay:' + (bsi * 0.15) + 's">' + escapeHtml(bsParagraphs[bsi].trim()) + '</p>';
                }
            }
        }
        html += '</div>';
    }

    // Quotes
    var quotes = config.quotes || [];
    if (quotes.length > 0 || editable) {
        html += '<div class="sheet-block">';
        html += '<h2>' + t('story.quotes') + '</h2>';
        for (var q = 0; q < quotes.length; q++) {
            html += '<div class="quote-item">';
            html += '<blockquote>&ldquo;' + escapeHtml(quotes[q]) + '&rdquo;</blockquote>';
            if (editable) {
                html += '<button class="quote-remove-btn" data-action="remove-quote" data-quote-idx="' + q + '" title="' + t('generic.delete') + '">&#10005;</button>';
            }
            html += '</div>';
        }
        if (editable) {
            html += '<div class="quote-add-form">';
            html += '<input type="text" class="edit-input quote-add-input" placeholder="' + t('story.addquote') + '">';
            html += '<button class="edit-save" data-action="add-quote">+ ' + t('story.add') + '</button>';
            html += '</div>';
        }
        html += '</div>';
    }

    // === Character Timeline ===
    var charTimeline = config.charTimeline || [];
    if (charTimeline.length > 0 || editable) {
        html += '<div class="sheet-block">';
        html += '<h2>Timeline</h2>';
        if (charTimeline.length > 0) {
            html += '<div class="char-timeline">';
            for (var cti = 0; cti < charTimeline.length; cti++) {
                var ctEntry = charTimeline[cti];
                html += '<div class="char-timeline-entry">';
                html += '<div class="char-timeline-marker"></div>';
                html += '<div class="char-timeline-content">';
                html += '<span class="char-timeline-age">' + escapeHtml(ctEntry.age || '') + '</span>';
                html += '<span class="char-timeline-text">' + escapeHtml(ctEntry.event || '') + '</span>';
                if (editable) {
                    html += '<button class="char-timeline-remove" data-action="remove-timeline-entry" data-idx="' + cti + '">&times;</button>';
                }
                html += '</div></div>';
            }
            html += '</div>';
        }
        if (editable) {
            html += '<div class="char-timeline-add">';
            html += '<input type="text" class="edit-input" id="ct-age" placeholder="Age / Year" style="width:80px;">';
            html += '<input type="text" class="edit-input" id="ct-event" placeholder="Event..." style="flex:1;">';
            html += '<button class="edit-save" data-action="add-timeline-entry">+</button>';
            html += '</div>';
        }
        html += '</div>';
    }

    // === Family Tree ===
    var family = config.family || [];
    if (family.length > 0 || editable) {
        html += '<div class="sheet-block">';
        html += '<h2>Family & Connections</h2>';
        html += renderFamilyTree(family, charId, config.name, editable);
        html += '</div>';
    }

    if (!editable && !config.backstory && !hasPersonality && quotes.length === 0 && charTimeline.length === 0 && family.length === 0) {
        html += '<p class="block-note">' + t('story.nostory') + '</p>';
    }

    html += '</div>';
    return html;
}

// ============================================================
// Section 18b: Family Tree Renderer (shared between character page and DM NPCs)
// ============================================================

function guessTier(relation) {
    var r = (relation || '').toLowerCase();
    if (r.indexOf('grootvader') >= 0 || r.indexOf('grootmoeder') >= 0 || r.indexOf('grandfather') >= 0 || r.indexOf('grandmother') >= 0 || r.indexOf('grandparent') >= 0 || r.indexOf('opa') >= 0 || r.indexOf('oma') >= 0) return 'grandparent';
    if (r.indexOf('vader') >= 0 || r.indexOf('moeder') >= 0 || r.indexOf('father') >= 0 || r.indexOf('mother') >= 0 || r.indexOf('parent') >= 0) return 'parent';
    if (r.indexOf('partner') >= 0 || r.indexOf('spouse') >= 0 || r.indexOf('husband') >= 0 || r.indexOf('wife') >= 0 || r.indexOf('echtgeno') >= 0 || r.indexOf('vrouw') >= 0 || r.indexOf('man') >= 0 && r.length <= 6) return 'partner';
    if (r.indexOf('zoon') >= 0 || r.indexOf('dochter') >= 0 || r.indexOf('son') >= 0 || r.indexOf('daughter') >= 0 || r.indexOf('child') >= 0 || r.indexOf('kind') >= 0) return 'child';
    return 'sibling';
}

function renderFamilyTree(family, contextId, selfName, editable) {
    var html = '';
    var grandparents = [], parents = [], partners = [], siblings = [], children = [];
    for (var fi = 0; fi < family.length; fi++) {
        var fm = family[fi];
        fm._idx = fi;
        var tier = fm.tier || guessTier(fm.relation);
        if (tier === 'grandparent') grandparents.push(fm);
        else if (tier === 'parent') parents.push(fm);
        else if (tier === 'partner') partners.push(fm);
        else if (tier === 'child') children.push(fm);
        else siblings.push(fm);
    }

    html += '<div class="ftree" id="ftree-root">';

    // === GRANDPARENTS ROW ===
    if (grandparents.length > 0 || editable) {
        html += '<div class="ftree-tier ftree-grandparents" data-tier-id="grandparent">';
        html += '<span class="ftree-tier-label">Grandparents</span>';
        if (editable) html += '<button class="ftree-add-btn" data-action="add-family" data-tier="grandparent" title="Add grandparent">+</button>';
        for (var gi = 0; gi < grandparents.length; gi++) {
            html += renderFamilyNode(grandparents[gi], editable, contextId);
        }
        html += '</div>';
    }

    // === PARENTS ROW ===
    if (parents.length > 0 || editable) {
        html += '<div class="ftree-tier ftree-parents" data-tier-id="parent">';
        html += '<span class="ftree-tier-label">Parents</span>';
        if (editable) html += '<button class="ftree-add-btn" data-action="add-family" data-tier="parent" title="Add parent">+</button>';
        for (var pi = 0; pi < parents.length; pi++) {
            html += renderFamilyNode(parents[pi], editable, contextId);
        }
        html += '</div>';
    }

    // === SELF + PARTNERS + SIBLINGS ROW ===
    html += '<div class="ftree-tier ftree-siblings" data-tier-id="sibling">';
    html += '<span class="ftree-tier-label">Family</span>';
    if (editable) html += '<button class="ftree-add-btn" data-action="add-family" data-tier="sibling" title="Add sibling">+</button>';
    if (selfName) {
        html += '<div class="ftree-node ftree-self">';
        html += '<div class="ftree-node-inner">';
        html += '<strong>' + escapeHtml(selfName) + '</strong>';
        html += '<span class="ftree-relation">Self</span>';
        html += '</div></div>';
    }
    for (var pti = 0; pti < partners.length; pti++) {
        html += renderFamilyNode(partners[pti], editable, contextId);
    }
    if (editable && partners.length === 0) {
        html += '<button class="ftree-add-btn ftree-add-partner" data-action="add-family" data-tier="partner" title="Add partner">+ Partner</button>';
    }
    for (var si = 0; si < siblings.length; si++) {
        html += renderFamilyNode(siblings[si], editable, contextId);
    }
    html += '</div>';

    // === CHILDREN ROW ===
    if (children.length > 0 || editable) {
        html += '<div class="ftree-tier ftree-children" data-tier-id="child">';
        html += '<span class="ftree-tier-label">Children</span>';
        if (editable) html += '<button class="ftree-add-btn" data-action="add-family" data-tier="child" title="Add child">+</button>';
        for (var ci = 0; ci < children.length; ci++) {
            html += renderFamilyNode(children[ci], editable, contextId);
        }
        html += '</div>';
    }

    // SVG overlay for connection lines (drawn after render via postRenderFamilyTree)
    html += '<svg class="ftree-svg" id="ftree-svg"></svg>';
    html += '</div>';

    // === ADD FORM ===
    if (editable) {
        html += '<div class="ftree-add-form" id="ftree-add-form" style="display:none;">';
        html += '<div class="ftree-form-row">';
        html += '<select class="edit-input" id="fam-source" style="width:auto;">';
        html += '<option value="custom">Custom entry</option>';
        var charIds = getCharacterIds();
        for (var chi = 0; chi < charIds.length; chi++) {
            if (charIds[chi] === contextId) continue;
            var chcfg = loadCharConfig(charIds[chi]);
            if (chcfg && chcfg.name) html += '<option value="char:' + charIds[chi] + '">' + escapeHtml(chcfg.name) + ' (character)</option>';
        }
        var npcData = getNPCData();
        var npcs = npcData.npcs || [];
        for (var ni = 0; ni < npcs.length; ni++) {
            html += '<option value="npc:' + ni + '">' + escapeHtml(npcs[ni].name) + ' (NPC)</option>';
        }
        html += '</select>';
        html += '</div>';
        html += '<div class="ftree-form-row">';
        html += '<input type="text" class="edit-input" id="fam-name" placeholder="Name" style="flex:1;">';
        html += '<input type="text" class="edit-input" id="fam-relation" placeholder="Relation (e.g. Mother, Partner)" style="flex:1;">';
        html += '</div>';
        html += '<div class="ftree-form-row">';
        html += '<select class="edit-input" id="fam-status" style="width:auto;">';
        html += '<option value="Alive">Alive</option>';
        html += '<option value="Deceased">Deceased</option>';
        html += '<option value="Unknown">Unknown</option>';
        html += '</select>';
        html += '<input type="text" class="edit-input" id="fam-notes" placeholder="Notes (optional)" style="flex:1;">';
        html += '<button class="edit-save" data-action="save-family">Save</button>';
        html += '<button class="edit-cancel" data-action="cancel-family">Cancel</button>';
        html += '</div>';
        html += '<input type="hidden" id="fam-tier" value="">';
        html += '</div>';
    }

    return html;
}

// Draw SVG connection lines between family tree tiers
function postRenderFamilyTree() {
    var root = document.getElementById('ftree-root');
    var svg = document.getElementById('ftree-svg');
    if (!root || !svg) return;

    var rootRect = root.getBoundingClientRect();
    svg.setAttribute('width', rootRect.width);
    svg.setAttribute('height', rootRect.height);
    svg.innerHTML = '';

    var tiers = root.querySelectorAll('.ftree-tier');
    for (var i = 0; i < tiers.length - 1; i++) {
        var upperTier = tiers[i];
        var lowerTier = tiers[i + 1];
        var upperNodes = upperTier.querySelectorAll('.ftree-node');
        var lowerNodes = lowerTier.querySelectorAll('.ftree-node');
        if (upperNodes.length === 0 || lowerNodes.length === 0) continue;

        // Find center bottom of upper tier nodes
        var upperCenters = [];
        for (var u = 0; u < upperNodes.length; u++) {
            var ur = upperNodes[u].getBoundingClientRect();
            upperCenters.push({ x: ur.left + ur.width / 2 - rootRect.left, y: ur.bottom - rootRect.top });
        }
        // Find center top of lower tier nodes
        var lowerCenters = [];
        for (var l = 0; l < lowerNodes.length; l++) {
            var lr = lowerNodes[l].getBoundingClientRect();
            lowerCenters.push({ x: lr.left + lr.width / 2 - rootRect.left, y: lr.top - rootRect.top });
        }

        // Draw from each upper node to a midpoint, then fan out to lower nodes
        var midY = (upperCenters[0].y + lowerCenters[0].y) / 2;

        // Upper nodes → horizontal bar
        if (upperCenters.length > 1) {
            var leftX = Math.min.apply(null, upperCenters.map(function(c) { return c.x; }));
            var rightX = Math.max.apply(null, upperCenters.map(function(c) { return c.x; }));
            drawLine(svg, leftX, midY, rightX, midY);
        }
        for (var ui = 0; ui < upperCenters.length; ui++) {
            drawLine(svg, upperCenters[ui].x, upperCenters[ui].y, upperCenters[ui].x, midY);
        }

        // Midpoint → lower nodes
        if (lowerCenters.length > 1) {
            var leftX2 = Math.min.apply(null, lowerCenters.map(function(c) { return c.x; }));
            var rightX2 = Math.max.apply(null, lowerCenters.map(function(c) { return c.x; }));
            drawLine(svg, leftX2, midY, rightX2, midY);
        }
        for (var li = 0; li < lowerCenters.length; li++) {
            drawLine(svg, lowerCenters[li].x, midY, lowerCenters[li].x, lowerCenters[li].y);
        }

        // Connect upper bar to lower bar if they don't overlap
        if (upperCenters.length > 0 && lowerCenters.length > 0) {
            var ucx = upperCenters.reduce(function(s, c) { return s + c.x; }, 0) / upperCenters.length;
            var lcx = lowerCenters.reduce(function(s, c) { return s + c.x; }, 0) / lowerCenters.length;
            if (upperCenters.length === 1 && lowerCenters.length === 1) {
                // Direct line already drawn
            } else if (upperCenters.length === 1) {
                drawLine(svg, upperCenters[0].x, midY, upperCenters[0].x, midY);
            }
        }
    }

    // Draw partner connection (heart line between self and partner)
    var selfNode = root.querySelector('.ftree-self');
    var partnerNodes = root.querySelectorAll('.ftree-node-partner');
    if (selfNode && partnerNodes.length > 0) {
        for (var pn = 0; pn < partnerNodes.length; pn++) {
            var sr = selfNode.getBoundingClientRect();
            var pr = partnerNodes[pn].getBoundingClientRect();
            var sy = sr.top + sr.height / 2 - rootRect.top;
            var sx = sr.right - rootRect.left;
            var px = pr.left - rootRect.left;
            var py = pr.top + pr.height / 2 - rootRect.top;
            var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', sx); line.setAttribute('y1', sy);
            line.setAttribute('x2', px); line.setAttribute('y2', py);
            line.setAttribute('class', 'ftree-line ftree-line-partner');
            svg.appendChild(line);
        }
    }
}

function drawLine(svg, x1, y1, x2, y2) {
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('class', 'ftree-line');
    svg.appendChild(line);
}

function renderFamilyNode(fm, editable, contextId) {
    var isDead = fm.status === 'Deceased' || fm.status === 'Overleden';
    var isPartner = (fm.tier || guessTier(fm.relation)) === 'partner';
    var html = '<div class="ftree-node' + (isDead ? ' deceased' : '') + (isPartner ? ' ftree-node-partner' : '') + '">';
    var linkStart = '', linkEnd = '';
    if (fm.linkedChar && fm.linkedChar !== contextId) {
        linkStart = '<a href="#/characters/' + fm.linkedChar + '" class="ftree-link">';
        linkEnd = '</a>';
    }
    html += linkStart;
    html += '<div class="ftree-node-inner">';
    html += '<strong>' + escapeHtml(fm.name || '') + '</strong>';
    html += '<span class="ftree-relation">' + escapeHtml(fm.relation || '') + '</span>';
    if (fm.status) {
        var statusIcon = isDead ? '&#9876;' : '&#9679;';
        var statusColor = isDead ? 'var(--danger)' : 'var(--success)';
        html += '<span class="ftree-status" style="color:' + statusColor + '">' + statusIcon + ' ' + escapeHtml(fm.status) + '</span>';
    }
    if (fm.notes) html += '<span class="ftree-notes">' + escapeHtml(fm.notes) + '</span>';
    html += '</div>';
    html += linkEnd;
    if (editable) {
        html += '<button class="ftree-remove" data-action="remove-family" data-idx="' + fm._idx + '">&times;</button>';
    }
    html += '</div>';
    return html;
}

// ============================================================
// Section 19: Tab — Inventory
// ============================================================

function renderTabInventory(charId, config, state) {
    var strScore = getAbilityScore(config, state, 'str');
    var capacity = strScore * 15;
    var totalWeight = 0;
    var items = state.items || [];
    for (var i = 0; i < items.length; i++) {
        totalWeight += (items[i].weight || 0);
    }

    var encStatus = '';
    var encClass = '';
    if (totalWeight > strScore * 10) {
        encStatus = '&#128308; ' + t('inv.encumbered.heavy') + '';
        encClass = 'enc-heavy';
    } else if (totalWeight > strScore * 5) {
        encStatus = '&#9888;&#65039; ' + t('inv.encumbered.medium') + '';
        encClass = 'enc-medium';
    } else {
        encStatus = '&#10003; ' + t('inv.encumbered.ok') + '';
        encClass = 'enc-ok';
    }

    // Build datalist options from DATA.items
    var datalistOptions = '';
    if (typeof DATA !== 'undefined' && DATA.items) {
        var categories = Object.keys(DATA.items);
        for (var ci = 0; ci < categories.length; ci++) {
            var catItems = DATA.items[categories[ci]];
            if (Array.isArray(catItems)) {
                for (var di = 0; di < catItems.length; di++) {
                    var ditem = catItems[di];
                    var itemName = typeof ditem === 'string' ? ditem : ditem.name;
                    var itemWeight = typeof ditem === 'object' && ditem.weight !== undefined ? ditem.weight : '';
                    datalistOptions += '<option value="' + escapeAttr(itemName) + '" data-weight="' + itemWeight + '">';
                }
            }
        }
    }

    var editable = canEdit(charId);
    var html = '<div class="tab-inventory">';

    html += '<div class="items-header">';
    html += '<span class="weight-total">' + t('inv.weight') + ': ' + totalWeight.toFixed(2) + ' / ' + capacity + ' lbs</span>';
    html += '<span class="encumbrance-status ' + encClass + '">' + encStatus + '</span>';
    if (editable) {
        html += '<button class="item-add-btn" data-action="add-item">' + t('inv.additem') + '</button>';
    }
    html += '</div>';

    // Gold
    html += '<div class="gold-row">';
    html += '<span class="gold-label">' + t('inv.gold') + ': </span>';
    if (editable) {
        html += '<input type="number" class="gold-input" value="' + (state.gold || 0) + '" min="0" step="1" data-action="update-gold">';
        html += '<span class="gold-suffix"> gp</span>';
    } else {
        html += '<span class="gold-amount">' + (state.gold || 0) + ' gp</span>';
    }
    html += '</div>';
    // Secret stash (only visible to owner and admin)
    if (editable) {
        html += '<div class="gold-row gold-secret">';
        html += '<span class="gold-label">&#128274; Secret stash: </span>';
        html += '<input type="number" class="gold-input" value="' + (state.secretGold || 0) + '" min="0" step="1" data-action="update-secret-gold">';
        html += '<span class="gold-suffix"> gp</span>';
        html += '</div>';
    }

    if (editable) {
        html += '<div class="item-add-form" style="display:none;">';
        html += '<input type="text" class="item-name-input" placeholder="' + t('inv.itemname') + '" list="item-suggestions">';
        html += '<datalist id="item-suggestions">' + datalistOptions + '</datalist>';
        html += '<input type="number" class="item-weight-input" placeholder="' + t('inv.itemweight') + '" step="0.25" min="0">';
        html += '<input type="text" class="item-notes-input" placeholder="' + t('inv.itemnotes') + '">';
        html += '<button class="item-confirm-btn" data-action="confirm-item">&#10003;</button>';
        html += '<button class="item-cancel-btn" data-action="cancel-item">&#10005;</button>';
        html += '</div>';
    }

    // Categorize items
    var itemCats = { weapons: [], armor: [], potions: [], gear: [], other: [] };
    var catLabels = { weapons: 'Weapons', armor: 'Armor & Shields', potions: 'Potions & Consumables', gear: 'Adventuring Gear', other: 'Other' };
    var catIcons = { weapons: '\u2694\ufe0f', armor: '\ud83d\udee1\ufe0f', potions: '\ud83e\uddea', gear: '\ud83c\udf92', other: '\ud83d\udce6' };
    for (var idx = 0; idx < items.length; idx++) {
        var item = items[idx];
        var iName = (item.name || '').toLowerCase();
        if (iName.indexOf('sword') >= 0 || iName.indexOf('bow') >= 0 || iName.indexOf('dagger') >= 0 || iName.indexOf('axe') >= 0 || iName.indexOf('arrow') >= 0 || iName.indexOf('bolt') >= 0 || iName.indexOf('spear') >= 0 || iName.indexOf('mace') >= 0 || iName.indexOf('staff') >= 0 || iName.indexOf('crossbow') >= 0) {
            itemCats.weapons.push({ item: item, idx: idx });
        } else if (iName.indexOf('armor') >= 0 || iName.indexOf('shield') >= 0 || iName.indexOf('leather') >= 0 || iName.indexOf('mail') >= 0 || iName.indexOf('plate') >= 0) {
            itemCats.armor.push({ item: item, idx: idx });
        } else if (iName.indexOf('potion') >= 0 || iName.indexOf('antitoxin') >= 0 || iName.indexOf('holy water') >= 0) {
            itemCats.potions.push({ item: item, idx: idx });
        } else if (iName.indexOf('rope') >= 0 || iName.indexOf('torch') >= 0 || iName.indexOf('tools') >= 0 || iName.indexOf('kit') >= 0 || iName.indexOf('pack') >= 0 || iName.indexOf('rations') >= 0 || iName.indexOf('waterskin') >= 0 || iName.indexOf('bedroll') >= 0 || iName.indexOf('lantern') >= 0) {
            itemCats.gear.push({ item: item, idx: idx });
        } else {
            itemCats.other.push({ item: item, idx: idx });
        }
    }
    html += '<div class="items-categorized">';
    var catKeys = ['weapons', 'armor', 'potions', 'gear', 'other'];
    for (var ck = 0; ck < catKeys.length; ck++) {
        var catKey = catKeys[ck];
        var catItems = itemCats[catKey];
        if (catItems.length === 0) continue;
        html += '<div class="item-category">';
        html += '<h3 class="item-cat-header">' + catIcons[catKey] + ' ' + catLabels[catKey] + ' <span class="item-cat-count">(' + catItems.length + ')</span></h3>';
        html += '<div class="items-grid">';
        for (var ci = 0; ci < catItems.length; ci++) {
            var cItem = catItems[ci].item;
            var cIdx = catItems[ci].idx;
            // Look up weapon mastery from DATA.items.weapons
            var masteryTag = '';
            if (catKey === 'weapons' && DATA.items && DATA.items.weapons) {
                var weaponName = (cItem.name || '').toLowerCase();
                for (var wi = 0; wi < DATA.items.weapons.length; wi++) {
                    var dw = DATA.items.weapons[wi];
                    if (dw.mastery && dw.name.toLowerCase() === weaponName) {
                        var mKey = dw.mastery;
                        var mDesc = DATA.items.weaponMasteryDesc && DATA.items.weaponMasteryDesc[mKey] ? DATA.items.weaponMasteryDesc[mKey] : '';
                        masteryTag = '<span class="item-mastery" data-mastery="' + escapeAttr(mKey) + '" data-mastery-desc="' + escapeAttr(mDesc) + '">' + capitalize(mKey) + '</span>';
                        break;
                    }
                }
            }
            html += '<div class="item-row">';
            html += '<span class="item-name">' + escapeHtml(cItem.name) + masteryTag + '</span>';
            html += '<span class="item-weight">' + cItem.weight + ' lbs</span>';
            html += '<span class="item-notes">' + (cItem.notes ? escapeHtml(cItem.notes) : '-') + '</span>';
            if (editable) {
                html += '<button class="item-remove" data-item-idx="' + cIdx + '">&#10005;</button>';
            }
            html += '</div>';
        }
        html += '</div></div>';
    }
    html += '</div>';

    html += '</div>';
    return html;
}


// ============================================================
// Section 25: Export / Import / Reset
// ============================================================

function exportCharacter(charId, state) {
    var data = JSON.stringify(state, null, 2);
    var blob = new Blob([data], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = charId + '_character.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importCharacter(charId, file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var imported = JSON.parse(e.target.result);
            callback(imported);
        } catch (err) {
            showWarning(t('warn.invalidjson'));
        }
    };
    reader.readAsText(file);
}

// ============================================================
// Section 25b: Level-Up Wizard Modal
// ============================================================

function showLevelUpModal(charId, config, state) {
    var newLevel = state.level + 1;
    if (newLevel > 20) return;

    var classData = DATA[config.className];
    if (!classData) return;

    // Remove any existing level-up modal
    var existing = document.getElementById('levelup-modal');
    if (existing) existing.remove();

    var profBonus = getProfBonus(newLevel);
    var oldProfBonus = getProfBonus(state.level);
    var conMod = getMod(getAbilityScore(config, state, 'con'));
    var hitDie = classData.hitDie || 8;
    var avgHP = Math.floor(hitDie / 2) + 1;
    var hpGain = avgHP + conMod;

    // Gather class features
    var classFeatures = classData.features[newLevel] || [];
    var subFeatures = [];
    var subData = classData.subclasses && classData.subclasses[config.subclass];
    if (subData && subData.features && subData.features[newLevel]) {
        subFeatures = subData.features[newLevel];
    }

    // Check if ASI level
    var isASI = (classData.asiLevels || []).indexOf(newLevel) !== -1;

    // Check if subclass selection needed (at subclass level OR past it without one)
    var needsSubclass = false;
    if (classData.subclasses && !config.subclass) {
        var subclassKeys = Object.keys(classData.subclasses);
        for (var sk = 0; sk < subclassKeys.length; sk++) {
            var sub = classData.subclasses[subclassKeys[sk]];
            if (sub.level <= newLevel) {
                needsSubclass = true;
                break;
            }
        }
    }

    // Spell slot changes
    var oldSlots = null;
    var newSlots = null;
    var spellSlotChanges = [];
    if (classData.spellcasting === 'full' && classData.spellSlots) {
        oldSlots = classData.spellSlots[state.level] || [];
        newSlots = classData.spellSlots[newLevel] || [];
    } else if (classData.spellcasting === 'half') {
        oldSlots = DATA.halfCasterSlots[state.level] || [];
        newSlots = DATA.halfCasterSlots[newLevel] || [];
    } else if (classData.spellcasting === 'pact') {
        var oldPactSlots = classData.pactSlots[state.level] || 0;
        var newPactSlots = classData.pactSlots[newLevel] || 0;
        var oldPactLevel = classData.pactSlotLevel[state.level] || 1;
        var newPactLevel = classData.pactSlotLevel[newLevel] || 1;
        if (newPactSlots > oldPactSlots || newPactLevel > oldPactLevel) {
            spellSlotChanges.push('Pact Slots: ' + oldPactSlots + ' \u00d7 ' + ordinal(oldPactLevel) + ' level \u2192 ' + newPactSlots + ' \u00d7 ' + ordinal(newPactLevel) + ' level');
        }
    }
    if (oldSlots && newSlots) {
        for (var si = 0; si < newSlots.length; si++) {
            var oldCount = oldSlots[si] || 0;
            var newCount = newSlots[si] || 0;
            if (newCount > oldCount) {
                spellSlotChanges.push(ordinal(si + 1) + ' level: ' + oldCount + ' \u2192 ' + newCount);
            }
        }
    }

    // New cantrip available?
    var newCantrip = false;
    if (classData.cantripsKnown) {
        var oldCantripMax = classData.cantripsKnown[state.level] || 0;
        var newCantripMax = classData.cantripsKnown[newLevel] || 0;
        if (newCantripMax > oldCantripMax) {
            newCantrip = true;
        }
    }

    // Metamagic (sorcerer levels 10, 17)
    var newMetamagic = false;
    if (config.className === 'sorcerer' && (newLevel === 10 || newLevel === 17)) {
        newMetamagic = true;
    }

    // ---- Build modal HTML ----
    var accentColor = config.accentColor || 'var(--accent)';
    var html = '<div class="levelup-overlay" id="levelup-modal">';
    html += '<div class="levelup-card">';

    // Header
    html += '<div class="levelup-header">';
    html += '<h2 style="color:' + accentColor + '">' + t('levelup.title') + '</h2>';
    html += '<p class="levelup-subtitle">Level ' + state.level + ' \u2192 Level ' + newLevel + '</p>';
    html += '</div>';

    // --- HP gain ---
    html += '<div class="levelup-section">';
    html += '<h3>\u2764\uFE0F ' + t('levelup.hp') + '</h3>';
    html += '<p style="font-size:1.1rem;color:var(--text-bright)">+' + hpGain + ' HP</p>';
    html += '<p>d' + hitDie + ' ' + t('levelup.hp.avg') + ' (' + avgHP + ') + ' + t('levelup.hp.conmod') + ' (' + formatMod(conMod) + ')</p>';
    html += '<div style="display:flex;align-items:center;gap:0.75rem;margin-top:0.5rem;">';
    html += '<button class="levelup-choice" data-action="levelup-roll-hp">' + t('levelup.hp.manual') + '</button>';
    html += '<span id="levelup-hp-result" style="color:var(--text-bright);font-weight:600;"></span>';
    html += '<input type="hidden" id="levelup-hp-value" value="' + hpGain + '">';
    html += '</div>';
    html += '</div>';

    // --- Prof bonus change ---
    if (profBonus > oldProfBonus) {
        html += '<div class="levelup-section">';
        html += '<h3>' + t('levelup.profbonus') + '</h3>';
        html += '<p style="font-size:1.1rem;color:var(--text-bright)">+' + oldProfBonus + ' \u2192 +' + profBonus + '</p>';
        html += '</div>';
    }

    // --- New features ---
    if (classFeatures.length > 0 || subFeatures.length > 0) {
        html += '<div class="levelup-section">';
        html += '<h3>' + t('levelup.newfeatures') + '</h3>';
        for (var fi = 0; fi < classFeatures.length; fi++) {
            html += '<div class="levelup-feature">';
            html += '<h4>' + escapeHtml(classFeatures[fi].name) + '</h4>';
            html += '<p>' + escapeHtml(classFeatures[fi].desc) + '</p>';
            html += '</div>';
        }
        for (var sfi = 0; sfi < subFeatures.length; sfi++) {
            html += '<div class="levelup-feature" style="border-left:3px solid ' + accentColor + '">';
            html += '<h4>' + escapeHtml(subFeatures[sfi].name) + ' <span style="font-size:0.7rem;background:' + accentColor + ';color:var(--bg-dark);padding:0.1rem 0.4rem;border-radius:100px;font-weight:700;vertical-align:middle;">Subclass</span></h4>';
            html += '<p>' + escapeHtml(subFeatures[sfi].desc) + '</p>';
            html += '</div>';
        }
        html += '</div>';
    }

    // --- Subclass selection ---
    if (needsSubclass) {
        html += '<div class="levelup-section">';
        html += '<h3>' + t('levelup.subclass') + '</h3>';
        html += '<p>' + t('levelup.subclass.choose') + '</p>';
        html += '<div class="levelup-choices" id="levelup-subclass-choices">';
        var subKeys = Object.keys(classData.subclasses);
        for (var sck = 0; sck < subKeys.length; sck++) {
            var subOpt = classData.subclasses[subKeys[sck]];
            html += '<button class="levelup-choice" data-subclass="' + escapeAttr(subKeys[sck]) + '">' + escapeHtml(subOpt.name) + '</button>';
        }
        html += '</div>';
        html += '<input type="hidden" id="levelup-subclass-value" value="">';
        html += '</div>';
    }

    // --- ASI / Feat ---
    if (isASI) {
        html += '<div class="levelup-section">';
        html += '<h3>' + t('levelup.asi') + '</h3>';
        html += '<p>' + t('levelup.asi.choose') + '</p>';
        html += '<div class="levelup-choices">';
        html += '<button class="levelup-choice" data-action="levelup-asi" data-asi-mode="asi-two">' + t('stats.asi.plus2') + '</button>';
        html += '<button class="levelup-choice" data-action="levelup-asi" data-asi-mode="asi-split">' + t('stats.asi.split') + '</button>';
        html += '<button class="levelup-choice" data-action="levelup-asi" data-asi-mode="feat">' + t('stats.asi.feat') + '</button>';
        html += '</div>';
        html += '<div id="levelup-asi-detail"></div>';
        html += '<input type="hidden" id="levelup-asi-value" value="">';
        html += '</div>';
    }

    // --- Sneak Attack (Rogue) ---
    if (config.className === 'rogue' && DATA.rogue.sneakAttack) {
        var oldSA = DATA.rogue.sneakAttack[state.level] || '1d6';
        var newSA = DATA.rogue.sneakAttack[newLevel] || oldSA;
        if (newSA !== oldSA) {
            html += '<div class="levelup-section">';
            html += '<h3>' + t('levelup.sneakattack') + '</h3>';
            html += '<p style="font-size:1.1rem;color:var(--text-bright)">' + oldSA + ' \u2192 ' + newSA + '</p>';
            html += '</div>';
        }
    }

    // --- Sorcery Points (Sorcerer) ---
    if (config.className === 'sorcerer' && DATA.sorcerer.sorceryPoints) {
        var oldSP = DATA.sorcerer.sorceryPoints[state.level] || 0;
        var newSP = DATA.sorcerer.sorceryPoints[newLevel] || 0;
        if (newSP > oldSP) {
            html += '<div class="levelup-section">';
            html += '<h3>' + t('levelup.sorcpts') + '</h3>';
            html += '<p style="font-size:1.1rem;color:var(--text-bright)">' + oldSP + ' \u2192 ' + newSP + '</p>';
            html += '</div>';
        }
    }

    // --- Spell slot changes ---
    if (spellSlotChanges.length > 0) {
        html += '<div class="levelup-section">';
        html += '<h3>' + t('levelup.spellslots') + '</h3>';
        for (var ssc = 0; ssc < spellSlotChanges.length; ssc++) {
            html += '<p style="color:var(--text-bright)">' + escapeHtml(spellSlotChanges[ssc]) + '</p>';
        }
        html += '</div>';
    }

    // --- New cantrip ---
    if (newCantrip) {
        html += '<div class="levelup-section">';
        html += '<h3>' + t('levelup.newcantrip') + '</h3>';
        html += '<p>' + t('levelup.newcantrip.desc') + '</p>';
        html += '</div>';
    }

    // --- New metamagic ---
    if (newMetamagic) {
        html += '<div class="levelup-section">';
        html += '<h3>' + t('levelup.newmetamagic') + '</h3>';
        html += '<p>' + t('levelup.newmetamagic.desc') + '</p>';
        html += '</div>';
    }

    // --- Actions ---
    html += '<div class="levelup-actions">';
    html += '<button class="wizard-btn wizard-btn-primary" data-action="confirm-levelup">' + t('levelup.confirm') + '</button>';
    html += '<button class="wizard-btn wizard-btn-secondary" data-action="cancel-levelup">' + t('levelup.cancel') + '</button>';
    html += '</div>';

    html += '</div></div>';

    document.body.insertAdjacentHTML('beforeend', html);
    if (typeof lockBodyScroll === 'function') lockBodyScroll();

    // ---- Event bindings ----
    var modal = document.getElementById('levelup-modal');
    if (!modal) return;

    // Track ASI choice state
    var asiChoice = null;

    modal.addEventListener('click', function(e) {
        var tgt = e.target;

        // Close on overlay click
        if (tgt === modal) {
            modal.remove();
            if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
            return;
        }

        // Cancel
        if (tgt.dataset.action === 'cancel-levelup') {
            modal.remove();
            if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
            return;
        }

        // Manual HP roll
        if (tgt.dataset.action === 'levelup-roll-hp') {
            var rolled = Math.floor(Math.random() * hitDie) + 1;
            var rolledHP = rolled + conMod;
            var resultEl = document.getElementById('levelup-hp-result');
            var valueEl = document.getElementById('levelup-hp-value');
            if (resultEl) resultEl.textContent = t('levelup.hp.rolled') + ': ' + rolled + ' + CON ' + formatMod(conMod) + ' = ' + rolledHP + ' HP';
            if (valueEl) valueEl.value = rolledHP;
            tgt.textContent = t('levelup.hp.reroll');
            return;
        }

        // Subclass selection
        if (tgt.dataset.subclass) {
            var subChoices = modal.querySelectorAll('[data-subclass]');
            for (var sc = 0; sc < subChoices.length; sc++) {
                subChoices[sc].classList.remove('selected');
            }
            tgt.classList.add('selected');
            var subInput = document.getElementById('levelup-subclass-value');
            if (subInput) subInput.value = tgt.dataset.subclass;
            return;
        }

        // ASI mode selection
        if (tgt.dataset.action === 'levelup-asi') {
            var asiMode = tgt.dataset.asiMode;
            var asiBtns = modal.querySelectorAll('[data-action="levelup-asi"]');
            for (var ab = 0; ab < asiBtns.length; ab++) {
                asiBtns[ab].classList.remove('selected');
            }
            tgt.classList.add('selected');

            if (asiMode === 'feat') {
                renderLevelUpFeatPicker(modal, config, state, newLevel, function(choice) {
                    asiChoice = choice;
                });
            } else {
                renderLevelUpASIPicker(modal, config, state, newLevel, asiMode, function(choice) {
                    asiChoice = choice;
                });
            }
            return;
        }

        // Confirm level up
        if (tgt.dataset.action === 'confirm-levelup') {
            // Validate required choices
            if (needsSubclass) {
                var subVal = document.getElementById('levelup-subclass-value');
                if (!subVal || !subVal.value) {
                    showWarning(t('levelup.warn.subclass'));
                    return;
                }
            }
            if (isASI && !asiChoice) {
                showWarning(t('levelup.warn.asi'));
                return;
            }

            // Apply level up
            state.level = newLevel;

            // Apply subclass (note: this is stored in config, but since configs are defaults
            // we store it in state for custom chars; for default chars it's already set)
            if (needsSubclass) {
                var subValue = document.getElementById('levelup-subclass-value');
                if (subValue && subValue.value) {
                    config.subclass = subValue.value;
                    // Save updated config for custom chars
                    var customConfigKey = 'dw_charconfig_' + charId;
                    var existingConfig = localStorage.getItem(customConfigKey);
                    if (existingConfig) {
                        var parsedConfig = JSON.parse(existingConfig);
                        parsedConfig.subclass = subValue.value;
                        localStorage.setItem(customConfigKey, JSON.stringify(parsedConfig));
                    }
                }
            }

            // Apply ASI choice
            if (isASI && asiChoice) {
                if (!state.asiChoices) state.asiChoices = {};
                state.asiChoices[newLevel] = asiChoice;
            }

            // Increase current HP by the HP gain from leveling up
            var oldMaxHP = getHP(config, { level: newLevel - 1, asiChoices: state.asiChoices || {}, customAbilities: state.customAbilities });
            var newMaxHP = getHP(config, state);
            var hpGain = newMaxHP - oldMaxHP;
            if (hpGain > 0 && state.currentHP !== null) {
                state.currentHP = Math.min(newMaxHP, state.currentHP + hpGain);
            }

            saveCharState(charId, state);
            modal.remove();
            if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
            renderApp();
            return;
        }
    });
}

function ordinal(n) {
    if (n === 1) return '1st';
    if (n === 2) return '2nd';
    if (n === 3) return '3rd';
    return n + 'th';
}

function renderLevelUpASIPicker(modal, config, state, level, mode, onChoice) {
    var detailEl = document.getElementById('levelup-asi-detail');
    if (!detailEl) return;

    var abilities = getAllAbilityScores(config, state);
    var abNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    var abLabels = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

    var selected = {};
    var maxPoints = 2;
    var maxPerAbility = mode === 'asi-two' ? 2 : 1;

    function render() {
        var totalSpent = 0;
        var selKeys = Object.keys(selected);
        for (var sk = 0; sk < selKeys.length; sk++) totalSpent += selected[selKeys[sk]];

        var html = '<div class="asi-panel" style="margin-top:0.75rem;">';
        html += '<p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:0.5rem;">' + t('stats.asi.pointsleft') + ': ' + (maxPoints - totalSpent) + '</p>';
        html += '<div class="asi-ability-picker">';
        for (var i = 0; i < abNames.length; i++) {
            var ab = abNames[i];
            var current = abilities[ab];
            var added = selected[ab] || 0;
            var canAdd = (current + added) < 20 && added < maxPerAbility && totalSpent < maxPoints;
            html += '<div class="asi-ability-row">';
            html += '<span>' + abLabels[ab] + ' (' + current + (added > 0 ? ' +' + added : '') + ')</span>';
            html += '<button class="asi-ability-btn levelup-asi-add" data-ab="' + ab + '"' + (canAdd ? '' : ' disabled') + '>+1</button>';
            html += '</div>';
        }
        html += '</div>';
        if (totalSpent === maxPoints) {
            onChoice({ type: 'asi', abilities: Object.assign({}, selected) });
            html += '<p style="color:var(--accent);font-size:0.85rem;margin-top:0.5rem;">' + t('stats.asi.selected') + '</p>';
        }
        html += '</div>';
        detailEl.innerHTML = html;

        // Bind +1 buttons
        var addBtns = detailEl.querySelectorAll('.levelup-asi-add');
        for (var b = 0; b < addBtns.length; b++) {
            addBtns[b].addEventListener('click', function(e) {
                e.stopPropagation();
                var aab = this.dataset.ab;
                selected[aab] = (selected[aab] || 0) + 1;
                render();
            });
        }
    }

    render();
}

function renderLevelUpFeatPicker(modal, config, state, level, onChoice) {
    var detailEl = document.getElementById('levelup-asi-detail');
    if (!detailEl) return;

    var abilities = getAllAbilityScores(config, state);
    var feats = DATA.feats || [];

    // Collect already-chosen feats
    var chosenFeats = {};
    if (state.asiChoices) {
        for (var lvl in state.asiChoices) {
            var ch = state.asiChoices[lvl];
            if (ch && ch.type === 'feat' && ch.feat) chosenFeats[ch.feat] = true;
        }
    }

    var html = '<div class="feat-grid-full" style="margin-top:0.75rem;">';
    for (var i = 0; i < feats.length; i++) {
        var feat = feats[i];
        var meetsPrereq = checkPrerequisite(feat, abilities, config);
        var alreadyChosen = !feat.repeatable && chosenFeats[feat.name];
        html += '<div class="feat-card-full levelup-feat-pick' + (!meetsPrereq || alreadyChosen ? ' unavailable' : '') + '" data-feat="' + escapeAttr(feat.name) + '">';
        html += '<div class="feat-card-header">';
        html += '<h4>' + escapeHtml(feat.name) + (alreadyChosen ? ' <span style="font-size:0.7rem;opacity:0.6;">(already chosen)</span>' : '') + '</h4>';
        if (feat.prereq) {
            html += '<span class="feat-prereq-badge">' + escapeHtml(JSON.stringify(feat.prereq).replace(/[{}"]/g, '').replace(/:/g, ' ').replace(/,/g, ', ')) + '</span>';
        }
        html += '</div>';
        html += '<p class="feat-card-desc">' + escapeHtml(feat.desc) + '</p>';
        html += '</div>';
    }
    html += '</div>';
    detailEl.innerHTML = html;

    var cards = detailEl.querySelectorAll('.levelup-feat-pick:not(.unavailable)');
    for (var c = 0; c < cards.length; c++) {
        cards[c].addEventListener('click', function(e) {
            e.stopPropagation();
            // Deselect all
            var all = detailEl.querySelectorAll('.levelup-feat-pick');
            for (var a = 0; a < all.length; a++) all[a].classList.remove('selected');
            this.classList.add('selected');
            onChoice({ type: 'feat', feat: this.dataset.feat });
        });
    }
}

function showResetModal(charId, config, state) {
    var existing = document.getElementById('reset-modal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'reset-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal-box">' +
        '<h3>' + t('reset.title') + '</h3>' +
        '<p>' + t('reset.confirm') + '</p>' +
        '<div class="modal-actions">' +
        '<button class="modal-btn modal-btn-primary" data-modal-action="save-then-reset">' + t('reset.savethen') + '</button>' +
        '<button class="modal-btn modal-btn-danger" data-modal-action="confirm-reset">' + t('reset.doreset') + '</button>' +
        '<button class="modal-btn modal-btn-cancel" data-modal-action="cancel-reset">' + t('reset.cancel') + '</button>' +
        '</div></div>';
    document.body.appendChild(modal);
    if (typeof lockBodyScroll === 'function') lockBodyScroll();

    modal.addEventListener('click', function(e) {
        var action = e.target.dataset.modalAction;
        if (!action) {
            if (e.target === modal) { modal.remove(); if (typeof unlockBodyScroll === 'function') unlockBodyScroll(); }
            return;
        }
        if (action === 'save-then-reset') {
            exportCharacter(charId, state);
            performReset(charId);
            modal.remove(); if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
        } else if (action === 'confirm-reset') {
            performReset(charId);
            modal.remove(); if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
        } else if (action === 'cancel-reset') {
            modal.remove(); if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
        }
    });
}

function performReset(charId) {
    localStorage.removeItem('dw_char_' + charId);
    if (typeof syncRemove === 'function') syncRemove('dw_char_' + charId);
    // Also remove old key
    localStorage.removeItem('ashvane_' + charId);
    spellFilter = 'all';
    abilityEditMode = false;
    editAbilities = null;
    renderApp();
}

// ============================================================
// Section 26: ASI Sub-dialogs
// ============================================================

function showASIAbilityPicker(charId, config, state, level, mode) {
    var el = document.getElementById('asi-content');
    if (!el) return;

    var abilities = getAllAbilityScores(config, state);
    var abNames = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    var abLabels = { str: 'STR', dex: 'DEX', con: 'CON', int: 'INT', wis: 'WIS', cha: 'CHA' };

    var selected = {};
    var maxPoints = 2;
    var maxPerAbility = mode === 'asi-two' ? 2 : 1;

    function renderPicker() {
        var totalSpent = 0;
        var selKeys = Object.keys(selected);
        for (var sk = 0; sk < selKeys.length; sk++) totalSpent += selected[selKeys[sk]];

        var html = '<div class="asi-panel" data-asi-level="' + level + '">';
        html += '<h4>Level ' + level + ' \u2014 ' + (mode === 'asi-two' ? t('stats.asi.plus2') : t('stats.asi.split')) + '</h4>';
        html += '<p class="block-note">' + t('stats.asi.pointsleft') + ': ' + (maxPoints - totalSpent) + '</p>';
        html += '<div class="asi-ability-picker">';
        for (var i = 0; i < abNames.length; i++) {
            var ab = abNames[i];
            var current = abilities[ab];
            var added = selected[ab] || 0;
            var canAdd = (current + added) < 20 && added < maxPerAbility && totalSpent < maxPoints;
            html += '<div class="asi-ability-row">';
            html += '<span>' + abLabels[ab] + ' (' + current + (added > 0 ? ' +' + added : '') + ')</span>';
            html += '<button class="asi-ability-btn" data-ab="' + ab + '"' + (canAdd ? '' : ' disabled') + '>+1</button>';
            html += '</div>';
        }
        html += '</div>';
        html += '<div style="display:flex;gap:0.5rem;margin-top:0.75rem;">';
        html += '<button class="asi-option" data-action="asi-confirm"' + (totalSpent === maxPoints ? '' : ' disabled') + '>' + t('stats.asi.confirm') + '</button>';
        html += '<button class="asi-option asi-reset" data-action="asi-cancel">' + t('stats.asi.cancel') + '</button>';
        html += '</div></div>';

        var panel = el.querySelector('[data-asi-level="' + level + '"]');
        if (panel) {
            panel.outerHTML = html;
        } else {
            el.innerHTML = html;
        }

        var newPanel = el.querySelector('[data-asi-level="' + level + '"]');
        if (!newPanel) return;

        var btns = newPanel.querySelectorAll('.asi-ability-btn');
        for (var b = 0; b < btns.length; b++) {
            btns[b].addEventListener('click', function() {
                var aab = this.dataset.ab;
                selected[aab] = (selected[aab] || 0) + 1;
                renderPicker();
            });
        }

        var confirmBtn = newPanel.querySelector('[data-action="asi-confirm"]');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', function() {
                state.asiChoices[level] = { type: 'asi', abilities: Object.assign({}, selected) };
                saveCharState(charId, state);
                renderApp();
            });
        }

        var cancelBtn = newPanel.querySelector('[data-action="asi-cancel"]');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                renderApp();
            });
        }
    }

    renderPicker();
}

function showFeatPicker(charId, config, state, level) {
    var el = document.getElementById('asi-content');
    if (!el) return;

    var abilities = getAllAbilityScores(config, state);
    var feats = DATA.feats || [];

    // Collect already-chosen feats (non-repeatable)
    var chosenFeats = {};
    if (state.asiChoices) {
        for (var lvl in state.asiChoices) {
            var ch = state.asiChoices[lvl];
            if (ch && ch.type === 'feat' && ch.feat && parseInt(lvl) !== level) {
                chosenFeats[ch.feat] = true;
            }
        }
    }

    var html = '<div class="asi-panel" data-asi-level="' + level + '">';
    html += '<h4>Level ' + level + ' \u2014 ' + t('stats.asi.feat') + '</h4>';
    html += '<div class="feat-grid-full">';

    for (var i = 0; i < feats.length; i++) {
        var feat = feats[i];
        var meetsPrereq = checkPrerequisite(feat, abilities, config);
        var alreadyChosen = !feat.repeatable && chosenFeats[feat.name];
        html += '<div class="feat-card-full' + (!meetsPrereq || alreadyChosen ? ' unavailable' : '') + '" data-feat="' + escapeAttr(feat.name) + '">';
        html += '<div class="feat-card-header">';
        html += '<h4>' + escapeHtml(feat.name) + (alreadyChosen ? ' <span style="font-size:0.7rem;opacity:0.6;">(already chosen)</span>' : '') + '</h4>';
        if (feat.prereq) {
            html += '<span class="feat-prereq-badge">' + escapeHtml(JSON.stringify(feat.prereq).replace(/[{}"]/g, '').replace(/:/g, ' ').replace(/,/g, ', ')) + '</span>';
        }
        html += '</div>';
        html += '<p class="feat-card-desc">' + escapeHtml(feat.desc) + '</p>';
        html += '</div>';
    }

    html += '</div>';
    html += '<button class="asi-option asi-reset" data-action="feat-cancel" style="margin-top:0.75rem;">' + t('stats.asi.cancel') + '</button>';
    html += '</div>';

    var panel = el.querySelector('[data-asi-level="' + level + '"]');
    if (panel) {
        panel.outerHTML = html;
    } else {
        el.innerHTML = html;
    }

    var newPanel = el.querySelector('[data-asi-level="' + level + '"]');
    if (!newPanel) return;

    var cards = newPanel.querySelectorAll('.feat-card-full:not(.unavailable)');
    for (var c = 0; c < cards.length; c++) {
        cards[c].addEventListener('click', function() {
            state.asiChoices[level] = { type: 'feat', feat: this.dataset.feat };
            saveCharState(charId, state);
            renderApp();
        });
    }

    var cancelBtn = newPanel.querySelector('[data-action="feat-cancel"]');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            renderApp();
        });
    }
}

function checkPrerequisite(feat, abilities, config) {
    if (!feat.prereq) return true;

    // Object-style prereqs
    if (typeof feat.prereq === 'object') {
        var prereq = feat.prereq;
        if (prereq.dex && abilities.dex < prereq.dex) return false;
        if (prereq.str && abilities.str < prereq.str) return false;
        if (prereq.cha && abilities.cha < prereq.cha) return false;
        if (prereq.int && abilities.int < prereq.int) return false;
        if (prereq.wis && abilities.wis < prereq.wis) return false;
        if (prereq.con && abilities.con < prereq.con) return false;
        if (prereq.intOrWis && abilities.int < prereq.intOrWis && abilities.wis < prereq.intOrWis) return false;
        if (prereq.spellcasting) {
            if (!hasSpellcasting(config.className)) return false;
        }
        return true;
    }

    // String-style prereqs (legacy)
    var prereqStr = String(feat.prereq).toLowerCase();
    if (prereqStr.indexOf('spellcasting') !== -1 || prereqStr.indexOf('spell') !== -1) {
        if (!hasSpellcasting(config.className)) return false;
    }

    var abKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    for (var a = 0; a < abKeys.length; a++) {
        var pattern = new RegExp(abKeys[a] + '\\s+(\\d+)', 'i');
        var match = prereqStr.match(pattern);
        if (match && abilities[abKeys[a]] < parseInt(match[1])) return false;
    }

    return true;
}

// ============================================================
// Section 27: Spell / Cantrip / Metamagic Toggle Functions
// ============================================================

function toggleCantrip(charId, config, state, spellName) {
    var idx = state.cantrips.indexOf(spellName);
    if (idx >= 0) {
        state.cantrips.splice(idx, 1);
    } else {
        var maxCantrips = getMaxCantrips(state.level, config.className);
        if (state.cantrips.length >= maxCantrips) {
            showWarning(t('warn.maxcantrips') + ' (' + maxCantrips + '). ' + t('warn.maxcantrips.remove'));
            return;
        }
        state.cantrips.push(spellName);
    }
    saveCharState(charId, state);
    renderApp();
}

function togglePrepared(charId, config, state, spellName) {
    var idx = state.prepared.indexOf(spellName);
    if (idx >= 0) {
        state.prepared.splice(idx, 1);
    } else {
        var spellAbility = getSpellcastingAbility(config.className);
        var abilityMod = getMod(getAbilityScore(config, state, spellAbility));
        var maxPrepared = getMaxPrepared(state, abilityMod, config.className);
        if (state.prepared.length >= maxPrepared) {
            var label = (config.className === 'ranger' || config.className === 'warlock') ? 'bekende' : 'voorbereide';
            showWarning(t('warn.maxcantrips') + ' (' + maxPrepared + '). ' + t('warn.maxcantrips.remove'));
            return;
        }
        state.prepared.push(spellName);
    }
    saveCharState(charId, state);
    renderApp();
}

function toggleMetamagic(charId, config, state, mmName) {
    var idx = state.metamagic.indexOf(mmName);
    if (idx >= 0) {
        state.metamagic.splice(idx, 1);
    } else {
        var maxChoices = 0;
        if (state.level >= 2) maxChoices = 2;
        if (state.level >= 10) maxChoices = 3;
        if (state.level >= 17) maxChoices = 4;
        if (state.metamagic.length >= maxChoices) {
            showWarning(t('warn.maxmetamagic') + ' (' + maxChoices + ').');
            return;
        }
        state.metamagic.push(mmName);
    }
    saveCharState(charId, state);
    renderApp();
}

function cleanupLevelDown(config, state) {
    var lvl = state.level;
    delete state.asiChoices[lvl];

    if (hasSpellcasting(config.className)) {
        var cn = config.className;
        var newMaxCantrips = getMaxCantrips(lvl - 1, cn);
        while (state.cantrips.length > newMaxCantrips) {
            state.cantrips.pop();
        }

        var spAbility = getSpellcastingAbility(cn);
        var abMod = getMod(getAbilityScore(config, state, spAbility));
        var newMaxPrepared = getMaxPrepared({ level: lvl - 1 }, abMod, cn);
        while (state.prepared.length > newMaxPrepared) {
            state.prepared.pop();
        }

        // Sorcerer-specific metamagic cleanup
        if (cn === 'sorcerer') {
            if (lvl - 1 < 2) state.metamagic = [];
            var maxMM = 0;
            if (lvl - 1 >= 2) maxMM = 2;
            if (lvl - 1 >= 10) maxMM = 3;
            if (lvl - 1 >= 17) maxMM = 4;
            while (state.metamagic.length > maxMM) {
                state.metamagic.pop();
            }
        }
    }

    if (config.className === 'rogue') {
        var expertiseLevels = (DATA.rogue && DATA.rogue.expertiseLevels) ? DATA.rogue.expertiseLevels : [1, 6];
        if (expertiseLevels.indexOf(lvl) !== -1) {
            var prevCount = 0;
            for (var el2 = 0; el2 < expertiseLevels.length; el2++) {
                if (expertiseLevels[el2] < lvl) prevCount++;
            }
            prevCount *= 2;
            while (state.expertise.length > prevCount) {
                state.expertise.pop();
            }
        }
    }
}

// ============================================================
// Section 28: Warning System
// ============================================================

function showWarning(message) {
    var warning = document.getElementById('spell-warning');
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
    warning._timeout = setTimeout(function() {
        warning.style.opacity = '0';
    }, 2500);
}


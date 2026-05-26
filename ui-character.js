// D&D Within — Character Sheet (tabs, level-up, ASI, spell toggles)
// Requires: core.js

// ============================================================
// Section 13: Character Sheet
// ============================================================

// Empty canvas — old tab/widget dashboard removed. New dashboard will be
// built inside .character-page. The wrapper, char-id and accent CSS variable
// stay because other systems (events, theming) key off them.
function renderCharacterSheet(charId) {
    var config = loadCharConfig(charId);
    if (!config) {
        return '<div class="page-placeholder"><h2>' + t('char.notfound') + '</h2></div>';
    }
    var accent = config.accentColor || 'var(--accent)';
    return '<div class="character-page" data-char-id="' + charId + '" style="--char-accent:' + accent + '"></div>';
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
        if (prereq.strOrDex && abilities.str < prereq.strOrDex && abilities.dex < prereq.strOrDex) return false;
        if (prereq.strOrCha && abilities.str < prereq.strOrCha && abilities.cha < prereq.strOrCha) return false;
        if (prereq.dexOrCha && abilities.dex < prereq.dexOrCha && abilities.cha < prereq.dexOrCha) return false;
        if (prereq.intWisOrCha && abilities.int < prereq.intWisOrCha && abilities.wis < prereq.intWisOrCha && abilities.cha < prereq.intWisOrCha) return false;
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
    if (!Array.isArray(state.cantrips)) state.cantrips = state.cantrips ? Object.values(state.cantrips) : [];
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
    if (!Array.isArray(state.prepared)) state.prepared = state.prepared ? Object.values(state.prepared) : [];
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


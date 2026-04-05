// D&D Within — Modals (profile, character creation wizard)
// Requires: core.js

// ============================================================
// Section 32a: Profile / Credentials Modal
// ============================================================

function renderProfileModal() {
    var uid = currentUserId();
    var u = getUserData(uid);
    if (!u) return '';

    var html = '<div class="modal-overlay" data-action="close-profile-modal">';
    html += '<div class="modal-card modal-profile" onclick="event.stopPropagation();">';
    html += '<div class="modal-header">';
    html += '<h2>Profiel Instellingen</h2>';
    html += '<button class="modal-close" data-action="close-profile-modal">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body">';
    html += '<div class="login-field">';
    html += '<label class="login-label">Gebruikersnaam</label>';
    html += '<input type="text" class="login-input" value="' + escapeAttr(uid) + '" disabled style="opacity:0.5;">';
    html += '</div>';
    html += '<div class="login-field">';
    html += '<label class="login-label">Weergavenaam</label>';
    html += '<input type="text" class="login-input" id="profile-display-name" value="' + escapeAttr(u.name) + '" placeholder="Weergavenaam">';
    html += '</div>';
    html += '<div class="login-field">';
    html += '<label class="login-label">Huidig wachtwoord</label>';
    html += '<input type="password" class="login-input" id="profile-current-password" placeholder="Vereist bij wachtwoord wijziging">';
    html += '</div>';
    html += '<div class="login-field">';
    html += '<label class="login-label">Nieuw wachtwoord</label>';
    html += '<input type="password" class="login-input" id="profile-new-password" placeholder="Laat leeg om niet te wijzigen">';
    html += '</div>';
    html += '<div class="login-field">';
    html += '<label class="login-label">Bevestig wachtwoord</label>';
    html += '<input type="password" class="login-input" id="profile-confirm-password" placeholder="Bevestig nieuw wachtwoord">';
    html += '</div>';
    html += '<div class="login-field bug-debug-toggle">';
    html += '<label class="login-label">Debug Mode</label>';
    html += '<label class="toggle-switch"><input type="checkbox" id="profile-debug-mode"' + (isDebugMode() ? ' checked' : '') + '><span class="toggle-slider"></span></label>';
    html += '<small class="bug-debug-hint">Toont de bug reporter knop</small>';
    html += '</div>';
    html += '<p class="login-error" id="profile-error" style="display:none;"></p>';
    html += '<p class="profile-success" id="profile-success" style="display:none;">Opgeslagen!</p>';
    html += '<button class="login-submit" data-action="save-profile">Opslaan</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
}

function openProfileModal() {
    var existing = document.querySelector('.modal-overlay.profile-modal-active');
    if (existing) { existing.remove(); return; }

    var div = document.createElement('div');
    div.className = 'profile-modal-active';
    div.innerHTML = renderProfileModal();
    document.body.appendChild(div);
    lockBodyScroll();
}

function closeProfileModal() {
    var el = document.querySelector('.profile-modal-active');
    if (el) el.remove();
    unlockBodyScroll();
}

function handleSaveProfile() {
    var uid = currentUserId();
    var u = getUserData(uid);
    if (!u) return;

    var nameEl = document.getElementById('profile-display-name');
    var currentPassEl = document.getElementById('profile-current-password');
    var passEl = document.getElementById('profile-new-password');
    var confirmEl = document.getElementById('profile-confirm-password');
    var errorEl = document.getElementById('profile-error');
    var successEl = document.getElementById('profile-success');

    var newName = nameEl ? nameEl.value.trim() : '';
    var currentPass = currentPassEl ? currentPassEl.value : '';
    var newPass = passEl ? passEl.value : '';
    var confirmPass = confirmEl ? confirmEl.value : '';

    if (errorEl) { errorEl.style.display = 'none'; }
    if (successEl) { successEl.style.display = 'none'; }

    if (!newName) {
        if (errorEl) { errorEl.textContent = 'Weergavenaam mag niet leeg zijn.'; errorEl.style.display = 'block'; }
        return;
    }

    if (newPass) {
        if (!currentPass) {
            if (errorEl) { errorEl.textContent = 'Voer je huidige wachtwoord in om je wachtwoord te wijzigen.'; errorEl.style.display = 'block'; }
            return;
        }
        if (u.password !== currentPass) {
            if (errorEl) { errorEl.textContent = 'Huidig wachtwoord is onjuist.'; errorEl.style.display = 'block'; }
            return;
        }
        if (newPass !== confirmPass) {
            if (errorEl) { errorEl.textContent = 'Wachtwoorden komen niet overeen.'; errorEl.style.display = 'block'; }
            return;
        }
    }

    // Update the user data
    if (!usersCache) usersCache = {};
    if (!usersCache[uid]) usersCache[uid] = JSON.parse(JSON.stringify(u));

    usersCache[uid].name = newName;
    if (newPass) usersCache[uid].password = newPass;

    // Save debug mode
    var debugEl = document.getElementById('profile-debug-mode');
    if (debugEl) setDebugMode(debugEl.checked);

    // Save to Firebase
    if (typeof syncSaveUser === 'function') syncSaveUser(uid, usersCache[uid]);

    // Cache locally
    localStorage.setItem('dw_users', JSON.stringify(usersCache));

    if (successEl) { successEl.style.display = 'block'; }
    showToast('Profiel opgeslagen!', 'success');

    // Re-render navbar to show updated name
    setTimeout(function() { closeProfileModal(); renderApp(); }, 800);
}

// ============================================================
// Section 32b: Character Creation Wizard
// ============================================================

var wizardState = null;

function initWizardState() {
    wizardState = {
        step: 1,
        name: '',
        race: '',
        className: '',
        background: '',
        baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        bgBonusChoice: { plus2: '', plus1: '' },
        subclass: '',
        alignment: 'True Neutral',
        age: '',
        accentColor: '#22d3ee',
        skills: [],
        cantrips: [],
        appearance: '',
        personality: { traits: '', ideal: '', bond: '', flaw: '' },
        backstory: ''
    };
}

function getWizardRaces() {
    var raceKeys = ['human', 'halfling', 'tiefling', 'aasimar', 'woodElf', 'dwarf', 'gnome', 'goliath', 'orc', 'dragonborn'];
    return raceKeys.filter(function(r) { return DATA[r] && !DATA[r].legacy; });
}

function getWizardClasses() {
    var classKeys = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
    return classKeys.filter(function(c) { return DATA[c] && DATA[c].hitDie; });
}

function getWizardBackgrounds() {
    var bgs = DATA.backgrounds;
    if (!bgs) return [];
    return Object.keys(bgs).filter(function(b) { return !bgs[b].legacy; });
}

function getWizardSubclasses(className) {
    var classData = DATA[className];
    if (!classData || !classData.subclasses) return [];
    return Object.keys(classData.subclasses).filter(function(s) {
        return !classData.subclasses[s].legacy;
    });
}

function renderWizardModal() {
    if (!wizardState) return '';
    var step = wizardState.step;
    var totalSteps = 6;

    var html = '<div class="modal-overlay wizard-overlay">';
    html += '<div class="wizard-modal">';

    // Header with progress
    html += '<div class="wizard-header">';
    html += '<h2 class="wizard-title">' + t('wizard.title') + '</h2>';
    html += '<button class="modal-close" data-action="close-wizard">&times;</button>';
    html += '</div>';

    // Step indicator
    html += '<div class="wizard-steps">';
    var stepLabels = [t('wizard.step.basics'), t('wizard.step.background'), t('wizard.step.details'), t('wizard.step.skills'), t('wizard.step.story'), t('wizard.step.summary')];
    for (var si = 1; si <= totalSteps; si++) {
        var stepClass = 'wizard-step-dot';
        if (si < step) stepClass += ' completed';
        if (si === step) stepClass += ' active';
        html += '<div class="' + stepClass + '"><span class="step-num">' + (si < step ? '&#10003;' : si) + '</span><span class="step-label">' + stepLabels[si - 1] + '</span></div>';
        if (si < totalSteps) html += '<div class="step-connector' + (si < step ? ' completed' : '') + '"></div>';
    }
    html += '</div>';

    // Two-panel layout: main content + sidebar summary
    html += '<div class="wizard-body">';

    // Main content
    html += '<div class="wizard-content">';
    if (step === 1) html += renderWizardStep1();
    else if (step === 2) html += renderWizardStep2();
    else if (step === 3) html += renderWizardStep3();
    else if (step === 4) html += renderWizardStep4();
    else if (step === 5) html += renderWizardStep5();
    else if (step === 6) html += renderWizardStep6();
    html += '</div>';

    // Persistent sidebar with live character summary
    html += '<div class="wizard-sidebar">';
    html += '<div class="wizard-sidebar-title">' + t('wizard.step.summary') + '</div>';
    var sidebarColor = wizardState.accentColor || 'var(--accent)';
    html += '<div class="wizard-sidebar-portrait" style="border-color:' + sidebarColor + '"><span style="font-size:2rem;opacity:0.3;">&#128100;</span></div>';
    html += '<div class="wizard-sidebar-name" style="color:' + sidebarColor + '">' + escapeHtml(wizardState.name || '???') + '</div>';
    if (wizardState.race) html += '<div class="wizard-sidebar-detail">' + raceDisplayName(wizardState.race) + '</div>';
    if (wizardState.className) html += '<div class="wizard-sidebar-detail">' + classDisplayName(wizardState.className) + '</div>';
    if (wizardState.subclass) html += '<div class="wizard-sidebar-detail" style="color:var(--text-dim);font-size:0.7rem;">' + subclassDisplayName(wizardState.subclass) + '</div>';
    if (wizardState.background && DATA.backgrounds[wizardState.background]) html += '<div class="wizard-sidebar-detail">' + DATA.backgrounds[wizardState.background].name + '</div>';
    // Ability scores mini display
    var abs = ['str','dex','con','int','wis','cha'];
    html += '<div class="wizard-sidebar-abilities">';
    for (var ai = 0; ai < abs.length; ai++) {
        html += '<div class="wizard-sidebar-ab"><span class="wizard-sidebar-ab-label">' + abs[ai].toUpperCase() + '</span><span class="wizard-sidebar-ab-val">' + wizardState.baseAbilities[abs[ai]] + '</span></div>';
    }
    html += '</div>';
    if (wizardState.skills.length > 0) {
        html += '<div class="wizard-sidebar-section"><span class="wizard-sidebar-section-title">Skills</span>';
        for (var si2 = 0; si2 < wizardState.skills.length; si2++) {
            html += '<span class="wizard-sidebar-tag">' + capitalize(wizardState.skills[si2]) + '</span>';
        }
        html += '</div>';
    }
    html += '</div>';

    html += '</div>'; // wizard-body

    // Navigation buttons
    html += '<div class="wizard-nav">';
    if (step > 1) {
        html += '<button class="btn btn-ghost" data-action="wizard-prev">&larr; ' + t('wizard.prev') + '</button>';
    } else {
        html += '<div></div>';
    }
    if (step < totalSteps) {
        html += '<button class="btn btn-primary" data-action="wizard-next">' + t('wizard.next') + ' &rarr;</button>';
    } else {
        html += '<button class="btn btn-primary" data-action="wizard-create">' + t('wizard.create') + '</button>';
    }
    html += '</div>';

    html += '</div>';
    html += '</div>';
    return html;
}

function renderWizardStep1() {
    var html = '<h3 class="wizard-step-title">' + t('wizard.step.basics') + '</h3>';

    // Character name
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">' + t('wizard.name.label') + '</label>';
    html += '<input type="text" class="wizard-input" id="wizard-name" value="' + escapeAttr(wizardState.name) + '" placeholder="' + t('wizard.name.plh') + '">';
    html += '</div>';

    // Race
    var races = getWizardRaces();
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">' + t('wizard.race.label') + '</label>';
    html += '<select class="wizard-select" id="wizard-race" data-action="wizard-race-change">';
    html += '<option value="">' + t('wizard.race.default') + '</option>';
    for (var i = 0; i < races.length; i++) {
        var sel = wizardState.race === races[i] ? ' selected' : '';
        html += '<option value="' + races[i] + '"' + sel + '>' + raceDisplayName(races[i]) + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // Race features preview (collapsible)
    if (wizardState.race && DATA[wizardState.race]) {
        var raceData = DATA[wizardState.race];
        html += '<details class="wizard-preview" open>';
        html += '<summary>' + raceDisplayName(wizardState.race) + ' Features</summary>';
        if (raceData.speed) html += '<p class="wizard-detail"><strong>Speed:</strong> ' + raceData.speed + 'ft</p>';
        if (raceData.darkvision) html += '<p class="wizard-detail"><strong>Darkvision:</strong> ' + raceData.darkvision + 'ft</p>';
        if (raceData.features) {
            for (var fi = 0; fi < raceData.features.length; fi++) {
                html += '<p class="wizard-detail"><strong>' + escapeHtml(raceData.features[fi].name) + ':</strong> ' + escapeHtml(raceData.features[fi].desc) + '</p>';
            }
        }
        html += '</details>';
    }

    // Class
    var classes = getWizardClasses();
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">' + t('wizard.class.label') + '</label>';
    html += '<select class="wizard-select" id="wizard-class" data-action="wizard-class-change">';
    html += '<option value="">' + t('wizard.class.default') + '</option>';
    for (var i = 0; i < classes.length; i++) {
        var sel = wizardState.className === classes[i] ? ' selected' : '';
        html += '<option value="' + classes[i] + '"' + sel + '>' + classDisplayName(classes[i]) + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // Class info preview (collapsible)
    if (wizardState.className && DATA[wizardState.className]) {
        var classData = DATA[wizardState.className];
        html += '<details class="wizard-preview" open>';
        html += '<summary>' + classDisplayName(wizardState.className) + ' Info</summary>';
        html += '<p class="wizard-detail"><strong>Hit Die:</strong> d' + classData.hitDie + '</p>';
        html += '<p class="wizard-detail"><strong>Saving Throws:</strong> ' + classData.savingThrows.map(function(s) { return s.toUpperCase(); }).join(', ') + '</p>';
        if (classData.cantripsKnown) {
            html += '<p class="wizard-detail"><strong>Spellcasting:</strong> ' + t('generic.yes') + ' (cantrips: ' + classData.cantripsKnown[1] + ')</p>';
        } else {
            html += '<p class="wizard-detail"><strong>Spellcasting:</strong> ' + t('generic.no') + '</p>';
        }
        html += '</details>';
    }

    return html;
}

function renderWizardStep2() {
    var html = '<h3 class="wizard-step-title">' + t('wizard.step.background') + '</h3>';

    // Background
    var bgs = getWizardBackgrounds();
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">' + t('wizard.bg.label') + '</label>';
    html += '<select class="wizard-select" id="wizard-background" data-action="wizard-bg-change">';
    html += '<option value="">' + t('wizard.bg.default') + '</option>';
    for (var i = 0; i < bgs.length; i++) {
        var bgData = DATA.backgrounds[bgs[i]];
        var sel = wizardState.background === bgs[i] ? ' selected' : '';
        html += '<option value="' + bgs[i] + '"' + sel + '>' + bgData.name + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // Background info (collapsible)
    if (wizardState.background && DATA.backgrounds[wizardState.background]) {
        var bg = DATA.backgrounds[wizardState.background];
        html += '<details class="wizard-preview" open>';
        html += '<summary>' + bg.name + '</summary>';
        html += '<p class="wizard-detail">' + escapeHtml(bg.desc) + '</p>';
        html += '<p class="wizard-detail"><strong>Skills:</strong> ' + bg.skills.join(', ') + '</p>';
        html += '<p class="wizard-detail"><strong>Tool:</strong> ' + bg.tool + '</p>';
        html += '<p class="wizard-detail"><strong>Feat:</strong> ' + bg.feat + '</p>';
        html += '<p class="wizard-detail"><strong>Ability Scores:</strong> ' + bg.abilityScores.join(', ') + ' (+2 en +1 verdeeld)</p>';

        // Background bonus distribution
        html += '<div class="wizard-bg-bonus">';
        html += '<label class="wizard-label">Verdeel bonussen (+2 en +1):</label>';
        html += '<div class="wizard-bonus-row">';
        for (var bi = 0; bi < bg.abilityScores.length; bi++) {
            var ab = bg.abilityScores[bi];
            var isPlus2 = wizardState.bgBonusChoice.plus2 === ab;
            var isPlus1 = wizardState.bgBonusChoice.plus1 === ab;
            html += '<div class="wizard-bonus-item">';
            html += '<span class="wizard-bonus-label">' + ab + '</span>';
            html += '<select class="wizard-select wizard-select-sm" data-action="wizard-bonus-change" data-ability="' + ab + '">';
            html += '<option value=""' + (!isPlus2 && !isPlus1 ? ' selected' : '') + '>--</option>';
            html += '<option value="2"' + (isPlus2 ? ' selected' : '') + '>+2</option>';
            html += '<option value="1"' + (isPlus1 ? ' selected' : '') + '>+1</option>';
            html += '</select>';
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';
        html += '</details>';
    }

    // Ability Scores
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Ability Scores (basis)</label>';
    html += '<div class="wizard-abilities">';
    var abs = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    for (var i = 0; i < abs.length; i++) {
        var ab = abs[i];
        html += '<div class="wizard-ability">';
        html += '<label>' + ab.toUpperCase() + '</label>';
        html += '<input type="number" class="wizard-input wizard-input-sm" data-action="wizard-ability" data-ability="' + ab + '" value="' + wizardState.baseAbilities[ab] + '" min="3" max="20">';
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    return html;
}

function renderWizardStep3() {
    var html = '<h3 class="wizard-step-title">' + t('wizard.step.details') + '</h3>';

    // Subclass
    if (wizardState.className) {
        var subclasses = getWizardSubclasses(wizardState.className);
        if (subclasses.length > 0) {
            html += '<div class="wizard-field">';
            html += '<label class="wizard-label">Subclass</label>';
            html += '<select class="wizard-select" id="wizard-subclass">';
            html += '<option value="">' + t('wizard.subclass.default') + '</option>';
            for (var i = 0; i < subclasses.length; i++) {
                var subData = DATA[wizardState.className].subclasses[subclasses[i]];
                var sel = wizardState.subclass === subclasses[i] ? ' selected' : '';
                html += '<option value="' + subclasses[i] + '"' + sel + '>' + (subData.name || subclassDisplayName(subclasses[i])) + '</option>';
            }
            html += '</select>';
            html += '</div>';
        }
    }

    // Alignment
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Alignment</label>';
    var alignments = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
    html += '<select class="wizard-select" id="wizard-alignment">';
    for (var i = 0; i < alignments.length; i++) {
        var sel = wizardState.alignment === alignments[i] ? ' selected' : '';
        html += '<option value="' + alignments[i] + '"' + sel + '>' + alignments[i] + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // Age
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">' + t('wizard.age.label') + '</label>';
    html += '<input type="number" class="wizard-input wizard-input-sm" id="wizard-age" value="' + (wizardState.age || '') + '" min="1" max="999" placeholder="' + t('wizard.age.label') + '">';
    html += '</div>';

    // Accent Color
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">' + t('wizard.accentcolor') + '</label>';
    html += '<div class="wizard-colors">';
    for (var ci = 0; ci < COLOR_THEMES.length; ci++) {
        var theme = COLOR_THEMES[ci];
        var selClass = wizardState.accentColor === theme.accent ? ' selected' : '';
        html += '<span class="color-option' + selClass + '" data-action="wizard-color" data-color="' + theme.accent + '" style="background:' + theme.accent + ';" title="' + theme.name + '"></span>';
    }
    html += '</div>';
    html += '</div>';

    return html;
}

function renderWizardStep4() {
    var html = '<h3 class="wizard-step-title">' + t('wizard.step.skills') + '</h3>';

    if (!wizardState.className || !DATA[wizardState.className]) {
        html += '<p class="wizard-detail">' + t('wizard.skills.noclass') + '</p>';
        return html;
    }

    var classData = DATA[wizardState.className];
    var skillOpts = classData.skillOptions || [];
    var skillCount = classData.skillCount || 2;

    // All skills list for "any"
    var allSkills = ["acrobatics", "animal handling", "arcana", "athletics", "deception", "history", "insight", "intimidation", "investigation", "medicine", "nature", "perception", "performance", "persuasion", "religion", "sleight of hand", "stealth", "survival"];

    var availableSkills = skillOpts.indexOf("any") !== -1 ? allSkills : skillOpts;

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Kies ' + skillCount + ' vaardigheden:</label>';
    html += '<div class="wizard-skill-grid">';
    for (var i = 0; i < availableSkills.length; i++) {
        var sk = availableSkills[i];
        var checked = wizardState.skills.indexOf(sk) !== -1;
        var disabled = !checked && wizardState.skills.length >= skillCount;
        html += '<label class="wizard-skill-item' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '">';
        html += '<input type="checkbox" data-action="wizard-skill" data-skill="' + sk + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '>';
        html += '<span>' + capitalize(sk) + '</span>';
        html += '</label>';
    }
    html += '</div>';
    html += '</div>';

    // Cantrips for spellcasters
    if (classData.cantripsKnown && classData.cantripsKnown[1] > 0) {
        var cantripsCount = classData.cantripsKnown[1];
        var spellData = getSpellsForLevel(wizardState.className, 0);
        if (spellData && spellData.length > 0) {
            html += '<div class="wizard-field">';
            html += '<label class="wizard-label">Kies ' + cantripsCount + ' cantrips:</label>';
            html += '<div class="wizard-skill-grid">';
            for (var i = 0; i < spellData.length; i++) {
                var sp = spellData[i];
                var checked = wizardState.cantrips.indexOf(sp.name) !== -1;
                var disabled = !checked && wizardState.cantrips.length >= cantripsCount;
                html += '<label class="wizard-skill-item' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '">';
                html += '<input type="checkbox" data-action="wizard-cantrip" data-cantrip="' + escapeAttr(sp.name) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '>';
                html += '<span>' + escapeHtml(sp.name) + '</span>';
                html += '</label>';
            }
            html += '</div>';
            html += '</div>';
        }
    }

    return html;
}

function renderWizardStep5() {
    var html = '<h3 class="wizard-step-title">' + t('wizard.step.story') + '</h3>';

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">' + t('wizard.appearance.label') + '</label>';
    html += '<textarea class="wizard-textarea" id="wizard-appearance" placeholder="' + t('wizard.appearance.plh') + '">' + escapeHtml(wizardState.appearance) + '</textarea>';
    html += '</div>';

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Persoonlijkheidskenmerken</label>';
    html += '<textarea class="wizard-textarea wizard-textarea-sm" id="wizard-traits" placeholder="Traits...">' + escapeHtml(wizardState.personality.traits) + '</textarea>';
    html += '</div>';

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Ideaal</label>';
    html += '<textarea class="wizard-textarea wizard-textarea-sm" id="wizard-ideal" placeholder="Ideal...">' + escapeHtml(wizardState.personality.ideal) + '</textarea>';
    html += '</div>';

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Band</label>';
    html += '<textarea class="wizard-textarea wizard-textarea-sm" id="wizard-bond" placeholder="Bond...">' + escapeHtml(wizardState.personality.bond) + '</textarea>';
    html += '</div>';

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Zwakheid</label>';
    html += '<textarea class="wizard-textarea wizard-textarea-sm" id="wizard-flaw" placeholder="Flaw...">' + escapeHtml(wizardState.personality.flaw) + '</textarea>';
    html += '</div>';

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">' + t('wizard.backstory.label') + '</label>';
    html += '<textarea class="wizard-textarea wizard-textarea-lg" id="wizard-backstory" placeholder="' + t('wizard.backstory.plh') + '">' + escapeHtml(wizardState.backstory) + '</textarea>';
    html += '</div>';

    return html;
}

function renderWizardStep6() {
    var html = '<h3 class="wizard-step-title">' + t('wizard.step.summary') + '</h3>';

    html += '<div class="wizard-summary">';

    // Name & basics
    html += '<div class="wizard-summary-section">';
    html += '<h4>Basisgegevens</h4>';
    html += '<p><strong>' + t('wizard.summary.name') + '</strong> ' + escapeHtml(wizardState.name || t('wizard.empty')) + '</p>';
    html += '<p><strong>' + t('wizard.summary.race') + '</strong> ' + (wizardState.race ? raceDisplayName(wizardState.race) : t('wizard.notchosen')) + '</p>';
    html += '<p><strong>' + t('wizard.summary.class') + '</strong> ' + (wizardState.className ? classDisplayName(wizardState.className) : t('wizard.notchosen')) + '</p>';
    html += '</div>';

    // Background
    html += '<div class="wizard-summary-section">';
    html += '<h4>Achtergrond</h4>';
    var bgName = wizardState.background && DATA.backgrounds[wizardState.background] ? DATA.backgrounds[wizardState.background].name : t('wizard.notchosen');
    html += '<p><strong>Achtergrond:</strong> ' + bgName + '</p>';

    // Ability scores with bonuses
    var abs = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    var bgBonuses = calcBgBonuses();
    html += '<p><strong>Ability Scores:</strong></p>';
    html += '<div class="wizard-abilities wizard-abilities-summary">';
    for (var i = 0; i < abs.length; i++) {
        var ab = abs[i];
        var base = wizardState.baseAbilities[ab];
        var bonus = bgBonuses[ab] || 0;
        var total = base + bonus;
        html += '<div class="wizard-ability">';
        html += '<label>' + ab.toUpperCase() + '</label>';
        html += '<span class="wizard-ability-total">' + total + '</span>';
        if (bonus > 0) html += '<span class="wizard-ability-bonus">(+' + bonus + ')</span>';
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    // Details
    html += '<div class="wizard-summary-section">';
    html += '<h4>Details</h4>';
    if (wizardState.subclass) html += '<p><strong>Subclass:</strong> ' + subclassDisplayName(wizardState.subclass) + '</p>';
    html += '<p><strong>Alignment:</strong> ' + wizardState.alignment + '</p>';
    if (wizardState.age) html += '<p><strong>Leeftijd:</strong> ' + wizardState.age + '</p>';
    html += '</div>';

    // Skills
    if (wizardState.skills.length > 0) {
        html += '<div class="wizard-summary-section">';
        html += '<h4>Vaardigheden</h4>';
        html += '<p>' + wizardState.skills.map(function(s) { return capitalize(s); }).join(', ') + '</p>';
        html += '</div>';
    }

    // Cantrips
    if (wizardState.cantrips.length > 0) {
        html += '<div class="wizard-summary-section">';
        html += '<h4>Cantrips</h4>';
        html += '<p>' + wizardState.cantrips.join(', ') + '</p>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function calcBgBonuses() {
    var bonuses = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
    if (wizardState.bgBonusChoice.plus2) {
        var ab2 = wizardState.bgBonusChoice.plus2.toLowerCase();
        if (bonuses.hasOwnProperty(ab2)) bonuses[ab2] = 2;
    }
    if (wizardState.bgBonusChoice.plus1) {
        var ab1 = wizardState.bgBonusChoice.plus1.toLowerCase();
        if (bonuses.hasOwnProperty(ab1)) bonuses[ab1] = 1;
    }
    return bonuses;
}

function saveWizardStepData() {
    var step = wizardState.step;
    if (step === 1) {
        var nameEl = document.getElementById('wizard-name');
        var raceEl = document.getElementById('wizard-race');
        var classEl = document.getElementById('wizard-class');
        if (nameEl) wizardState.name = nameEl.value.trim();
        if (raceEl) wizardState.race = raceEl.value;
        if (classEl) {
            var newClass = classEl.value;
            if (newClass !== wizardState.className) {
                wizardState.className = newClass;
                wizardState.skills = [];
                wizardState.cantrips = [];
                wizardState.subclass = '';
            }
        }
    } else if (step === 2) {
        var bgEl = document.getElementById('wizard-background');
        if (bgEl) wizardState.background = bgEl.value;
        // Ability scores saved via change events
    } else if (step === 3) {
        var subEl = document.getElementById('wizard-subclass');
        var alignEl = document.getElementById('wizard-alignment');
        var ageEl = document.getElementById('wizard-age');
        if (subEl) wizardState.subclass = subEl.value;
        if (alignEl) wizardState.alignment = alignEl.value;
        if (ageEl) wizardState.age = ageEl.value ? parseInt(ageEl.value) : '';
    } else if (step === 5) {
        var appEl = document.getElementById('wizard-appearance');
        var traitsEl = document.getElementById('wizard-traits');
        var idealEl = document.getElementById('wizard-ideal');
        var bondEl = document.getElementById('wizard-bond');
        var flawEl = document.getElementById('wizard-flaw');
        var backstoryEl = document.getElementById('wizard-backstory');
        if (appEl) wizardState.appearance = appEl.value;
        if (traitsEl) wizardState.personality.traits = traitsEl.value;
        if (idealEl) wizardState.personality.ideal = idealEl.value;
        if (bondEl) wizardState.personality.bond = bondEl.value;
        if (flawEl) wizardState.personality.flaw = flawEl.value;
        if (backstoryEl) wizardState.backstory = backstoryEl.value;
    }
}

function generateCharId(name) {
    if (!name) return 'char_' + Date.now();
    var id = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
    // Avoid collisions
    if (loadCharConfig(id)) {
        id = id + '_' + Math.random().toString(36).substring(2, 6);
    }
    return id || 'char_' + Date.now();
}

function createCharacterFromWizard() {
    if (!wizardState.name || !wizardState.race || !wizardState.className) {
        showToast(t('wizard.error.step1'), 'error');
        return false;
    }

    var charId = generateCharId(wizardState.name);
    var bgBonuses = calcBgBonuses();

    var config = {
        id: charId,
        name: wizardState.name,
        player: currentUserId(),
        race: wizardState.race,
        className: wizardState.className,
        subclass: wizardState.subclass || '',
        background: wizardState.background ? (DATA.backgrounds[wizardState.background] ? DATA.backgrounds[wizardState.background].name : wizardState.background) : '',
        alignment: wizardState.alignment,
        age: wizardState.age || null,
        accentColor: wizardState.accentColor,
        baseAbilities: Object.assign({}, wizardState.baseAbilities),
        backgroundBonuses: bgBonuses,
        defaultSkills: wizardState.skills.slice(),
        defaultCantrips: wizardState.cantrips.slice(),
        defaultPrepared: [],
        weapons: [],
        appearance: wizardState.appearance ? [wizardState.appearance] : [],
        personality: Object.assign({}, wizardState.personality),
        backstory: wizardState.backstory || '',
        quotes: [],
        defaultItems: [],
        charTimeline: [],
        family: []
    };

    // Save config
    saveCharConfig(charId, config);

    // Save default state
    var defaultState = {
        level: 1,
        skills: wizardState.skills.slice(),
        expertise: [],
        cantrips: wizardState.cantrips.slice(),
        prepared: [],
        metamagic: [],
        asiChoices: {},
        favorites: [],
        items: [],
        customAbilities: null,
        currentHP: null,
        tempHP: 0,
        deathSaves: { successes: 0, failures: 0 },
        conditions: [],
        spellSlotsUsed: {},
        hitDiceUsed: 0,
        inspiration: false,
        gold: 0,
        notes: ''
    };
    saveCharState(charId, defaultState);

    // Add character to user's characters array
    var uid = currentUserId();
    if (!usersCache) usersCache = {};
    if (!usersCache[uid]) {
        var u = getUserData(uid);
        usersCache[uid] = u ? JSON.parse(JSON.stringify(u)) : { name: uid, role: 'player', password: uid };
    }
    if (!usersCache[uid].characters) usersCache[uid].characters = [];
    if (usersCache[uid].characters.indexOf(charId) === -1) {
        usersCache[uid].characters.push(charId);
    }

    // Save to Firebase
    if (typeof syncSaveUser === 'function') syncSaveUser(uid, usersCache[uid]);
    localStorage.setItem('dw_users', JSON.stringify(usersCache));

    showToast(t('wizard.success'), 'success');
    return charId;
}

function openWizard() {
    initWizardState();
    var div = document.createElement('div');
    div.id = 'wizard-container';
    div.innerHTML = renderWizardModal();
    document.body.appendChild(div);
    lockBodyScroll();
    bindWizardEvents();
}

function closeWizard() {
    var el = document.getElementById('wizard-container');
    if (el) el.remove();
    wizardState = null;
    unlockBodyScroll();
}

function refreshWizard() {
    var el = document.getElementById('wizard-container');
    if (el) {
        el.innerHTML = renderWizardModal();
        bindWizardEvents();
    }
}

function bindWizardEvents() {
    var container = document.getElementById('wizard-container');
    if (!container) return;

    // Direct button bindings (more robust than delegation through fixed overlay)
    var closeBtn = container.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', function(e) { e.stopPropagation(); closeWizard(); });

    var overlay = container.querySelector('.wizard-overlay');
    if (overlay) overlay.addEventListener('click', function(e) { if (e.target === overlay) closeWizard(); });

    var prevBtn = container.querySelector('[data-action="wizard-prev"]');
    if (prevBtn) prevBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        saveWizardStepData();
        if (wizardState.step > 1) { wizardState.step--; refreshWizard(); }
    });

    var nextBtn = container.querySelector('[data-action="wizard-next"]');
    if (nextBtn) nextBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        saveWizardStepData();
        if (wizardState.step < 6) { wizardState.step++; refreshWizard(); }
    });

    var createBtn = container.querySelector('[data-action="wizard-create"]');
    if (createBtn) createBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        saveWizardStepData();
        var newCharId = createCharacterFromWizard();
        if (newCharId) { closeWizard(); navigate('/characters/' + newCharId); }
    });

    // Color buttons
    var colorBtns = container.querySelectorAll('[data-action="wizard-color"]');
    for (var ci = 0; ci < colorBtns.length; ci++) {
        colorBtns[ci].addEventListener('click', function(e) {
            e.stopPropagation();
            wizardState.accentColor = this.dataset.color;
            refreshWizard();
        });
    }

    // Skill checkboxes
    var skillBoxes = container.querySelectorAll('[data-action="wizard-skill"]');
    for (var si = 0; si < skillBoxes.length; si++) {
        skillBoxes[si].addEventListener('click', function() {
            var sk = this.dataset.skill;
            var idx = wizardState.skills.indexOf(sk);
            if (this.checked && idx === -1) wizardState.skills.push(sk);
            else if (!this.checked && idx !== -1) wizardState.skills.splice(idx, 1);
            refreshWizard();
        });
    }

    // Cantrip checkboxes
    var cantripBoxes = container.querySelectorAll('[data-action="wizard-cantrip"]');
    for (var cbi = 0; cbi < cantripBoxes.length; cbi++) {
        cantripBoxes[cbi].addEventListener('click', function() {
            var cn = this.dataset.cantrip;
            var idx = wizardState.cantrips.indexOf(cn);
            if (this.checked && idx === -1) wizardState.cantrips.push(cn);
            else if (!this.checked && idx !== -1) wizardState.cantrips.splice(idx, 1);
            refreshWizard();
        });
    }

    container.onchange = function(e) {
        var target = e.target;

        if (target.matches('[data-action="wizard-race-change"]')) {
            saveWizardStepData();
            wizardState.race = target.value;
            refreshWizard();
            return;
        }

        if (target.matches('[data-action="wizard-class-change"]')) {
            saveWizardStepData();
            var newClass = target.value;
            if (newClass !== wizardState.className) {
                wizardState.className = newClass;
                wizardState.skills = [];
                wizardState.cantrips = [];
                wizardState.subclass = '';
            }
            refreshWizard();
            return;
        }

        if (target.matches('[data-action="wizard-bg-change"]')) {
            saveWizardStepData();
            wizardState.background = target.value;
            wizardState.bgBonusChoice = { plus2: '', plus1: '' };
            refreshWizard();
            return;
        }

        if (target.matches('[data-action="wizard-bonus-change"]')) {
            saveWizardStepData();
            var ab = target.dataset.ability;
            var val = target.value;
            // Clear previous assignment of this ability
            if (wizardState.bgBonusChoice.plus2 === ab) wizardState.bgBonusChoice.plus2 = '';
            if (wizardState.bgBonusChoice.plus1 === ab) wizardState.bgBonusChoice.plus1 = '';
            // Set new
            if (val === '2') {
                // If another ability already has +2, clear it
                if (wizardState.bgBonusChoice.plus2 && wizardState.bgBonusChoice.plus2 !== ab) {
                    // Keep it, but override
                }
                wizardState.bgBonusChoice.plus2 = ab;
            } else if (val === '1') {
                wizardState.bgBonusChoice.plus1 = ab;
            }
            refreshWizard();
            return;
        }

        if (target.matches('[data-action="wizard-ability"]')) {
            var ab = target.dataset.ability;
            var val = parseInt(target.value) || 10;
            wizardState.baseAbilities[ab] = Math.max(3, Math.min(20, val));
            return;
        }
    };
}

// ============================================================
// Section 32c: Profile & Wizard Event Wiring (in main click handler)
// ============================================================

// Attach profile and wizard listeners to document body for global modals
document.addEventListener('click', function(e) {
    var target = e.target;

    // Open profile modal
    if (target.matches('[data-action="open-profile"]') || target.closest('[data-action="open-profile"]')) {
        openProfileModal();
        return;
    }

    // Close profile modal
    if (target.matches('[data-action="close-profile-modal"]') || target.closest('[data-action="close-profile-modal"]')) {
        if (target.matches('.modal-overlay') || target.matches('.modal-close') || target.closest('.modal-close')) {
            closeProfileModal();
            return;
        }
    }

    // Save profile
    if (target.matches('[data-action="save-profile"]') || target.closest('[data-action="save-profile"]')) {
        handleSaveProfile();
        return;
    }

    // Open character creation wizard
    if (target.matches('[data-action="open-create-wizard"]') || target.closest('[data-action="open-create-wizard"]')) {
        openWizard();
        return;
    }

    // Bug reporter actions
    if (target.matches('[data-action="start-bug-selector"]') || target.closest('[data-action="start-bug-selector"]')) {
        startBugSelector();
        return;
    }
    if (target.matches('[data-action="close-bug-modal"]')) {
        closeBugReportModal();
        return;
    }
    if (target.matches('[data-action="submit-bug"]') || target.closest('[data-action="submit-bug"]')) {
        submitBugReport();
        return;
    }
});


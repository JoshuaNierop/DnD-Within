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
        editId: null,
        name: '',
        species: '',
        race: '',
        className: '',
        background: '',
        abilityMethod: 'manual',
        baseAbilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
        bgBonusChoice: { plus2: '', plus1: '' },
        subclass: '',
        alignment: 'True Neutral',
        age: '',
        accentColor: '#22d3ee',
        portrait: '',
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

// 2024 PHB species → bestaande platte DATA-race-keys. Elf is één soort met drie
// lineages (Wood/High/Drow); de overige soorten mappen 1-op-1. config.race blijft
// altijd een platte DATA-key (woodElf/human/…) zodat geen enkele reader breekt.
var WIZARD_SPECIES = {
    aasimar: [], dragonborn: [], dwarf: [],
    elf: ['woodElf', 'highElf', 'drow'],
    gnome: [], goliath: [], halfling: [], human: [], orc: [], tiefling: []
};
function getWizardSpeciesKeys() {
    return Object.keys(WIZARD_SPECIES).filter(function (sp) {
        var lin = WIZARD_SPECIES[sp];
        if (lin.length) return lin.some(function (k) { return DATA[k] && !DATA[k].legacy; });
        return DATA[sp] && !DATA[sp].legacy;
    });
}
function speciesDisplayName(sp) {
    if (sp === 'elf') return 'Elf';
    return raceDisplayName(sp);
}
// Reverse: van een platte race-key naar de bijbehorende species-key (voor edit-modus).
function speciesFromRaceKey(raceKey) {
    if (!raceKey) return '';
    if (WIZARD_SPECIES[raceKey]) return raceKey;
    var found = '';
    Object.keys(WIZARD_SPECIES).forEach(function (sp) {
        if (WIZARD_SPECIES[sp].indexOf(raceKey) !== -1) found = sp;
    });
    return found;
}

function getWizardClasses() {
    var classKeys = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
    return classKeys.filter(function(c) { return DATA[c] && DATA[c].hitDie; });
}

// Primaire ability score(s) per class (2024 PHB "Primary Ability"-regel). Wordt
// gebruikt om in de wizard te tonen welke stats belangrijk zijn (#kbowMj).
var CLASS_PRIMARY_ABILITY = {
    barbarian: ['str'], bard: ['cha'], cleric: ['wis'], druid: ['wis'],
    fighter: ['str', 'dex'], monk: ['dex', 'wis'], paladin: ['str', 'cha'],
    ranger: ['dex', 'wis'], rogue: ['dex'], sorcerer: ['cha'],
    warlock: ['cha'], wizard: ['int']
};
function classPrimaryAbilities(className) {
    return CLASS_PRIMARY_ABILITY[className] || [];
}

// Ability-score generatie (2024 PHB). Standard array vrij toewijsbaar; point-buy
// 27 punten, scores 8-15 met onderstaande kostentabel (#bij5sk).
var STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
var POINTBUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
var POINTBUY_BUDGET = 27;
var ABILITY_KEYS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
function pointBuySpent() {
    var s = 0;
    ABILITY_KEYS.forEach(function (a) {
        var v = wizardState.baseAbilities[a];
        if (POINTBUY_COST[v] != null) s += POINTBUY_COST[v];
    });
    return s;
}
// Bouwt het ability-score-blok van step2 met method-switch (handmatig/array/point-buy)
// + primaire-stat highlight (#bij5sk, #kbowMj).
function renderWizardAbilityScores() {
    var method = wizardState.abilityMethod || 'manual';
    var prim = classPrimaryAbilities(wizardState.className);
    var html = '<div class="wizard-field">';
    html += '<label class="wizard-label">' + t('wizard.abilities.label') + '</label>';
    var methods = [['manual', t('wizard.method.manual')], ['array', t('wizard.method.array')], ['pointbuy', t('wizard.method.pointbuy')]];
    html += '<div class="wizard-ability-method">';
    for (var mi = 0; mi < methods.length; mi++) {
        var on = method === methods[mi][0];
        html += '<button type="button" class="wizard-method-btn' + (on ? ' is-active' : '') + '" data-action="wizard-ability-method" data-method="' + methods[mi][0] + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + methods[mi][1] + '</button>';
    }
    html += '</div>';

    if (method === 'pointbuy') {
        var left = POINTBUY_BUDGET - pointBuySpent();
        var poolCls = left === 0 ? ' is-empty' : (left < 0 ? ' is-over' : '');
        html += '<div class="wizard-pointbuy-pool' + poolCls + '">' + t('wizard.pointbuy.left') + ' <span class="pool-val">' + left + '</span>/' + POINTBUY_BUDGET + '</div>';
    } else if (method === 'array') {
        html += '<div class="wizard-array-pool">';
        var assigned = ABILITY_KEYS.map(function (a) { return wizardState.baseAbilities[a]; });
        STANDARD_ARRAY.forEach(function (v) {
            var used = assigned.indexOf(v) !== -1;
            html += '<span class="wizard-array-chip' + (used ? ' is-used' : '') + '">' + v + '</span>';
        });
        html += '</div>';
    }

    html += '<div class="wizard-abilities">';
    for (var i = 0; i < ABILITY_KEYS.length; i++) {
        var ab = ABILITY_KEYS[i];
        var isPrim = prim.indexOf(ab) !== -1;
        html += '<div class="wizard-ability' + (isPrim ? ' is-primary' : '') + '">';
        html += '<label>' + ab.toUpperCase() + '</label>';
        if (method === 'manual') {
            html += '<input type="number" class="wizard-input wizard-input-sm" data-action="wizard-ability" data-ability="' + ab + '" value="' + wizardState.baseAbilities[ab] + '" min="3" max="20">';
        } else if (method === 'array') {
            var cur = wizardState.baseAbilities[ab];
            html += '<select class="wizard-select-sm wizard-array-select' + (cur ? ' has-value' : '') + '" data-action="wizard-array-assign" data-ability="' + ab + '">';
            html += '<option value="">&mdash;</option>';
            STANDARD_ARRAY.forEach(function (v) {
                var usedElsewhere = false;
                ABILITY_KEYS.forEach(function (other) { if (other !== ab && wizardState.baseAbilities[other] === v) usedElsewhere = true; });
                html += '<option value="' + v + '"' + (cur === v ? ' selected' : '') + (usedElsewhere ? ' disabled' : '') + '>' + v + '</option>';
            });
            html += '</select>';
        } else {
            var pv = wizardState.baseAbilities[ab];
            var canDec = pv > 8;
            var canInc = pv < 15 && (POINTBUY_BUDGET - pointBuySpent()) >= (POINTBUY_COST[pv + 1] - POINTBUY_COST[pv]);
            html += '<div class="wizard-ability-stepper">';
            html += '<button type="button" class="stepper-btn" data-action="wizard-pointbuy" data-ability="' + ab + '" data-dir="-1"' + (canDec ? '' : ' disabled') + '>&minus;</button>';
            html += '<span class="stepper-val">' + pv + '</span>';
            html += '<button type="button" class="stepper-btn" data-action="wizard-pointbuy" data-ability="' + ab + '" data-dir="1"' + (canInc ? '' : ' disabled') + '>+</button>';
            html += '</div>';
        }
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';
    return html;
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

    // Header
    html += '<div class="wizard-header">';
    html += '<h2 class="wizard-title">' + (wizardState.editId ? (t('wizard.edittitle') === 'wizard.edittitle' ? 'Character bewerken' : t('wizard.edittitle')) : t('wizard.title')) + '</h2>';
    html += '<button class="modal-close" data-action="close-wizard">&times;</button>';
    html += '</div>';

    // Horizontal stepper (full width, under header) — gives the steps the whole
    // modal width and removes the cramped vertical-aside overlap (#EG9koC).
    html += '<nav class="wizard-steps" aria-label="Stappen">';
    var stepLabels = [t('wizard.step.basics'), t('wizard.step.background'), t('wizard.step.details'), t('wizard.step.skills'), t('wizard.step.story'), t('wizard.step.summary')];
    for (var si = 1; si <= totalSteps; si++) {
        var stepClass = 'wizard-step-dot';
        if (si < step) stepClass += ' completed';
        if (si === step) stepClass += ' active';
        var stepAria = (si === step) ? ' aria-current="step"' : '';
        html += '<div class="' + stepClass + '"' + stepAria + '><span class="step-num">' + (si < step ? '&#10003;' : si) + '</span><span class="step-label">' + stepLabels[si - 1] + '</span></div>';
    }
    html += '</nav>';

    // Two-panel body: content (center) + summary sidebar (right)
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
    // Portret-upload (#5Y8aZh): label wraps a hidden file input → de hele cirkel
    // is een tap-target. Base64 leeft in wizardState.portrait (overleeft de
    // refreshWizard re-render); de Cloudinary-upload gebeurt pas bij character-save.
    html += '<label class="wizard-sidebar-portrait" style="border-color:' + sidebarColor + '">';
    if (wizardState.portrait) {
        html += '<img class="wizard-portrait-img" src="' + escapeAttr(wizardState.portrait) + '" alt="">';
    } else {
        html += '<span class="wizard-portrait-placeholder">&#128100;</span>';
    }
    html += '<span class="wizard-portrait-overlay" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm0-8.2h2.3l1.2-1.6h2.8A1.7 1.7 0 0 1 22 6.8v10.4A1.7 1.7 0 0 1 20.3 19H3.7A1.7 1.7 0 0 1 2 17.2V6.8A1.7 1.7 0 0 1 3.7 5h2.8L7.7 3H12Z"/></svg></span>';
    html += '<input type="file" accept="image/*" class="wizard-portrait-input" aria-label="Portret uploaden" data-action="upload-wizard-portrait">';
    html += '</label>';
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

    // Navigation buttons — Prev op step 1 = Cancel (sluit wizard)
    html += '<div class="wizard-nav">';
    if (step > 1) {
        html += '<button class="btn btn-ghost" data-action="wizard-prev">' + t('wizard.prev') + '</button>';
    } else {
        html += '<button class="btn btn-ghost" data-action="wizard-cancel">' + (t('generic.cancel') || 'Cancel') + '</button>';
    }
    if (step < totalSteps) {
        html += '<button class="btn btn-primary" data-action="wizard-next">' + t('wizard.next') + '</button>';
    } else {
        html += '<button class="btn btn-primary" data-action="wizard-create">' + (wizardState.editId ? (t('wizard.save') === 'wizard.save' ? 'Opslaan' : t('wizard.save')) : t('wizard.create')) + '</button>';
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

    // Soort (species) + optionele lineage/subras (#OdBL9u). Elf is één soort met
    // een verplichte lineage-keuze; andere soorten mappen direct op een race-key.
    var speciesKeys = getWizardSpeciesKeys();
    var curSpecies = wizardState.species || speciesFromRaceKey(wizardState.race);
    var curLineages = (curSpecies && WIZARD_SPECIES[curSpecies]) ? WIZARD_SPECIES[curSpecies] : [];
    html += '<div class="wizard-subfield-group">';
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">' + t('wizard.race.label') + '</label>';
    html += '<select class="wizard-select" id="wizard-species" data-action="wizard-species-change">';
    html += '<option value="">' + t('wizard.race.default') + '</option>';
    for (var i = 0; i < speciesKeys.length; i++) {
        var spSel = curSpecies === speciesKeys[i] ? ' selected' : '';
        html += '<option value="' + speciesKeys[i] + '"' + spSel + '>' + speciesDisplayName(speciesKeys[i]) + '</option>';
    }
    html += '</select>';
    html += '</div>';
    if (curLineages.length) {
        html += '<div class="wizard-field wizard-subfield">';
        html += '<label class="wizard-label">' + t('wizard.lineage.label') + '</label>';
        html += '<select class="wizard-select" id="wizard-lineage" data-action="wizard-lineage-change">';
        html += '<option value="">' + t('wizard.lineage.choose') + '</option>';
        for (var li = 0; li < curLineages.length; li++) {
            var lk = curLineages[li];
            if (!DATA[lk]) continue;
            var liSel = wizardState.race === lk ? ' selected' : '';
            html += '<option value="' + lk + '"' + liSel + '>' + raceDisplayName(lk) + '</option>';
        }
        html += '</select>';
        html += '</div>';
    }
    html += '</div>'; // wizard-subfield-group
    html += '<div class="wizard-field">';
    if (wizardState.race && DATA[wizardState.race]) {
        var raceData = DATA[wizardState.race];
        html += '<details class="wizard-preview" open>';
        html += '<summary>' + raceDisplayName(wizardState.race) + ' Features</summary>';
        if (raceData.speed) html += '<p class="wizard-detail"><strong>Speed:</strong> ' + raceData.speed + 'ft</p>';
        if (raceData.darkvision) html += '<p class="wizard-detail"><strong>Darkvision:</strong> ' + raceData.darkvision + 'ft</p>';
        if (raceData.features) {
            for (var fi = 0; fi < raceData.features.length; fi++) {
                html += '<p class="wizard-detail"><strong>' + escapeHtml(raceData.features[fi].name) + ':</strong> ' + escapeHtml(dloc(raceData.features[fi].desc)) + '</p>';
            }
        }
        html += '</details>';
    }
    html += '</div>';

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
    if (wizardState.className && DATA[wizardState.className]) {
        var classData = DATA[wizardState.className];
        html += '<details class="wizard-preview" open>';
        html += '<summary>' + classDisplayName(wizardState.className) + ' Info</summary>';
        var primAbs = classPrimaryAbilities(wizardState.className);
        if (primAbs.length) {
            html += '<p class="wizard-detail wizard-primary-note">&#9733; <strong>' + t('wizard.primary.label') + '</strong> ' + primAbs.map(function(a) { return a.toUpperCase(); }).join(primAbs.length > 1 ? ' / ' : '') + ' &middot; ' + t('wizard.primary.con') + '</p>';
        }
        html += '<p class="wizard-detail"><strong>Hit Die:</strong> d' + classData.hitDie + '</p>';
        html += '<p class="wizard-detail"><strong>Saving Throws:</strong> ' + classData.savingThrows.map(function(s) { return s.toUpperCase(); }).join(', ') + '</p>';
        if (classData.cantripsKnown) {
            html += '<p class="wizard-detail"><strong>Spellcasting:</strong> ' + t('generic.yes') + ' (cantrips: ' + classData.cantripsKnown[1] + ')</p>';
        } else {
            html += '<p class="wizard-detail"><strong>Spellcasting:</strong> ' + t('generic.no') + '</p>';
        }
        html += '</details>';
    }
    html += '</div>';

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
    if (wizardState.background && DATA.backgrounds[wizardState.background]) {
        var bg = DATA.backgrounds[wizardState.background];
        html += '<details class="wizard-preview" open>';
        html += '<summary>' + bg.name + '</summary>';
        html += '<p class="wizard-detail">' + escapeHtml(dloc(bg.desc)) + '</p>';
        html += '<p class="wizard-detail"><strong>Skills:</strong> ' + bg.skills.join(', ') + '</p>';
        html += '<p class="wizard-detail"><strong>Tool:</strong> ' + bg.tool + '</p>';
        html += '<p class="wizard-detail"><strong>Feat:</strong> ' + bg.feat + '</p>';
        html += '<p class="wizard-detail"><strong>Ability Scores:</strong> ' + bg.abilityScores.join(', ') + ' (+2 en +1 verdeeld)</p>';

        // Background bonus distribution
        html += '<div class="wizard-bg-bonus">';
        html += '<label class="wizard-label">' + t('wizard.bg.distribute') + '</label>';
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
    html += '</div>';

    // Ability Scores — method-switch (handmatig / standaard array / point-buy)
    html += renderWizardAbilityScores();

    return html;
}

function renderWizardStep3() {
    var html = '<h3 class="wizard-step-title">' + t('wizard.step.details') + '</h3>';

    // Subclass — 2024 PHB: je kiest je subclass pas op level 3 (#vXF9qQ). De wizard
    // maakt level-1 characters, dus de keuze alleen tonen bij het bewerken van een
    // character dat al level 3+ is.
    var wizLevel = wizardState.editId ? (((typeof loadCharState === 'function' && loadCharState(wizardState.editId)) || {}).level || 1) : 1;
    if (wizardState.className && wizLevel >= 3) {
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

    // Accent Color verwijderd uit de wizard (#YAJBUH): per-character kleur hoort niet
    // in de creation/edit-flow. Bestaande waarde blijft behouden (edit laadt+bewaart
    // cfg.accentColor); nieuwe characters krijgen de default. Globaal thema staat in
    // de algemene settings (settings-select-theme).

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

    // Ability-score validatie per methode (#bij5sk).
    if (wizardState.abilityMethod === 'array') {
        var got = ABILITY_KEYS.map(function (a) { return wizardState.baseAbilities[a]; }).sort(function (x, y) { return x - y; });
        var want = STANDARD_ARRAY.slice().sort(function (x, y) { return x - y; });
        if (got.join(',') !== want.join(',')) {
            showToast('Standaard array: wijs elk van 15/14/13/12/10/8 precies één keer toe.', 'error');
            return false;
        }
    } else if (wizardState.abilityMethod === 'pointbuy') {
        var bad = ABILITY_KEYS.some(function (a) { var v = wizardState.baseAbilities[a]; return v < 8 || v > 15; });
        if (bad || pointBuySpent() > POINTBUY_BUDGET) {
            showToast('Point buy: scores 8-15 en maximaal ' + POINTBUY_BUDGET + ' punten.', 'error');
            return false;
        }
    }

    // Edit-modus (#1): bewerk een bestaand character i.p.v. een nieuw aanmaken.
    // Behoud het id, de niet-wizard config-velden (weapons, quotes, items,
    // timeline, family, …) én de volledige runtime-state (level, HP, items).
    var isEdit = !!(wizardState && wizardState.editId);
    var charId = isEdit ? wizardState.editId : generateCharId(wizardState.name);
    var bgBonuses = calcBgBonuses();
    var existing = isEdit ? (loadCharConfig(charId) || {}) : {};

    var config = Object.assign({}, existing, {
        id: charId,
        name: wizardState.name,
        player: existing.player || currentUserId(),
        race: wizardState.race,
        className: wizardState.className,
        subclass: wizardState.subclass || '',
        background: wizardState.background ? (DATA.backgrounds[wizardState.background] ? DATA.backgrounds[wizardState.background].name : wizardState.background) : '',
        alignment: wizardState.alignment,
        age: wizardState.age || null,
        accentColor: wizardState.accentColor,
        baseAbilities: Object.assign({}, wizardState.baseAbilities),
        abilityMethod: wizardState.abilityMethod || 'manual',
        backgroundBonuses: bgBonuses,
        defaultSkills: wizardState.skills.slice(),
        defaultCantrips: wizardState.cantrips.slice(),
        appearance: wizardState.appearance ? [wizardState.appearance] : (existing.appearance || []),
        personality: Object.assign({}, wizardState.personality),
        backstory: wizardState.backstory || ''
    });
    // Velden die alleen bij een NIEUW character geïnitialiseerd worden.
    if (!isEdit) {
        config.defaultPrepared = [];
        config.weapons = [];
        config.quotes = [];
        config.defaultItems = [];
        config.charTimeline = [];
        config.family = [];
    }

    // Save config
    saveCharConfig(charId, config);

    // Portret (#5Y8aZh): pas hier opslaan — charId bestaat nu, dus de Cloudinary-
    // folder wordt <Owner>/Characters/<CharName>/Portrait via saveImage(). Alleen
    // een NIEUWE upload (data:-URL) re-uploaden; een onveranderd bestaand http-URL
    // in edit-modus overslaan.
    if (wizardState.portrait && wizardState.portrait.indexOf('data:') === 0) {
        saveImage(charId, 'portrait', wizardState.portrait);
    }

    // Edit-modus: runtime-state (level, HP, gekozen skills/items) intact laten.
    if (isEdit) {
        showToast(t('wizard.editsuccess') === 'wizard.editsuccess' ? 'Character bijgewerkt' : t('wizard.editsuccess'), 'success');
        return charId;
    }

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

// Reverse-map de opgeslagen background (display-naam of key) terug naar de
// wizard-key die getWizardBackgrounds() gebruikt.
function bgKeyFromConfig(bgValue) {
    if (!bgValue || !DATA.backgrounds) return '';
    if (DATA.backgrounds[bgValue]) return bgValue;            // was al een key
    var keys = Object.keys(DATA.backgrounds);
    for (var i = 0; i < keys.length; i++) {
        if (DATA.backgrounds[keys[i]].name === bgValue) return keys[i];
    }
    return '';
}

// Bouw een wizardState uit een bestaande character-config (#1 edit).
function buildWizardStateFromConfig(charId) {
    var cfg = loadCharConfig(charId);
    if (!cfg) return false;
    initWizardState();
    wizardState.editId = charId;
    wizardState.name = cfg.name || '';
    wizardState.race = cfg.race || '';
    wizardState.species = speciesFromRaceKey(wizardState.race);
    wizardState.className = cfg.className || '';
    wizardState.subclass = cfg.subclass || '';
    wizardState.background = bgKeyFromConfig(cfg.background);
    wizardState.alignment = cfg.alignment || 'True Neutral';
    wizardState.age = (cfg.age != null) ? cfg.age : '';
    wizardState.accentColor = cfg.accentColor || '#22d3ee';
    if (cfg.baseAbilities) wizardState.baseAbilities = Object.assign({ str:10, dex:10, con:10, int:10, wis:10, cha:10 }, cfg.baseAbilities);
    wizardState.abilityMethod = cfg.abilityMethod || 'manual';
    // Reverse de background-bonuskeuze (+2 / +1) uit backgroundBonuses.
    var bb = cfg.backgroundBonuses || {};
    var plus2 = '', plus1 = '';
    Object.keys(bb).forEach(function (ab) {
        if (bb[ab] === 2) plus2 = ab;
        else if (bb[ab] === 1) plus1 = ab;
    });
    wizardState.bgBonusChoice = { plus2: plus2, plus1: plus1 };
    wizardState.skills = (cfg.defaultSkills || []).slice();
    wizardState.cantrips = (cfg.defaultCantrips || []).slice();
    wizardState.appearance = (cfg.appearance && cfg.appearance[0]) ? cfg.appearance[0] : '';
    wizardState.portrait = (typeof loadImage === 'function') ? (loadImage(charId, 'portrait') || '') : '';
    wizardState.personality = Object.assign({ traits:'', ideal:'', bond:'', flaw:'' }, cfg.personality || {});
    wizardState.backstory = cfg.backstory || '';
    return true;
}

// Open de creation-wizard in edit-modus met een bestaand character voorgevuld.
function openWizardForEdit(charId) {
    if (!buildWizardStateFromConfig(charId)) {
        showToast('Character niet gevonden', 'error');
        return;
    }
    var div = document.createElement('div');
    div.id = 'wizard-container';
    div.innerHTML = renderWizardModal();
    document.body.appendChild(div);
    lockBodyScroll();
    bindWizardEvents();
}

// Delete-character bevestigingsmodal (#4). Vereist dat de gebruiker exact
// "gebruikersnaam-characternaam" typt voordat het character naar de prullenbak
// gaat. Case-insensitive, na trim.
function openDeleteCharacterModal(charId) {
    var cfg = loadCharConfig(charId);
    if (!cfg) { showToast('Character niet gevonden', 'error'); return; }
    var existing = document.querySelector('.char-delete-modal-wrap');
    if (existing) existing.remove();

    var owner = cfg.player || currentUserId();
    var ownerData = getUserData(owner);
    var ownerName = (ownerData && ownerData.name) ? ownerData.name : owner;
    var phrase = String(ownerName) + '-' + String(cfg.name || charId);

    var html = '<div class="char-delete-modal-wrap">';
    html += '<div class="modal-overlay" data-action="close-delete-modal">';
    html += '<div class="char-delete-modal" role="dialog" aria-modal="true">';
    html += '<div class="modal-header"><h2>🗑️ ' + t('char.delete.title') + '</h2>'
         +    '<button class="modal-close" data-action="close-delete-modal">&times;</button></div>';
    html += '<div class="modal-body">';
    html += '<p class="char-delete-warn">' + t('char.delete.warn') + '</p>';
    html += '<p class="char-delete-prompt">' + t('char.delete.prompt') + ' <code>' + escapeHtml(phrase) + '</code></p>';
    html += '<input type="text" class="char-delete-input" id="char-delete-input" placeholder="' + t('char.delete.plh') + '" autocomplete="off">';
    html += '<button class="btn btn-danger char-delete-confirm" id="char-delete-confirm" disabled>' + t('char.delete.confirm') + '</button>';
    html += '</div></div></div></div>';

    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.appendChild(wrap.firstChild);
    lockBodyScroll();

    var modalWrap = document.querySelector('.char-delete-modal-wrap');
    var input = document.getElementById('char-delete-input');
    var confirmBtn = document.getElementById('char-delete-confirm');
    var matches = function () {
        return input.value.trim().toLowerCase() === phrase.toLowerCase();
    };
    if (input) {
        input.addEventListener('input', function () { confirmBtn.disabled = !matches(); });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && matches()) { e.preventDefault(); confirmBtn.click(); }
        });
        setTimeout(function () { input.focus(); }, 30);
    }
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!matches()) return;
            deleteCharacterToTrash(charId);
            closeDeleteCharacterModal();
            showToast(t('char.delete.done'), 'success');
            if (typeof renderApp === 'function') renderApp();
        });
    }
    if (modalWrap) {
        modalWrap.querySelectorAll('[data-action="close-delete-modal"]').forEach(function (b) {
            b.addEventListener('click', function (e) { if (e.target === this) closeDeleteCharacterModal(); });
        });
    }
}
function closeDeleteCharacterModal() {
    var el = document.querySelector('.char-delete-modal-wrap');
    if (el) el.remove();
    unlockBodyScroll();
}

function closeWizard() {
    var el = document.getElementById('wizard-container');
    if (el) el.remove();
    wizardState = null;
    unlockBodyScroll();
}

function refreshWizard() {
    var el = document.getElementById('wizard-container');
    if (!el) return;

    // Try partial update for smooth transitions (only content + sidebar)
    var contentEl = el.querySelector('.wizard-content');
    var sidebarEl = el.querySelector('.wizard-sidebar');
    if (contentEl && sidebarEl) {
        // Build new modal HTML to extract parts
        var tmp = document.createElement('div');
        tmp.innerHTML = renderWizardModal();
        var newContent = tmp.querySelector('.wizard-content');
        var newSidebar = tmp.querySelector('.wizard-sidebar');
        var newSteps = tmp.querySelector('.wizard-steps');
        var newNav = tmp.querySelector('.wizard-nav');

        // Replace nav + steps immediately so prev/next listeners point at fresh
        // nodes — without this, repeated clicks during the 120ms crossfade still
        // hit the old listener and advance multiple steps at once.
        var navEl = el.querySelector('.wizard-nav');
        if (navEl && newNav) navEl.innerHTML = newNav.innerHTML;
        var stepsEl = el.querySelector('.wizard-steps');
        if (stepsEl && newSteps) stepsEl.innerHTML = newSteps.innerHTML;
        bindWizardEvents();

        // Crossfade content + sidebar (visual polish only, no buttons here)
        contentEl.classList.add('wizard-fade-out');
        setTimeout(function() {
            if (newContent) contentEl.innerHTML = newContent.innerHTML;
            if (newSidebar) sidebarEl.innerHTML = newSidebar.innerHTML;
            contentEl.classList.remove('wizard-fade-out');
            contentEl.classList.add('wizard-fade-in');
            setTimeout(function() { contentEl.classList.remove('wizard-fade-in'); }, 200);
            // Re-bind for any newly-rendered selects/checkboxes inside content
            bindWizardEvents();
        }, 120);
    } else {
        // Fallback: full replace
        el.innerHTML = renderWizardModal();
        bindWizardEvents();
    }
}

// Idempotente binding: voorkomt dat herhaalde bindWizardEvents-aanroepen
// (refreshWizard bindt twee keer: direct + na de crossfade) dezelfde node
// dubbel koppelen. Zonder dit kreeg de "Volgende"-knop twee click-listeners →
// step += 2 → pagina's werden overgeslagen (#2). Verse nodes (innerHTML-replace)
// hebben de vlag nog niet en worden dus precies één keer gebonden.
function _wzBindOnce(node, evt, handler) {
    if (!node) return;
    if (node._wzBound && node._wzBound[evt]) return;
    node._wzBound = node._wzBound || {};
    node._wzBound[evt] = true;
    node.addEventListener(evt, handler);
}

function bindWizardEvents() {
    var container = document.getElementById('wizard-container');
    if (!container) return;

    // Direct button bindings (more robust than delegation through fixed overlay)
    var closeBtn = container.querySelector('.modal-close');
    _wzBindOnce(closeBtn, 'click', function(e) { e.stopPropagation(); closeWizard(); });

    var overlay = container.querySelector('.wizard-overlay');
    _wzBindOnce(overlay, 'click', function(e) { if (e.target === overlay) closeWizard(); });

    var prevBtn = container.querySelector('[data-action="wizard-prev"]');
    _wzBindOnce(prevBtn, 'click', function(e) {
        e.stopPropagation();
        saveWizardStepData();
        if (wizardState.step > 1) { wizardState.step--; refreshWizard(); }
    });

    var cancelBtn = container.querySelector('[data-action="wizard-cancel"]');
    _wzBindOnce(cancelBtn, 'click', function(e) {
        e.stopPropagation();
        closeWizard();
    });

    var nextBtn = container.querySelector('[data-action="wizard-next"]');
    _wzBindOnce(nextBtn, 'click', function(e) {
        e.stopPropagation();
        saveWizardStepData();
        if (wizardState.step < 6) { wizardState.step++; refreshWizard(); }
    });

    var createBtn = container.querySelector('[data-action="wizard-create"]');
    _wzBindOnce(createBtn, 'click', function(e) {
        e.stopPropagation();
        saveWizardStepData();
        var wasEdit = !!(wizardState && wizardState.editId);
        var resultId = createCharacterFromWizard();
        if (resultId) {
            closeWizard();
            // Edit: blijf op de huidige pagina (ververs zodat wijzigingen tonen);
            // create: ga naar het nieuwe character.
            if (wasEdit) { if (typeof renderApp === 'function') renderApp(); }
            else navigate('/characters/' + resultId);
        }
    });

    // Color buttons
    var colorBtns = container.querySelectorAll('[data-action="wizard-color"]');
    for (var ci = 0; ci < colorBtns.length; ci++) {
        _wzBindOnce(colorBtns[ci], 'click', function(e) {
            e.stopPropagation();
            wizardState.accentColor = this.dataset.color;
            refreshWizard();
        });
    }

    // Ability-method switch (#bij5sk): reset baseAbilities naar de method-default.
    var methodBtns = container.querySelectorAll('[data-action="wizard-ability-method"]');
    for (var mbi = 0; mbi < methodBtns.length; mbi++) {
        _wzBindOnce(methodBtns[mbi], 'click', function(e) {
            e.stopPropagation();
            var m = this.dataset.method;
            if (m === wizardState.abilityMethod) return;
            wizardState.abilityMethod = m;
            ABILITY_KEYS.forEach(function(a) {
                if (m === 'array') wizardState.baseAbilities[a] = 0;       // onassigned
                else if (m === 'pointbuy') wizardState.baseAbilities[a] = 8;
                else if (wizardState.baseAbilities[a] < 3) wizardState.baseAbilities[a] = 10;
            });
            refreshWizard();
        });
    }

    // Point-buy steppers (#bij5sk)
    var pbBtns = container.querySelectorAll('[data-action="wizard-pointbuy"]');
    for (var pbi = 0; pbi < pbBtns.length; pbi++) {
        _wzBindOnce(pbBtns[pbi], 'click', function(e) {
            e.stopPropagation();
            var a = this.dataset.ability;
            var dir = parseInt(this.dataset.dir, 10);
            var nv = (wizardState.baseAbilities[a] || 8) + dir;
            if (nv < 8 || nv > 15) return;
            var delta = POINTBUY_COST[nv] - POINTBUY_COST[wizardState.baseAbilities[a]];
            if (dir > 0 && (POINTBUY_BUDGET - pointBuySpent()) < delta) return; // te duur
            wizardState.baseAbilities[a] = nv;
            refreshWizard();
        });
    }

    // Skill checkboxes
    var skillBoxes = container.querySelectorAll('[data-action="wizard-skill"]');
    for (var si = 0; si < skillBoxes.length; si++) {
        _wzBindOnce(skillBoxes[si], 'click', function() {
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
        _wzBindOnce(cantripBoxes[cbi], 'click', function() {
            var cn = this.dataset.cantrip;
            var idx = wizardState.cantrips.indexOf(cn);
            if (this.checked && idx === -1) wizardState.cantrips.push(cn);
            else if (!this.checked && idx !== -1) wizardState.cantrips.splice(idx, 1);
            refreshWizard();
        });
    }

    container.onchange = function(e) {
        var target = e.target;

        if (target.matches('[data-action="wizard-species-change"]')) {
            saveWizardStepData();
            var sp = target.value;
            wizardState.species = sp;
            var lineages = (sp && WIZARD_SPECIES[sp]) ? WIZARD_SPECIES[sp] : [];
            // Soort zonder lineages → race = soort; mét lineages → forceer keuze.
            wizardState.race = lineages.length ? '' : sp;
            refreshWizard();
            return;
        }

        if (target.matches('[data-action="wizard-lineage-change"]')) {
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

        if (target.matches('[data-action="wizard-array-assign"]')) {
            saveWizardStepData();
            var aAb = target.dataset.ability;
            var aVal = parseInt(target.value, 10) || 0;
            // Standard array: elke waarde precies 1×. Pakt een ander veld al deze
            // waarde, wissel die om (swap) zodat geen waarde dubbel/verloren raakt.
            if (aVal) {
                ABILITY_KEYS.forEach(function(other) {
                    if (other !== aAb && wizardState.baseAbilities[other] === aVal) {
                        wizardState.baseAbilities[other] = wizardState.baseAbilities[aAb] || 0;
                    }
                });
            }
            wizardState.baseAbilities[aAb] = aVal;
            refreshWizard();
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

    // ----- Image-box (gedeeld door NPC/Lore-modals): klik in box → keuze-menu -----
    var _imgPickBtn = target.closest('[data-action="img-pick-existing"]');
    if (_imgPickBtn) {
        var _ipBox = _imgPickBtn.closest('.lore-image-box');
        if (typeof closeAllImageMenus === 'function') closeAllImageMenus();
        if (typeof openImagePicker === 'function') openImagePicker({ onPick: function (refValue, url) {
            if (typeof setImageBoxValue === 'function') setImageBoxValue(_ipBox, refValue, url);
        }});
        return;
    }
    var _imgUpBtn = target.closest('[data-action="img-upload"]');
    if (_imgUpBtn) {
        var _iuBox = _imgUpBtn.closest('.lore-image-box');
        if (typeof closeAllImageMenus === 'function') closeAllImageMenus();
        var _fileInp = _iuBox ? _iuBox.querySelector('.img-box-file') : null;
        if (_fileInp) _fileInp.click();
        return;
    }
    var _imgRmBtn = target.closest('[data-action="img-remove"]');
    if (_imgRmBtn) {
        if (typeof setImageBoxValue === 'function') setImageBoxValue(_imgRmBtn.closest('.lore-image-box'), '', '');
        if (typeof closeAllImageMenus === 'function') closeAllImageMenus();
        return;
    }
    var _imgBoxToggle = target.closest('[data-action="toggle-img-menu"]');
    if (_imgBoxToggle && !target.closest('.lore-image-menu')) {
        if (typeof toggleImageMenu === 'function') toggleImageMenu(_imgBoxToggle);
        return;
    }
    if (!target.closest('.lore-image-box') && typeof closeAllImageMenus === 'function') {
        closeAllImageMenus();   // klik buiten een box → sluit open keuze-menu
    }

    // ----- Modal-paginatie (lore + NPC) -----
    if (target.closest('[data-action="modal-page-prev"]')) {
        if (typeof goModalPage === 'function') goModalPage(_modalPage - 1);
        return;
    }
    if (target.closest('[data-action="modal-page-next"]')) {
        if (typeof goModalPage === 'function') goModalPage(_modalPage + 1);
        return;
    }

    // ----- NPC editor-modal (op document-niveau; modal hangt aan body) -----
    // Sluiten: klik op de overlay-achtergrond, of op een close/cancel-knop.
    if (target.matches('.npc-modal-overlay') || target.closest('[data-action="close-npc-modal"]')) {
        if (typeof closeNPCModal === 'function') closeNPCModal();
        return;
    }
    if (target.closest('[data-action="save-npc-modal"]')) {
        if (typeof saveNPCModal === 'function') saveNPCModal();
        return;
    }
    if (target.closest('[data-action="remove-npc-image"]')) {
        var npcHid = document.getElementById('npc-f-image');
        if (npcHid) npcHid.value = '';
        var npcPrev = document.getElementById('npc-image-preview');
        if (npcPrev) npcPrev.innerHTML = '<span class="npc-portrait-empty">?</span>';
        return;
    }

    // ----- Lore-entry editor-modal -----
    if (target.matches('.lore-entry-modal-overlay') || target.closest('[data-action="close-lore-entry-modal"]')) {
        if (typeof closeLoreEntryModal === 'function') closeLoreEntryModal();
        return;
    }

    // ----- Maps: dimensions-manager + add-map window (hangen aan <body>) -----
    if (target.matches('.maps-modal-overlay') || target.closest('[data-action="close-maps-modal"]')) {
        if (typeof closeMapsModal === 'function') closeMapsModal();
        return;
    }
    if (target.closest('[data-action="submit-add-dimension"]')) {
        var dnEl = document.getElementById('dim-new-name');
        var dimName = dnEl ? dnEl.value.trim() : '';
        if (!dimName) { if (dnEl) dnEl.focus(); return; }
        var mData = getMapsData();
        mData.dimensions.push({ id: 'dim' + Date.now(), name: dimName, maps: [{ id: 'map' + Date.now(), name: t('maps.mainmap'), image: null, isRoot: true, pins: [] }] });
        saveMapsData(mData);
        activeDimension = mData.dimensions.length - 1;
        if (typeof refreshDimensionsModal === 'function') refreshDimensionsModal();
        renderApp();
        return;
    }
    if (target.closest('[data-action="delete-dimension"]')) {
        var ddBtn = target.closest('[data-action="delete-dimension"]');
        var ddIdx = parseInt(ddBtn.dataset.dim, 10);
        var mDataDd = getMapsData();
        if (!mDataDd.dimensions || mDataDd.dimensions.length <= 1) {
            if (typeof showToast === 'function') showToast(t('maps.dimension.cantdeletelast'), 'error');
            return;
        }
        if (!confirm(t('maps.dimension.deleteconfirm'))) return;
        var rmDim = mDataDd.dimensions[ddIdx];
        if (rmDim && Array.isArray(rmDim.maps) && typeof DWImages !== 'undefined') {
            rmDim.maps.forEach(function (m) { if (m.image && DWImages.isHttpUrl && DWImages.isHttpUrl(m.image)) { try { DWImages.del(m.image); } catch (e) {} } });
        }
        mDataDd.dimensions.splice(ddIdx, 1);
        saveMapsData(mDataDd);
        if (activeDimension >= mDataDd.dimensions.length) activeDimension = mDataDd.dimensions.length - 1;
        activeMapId = null;
        if (typeof refreshDimensionsModal === 'function') refreshDimensionsModal();
        renderApp();
        return;
    }
    if (target.closest('[data-action="submit-add-map"]')) {
        if (typeof submitAddMap === 'function') submitAddMap();
        return;
    }
    if (target.closest('[data-action="submit-rename-map"]')) {
        var rmCard = document.querySelector('.maps-modal-active [data-rename-map-id]');
        var rmInput = document.getElementById('rename-map-input');
        var rmId = rmCard ? rmCard.dataset.renameMapId : null;
        var rmName = rmInput ? rmInput.value.trim() : '';
        if (rmId && rmName) {
            var rmData = getMapsData();
            var rmDim = rmData.dimensions[activeDimension];
            if (rmDim && rmDim.maps) {
                var rmMap = rmDim.maps.filter(function (m) { return m.id === rmId; })[0];
                if (rmMap) { rmMap.name = rmName; saveMapsData(rmData); }
            }
        }
        if (typeof closeMapsModal === 'function') closeMapsModal();
        renderApp();
        return;
    }
    if (target.closest('[data-action="save-lore-entry-modal"]')) {
        if (typeof saveLoreEntryModal === 'function') saveLoreEntryModal();
        return;
    }
    if (target.closest('[data-action="remove-lore-entry-image"]')) {
        var leHid = document.getElementById('lore-entry-f-image');
        if (leHid) leHid.value = '';
        var lePrev = document.getElementById('lore-entry-image-preview');
        if (lePrev) lePrev.innerHTML = '<span class="npc-portrait-empty">?</span>';
        return;
    }

    // ----- Afbeelding-picker (kies bestaande = live referentie) -----
    var pickBtn = target.closest('[data-action="pick-existing-image"]');
    if (pickBtn) {
        if (typeof openImagePicker === 'function') {
            openImagePicker({ hiddenId: pickBtn.dataset.targetHidden, previewId: pickBtn.dataset.targetPreview });
        }
        return;
    }
    if (target.matches('.img-picker-overlay') || target.closest('[data-action="close-img-picker"]')) {
        if (typeof closeImagePicker === 'function') closeImagePicker();
        return;
    }
    var thumb = target.closest('[data-action="select-picker-image"]');
    if (thumb) {
        if (typeof pickExistingImage === 'function') pickExistingImage(thumb.dataset.ref, thumb.dataset.url);
        return;
    }

    // ----- Globale Search -----
    if (target.closest('[data-action="open-search"]')) {
        if (typeof openSearch === 'function') openSearch();
        return;
    }
    if (target.matches('.search-overlay') || target.closest('[data-action="close-search"]')) {
        if (typeof closeSearch === 'function') closeSearch();
        return;
    }
    if (target.closest('[data-action="search-show-all"]')) {
        searchShowAll = true;
        if (typeof rerenderSearch === 'function') rerenderSearch();
        return;
    }
    // Klik op een zoekresultaat (goto-entity binnen de search-overlay): sluit
    // de overlay, navigeer en laat de doel-kaart oplichten.
    var searchLink = target.closest('.search-active [data-action="goto-entity"]');
    if (searchLink) {
        var et = searchLink.dataset.etype, ei = searchLink.dataset.eid;
        if (et === 'npc' || et === 'lore') window._dwEntityFocus = { type: et, id: ei };
        if (typeof closeSearch === 'function') closeSearch();
        var dest = searchLink.getAttribute('href') || '';
        if (dest && dest === (location.pathname || '/')) {
            if (typeof applyEntityFocus === 'function') applyEntityFocus();
            e.preventDefault();
        }
        return;
    }
});

// Document-level input listener voor de afbeelding-picker zoekbalk (de picker
// hangt aan body, dus app.oninput vangt 'm niet).
document.addEventListener('input', function(e) {
    if (e.target && e.target.id === 'img-picker-search') {
        imgPickerSearch = e.target.value;
        clearTimeout(e.target._t);
        e.target._t = setTimeout(function() {
            if (typeof rerenderImagePicker === 'function') rerenderImagePicker();
            var el = document.getElementById('img-picker-search');
            if (el) { el.focus(); var v = el.value.length; el.setSelectionRange(v, v); }
        }, 200);
        return;
    }
    if (e.target && e.target.id === 'global-search-input') {
        searchQuery = e.target.value;
        searchShowAll = false;
        clearTimeout(e.target._t);
        e.target._t = setTimeout(function() {
            if (typeof rerenderSearch === 'function') rerenderSearch();
            var el = document.getElementById('global-search-input');
            if (el) { el.focus(); var v = el.value.length; el.setSelectionRange(v, v); }
        }, 180);
    }
});

// Document-level change listener voor modal file-inputs (modals hangen aan
// body, dus app.onchange vangt ze niet).
document.addEventListener('change', function(e) {
    var target = e.target;

    // Wizard portret-upload (#5Y8aZh): base64 in wizardState.portrait + directe
    // preview. De Cloudinary-upload draait pas bij character-save (charId bestaat
    // dan pas), zodat een geannuleerde wizard geen weesmap achterlaat.
    if (target.matches('[data-action="upload-wizard-portrait"]')) {
        var wpFile = target.files && target.files[0];
        if (wpFile && typeof _compressImageFile === 'function' && wizardState) {
            _compressImageFile(wpFile, 600, 0.8, function (dataUrl) {
                wizardState.portrait = dataUrl;
                // Directe preview zonder volledige re-render.
                var box = document.querySelector('.wizard-sidebar-portrait');
                if (box) {
                    var ph = box.querySelector('.wizard-portrait-placeholder');
                    var im = box.querySelector('.wizard-portrait-img');
                    if (im) { im.src = dataUrl; }
                    else {
                        if (ph) ph.remove();
                        var newImg = document.createElement('img');
                        newImg.className = 'wizard-portrait-img';
                        newImg.alt = '';
                        newImg.src = dataUrl;
                        box.insertBefore(newImg, box.firstChild);
                    }
                }
            });
            try { target.value = ''; } catch (_) {}
        }
        return;
    }
    if (target.matches('[data-action="upload-npc-image"]')) {
        var npcFile = target.files && target.files[0];
        if (npcFile && typeof _compressImageFile === 'function') {
            // Folder = NPC name (Campains/<camp>/NPCs/<name>). Falls back to a
            // timestamp if the name field is still empty at upload time.
            var npcFirstEl = document.getElementById('npc-f-firstName');
            var npcLastEl = document.getElementById('npc-f-lastName');
            var npcName = (((npcFirstEl && npcFirstEl.value.trim()) || '') + ' ' + ((npcLastEl && npcLastEl.value.trim()) || '')).trim() || ('npc' + Date.now());
            _compressImageFile(npcFile, 800, 0.8, function(dataUrl) {
                var prev = document.getElementById('npc-image-preview');
                if (prev) prev.innerHTML = '<img src="' + dataUrl + '" alt="">';
                var hid = document.getElementById('npc-f-image');
                if (!hid) return;
                var _rmBox = hid.closest('.lore-image-box');
                if (_rmBox) { var _rm = _rmBox.querySelector('.menu-remove'); if (_rm) _rm.style.display = ''; }
                // Set the base64 immediately so an early Save never loses the
                // image (race-proof); the Cloudinary URL replaces it when ready.
                hid.value = dataUrl;
                if (window.DWImages && DWImages.save) {
                    hid._uploadPromise = DWImages.save('npc', npcName, dataUrl).then(function(imgVal) {
                        if (imgVal) hid.value = imgVal;
                        hid._uploadPromise = null;
                    }).catch(function() { hid._uploadPromise = null; });
                }
            });
            try { target.value = ''; } catch (_) {}
        }
        return;
    }

    // Add-map window: kies een Place als afbeeldingsbron.
    if (target.id === 'map-f-place') {
        if (typeof addMapPickPlace === 'function') addMapPickPlace(target.value);
        return;
    }

    // Add-map window: nieuwe afbeelding uploaden (wordt ook als Place opgeslagen).
    if (target.matches('[data-action="upload-add-map-image"]')) {
        var amFile = target.files && target.files[0];
        if (amFile && typeof _compressImageFile === 'function') {
            var amNameEl = document.getElementById('map-f-name');
            var amName = (amNameEl && amNameEl.value.trim()) || ('map' + Date.now());
            _compressImageFile(amFile, 1600, 0.8, function (dataUrl) {
                var prev = document.getElementById('map-f-image-preview');
                if (prev) prev.innerHTML = '<img src="' + dataUrl + '" alt="">';
                var hid = document.getElementById('map-f-image');
                var src = document.getElementById('map-f-image-source');
                if (!hid) return;
                hid.value = dataUrl;                 // race-proof fallback
                if (src) src.value = 'upload';
                var placeSel = document.getElementById('map-f-place');
                if (placeSel) placeSel.value = '';   // upload wint van Place-keuze
                if (window.DWImages && DWImages.save) {
                    hid._uploadPromise = DWImages.save('campaign', 'maps/' + amName, dataUrl).then(function (imgVal) {
                        if (imgVal) hid.value = imgVal;
                        hid._uploadPromise = null;
                    }).catch(function () { hid._uploadPromise = null; });
                }
            });
            try { target.value = ''; } catch (_) {}
        }
        return;
    }

    if (target.matches('[data-action="upload-lore-entry-image"]')) {
        var leFile = target.files && target.files[0];
        var leForm = target.closest('.lore-entry-form');
        var leCat = leForm ? (leForm.dataset.cat || 'other') : 'other';
        if (leFile && typeof _compressImageFile === 'function') {
            // Folder = Campains/<camp>/<MappedCat>/<entryName>.
            var leNameEl = document.getElementById('lore-entry-f-name');
            var leName = (leNameEl && leNameEl.value.trim()) || ('le' + Date.now());
            _compressImageFile(leFile, 800, 0.8, function(dataUrl) {
                var prev = document.getElementById('lore-entry-image-preview');
                if (prev) prev.innerHTML = '<img src="' + dataUrl + '" alt="">';
                var hid = document.getElementById('lore-entry-f-image');
                if (!hid) return;
                var _rmBoxL = hid.closest('.lore-image-box');
                if (_rmBoxL) { var _rmL = _rmBoxL.querySelector('.menu-remove'); if (_rmL) _rmL.style.display = ''; }
                hid.value = dataUrl;   // race-proof fallback
                if (window.DWImages && DWImages.save) {
                    hid._uploadPromise = DWImages.save('lore', leCat + '/' + leName, dataUrl).then(function(imgVal) {
                        if (imgVal) hid.value = imgVal;
                        hid._uploadPromise = null;
                    }).catch(function() { hid._uploadPromise = null; });
                }
            });
            try { target.value = ''; } catch (_) {}
        }
        return;
    }
});


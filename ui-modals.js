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
        portraitCrop: null,
        skills: [],
        cantrips: [],
        prepared: [],
        appearance: '',
        personality: { traits: '', ideal: '', bond: '', flaw: '' },
        backstory: '',
        // HP: leeg = auto. hpMaxOverride leeg → afgeleide max (getHP). hpCurrent
        // leeg → start op (effectieve) max. hpTemp leeg → 0.
        hpMaxOverride: '',
        hpCurrent: '',
        hpTemp: ''
    };
}

// Effectieve/afgeleide max HP voor de wizard-preview. Bouwt een mini-config +
// -state uit wizardState en leunt op de engine (getHP/getMaxHP).
function wizardDerivedMaxHP() {
    var cfg = {
        className: wizardState.className,
        race: wizardState.race,
        baseAbilities: wizardState.baseAbilities
    };
    var st = { level: wizardCharLevel(), asiChoices: {} };
    if (wizardState.editId && typeof loadCharState === 'function') {
        var existing = loadCharState(wizardState.editId);
        if (existing && existing.asiChoices) st.asiChoices = existing.asiChoices;
    }
    if (typeof getHP === 'function' && wizardState.className) {
        try { return getHP(cfg, st); } catch (e) {}
    }
    var con = (wizardState.baseAbilities && wizardState.baseAbilities.con) || 10;
    return 10 + Math.floor((con - 10) / 2);
}
// Wat het character als max HP krijgt (override wint als positief getal).
function wizardEffectiveMaxHP() {
    var ov = parseInt(wizardState.hpMaxOverride, 10);
    if (!isNaN(ov) && ov > 0) return ov;
    return wizardDerivedMaxHP();
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

// Volledige ability-prioriteit per class (1e → 6e), waarmee de "Suggested"-knop
// het standard array [15,14,13,12,10,8] toewijst zoals D&D het aanraadt: de
// primaire ability(s) eerst, daarna CON voor overleving (lager bij casters) en
// de rest aflopend. Een suggestie — speler kan altijd handmatig herschikken.
var CLASS_ABILITY_PRIORITY = {
    barbarian: ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    bard:      ['cha', 'dex', 'con', 'wis', 'int', 'str'],
    cleric:    ['wis', 'con', 'str', 'dex', 'cha', 'int'],
    druid:     ['wis', 'con', 'dex', 'int', 'cha', 'str'],
    fighter:   ['str', 'con', 'dex', 'wis', 'cha', 'int'],
    monk:      ['dex', 'wis', 'con', 'str', 'cha', 'int'],
    paladin:   ['cha', 'str', 'con', 'dex', 'wis', 'int'],
    ranger:    ['dex', 'wis', 'con', 'str', 'int', 'cha'],
    rogue:     ['dex', 'con', 'wis', 'int', 'cha', 'str'],
    sorcerer:  ['cha', 'con', 'dex', 'wis', 'int', 'str'],
    warlock:   ['cha', 'con', 'dex', 'wis', 'int', 'str'],
    wizard:    ['int', 'con', 'dex', 'wis', 'cha', 'str']
};

// Geeft een {ability: score}-map volgens de class-prioriteit; valt terug op de
// ABILITY_KEYS-volgorde voor onbekende classes.
function wizardSuggestedArray(className) {
    var order = CLASS_ABILITY_PRIORITY[className] || ABILITY_KEYS.slice();
    var out = {};
    for (var i = 0; i < ABILITY_KEYS.length; i++) {
        out[order[i]] = STANDARD_ARRAY[i];
    }
    return out;
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
        html += '<button type="button" class="wizard-array-suggest" data-action="wizard-array-suggest" title="' + t('wizard.array.suggest.tip') + '">' + t('wizard.array.suggest') + '</button>';
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

// Effectief character-level binnen de wizard. Nieuw character = level 1; bij edit
// het opgeslagen level. 2024 PHB: subclass kies je pas op level 3, dus onder level
// 3 hoort er nergens een subclass getoond of geselecteerd te zijn (#vXF9qQ).
function wizardCharLevel() {
    if (!wizardState || !wizardState.editId) return 1;
    var st = (typeof loadCharState === 'function' && loadCharState(wizardState.editId)) || {};
    return st.level || 1;
}

function renderWizardModal() {
    if (!wizardState) return '';
    var step = wizardState.step;
    var totalSteps = 6;

    var html = '<div class="modal-overlay wizard-overlay">';
    html += '<div class="wizard-modal">';

    // Header
    html += '<div class="wizard-header">';
    html += '<h2 class="wizard-title">' + (wizardState.editId ? (t('wizard.edittitle') === 'wizard.edittitle' ? 'Edit Character' : t('wizard.edittitle')) : t('wizard.title')) + '</h2>';
    html += '<button class="modal-close" data-action="close-wizard">&times;</button>';
    html += '</div>';

    // Horizontal stepper (full width, under header) — gives the steps the whole
    // modal width and removes the cramped vertical-aside overlap (#EG9koC).
    html += '<nav class="wizard-steps" aria-label="Steps">';
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
    html += '<div class="wizard-portrait-wrap">';
    html += '<label class="wizard-sidebar-portrait" style="border-color:' + sidebarColor + '">';
    if (wizardState.portrait) {
        html += '<img id="wizardPortraitImg" class="wizard-portrait-img" src="' + escapeAttr(wizardState.portrait) + '" alt="">';
    } else {
        html += '<span class="wizard-portrait-placeholder">&#128100;</span>';
    }
    html += '<span class="wizard-portrait-overlay" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm0-8.2h2.3l1.2-1.6h2.8A1.7 1.7 0 0 1 22 6.8v10.4A1.7 1.7 0 0 1 20.3 19H3.7A1.7 1.7 0 0 1 2 17.2V6.8A1.7 1.7 0 0 1 3.7 5h2.8L7.7 3H12Z"/></svg></span>';
    html += '<input type="file" accept="image/*" class="wizard-portrait-input" aria-label="Upload portrait" data-action="upload-wizard-portrait">';
    html += '</label>';
    // Crop-knop (#fATDUg): alleen tonen als er een portret is; buiten het <label>
    // zodat een klik niet de file-picker triggert.
    if (wizardState.portrait) {
        html += '<button type="button" class="portrait-crop-btn" data-action="crop-wizard-portrait" title="Crop" aria-label="Crop portrait"><svg viewBox="0 0 24 24"><path d="M7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7V7z M17 15h2V7c0-1.1-.9-2-2-2H9v2h8z"/></svg></button>';
    }
    html += '</div>';
    html += '<div class="wizard-sidebar-name" style="color:' + sidebarColor + '">' + escapeHtml(wizardState.name || '???') + '</div>';
    if (wizardState.race) html += '<div class="wizard-sidebar-detail">' + raceDisplayName(wizardState.race) + '</div>';
    if (wizardState.className) html += '<div class="wizard-sidebar-detail">' + classDisplayName(wizardState.className) + '</div>';
    if (wizardState.subclass && wizardCharLevel() >= 3) html += '<div class="wizard-sidebar-detail" style="color:var(--text-dim);font-size:0.7rem;">' + subclassDisplayName(wizardState.subclass) + '</div>';
    if (wizardState.background && DATA.backgrounds[wizardState.background]) html += '<div class="wizard-sidebar-detail">' + DATA.backgrounds[wizardState.background].name + '</div>';
    // Ability scores mini display
    var abs = ['str','dex','con','int','wis','cha'];
    html += '<div class="wizard-sidebar-abilities">';
    for (var ai = 0; ai < abs.length; ai++) {
        var sbd = abilityBreakdown(abs[ai]);
        html += '<div class="wizard-sidebar-ab" data-tip-title="' + escapeAttr(sbd.tipTitle) + '" data-tip-body="' + escapeAttr(sbd.tipBody) + '">'
            + '<span class="wizard-sidebar-ab-label">' + abs[ai].toUpperCase() + '</span>'
            + '<span class="wizard-sidebar-ab-val">' + sbd.total + '</span>'
            + (sbd.bonus > 0 ? '<span class="wizard-sidebar-ab-bonus">+' + sbd.bonus + '</span>' : '')
            + '</div>';
    }
    html += '</div>';
    // HP-samenvatting (alleen zinvol zodra klasse gekozen is)
    if (wizardState.className) {
        var sbMax = wizardEffectiveMaxHP();
        var sbOver = (parseInt(wizardState.hpMaxOverride, 10) > 0);
        html += '<div class="wizard-sidebar-section"><span class="wizard-sidebar-section-title">Hit Points</span>';
        html += '<span class="wizard-sidebar-tag">♥ ' + sbMax + ' max' + (sbOver ? ' (override)' : '') + '</span>';
        html += '</div>';
    }
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
        html += '<button class="btn btn-primary" data-action="wizard-create">' + (wizardState.editId ? (t('wizard.save') === 'wizard.save' ? 'Save' : t('wizard.save')) : t('wizard.create')) + '</button>';
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
    var wizLevel = wizardCharLevel();
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

    // Hit Points — afgeleide max (klasse + CON + level) met optionele override.
    // Current/Temp defaulten op vol; bij edit voorgevuld uit state.hp.
    var derivedMax = wizardDerivedMaxHP();
    var effMax = wizardEffectiveMaxHP();
    html += '<div class="wizard-field wizard-hp">';
    html += '<label class="wizard-label">Hit Points</label>';
    html += '<div class="wizard-hp-grid">';
    // Max (afgeleid, read-only) + override
    html += '<div class="wizard-hp-cell">';
    html += '<span class="wizard-hp-sub">Max (afgeleid)</span>';
    html += '<span class="wizard-hp-derived" id="wizard-hp-derived">' + derivedMax + '</span>';
    html += '</div>';
    html += '<div class="wizard-hp-cell">';
    html += '<span class="wizard-hp-sub">Override</span>';
    html += '<input type="number" class="wizard-input wizard-input-sm" id="wizard-hp-max" value="' + (wizardState.hpMaxOverride !== '' ? wizardState.hpMaxOverride : '') + '" min="1" max="999" placeholder="' + derivedMax + '">';
    html += '</div>';
    html += '<div class="wizard-hp-cell">';
    html += '<span class="wizard-hp-sub">Current</span>';
    html += '<input type="number" class="wizard-input wizard-input-sm" id="wizard-hp-current" value="' + (wizardState.hpCurrent !== '' ? wizardState.hpCurrent : '') + '" min="0" max="999" placeholder="' + effMax + '">';
    html += '</div>';
    html += '<div class="wizard-hp-cell">';
    html += '<span class="wizard-hp-sub">Temp</span>';
    html += '<input type="number" class="wizard-input wizard-input-sm" id="wizard-hp-temp" value="' + (wizardState.hpTemp !== '' ? wizardState.hpTemp : '') + '" min="0" max="999" placeholder="0">';
    html += '</div>';
    html += '</div>';
    html += '<p class="wizard-hint">Max wordt automatisch berekend uit klasse, CON en level. Vul Override alleen in voor gerolde/homebrew HP. Current/Temp leeg = volledig.</p>';
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

    // 2024 PHB: een background geeft 2 VASTE skills + een Origin Feat. Deze staan
    // los van de class-skill-keuzes en zijn niet kiesbaar. We tonen ze als
    // "granted" en sluiten ze uit van de class-lijst zodat je geen duplicaat kiest
    // (overlap-regel) en het keuzebudget niet wordt opgegeten.
    var bgData = wizardState.background ? DATA.backgrounds[wizardState.background] : null;
    var bgSkills = bgData && bgData.skills ? bgData.skills.map(function (s) { return s.toLowerCase(); }) : [];

    var availableSkills = (skillOpts.indexOf("any") !== -1 ? allSkills : skillOpts)
        .filter(function (s) { return bgSkills.indexOf(s) === -1; });

    // Granted-sectie (background skills + tool + origin feat).
    if (bgData) {
        html += '<div class="wizard-field wizard-granted">';
        html += '<label class="wizard-label">From your background (granted)</label>';
        html += '<div class="wizard-skill-grid">';
        for (var bi = 0; bi < bgSkills.length; bi++) {
            html += '<label class="wizard-skill-item checked disabled" title="Granted by ' + escapeAttr(bgData.name) + '">';
            html += '<input type="checkbox" checked disabled>';
            html += '<span>' + capitalize(bgSkills[bi]) + '</span>';
            html += '</label>';
        }
        html += '</div>';
        if (bgData.tool) html += '<p class="wizard-detail"><strong>Tool:</strong> ' + escapeHtml(bgData.tool) + '</p>';
        if (bgData.feat) html += '<p class="wizard-detail"><strong>Origin Feat:</strong> ' + escapeHtml(bgData.feat) + '</p>';
        html += '</div>';
    }

    // Budget telt alleen skills die uit déze class-lijst komen. Background-skills
    // (vast toegekend, en bij edit-modus al in wizardState.skills geladen) mogen het
    // class-keuzebudget niet opeten — anders kon je er minder kiezen dan het label
    // zegt (#klopt-aantal / "kan er maar 1 selecteren").
    var classChosenCount = wizardState.skills.filter(function (s) {
        return availableSkills.indexOf(s) !== -1;
    }).length;

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Choose ' + skillCount + ' class skills:</label>';
    html += '<div class="wizard-skill-grid">';
    for (var i = 0; i < availableSkills.length; i++) {
        var sk = availableSkills[i];
        var checked = wizardState.skills.indexOf(sk) !== -1;
        var disabled = !checked && classChosenCount >= skillCount;
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
            html += '<label class="wizard-label">Choose ' + cantripsCount + ' cantrips:</label>';
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

    // Level-1 spell selection for spellcasters (#6). 2024: full casters prepare from
    // their list; count = spellcasting-ability mod + level (zie getMaxPrepared, zodat
    // de wizard exact matcht met het spell-prep scherm). Half casters (paladin/ranger)
    // krijgen pas spells vanaf level 2 → overslaan. Geen L1-spell-data → overslaan.
    var spellLevel1 = getSpellsForLevel(wizardState.className, 1);
    var startsLater = (classData.spellcastingStart || 1) > 1;
    if (!startsLater && spellLevel1 && spellLevel1.length > 0) {
        var castAbil = (typeof getSpellcastingAbility === 'function')
            ? getSpellcastingAbility(wizardState.className, wizardState.subclass) : 'cha';
        var totalAbil = (wizardState.baseAbilities[castAbil] || 10) + (calcBgBonuses()[castAbil] || 0);
        var castMod = Math.floor((totalAbil - 10) / 2);
        var spellCount = (typeof getMaxPrepared === 'function')
            ? getMaxPrepared({ level: 1 }, castMod, wizardState.className)
            : Math.max(1, castMod + 1);
        if (spellCount > 0) {
            html += '<div class="wizard-field">';
            html += '<label class="wizard-label">Choose ' + spellCount + ' level-1 spells (' + castAbil.toUpperCase() + '):</label>';
            html += '<div class="wizard-skill-grid">';
            for (var spi = 0; spi < spellLevel1.length; spi++) {
                var ls = spellLevel1[spi];
                var lchecked = wizardState.prepared.indexOf(ls.name) !== -1;
                var ldisabled = !lchecked && wizardState.prepared.length >= spellCount;
                html += '<label class="wizard-skill-item' + (lchecked ? ' checked' : '') + (ldisabled ? ' disabled' : '') + '">';
                html += '<input type="checkbox" data-action="wizard-spell" data-spell="' + escapeAttr(ls.name) + '"' + (lchecked ? ' checked' : '') + (ldisabled ? ' disabled' : '') + '>';
                html += '<span>' + escapeHtml(ls.name) + '</span>';
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
    html += '<label class="wizard-label">Personality Traits</label>';
    html += '<textarea class="wizard-textarea wizard-textarea-sm" id="wizard-traits" placeholder="Traits...">' + escapeHtml(wizardState.personality.traits) + '</textarea>';
    html += '</div>';

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Ideal</label>';
    html += '<textarea class="wizard-textarea wizard-textarea-sm" id="wizard-ideal" placeholder="Ideal...">' + escapeHtml(wizardState.personality.ideal) + '</textarea>';
    html += '</div>';

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Bond</label>';
    html += '<textarea class="wizard-textarea wizard-textarea-sm" id="wizard-bond" placeholder="Bond...">' + escapeHtml(wizardState.personality.bond) + '</textarea>';
    html += '</div>';

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Flaw</label>';
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
    html += '<h4>Basics</h4>';
    html += '<p><strong>' + t('wizard.summary.name') + '</strong> ' + escapeHtml(wizardState.name || t('wizard.empty')) + '</p>';
    html += '<p><strong>' + t('wizard.summary.race') + '</strong> ' + (wizardState.race ? raceDisplayName(wizardState.race) : t('wizard.notchosen')) + '</p>';
    html += '<p><strong>' + t('wizard.summary.class') + '</strong> ' + (wizardState.className ? classDisplayName(wizardState.className) : t('wizard.notchosen')) + '</p>';
    html += '</div>';

    // Background
    html += '<div class="wizard-summary-section">';
    html += '<h4>Background</h4>';
    var bgName = wizardState.background && DATA.backgrounds[wizardState.background] ? DATA.backgrounds[wizardState.background].name : t('wizard.notchosen');
    html += '<p><strong>Background:</strong> ' + bgName + '</p>';

    // Ability scores with bonuses
    var abs = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
    var bgBonuses = calcBgBonuses();
    html += '<p><strong>Ability Scores:</strong></p>';
    html += '<div class="wizard-abilities wizard-abilities-summary">';
    for (var i = 0; i < abs.length; i++) {
        var ab = abs[i];
        var bd = abilityBreakdown(ab);
        html += '<div class="wizard-ability" data-tip-title="' + escapeAttr(bd.tipTitle) + '" data-tip-body="' + escapeAttr(bd.tipBody) + '">';
        html += '<label>' + ab.toUpperCase() + '</label>';
        html += '<span class="wizard-ability-total">' + bd.total + '</span>';
        if (bd.bonus > 0) html += '<span class="wizard-ability-bonus">(+' + bd.bonus + ')</span>';
        html += '</div>';
    }
    html += '</div>';
    html += '</div>';

    // Details
    var sumBg = wizardState.background ? DATA.backgrounds[wizardState.background] : null;
    html += '<div class="wizard-summary-section">';
    html += '<h4>Details</h4>';
    if (wizardState.subclass && wizardCharLevel() >= 3) html += '<p><strong>Subclass:</strong> ' + subclassDisplayName(wizardState.subclass) + '</p>';
    if (sumBg && sumBg.feat) html += '<p><strong>Origin Feat:</strong> ' + escapeHtml(sumBg.feat) + '</p>';
    html += '<p><strong>Alignment:</strong> ' + wizardState.alignment + '</p>';
    if (wizardState.age) html += '<p><strong>Age:</strong> ' + wizardState.age + '</p>';
    html += '</div>';

    // Skills — class-keuzes + vaste background-skills (2024), deduped.
    var sumBgSkills = sumBg && sumBg.skills ? sumBg.skills.map(function (s) { return s.toLowerCase(); }) : [];
    var allChosenSkills = wizardState.skills.slice();
    sumBgSkills.forEach(function (s) { if (allChosenSkills.indexOf(s) === -1) allChosenSkills.push(s); });
    if (allChosenSkills.length > 0) {
        html += '<div class="wizard-summary-section">';
        html += '<h4>Skills</h4>';
        html += '<p>' + allChosenSkills.map(function(s) { return capitalize(s); }).join(', ') + '</p>';
        html += '</div>';
    }

    // Cantrips
    if (wizardState.cantrips.length > 0) {
        html += '<div class="wizard-summary-section">';
        html += '<h4>Cantrips</h4>';
        html += '<p>' + wizardState.cantrips.join(', ') + '</p>';
        html += '</div>';
    }

    // Spells (level 1)
    if (wizardState.prepared.length > 0) {
        html += '<div class="wizard-summary-section">';
        html += '<h4>Spells</h4>';
        html += '<p>' + wizardState.prepared.map(function(s) { return escapeHtml(s); }).join(', ') + '</p>';
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

// Opbouw van een ability-waarde voor de summary: standaard-array basewaarde +
// verdeelde background-bonus = totaal. Levert ook de tooltip-tekst (title/body)
// die het custom tooltip-systeem (wg-events.js, document-breed op data-tip-*)
// oppikt — zo zie je bij hover/long-press hoe de waarde is opgebouwd.
function abilityBreakdown(ab) {
    var base = wizardState.baseAbilities[ab] || 0;
    var bonus = calcBgBonuses()[ab] || 0;
    var total = base + bonus;
    var bgName = (wizardState.background && DATA.backgrounds[wizardState.background])
        ? DATA.backgrounds[wizardState.background].name : 'background';
    var lines = ['Base ' + base];
    if (bonus > 0) lines.push('+' + bonus + ' from ' + bgName + ' (background)');
    lines.push('= ' + total);
    return {
        base: base, bonus: bonus, total: total,
        tipTitle: ab.toUpperCase() + ' ' + total,
        tipBody: lines.join('\n'),
    };
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
                wizardState.prepared = [];
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
        var hpMaxEl = document.getElementById('wizard-hp-max');
        var hpCurEl = document.getElementById('wizard-hp-current');
        var hpTmpEl = document.getElementById('wizard-hp-temp');
        if (hpMaxEl) wizardState.hpMaxOverride = hpMaxEl.value.trim();
        if (hpCurEl) wizardState.hpCurrent = hpCurEl.value.trim();
        if (hpTmpEl) wizardState.hpTemp = hpTmpEl.value.trim();
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
            showToast('Standard array: assign each of 15/14/13/12/10/8 exactly once.', 'error');
            return false;
        }
    } else if (wizardState.abilityMethod === 'pointbuy') {
        var bad = ABILITY_KEYS.some(function (a) { var v = wizardState.baseAbilities[a]; return v < 8 || v > 15; });
        if (bad || pointBuySpent() > POINTBUY_BUDGET) {
            showToast('Point buy: scores 8-15 and at most ' + POINTBUY_BUDGET + ' points.', 'error');
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

    // 2024: background geeft 2 vaste skills + een Origin Feat. Skills mergen in
    // defaultSkills (dedupe), feat los bewaren voor weergave + state.asiChoices.
    var bgData = wizardState.background ? DATA.backgrounds[wizardState.background] : null;
    var bgSkills = bgData && bgData.skills ? bgData.skills.map(function (s) { return s.toLowerCase(); }) : [];
    var bgFeat = bgData && bgData.feat ? bgData.feat : '';
    var mergedSkills = wizardState.skills.slice();
    bgSkills.forEach(function (s) { if (mergedSkills.indexOf(s) === -1) mergedSkills.push(s); });

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
        originFeat: bgFeat,
        defaultSkills: mergedSkills,
        defaultCantrips: wizardState.cantrips.slice(),
        defaultPrepared: wizardState.prepared.slice(),
        appearance: wizardState.appearance ? [wizardState.appearance] : (existing.appearance || []),
        personality: Object.assign({}, wizardState.personality),
        backstory: wizardState.backstory || ''
    });
    // Velden die alleen bij een NIEUW character geïnitialiseerd worden.
    if (!isEdit) {
        config.weapons = [];
        config.quotes = [];
        config.defaultItems = [];
        config.charTimeline = [];
        config.family = [];
    }

    // HP max-override: positief getal → bewaren in config.hp.max; leeg → afgeleid
    // (override verwijderen zodat getMaxHP terugvalt op getHP).
    var hpOverride = parseInt(wizardState.hpMaxOverride, 10);
    if (!isNaN(hpOverride) && hpOverride > 0) {
        config.hp = Object.assign({}, config.hp, { max: hpOverride });
    } else if (config.hp) {
        delete config.hp.max;
        if (Object.keys(config.hp).length === 0) delete config.hp;
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
    // Portret-uitsnede (#fATDUg) meeslaan zodat dashboard-widget + sheet hem oppikken.
    if (typeof savePortraitCrop === 'function') {
        savePortraitCrop(charId, wizardState.portraitCrop || null);
    }

    // Edit-modus: runtime-state (level, gekozen skills/items) intact laten, maar
    // HP (current/temp) bijwerken als de gebruiker ze in de wizard heeft gezet.
    if (isEdit) {
        var est = (typeof loadCharState === 'function' && loadCharState(charId)) || {};
        var effMaxE = wizardEffectiveMaxHP();
        var prevHp = est.hp || {};
        var prevDS = prevHp.deathSaves || est.deathSaves || { successes: 0, failures: 0 };
        var curE = parseInt(wizardState.hpCurrent, 10);
        var tmpE = parseInt(wizardState.hpTemp, 10);
        var startCurE = (!isNaN(curE) && curE >= 0) ? Math.min(curE, effMaxE) : Math.min(
            (typeof prevHp.current === 'number') ? prevHp.current
              : (typeof est.currentHP === 'number' ? est.currentHP : effMaxE), effMaxE);
        var startTmpE = (!isNaN(tmpE) && tmpE >= 0) ? tmpE
            : (typeof prevHp.temp === 'number' ? prevHp.temp : (typeof est.tempHP === 'number' ? est.tempHP : 0));
        var aliveE = startCurE > 0;
        est.hp = {
            current: startCurE,
            temp: startTmpE,
            deathSaves: aliveE ? { successes: 0, failures: 0 } : prevDS,
            stable: aliveE ? false : !!prevHp.stable,
            dead: aliveE ? false : !!prevHp.dead
        };
        // Legacy platte velden meespiegelen voor backward-compat readers.
        est.currentHP = startCurE;
        est.tempHP = startTmpE;
        saveCharState(charId, est);
        showToast(t('wizard.editsuccess') === 'wizard.editsuccess' ? 'Character updated' : t('wizard.editsuccess'), 'success');
        return charId;
    }

    // Save default state. Origin Feat (2024) gaat in asiChoices op level 1 zodat de
    // bestaande feat-engine (engine.js leest state.asiChoices per level) hem oppikt;
    // mechanische sub-keuzes van sommige feats (bv. Magic Initiate-spells) worden
    // nog niet automatisch toegepast — alleen de feat-naam wordt vastgelegd.
    // HP: nieuw character start op (effectieve) max tenzij anders ingevuld.
    var effMaxNew = wizardEffectiveMaxHP();
    var curNew = parseInt(wizardState.hpCurrent, 10);
    var tmpNew = parseInt(wizardState.hpTemp, 10);
    var startCurNew = (!isNaN(curNew) && curNew >= 0) ? Math.min(curNew, effMaxNew) : effMaxNew;
    var startTmpNew = (!isNaN(tmpNew) && tmpNew >= 0) ? tmpNew : 0;
    var defaultState = {
        level: 1,
        skills: mergedSkills.slice(),
        expertise: [],
        cantrips: wizardState.cantrips.slice(),
        prepared: wizardState.prepared.slice(),
        metamagic: [],
        asiChoices: bgFeat ? { 1: { type: 'feat', feat: bgFeat, origin: true } } : {},
        favorites: [],
        items: [],
        customAbilities: null,
        hp: { current: startCurNew, temp: startTmpNew, deathSaves: { successes: 0, failures: 0 }, stable: false, dead: false },
        currentHP: startCurNew,
        tempHP: startTmpNew,
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
    wizardState.prepared = (cfg.defaultPrepared || []).slice();
    wizardState.appearance = (cfg.appearance && cfg.appearance[0]) ? cfg.appearance[0] : '';
    wizardState.portrait = (typeof loadImage === 'function') ? (loadImage(charId, 'portrait') || '') : '';
    wizardState.portraitCrop = loadPortraitCrop(charId);
    wizardState.personality = Object.assign({ traits:'', ideal:'', bond:'', flaw:'' }, cfg.personality || {});
    wizardState.backstory = cfg.backstory || '';
    // HP voorvullen: override uit config.hp.max, current/temp uit state.hp (canoniek)
    // met fallback op de legacy platte velden.
    wizardState.hpMaxOverride = (cfg.hp && typeof cfg.hp.max === 'number') ? String(cfg.hp.max) : '';
    var est = (typeof loadCharState === 'function' && loadCharState(charId)) || {};
    var ehp = est.hp || {};
    var curVal = (typeof ehp.current === 'number') ? ehp.current
        : (typeof est.currentHP === 'number' ? est.currentHP : '');
    var tmpVal = (typeof ehp.temp === 'number') ? ehp.temp
        : (typeof est.tempHP === 'number' ? est.tempHP : '');
    wizardState.hpCurrent = (curVal === '' ? '' : String(curVal));
    wizardState.hpTemp = (tmpVal === '' || tmpVal === 0 ? '' : String(tmpVal));
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

// #fATDUg: positioneer de wizard-sidebar-preview volgens de opgeslagen uitsnede
// (focal {x,y} 0-100 + zoom). Zelfde cover+focal-formule als het SVG-widget, zodat
// wizard en dashboard identiek croppen. Zonder uitsnede → default CSS-cover.
function hydrateWizardPortraitCrop() {
    var img = document.getElementById('wizardPortraitImg');
    if (!img) return;
    var crop = wizardState && wizardState.portraitCrop;
    var box = img.closest('.wizard-sidebar-portrait');
    var hasCrop = crop && (crop.zoom > 1.001 || crop.x !== 50 || crop.y !== 50);
    if (!box || !hasCrop) {
        img.style.position = ''; img.style.left = ''; img.style.top = '';
        img.style.width = ''; img.style.height = ''; img.style.maxWidth = ''; img.style.objectFit = '';
        return;
    }
    var apply = function () {
        var bw = box.clientWidth || 120, bh = box.clientHeight || 120;
        var nw = img.naturalWidth, nh = img.naturalHeight;
        if (!nw || !nh) return;
        var z = Math.max(1, crop.zoom || 1);
        var fx = Math.min(1, Math.max(0, (crop.x == null ? 50 : crop.x) / 100));
        var fy = Math.min(1, Math.max(0, (crop.y == null ? 50 : crop.y) / 100));
        var scale = Math.max(bw / nw, bh / nh) * z;
        var rw = nw * scale, rh = nh * scale;
        img.style.position = 'absolute';
        img.style.left = (-(rw - bw) * fx) + 'px';
        img.style.top = (-(rh - bh) * fy) + 'px';
        img.style.width = rw + 'px';
        img.style.height = rh + 'px';
        img.style.maxWidth = 'none';
        img.style.objectFit = 'fill';
    };
    if (img.complete && img.naturalWidth) apply();
    else img.onload = apply;
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

    // Crop-knop (#fATDUg) — opent de crop-editor; bij opslaan zet de uitsnede in
    // wizardState (gepersisteerd bij character-save) en hydrateert de preview.
    var cropBtn = container.querySelector('[data-action="crop-wizard-portrait"]');
    _wzBindOnce(cropBtn, 'click', function(e) {
        e.stopPropagation();
        if (!wizardState || !wizardState.portrait) return;
        if (typeof openCropEditor !== 'function') { showToast('Crop-editor niet geladen', 'error'); return; }
        openCropEditor({
            src: wizardState.portrait,
            crop: wizardState.portraitCrop,
            shape: 'square',
            onSave: function (newCrop) {
                wizardState.portraitCrop = newCrop;
                hydrateWizardPortraitCrop();
            }
        });
    });

    // Pas een eventuele uitsnede toe op de sidebar-preview.
    hydrateWizardPortraitCrop();

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

    // "Suggested"-knop: vult het standard array automatisch volgens class-prioriteit.
    var suggestBtns = container.querySelectorAll('[data-action="wizard-array-suggest"]');
    for (var sgi = 0; sgi < suggestBtns.length; sgi++) {
        _wzBindOnce(suggestBtns[sgi], 'click', function(e) {
            e.stopPropagation();
            if (wizardState.abilityMethod !== 'array') return;
            var sug = wizardSuggestedArray(wizardState.className);
            ABILITY_KEYS.forEach(function(a) { wizardState.baseAbilities[a] = sug[a] || 0; });
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

    // Level-1 spell checkboxes (#6)
    var spellBoxes = container.querySelectorAll('[data-action="wizard-spell"]');
    for (var sbi = 0; sbi < spellBoxes.length; sbi++) {
        _wzBindOnce(spellBoxes[sbi], 'click', function() {
            var sn = this.dataset.spell;
            var idx = wizardState.prepared.indexOf(sn);
            if (this.checked && idx === -1) wizardState.prepared.push(sn);
            else if (!this.checked && idx !== -1) wizardState.prepared.splice(idx, 1);
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
                wizardState.prepared = [];
                wizardState.subclass = '';
            }
            refreshWizard();
            return;
        }

        if (target.matches('[data-action="wizard-bg-change"]')) {
            saveWizardStepData();
            wizardState.background = target.value;
            wizardState.bgBonusChoice = { plus2: '', plus1: '' };
            // 2024: background-skills zijn vast en worden apart toegekend. Verwijder
            // ze uit de class-keuzes zodat ze niet dubbel tellen of als class-pick
            // blijven hangen na het wisselen van background.
            var newBg = DATA.backgrounds[wizardState.background];
            var newBgSkills = newBg && newBg.skills ? newBg.skills.map(function (s) { return s.toLowerCase(); }) : [];
            wizardState.skills = wizardState.skills.filter(function (s) { return newBgSkills.indexOf(s) === -1; });
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
                wizardState.portraitCrop = null; // nieuw beeld → reset uitsnede
                // Re-render de sidebar zodat de crop-knop verschijnt + preview klopt.
                if (typeof refreshWizard === 'function') refreshWizard();
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

// ============================================================
// #fATDUg — Portret crop-editor (knop-gebaseerd + sleep/scroll)
// Generiek: gebruikt door het profielfoto-widget (wg-events.js) én de
// character-wizard (bindWizardEvents). Bewerkt focal {x,y} 0-100 + zoom>=1 en
// roept opts.onSave(crop) aan. Slaat zelf niets op — de aanroeper persisteert.
// ============================================================
function openCropEditor(opts) {
    opts = opts || {};
    var src = opts.src;
    if (!src) return;
    // Vierkante preview is de default: het raster (25/50/75% horizontaal +
    // verticaal) geeft een referentiekader om gelijkmatig te croppen. Een caller
    // kan expliciet shape:'circle' vragen.
    var shape = opts.shape === 'circle' ? 'circle' : 'square';
    var st = {
        x: (opts.crop && opts.crop.x != null) ? opts.crop.x : 50,
        y: (opts.crop && opts.crop.y != null) ? opts.crop.y : 50,
        zoom: (opts.crop && opts.crop.zoom) ? Math.max(1, opts.crop.zoom) : 1
    };

    var prev = document.getElementById('crop-editor');
    if (prev) prev.remove();

    var ov = document.createElement('div');
    ov.id = 'crop-editor';
    ov.className = 'modal-overlay crop-editor-overlay';
    ov.innerHTML =
        '<div class="crop-card">' +
            '<div class="crop-header"><h2>Portret bijsnijden</h2>' +
            '<button class="modal-close" data-crop="cancel" aria-label="Sluiten">&times;</button></div>' +
            '<div class="crop-stage"><div class="crop-box crop-' + shape + '">' +
            '<img class="crop-img" alt="" draggable="false">' +
            '<div class="crop-grid" aria-hidden="true"></div></div></div>' +
            '<div class="crop-controls">' +
                '<div class="crop-zoom-row">' +
                    '<button class="crop-btn" data-crop="zoom-out" aria-label="Uitzoomen">&minus;</button>' +
                    '<span class="crop-zoom-val">100%</span>' +
                    '<button class="crop-btn" data-crop="zoom-in" aria-label="Inzoomen">+</button>' +
                '</div>' +
                '<div class="crop-dpad">' +
                    '<button class="crop-btn dpad-up" data-crop="up" aria-label="Omhoog">&#9650;</button>' +
                    '<button class="crop-btn dpad-left" data-crop="left" aria-label="Links">&#9664;</button>' +
                    '<button class="crop-btn dpad-center" data-crop="reset" aria-label="Centreren" title="Reset">&#8982;</button>' +
                    '<button class="crop-btn dpad-right" data-crop="right" aria-label="Rechts">&#9654;</button>' +
                    '<button class="crop-btn dpad-down" data-crop="down" aria-label="Omlaag">&#9660;</button>' +
                '</div>' +
                '<p class="crop-hint">Sleep de foto of gebruik de knoppen. Scrollen zoomt.</p>' +
            '</div>' +
            '<div class="crop-actions">' +
                '<button class="edit-cancel" data-crop="cancel">Annuleren</button>' +
                '<button class="edit-save" data-crop="save">Opslaan</button>' +
            '</div>' +
        '</div>';
    document.body.appendChild(ov);
    if (typeof lockBodyScroll === 'function') lockBodyScroll();

    var box = ov.querySelector('.crop-box');
    var img = ov.querySelector('.crop-img');
    var zoomVal = ov.querySelector('.crop-zoom-val');
    img.src = src;

    var rendered = { rw: 0, rh: 0, bw: 0, bh: 0 };
    function apply() {
        var bw = box.clientWidth, bh = box.clientHeight;
        var nw = img.naturalWidth, nh = img.naturalHeight;
        if (!nw || !nh || !bw) return;
        st.zoom = Math.min(4, Math.max(1, st.zoom));
        st.x = Math.min(100, Math.max(0, st.x));
        st.y = Math.min(100, Math.max(0, st.y));
        var scale = Math.max(bw / nw, bh / nh) * st.zoom;
        var rw = nw * scale, rh = nh * scale;
        img.style.width = rw + 'px';
        img.style.height = rh + 'px';
        img.style.left = (-(rw - bw) * (st.x / 100)) + 'px';
        img.style.top = (-(rh - bh) * (st.y / 100)) + 'px';
        rendered = { rw: rw, rh: rh, bw: bw, bh: bh };
        zoomVal.textContent = Math.round(st.zoom * 100) + '%';
    }
    if (img.complete && img.naturalWidth) apply();
    else img.onload = apply;

    function close() {
        if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
        document.removeEventListener('keydown', onKey);
        ov.remove();
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    document.addEventListener('keydown', onKey);

    ov.addEventListener('click', function (e) {
        if (e.target === ov) { close(); return; }
        var b = e.target.closest('[data-crop]');
        if (!b) return;
        var a = b.dataset.crop;
        var PAN = 4, ZS = 0.15;
        if (a === 'cancel') return close();
        if (a === 'save') {
            if (opts.onSave) opts.onSave({ x: Math.round(st.x), y: Math.round(st.y), zoom: Math.round(st.zoom * 100) / 100 });
            return close();
        }
        if (a === 'zoom-in') st.zoom += ZS;
        else if (a === 'zoom-out') st.zoom -= ZS;
        else if (a === 'up') st.y -= PAN;
        else if (a === 'down') st.y += PAN;
        else if (a === 'left') st.x -= PAN;
        else if (a === 'right') st.x += PAN;
        else if (a === 'reset') { st.x = 50; st.y = 50; st.zoom = 1; }
        apply();
    });

    box.addEventListener('wheel', function (e) {
        e.preventDefault();
        st.zoom += (e.deltaY < 0 ? 0.1 : -0.1);
        apply();
    }, { passive: false });

    var drag = null;
    box.addEventListener('pointerdown', function (e) {
        drag = { sx: e.clientX, sy: e.clientY, x: st.x, y: st.y };
        try { box.setPointerCapture(e.pointerId); } catch (_) {}
        box.classList.add('dragging');
    });
    box.addEventListener('pointermove', function (e) {
        if (!drag) return;
        var ovx = rendered.rw - rendered.bw, ovy = rendered.rh - rendered.bh;
        if (ovx > 0) st.x = drag.x - ((e.clientX - drag.sx) / ovx) * 100;
        if (ovy > 0) st.y = drag.y - ((e.clientY - drag.sy) / ovy) * 100;
        apply();
    });
    function endDrag(e) {
        if (!drag) return;
        drag = null;
        box.classList.remove('dragging');
        try { box.releasePointerCapture(e.pointerId); } catch (_) {}
    }
    box.addEventListener('pointerup', endDrag);
    box.addEventListener('pointercancel', endDrag);
}


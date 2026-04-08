// D&D Within — Core (auth, router, state, utilities)
// Requires: data.js, engine.js, i18n.js

// Section 1: User / Auth System
// ============================================================

var DEFAULT_USERS = {
    admin:       { name: "Admin", role: "admin", password: "admin", characters: [] },
    ren:         { name: "Joshua", role: "player", password: "joshua", characters: ["ren"] },
    saya:        { name: "Eva", role: "player", password: "eva", characters: ["saya"] },
    ancha:       { name: "Andrew", role: "player", password: "andrew", characters: ["ancha"] },
    varragoth:   { name: "Duko", role: "player", password: "duko", characters: ["varragoth"] },
    placeholder: { name: "Nils", role: "player", password: "nils", characters: ["placeholder"] },
    io:          { name: "Shea", role: "player", password: "shea", characters: ["io"] },
    lira:        { name: "Gloria", role: "player", password: "gloria", characters: ["lira"] },
    nero:        { name: "Thomas", role: "player", password: "thomas", characters: ["nero"] },
    dm:          { name: "Maxime", role: "player", password: "maxime", characters: [] }
};

// Users cache populated from Firebase; falls back to DEFAULT_USERS
var usersCache = null;

function getUserData(userId) {
    if (usersCache && usersCache[userId]) return usersCache[userId];
    if (DEFAULT_USERS[userId]) return DEFAULT_USERS[userId];
    return null;
}

function getUserCharacters(userId) {
    var u = getUserData(userId);
    if (u && u.characters && Array.isArray(u.characters)) return u.characters;
    return [];
}

function userOwnsCharacter(userId, charId) {
    var chars = getUserCharacters(userId);
    if (chars.length > 0) return chars.indexOf(charId) !== -1;
    // Fallback: player owns character with matching ID
    var u = getUserData(userId);
    if (u && u.role === 'player') return charId === userId;
    return false;
}

function getSession() {
    return JSON.parse(localStorage.getItem('dw_session') || 'null');
}

function setSession(userId) {
    localStorage.setItem('dw_session', JSON.stringify({ userId: userId, time: Date.now() }));
}

function clearSession() {
    localStorage.removeItem('dw_session');
}

function currentUser() {
    var s = getSession();
    return s ? getUserData(s.userId) : null;
}

function currentUserId() {
    var s = getSession();
    return s ? s.userId : null;
}

function isAdmin() {
    var u = currentUser();
    return u && u.role === 'admin';
}

function isDMMode() {
    return localStorage.getItem('dw_dm_mode') === 'true';
}

function setDMMode(enabled) {
    localStorage.setItem('dw_dm_mode', enabled ? 'true' : 'false');
}

function isDM() {
    var u = currentUser();
    if (u && u.role === 'admin') return true;
    if (isCampaignDM()) return true;
    return isDMMode();
}

function isCampaignDM(campaignId) {
    var camps = getCampaigns();
    var camp = camps[campaignId || getActiveCampaign()];
    return camp && camp.dm === currentUserId();
}

function getPartyCharIds(campaignId) {
    var camps = getCampaigns();
    var camp = camps[campaignId || getActiveCampaign()];
    if (!camp || !camp.party) return [];
    var ids = [];
    for (var uid in camp.party) {
        if (camp.party[uid]) ids.push(camp.party[uid]);
    }
    return ids;
}

function generateInviteCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function canEdit(charId) {
    var u = currentUser();
    if (u && u.role === 'admin') return true;
    var uid = currentUserId();
    if (!uid) return false;
    return userOwnsCharacter(uid, charId);
}

function canEditWorld() {
    return isDM();
}

// ============================================================
// Section 1a: Toast Notifications
// ============================================================

function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.classList.add('toast-visible'); }, 10);
    setTimeout(function() {
        toast.classList.remove('toast-visible');
        setTimeout(function() { toast.remove(); }, 300);
    }, 2500);
}

// ============================================================
// Section 1b: Color Theme System
// ============================================================

var COLOR_THEMES = [
    { id: 'ocean', name: 'Ocean', accent: '#22d3ee', secondary: '#0891b2', tertiary: '#164e63' },
    { id: 'rose', name: 'Rose', accent: '#f472b6', secondary: '#db2777', tertiary: '#831843' },
    { id: 'emerald', name: 'Emerald', accent: '#34d399', secondary: '#059669', tertiary: '#064e3b' },
    { id: 'amber', name: 'Amber', accent: '#fbbf24', secondary: '#d97706', tertiary: '#78350f' },
    { id: 'violet', name: 'Violet', accent: '#a78bfa', secondary: '#7c3aed', tertiary: '#4c1d95' },
    { id: 'crimson', name: 'Crimson', accent: '#f87171', secondary: '#dc2626', tertiary: '#7f1d1d' },
    { id: 'indigo', name: 'Indigo', accent: '#818cf8', secondary: '#4f46e5', tertiary: '#312e81' },
    { id: 'teal', name: 'Teal', accent: '#2dd4bf', secondary: '#0d9488', tertiary: '#134e4a' },
    { id: 'sunset', name: 'Sunset', accent: '#fb923c', secondary: '#ea580c', tertiary: '#7c2d12' },
    { id: 'sakura', name: 'Sakura', accent: '#f9a8d4', secondary: '#ec4899', tertiary: '#831843' },
    { id: 'gold', name: 'Gold', accent: '#f0c040', secondary: '#ca8a04', tertiary: '#713f12' },
    { id: 'ice', name: 'Ice', accent: '#7dd3fc', secondary: '#0284c7', tertiary: '#0c4a6e' }
];

function getUserTheme() {
    return localStorage.getItem('dw_theme_' + currentUserId()) || 'ocean';
}

function setUserTheme(themeId) {
    localStorage.setItem('dw_theme_' + currentUserId(), themeId);
    applyUserTheme();
}

function applyUserTheme() {
    var themeId = getUserTheme();
    var theme = null;
    for (var i = 0; i < COLOR_THEMES.length; i++) {
        if (COLOR_THEMES[i].id === themeId) { theme = COLOR_THEMES[i]; break; }
    }
    if (theme) {
        var root = document.documentElement;
        root.style.setProperty('--accent', theme.accent);
        root.style.setProperty('--accent-glow', theme.accent + '25');
        root.style.setProperty('--accent-secondary', theme.secondary);
        root.style.setProperty('--accent-tertiary', theme.tertiary);
    }
}

// ============================================================
// Section 1c: Campaign System
// ============================================================

function getActiveCampaign() {
    return localStorage.getItem('dw_active_campaign') || 'valoria';
}

function setActiveCampaign(campaignId) {
    localStorage.setItem('dw_active_campaign', campaignId);
}

var DEFAULT_VALORIA = { name: 'The Serpent of Valoria', dm: 'dm', created: Date.now(), members: ['dm','ren','saya','ancha','varragoth','placeholder','io','lira','nero'], party: { ren: 'ren', saya: 'saya', ancha: 'ancha', varragoth: 'varragoth', placeholder: 'placeholder', io: 'io', lira: 'lira', nero: 'nero' }, inviteCode: 'VALORIA' };

function getCampaigns() {
    var saved = localStorage.getItem('dw_campaigns');
    if (!saved) return { valoria: DEFAULT_VALORIA };
    var camps;
    try { camps = JSON.parse(saved); } catch(e) { return { valoria: DEFAULT_VALORIA }; }
    // Migrate old campaigns missing members/party
    var needsSave = false;
    for (var cid in camps) {
        if (!camps[cid].members) {
            camps[cid].members = camps[cid].dm ? [camps[cid].dm] : [];
            needsSave = true;
        }
        if (!camps[cid].party) {
            camps[cid].party = {};
            needsSave = true;
        }
        if (!camps[cid].inviteCode) {
            camps[cid].inviteCode = generateInviteCode();
            needsSave = true;
        }
    }
    // Ensure valoria has all 8 members
    if (camps.valoria && camps.valoria.members && camps.valoria.members.length < 8) {
        var allPlayers = ['ren','saya','ancha','varragoth','placeholder','io','lira','nero'];
        for (var pi = 0; pi < allPlayers.length; pi++) {
            if (camps.valoria.members.indexOf(allPlayers[pi]) === -1) {
                camps.valoria.members.push(allPlayers[pi]);
                needsSave = true;
            }
        }
        // Also ensure party mappings
        for (var pj = 0; pj < allPlayers.length; pj++) {
            if (!camps.valoria.party[allPlayers[pj]]) {
                camps.valoria.party[allPlayers[pj]] = allPlayers[pj];
                needsSave = true;
            }
        }
    }
    if (needsSave) {
        localStorage.setItem('dw_campaigns', JSON.stringify(camps));
        if (typeof syncUpload === 'function') syncUpload('dw_campaigns');
    }
    return camps;
}

function saveCampaigns(campaigns) {
    localStorage.setItem('dw_campaigns', JSON.stringify(campaigns));
    if (typeof syncUpload === 'function') syncUpload('dw_campaigns');
}

function getUserCampaigns() {
    var uid = currentUserId();
    if (!uid) return [];
    var u = getUserData(uid);
    if (u && u.role === 'admin') return Object.keys(getCampaigns());
    var camps = getCampaigns();
    var result = [];
    for (var cid in camps) {
        var c = camps[cid];
        if (c.dm === uid) { result.push(cid); continue; }
        if (c.members && c.members.indexOf(uid) !== -1) result.push(cid);
    }
    return result;
}

function getCharacterCampaign(charId) {
    var config = loadCharConfig(charId);
    if (config && config.campaign) return config.campaign;
    return 'valoria'; // legacy characters default to valoria
}

// ============================================================
// Section 2: Router
// ============================================================

function navigate(hash) {
    window.location.hash = hash;
}

function getRoute() {
    var hash = window.location.hash.slice(1) || '/';
    var parts = hash.split('/').filter(Boolean);
    return { path: '/' + parts.join('/'), parts: parts };
}

function initRouter() {
    window.addEventListener('hashchange', function() {
        // Close mobile nav on navigation
        var navLinks = document.querySelector('.nav-links.open');
        if (navLinks) navLinks.classList.remove('open');
        renderApp();
    });
    renderApp();
}

// ============================================================
// Section 3: State Management
// ============================================================

function loadCharState(charId) {
    // Try new key first, then migrate old key
    var key = 'dw_char_' + charId;
    var saved = localStorage.getItem(key);

    // Migration from old format
    if (!saved) {
        var oldKey = 'ashvane_' + charId;
        var oldSaved = localStorage.getItem(oldKey);
        if (oldSaved) {
            localStorage.setItem(key, oldSaved);
            saved = oldSaved;
        }
    }

    var config = loadCharConfig(charId);
    var defaults = {
        level: 1,
        skills: config.defaultSkills ? config.defaultSkills.slice() : [],
        expertise: config.defaultExpertise ? config.defaultExpertise.slice() : [],
        cantrips: config.defaultCantrips ? config.defaultCantrips.slice() : [],
        prepared: config.defaultPrepared ? config.defaultPrepared.slice() : [],
        metamagic: [],
        asiChoices: {},
        favorites: [],
        items: (config.defaultItems || []).map(function(i) { return Object.assign({}, i); }),
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

    if (saved) {
        try {
            var parsed = JSON.parse(saved);
            var keys = Object.keys(defaults);
            for (var i = 0; i < keys.length; i++) {
                if (!(keys[i] in parsed)) {
                    parsed[keys[i]] = defaults[keys[i]];
                }
            }
            return parsed;
        } catch (e) { /* fall through to default */ }
    }
    return defaults;
}

function saveCharState(charId, state) {
    var key = 'dw_char_' + charId;
    localStorage.setItem(key, JSON.stringify(state));
    if (typeof syncUpload === 'function') syncUpload(key);
}

function saveCharConfig(charId, config) {
    var key = 'dw_charconfig_' + charId;
    localStorage.setItem(key, JSON.stringify(config));
    if (typeof syncUpload === 'function') syncUpload(key);
}

function saveCharConfigField(charId, field, value) {
    var config = loadCharConfig(charId);
    if (!config) return;
    if (field === 'personality' && typeof value === 'object') {
        config.personality = Object.assign({}, config.personality, value);
    } else if (field === 'appearance' && Array.isArray(value)) {
        config.appearance = value.slice();
    } else if (field === 'quotes' && Array.isArray(value)) {
        config.quotes = value.slice();
    } else {
        config[field] = value;
    }
    saveCharConfig(charId, config);
}

function loadCharConfig(charId) {
    var saved = localStorage.getItem('dw_charconfig_' + charId);
    if (saved) {
        try {
            var config = JSON.parse(saved);
            if (!config.name) config.name = t('char.newcharacter');
            return config;
        } catch (e) { /* ignore */ }
    }
    // Fallback to SEED_DATA for first-time use (before Firebase sync)
    if (typeof SEED_DATA !== 'undefined' && SEED_DATA[charId]) {
        var config = JSON.parse(JSON.stringify(SEED_DATA[charId]));
        if (!config.name) config.name = t('char.newcharacter');
        return config;
    }
    return null;
}

function loadImage(charId, type) {
    return localStorage.getItem('dw_img_' + charId + '_' + type) || '';
}

function saveImage(charId, type, base64) {
    var key = 'dw_img_' + charId + '_' + type;
    localStorage.setItem(key, base64);
    if (typeof syncUpload === 'function') syncUpload(key);
}

// ============================================================
// Section 4: Seed Data (initial campaign data, used for first-time Firebase setup)
// ============================================================

var SEED_DATA = {
    ren: {
        id: "ren", name: "Ren Ashvane", player: "ren",
        race: "woodElf", className: "rogue", subclass: "scout",
        background: "Wayfarer", alignment: "Chaotic Good", age: 19,
        accentColor: "#22d3ee",
        baseAbilities: { str: 10, dex: 16, con: 14, int: 14, wis: 12, cha: 10 },
        backgroundBonuses: { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 2 },
        defaultSkills: ["stealth", "sleight of hand", "perception", "acrobatics", "investigation", "athletics"],
        defaultExpertise: ["stealth", "sleight of hand"],
        weapons: [
            { name: 'Shortsword "Advies"', hit: null, dmg: "1d6", type: "piercing", finesse: true },
            { name: 'Shortsword "Aandacht"', hit: null, dmg: "1d6", type: "piercing", finesse: true },
            { name: 'Shortbow', hit: null, dmg: "1d6", type: "piercing" },
            { name: 'Dagger (thrown)', hit: null, dmg: "1d4", type: "piercing", finesse: true }
        ],
        appearance: [
            "Hoekig gezicht, scherpe kaaklijnen en ingevallen wangen. Donkerbruin haar, kort aan de zijkanten en langer bovenop, rommelig. Amberkleurige ogen, altijd half samengeknepen. Wit litteken dwars over zijn linkerwenkbrauw.",
            "Licht gebruinde huid, eeltige handen. Iets langer dan Saya, mager en pezig. Draagt vaders donkerbruine leren jas die twee maten te groot is. Zachtzolen laarzen \u2014 bijna geluidloos."
        ],
        personality: {
            traits: "Scant elke kamer binnen 3 seconden: uitgangen, wapens, bedreigingen. Praat weinig tegen vreemden, maar wordt warm zodra hij iemand vertrouwt.",
            ideal: "Overleven is geen talent. Het is een keuze die je elke dag opnieuw maakt.",
            bond: "Saya. Niet 'mijn zusje dat ik moet beschermen' \u2014 maar mijn gelijke, mijn partner.",
            flaw: "Vertrouwt niemand behalve Saya. Het kost hem weken om iemand binnen te laten.",
            fear: "Water. De rivier. Leeftijd 17."
        },
        backstory: "Ren en Saya Ashvane werden geboren in een klein dorp aan de rand van het Slangenmoeras. Hun moeder Lira was een voormalige avonturier; hun vader Dorin een stille houtsnijder die drakenbeeldjes sneed bij het kampvuur.\n\nZe waren zeven toen de Slangenmars kwam. Slangenwezens verwoestten hun dorp in \u00e9\u00e9n nacht. Lira viel als laatste. Dorin stierf naast zijn draak-bondgenoot Vuuradem.\n\nDe tweeling overleefde. In de sloppenwijken van Velthaven leerden ze stelen, rennen, en vertrouwen op niemand behalve elkaar. Ren werd de schaduw \u2014 stil, snel, dodelijk met zijn dolken Advies en Aandacht.\n\nWat moeder altijd zei: \"Tel je messen. Tel je uitgangen. Tel je vrienden. In die volgorde.\"\n\nHij draagt nog steeds vaders leren jas en het houten drakenbeeldje. De jas is twee maten te groot. Het beeldje zit in de binnenzak, rechts, waar zijn hand het kan raken zonder dat iemand het ziet.",
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
            { name: 'Shortsword "Advies"', weight: 2, notes: '' },
            { name: 'Shortsword "Aandacht"', weight: 2, notes: '' },
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
        ],
        charTimeline: [
            { age: "0", event: "Geboren in een dorp aan de rand van het Slangenmoeras. Tweelingbroer van Saya." },
            { age: "7", event: "De Slangenmars verwoest het dorp. Moeder Lira en vader Dorin komen om. Tweeling overleeft." },
            { age: "7-17", event: "Opgegroeid in de sloppenwijken van Velthaven. Leerde stelen, rennen, en overleven." },
            { age: "17", event: "De rivier. Iets ergs gebeurde. Sindsdien bang voor water." },
            { age: "19", event: "Verlaat Velthaven met Saya. Het avontuur begint." }
        ],
        family: [
            { name: "Lira Ashvane", relation: "Moeder", tier: "parent", status: "Deceased", notes: "Voormalige avonturier." },
            { name: "Dorin Ashvane", relation: "Vader", tier: "parent", status: "Deceased", notes: "Stille houtsnijder." },
            { name: "Vuuradem", relation: "Vaders bondgenoot", tier: "parent", status: "Deceased", notes: "Draak." },
            { name: "Saya Ashvane", relation: "Tweelingzus", tier: "sibling", status: "Alive", linkedChar: "saya", notes: "Mijn gelijke, mijn partner." }
        ]
    },

    saya: {
        id: "saya", name: "Saya Ashvane", player: "saya",
        race: "woodElf", className: "sorcerer", subclass: "wildMagic",
        background: "Wayfarer", alignment: "Chaotic Good", age: 19,
        accentColor: "#f472b6",
        baseAbilities: { str: 8, dex: 15, con: 14, int: 12, wis: 10, cha: 17 },
        backgroundBonuses: { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 2 },
        defaultSkills: ["deception", "persuasion", "arcana", "sleight of hand"],
        defaultCantrips: ["Fire Bolt", "Prestidigitation", "Minor Illusion", "Mage Hand"],
        defaultPrepared: ["Shield", "Mage Armor", "Chaos Bolt", "Disguise Self"],
        weapons: [],
        appearance: [
            "Smal gezicht met hoge jukbeenderen en een scherpe kin. Donkerbruin haar in een slordige vlecht. Amberkleurige ogen met goudvlekjes \u2014 die violet oplichten als haar magie piekt.",
            "Licht gebruinde huid met sproeten. Vingers bevlekt met inkt. Draagt een oversized donkerpaars linnen overhemd. Moeders koperen ring aan een koord om haar nek."
        ],
        personality: {
            traits: "Neuriet altijd. Tekent kaarten van alles. Praat snel, denkt sneller, liegt het snelst. Maar nooit tegen Ren.",
            ideal: "Controle is een illusie. Maar het is m\u00edjn illusie, en ik ben er goed in.",
            bond: "Ren. De enige die niet wegrende toen ik in brand stond.",
            flaw: "Moet alles in kaart brengen. Als ze het niet kan tekenen, begrijpt ze het niet.",
            fear: "Stilte. Stilte is wat er was vlak voordat de slangen kwamen."
        },
        backstory: "Tweelingzus van Ren, geboren in hetzelfde dorp aan het Slangenmoeras. Waar Ren de schaduw werd, werd Saya de vonk.\n\nToen ze dertien was, stak ze per ongeluk een marktkraam in brand. Niet met een fakkel \u2014 met haar handen. De Wild Magic was altijd al in haar bloed geweest. Ze leerde zichzelf alles: geen academie, geen leraar, geen boeken.\n\nZe vult elke stilte, want stilte is wat er was vlak voordat de slangen kwamen. Ze tekent kaarten van alles en iedereen. Als ze het niet kan tekenen, begrijpt ze het niet.\n\nMoeders koperen ring hangt aan een gevlochten koord om haar nek. Ze raakt hem aan als ze nadenkt. Als een reflex.\n\nWat moeder altijd zei: \"Huilen mag. Maar huil terwijl je doorloopt.\"",
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
        ],
        charTimeline: [
            { age: "0", event: "Geboren in een dorp aan de rand van het Slangenmoeras. Tweelingzus van Ren." },
            { age: "7", event: "De Slangenmars verwoest het dorp. Ouders komen om. Tweeling overleeft." },
            { age: "7-17", event: "Opgegroeid in de sloppenwijken van Velthaven." },
            { age: "13", event: "Stak per ongeluk een marktkraam in brand. Niet met een fakkel \u2014 met haar handen. Wild Magic ontdekt." },
            { age: "13-19", event: "Leerde zichzelf magie. Geen academie, geen leraar, geen boeken." },
            { age: "19", event: "Verlaat Velthaven met Ren. Het avontuur begint." }
        ],
        family: [
            { name: "Lira Ashvane", relation: "Moeder", tier: "parent", status: "Deceased", notes: "Voormalige avonturier." },
            { name: "Dorin Ashvane", relation: "Vader", tier: "parent", status: "Deceased", notes: "Stille houtsnijder." },
            { name: "Vuuradem", relation: "Vaders bondgenoot", tier: "parent", status: "Deceased", notes: "Draak." },
            { name: "Ren Ashvane", relation: "Tweelingbroer", tier: "sibling", status: "Alive", linkedChar: "ren", notes: "De enige die niet wegrende." }
        ]
    },

    ancha: {
        id: "ancha", name: "Ancha", player: "ancha",
        race: "human", className: "ranger", subclass: "hunter",
        background: "Guide", alignment: "Neutral Good", age: 25,
        accentColor: "#4ade80",
        baseAbilities: { str: 12, dex: 16, con: 14, int: 10, wis: 15, cha: 8 },
        backgroundBonuses: { str: 0, dex: 1, con: 0, int: 0, wis: 2, cha: 0 },
        defaultSkills: ["perception", "stealth", "survival"],
        defaultExpertise: [],
        weapons: [
            { name: 'Longbow', hit: null, dmg: "1d8", type: "piercing" },
            { name: 'Shortsword', hit: null, dmg: "1d6", type: "piercing", finesse: true }
        ],
        appearance: ["", ""],
        personality: { traits: "", ideal: "", bond: "", flaw: "", fear: "" },
        backstory: "",
        quotes: [],
        defaultItems: [
            { name: 'Scale mail', weight: 45, notes: '' },
            { name: 'Longbow', weight: 2, notes: '' },
            { name: 'Arrows (20)', weight: 1, notes: '' },
            { name: 'Shortsword', weight: 2, notes: '' },
            { name: 'Quiver', weight: 1, notes: '' },
            { name: "Explorer's pack", weight: 0, notes: 'Inhoud al verdeeld' },
            { name: 'Druidic focus', weight: 0, notes: '' }
        ]
    },

    varragoth: {
        id: "varragoth", name: "Varragoth", player: "varragoth",
        race: "halfling", className: "wizard", subclass: "evocation",
        background: "Sage", alignment: "Neutral", age: 40,
        accentColor: "#818cf8",
        baseAbilities: { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 },
        backgroundBonuses: { str: 0, dex: 0, con: 1, int: 2, wis: 0, cha: 0 },
        defaultSkills: ["arcana", "history"],
        defaultExpertise: [],
        defaultCantrips: ["Fire Bolt", "Prestidigitation", "Mage Hand"],
        defaultPrepared: ["Shield", "Magic Missile", "Detect Magic", "Mage Armor"],
        weapons: [],
        appearance: ["", ""],
        personality: { traits: "", ideal: "", bond: "", flaw: "", fear: "" },
        backstory: "",
        quotes: [],
        defaultItems: [
            { name: 'Quarterstaff', weight: 4, notes: '' },
            { name: 'Component pouch', weight: 2, notes: '' },
            { name: 'Spellbook', weight: 3, notes: '' },
            { name: "Scholar's pack", weight: 0, notes: 'Inhoud al verdeeld' },
            { name: 'Dagger', weight: 1, notes: '' },
            { name: 'Ink & pen set', weight: 0.5, notes: '' },
            { name: 'Parchment (5 sheets)', weight: 0, notes: '' }
        ]
    },

    placeholder: {
        id: "placeholder", name: "Placeholder", player: "placeholder",
        race: "tiefling", className: "paladin", subclass: "devotion",
        background: "Soldier", alignment: "Lawful Good", age: 28,
        accentColor: "#fbbf24",
        baseAbilities: { str: 16, dex: 10, con: 14, int: 8, wis: 12, cha: 15 },
        backgroundBonuses: { str: 2, dex: 0, con: 1, int: 0, wis: 0, cha: 0 },
        defaultSkills: ["athletics", "persuasion"],
        defaultExpertise: [],
        weapons: [
            { name: 'Longsword', hit: null, dmg: "1d8", type: "slashing" },
            { name: 'Shield', hit: null, dmg: "-", type: "-" }
        ],
        appearance: ["", ""],
        personality: { traits: "", ideal: "", bond: "", flaw: "", fear: "" },
        backstory: "",
        quotes: [],
        defaultItems: [
            { name: 'Chain mail', weight: 55, notes: '' },
            { name: 'Longsword', weight: 3, notes: '' },
            { name: 'Shield', weight: 6, notes: '+2 AC' },
            { name: 'Holy symbol', weight: 0.5, notes: '' },
            { name: "Explorer's pack", weight: 0, notes: 'Inhoud al verdeeld' },
            { name: '5 Javelins', weight: 10, notes: '' }
        ]
    },

    io: {
        id: "io", name: "Io", player: "io",
        race: "aasimar", className: "druid", subclass: "land",
        background: "Acolyte", alignment: "Neutral Good", age: 30,
        accentColor: "#34d399",
        baseAbilities: { str: 10, dex: 14, con: 14, int: 12, wis: 17, cha: 8 },
        backgroundBonuses: { str: 0, dex: 0, con: 1, int: 0, wis: 2, cha: 0 },
        defaultSkills: ["nature", "perception"],
        defaultExpertise: [],
        defaultCantrips: ["Produce Flame", "Guidance", "Druidcraft"],
        defaultPrepared: ["Healing Word", "Entangle", "Goodberry", "Thunderwave"],
        weapons: [],
        appearance: ["", ""],
        personality: { traits: "", ideal: "", bond: "", flaw: "", fear: "" },
        backstory: "",
        quotes: [],
        defaultItems: [
            { name: 'Leather armor', weight: 10, notes: '' },
            { name: 'Wooden shield', weight: 6, notes: '+2 AC' },
            { name: 'Scimitar', weight: 3, notes: '' },
            { name: 'Druidic focus', weight: 0.5, notes: 'Holly sprig' },
            { name: "Explorer's pack", weight: 0, notes: 'Inhoud al verdeeld' },
            { name: 'Herbalism kit', weight: 3, notes: '' }
        ]
    },

    lira: {
        id: "lira", name: "Lira", player: "lira",
        race: "tiefling", className: "fighter", subclass: "champion",
        background: "Soldier", alignment: "Chaotic Neutral", age: 22,
        accentColor: "#f87171",
        baseAbilities: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 8 },
        backgroundBonuses: { str: 2, dex: 0, con: 1, int: 0, wis: 0, cha: 0 },
        defaultSkills: ["athletics", "perception"],
        defaultExpertise: [],
        weapons: [
            { name: 'Greatsword', hit: null, dmg: "2d6", type: "slashing" },
            { name: 'Handaxe (thrown)', hit: null, dmg: "1d6", type: "slashing" }
        ],
        appearance: ["", ""],
        personality: { traits: "", ideal: "", bond: "", flaw: "", fear: "" },
        backstory: "",
        quotes: [],
        defaultItems: [
            { name: 'Chain mail', weight: 55, notes: '' },
            { name: 'Greatsword', weight: 6, notes: '' },
            { name: 'Handaxe', weight: 2, notes: '' },
            { name: 'Handaxe', weight: 2, notes: '' },
            { name: 'Light crossbow', weight: 5, notes: '' },
            { name: 'Crossbow bolts (20)', weight: 1.5, notes: '' },
            { name: "Explorer's pack", weight: 0, notes: 'Inhoud al verdeeld' }
        ]
    },

    nero: {
        id: "nero", name: "Nero", player: "nero",
        race: "tiefling", className: "warlock", subclass: "fiend",
        background: "Charlatan", alignment: "Chaotic Neutral", age: 26,
        accentColor: "#a78bfa",
        baseAbilities: { str: 8, dex: 14, con: 14, int: 12, wis: 10, cha: 17 },
        backgroundBonuses: { str: 0, dex: 0, con: 1, int: 0, wis: 0, cha: 2 },
        defaultSkills: ["deception", "arcana"],
        defaultExpertise: [],
        defaultCantrips: ["Eldritch Blast", "Minor Illusion"],
        defaultPrepared: ["Hex", "Armor of Agathys"],
        weapons: [],
        appearance: ["", ""],
        personality: { traits: "", ideal: "", bond: "", flaw: "", fear: "" },
        backstory: "",
        quotes: [],
        defaultItems: [
            { name: 'Leather armor', weight: 10, notes: '' },
            { name: 'Light crossbow', weight: 5, notes: '' },
            { name: 'Crossbow bolts (20)', weight: 1.5, notes: '' },
            { name: 'Component pouch', weight: 2, notes: '' },
            { name: "Scholar's pack", weight: 0, notes: 'Inhoud al verdeeld' },
            { name: 'Dagger', weight: 1, notes: '' },
            { name: 'Dagger', weight: 1, notes: '' },
            { name: 'Disguise kit', weight: 3, notes: 'Charlatan essentials' }
        ]
    }
};

// ============================================================
// Section 5: Tooltip Data
// ============================================================

var TOOLTIPS = {
    nl: {
        'Half-Elf': 'Darkvision 60ft. Fey Ancestry: advantage op saves tegen charmed. 2 extra skill proficiencies. +2 CHA, +1 op 2 andere abilities.',
        'Wood Elf': 'Darkvision 60ft. Fey Ancestry: advantage op saves tegen charmed. Fleet of Foot: base speed 35ft. Mask of the Wild: verbergen in licht natural obscurement.',
        'Human': 'Resourceful: Heroic Inspiration na elke long rest. Skillful: 1 extra skill proficiency. Versatile: 1 origin feat.',
        'Halfling': 'Brave: advantage vs frightened. Lucky: herrol een 1 op d20. Halfling Nimbleness: beweeg door grotere creatures. Naturally Stealthy.',
        'Tiefling': 'Darkvision 60ft. Fiendish Legacy: resistance (fire/necrotic/poison). Otherworldly Presence: Thaumaturgy cantrip.',
        'Aasimar': 'Celestial Resistance: resistance tegen necrotic en radiant. Darkvision 60ft. Healing Hands. Light Bearer: Light cantrip.',
        'Rogue': 'Hit Die: d8. Saving Throws: DEX, INT. Sneak Attack, Expertise, Cunning Action. Skills: 4 proficiencies.',
        'Sorcerer': 'Hit Die: d6. Saving Throws: CON, CHA. Sorcery Points, Metamagic. Spellcasting met Charisma.',
        'Ranger': 'Hit Die: d10. Saving Throws: STR, DEX. Favored Enemy, Natural Explorer, Spellcasting met Wisdom.',
        'Wizard': 'Hit Die: d6. Saving Throws: INT, WIS. Arcane Recovery, Spellcasting met Intelligence. Grootste spell list.',
        'Paladin': 'Hit Die: d10. Saving Throws: WIS, CHA. Divine Smite, Lay on Hands, Aura of Protection. Spellcasting met Charisma.',
        'Druid': 'Hit Die: d8. Saving Throws: INT, WIS. Wild Shape, Spellcasting met Wisdom. Kan geen metal armor dragen.',
        'Fighter': 'Hit Die: d10. Saving Throws: STR, CON. Fighting Style, Second Wind, Action Surge. Meeste ASIs.',
        'Warlock': 'Hit Die: d8. Saving Throws: WIS, CHA. Pact Magic (short rest slots), Eldritch Invocations, Pact Boon.',
        'Scout': 'Rogue subclass. Survivalist: proficiency in Nature & Survival. Skirmisher: reaction om weg te bewegen. Superior Mobility op level 9.',
        'Wild Magic': 'Sorcerer subclass. Wild Magic Surge: kans op willekeurig magisch effect. Tides of Chaos: advantage 1x per long rest. Bend Luck op level 6.',
        'Hunter': 'Ranger subclass. Colossus Slayer, Giant Killer, of Horde Breaker. Defensive Tactics op level 7.',
        'Evocation': 'Wizard subclass. Sculpt Spells: bescherm allies in AoE. Potent Cantrip. Empowered Evocation.',
        'Devotion': 'Paladin subclass. Sacred Weapon, Turn the Unholy. Aura of Devotion. Holy Nimbus.',
        'Land': 'Druid subclass. Bonus cantrip. Natural Recovery. Extra spells per terrain type.',
        'Champion': 'Fighter subclass. Improved Critical (19-20). Remarkable Athlete. Additional Fighting Style.',
        'Fiend': 'Warlock subclass. Dark One\'s Blessing: temp HP bij kills. Dark One\'s Own Luck. Fiendish Resilience.',
        'Thief': 'Rogue subclass. Fast Hands: bonus action Use Object. Second-Story Work: climbing speed. Supreme Sneak.',
        'Urchin': 'Achtergrond: opgegroeid op straat. Proficiency: Sleight of Hand, Stealth. Tool: Disguise kit, Thieves\' tools. Feature: City Secrets.',
        'Wayfarer': 'Achtergrond: reiziger en zwerver. Wanderer: je vindt altijd voedsel en water in de wildernis voor jezelf en 5 anderen.',
        'Chaotic Good': 'Volgt het eigen geweten met weinig respect voor regels. Doet het juiste, ook als het niet de wet is.',
        'Neutral Good': 'Doet het beste zonder vooroordeel voor of tegen orde. Het goede doen is wat telt.',
        'Lawful Good': 'Combineert eer en mededogen. Verwacht dat anderen dezelfde normen hanteren.',
        'Neutral': 'Handelt zonder vooroordeel. Kiest de middenweg. Vermijdt morele extremen.',
        'Chaotic Neutral': 'Volgt eigen grillen. Individuele vrijheid boven alles. Onvoorspelbaar maar niet kwaadaardig.'
    },
    en: {
        'Half-Elf': 'Darkvision 60ft. Fey Ancestry: advantage on saves vs charmed. 2 extra skill proficiencies. +2 CHA, +1 to 2 other abilities.',
        'Wood Elf': 'Darkvision 60ft. Fey Ancestry: advantage on saves vs charmed. Fleet of Foot: base speed 35ft. Mask of the Wild: hide in light natural obscurement.',
        'Human': 'Resourceful: Heroic Inspiration after each long rest. Skillful: 1 extra skill proficiency. Versatile: 1 origin feat.',
        'Halfling': 'Brave: advantage vs frightened. Lucky: reroll a 1 on d20. Halfling Nimbleness: move through larger creatures. Naturally Stealthy.',
        'Tiefling': 'Darkvision 60ft. Fiendish Legacy: resistance (fire/necrotic/poison). Otherworldly Presence: Thaumaturgy cantrip.',
        'Aasimar': 'Celestial Resistance: resistance to necrotic and radiant. Darkvision 60ft. Healing Hands. Light Bearer: Light cantrip.',
        'Rogue': 'Hit Die: d8. Saving Throws: DEX, INT. Sneak Attack, Expertise, Cunning Action. Skills: 4 proficiencies.',
        'Sorcerer': 'Hit Die: d6. Saving Throws: CON, CHA. Sorcery Points, Metamagic. Spellcasting with Charisma.',
        'Ranger': 'Hit Die: d10. Saving Throws: STR, DEX. Favored Enemy, Natural Explorer, Spellcasting with Wisdom.',
        'Wizard': 'Hit Die: d6. Saving Throws: INT, WIS. Arcane Recovery, Spellcasting with Intelligence. Largest spell list.',
        'Paladin': 'Hit Die: d10. Saving Throws: WIS, CHA. Divine Smite, Lay on Hands, Aura of Protection. Spellcasting with Charisma.',
        'Druid': 'Hit Die: d8. Saving Throws: INT, WIS. Wild Shape, Spellcasting with Wisdom. Cannot wear metal armor.',
        'Fighter': 'Hit Die: d10. Saving Throws: STR, CON. Fighting Style, Second Wind, Action Surge. Most ASIs.',
        'Warlock': 'Hit Die: d8. Saving Throws: WIS, CHA. Pact Magic (short rest slots), Eldritch Invocations, Pact Boon.',
        'Scout': 'Rogue subclass. Survivalist: proficiency in Nature & Survival. Skirmisher: reaction to move away. Superior Mobility at level 9.',
        'Wild Magic': 'Sorcerer subclass. Wild Magic Surge: chance of random magical effect. Tides of Chaos: advantage 1x per long rest. Bend Luck at level 6.',
        'Hunter': 'Ranger subclass. Colossus Slayer, Giant Killer, or Horde Breaker. Defensive Tactics at level 7.',
        'Evocation': 'Wizard subclass. Sculpt Spells: protect allies in AoE. Potent Cantrip. Empowered Evocation.',
        'Devotion': 'Paladin subclass. Sacred Weapon, Turn the Unholy. Aura of Devotion. Holy Nimbus.',
        'Land': 'Druid subclass. Bonus cantrip. Natural Recovery. Extra spells per terrain type.',
        'Champion': 'Fighter subclass. Improved Critical (19-20). Remarkable Athlete. Additional Fighting Style.',
        'Fiend': 'Warlock subclass. Dark One\'s Blessing: temp HP on kills. Dark One\'s Own Luck. Fiendish Resilience.',
        'Thief': 'Rogue subclass. Fast Hands: bonus action Use Object. Second-Story Work: climbing speed. Supreme Sneak.',
        'Urchin': 'Background: grew up on the streets. Proficiency: Sleight of Hand, Stealth. Tool: Disguise kit, Thieves\' tools. Feature: City Secrets.',
        'Wayfarer': 'Background: traveler and wanderer. Wanderer: you always find food and water in the wilderness for yourself and 5 others.',
        'Chaotic Good': 'Follows own conscience with little regard for rules. Does the right thing, even if it\'s not the law.',
        'Neutral Good': 'Does the best without bias for or against order. Doing good is what matters.',
        'Lawful Good': 'Combines honor and compassion. Expects others to uphold the same standards.',
        'Neutral': 'Acts without prejudice. Chooses the middle way. Avoids moral extremes.',
        'Chaotic Neutral': 'Follows own whims. Individual freedom above all. Unpredictable but not malicious.'
    }
};

// ============================================================
// Section 6: Active Tab State
// ============================================================

var activeTab = 'overview';
var spellFilter = 'all';
var abilityEditMode = false;
var notesFilter = 'all';
var notesSearch = '';
var editingNoteId = null;
var editAbilities = null;
var activeChapter = 0;

// ============================================================
// Section 7: Utility Functions
// ============================================================

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function classDisplayName(className) {
    var names = {
        rogue: 'Rogue', sorcerer: 'Sorcerer', ranger: 'Ranger',
        wizard: 'Wizard', paladin: 'Paladin', druid: 'Druid',
        fighter: 'Fighter', warlock: 'Warlock',
        barbarian: 'Barbarian', bard: 'Bard', cleric: 'Cleric', monk: 'Monk'
    };
    return names[className] || capitalize(className);
}

function subclassDisplayName(subclass) {
    var names = {
        scout: 'Scout', wildMagic: 'Wild Magic', thief: 'Thief',
        hunter: 'Hunter', evocation: 'Evocation', devotion: 'Devotion',
        land: 'Land', champion: 'Champion', fiend: 'Fiend'
    };
    return names[subclass] || capitalize(subclass);
}

function raceDisplayName(race) {
    var names = {
        woodElf: 'Wood Elf', halfElf: 'Half-Elf', human: 'Human',
        halfling: 'Halfling', tiefling: 'Tiefling', aasimar: 'Aasimar',
        dwarf: 'Dwarf', gnome: 'Gnome', goliath: 'Goliath', orc: 'Orc', dragonborn: 'Dragonborn'
    };
    return names[race] || capitalize(race);
}

function hasSpellcasting(className) {
    return ['sorcerer', 'wizard', 'druid', 'ranger', 'paladin', 'warlock', 'bard', 'cleric'].indexOf(className) !== -1;
}

// Resolve spell list for a class+level. Supports both formats:
// Old: DATA.spells[class][level] = [{name, time, ...}, ...]
// New: DATA.spells[class][level] = ["SpellName", ...] + DATA.spellPool
function getSpellsForLevel(className, level) {
    if (!DATA.spells || !DATA.spells[className]) return [];
    var list = DATA.spells[className][level];
    if (!list || list.length === 0) return [];
    // If first entry is a string, resolve from spellPool
    if (typeof list[0] === 'string' && DATA.spellPool) {
        return list.map(function(name) {
            var s = DATA.spellPool[name];
            return s ? Object.assign({ name: name }, s) : { name: name, desc: '' };
        });
    }
    return list;
}

// Get all spell levels for a class as {0: [...], 1: [...], ...}
function getSpellListForClass(className) {
    if (!DATA.spells || !DATA.spells[className]) return {};
    var result = {};
    var raw = DATA.spells[className];
    for (var lvl in raw) {
        result[lvl] = getSpellsForLevel(className, parseInt(lvl));
    }
    return result;
}

// Lookup a single spell by name (for tooltips)
function lookupSpell(spellName) {
    if (DATA.spellPool && DATA.spellPool[spellName]) {
        return Object.assign({ name: spellName }, DATA.spellPool[spellName]);
    }
    // Fallback: search old-format lists
    if (DATA.spells) {
        var classNames = Object.keys(DATA.spells);
        for (var cn = 0; cn < classNames.length; cn++) {
            var classList = DATA.spells[classNames[cn]];
            for (var lvl = 0; lvl <= 9; lvl++) {
                var spells = classList[lvl] || [];
                for (var i = 0; i < spells.length; i++) {
                    if (typeof spells[i] === 'object' && spells[i].name === spellName) return spells[i];
                }
            }
        }
    }
    return null;
}

function getInfoFieldOptions(field, config) {
    if (field === 'race') {
        var races = ['human', 'woodElf', 'halfElf', 'halfling', 'tiefling', 'aasimar', 'dwarf', 'gnome', 'goliath', 'orc', 'dragonborn'];
        return races.map(function(r) { return { value: r, label: raceDisplayName(r) }; });
    }
    if (field === 'className') {
        var classes = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
        return classes.map(function(c) { return { value: c, label: classDisplayName(c) }; });
    }
    if (field === 'subclass') {
        var classData = DATA[config.className];
        if (classData && classData.subclasses) {
            var subs = Object.keys(classData.subclasses);
            return subs.map(function(s) {
                var subData = classData.subclasses[s];
                return { value: s, label: subData.name || subclassDisplayName(s) };
            });
        }
        return [];
    }
    if (field === 'background') {
        var bgs = DATA.backgrounds ? Object.keys(DATA.backgrounds) : [];
        return bgs.map(function(b) {
            var bgData = DATA.backgrounds[b];
            return { value: bgData.name || b, label: bgData.name || capitalize(b) };
        });
    }
    if (field === 'alignment') {
        var aligns = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];
        return aligns.map(function(a) { return { value: a, label: a }; });
    }
    return [];
}

function getQuestData() {
    var qd = JSON.parse(localStorage.getItem('dw_quests') || '{"active":[],"completed":[]}');
    if (qd.active && !Array.isArray(qd.active)) qd.active = Object.values(qd.active);
    if (qd.completed && !Array.isArray(qd.completed)) qd.completed = Object.values(qd.completed);
    if (!qd.active) qd.active = [];
    if (!qd.completed) qd.completed = [];
    return qd;
}

function getAllCharacterIds() {
    var ids = {};
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.indexOf('dw_charconfig_') === 0) {
            ids[key.substring(14)] = true;
        }
    }
    if (typeof SEED_DATA !== 'undefined') {
        var seedKeys = Object.keys(SEED_DATA);
        for (var j = 0; j < seedKeys.length; j++) {
            ids[seedKeys[j]] = true;
        }
    }
    return Object.keys(ids);
}

function getCharacterIds(ignoreCampaign) {
    var allIds = getAllCharacterIds();
    if (ignoreCampaign) return allIds;
    // Filter by active campaign party
    var partyIds = getPartyCharIds();
    return allIds.filter(function(id) {
        return partyIds.indexOf(id) !== -1;
    });
}

function getMyCharacterIds() {
    var uid = currentUserId();
    var allIds = getAllCharacterIds();
    return allIds.filter(function(id) {
        return userOwnsCharacter(uid, id);
    });
}


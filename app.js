// ============================================================
// D&D Within — Full SPA Application
// Requires data.js and engine.js to be loaded first.
// ============================================================

// ============================================================
// Section 1: User / Auth System
// ============================================================

var DEFAULT_USERS = {
    admin:   { name: "Admin", role: "admin", password: "admin", characters: [] },
    dm:      { name: "Dungeon Master", role: "dm", password: "dm", characters: [] },
    ren:     { name: "Joshua", role: "player", password: "ren", characters: ["ren"] },
    saya:    { name: "Speler 2", role: "player", password: "saya", characters: ["saya"] },
    ranger:  { name: "Speler 3", role: "player", password: "ranger", characters: ["ranger"] },
    wizard:  { name: "Speler 4", role: "player", password: "wizard", characters: ["wizard"] },
    paladin: { name: "Speler 5", role: "player", password: "paladin", characters: ["paladin"] },
    druid:   { name: "Speler 6", role: "player", password: "druid", characters: ["druid"] },
    fighter: { name: "Speler 7", role: "player", password: "fighter", characters: ["fighter"] },
    warlock: { name: "Speler 8", role: "player", password: "warlock", characters: ["warlock"] }
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

function isDM() {
    var u = currentUser();
    return u && (u.role === 'dm' || u.role === 'admin');
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
    { id: 'ocean', name: 'Ocean', accent: '#22d3ee', bg: '#0a0a0f' },
    { id: 'rose', name: 'Rose', accent: '#f472b6', bg: '#0a0a0f' },
    { id: 'emerald', name: 'Emerald', accent: '#34d399', bg: '#0a0a0f' },
    { id: 'amber', name: 'Amber', accent: '#fbbf24', bg: '#0a0a0f' },
    { id: 'violet', name: 'Violet', accent: '#a78bfa', bg: '#0a0a0f' },
    { id: 'crimson', name: 'Crimson', accent: '#f87171', bg: '#0a0a0f' },
    { id: 'indigo', name: 'Indigo', accent: '#818cf8', bg: '#0a0a0f' },
    { id: 'teal', name: 'Teal', accent: '#2dd4bf', bg: '#0a0a0f' },
    { id: 'sunset', name: 'Sunset', accent: '#fb923c', bg: '#0a0a0f' },
    { id: 'sakura', name: 'Sakura', accent: '#f9a8d4', bg: '#0a0a0f' },
    { id: 'gold', name: 'Gold', accent: '#f0c040', bg: '#0a0a0f' },
    { id: 'ice', name: 'Ice', accent: '#7dd3fc', bg: '#0a0a0f' }
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
        document.documentElement.style.setProperty('--accent', theme.accent);
        document.documentElement.style.setProperty('--accent-glow', theme.accent + '25');
    }
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

    ranger: {
        id: "ranger", name: null, player: "ranger",
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

    wizard: {
        id: "wizard", name: null, player: "wizard",
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

    paladin: {
        id: "paladin", name: null, player: "paladin",
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

    druid: {
        id: "druid", name: null, player: "druid",
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

    fighter: {
        id: "fighter", name: null, player: "fighter",
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

    warlock: {
        id: "warlock", name: null, player: "warlock",
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

function getCharacterIds() {
    // Collect character IDs from localStorage configs + SEED_DATA
    var ids = {};
    // From localStorage
    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key.indexOf('dw_charconfig_') === 0) {
            ids[key.substring(14)] = true;
        }
    }
    // From SEED_DATA fallback
    if (typeof SEED_DATA !== 'undefined') {
        var seedKeys = Object.keys(SEED_DATA);
        for (var j = 0; j < seedKeys.length; j++) {
            ids[seedKeys[j]] = true;
        }
    }
    return Object.keys(ids);
}

// ============================================================
// Section 8: Main Render Function (Router)
// ============================================================

function renderApp() {
    var user = currentUser();
    var route = getRoute();

    if (!user && route.path !== '/login') {
        navigate('/login');
        return;
    }

    // Set accent color for current context
    if (route.parts[0] === 'characters' && route.parts[1]) {
        var cfg = loadCharConfig(route.parts[1]);
        if (cfg) document.documentElement.style.setProperty('--accent', cfg.accentColor);
    } else {
        applyUserTheme();
    }

    var app = document.getElementById('app');
    var html = '';

    if (route.path === '/login' || !user) {
        html = renderLogin();
    } else {
        html = renderNavbar(route) + '<main class="main-content">';

        if (route.path === '/' || route.path === '/dashboard') {
            html += renderDashboard();
        } else if (route.path === '/characters') {
            html += renderCharacterList();
        } else if (route.parts[0] === 'characters' && route.parts[1]) {
            // Deep link: #/characters/ren/combat sets activeTab
            if (route.parts[2]) {
                var validTabs = ['overview', 'stats', 'combat', 'spells', 'story', 'inventory'];
                if (validTabs.indexOf(route.parts[2]) >= 0) activeTab = route.parts[2];
            }
            html += renderCharacterSheet(route.parts[1]);
        } else if (route.parts[0] === 'dm' && isDM()) {
            html += renderDMPage(route.parts[1]);
        } else if (route.path === '/maps') {
            html += renderMaps();
        } else if (route.path === '/timeline') {
            html += renderTimeline();
        } else if (route.parts[0] === 'lore') {
            if (route.parts[1] && route.parts[1].indexOf('edit-') === 0) {
                html += renderLoreEditor(route.parts[1].substring(5));
            } else {
                html += renderLore(route.parts[1]);
            }
        } else if (route.parts[0] === 'notes') {
            if (route.parts[1] === 'new') {
                html += renderNoteEditor(null);
            } else if (route.parts[1] && route.parts[1].indexOf('edit-') === 0) {
                html += renderNoteEditor(route.parts[1].substring(5));
            } else if (route.parts[1] && route.parts[1].indexOf('view-') === 0) {
                html += renderNoteView(route.parts[1].substring(5));
            } else {
                html += renderNotes();
            }
        } else {
            html += '<div class="page-placeholder"><h2>' + t('page.notfound') + '</h2><p>' + t('page.notfound.desc') + '</p></div>';
        }

        html += '</main>';

        // Global dice roller (multi-dice hand system)
        html += '<div class="dice-fab" data-action="toggle-dice-panel" title="Roll Dice">&#127922;</div>';
        html += '<div class="dice-panel" id="dice-panel" style="display:none;">';
        html += '<div class="dice-panel-header"><span>Dice Roller</span><button class="dice-panel-close" data-action="toggle-dice-panel">&times;</button></div>';
        html += '<div id="dice-panel-content"></div>';
        html += '</div>';
    }

    // Page transition — only on actual page change (not tab switches)
    var mainEl = app.querySelector('.main-content');
    var basePath = '/' + route.parts.slice(0, 2).join('/');
    var routeChanged = app._lastBasePath !== basePath;
    app._lastBasePath = basePath;
    if (mainEl && routeChanged && !app._firstRender) {
        window.scrollTo(0, 0);
        mainEl.classList.add('page-exit');
        setTimeout(function() {
            app.innerHTML = html;
            bindPageEvents(route);
            var newMain = app.querySelector('.main-content');
            if (newMain) {
                newMain.classList.add('page-enter');
                setTimeout(function() { newMain.classList.remove('page-enter'); }, 300);
            }
            postRenderEffects(route);
        }, 120);
        return;
    }
    app._firstRender = false;
    app.innerHTML = html;
    bindPageEvents(route);
    postRenderEffects(route);
}

function postRenderEffects(route) {
    if (route.parts[0] === 'characters' && route.parts[1]) {
        var effectCfg = loadCharConfig(route.parts[1]);
        var effectColor = effectCfg ? effectCfg.accentColor : '#22d3ee';
        var portraitWrap = document.querySelector('.char-portrait-wrap');
        if (typeof GlowRing !== 'undefined') {
            GlowRing.apply(portraitWrap, effectColor);
        }
    }
    // Initiative drag-and-drop
    initInitiativeDragDrop();
}

// initInitiativeDragDrop is defined after renderDMInitiative

// ============================================================
// Section 9: Login Page
// ============================================================

function renderLogin() {
    var html = '<div class="login-page">';
    html += '<div class="login-card">';
    html += '<div class="login-logo">&#9876;</div>';
    html += '<h1 class="login-title">D&D Within</h1>';
    html += '<p class="login-subtitle">Valoria Campaign Platform</p>';
    html += '<div class="login-form">';
    html += '<div class="login-field">';
    html += '<label class="login-label">' + t('login.username') + '</label>';
    html += '<input type="text" class="login-input" id="login-username" placeholder="' + t('login.username') + '" autocomplete="username">';
    html += '</div>';
    html += '<div class="login-field">';
    html += '<label class="login-label">' + t('login.password') + '</label>';
    html += '<input type="password" class="login-input" id="login-password" placeholder="' + t('login.password') + '" autocomplete="current-password">';
    html += '</div>';
    html += '<button class="login-submit" data-action="login-submit">' + t('login.submit') + '</button>';
    html += '<p class="login-error" id="login-error" style="display:none;"></p>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
}

// ============================================================
// Section 10: Navbar
// ============================================================

function renderNavbar(route) {
    var user = currentUser();
    var svgI = function(d) { return '<svg class="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; };
    var links = [
        { path: '/dashboard', label: t('nav.dashboard'), icon: svgI('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>') },
        { path: '/characters', label: t('nav.characters'), icon: svgI('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>') },
        { path: '/maps', label: t('nav.maps'), icon: svgI('<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>') },
        { path: '/timeline', label: t('nav.timeline'), icon: svgI('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>') },
        { path: '/lore', label: t('nav.lore'), icon: svgI('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>') },
        { path: '/notes', label: t('nav.notes'), icon: svgI('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>') }
    ];
    if (isDM()) {
        links.push({ path: '/dm', label: t('dm.tools'), icon: svgI('<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>') });
    }

    var html = '<nav class="navbar">';
    html += '<a class="nav-logo" href="#/dashboard">D&D <span class="logo-accent">Within</span></a>';
    html += '<div class="nav-links">';

    for (var i = 0; i < links.length; i++) {
        var link = links[i];
        var isActive = route.path === link.path || (link.path === '/dashboard' && route.path === '/');
        // Also active on sub-paths
        if (link.path === '/characters' && route.parts[0] === 'characters') isActive = true;
        if (link.path === '/lore' && route.parts[0] === 'lore') isActive = true;
        if (link.path === '/notes' && route.parts[0] === 'notes') isActive = true;
        if (link.path === '/dm' && route.parts[0] === 'dm') isActive = true;
        html += '<a class="nav-link' + (isActive ? ' active' : '') + '" href="#' + link.path + '"><span class="nav-icon">' + link.icon + '</span>' + link.label + '</a>';
    }

    html += '</div>';
    html += '<div class="nav-right">';
    html += '<div class="theme-picker-wrap">';
    html += '<button class="theme-picker-btn" data-action="toggle-theme-picker" title="' + t('nav.theme') + '">&#127912;</button>';
    html += '<div class="theme-picker-popup" id="theme-picker" style="display:none;">';
    html += '<div class="theme-picker-grid">';
    for (var ti = 0; ti < COLOR_THEMES.length; ti++) {
        var theme = COLOR_THEMES[ti];
        var isActive = getUserTheme() === theme.id;
        html += '<button class="theme-option' + (isActive ? ' active' : '') + '" data-action="select-theme" data-theme="' + theme.id + '" style="background:' + theme.accent + ';" title="' + theme.name + '"></button>';
    }
    html += '</div>';
    html += '</div>';
    html += '</div>';
    // Sync status indicator
    var syncStatus = typeof getSyncStatus === 'function' ? getSyncStatus() : 'not-configured';
    if (syncStatus === 'online') {
        html += '<span class="sync-indicator sync-online" title="' + t('nav.sync.online') + '">&#9729;</span>';
    } else if (syncStatus === 'offline') {
        html += '<span class="sync-indicator sync-offline" title="' + t('nav.sync.offline') + '">&#9729;</span>';
    }
    html += '<button class="nav-lang-btn" data-action="toggle-lang" title="' + t('nav.language') + '">' + (getLang() === 'nl' ? 'NL' : 'EN') + '</button>';
    html += '<span class="nav-avatar" data-action="open-profile" title="Profiel instellingen" style="cursor:pointer;">' + escapeHtml(user ? user.name.charAt(0) : '') + '</span>';
    html += '<button class="nav-logout" data-action="logout">' + t('nav.logout') + '</button>';
    html += '</div>';
    html += '<button class="nav-toggle" data-action="toggle-nav">&#9776;</button>';
    html += '</nav>';
    return html;
}

// ============================================================
// Section 11: Dashboard
// ============================================================

function getDashboardData() {
    var saved = localStorage.getItem('dw_dashboard');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return { campaignName: 'The Serpent March', bannerImage: null };
}

function saveDashboardData(data) {
    localStorage.setItem('dw_dashboard', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_dashboard');
}

function renderDashboard() {
    var user = currentUser();
    var html = '<div class="dashboard">';

    // Session number (DM can set)
    var sessionNum = localStorage.getItem('dw_session_number') || '0';
    var dashData = getDashboardData();

    // Welcome banner with optional background image
    html += '<div class="welcome-banner' + (dashData.bannerImage ? ' has-banner' : '') + '"';
    if (dashData.bannerImage) {
        html += ' style="background-image:url(' + dashData.bannerImage + ')"';
    }
    html += '>';
    if (isDM()) {
        html += '<label class="banner-upload-btn" title="Upload banner"><span>&#128247;</span><input type="file" accept="image/*" data-action="upload-dash-banner" style="display:none"></label>';
    }
    html += '<h1>' + t('dash.welcome') + '</h1>';
    html += '<p class="campaign-name">';
    html += escapeHtml(dashData.campaignName || 'The Serpent March');
    if (isDM()) {
        html += ' <button class="edit-trigger" data-action="edit-campaign-name" title="Edit">&#9998;</button>';
    }
    html += '</p>';
    html += '<p class="welcome-user">' + t('dash.loggedinas') + ' ' + escapeHtml(user ? user.name : '') + '</p>';
    html += '<p class="text-dim" style="font-size:0.85rem;">' + t('dash.session') + ' ' + escapeHtml(sessionNum) + '</p>';
    html += '</div>';

    // Quick stats
    var charIds = getCharacterIds();
    var partySize = 0;
    var groupLevel = 1;
    var partyGold = 0;
    for (var si = 0; si < charIds.length; si++) {
        var scfg = loadCharConfig(charIds[si]);
        if (!scfg) continue;
        var sstate = loadCharState(charIds[si]);
        partySize++;
        groupLevel = sstate.level; // group level (all same)
        partyGold += (sstate.gold || 0);
    }

    html += '<div class="dash-stats">';
    html += '<div class="dash-stat-card session-card">';
    html += '<span class="dash-stat-value">' + escapeHtml(sessionNum) + '</span>';
    html += '<span class="dash-stat-label">' + t('dash.session') + '</span>';
    if (isDM()) {
        html += '<div class="session-controls">';
        html += '<button class="session-btn" data-action="session-minus">&minus;</button>';
        html += '<button class="session-btn" data-action="session-plus">+</button>';
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="dash-stat-card"><span class="dash-stat-value">' + partySize + '</span><span class="dash-stat-label">' + t('dash.party') + '</span></div>';

    // Party gold (sum of all character gold)
    html += '<div class="dash-stat-card party-gold-card">';
    html += '<span class="dash-stat-value" style="color:var(--gold);">' + partyGold + '</span>';
    html += '<span class="dash-stat-label">Party Gold</span>';
    html += '</div>';
    html += '<div class="dash-stat-card"><span class="dash-stat-value">' + groupLevel + '</span><span class="dash-stat-label">' + t('dash.level') + '</span></div>';
    html += '</div>';

    // Quick navigation cards
    html += '<div class="dash-nav-cards">';
    html += '<a class="dash-nav-card" href="#/characters"><span class="dash-nav-icon">&#9876;</span><span class="dash-nav-title">' + t('nav.characters') + '</span><span class="dash-nav-desc">' + t('dash.characters.desc') + '</span></a>';
    html += '<a class="dash-nav-card" href="#/timeline"><span class="dash-nav-icon">&#128337;</span><span class="dash-nav-title">' + t('nav.timeline') + '</span><span class="dash-nav-desc">' + t('dash.timeline.desc') + '</span></a>';
    html += '<a class="dash-nav-card" href="#/maps"><span class="dash-nav-icon">&#128506;</span><span class="dash-nav-title">' + t('nav.maps') + '</span><span class="dash-nav-desc">' + t('dash.maps.desc') + '</span></a>';
    html += '<a class="dash-nav-card" href="#/lore"><span class="dash-nav-icon">&#128214;</span><span class="dash-nav-title">' + t('nav.lore') + '</span><span class="dash-nav-desc">' + t('dash.lore.desc') + '</span></a>';
    html += '<a class="dash-nav-card" href="#/notes"><span class="dash-nav-icon">&#128221;</span><span class="dash-nav-title">' + t('nav.notes') + '</span><span class="dash-nav-desc">' + t('dash.notes.desc') + '</span></a>';
    html += '</div>';

    // Recent timeline events (pull from ALL chapters)
    var tlData = getTimelineData();
    var allEvents = [];
    for (var ci = 0; ci < (tlData.chapters || []).length; ci++) {
        var chEvents = tlData.chapters[ci].events || [];
        for (var ei = 0; ei < chEvents.length; ei++) {
            allEvents.push(chEvents[ei]);
        }
    }
    var recentEvents = allEvents.slice(-3).reverse();
    if (recentEvents.length > 0) {
        html += '<div class="dash-recent-section">';
        html += '<h2 class="section-title">' + t('dash.recent') + '</h2>';
        html += '<div class="dash-recent-events">';
        for (var ri = 0; ri < recentEvents.length; ri++) {
            var rev = recentEvents[ri];
            html += '<div class="dash-recent-event timeline-' + (rev.type || 'quest') + '">';
            if (rev.session) html += '<span class="timeline-date">' + t('dash.session') + ' ' + escapeHtml(rev.session) + '</span>';
            html += '<strong>' + escapeHtml(rev.title) + '</strong>';
            html += '<p class="text-dim" style="margin:0;font-size:0.8rem;">' + escapeHtml(rev.desc) + '</p>';
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';
    }

    // DM Whispers (show to players on their dashboard)
    var myId = currentUserId();
    var whisperKey = 'dw_whisper_' + myId;
    var myWhispers = JSON.parse(localStorage.getItem(whisperKey) || '[]');
    if (myWhispers.length > 0 && !isDM()) {
        html += '<div class="dash-whispers">';
        html += '<h2 class="section-title">&#128172; Messages from the DM</h2>';
        for (var wi = 0; wi < myWhispers.length; wi++) {
            html += '<div class="whisper-card">';
            html += '<p>' + escapeHtml(myWhispers[wi].text) + '</p>';
            html += '<span class="whisper-time text-dim" style="font-size:0.7rem;">' + new Date(myWhispers[wi].time).toLocaleString() + '</span>';
            html += '<button class="btn btn-ghost btn-sm" data-action="dismiss-whisper" data-whisper-idx="' + wi + '" style="margin-left:auto;">&#10003;</button>';
            html += '</div>';
        }
        html += '</div>';
    }

    // Quest tracker
    var questData = getQuestData();
    html += '<div class="dash-quests">';
    html += '<div class="dash-quests-header">';
    html += '<h2 class="section-title">Active Quests</h2>';
    if (isDM()) {
        html += '<button class="btn btn-ghost btn-sm" data-action="add-quest">+ Add Quest</button>';
    }
    html += '</div>';

    // Quest add form (hidden by default)
    if (isDM()) {
        html += '<div class="quest-add-form" id="quest-add-form" style="display:none;">';
        html += '<input type="text" class="edit-input" id="quest-title" placeholder="Quest title *">';
        html += '<textarea class="edit-textarea auto-grow" id="quest-desc" placeholder="Description..." style="min-height:40px;" oninput="if(typeof autoGrowTextarea===\'function\')autoGrowTextarea(this)"></textarea>';
        html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
        html += '<input type="text" class="edit-input" id="quest-giver" placeholder="Quest giver" style="flex:1;">';
        html += '<input type="text" class="edit-input" id="quest-reward" placeholder="Reward" style="flex:1;">';
        html += '<input type="text" class="edit-input" id="quest-tags" placeholder="Tags (comma sep.)" style="flex:1;">';
        html += '</div>';
        html += '<div class="edit-actions">';
        html += '<button class="edit-save" data-action="save-quest">Save Quest</button>';
        html += '<button class="edit-cancel" data-action="cancel-quest">Cancel</button>';
        html += '</div>';
        html += '</div>';
    }

    if (questData.active.length === 0 && questData.completed.length === 0) {
        html += '<p class="text-dim">No quests yet.</p>';
    }
    for (var qi = 0; qi < questData.active.length; qi++) {
        var quest = questData.active[qi];
        html += '<div class="quest-item quest-active">';
        html += '<span class="quest-icon">&#9876;</span>';
        html += '<div class="quest-info">';
        html += '<strong>' + escapeHtml(quest.title) + '</strong>';
        if (quest.desc) html += '<p class="text-dim" style="margin:0;font-size:0.8rem;">' + escapeHtml(quest.desc) + '</p>';
        if (quest.giver) html += '<span class="quest-meta">From: ' + escapeHtml(quest.giver) + '</span>';
        if (quest.reward) html += '<span class="quest-meta">Reward: ' + escapeHtml(quest.reward) + '</span>';
        if (quest.tags) {
            var tagArr = quest.tags.split(',').map(function(t) { return t.trim(); }).filter(Boolean);
            if (tagArr.length > 0) {
                html += '<div class="quest-tags">';
                for (var ti = 0; ti < tagArr.length; ti++) {
                    html += '<span class="quest-tag">' + escapeHtml(tagArr[ti]) + '</span>';
                }
                html += '</div>';
            }
        }
        html += '</div>';
        if (isDM()) {
            html += '<button class="btn btn-ghost btn-sm" data-action="complete-quest" data-quest-idx="' + qi + '" title="Complete">&#10003;</button>';
            html += '<button class="btn btn-ghost btn-sm" data-action="delete-quest" data-quest-idx="' + qi + '" style="color:var(--danger);" title="Delete">&times;</button>';
        }
        html += '</div>';
    }
    if (questData.completed.length > 0) {
        html += '<details class="quest-completed-section"><summary class="text-dim" style="cursor:pointer;font-size:0.85rem;">Completed (' + questData.completed.length + ')</summary>';
        for (var qc = 0; qc < questData.completed.length; qc++) {
            html += '<div class="quest-item quest-done"><span class="quest-icon">&#10003;</span><span style="text-decoration:line-through;color:var(--text-dim);">' + escapeHtml(questData.completed[qc].title) + '</span></div>';
        }
        html += '</details>';
    }
    html += '</div>';

    // Party overview
    html += '<div class="party-section">';
    html += '<h2 class="section-title">' + t('dash.partyoverview') + '</h2>';
    html += '<div class="character-cards">';

    for (var i = 0; i < charIds.length; i++) {
        var cid = charIds[i];
        var ccfg = loadCharConfig(cid);
        var cstate = loadCharState(cid);
        if (!ccfg) continue;

        var isOwn = userOwnsCharacter(currentUserId(), cid);
        html += renderCharCard(cid, ccfg, cstate, isOwn);
    }

    html += '</div>';
    html += '</div>';

    // DM quick link
    if (isDM()) {
        html += '<div style="text-align:center;margin-top:1rem;">';
        html += '<a class="btn btn-ghost" href="#/dm">' + t('dm.tools') + ' &rarr;</a>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

// ============================================================
// Section 11b: DM Page
// ============================================================

var dmTab = 'initiative';

function renderDMPage(subpage) {
    if (!isDM()) return '<p>Access denied.</p>';
    var html = '<div class="dm-page">';
    html += '<h1 class="page-title">' + t('dm.tools') + '</h1>';

    // Tab bar
    var tabs = [
        { id: 'initiative', label: t('dm.initiative'), icon: '&#9876;' },
        { id: 'npcs', label: 'NPCs', icon: '&#127917;' }
    ];
    html += '<div class="dm-tabs">';
    for (var ti = 0; ti < tabs.length; ti++) {
        var tab = tabs[ti];
        var isActive = (subpage || 'initiative') === tab.id;
        html += '<a class="dm-tab' + (isActive ? ' active' : '') + '" href="#/dm/' + tab.id + '">' + tab.icon + ' ' + tab.label + '</a>';
    }
    html += '</div>';

    var activeSection = subpage || 'initiative';

    if (activeSection === 'initiative') {
        html += renderDMInitiative();
        html += renderDMDiceRoller();
    } else if (activeSection === 'npcs') {
        html += renderDMNPCs();
    }

    html += '</div>';
    return html;
}

function renderDMInitiative() {
    var html = '<div class="dm-tool-card init-tracker-card">';

    var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
    var entries = initData.entries || [];
    var currentTurn = initData.currentTurn || 0;
    var initRound = initData.round || 1;
    var initNpcs = initData.npcs || [];

    html += '<div class="init-header">';
    html += '<span class="init-round">' + t('dm.round') + ' ' + initRound + '</span>';
    if (entries.length > 0) {
        html += '<button class="btn btn-sm btn-primary" data-action="next-turn">' + t('dm.nextturn') + ' &rarr;</button>';
        html += '<button class="btn btn-ghost btn-sm" data-action="reset-init">Reset</button>';
    }
    html += '</div>';

    html += '<div class="init-columns">';

    // LEFT: Available players
    html += '<div class="init-col init-col-players">';
    html += '<div class="init-col-title">Players</div>';
    var iCharIds = getCharacterIds();
    for (var ici = 0; ici < iCharIds.length; ici++) {
        var iccfg = loadCharConfig(iCharIds[ici]);
        if (!iccfg) continue;
        var inInit = false;
        for (var ei = 0; ei < entries.length; ei++) {
            if (entries[ei].charId === iCharIds[ici]) { inInit = true; break; }
        }
        if (!inInit) {
            html += '<div class="init-available init-draggable" draggable="true" data-drag-type="player" data-char-id="' + iCharIds[ici] + '">';
            html += '<span class="init-drag-handle">&#9776;</span>';
            html += '<span style="color:' + iccfg.accentColor + '">' + escapeHtml(iccfg.name) + '</span>';
            html += '</div>';
        }
    }
    html += '</div>';

    // CENTER: Ordered initiative (drop zone)
    html += '<div class="init-col init-col-order" id="init-drop-zone">';
    html += '<div class="init-col-title">Initiative Order</div>';
    for (var ii = 0; ii < entries.length; ii++) {
        var entry = entries[ii];
        var isCurrent = ii === currentTurn;
        var entryColor = entry.disposition === 'hostile' ? 'var(--danger)' : entry.disposition === 'friendly' ? 'var(--success)' : entry.disposition === 'neutral' ? 'var(--warning)' : 'var(--accent)';
        if (entry.charId) {
            var ecfg = loadCharConfig(entry.charId);
            if (ecfg) entryColor = ecfg.accentColor;
        }
        html += '<div class="init-entry init-draggable" draggable="true" data-drag-type="reorder" data-init-idx="' + ii + '" data-init-current="' + (isCurrent ? '1' : '0') + '" style="border-left-color:' + entryColor + '">';
        html += '<span class="init-drag-handle">&#9776;</span>';
        html += '<span class="init-name">' + escapeHtml(entry.name) + '</span>';
        html += '<button class="init-remove" data-action="remove-init" data-init-idx="' + ii + '">&times;</button>';
        html += '</div>';
    }
    if (entries.length === 0) html += '<p class="text-dim init-drop-hint" style="text-align:center;padding:1rem 0;">Drag players or NPCs here</p>';
    html += '</div>';

    // RIGHT: NPCs/Monsters
    html += '<div class="init-col init-col-npcs">';
    html += '<div class="init-col-title">NPCs / Monsters</div>';
    for (var ni = 0; ni < initNpcs.length; ni++) {
        var inpc = initNpcs[ni];
        var inInit = false;
        for (var ei = 0; ei < entries.length; ei++) {
            if (entries[ei].npcIdx === ni) { inInit = true; break; }
        }
        if (!inInit) {
            var npcColor = inpc.disposition === 'hostile' ? 'var(--danger)' : inpc.disposition === 'friendly' ? 'var(--success)' : 'var(--warning)';
            html += '<div class="init-available init-npc init-draggable" draggable="true" data-drag-type="npc" data-npc-idx="' + ni + '" style="border-left-color:' + npcColor + '">';
            html += '<span class="init-drag-handle">&#9776;</span>';
            html += '<span>' + escapeHtml(inpc.name) + '</span>';
            html += '<button class="init-npc-del" data-action="init-delete-npc" data-npc-idx="' + ni + '">&times;</button>';
            html += '</div>';
        }
    }
    html += '<div class="init-add-npc-form">';
    html += '<input type="text" class="edit-input" id="init-npc-name" placeholder="Name..." style="flex:1;">';
    html += '<select class="edit-input" id="init-npc-disp" style="width:auto;">';
    html += '<option value="hostile">Hostile</option>';
    html += '<option value="neutral">Neutral</option>';
    html += '<option value="friendly">Friendly</option>';
    html += '</select>';
    html += '<button class="btn btn-ghost btn-sm" data-action="init-create-npc">+</button>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // init-columns
    html += '</div>'; // dm-tool-card
    return html;
}

function initInitiativeDragDrop() {
    var dropZone = document.getElementById('init-drop-zone');
    if (!dropZone) return;

    var dragData = null;

    document.querySelectorAll('.init-draggable').forEach(function(el) {
        el.addEventListener('dragstart', function(e) {
            dragData = {
                type: el.dataset.dragType,
                charId: el.dataset.charId,
                npcIdx: el.dataset.npcIdx,
                initIdx: el.dataset.initIdx
            };
            el.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
        });
        el.addEventListener('dragend', function() {
            el.classList.remove('dragging');
            dropZone.classList.remove('drag-over');
            document.querySelectorAll('.init-drop-indicator').forEach(function(ind) { ind.remove(); });
            dragData = null;
        });
    });

    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        dropZone.classList.add('drag-over');

        // Show drop indicator between entries
        document.querySelectorAll('.init-drop-indicator').forEach(function(ind) { ind.remove(); });
        var entries = dropZone.querySelectorAll('.init-entry');
        var insertBefore = null;
        for (var i = 0; i < entries.length; i++) {
            var rect = entries[i].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
                insertBefore = entries[i];
                break;
            }
        }
        var indicator = document.createElement('div');
        indicator.className = 'init-drop-indicator';
        if (insertBefore) {
            dropZone.insertBefore(indicator, insertBefore);
        } else {
            dropZone.appendChild(indicator);
        }
    });

    dropZone.addEventListener('dragleave', function(e) {
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
            document.querySelectorAll('.init-drop-indicator').forEach(function(ind) { ind.remove(); });
        }
    });

    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        document.querySelectorAll('.init-drop-indicator').forEach(function(ind) { ind.remove(); });
        if (!dragData) return;

        var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');

        // Determine insert position
        var entryEls = dropZone.querySelectorAll('.init-entry');
        var insertIdx = initData.entries.length;
        for (var i = 0; i < entryEls.length; i++) {
            var rect = entryEls[i].getBoundingClientRect();
            if (e.clientY < rect.top + rect.height / 2) {
                insertIdx = parseInt(entryEls[i].dataset.initIdx);
                break;
            }
        }

        if (dragData.type === 'player') {
            var cfg = loadCharConfig(dragData.charId);
            if (!cfg) return;
            var newEntry = { name: cfg.name, charId: dragData.charId };
            initData.entries.splice(insertIdx, 0, newEntry);
        } else if (dragData.type === 'npc') {
            var nIdx = parseInt(dragData.npcIdx);
            var npc = initData.npcs[nIdx];
            if (!npc) return;
            var newEntry = { name: npc.name, npcIdx: nIdx, disposition: npc.disposition };
            initData.entries.splice(insertIdx, 0, newEntry);
        } else if (dragData.type === 'reorder') {
            var oldIdx = parseInt(dragData.initIdx);
            var moved = initData.entries.splice(oldIdx, 1)[0];
            if (insertIdx > oldIdx) insertIdx--;
            initData.entries.splice(insertIdx, 0, moved);
            // Adjust currentTurn
            if (initData.currentTurn === oldIdx) {
                initData.currentTurn = insertIdx;
            } else if (oldIdx < initData.currentTurn && insertIdx >= initData.currentTurn) {
                initData.currentTurn--;
            } else if (oldIdx > initData.currentTurn && insertIdx <= initData.currentTurn) {
                initData.currentTurn++;
            }
        }

        localStorage.setItem('dw_initiative', JSON.stringify(initData));
        if (typeof syncUpload === 'function') syncUpload('dw_initiative');
        renderApp();
    });
}

function renderDMNPCs() {
    var data = getNPCData();
    var npcs = data.npcs || [];
    var html = '<div class="dm-tool-card">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">';
    html += '<h3>NPCs (' + npcs.length + ')</h3>';
    html += '<button class="btn btn-primary btn-sm" data-action="add-npc">+ Add NPC</button>';
    html += '</div>';

    if (npcs.length === 0) {
        html += '<p class="text-dim">No NPCs yet.</p>';
    } else {
        html += '<div class="npc-grid">';
        for (var ni = 0; ni < npcs.length; ni++) {
            var npc = npcs[ni];
            var dispColor = npc.disposition === 'friendly' ? 'var(--success)' : npc.disposition === 'hostile' ? 'var(--danger)' : npc.disposition === 'neutral' ? 'var(--warning)' : 'var(--text-dim)';
            html += '<div class="npc-card" style="border-left-color:' + dispColor + '">';
            html += '<div class="npc-header">';
            html += '<strong>' + escapeHtml(npc.name) + '</strong>';
            if (npc.disposition) html += '<span class="npc-disposition" style="color:' + dispColor + '">' + escapeHtml(npc.disposition) + '</span>';
            html += '</div>';
            if (npc.location) html += '<p class="npc-location">&#128205; ' + escapeHtml(npc.location) + '</p>';
            if (npc.notes) html += '<p class="npc-notes">' + escapeHtml(npc.notes) + '</p>';
            html += '<div class="npc-actions">';
            html += '<button class="btn btn-ghost btn-sm" data-action="edit-npc" data-npc-idx="' + ni + '">Edit</button>';
            html += '<button class="btn btn-ghost btn-sm" data-action="delete-npc" data-npc-idx="' + ni + '" style="color:var(--danger);">Delete</button>';
            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function renderDMWhispers() {
    var html = '<div class="dm-tool-card">';
    html += '<h3>Send Whisper</h3>';
    html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1rem;">';
    html += '<select class="edit-input" id="whisper-target" style="width:auto;">';
    var charIdsW = getCharacterIds();
    for (var wci = 0; wci < charIdsW.length; wci++) {
        var wcfg = loadCharConfig(charIdsW[wci]);
        if (wcfg) html += '<option value="' + charIdsW[wci] + '">' + escapeHtml(wcfg.name) + '</option>';
    }
    html += '</select>';
    html += '<input type="text" class="edit-input" id="whisper-text" placeholder="Secret message..." style="flex:1;">';
    html += '<button class="btn btn-primary btn-sm" data-action="send-whisper">Send</button>';
    html += '</div>';

    // Show sent whispers per player
    html += '<h3 style="margin-top:1.5rem;">Sent Whispers</h3>';
    for (var wi = 0; wi < charIdsW.length; wi++) {
        var wId = charIdsW[wi];
        var wCfg = loadCharConfig(wId);
        if (!wCfg) continue;
        var whispers = JSON.parse(localStorage.getItem('dw_whisper_' + wId) || '[]');
        if (whispers.length > 0) {
            html += '<div style="margin-bottom:0.75rem;">';
            html += '<strong style="color:' + wCfg.accentColor + ';font-size:0.85rem;">' + escapeHtml(wCfg.name) + '</strong>';
            for (var wj = 0; wj < whispers.length; wj++) {
                html += '<div class="whisper-card" style="margin:0.25rem 0;padding:0.4rem 0.6rem;">';
                html += '<span style="font-size:0.8rem;">' + escapeHtml(whispers[wj].text) + '</span>';
                html += '<span class="combat-log-time">' + new Date(whispers[wj].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span>';
                html += '</div>';
            }
            html += '</div>';
        }
    }

    html += '</div>';
    return html;
}

function renderDMDiceRoller() {
    var html = '<div class="dm-tool-card">';
    html += '<h3>' + t('dm.diceroller') + '</h3>';
    html += '<div class="dice-buttons">';
    var dice = [4, 6, 8, 10, 12, 20, 100];
    for (var di = 0; di < dice.length; di++) {
        html += '<button class="dice-btn" data-action="roll-dice" data-die="' + dice[di] + '">d' + dice[di] + '</button>';
    }
    html += '</div>';
    html += '<div class="dice-result" id="dice-result"></div>';
    html += '</div>';
    return html;
}

// ============================================================
// Section 12: Character List
// ============================================================

function renderCharCard(cid, cfg, state, isOwn) {
    var portrait = loadImage(cid, 'portrait');
    var banner = loadImage(cid, 'banner');
    var imgSrc = portrait || banner || '';

    var isOnline = typeof isUserOnline === 'function' && isUserOnline(cfg.player || cid);
    var html = '<a class="char-card" href="#/characters/' + cid + '" style="--card-accent:' + cfg.accentColor + '">';
    html += '<div class="presence-dot' + (isOnline ? ' online' : '') + '" data-user-id="' + (cfg.player || cid) + '"></div>';
    html += '<div class="char-card-img">';
    if (imgSrc) {
        html += '<img src="' + imgSrc + '" alt="">';
    } else {
        html += '<div class="char-card-placeholder">&#128100;</div>';
    }
    html += '</div>';
    html += '<div class="char-card-overlay">';
    html += '<span class="char-card-name">' + escapeHtml(cfg.name) + '</span>';
    html += '<span class="char-card-detail">' + raceDisplayName(cfg.race) + ' ' + classDisplayName(cfg.className) + '</span>';
    html += '<span class="char-card-detail">Level ' + state.level + '</span>';
    // HP mini bar
    var maxHP = getHP(cfg, state);
    var curHP = state.currentHP !== null ? state.currentHP : maxHP;
    var hpPct = maxHP > 0 ? Math.max(0, Math.min(100, Math.round((curHP / maxHP) * 100))) : 100;
    var hpCol = hpPct > 50 ? 'var(--success)' : (hpPct > 25 ? 'var(--warning)' : 'var(--danger)');
    html += '<div class="char-card-hp"><div class="char-card-hp-fill" style="width:' + hpPct + '%;background:' + hpCol + '"></div><span class="char-card-hp-text">' + curHP + '/' + maxHP + '</span></div>';
    if (isOwn) html += '<span class="char-card-badge">' + t('char.yours') + '</span>';
    html += '</div>';
    html += '</a>';
    return html;
}

function renderCharacterList() {
    var html = '<div class="dashboard">';
    html += '<h2 class="section-title">Characters</h2>';
    html += '<div class="character-cards">';

    var charIds = getCharacterIds();
    var uid = currentUserId();
    var myChars = getUserCharacters(uid);

    // Show own characters first
    var ownIds = [];
    var otherIds = [];
    for (var i = 0; i < charIds.length; i++) {
        if (myChars.indexOf(charIds[i]) !== -1) {
            ownIds.push(charIds[i]);
        } else {
            otherIds.push(charIds[i]);
        }
    }

    for (var i = 0; i < ownIds.length; i++) {
        var cid = ownIds[i];
        var cfg = loadCharConfig(cid);
        var state = loadCharState(cid);
        if (!cfg) continue;
        html += renderCharCard(cid, cfg, state, true);
    }

    // Create character card
    html += '<div class="char-card char-card-create" data-action="open-create-wizard">';
    html += '<div class="char-card-img"><div class="char-card-placeholder" style="font-size:2.5rem;">+</div></div>';
    html += '<div class="char-card-overlay">';
    html += '<span class="char-card-name">Nieuw Character</span>';
    html += '<span class="char-card-detail">Maak een nieuw character aan</span>';
    html += '</div>';
    html += '</div>';

    // Other players' characters
    for (var i = 0; i < otherIds.length; i++) {
        var cid = otherIds[i];
        var cfg = loadCharConfig(cid);
        var state = loadCharState(cid);
        if (!cfg) continue;
        html += renderCharCard(cid, cfg, state, false);
    }

    html += '</div>';
    html += '</div>';
    return html;
}

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
    html += '</div>';
    if (editable) {
        html += '<label class="image-upload-overlay" title="' + t('portrait.upload') + '"><span class="upload-icon">&#128247;</span><input type="file" accept="image/*" data-action="upload-portrait" style="display:none"></label>';
    }
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
        html += '<input type="number" class="xp-input" id="xp-add-input" value="100" min="1" style="width:70px;">';
        html += '<button class="btn btn-ghost btn-sm" data-action="add-xp">+XP</button>';
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

    var html = '<div class="sheet-block">';
    html += '<h2>' + t('overview.classfeatures') + '</h2>';

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

    // Subclass features
    if (isSubclassVisible(config, state)) {
    var subData = classData.subclasses && classData.subclasses[config.subclass];
    if (subData) {
        html += '<h3 style="margin-top:1rem;">' + t('overview.subclassfeatures') + '</h3>';
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

    // Racial features
    var raceKey = config.race;
    var raceData = DATA[raceKey];
    if (raceData && raceData.features) {
        html += '<h3 style="margin-top:1rem;">' + t('overview.racialtraits') + ' (' + raceDisplayName(config.race) + ')</h3>';
        for (var rf = 0; rf < raceData.features.length; rf++) {
            var rfeat = raceData.features[rf];
            html += '<div class="feature-card">';
            html += '<h4>' + escapeHtml(rfeat.name) + '</h4>';
            html += '<p>' + escapeHtml(rfeat.desc) + '</p>';
            html += '</div>';
        }
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
    var spellList = (DATA.spells && DATA.spells[className]) ? DATA.spells[className] : {};
    var hasCantrips = !!spellList[0];
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
    if (r.indexOf('vader') >= 0 || r.indexOf('moeder') >= 0 || r.indexOf('father') >= 0 || r.indexOf('mother') >= 0 || r.indexOf('parent') >= 0 || r.indexOf('opa') >= 0 || r.indexOf('oma') >= 0 || r.indexOf('grand') >= 0) return 'parent';
    if (r.indexOf('zoon') >= 0 || r.indexOf('dochter') >= 0 || r.indexOf('son') >= 0 || r.indexOf('daughter') >= 0 || r.indexOf('child') >= 0 || r.indexOf('kind') >= 0) return 'child';
    return 'sibling';
}

function renderFamilyTree(family, contextId, selfName, editable) {
    var html = '';
    // Sort members into tiers — use explicit tier or guess from relation
    var parents = [], siblings = [], children = [], others = [];
    for (var fi = 0; fi < family.length; fi++) {
        var fm = family[fi];
        fm._idx = fi;
        var tier = fm.tier || guessTier(fm.relation);
        if (tier === 'parent') parents.push(fm);
        else if (tier === 'child') children.push(fm);
        else siblings.push(fm);
    }

    html += '<div class="ftree">';

    // === PARENTS ROW ===
    if (parents.length > 0 || editable) {
        html += '<div class="ftree-tier ftree-parents">';
        if (editable) html += '<button class="ftree-add-btn" data-action="add-family" data-tier="parent" title="Add parent">+</button>';
        for (var pi = 0; pi < parents.length; pi++) {
            html += renderFamilyNode(parents[pi], editable, contextId);
        }
        html += '</div>';
        html += '<div class="ftree-connector-v"></div>';
    }

    // === SIBLINGS ROW (includes self) ===
    html += '<div class="ftree-tier ftree-siblings">';
    if (editable) html += '<button class="ftree-add-btn" data-action="add-family" data-tier="sibling" title="Add sibling">+</button>';
    // Self node
    if (selfName) {
        html += '<div class="ftree-node ftree-self">';
        html += '<div class="ftree-node-inner">';
        html += '<strong>' + escapeHtml(selfName) + '</strong>';
        html += '<span class="ftree-relation">Self</span>';
        html += '</div></div>';
    }
    for (var si = 0; si < siblings.length; si++) {
        html += renderFamilyNode(siblings[si], editable, contextId);
    }
    html += '</div>';

    // === CHILDREN ROW ===
    if (children.length > 0 || editable) {
        html += '<div class="ftree-connector-v"></div>';
        html += '<div class="ftree-tier ftree-children">';
        if (editable) html += '<button class="ftree-add-btn" data-action="add-family" data-tier="child" title="Add child">+</button>';
        for (var ci = 0; ci < children.length; ci++) {
            html += renderFamilyNode(children[ci], editable, contextId);
        }
        html += '</div>';
    }

    html += '</div>';

    // === ADD FORM (hidden, shown when + is clicked) ===
    if (editable) {
        html += '<div class="ftree-add-form" id="ftree-add-form" style="display:none;">';
        html += '<div class="ftree-form-row">';
        html += '<select class="edit-input" id="fam-source" style="width:auto;">';
        html += '<option value="custom">Custom entry</option>';
        // List characters
        var charIds = getCharacterIds();
        for (var chi = 0; chi < charIds.length; chi++) {
            if (charIds[chi] === contextId) continue;
            var chcfg = loadCharConfig(charIds[chi]);
            if (chcfg && chcfg.name) html += '<option value="char:' + charIds[chi] + '">' + escapeHtml(chcfg.name) + ' (character)</option>';
        }
        // List NPCs
        var npcData = getNPCData();
        var npcs = npcData.npcs || [];
        for (var ni = 0; ni < npcs.length; ni++) {
            html += '<option value="npc:' + ni + '">' + escapeHtml(npcs[ni].name) + ' (NPC)</option>';
        }
        html += '</select>';
        html += '</div>';
        html += '<div class="ftree-form-row">';
        html += '<input type="text" class="edit-input" id="fam-name" placeholder="Name" style="flex:1;">';
        html += '<input type="text" class="edit-input" id="fam-relation" placeholder="Relation (e.g. Mother)" style="flex:1;">';
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

function renderFamilyNode(fm, editable, contextId) {
    var isDead = fm.status === 'Deceased' || fm.status === 'Overleden';
    var html = '<div class="ftree-node' + (isDead ? ' deceased' : '') + '">';
    // Link to character or NPC page if linked
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
            html += '<div class="item-row">';
            html += '<span class="item-name">' + escapeHtml(cItem.name) + '</span>';
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
// Section 20: Maps Page
// ============================================================

var activeDimension = 0;
var activeMapId = null;
var mapZoom = 1;
var mapPanX = 0;
var mapPanY = 0;
var addingPin = false;

function getMapsData() {
    var saved = localStorage.getItem('dw_maps');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return {
        dimensions: [
            {
                id: 'valoria',
                name: 'Valoria',
                maps: [
                    { id: 'world', name: t('maps.worldmap'), image: null, isRoot: true, pins: [] }
                ]
            }
        ]
    };
}

function saveMapsData(data) {
    localStorage.setItem('dw_maps', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_maps');
}

function renderMaps() {
    var data = getMapsData();
    var dims = data.dimensions || [];
    if (activeDimension >= dims.length) activeDimension = 0;
    var dim = dims[activeDimension] || { maps: [] };

    var html = '<div class="maps-page">';

    // Dimension tabs at top
    html += '<div class="maps-header">';
    html += '<h1>' + t('maps.title') + '</h1>';
    html += '<div class="dimension-tabs">';
    for (var d = 0; d < dims.length; d++) {
        var activeClass = d === activeDimension ? ' active' : '';
        html += '<button class="dimension-tab' + activeClass + '" data-action="select-dimension" data-dim="' + d + '">' + escapeHtml(dims[d].name) + '</button>';
    }
    if (isDM()) {
        html += '<button class="dimension-tab dimension-add" data-action="add-dimension">+</button>';
    }
    html += '</div>';
    html += '</div>';

    if (activeMapId) {
        // MAP VIEWER MODE
        var map = null;
        for (var mi = 0; mi < dim.maps.length; mi++) {
            if (dim.maps[mi].id === activeMapId) { map = dim.maps[mi]; break; }
        }

        if (!map) {
            activeMapId = null;
            return renderMaps();
        }

        // Breadcrumb / back button
        html += '<div class="map-breadcrumb">';
        if (window._mapHistory && window._mapHistory.length > 0) {
            var prevMap = window._mapHistory[window._mapHistory.length - 1];
            var prevName = '';
            var prevDim = data.dimensions[prevMap.dim];
            if (prevDim) {
                for (var bmi = 0; bmi < prevDim.maps.length; bmi++) {
                    if (prevDim.maps[bmi].id === prevMap.mapId) { prevName = prevDim.maps[bmi].name; break; }
                }
            }
            html += '<button class="btn btn-ghost btn-sm" data-action="map-go-back">&larr; ' + escapeHtml(prevName || t('maps.prevmap')) + '</button>';
            html += '<span class="map-breadcrumb-sep">&#8250;</span>';
        } else {
            html += '<button class="btn btn-ghost btn-sm" data-action="map-back">&larr; ' + t('maps.allmaps') + '</button>';
        }
        html += '<span class="map-title">' + escapeHtml(map.name) + '</span>';
        if (isDM()) {
            html += '<button class="btn btn-ghost btn-sm" data-action="add-pin">' + t('maps.addpin') + '</button>';
            html += '<label class="btn btn-ghost btn-sm">' + t('maps.changeimage') + '<input type="file" accept="image/*" data-action="update-map-image" data-map-id="' + map.id + '" style="display:none"></label>';
        }
        html += '</div>';

        // Map viewer
        html += '<div class="map-viewer" id="map-viewer">';
        html += '<div class="map-canvas" id="map-canvas" style="transform: scale(' + mapZoom + ') translate(' + mapPanX + 'px, ' + mapPanY + 'px);">';

        if (map.image) {
            html += '<img src="' + map.image + '" alt="' + escapeAttr(map.name) + '" class="map-image" draggable="false">';
        } else {
            html += '<div class="map-placeholder">';
            if (isDM()) {
                html += '<label class="map-upload-prompt">' + t('maps.uploadprompt') + '<input type="file" accept="image/*" data-action="update-map-image" data-map-id="' + map.id + '" style="display:none"></label>';
            } else {
                html += '<p>' + t('maps.noimageyet') + '</p>';
            }
            html += '</div>';
        }

        // Render pins
        var pins = map.pins || [];
        // Build a lookup for map names (across all dimensions)
        var allMapsLookup = {};
        for (var dli = 0; dli < dims.length; dli++) {
            var dlMaps = dims[dli].maps || [];
            for (var dlmi = 0; dlmi < dlMaps.length; dlmi++) {
                allMapsLookup[dlMaps[dlmi].id] = { name: dlMaps[dlmi].name, dimName: dims[dli].name, dimIdx: dli };
            }
        }

        for (var pi = 0; pi < pins.length; pi++) {
            var pin = pins[pi];
            var isLink = pin.targetMap && allMapsLookup[pin.targetMap];
            var pinClass = isLink ? 'map-pin has-link' : 'map-pin';
            html += '<div class="' + pinClass + '" style="left:' + pin.x + '%;top:' + pin.y + '%;" data-pin-idx="' + pi + '"';
            if (isLink) {
                var targetInfo = allMapsLookup[pin.targetMap];
                html += ' data-action="goto-map" data-target="' + pin.targetMap + '" data-target-dim="' + targetInfo.dimIdx + '"';
                html += ' title="Ga naar: ' + escapeAttr(targetInfo.name) + '"';
            }
            html += '>';
            if (isLink) {
                html += '<div class="pin-dot pin-portal">&#9670;</div>';
            } else {
                html += '<div class="pin-dot"></div>';
            }
            html += '<span class="pin-label">' + escapeHtml(pin.label);
            if (isLink) html += ' <span class="pin-link-icon">&#8594;</span>';
            html += '</span>';
            if (isDM()) {
                html += '<button class="pin-delete" data-action="delete-pin" data-pin-idx="' + pi + '">&times;</button>';
            }
            html += '</div>';
        }

        html += '</div>'; // map-canvas

        // Zoom controls
        html += '<div class="map-zoom-controls">';
        html += '<button class="zoom-btn" data-action="zoom-in">+</button>';
        html += '<button class="zoom-btn" data-action="zoom-reset">&#8634;</button>';
        html += '<button class="zoom-btn" data-action="zoom-out">&minus;</button>';
        html += '</div>';

        html += '</div>'; // map-viewer

        // Pin adding mode indicator
        if (addingPin) {
            html += '<div class="pin-add-overlay">';
            html += '<p>' + t('maps.clicktoplace') + '</p>';
            html += '<button class="btn btn-ghost btn-sm" data-action="cancel-add-pin">' + t('generic.cancel') + '</button>';
            html += '</div>';
        }

    } else {
        // MAP GRID MODE — grouped by category
        var maps = dim.maps || [];
        var categories = {};
        var uncategorized = [];
        for (var gi = 0; gi < maps.length; gi++) {
            var gm = maps[gi];
            var cat = gm.category || '';
            if (cat) {
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(gm);
            } else {
                uncategorized.push(gm);
            }
        }
        var catNames = Object.keys(categories).sort();

        function renderMapCard(gm) {
            var cardHtml = '<div class="map-card" data-action="open-map" data-map-id="' + gm.id + '">';
            if (gm.image) {
                cardHtml += '<img class="map-card-img" src="' + gm.image + '" alt="">';
            } else {
                cardHtml += '<div class="map-card-placeholder">&#128506;</div>';
            }
            cardHtml += '<div class="map-card-info">';
            cardHtml += '<span class="map-card-name">' + escapeHtml(gm.name) + '</span>';
            if (gm.isRoot) cardHtml += '<span class="map-card-badge">' + t('maps.mainmap') + '</span>';
            cardHtml += '<span class="map-card-pins">' + (gm.pins ? gm.pins.length : 0) + ' pins</span>';
            cardHtml += '</div>';
            if (isDM()) {
                cardHtml += '<button class="map-card-delete" data-action="delete-map" data-map-id="' + gm.id + '">&times;</button>';
                cardHtml += '<button class="map-card-cat-btn" data-action="set-map-category" data-map-id="' + gm.id + '" title="Category">&#128193;</button>';
            }
            cardHtml += '</div>';
            return cardHtml;
        }

        // Render categorized maps
        for (var ci = 0; ci < catNames.length; ci++) {
            html += '<div class="maps-category">';
            html += '<h3 class="maps-category-title">' + escapeHtml(catNames[ci]) + '</h3>';
            html += '<div class="maps-grid">';
            var catMaps = categories[catNames[ci]];
            for (var mi = 0; mi < catMaps.length; mi++) {
                html += renderMapCard(catMaps[mi]);
            }
            html += '</div></div>';
        }

        // Uncategorized maps
        if (uncategorized.length > 0 || catNames.length === 0) {
            if (catNames.length > 0) {
                html += '<div class="maps-category">';
                html += '<h3 class="maps-category-title">Other</h3>';
            }
            html += '<div class="maps-grid">';
            for (var ui = 0; ui < uncategorized.length; ui++) {
                html += renderMapCard(uncategorized[ui]);
            }
        }

        if (isDM()) {
            html += '<div class="map-card map-card-add" data-action="add-map">';
            html += '<span class="map-card-add-icon">+</span>';
            html += '<span class="map-card-name">' + t('maps.newmap') + '</span>';
            html += '</div>';
        }

        html += '</div>'; // maps-grid
    }

    html += '</div>'; // maps-page
    return html;
}

// ============================================================
// Section 21: Timeline Page
// ============================================================

function getTimelineData() {
    var saved = localStorage.getItem('dw_timeline');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return {
        chapters: [
            {
                id: 'ch1',
                name: 'New Beginnings',
                events: [
                    { id: 'ev1', title: 'Sign At The Crossroads', desc: 'De avonturiers ontmoeten elkaar bij een kruispunt. Een verweerd bord wijst in vier richtingen \u2014 maar iets trekt hen allemaal dezelfde kant op.', type: 'quest', session: '1' }
                ]
            }
        ]
    };
}

function saveTimelineData(data) {
    localStorage.setItem('dw_timeline', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_timeline');
}

var EVENT_LAYOUTS = [
    { id: 'text', icon: '\ud83d\udcdd', label: 'Text' },
    { id: 'image-top', icon: '\ud83d\uddbc\ufe0f\u2b07', label: 'Image Top' },
    { id: 'image-left', icon: '\ud83d\uddbc\ufe0f\ud83d\udcdd', label: 'Image Left' },
    { id: 'image-right', icon: '\ud83d\udcdd\ud83d\uddbc\ufe0f', label: 'Image Right' },
    { id: 'full-image', icon: '\ud83c\udf05', label: 'Full Image' },
    { id: 'banner', icon: '\ud83c\udff4', label: 'Banner' }
];

function renderEventForm(evIdx, ev) {
    var isNew = evIdx < 0;
    var prefix = isNew ? '' : 'edit-';
    var html = '';
    html += '<input type="text" class="edit-input" id="' + prefix + 'ev-title" placeholder="' + t('timeline.eventtitle') + '" value="' + escapeAttr(ev.title || '') + '">';
    html += '<textarea class="edit-textarea auto-grow" id="' + prefix + 'ev-desc" placeholder="' + t('timeline.eventdesc') + '" style="min-height:60px;" oninput="if(typeof autoGrowTextarea===\'function\')autoGrowTextarea(this)">' + escapeHtml(ev.desc || '') + '</textarea>';
    html += '<div style="display:flex;gap:0.5rem;flex-wrap:wrap;">';
    html += '<input type="text" class="edit-input" id="' + prefix + 'ev-session" placeholder="' + t('timeline.eventsession') + '" style="width:80px;" value="' + escapeAttr(ev.session || '') + '">';
    html += '<select class="edit-input" id="' + prefix + 'ev-type" style="flex:1;">';
    var types = ['quest', 'danger', 'magic', 'discovery', 'social', 'combat'];
    for (var ti = 0; ti < types.length; ti++) {
        html += '<option value="' + types[ti] + '"' + (ev.type === types[ti] ? ' selected' : '') + '>' + t('timeline.eventtype.' + types[ti]) + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // Layout picker
    html += '<div class="event-layout-picker">';
    html += '<label class="text-dim" style="font-size:0.8rem;">Layout</label>';
    html += '<div class="event-layout-options">';
    for (var li = 0; li < EVENT_LAYOUTS.length; li++) {
        var lo = EVENT_LAYOUTS[li];
        html += '<button type="button" class="event-layout-option' + ((ev.layout || 'text') === lo.id ? ' active' : '') + '" data-action="pick-event-layout" data-layout="' + lo.id + '" data-event-idx="' + evIdx + '">' + lo.icon + '<br><span>' + lo.label + '</span></button>';
    }
    html += '</div>';
    html += '</div>';

    // Image upload (for image layouts)
    var needsImage = (ev.layout || 'text') !== 'text';
    html += '<div class="event-image-section" style="display:' + (needsImage ? 'block' : 'none') + '">';
    if (ev.image) {
        html += '<div class="event-image-preview"><img src="' + ev.image + '" alt=""><button class="btn btn-ghost btn-sm" data-action="remove-event-image" data-event-idx="' + evIdx + '">' + t('generic.delete') + '</button></div>';
    } else {
        html += '<label class="note-image-upload"><span>' + t('notes.addimage') + '</span><input type="file" accept="image/*" data-action="upload-event-image" data-event-idx="' + evIdx + '" style="display:none"></label>';
    }
    html += '</div>';

    html += '<div class="edit-actions">';
    html += '<button class="edit-save" data-action="save-event"' + (isNew ? '' : ' data-edit-idx="' + evIdx + '"') + '>' + t('generic.save') + '</button>';
    html += '<button class="edit-cancel" data-action="cancel-event">' + t('generic.cancel') + '</button>';
    html += '</div>';
    return html;
}

function renderTimeline() {
    var data = getTimelineData();
    var chapters = data.chapters || [];

    if (activeChapter >= chapters.length) activeChapter = Math.max(0, chapters.length - 1);

    var html = '<div class="timeline-page">';
    html += '<h1>' + t('timeline.title') + '</h1>';

    html += '<div class="timeline-layout">';

    // Left sidebar: chapter tabs
    html += '<div class="timeline-sidebar">';
    html += '<div class="timeline-chapters">';
    for (var i = 0; i < chapters.length; i++) {
        var ch = chapters[i];
        var activeClass = i === activeChapter ? ' active' : '';
        html += '<button class="chapter-tab' + activeClass + '" data-action="select-chapter" data-chapter="' + i + '">';
        html += '<span class="chapter-num">' + t('timeline.chapter') + ' ' + (i + 1) + '</span>';
        html += '<span class="chapter-name">' + escapeHtml(ch.name) + '</span>';
        if (isDM()) {
            html += '<span class="chapter-edit" data-action="edit-chapter" data-chapter="' + i + '" title="' + t('generic.edit') + '">&#9998;</span>';
        }
        html += '</button>';
    }
    html += '</div>';

    if (isDM()) {
        html += '<button class="btn btn-ghost btn-sm" data-action="add-chapter" style="margin-top:0.75rem;width:100%;">' + t('timeline.addchapter') + '</button>';
    }
    html += '</div>';

    // Right: events for active chapter
    html += '<div class="timeline-main">';

    if (chapters.length === 0) {
        html += '<div class="timeline-empty">';
        html += '<p class="text-dim">' + t('timeline.nochapters') + '</p>';
        html += '</div>';
    } else {
        var ch = chapters[activeChapter];
        html += '<div class="timeline-chapter-header">';
        html += '<h2>' + t('timeline.chapter') + ' ' + (activeChapter + 1) + ': ' + escapeHtml(ch.name) + '</h2>';
        if (isDM()) {
            html += '<button class="btn btn-primary btn-sm" data-action="add-event">' + t('timeline.addevent') + '</button>';
        }
        html += '</div>';

        // Add event form (hidden by default)
        if (isDM()) {
            html += '<div class="timeline-add-form" id="event-add-form" style="display:none;">';
            html += renderEventForm(-1, { title: '', desc: '', session: '', type: 'quest', layout: 'text', image: null });
            html += '</div>';
        }

        // Events
        var events = ch.events || [];
        if (events.length === 0) {
            html += '<p class="text-dim" style="padding:2rem 0;">' + t('timeline.noevents') + '</p>';
        } else {
            html += '<div class="timeline">';
            for (var j = 0; j < events.length; j++) {
                var ev = events[j];
                var evLayout = ev.layout || 'text';
                html += '<div class="timeline-event timeline-' + (ev.type || 'quest') + ' event-layout-' + evLayout + '" data-event-idx="' + j + '">';
                html += '<div class="timeline-marker"></div>';
                html += '<div class="timeline-content">';

                // Layout-based rendering
                if (evLayout === 'full-image' && ev.image) {
                    html += '<div class="event-full-image" style="background-image:url(' + ev.image + ')">';
                    html += '<div class="event-full-image-overlay">';
                    if (ev.session) html += '<span class="timeline-session">' + t('dash.session') + ' ' + escapeHtml(ev.session) + '</span>';
                    html += '<h3>' + escapeHtml(ev.title) + '</h3>';
                    if (ev.desc) html += '<p>' + escapeHtml(ev.desc) + '</p>';
                    html += '</div></div>';
                } else if (evLayout === 'image-top' && ev.image) {
                    html += '<div class="event-image-top"><img src="' + ev.image + '" alt=""></div>';
                    if (ev.session) html += '<span class="timeline-session">' + t('dash.session') + ' ' + escapeHtml(ev.session) + '</span>';
                    html += '<h3>' + escapeHtml(ev.title) + '</h3>';
                    if (ev.desc) html += '<p>' + escapeHtml(ev.desc) + '</p>';
                } else if ((evLayout === 'image-left' || evLayout === 'image-right') && ev.image) {
                    html += '<div class="event-split event-split-' + evLayout + '">';
                    html += '<div class="event-split-img"><img src="' + ev.image + '" alt=""></div>';
                    html += '<div class="event-split-text">';
                    if (ev.session) html += '<span class="timeline-session">' + t('dash.session') + ' ' + escapeHtml(ev.session) + '</span>';
                    html += '<h3>' + escapeHtml(ev.title) + '</h3>';
                    if (ev.desc) html += '<p>' + escapeHtml(ev.desc) + '</p>';
                    html += '</div></div>';
                } else if (evLayout === 'banner' && ev.image) {
                    html += '<div class="event-banner" style="background-image:url(' + ev.image + ')"></div>';
                    if (ev.session) html += '<span class="timeline-session">' + t('dash.session') + ' ' + escapeHtml(ev.session) + '</span>';
                    html += '<h3>' + escapeHtml(ev.title) + '</h3>';
                    if (ev.desc) html += '<p>' + escapeHtml(ev.desc) + '</p>';
                } else {
                    // Default text layout
                    if (ev.session) html += '<span class="timeline-session">' + t('dash.session') + ' ' + escapeHtml(ev.session) + '</span>';
                    html += '<h3>' + escapeHtml(ev.title) + '</h3>';
                    if (ev.desc) html += '<p>' + escapeHtml(ev.desc) + '</p>';
                }

                if (isDM()) {
                    html += '<div class="event-actions">';
                    html += '<button class="btn btn-ghost btn-sm" data-action="edit-event" data-event="' + j + '">' + t('generic.edit') + '</button>';
                    html += '<button class="btn btn-ghost btn-sm" data-action="delete-event" data-event="' + j + '" style="color:var(--danger);">' + t('generic.delete') + '</button>';
                    html += '</div>';
                }
                html += '</div>';
                html += '</div>';
            }
            html += '</div>';
        }
    }

    html += '</div>'; // timeline-main
    html += '</div>'; // timeline-layout
    html += '</div>'; // timeline-page
    return html;
}

// ============================================================
// Section 22: Lore Pages
// ============================================================

function getLoreData() {
    var saved = localStorage.getItem('dw_lore');
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return { articles: [] };
}

function saveLoreData(data) {
    localStorage.setItem('dw_lore', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_lore');
}

function renderLore(subpage) {
    if (subpage === 'party') return renderLoreParty();
    if (subpage === 'npcs') return renderNPCTracker();

    // Check if viewing a specific article
    if (subpage && subpage !== 'new') {
        return renderLoreArticle(subpage);
    }

    // New article form (DM only)
    if (subpage === 'new' && isDM()) {
        return renderLoreEditor();
    }

    // Index page
    var data = getLoreData();
    var html = '<div class="lore-page">';
    html += '<div class="lore-header">';
    html += '<h1>' + t('lore.title') + '</h1>';
    if (isDM()) {
        html += '<a class="btn btn-primary" href="#/lore/new">' + t('lore.addarticle') + '</a>';
    }
    html += '</div>';

    // Always show party + NPC links
    html += '<div class="lore-grid">';
    html += '<a class="lore-card" href="#/lore/party">';
    html += '<h3>' + t('lore.theparty') + '</h3>';
    html += '<p>' + t('lore.theparty.desc') + '</p>';
    html += '</a>';
    html += '<a class="lore-card" href="#/dm/npcs">';
    html += '<h3>NPCs</h3>';
    html += '<p>Known characters and contacts</p>';
    html += '</a>';

    // DM-created articles
    for (var i = 0; i < data.articles.length; i++) {
        var art = data.articles[i];
        html += '<a class="lore-card" href="#/lore/' + art.id + '">';
        html += '<h3>' + escapeHtml(art.title) + '</h3>';
        html += '<p>' + escapeHtml((art.content || '').substring(0, 100)) + '...</p>';
        html += '</a>';
    }

    html += '</div>';
    html += '</div>';
    return html;
}

function renderLoreArticle(articleId) {
    var data = getLoreData();
    var article = null;
    for (var i = 0; i < data.articles.length; i++) {
        if (data.articles[i].id === articleId) { article = data.articles[i]; break; }
    }

    if (!article) return '<div class="page-placeholder"><h2>' + t('lore.notfound') + '</h2><a class="btn btn-ghost" href="#/lore">' + t('lore.backtolore') + '</a></div>';

    var html = '<div class="lore-page lore-article">';
    html += '<a class="btn btn-ghost btn-sm" href="#/lore">&larr; ' + t('lore.backtolore') + '</a>';
    html += '<h1>' + escapeHtml(article.title) + '</h1>';

    // Render content — split by double newlines for paragraphs
    var paragraphs = article.content.split('\n\n');
    for (var p = 0; p < paragraphs.length; p++) {
        var text = paragraphs[p].trim();
        if (!text) continue;
        if (text.indexOf('## ') === 0) {
            html += '<h2>' + escapeHtml(text.substring(3)) + '</h2>';
        } else if (text.indexOf('# ') === 0) {
            html += '<h2>' + escapeHtml(text.substring(2)) + '</h2>';
        } else {
            html += '<p>' + escapeHtml(text) + '</p>';
        }
    }

    if (isDM()) {
        html += '<div style="margin-top:2rem;display:flex;gap:0.5rem;">';
        html += '<a class="btn btn-ghost btn-sm" href="#/lore/edit-' + article.id + '">' + t('generic.edit') + '</a>';
        html += '<button class="btn btn-ghost btn-sm" data-action="delete-lore" data-article-id="' + article.id + '" style="color:var(--danger);">' + t('generic.delete') + '</button>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function renderLoreEditor(editId) {
    var title = '';
    var content = '';
    var isEdit = false;

    if (editId) {
        var data = getLoreData();
        for (var i = 0; i < data.articles.length; i++) {
            if (data.articles[i].id === editId) {
                title = data.articles[i].title;
                content = data.articles[i].content;
                isEdit = true;
                break;
            }
        }
    }

    var html = '<div class="lore-page">';
    html += '<a class="btn btn-ghost btn-sm" href="#/lore">&larr; ' + t('lore.backtolore') + '</a>';
    html += '<h1>' + (isEdit ? t('lore.editarticle') : t('lore.newarticle')) + '</h1>';
    html += '<div class="lore-editor">';
    html += '<input type="text" class="edit-input" id="lore-title" placeholder="' + t('lore.articletitle') + '" value="' + escapeAttr(title) + '">';
    html += '<textarea class="edit-textarea lore-content-editor" id="lore-content" placeholder="' + t('lore.articlecontent') + '">' + escapeHtml(content) + '</textarea>';
    html += '<div class="edit-actions">';
    html += '<button class="edit-save" data-action="save-lore"' + (isEdit ? ' data-edit-id="' + editId + '"' : '') + '>' + t('generic.save') + '</button>';
    html += '<a class="edit-cancel" href="#/lore">' + t('generic.cancel') + '</a>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
}

function getNPCData() {
    var saved = localStorage.getItem('dw_npcs');
    if (saved) { try { return JSON.parse(saved); } catch(e) {} }
    return { npcs: [] };
}
function saveNPCData(data) {
    localStorage.setItem('dw_npcs', JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload('dw_npcs');
}

function renderNPCTracker() {
    var data = getNPCData();
    var npcs = data.npcs || [];
    var html = '<div class="lore-page">';
    html += '<a class="btn btn-ghost btn-sm" href="#/lore">&larr; Back to Lore</a>';
    html += '<div class="lore-header" style="margin-top:0.5rem;">';
    html += '<h1>NPCs</h1>';
    if (isDM()) {
        html += '<button class="btn btn-primary" data-action="add-npc">+ Add NPC</button>';
    }
    html += '</div>';

    if (npcs.length === 0) {
        html += '<p class="text-dim">No NPCs yet.</p>';
    } else {
        html += '<div class="npc-grid">';
        for (var ni = 0; ni < npcs.length; ni++) {
            var npc = npcs[ni];
            var dispColor = npc.disposition === 'friendly' ? 'var(--success)' : npc.disposition === 'hostile' ? 'var(--danger)' : npc.disposition === 'neutral' ? 'var(--warning)' : 'var(--text-dim)';
            html += '<div class="npc-card" style="border-left-color:' + dispColor + '">';
            html += '<div class="npc-header">';
            html += '<strong>' + escapeHtml(npc.name) + '</strong>';
            if (npc.disposition) html += '<span class="npc-disposition" style="color:' + dispColor + '">' + escapeHtml(npc.disposition) + '</span>';
            html += '</div>';
            if (npc.location) html += '<p class="npc-location">&#128205; ' + escapeHtml(npc.location) + '</p>';
            if (npc.notes) html += '<p class="npc-notes">' + escapeHtml(npc.notes) + '</p>';
            if (isDM()) {
                html += '<div class="npc-actions">';
                html += '<button class="btn btn-ghost btn-sm" data-action="edit-npc" data-npc-idx="' + ni + '">Edit</button>';
                html += '<button class="btn btn-ghost btn-sm" data-action="delete-npc" data-npc-idx="' + ni + '" style="color:var(--danger);">Delete</button>';
                html += '</div>';
            }
            html += '</div>';
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function renderLoreParty() {
    var html = '<div class="lore-page lore-article">';
    html += '<a class="btn btn-ghost btn-sm" href="#/lore">&larr; ' + t('lore.backtolore') + '</a>';
    html += '<h1>' + t('lore.theparty') + '</h1>';
    html += '<p class="section-intro">' + t('lore.theparty.intro') + '</p>';

    var ids = getCharacterIds();
    for (var i = 0; i < ids.length; i++) {
        var cfg = loadCharConfig(ids[i]);
        if (!cfg) continue;
        var state = loadCharState(ids[i]);
        html += '<div class="lore-party-member" style="border-left-color:' + cfg.accentColor + '">';
        html += '<h3 style="color:' + cfg.accentColor + '">' + escapeHtml(cfg.name) + '</h3>';
        html += '<p class="text-dim">' + raceDisplayName(cfg.race) + ' ' + classDisplayName(cfg.className) + ' \u2014 Level ' + state.level + '</p>';
        if (cfg.backstory) html += '<p>' + escapeHtml(cfg.backstory) + '</p>';
        html += '</div>';
    }

    html += '</div>';
    return html;
}

// ============================================================
// Section 23: Notes Page
// ============================================================

var TAG_CATEGORIES = [
    { id: 'players', name: 'Spelers', icon: '\ud83d\udc64', color: '#22d3ee' },
    { id: 'npcs', name: 'NPCs', icon: '\ud83c\udfad', color: '#f472b6' },
    { id: 'places', name: 'Plaatsen', icon: '\ud83d\udccd', color: '#4ade80' },
    { id: 'events', name: 'Events', icon: '\u26a1', color: '#fbbf24' },
    { id: 'lore', name: 'Lore', icon: '\ud83d\udcdc', color: '#a78bfa' },
    { id: 'other', name: 'Overig', icon: '\ud83d\udccc', color: '#8a8a9a' }
];

function getNotesData() {
    var userId = currentUserId();
    var saved = localStorage.getItem('dw_notes_' + userId);
    if (saved) {
        try {
            var parsed = JSON.parse(saved);
            if (parsed && Array.isArray(parsed.notes)) return parsed;
        } catch(e) {}
    }
    return { notes: [], customTags: [] };
}

function saveNotesData(data) {
    var userId = currentUserId();
    var key = 'dw_notes_' + userId;
    localStorage.setItem(key, JSON.stringify(data));
    if (typeof syncUpload === 'function') syncUpload(key);
}

function formatNoteDate(ts) {
    if (!ts) return '';
    var now = Date.now();
    var diff = now - ts;
    var mins = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);
    if (mins < 1) return t('date.justnow');
    if (mins < 60) return mins + ' ' + t('date.minago');
    if (hours < 24) return hours + ' ' + t('date.hoursago');
    if (days === 1) return t('date.yesterday');
    if (days < 7) return days + ' ' + t('date.daysago');
    var d = new Date(ts);
    return d.getDate() + '-' + (d.getMonth() + 1) + '-' + d.getFullYear();
}

function renderNotes() {
    var data = getNotesData();
    var notes = data.notes || [];

    // Filter and search
    var filtered = notes;
    if (notesFilter !== 'all') {
        filtered = filtered.filter(function(n) { return n.tagCategory === notesFilter; });
    }
    if (notesSearch) {
        var q = notesSearch.toLowerCase();
        filtered = filtered.filter(function(n) {
            return (n.title && n.title.toLowerCase().indexOf(q) >= 0) ||
                   (n.content && n.content.toLowerCase().indexOf(q) >= 0) ||
                   (n.tags && n.tags.some(function(t) { return t.toLowerCase().indexOf(q) >= 0; }));
        });
    }

    // Sort: pinned first, then by updated (newest first)
    filtered.sort(function(a, b) {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return (b.updated || 0) - (a.updated || 0);
    });

    var html = '<div class="notes-page">';
    html += '<div class="notes-header">';
    html += '<h1>' + t('notes.title') + '</h1>';
    html += '<button class="btn btn-primary" data-action="new-note">' + t('notes.new') + '</button>';
    html += '</div>';

    // Search bar
    html += '<div class="notes-search">';
    html += '<input type="text" class="notes-search-input" data-action="search-notes" placeholder="' + t('notes.search') + '" value="' + escapeAttr(notesSearch) + '">';
    html += '</div>';

    // Category filter tabs
    html += '<div class="notes-categories">';
    html += '<button class="notes-cat-btn' + (notesFilter === 'all' ? ' active' : '') + '" data-action="filter-notes" data-cat="all">' + t('notes.all') + '</button>';
    for (var ci = 0; ci < TAG_CATEGORIES.length; ci++) {
        var cat = TAG_CATEGORIES[ci];
        var count = notes.filter(function(n) { return n.tagCategory === cat.id; }).length;
        html += '<button class="notes-cat-btn' + (notesFilter === cat.id ? ' active' : '') + '" data-action="filter-notes" data-cat="' + cat.id + '" style="--cat-color:' + cat.color + '">';
        html += cat.icon + ' ' + t('notecat.' + cat.id);
        if (count > 0) html += ' <span class="notes-cat-count">' + count + '</span>';
        html += '</button>';
    }
    html += '</div>';

    // Notes grid
    if (filtered.length === 0) {
        html += '<div class="notes-empty">';
        if (notes.length === 0) {
            html += '<p>' + t('notes.empty') + '</p>';
            html += '<p class="text-dim">' + t('notes.empty.hint') + '</p>';
        } else {
            html += '<p>' + t('notes.nofilter') + '</p>';
        }
        html += '</div>';
    } else {
        html += '<div class="notes-grid">';
        for (var ni = 0; ni < filtered.length; ni++) {
            var note = filtered[ni];
            var cat = null;
            for (var fi = 0; fi < TAG_CATEGORIES.length; fi++) {
                if (TAG_CATEGORIES[fi].id === note.tagCategory) { cat = TAG_CATEGORIES[fi]; break; }
            }
            if (!cat) cat = TAG_CATEGORIES[5];

            html += '<div class="note-card' + (note.pinned ? ' note-card-pinned' : '') + '" data-action="view-note" data-note-id="' + note.id + '" style="--cat-color:' + cat.color + '">';

            // Pin badge
            if (note.pinned) {
                html += '<div class="note-pin-badge" title="' + t('notes.pinned') + '">&#128204;</div>';
            }

            // Gallery preview: show image grid
            if (note.layout === 'gallery' && note.images && note.images.length > 0) {
                html += '<div class="note-card-gallery">';
                var showCount = Math.min(note.images.length, 4);
                for (var gi = 0; gi < showCount; gi++) {
                    html += '<div class="note-card-gallery-img"><img src="' + note.images[gi] + '" alt=""></div>';
                }
                if (note.images.length > 4) {
                    html += '<div class="note-card-gallery-more">+' + (note.images.length - 4) + '</div>';
                }
                html += '</div>';
            } else if (note.image && note.layout !== 'text-only' && note.layout !== 'checklist') {
                html += '<div class="note-card-img"><img src="' + note.image + '" alt=""></div>';
            }

            html += '<div class="note-card-body">';
            html += '<div class="note-card-meta"><span class="note-card-cat">' + cat.icon + ' ' + t('notecat.' + cat.id) + '</span><span class="note-card-date">' + formatNoteDate(note.updated) + '</span></div>';
            html += '<h3 class="note-card-title">' + escapeHtml(note.title || t('generic.unnamed')) + '</h3>';

            // Checklist preview
            if (note.layout === 'checklist' && note.checklist && note.checklist.length > 0) {
                var done = note.checklist.filter(function(c) { return c.done; }).length;
                html += '<div class="note-card-checklist-preview">';
                html += '<div class="note-card-progress"><div class="note-card-progress-bar" style="width:' + (note.checklist.length > 0 ? Math.round(done / note.checklist.length * 100) : 0) + '%"></div></div>';
                html += '<span class="note-card-progress-text">' + done + '/' + note.checklist.length + '</span>';
                var previewItems = note.checklist.slice(0, 3);
                for (var pi = 0; pi < previewItems.length; pi++) {
                    html += '<div class="note-card-check-item' + (previewItems[pi].done ? ' done' : '') + '">' + (previewItems[pi].done ? '&#9745; ' : '&#9744; ') + escapeHtml(previewItems[pi].text) + '</div>';
                }
                if (note.checklist.length > 3) html += '<div class="note-card-check-more">+' + (note.checklist.length - 3) + ' ' + t('notes.more') + '</div>';
                html += '</div>';
            } else {
                html += '<p class="note-card-preview">' + escapeHtml((note.content || '').substring(0, 120)) + (note.content && note.content.length > 120 ? '...' : '') + '</p>';
            }

            if (note.tags && note.tags.length > 0) {
                html += '<div class="note-card-tags">';
                for (var ti = 0; ti < Math.min(note.tags.length, 4); ti++) {
                    var tagText = typeof note.tags[ti] === 'object' ? note.tags[ti].text : note.tags[ti];
                    html += '<span class="note-tag">' + escapeHtml(tagText) + '</span>';
                }
                if (note.tags.length > 4) html += '<span class="note-tag">+' + (note.tags.length - 4) + '</span>';
                html += '</div>';
            }

            html += '</div>';
            html += '</div>';
        }
        html += '</div>';
    }

    html += '</div>';
    return html;
}

function renderNoteEditor(noteId) {
    var data = getNotesData();
    var note = null;
    if (noteId) {
        for (var i = 0; i < data.notes.length; i++) {
            if (data.notes[i].id === noteId) { note = data.notes[i]; break; }
        }
    }

    // Initialize tag state for this editor session
    window._noteTags = note ? (note.tags || []).slice() : [];

    var title = note ? note.title : '';
    var content = note ? note.content : '';
    var tags = note ? (note.tags || []).join(', ') : '';
    var category = note ? note.tagCategory : 'other';
    var layout = note ? note.layout : 'text-only';
    var image = note ? note.image : null;
    var images = note ? (note.images || []) : [];
    var checklist = note ? (note.checklist || []) : [];
    var pinned = note ? !!note.pinned : false;

    var html = '<div class="notes-page">';
    html += '<div class="notes-header">';
    html += '<button class="btn btn-ghost" data-action="back-to-notes">&larr; ' + t('generic.back') + '</button>';
    html += '<h1>' + (note ? t('notes.editnote') : t('notes.newnote')) + '</h1>';
    if (note) {
        html += '<button class="btn btn-ghost btn-sm note-pin-toggle' + (pinned ? ' active' : '') + '" data-action="toggle-note-pin" data-note-id="' + note.id + '" title="' + (pinned ? t('notes.unpin') : t('notes.pin')) + '">&#128204; ' + (pinned ? t('notes.pinned') : t('notes.pin')) + '</button>';
    }
    html += '</div>';

    html += '<div class="note-editor">';

    // Title
    html += '<input type="text" class="edit-input note-title-input" id="note-title" placeholder="' + t('lore.articletitle') + '" value="' + escapeAttr(title) + '">';

    // Category selector
    html += '<div class="note-category-picker">';
    html += '<label class="text-dim" style="font-size:0.8rem;">' + t('notes.category') + '</label>';
    html += '<div class="note-cat-options">';
    for (var ci = 0; ci < TAG_CATEGORIES.length; ci++) {
        var ecat = TAG_CATEGORIES[ci];
        html += '<button class="note-cat-option' + (category === ecat.id ? ' active' : '') + '" data-action="pick-note-cat" data-cat="' + ecat.id + '" style="--cat-color:' + ecat.color + '">' + ecat.icon + ' ' + t('notecat.' + ecat.id) + '</button>';
    }
    html += '</div>';
    html += '</div>';

    // Layout selector
    html += '<div class="note-layout-picker">';
    html += '<label class="text-dim" style="font-size:0.8rem;">' + t('notes.layout') + '</label>';
    html += '<div class="note-layout-options">';
    var layouts = [
        { id: 'text-only', icon: '\ud83d\udcdd', label: t('notelayout.text') },
        { id: 'image-top', icon: '\ud83d\uddbc\ufe0f', label: t('notelayout.image') },
        { id: 'image-right', icon: '\ud83d\udcdd\ud83d\uddbc\ufe0f', label: t('notelayout.right') },
        { id: 'image-left', icon: '\ud83d\uddbc\ufe0f\ud83d\udcdd', label: t('notelayout.left') },
        { id: 'gallery', icon: '\ud83d\uddbc\ufe0f\ud83d\uddbc\ufe0f', label: t('notelayout.gallery') },
        { id: 'checklist', icon: '\u2611\ufe0f', label: t('notelayout.checklist') }
    ];
    for (var li = 0; li < layouts.length; li++) {
        var lo = layouts[li];
        html += '<button class="note-layout-option' + (layout === lo.id ? ' active' : '') + '" data-action="pick-note-layout" data-layout="' + lo.id + '">' + lo.icon + '<br><span>' + lo.label + '</span></button>';
    }
    html += '</div>';
    html += '</div>';

    // Image upload (single image layouts)
    var singleImageLayouts = ['image-top', 'image-right', 'image-left'];
    html += '<div class="note-image-section" style="display:' + (singleImageLayouts.indexOf(layout) >= 0 ? 'block' : 'none') + '">';
    if (image) {
        html += '<div class="note-image-preview"><img src="' + image + '" alt=""><button class="btn btn-ghost btn-sm" data-action="remove-note-image">' + t('generic.delete') + '</button></div>';
    } else {
        html += '<label class="note-image-upload"><span>' + t('notes.addimage') + '</span><input type="file" accept="image/*" data-action="upload-note-image" style="display:none"></label>';
    }
    html += '</div>';

    // Gallery upload (multi-image)
    html += '<div class="note-gallery-section" style="display:' + (layout === 'gallery' ? 'block' : 'none') + '">';
    html += '<div class="note-gallery-grid" id="note-gallery-grid">';
    for (var gi = 0; gi < images.length; gi++) {
        html += '<div class="note-gallery-thumb" data-gallery-idx="' + gi + '"><img src="' + images[gi] + '" alt=""><button class="note-gallery-remove" data-action="remove-gallery-image" data-idx="' + gi + '">&times;</button></div>';
    }
    html += '<label class="note-gallery-add"><span>+</span><input type="file" accept="image/*" data-action="upload-gallery-image" style="display:none" multiple></label>';
    html += '</div>';
    html += '</div>';

    // Checklist editor
    html += '<div class="note-checklist-section" style="display:' + (layout === 'checklist' ? 'block' : 'none') + '">';
    html += '<div class="note-checklist" id="note-checklist">';
    for (var cli = 0; cli < checklist.length; cli++) {
        html += '<div class="note-checklist-item" data-check-idx="' + cli + '">';
        html += '<input type="checkbox" class="note-check-box" data-action="toggle-check" data-idx="' + cli + '"' + (checklist[cli].done ? ' checked' : '') + '>';
        html += '<input type="text" class="note-check-text" data-action="edit-check-text" data-idx="' + cli + '" value="' + escapeAttr(checklist[cli].text) + '" placeholder="' + t('notes.checkitem') + '">';
        html += '<button class="note-check-remove" data-action="remove-check-item" data-idx="' + cli + '">&times;</button>';
        html += '</div>';
    }
    html += '</div>';
    html += '<button class="btn btn-ghost btn-sm" data-action="add-check-item">' + t('notes.addcheckitem') + '</button>';
    html += '</div>';

    // Content (hidden for checklist layout)
    html += '<textarea class="edit-textarea note-content-input" id="note-content" placeholder="' + t('notes.notecontent') + '" style="display:' + (layout === 'checklist' ? 'none' : 'block') + '">' + escapeHtml(content) + '</textarea>';

    // Tags with category
    html += '<div class="note-tags-section">';
    html += '<label class="text-dim" style="font-size:0.8rem;">' + t('notes.tags') + '</label>';
    html += '<div class="note-tags-list" id="note-tags-list">';
    var parsedTags = note ? (note.tags || []) : [];
    for (var nti = 0; nti < parsedTags.length; nti++) {
        var tagObj = typeof parsedTags[nti] === 'object' ? parsedTags[nti] : { text: parsedTags[nti], category: 'other' };
        var tagCat = null;
        for (var tci = 0; tci < TAG_CATEGORIES.length; tci++) {
            if (TAG_CATEGORIES[tci].id === tagObj.category) { tagCat = TAG_CATEGORIES[tci]; break; }
        }
        if (!tagCat) tagCat = TAG_CATEGORIES[5];
        html += '<span class="note-tag" style="border-color:' + tagCat.color + '">' + tagCat.icon + ' ' + escapeHtml(typeof tagObj === 'string' ? tagObj : tagObj.text) + '<button class="tag-remove" data-action="remove-tag" data-tag-idx="' + nti + '">&times;</button></span>';
    }
    html += '</div>';
    html += '<div class="note-tag-add">';
    html += '<select class="edit-input" id="tag-category" style="width:auto;">';
    for (var tci = 0; tci < TAG_CATEGORIES.length; tci++) {
        html += '<option value="' + TAG_CATEGORIES[tci].id + '">' + TAG_CATEGORIES[tci].icon + ' ' + t('notecat.' + TAG_CATEGORIES[tci].id) + '</option>';
    }
    html += '</select>';
    html += '<input type="text" class="edit-input" id="tag-text" placeholder="Tag name..." style="flex:1;">';
    html += '<button class="btn btn-ghost btn-sm" data-action="add-tag">+</button>';
    html += '</div>';
    html += '</div>';

    // Save/Delete
    html += '<div class="note-editor-actions">';
    html += '<button class="btn btn-primary" data-action="save-note"' + (note ? ' data-note-id="' + note.id + '"' : '') + '>' + t('generic.save') + '</button>';
    if (note) {
        html += '<button class="btn btn-ghost" data-action="delete-note" data-note-id="' + note.id + '" style="color:var(--danger);">' + t('generic.delete') + '</button>';
    }
    html += '</div>';

    html += '</div>';
    html += '</div>';
    return html;
}

function renderNoteView(noteId) {
    var data = getNotesData();
    var note = null;
    for (var i = 0; i < data.notes.length; i++) {
        if (data.notes[i].id === noteId) { note = data.notes[i]; break; }
    }
    if (!note) return '<div class="page-placeholder"><h2>' + t('notes.notfound') + '</h2></div>';

    var cat = null;
    for (var ci = 0; ci < TAG_CATEGORIES.length; ci++) {
        if (TAG_CATEGORIES[ci].id === note.tagCategory) { cat = TAG_CATEGORIES[ci]; break; }
    }
    if (!cat) cat = TAG_CATEGORIES[5];

    var html = '<div class="notes-page">';
    html += '<div class="notes-header">';
    html += '<button class="btn btn-ghost" data-action="back-to-notes">&larr; ' + t('generic.back') + '</button>';
    html += '<div class="notes-header-right">';
    if (note.pinned) html += '<span class="note-view-pin">&#128204; ' + t('notes.pinned') + '</span>';
    html += '<button class="btn btn-ghost btn-sm" data-action="toggle-note-pin" data-note-id="' + note.id + '">' + (note.pinned ? t('notes.unpin') : '&#128204; ' + t('notes.pin')) + '</button>';
    html += '<button class="btn btn-ghost btn-sm" data-action="edit-note" data-note-id="' + note.id + '">' + t('generic.edit') + '</button>';
    html += '</div>';
    html += '</div>';

    html += '<div class="note-view note-layout-' + (note.layout || 'text-only') + '">';

    // Gallery layout
    if (note.layout === 'gallery' && note.images && note.images.length > 0) {
        html += '<div class="note-view-gallery">';
        for (var gi = 0; gi < note.images.length; gi++) {
            html += '<div class="note-view-gallery-img"><img src="' + note.images[gi] + '" alt=""></div>';
        }
        html += '</div>';
    }

    if (note.image && note.layout === 'image-top') {
        html += '<div class="note-view-img"><img src="' + note.image + '" alt=""></div>';
    }

    html += '<div class="note-view-content">';
    if (note.image && note.layout === 'image-left') {
        html += '<div class="note-view-img-side"><img src="' + note.image + '" alt=""></div>';
    }

    html += '<div class="note-view-text">';
    html += '<div class="note-view-meta"><span class="note-view-cat" style="color:' + cat.color + '">' + cat.icon + ' ' + t('notecat.' + cat.id) + '</span><span class="note-view-date">' + formatNoteDate(note.updated) + '</span></div>';
    html += '<h1>' + escapeHtml(note.title || t('generic.unnamed')) + '</h1>';

    // Checklist view
    if (note.layout === 'checklist' && note.checklist && note.checklist.length > 0) {
        var done = note.checklist.filter(function(c) { return c.done; }).length;
        html += '<div class="note-view-checklist">';
        html += '<div class="note-view-progress"><div class="note-view-progress-fill" style="width:' + Math.round(done / note.checklist.length * 100) + '%"></div></div>';
        html += '<p class="note-view-progress-label">' + done + ' ' + t('notes.completed') + ' ' + note.checklist.length + '</p>';
        for (var vci = 0; vci < note.checklist.length; vci++) {
            html += '<div class="note-view-check-item' + (note.checklist[vci].done ? ' done' : '') + '" data-action="toggle-view-check" data-note-id="' + note.id + '" data-idx="' + vci + '">';
            html += (note.checklist[vci].done ? '&#9745; ' : '&#9744; ') + escapeHtml(note.checklist[vci].text);
            html += '</div>';
        }
        html += '</div>';
    }

    // Text content with preserved newlines
    if (note.layout !== 'checklist') {
        var paragraphs = (note.content || '').split('\n\n');
        for (var p = 0; p < paragraphs.length; p++) {
            if (paragraphs[p].trim()) {
                var lines = escapeHtml(paragraphs[p].trim()).replace(/\n/g, '<br>');
                html += '<p>' + lines + '</p>';
            }
        }
    }

    if (note.tags && note.tags.length > 0) {
        html += '<div class="note-view-tags">';
        for (var ti = 0; ti < note.tags.length; ti++) {
            var tagItem = note.tags[ti];
            var tagText = typeof tagItem === 'object' ? tagItem.text : tagItem;
            var tagCatId = typeof tagItem === 'object' ? tagItem.category : 'other';
            var tagCatObj = null;
            for (var tci = 0; tci < TAG_CATEGORIES.length; tci++) {
                if (TAG_CATEGORIES[tci].id === tagCatId) { tagCatObj = TAG_CATEGORIES[tci]; break; }
            }
            if (!tagCatObj) tagCatObj = TAG_CATEGORIES[5];
            html += '<span class="note-tag" style="border-left:3px solid ' + tagCatObj.color + ';padding-left:0.4rem;">' + tagCatObj.icon + ' ' + escapeHtml(tagText) + '</span>';
        }
        html += '</div>';
    }
    html += '</div>';

    if (note.image && note.layout === 'image-right') {
        html += '<div class="note-view-img-side"><img src="' + note.image + '" alt=""></div>';
    }
    html += '</div>';
    html += '</div>';

    html += '</div>';
    return html;
}

// ============================================================
// Section 24: Tooltip System
// ============================================================

var activeTooltip = null;

function showTooltipPopup(html, anchorEl) {
    removeTooltipPopup();
    var popup = document.createElement('div');
    popup.className = 'tooltip-popup';
    popup.innerHTML = html;
    document.body.appendChild(popup);

    var rect = anchorEl.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';

    var popupRect = popup.getBoundingClientRect();
    var top = rect.bottom + 8;
    var left = rect.left + (rect.width / 2) - (popupRect.width / 2);

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
    var lingering = document.querySelectorAll('.tooltip-popup');
    for (var i = 0; i < lingering.length; i++) {
        lingering[i].remove();
    }
}

function showSpellTooltip(spellName, anchorEl) {
    var spellData = null;
    if (DATA.spells) {
        var classNames = Object.keys(DATA.spells);
        for (var cn = 0; cn < classNames.length && !spellData; cn++) {
            var classList = DATA.spells[classNames[cn]];
            for (var lvl = 0; lvl <= 9 && !spellData; lvl++) {
                var spells = classList[lvl] || [];
                for (var i = 0; i < spells.length; i++) {
                    if (spells[i].name === spellName) {
                        spellData = spells[i];
                        break;
                    }
                }
            }
        }
    }
    if (!spellData) return;

    var tooltipHtml = '<div>';
    tooltipHtml += '<h4>' + escapeHtml(spellData.name) + '</h4>';
    if (spellData.time) tooltipHtml += '<p class="spell-meta"><strong>' + t('tooltip.time') + ':</strong> ' + escapeHtml(spellData.time) + '</p>';
    if (spellData.range) tooltipHtml += '<p class="spell-meta"><strong>' + t('tooltip.range') + ':</strong> ' + escapeHtml(spellData.range) + '</p>';
    if (spellData.dur) tooltipHtml += '<p class="spell-meta"><strong>' + t('tooltip.duration') + ':</strong> ' + escapeHtml(spellData.dur) + '</p>';
    tooltipHtml += '<p class="spell-desc">' + escapeHtml(spellData.desc) + '</p>';
    tooltipHtml += '</div>';

    removeTooltipPopup();
    var popup = document.createElement('div');
    popup.className = 'tooltip-popup';
    popup.innerHTML = tooltipHtml;
    document.body.appendChild(popup);

    var rect = anchorEl.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.zIndex = '9999';

    var popupRect = popup.getBoundingClientRect();
    var top = rect.bottom + 8;
    var left = rect.left + (rect.width / 2) - (popupRect.width / 2);

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
    var breakdown = getAbilityBreakdown(config, state, ability);
    var abLabel = ability.toUpperCase();

    var lines = '<strong>' + abLabel + ' ' + t('tooltip.breakdown') + '</strong><br>';
    lines += t('tooltip.base') + ': ' + breakdown.baseArray + '<br>';
    if (breakdown.racialBonus > 0) {
        lines += t('tooltip.racial') + ': +' + breakdown.racialBonus + '<br>';
    }
    if (breakdown.asiDetails.length > 0) {
        for (var i = 0; i < breakdown.asiDetails.length; i++) {
            lines += breakdown.asiDetails[i] + '<br>';
        }
    }
    lines += '<strong>' + t('tooltip.total') + ': ' + breakdown.total + '</strong>';

    if (state.customAbilities && state.customAbilities[ability] !== undefined && state.customAbilities[ability] !== null) {
        lines += '<br><em>(' + t('tooltip.overridden') + ' ' + state.customAbilities[ability] + ')</em>';
    }

    showTooltipPopup(lines, anchorEl);
}

function showInfoTooltip(value, anchorEl) {
    var langTips = TOOLTIPS[getLang()] || TOOLTIPS['nl'];
    var tip = langTips[value];
    if (!tip) return;
    showTooltipPopup('<strong>' + escapeHtml(value) + '</strong><br>' + escapeHtml(tip), anchorEl);
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

    // Check if subclass selection level (level 3 typically, or subclass.level)
    var needsSubclass = false;
    if (classData.subclasses && !config.subclass) {
        var subclassKeys = Object.keys(classData.subclasses);
        for (var sk = 0; sk < subclassKeys.length; sk++) {
            var sub = classData.subclasses[subclassKeys[sk]];
            if (sub.level === newLevel) {
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

    var html = '<div class="feat-grid-full" style="margin-top:0.75rem;">';
    for (var i = 0; i < feats.length; i++) {
        var feat = feats[i];
        var meetsPrereq = checkPrerequisite(feat, abilities, config);
        html += '<div class="feat-card-full levelup-feat-pick' + (meetsPrereq ? '' : ' unavailable') + '" data-feat="' + escapeAttr(feat.name) + '">';
        html += '<div class="feat-card-header">';
        html += '<h4>' + escapeHtml(feat.name) + '</h4>';
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

    var html = '<div class="asi-panel" data-asi-level="' + level + '">';
    html += '<h4>Level ' + level + ' \u2014 ' + t('stats.asi.feat') + '</h4>';
    html += '<div class="feat-grid-full">';

    for (var i = 0; i < feats.length; i++) {
        var feat = feats[i];
        var meetsPrereq = checkPrerequisite(feat, abilities, config);
        html += '<div class="feat-card-full' + (meetsPrereq ? '' : ' unavailable') + '" data-feat="' + escapeAttr(feat.name) + '">';
        html += '<div class="feat-card-header">';
        html += '<h4>' + escapeHtml(feat.name) + '</h4>';
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

// ============================================================
// Section 29: Image Upload Helpers
// ============================================================

function handleImageUpload(file, charId, type, maxSize) {
    if (!file) return;
    maxSize = maxSize || 500000; // 500KB default

    var reader = new FileReader();
    reader.onload = function(e) {
        var result = e.target.result;

        // Compress if needed using canvas
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var maxDim = type === 'banner' ? 1200 : 400;
            var w = img.width;
            var h = img.height;
            if (w > maxDim || h > maxDim) {
                if (w > h) {
                    h = Math.round(h * maxDim / w);
                    w = maxDim;
                } else {
                    w = Math.round(w * maxDim / h);
                    h = maxDim;
                }
            }
            canvas.width = w;
            canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            var compressed = canvas.toDataURL('image/jpeg', 0.7);
            try {
                saveImage(charId, type, compressed);
                renderApp();
            } catch (err) {
                showWarning(t('warn.imagetoolarge'));
            }
        };
        img.src = result;
    };
    reader.readAsDataURL(file);
}

// ============================================================
// Section 30: Event Handling
// ============================================================

function bindPageEvents(route) {
    var app = document.getElementById('app');
    if (!app) return;

    // Remove old listeners by re-cloning (simple approach for SPA)
    // Instead, we use event delegation on #app and document

    // Clean up any lingering tooltips
    removeTooltipPopup();

    // Determine context
    var charId = null;
    var config = null;
    var state = null;

    if (route.parts[0] === 'characters' && route.parts[1]) {
        charId = route.parts[1];
        config = loadCharConfig(charId);
        state = loadCharState(charId);
    }

    // ---- Click delegation on #app ----
    app.onclick = function(e) {
        var target = e.target;

        // --- Login page ---
        if (route.path === '/login' || !currentUser()) {
            // Login submit
            if (target.matches('[data-action="login-submit"]') || target.closest('[data-action="login-submit"]')) {
                var usernameEl = document.getElementById('login-username');
                var passwordEl = document.getElementById('login-password');
                var errorEl = document.getElementById('login-error');
                if (!usernameEl || !passwordEl) return;

                var username = usernameEl.value.trim().toLowerCase();
                var password = passwordEl.value;

                // Find user by username — check usersCache first, then DEFAULT_USERS
                var matchedId = null;
                var lookupSources = [usersCache, DEFAULT_USERS];
                for (var si = 0; si < lookupSources.length; si++) {
                    var src = lookupSources[si];
                    if (!src) continue;
                    for (var uid in src) {
                        if (uid === username || (src[uid].name && src[uid].name.toLowerCase() === username)) {
                            matchedId = uid;
                            break;
                        }
                    }
                    if (matchedId) break;
                }

                if (!matchedId) {
                    if (errorEl) { errorEl.textContent = t('login.error.notfound'); errorEl.style.display = 'block'; }
                    return;
                }

                var userData = getUserData(matchedId);
                if (!userData || userData.password !== password) {
                    if (errorEl) { errorEl.textContent = t('login.error.password'); errorEl.style.display = 'block'; }
                    return;
                }

                setSession(matchedId);
                applyUserTheme();
                navigate('/dashboard');
                return;
            }
            return;
        }

        // --- Navbar ---
        // Logout
        if (target.matches('[data-action="logout"]') || target.closest('[data-action="logout"]')) {
            clearSession();
            navigate('/login');
            return;
        }

        // Language toggle
        if (target.matches('[data-action="toggle-lang"]') || target.closest('[data-action="toggle-lang"]')) {
            setLang(getLang() === 'nl' ? 'en' : 'nl');
            renderApp();
            return;
        }

        // Mobile nav toggle
        if (target.matches('[data-action="toggle-nav"]') || target.closest('[data-action="toggle-nav"]')) {
            var navLinks = document.querySelector('.nav-links');
            if (navLinks) navLinks.classList.toggle('open');
            return;
        }

        // Toggle theme picker
        if (target.matches('[data-action="toggle-theme-picker"]') || target.closest('[data-action="toggle-theme-picker"]')) {
            var picker = document.getElementById('theme-picker');
            if (picker) picker.style.display = picker.style.display === 'none' ? 'grid' : 'none';
            return;
        }

        // Select theme
        if (target.matches('[data-action="select-theme"]') || target.closest('[data-action="select-theme"]')) {
            var themeBtn = target.matches('[data-action="select-theme"]') ? target : target.closest('[data-action="select-theme"]');
            setUserTheme(themeBtn.dataset.theme);
            var picker = document.getElementById('theme-picker');
            if (picker) picker.style.display = 'none';
            renderApp();
            return;
        }

        // --- Notes events ---
        // New note
        if (target.matches('[data-action="new-note"]')) { navigate('/notes/new'); return; }

        // Back to notes
        if (target.matches('[data-action="back-to-notes"]')) { navigate('/notes'); return; }

        // View note
        if (target.matches('[data-action="view-note"]') || target.closest('[data-action="view-note"]')) {
            var noteCard = target.closest('[data-action="view-note"]') || target;
            navigate('/notes/view-' + noteCard.dataset.noteId);
            return;
        }

        // Edit note
        if (target.matches('[data-action="edit-note"]')) { navigate('/notes/edit-' + target.dataset.noteId); return; }

        // Filter notes
        if (target.matches('[data-action="filter-notes"]')) {
            notesFilter = target.dataset.cat || 'all';
            renderApp();
            return;
        }

        // Pick category in editor
        if (target.matches('[data-action="pick-note-cat"]')) {
            document.querySelectorAll('.note-cat-option').forEach(function(b) { b.classList.remove('active'); });
            target.classList.add('active');
            return;
        }

        // Pick layout in editor
        if (target.matches('[data-action="pick-note-layout"]') || target.closest('[data-action="pick-note-layout"]')) {
            var layoutBtn = target.matches('[data-action="pick-note-layout"]') ? target : target.closest('[data-action="pick-note-layout"]');
            document.querySelectorAll('.note-layout-option').forEach(function(b) { b.classList.remove('active'); });
            layoutBtn.classList.add('active');
            var newLayout = layoutBtn.dataset.layout;
            var singleImgLayouts = ['image-top', 'image-right', 'image-left'];
            var imgSection = document.querySelector('.note-image-section');
            var gallerySection = document.querySelector('.note-gallery-section');
            var checkSection = document.querySelector('.note-checklist-section');
            var contentArea = document.getElementById('note-content');
            if (imgSection) imgSection.style.display = singleImgLayouts.indexOf(newLayout) >= 0 ? 'block' : 'none';
            if (gallerySection) gallerySection.style.display = newLayout === 'gallery' ? 'block' : 'none';
            if (checkSection) checkSection.style.display = newLayout === 'checklist' ? 'block' : 'none';
            if (contentArea) contentArea.style.display = newLayout === 'checklist' ? 'none' : 'block';
            return;
        }

        // Save note
        if (target.matches('[data-action="save-note"]')) {
            var noteTitleEl = document.getElementById('note-title');
            var noteContentEl = document.getElementById('note-content');
            var noteActiveCat = document.querySelector('.note-cat-option.active');
            var noteActiveLayout = document.querySelector('.note-layout-option.active');
            var noteImg = document.querySelector('.note-image-preview img');

            if (!noteTitleEl || !noteTitleEl.value.trim()) { alert(t('notes.filltitle')); return; }

            var noteData = getNotesData();
            var saveNoteId = target.dataset.noteId;

            // Collect tags from the tag list (new format: {text, category})
            var noteTags = [];
            if (window._noteTags) {
                noteTags = window._noteTags.slice();
            } else {
                // Fallback: read existing note tags
                var existingNote = null;
                if (saveNoteId) {
                    for (var fni = 0; fni < noteData.notes.length; fni++) {
                        if (noteData.notes[fni].id === saveNoteId) { existingNote = noteData.notes[fni]; break; }
                    }
                }
                if (existingNote) noteTags = existingNote.tags || [];
            }
            var noteCategory = noteActiveCat ? noteActiveCat.dataset.cat : 'other';
            var noteLayout = noteActiveLayout ? noteActiveLayout.dataset.layout : 'text-only';
            var noteImage = noteImg ? noteImg.src : null;

            // Collect gallery images
            var galleryImages = [];
            document.querySelectorAll('.note-gallery-thumb img').forEach(function(img) {
                if (img.src && img.src.indexOf('data:') === 0) galleryImages.push(img.src);
            });

            // Collect checklist items
            var checklistItems = [];
            document.querySelectorAll('.note-checklist-item').forEach(function(item) {
                var checkbox = item.querySelector('.note-check-box');
                var textInput = item.querySelector('.note-check-text');
                if (textInput && textInput.value.trim()) {
                    checklistItems.push({ text: textInput.value.trim(), done: checkbox ? checkbox.checked : false });
                }
            });

            var noteObj = {
                title: noteTitleEl.value.trim(),
                content: noteContentEl ? noteContentEl.value : '',
                tags: noteTags,
                tagCategory: noteCategory,
                layout: noteLayout,
                image: noteImage && noteImage.indexOf('data:') === 0 ? noteImage : null,
                images: galleryImages,
                checklist: checklistItems,
                updated: Date.now()
            };

            if (saveNoteId) {
                for (var sni = 0; sni < noteData.notes.length; sni++) {
                    if (noteData.notes[sni].id === saveNoteId) {
                        var existing = noteData.notes[sni];
                        existing.title = noteObj.title;
                        existing.content = noteObj.content;
                        existing.tags = noteObj.tags;
                        existing.tagCategory = noteObj.tagCategory;
                        existing.layout = noteObj.layout;
                        if (noteObj.image) existing.image = noteObj.image;
                        else if (noteLayout === 'text-only' || noteLayout === 'gallery' || noteLayout === 'checklist') existing.image = null;
                        existing.images = noteObj.images;
                        existing.checklist = noteObj.checklist;
                        existing.updated = noteObj.updated;
                        break;
                    }
                }
            } else {
                noteObj.id = 'n' + Date.now();
                noteObj.created = Date.now();
                noteObj.pinned = false;
                noteData.notes.push(noteObj);
            }

            saveNotesData(noteData);
            navigate('/notes');
            return;
        }

        // Delete note
        if (target.matches('[data-action="delete-note"]')) {
            if (confirm(t('notes.deletenote'))) {
                var delNoteData = getNotesData();
                delNoteData.notes = delNoteData.notes.filter(function(n) { return n.id !== target.dataset.noteId; });
                saveNotesData(delNoteData);
                navigate('/notes');
            }
            return;
        }

        // --- NPC handlers ---
        if (target.matches('[data-action="add-npc"]')) {
            var npcName = prompt('NPC name:');
            if (npcName && npcName.trim()) {
                var npcLoc = prompt('Location (optional):') || '';
                var npcDisp = prompt('Disposition (friendly/neutral/hostile/unknown):') || 'unknown';
                var npcNotes = prompt('Notes (optional):') || '';
                var npcData = getNPCData();
                npcData.npcs.push({ name: npcName.trim(), location: npcLoc.trim(), disposition: npcDisp.trim().toLowerCase(), notes: npcNotes.trim(), id: 'npc' + Date.now() });
                saveNPCData(npcData);
                renderApp();
            }
            return;
        }
        if (target.matches('[data-action="edit-npc"]')) {
            var npcIdx = parseInt(target.dataset.npcIdx);
            var npcData = getNPCData();
            if (npcData.npcs[npcIdx]) {
                var npc = npcData.npcs[npcIdx];
                var nName = prompt('Name:', npc.name); if (nName === null) return;
                var nLoc = prompt('Location:', npc.location); if (nLoc === null) return;
                var nDisp = prompt('Disposition (friendly/neutral/hostile/unknown):', npc.disposition); if (nDisp === null) return;
                var nNotes = prompt('Notes:', npc.notes); if (nNotes === null) return;
                npc.name = nName.trim() || npc.name;
                npc.location = nLoc.trim();
                npc.disposition = nDisp.trim().toLowerCase();
                npc.notes = nNotes.trim();
                saveNPCData(npcData);
                renderApp();
            }
            return;
        }
        if (target.matches('[data-action="delete-npc"]')) {
            if (confirm('Delete this NPC?')) {
                var npcIdx = parseInt(target.dataset.npcIdx);
                var npcData = getNPCData();
                npcData.npcs.splice(npcIdx, 1);
                saveNPCData(npcData);
                renderApp();
            }
            return;
        }

        // Remove note image
        if (target.matches('[data-action="remove-note-image"]')) {
            var noteImgPreview = document.querySelector('.note-image-preview');
            if (noteImgPreview) {
                noteImgPreview.outerHTML = '<label class="note-image-upload"><span>+ Afbeelding toevoegen</span><input type="file" accept="image/*" data-action="upload-note-image" style="display:none"></label>';
            }
            return;
        }

        // Toggle pin on note
        if (target.matches('[data-action="toggle-note-pin"]') || target.closest('[data-action="toggle-note-pin"]')) {
            var pinBtn = target.matches('[data-action="toggle-note-pin"]') ? target : target.closest('[data-action="toggle-note-pin"]');
            var pinNoteId = pinBtn.dataset.noteId;
            var pinData = getNotesData();
            for (var pni = 0; pni < pinData.notes.length; pni++) {
                if (pinData.notes[pni].id === pinNoteId) {
                    pinData.notes[pni].pinned = !pinData.notes[pni].pinned;
                    break;
                }
            }
            saveNotesData(pinData);
            renderApp();
            return;
        }

        // Add tag to note
        if (target.matches('[data-action="add-tag"]')) {
            var tagTextEl = document.getElementById('tag-text');
            var tagCatEl = document.getElementById('tag-category');
            if (tagTextEl && tagTextEl.value.trim()) {
                if (!window._noteTags) {
                    // Initialize from existing tags in DOM
                    window._noteTags = [];
                    document.querySelectorAll('#note-tags-list .note-tag').forEach(function(el) {
                        var txt = el.textContent.replace('\u00d7', '').trim();
                        // Remove leading emoji
                        txt = txt.replace(/^[\ud800-\udbff][\udc00-\udfff]\s*/, '').trim();
                        window._noteTags.push({ text: txt, category: 'other' });
                    });
                }
                window._noteTags.push({
                    text: tagTextEl.value.trim(),
                    category: tagCatEl ? tagCatEl.value : 'other'
                });
                // Re-render tag list
                var tagListEl = document.getElementById('note-tags-list');
                if (tagListEl) {
                    var tagHtml = '';
                    for (var tti = 0; tti < window._noteTags.length; tti++) {
                        var tg = window._noteTags[tti];
                        var tgCat = null;
                        for (var tci = 0; tci < TAG_CATEGORIES.length; tci++) {
                            if (TAG_CATEGORIES[tci].id === tg.category) { tgCat = TAG_CATEGORIES[tci]; break; }
                        }
                        if (!tgCat) tgCat = TAG_CATEGORIES[5];
                        tagHtml += '<span class="note-tag" style="border-color:' + tgCat.color + '">' + tgCat.icon + ' ' + escapeHtml(tg.text) + '<button class="tag-remove" data-action="remove-tag" data-tag-idx="' + tti + '">&times;</button></span>';
                    }
                    tagListEl.innerHTML = tagHtml;
                }
                tagTextEl.value = '';
            }
            return;
        }

        // Remove tag from note
        if (target.matches('[data-action="remove-tag"]') || target.closest('[data-action="remove-tag"]')) {
            var removeTagBtn = target.matches('[data-action="remove-tag"]') ? target : target.closest('[data-action="remove-tag"]');
            var tagIdx = parseInt(removeTagBtn.dataset.tagIdx);
            if (!window._noteTags) window._noteTags = [];
            if (!isNaN(tagIdx) && tagIdx < window._noteTags.length) {
                window._noteTags.splice(tagIdx, 1);
                // Re-render
                var tagListEl = document.getElementById('note-tags-list');
                if (tagListEl) {
                    var tagHtml = '';
                    for (var tti = 0; tti < window._noteTags.length; tti++) {
                        var tg = window._noteTags[tti];
                        var tgCat = null;
                        for (var tci = 0; tci < TAG_CATEGORIES.length; tci++) {
                            if (TAG_CATEGORIES[tci].id === tg.category) { tgCat = TAG_CATEGORIES[tci]; break; }
                        }
                        if (!tgCat) tgCat = TAG_CATEGORIES[5];
                        tagHtml += '<span class="note-tag" style="border-color:' + tgCat.color + '">' + tgCat.icon + ' ' + escapeHtml(tg.text) + '<button class="tag-remove" data-action="remove-tag" data-tag-idx="' + tti + '">&times;</button></span>';
                    }
                    tagListEl.innerHTML = tagHtml;
                }
            }
            return;
        }

        // Remove gallery image
        if (target.matches('[data-action="remove-gallery-image"]')) {
            var thumbEl = target.closest('.note-gallery-thumb');
            if (thumbEl) thumbEl.remove();
            return;
        }

        // Add checklist item
        if (target.matches('[data-action="add-check-item"]')) {
            var checklistEl = document.getElementById('note-checklist');
            if (checklistEl) {
                var newIdx = checklistEl.children.length;
                var itemHtml = '<div class="note-checklist-item" data-check-idx="' + newIdx + '">';
                itemHtml += '<input type="checkbox" class="note-check-box" data-action="toggle-check" data-idx="' + newIdx + '">';
                itemHtml += '<input type="text" class="note-check-text" data-action="edit-check-text" data-idx="' + newIdx + '" value="" placeholder="Item...">';
                itemHtml += '<button class="note-check-remove" data-action="remove-check-item" data-idx="' + newIdx + '">&times;</button>';
                itemHtml += '</div>';
                checklistEl.insertAdjacentHTML('beforeend', itemHtml);
                var newInput = checklistEl.lastElementChild.querySelector('.note-check-text');
                if (newInput) newInput.focus();
            }
            return;
        }

        // Remove checklist item
        if (target.matches('[data-action="remove-check-item"]')) {
            var checkItemEl = target.closest('.note-checklist-item');
            if (checkItemEl) checkItemEl.remove();
            return;
        }

        // Toggle checklist item in view mode
        if (target.matches('[data-action="toggle-view-check"]') || target.closest('[data-action="toggle-view-check"]')) {
            var checkEl = target.matches('[data-action="toggle-view-check"]') ? target : target.closest('[data-action="toggle-view-check"]');
            var tvNoteId = checkEl.dataset.noteId;
            var tvIdx = parseInt(checkEl.dataset.idx, 10);
            var tvData = getNotesData();
            for (var tvi = 0; tvi < tvData.notes.length; tvi++) {
                if (tvData.notes[tvi].id === tvNoteId && tvData.notes[tvi].checklist && tvData.notes[tvi].checklist[tvIdx]) {
                    tvData.notes[tvi].checklist[tvIdx].done = !tvData.notes[tvi].checklist[tvIdx].done;
                    tvData.notes[tvi].updated = Date.now();
                    break;
                }
            }
            saveNotesData(tvData);
            renderApp();
            return;
        }

        // Delete NPC from initiative pool
        if (target.matches('[data-action="init-delete-npc"]') || target.closest('[data-action="init-delete-npc"]')) {
            e.stopPropagation();
            var delBtn = target.closest('[data-action="init-delete-npc"]') || target;
            var nIdx = parseInt(delBtn.dataset.npcIdx);
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
            if (!isNaN(nIdx) && initData.npcs) {
                initData.npcs.splice(nIdx, 1);
                initData.entries = initData.entries.filter(function(ent) { return ent.npcIdx !== nIdx; });
            }
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // Create NPC for initiative
        if (target.matches('[data-action="init-create-npc"]')) {
            var nameEl = document.getElementById('init-npc-name');
            var dispEl = document.getElementById('init-npc-disp');
            if (!nameEl || !nameEl.value.trim()) return;
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
            if (!initData.npcs) initData.npcs = [];
            initData.npcs.push({ name: nameEl.value.trim(), disposition: dispEl ? dispEl.value : 'hostile' });
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // (delete-npc handler moved earlier in chain)

        // Next turn
        if (target.matches('[data-action="next-turn"]')) {
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
            if (initData.entries.length > 0) {
                initData.currentTurn = (initData.currentTurn + 1) % initData.entries.length;
                if (initData.currentTurn === 0) initData.round++;
            }
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // Remove from initiative
        if (target.matches('[data-action="remove-init"]')) {
            var ridx = parseInt(target.dataset.initIdx);
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
            if (!isNaN(ridx)) {
                initData.entries.splice(ridx, 1);
                if (initData.currentTurn >= initData.entries.length) initData.currentTurn = 0;
            }
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // Reset initiative (entries back to their boxes, keep NPCs, reset round)
        if (target.matches('[data-action="reset-init"]')) {
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1,"npcs":[]}');
            initData.entries = [];
            initData.currentTurn = 0;
            initData.round = 1;
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // Sync upload all
        if (target.matches('[data-action="sync-upload-all"]')) {
            if (typeof syncSeedCampaign === 'function') syncSeedCampaign();
            else if (typeof syncUploadAll === 'function') syncUploadAll();
            target.textContent = t('dm.sync.uploaded');
            setTimeout(function() { target.textContent = t('dm.sync.uploadall'); }, 2000);
            return;
        }

        // Seed campaign data to Firebase
        if (target.matches('[data-action="sync-seed-campaign"]')) {
            if (typeof syncSeedCampaign === 'function') syncSeedCampaign();
            target.textContent = 'Seeded!';
            setTimeout(function() { target.textContent = 'Seed Campaign Data'; }, 2000);
            return;
        }

        // Dice roller
        // Global dice panel toggle
        if (target.matches('[data-action="toggle-dice-panel"]') || target.closest('[data-action="toggle-dice-panel"]')) {
            var panel = document.getElementById('dice-panel');
            if (panel) {
                var wasHidden = panel.style.display === 'none';
                panel.style.display = wasHidden ? 'flex' : 'none';
                if (wasHidden && typeof DiceHand !== 'undefined') DiceHand.render();
            }
            return;
        }

        // Dice hand: add die
        if (target.matches('[data-action="dice-add"]')) {
            if (typeof DiceHand !== 'undefined') DiceHand.add(parseInt(target.dataset.die));
            return;
        }
        // Dice hand: remove from hand
        if (target.matches('[data-action="dice-remove-hand"]')) {
            if (typeof DiceHand !== 'undefined') DiceHand.remove(parseInt(target.dataset.idx));
            return;
        }
        // Dice hand: roll
        if (target.matches('[data-action="dice-roll-hand"]')) {
            if (typeof DiceHand !== 'undefined') DiceHand.roll();
            return;
        }
        // Dice hand: reset
        if (target.matches('[data-action="dice-reset"]')) {
            if (typeof DiceHand !== 'undefined') DiceHand.reset();
            return;
        }
        // Dice hand: return result to pool
        if (target.matches('[data-action="dice-remove-result"]') || target.closest('[data-action="dice-remove-result"]')) {
            var chip = target.matches('[data-action="dice-remove-result"]') ? target : target.closest('[data-action="dice-remove-result"]');
            if (typeof DiceHand !== 'undefined') DiceHand.removeResult(parseInt(chip.dataset.idx));
            return;
        }

        // DM dice roller (legacy)
        if (target.matches('[data-action="roll-dice"]')) {
            var die = parseInt(target.dataset.die);
            var result = Math.floor(Math.random() * die) + 1;
            var resultEl = document.getElementById('dice-result');
            if (resultEl) {
                resultEl.innerHTML = '<span class="dice-roll-value">' + result + '</span><span class="dice-roll-label">d' + die + '</span>';
                resultEl.classList.add('dice-animate');
                setTimeout(function() { resultEl.classList.remove('dice-animate'); }, 300);
            }
            return;
        }

        // --- Character Sheet Events ---
        if (charId && config && state) {
            // Tab switching
            if (target.matches('.tab-btn')) {
                activeTab = target.dataset.tab || 'overview';
                // Update URL for deep linking without triggering hashchange
                var newHash = '#/characters/' + charId + '/' + activeTab;
                history.replaceState(null, '', newHash);
                renderApp();
                return;
            }

            // Options dropdown toggle
            if (target.matches('[data-action="toggle-options"]') || target.closest('[data-action="toggle-options"]')) {
                var dropdown = document.getElementById('options-dropdown');
                if (dropdown) dropdown.classList.toggle('open');
                return;
            }

            // Close dropdown when clicking elsewhere
            if (!target.closest('.header-actions')) {
                var dropdown2 = document.getElementById('options-dropdown');
                if (dropdown2) dropdown2.classList.remove('open');
            }

            // Level up
            if (target.matches('[data-action="level-up"]')) {
                if (state.level < 20 && canEdit(charId)) {
                    showLevelUpModal(charId, config, state);
                }
                return;
            }

            // Level down
            if (target.matches('[data-action="level-down"]')) {
                if (state.level > 1 && canEdit(charId)) {
                    cleanupLevelDown(config, state);
                    state.level--;
                    saveCharState(charId, state);
                    renderApp();
                }
                return;
            }

            // Add XP
            if (target.matches('[data-action="add-xp"]')) {
                if (!canEdit(charId)) return;
                var xpInput = document.getElementById('xp-add-input');
                var xpAmt = xpInput ? parseInt(xpInput.value) || 0 : 0;
                if (xpAmt > 0) {
                    state.xp = (state.xp || 0) + xpAmt;
                    saveCharState(charId, state);
                    showToast('+' + xpAmt + ' XP');
                    renderApp();
                }
                return;
            }

            // Refresh quote
            if (target.matches('[data-action="refresh-quote"]') || target.closest('[data-action="refresh-quote"]')) {
                var quoteEl = app.querySelector('.char-quote-dynamic');
                if (quoteEl && config.quotes && config.quotes.length > 0) {
                    var newQuote = config.quotes[Math.floor(Math.random() * config.quotes.length)];
                    quoteEl.innerHTML = '&ldquo;' + escapeHtml(newQuote) + '&rdquo;';
                }
                return;
            }

            // ---- Inline Editing Handlers ----

            // Edit name
            if (target.matches('[data-action="edit-name"]') || target.closest('[data-action="edit-name"]')) {
                if (!canEdit(charId)) return;
                var nameWrap = app.querySelector('.char-name-wrap');
                if (nameWrap && !nameWrap.querySelector('.edit-input')) {
                    var nameDisplay = nameWrap.querySelector('.char-name-display');
                    var curName = config.name || '';
                    nameDisplay.style.display = 'none';
                    var editBtn = nameWrap.querySelector('[data-action="edit-name"]');
                    if (editBtn) editBtn.style.display = 'none';
                    var nameInput = document.createElement('input');
                    nameInput.type = 'text';
                    nameInput.className = 'edit-input edit-name-input';
                    nameInput.value = curName;
                    var saveBtn = document.createElement('button');
                    saveBtn.className = 'edit-save';
                    saveBtn.setAttribute('data-action', 'save-name');
                    saveBtn.textContent = t('generic.save');
                    var cancelBtn = document.createElement('button');
                    cancelBtn.className = 'edit-cancel';
                    cancelBtn.setAttribute('data-action', 'cancel-edit');
                    cancelBtn.textContent = t('generic.cancel');
                    var actionsDiv = document.createElement('div');
                    actionsDiv.className = 'edit-actions';
                    actionsDiv.appendChild(saveBtn);
                    actionsDiv.appendChild(cancelBtn);
                    nameWrap.insertBefore(nameInput, nameDisplay.nextSibling);
                    nameWrap.insertBefore(actionsDiv, nameInput.nextSibling);
                    nameInput.focus();
                    nameInput.select();
                }
                return;
            }

            // Save name
            if (target.matches('[data-action="save-name"]') || target.closest('[data-action="save-name"]')) {
                if (!canEdit(charId)) return;
                var nameInputEl = app.querySelector('.edit-name-input');
                if (nameInputEl) {
                    var newName = nameInputEl.value.trim();
                    if (newName) {
                        saveCharConfigField(charId, 'name', newName);
                        config = loadCharConfig(charId);
                    }
                }
                renderApp();
                return;
            }

            // Color picker toggle
            if (target.matches('[data-action="pick-color"]') || target.closest('[data-action="pick-color"]')) {
                var popup = app.querySelector('.color-picker-popup');
                if (popup) {
                    popup.style.display = popup.style.display === 'none' ? 'grid' : 'none';
                }
                return;
            }

            // Select color
            if (target.matches('[data-action="select-color"]') || target.closest('[data-action="select-color"]')) {
                var colorBtn = target.matches('[data-action="select-color"]') ? target : target.closest('[data-action="select-color"]');
                var newColor = colorBtn.dataset.color;
                if (newColor && canEdit(charId)) {
                    saveCharConfigField(charId, 'accentColor', newColor);
                    document.documentElement.style.setProperty('--accent', newColor);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Edit info-grid field (race, class, subclass, background, alignment, age)
            if (target.matches('[data-action="edit-info"]') || target.closest('[data-action="edit-info"]')) {
                if (!canEdit(charId)) return;
                var infoBtn = target.matches('[data-action="edit-info"]') ? target : target.closest('[data-action="edit-info"]');
                var infoField = infoBtn.dataset.infoField;
                var infoItem = infoBtn.closest('.info-item');
                var valueDisplay = infoItem ? infoItem.querySelector('.info-value-display') : null;
                if (!infoItem || !valueDisplay || infoItem.querySelector('.info-edit-select, .info-edit-input')) return;

                infoBtn.style.display = 'none';
                valueDisplay.style.display = 'none';

                if (infoField === 'age') {
                    var ageInput = document.createElement('input');
                    ageInput.type = 'number';
                    ageInput.className = 'edit-input info-edit-input';
                    ageInput.value = config.age || '';
                    ageInput.min = '1';
                    ageInput.setAttribute('data-info-field', 'age');
                    infoItem.appendChild(ageInput);
                    ageInput.focus();
                    ageInput.addEventListener('keydown', function(e) {
                        if (e.key === 'Enter') {
                            var newAge = parseInt(ageInput.value) || null;
                            saveCharConfigField(charId, 'age', newAge);
                            renderApp();
                        } else if (e.key === 'Escape') {
                            renderApp();
                        }
                    });
                    ageInput.addEventListener('blur', function() {
                        var newAge = parseInt(ageInput.value) || null;
                        if (newAge !== (config.age || null)) {
                            saveCharConfigField(charId, 'age', newAge);
                        }
                        renderApp();
                    });
                } else {
                    var options = getInfoFieldOptions(infoField, config);
                    var currentVal = infoField === 'background' ? (config.background || '') : (config[infoField] || '');
                    var sel = document.createElement('select');
                    sel.className = 'edit-input info-edit-select';
                    sel.setAttribute('data-info-field', infoField);
                    if (infoField === 'subclass') {
                        var emptyOpt = document.createElement('option');
                        emptyOpt.value = '';
                        emptyOpt.textContent = '— Select —';
                        sel.appendChild(emptyOpt);
                    }
                    for (var oi = 0; oi < options.length; oi++) {
                        var opt = document.createElement('option');
                        opt.value = options[oi].value;
                        opt.textContent = options[oi].label;
                        if (options[oi].value === currentVal) opt.selected = true;
                        sel.appendChild(opt);
                    }
                    infoItem.appendChild(sel);
                    sel.focus();
                    sel.addEventListener('change', function() {
                        var newVal = sel.value;
                        if (infoField === 'className') {
                            saveCharConfigField(charId, 'className', newVal);
                            saveCharConfigField(charId, 'subclass', '');
                        } else {
                            saveCharConfigField(charId, infoField, newVal);
                        }
                        renderApp();
                    });
                    sel.addEventListener('blur', function() {
                        renderApp();
                    });
                }
                return;
            }

            // Add weapon
            if (target.matches('[data-action="add-weapon"]')) {
                if (!canEdit(charId)) return;
                var wForm = app.querySelector('.weapon-add-form');
                if (wForm) {
                    wForm.style.display = wForm.style.display === 'none' ? 'flex' : 'none';
                    if (wForm.style.display !== 'none') {
                        var wNameInput = wForm.querySelector('.weapon-name-input');
                        if (wNameInput) wNameInput.focus();
                    }
                }
                return;
            }

            // Confirm weapon
            if (target.matches('[data-action="confirm-weapon"]')) {
                if (!canEdit(charId)) return;
                var wFormEl = app.querySelector('.weapon-add-form');
                if (wFormEl) {
                    var wName = (wFormEl.querySelector('.weapon-name-input') || {}).value || '';
                    var wDmg = (wFormEl.querySelector('.weapon-dmg-input') || {}).value || '1d4';
                    var wType = (wFormEl.querySelector('.weapon-type-input') || {}).value || 'slashing';
                    var wFinesse = !!(wFormEl.querySelector('.weapon-finesse-input') || {}).checked;
                    wName = wName.trim();
                    if (wName) {
                        if (!config.weapons) config.weapons = [];
                        config.weapons.push({ name: wName, dmg: wDmg, type: wType, finesse: wFinesse });
                        saveCharConfig(charId, config);
                        renderApp();
                    }
                }
                return;
            }

            // Cancel weapon
            if (target.matches('[data-action="cancel-weapon"]')) {
                var wFormEl2 = app.querySelector('.weapon-add-form');
                if (wFormEl2) wFormEl2.style.display = 'none';
                return;
            }

            // Delete weapon
            if (target.matches('[data-action="delete-weapon"]')) {
                if (!canEdit(charId)) return;
                var wIdx = parseInt(target.dataset.weaponIdx);
                if (!isNaN(wIdx) && config.weapons && config.weapons[wIdx] !== undefined) {
                    config.weapons.splice(wIdx, 1);
                    saveCharConfig(charId, config);
                    renderApp();
                }
                return;
            }

            // Edit field (generic)
            if (target.matches('[data-action="edit-field"]') || target.closest('[data-action="edit-field"]')) {
                if (!canEdit(charId)) return;
                var editTrigger = target.matches('[data-action="edit-field"]') ? target : target.closest('[data-action="edit-field"]');
                var fieldName = editTrigger.dataset.field;
                var fieldWrap = editTrigger.closest('.editable-field');
                if (!fieldWrap || fieldWrap.querySelector('.edit-textarea')) return;

                var displayEl = fieldWrap.querySelector('.field-display');
                var currentVal = '';
                if (fieldName.indexOf('appearance') === 0) {
                    var appIdx = parseInt(fieldName.replace('appearance', ''));
                    currentVal = (config.appearance && config.appearance[appIdx]) ? config.appearance[appIdx] : '';
                } else if (fieldName.indexOf('personality.') === 0) {
                    var pKey = fieldName.replace('personality.', '');
                    currentVal = (config.personality && config.personality[pKey]) ? config.personality[pKey] : '';
                } else if (fieldName === 'backstory') {
                    currentVal = config.backstory || '';
                }

                displayEl.style.display = 'none';
                editTrigger.style.display = 'none';

                var textarea = document.createElement('textarea');
                textarea.className = 'edit-textarea';
                textarea.value = currentVal;
                textarea.setAttribute('data-field', fieldName);

                var actions = document.createElement('div');
                actions.className = 'edit-actions';
                var sSaveBtn = document.createElement('button');
                sSaveBtn.className = 'edit-save';
                sSaveBtn.setAttribute('data-action', 'save-field');
                sSaveBtn.setAttribute('data-field', fieldName);
                sSaveBtn.textContent = t('generic.save');
                var sCancelBtn = document.createElement('button');
                sCancelBtn.className = 'edit-cancel';
                sCancelBtn.setAttribute('data-action', 'cancel-edit');
                sCancelBtn.textContent = t('generic.cancel');
                actions.appendChild(sSaveBtn);
                actions.appendChild(sCancelBtn);

                fieldWrap.appendChild(textarea);
                fieldWrap.appendChild(actions);
                textarea.focus();
                return;
            }

            // Save field (generic)
            if (target.matches('[data-action="save-field"]') || target.closest('[data-action="save-field"]')) {
                if (!canEdit(charId)) return;
                var saveFieldBtn = target.matches('[data-action="save-field"]') ? target : target.closest('[data-action="save-field"]');
                var saveFieldName = saveFieldBtn.dataset.field;
                var saveFieldWrap = saveFieldBtn.closest('.editable-field');
                var textareaEl = saveFieldWrap ? saveFieldWrap.querySelector('.edit-textarea') : null;
                if (!textareaEl) return;
                var newVal = textareaEl.value.trim();

                if (saveFieldName.indexOf('appearance') === 0) {
                    var aIdx = parseInt(saveFieldName.replace('appearance', ''));
                    var curAppearance = (config.appearance || []).slice();
                    while (curAppearance.length <= aIdx) curAppearance.push('');
                    curAppearance[aIdx] = newVal;
                    saveCharConfigField(charId, 'appearance', curAppearance);
                } else if (saveFieldName.indexOf('personality.') === 0) {
                    var ppKey = saveFieldName.replace('personality.', '');
                    var curPersonality = config.personality ? Object.assign({}, config.personality) : {};
                    curPersonality[ppKey] = newVal;
                    saveCharConfigField(charId, 'personality', curPersonality);
                } else if (saveFieldName === 'backstory') {
                    saveCharConfigField(charId, 'backstory', newVal);
                }

                config = loadCharConfig(charId);
                renderApp();
                return;
            }

            // Cancel edit (generic)
            if (target.matches('[data-action="cancel-edit"]') || target.closest('[data-action="cancel-edit"]')) {
                renderApp();
                return;
            }

            // Add appearance entry
            if (target.matches('[data-action="add-appearance"]')) {
                if (!canEdit(charId)) return;
                var curAppear = (config.appearance || []).slice();
                curAppear.push('');
                saveCharConfigField(charId, 'appearance', curAppear);
                renderApp();
                return;
            }

            // Remove appearance entry
            if (target.matches('[data-action="remove-appearance"]')) {
                if (!canEdit(charId)) return;
                var removeIdx = parseInt(target.dataset.appearIdx);
                if (!isNaN(removeIdx)) {
                    var curAppear2 = (config.appearance || []).slice();
                    curAppear2.splice(removeIdx, 1);
                    saveCharConfigField(charId, 'appearance', curAppear2);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Add quote
            if (target.matches('[data-action="add-quote"]') || target.closest('[data-action="add-quote"]')) {
                if (!canEdit(charId)) return;
                var quoteInput = app.querySelector('.quote-add-input');
                if (quoteInput) {
                    var quoteVal = quoteInput.value.trim();
                    if (quoteVal) {
                        var curQuotes = (config.quotes || []).slice();
                        curQuotes.push(quoteVal);
                        saveCharConfigField(charId, 'quotes', curQuotes);
                        config = loadCharConfig(charId);
                        renderApp();
                    }
                }
                return;
            }

            // Remove quote
            if (target.matches('[data-action="remove-quote"]') || target.closest('[data-action="remove-quote"]')) {
                if (!canEdit(charId)) return;
                var removeBtn = target.matches('[data-action="remove-quote"]') ? target : target.closest('[data-action="remove-quote"]');
                var qIdx = parseInt(removeBtn.dataset.quoteIdx);
                if (!isNaN(qIdx)) {
                    var curQ = (config.quotes || []).slice();
                    curQ.splice(qIdx, 1);
                    saveCharConfigField(charId, 'quotes', curQ);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Add timeline entry
            if (target.matches('[data-action="add-timeline-entry"]')) {
                if (!canEdit(charId)) return;
                var ctAge = document.getElementById('ct-age');
                var ctEvent = document.getElementById('ct-event');
                if (ctAge && ctEvent && ctEvent.value.trim()) {
                    var tl = (config.charTimeline || []).slice();
                    tl.push({ age: ctAge.value.trim(), event: ctEvent.value.trim() });
                    saveCharConfigField(charId, 'charTimeline', tl);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Remove timeline entry
            if (target.matches('[data-action="remove-timeline-entry"]')) {
                if (!canEdit(charId)) return;
                var ctIdx = parseInt(target.dataset.idx);
                if (!isNaN(ctIdx)) {
                    var tl = (config.charTimeline || []).slice();
                    tl.splice(ctIdx, 1);
                    saveCharConfigField(charId, 'charTimeline', tl);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Show family add form for specific tier
            if (target.matches('[data-action="add-family"]') || target.closest('[data-action="add-family"]')) {
                var btn = target.matches('[data-action="add-family"]') ? target : target.closest('[data-action="add-family"]');
                if (!canEdit(charId)) return;
                var form = document.getElementById('ftree-add-form');
                var tierInput = document.getElementById('fam-tier');
                if (form && tierInput) {
                    tierInput.value = btn.dataset.tier || 'sibling';
                    form.style.display = form.style.display === 'none' ? 'block' : 'none';
                    // Reset form
                    var nameEl = document.getElementById('fam-name');
                    if (nameEl) nameEl.value = '';
                    var relEl = document.getElementById('fam-relation');
                    if (relEl) relEl.value = '';
                    var notesEl = document.getElementById('fam-notes');
                    if (notesEl) notesEl.value = '';
                }
                return;
            }

            // Save family member from form
            if (target.matches('[data-action="save-family"]')) {
                if (!canEdit(charId)) return;
                var sourceEl = document.getElementById('fam-source');
                var nameEl = document.getElementById('fam-name');
                var relEl = document.getElementById('fam-relation');
                var statusEl = document.getElementById('fam-status');
                var notesEl = document.getElementById('fam-notes');
                var tierEl = document.getElementById('fam-tier');
                var source = sourceEl ? sourceEl.value : 'custom';
                var entry = {
                    name: nameEl ? nameEl.value.trim() : '',
                    relation: relEl ? relEl.value.trim() : '',
                    status: statusEl ? statusEl.value : 'Alive',
                    notes: notesEl ? notesEl.value.trim() : '',
                    tier: tierEl ? tierEl.value : 'sibling'
                };
                // Auto-fill from character or NPC source
                if (source.indexOf('char:') === 0) {
                    var srcCharId = source.substring(5);
                    var srcCfg = loadCharConfig(srcCharId);
                    if (srcCfg) {
                        if (!entry.name) entry.name = srcCfg.name;
                        entry.linkedChar = srcCharId;
                    }
                } else if (source.indexOf('npc:') === 0) {
                    var srcNpcIdx = parseInt(source.substring(4));
                    var npcList = getNPCData().npcs || [];
                    if (npcList[srcNpcIdx]) {
                        if (!entry.name) entry.name = npcList[srcNpcIdx].name;
                        entry.linkedNpc = srcNpcIdx;
                    }
                }
                if (!entry.name) return;
                var fam = (config.family || []).slice();
                fam.push(entry);
                saveCharConfigField(charId, 'family', fam);
                config = loadCharConfig(charId);
                renderApp();
                return;
            }

            // Cancel family add
            if (target.matches('[data-action="cancel-family"]')) {
                var form = document.getElementById('ftree-add-form');
                if (form) form.style.display = 'none';
                return;
            }

            // Remove family member
            if (target.matches('[data-action="remove-family"]')) {
                if (!canEdit(charId)) return;
                var famIdx = parseInt(target.dataset.idx);
                if (!isNaN(famIdx)) {
                    var fam = (config.family || []).slice();
                    fam.splice(famIdx, 1);
                    saveCharConfigField(charId, 'family', fam);
                    config = loadCharConfig(charId);
                    renderApp();
                }
                return;
            }

            // Export
            if (target.matches('[data-action="export-char"]') || target.closest('[data-action="export-char"]')) {
                exportCharacter(charId, state);
                return;
            }

            // Reset
            if (target.matches('[data-action="reset-char"]') || target.closest('[data-action="reset-char"]')) {
                showResetModal(charId, config, state);
                return;
            }

            // Ability edit mode toggle
            if (target.matches('[data-action="ability-edit"]') || target.closest('[data-action="ability-edit"]')) {
                abilityEditMode = true;
                editAbilities = null;
                renderApp();
                return;
            }

            // Ability adjustment in edit mode
            if (target.matches('.ability-adj')) {
                var ab = target.dataset.ab;
                var dir = target.dataset.dir;
                if (editAbilities && ab) {
                    if (dir === 'up' && editAbilities[ab] < 30) {
                        editAbilities[ab]++;
                    } else if (dir === 'down' && editAbilities[ab] > 1) {
                        editAbilities[ab]--;
                    }
                    renderApp();
                }
                return;
            }

            // Ability edit save
            if (target.matches('[data-action="ability-save"]')) {
                if (editAbilities) {
                    state.customAbilities = Object.assign({}, editAbilities);
                    saveCharState(charId, state);
                }
                abilityEditMode = false;
                editAbilities = null;
                renderApp();
                return;
            }

            // Ability edit cancel
            if (target.matches('[data-action="ability-cancel"]')) {
                abilityEditMode = false;
                editAbilities = null;
                renderApp();
                return;
            }

            // Spell star/favorite toggle
            if (target.matches('[data-spell-star]') || target.closest('[data-spell-star]')) {
                var starEl = target.matches('[data-spell-star]') ? target : target.closest('[data-spell-star]');
                var spellStarName = starEl.dataset.spellStar;
                if (spellStarName && canEdit(charId)) {
                    if (!state.favorites) state.favorites = [];
                    var starIdx = state.favorites.indexOf(spellStarName);
                    if (starIdx >= 0) {
                        state.favorites.splice(starIdx, 1);
                    } else {
                        state.favorites.push(spellStarName);
                    }
                    saveCharState(charId, state);
                    renderApp();
                    e.stopPropagation();
                    return;
                }
            }

            // Spell toggle (not if clicking star)
            if ((target.matches('.spell-toggle') || target.closest('.spell-toggle')) &&
                !target.matches('[data-spell-star]') && !target.closest('[data-spell-star]')) {
                if (!canEdit(charId)) return;
                var btn = target.closest('.spell-toggle') || target;
                var spellName = btn.dataset.spell;
                var spellLevel = parseInt(btn.dataset.level);

                if (spellLevel === 0) {
                    toggleCantrip(charId, config, state, spellName);
                } else {
                    togglePrepared(charId, config, state, spellName);
                }
                return;
            }

            // Filter bar
            if (target.matches('.filter-btn')) {
                spellFilter = target.dataset.filter || 'all';
                renderApp();
                return;
            }

            // Metamagic toggle
            if (target.matches('.metamagic-option') || target.closest('.metamagic-option')) {
                if (!canEdit(charId)) return;
                var mmBtn = target.closest('.metamagic-option') || target;
                if (mmBtn.classList.contains('locked')) return;
                var mmName = mmBtn.dataset.metamagic;
                toggleMetamagic(charId, config, state, mmName);
                return;
            }

            // ASI option buttons
            if (target.matches('.asi-option') || target.closest('.asi-option')) {
                if (!canEdit(charId)) return;
                var asiBtn = target.closest('.asi-option') || target;
                var asiLevel = parseInt(asiBtn.dataset.asiLevel);
                var asiType = asiBtn.dataset.asiType;

                if (asiType === 'reset') {
                    delete state.asiChoices[asiLevel];
                    saveCharState(charId, state);
                    renderApp();
                    return;
                }
                if (asiType === 'asi-two') {
                    showASIAbilityPicker(charId, config, state, asiLevel, 'asi-two');
                    return;
                }
                if (asiType === 'asi-split') {
                    showASIAbilityPicker(charId, config, state, asiLevel, 'asi-split');
                    return;
                }
                if (asiType === 'feat') {
                    showFeatPicker(charId, config, state, asiLevel);
                    return;
                }
            }

            // Item add button
            if (target.matches('[data-action="add-item"]')) {
                var form = app.querySelector('.item-add-form');
                if (form) {
                    form.style.display = form.style.display === 'none' ? 'flex' : 'none';
                    if (form.style.display !== 'none') {
                        var nameInput = form.querySelector('.item-name-input');
                        if (nameInput) nameInput.focus();
                    }
                }
                return;
            }

            // Item confirm
            if (target.matches('[data-action="confirm-item"]')) {
                var formEl = app.querySelector('.item-add-form');
                if (formEl) {
                    var itemNameInput = formEl.querySelector('.item-name-input');
                    var itemWeightInput = formEl.querySelector('.item-weight-input');
                    var itemNotesInput = formEl.querySelector('.item-notes-input');
                    var itemName = (itemNameInput ? itemNameInput.value : '').trim();
                    var itemWeight = itemWeightInput ? parseFloat(itemWeightInput.value) || 0 : 0;
                    var itemNotes = itemNotesInput ? itemNotesInput.value.trim() : '';
                    if (itemName) {
                        if (!state.items) state.items = [];
                        state.items.push({ name: itemName, weight: itemWeight, notes: itemNotes });
                        saveCharState(charId, state);
                        renderApp();
                    }
                }
                return;
            }

            // Item cancel
            if (target.matches('[data-action="cancel-item"]')) {
                var formEl2 = app.querySelector('.item-add-form');
                if (formEl2) formEl2.style.display = 'none';
                return;
            }

            // Item remove
            if (target.matches('.item-remove')) {
                var itemIdx = parseInt(target.dataset.itemIdx);
                if (!isNaN(itemIdx) && state.items && state.items[itemIdx] !== undefined) {
                    state.items.splice(itemIdx, 1);
                    saveCharState(charId, state);
                    renderApp();
                }
                return;
            }

            // === Combat Tab Event Handlers ===

            // Take damage
            if (target.matches('[data-action="take-damage"]') || target.closest('[data-action="take-damage"]')) {
                if (!canEdit(charId)) return;
                var dmgInput = app.querySelector('#damage-input');
                var dmgVal = dmgInput ? parseInt(dmgInput.value) || 0 : 0;
                if (dmgVal <= 0) return;
                var maxHPVal = getHP(config, state);
                var curHP = (state.currentHP === null || state.currentHP === undefined) ? maxHPVal : state.currentHP;
                var curTempHP = state.tempHP || 0;
                // Damage goes to temp HP first
                if (curTempHP > 0) {
                    if (dmgVal <= curTempHP) {
                        state.tempHP = curTempHP - dmgVal;
                        dmgVal = 0;
                    } else {
                        dmgVal -= curTempHP;
                        state.tempHP = 0;
                    }
                }
                if (dmgVal > 0) {
                    state.currentHP = Math.max(0, curHP - dmgVal);
                } else {
                    state.currentHP = curHP;
                }
                if (!state.combatLog) state.combatLog = [];
                state.combatLog.unshift({ type: 'damage', amount: parseInt(dmgInput.value), time: Date.now() });
                if (state.combatLog.length > 20) state.combatLog.length = 20;
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Heal
            if (target.matches('[data-action="heal"]') || target.closest('[data-action="heal"]')) {
                if (!canEdit(charId)) return;
                var healInput = app.querySelector('#heal-input');
                var healVal = healInput ? parseInt(healInput.value) || 0 : 0;
                if (healVal <= 0) return;
                var maxHPHeal = getHP(config, state);
                var curHPHeal = (state.currentHP === null || state.currentHP === undefined) ? maxHPHeal : state.currentHP;
                state.currentHP = Math.min(maxHPHeal, curHPHeal + healVal);
                if (!state.combatLog) state.combatLog = [];
                state.combatLog.unshift({ type: 'heal', amount: healVal, time: Date.now() });
                if (state.combatLog.length > 20) state.combatLog.length = 20;
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Set temp HP
            if (target.matches('[data-action="set-temp-hp"]') || target.closest('[data-action="set-temp-hp"]')) {
                if (!canEdit(charId)) return;
                var tempInput = app.querySelector('#temp-hp-input');
                var tempVal = tempInput ? parseInt(tempInput.value) || 0 : 0;
                state.tempHP = Math.max(0, tempVal);
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Toggle death save
            if (target.matches('[data-action="toggle-death-save"]')) {
                if (!canEdit(charId)) return;
                var saveType = target.dataset.saveType;
                var saveIdx = parseInt(target.dataset.saveIdx);
                if (!state.deathSaves) state.deathSaves = { successes: 0, failures: 0 };
                if (saveIdx < state.deathSaves[saveType]) {
                    state.deathSaves[saveType] = saveIdx;
                } else {
                    state.deathSaves[saveType] = saveIdx + 1;
                }
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Reset death saves
            if (target.matches('[data-action="reset-death-saves"]')) {
                if (!canEdit(charId)) return;
                state.deathSaves = { successes: 0, failures: 0 };
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Toggle condition
            if (target.matches('[data-action="toggle-condition"]')) {
                if (!canEdit(charId)) return;
                var condName = target.dataset.condition;
                if (!state.conditions) state.conditions = [];
                var condIdx = state.conditions.indexOf(condName);
                if (condIdx >= 0) {
                    state.conditions.splice(condIdx, 1);
                } else {
                    state.conditions.push(condName);
                }
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Roll weapon attack
            if (target.matches('[data-action="roll-attack"]') || target.closest('[data-action="roll-attack"]')) {
                var rollBtn = target.matches('[data-action="roll-attack"]') ? target : target.closest('[data-action="roll-attack"]');
                var hitMod = parseInt(rollBtn.dataset.hit);
                var dmgDice = rollBtn.dataset.dmg;
                var dmgMod = parseInt(rollBtn.dataset.dmgMod);
                var weaponName = rollBtn.dataset.weapon;

                // Roll d20 + hit mod
                var attackRoll = Math.floor(Math.random() * 20) + 1;
                var totalHit = attackRoll + hitMod;
                var isNat20 = attackRoll === 20;
                var isNat1 = attackRoll === 1;

                // Roll damage
                var dmgMatch = dmgDice.match(/(\d+)d(\d+)/);
                var dmgTotal = 0;
                if (dmgMatch) {
                    var numDice = parseInt(dmgMatch[1]) * (isNat20 ? 2 : 1);
                    var dieSize = parseInt(dmgMatch[2]);
                    for (var rd = 0; rd < numDice; rd++) dmgTotal += Math.floor(Math.random() * dieSize) + 1;
                    dmgTotal += dmgMod;
                }

                // Show result in a toast-like popup near the button
                var resultDiv = document.createElement('div');
                resultDiv.className = 'weapon-roll-result' + (isNat20 ? ' nat20' : '') + (isNat1 ? ' nat1' : '');
                resultDiv.innerHTML = '<strong>' + escapeHtml(weaponName) + '</strong><br>' +
                    'Attack: ' + attackRoll + ' + ' + hitMod + ' = <b>' + totalHit + '</b>' +
                    (isNat20 ? ' NAT 20!' : '') + (isNat1 ? ' NAT 1!' : '') +
                    '<br>Damage: <b>' + dmgTotal + '</b>';
                rollBtn.closest('.weapon').appendChild(resultDiv);
                setTimeout(function() { resultDiv.remove(); }, 3000);
                return;
            }

            // Set concentration
            if (target.matches('[data-action="set-concentration"]')) {
                if (!canEdit(charId)) return;
                state.concentrating = target.value || null;
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Drop concentration
            if (target.matches('[data-action="drop-concentration"]')) {
                if (!canEdit(charId)) return;
                state.concentrating = null;
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Toggle spell slot
            if (target.matches('[data-action="toggle-spell-slot"]')) {
                if (!canEdit(charId)) return;
                var slotLevel = target.dataset.slotLevel;
                var slotIdx = parseInt(target.dataset.slotIdx);
                if (!state.spellSlotsUsed) state.spellSlotsUsed = {};
                var currentUsedSlots = state.spellSlotsUsed[slotLevel] || 0;
                if (slotIdx < currentUsedSlots) {
                    state.spellSlotsUsed[slotLevel] = slotIdx;
                } else {
                    state.spellSlotsUsed[slotLevel] = slotIdx + 1;
                }
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Short rest
            if (target.matches('[data-action="short-rest"]') || target.closest('[data-action="short-rest"]')) {
                if (!canEdit(charId)) return;
                // Warlock: recover pact slots
                if (config.className === 'warlock') {
                    if (!state.spellSlotsUsed) state.spellSlotsUsed = {};
                    state.spellSlotsUsed['pact'] = 0;
                }
                // Spend hit dice to heal
                var hdAvailable = state.level - (state.hitDiceUsed || 0);
                if (hdAvailable > 0 && state.currentHP !== null) {
                    var maxHP = getHP(config, state);
                    if (state.currentHP < maxHP) {
                        var hdToSpend = Math.min(hdAvailable, Math.ceil((maxHP - state.currentHP) / 6));
                        var conMod = getMod(getAbilityScore(config, state, 'con'));
                        var classHD = DATA.classes[config.className] ? DATA.classes[config.className].hitDie : 8;
                        var healed = 0;
                        for (var hdi = 0; hdi < hdToSpend; hdi++) {
                            healed += Math.max(1, Math.floor(Math.random() * classHD) + 1 + conMod);
                        }
                        state.currentHP = Math.min(maxHP, state.currentHP + healed);
                        state.hitDiceUsed = (state.hitDiceUsed || 0) + hdToSpend;
                        // Log
                        if (!state.combatLog) state.combatLog = [];
                        state.combatLog.unshift({ type: 'heal', amount: healed, source: 'Short Rest (' + hdToSpend + ' HD)', time: Date.now() });
                        if (state.combatLog.length > 20) state.combatLog.length = 20;
                    }
                }
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Long rest
            if (target.matches('[data-action="long-rest"]') || target.closest('[data-action="long-rest"]')) {
                if (!canEdit(charId)) return;
                var maxHPRest = getHP(config, state);
                state.currentHP = maxHPRest;
                state.tempHP = 0;
                state.deathSaves = { successes: 0, failures: 0 };
                state.conditions = [];
                state.spellSlotsUsed = {};
                state.concentrating = null;
                var hitDiceToRestore = Math.ceil(state.level / 2);
                state.hitDiceUsed = Math.max(0, (state.hitDiceUsed || 0) - hitDiceToRestore);
                // Log
                if (!state.combatLog) state.combatLog = [];
                state.combatLog.unshift({ type: 'rest', source: 'Long Rest — Full recovery', time: Date.now() });
                if (state.combatLog.length > 20) state.combatLog.length = 20;
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Delete combat log entry
            if (target.matches('[data-action="delete-combat-log"]')) {
                if (!canEdit(charId)) return;
                var logIdx = parseInt(target.dataset.logIdx);
                if (state.combatLog && state.combatLog[logIdx] !== undefined) {
                    state.combatLog.splice(logIdx, 1);
                    saveCharState(charId, state);
                    renderApp();
                }
                return;
            }

            // Clear combat log
            if (target.matches('[data-action="clear-combat-log"]')) {
                if (!canEdit(charId)) return;
                state.combatLog = [];
                saveCharState(charId, state);
                renderApp();
                return;
            }

            // Toggle inspiration
            if (target.matches('[data-action="toggle-inspiration"]') || target.closest('[data-action="toggle-inspiration"]')) {
                if (!canEdit(charId)) return;
                state.inspiration = !state.inspiration;
                saveCharState(charId, state);
                renderApp();
                return;
            }
        }

        // --- Session number +/- ---
        if (target.matches('[data-action="session-plus"]')) {
            var n = parseInt(localStorage.getItem('dw_session_number') || '0');
            localStorage.setItem('dw_session_number', String(n + 1));
            if (typeof syncUpload === 'function') syncUpload('dw_session_number');
            renderApp();
            return;
        }
        if (target.matches('[data-action="session-minus"]')) {
            var n = parseInt(localStorage.getItem('dw_session_number') || '0');
            if (n > 0) localStorage.setItem('dw_session_number', String(n - 1));
            if (typeof syncUpload === 'function') syncUpload('dw_session_number');
            renderApp();
            return;
        }

        // --- Dashboard: whispers ---
        if (target.matches('[data-action="send-whisper"]')) {
            var wTarget = document.getElementById('whisper-target');
            var wText = document.getElementById('whisper-text');
            if (wTarget && wText && wText.value.trim()) {
                var wKey = 'dw_whisper_' + wTarget.value;
                var existing = JSON.parse(localStorage.getItem(wKey) || '[]');
                existing.push({ text: wText.value.trim(), time: Date.now(), from: 'DM' });
                localStorage.setItem(wKey, JSON.stringify(existing));
                if (typeof syncUpload === 'function') syncUpload(wKey);
                wText.value = '';
                showToast('Whisper sent to ' + wTarget.options[wTarget.selectedIndex].text);
            }
            return;
        }
        if (target.matches('[data-action="dismiss-whisper"]')) {
            var wIdx = parseInt(target.dataset.whisperIdx);
            var wKey = 'dw_whisper_' + currentUserId();
            var whispers = JSON.parse(localStorage.getItem(wKey) || '[]');
            whispers.splice(wIdx, 1);
            localStorage.setItem(wKey, JSON.stringify(whispers));
            if (typeof syncUpload === 'function') syncUpload(wKey);
            renderApp();
            return;
        }

        // --- Dashboard: quests ---
        if (target.matches('[data-action="add-quest"]')) {
            var qForm = document.getElementById('quest-add-form');
            if (qForm) qForm.style.display = qForm.style.display === 'none' ? 'block' : 'none';
            return;
        }
        if (target.matches('[data-action="save-quest"]')) {
            var qTitleEl = document.getElementById('quest-title');
            if (!qTitleEl || !qTitleEl.value.trim()) return;
            var qData = getQuestData();
            qData.active.push({
                title: qTitleEl.value.trim(),
                desc: (document.getElementById('quest-desc') || {}).value || '',
                giver: (document.getElementById('quest-giver') || {}).value || '',
                reward: (document.getElementById('quest-reward') || {}).value || '',
                tags: (document.getElementById('quest-tags') || {}).value || '',
                id: 'q' + Date.now()
            });
            localStorage.setItem('dw_quests', JSON.stringify(qData));
            if (typeof syncUpload === 'function') syncUpload('dw_quests');
            renderApp();
            return;
        }
        if (target.matches('[data-action="cancel-quest"]')) {
            var qForm = document.getElementById('quest-add-form');
            if (qForm) qForm.style.display = 'none';
            return;
        }
        var completeBtn = target.matches('[data-action="complete-quest"]') ? target : target.closest('[data-action="complete-quest"]');
        if (completeBtn) {
            var qIdx = parseInt(completeBtn.dataset.questIdx);
            var qData = getQuestData();
            if (qData.active[qIdx]) {
                qData.completed.push(qData.active[qIdx]);
                qData.active.splice(qIdx, 1);
                localStorage.setItem('dw_quests', JSON.stringify(qData));
                if (typeof syncUpload === 'function') syncUpload('dw_quests');
                renderApp();
            }
            return;
        }
        var deleteBtn = target.matches('[data-action="delete-quest"]') ? target : target.closest('[data-action="delete-quest"]');
        if (deleteBtn) {
            var qIdx = parseInt(deleteBtn.dataset.questIdx);
            var qData = getQuestData();
            qData.active.splice(qIdx, 1);
            localStorage.setItem('dw_quests', JSON.stringify(qData));
            if (typeof syncUpload === 'function') syncUpload('dw_quests');
            renderApp();
            return;
        }

        // --- Dashboard: campaign name & banner ---
        if (target.matches('[data-action="edit-campaign-name"]')) {
            var dd = getDashboardData();
            var newName = prompt('Campaign name:', dd.campaignName || '');
            if (newName !== null && newName.trim()) {
                dd.campaignName = newName.trim();
                saveDashboardData(dd);
                renderApp();
            }
            return;
        }

        // --- Timeline: chapter & event handlers ---
        // Select chapter (but not if clicking the edit button inside it)
        if (!target.matches('[data-action="edit-chapter"]') && (target.matches('[data-action="select-chapter"]') || target.closest('[data-action="select-chapter"]'))) {
            var btn = target.closest('[data-action="select-chapter"]') || target;
            activeChapter = parseInt(btn.dataset.chapter) || 0;
            renderApp();
            return;
        }

        // Add chapter
        if (target.matches('[data-action="add-chapter"]')) {
            var chName = prompt(t('timeline.chaptername'));
            if (chName && chName.trim()) {
                var tlData = getTimelineData();
                tlData.chapters.push({ id: 'ch' + Date.now(), name: chName.trim(), events: [] });
                saveTimelineData(tlData);
                activeChapter = tlData.chapters.length - 1;
                renderApp();
            }
            return;
        }

        // Add event (show form)
        if (target.matches('[data-action="add-event"]')) {
            var form = document.getElementById('event-add-form');
            if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
            return;
        }

        // Edit event (inline in the event box)
        if (target.matches('[data-action="edit-event"]')) {
            var evIdx = parseInt(target.dataset.event);
            var tlData = getTimelineData();
            var ch = tlData.chapters[activeChapter];
            if (ch && ch.events[evIdx]) {
                var ev = ch.events[evIdx];
                var eventEl = target.closest('.timeline-event');
                if (eventEl) {
                    var contentEl = eventEl.querySelector('.timeline-content');
                    if (contentEl) {
                        contentEl.innerHTML = renderEventForm(evIdx, ev);
                    }
                }
            }
            return;
        }

        // Pick event layout (in form)
        if (target.matches('[data-action="pick-event-layout"]') || target.closest('[data-action="pick-event-layout"]')) {
            var btn = target.matches('[data-action="pick-event-layout"]') ? target : target.closest('[data-action="pick-event-layout"]');
            var layout = btn.dataset.layout;
            var eIdx = parseInt(btn.dataset.eventIdx);
            // Update active state
            var allOpts = btn.parentElement.querySelectorAll('.event-layout-option');
            for (var oi = 0; oi < allOpts.length; oi++) allOpts[oi].classList.remove('active');
            btn.classList.add('active');
            // Show/hide image section
            var imgSection = btn.closest('.timeline-content, .timeline-add-form');
            if (imgSection) {
                var evImgSec = imgSection.querySelector('.event-image-section');
                if (evImgSec) evImgSec.style.display = layout === 'text' ? 'none' : 'block';
            }
            // If editing existing event, save layout immediately
            if (eIdx >= 0) {
                var tlData = getTimelineData();
                var ch = tlData.chapters[activeChapter];
                if (ch && ch.events[eIdx]) {
                    ch.events[eIdx].layout = layout;
                    saveTimelineData(tlData);
                }
            }
            return;
        }

        // Remove event image
        if (target.matches('[data-action="remove-event-image"]')) {
            var eIdx = parseInt(target.dataset.eventIdx);
            if (eIdx >= 0) {
                var tlData = getTimelineData();
                var ch = tlData.chapters[activeChapter];
                if (ch && ch.events[eIdx]) {
                    ch.events[eIdx].image = null;
                    saveTimelineData(tlData);
                    renderApp();
                }
            }
            return;
        }

        // Edit chapter name
        if (target.matches('[data-action="edit-chapter"]')) {
            var chIdx = parseInt(target.dataset.chapter);
            var tlData = getTimelineData();
            if (tlData.chapters[chIdx]) {
                var newName = prompt(t('timeline.newchaptername'), tlData.chapters[chIdx].name);
                if (newName && newName.trim()) {
                    tlData.chapters[chIdx].name = newName.trim();
                    saveTimelineData(tlData);
                    renderApp();
                }
            }
            return;
        }

        // Save event (supports inline edit + new event form)
        if (target.matches('[data-action="save-event"]')) {
            var editIdx = target.dataset.editIdx;
            var isEdit = editIdx !== undefined && editIdx !== '';
            var prefix = isEdit ? 'edit-' : '';

            // Find form fields — search in closest container first, then document
            var container = target.closest('.timeline-content') || target.closest('.timeline-add-form') || document;
            var titleEl = container.querySelector('#' + prefix + 'ev-title') || document.getElementById(prefix + 'ev-title');
            var descEl = container.querySelector('#' + prefix + 'ev-desc') || document.getElementById(prefix + 'ev-desc');
            var sessionEl = container.querySelector('#' + prefix + 'ev-session') || document.getElementById(prefix + 'ev-session');
            var typeEl = container.querySelector('#' + prefix + 'ev-type') || document.getElementById(prefix + 'ev-type');
            var layoutBtn = container.querySelector('.event-layout-option.active');

            if (titleEl && titleEl.value.trim()) {
                var tlData = getTimelineData();
                var layout = layoutBtn ? layoutBtn.dataset.layout : 'text';

                if (isEdit) {
                    var idx = parseInt(editIdx);
                    var ch = tlData.chapters[activeChapter];
                    if (ch && ch.events[idx]) {
                        ch.events[idx].title = titleEl.value.trim();
                        ch.events[idx].desc = descEl ? descEl.value.trim() : '';
                        ch.events[idx].session = sessionEl ? sessionEl.value.trim() : '';
                        ch.events[idx].type = typeEl ? typeEl.value : 'quest';
                        ch.events[idx].layout = layout;
                    }
                } else {
                    if (tlData.chapters[activeChapter]) {
                        tlData.chapters[activeChapter].events.push({
                            id: 'ev' + Date.now(),
                            title: titleEl.value.trim(),
                            desc: descEl ? descEl.value.trim() : '',
                            session: sessionEl ? sessionEl.value.trim() : '',
                            type: typeEl ? typeEl.value : 'quest',
                            layout: layout,
                            image: null
                        });
                    }
                }
                saveTimelineData(tlData);
                renderApp();
            }
            return;
        }

        // Cancel event
        if (target.matches('[data-action="cancel-event"]')) {
            var form = document.getElementById('event-add-form');
            if (form) form.style.display = 'none';
            return;
        }

        // Delete event
        if (target.matches('[data-action="delete-event"]')) {
            var evIdx = parseInt(target.dataset.event);
            var tlData = getTimelineData();
            if (tlData.chapters[activeChapter] && !isNaN(evIdx)) {
                tlData.chapters[activeChapter].events.splice(evIdx, 1);
                saveTimelineData(tlData);
                renderApp();
            }
            return;
        }

        // --- Maps: dimension, map, pin handlers ---
        // Dimension selection
        if (target.matches('[data-action="select-dimension"]')) {
            activeDimension = parseInt(target.dataset.dim) || 0;
            activeMapId = null;
            mapZoom = 1; mapPanX = 0; mapPanY = 0;
            renderApp();
            return;
        }

        // Add dimension
        if (target.matches('[data-action="add-dimension"]')) {
            var dimName = prompt(t('maps.dimname'));
            if (dimName && dimName.trim()) {
                var mData = getMapsData();
                mData.dimensions.push({ id: 'dim' + Date.now(), name: dimName.trim(), maps: [{ id: 'map' + Date.now(), name: t('maps.mainmap'), image: null, isRoot: true, pins: [] }] });
                saveMapsData(mData);
                activeDimension = mData.dimensions.length - 1;
                renderApp();
            }
            return;
        }

        // Open map
        if (target.matches('[data-action="open-map"]') || target.closest('[data-action="open-map"]')) {
            var card = target.closest('[data-action="open-map"]') || target;
            activeMapId = card.dataset.mapId;
            mapZoom = 1; mapPanX = 0; mapPanY = 0;
            renderApp();
            return;
        }

        // Map back to grid
        if (target.matches('[data-action="map-back"]')) {
            activeMapId = null;
            addingPin = false;
            window._mapHistory = [];
            renderApp();
            return;
        }

        // Map go back to previous map in history
        if (target.matches('[data-action="map-go-back"]')) {
            if (window._mapHistory && window._mapHistory.length > 0) {
                var prev = window._mapHistory.pop();
                activeDimension = prev.dim;
                activeMapId = prev.mapId;
                mapZoom = 1; mapPanX = 0; mapPanY = 0;
                renderApp();
            }
            return;
        }

        // Add map
        if (target.matches('[data-action="add-map"]') || target.closest('[data-action="add-map"]')) {
            var mapName = prompt(t('maps.mapname'));
            if (mapName && mapName.trim()) {
                var mData = getMapsData();
                var mDim = mData.dimensions[activeDimension];
                if (mDim) {
                    mDim.maps.push({ id: 'map' + Date.now(), name: mapName.trim(), image: null, isRoot: false, pins: [] });
                    saveMapsData(mData);
                    renderApp();
                }
            }
            return;
        }

        // Set map category
        if (target.matches('[data-action="set-map-category"]')) {
            e.stopPropagation();
            var catMapId = target.dataset.mapId;
            var mData = getMapsData();
            var mDim = mData.dimensions[activeDimension];
            if (mDim) {
                for (var mi = 0; mi < mDim.maps.length; mi++) {
                    if (mDim.maps[mi].id === catMapId) {
                        var curCat = mDim.maps[mi].category || '';
                        var newCat = prompt('Map category (empty to remove):', curCat);
                        if (newCat !== null) {
                            mDim.maps[mi].category = newCat.trim();
                            saveMapsData(mData);
                            renderApp();
                        }
                        break;
                    }
                }
            }
            return;
        }

        // Delete map
        if (target.matches('[data-action="delete-map"]')) {
            e.stopPropagation();
            var delMapId = target.dataset.mapId;
            if (confirm(t('maps.deletemap'))) {
                var mData = getMapsData();
                var mDim = mData.dimensions[activeDimension];
                if (mDim) {
                    mDim.maps = mDim.maps.filter(function(m) { return m.id !== delMapId; });
                    saveMapsData(mData);
                    renderApp();
                }
            }
            return;
        }

        // Goto linked map (pin click) — supports cross-dimension
        if (target.matches('[data-action="goto-map"]') || target.closest('[data-action="goto-map"]')) {
            var gotoEl = target.closest('[data-action="goto-map"]') || target;
            var targetDim = gotoEl.dataset.targetDim;
            if (targetDim !== undefined && targetDim !== null) {
                activeDimension = parseInt(targetDim, 10);
            }
            // Save history for back navigation
            if (!window._mapHistory) window._mapHistory = [];
            window._mapHistory.push({ mapId: activeMapId, dim: activeDimension });
            activeMapId = gotoEl.dataset.target;
            mapZoom = 1; mapPanX = 0; mapPanY = 0;
            renderApp();
            return;
        }

        // Zoom controls
        if (target.matches('[data-action="zoom-in"]')) { mapZoom = Math.min(mapZoom * 1.3, 5); renderApp(); return; }
        if (target.matches('[data-action="zoom-out"]')) { mapZoom = Math.max(mapZoom / 1.3, 0.3); renderApp(); return; }
        if (target.matches('[data-action="zoom-reset"]')) { mapZoom = 1; mapPanX = 0; mapPanY = 0; renderApp(); return; }

        // Add pin mode
        if (target.matches('[data-action="add-pin"]')) {
            addingPin = true;
            renderApp();
            return;
        }

        if (target.matches('[data-action="cancel-add-pin"]')) {
            addingPin = false;
            renderApp();
            return;
        }

        // Click on map to place pin (when in addingPin mode)
        if (addingPin && (target.matches('.map-image') || target.matches('.map-canvas') || target.closest('.map-canvas'))) {
            var viewer = document.getElementById('map-viewer');
            var canvas = document.getElementById('map-canvas');
            if (viewer && canvas) {
                var rect = canvas.getBoundingClientRect();
                var pinX = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
                var pinY = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

                // Show pin creation modal
                var mData = getMapsData();
                var allDims = mData.dimensions || [];
                var modalHtml = '<div class="modal-overlay" id="pin-modal">';
                modalHtml += '<div class="modal-box" style="max-width:400px;">';
                modalHtml += '<h3>&#128205; ' + t('maps.addpin.title') + '</h3>';
                modalHtml += '<div style="display:flex;flex-direction:column;gap:0.75rem;margin-top:1rem;">';
                modalHtml += '<input type="text" class="edit-input" id="pin-label-input" placeholder="' + t('maps.addpin.label') + '" autofocus>';
                modalHtml += '<label style="font-size:0.8rem;color:var(--text-dim);">' + t('maps.addpin.link') + '</label>';
                modalHtml += '<select class="edit-input" id="pin-link-select" style="padding:0.5rem;">';
                modalHtml += '<option value="">' + t('maps.addpin.nolink') + '</option>';
                for (var pdi = 0; pdi < allDims.length; pdi++) {
                    var pdMaps = allDims[pdi].maps || [];
                    for (var pdmi = 0; pdmi < pdMaps.length; pdmi++) {
                        if (pdMaps[pdmi].id === activeMapId) continue;
                        var dimLabel = allDims.length > 1 ? ' (' + allDims[pdi].name + ')' : '';
                        modalHtml += '<option value="' + pdMaps[pdmi].id + '">' + escapeHtml(pdMaps[pdmi].name) + dimLabel + '</option>';
                    }
                }
                modalHtml += '</select>';
                modalHtml += '</div>';
                modalHtml += '<div class="modal-actions" style="margin-top:1rem;">';
                modalHtml += '<button class="btn btn-primary" data-modal-action="save-pin">' + t('generic.save') + '</button>';
                modalHtml += '<button class="btn btn-ghost" data-modal-action="cancel-pin">' + t('generic.cancel') + '</button>';
                modalHtml += '</div>';
                modalHtml += '</div></div>';

                document.body.insertAdjacentHTML('beforeend', modalHtml);
                if (typeof lockBodyScroll === 'function') lockBodyScroll();
                var pinLabelInput = document.getElementById('pin-label-input');
                if (pinLabelInput) pinLabelInput.focus();

                var pinModal = document.getElementById('pin-modal');
                pinModal.addEventListener('click', function(me) {
                    var action = me.target.dataset.modalAction;
                    if (me.target === pinModal) action = 'cancel-pin';
                    if (!action) return;

                    if (action === 'save-pin') {
                        var labelEl = document.getElementById('pin-label-input');
                        var linkEl = document.getElementById('pin-link-select');
                        var label = labelEl ? labelEl.value.trim() : '';
                        if (!label) { labelEl.style.borderColor = 'var(--danger)'; return; }

                        var targetMapId = linkEl ? linkEl.value : null;
                        var mData2 = getMapsData();
                        var mDim2 = mData2.dimensions[activeDimension];
                        for (var cmi2 = 0; cmi2 < mDim2.maps.length; cmi2++) {
                            if (mDim2.maps[cmi2].id === activeMapId) {
                                mDim2.maps[cmi2].pins.push({
                                    id: 'pin' + Date.now(),
                                    x: pinX,
                                    y: pinY,
                                    label: label,
                                    targetMap: targetMapId || null
                                });
                                break;
                            }
                        }
                        saveMapsData(mData2);
                    }

                    pinModal.remove();
                    if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
                    addingPin = false;
                    renderApp();
                });
            }
            return;
        }

        // Delete pin
        if (target.matches('[data-action="delete-pin"]')) {
            e.stopPropagation();
            var delPinIdx = parseInt(target.dataset.pinIdx);
            var mData = getMapsData();
            var mDim = mData.dimensions[activeDimension];
            for (var dmi = 0; dmi < mDim.maps.length; dmi++) {
                if (mDim.maps[dmi].id === activeMapId) {
                    mDim.maps[dmi].pins.splice(delPinIdx, 1);
                    saveMapsData(mData);
                    renderApp();
                    break;
                }
            }
            return;
        }

        // --- Lore handlers ---
        // Save lore article
        if (target.matches('[data-action="save-lore"]')) {
            var lTitleEl = document.getElementById('lore-title');
            var lContentEl = document.getElementById('lore-content');
            if (lTitleEl && lTitleEl.value.trim()) {
                var loreData = getLoreData();
                var editId = target.dataset.editId;
                if (editId) {
                    for (var li = 0; li < loreData.articles.length; li++) {
                        if (loreData.articles[li].id === editId) {
                            loreData.articles[li].title = lTitleEl.value.trim();
                            loreData.articles[li].content = lContentEl ? lContentEl.value : '';
                            break;
                        }
                    }
                } else {
                    loreData.articles.push({
                        id: 'art' + Date.now(),
                        title: lTitleEl.value.trim(),
                        content: lContentEl ? lContentEl.value : '',
                        createdBy: currentUserId()
                    });
                }
                saveLoreData(loreData);
                navigate('/lore');
            }
            return;
        }

        // Delete lore article
        if (target.matches('[data-action="delete-lore"]')) {
            var artId = target.dataset.articleId;
            if (artId && confirm(t('lore.deletearticle'))) {
                var loreData = getLoreData();
                loreData.articles = loreData.articles.filter(function(a) { return a.id !== artId; });
                saveLoreData(loreData);
                navigate('/lore');
            }
            return;
        }
    };

    // ---- Change delegation ----
    app.onchange = function(e) {
        var target = e.target;

        // Set concentration via select
        if (target.matches('[data-action="set-concentration"]')) {
            if (!charId || !canEdit(charId)) return;
            var concState = loadCharState(charId);
            concState.concentrating = target.value || null;
            saveCharState(charId, concState);
            renderApp();
            return;
        }

        // Family source picker — auto-fill name from selected character/NPC
        if (target.matches('#fam-source')) {
            var nameEl = document.getElementById('fam-name');
            if (!nameEl) return;
            var val = target.value;
            if (val.indexOf('char:') === 0) {
                var cid = val.substring(5);
                var cfg = loadCharConfig(cid);
                if (cfg) nameEl.value = cfg.name;
            } else if (val.indexOf('npc:') === 0) {
                var nIdx = parseInt(val.substring(4));
                var nList = getNPCData().npcs || [];
                if (nList[nIdx]) nameEl.value = nList[nIdx].name;
            } else {
                nameEl.value = '';
            }
            return;
        }

        // Show custom NPC name when "custom" selected in initiative
        if (target.matches('#init-char')) {
            var customField = document.getElementById('init-custom-name');
            if (customField) customField.style.display = target.value === 'custom' ? 'block' : 'none';
            return;
        }

        // Import character file
        if (target.matches('[data-action="import-char"]')) {
            if (!charId || !canEdit(charId)) return;
            var file = target.files && target.files[0];
            if (file) {
                importCharacter(charId, file, function(imported) {
                    var cfgLocal = loadCharConfig(charId);
                    var defaults = {
                        level: 1, skills: [], expertise: [], cantrips: [], prepared: [],
                        metamagic: [], asiChoices: {}, favorites: [],
                        items: (cfgLocal.defaultItems || []).map(function(itm) { return Object.assign({}, itm); }),
                        customAbilities: null, currentHP: null, tempHP: 0,
                        deathSaves: { successes: 0, failures: 0 }, conditions: [],
                        spellSlotsUsed: {}, hitDiceUsed: 0, inspiration: false,
                        gold: 0, notes: ''
                    };
                    var newState = {};
                    var dkeys = Object.keys(defaults);
                    for (var dk = 0; dk < dkeys.length; dk++) {
                        newState[dkeys[dk]] = imported[dkeys[dk]] !== undefined ? imported[dkeys[dk]] : defaults[dkeys[dk]];
                    }
                    saveCharState(charId, newState);
                    spellFilter = 'all';
                    abilityEditMode = false;
                    editAbilities = null;
                    renderApp();
                });
            }
            target.value = '';
            return;
        }

        // Banner upload
        if (target.matches('[data-action="upload-banner"]')) {
            if (charId && canEdit(charId) && target.files && target.files[0]) {
                handleImageUpload(target.files[0], charId, 'banner');
            }
            return;
        }

        // Portrait upload
        if (target.matches('[data-action="upload-portrait"]')) {
            if (charId && canEdit(charId) && target.files && target.files[0]) {
                handleImageUpload(target.files[0], charId, 'portrait');
            }
            return;
        }

        // Appearance upload
        if (target.matches('[data-action="upload-appearance"]')) {
            if (charId && canEdit(charId) && target.files && target.files[0]) {
                handleImageUpload(target.files[0], charId, 'appearance');
            }
            return;
        }

        // Dashboard banner upload
        if (target.matches('[data-action="upload-dash-banner"]')) {
            if (isDM() && target.files && target.files[0]) {
                var dbReader = new FileReader();
                dbReader.onload = function(ev) {
                    var img = new Image();
                    img.onload = function() {
                        var cvs = document.createElement('canvas');
                        var maxW = 1400;
                        var scale = Math.min(1, maxW / img.width);
                        cvs.width = img.width * scale;
                        cvs.height = img.height * scale;
                        cvs.getContext('2d').drawImage(img, 0, 0, cvs.width, cvs.height);
                        var dd = getDashboardData();
                        dd.bannerImage = cvs.toDataURL('image/jpeg', 0.8);
                        saveDashboardData(dd);
                        renderApp();
                    };
                    img.src = ev.target.result;
                };
                dbReader.readAsDataURL(target.files[0]);
            }
            return;
        }

        // Timeline event image upload
        if (target.matches('[data-action="upload-event-image"]')) {
            var evIdx = parseInt(target.dataset.eventIdx);
            if (isDM() && target.files && target.files[0] && !isNaN(evIdx)) {
                var evReader = new FileReader();
                evReader.onload = function(ev) {
                    var img = new Image();
                    img.onload = function() {
                        var cvs = document.createElement('canvas');
                        var maxW = 1200;
                        var scale = Math.min(1, maxW / img.width);
                        cvs.width = img.width * scale;
                        cvs.height = img.height * scale;
                        cvs.getContext('2d').drawImage(img, 0, 0, cvs.width, cvs.height);
                        var tlData = getTimelineData();
                        var ch = tlData.chapters[activeChapter];
                        if (ch && ch.events[evIdx]) {
                            ch.events[evIdx].image = cvs.toDataURL('image/jpeg', 0.8);
                            saveTimelineData(tlData);
                            renderApp();
                        }
                    };
                    img.src = ev.target.result;
                };
                evReader.readAsDataURL(target.files[0]);
            }
            return;
        }

        // Map image upload (new maps system)
        if (target.matches('[data-action="update-map-image"]')) {
            var mapFile = target.files && target.files[0];
            var mapId = target.dataset.mapId;
            if (mapFile && mapId) {
                var mapReader = new FileReader();
                mapReader.onload = function(ev) {
                    var img = new Image();
                    img.onload = function() {
                        var cvs = document.createElement('canvas');
                        var maxSize = 1200;
                        var w = img.width, h = img.height;
                        if (w > maxSize || h > maxSize) {
                            if (w > h) { h = h * (maxSize / w); w = maxSize; }
                            else { w = w * (maxSize / h); h = maxSize; }
                        }
                        cvs.width = w;
                        cvs.height = h;
                        cvs.getContext('2d').drawImage(img, 0, 0, w, h);
                        var base64 = cvs.toDataURL('image/jpeg', 0.7);

                        var mData = getMapsData();
                        var mDim = mData.dimensions[activeDimension];
                        for (var mi = 0; mi < mDim.maps.length; mi++) {
                            if (mDim.maps[mi].id === mapId) {
                                mDim.maps[mi].image = base64;
                                break;
                            }
                        }
                        try {
                            saveMapsData(mData);
                        } catch (err) {
                            showWarning(t('maps.imagetoolarge'));
                        }
                        renderApp();
                    };
                    img.src = ev.target.result;
                };
                mapReader.readAsDataURL(mapFile);
            }
            target.value = '';
            return;
        }

        // Note image upload
        if (e.target.matches('[data-action="upload-note-image"]')) {
            var noteFile = e.target.files && e.target.files[0];
            if (noteFile) {
                var noteReader = new FileReader();
                noteReader.onload = function(ev) {
                    var nimg = new Image();
                    nimg.onload = function() {
                        var canvas = document.createElement('canvas');
                        var nmax = 800;
                        var nw = nimg.width, nh = nimg.height;
                        if (nw > nmax || nh > nmax) { if (nw > nh) { nh = nh * (nmax / nw); nw = nmax; } else { nw = nw * (nmax / nh); nh = nmax; } }
                        canvas.width = nw; canvas.height = nh;
                        canvas.getContext('2d').drawImage(nimg, 0, 0, nw, nh);
                        var noteBase64 = canvas.toDataURL('image/jpeg', 0.7);
                        var noteSection = document.querySelector('.note-image-section');
                        if (noteSection) {
                            noteSection.innerHTML = '<div class="note-image-preview"><img src="' + noteBase64 + '" alt=""><button class="btn btn-ghost btn-sm" data-action="remove-note-image">' + t('generic.delete') + '</button></div>';
                        }
                    };
                    nimg.src = ev.target.result;
                };
                noteReader.readAsDataURL(noteFile);
            }
            e.target.value = '';
            return;
        }

        // Gallery multi-image upload
        if (e.target.matches('[data-action="upload-gallery-image"]')) {
            var galleryFiles = e.target.files;
            if (galleryFiles && galleryFiles.length > 0) {
                for (var gfi = 0; gfi < galleryFiles.length; gfi++) {
                    (function(file) {
                        var gr = new FileReader();
                        gr.onload = function(ev) {
                            var gimg = new Image();
                            gimg.onload = function() {
                                var gc = document.createElement('canvas');
                                var gmax = 800;
                                var gw = gimg.width, gh = gimg.height;
                                if (gw > gmax || gh > gmax) { if (gw > gh) { gh = gh * (gmax / gw); gw = gmax; } else { gw = gw * (gmax / gh); gh = gmax; } }
                                gc.width = gw; gc.height = gh;
                                gc.getContext('2d').drawImage(gimg, 0, 0, gw, gh);
                                var gBase64 = gc.toDataURL('image/jpeg', 0.7);
                                var grid = document.getElementById('note-gallery-grid');
                                if (grid) {
                                    var addBtn = grid.querySelector('.note-gallery-add');
                                    var idx = grid.querySelectorAll('.note-gallery-thumb').length;
                                    var thumbHtml = '<div class="note-gallery-thumb" data-gallery-idx="' + idx + '"><img src="' + gBase64 + '" alt=""><button class="note-gallery-remove" data-action="remove-gallery-image" data-idx="' + idx + '">&times;</button></div>';
                                    if (addBtn) addBtn.insertAdjacentHTML('beforebegin', thumbHtml);
                                }
                            };
                            gimg.src = ev.target.result;
                        };
                        gr.readAsDataURL(file);
                    })(galleryFiles[gfi]);
                }
            }
            e.target.value = '';
            return;
        }
    };

    // ---- Input delegation ----
    app.oninput = function(e) {
        var target = e.target;

        // Auto-fill weight from datalist
        if (target.matches('.item-name-input')) {
            var val = target.value.trim();
            if (typeof DATA !== 'undefined' && DATA.items) {
                var cats = Object.keys(DATA.items);
                for (var ci = 0; ci < cats.length; ci++) {
                    var catItems = DATA.items[cats[ci]];
                    if (Array.isArray(catItems)) {
                        for (var di = 0; di < catItems.length; di++) {
                            var ditem = catItems[di];
                            var iName = typeof ditem === 'string' ? ditem : ditem.name;
                            var iWeight = typeof ditem === 'object' ? ditem.weight : undefined;
                            if (iName === val && iWeight !== undefined) {
                                var wInput = app.querySelector('.item-weight-input');
                                if (wInput) wInput.value = iWeight;
                                return;
                            }
                        }
                    }
                }
            }
        }

        // Gold input
        if (target.matches('[data-action="update-gold"]')) {
            if (charId && canEdit(charId)) {
                var goldState = loadCharState(charId);
                goldState.gold = parseInt(target.value) || 0;
                saveCharState(charId, goldState);
            }
        }

        // Secret gold input
        if (target.matches('[data-action="update-secret-gold"]')) {
            if (charId && canEdit(charId)) {
                var goldState = loadCharState(charId);
                goldState.secretGold = parseInt(target.value) || 0;
                saveCharState(charId, goldState);
            }
        }

        // Notes search
        if (target.matches('[data-action="search-notes"]') || target.matches('.notes-search-input')) {
            notesSearch = target.value;
            clearTimeout(target._searchTimeout);
            target._searchTimeout = setTimeout(function() { renderApp(); }, 300);
        }

        // Session number (DM) - no longer uses input
    };

    // ---- Keydown for login Enter key ----
    app.onkeydown = function(e) {
        if (e.key === 'Enter' && e.target.matches('.login-input')) {
            var submitBtn = document.querySelector('[data-action="login-submit"]');
            if (submitBtn) submitBtn.click();
        }
    };

    // ---- Tooltip events (on document for broader coverage) ----
    document.onmouseover = function(e) {
        var target = e.target;

        // Ability score tooltip
        if (!abilityEditMode && charId && config && state) {
            var abilityEl = target.closest('.ability[data-ability]');
            if (abilityEl) {
                var ab = abilityEl.dataset.ability;
                if (ab) {
                    showAbilityTooltip(ab, config, state, abilityEl);
                    return;
                }
            }
        }

        // Spell tooltip
        var spellBtn = target.closest('.spell-toggle');
        if (spellBtn && !target.matches('[data-spell-star]') && !target.closest('[data-spell-star]')) {
            var spName = spellBtn.dataset.spell;
            if (spName) {
                showSpellTooltip(spName, spellBtn);
                return;
            }
        }

        // Condition tag tooltip
        var condTag = target.closest('.condition-tag[data-tip]');
        if (condTag) {
            showTooltipPopup('<div>' + escapeHtml(condTag.dataset.tip) + '</div>', condTag);
            return;
        }

        // Prepared spell tooltip (combat tab)
        var prepSpell = target.closest('.prepared-spell-tag[data-spell]');
        if (prepSpell) {
            showSpellTooltip(prepSpell.dataset.spell, prepSpell);
            return;
        }

        // Info item tooltip
        var infoItem = target.closest('.info-item');
        if (infoItem) {
            var valueEl = infoItem.querySelector('.value');
            if (valueEl) {
                var tipValue = valueEl.textContent.trim();
                showInfoTooltip(tipValue, infoItem);
                return;
            }
        }
    };

    document.onmouseout = function(e) {
        var target = e.target;
        var abilityEl = target.closest('.ability[data-ability]');
        var spellBtn = target.closest('.spell-toggle');
        var infoItem = target.closest('.info-item');
        var condTag = target.closest('.condition-tag[data-tip]');
        var prepSpell = target.closest('.prepared-spell-tag[data-spell]');
        if (abilityEl || spellBtn || infoItem || condTag || prepSpell) {
            var related = e.relatedTarget;
            if (abilityEl && abilityEl.contains(related)) return;
            if (spellBtn && spellBtn.contains(related)) return;
            if (infoItem && infoItem.contains(related)) return;
            if (condTag && condTag.contains(related)) return;
            if (prepSpell && prepSpell.contains(related)) return;
            removeTooltipPopup();
        }
    };
}

// ============================================================
// Section 31: Mobile Touch Support
// ============================================================

var isTouchDevice = false;

function detectTouch() {
    isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (window.matchMedia('(pointer: coarse)').matches);
}

function lockBodyScroll() {
    var scrollY = window.scrollY;
    document.body.classList.add('modal-open');
    document.body.dataset.scrollY = scrollY;
    document.body.style.top = '-' + scrollY + 'px';
}

function unlockBodyScroll() {
    document.body.classList.remove('modal-open');
    var scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
}

function initMobileSupport() {
    detectTouch();

    if (!isTouchDevice) return;

    // -- Tap-to-dismiss tooltips: tap anywhere outside closes tooltip --
    document.addEventListener('touchstart', function(e) {
        var tooltip = document.querySelector('.tooltip-popup');
        if (tooltip && !tooltip.contains(e.target)) {
            removeTooltipPopup();
        }
    }, { passive: true });

    // -- Close mobile nav on outside tap --
    document.addEventListener('touchstart', function(e) {
        var navLinks = document.querySelector('.nav-links.open');
        if (!navLinks) return;
        var navToggle = e.target.closest('[data-action="toggle-nav"]');
        if (!navToggle && !navLinks.contains(e.target)) {
            navLinks.classList.remove('open');
        }
    }, { passive: true });
}

// Patch tooltip events: on touch devices use tap instead of hover
var origInitEvents = (typeof initEvents === 'function') ? initEvents : null;

function patchTooltipEvents() {
    if (!isTouchDevice) return;

    // Override mouseover/mouseout — they still fire on touch but unreliably
    // Add touchstart-based tooltip triggers on #app
    var appEl = document.getElementById('app');
    if (!appEl) return;

    appEl.addEventListener('touchstart', function(e) {
        var target = e.target;

        // Ability score tooltip (tap)
        if (typeof abilityEditMode !== 'undefined' && !abilityEditMode && typeof charId !== 'undefined' && charId && typeof config !== 'undefined' && config && typeof state !== 'undefined' && state) {
            var abilityEl = target.closest('.ability[data-ability]');
            if (abilityEl) {
                var ab = abilityEl.dataset.ability;
                if (ab) {
                    e.preventDefault();
                    showAbilityTooltip(ab, config, state, abilityEl);
                    return;
                }
            }
        }

        // Spell tooltip (tap)
        var spellBtn = target.closest('.spell-toggle');
        if (spellBtn && !target.matches('[data-spell-star]') && !target.closest('[data-spell-star]')) {
            var spName = spellBtn.dataset.spell;
            if (spName) {
                e.preventDefault();
                showSpellTooltip(spName, spellBtn);
                return;
            }
        }

        // Info item tooltip (tap)
        var infoItem = target.closest('.info-item');
        if (infoItem) {
            var valueEl = infoItem.querySelector('.value');
            if (valueEl) {
                var tipValue = valueEl.textContent.trim();
                e.preventDefault();
                showInfoTooltip(tipValue, infoItem);
                return;
            }
        }
    }, { passive: false });
}

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
    html += '<label class="login-label">Nieuw wachtwoord</label>';
    html += '<input type="password" class="login-input" id="profile-new-password" placeholder="Laat leeg om niet te wijzigen">';
    html += '</div>';
    html += '<div class="login-field">';
    html += '<label class="login-label">Bevestig wachtwoord</label>';
    html += '<input type="password" class="login-input" id="profile-confirm-password" placeholder="Bevestig nieuw wachtwoord">';
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
    var passEl = document.getElementById('profile-new-password');
    var confirmEl = document.getElementById('profile-confirm-password');
    var errorEl = document.getElementById('profile-error');
    var successEl = document.getElementById('profile-success');

    var newName = nameEl ? nameEl.value.trim() : '';
    var newPass = passEl ? passEl.value : '';
    var confirmPass = confirmEl ? confirmEl.value : '';

    if (errorEl) { errorEl.style.display = 'none'; }
    if (successEl) { successEl.style.display = 'none'; }

    if (!newName) {
        if (errorEl) { errorEl.textContent = 'Weergavenaam mag niet leeg zijn.'; errorEl.style.display = 'block'; }
        return;
    }

    if (newPass && newPass !== confirmPass) {
        if (errorEl) { errorEl.textContent = 'Wachtwoorden komen niet overeen.'; errorEl.style.display = 'block'; }
        return;
    }

    // Update the user data
    if (!usersCache) usersCache = {};
    if (!usersCache[uid]) usersCache[uid] = JSON.parse(JSON.stringify(u));

    usersCache[uid].name = newName;
    if (newPass) usersCache[uid].password = newPass;

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

    var html = '<div class="modal-overlay wizard-overlay" data-action="close-wizard">';
    html += '<div class="wizard-modal" onclick="event.stopPropagation();">';

    // Header with progress
    html += '<div class="wizard-header">';
    html += '<h2 class="wizard-title">Nieuw Character</h2>';
    html += '<button class="modal-close" data-action="close-wizard">&times;</button>';
    html += '</div>';

    // Step indicator
    html += '<div class="wizard-steps">';
    var stepLabels = ['Basis', 'Achtergrond', 'Details', 'Vaardigheden', 'Verhaal', 'Overzicht'];
    for (var si = 1; si <= totalSteps; si++) {
        var stepClass = 'wizard-step-dot';
        if (si < step) stepClass += ' completed';
        if (si === step) stepClass += ' active';
        html += '<div class="' + stepClass + '"><span class="step-num">' + (si < step ? '&#10003;' : si) + '</span><span class="step-label">' + stepLabels[si - 1] + '</span></div>';
        if (si < totalSteps) html += '<div class="step-connector' + (si < step ? ' completed' : '') + '"></div>';
    }
    html += '</div>';

    // Step content
    html += '<div class="wizard-content">';

    if (step === 1) html += renderWizardStep1();
    else if (step === 2) html += renderWizardStep2();
    else if (step === 3) html += renderWizardStep3();
    else if (step === 4) html += renderWizardStep4();
    else if (step === 5) html += renderWizardStep5();
    else if (step === 6) html += renderWizardStep6();

    html += '</div>';

    // Navigation buttons
    html += '<div class="wizard-nav">';
    if (step > 1) {
        html += '<button class="btn btn-ghost" data-action="wizard-prev">&larr; Vorige</button>';
    } else {
        html += '<div></div>';
    }
    if (step < totalSteps) {
        html += '<button class="btn btn-primary" data-action="wizard-next">Volgende &rarr;</button>';
    } else {
        html += '<button class="btn btn-primary" data-action="wizard-create">Character Aanmaken</button>';
    }
    html += '</div>';

    html += '</div>';
    html += '</div>';
    return html;
}

function renderWizardStep1() {
    var html = '<h3 class="wizard-step-title">Basisgegevens</h3>';

    // Character name
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Character Naam *</label>';
    html += '<input type="text" class="wizard-input" id="wizard-name" value="' + escapeAttr(wizardState.name) + '" placeholder="Voer een naam in...">';
    html += '</div>';

    // Race
    var races = getWizardRaces();
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Ras / Species *</label>';
    html += '<select class="wizard-select" id="wizard-race" data-action="wizard-race-change">';
    html += '<option value="">-- Kies een ras --</option>';
    for (var i = 0; i < races.length; i++) {
        var sel = wizardState.race === races[i] ? ' selected' : '';
        html += '<option value="' + races[i] + '"' + sel + '>' + raceDisplayName(races[i]) + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // Race features preview
    if (wizardState.race && DATA[wizardState.race]) {
        var raceData = DATA[wizardState.race];
        html += '<div class="wizard-preview">';
        html += '<h4>' + raceDisplayName(wizardState.race) + ' Features</h4>';
        if (raceData.speed) html += '<p class="wizard-detail"><strong>Speed:</strong> ' + raceData.speed + 'ft</p>';
        if (raceData.darkvision) html += '<p class="wizard-detail"><strong>Darkvision:</strong> ' + raceData.darkvision + 'ft</p>';
        if (raceData.features) {
            for (var fi = 0; fi < raceData.features.length; fi++) {
                html += '<p class="wizard-detail"><strong>' + escapeHtml(raceData.features[fi].name) + ':</strong> ' + escapeHtml(raceData.features[fi].desc) + '</p>';
            }
        }
        html += '</div>';
    }

    // Class
    var classes = getWizardClasses();
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Klasse *</label>';
    html += '<select class="wizard-select" id="wizard-class" data-action="wizard-class-change">';
    html += '<option value="">-- Kies een klasse --</option>';
    for (var i = 0; i < classes.length; i++) {
        var sel = wizardState.className === classes[i] ? ' selected' : '';
        html += '<option value="' + classes[i] + '"' + sel + '>' + classDisplayName(classes[i]) + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // Class info preview
    if (wizardState.className && DATA[wizardState.className]) {
        var classData = DATA[wizardState.className];
        html += '<div class="wizard-preview">';
        html += '<h4>' + classDisplayName(wizardState.className) + ' Info</h4>';
        html += '<p class="wizard-detail"><strong>Hit Die:</strong> d' + classData.hitDie + '</p>';
        html += '<p class="wizard-detail"><strong>Saving Throws:</strong> ' + classData.savingThrows.map(function(s) { return s.toUpperCase(); }).join(', ') + '</p>';
        if (classData.cantripsKnown) {
            html += '<p class="wizard-detail"><strong>Spellcasting:</strong> Ja (cantrips bij level 1: ' + classData.cantripsKnown[1] + ')</p>';
        } else {
            html += '<p class="wizard-detail"><strong>Spellcasting:</strong> Nee</p>';
        }
        html += '</div>';
    }

    return html;
}

function renderWizardStep2() {
    var html = '<h3 class="wizard-step-title">Achtergrond & Ability Scores</h3>';

    // Background
    var bgs = getWizardBackgrounds();
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Achtergrond *</label>';
    html += '<select class="wizard-select" id="wizard-background" data-action="wizard-bg-change">';
    html += '<option value="">-- Kies een achtergrond --</option>';
    for (var i = 0; i < bgs.length; i++) {
        var bgData = DATA.backgrounds[bgs[i]];
        var sel = wizardState.background === bgs[i] ? ' selected' : '';
        html += '<option value="' + bgs[i] + '"' + sel + '>' + bgData.name + '</option>';
    }
    html += '</select>';
    html += '</div>';

    // Background info
    if (wizardState.background && DATA.backgrounds[wizardState.background]) {
        var bg = DATA.backgrounds[wizardState.background];
        html += '<div class="wizard-preview">';
        html += '<h4>' + bg.name + '</h4>';
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
        html += '</div>';
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
    var html = '<h3 class="wizard-step-title">Subclass & Details</h3>';

    // Subclass
    if (wizardState.className) {
        var subclasses = getWizardSubclasses(wizardState.className);
        if (subclasses.length > 0) {
            html += '<div class="wizard-field">';
            html += '<label class="wizard-label">Subclass</label>';
            html += '<select class="wizard-select" id="wizard-subclass">';
            html += '<option value="">-- Kies een subclass --</option>';
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
    html += '<label class="wizard-label">Leeftijd (optioneel)</label>';
    html += '<input type="number" class="wizard-input wizard-input-sm" id="wizard-age" value="' + (wizardState.age || '') + '" min="1" max="999" placeholder="Leeftijd">';
    html += '</div>';

    // Accent Color
    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Accent Kleur</label>';
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
    var html = '<h3 class="wizard-step-title">Vaardigheden & Proficiencies</h3>';

    if (!wizardState.className || !DATA[wizardState.className]) {
        html += '<p class="wizard-detail">Kies eerst een klasse in Stap 1.</p>';
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
        var spellData = DATA.spells && DATA.spells[wizardState.className] && DATA.spells[wizardState.className][0];
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
    var html = '<h3 class="wizard-step-title">Verhaal & Uiterlijk</h3>';

    html += '<div class="wizard-field">';
    html += '<label class="wizard-label">Uiterlijk</label>';
    html += '<textarea class="wizard-textarea" id="wizard-appearance" placeholder="Beschrijf het uiterlijk van je character...">' + escapeHtml(wizardState.appearance) + '</textarea>';
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
    html += '<label class="wizard-label">Backstory</label>';
    html += '<textarea class="wizard-textarea wizard-textarea-lg" id="wizard-backstory" placeholder="Het verhaal van je character...">' + escapeHtml(wizardState.backstory) + '</textarea>';
    html += '</div>';

    return html;
}

function renderWizardStep6() {
    var html = '<h3 class="wizard-step-title">Overzicht</h3>';

    html += '<div class="wizard-summary">';

    // Name & basics
    html += '<div class="wizard-summary-section">';
    html += '<h4>Basisgegevens</h4>';
    html += '<p><strong>Naam:</strong> ' + escapeHtml(wizardState.name || '(niet ingevuld)') + '</p>';
    html += '<p><strong>Ras:</strong> ' + (wizardState.race ? raceDisplayName(wizardState.race) : '(niet gekozen)') + '</p>';
    html += '<p><strong>Klasse:</strong> ' + (wizardState.className ? classDisplayName(wizardState.className) : '(niet gekozen)') + '</p>';
    html += '</div>';

    // Background
    html += '<div class="wizard-summary-section">';
    html += '<h4>Achtergrond</h4>';
    var bgName = wizardState.background && DATA.backgrounds[wizardState.background] ? DATA.backgrounds[wizardState.background].name : '(niet gekozen)';
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
        showToast('Vul naam, ras en klasse in (Stap 1).', 'error');
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

    showToast('Character "' + wizardState.name + '" aangemaakt!', 'success');
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

    container.onclick = function(e) {
        var target = e.target;

        if (target.matches('[data-action="close-wizard"]') || target.closest('[data-action="close-wizard"]')) {
            if (target.matches('.wizard-overlay') || target.matches('.modal-close') || target.closest('.modal-close')) {
                closeWizard();
                return;
            }
        }

        if (target.matches('[data-action="wizard-prev"]') || target.closest('[data-action="wizard-prev"]')) {
            saveWizardStepData();
            if (wizardState.step > 1) {
                wizardState.step--;
                refreshWizard();
            }
            return;
        }

        if (target.matches('[data-action="wizard-next"]') || target.closest('[data-action="wizard-next"]')) {
            saveWizardStepData();
            if (wizardState.step < 6) {
                wizardState.step++;
                refreshWizard();
            }
            return;
        }

        if (target.matches('[data-action="wizard-create"]') || target.closest('[data-action="wizard-create"]')) {
            saveWizardStepData();
            var newCharId = createCharacterFromWizard();
            if (newCharId) {
                closeWizard();
                navigate('/characters/' + newCharId);
            }
            return;
        }

        if (target.matches('[data-action="wizard-color"]') || target.closest('[data-action="wizard-color"]')) {
            var colorEl = target.matches('[data-action="wizard-color"]') ? target : target.closest('[data-action="wizard-color"]');
            wizardState.accentColor = colorEl.dataset.color;
            refreshWizard();
            return;
        }

        // Skill checkbox
        if (target.matches('[data-action="wizard-skill"]')) {
            var sk = target.dataset.skill;
            var idx = wizardState.skills.indexOf(sk);
            if (target.checked && idx === -1) {
                wizardState.skills.push(sk);
            } else if (!target.checked && idx !== -1) {
                wizardState.skills.splice(idx, 1);
            }
            refreshWizard();
            return;
        }

        // Cantrip checkbox
        if (target.matches('[data-action="wizard-cantrip"]')) {
            var cn = target.dataset.cantrip;
            var idx = wizardState.cantrips.indexOf(cn);
            if (target.checked && idx === -1) {
                wizardState.cantrips.push(cn);
            } else if (!target.checked && idx !== -1) {
                wizardState.cantrips.splice(idx, 1);
            }
            refreshWizard();
            return;
        }
    };

    container.onchange = function(e) {
        var target = e.target;

        if (target.matches('[data-action="wizard-race-change"]')) {
            wizardState.race = target.value;
            refreshWizard();
            return;
        }

        if (target.matches('[data-action="wizard-class-change"]')) {
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
            wizardState.background = target.value;
            wizardState.bgBonusChoice = { plus2: '', plus1: '' };
            refreshWizard();
            return;
        }

        if (target.matches('[data-action="wizard-bonus-change"]')) {
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
});

// ============================================================
// Section 32: Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Load cached users from localStorage (available before Firebase connects)
    try {
        var cachedUsers = localStorage.getItem('dw_users');
        if (cachedUsers) usersCache = JSON.parse(cachedUsers);
    } catch (e) { usersCache = null; }

    initMobileSupport();
    if (typeof initFirebaseSync === 'function') initFirebaseSync();
    initRouter();
    patchTooltipEvents();
});

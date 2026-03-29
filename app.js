// ============================================================
// D&D Within — Full SPA Application
// Requires data.js and engine.js to be loaded first.
// ============================================================

// ============================================================
// Section 1: User / Auth System
// ============================================================

const USERS = {
    admin:   { name: "Admin", role: "admin", characterId: null, password: "admin" },
    dm:      { name: "Dungeon Master", role: "dm", characterId: null, password: "dm" },
    ren:     { name: "Joshua", role: "player", characterId: "ren", password: "ren" },
    saya:    { name: "Speler 2", role: "player", characterId: "saya", password: "saya" },
    ranger:  { name: "Speler 3", role: "player", characterId: "ranger", password: "ranger" },
    wizard:  { name: "Speler 4", role: "player", characterId: "wizard", password: "wizard" },
    paladin: { name: "Speler 5", role: "player", characterId: "paladin", password: "paladin" },
    druid:   { name: "Speler 6", role: "player", characterId: "druid", password: "druid" },
    fighter: { name: "Speler 7", role: "player", characterId: "fighter", password: "fighter" },
    warlock: { name: "Speler 8", role: "player", characterId: "warlock", password: "warlock" }
};

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
    return s ? USERS[s.userId] : null;
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
    return u && u.characterId === charId;
}

function canEditWorld() {
    return isDM();
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
            { name: 'Shortsword "Stil Maar"', hit: null, dmg: "1d6", type: "piercing", finesse: true },
            { name: 'Shortsword "Slaap Zacht"', hit: null, dmg: "1d6", type: "piercing", finesse: true },
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
        backstory: "Ren en Saya Ashvane werden geboren in een klein dorp aan de rand van het Slangenmoeras. Hun moeder Lira was een voormalige avonturier; hun vader Dorin een stille houtsnijder die drakenbeeldjes sneed bij het kampvuur.\n\nZe waren zeven toen de Slangenmars kwam. Slangenwezens verwoestten hun dorp in \u00e9\u00e9n nacht. Lira viel als laatste. Dorin stierf naast zijn draak-bondgenoot Vuuradem.\n\nDe tweeling overleefde. In de sloppenwijken van Velthaven leerden ze stelen, rennen, en vertrouwen op niemand behalve elkaar. Ren werd de schaduw \u2014 stil, snel, dodelijk met zijn dolken Stil Maar en Slaap Zacht.\n\nWat moeder altijd zei: \"Tel je messen. Tel je uitgangen. Tel je vrienden. In die volgorde.\"\n\nHij draagt nog steeds vaders leren jas en het houten drakenbeeldje. De jas is twee maten te groot. Het beeldje zit in de binnenzak, rechts, waar zijn hand het kan raken zonder dat iemand het ziet.",
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
            { name: 'Shortsword "Stil Maar"', weight: 2, notes: '' },
            { name: 'Shortsword "Slaap Zacht"', weight: 2, notes: '' },
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
            { name: "Saya Ashvane", relation: "Tweelingzus", status: "Alive", notes: "Mijn gelijke, mijn partner." },
            { name: "Lira Ashvane", relation: "Moeder", status: "Deceased", notes: "Voormalige avonturier. Viel als laatste tijdens de Slangenmars." },
            { name: "Dorin Ashvane", relation: "Vader", status: "Deceased", notes: "Stille houtsnijder. Stierf naast zijn draak-bondgenoot Vuuradem." },
            { name: "Vuuradem", relation: "Vaders bondgenoot", status: "Deceased", notes: "Draak. Stierf samen met Dorin." }
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
            { name: "Ren Ashvane", relation: "Tweelingbroer", status: "Alive", notes: "De enige die niet wegrende toen ik in brand stond." },
            { name: "Lira Ashvane", relation: "Moeder", status: "Deceased", notes: "Voormalige avonturier. 'Huilen mag. Maar huil terwijl je doorloopt.'" },
            { name: "Dorin Ashvane", relation: "Vader", status: "Deceased", notes: "Stille houtsnijder die drakenbeeldjes sneed." },
            { name: "Vuuradem", relation: "Vaders bondgenoot", status: "Deceased", notes: "Draak. Stierf samen met Dorin." }
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
        defaultItems: []
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
        defaultItems: []
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
        defaultItems: []
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
        defaultItems: []
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
        defaultItems: []
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
        defaultItems: []
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
        fighter: 'Fighter', warlock: 'Warlock'
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
        halfling: 'Halfling', tiefling: 'Tiefling', aasimar: 'Aasimar'
    };
    return names[race] || capitalize(race);
}

function hasSpellcasting(className) {
    return ['sorcerer', 'wizard', 'druid', 'ranger', 'paladin', 'warlock'].indexOf(className) !== -1;
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
            html += renderCharacterSheet(route.parts[1]);
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

        // Global dice roller (all users)
        html += '<div class="dice-fab" data-action="toggle-dice-panel" title="Roll Dice">&#127922;</div>';
        html += '<div class="dice-panel" id="dice-panel" style="display:none;">';
        html += '<div class="dice-panel-header"><span>Dice Roller</span><button class="dice-panel-close" data-action="toggle-dice-panel">&times;</button></div>';
        html += '<div class="dice-panel-buttons">';
        var diceTypes = [4, 6, 8, 10, 12, 20, 100];
        for (var di = 0; di < diceTypes.length; di++) {
            html += '<button class="dice-panel-btn" data-action="roll-dice-global" data-die="' + diceTypes[di] + '">d' + diceTypes[di] + '</button>';
        }
        html += '</div>';
        html += '<div class="dice-panel-result" id="dice-panel-result"></div>';
        html += '<div class="dice-panel-log" id="dice-panel-log"></div>';
        html += '</div>';
    }

    // Page transition
    var mainEl = app.querySelector('.main-content');
    if (mainEl && !app._firstRender) {
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
    // Initialize visual effects after DOM update
    if (typeof LightningSystem !== 'undefined') {
        LightningSystem.stop();
    }

    if (route.parts[0] === 'characters' && route.parts[1]) {
        var effectCfg = loadCharConfig(route.parts[1]);
        var effectState = loadCharState(route.parts[1]);
        var effectLvl = effectState ? effectState.level : 1;
        var effectColor = effectCfg ? effectCfg.accentColor : '#22d3ee';

        if (effectLvl >= 9 && typeof createFlameParticles === 'function') {
            var fusionEl = document.getElementById('portrait-fusion-fire');
            var particleCount = effectLvl >= 17 ? 20 : effectLvl >= 13 ? 16 : 12;
            createFlameParticles(fusionEl, effectColor, particleCount);
        }

        if (effectLvl >= 20 && typeof LightningSystem !== 'undefined') {
            LightningSystem.init(effectColor);
            LightningSystem.start(effectColor);
        }
    }
}

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
    html += '<span class="nav-avatar">' + escapeHtml(user ? user.name.charAt(0) : '') + '</span>';
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
    for (var si = 0; si < charIds.length; si++) {
        var scfg = loadCharConfig(charIds[si]);
        if (!scfg) continue;
        var sstate = loadCharState(charIds[si]);
        partySize++;
        groupLevel = sstate.level; // group level (all same)
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

    // Party gold
    var partyGold = parseInt(localStorage.getItem('dw_party_gold') || '0');
    html += '<div class="dash-stat-card party-gold-card">';
    html += '<span class="dash-stat-value" style="color:var(--gold);">' + partyGold + '</span>';
    html += '<span class="dash-stat-label">Party Gold</span>';
    if (isDM()) {
        html += '<div class="session-controls">';
        html += '<button class="session-btn" data-action="party-gold-minus">&minus;</button>';
        html += '<input type="number" class="gold-input" id="party-gold-input" value="10" min="1" style="width:50px;text-align:center;">';
        html += '<button class="session-btn" data-action="party-gold-plus">+</button>';
        html += '</div>';
    }
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

    // Quest tracker
    var questData = JSON.parse(localStorage.getItem('dw_quests') || '{"active":[],"completed":[]}');
    html += '<div class="dash-quests">';
    html += '<div class="dash-quests-header">';
    html += '<h2 class="section-title">Active Quests</h2>';
    if (isDM()) {
        html += '<button class="btn btn-ghost btn-sm" data-action="add-quest">+ Add Quest</button>';
    }
    html += '</div>';
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

        var isOwn = user && user.characterId === cid;
        html += renderCharCard(cid, ccfg, cstate, isOwn);
    }

    html += '</div>';
    html += '</div>';

    // DM Tools section (only for DM)
    if (isDM()) {
        html += '<div class="dm-tools">';
        html += '<h2 class="section-title">' + t('dm.tools') + '</h2>';

        // Initiative Tracker
        html += '<div class="dm-tool-card">';
        html += '<h3>' + t('dm.initiative') + '</h3>';

        var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1}');
        var entries = initData.entries || [];
        var currentTurn = initData.currentTurn || 0;
        var initRound = initData.round || 1;

        html += '<div class="init-header">';
        html += '<span class="init-round">' + t('dm.round') + ' ' + initRound + '</span>';
        if (entries.length > 0) {
            html += '<button class="btn btn-sm btn-primary" data-action="next-turn">' + t('dm.nextturn') + ' &rarr;</button>';
        }
        html += '</div>';

        // Initiative list
        html += '<div class="init-list">';
        for (var ii = 0; ii < entries.length; ii++) {
            var entry = entries[ii];
            var isCurrent = ii === currentTurn;
            html += '<div class="init-entry' + (isCurrent ? ' current' : '') + '">';
            html += '<span class="init-roll">' + entry.initiative + '</span>';
            html += '<span class="init-name">' + escapeHtml(entry.name) + '</span>';
            if (entry.charId) {
                var ecfg = loadCharConfig(entry.charId);
                if (ecfg) html += '<span class="init-class">' + classDisplayName(ecfg.className) + '</span>';
            }
            html += '<button class="init-remove" data-action="remove-init" data-init-idx="' + ii + '">&times;</button>';
            html += '</div>';
        }
        html += '</div>';

        // Add to initiative
        html += '<div class="init-add">';
        html += '<select class="edit-input" id="init-char" style="flex:1;">';
        html += '<option value="">' + t('dm.choosechar') + '</option>';
        var iCharIds = getCharacterIds();
        for (var ici = 0; ici < iCharIds.length; ici++) {
            var iccfg = loadCharConfig(iCharIds[ici]);
            if (iccfg) html += '<option value="' + iCharIds[ici] + '">' + escapeHtml(iccfg.name) + '</option>';
        }
        html += '<option value="custom">' + t('dm.npcmonster') + '</option>';
        html += '</select>';
        html += '<input type="text" class="edit-input" id="init-custom-name" placeholder="' + t('dm.npcname') + '" style="display:none;flex:1;">';
        html += '<input type="number" class="edit-input" id="init-roll" placeholder="' + t('dm.init') + '" style="width:60px;">';
        html += '<button class="btn btn-sm btn-primary" data-action="add-init">+</button>';
        html += '</div>';

        // Clear initiative
        if (entries.length > 0) {
            html += '<button class="btn btn-ghost btn-sm" data-action="clear-init" style="margin-top:0.5rem;">' + t('dm.resetinit') + '</button>';
        }

        html += '</div>'; // dm-tool-card

        // Quick Dice Roller
        html += '<div class="dm-tool-card">';
        html += '<h3>' + t('dm.diceroller') + '</h3>';
        html += '<div class="dice-buttons">';
        var dice = [4, 6, 8, 10, 12, 20, 100];
        for (var di = 0; di < dice.length; di++) {
            html += '<button class="dice-btn" data-action="roll-dice" data-die="' + dice[di] + '">d' + dice[di] + '</button>';
        }
        html += '</div>';
        html += '<div class="dice-result" id="dice-result"></div>';
        html += '</div>'; // dm-tool-card

        // Cloud sync card
        html += '<div class="dm-tool-card">';
        html += '<h3>&#9729; ' + t('dm.cloudsync') + '</h3>';
        var syncSt = typeof getSyncStatus === 'function' ? getSyncStatus() : 'not-configured';
        if (syncSt === 'online') {
            html += '<p style="color:var(--success);font-size:0.85rem;margin-bottom:0.75rem;">' + t('dm.sync.connected') + '</p>';
            html += '<button class="btn btn-ghost btn-sm" data-action="sync-upload-all">' + t('dm.sync.uploadall') + '</button> ';
            html += '<button class="btn btn-ghost btn-sm" data-action="sync-seed-campaign" style="margin-top:0.5rem;">Seed Campaign Data</button>';
        } else if (syncSt === 'not-configured') {
            html += '<p style="color:var(--text-dim);font-size:0.85rem;">' + t('dm.sync.notconfig') + '</p>';
        } else {
            html += '<p style="color:var(--warning);font-size:0.85rem;">' + t('dm.sync.offline') + '</p>';
        }
        html += '</div>';

        html += '</div>'; // dm-tools
    }

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

    var html = '<a class="char-card" href="#/characters/' + cid + '" style="--card-accent:' + cfg.accentColor + '">';
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
    var user = currentUser();

    for (var i = 0; i < charIds.length; i++) {
        var cid = charIds[i];
        var cfg = loadCharConfig(cid);
        var state = loadCharState(cid);
        if (!cfg) continue;

        var isOwn = user && user.characterId === cid;
        html += renderCharCard(cid, cfg, state, isOwn);
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

    // Level tier for visual effects
    var lvl = state.level || 1;
    var tierClass = '';
    if (lvl >= 20) tierClass = ' level-tier-5 level-20';
    else if (lvl >= 17) tierClass = ' level-tier-5';
    else if (lvl >= 13) tierClass = ' level-tier-4';
    else if (lvl >= 9) tierClass = ' level-tier-3';
    else if (lvl >= 5) tierClass = ' level-tier-2';
    else tierClass = ' level-tier-1 level-sub-' + lvl;

    var html = '<div class="character-page' + tierClass + '" data-char-id="' + charId + '" style="--char-accent:' + (config.accentColor || 'var(--accent)') + '">';

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

    // Flame effects behind portrait (tier 3+)
    if (lvl >= 9) {
        html += '<div class="portrait-fire" id="portrait-fire"></div>';
    }
    // Fusion flame particles (tier 3+)
    if (lvl >= 9) {
        html += '<div class="portrait-fusion-fire" id="portrait-fusion-fire"></div>';
    }

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
    html += '<div class="info-grid">';
    html += '<div class="info-item" data-tip="' + escapeAttr(raceDisplayName(config.race)) + '"><span class="label">' + t('overview.race') + '</span><span class="value">' + raceDisplayName(config.race) + '</span></div>';
    html += '<div class="info-item" data-tip="' + escapeAttr(classDisplayName(config.className)) + '"><span class="label">' + t('overview.class') + '</span><span class="value">' + classDisplayName(config.className) + '</span></div>';
    if (isSubclassVisible(config, state)) {
        html += '<div class="info-item" data-tip="' + escapeAttr(subclassDisplayName(config.subclass)) + '"><span class="label">' + t('overview.subclass') + '</span><span class="value">' + subclassDisplayName(config.subclass) + '</span></div>';
    }
    html += '<div class="info-item" data-tip="' + escapeAttr(config.background || '') + '"><span class="label">' + t('overview.background') + '</span><span class="value">' + escapeHtml(config.background || '-') + '</span></div>';
    html += '<div class="info-item" data-tip="' + escapeAttr(config.alignment || '') + '"><span class="label">' + t('overview.alignment') + '</span><span class="value">' + escapeHtml(config.alignment || '-') + '</span></div>';
    html += '<div class="info-item"><span class="label">' + t('overview.age') + '</span><span class="value">' + (config.age || '-') + '</span></div>';
    html += '</div>';

    // Appearance
    var hasAppearance = config.appearance && (config.appearance[0] || config.appearance[1]);
    if (hasAppearance || canEdit(charId)) {
        html += '<div class="sheet-block appearance-mini">';
        html += '<h2>' + t('overview.appearance') + '</h2>';
        var appearImg = loadImage(charId, 'appearance');
        if (appearImg) {
            html += '<img class="appearance-img" src="' + appearImg + '" alt="">';
        }
        if (canEdit(charId)) {
            html += '<div class="editable-field" data-edit-field="appearance0" data-char-id="' + charId + '">';
            html += '<p class="field-display">' + escapeHtml(config.appearance ? config.appearance[0] || '' : '') + (!(config.appearance && config.appearance[0]) ? '<em class="placeholder-text">' + t('overview.appearance.add') + '</em>' : '') + '</p>';
            html += '<button class="edit-trigger" data-action="edit-field" data-field="appearance0" title="' + t('generic.edit') + '">&#9998;</button>';
            html += '</div>';
            html += '<div class="editable-field" data-edit-field="appearance1" data-char-id="' + charId + '">';
            html += '<p class="field-display">' + escapeHtml(config.appearance ? config.appearance[1] || '' : '') + (!(config.appearance && config.appearance[1]) ? '<em class="placeholder-text">' + t('overview.appearance.add') + '</em>' : '') + '</p>';
            html += '<button class="edit-trigger" data-action="edit-field" data-field="appearance1" title="' + t('generic.edit') + '">&#9998;</button>';
            html += '</div>';
        } else {
            if (config.appearance && config.appearance[0]) html += '<p>' + escapeHtml(config.appearance[0]) + '</p>';
            if (config.appearance && config.appearance[1]) html += '<p>' + escapeHtml(config.appearance[1]) + '</p>';
        }
        if (canEdit(charId)) {
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
    if (config.weapons && config.weapons.length > 0) {
        html += '<div class="sheet-block">';
        html += '<h2>' + t('combat.weapons') + '</h2>';
        html += renderWeaponsHTML(config, state);
        html += '</div>';
    }

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
                html += '<span class="prepared-spell-tag">' + escapeHtml(preparedSpells[psi]) + '</span>';
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
function renderWeaponsHTML(config, state) {
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
            html += '<p>' + escapeHtml(config.backstory) + '</p>';
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

    // === Family / Connections ===
    var family = config.family || [];
    if (family.length > 0 || editable) {
        html += '<div class="sheet-block">';
        html += '<h2>Family & Connections</h2>';
        if (family.length > 0) {
            html += '<div class="family-tree">';
            for (var fi = 0; fi < family.length; fi++) {
                var fm = family[fi];
                var statusClass = fm.status === 'Deceased' || fm.status === 'Overleden' ? ' deceased' : '';
                html += '<div class="family-member' + statusClass + '">';
                html += '<div class="family-connector"></div>';
                html += '<div class="family-info">';
                html += '<strong>' + escapeHtml(fm.name || '') + '</strong>';
                html += '<span class="family-relation">' + escapeHtml(fm.relation || '') + '</span>';
                if (fm.status) html += '<span class="family-status">' + escapeHtml(fm.status) + '</span>';
                if (fm.notes) html += '<span class="family-notes">' + escapeHtml(fm.notes) + '</span>';
                html += '</div>';
                if (editable) {
                    html += '<button class="family-remove" data-action="remove-family" data-idx="' + fi + '">&times;</button>';
                }
                html += '</div>';
            }
            html += '</div>';
        }
        if (editable) {
            html += '<div class="family-add">';
            html += '<input type="text" class="edit-input" id="fam-name" placeholder="Name" style="flex:1;">';
            html += '<input type="text" class="edit-input" id="fam-relation" placeholder="Relation" style="width:100px;">';
            html += '<input type="text" class="edit-input" id="fam-status" placeholder="Status" style="width:80px;">';
            html += '<input type="text" class="edit-input" id="fam-notes" placeholder="Notes" style="flex:1;">';
            html += '<button class="edit-save" data-action="add-family">+</button>';
            html += '</div>';
        }
        html += '</div>';
    }

    if (!editable && !config.backstory && !hasPersonality && quotes.length === 0 && charTimeline.length === 0 && family.length === 0) {
        html += '<p class="block-note">' + t('story.nostory') + '</p>';
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
    html += '<textarea class="edit-textarea" id="' + prefix + 'ev-desc" placeholder="' + t('timeline.eventdesc') + '" style="min-height:60px;">' + escapeHtml(ev.desc || '') + '</textarea>';
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

    // Always show party link
    html += '<div class="lore-grid">';
    html += '<a class="lore-card" href="#/lore/party">';
    html += '<h3>' + t('lore.theparty') + '</h3>';
    html += '<p>' + t('lore.theparty.desc') + '</p>';
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

                // Find user by username (match against user ID or name)
                var matchedId = null;
                for (var uid in USERS) {
                    if (uid === username || USERS[uid].name.toLowerCase() === username) {
                        matchedId = uid;
                        break;
                    }
                }

                if (!matchedId) {
                    if (errorEl) { errorEl.textContent = t('login.error.notfound'); errorEl.style.display = 'block'; }
                    return;
                }

                if (USERS[matchedId].password !== password) {
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

        // Add to initiative
        if (target.matches('[data-action="add-init"]')) {
            var charSelect = document.getElementById('init-char');
            var customName = document.getElementById('init-custom-name');
            var rollInput = document.getElementById('init-roll');
            if (!rollInput || !rollInput.value) return;

            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1}');
            var iName = '';
            var iCharId = null;

            if (charSelect && charSelect.value === 'custom') {
                iName = customName ? customName.value.trim() : 'NPC';
            } else if (charSelect && charSelect.value) {
                iCharId = charSelect.value;
                var icfg = loadCharConfig(iCharId);
                iName = icfg ? icfg.name : iCharId;
            }

            if (!iName) return;

            initData.entries.push({ name: iName, charId: iCharId, initiative: parseInt(rollInput.value) || 0 });
            initData.entries.sort(function(a, b) { return b.initiative - a.initiative; });
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // Next turn
        if (target.matches('[data-action="next-turn"]')) {
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1}');
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
            var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1}');
            if (!isNaN(ridx)) {
                initData.entries.splice(ridx, 1);
                if (initData.currentTurn >= initData.entries.length) initData.currentTurn = 0;
            }
            localStorage.setItem('dw_initiative', JSON.stringify(initData));
            if (typeof syncUpload === 'function') syncUpload('dw_initiative');
            renderApp();
            return;
        }

        // Clear initiative
        if (target.matches('[data-action="clear-init"]')) {
            localStorage.setItem('dw_initiative', JSON.stringify({entries:[], currentTurn:0, round:1}));
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
            if (panel) panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
            return;
        }

        // Global dice roller
        if (target.matches('[data-action="roll-dice-global"]')) {
            var die = parseInt(target.dataset.die);
            var result = Math.floor(Math.random() * die) + 1;
            var resultEl = document.getElementById('dice-panel-result');
            var logEl = document.getElementById('dice-panel-log');
            if (resultEl) {
                var isNat20 = die === 20 && result === 20;
                var isNat1 = die === 20 && result === 1;
                resultEl.innerHTML = '<span class="dice-roll-value' + (isNat20 ? ' nat20' : '') + (isNat1 ? ' nat1' : '') + '">' + result + '</span><span class="dice-roll-label">d' + die + (isNat20 ? ' — NATURAL 20!' : '') + (isNat1 ? ' — Critical Fail!' : '') + '</span>';
                resultEl.classList.add('dice-animate');
                setTimeout(function() { resultEl.classList.remove('dice-animate'); }, 400);
            }
            if (logEl) {
                var logEntry = document.createElement('div');
                logEntry.className = 'dice-log-entry';
                logEntry.textContent = 'd' + die + ': ' + result;
                logEl.insertBefore(logEntry, logEl.firstChild);
                if (logEl.children.length > 10) logEl.removeChild(logEl.lastChild);
            }
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
                    var curAppearance = (config.appearance || ['', '']).slice();
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

            // Add family member
            if (target.matches('[data-action="add-family"]')) {
                if (!canEdit(charId)) return;
                var famName = document.getElementById('fam-name');
                var famRelation = document.getElementById('fam-relation');
                var famStatus = document.getElementById('fam-status');
                var famNotes = document.getElementById('fam-notes');
                if (famName && famName.value.trim()) {
                    var fam = (config.family || []).slice();
                    fam.push({
                        name: famName.value.trim(),
                        relation: famRelation ? famRelation.value.trim() : '',
                        status: famStatus ? famStatus.value.trim() : '',
                        notes: famNotes ? famNotes.value.trim() : ''
                    });
                    saveCharConfigField(charId, 'family', fam);
                    config = loadCharConfig(charId);
                    renderApp();
                }
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
                    (isNat20 ? ' CRIT!' : '') + (isNat1 ? ' MISS!' : '') +
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
                if (config.className === 'warlock') {
                    if (!state.spellSlotsUsed) state.spellSlotsUsed = {};
                    state.spellSlotsUsed['pact'] = 0;
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
                var hitDiceToRestore = Math.ceil(state.level / 2);
                state.hitDiceUsed = Math.max(0, (state.hitDiceUsed || 0) - hitDiceToRestore);
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

        // --- Dashboard: quests ---
        if (target.matches('[data-action="add-quest"]')) {
            var qTitle = prompt('Quest title:');
            if (qTitle && qTitle.trim()) {
                var qDesc = prompt('Description (optional):') || '';
                var qData = JSON.parse(localStorage.getItem('dw_quests') || '{"active":[],"completed":[]}');
                qData.active.push({ title: qTitle.trim(), desc: qDesc.trim(), id: 'q' + Date.now() });
                localStorage.setItem('dw_quests', JSON.stringify(qData));
                if (typeof syncUpload === 'function') syncUpload('dw_quests');
                renderApp();
            }
            return;
        }
        if (target.matches('[data-action="complete-quest"]')) {
            var qIdx = parseInt(target.dataset.questIdx);
            var qData = JSON.parse(localStorage.getItem('dw_quests') || '{"active":[],"completed":[]}');
            if (qData.active[qIdx]) {
                qData.completed.push(qData.active[qIdx]);
                qData.active.splice(qIdx, 1);
                localStorage.setItem('dw_quests', JSON.stringify(qData));
                if (typeof syncUpload === 'function') syncUpload('dw_quests');
                renderApp();
            }
            return;
        }
        if (target.matches('[data-action="delete-quest"]')) {
            var qIdx = parseInt(target.dataset.questIdx);
            var qData = JSON.parse(localStorage.getItem('dw_quests') || '{"active":[],"completed":[]}');
            qData.active.splice(qIdx, 1);
            localStorage.setItem('dw_quests', JSON.stringify(qData));
            if (typeof syncUpload === 'function') syncUpload('dw_quests');
            renderApp();
            return;
        }

        // --- Dashboard: party gold ---
        if (target.matches('[data-action="party-gold-plus"]')) {
            var amt = parseInt(document.getElementById('party-gold-input').value) || 10;
            var pg = parseInt(localStorage.getItem('dw_party_gold') || '0');
            localStorage.setItem('dw_party_gold', String(pg + amt));
            if (typeof syncUpload === 'function') syncUpload('dw_party_gold');
            renderApp();
            return;
        }
        if (target.matches('[data-action="party-gold-minus"]')) {
            var amt = parseInt(document.getElementById('party-gold-input').value) || 10;
            var pg = parseInt(localStorage.getItem('dw_party_gold') || '0');
            localStorage.setItem('dw_party_gold', String(Math.max(0, pg - amt)));
            if (typeof syncUpload === 'function') syncUpload('dw_party_gold');
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
        if (target.matches('[data-action="update-gold"]') || target.matches('.gold-input')) {
            if (charId && canEdit(charId)) {
                var goldState = loadCharState(charId);
                goldState.gold = parseInt(target.value) || 0;
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
        if (abilityEl || spellBtn || infoItem) {
            var related = e.relatedTarget;
            if (abilityEl && abilityEl.contains(related)) return;
            if (spellBtn && spellBtn.contains(related)) return;
            if (infoItem && infoItem.contains(related)) return;
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
// Section 32: Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    initMobileSupport();
    if (typeof initFirebaseSync === 'function') initFirebaseSync();
    initRouter();
    patchTooltipEvents();
});

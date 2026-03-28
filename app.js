// ============================================================
// D&D Within — Full SPA Application
// Requires data.js and engine.js to be loaded first.
// ============================================================

// ============================================================
// Section 1: User / Auth System
// ============================================================

const USERS = {
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

function isDM() {
    var u = currentUser();
    return u && u.role === 'dm';
}

function canEdit(charId) {
    var u = currentUser();
    return u && (u.role === 'dm' || u.characterId === charId);
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
    window.addEventListener('hashchange', function() { renderApp(); });
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
}

function loadCharConfigEdits(charId) {
    var saved = localStorage.getItem('dw_charconfig_' + charId);
    if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
    }
    return {};
}

function saveCharConfigEdit(charId, field, value) {
    var edits = loadCharConfigEdits(charId);
    edits[field] = value;
    localStorage.setItem('dw_charconfig_' + charId, JSON.stringify(edits));
}

function loadCharConfig(charId) {
    var base = CHAR_DEFAULTS[charId];
    if (!base) {
        // Check for fully custom char in localStorage
        var custom = localStorage.getItem('dw_charconfig_' + charId);
        if (custom) {
            try { return JSON.parse(custom); } catch (e) { /* ignore */ }
        }
        return null;
    }
    var edits = loadCharConfigEdits(charId);
    // Deep merge edits over base
    var config = JSON.parse(JSON.stringify(base)); // clone
    for (var key in edits) {
        if (key === 'personality' && typeof edits[key] === 'object') {
            config.personality = Object.assign({}, config.personality, edits[key]);
        } else if (key === 'appearance' && Array.isArray(edits[key])) {
            config.appearance = edits[key].slice();
        } else if (key === 'quotes' && Array.isArray(edits[key])) {
            config.quotes = edits[key].slice();
        } else {
            config[key] = edits[key];
        }
    }
    return config;
}

function loadImage(charId, type) {
    return localStorage.getItem('dw_img_' + charId + '_' + type) || '';
}

function saveImage(charId, type, base64) {
    localStorage.setItem('dw_img_' + charId + '_' + type, base64);
}

// ============================================================
// Section 4: Character Defaults
// ============================================================

var CHAR_DEFAULTS = {
    ren: {
        id: "ren", name: "Ren Ashvane", player: "ren",
        race: "woodElf", className: "rogue", subclass: "scout",
        background: "wayfarer", alignment: "Chaotic Good", age: 19,
        accentColor: "#22d3ee",
        baseAbilities: { str: 10, dex: 16, con: 14, int: 14, wis: 12, cha: 10 },
        backgroundBonuses: { str: 0, dex: 1, con: 1, int: 0, wis: 0, cha: 2 },
        defaultSkills: ["stealth", "sleight of hand", "perception", "acrobatics", "investigation", "athletics"],
        defaultExpertise: ["stealth", "sleight of hand"],
        weapons: [
            { name: 'Shortsword "Woord"', hit: null, dmg: "1d6", type: "piercing", finesse: true },
            { name: 'Shortsword "Daad"', hit: null, dmg: "1d6", type: "piercing", finesse: true },
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
        backstory: "Ren en Saya Ashvane werden geboren in een klein dorp aan de rand van het Slangenmoeras. Hun moeder Lira was een voormalige avonturier; hun vader Dorin een stille houtsnijder die drakenbeeldjes sneed bij het kampvuur.\n\nZe waren zeven toen de Slangenmars kwam. Slangenwezens verwoestten hun dorp in \u00e9\u00e9n nacht. Lira viel als laatste. Dorin stierf naast zijn draak-bondgenoot Vuuradem.\n\nDe tweeling overleefde. In de sloppenwijken van Velthaven leerden ze stelen, rennen, en vertrouwen op niemand behalve elkaar. Ren werd de schaduw \u2014 stil, snel, dodelijk met zijn dolken Woord en Daad.\n\nWat moeder altijd zei: \"Tel je messen. Tel je uitgangen. Tel je vrienden. In die volgorde.\"\n\nHij draagt nog steeds vaders leren jas en het houten drakenbeeldje. De jas is twee maten te groot. Het beeldje zit in de binnenzak, rechts, waar zijn hand het kan raken zonder dat iemand het ziet.",
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
            { name: 'Shortsword "Woord"', weight: 2, notes: '' },
            { name: 'Shortsword "Daad"', weight: 2, notes: '' },
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
        ]
    },

    saya: {
        id: "saya", name: "Saya Ashvane", player: "saya",
        race: "woodElf", className: "sorcerer", subclass: "wildMagic",
        background: "wayfarer", alignment: "Chaotic Good", age: 19,
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
        ]
    },

    ranger: {
        id: "ranger", name: "Nieuw Karakter", player: "ranger",
        race: "human", className: "ranger", subclass: "hunter",
        background: "guide", alignment: "Neutral Good", age: 25,
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
        id: "wizard", name: "Nieuw Karakter", player: "wizard",
        race: "halfling", className: "wizard", subclass: "evocation",
        background: "sage", alignment: "Neutral", age: 40,
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
        id: "paladin", name: "Nieuw Karakter", player: "paladin",
        race: "tiefling", className: "paladin", subclass: "devotion",
        background: "soldier", alignment: "Lawful Good", age: 28,
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
        id: "druid", name: "Nieuw Karakter", player: "druid",
        race: "aasimar", className: "druid", subclass: "land",
        background: "acolyte", alignment: "Neutral Good", age: 30,
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
        id: "fighter", name: "Nieuw Karakter", player: "fighter",
        race: "tiefling", className: "fighter", subclass: "champion",
        background: "soldier", alignment: "Chaotic Neutral", age: 22,
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
        id: "warlock", name: "Nieuw Karakter", player: "warlock",
        race: "tiefling", className: "warlock", subclass: "fiend",
        background: "charlatan", alignment: "Chaotic Neutral", age: 26,
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
    'Half-Elf': 'Darkvision 60ft. Fey Ancestry: advantage op saves tegen charmed. 2 extra skill proficiencies. +2 CHA, +1 op 2 andere abilities.',
    'Wood Elf': 'Darkvision 60ft. Fey Ancestry: advantage op saves tegen charmed. Fleet of Foot: base speed 35ft. Mask of the Wild: hide in licht natural obscurement.',
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
    return ['ren', 'saya', 'ranger', 'wizard', 'paladin', 'druid', 'fighter', 'warlock'];
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
            html += '<div class="page-placeholder"><h2>Pagina niet gevonden</h2><p>De pagina die je zoekt bestaat niet.</p></div>';
        }

        html += '</main>';
    }

    app.innerHTML = html;
    bindPageEvents(route);
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
    html += '<label class="login-label">Gebruikersnaam</label>';
    html += '<input type="text" class="login-input" id="login-username" placeholder="Gebruikersnaam" autocomplete="username">';
    html += '</div>';
    html += '<div class="login-field">';
    html += '<label class="login-label">Wachtwoord</label>';
    html += '<input type="password" class="login-input" id="login-password" placeholder="Wachtwoord" autocomplete="current-password">';
    html += '</div>';
    html += '<button class="login-submit" data-action="login-submit">Inloggen</button>';
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
    var links = [
        { path: '/dashboard', label: 'Dashboard', icon: '&#9733;' },
        { path: '/characters', label: 'Characters', icon: '&#9876;' },
        { path: '/maps', label: 'Maps', icon: '&#9873;' },
        { path: '/timeline', label: 'Timeline', icon: '&#128337;' },
        { path: '/lore', label: 'Lore', icon: '&#128214;' },
        { path: '/notes', label: 'Notes', icon: '&#128221;' }
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
        html += '<a class="nav-link' + (isActive ? ' active' : '') + '" href="#' + link.path + '">' + link.icon + ' ' + link.label + '</a>';
    }

    html += '</div>';
    html += '<div class="nav-right">';
    html += '<div class="theme-picker-wrap">';
    html += '<button class="theme-picker-btn" data-action="toggle-theme-picker" title="Kleurenthema">&#127912;</button>';
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
    html += '<span class="nav-avatar">' + escapeHtml(user ? user.name.charAt(0) : '') + '</span>';
    html += '<button class="nav-logout" data-action="logout">Uitloggen</button>';
    html += '</div>';
    html += '<button class="nav-toggle" data-action="toggle-nav">&#9776;</button>';
    html += '</nav>';
    return html;
}

// ============================================================
// Section 11: Dashboard
// ============================================================

function renderDashboard() {
    var user = currentUser();
    var html = '<div class="dashboard">';

    // Session number (DM can set)
    var sessionNum = localStorage.getItem('dw_session_number') || '1';

    // Welcome banner
    html += '<div class="welcome-banner">';
    html += '<h1>Welkom in Valoria</h1>';
    html += '<p class="campaign-name">De Slangenmars</p>';
    html += '<p class="welcome-user">Ingelogd als ' + escapeHtml(user ? user.name : '') + '</p>';
    html += '<p class="text-dim" style="font-size:0.85rem;">Sessie ' + escapeHtml(sessionNum) + '</p>';
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
    html += '<span class="dash-stat-label">Sessie</span>';
    if (isDM()) {
        html += '<div class="session-controls">';
        html += '<button class="session-btn" data-action="session-minus">&minus;</button>';
        html += '<button class="session-btn" data-action="session-plus">+</button>';
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="dash-stat-card"><span class="dash-stat-value">' + partySize + '</span><span class="dash-stat-label">Party</span></div>';
    html += '<div class="dash-stat-card"><span class="dash-stat-value">' + groupLevel + '</span><span class="dash-stat-label">Level</span></div>';
    html += '</div>';

    // Quick navigation cards
    html += '<div class="dash-nav-cards">';
    html += '<a class="dash-nav-card" href="#/characters"><span class="dash-nav-icon">&#9876;</span><span class="dash-nav-title">Characters</span><span class="dash-nav-desc">Bekijk alle avonturiers</span></a>';
    html += '<a class="dash-nav-card" href="#/timeline"><span class="dash-nav-icon">&#128337;</span><span class="dash-nav-title">Timeline</span><span class="dash-nav-desc">Campagne gebeurtenissen</span></a>';
    html += '<a class="dash-nav-card" href="#/maps"><span class="dash-nav-icon">&#128506;</span><span class="dash-nav-title">Maps</span><span class="dash-nav-desc">Kaarten van de wereld</span></a>';
    html += '<a class="dash-nav-card" href="#/lore"><span class="dash-nav-icon">&#128214;</span><span class="dash-nav-title">Lore</span><span class="dash-nav-desc">Achtergrondverhalen en kennis</span></a>';
    html += '<a class="dash-nav-card" href="#/notes"><span class="dash-nav-icon">&#128221;</span><span class="dash-nav-title">Notes</span><span class="dash-nav-desc">Je sessie-aantekeningen</span></a>';
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
        html += '<h2 class="section-title">Recente Gebeurtenissen</h2>';
        html += '<div class="dash-recent-events">';
        for (var ri = 0; ri < recentEvents.length; ri++) {
            var rev = recentEvents[ri];
            html += '<div class="dash-recent-event timeline-' + (rev.type || 'quest') + '">';
            if (rev.session) html += '<span class="timeline-date">Sessie ' + escapeHtml(rev.session) + '</span>';
            html += '<strong>' + escapeHtml(rev.title) + '</strong>';
            html += '<p class="text-dim" style="margin:0;font-size:0.8rem;">' + escapeHtml(rev.desc) + '</p>';
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';
    }

    // Party overview
    html += '<div class="party-section">';
    html += '<h2 class="section-title">Party Overzicht</h2>';
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
        html += '<h2 class="section-title">DM Tools</h2>';

        // Initiative Tracker
        html += '<div class="dm-tool-card">';
        html += '<h3>Initiative Tracker</h3>';

        var initData = JSON.parse(localStorage.getItem('dw_initiative') || '{"entries":[],"currentTurn":0,"round":1}');
        var entries = initData.entries || [];
        var currentTurn = initData.currentTurn || 0;
        var initRound = initData.round || 1;

        html += '<div class="init-header">';
        html += '<span class="init-round">Ronde ' + initRound + '</span>';
        if (entries.length > 0) {
            html += '<button class="btn btn-sm btn-primary" data-action="next-turn">Volgende Beurt &rarr;</button>';
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
        html += '<option value="">Kies karakter/NPC...</option>';
        var iCharIds = getCharacterIds();
        for (var ici = 0; ici < iCharIds.length; ici++) {
            var iccfg = loadCharConfig(iCharIds[ici]);
            if (iccfg) html += '<option value="' + iCharIds[ici] + '">' + escapeHtml(iccfg.name) + '</option>';
        }
        html += '<option value="custom">NPC / Monster</option>';
        html += '</select>';
        html += '<input type="text" class="edit-input" id="init-custom-name" placeholder="NPC naam" style="display:none;flex:1;">';
        html += '<input type="number" class="edit-input" id="init-roll" placeholder="Init" style="width:60px;">';
        html += '<button class="btn btn-sm btn-primary" data-action="add-init">+</button>';
        html += '</div>';

        // Clear initiative
        if (entries.length > 0) {
            html += '<button class="btn btn-ghost btn-sm" data-action="clear-init" style="margin-top:0.5rem;">Initiative resetten</button>';
        }

        html += '</div>'; // dm-tool-card

        // Quick Dice Roller
        html += '<div class="dm-tool-card">';
        html += '<h3>Dice Roller</h3>';
        html += '<div class="dice-buttons">';
        var dice = [4, 6, 8, 10, 12, 20, 100];
        for (var di = 0; di < dice.length; di++) {
            html += '<button class="dice-btn" data-action="roll-dice" data-die="' + dice[di] + '">d' + dice[di] + '</button>';
        }
        html += '</div>';
        html += '<div class="dice-result" id="dice-result"></div>';
        html += '</div>'; // dm-tool-card

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
    if (isOwn) html += '<span class="char-card-badge">Jouw karakter</span>';
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
        return '<div class="page-placeholder"><h2>Karakter niet gevonden</h2></div>';
    }

    var state = loadCharState(charId);
    var editable = canEdit(charId);

    var classLabel = classDisplayName(config.className);
    var subLabel = subclassDisplayName(config.subclass);
    var raceLabel = raceDisplayName(config.race);

    // Banner
    var banner = loadImage(charId, 'banner');
    var portrait = loadImage(charId, 'portrait');

    var html = '<div class="character-page" data-char-id="' + charId + '">';

    // Banner section
    html += '<div class="char-banner">';
    if (banner) {
        html += '<img src="' + banner + '" alt="">';
    } else {
        html += '<div class="banner-placeholder">Banner</div>';
    }
    if (editable) {
        html += '<label class="image-upload-overlay" title="Banner uploaden"><span class="upload-icon">&#128247;</span><input type="file" accept="image/*" data-action="upload-banner" style="display:none"></label>';
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
        html += '<label class="image-upload-overlay" title="Portret uploaden"><span class="upload-icon">&#128247;</span><input type="file" accept="image/*" data-action="upload-portrait" style="display:none"></label>';
    }
    html += '</div>';

    // Header
    html += '<div class="char-header">';
    html += '<div class="header-info">';
    html += '<h1 class="char-name-wrap">';
    html += '<span class="char-name-display">' + escapeHtml(config.name) + '</span>';
    if (editable) {
        html += '<button class="edit-trigger" data-action="edit-name" title="Naam bewerken">&#9998;</button>';
        var colorOptions = ['#22d3ee','#f472b6','#4ade80','#818cf8','#fbbf24','#34d399','#f87171','#a78bfa','#fb923c','#e879f9','#38bdf8','#facc15'];
        html += '<span class="color-picker-wrap">';
        html += '<span class="color-dot" data-action="pick-color" style="background:' + config.accentColor + ';" title="Kleur kiezen"></span>';
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
    html += ' &mdash; ';
    html += '<span class="info-item" data-tip="' + escapeAttr(subLabel) + '"><span class="value">' + subLabel + '</span></span>';
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
        html += '<button class="header-btn" data-action="export-char">&#128190; Opslaan</button>';
        html += '<label class="header-btn">&#128194; Laden<input type="file" accept=".json" data-action="import-char" style="display:none"></label>';
        html += '<button class="header-btn header-btn-danger" data-action="reset-char">&#128260; Reset</button>';
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
        html += '<button class="quote-refresh-btn" data-action="refresh-quote" title="Ander citaat">&#8635;</button>';
        html += '</div>';
    }

    // Tab bar
    var tabs = [
        { id: 'overview', label: 'Overzicht' },
        { id: 'stats', label: 'Stats' },
        { id: 'combat', label: 'Combat' }
    ];
    if (hasSpellcasting(config.className)) {
        tabs.push({ id: 'spells', label: 'Spells' });
    }
    tabs.push({ id: 'story', label: 'Verhaal' });
    tabs.push({ id: 'inventory', label: 'Inventaris' });

    html += '<div class="tab-bar">';
    for (var t = 0; t < tabs.length; t++) {
        html += '<button class="tab-btn' + (activeTab === tabs[t].id ? ' active' : '') + '" data-tab="' + tabs[t].id + '">' + tabs[t].label + '</button>';
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
    html += '<div class="info-item" data-tip="' + escapeAttr(raceDisplayName(config.race)) + '"><span class="label">Ras</span><span class="value">' + raceDisplayName(config.race) + '</span></div>';
    html += '<div class="info-item" data-tip="' + escapeAttr(classDisplayName(config.className)) + '"><span class="label">Klasse</span><span class="value">' + classDisplayName(config.className) + '</span></div>';
    html += '<div class="info-item" data-tip="' + escapeAttr(subclassDisplayName(config.subclass)) + '"><span class="label">Subklasse</span><span class="value">' + subclassDisplayName(config.subclass) + '</span></div>';
    html += '<div class="info-item" data-tip="' + escapeAttr(config.background || '') + '"><span class="label">Achtergrond</span><span class="value">' + escapeHtml(config.background || '-') + '</span></div>';
    html += '<div class="info-item" data-tip="' + escapeAttr(config.alignment || '') + '"><span class="label">Alignment</span><span class="value">' + escapeHtml(config.alignment || '-') + '</span></div>';
    html += '<div class="info-item"><span class="label">Leeftijd</span><span class="value">' + (config.age || '-') + '</span></div>';
    html += '</div>';

    // Appearance
    var hasAppearance = config.appearance && (config.appearance[0] || config.appearance[1]);
    if (hasAppearance || canEdit(charId)) {
        html += '<div class="sheet-block appearance-mini">';
        html += '<h2>Uiterlijk</h2>';
        var appearImg = loadImage(charId, 'appearance');
        if (appearImg) {
            html += '<img class="appearance-img" src="' + appearImg + '" alt="">';
        }
        if (canEdit(charId)) {
            html += '<div class="editable-field" data-edit-field="appearance0" data-char-id="' + charId + '">';
            html += '<p class="field-display">' + escapeHtml(config.appearance ? config.appearance[0] || '' : '') + (!(config.appearance && config.appearance[0]) ? '<em class="placeholder-text">Klik om uiterlijk toe te voegen...</em>' : '') + '</p>';
            html += '<button class="edit-trigger" data-action="edit-field" data-field="appearance0" title="Bewerken">&#9998;</button>';
            html += '</div>';
            html += '<div class="editable-field" data-edit-field="appearance1" data-char-id="' + charId + '">';
            html += '<p class="field-display">' + escapeHtml(config.appearance ? config.appearance[1] || '' : '') + (!(config.appearance && config.appearance[1]) ? '<em class="placeholder-text">Klik om uiterlijk toe te voegen...</em>' : '') + '</p>';
            html += '<button class="edit-trigger" data-action="edit-field" data-field="appearance1" title="Bewerken">&#9998;</button>';
            html += '</div>';
        } else {
            if (config.appearance && config.appearance[0]) html += '<p>' + escapeHtml(config.appearance[0]) + '</p>';
            if (config.appearance && config.appearance[1]) html += '<p>' + escapeHtml(config.appearance[1]) + '</p>';
        }
        if (canEdit(charId)) {
            html += '<label class="btn btn-ghost btn-sm appearance-upload-btn">&#128247; Afbeelding<input type="file" accept="image/*" data-action="upload-appearance" style="display:none"></label>';
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
    html += '<h2>Class Features</h2>';

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
    var subData = classData.subclasses && classData.subclasses[config.subclass];
    if (subData) {
        html += '<h3 style="margin-top:1rem;">Subclass Features</h3>';
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

    // Racial features
    var raceKey = config.race;
    var raceData = DATA[raceKey];
    if (raceData && raceData.features) {
        html += '<h3 style="margin-top:1rem;">Racial Traits (' + raceDisplayName(config.race) + ')</h3>';
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

function renderTabStats(charId, config, state) {
    var html = '<div class="sheet-grid">';

    // Ability Scores
    html += '<div class="sheet-block">';
    html += '<h2>Ability Scores</h2>';
    html += renderAbilityScoresHTML(charId, config, state);
    html += '</div>';

    // Saving Throws
    html += '<div class="sheet-block">';
    html += '<h2>Saving Throws</h2>';
    html += renderSavingThrowsHTML(config, state);
    html += '</div>';

    // Skills
    html += '<div class="sheet-block">';
    html += '<h2>Skills</h2>';
    html += renderSkillsHTML(config, state);
    html += '</div>';

    // ASI
    html += '<div class="sheet-block" id="asi-content">';
    html += '<h2>Ability Score Improvements</h2>';
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
        html += '<button class="ability-edit-btn" data-action="ability-save">Opslaan</button>';
        html += '<button class="ability-edit-btn ability-edit-cancel" data-action="ability-cancel">Annuleren</button>';
        html += '</div>';
    } else {
        if (editable) {
            html += '<div class="ability-edit-header"><button class="edit-toggle-btn" data-action="ability-edit" title="Bewerken">&#9998;</button></div>';
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
        html += '<p class="block-note" style="margin-top:0.75rem;">&#9733; = Expertise (dubbele proficiency)</p>';
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
        return '<p class="block-note">Ability Score Improvement beschikbaar op level ' + asiLevels[0] + '.</p>';
    }

    var html = '';
    for (var r = 0; r < relevantLevels.length; r++) {
        var lvl = relevantLevels[r];
        var choice = state.asiChoices[lvl];
        html += '<div class="asi-panel" data-asi-level="' + lvl + '">';
        html += '<h4>Level ' + lvl + ' \u2014 Ability Score Improvement</h4>';

        if (!choice) {
            html += '<div class="asi-options">';
            html += '<button class="asi-option" data-asi-level="' + lvl + '" data-asi-type="asi-two">+2 op 1 ability</button>';
            html += '<button class="asi-option" data-asi-level="' + lvl + '" data-asi-type="asi-split">+1 op 2 abilities</button>';
            html += '<button class="asi-option" data-asi-level="' + lvl + '" data-asi-type="feat">Feat kiezen</button>';
            html += '</div>';
        } else if (choice.type === 'asi') {
            var parts = [];
            var abKeys = Object.keys(choice.abilities || {});
            for (var a = 0; a < abKeys.length; a++) {
                if (choice.abilities[abKeys[a]] > 0) {
                    parts.push(abKeys[a].toUpperCase() + ' +' + choice.abilities[abKeys[a]]);
                }
            }
            html += '<p class="asi-chosen">Gekozen: ' + parts.join(', ') + '</p>';
            if (canEdit(charId)) {
                html += '<button class="asi-option asi-reset" data-asi-level="' + lvl + '" data-asi-type="reset">Opnieuw kiezen</button>';
            }
        } else if (choice.type === 'feat') {
            html += '<p class="asi-chosen">Feat: <strong>' + escapeHtml(choice.feat) + '</strong></p>';
            if (canEdit(charId)) {
                html += '<button class="asi-option asi-reset" data-asi-level="' + lvl + '" data-asi-type="reset">Opnieuw kiezen</button>';
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
        html += '<button class="hp-btn hp-btn-damage" data-action="take-damage">Damage</button>';
        html += '<input type="number" class="hp-input" id="heal-input" min="0" placeholder="0">';
        html += '<button class="hp-btn hp-btn-heal" data-action="heal">Heal</button>';
        html += '<input type="number" class="hp-input" id="temp-hp-input" min="0" placeholder="0" value="' + tempHP + '">';
        html += '<button class="hp-btn hp-btn-temp" data-action="set-temp-hp">Temp HP</button>';
        html += '</div>';
    }
    html += '</div>';

    // === Death Saves (only when HP <= 0) ===
    if (currentHP <= 0) {
        var ds = state.deathSaves || { successes: 0, failures: 0 };
        html += '<div class="death-saves">';
        html += '<div class="death-save-group"><label>Successes</label><div class="death-save-dots">';
        for (var si = 0; si < 3; si++) {
            var sFilled = si < ds.successes ? ' filled' : '';
            html += '<div class="death-save-dot success' + sFilled + '" data-action="toggle-death-save" data-save-type="successes" data-save-idx="' + si + '"></div>';
        }
        html += '</div></div>';
        html += '<div class="death-save-group"><label>Failures</label><div class="death-save-dots">';
        for (var fi = 0; fi < 3; fi++) {
            var fFilled = fi < ds.failures ? ' filled' : '';
            html += '<div class="death-save-dot failure' + fFilled + '" data-action="toggle-death-save" data-save-type="failures" data-save-idx="' + fi + '"></div>';
        }
        html += '</div></div>';
        if (editable) {
            html += '<button class="hp-btn" data-action="reset-death-saves" style="margin-left:auto;">Reset</button>';
        }
        html += '</div>';
    }

    // === Inspiration ===
    html += '<div class="inspiration-toggle" ' + (editable ? 'data-action="toggle-inspiration"' : '') + '>';
    html += '<span class="inspiration-star' + (state.inspiration ? ' active' : '') + '">&#9733;</span>';
    html += '<span style="font-size:0.9rem;color:var(--text-dim)">Inspiration</span>';
    html += '</div>';

    // === Core Stats Grid ===
    html += '<div class="combat-stats">';
    html += '<div class="combat-stat"><span class="stat-value">' + ac + '</span><span class="stat-label">AC</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">' + speed + '</span><span class="stat-label">Speed</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">' + formatMod(dexMod) + '</span><span class="stat-label">Initiative</span></div>';
    html += '<div class="combat-stat"><span class="stat-value">+' + profBonus + '</span><span class="stat-label">Prof.</span></div>';
    var hitDiceRemaining = state.level - (state.hitDiceUsed || 0);
    html += '<div class="combat-stat"><span class="stat-value">' + hitDiceRemaining + hitDie + '</span><span class="stat-label">Hit Dice</span></div>';
    html += '</div>';

    // === Weapons ===
    if (config.weapons && config.weapons.length > 0) {
        html += '<div class="sheet-block">';
        html += '<h2>Wapens</h2>';
        html += renderWeaponsHTML(config, state);
        html += '</div>';
    }

    // === Sneak Attack for rogues ===
    if (config.className === 'rogue') {
        var sneakAttack = (DATA.rogue && DATA.rogue.sneakAttack) ? DATA.rogue.sneakAttack[state.level] || '1d6' : '1d6';
        html += '<div class="sheet-block">';
        html += '<p class="block-note">Sneak Attack: ' + sneakAttack + ' extra damage bij advantage of adjacent ally</p>';
        html += '</div>';
    }

    // === Metamagic for sorcerer ===
    if (config.className === 'sorcerer') {
        html += '<div class="sheet-block">';
        html += '<h2>Metamagic</h2>';
        html += renderMetamagicHTML(charId, config, state);
        html += '</div>';
    }

    // === Spell Slot Tracker (for casters) ===
    if (hasSpellcasting(config.className)) {
        html += '<div class="sheet-block">';
        html += '<h2>Spell Slots</h2>';
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
            html += '<button class="rest-btn" data-action="short-rest">Short Rest</button>';
            html += '<button class="rest-btn" data-action="long-rest">Long Rest</button>';
            html += '</div>';
        }
        html += '</div>';
    } else if (editable) {
        html += '<div class="rest-buttons">';
        html += '<button class="rest-btn" data-action="short-rest">Short Rest</button>';
        html += '<button class="rest-btn" data-action="long-rest">Long Rest</button>';
        html += '</div>';
    }

    // === Conditions ===
    var allConditions = ['Blinded','Charmed','Deafened','Frightened','Grappled','Incapacitated','Invisible','Paralyzed','Petrified','Poisoned','Prone','Restrained','Stunned','Unconscious'];
    var activeConditions = state.conditions || [];
    html += '<div class="sheet-block">';
    html += '<h2>Conditions</h2>';
    html += '<div class="conditions-grid">';
    for (var ci = 0; ci < allConditions.length; ci++) {
        var cond = allConditions[ci];
        var isActive = activeConditions.indexOf(cond) !== -1;
        html += '<span class="condition-tag' + (isActive ? ' active' : '') + '" data-action="toggle-condition" data-condition="' + escapeAttr(cond) + '">' + escapeHtml(cond) + '</span>';
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
        html += '</div>';
    }
    html += '</div>';
    return html;
}

function renderMetamagicHTML(charId, config, state) {
    if (state.level < 2) return '<p class="block-note">Metamagic wordt beschikbaar op level 2.</p>';

    var maxChoices = 0;
    if (state.level >= 2) maxChoices = 2;
    if (state.level >= 10) maxChoices = 3;
    if (state.level >= 17) maxChoices = 4;

    var allMetamagic = DATA.metamagic || [];
    var chosen = state.metamagic || [];
    var canChooseMore = chosen.length < maxChoices;

    var html = '<p class="block-note" style="margin-bottom:0.75rem;">Gekozen: ' + chosen.length + '/' + maxChoices + '</p>';
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
        return '<div class="tab-spells"><p class="block-note">Dit karakter heeft geen spellcasting.</p></div>';
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
        return '<div class="tab-spells"><p class="block-note">' + classDisplayName(className) + ' krijgt spellcasting op level ' + spellcastingStart + '.</p></div>';
    }

    // Determine prepared/known label
    var isPreparedCaster = (className === 'wizard' || className === 'druid' || className === 'paladin' || className === 'sorcerer');
    var preparedLabel = isPreparedCaster ? 'Voorbereid' : 'Bekend';

    var html = '<div class="tab-spells">';

    // Spell stats header
    html += '<div class="spell-header">';
    html += '<div class="spell-stat"><span class="label">Save DC</span><span class="value">' + spellDC + '</span></div>';
    html += '<div class="spell-stat"><span class="label">Attack</span><span class="value">' + formatMod(spellAttack) + '</span></div>';
    // Sorcerer-specific: sorcery points
    if (className === 'sorcerer') {
        var sorcPts = DATA.sorcerer.sorceryPoints[state.level] || 0;
        html += '<div class="spell-stat"><span class="label">Sorc Pts</span><span class="value">' + sorcPts + '</span></div>';
    }
    // Warlock-specific: pact slots
    if (isWarlock) {
        var wPactSlots = DATA.warlock.pactSlots[state.level] || 0;
        var wPactLevel = DATA.warlock.pactSlotLevel[state.level] || 1;
        html += '<div class="spell-stat"><span class="label">Pact Slots</span><span class="value">' + wPactSlots + ' (lvl ' + wPactLevel + ')</span></div>';
    }
    html += '<div class="spell-stat prepared-counter"><span class="label">' + preparedLabel + '</span><span class="value">' + preparedCount + '/' + maxPrepared + '</span></div>';
    html += '</div>';

    // Warlock note about short rest recovery
    if (isWarlock) {
        html += '<p class="block-note" style="margin-bottom:0.5rem;opacity:0.7;">Pact Magic slots herstellen na een short rest.</p>';
    }

    // Filter bar
    html += '<div class="spell-filter-bar">';
    html += '<button class="filter-btn' + (spellFilter === 'all' ? ' active' : '') + '" data-filter="all">Alle</button>';
    html += '<button class="filter-btn' + (spellFilter === 'prepared' ? ' active' : '') + '" data-filter="prepared">' + preparedLabel + '</button>';
    html += '<button class="filter-btn' + (spellFilter === 'favorites' ? ' active' : '') + '" data-filter="favorites">&#9733; Favorieten</button>';
    html += '</div>';

    // Cantrips (level 0)
    if (hasCantrips && maxCantrips > 0) {
        var cantripList = spellList[0] || [];
        html += '<h3 class="spell-level-header">Cantrips <span class="slots">altijd bekend &mdash; ' + state.cantrips.length + '/' + maxCantrips + '</span></h3>';
        html += '<div class="spell-grid">';
        for (var c = 0; c < cantripList.length; c++) {
            var spell = cantripList[c];
            var isSelected = state.cantrips.indexOf(spell.name) !== -1;
            var isFav = favorites.indexOf(spell.name) !== -1;
            if (spellFilter === 'prepared' && !isSelected) continue;
            if (spellFilter === 'favorites' && !isFav) continue;
            var cls = isSelected ? 'spell-toggle selected' : 'spell-toggle';
            var starCls = isFav ? 'spell-star favorited' : 'spell-star';
            html += '<button class="' + cls + '" data-spell="' + escapeAttr(spell.name) + '" data-level="0">';
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
                slotLabel = '(pact slots op level ' + pactSlotLevel + ')';
            } else {
                slotLabel = '0 slots';
            }
        } else {
            slotCount = spellSlots[lvl - 1] || 0;
            slotLabel = slotCount + ' slots';
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
            html += '<button class="' + cls2 + '" data-spell="' + escapeAttr(sp.name) + '" data-level="' + lvl + '">';
            html += '<span class="' + starCls2 + '" data-spell-star="' + escapeAttr(sp.name) + '">&#9733;</span> ';
            html += escapeHtml(sp.name) + '</button>';
        }
        html += '</div>';
    }

    if (displayMaxLevel < 9 && displayMaxLevel < maxSpellLevel) {
        html += '<p class="block-note" style="margin-top:1rem;opacity:0.5;">Hogere spell levels worden beschikbaar bij hogere levels.</p>';
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
        html += '<h2>Persoonlijkheid</h2>';
        var pFields = [
            { key: 'traits', label: 'Traits' },
            { key: 'ideal', label: 'Ideaal' },
            { key: 'bond', label: 'Band' },
            { key: 'flaw', label: 'Fout' },
            { key: 'fear', label: 'Angst' }
        ];
        for (var pf = 0; pf < pFields.length; pf++) {
            var pfKey = pFields[pf].key;
            var pfLabel = pFields[pf].label;
            var pfVal = personality[pfKey] || '';
            if (editable) {
                html += '<div class="personality-item editable-field" data-edit-field="personality.' + pfKey + '" data-char-id="' + charId + '">';
                html += '<h3>' + pfLabel + '</h3>';
                html += '<p class="field-display">' + escapeHtml(pfVal) + (!pfVal ? '<em class="placeholder-text">Klik om toe te voegen...</em>' : '') + '</p>';
                html += '<button class="edit-trigger" data-action="edit-field" data-field="personality.' + pfKey + '" title="Bewerken">&#9998;</button>';
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
        html += '<h2>Backstory</h2>';
        if (editable) {
            html += '<div class="editable-field" data-edit-field="backstory" data-char-id="' + charId + '">';
            html += '<p class="field-display">' + escapeHtml(config.backstory || '') + (!config.backstory ? '<em class="placeholder-text">Klik om backstory toe te voegen...</em>' : '') + '</p>';
            html += '<button class="edit-trigger" data-action="edit-field" data-field="backstory" title="Bewerken">&#9998;</button>';
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
        html += '<h2>Citaten</h2>';
        for (var q = 0; q < quotes.length; q++) {
            html += '<div class="quote-item">';
            html += '<blockquote>&ldquo;' + escapeHtml(quotes[q]) + '&rdquo;</blockquote>';
            if (editable) {
                html += '<button class="quote-remove-btn" data-action="remove-quote" data-quote-idx="' + q + '" title="Verwijderen">&#10005;</button>';
            }
            html += '</div>';
        }
        if (editable) {
            html += '<div class="quote-add-form">';
            html += '<input type="text" class="edit-input quote-add-input" placeholder="Nieuw citaat...">';
            html += '<button class="edit-save" data-action="add-quote">+ Toevoegen</button>';
            html += '</div>';
        }
        html += '</div>';
    }

    if (!editable && !config.backstory && !hasPersonality && quotes.length === 0) {
        html += '<p class="block-note">Nog geen verhaal geschreven voor dit karakter.</p>';
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
        encStatus = '&#128308; Overbelast (-20ft speed, disadvantage)';
        encClass = 'enc-heavy';
    } else if (totalWeight > strScore * 5) {
        encStatus = '&#9888;&#65039; Belast (-10ft speed)';
        encClass = 'enc-medium';
    } else {
        encStatus = '&#10003; OK';
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
    html += '<span class="weight-total">Gewicht: ' + totalWeight.toFixed(2) + ' / ' + capacity + ' lbs</span>';
    html += '<span class="encumbrance-status ' + encClass + '">' + encStatus + '</span>';
    if (editable) {
        html += '<button class="item-add-btn" data-action="add-item">+ Item toevoegen</button>';
    }
    html += '</div>';

    // Gold
    html += '<div class="gold-row">';
    html += '<span class="gold-label">Goud: </span>';
    if (editable) {
        html += '<input type="number" class="gold-input" value="' + (state.gold || 0) + '" min="0" step="1" data-action="update-gold">';
        html += '<span class="gold-suffix"> gp</span>';
    } else {
        html += '<span class="gold-amount">' + (state.gold || 0) + ' gp</span>';
    }
    html += '</div>';

    if (editable) {
        html += '<div class="item-add-form" style="display:none;">';
        html += '<input type="text" class="item-name-input" placeholder="Item naam..." list="item-suggestions">';
        html += '<datalist id="item-suggestions">' + datalistOptions + '</datalist>';
        html += '<input type="number" class="item-weight-input" placeholder="Gewicht (lbs)" step="0.25" min="0">';
        html += '<input type="text" class="item-notes-input" placeholder="Notities...">';
        html += '<button class="item-confirm-btn" data-action="confirm-item">&#10003;</button>';
        html += '<button class="item-cancel-btn" data-action="cancel-item">&#10005;</button>';
        html += '</div>';
    }

    html += '<div class="items-grid">';
    for (var idx = 0; idx < items.length; idx++) {
        var item = items[idx];
        html += '<div class="item-row">';
        html += '<span class="item-name">' + escapeHtml(item.name) + '</span>';
        html += '<span class="item-weight">' + item.weight + ' lbs</span>';
        html += '<span class="item-notes">' + (item.notes ? escapeHtml(item.notes) : '-') + '</span>';
        if (editable) {
            html += '<button class="item-remove" data-item-idx="' + idx + '">&#10005;</button>';
        }
        html += '</div>';
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
                    { id: 'world', name: 'Wereldkaart', image: null, isRoot: true, pins: [] }
                ]
            }
        ]
    };
}

function saveMapsData(data) {
    localStorage.setItem('dw_maps', JSON.stringify(data));
}

function renderMaps() {
    var data = getMapsData();
    var dims = data.dimensions || [];
    if (activeDimension >= dims.length) activeDimension = 0;
    var dim = dims[activeDimension] || { maps: [] };

    var html = '<div class="maps-page">';

    // Dimension tabs at top
    html += '<div class="maps-header">';
    html += '<h1>Kaarten</h1>';
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
        html += '<button class="btn btn-ghost btn-sm" data-action="map-back">&larr; Alle kaarten</button>';
        html += '<span class="map-title">' + escapeHtml(map.name) + '</span>';
        if (isDM()) {
            html += '<button class="btn btn-ghost btn-sm" data-action="add-pin">+ Pin toevoegen</button>';
            html += '<label class="btn btn-ghost btn-sm">Afbeelding wijzigen<input type="file" accept="image/*" data-action="update-map-image" data-map-id="' + map.id + '" style="display:none"></label>';
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
                html += '<label class="map-upload-prompt">Klik om een kaartafbeelding te uploaden<input type="file" accept="image/*" data-action="update-map-image" data-map-id="' + map.id + '" style="display:none"></label>';
            } else {
                html += '<p>De DM heeft nog geen afbeelding toegevoegd.</p>';
            }
            html += '</div>';
        }

        // Render pins
        var pins = map.pins || [];
        for (var pi = 0; pi < pins.length; pi++) {
            var pin = pins[pi];
            var pinClass = pin.targetMap ? 'map-pin has-link' : 'map-pin';
            html += '<div class="' + pinClass + '" style="left:' + pin.x + '%;top:' + pin.y + '%;" data-pin-idx="' + pi + '"';
            if (pin.targetMap) {
                html += ' data-action="goto-map" data-target="' + pin.targetMap + '"';
            }
            html += '>';
            html += '<div class="pin-dot"></div>';
            html += '<span class="pin-label">' + escapeHtml(pin.label) + '</span>';
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
            html += '<p>Klik op de kaart om een pin te plaatsen</p>';
            html += '<button class="btn btn-ghost btn-sm" data-action="cancel-add-pin">Annuleren</button>';
            html += '</div>';
        }

    } else {
        // MAP GRID MODE
        html += '<div class="maps-grid">';

        var maps = dim.maps || [];
        for (var gi = 0; gi < maps.length; gi++) {
            var gm = maps[gi];
            html += '<div class="map-card" data-action="open-map" data-map-id="' + gm.id + '">';
            if (gm.image) {
                html += '<img class="map-card-img" src="' + gm.image + '" alt="">';
            } else {
                html += '<div class="map-card-placeholder">&#128506;</div>';
            }
            html += '<div class="map-card-info">';
            html += '<span class="map-card-name">' + escapeHtml(gm.name) + '</span>';
            if (gm.isRoot) html += '<span class="map-card-badge">Hoofdkaart</span>';
            html += '<span class="map-card-pins">' + (gm.pins ? gm.pins.length : 0) + ' pins</span>';
            html += '</div>';
            if (isDM()) {
                html += '<button class="map-card-delete" data-action="delete-map" data-map-id="' + gm.id + '">&times;</button>';
            }
            html += '</div>';
        }

        if (isDM()) {
            html += '<div class="map-card map-card-add" data-action="add-map">';
            html += '<span class="map-card-add-icon">+</span>';
            html += '<span class="map-card-name">Nieuwe Kaart</span>';
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
}

function renderTimeline() {
    var data = getTimelineData();
    var chapters = data.chapters || [];

    if (activeChapter >= chapters.length) activeChapter = Math.max(0, chapters.length - 1);

    var html = '<div class="timeline-page">';
    html += '<h1>Tijdlijn</h1>';

    html += '<div class="timeline-layout">';

    // Left sidebar: chapter tabs
    html += '<div class="timeline-sidebar">';
    html += '<div class="timeline-chapters">';
    for (var i = 0; i < chapters.length; i++) {
        var ch = chapters[i];
        var activeClass = i === activeChapter ? ' active' : '';
        html += '<button class="chapter-tab' + activeClass + '" data-action="select-chapter" data-chapter="' + i + '">';
        html += '<span class="chapter-num">Chapter ' + (i + 1) + '</span>';
        html += '<span class="chapter-name">' + escapeHtml(ch.name) + '</span>';
        if (isDM()) {
            html += '<span class="chapter-edit" data-action="edit-chapter" data-chapter="' + i + '" title="Bewerken">&#9998;</span>';
        }
        html += '</button>';
    }
    html += '</div>';

    if (isDM()) {
        html += '<button class="btn btn-ghost btn-sm" data-action="add-chapter" style="margin-top:0.75rem;width:100%;">+ Chapter</button>';
    }
    html += '</div>';

    // Right: events for active chapter
    html += '<div class="timeline-main">';

    if (chapters.length === 0) {
        html += '<div class="timeline-empty">';
        html += '<p class="text-dim">Nog geen chapters. De DM kan chapters toevoegen.</p>';
        html += '</div>';
    } else {
        var ch = chapters[activeChapter];
        html += '<div class="timeline-chapter-header">';
        html += '<h2>Chapter ' + (activeChapter + 1) + ': ' + escapeHtml(ch.name) + '</h2>';
        if (isDM()) {
            html += '<button class="btn btn-primary btn-sm" data-action="add-event">+ Event</button>';
        }
        html += '</div>';

        // Add event form (hidden by default)
        if (isDM()) {
            html += '<div class="timeline-add-form" id="event-add-form" style="display:none;">';
            html += '<input type="text" class="edit-input" id="ev-title" placeholder="Event titel">';
            html += '<textarea class="edit-textarea" id="ev-desc" placeholder="Beschrijving" style="min-height:60px;"></textarea>';
            html += '<div style="display:flex;gap:0.5rem;">';
            html += '<input type="text" class="edit-input" id="ev-session" placeholder="Sessie #" style="width:80px;">';
            html += '<select class="edit-input" id="ev-type" style="flex:1;"><option value="quest">Quest</option><option value="danger">Gevaar</option><option value="magic">Magie</option><option value="discovery">Ontdekking</option><option value="social">Sociaal</option><option value="combat">Gevecht</option></select>';
            html += '</div>';
            html += '<div class="edit-actions">';
            html += '<button class="edit-save" data-action="save-event">Opslaan</button>';
            html += '<button class="edit-cancel" data-action="cancel-event">Annuleren</button>';
            html += '</div>';
            html += '</div>';
        }

        // Events
        var events = ch.events || [];
        if (events.length === 0) {
            html += '<p class="text-dim" style="padding:2rem 0;">Nog geen events in dit chapter.</p>';
        } else {
            html += '<div class="timeline">';
            for (var j = 0; j < events.length; j++) {
                var ev = events[j];
                html += '<div class="timeline-event timeline-' + (ev.type || 'quest') + '">';
                html += '<div class="timeline-marker"></div>';
                html += '<div class="timeline-content">';
                if (ev.session) html += '<span class="timeline-session">Sessie ' + escapeHtml(ev.session) + '</span>';
                html += '<h3>' + escapeHtml(ev.title) + '</h3>';
                html += '<p>' + escapeHtml(ev.desc) + '</p>';
                if (isDM()) {
                    html += '<div class="event-actions">';
                    html += '<button class="btn btn-ghost btn-sm" data-action="edit-event" data-event="' + j + '">Bewerken</button>';
                    html += '<button class="btn btn-ghost btn-sm" data-action="delete-event" data-event="' + j + '" style="color:var(--danger);">Verwijderen</button>';
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
    html += '<h1>Lore</h1>';
    if (isDM()) {
        html += '<a class="btn btn-primary" href="#/lore/new">+ Artikel Toevoegen</a>';
    }
    html += '</div>';

    // Always show party link
    html += '<div class="lore-grid">';
    html += '<a class="lore-card" href="#/lore/party">';
    html += '<h3>De Party</h3>';
    html += '<p>Alle avonturiers in de campagne.</p>';
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

    if (!article) return '<div class="page-placeholder"><h2>Artikel niet gevonden</h2><a class="btn btn-ghost" href="#/lore">Terug naar Lore</a></div>';

    var html = '<div class="lore-page lore-article">';
    html += '<a class="btn btn-ghost btn-sm" href="#/lore">&larr; Terug naar Lore</a>';
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
        html += '<a class="btn btn-ghost btn-sm" href="#/lore/edit-' + article.id + '">Bewerken</a>';
        html += '<button class="btn btn-ghost btn-sm" data-action="delete-lore" data-article-id="' + article.id + '" style="color:var(--danger);">Verwijderen</button>';
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
    html += '<a class="btn btn-ghost btn-sm" href="#/lore">&larr; Terug naar Lore</a>';
    html += '<h1>' + (isEdit ? 'Artikel Bewerken' : 'Nieuw Artikel') + '</h1>';
    html += '<div class="lore-editor">';
    html += '<input type="text" class="edit-input" id="lore-title" placeholder="Titel" value="' + escapeAttr(title) + '">';
    html += '<textarea class="edit-textarea lore-content-editor" id="lore-content" placeholder="Inhoud... (gebruik ## voor koppen, lege regels voor alinea\'s)">' + escapeHtml(content) + '</textarea>';
    html += '<div class="edit-actions">';
    html += '<button class="edit-save" data-action="save-lore"' + (isEdit ? ' data-edit-id="' + editId + '"' : '') + '>Opslaan</button>';
    html += '<a class="edit-cancel" href="#/lore">Annuleren</a>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
}

function renderLoreParty() {
    var html = '<div class="lore-page lore-article">';
    html += '<a class="btn btn-ghost btn-sm" href="#/lore">&larr; Terug naar Lore</a>';
    html += '<h1>De Party</h1>';
    html += '<p class="section-intro">Acht avonturiers. Verschillende achtergronden. E\u00e9n bestemming.</p>';

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
    localStorage.setItem('dw_notes_' + userId, JSON.stringify(data));
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

    // Sort by updated (newest first)
    filtered.sort(function(a, b) { return (b.updated || 0) - (a.updated || 0); });

    var html = '<div class="notes-page">';
    html += '<div class="notes-header">';
    html += '<h1>Notities</h1>';
    html += '<button class="btn btn-primary" data-action="new-note">+ Nieuwe Notitie</button>';
    html += '</div>';

    // Search bar
    html += '<div class="notes-search">';
    html += '<input type="text" class="notes-search-input" data-action="search-notes" placeholder="Zoeken in notities..." value="' + escapeAttr(notesSearch) + '">';
    html += '</div>';

    // Category filter tabs
    html += '<div class="notes-categories">';
    html += '<button class="notes-cat-btn' + (notesFilter === 'all' ? ' active' : '') + '" data-action="filter-notes" data-cat="all">Alle</button>';
    for (var ci = 0; ci < TAG_CATEGORIES.length; ci++) {
        var cat = TAG_CATEGORIES[ci];
        var count = notes.filter(function(n) { return n.tagCategory === cat.id; }).length;
        html += '<button class="notes-cat-btn' + (notesFilter === cat.id ? ' active' : '') + '" data-action="filter-notes" data-cat="' + cat.id + '" style="--cat-color:' + cat.color + '">';
        html += cat.icon + ' ' + cat.name;
        if (count > 0) html += ' <span class="notes-cat-count">' + count + '</span>';
        html += '</button>';
    }
    html += '</div>';

    // Notes grid
    if (filtered.length === 0) {
        html += '<div class="notes-empty">';
        if (notes.length === 0) {
            html += '<p>Je hebt nog geen notities.</p>';
            html += '<p class="text-dim">Maak notities over NPCs, plaatsen, events en meer.</p>';
        } else {
            html += '<p>Geen notities gevonden voor deze filter.</p>';
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

            html += '<div class="note-card" data-action="view-note" data-note-id="' + note.id + '" style="--cat-color:' + cat.color + '">';

            if (note.image && note.layout !== 'text-only') {
                html += '<div class="note-card-img"><img src="' + note.image + '" alt=""></div>';
            }

            html += '<div class="note-card-body">';
            html += '<div class="note-card-cat">' + cat.icon + ' ' + cat.name + '</div>';
            html += '<h3 class="note-card-title">' + escapeHtml(note.title || 'Naamloos') + '</h3>';
            html += '<p class="note-card-preview">' + escapeHtml((note.content || '').substring(0, 120)) + (note.content && note.content.length > 120 ? '...' : '') + '</p>';

            if (note.tags && note.tags.length > 0) {
                html += '<div class="note-card-tags">';
                for (var ti = 0; ti < Math.min(note.tags.length, 4); ti++) {
                    html += '<span class="note-tag">' + escapeHtml(note.tags[ti]) + '</span>';
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

    var title = note ? note.title : '';
    var content = note ? note.content : '';
    var tags = note ? (note.tags || []).join(', ') : '';
    var category = note ? note.tagCategory : 'other';
    var layout = note ? note.layout : 'text-only';
    var image = note ? note.image : null;

    var html = '<div class="notes-page">';
    html += '<div class="notes-header">';
    html += '<button class="btn btn-ghost" data-action="back-to-notes">&larr; Terug</button>';
    html += '<h1>' + (note ? 'Notitie Bewerken' : 'Nieuwe Notitie') + '</h1>';
    html += '</div>';

    html += '<div class="note-editor">';

    // Title
    html += '<input type="text" class="edit-input note-title-input" id="note-title" placeholder="Titel" value="' + escapeAttr(title) + '">';

    // Category selector
    html += '<div class="note-category-picker">';
    html += '<label class="text-dim" style="font-size:0.8rem;">Categorie:</label>';
    html += '<div class="note-cat-options">';
    for (var ci = 0; ci < TAG_CATEGORIES.length; ci++) {
        var ecat = TAG_CATEGORIES[ci];
        html += '<button class="note-cat-option' + (category === ecat.id ? ' active' : '') + '" data-action="pick-note-cat" data-cat="' + ecat.id + '" style="--cat-color:' + ecat.color + '">' + ecat.icon + ' ' + ecat.name + '</button>';
    }
    html += '</div>';
    html += '</div>';

    // Layout selector
    html += '<div class="note-layout-picker">';
    html += '<label class="text-dim" style="font-size:0.8rem;">Indeling:</label>';
    html += '<div class="note-layout-options">';
    var layouts = [
        { id: 'text-only', icon: '\ud83d\udcdd', label: 'Alleen tekst' },
        { id: 'image-top', icon: '\ud83d\uddbc\ufe0f\u2191', label: 'Afbeelding boven' },
        { id: 'image-right', icon: '\ud83d\udcdd\ud83d\uddbc\ufe0f', label: 'Afbeelding rechts' },
        { id: 'image-left', icon: '\ud83d\uddbc\ufe0f\ud83d\udcdd', label: 'Afbeelding links' }
    ];
    for (var li = 0; li < layouts.length; li++) {
        var lo = layouts[li];
        html += '<button class="note-layout-option' + (layout === lo.id ? ' active' : '') + '" data-action="pick-note-layout" data-layout="' + lo.id + '">' + lo.icon + '<br><span>' + lo.label + '</span></button>';
    }
    html += '</div>';
    html += '</div>';

    // Image upload (if layout includes image)
    if (layout !== 'text-only') {
        html += '<div class="note-image-section">';
        if (image) {
            html += '<div class="note-image-preview"><img src="' + image + '" alt=""><button class="btn btn-ghost btn-sm" data-action="remove-note-image">Verwijderen</button></div>';
        } else {
            html += '<label class="note-image-upload"><span>+ Afbeelding toevoegen</span><input type="file" accept="image/*" data-action="upload-note-image" style="display:none"></label>';
        }
        html += '</div>';
    }

    // Content
    html += '<textarea class="edit-textarea note-content-input" id="note-content" placeholder="Schrijf je notitie...">' + escapeHtml(content) + '</textarea>';

    // Tags
    html += '<div class="note-tags-section">';
    html += '<label class="text-dim" style="font-size:0.8rem;">Tags (gescheiden door komma\'s):</label>';
    html += '<input type="text" class="edit-input" id="note-tags" placeholder="bijv. Velthaven, marktplein, quest" value="' + escapeAttr(tags) + '">';
    html += '</div>';

    // Save/Delete
    html += '<div class="note-editor-actions">';
    html += '<button class="btn btn-primary" data-action="save-note"' + (note ? ' data-note-id="' + note.id + '"' : '') + '>Opslaan</button>';
    if (note) {
        html += '<button class="btn btn-ghost" data-action="delete-note" data-note-id="' + note.id + '" style="color:var(--danger);">Verwijderen</button>';
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
    if (!note) return '<div class="page-placeholder"><h2>Notitie niet gevonden</h2></div>';

    var cat = null;
    for (var ci = 0; ci < TAG_CATEGORIES.length; ci++) {
        if (TAG_CATEGORIES[ci].id === note.tagCategory) { cat = TAG_CATEGORIES[ci]; break; }
    }
    if (!cat) cat = TAG_CATEGORIES[5];

    var html = '<div class="notes-page">';
    html += '<div class="notes-header">';
    html += '<button class="btn btn-ghost" data-action="back-to-notes">&larr; Terug</button>';
    html += '<button class="btn btn-ghost btn-sm" data-action="edit-note" data-note-id="' + note.id + '">Bewerken</button>';
    html += '</div>';

    html += '<div class="note-view note-layout-' + (note.layout || 'text-only') + '">';

    if (note.image && note.layout === 'image-top') {
        html += '<div class="note-view-img"><img src="' + note.image + '" alt=""></div>';
    }

    html += '<div class="note-view-content">';
    if (note.image && note.layout === 'image-left') {
        html += '<div class="note-view-img-side"><img src="' + note.image + '" alt=""></div>';
    }

    html += '<div class="note-view-text">';
    html += '<div class="note-view-cat" style="color:' + cat.color + '">' + cat.icon + ' ' + cat.name + '</div>';
    html += '<h1>' + escapeHtml(note.title || 'Naamloos') + '</h1>';

    var paragraphs = (note.content || '').split('\n\n');
    for (var p = 0; p < paragraphs.length; p++) {
        if (paragraphs[p].trim()) html += '<p>' + escapeHtml(paragraphs[p].trim()) + '</p>';
    }

    if (note.tags && note.tags.length > 0) {
        html += '<div class="note-view-tags">';
        for (var ti = 0; ti < note.tags.length; ti++) {
            html += '<span class="note-tag">' + escapeHtml(note.tags[ti]) + '</span>';
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
    if (spellData.time) tooltipHtml += '<p class="spell-meta"><strong>Tijd:</strong> ' + escapeHtml(spellData.time) + '</p>';
    if (spellData.range) tooltipHtml += '<p class="spell-meta"><strong>Range:</strong> ' + escapeHtml(spellData.range) + '</p>';
    if (spellData.dur) tooltipHtml += '<p class="spell-meta"><strong>Duur:</strong> ' + escapeHtml(spellData.dur) + '</p>';
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

    var lines = '<strong>' + abLabel + ' Breakdown</strong><br>';
    lines += 'Base (Standard Array): ' + breakdown.baseArray + '<br>';
    if (breakdown.racialBonus > 0) {
        lines += 'Racial: +' + breakdown.racialBonus + '<br>';
    }
    if (breakdown.asiDetails.length > 0) {
        for (var i = 0; i < breakdown.asiDetails.length; i++) {
            lines += breakdown.asiDetails[i] + '<br>';
        }
    }
    lines += '<strong>Totaal: ' + breakdown.total + '</strong>';

    if (state.customAbilities && state.customAbilities[ability] !== undefined && state.customAbilities[ability] !== null) {
        lines += '<br><em>(Handmatig overschreven naar ' + state.customAbilities[ability] + ')</em>';
    }

    showTooltipPopup(lines, anchorEl);
}

function showInfoTooltip(value, anchorEl) {
    var tip = TOOLTIPS[value];
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
            showWarning('Ongeldig JSON bestand.');
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
    html += '<h2 style="color:' + accentColor + '">Level Up!</h2>';
    html += '<p class="levelup-subtitle">Level ' + state.level + ' \u2192 Level ' + newLevel + '</p>';
    html += '</div>';

    // --- HP gain ---
    html += '<div class="levelup-section">';
    html += '<h3>\u2764\uFE0F Hit Points</h3>';
    html += '<p style="font-size:1.1rem;color:var(--text-bright)">+' + hpGain + ' HP</p>';
    html += '<p>d' + hitDie + ' gemiddeld (' + avgHP + ') + CON mod (' + formatMod(conMod) + ')</p>';
    html += '<div style="display:flex;align-items:center;gap:0.75rem;margin-top:0.5rem;">';
    html += '<button class="levelup-choice" data-action="levelup-roll-hp">Handmatig rollen</button>';
    html += '<span id="levelup-hp-result" style="color:var(--text-bright);font-weight:600;"></span>';
    html += '<input type="hidden" id="levelup-hp-value" value="' + hpGain + '">';
    html += '</div>';
    html += '</div>';

    // --- Prof bonus change ---
    if (profBonus > oldProfBonus) {
        html += '<div class="levelup-section">';
        html += '<h3>Proficiency Bonus</h3>';
        html += '<p style="font-size:1.1rem;color:var(--text-bright)">+' + oldProfBonus + ' \u2192 +' + profBonus + '</p>';
        html += '</div>';
    }

    // --- New features ---
    if (classFeatures.length > 0 || subFeatures.length > 0) {
        html += '<div class="levelup-section">';
        html += '<h3>Nieuwe Features</h3>';
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
        html += '<h3>Subclass Kiezen</h3>';
        html += '<p>Kies je subclass:</p>';
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
        html += '<h3>Ability Score Improvement</h3>';
        html += '<p>Kies een verbetering:</p>';
        html += '<div class="levelup-choices">';
        html += '<button class="levelup-choice" data-action="levelup-asi" data-asi-mode="asi-two">+2 op 1 ability</button>';
        html += '<button class="levelup-choice" data-action="levelup-asi" data-asi-mode="asi-split">+1 op 2 abilities</button>';
        html += '<button class="levelup-choice" data-action="levelup-asi" data-asi-mode="feat">Feat kiezen</button>';
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
            html += '<h3>Sneak Attack</h3>';
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
            html += '<h3>Sorcery Points</h3>';
            html += '<p style="font-size:1.1rem;color:var(--text-bright)">' + oldSP + ' \u2192 ' + newSP + '</p>';
            html += '</div>';
        }
    }

    // --- Spell slot changes ---
    if (spellSlotChanges.length > 0) {
        html += '<div class="levelup-section">';
        html += '<h3>Spell Slots</h3>';
        for (var ssc = 0; ssc < spellSlotChanges.length; ssc++) {
            html += '<p style="color:var(--text-bright)">' + escapeHtml(spellSlotChanges[ssc]) + '</p>';
        }
        html += '</div>';
    }

    // --- New cantrip ---
    if (newCantrip) {
        html += '<div class="levelup-section">';
        html += '<h3>Nieuwe Cantrip</h3>';
        html += '<p>Je kunt een extra cantrip kiezen bij je spell lijst.</p>';
        html += '</div>';
    }

    // --- New metamagic ---
    if (newMetamagic) {
        html += '<div class="levelup-section">';
        html += '<h3>Nieuwe Metamagic</h3>';
        html += '<p>Je kunt een extra Metamagic optie kiezen bij je class features.</p>';
        html += '</div>';
    }

    // --- Actions ---
    html += '<div class="levelup-actions">';
    html += '<button class="wizard-btn wizard-btn-primary" data-action="confirm-levelup">Bevestig Level Up</button>';
    html += '<button class="wizard-btn wizard-btn-secondary" data-action="cancel-levelup">Annuleren</button>';
    html += '</div>';

    html += '</div></div>';

    document.body.insertAdjacentHTML('beforeend', html);

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
            return;
        }

        // Cancel
        if (tgt.dataset.action === 'cancel-levelup') {
            modal.remove();
            return;
        }

        // Manual HP roll
        if (tgt.dataset.action === 'levelup-roll-hp') {
            var rolled = Math.floor(Math.random() * hitDie) + 1;
            var rolledHP = rolled + conMod;
            var resultEl = document.getElementById('levelup-hp-result');
            var valueEl = document.getElementById('levelup-hp-value');
            if (resultEl) resultEl.textContent = 'Gerolled: ' + rolled + ' + CON ' + formatMod(conMod) + ' = ' + rolledHP + ' HP';
            if (valueEl) valueEl.value = rolledHP;
            tgt.textContent = 'Opnieuw rollen';
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
                    showWarning('Kies eerst een subclass.');
                    return;
                }
            }
            if (isASI && !asiChoice) {
                showWarning('Kies eerst een ASI of feat.');
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
        html += '<p style="color:var(--text-dim);font-size:0.85rem;margin-bottom:0.5rem;">Punten over: ' + (maxPoints - totalSpent) + '</p>';
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
            html += '<p style="color:var(--accent);font-size:0.85rem;margin-top:0.5rem;">ASI geselecteerd!</p>';
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
        '<h3>Karakter Resetten</h3>' +
        '<p>Weet je het zeker? Dit zet het karakter terug naar level 1.</p>' +
        '<div class="modal-actions">' +
        '<button class="modal-btn modal-btn-primary" data-modal-action="save-then-reset">Opslaan voor reset</button>' +
        '<button class="modal-btn modal-btn-danger" data-modal-action="confirm-reset">Reset</button>' +
        '<button class="modal-btn modal-btn-cancel" data-modal-action="cancel-reset">Annuleren</button>' +
        '</div></div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
        var action = e.target.dataset.modalAction;
        if (!action) {
            if (e.target === modal) modal.remove();
            return;
        }
        if (action === 'save-then-reset') {
            exportCharacter(charId, state);
            performReset(charId);
            modal.remove();
        } else if (action === 'confirm-reset') {
            performReset(charId);
            modal.remove();
        } else if (action === 'cancel-reset') {
            modal.remove();
        }
    });
}

function performReset(charId) {
    localStorage.removeItem('dw_char_' + charId);
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
        html += '<h4>Level ' + level + ' \u2014 ' + (mode === 'asi-two' ? '+2 op 1 ability' : '+1 op 2 abilities') + '</h4>';
        html += '<p class="block-note">Punten over: ' + (maxPoints - totalSpent) + '</p>';
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
        html += '<button class="asi-option" data-action="asi-confirm"' + (totalSpent === maxPoints ? '' : ' disabled') + '>Bevestigen</button>';
        html += '<button class="asi-option asi-reset" data-action="asi-cancel">Annuleren</button>';
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
    html += '<h4>Level ' + level + ' \u2014 Feat kiezen</h4>';
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
    html += '<button class="asi-option asi-reset" data-action="feat-cancel" style="margin-top:0.75rem;">Annuleren</button>';
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
            showWarning('Maximum aantal cantrips bereikt (' + maxCantrips + '). Verwijder er eerst een.');
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
            showWarning('Maximum aantal ' + label + ' spells bereikt (' + maxPrepared + '). Verwijder er eerst een.');
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
            showWarning('Maximum aantal metamagic opties bereikt (' + maxChoices + ').');
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
                showWarning('Afbeelding te groot om op te slaan.');
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
                    if (errorEl) { errorEl.textContent = 'Gebruiker niet gevonden.'; errorEl.style.display = 'block'; }
                    return;
                }

                if (USERS[matchedId].password !== password) {
                    if (errorEl) { errorEl.textContent = 'Onjuist wachtwoord.'; errorEl.style.display = 'block'; }
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
        if (target.matches('[data-action="pick-note-layout"]')) {
            document.querySelectorAll('.note-layout-option').forEach(function(b) { b.classList.remove('active'); });
            target.classList.add('active');
            var newLayout = target.dataset.layout;
            var currentHasImage = document.querySelector('.note-image-section');
            if ((newLayout === 'text-only' && currentHasImage) || (newLayout !== 'text-only' && !currentHasImage)) {
                if (currentHasImage) currentHasImage.style.display = newLayout === 'text-only' ? 'none' : 'block';
            }
            return;
        }

        // Save note
        if (target.matches('[data-action="save-note"]')) {
            var noteTitleEl = document.getElementById('note-title');
            var noteContentEl = document.getElementById('note-content');
            var noteTagsEl = document.getElementById('note-tags');
            var noteActiveCat = document.querySelector('.note-cat-option.active');
            var noteActiveLayout = document.querySelector('.note-layout-option.active');
            var noteImg = document.querySelector('.note-image-preview img');

            if (!noteTitleEl || !noteTitleEl.value.trim()) { alert('Vul een titel in.'); return; }

            var noteData = getNotesData();
            var saveNoteId = target.dataset.noteId;
            var noteTags = noteTagsEl ? noteTagsEl.value.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
            var noteCategory = noteActiveCat ? noteActiveCat.dataset.cat : 'other';
            var noteLayout = noteActiveLayout ? noteActiveLayout.dataset.layout : 'text-only';
            var noteImage = noteImg ? noteImg.src : null;

            if (saveNoteId) {
                for (var sni = 0; sni < noteData.notes.length; sni++) {
                    if (noteData.notes[sni].id === saveNoteId) {
                        noteData.notes[sni].title = noteTitleEl.value.trim();
                        noteData.notes[sni].content = noteContentEl ? noteContentEl.value : '';
                        noteData.notes[sni].tags = noteTags;
                        noteData.notes[sni].tagCategory = noteCategory;
                        noteData.notes[sni].layout = noteLayout;
                        if (noteImage && noteImage.indexOf('data:') === 0) noteData.notes[sni].image = noteImage;
                        noteData.notes[sni].updated = Date.now();
                        break;
                    }
                }
            } else {
                noteData.notes.push({
                    id: 'n' + Date.now(),
                    title: noteTitleEl.value.trim(),
                    content: noteContentEl ? noteContentEl.value : '',
                    tags: noteTags,
                    tagCategory: noteCategory,
                    image: noteImage && noteImage.indexOf('data:') === 0 ? noteImage : null,
                    layout: noteLayout,
                    created: Date.now(),
                    updated: Date.now()
                });
            }

            saveNotesData(noteData);
            navigate('/notes');
            return;
        }

        // Delete note
        if (target.matches('[data-action="delete-note"]')) {
            if (confirm('Notitie verwijderen?')) {
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
            renderApp();
            return;
        }

        // Clear initiative
        if (target.matches('[data-action="clear-init"]')) {
            localStorage.setItem('dw_initiative', JSON.stringify({entries:[], currentTurn:0, round:1}));
            renderApp();
            return;
        }

        // Dice roller
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
                    saveBtn.textContent = 'Opslaan';
                    var cancelBtn = document.createElement('button');
                    cancelBtn.className = 'edit-cancel';
                    cancelBtn.setAttribute('data-action', 'cancel-edit');
                    cancelBtn.textContent = 'Annuleren';
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
                        saveCharConfigEdit(charId, 'name', newName);
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
                    saveCharConfigEdit(charId, 'accentColor', newColor);
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
                sSaveBtn.textContent = 'Opslaan';
                var sCancelBtn = document.createElement('button');
                sCancelBtn.className = 'edit-cancel';
                sCancelBtn.setAttribute('data-action', 'cancel-edit');
                sCancelBtn.textContent = 'Annuleren';
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
                    saveCharConfigEdit(charId, 'appearance', curAppearance);
                } else if (saveFieldName.indexOf('personality.') === 0) {
                    var ppKey = saveFieldName.replace('personality.', '');
                    var curPersonality = loadCharConfigEdits(charId).personality || {};
                    curPersonality[ppKey] = newVal;
                    saveCharConfigEdit(charId, 'personality', curPersonality);
                } else if (saveFieldName === 'backstory') {
                    saveCharConfigEdit(charId, 'backstory', newVal);
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
                        saveCharConfigEdit(charId, 'quotes', curQuotes);
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
                    saveCharConfigEdit(charId, 'quotes', curQ);
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
            var n = parseInt(localStorage.getItem('dw_session_number') || '1');
            localStorage.setItem('dw_session_number', String(n + 1));
            renderApp();
            return;
        }
        if (target.matches('[data-action="session-minus"]')) {
            var n = parseInt(localStorage.getItem('dw_session_number') || '1');
            if (n > 1) localStorage.setItem('dw_session_number', String(n - 1));
            renderApp();
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
            var chName = prompt('Naam van het nieuwe chapter:');
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

        // Edit event (populate form)
        if (target.matches('[data-action="edit-event"]')) {
            var evIdx = parseInt(target.dataset.event);
            var tlData = getTimelineData();
            var ch = tlData.chapters[activeChapter];
            if (ch && ch.events[evIdx]) {
                var ev = ch.events[evIdx];
                var form = document.getElementById('event-add-form');
                if (form) {
                    form.style.display = 'block';
                    document.getElementById('ev-title').value = ev.title;
                    document.getElementById('ev-desc').value = ev.desc || '';
                    document.getElementById('ev-session').value = ev.session || '';
                    document.getElementById('ev-type').value = ev.type || 'quest';
                    var saveBtn = form.querySelector('[data-action="save-event"]');
                    if (saveBtn) saveBtn.dataset.editIdx = evIdx;
                }
            }
            return;
        }

        // Edit chapter name
        if (target.matches('[data-action="edit-chapter"]')) {
            var chIdx = parseInt(target.dataset.chapter);
            var tlData = getTimelineData();
            if (tlData.chapters[chIdx]) {
                var newName = prompt('Nieuwe naam voor het chapter:', tlData.chapters[chIdx].name);
                if (newName && newName.trim()) {
                    tlData.chapters[chIdx].name = newName.trim();
                    saveTimelineData(tlData);
                    renderApp();
                }
            }
            return;
        }

        // Save event (supports edit mode)
        if (target.matches('[data-action="save-event"]')) {
            var titleEl = document.getElementById('ev-title');
            var descEl = document.getElementById('ev-desc');
            var sessionEl = document.getElementById('ev-session');
            var typeEl = document.getElementById('ev-type');
            if (titleEl && titleEl.value.trim()) {
                var tlData = getTimelineData();
                var editIdx = target.dataset.editIdx;
                if (editIdx !== undefined && editIdx !== '') {
                    // Update existing event
                    var ch = tlData.chapters[activeChapter];
                    if (ch && ch.events[parseInt(editIdx)]) {
                        ch.events[parseInt(editIdx)].title = titleEl.value.trim();
                        ch.events[parseInt(editIdx)].desc = descEl ? descEl.value.trim() : '';
                        ch.events[parseInt(editIdx)].session = sessionEl ? sessionEl.value.trim() : '';
                        ch.events[parseInt(editIdx)].type = typeEl ? typeEl.value : 'quest';
                    }
                    delete target.dataset.editIdx;
                } else {
                    // New event
                    if (tlData.chapters[activeChapter]) {
                        tlData.chapters[activeChapter].events.push({
                            id: 'ev' + Date.now(),
                            title: titleEl.value.trim(),
                            desc: descEl ? descEl.value.trim() : '',
                            session: sessionEl ? sessionEl.value.trim() : '',
                            type: typeEl ? typeEl.value : 'quest'
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
            var dimName = prompt('Naam van de dimensie:');
            if (dimName && dimName.trim()) {
                var mData = getMapsData();
                mData.dimensions.push({ id: 'dim' + Date.now(), name: dimName.trim(), maps: [{ id: 'map' + Date.now(), name: 'Hoofdkaart', image: null, isRoot: true, pins: [] }] });
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
            renderApp();
            return;
        }

        // Add map
        if (target.matches('[data-action="add-map"]') || target.closest('[data-action="add-map"]')) {
            var mapName = prompt('Naam van de kaart:');
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

        // Delete map
        if (target.matches('[data-action="delete-map"]')) {
            e.stopPropagation();
            var delMapId = target.dataset.mapId;
            if (confirm('Kaart verwijderen?')) {
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

        // Goto linked map (pin click)
        if (target.matches('[data-action="goto-map"]') || target.closest('[data-action="goto-map"]')) {
            var gotoEl = target.closest('[data-action="goto-map"]') || target;
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
                var px = ((e.clientX - rect.left) / rect.width) * 100;
                var py = ((e.clientY - rect.top) / rect.height) * 100;

                var pinLabel = prompt('Label voor deze pin:');
                if (pinLabel && pinLabel.trim()) {
                    var mData = getMapsData();
                    var mDim = mData.dimensions[activeDimension];
                    var currentMap = null;
                    for (var cmi = 0; cmi < mDim.maps.length; cmi++) {
                        if (mDim.maps[cmi].id === activeMapId) { currentMap = mDim.maps[cmi]; break; }
                    }

                    if (currentMap) {
                        var otherMaps = mDim.maps.filter(function(m) { return m.id !== activeMapId; });
                        var targetMapId = null;

                        if (otherMaps.length > 0) {
                            var linkChoice = prompt('Link naar kaart? (leeg = geen link)\n' + otherMaps.map(function(m, i) { return (i+1) + '. ' + m.name; }).join('\n'));
                            if (linkChoice && parseInt(linkChoice) > 0) {
                                var linkIdx = parseInt(linkChoice) - 1;
                                if (otherMaps[linkIdx]) targetMapId = otherMaps[linkIdx].id;
                            }
                        }

                        currentMap.pins.push({
                            id: 'pin' + Date.now(),
                            x: Math.round(px * 10) / 10,
                            y: Math.round(py * 10) / 10,
                            label: pinLabel.trim(),
                            targetMap: targetMapId
                        });
                        saveMapsData(mData);
                    }
                }
                addingPin = false;
                renderApp();
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
            if (artId && confirm('Weet je zeker dat je dit artikel wilt verwijderen?')) {
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
                            showWarning('Kaartafbeelding te groot om op te slaan.');
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
                            noteSection.innerHTML = '<div class="note-image-preview"><img src="' + noteBase64 + '" alt=""><button class="btn btn-ghost btn-sm" data-action="remove-note-image">Verwijderen</button></div>';
                        }
                    };
                    nimg.src = ev.target.result;
                };
                noteReader.readAsDataURL(noteFile);
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
// Section 31: Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    initRouter();
});

// data-rules.js — 2024 PHB rule registries for the level-up flow and the Build
// overview (Metadocs/LevelingUp/L4-Design.md). Loaded right after data.js; kept
// separate so the big generated tables don't collide with edits to data.js.
// Facts only (counts, timing, schools); descriptive rules text lives in data.js.

// ---- How many options a character KNOWS at a class level (index = level) ----
// Level-up asks for (total − known), so characters whose earlier picks were
// never recorded self-heal at their next level-up.
DATA.choiceTotals = {
    invocations:     { warlock:      [0, 1, 3, 3, 3, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 10, 10] },
    metamagic:       { sorcerer:     [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 4, 4, 4, 4, 4, 4, 4, 6, 6, 6, 6] },
    wildShapeForms:  { druid:        [0, 0, 4, 4, 6, 6, 6, 6, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8] },
    maneuvers:       { battleMaster: [0, 0, 0, 3, 3, 3, 3, 5, 5, 5, 7, 7, 7, 7, 7, 9, 9, 9, 9, 9, 9] },
    weaponMasteries: {
        barbarian: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
        fighter:   [0, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6],
        paladin:   [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        ranger:    [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        rogue:     [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    }
};

// Wild Shape: highest beast CR and whether a Fly Speed is allowed, per druid
// level. Circle of the Moon raises the CR to floor(level / 3).
DATA.wildShapeLimits = function (level, subclass) {
    var cr = level >= 8 ? 1 : level >= 4 ? 0.5 : 0.25;
    if (subclass === 'moon' && level >= 3) cr = Math.max(cr, Math.floor(level / 3));
    return { cr: cr, fly: level >= 8 };
};

// ---- One-of-N picks a class or subclass feature asks for (2024 PHB) ----
// Asked in the level-up menu when appliesTo first holds; the pick is stored in
// state[stateKey] and undone by Level Down. swap = when it may be changed later.
// act = action type of the picked option (Build window); desc in our own words.
DATA.optionChoices = [
    { id: 'blessedStrikes', label: 'Blessed Strikes', appliesTo: { className: 'cleric', minLevel: 7 }, stateKey: 'blessedStrikes',
      options: [
          { name: 'Divine Strike', act: 'attack', desc: "Once on each of your turns when you hit a creature with a weapon attack, it takes an extra 1d8 Necrotic or Radiant damage (your choice)." },
          { name: 'Potent Spellcasting', desc: "Add your Wisdom modifier to the damage of your Cleric cantrips." }] },
    { id: 'elementalFury', label: 'Elemental Fury', appliesTo: { className: 'druid', minLevel: 7 }, stateKey: 'elementalFury',
      options: [
          { name: 'Potent Spellcasting', desc: "Add your Wisdom modifier to the damage of your Druid cantrips." },
          { name: 'Primal Strike', act: 'attack', desc: "Once on each of your turns when you hit a creature with a weapon attack or a Beast form's attack in Wild Shape, it takes an extra 1d8 Cold, Fire, Lightning or Thunder damage (choose when you hit)." }] },
    { id: 'elementalAffinity', label: 'Elemental Affinity', appliesTo: { subclass: 'draconic', minLevel: 6 }, stateKey: 'elementalAffinity',
      options: ['Acid', 'Cold', 'Fire', 'Lightning', 'Poison'].map(function (t) {
          return { name: t, desc: "Resistance to " + t + " damage; add your Charisma modifier to one damage roll of a spell that deals " + t + " damage." };
      }) },
    { id: 'defensiveTactics', label: 'Defensive Tactics', appliesTo: { subclass: 'hunter', minLevel: 7 }, stateKey: 'defensiveTactics', swap: 'shortRest',
      options: [
          { name: 'Escape the Horde', desc: "Opportunity Attacks have Disadvantage against you." },
          { name: 'Multiattack Defense', desc: "When a creature hits you with an attack roll, it has Disadvantage on all its other attack rolls against you this turn." }] },
    { id: 'aspectOfTheWilds', label: 'Aspect of the Wilds', appliesTo: { subclass: 'wildHeart', minLevel: 6 }, stateKey: 'aspectOfTheWilds', swap: 'longRest',
      options: [
          { name: 'Owl', desc: "Darkvision 60 ft; if you already have Darkvision, its range grows by 60 ft." },
          { name: 'Panther', desc: "A Climb Speed equal to your Speed." },
          { name: 'Salmon', desc: "A Swim Speed equal to your Speed." }] }
];

// ---- What can be swapped, and when (2024 PHB) ----
// when: 'longRest' | 'shortRest' (also on a Long Rest) | 'levelUp' | 'use'
// (chosen again every time you use it). appliesTo: className / subclass / race
// (arrays allowed), invocation, feat, featPrefix, fightingStyle, minLevel.
DATA.swapRules = [
    { id: 'preparedAll',   when: 'longRest',  what: "Your whole list of prepared spells", appliesTo: { className: ['cleric', 'druid'] } },
    { id: 'preparedBook',  when: 'longRest',  what: "Your whole list of prepared spells (from your spellbook)", appliesTo: { className: 'wizard' } },
    { id: 'preparedOneLR', when: 'longRest',  what: "One prepared spell", appliesTo: { className: ['paladin', 'ranger'] } },
    { id: 'preparedOneLv', when: 'levelUp',   what: "One prepared spell", appliesTo: { className: ['bard', 'sorcerer', 'warlock'] } },
    { id: 'preparedOneTC', when: 'levelUp',   what: "One prepared spell", appliesTo: { subclass: ['eldritchKnight', 'arcaneTrickster'], minLevel: 3 } },
    { id: 'cantripLv',     when: 'levelUp',   what: "One cantrip", appliesTo: { className: ['bard', 'cleric', 'druid', 'sorcerer', 'warlock'] } },
    { id: 'cantripLR',     when: 'longRest',  what: "One cantrip", appliesTo: { className: 'wizard' } },
    { id: 'memorizeSpell', when: 'shortRest', what: "One prepared spell for another from your spellbook (Memorize Spell)", appliesTo: { className: 'wizard', minLevel: 5 } },
    { id: 'cantripTC',     when: 'levelUp',   what: "One cantrip", appliesTo: { subclass: ['eldritchKnight'], minLevel: 3 } },
    { id: 'cantripAT',     when: 'levelUp',   what: "One cantrip (Mage Hand stays)", appliesTo: { subclass: ['arcaneTrickster'], minLevel: 3 } },
    { id: 'invocation',    when: 'levelUp',   what: "One Eldritch Invocation", appliesTo: { className: 'warlock' } },
    { id: 'metamagic',     when: 'levelUp',   what: "One Metamagic option", appliesTo: { className: 'sorcerer', minLevel: 2 } },
    { id: 'fightingStyle', when: 'levelUp',   what: "Your Fighting Style feat", appliesTo: { className: 'fighter' } },
    { id: 'maneuver',      when: 'levelUp',   what: "One maneuver (only when you learn new ones: levels 7, 10, 15)", appliesTo: { subclass: 'battleMaster', minLevel: 3 } },
    { id: 'masteryOne',    when: 'longRest',  what: "One Weapon Mastery choice", appliesTo: { className: ['barbarian', 'fighter'] } },
    { id: 'masteryAll',    when: 'longRest',  what: "Your Weapon Mastery choices", appliesTo: { className: ['paladin', 'ranger', 'rogue'] } },
    { id: 'wildShapeForm', when: 'longRest',  what: "One known Wild Shape form", appliesTo: { className: 'druid', minLevel: 2 } },
    { id: 'landType',      when: 'longRest',  what: "Land type for your Circle Spells", appliesTo: { subclass: 'land', minLevel: 3 } },
    { id: 'huntersPrey',   when: 'shortRest', what: "Hunter's Prey option", appliesTo: { subclass: 'hunter', minLevel: 3 } },
    { id: 'aspectOfTheWilds', when: 'longRest', what: "Aspect of the Wilds option (Owl, Panther or Salmon)", appliesTo: { subclass: 'wildHeart', minLevel: 6 } },
    { id: 'defensiveTactics', when: 'shortRest', what: "Defensive Tactics option", appliesTo: { subclass: 'hunter', minLevel: 7 } },
    { id: 'companion',     when: 'longRest',  what: "Your Primal Companion (stat block)", appliesTo: { subclass: 'beastMaster', minLevel: 3 } },
    { id: 'styleCantrip',  when: 'levelUp',   what: "One Blessed/Druidic Warrior cantrip", appliesTo: { fightingStyle: ['Blessed Warrior', 'Druidic Warrior'] } },
    { id: 'elfCantrip',    when: 'longRest',  what: "Your High Elf cantrip (any Wizard cantrip)", appliesTo: { race: 'highElf' } },
    { id: 'magicInitiate', when: 'levelUp',   what: "One Magic Initiate spell (same level, same list)", appliesTo: { featPrefix: 'Magic Initiate' } },
    { id: 'weaponMaster',  when: 'longRest',  what: "Weapon Master weapon kind", appliesTo: { feat: 'Weapon Master' } },
    { id: 'pactTome',      when: 'shortRest', what: "Book of Shadows cantrips and rituals (when you conjure a new book)", appliesTo: { invocation: 'Pact of the Tome' } },
    { id: 'pactBlade',     when: 'use',       what: "Pact weapon (bond another as a Bonus Action)", appliesTo: { invocation: 'Pact of the Blade' } },
    { id: 'pactChain',     when: 'use',       what: "Familiar form (each time you cast Find Familiar)", appliesTo: { invocation: 'Pact of the Chain' } },
    { id: 'revelation',    when: 'use',       what: "Celestial Revelation form", appliesTo: { race: 'aasimar', minLevel: 3 } },
    { id: 'breath',        when: 'use',       what: "Breath Weapon shape (cone or line)", appliesTo: { race: 'dragonborn' } },
    { id: 'rageWilds',     when: 'use',       what: "Rage of the Wilds option (Bear, Eagle or Wolf)", appliesTo: { subclass: 'wildHeart', minLevel: 3 } },
    { id: 'starryForm',    when: 'use',       what: "Starry Form constellation", appliesTo: { subclass: 'stars', minLevel: 3 } },
    { id: 'stepsOfFey',    when: 'use',       what: "Refreshing or Taunting Step", appliesTo: { subclass: 'archfey', minLevel: 3 } }
];

// Renamed feats (older names → 2024 PHB names). Stored character data may
// still use the old name; feat lookups resolve through this map.
DATA.featAliases = { "Fey Touched": "Fey-Touched", "Shadow Touched": "Shadow-Touched", "Mobile": "Speedy" };

// ---- Battle Master maneuvers (2024 PHB) ----
DATA.maneuvers = [
    { name: "Ambush", act: 'free', desc: "When you make a Dexterity (Stealth) check or an Initiative roll, spend a die and add it to the roll (not while Incapacitated)." },
    { name: "Bait and Switch", act: 'free', desc: "On your turn, within 5 ft of a willing creature: spend 5 ft of movement and a die to swap places without provoking Opportunity Attacks; you or it adds the roll to AC until the start of your next turn." },
    { name: "Commander's Strike", act: 'attack', desc: "Replace one of your attacks (Attack action): a willing ally who can see or hear you uses its Reaction to make one attack, adding the die to its damage." },
    { name: "Commanding Presence", act: 'free', desc: "Add a die to a Charisma (Intimidation, Performance or Persuasion) check." },
    { name: "Disarming Attack", act: 'attack', desc: "On a hit, add the die to the damage; the target makes a Strength save or drops one object of your choice that it's holding." },
    { name: "Distracting Strike", act: 'attack', desc: "On a hit, add the die to the damage; the next attack roll against the target by someone other than you before your next turn has Advantage." },
    { name: "Evasive Footwork", act: 'bonus', desc: "Bonus Action: spend a die, take the Disengage action and add the roll to your AC until the start of your next turn." },
    { name: "Feinting Attack", act: 'bonus', desc: "Bonus Action: spend a die to feint at a creature within 5 ft; you have Advantage on your next attack against it this turn and add the die to the damage if it hits." },
    { name: "Goading Attack", act: 'attack', desc: "On a hit, add the die to the damage; the target makes a Wisdom save or has Disadvantage on attacks against anyone but you until the end of your next turn." },
    { name: "Lunging Attack", act: 'bonus', desc: "Bonus Action: spend a die and take the Dash action; if you move 5+ ft in a straight line right before a melee hit (Attack action) this turn, add the die to its damage." },
    { name: "Maneuvering Attack", act: 'attack', desc: "On a hit, add the die to the damage; a willing ally who can see or hear you can use its Reaction to move up to half its Speed without provoking Opportunity Attacks from the target." },
    { name: "Menacing Attack", act: 'attack', desc: "On a hit, add the die to the damage; the target makes a Wisdom save or is Frightened until the end of your next turn." },
    { name: "Parry", act: 'reaction', desc: "When another creature damages you with a melee attack, Reaction: spend a die and reduce the damage by the roll + your Strength or Dexterity modifier." },
    { name: "Precision Attack", act: 'free', desc: "When you miss with an attack roll, spend a die and add it to the roll, possibly turning the miss into a hit." },
    { name: "Pushing Attack", act: 'attack', desc: "On a hit with a weapon or Unarmed Strike, add the die to the damage; a Large or smaller target makes a Strength save or is pushed up to 15 ft away." },
    { name: "Rally", act: 'bonus', desc: "Bonus Action: an ally within 30 ft who can see or hear you gains Temporary HP equal to the die roll + half your Fighter level (round down)." },
    { name: "Riposte", act: 'reaction', desc: "When a creature misses you with a melee attack, Reaction: spend a die and make a melee attack against it, adding the die to the damage on a hit." },
    { name: "Sweeping Attack", act: 'attack', desc: "On a melee hit with a weapon or Unarmed Strike, another creature within 5 ft of the target and within your reach takes damage equal to the die roll if your attack roll would also hit it." },
    { name: "Tactical Assessment", act: 'free', desc: "Add a die to an Intelligence (History or Investigation) or Wisdom (Insight) check." },
    { name: "Trip Attack", act: 'attack', desc: "On a hit with a weapon or Unarmed Strike, add the die to the damage; a Large or smaller target makes a Strength save or has the Prone condition." }
];

// ---- Weapon kinds with their mastery property (2024 PHB weapon table) ----
// Used by the Weapon Mastery picker; property names match DATA.weaponMasteryDesc.
DATA.weaponMasteryList = [
    { name: "Club", mastery: "Slow", kind: "simple melee" }, { name: "Dagger", mastery: "Nick", kind: "simple melee" },
    { name: "Greatclub", mastery: "Push", kind: "simple melee" }, { name: "Handaxe", mastery: "Vex", kind: "simple melee" },
    { name: "Javelin", mastery: "Slow", kind: "simple melee" }, { name: "Light Hammer", mastery: "Nick", kind: "simple melee" },
    { name: "Mace", mastery: "Sap", kind: "simple melee" }, { name: "Quarterstaff", mastery: "Topple", kind: "simple melee" },
    { name: "Sickle", mastery: "Nick", kind: "simple melee" }, { name: "Spear", mastery: "Sap", kind: "simple melee" },
    { name: "Dart", mastery: "Vex", kind: "simple ranged" }, { name: "Light Crossbow", mastery: "Slow", kind: "simple ranged" },
    { name: "Shortbow", mastery: "Vex", kind: "simple ranged" }, { name: "Sling", mastery: "Slow", kind: "simple ranged" },
    { name: "Battleaxe", mastery: "Topple", kind: "martial melee" }, { name: "Flail", mastery: "Sap", kind: "martial melee" },
    { name: "Glaive", mastery: "Graze", kind: "martial melee" }, { name: "Greataxe", mastery: "Cleave", kind: "martial melee" },
    { name: "Greatsword", mastery: "Graze", kind: "martial melee" }, { name: "Halberd", mastery: "Cleave", kind: "martial melee" },
    { name: "Lance", mastery: "Topple", kind: "martial melee" }, { name: "Longsword", mastery: "Sap", kind: "martial melee" },
    { name: "Maul", mastery: "Topple", kind: "martial melee" }, { name: "Morningstar", mastery: "Sap", kind: "martial melee" },
    { name: "Pike", mastery: "Push", kind: "martial melee" }, { name: "Rapier", mastery: "Vex", kind: "martial melee" },
    { name: "Scimitar", mastery: "Nick", kind: "martial melee" }, { name: "Shortsword", mastery: "Vex", kind: "martial melee" },
    { name: "Trident", mastery: "Topple", kind: "martial melee" }, { name: "Warhammer", mastery: "Push", kind: "martial melee" },
    { name: "War Pick", mastery: "Sap", kind: "martial melee" }, { name: "Whip", mastery: "Slow", kind: "martial melee" },
    { name: "Blowgun", mastery: "Vex", kind: "martial ranged" }, { name: "Hand Crossbow", mastery: "Vex", kind: "martial ranged" },
    { name: "Heavy Crossbow", mastery: "Push", kind: "martial ranged" }, { name: "Longbow", mastery: "Slow", kind: "martial ranged" },
    { name: "Musket", mastery: "Slow", kind: "martial ranged" }, { name: "Pistol", mastery: "Vex", kind: "martial ranged" }
];

// School + flags per spell in DATA.spellPool, generated from the 2024 PHB spell
// data (2026-10-15). Letter = school (A Abjuration, C Conjuration, D Divination,
// E Enchantment, V Evocation, I Illusion, N Necromancy, T Transmutation);
// r = has the Ritual tag. House rule (2026-10-15): only 2024 PHB spells are used.
DATA.spellMeta = {
    "Acid Splash": "V", "Aid": "A", "Alarm": "Ar", "Alter Self": "T",
    "Animal Friendship": "E", "Animal Messenger": "Er", "Animal Shapes": "T", "Animate Dead": "N",
    "Animate Objects": "T", "Antilife Shell": "A", "Antimagic Field": "A", "Antipathy/Sympathy": "E",
    "Arcane Eye": "D", "Arcane Gate": "C", "Arcane Lock": "A", "Arcane Vigor": "A", "Armor of Agathys": "A",
    "Arms of Hadar": "C", "Astral Projection": "N", "Augury": "Dr", "Aura of Life": "A", "Aura of Purity": "A",
    "Aura of Vitality": "A", "Awaken": "T", "Bane": "E", "Banishing Smite": "C", "Banishment": "A", "Barkskin": "T",
    "Beacon of Hope": "A", "Beast Sense": "Dr", "Befuddlement": "E", "Bestow Curse": "N", "Bigby's Hand": "V",
    "Blade Barrier": "V", "Blade Ward": "A", "Bless": "E", "Blight": "N", "Blinding Smite": "V",
    "Blindness/Deafness": "T", "Blink": "T", "Blur": "I", "Burning Hands": "V",
    "Call Lightning": "C", "Calm Emotions": "E", "Chain Lightning": "V", "Charm Monster": "E",
    "Charm Person": "E", "Chill Touch": "N", "Chromatic Orb": "V", "Circle of Death": "N", "Circle of Power": "A",
    "Clairvoyance": "D", "Clone": "N", "Cloud of Daggers": "C", "Cloudkill": "C", "Color Spray": "I", "Command": "E",
    "Commune": "Dr", "Commune with Nature": "Dr", "Compelled Duel": "E", "Comprehend Languages": "Dr",
    "Compulsion": "E", "Cone of Cold": "V", "Confusion": "E", "Conjure Animals": "C", "Conjure Barrage": "C",
    "Conjure Celestial": "C", "Conjure Elemental": "C", "Conjure Fey": "C", "Conjure Minor Elementals": "C",
    "Conjure Volley": "C", "Conjure Woodland Beings": "C", "Contact Other Plane": "Dr", "Contagion": "N",
    "Contingency": "A", "Continual Flame": "V", "Control Water": "T", "Control Weather": "T", "Cordon of Arrows": "T",
    "Counterspell": "A", "Create Food and Water": "C", "Create Undead": "N", "Create or Destroy Water": "T",
    "Creation": "I", "Crown of Madness": "E", "Crusader's Mantle": "V", "Cure Wounds": "A", "Dancing Lights": "I",
    "Darkness": "V", "Darkvision": "T", "Daylight": "V", "Death Ward": "A", "Delayed Blast Fireball": "V",
    "Demiplane": "C", "Destructive Wave": "V", "Detect Evil and Good": "D", "Detect Magic": "Dr",
    "Detect Poison and Disease": "Dr", "Detect Thoughts": "D", "Dimension Door": "C", "Disguise Self": "I",
    "Disintegrate": "T", "Dispel Evil and Good": "A", "Dispel Magic": "A", "Dissonant Whispers": "E",
    "Divination": "Dr", "Divine Favor": "T", "Divine Smite": "V", "Divine Word": "V", "Dominate Beast": "E",
    "Dominate Monster": "E", "Dominate Person": "E", "Dragon's Breath": "T", "Drawmij's Instant Summons": "Cr",
    "Dream": "I", "Druidcraft": "T", "Earthquake": "T", "Eldritch Blast": "V",
    "Elemental Weapon": "T", "Elementalism": "T", "Enhance Ability": "T", "Enlarge/Reduce": "T",
    "Ensnaring Strike": "C", "Entangle": "C", "Enthrall": "E", "Etherealness": "C", "Evard's Black Tentacles": "C",
    "Expeditious Retreat": "T", "Eyebite": "N", "Fabricate": "T", "Faerie Fire": "V", "False Life": "N",
    "Fear": "I", "Feather Fall": "T", "Feign Death": "Nr", "Find Familiar": "Cr",
    "Find Steed": "C", "Find Traps": "D", "Find the Path": "D", "Finger of Death": "N",
    "Fire Bolt": "V", "Fire Shield": "V", "Fire Storm": "V", "Fireball": "V", "Flame Blade": "V", "Flame Strike": "V",
    "Flaming Sphere": "V", "Flesh to Stone": "T", "Fly": "T", "Fog Cloud": "C", "Forbiddance": "Ar", "Forcecage": "V",
    "Foresight": "D", "Fount of Moonlight": "V", "Freedom of Movement": "A", "Friends": "E", "Gaseous Form": "T",
    "Gate": "C", "Geas": "E", "Gentle Repose": "Nr", "Giant Insect": "C", "Glibness": "E",
    "Globe of Invulnerability": "A", "Glyph of Warding": "A", "Goodberry": "C", "Grasping Vine": "C", "Grease": "C",
    "Greater Invisibility": "I", "Greater Restoration": "A", "Guardian of Faith": "C", 
    "Guards and Wards": "A", "Guidance": "D", "Guiding Bolt": "V", "Gust of Wind": "V", "Hail of Thorns": "C",
    "Hallow": "A", "Hallucinatory Terrain": "I", "Harm": "N", "Haste": "T", "Heal": "A", "Healing Word": "A",
    "Heat Metal": "T", "Hellish Rebuke": "V", "Heroes' Feast": "C", "Heroism": "E", "Hex": "E", "Hold Monster": "E",
    "Hold Person": "E", "Holy Aura": "A", "Hunger of Hadar": "C", "Hunter's Mark": "D",
    "Hypnotic Pattern": "I", "Ice Knife": "C", "Ice Storm": "V", "Identify": "Dr", "Illusory Script": "Ir",
    "Imprisonment": "A", "Incendiary Cloud": "C", "Inflict Wounds": "N", "Insect Plague": "C", "Invisibility": "I",
    "Jallarzi's Storm of Radiance": "V", "Jump": "T", "Knock": "T", "Legend Lore": "D", "Leomund's Secret Chest": "C",
    "Leomund's Tiny Hut": "Vr", "Lesser Restoration": "A", "Levitate": "T", "Light": "V", "Lightning Arrow": "T",
    "Lightning Bolt": "V", "Locate Animals or Plants": "Dr", "Locate Creature": "D", "Locate Object": "D",
    "Longstrider": "T", "Mage Armor": "A", "Mage Hand": "C", "Magic Circle": "A", "Magic Jar": "N",
    "Magic Missile": "V", "Magic Mouth": "Ir", "Magic Weapon": "T", "Major Image": "I", "Mass Cure Wounds": "A",
    "Mass Heal": "A", "Mass Healing Word": "A", "Mass Suggestion": "E", "Maze": "C",
    "Meld into Stone": "Tr", "Melf's Acid Arrow": "V", "Mending": "T", "Message": "T", "Meteor Swarm": "V",
    "Mind Blank": "A", "Mind Sliver": "E", "Mind Spike": "D", "Minor Illusion": "I", "Mirage Arcane": "I",
    "Mirror Image": "I", "Mislead": "I", "Misty Step": "C", "Modify Memory": "E", "Moonbeam": "V",
    "Mordenkainen's Faithful Hound": "C", "Mordenkainen's Magnificent Mansion": "C",
    "Mordenkainen's Private Sanctum": "A", "Mordenkainen's Sword": "V", "Move Earth": "T", "Nondetection": "A",
    "Nystul's Magic Aura": "I", "Otiluke's Freezing Sphere": "V", "Otiluke's Resilient Sphere": "A",
    "Otto's Irresistible Dance": "E", "Pass without Trace": "A", "Passwall": "T", "Phantasmal Force": "I",
    "Phantasmal Killer": "I", "Phantom Steed": "Ir", "Planar Ally": "C", "Planar Binding": "A", "Plane Shift": "C",
    "Plant Growth": "T", "Poison Spray": "N", "Polymorph": "T", "Power Word Fortify": "E", "Power Word Heal": "E", "Power Word Kill": "E",
    "Power Word Stun": "E", "Prayer of Healing": "A", "Prestidigitation": "T", "Prismatic Spray": "V",
    "Prismatic Wall": "A", "Produce Flame": "C", "Programmed Illusion": "I", "Project Image": "I",
    "Protection from Energy": "A", "Protection from Evil and Good": "A", "Protection from Poison": "A",
    "Purify Food and Drink": "Tr", "Raise Dead": "N", "Rary's Telepathic Bond": "Dr",
    "Ray of Enfeeblement": "N", "Ray of Frost": "V", "Ray of Sickness": "N", "Regenerate": "T", "Reincarnate": "N",
    "Remove Curse": "A", "Resistance": "A", "Resurrection": "N", "Reverse Gravity": "T", "Revivify": "N",
    "Rope Trick": "T", "Sacred Flame": "V", "Sanctuary": "A", "Scorching Ray": "V", "Scrying": "D",
    "Searing Smite": "V", "See Invisibility": "D", "Seeming": "I", "Sending": "D", "Sequester": "T",
    "Shapechange": "T", "Shatter": "V", "Shield": "A", "Shield of Faith": "A",
    "Shillelagh": "T", "Shining Smite": "T", "Shocking Grasp": "V", "Silence": "Ir",
    "Silent Image": "I", "Simulacrum": "I", "Sleep": "E", "Sleet Storm": "C", "Slow": "T",
    "Sorcerous Burst": "V", "Spare the Dying": "N", "Speak with Animals": "Dr", "Speak with Dead": "N",
    "Speak with Plants": "T", "Spider Climb": "T", "Spike Growth": "T", "Spirit Guardians": "C",
    "Spiritual Weapon": "V", "Staggering Smite": "E", "Starry Wisp": "V",
    "Steel Wind Strike": "C", "Stinking Cloud": "C", "Stone Shape": "T", "Stoneskin": "T", "Storm of Vengeance": "C",
    "Suggestion": "E", "Summon Aberration": "C", "Summon Beast": "C", "Summon Celestial": "C",
    "Summon Construct": "C", "Summon Dragon": "C", "Summon Elemental": "C", "Summon Fey": "C", "Summon Fiend": "C",
    "Summon Undead": "N", "Sunbeam": "V", "Sunburst": "V", "Swift Quiver": "T", "Symbol": "A", "Synaptic Static": "E",
    "Tasha's Bubbling Cauldron": "C", "Tasha's Hideous Laughter": "E", "Telekinesis": "T", "Telepathy": "D",
    "Teleport": "C", "Teleportation Circle": "C", "Tenser's Floating Disk": "Cr",
    "Thaumaturgy": "T", "Thorn Whip": "T", "Thunderclap": "V", "Thunderous Smite": "V",
    "Thunderwave": "V", "Time Stop": "T", "Toll the Dead": "N", "Tongues": "D", "Transport via Plants": "C",
    "Tree Stride": "C", "True Polymorph": "T", "True Resurrection": "N", "True Seeing": "D", "True Strike": "D",
    "Tsunami": "C", "Unseen Servant": "Cr", "Vampiric Touch": "N", "Vicious Mockery": "E", "Vitriolic Sphere": "V",
    "Wall of Fire": "V", "Wall of Force": "V", "Wall of Ice": "V", "Wall of Stone": "V",
    "Wall of Thorns": "C", "Warding Bond": "A", "Water Breathing": "Tr", "Water Walk": "Tr", "Web": "C", "Weird": "I",
    "Wind Walk": "T", "Wind Wall": "V", "Wish": "C", "Witch Bolt": "V", "Word of Radiance": "V",
    "Word of Recall": "C", "Wrathful Smite": "N", "Yolande's Regal Presence": "E", "Zone of Truth": "E"
};

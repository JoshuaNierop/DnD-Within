const DATA = {
    // Index 0 unused, index 1-20 = character levels
    profBonus: [0, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],

    // NOTE: Half-Elf was REMOVED in the 2024 PHB; players pick Human or Elf.
    // Kept as legacy for existing characters.
    halfElf: {
        speed: 30,
        darkvision: 60,
        legacy: true,
        features: [
            { name: "Darkvision", desc: { nl: "Je kunt in dim light zien als bright light tot 60ft, en in duisternis als dim light.", en: "You can see in dim light as if it were bright light up to 60ft, and in darkness as if it were dim light." } },
            { name: "Fey Ancestry", desc: { nl: "Advantage op saving throws tegen charmed. Magie kan je niet in slaap brengen.", en: "Advantage on saving throws against charmed. Magic cannot put you to sleep." } },
            { name: "Skill Versatility", desc: { nl: "Proficiency in 2 extra skills naar keuze.", en: "Proficiency in 2 additional skills of your choice." } }
        ]
    },

    // ===== SPECIES (2024 PHB) =====
    // Verified against the 2024 PHB (5etools XPHB data, 2026-10-15). Species give
    // no ability score increases in 2024 (those come from the background).
    // features = level-1 traits (act = action type when used: action / bonus /
    //   reaction / attack (rider on a hit or replaces an attack) / free).
    //   Level-gated traits live in DATA.speciesProgression.
    // lineages = the per-character choice (config.lineage): Tiefling legacy,
    //   Gnome lineage, Goliath ancestry, Dragonborn ancestry. Elves keep their
    //   three lineages as separate race keys (woodElf / highElf / drow).
    // spells = granted spells (cantrips, always-prepared / free-cast spells);
    //   spellAbility 'choose' → INT, WIS or CHA picked with the lineage
    //   (config.speciesAbility).

    // ===== HUMAN =====
    human: {
        speed: 30, size: "Medium or Small",
        features: [
            { name: "Resourceful", act: 'free', desc: "You gain Heroic Inspiration whenever you finish a Long Rest (spend it to reroll any die immediately after rolling it)." },
            { name: "Skillful", desc: "You gain proficiency in one skill of your choice." },
            { name: "Versatile", desc: "You gain an Origin feat of your choice (on top of the one from your background)." }
        ]
    },

    // ===== HALFLING =====
    halfling: {
        speed: 30, size: "Small",
        features: [
            { name: "Brave", desc: "You have Advantage on saving throws you make to avoid or end the Frightened condition." },
            { name: "Halfling Nimbleness", desc: "You can move through the space of any creature that is a size larger than you, but you can't stop in that space." },
            { name: "Luck", desc: "When you roll a 1 on the d20 of a D20 Test, you can reroll the die, and you must use the new roll." },
            { name: "Naturally Stealthy", desc: "You can take the Hide action even when you're obscured only by a creature that is at least one size larger than you." }
        ]
    },

    // ===== TIEFLING =====
    tiefling: {
        speed: 30, darkvision: 60, size: "Medium or Small",
        lineageLabel: "Fiendish Legacy",
        spellAbility: 'choose',
        features: [
            { name: "Darkvision", desc: "You can see in Dim Light within 60 ft as if it were Bright Light, and in Darkness as if it were Dim Light." },
            { name: "Fiendish Legacy", desc: "Choose a legacy: Abyssal (Resistance to Poison, Poison Spray cantrip), Chthonic (Resistance to Necrotic, Chill Touch cantrip) or Infernal (Resistance to Fire, Fire Bolt cantrip). At character level 3 and 5 you learn a legacy spell that is always prepared: cast it once per Long Rest without a spell slot, or with spell slots. INT, WIS or CHA is your spellcasting ability for these spells (chosen with the legacy)." },
            { name: "Otherworldly Presence", desc: "You know the Thaumaturgy cantrip; it uses your Fiendish Legacy spellcasting ability." }
        ],
        spells: [{ name: "Thaumaturgy", lvl: 1, kind: 'cantrip' }],
        lineages: {
            abyssal: { name: "Abyssal", resist: "Poison",
                spells: [{ name: "Poison Spray", lvl: 1, kind: 'cantrip' },
                         { name: "Ray of Sickness", lvl: 3, kind: 'innate', free: 1, recharge: 'long', slots: true, key: 'fiendishLegacyUsed' },
                         { name: "Hold Person", lvl: 5, kind: 'innate', free: 1, recharge: 'long', slots: true }] },
            chthonic: { name: "Chthonic", resist: "Necrotic",
                spells: [{ name: "Chill Touch", lvl: 1, kind: 'cantrip' },
                         { name: "False Life", lvl: 3, kind: 'innate', free: 1, recharge: 'long', slots: true, key: 'fiendishLegacyUsed' },
                         { name: "Ray of Enfeeblement", lvl: 5, kind: 'innate', free: 1, recharge: 'long', slots: true }] },
            infernal: { name: "Infernal", resist: "Fire",
                spells: [{ name: "Fire Bolt", lvl: 1, kind: 'cantrip' },
                         { name: "Hellish Rebuke", lvl: 3, kind: 'innate', free: 1, recharge: 'long', slots: true, key: 'fiendishLegacyUsed' },
                         { name: "Darkness", lvl: 5, kind: 'innate', free: 1, recharge: 'long', slots: true }] }
        }
    },

    // ===== AASIMAR =====
    aasimar: {
        speed: 30, darkvision: 60, size: "Medium or Small",
        spellAbility: 'cha',
        features: [
            { name: "Celestial Resistance", desc: "You have Resistance to Necrotic and Radiant damage." },
            { name: "Darkvision", desc: "You can see in Dim Light within 60 ft as if it were Bright Light, and in Darkness as if it were Dim Light." },
            { name: "Healing Hands", act: 'action', desc: "Magic action: touch a creature and roll a number of d4s equal to your Proficiency Bonus; it regains that many HP. Once per Long Rest." },
            { name: "Light Bearer", desc: "You know the Light cantrip. Charisma is your spellcasting ability for it." }
        ],
        spells: [{ name: "Light", lvl: 1, kind: 'cantrip' }]
    },

    // ===== ELF — three lineages as separate race keys =====
    woodElf: {
        speed: 35, darkvision: 60, size: "Medium",
        spellAbility: 'choose',
        features: [
            { name: "Darkvision", desc: "You can see in Dim Light within 60 ft as if it were Bright Light, and in Darkness as if it were Dim Light." },
            { name: "Elven Lineage: Wood Elf", desc: "Your Speed is 35 ft and you know the Druidcraft cantrip. Level 3: Longstrider; level 5: Pass without Trace — always prepared, each castable once per Long Rest without a spell slot (or with spell slots). INT, WIS or CHA is your spellcasting ability for these spells (chosen with the lineage)." },
            { name: "Fey Ancestry", desc: "You have Advantage on saving throws you make to avoid or end the Charmed condition." },
            { name: "Keen Senses", desc: "You have proficiency in the Insight, Perception or Survival skill (your choice)." },
            { name: "Trance", desc: "You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours of trancelike meditation, during which you stay conscious." }
        ],
        spells: [{ name: "Druidcraft", lvl: 1, kind: 'cantrip' },
                 { name: "Longstrider", lvl: 3, kind: 'innate', free: 1, recharge: 'long', slots: true },
                 { name: "Pass Without Trace", lvl: 5, kind: 'innate', free: 1, recharge: 'long', slots: true }]
    },

    highElf: {
        speed: 30, darkvision: 60, size: "Medium",
        spellAbility: 'choose',
        features: [
            { name: "Darkvision", desc: "You can see in Dim Light within 60 ft as if it were Bright Light, and in Darkness as if it were Dim Light." },
            { name: "Elven Lineage: High Elf", desc: "You know the Prestidigitation cantrip; whenever you finish a Long Rest you can replace it with another Wizard cantrip. Level 3: Detect Magic; level 5: Misty Step — always prepared, each castable once per Long Rest without a spell slot (or with spell slots). INT, WIS or CHA is your spellcasting ability for these spells (chosen with the lineage)." },
            { name: "Fey Ancestry", desc: "You have Advantage on saving throws you make to avoid or end the Charmed condition." },
            { name: "Keen Senses", desc: "You have proficiency in the Insight, Perception or Survival skill (your choice)." },
            { name: "Trance", desc: "You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours of trancelike meditation, during which you stay conscious." }
        ],
        spells: [{ pick: 'speciesCantrip', count: 1, list: 'wizard', level: 0, lvl: 1, kind: 'cantrip', def: "Prestidigitation", swap: 'longRest' },
                 { name: "Detect Magic", lvl: 3, kind: 'innate', free: 1, recharge: 'long', slots: true, key: 'highElfSpellUsed' },
                 { name: "Misty Step", lvl: 5, kind: 'innate', free: 1, recharge: 'long', slots: true }]
    },

    drow: {
        speed: 30, darkvision: 120, size: "Medium",
        spellAbility: 'choose',
        features: [
            { name: "Darkvision", desc: "Drow lineage: you can see in Dim Light within 120 ft as if it were Bright Light, and in Darkness as if it were Dim Light." },
            { name: "Elven Lineage: Drow", desc: "Your Darkvision reaches 120 ft and you know the Dancing Lights cantrip. Level 3: Faerie Fire; level 5: Darkness — always prepared, each castable once per Long Rest without a spell slot (or with spell slots). INT, WIS or CHA is your spellcasting ability for these spells (chosen with the lineage)." },
            { name: "Fey Ancestry", desc: "You have Advantage on saving throws you make to avoid or end the Charmed condition." },
            { name: "Keen Senses", desc: "You have proficiency in the Insight, Perception or Survival skill (your choice)." },
            { name: "Trance", desc: "You don't need to sleep, and magic can't put you to sleep. You can finish a Long Rest in 4 hours of trancelike meditation, during which you stay conscious." }
        ],
        spells: [{ name: "Dancing Lights", lvl: 1, kind: 'cantrip' },
                 { name: "Faerie Fire", lvl: 3, kind: 'innate', free: 1, recharge: 'long', slots: true },
                 { name: "Darkness", lvl: 5, kind: 'innate', free: 1, recharge: 'long', slots: true }]
    },

    // ===== DWARF =====
    dwarf: {
        speed: 30, darkvision: 120, size: "Medium",
        features: [
            { name: "Darkvision", desc: "You can see in Dim Light within 120 ft as if it were Bright Light, and in Darkness as if it were Dim Light." },
            { name: "Dwarven Resilience", desc: "You have Resistance to Poison damage and Advantage on saving throws to avoid or end the Poisoned condition." },
            { name: "Dwarven Toughness", desc: "Your Hit Point maximum increases by 1, and by 1 again whenever you gain a level." },
            { name: "Stonecunning", act: 'bonus', desc: "Bonus Action: gain Tremorsense 60 ft for 10 minutes while you're on or touching stone. Uses = Proficiency Bonus per Long Rest." }
        ]
    },

    // ===== GNOME =====
    gnome: {
        speed: 30, darkvision: 60, size: "Small",
        lineageLabel: "Gnomish Lineage",
        spellAbility: 'choose',
        features: [
            { name: "Darkvision", desc: "You can see in Dim Light within 60 ft as if it were Bright Light, and in Darkness as if it were Dim Light." },
            { name: "Gnomish Cunning", desc: "You have Advantage on Intelligence, Wisdom and Charisma saving throws." },
            { name: "Gnomish Lineage", desc: "Choose Forest Gnome (Minor Illusion cantrip; Speak with Animals always prepared, castable Proficiency Bonus times per Long Rest without a slot) or Rock Gnome (Mending + Prestidigitation cantrips; build clockwork devices). INT, WIS or CHA is your spellcasting ability for these spells (chosen with the lineage)." }
        ],
        lineages: {
            forest: { name: "Forest Gnome",
                spells: [{ name: "Minor Illusion", lvl: 1, kind: 'cantrip' },
                         { name: "Speak with Animals", lvl: 1, kind: 'innate', free: 'pb', recharge: 'long', slots: true }] },
            rock: { name: "Rock Gnome",
                features: [{ name: "Tinker", desc: "Spend 10 minutes casting Prestidigitation to build a Tiny clockwork device (AC 5, 1 HP) that produces one Prestidigitation effect when anyone touches it as a Bonus Action. Up to three at a time; each falls apart after 8 hours or when you dismantle it (Utilize action)." }],
                spells: [{ name: "Mending", lvl: 1, kind: 'cantrip' },
                         { name: "Prestidigitation", lvl: 1, kind: 'cantrip' }] }
        }
    },

    // ===== GOLIATH =====
    goliath: {
        speed: 35, size: "Medium",
        lineageLabel: "Giant Ancestry",
        features: [
            { name: "Giant Ancestry", desc: "Choose a supernatural boon from your giant ancestry (Cloud, Fire, Frost, Hill, Stone or Storm). Uses = Proficiency Bonus per Long Rest." },
            { name: "Powerful Build", desc: "You have Advantage on ability checks to end the Grappled condition, and you count as one size larger for your carrying capacity." }
        ],
        lineages: {
            cloud: { name: "Cloud Giant", features: [{ name: "Cloud's Jaunt", act: 'bonus', desc: "Bonus Action: teleport up to 30 ft to an unoccupied space you can see. (Giant Ancestry use.)" }] },
            fire:  { name: "Fire Giant",  features: [{ name: "Fire's Burn", act: 'attack', desc: "When you hit a target with an attack roll and deal damage, also deal 1d10 Fire damage. (Giant Ancestry use.)" }] },
            frost: { name: "Frost Giant", features: [{ name: "Frost's Chill", act: 'attack', desc: "When you hit a target with an attack roll and deal damage, also deal 1d6 Cold damage and reduce its Speed by 10 ft until the start of your next turn. (Giant Ancestry use.)" }] },
            hill:  { name: "Hill Giant",  features: [{ name: "Hill's Tumble", act: 'attack', desc: "When you hit a Large or smaller creature with an attack roll and deal damage, give it the Prone condition. (Giant Ancestry use.)" }] },
            stone: { name: "Stone Giant", features: [{ name: "Stone's Endurance", act: 'reaction', desc: "When you take damage, Reaction: roll 1d12 + your Constitution modifier and reduce the damage by that total. (Giant Ancestry use.)" }] },
            storm: { name: "Storm Giant", features: [{ name: "Storm's Thunder", act: 'reaction', desc: "When a creature within 60 ft damages you, Reaction: deal 1d8 Thunder damage to it. (Giant Ancestry use.)" }] }
        }
    },

    // ===== ORC =====
    orc: {
        speed: 30, darkvision: 120, size: "Medium",
        features: [
            { name: "Adrenaline Rush", act: 'bonus', desc: "Take the Dash action as a Bonus Action and gain Temporary HP equal to your Proficiency Bonus. Uses = Proficiency Bonus; all uses return on a Short or Long Rest." },
            { name: "Darkvision", desc: "You can see in Dim Light within 120 ft as if it were Bright Light, and in Darkness as if it were Dim Light." },
            { name: "Relentless Endurance", act: 'free', desc: "When you're reduced to 0 HP but not killed outright, you can drop to 1 HP instead. Once per Long Rest." }
        ]
    },

    // ===== DRAGONBORN =====
    dragonborn: {
        speed: 30, darkvision: 60, size: "Medium",
        lineageLabel: "Draconic Ancestry",
        features: [
            { name: "Draconic Ancestry", desc: "Choose your dragon ancestor; it sets the damage type of your Breath Weapon and your Damage Resistance." },
            { name: "Breath Weapon", act: 'attack', desc: "When you take the Attack action, replace one attack with a 15-ft Cone or a 30-ft Line (5 ft wide), your choice each time. Each creature in it makes a Dexterity save (DC 8 + CON modifier + Proficiency Bonus): 1d10 damage of your ancestry's type on a failure, half on a success (2d10 at level 5, 3d10 at 11, 4d10 at 17). Uses = Proficiency Bonus per Long Rest." },
            { name: "Damage Resistance", desc: "You have Resistance to your Draconic Ancestry's damage type." },
            { name: "Darkvision", desc: "You can see in Dim Light within 60 ft as if it were Bright Light, and in Darkness as if it were Dim Light." }
        ],
        lineages: {
            black:  { name: "Black (Acid)", damage: "Acid" },
            blue:   { name: "Blue (Lightning)", damage: "Lightning" },
            brass:  { name: "Brass (Fire)", damage: "Fire" },
            bronze: { name: "Bronze (Lightning)", damage: "Lightning" },
            copper: { name: "Copper (Acid)", damage: "Acid" },
            gold:   { name: "Gold (Fire)", damage: "Fire" },
            green:  { name: "Green (Poison)", damage: "Poison" },
            red:    { name: "Red (Fire)", damage: "Fire" },
            silver: { name: "Silver (Cold)", damage: "Cold" },
            white:  { name: "White (Cold)", damage: "Cold" }
        }
    },

    // ===== SORCERER CLASS =====
    sorcerer: {
        hitDie: 6,
        savingThrows: ["con", "cha"],
        skillOptions: ["arcana", "deception", "insight", "intimidation", "persuasion", "religion"],
        skillCount: 2,

        spellSlots: {
            1:  [2,0,0,0,0,0,0,0,0],
            2:  [3,0,0,0,0,0,0,0,0],
            3:  [4,2,0,0,0,0,0,0,0],
            4:  [4,3,0,0,0,0,0,0,0],
            5:  [4,3,2,0,0,0,0,0,0],
            6:  [4,3,3,0,0,0,0,0,0],
            7:  [4,3,3,1,0,0,0,0,0],
            8:  [4,3,3,2,0,0,0,0,0],
            9:  [4,3,3,3,1,0,0,0,0],
            10: [4,3,3,3,2,0,0,0,0],
            11: [4,3,3,3,2,1,0,0,0],
            12: [4,3,3,3,2,1,0,0,0],
            13: [4,3,3,3,2,1,1,0,0],
            14: [4,3,3,3,2,1,1,0,0],
            15: [4,3,3,3,2,1,1,1,0],
            16: [4,3,3,3,2,1,1,1,0],
            17: [4,3,3,3,2,1,1,1,1],
            18: [4,3,3,3,3,1,1,1,1],
            19: [4,3,3,3,3,2,1,1,1],
            20: [4,3,3,3,3,2,2,1,1]
        },

        cantripsKnown: { 1:4, 2:4, 3:4, 4:5, 5:5, 6:5, 7:5, 8:5, 9:5, 10:6, 11:6, 12:6, 13:6, 14:6, 15:6, 16:6, 17:6, 18:6, 19:6, 20:6 },
        sorceryPoints: { 1:0, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 10:10, 11:11, 12:12, 13:13, 14:14, 15:15, 16:16, 17:17, 18:18, 19:19, 20:20 },
        maxSpellLevel: { 1:1, 2:1, 3:2, 4:2, 5:3, 6:3, 7:4, 8:4, 9:5, 10:5, 11:6, 12:6, 13:7, 14:7, 15:8, 16:8, 17:9, 18:9, 19:9, 20:9 },
        asiLevels: [4, 8, 12, 16, 19],

        features: {
            1: [
                { name: "Innate Sorcery", act: 'bonus', desc: "Bonus Action: for 1 minute, your Sorcerer spell save DC increases by 1 and you have Advantage on attack rolls of Sorcerer spells you cast. Two uses; both return on a Long Rest." },
                { name: "Spellcasting", desc: "Charisma; Sorcerer spell list. Cantrips: 4 (5 from level 4) — whenever you gain a Sorcerer level you can replace one. Prepared spells: 2 at level 1 → 7 at level 4; whenever you gain a Sorcerer level you can replace one prepared spell. Spellcasting focus: an Arcane Focus." }
            ],
            2: [
                { name: "Font of Magic", act: 'bonus', desc: "You have Sorcery Points equal to your Sorcerer level (4 at level 4), all regained on a Long Rest. Turn a spell slot into points equal to its level (no action), or as a Bonus Action turn points into a spell slot that lasts until your Long Rest: level 1 slot = 2 points, level 2 = 3 (from level 3), level 3 = 5 (from level 5), level 4 = 6 (from level 7), level 5 = 7 (from level 9). Created slots can't be higher than level 5." },
                { name: "Metamagic", desc: "You know two Metamagic options (two more at levels 10 and 17); spend Sorcery Points to apply one option per spell (unless an option says otherwise). Whenever you gain a Sorcerer level, you can replace one option with another." }
            ],
            3: [
                { name: "Sorcerer Subclass", desc: "Choose your Sorcerous Origin. It grants features at level 3 and at higher levels." }
            ],
            5: [
                { name: "Sorcerous Restoration", desc: "When you finish a Short Rest, you can regain expended Sorcery Points — no more than half your Sorcerer level (round down). Once per Long Rest." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 12 and 16 (Epic Boon at 19)." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            10: [
                { name: "Additional Metamagic", desc: "Learn 1 additional Metamagic option." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            17: [
                { name: "Additional Metamagic", desc: "Learn 1 additional Metamagic option." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ],
            20: [
                { name: "Arcane Apotheosis", desc: "While Innate Sorcery is active, you can use one Metamagic option per turn without spending sorcery points." }
            ]
        },

        subclasses: {
            wildMagic: {
                name: "Wild Magic Sorcery",
                level: 3,
                features: {
                    3: [
                        { name: "Wild Magic Surge", desc: "Once per turn, right after you cast a Sorcerer spell with a spell slot, you can roll a d20; on a 20, roll on the Wild Magic Surge table (a surge that is a spell can't be modified by Metamagic)." },
                        { name: "Tides of Chaos", act: 'free', desc: "Give yourself Advantage on one D20 Test before you roll. You regain this on a Long Rest — or when you cast a Sorcerer spell with a spell slot, which then automatically triggers a roll on the Wild Magic Surge table." }
                    ],
                    6: [
                        { name: "Bend Luck", desc: "Reaction, 2 sorcery points: add or subtract 1d4 from an attack roll, ability check, or saving throw of a creature you can see." }
                    ],
                    14: [
                        { name: "Controlled Chaos", desc: "Whenever you roll on the Wild Magic Surge table, roll twice and choose which effect occurs." }
                    ],
                    18: [
                        { name: "Spell Bombardment", desc: "When you roll damage for a spell and one or more dice show their maximum, choose one of those dice, roll it again, and add the result to the damage." }
                    ]
                }
            },
            draconic: {
                name: "Draconic Sorcery",
                level: 3,
                spells: [
                    { name: "Alter Self", lvl: 3, kind: 'prepared' },
                    { name: "Chromatic Orb", lvl: 3, kind: 'prepared' },
                    { name: "Command", lvl: 3, kind: 'prepared' },
                    { name: "Dragon's Breath", lvl: 3, kind: 'prepared' },
                    { name: "Fear", lvl: 5, kind: 'prepared' },
                    { name: "Fly", lvl: 5, kind: 'prepared' },
                    { name: "Arcane Eye", lvl: 7, kind: 'prepared' },
                    { name: "Charm Monster", lvl: 7, kind: 'prepared' },
                    { name: "Legend Lore", lvl: 9, kind: 'prepared' },
                    { name: "Summon Dragon", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Draconic Resilience", desc: "Your HP maximum increases by 3, and by 1 more for each Sorcerer level after 3. While you wear no armor, your base AC equals 10 + your Dexterity and Charisma modifiers." },
                        { name: "Draconic Spells", desc: "Always prepared: Alter Self, Chromatic Orb, Command, Dragon's Breath (level 3); Fear, Fly (5); Arcane Eye, Charm Monster (7); Legend Lore, Summon Dragon (9)." }
                    ],
                    6: [
                        { name: "Elemental Affinity", desc: "When you cast a spell that deals damage of your draconic element: +CHA mod damage. Spend 1 sorcery point to gain resistance to that element for 1 hour." }
                    ],
                    14: [
                        { name: "Dragon Wings", desc: "As a Bonus Action you sprout draconic wings, gaining a fly speed equal to your walking speed. They last until you dismiss them." }
                    ],
                    18: [
                        { name: "Draconic Presence", desc: "5 sorcery points: a 60ft aura of awe or dread. WIS save or creatures are Charmed/Frightened for 1 minute." }
                    ]
                }
            },
            clockwork: {
                name: "Clockwork Sorcery",
                level: 3,
                spells: [
                    { name: "Aid", lvl: 3, kind: 'prepared' },
                    { name: "Alarm", lvl: 3, kind: 'prepared' },
                    { name: "Lesser Restoration", lvl: 3, kind: 'prepared' },
                    { name: "Protection from Evil and Good", lvl: 3, kind: 'prepared' },
                    { name: "Dispel Magic", lvl: 5, kind: 'prepared' },
                    { name: "Protection from Energy", lvl: 5, kind: 'prepared' },
                    { name: "Freedom of Movement", lvl: 7, kind: 'prepared' },
                    { name: "Summon Construct", lvl: 7, kind: 'prepared' },
                    { name: "Greater Restoration", lvl: 9, kind: 'prepared' },
                    { name: "Wall of Force", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Clockwork Spells", desc: "Always prepared: Aid, Alarm, Lesser Restoration, Protection from Evil and Good (level 3); Dispel Magic, Protection from Energy (5); Freedom of Movement, Summon Construct (7); Greater Restoration, Wall of Force (9). Your magic shows a sign of cosmic order (spectral cogs, ticking, …)." },
                        { name: "Restore Balance", act: 'reaction', desc: "When a creature you can see within 60 ft is about to roll a d20 with Advantage or Disadvantage, Reaction: the roll gets neither. Uses = your Charisma modifier (min 1) per Long Rest." }
                    ],
                    6: [
                        { name: "Bastion of Law", desc: "Spend 1-5 sorcery points: place a Ward on a creature. It absorbs damage equal to a number of d8s spent. The Ward fades after a Long Rest." }
                    ],
                    14: [
                        { name: "Trance of Order", desc: "Bonus Action: for 1 minute, treat every d20 roll below 10 as a 10. Once per Long Rest, or by spending 7 sorcery points." }
                    ],
                    18: [
                        { name: "Clockwork Cavalcade", desc: "Spend 7 sorcery points: restore 100 HP divided among creatures within 30ft, repair damaged objects, and end spells of 6th level or lower." }
                    ]
                }
            },
            aberrant: {
                name: "Aberrant Sorcery",
                level: 3,
                spells: [
                    { name: "Arms of Hadar", lvl: 3, kind: 'prepared' },
                    { name: "Calm Emotions", lvl: 3, kind: 'prepared' },
                    { name: "Detect Thoughts", lvl: 3, kind: 'prepared' },
                    { name: "Dissonant Whispers", lvl: 3, kind: 'prepared' },
                    { name: "Mind Sliver", lvl: 3, kind: 'cantrip' },
                    { name: "Hunger of Hadar", lvl: 5, kind: 'prepared' },
                    { name: "Sending", lvl: 5, kind: 'prepared' },
                    { name: "Evard's Black Tentacles", lvl: 7, kind: 'prepared' },
                    { name: "Summon Aberration", lvl: 7, kind: 'prepared' },
                    { name: "Rary's Telepathic Bond", lvl: 9, kind: 'prepared' },
                    { name: "Telekinesis", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Psionic Spells", desc: "Always prepared: Arms of Hadar, Calm Emotions, Detect Thoughts, Dissonant Whispers, Mind Sliver (level 3); Hunger of Hadar, Sending (5); Evard's Black Tentacles, Summon Aberration (7); Rary's Telepathic Bond, Telekinesis (9)." },
                        { name: "Telepathic Speech", act: 'bonus', desc: "Bonus Action: link minds with a creature you can see within 30 ft. You can talk telepathically (in a language you both know) while within your Charisma modifier in miles (min 1) of each other, for a number of minutes equal to your Sorcerer level." }
                    ],
                    6: [
                        { name: "Psionic Sorcery", desc: "Cast sorcerer spells with sorcery points instead of spell slots (cost = spell level). Cast this way, spells need no verbal or somatic components." }
                    ],
                    14: [
                        { name: "Psychic Defenses", desc: "Resistance to psychic damage. Advantage on saving throws against the Charmed and Frightened conditions." }
                    ],
                    18: [
                        { name: "Warping Implosion", desc: "Teleport up to 120ft. Each creature within 30ft of the space you left: STR save or 3d10 force damage and pulled toward your old position. Once per Long Rest, or for 5 sorcery points." }
                    ]
                }
            }
        }
    },

    // ===== ROGUE CLASS =====
    rogue: {
        hitDie: 8,
        savingThrows: ["dex", "int"],
        skillOptions: ["acrobatics", "athletics", "deception", "insight", "intimidation", "investigation", "perception", "persuasion", "sleight of hand", "stealth"],
        skillCount: 4,

        sneakAttack: {
            1: "1d6", 2: "1d6", 3: "2d6", 4: "2d6", 5: "3d6", 6: "3d6",
            7: "4d6", 8: "4d6", 9: "5d6", 10: "5d6", 11: "6d6", 12: "6d6",
            13: "7d6", 14: "7d6", 15: "8d6", 16: "8d6", 17: "9d6", 18: "9d6",
            19: "10d6", 20: "10d6"
        },

        asiLevels: [4, 8, 10, 12, 16, 19],
        expertiseLevels: [1, 6],

        features: {
            1: [
                { name: "Expertise", desc: "You gain Expertise in two of your skill proficiencies (two more at level 6)." },
                { name: "Sneak Attack", act: 'attack', desc: "Once per turn, deal extra damage (1d6; 2d6 at levels 3-4) to one creature you hit with a Finesse or Ranged weapon attack if you have Advantage — or, without Advantage, if an ally that isn't Incapacitated is within 5 ft of the target and you don't have Disadvantage." },
                { name: "Thieves' Cant", desc: "You know Thieves' Cant and one other language of your choice." },
                { name: "Weapon Mastery", desc: "You can use the mastery properties of two kinds of Simple or Martial weapons. Whenever you finish a Long Rest, you can change both choices." }
            ],
            2: [
                { name: "Cunning Action", act: 'bonus', desc: "On your turn, take the Dash, Disengage or Hide action as a Bonus Action." }
            ],
            3: [
                { name: "Steady Aim", act: 'bonus', desc: "Bonus Action (only if you haven't moved this turn): Advantage on your next attack roll this turn; your Speed becomes 0 until the end of the turn." },
                { name: "Rogue Subclass", desc: "Choose your Roguish Archetype. It grants features at level 3 and at higher levels." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 10, 12 and 16 (Epic Boon at 19)." }
            ],
            5: [
                { name: "Uncanny Dodge", act: 'reaction', desc: "When an attacker you can see hits you with an attack roll, you can take a Reaction to halve the attack's damage against you (round down)." },
                { name: "Cunning Strike", act: 'attack', desc: "When you deal Sneak Attack damage, you can give up Sneak Attack dice to add one effect (save DC = 8 + Dexterity modifier + Proficiency Bonus): Poison (1d6; needs a Poisoner's Kit; Constitution save or Poisoned for 1 minute, save again at the end of each turn), Trip (1d6; Large or smaller, Dexterity save or Prone) or Withdraw (1d6; right after the attack you move up to half your Speed without provoking Opportunity Attacks)." }
            ],
            6: [
                { name: "Expertise", desc: "Choose 2 more skills (or Thieves' Tools) to gain doubled proficiency bonus with." }
            ],
            7: [
                { name: "Evasion", desc: "When you make a DEX saving throw for half damage: take no damage on a success and half damage on a failure." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            10: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            11: [
                { name: "Reliable Talent", desc: "When you make an ability check you're proficient in, treat any d20 roll of 9 or lower as a 10." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            14: [
                { name: "Blindsense", desc: "As long as you can hear, you know the location of hidden or invisible creatures within 10ft." },
                { name: "Devious Strikes", desc: "Extra Cunning Strike options: Daze (2d6, CON save or disadvantage on attacks), Knock Out (6d6, CON save or Unconscious 1 min), Obscure (3d6, target Blinded until the end of its next turn)." }
            ],
            15: [
                { name: "Slippery Mind", desc: "You gain proficiency in Wisdom saving throws." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            18: [
                { name: "Elusive", desc: "No attack roll has advantage against you while you aren't Incapacitated." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ],
            20: [
                { name: "Stroke of Luck", desc: "Turn a missed attack into a hit, or treat the d20 of a failed ability check as a 20. Once per Short or Long Rest." }
            ]
        },

        subclasses: {
            // NOTE: Scout is LEGACY — not in the 2024 PHB. 2024 subclasses: Arcane Trickster, Assassin, Soulknife, Thief.
            scout: {
                name: "Scout",
                legacy: true,
                level: 3,
                features: {
                    3: [
                        { name: "Skirmisher", desc: "Reaction: when an enemy ends its turn within 5ft of you, move up to half your speed away without provoking opportunity attacks." },
                        { name: "Survivalist", desc: "You gain proficiency in Nature and Survival, and gain Expertise in those skills." }
                    ],
                    9: [
                        { name: "Superior Mobility", desc: "Your walking speed increases by 10ft. This also applies to your climb and swim speeds if you have them." }
                    ],
                    13: [
                        { name: "Ambush Master", desc: "Advantage on initiative rolls. The first creature you hit in the first round of combat grants all allies advantage on attacks against it until the start of your next turn." }
                    ],
                    17: [
                        { name: "Sudden Strike", desc: "When you take the Attack action, you can make an extra attack as a Bonus Action. You can apply Sneak Attack to both attacks, but not against the same target." }
                    ]
                }
            },
            thief: {
                name: "Thief",
                level: 3,
                features: {
                    3: [
                        { name: "Fast Hands", act: 'bonus', desc: "Bonus Action: make a Dexterity (Sleight of Hand) check to pick a lock, disarm a trap or pick a pocket; take the Utilize action; or take the Magic action to use a magic item that requires it." },
                        { name: "Second-Story Work", desc: "You gain a Climb Speed equal to your Speed, and you can use Dexterity instead of Strength to determine your jump distance." }
                    ],
                    9: [
                        { name: "Supreme Sneak", desc: "Advantage on Stealth checks if you move no more than half your speed this turn." }
                    ],
                    13: [
                        { name: "Use Magic Device", desc: "You can use any magic item, ignoring class, race, and level requirements." }
                    ],
                    17: [
                        { name: "Thief's Reflexes", desc: "You get an extra turn in the first round of combat (at your initiative minus 10)." }
                    ]
                }
            },
            assassin: {
                name: "Assassin",
                level: 3,
                features: {
                    3: [
                        { name: "Assassinate", act: 'attack', desc: "You have Advantage on Initiative rolls. During the first round of each combat, you have Advantage on attack rolls against any creature that hasn't taken a turn yet, and if your Sneak Attack hits during that round, the target takes extra damage equal to your Rogue level." },
                        { name: "Assassin's Tools", desc: "You gain a Disguise Kit and a Poisoner's Kit and proficiency with both." }
                    ],
                    9: [
                        { name: "Infiltration Expertise", desc: "Spend 25 gp and 7 days to create a false identity with documents, an established history, and a disguise." }
                    ],
                    13: [
                        { name: "Envenom Weapons", desc: "Spend 1 minute preparing poison. Your next hit deals an extra 2d6 + proficiency bonus poison damage (CON save for half). Uses = prof bonus per Long Rest." }
                    ],
                    17: [
                        { name: "Death Strike", desc: "When you hit a surprised creature: CON save (DC 8 + DEX mod + prof) or the damage is doubled." }
                    ]
                }
            },
            arcaneTrickster: {
                name: "Arcane Trickster",
                level: 3,
                features: {
                    3: [
                        { name: "Spellcasting", desc: "Intelligence; Wizard spell list. Cantrips: Mage Hand + 2 of your choice (a 4th at level 10) — whenever you gain a Rogue level you can replace one, except Mage Hand. Prepared spells: 3 level 1 spells at level 3, 4 at level 4; whenever you gain a Rogue level you can replace one. Spell slots: 2 level 1 slots at level 3, 3 at level 4. Spellcasting focus: an Arcane Focus." },
                        { name: "Mage Hand Legerdemain", act: 'bonus', desc: "You can cast Mage Hand as a Bonus Action and make the hand Invisible. You can control it as a Bonus Action and make Dexterity (Sleight of Hand) checks through it." }
                    ],
                    9: [
                        { name: "Magical Ambush", desc: "If you have the Invisible condition when you cast a spell on a creature, that creature has Disadvantage on any saving throw it makes against the spell on the same turn." }
                    ],
                    13: [
                        { name: "Versatile Trickster", desc: "When you use the Trip option of Cunning Strike on a creature, you can also apply that option to another creature within 5 feet of the spectral hand." }
                    ],
                    17: [
                        { name: "Spell Thief", desc: "Reaction, right after a creature casts a spell that targets you or includes you in its area: it makes an Intelligence saving throw against your spell save DC. On a failure you negate the spell's effect against you, and if the spell is level 1+ and of a level you can cast, you have it prepared for 8 hours while the caster can't cast it. Recharges on a Long Rest." }
                    ]
                }
            },
            soulknife: {
                name: "Soulknife",
                level: 3,
                features: {
                    3: [
                        { name: "Psionic Power", desc: "You have Psionic Energy Dice that fuel this subclass's powers: 4 × d6 (6 × d8 at level 5, 8 × d8 at 9, 8 × d10 at 11, 10 × d10 at 13, 12 × d12 at 17). You regain one expended die on a Short Rest and all of them on a Long Rest." },
                        { name: "Psi-Bolstered Knack", act: 'free', desc: "When you fail an ability check using a skill or tool you're proficient with, roll a Psionic Energy Die and add it to the check; the die is spent only if the check then succeeds." },
                        { name: "Psychic Whispers", act: 'action', desc: "Magic action: choose up to your Proficiency Bonus in creatures you can see and roll a Psionic Energy Die; for that many hours you and they can speak telepathically while within 1 mile of each other. The first use after each Long Rest doesn't spend the die." },
                        { name: "Psychic Blades", act: 'attack', desc: "When you take the Attack action or make an Opportunity Attack, you can attack with a psychic blade from your free hand: Simple melee weapon, 1d6 Psychic, Finesse, Thrown (60/120 ft), Vex mastery; it vanishes after the attack. Afterwards, as a Bonus Action, you can attack with a second blade (1d4) if your other hand is free." }
                    ],
                    9: [
                        { name: "Soul Blades", desc: "Homing Strikes: when a Psychic Blade misses, spend a Psionic Energy die to add it to the attack roll. Psychic Teleportation: spend a die to teleport up to 10x the result in feet." }
                    ],
                    13: [
                        { name: "Psychic Veil", desc: "Bonus Action: become invisible for 1 hour (or until you attack or cast a spell). Once per Long Rest, or by spending a Psionic Energy die." }
                    ],
                    17: [
                        { name: "Rend Mind", desc: "On a Sneak Attack with your Psychic Blades: the target makes a WIS save or is Stunned for 1 minute (repeat save at end of turns). Once per Long Rest, or for 3 Psionic Energy dice." }
                    ]
                }
            }
        }
    },

    // ===== THIRD-CASTER SPELL SLOTS (Eldritch Knight / Arcane Trickster) =====
    // Start op level 3 (subclass gain). Max 4th level slots op lvl 19.
    thirdCasterSlots: {
        3:  [2,0,0,0],
        4:  [3,0,0,0],
        5:  [3,0,0,0],
        6:  [3,0,0,0],
        7:  [4,2,0,0],
        8:  [4,2,0,0],
        9:  [4,2,0,0],
        10: [4,3,0,0],
        11: [4,3,0,0],
        12: [4,3,0,0],
        13: [4,3,2,0],
        14: [4,3,2,0],
        15: [4,3,2,0],
        16: [4,3,3,0],
        17: [4,3,3,0],
        18: [4,3,3,0],
        19: [4,3,3,1],
        20: [4,3,3,1]
    },

    // ===== HALF-CASTER SPELL SLOTS =====
    halfCasterSlots: {
        // 2024 PHB: Paladin/Ranger cast from level 1 (2x 1st-level slots).
        // 2014 had no L1 row — added for Leveling Up fase F; spot-check PHB.
        1:  [2,0,0,0,0],
        2:  [2,0,0,0,0],
        3:  [3,0,0,0,0],
        4:  [3,0,0,0,0],
        5:  [4,2,0,0,0],
        6:  [4,2,0,0,0],
        7:  [4,3,0,0,0],
        8:  [4,3,0,0,0],
        9:  [4,3,2,0,0],
        10: [4,3,2,0,0],
        11: [4,3,3,0,0],
        12: [4,3,3,0,0],
        13: [4,3,3,1,0],
        14: [4,3,3,1,0],
        15: [4,3,3,2,0],
        16: [4,3,3,2,0],
        17: [4,3,3,3,1],
        18: [4,3,3,3,1],
        19: [4,3,3,3,2],
        20: [4,3,3,3,2]
    },

    // ===== RANGER CLASS =====
    ranger: {
        hitDie: 10,
        savingThrows: ["str", "dex"],
        skillOptions: ["animal handling", "athletics", "insight", "investigation", "nature", "perception", "stealth", "survival"],
        skillCount: 3,
        asiLevels: [4, 8, 12, 16, 19],

        // Half caster: uses DATA.halfCasterSlots. 2024: casts from level 1
        // (2 prepared, 2x 1st-level slots) — was 2 in the 2014 layout.
        spellcasting: "half",
        spellcastingStart: 1,

        spells: [
            { name: "Hunter's Mark", lvl: 1, kind: 'innate', slots: true, res: 'favoredEnemy', note: "Favored Enemy" }
        ],
        features: {
            1: [
                { name: "Favored Enemy", desc: "Hunter's Mark is always prepared (it doesn't count against your prepared spells). You can cast it twice without a spell slot (3 times from level 5, more later); all uses return on a Long Rest." },
                { name: "Spellcasting", desc: "Wisdom; Ranger spell list. Prepared spells: 2 at level 1 → 5 at level 4; whenever you finish a Long Rest you can replace one prepared spell. Spell slots: 2 level 1 slots (3 from level 3). Spellcasting focus: a Druidic Focus." },
                { name: "Weapon Mastery", desc: "You can use the mastery properties of two kinds of Simple or Martial weapons. Whenever you finish a Long Rest, you can change both choices." }
            ],
            2: [
                { name: "Deft Explorer", desc: "Gain Expertise in one of your skill proficiencies, and learn two languages of your choice." },
                { name: "Fighting Style", desc: "Gain a Fighting Style feat — or Druidic Warrior instead: learn two Druid cantrips (Wisdom is their spellcasting ability; whenever you gain a Ranger level you can replace one)." }
            ],
            3: [
                { name: "Ranger Subclass", desc: "Choose your Ranger Archetype. It grants features at level 3 and at higher levels." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 12 and 16 (Epic Boon at 19)." }
            ],
            5: [
                { name: "Extra Attack", desc: "You can attack twice instead of once whenever you take the Attack action on your turn." }
            ],
            6: [
                { name: "Roving", desc: "Your walking speed increases by 5ft, and you gain a climbing and swimming speed equal to your walking speed." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            10: [
                { name: "Nature's Veil", desc: "Bonus Action: become invisible until the start of your next turn. Uses per Long Rest = proficiency bonus." },
                { name: "Tireless", desc: "As an action, gain temporary HP equal to 1d8 + WIS modifier. Uses per Long Rest = proficiency bonus. On a Short Rest you also reduce your exhaustion by 1 level." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            18: [
                { name: "Feral Senses", desc: "You have Blindsight 30ft. Invisible creatures gain no advantage on attacks against you." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ],
            20: [
                { name: "Foe Slayer", desc: "Once per turn, add your WIS modifier to an attack roll or damage roll." }
            ]
        },

        subclasses: {
            hunter: {
                name: "Hunter",
                level: 3,
                features: {
                    3: [
                        { name: "Hunter's Lore", desc: "While a creature is marked by your Hunter's Mark, you know whether it has any Immunities, Resistances or Vulnerabilities, and what they are." },
                        { name: "Hunter's Prey", act: 'attack', desc: "Choose one (you can switch whenever you finish a Short or Long Rest). Colossus Slayer: once per turn, a weapon hit deals an extra 1d8 damage if the target is missing any HP. Horde Breaker: once per turn when you attack with a weapon, make another attack with it against a different creature within 5 ft of the first target (and in range) that you haven't attacked this turn." }
                    ],
                    7: [
                        { name: "Defensive Tactics", desc: "Choose one option: Escape the Horde (opportunity attacks against you have disadvantage), Multiattack Defense (+4 AC after a creature's first hit), or Steel Will (advantage on saves against Frightened)." }
                    ],
                    11: [
                        { name: "Multiattack", desc: "Choose one option: Volley (ranged attack against every creature within 10ft of a point, 1 piece of ammo per target) or Whirlwind Attack (melee attack against every creature within 5ft)." }
                    ],
                    15: [
                        { name: "Superior Hunter's Defense", desc: "Choose one option: Evasion (no damage on a successful DEX save), Stand Against the Tide (redirect a missed melee attack to another creature), or Uncanny Dodge (halve an attack's damage as a reaction)." }
                    ]
                }
            },
            beastMaster: {
                name: "Beast Master",
                level: 3,
                features: {
                    3: [
                        { name: "Primal Companion", act: 'bonus', desc: "You summon a primal beast (Beast of the Land, Sea or Sky stat block) that obeys you. In combat it acts on your turn and takes the Dodge action unless you command it with a Bonus Action — or give up one of your attacks when you take the Attack action to have it use Beast's Strike. If it died within the last hour, a Magic action plus a spell slot revives it after 1 minute. Whenever you finish a Long Rest, you can summon a different beast." }
                    ],
                    7: [
                        { name: "Exceptional Training", desc: "Bonus Action: command your beast to Dash, Dodge, or Help." }
                    ],
                    11: [
                        { name: "Bestial Fury", desc: "Your beast can attack twice when it takes the Attack action." }
                    ],
                    15: [
                        { name: "Share Spells", desc: "Spells you cast on yourself with a range of Self also affect your beast if it's within 30ft." }
                    ]
                }
            },
            feyWanderer: {
                name: "Fey Wanderer",
                level: 3,
                choices: { 3: [{ id: 'skills', count: 1, options: ['deception', 'performance', 'persuasion'], featName: 'Otherworldly Glamour' }] },
                spells: [
                    { name: "Charm Person", lvl: 3, kind: 'prepared' },
                    { name: "Misty Step", lvl: 5, kind: 'prepared' },
                    { name: "Summon Fey", lvl: 9, kind: 'prepared' },
                    { name: "Dimension Door", lvl: 13, kind: 'prepared' },
                    { name: "Mislead", lvl: 17, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Dreadful Strikes", act: 'attack', desc: "When you hit a creature with a weapon, you can deal an extra 1d4 Psychic damage (once per turn per creature; 1d6 from level 11)." },
                        { name: "Otherworldly Glamour", desc: "Add your Wisdom modifier (min +1) to your Charisma checks, and gain proficiency in Deception, Performance or Persuasion (your choice)." },
                        { name: "Fey Wanderer Spells", desc: "Always prepared: Charm Person (level 3); Misty Step (5); Summon Fey (9); Dimension Door (13); Mislead (17). You also carry a small fey blessing (a harmless quirk of your choice)." }
                    ],
                    7: [
                        { name: "Beguiling Twist", desc: "When a creature within 120ft succeeds on a save against Charmed or Frightened: as a reaction, redirect the effect to another creature within 120ft (WIS save)." }
                    ],
                    11: [
                        { name: "Fey Reinforcements", desc: "Cast Summon Fey once per Long Rest without a spell slot. You can also cast it with spell slots." }
                    ],
                    15: [
                        { name: "Misty Wanderer", desc: "Cast Misty Step for free a number of times equal to your proficiency bonus per Long Rest. When you cast Misty Step, you can bring along 1 willing creature within 5ft." }
                    ]
                }
            },
            gloomStalker: {
                name: "Gloom Stalker",
                level: 3,
                spells: [
                    { name: "Disguise Self", lvl: 3, kind: 'prepared' },
                    { name: "Rope Trick", lvl: 5, kind: 'prepared' },
                    { name: "Fear", lvl: 9, kind: 'prepared' },
                    { name: "Greater Invisibility", lvl: 13, kind: 'prepared' },
                    { name: "Seeming", lvl: 17, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Dread Ambusher", act: 'attack', desc: "Ambusher's Leap: your Speed is 10 ft higher on your first turn of each combat. Dreadful Strike: when you hit a creature with a weapon, deal an extra 2d6 Psychic damage (once per turn; uses = your Wisdom modifier (min 1) per Long Rest). Initiative Bonus: add your Wisdom modifier to Initiative rolls." },
                        { name: "Umbral Sight", desc: "You gain Darkvision 60 ft (or +60 ft if you already have it). While entirely in Darkness, you're Invisible to creatures that rely on Darkvision to see you." },
                        { name: "Gloom Stalker Spells", desc: "Always prepared: Disguise Self (level 3); Rope Trick (5); Fear (9); Greater Invisibility (13); Seeming (17)." }
                    ],
                    7: [
                        { name: "Iron Mind", desc: "You gain proficiency in WIS saving throws. If you already have it, choose INT or CHA saves instead." }
                    ],
                    11: [
                        { name: "Stalker's Flurry", desc: "When you miss with an attack, you can immediately make an extra attack against the same target." }
                    ],
                    15: [
                        { name: "Shadowy Dodge", desc: "Reaction: when a creature makes an attack roll against you, impose disadvantage on that attack roll." }
                    ]
                }
            }
        }
    },

    // ===== WIZARD CLASS =====
    wizard: {
        hitDie: 6,
        savingThrows: ["int", "wis"],
        skillOptions: ["arcana", "history", "insight", "investigation", "medicine", "nature", "religion"],
        skillCount: 2,
        asiLevels: [4, 8, 12, 16, 19],

        // Full caster: uses same spell slot table as sorcerer
        spellcasting: "full",
        spellSlots: {
            1:  [2,0,0,0,0,0,0,0,0],
            2:  [3,0,0,0,0,0,0,0,0],
            3:  [4,2,0,0,0,0,0,0,0],
            4:  [4,3,0,0,0,0,0,0,0],
            5:  [4,3,2,0,0,0,0,0,0],
            6:  [4,3,3,0,0,0,0,0,0],
            7:  [4,3,3,1,0,0,0,0,0],
            8:  [4,3,3,2,0,0,0,0,0],
            9:  [4,3,3,3,1,0,0,0,0],
            10: [4,3,3,3,2,0,0,0,0],
            11: [4,3,3,3,2,1,0,0,0],
            12: [4,3,3,3,2,1,0,0,0],
            13: [4,3,3,3,2,1,1,0,0],
            14: [4,3,3,3,2,1,1,0,0],
            15: [4,3,3,3,2,1,1,1,0],
            16: [4,3,3,3,2,1,1,1,0],
            17: [4,3,3,3,2,1,1,1,1],
            18: [4,3,3,3,3,1,1,1,1],
            19: [4,3,3,3,3,2,1,1,1],
            20: [4,3,3,3,3,2,2,1,1]
        },

        cantripsKnown: { 1:3, 2:3, 3:3, 4:4, 5:4, 6:4, 7:4, 8:4, 9:4, 10:5, 11:5, 12:5, 13:5, 14:5, 15:5, 16:5, 17:5, 18:5, 19:5, 20:5 },
        maxSpellLevel: { 1:1, 2:1, 3:2, 4:2, 5:3, 6:3, 7:4, 8:4, 9:5, 10:5, 11:6, 12:6, 13:7, 14:7, 15:8, 16:8, 17:9, 18:9, 19:9, 20:9 },

        features: {
            1: [
                { name: "Spellcasting", desc: "Intelligence; Wizard spell list. Cantrips: 3 (4 from level 4) — whenever you finish a Long Rest you can replace one. Spellbook: six level 1 spells to start, plus two Wizard spells of a level you have slots for each time you gain a Wizard level. Prepared spells (from your spellbook): 4 at level 1 → 7 at level 4; whenever you finish a Long Rest you can change your whole list. Spellcasting focus: an Arcane Focus or your spellbook." },
                { name: "Ritual Adept", desc: "You can cast any spell with the Ritual tag that is in your spellbook as a Ritual, without having it prepared (you read it from the book)." },
                { name: "Arcane Recovery", desc: "Once per day, when you finish a Short Rest, recover expended spell slots with a combined level up to half your Wizard level (round up), none of level 6 or higher. Regained on a Long Rest." }
            ],
            2: [
                { name: "Scholar", desc: "Gain Expertise in one of these skills you're proficient in: Arcana, History, Investigation, Medicine, Nature or Religion." }
            ],
            3: [
                { name: "Wizard Subclass", desc: "Choose your Arcane Tradition. It grants features at level 3 and at higher levels." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 12 and 16 (Epic Boon at 19)." }
            ],
            5: [
                { name: "Memorize Spell", desc: "Whenever you finish a Short Rest, you can study your spellbook and replace one level 1+ Wizard spell you have prepared with another level 1+ spell from the book." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            18: [
                { name: "Spell Mastery", desc: "Choose a 1st-level and a 2nd-level wizard spell. You can cast them at their lowest level without expending a spell slot." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ],
            20: [
                { name: "Signature Spells", desc: "Choose two 3rd-level wizard spells. They are always prepared and you can cast each once per Short or Long Rest without a spell slot." }
            ]
        },

        subclasses: {
            evocation: {
                name: "Evoker",
                level: 3,
                features: {
                    3: [
                        { name: "Evocation Savant", desc: "Add two Evocation spells of level 2 or lower to your spellbook for free. Whenever you gain access to a new level of spell slots, add one Evocation spell of that level for free." },
                        { name: "Potent Cantrip", desc: "When a creature avoids your damaging cantrip — your attack roll misses or it succeeds on the save — it still takes half the cantrip's damage (but none of its other effects)." }
                    ],
                    6: [
                        { name: "Potent Cantrip", desc: "When a creature succeeds on a saving throw against your cantrip, it still takes half the damage." }
                    ],
                    10: [
                        { name: "Empowered Evocation", desc: "Add your INT modifier to the damage of any evocation spell you cast." }
                    ],
                    14: [
                        { name: "Overchannel", desc: "When you cast a wizard spell of 5th level or lower, deal maximum damage. After the first use per Long Rest you take 2d12 necrotic damage per spell level (rising with repeated use)." }
                    ]
                }
            },
            abjuration: {
                name: "Abjurer",
                level: 3,
                features: {
                    3: [
                        { name: "Abjuration Savant", desc: "Add two Abjuration spells of level 2 or lower to your spellbook for free. Whenever you gain access to a new level of spell slots, add one Abjuration spell of that level for free." },
                        { name: "Arcane Ward", act: 'bonus', desc: "When you cast an Abjuration spell with a spell slot, you can create a magical ward on yourself (once per Long Rest; it lasts until then) with HP = 2 × your Wizard level + your Intelligence modifier. It takes damage before you (after Resistances). Casting an Abjuration spell with a slot restores 2 × the slot's level HP to it; as a Bonus Action you can also expend a spell slot to restore 2 × its level." }
                    ],
                    6: [
                        { name: "Projected Ward", desc: "When a creature within 30ft takes damage, you can use your reaction to let your Arcane Ward absorb that damage." }
                    ],
                    10: [
                        { name: "Improved Abjuration", desc: "Add your proficiency bonus to ability checks for Counterspell and Dispel Magic." }
                    ],
                    14: [
                        { name: "Spell Resistance", desc: "You have advantage on saving throws against spells, and resistance to damage from spells." }
                    ]
                }
            },
            divination: {
                name: "Diviner",
                level: 3,
                features: {
                    3: [
                        { name: "Divination Savant", desc: "Add two Divination spells of level 2 or lower to your spellbook for free. Whenever you gain access to a new level of spell slots, add one Divination spell of that level for free." },
                        { name: "Portent", act: 'free', desc: "After each Long Rest, roll two d20s and record them. You can replace any D20 Test made by you or a creature you can see with one of these rolls (decide before the roll; once per turn). Unused rolls are lost on your next Long Rest." }
                    ],
                    6: [
                        { name: "Expert Divination", desc: "When you cast a divination spell of 2nd level or higher, you regain a spell slot of a lower level than the spell cast." }
                    ],
                    10: [
                        { name: "The Third Eye", desc: "As an action, choose one option (lasting until you take a Short or Long Rest): darkvision 120ft, ethereal sight 60ft, see invisibility 10ft, or read any language." }
                    ],
                    14: [
                        { name: "Greater Portent", desc: "You roll 3d20 for Portent instead of 2d20." }
                    ]
                }
            },
            illusion: {
                name: "Illusionist",
                level: 3,
                spells: [
                    { name: "Minor Illusion", lvl: 3, kind: 'cantrip', ifKnown: 'wizard', note: "Bonus Action; sound and image at once" }
                ],
                features: {
                    3: [
                        { name: "Illusion Savant", desc: "Add two Illusion spells of level 2 or lower to your spellbook for free. Whenever you gain access to a new level of spell slots, add one Illusion spell of that level for free." },
                        { name: "Improved Illusions", act: 'bonus', desc: "You cast Illusion spells without Verbal components, and Illusion spells with a range of 10 ft or more get +60 ft range. You know Minor Illusion (if you already knew it, learn another Wizard cantrip instead); it doesn't count against your cantrips, creates both a sound and an image in one casting, and can be cast as a Bonus Action." }
                    ],
                    6: [
                        { name: "Malleable Illusions", desc: "As an action, you can change the nature of an illusion you created (within the spell's limits)." }
                    ],
                    10: [
                        { name: "Illusory Self", desc: "Reaction: when a creature makes an attack roll against you, create an illusory duplicate of yourself. The attack automatically misses. Once per Short or Long Rest." }
                    ],
                    14: [
                        { name: "Illusory Reality", desc: "When you cast an illusion spell of 1st level or higher, you can make one element of the illusion real for 1 minute. The object can't deal damage directly." }
                    ]
                }
            }
        }
    },

    // ===== PALADIN CLASS =====
    paladin: {
        hitDie: 10,
        savingThrows: ["wis", "cha"],
        skillOptions: ["athletics", "insight", "intimidation", "medicine", "persuasion", "religion"],
        skillCount: 2,
        asiLevels: [4, 8, 12, 16, 19],

        // Half caster: uses DATA.halfCasterSlots. 2024: casts from level 1
        // (2 prepared, 2x 1st-level slots) — was 2 in the 2014 layout.
        spellcasting: "half",
        spellcastingStart: 1,

        spells: [
            { name: "Divine Smite", lvl: 2, kind: 'innate', slots: true, res: 'paladinSmite', note: "Paladin's Smite" },
            { name: "Find Steed", lvl: 5, kind: 'innate', free: 1, recharge: 'long', slots: true, note: "Faithful Steed" }
        ],
        features: {
            1: [
                { name: "Lay on Hands", act: 'bonus', desc: "You have a healing pool of 5 × your Paladin level HP, refilled on a Long Rest. Bonus Action: touch a creature (or yourself) and restore any number of HP from the pool, or spend 5 points to end the Poisoned condition on it." },
                { name: "Spellcasting", desc: "Charisma; Paladin spell list. Prepared spells: 2 at level 1 → 5 at level 4; whenever you finish a Long Rest you can replace one prepared spell. Spell slots: 2 level 1 slots (3 from level 3). Spellcasting focus: a Holy Symbol." },
                { name: "Weapon Mastery", desc: "You can use the mastery properties of two kinds of Simple or Martial weapons. Whenever you finish a Long Rest, you can change both choices." }
            ],
            2: [
                { name: "Fighting Style", desc: "Gain a Fighting Style feat — or Blessed Warrior instead: learn two Cleric cantrips (Charisma is their spellcasting ability; whenever you gain a Paladin level you can replace one)." },
                { name: "Paladin's Smite", desc: "Divine Smite is always prepared, and you can cast it once without a spell slot (regained on a Long Rest)." }
            ],
            3: [
                { name: "Channel Divinity", desc: "Two uses (three from level 11); regain one on a Short Rest and all on a Long Rest. Each use creates one effect: Divine Sense or your Oath's option. Saving throws use your spell save DC." },
                { name: "Divine Sense", act: 'bonus', desc: "Bonus Action, one Channel Divinity use: for 10 minutes you know the location and creature type of any Celestial, Fiend or Undead within 60 ft, and you sense consecrated or desecrated places there." },
                { name: "Paladin Subclass", desc: "Choose your Sacred Oath. It grants features at level 3 and at higher levels." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 12 and 16 (Epic Boon at 19)." }
            ],
            5: [
                { name: "Extra Attack", desc: "You can attack twice instead of once whenever you take the Attack action on your turn." },
                { name: "Faithful Steed", desc: "You always have Find Steed prepared, and you can cast it once without a spell slot (regained on a Long Rest)." }
            ],
            6: [
                { name: "Aura of Protection", desc: "You and friendly creatures within 10ft gain a bonus to saving throws equal to your CHA modifier (min +1). At level 18 this grows to 30ft." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            9: [
                { name: "Abjure Foes", desc: "Channel Divinity: creatures of your choice within 60ft make a WIS save or are Frightened for 1 minute, with speed 0 while Frightened." }
            ],
            10: [
                { name: "Aura of Courage", desc: "You and friendly creatures within 10ft can't be Frightened while you are conscious. At level 18 this grows to 30ft." }
            ],
            11: [
                { name: "Radiant Strikes", desc: "All your melee weapon attacks deal an extra 1d8 radiant damage." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            14: [
                { name: "Restoring Touch", desc: "As an action via Lay On Hands: end one condition (Blinded, Charmed, Deafened, Frightened, Paralyzed, or Stunned) by spending 5 HP from your pool." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ]
        },

        subclasses: {
            devotion: {
                name: "Oath of Devotion",
                level: 3,
                spells: [
                    { name: "Protection from Evil and Good", lvl: 3, kind: 'prepared' },
                    { name: "Shield of Faith", lvl: 3, kind: 'prepared' },
                    { name: "Aid", lvl: 5, kind: 'prepared' },
                    { name: "Zone of Truth", lvl: 5, kind: 'prepared' },
                    { name: "Beacon of Hope", lvl: 9, kind: 'prepared' },
                    { name: "Dispel Magic", lvl: 9, kind: 'prepared' },
                    { name: "Freedom of Movement", lvl: 13, kind: 'prepared' },
                    { name: "Guardian of Faith", lvl: 13, kind: 'prepared' },
                    { name: "Commune", lvl: 17, kind: 'prepared' },
                    { name: "Flame Strike", lvl: 17, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Sacred Weapon", act: 'attack', desc: "When you take the Attack action, spend one Channel Divinity use: for 10 minutes, a melee weapon you hold adds your Charisma modifier (min +1) to its attack rolls, can deal Radiant damage instead of its normal type, and sheds Bright Light 20 ft (Dim 20 ft more)." },
                        { name: "Oath of Devotion Spells", desc: "Always prepared: Protection from Evil and Good, Shield of Faith (level 3); Aid, Zone of Truth (5); Beacon of Hope, Dispel Magic (9); Freedom of Movement, Guardian of Faith (13); Commune, Flame Strike (17)." }
                    ],
                    7: [
                        { name: "Aura of Devotion", desc: "You and friendly creatures within 10ft can't be Charmed. At level 18 this grows to 30ft." }
                    ],
                    15: [
                        { name: "Purity of Spirit", desc: "You are always under the effect of Protection from Evil and Good." }
                    ],
                    20: [
                        { name: "Holy Nimbus", desc: "As an action: for 1 minute you shed bright light in 30ft, and enemies within 10ft take 10 radiant damage each turn. Advantage on saves against spells of fiends and undead. Once per Long Rest." }
                    ]
                }
            },
            ancients: {
                name: "Oath of the Ancients",
                level: 3,
                spells: [
                    { name: "Ensnaring Strike", lvl: 3, kind: 'prepared' },
                    { name: "Speak with Animals", lvl: 3, kind: 'prepared' },
                    { name: "Misty Step", lvl: 5, kind: 'prepared' },
                    { name: "Moonbeam", lvl: 5, kind: 'prepared' },
                    { name: "Plant Growth", lvl: 9, kind: 'prepared' },
                    { name: "Protection from Energy", lvl: 9, kind: 'prepared' },
                    { name: "Ice Storm", lvl: 13, kind: 'prepared' },
                    { name: "Stoneskin", lvl: 13, kind: 'prepared' },
                    { name: "Commune with Nature", lvl: 17, kind: 'prepared' },
                    { name: "Tree Stride", lvl: 17, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Nature's Wrath", act: 'action', desc: "Magic action, one Channel Divinity use: each creature of your choice that you can see within 15 ft makes a Strength save or is Restrained for 1 minute (it repeats the save at the end of each of its turns)." },
                        { name: "Oath of the Ancients Spells", desc: "Always prepared: Ensnaring Strike, Speak with Animals (level 3); Misty Step, Moonbeam (5); Plant Growth, Protection from Energy (9); Ice Storm, Stoneskin (13); Commune with Nature, Tree Stride (17)." }
                    ],
                    7: [
                        { name: "Aura of Warding", desc: "You and friendly creatures within 10ft have resistance to damage from spells. At level 18 this grows to 30ft." }
                    ],
                    15: [
                        { name: "Undying Sentinel", desc: "When you would drop to 0 HP, you drop to 1 HP instead. Once per Long Rest. You also suffer none of the drawbacks of old age and can't be aged magically." }
                    ],
                    20: [
                        { name: "Elder Champion", desc: "As an action, transform for 1 minute: regain 10 HP at the start of each of your turns, paladin spells with a casting time of 1 action become a Bonus Action, and enemies within 10ft have disadvantage on saves against your spells and Channel Divinity. Once per Long Rest." }
                    ]
                }
            },
            glory: {
                name: "Oath of Glory",
                level: 3,
                spells: [
                    { name: "Guiding Bolt", lvl: 3, kind: 'prepared' },
                    { name: "Heroism", lvl: 3, kind: 'prepared' },
                    { name: "Enhance Ability", lvl: 5, kind: 'prepared' },
                    { name: "Magic Weapon", lvl: 5, kind: 'prepared' },
                    { name: "Haste", lvl: 9, kind: 'prepared' },
                    { name: "Protection from Energy", lvl: 9, kind: 'prepared' },
                    { name: "Compulsion", lvl: 13, kind: 'prepared' },
                    { name: "Freedom of Movement", lvl: 13, kind: 'prepared' },
                    { name: "Legend Lore", lvl: 17, kind: 'prepared' },
                    { name: "Yolande's Regal Presence", lvl: 17, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Inspiring Smite", act: 'free', desc: "Right after you cast Divine Smite, spend one Channel Divinity use: share Temporary HP equal to 2d8 + your Paladin level among creatures of your choice within 30 ft (you can include yourself)." },
                        { name: "Peerless Athlete", act: 'bonus', desc: "Bonus Action, one Channel Divinity use: for 1 hour you have Advantage on Strength (Athletics) and Dexterity (Acrobatics) checks, and your Long and High Jumps go 10 ft further." },
                        { name: "Oath of Glory Spells", desc: "Always prepared: Guiding Bolt, Heroism (level 3); Enhance Ability, Magic Weapon (5); Haste, Protection from Energy (9); Compulsion, Freedom of Movement (13); Legend Lore, Yolande's Regal Presence (17)." }
                    ],
                    7: [
                        { name: "Aura of Alacrity", desc: "You and friendly creatures within 10ft gain +10ft walking speed. At level 18 this grows to 30ft." }
                    ],
                    15: [
                        { name: "Glorious Defense", desc: "Reaction: when a creature within 10ft is hit by an attack, add your CHA modifier to the target's AC. If that makes the attack miss, you can make a weapon attack against the attacker." }
                    ],
                    20: [
                        { name: "Living Legend", desc: "As a Bonus Action, for 1 minute: advantage on CHA checks, one missed weapon attack per turn becomes a hit, and advantage on saving throws against spells. Once per Long Rest." }
                    ]
                }
            },
            vengeance: {
                name: "Oath of Vengeance",
                level: 3,
                spells: [
                    { name: "Bane", lvl: 3, kind: 'prepared' },
                    { name: "Hunter's Mark", lvl: 3, kind: 'prepared' },
                    { name: "Hold Person", lvl: 5, kind: 'prepared' },
                    { name: "Misty Step", lvl: 5, kind: 'prepared' },
                    { name: "Haste", lvl: 9, kind: 'prepared' },
                    { name: "Protection from Energy", lvl: 9, kind: 'prepared' },
                    { name: "Banishment", lvl: 13, kind: 'prepared' },
                    { name: "Dimension Door", lvl: 13, kind: 'prepared' },
                    { name: "Hold Monster", lvl: 17, kind: 'prepared' },
                    { name: "Scrying", lvl: 17, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Vow of Enmity", act: 'attack', desc: "When you take the Attack action, spend one Channel Divinity use: you have Advantage on attack rolls against a creature you can see within 30 ft for 1 minute (or until you use this again). If it drops to 0 HP first, you can move the vow to another creature within 30 ft (no action)." },
                        { name: "Oath of Vengeance Spells", desc: "Always prepared: Bane, Hunter's Mark (level 3); Hold Person, Misty Step (5); Haste, Protection from Energy (9); Banishment, Dimension Door (13); Hold Monster, Scrying (17)." }
                    ],
                    7: [
                        { name: "Relentless Avenger", desc: "When you hit a creature with an opportunity attack, you can then move up to half your speed as part of the same reaction." }
                    ],
                    15: [
                        { name: "Soul of Vengeance", desc: "When the creature under your Vow of Enmity makes an attack, you can use your reaction to make a melee weapon attack against it." }
                    ],
                    20: [
                        { name: "Avenging Angel", desc: "As an action, transform for 1 hour: you gain wings (fly speed 60ft) and a 30ft aura. Enemies that enter the aura for the first time or start their turn there: WIS save or Frightened for 1 minute. Once per Long Rest." }
                    ]
                }
            }
        }
    },

    // ===== DRUID CLASS =====
    druid: {
        hitDie: 8,
        savingThrows: ["int", "wis"],
        skillOptions: ["arcana", "animal handling", "insight", "medicine", "nature", "perception", "religion", "survival"],
        skillCount: 2,
        asiLevels: [4, 8, 12, 16, 19],

        // Full caster
        spellcasting: "full",
        spellSlots: {
            1:  [2,0,0,0,0,0,0,0,0],
            2:  [3,0,0,0,0,0,0,0,0],
            3:  [4,2,0,0,0,0,0,0,0],
            4:  [4,3,0,0,0,0,0,0,0],
            5:  [4,3,2,0,0,0,0,0,0],
            6:  [4,3,3,0,0,0,0,0,0],
            7:  [4,3,3,1,0,0,0,0,0],
            8:  [4,3,3,2,0,0,0,0,0],
            9:  [4,3,3,3,1,0,0,0,0],
            10: [4,3,3,3,2,0,0,0,0],
            11: [4,3,3,3,2,1,0,0,0],
            12: [4,3,3,3,2,1,0,0,0],
            13: [4,3,3,3,2,1,1,0,0],
            14: [4,3,3,3,2,1,1,0,0],
            15: [4,3,3,3,2,1,1,1,0],
            16: [4,3,3,3,2,1,1,1,0],
            17: [4,3,3,3,2,1,1,1,1],
            18: [4,3,3,3,3,1,1,1,1],
            19: [4,3,3,3,3,2,1,1,1],
            20: [4,3,3,3,3,2,2,1,1]
        },

        // 2024 PHB Druid cantrip column: 2 at L1, 3 at L4, 4 at L10 (was wrongly
        // a copy of the sorcerer table — Leveling Up fase F fix, spot-check PHB).
        cantripsKnown: { 1:2, 2:2, 3:2, 4:3, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4, 14:4, 15:4, 16:4, 17:4, 18:4, 19:4, 20:4 },
        maxSpellLevel: { 1:1, 2:1, 3:2, 4:2, 5:3, 6:3, 7:4, 8:4, 9:5, 10:5, 11:6, 12:6, 13:7, 14:7, 15:8, 16:8, 17:9, 18:9, 19:9, 20:9 },

        spells: [
            { name: "Speak with Animals", lvl: 1, kind: 'prepared', note: "Druidic" },
            { name: "Find Familiar", lvl: 2, kind: 'innate', slots: true, res: 'wildShape', note: "Wild Companion: expend a spell slot or a Wild Shape use; no Material components; the familiar is Fey and leaves on your next Long Rest" }
        ],
        features: {
            1: [
                { name: "Druidic", desc: "You know Druidic, the secret language of druids, and you always have Speak with Animals prepared." },
                { name: "Primal Order", desc: "Choose a sacred role. Magician: one extra Druid cantrip, and add your Wisdom modifier (min +1) to Intelligence (Arcana or Nature) checks. Warden: proficiency with Martial weapons and training with Medium armor." },
                { name: "Spellcasting", desc: "Wisdom; Druid spell list. Cantrips: 2 (3 from level 4) — whenever you gain a Druid level you can replace one. Prepared spells: 4 at level 1 → 7 at level 4; whenever you finish a Long Rest you can change your whole prepared list. Spellcasting focus: a Druidic Focus." }
            ],
            2: [
                { name: "Wild Shape", act: 'bonus', desc: "Bonus Action: shape-shift into a Beast form you know, for hours equal to half your Druid level (leave early as a Bonus Action). You gain Temporary HP equal to your Druid level and keep your HP, INT/WIS/CHA, class features and feats, but you can't cast spells (Concentration isn't broken). Uses: 2 (3 from level 6); regain one on a Short Rest, all on a Long Rest. Known forms: 4 at level 2 (max CR 1/4, no Fly Speed), 6 at level 4 (max CR 1/2, no Fly Speed), 8 at level 8 (max CR 1, Fly allowed). Whenever you finish a Long Rest you can swap one known form." },
                { name: "Wild Companion", act: 'action', desc: "Magic action: expend a spell slot or a use of Wild Shape to cast Find Familiar without Material components. The familiar is Fey and disappears when you finish a Long Rest." }
            ],
            3: [
                { name: "Druid Subclass", desc: "Choose your Druid Circle. It grants features at level 3 and at higher levels." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 12 and 16 (Epic Boon at 19)." }
            ],
            5: [
                { name: "Wild Resurgence", act: 'free', desc: "Once on each of your turns, if you have no Wild Shape uses left, you can expend a spell slot to regain one (no action required). You can also expend a Wild Shape use to gain a level 1 spell slot (no action required) — that part once per Long Rest." }
            ],
            7: [
                { name: "Elemental Fury", desc: "Once per turn when you hit with a melee attack in Wild Shape or with a weapon: add 1d6 extra damage of a chosen element." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ]
        },

        subclasses: {
            land: {
                name: "Circle of the Land",
                level: 3,
                spells: [
                    { name: "Blur", lvl: 3, kind: 'prepared', land: 'arid' },
                    { name: "Burning Hands", lvl: 3, kind: 'prepared', land: 'arid' },
                    { name: "Fire Bolt", lvl: 3, kind: 'cantrip', land: 'arid' },
                    { name: "Fireball", lvl: 5, kind: 'prepared', land: 'arid' },
                    { name: "Blight", lvl: 7, kind: 'prepared', land: 'arid' },
                    { name: "Wall of Stone", lvl: 9, kind: 'prepared', land: 'arid' },
                    { name: "Fog Cloud", lvl: 3, kind: 'prepared', land: 'polar' },
                    { name: "Hold Person", lvl: 3, kind: 'prepared', land: 'polar' },
                    { name: "Ray of Frost", lvl: 3, kind: 'cantrip', land: 'polar' },
                    { name: "Sleet Storm", lvl: 5, kind: 'prepared', land: 'polar' },
                    { name: "Ice Storm", lvl: 7, kind: 'prepared', land: 'polar' },
                    { name: "Cone of Cold", lvl: 9, kind: 'prepared', land: 'polar' },
                    { name: "Misty Step", lvl: 3, kind: 'prepared', land: 'temperate' },
                    { name: "Shocking Grasp", lvl: 3, kind: 'cantrip', land: 'temperate' },
                    { name: "Sleep", lvl: 3, kind: 'prepared', land: 'temperate' },
                    { name: "Lightning Bolt", lvl: 5, kind: 'prepared', land: 'temperate' },
                    { name: "Freedom of Movement", lvl: 7, kind: 'prepared', land: 'temperate' },
                    { name: "Tree Stride", lvl: 9, kind: 'prepared', land: 'temperate' },
                    { name: "Acid Splash", lvl: 3, kind: 'cantrip', land: 'tropical' },
                    { name: "Ray of Sickness", lvl: 3, kind: 'prepared', land: 'tropical' },
                    { name: "Web", lvl: 3, kind: 'prepared', land: 'tropical' },
                    { name: "Stinking Cloud", lvl: 5, kind: 'prepared', land: 'tropical' },
                    { name: "Polymorph", lvl: 7, kind: 'prepared', land: 'tropical' },
                    { name: "Insect Plague", lvl: 9, kind: 'prepared', land: 'tropical' }
                ],
                features: {
                    3: [
                        { name: "Circle of the Land Spells", desc: "Whenever you finish a Long Rest, choose a land type; you have its spells prepared. Arid: Blur, Burning Hands, Fire Bolt. Polar: Fog Cloud, Hold Person, Ray of Frost. Temperate: Misty Step, Shocking Grasp, Sleep. Tropical: Acid Splash, Ray of Sickness, Web. (More at levels 5, 7 and 9.)" },
                        { name: "Land's Aid", act: 'action', desc: "Magic action, one Wild Shape use: in a 10-ft-radius sphere within 60 ft, creatures of your choice make a Constitution save, taking 2d6 Necrotic damage on a failure or half on a success, and one creature of your choice there regains 2d6 HP (3d6 at level 10, 4d6 at 14)." }
                    ],
                    6: [
                        { name: "Land's Stride", desc: "Moving through nonmagical difficult terrain costs no extra movement, and you can pass through nonmagical plants without being slowed or taking damage." }
                    ],
                    10: [
                        { name: "Nature's Ward", desc: "You are immune to poison and disease, and can't be Charmed or Frightened by elementals or fey." }
                    ],
                    14: [
                        { name: "Nature's Sanctuary", desc: "Elemental and fey creatures that attack you must make a WIS save. On a failure they must choose another target, or the attack automatically misses." }
                    ]
                }
            },
            moon: {
                name: "Circle of the Moon",
                level: 3,
                spells: [
                    { name: "Cure Wounds", lvl: 3, kind: 'prepared' },
                    { name: "Moonbeam", lvl: 3, kind: 'prepared' },
                    { name: "Starry Wisp", lvl: 3, kind: 'cantrip' },
                    { name: "Conjure Animals", lvl: 5, kind: 'prepared' },
                    { name: "Fount of Moonlight", lvl: 7, kind: 'prepared' },
                    { name: "Mass Cure Wounds", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Circle Forms", desc: "When you use Wild Shape: the maximum Challenge Rating of the form equals your Druid level ÷ 3, round down (CR 1 at levels 3-5); your AC is 13 + your Wisdom modifier if that's higher than the Beast's; and you gain Temporary HP equal to 3 × your Druid level." },
                        { name: "Circle of the Moon Spells", desc: "Always prepared: Cure Wounds, Moonbeam, Starry Wisp (level 3); Conjure Animals (5); Fount of Moonlight (7); Mass Cure Wounds (9). You can cast these spells while in a Wild Shape form." }
                    ],
                    6: [
                        { name: "Primal Strike", desc: "Your attacks in Wild Shape count as magical for overcoming resistance and immunity." }
                    ],
                    10: [
                        { name: "Elemental Wild Shape", desc: "Spend 2 Wild Shape uses to transform into an Earth, Water, Fire, or Air Elemental." }
                    ],
                    14: [
                        { name: "Thousand Forms", desc: "Cast Alter Self at will, without a spell slot." }
                    ]
                }
            },
            sea: {
                name: "Circle of the Sea",
                level: 3,
                spells: [
                    { name: "Fog Cloud", lvl: 3, kind: 'prepared' },
                    { name: "Gust of Wind", lvl: 3, kind: 'prepared' },
                    { name: "Ray of Frost", lvl: 3, kind: 'cantrip' },
                    { name: "Shatter", lvl: 3, kind: 'prepared' },
                    { name: "Thunderwave", lvl: 3, kind: 'prepared' },
                    { name: "Lightning Bolt", lvl: 5, kind: 'prepared' },
                    { name: "Water Breathing", lvl: 5, kind: 'prepared' },
                    { name: "Control Water", lvl: 7, kind: 'prepared' },
                    { name: "Ice Storm", lvl: 7, kind: 'prepared' },
                    { name: "Conjure Elemental", lvl: 9, kind: 'prepared' },
                    { name: "Hold Monster", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Circle of the Sea Spells", desc: "Always prepared: Fog Cloud, Gust of Wind, Ray of Frost, Shatter, Thunderwave (level 3); Lightning Bolt, Water Breathing (5); Control Water, Ice Storm (7); Conjure Elemental, Hold Monster (9)." },
                        { name: "Wrath of the Sea", act: 'bonus', desc: "Bonus Action, one Wild Shape use: surround yourself with a 5-ft emanation of ocean spray for 10 minutes. When you create it, and as a Bonus Action on later turns, choose a creature you can see in it: it makes a Constitution save or takes Cold damage (d6s equal to your Wisdom modifier, min 1) and, if Large or smaller, is pushed up to 15 ft away." }
                    ],
                    6: [
                        { name: "Aquatic Adaptation", desc: "Resistance to cold damage. You can summon sea creatures with conjuration spells." }
                    ],
                    10: [
                        { name: "Stormborn", desc: "You gain a fly speed during rain or underwater combat, and can call down lightning as an additional attack." }
                    ],
                    14: [
                        { name: "Oceanic Form", desc: "Bonus Action: move through creatures and objects as if they were difficult terrain." }
                    ]
                }
            },
            stars: {
                name: "Circle of the Stars",
                level: 3,
                spells: [
                    { name: "Guidance", lvl: 3, kind: 'cantrip', note: "while holding your Star Map" },
                    { name: "Guiding Bolt", lvl: 3, kind: 'innate', free: 'wis', recharge: 'long', slots: true, note: "while holding your Star Map" }
                ],
                features: {
                    3: [
                        { name: "Star Map", desc: "You carry a star chart (a Tiny object you can use as a spellcasting focus). While holding it, you have Guidance and Guiding Bolt prepared, and you can cast Guiding Bolt without a spell slot a number of times equal to your Wisdom modifier (min 1) per Long Rest. A lost map can be recreated in a 1-hour ceremony during a rest." },
                        { name: "Starry Form", act: 'bonus', desc: "Bonus Action, one Wild Shape use: take on a starry form for 10 minutes (you keep your statistics; Bright Light 10 ft, Dim Light 10 ft more). Pick a constellation each time: Archer — when you activate it and as a Bonus Action on later turns, make a ranged spell attack at a creature within 60 ft for 1d8 + WIS Radiant damage. Chalice — when you cast a spell with a slot that restores HP, you or a creature within 30 ft regains 1d8 + WIS HP. Dragon — treat a d20 roll of 9 or lower as a 10 on Intelligence and Wisdom checks and on Constitution saves to keep Concentration." }
                    ],
                    6: [
                        { name: "Cosmic Omen", desc: "After a Long Rest: roll a d6. Even = Weal (reaction: add 1d6 to a roll of a creature within 30ft). Odd = Woe (reaction: subtract 1d6 from a roll of an enemy within 30ft). Uses = proficiency bonus per Long Rest." }
                    ],
                    10: [
                        { name: "Twinkling Constellations", desc: "You can switch Starry Form at the start of each of your turns. Archer and Chalice become 2d8 instead of 1d8." }
                    ],
                    14: [
                        { name: "Full of Stars", desc: "While in your Starry Form: resistance to bludgeoning, piercing, and slashing damage." }
                    ]
                }
            }
        }
    },

    // ===== FIGHTER CLASS =====
    fighter: {
        hitDie: 10,
        savingThrows: ["str", "con"],
        skillOptions: ["acrobatics", "animal handling", "athletics", "history", "insight", "intimidation", "persuasion", "perception", "survival"],
        skillCount: 2,
        asiLevels: [4, 6, 8, 12, 14, 16, 19],

        // No spellcasting by default (Eldritch Knight subclass adds it)
        spellcasting: "none",

        features: {
            1: [
                { name: "Fighting Style", desc: "You gain a Fighting Style feat of your choice (Defense is recommended). Whenever you gain a Fighter level, you can replace it with a different Fighting Style feat." },
                { name: "Second Wind", act: 'bonus', desc: "Bonus Action: regain HP equal to 1d10 + your Fighter level. Uses: 2 (3 from level 4, 4 from level 10); regain one on a Short Rest, all on a Long Rest." },
                { name: "Weapon Mastery", desc: "You can use the mastery properties of three kinds of Simple or Martial weapons (4 from level 4, 5 from level 10, 6 from level 16). Whenever you finish a Long Rest, you can swap one of these choices." }
            ],
            2: [
                { name: "Action Surge", act: 'free', desc: "On your turn, take one additional action (any action except the Magic action). Once per Short or Long Rest (twice from level 17, but only once per turn)." },
                { name: "Tactical Mind", act: 'free', desc: "When you fail an ability check, you can spend a Second Wind use to roll 1d10 and add it to the check. If the check still fails, the use isn't spent." }
            ],
            3: [
                { name: "Fighter Subclass", desc: "Choose your Martial Archetype. It grants features at level 3 and at higher levels." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 6, 8, 12, 14 and 16 (Epic Boon at 19)." }
            ],
            5: [
                { name: "Extra Attack", desc: "You can attack twice instead of once whenever you take the Attack action on your turn." },
                { name: "Tactical Shift", desc: "Whenever you activate Second Wind with a Bonus Action, you can move up to half your Speed without provoking Opportunity Attacks." }
            ],
            6: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            9: [
                { name: "Indomitable", desc: "Reroll a failed saving throw and take the higher result. Once per Long Rest. At level 13: twice, level 17: three times." },
                { name: "Tactical Master", desc: "You can swap a weapon's mastery property for another property from a weapon you've mastered (once per turn)." }
            ],
            11: [
                { name: "Extra Attack (2)", desc: "You can attack three times, instead of twice, whenever you take the Attack action." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            13: [
                { name: "Studied Attacks", desc: "When you miss with an attack, you have advantage on your next attack against the same target before the end of your next turn." }
            ],
            14: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ],
            20: [
                { name: "Extra Attack (3)", desc: "You can attack four times, instead of three, whenever you take the Attack action." }
            ]
        },

        subclasses: {
            champion: {
                name: "Champion",
                level: 3,
                features: {
                    3: [
                        { name: "Improved Critical", desc: "Your attack rolls with weapons and Unarmed Strikes score a critical hit on a roll of 19 or 20." },
                        { name: "Remarkable Athlete", desc: "You have Advantage on Initiative rolls and Strength (Athletics) checks. Right after you score a critical hit, you can move up to half your Speed without provoking Opportunity Attacks." }
                    ],
                    7: [
                        { name: "Remarkable Athlete", desc: "Add half your proficiency bonus (round up) to STR, DEX, and CON checks that don't already use it. Your running long jump distance increases by your STR modifier in feet." }
                    ],
                    10: [
                        { name: "Additional Fighting Style", desc: "Choose a second Fighting Style." }
                    ],
                    15: [
                        { name: "Superior Critical", desc: "You score a critical hit on a roll of 18, 19, or 20." }
                    ],
                    18: [
                        { name: "Survivor", desc: "At the start of each of your turns, if you have less than half your max HP but more than 0, you regain 5 + CON modifier HP." }
                    ]
                }
            },
            battleMaster: {
                name: "Battle Master",
                level: 3,
                choices: { 3: [{ id: 'skills', count: 1, options: 'class', featName: 'Student of War', note: 'Also choose one type of Artisan\'s Tools — record it with your DM.' }] },
                features: {
                    3: [
                        { name: "Combat Superiority", desc: "You know three maneuvers (two more at levels 7, 10 and 15 — each time you can also swap one you know) and have four Superiority Dice (d8; 5 at level 7, 6 at 15), all regained on a Short or Long Rest. You can use one maneuver per attack. Maneuver save DC = 8 + your Strength or Dexterity modifier + Proficiency Bonus." },
                        { name: "Student of War", desc: "Gain proficiency with one type of Artisan's Tools and one skill from the Fighter skill list." }
                    ],
                    7: [
                        { name: "Know Your Enemy", desc: "Study a creature for 1 minute to learn whether it is your equal, superior, or inferior in two characteristics of your choice (STR, DEX, CON, AC, current HP, total class levels, fighter levels)." }
                    ],
                    10: [
                        { name: "Improved Combat Superiority", desc: "Your superiority dice become d10s." }
                    ],
                    15: [
                        { name: "Relentless", desc: "When you roll initiative and have no superiority dice left, you regain 1." }
                    ],
                    18: [
                        { name: "Ultimate Combat Superiority", desc: "Your superiority dice become d12s." }
                    ]
                }
            },
            eldritchKnight: {
                name: "Eldritch Knight",
                level: 3,
                features: {
                    3: [
                        { name: "Spellcasting", desc: "Intelligence; Wizard spell list. Cantrips: 2 (3 from level 10) — whenever you gain a Fighter level you can replace one. Prepared spells: 3 level 1 spells at level 3, 4 at level 4; whenever you gain a Fighter level you can replace one. Spell slots: 2 level 1 slots at level 3, 3 at level 4. Spellcasting focus: an Arcane Focus." },
                        { name: "War Bond", act: 'bonus', desc: "With a 1-hour ritual (it can be done during a Short Rest) you bond with a weapon; you can have two bonded weapons. You can't be disarmed of a bonded weapon unless you're Incapacitated, and as a Bonus Action you can summon one of them to your hand from anywhere on the same plane." }
                    ],
                    7: [
                        { name: "War Magic", desc: "When you take the Attack action, you can replace one of the attacks with a casting of a Wizard cantrip that has a casting time of an action." }
                    ],
                    10: [
                        { name: "Eldritch Strike", desc: "When you hit a creature with a weapon attack, it has disadvantage on the next saving throw against a spell you cast before the end of your next turn." }
                    ],
                    15: [
                        { name: "Arcane Charge", desc: "When you use Action Surge, you can teleport up to 30ft to an unoccupied space you can see (before or after the extra action)." }
                    ],
                    18: [
                        { name: "Improved War Magic", desc: "When you take the Attack action, you can replace two of the attacks with a casting of a level 1 or level 2 Wizard spell that has a casting time of an action." }
                    ]
                }
            },
            psiWarrior: {
                name: "Psi Warrior",
                level: 3,
                features: {
                    3: [
                        { name: "Psionic Power", desc: "You have Psionic Energy Dice: 4 × d6 (6 × d8 from level 5). Regain one on a Short Rest and all on a Long Rest. They fuel Protective Field, Psionic Strike and Telekinetic Movement." },
                        { name: "Protective Field", act: 'reaction', desc: "When you or a creature you can see within 30 ft takes damage, Reaction: spend one die and reduce the damage by the roll + your Intelligence modifier (min 1)." },
                        { name: "Psionic Strike", act: 'attack', desc: "Once on each of your turns, right after you hit a target within 30 ft with a weapon and deal damage, spend one die to deal extra Force damage equal to the roll + your Intelligence modifier." },
                        { name: "Telekinetic Movement", act: 'action', desc: "Magic action: move a loose object (Large or smaller) or a willing creature other than you within 30 ft up to 30 ft, or move a Tiny object to or from your hand. Once per Short or Long Rest, or spend a Psionic Energy Die to use it again." }
                    ],
                    7: [
                        { name: "Telekinetic Adept", desc: "Telekinetic Thrust: when you deal Psionic Strike damage, you can force the target to make a STR save or be pushed 10ft and knocked Prone." }
                    ],
                    10: [
                        { name: "Guarded Mind", desc: "Resistance to psychic damage. Spend a Psionic Energy die to end the Charmed or Frightened condition on yourself." }
                    ],
                    15: [
                        { name: "Bulwark of Force", desc: "Bonus Action: a number of creatures equal to your proficiency bonus within 30ft gain half cover (+2 AC and DEX saves) for 1 minute or until you're Incapacitated." }
                    ],
                    18: [
                        { name: "Telekinetic Master", desc: "Cast Telekinesis once per Long Rest without a spell slot (INT is your spellcasting ability)." }
                    ]
                }
            }
        }
    },

    // ===== WARLOCK CLASS =====
    warlock: {
        hitDie: 8,
        savingThrows: ["wis", "cha"],
        skillOptions: ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"],
        skillCount: 2,
        asiLevels: [4, 8, 12, 16, 19],

        // Pact Magic: different from regular spellcasting
        spellcasting: "pact",
        pactSlots: { 1:1, 2:2, 3:2, 4:2, 5:2, 6:2, 7:2, 8:2, 9:2, 10:2, 11:3, 12:3, 13:3, 14:3, 15:3, 16:3, 17:4, 18:4, 19:4, 20:4 },
        pactSlotLevel: { 1:1, 2:1, 3:2, 4:2, 5:3, 6:3, 7:4, 8:4, 9:5, 10:5, 11:5, 12:5, 13:5, 14:5, 15:5, 16:5, 17:5, 18:5, 19:5, 20:5 },
        cantripsKnown: { 1:2, 2:2, 3:2, 4:3, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4, 14:4, 15:4, 16:4, 17:4, 18:4, 19:4, 20:4 },
        // Mystic Arcanum: 1 spell each of these levels, castable 1x per long rest
        mysticArcanum: { 11: 6, 13: 7, 15: 8, 17: 9 },

        features: {
            1: [
                { name: "Eldritch Invocations", desc: "You know one invocation (3 from level 2, 5 from level 5, more later); prerequisites must be met. Whenever you gain a Warlock level, you can replace one invocation (unless another invocation you have requires it)." },
                { name: "Pact Magic", desc: "Charisma; Warlock spell list. Cantrips: 2 (3 from level 4) — whenever you gain a Warlock level you can replace one. Prepared spells: 2 at level 1 → 5 at level 4 (spell level up to your slot level); whenever you gain a Warlock level you can replace one. Pact slots: 1 at level 1, 2 from level 2; slot level 1 at levels 1-2, level 2 at levels 3-4. All Pact slots return on a Short or Long Rest. Spellcasting focus: an Arcane Focus." }
            ],
            2: [
                { name: "Magical Cunning", desc: "Perform a 1-minute rite: regain expended Pact Magic slots, up to half your maximum (round up). Once per Long Rest." }
            ],
            3: [
                { name: "Warlock Subclass", desc: "Choose your Otherworldly Patron. It grants features at level 3 and at higher levels." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 12 and 16 (Epic Boon at 19)." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            9: [
                { name: "Contact Patron", desc: "Cast Contact Other Plane once per Long Rest for free to consult your patron. You automatically succeed on the INT save." }
            ],
            11: [
                { name: "Mystic Arcanum (6th)", desc: "Choose a 6th-level warlock spell. You can cast it once per Long Rest without a spell slot. At higher levels you gain 7th-, 8th-, and 9th-level Arcanum." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            13: [
                { name: "Mystic Arcanum (7th)", desc: "Choose a 7th-level warlock spell. You can cast it once per Long Rest without a spell slot." }
            ],
            15: [
                { name: "Mystic Arcanum (8th)", desc: "Choose an 8th-level warlock spell. You can cast it once per Long Rest without a spell slot." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            17: [
                { name: "Mystic Arcanum (9th)", desc: "Choose a 9th-level warlock spell. You can cast it once per Long Rest without a spell slot." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ],
            20: [
                { name: "Eldritch Master", desc: "Once per Long Rest you can spend 1 minute to restore all your Pact Magic spell slots." }
            ]
        },

        subclasses: {
            fiend: {
                name: "Fiend Patron",
                level: 3,
                spells: [
                    { name: "Burning Hands", lvl: 3, kind: 'prepared' },
                    { name: "Command", lvl: 3, kind: 'prepared' },
                    { name: "Scorching Ray", lvl: 3, kind: 'prepared' },
                    { name: "Suggestion", lvl: 3, kind: 'prepared' },
                    { name: "Fireball", lvl: 5, kind: 'prepared' },
                    { name: "Stinking Cloud", lvl: 5, kind: 'prepared' },
                    { name: "Fire Shield", lvl: 7, kind: 'prepared' },
                    { name: "Wall of Fire", lvl: 7, kind: 'prepared' },
                    { name: "Geas", lvl: 9, kind: 'prepared' },
                    { name: "Insect Plague", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Dark One's Blessing", desc: "When you reduce an enemy to 0 HP — or someone else does within 10 ft of you — you gain Temporary HP equal to your Charisma modifier + your Warlock level (min 1)." },
                        { name: "Fiend Spells", desc: "Always prepared: Burning Hands, Command, Scorching Ray, Suggestion (level 3); Fireball, Stinking Cloud (5); Fire Shield, Wall of Fire (7); Geas, Insect Plague (9)." }
                    ],
                    6: [
                        { name: "Dark One's Own Luck", desc: "Once per Short or Long Rest: add 1d10 to an ability check or saving throw." }
                    ],
                    10: [
                        { name: "Fiendish Resilience", desc: "After a Short or Long Rest: choose one damage type. You have resistance to it until you choose another. This doesn't work against magical or silvered weapons." }
                    ],
                    14: [
                        { name: "Hurl Through Hell", desc: "When you hit a creature with an attack, you can hurl it through the Lower Planes. It vanishes until the end of your next turn and takes 10d10 psychic damage. Once per Long Rest." }
                    ]
                }
            },
            archfey: {
                name: "Archfey Patron",
                level: 3,
                spells: [
                    { name: "Calm Emotions", lvl: 3, kind: 'prepared' },
                    { name: "Faerie Fire", lvl: 3, kind: 'prepared' },
                    { name: "Misty Step", lvl: 3, kind: 'innate', free: 'cha', recharge: 'long', slots: true, note: "Steps of the Fey" },
                    { name: "Phantasmal Force", lvl: 3, kind: 'prepared' },
                    { name: "Sleep", lvl: 3, kind: 'prepared' },
                    { name: "Blink", lvl: 5, kind: 'prepared' },
                    { name: "Plant Growth", lvl: 5, kind: 'prepared' },
                    { name: "Dominate Beast", lvl: 7, kind: 'prepared' },
                    { name: "Greater Invisibility", lvl: 7, kind: 'prepared' },
                    { name: "Dominate Person", lvl: 9, kind: 'prepared' },
                    { name: "Seeming", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Archfey Spells", desc: "Always prepared: Calm Emotions, Faerie Fire, Misty Step, Phantasmal Force, Sleep (level 3); Blink, Plant Growth (5); Dominate Beast, Greater Invisibility (7); Dominate Person, Seeming (9)." },
                        { name: "Steps of the Fey", act: 'bonus', desc: "You can cast Misty Step without a spell slot a number of times equal to your Charisma modifier (min 1) per Long Rest. Whenever you cast Misty Step, add one effect: Refreshing Step — you or a creature you can see within 10 ft gains 1d10 Temporary HP; Taunting Step — creatures within 5 ft of the space you left make a Wisdom save against your spell save DC or have Disadvantage on attacks against anyone but you until the start of your next turn." }
                    ],
                    6: [
                        { name: "Misty Escape", desc: "Reaction when you take damage: turn invisible and teleport up to 60ft. You stay invisible until the start of your next turn or until you attack or cast a spell. Once per Short or Long Rest." }
                    ],
                    10: [
                        { name: "Beguiling Defenses", desc: "You are immune to the Charmed condition. Reaction: when someone tries to charm you, charm that creature for 1 minute instead (WIS save ends it)." }
                    ],
                    14: [
                        { name: "Dark Delirium", desc: "As an action: a creature within 60ft makes a WIS save or is Charmed or Frightened (your choice) inside an illusory realm for 1 minute. It can repeat the save each turn. Once per Short or Long Rest." }
                    ]
                }
            },
            celestial: {
                name: "Celestial Patron",
                level: 3,
                spells: [
                    { name: "Aid", lvl: 3, kind: 'prepared' },
                    { name: "Cure Wounds", lvl: 3, kind: 'prepared' },
                    { name: "Guiding Bolt", lvl: 3, kind: 'prepared' },
                    { name: "Lesser Restoration", lvl: 3, kind: 'prepared' },
                    { name: "Light", lvl: 3, kind: 'cantrip' },
                    { name: "Sacred Flame", lvl: 3, kind: 'cantrip' },
                    { name: "Daylight", lvl: 5, kind: 'prepared' },
                    { name: "Revivify", lvl: 5, kind: 'prepared' },
                    { name: "Guardian of Faith", lvl: 7, kind: 'prepared' },
                    { name: "Wall of Fire", lvl: 7, kind: 'prepared' },
                    { name: "Greater Restoration", lvl: 9, kind: 'prepared' },
                    { name: "Summon Celestial", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Celestial Spells", desc: "Always prepared: Aid, Cure Wounds, Guiding Bolt, Lesser Restoration, Light, Sacred Flame (level 3); Daylight, Revivify (5); Guardian of Faith, Wall of Fire (7); Greater Restoration, Summon Celestial (9)." },
                        { name: "Healing Light", act: 'bonus', desc: "You have a pool of d6s equal to 1 + your Warlock level (5 at level 4), refilled on a Long Rest. Bonus Action: heal yourself or a creature you can see within 60 ft by spending dice from the pool (at most your Charisma modifier, min 1, at once) and rolling them." }
                    ],
                    6: [
                        { name: "Radiant Soul", desc: "Resistance to radiant damage. When you deal fire or radiant damage with a spell, add your CHA modifier to one damage roll." }
                    ],
                    10: [
                        { name: "Celestial Resilience", desc: "When you finish a Short or Long Rest: you gain temp HP equal to warlock level + CHA modifier, and up to 5 other creatures of your choice gain half that." }
                    ],
                    14: [
                        { name: "Searing Vengeance", desc: "At the start of your turn while at 0 HP: rise with half your max HP. Creatures of your choice within 30ft take 2d8 + CHA modifier radiant damage and are Blinded until the end of your current turn. Once per Long Rest." }
                    ]
                }
            },
            greatOldOne: {
                name: "Great Old One Patron",
                level: 3,
                spells: [
                    { name: "Detect Thoughts", lvl: 3, kind: 'prepared' },
                    { name: "Dissonant Whispers", lvl: 3, kind: 'prepared' },
                    { name: "Phantasmal Force", lvl: 3, kind: 'prepared' },
                    { name: "Tasha's Hideous Laughter", lvl: 3, kind: 'prepared' },
                    { name: "Clairvoyance", lvl: 5, kind: 'prepared' },
                    { name: "Hunger of Hadar", lvl: 5, kind: 'prepared' },
                    { name: "Confusion", lvl: 7, kind: 'prepared' },
                    { name: "Summon Aberration", lvl: 7, kind: 'prepared' },
                    { name: "Modify Memory", lvl: 9, kind: 'prepared' },
                    { name: "Telekinesis", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Awakened Mind", act: 'bonus', desc: "Bonus Action: link minds with a creature you can see within 30 ft. You can talk telepathically (in a language you both know) while within your Charisma modifier in miles (min 1) of each other, for a number of minutes equal to your Warlock level." },
                        { name: "Psychic Spells", desc: "When you cast a Warlock spell that deals damage, you can change its damage type to Psychic. You can cast Warlock Enchantment and Illusion spells without Verbal or Somatic components." },
                        { name: "Great Old One Spells", desc: "Always prepared: Detect Thoughts, Dissonant Whispers, Phantasmal Force, Tasha's Hideous Laughter (level 3); Clairvoyance, Hunger of Hadar (5); Confusion, Summon Aberration (7); Modify Memory, Telekinesis (9)." }
                    ],
                    6: [
                        { name: "Entropic Ward", desc: "Reaction: when a creature makes an attack roll against you, impose disadvantage on the roll. If the attack misses, you have advantage on your next attack roll against that creature before the end of your next turn. Once per Short or Long Rest." }
                    ],
                    10: [
                        { name: "Thought Shield", desc: "Resistance to psychic damage. When a creature deals psychic damage to you, it takes the same amount. Your thoughts can't be read by telepathy unless you allow it." }
                    ],
                    14: [
                        { name: "Create Thrall", desc: "Touch an incapacitated humanoid: it is Charmed by you indefinitely. You have a telepathic bond with it while you're on the same plane." }
                    ]
                }
            }
        }
    },

    // ===== BARBARIAN CLASS (5.5e / 2024) =====
    barbarian: {
        hitDie: 12,
        savingThrows: ["str", "con"],
        skillOptions: ["animal handling", "athletics", "intimidation", "nature", "perception", "survival"],
        skillCount: 2,
        asiLevels: [4, 8, 12, 16, 19],
        spellcasting: "none",

        rages: { 1:2, 2:2, 3:3, 4:3, 5:3, 6:4, 7:4, 8:4, 9:4, 10:4, 11:4, 12:5, 13:5, 14:5, 15:5, 16:5, 17:6, 18:6, 19:6, 20:6 },
        rageDamage: { 1:2, 2:2, 3:2, 4:2, 5:2, 6:2, 7:2, 8:2, 9:3, 10:3, 11:3, 12:3, 13:3, 14:3, 15:3, 16:4, 17:4, 18:4, 19:4, 20:4 },

        features: {
            1: [
                { name: "Rage", act: 'bonus', desc: "Bonus Action (not while wearing Heavy armor): enter a Rage. While it lasts you have Resistance to Bludgeoning, Piercing and Slashing damage, add your Rage Damage (+2 at levels 1-8) to damage with Strength-based attacks (weapons and Unarmed Strikes), and have Advantage on Strength checks and saving throws — but you can't cast spells or keep Concentration. It lasts until the end of your next turn and is extended each turn you attack an enemy, force an enemy to make a save, or spend a Bonus Action on it (10 minutes max); Heavy armor or being Incapacitated ends it. Uses: 2 (3 from level 3, 4 from level 6); regain one on a Short Rest, all on a Long Rest." },
                { name: "Unarmored Defense", desc: "While you wear no armor, your base AC equals 10 + your Dexterity and Constitution modifiers. You can still use a Shield." },
                { name: "Weapon Mastery", desc: "You can use the mastery properties of two kinds of Simple or Martial Melee weapons (three from level 4, four from level 10). Whenever you finish a Long Rest, you can swap one of these choices." }
            ],
            2: [
                { name: "Danger Sense", desc: "You have Advantage on Dexterity saving throws unless you're Incapacitated." },
                { name: "Reckless Attack", act: 'attack', desc: "When you make your first attack roll on your turn, you can attack recklessly: Advantage on Strength-based attack rolls until the start of your next turn, but attack rolls against you also have Advantage until then." }
            ],
            3: [
                { name: "Barbarian Subclass", desc: "Choose your Primal Path. It grants features at level 3 and at higher levels." },
                { name: "Primal Knowledge", desc: "Gain proficiency in one more skill from the Barbarian skill list. While your Rage is active, you can make Acrobatics, Intimidation, Perception, Stealth and Survival checks as Strength checks." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 12 and 16 (Epic Boon at 19)." }
            ],
            5: [
                { name: "Extra Attack", desc: "You can attack twice instead of once whenever you take the Attack action on your turn." },
                { name: "Fast Movement", desc: "Your Speed increases by 10 feet while you aren't wearing Heavy armor." }
            ],
            7: [
                { name: "Feral Instinct", desc: "Advantage on initiative rolls. If you're surprised and enter your Rage, you act normally." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            9: [
                { name: "Brutal Strike", desc: "Trade the Reckless Attack advantage for extra effects: Forceful Blow (1d10 extra + push 15ft), Hamstring Blow (1d10 extra and -15ft speed)." }
            ],
            11: [
                { name: "Relentless Rage", desc: "When you drop to 0 HP while raging, make a CON save (DC 10, +5 per use) to drop to 1 HP instead." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            15: [
                { name: "Persistent Rage", desc: "Your Rage only ends if you fall Unconscious or choose to end it." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            18: [
                { name: "Indomitable Might", desc: "If your STR check total is lower than your STR score, use your STR score instead of the roll." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ],
            20: [
                { name: "Primal Champion", desc: "STR and CON each increase by 4, to a maximum of 25." }
            ]
        },

        subclasses: {
            berserker: {
                name: "Path of the Berserker",
                level: 3,
                features: {
                    3: [
                        { name: "Frenzy", act: 'attack', desc: "If you use Reckless Attack while raging, the first target you hit on your turn with a Strength-based attack takes extra damage: roll a number of d6s equal to your Rage Damage bonus (2d6 at levels 3-8), same damage type as the attack." }
                    ],
                    6: [
                        { name: "Mindless Rage", desc: "You can't be Charmed or Frightened while raging. If you already are, the condition is suspended." }
                    ],
                    10: [
                        { name: "Retaliation", desc: "When a creature damages you while you're raging: reaction melee attack against that creature (if it's within reach)." }
                    ],
                    14: [
                        { name: "Intimidating Presence", desc: "Bonus Action: choose a creature within 30ft; WIS save or Frightened for 1 minute. The target can repeat the save each turn." }
                    ]
                }
            },
            wildHeart: {
                name: "Path of the Wild Heart",
                level: 3,
                spellAbility: 'wis',
                spells: [
                    { name: "Beast Sense", lvl: 3, kind: 'ritual' },
                    { name: "Speak with Animals", lvl: 3, kind: 'ritual' },
                    { name: "Commune with Nature", lvl: 10, kind: 'ritual' }
                ],
                features: {
                    3: [
                        { name: "Animal Speaker", desc: "You can cast Beast Sense and Speak with Animals, but only as Rituals. Wisdom is your spellcasting ability for them." },
                        { name: "Rage of the Wilds", desc: "Each time you activate your Rage, choose one: Bear — Resistance to every damage type except Force, Necrotic, Psychic and Radiant while raging. Eagle — when you enter the Rage you can also Dash and Disengage as part of that Bonus Action, and while raging a Bonus Action lets you take both. Wolf — while raging, your allies have Advantage on attack rolls against enemies within 5 ft of you." }
                    ],
                    6: [
                        { name: "Aspect of the Beast", desc: "Choose: Bear (double carry capacity, advantage on STR checks to push/pull), Eagle (see up to 1 mile away, no disadvantage on Perception), or Wolf (track at a fast pace, stealth at a normal pace)." }
                    ],
                    10: [
                        { name: "Spirit Walker", desc: "Cast Commune with Nature as a ritual." }
                    ],
                    14: [
                        { name: "Totemic Attunement", desc: "Choose: Bear (while raging, enemies within 5ft have disadvantage on attacks against your allies), Eagle (fly speed equal to walking speed while raging), or Wolf (while raging, Bonus Action: knock a Large or smaller creature Prone on a hit)." }
                    ]
                }
            },
            worldTree: {
                name: "Path of the World Tree",
                level: 3,
                features: {
                    3: [
                        { name: "Vitality of the Tree", desc: "Vitality Surge: when you activate your Rage, gain Temporary HP equal to your Barbarian level. Life-Giving Force: at the start of each of your turns while raging, another creature within 10 ft of you gains Temporary HP equal to a roll of d6s equal to your Rage Damage bonus (these vanish when your Rage ends)." }
                    ],
                    6: [
                        { name: "Branches of the Tree", desc: "While raging, as a Bonus Action: teleport a willing creature you can see within 60ft to an unoccupied space within 5ft of you." }
                    ],
                    10: [
                        { name: "Battering Roots", desc: "While raging: the ground within 15ft of you is difficult terrain for enemies." }
                    ],
                    14: [
                        { name: "Travel Along the Tree", desc: "While raging, as a Bonus Action: teleport up to 60ft to an unoccupied space you can see. You can bring one willing creature along." }
                    ]
                }
            },
            zealot: {
                name: "Path of the Zealot",
                level: 3,
                features: {
                    3: [
                        { name: "Divine Fury", act: 'attack', desc: "While raging, the first creature you hit on each of your turns with a weapon or an Unarmed Strike takes extra damage equal to 1d6 + half your Barbarian level (round down); you choose Necrotic or Radiant each time." },
                        { name: "Warrior of the Gods", act: 'bonus', desc: "You have a pool of four d12s (5 at level 6, 6 at 12, 7 at 17). As a Bonus Action, expend any number of them, roll them and regain that many HP. The pool refills on a Long Rest." }
                    ],
                    6: [
                        { name: "Fanatical Focus", desc: "When you fail a saving throw while raging: reroll it once per Rage and take the new result." }
                    ],
                    10: [
                        { name: "Zealous Presence", desc: "Bonus Action: up to 10 allies within 60ft gain advantage on attack rolls and saving throws until the start of your next turn. Once per Long Rest." }
                    ],
                    14: [
                        { name: "Rage Beyond Death", desc: "While raging you don't die at 0 HP. You still make death saves and take damage normally. If your Rage ends while you're at 0 HP, you die." }
                    ]
                }
            }
        }
    },

    // ===== BARD CLASS (5.5e / 2024) =====
    bard: {
        hitDie: 8,
        savingThrows: ["dex", "cha"],
        skillOptions: ["any"],
        skillCount: 3,
        asiLevels: [4, 8, 12, 16, 19],

        spellcasting: "full",
        spellSlots: {
            1:  [2,0,0,0,0,0,0,0,0],
            2:  [3,0,0,0,0,0,0,0,0],
            3:  [4,2,0,0,0,0,0,0,0],
            4:  [4,3,0,0,0,0,0,0,0],
            5:  [4,3,2,0,0,0,0,0,0],
            6:  [4,3,3,0,0,0,0,0,0],
            7:  [4,3,3,1,0,0,0,0,0],
            8:  [4,3,3,2,0,0,0,0,0],
            9:  [4,3,3,3,1,0,0,0,0],
            10: [4,3,3,3,2,0,0,0,0],
            11: [4,3,3,3,2,1,0,0,0],
            12: [4,3,3,3,2,1,0,0,0],
            13: [4,3,3,3,2,1,1,0,0],
            14: [4,3,3,3,2,1,1,0,0],
            15: [4,3,3,3,2,1,1,1,0],
            16: [4,3,3,3,2,1,1,1,0],
            17: [4,3,3,3,2,1,1,1,1],
            18: [4,3,3,3,3,1,1,1,1],
            19: [4,3,3,3,3,2,1,1,1],
            20: [4,3,3,3,3,2,2,1,1]
        },

        cantripsKnown: { 1:2, 2:2, 3:2, 4:3, 5:3, 6:3, 7:3, 8:3, 9:3, 10:4, 11:4, 12:4, 13:4, 14:4, 15:4, 16:4, 17:4, 18:4, 19:4, 20:4 },
        maxSpellLevel: { 1:1, 2:1, 3:2, 4:2, 5:3, 6:3, 7:4, 8:4, 9:5, 10:5, 11:6, 12:6, 13:7, 14:7, 15:8, 16:8, 17:9, 18:9, 19:9, 20:9 },

        features: {
            1: [
                { name: "Bardic Inspiration", act: 'bonus', desc: "Bonus Action: give a creature within 60 ft that can see or hear you a Bardic Inspiration die (d6; d8 at level 5, d10 at 10, d12 at 15). Within the next hour, when it fails a D20 Test it can roll the die and add it, possibly turning the failure into a success. Uses = your Charisma modifier (min 1), regained on a Long Rest (from level 5 also on a Short Rest)." },
                { name: "Spellcasting", desc: "Charisma; Bard spell list. Cantrips: 2 (3 from level 4) — whenever you gain a Bard level you can replace one. Prepared spells: 4 at level 1 → 7 at level 4; whenever you gain a Bard level you can replace one prepared spell. Spellcasting focus: a Musical Instrument." }
            ],
            2: [
                { name: "Expertise", desc: "You gain Expertise in two of your skill proficiencies (two more at level 9)." },
                { name: "Jack of All Trades", desc: "Add half your Proficiency Bonus (round down) to ability checks that use a skill you're not proficient in (and that don't already include your Proficiency Bonus)." }
            ],
            3: [
                { name: "Bard Subclass", desc: "Choose your Bard College. It grants features at level 3 and at higher levels." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 12 and 16 (Epic Boon at 19)." }
            ],
            5: [
                { name: "Font of Inspiration", desc: "All expended uses of Bardic Inspiration now return when you finish a Short or Long Rest. You can also expend a spell slot (no action required) to regain one use." }
            ],
            7: [
                { name: "Countercharm", desc: "As an action, start a performance. You and allies within 30ft gain advantage on saves against Frightened and Charmed. Lasts until the end of your next turn." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            9: [
                { name: "Expertise", desc: "Choose 2 more skills to gain doubled proficiency bonus with." }
            ],
            10: [
                { name: "Magical Secrets", desc: "Learn 2 spells from the Bard, Cleric, Druid, or Wizard spell list. They count as bard spells for you." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            14: [
                { name: "Magical Secrets", desc: "Learn 2 more spells from any class's spell list." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            18: [
                { name: "Superior Inspiration", desc: "When you roll initiative with no Bardic Inspiration uses left, you regain 1." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ],
            20: [
                { name: "Words of Creation", desc: "Cast Power Word Heal or Power Word Kill once per Long Rest for free. The effect targets 2 creatures instead of 1." }
            ]
        },

        subclasses: {
            lore: {
                name: "College of Lore",
                level: 3,
                choices: { 3: [{ id: 'skills', count: 3, featName: 'Bonus Proficiencies' }] },
                features: {
                    3: [
                        { name: "Bonus Proficiencies", desc: "You gain proficiency in three skills of your choice." },
                        { name: "Cutting Words", act: 'reaction', desc: "When a creature you can see within 60 ft makes a damage roll or succeeds on an ability check or attack roll, Reaction: spend a Bardic Inspiration use, roll the die and subtract it from that roll (possibly turning a success into a failure)." }
                    ],
                    6: [
                        { name: "Additional Magical Secrets", desc: "Learn 2 additional spells from any class's spell list." }
                    ],
                    14: [
                        { name: "Peerless Skill", desc: "Add your Bardic Inspiration die to your own ability checks (doesn't spend a use)." }
                    ]
                }
            },
            dance: {
                name: "College of Dance",
                level: 3,
                features: {
                    3: [
                        { name: "Dazzling Footwork", desc: "While you wear no armor and wield no Shield: Advantage on Performance checks that involve dancing; your base AC equals 10 + your Dexterity and Charisma modifiers; you can use Dexterity for the attack rolls of your Unarmed Strikes, which can deal Bludgeoning damage equal to a roll of your Bardic Inspiration die + your Dexterity modifier (this roll doesn't spend the die)." },
                        { name: "Agile Strikes", act: 'bonus', desc: "When you spend a Bardic Inspiration use as part of an action, Bonus Action or Reaction, you can also make one Unarmed Strike as part of it." }
                    ],
                    6: [
                        { name: "Inspiring Movement", desc: "Reaction: when an ally moves, allow another ally within 60ft to move half its speed as a reaction without provoking opportunity attacks." }
                    ],
                    14: [
                        { name: "Tandem Footwork", desc: "After rolling initiative: allies within 60ft who can see you add a Bardic Inspiration die to their initiative." }
                    ]
                }
            },
            glamour: {
                name: "College of Glamour",
                level: 3,
                spells: [
                    { name: "Charm Person", lvl: 3, kind: 'prepared' },
                    { name: "Mirror Image", lvl: 3, kind: 'prepared' },
                    { name: "Command", lvl: 6, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Beguiling Magic", act: 'free', desc: "Charm Person and Mirror Image are always prepared. Right after you cast an Enchantment or Illusion spell with a spell slot, a creature you can see within 60 ft makes a Wisdom save against your spell save DC or is Charmed or Frightened (your choice) for 1 minute (it repeats the save at the end of each of its turns). Once per Long Rest — or restore it by spending a Bardic Inspiration use." },
                        { name: "Mantle of Inspiration", act: 'bonus', desc: "Bonus Action: spend a Bardic Inspiration use and roll the die. Up to your Charisma modifier (min 1) other creatures within 60 ft each gain Temporary HP equal to twice the roll and can use their Reaction to move up to their Speed without provoking Opportunity Attacks." }
                    ],
                    6: [
                        { name: "Mantle of Majesty", desc: "Bonus Action: for 1 minute, cast Command as a Bonus Action each turn without expending a spell slot. Once per Long Rest." }
                    ],
                    14: [
                        { name: "Unbreakable Majesty", desc: "Bonus Action, for 1 minute: creatures that target you must make a CHA save or choose another target, wasting the attack or spell. Once per Long Rest." }
                    ]
                }
            },
            valor: {
                name: "College of Valor",
                level: 3,
                features: {
                    3: [
                        { name: "Combat Inspiration", desc: "A creature holding your Bardic Inspiration die can also use it to add the roll to its AC against an attack that hits it (using its Reaction), or to add it to the damage of an attack it just hit with." },
                        { name: "Martial Training", desc: "You gain proficiency with Martial weapons and training with Medium armor and Shields, and you can use a Simple or Martial weapon as a spellcasting focus for your Bard spells." }
                    ],
                    6: [
                        { name: "Extra Attack", desc: "You can attack twice instead of once whenever you take the Attack action on your turn." }
                    ],
                    14: [
                        { name: "Battle Magic", desc: "When you cast a bard spell, you can make one weapon attack as a Bonus Action." }
                    ]
                }
            }
        }
    },

    // ===== CLERIC CLASS (5.5e / 2024) =====
    cleric: {
        hitDie: 8,
        savingThrows: ["wis", "cha"],
        skillOptions: ["history", "insight", "medicine", "persuasion", "religion"],
        skillCount: 2,
        asiLevels: [4, 8, 12, 16, 19],

        spellcasting: "full",
        spellSlots: {
            1:  [2,0,0,0,0,0,0,0,0],
            2:  [3,0,0,0,0,0,0,0,0],
            3:  [4,2,0,0,0,0,0,0,0],
            4:  [4,3,0,0,0,0,0,0,0],
            5:  [4,3,2,0,0,0,0,0,0],
            6:  [4,3,3,0,0,0,0,0,0],
            7:  [4,3,3,1,0,0,0,0,0],
            8:  [4,3,3,2,0,0,0,0,0],
            9:  [4,3,3,3,1,0,0,0,0],
            10: [4,3,3,3,2,0,0,0,0],
            11: [4,3,3,3,2,1,0,0,0],
            12: [4,3,3,3,2,1,0,0,0],
            13: [4,3,3,3,2,1,1,0,0],
            14: [4,3,3,3,2,1,1,0,0],
            15: [4,3,3,3,2,1,1,1,0],
            16: [4,3,3,3,2,1,1,1,0],
            17: [4,3,3,3,2,1,1,1,1],
            18: [4,3,3,3,3,1,1,1,1],
            19: [4,3,3,3,3,2,1,1,1],
            20: [4,3,3,3,3,2,2,1,1]
        },

        cantripsKnown: { 1:3, 2:3, 3:3, 4:4, 5:4, 6:4, 7:4, 8:4, 9:4, 10:5, 11:5, 12:5, 13:5, 14:5, 15:5, 16:5, 17:5, 18:5, 19:5, 20:5 },
        maxSpellLevel: { 1:1, 2:1, 3:2, 4:2, 5:3, 6:3, 7:4, 8:4, 9:5, 10:5, 11:6, 12:6, 13:7, 14:7, 15:8, 16:8, 17:9, 18:9, 19:9, 20:9 },

        features: {
            1: [
                { name: "Divine Order", desc: "Choose a sacred role. Protector: proficiency with Martial weapons and training with Heavy armor. Thaumaturge: one extra Cleric cantrip, and add your Wisdom modifier (min +1) to Intelligence (Arcana or Religion) checks." },
                { name: "Spellcasting", desc: "Wisdom; Cleric spell list. Cantrips: 3 (4 from level 4) — whenever you gain a Cleric level you can replace one. Prepared spells: 4 at level 1 → 7 at level 4; whenever you finish a Long Rest you can change your whole prepared list. Spellcasting focus: a Holy Symbol." }
            ],
            2: [
                { name: "Channel Divinity", desc: "Two uses (three from level 6); regain one on a Short Rest and all on a Long Rest. Each use creates one Channel Divinity effect: Divine Spark, Turn Undead or your Domain's option. Saving throws use your spell save DC." },
                { name: "Divine Spark", act: 'action', desc: "Magic action, one Channel Divinity use: point your Holy Symbol at a creature within 30 ft and roll 1d8 + your Wisdom modifier. Either it regains that many HP, or it makes a Constitution save, taking that much Necrotic or Radiant damage (your choice) on a failure or half on a success." },
                { name: "Turn Undead", act: 'action', desc: "Magic action, one Channel Divinity use: each Undead of your choice within 30 ft makes a Wisdom save or is Frightened and Incapacitated for 1 minute, fleeing from you. It ends early if the creature takes damage." }
            ],
            3: [
                { name: "Cleric Subclass", desc: "Choose your Divine Domain. It grants features at level 3 and at higher levels." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 12 and 16 (Epic Boon at 19)." }
            ],
            5: [
                { name: "Sear Undead", desc: "Whenever you use Turn Undead, you can roll a number of d8s equal to your Wisdom modifier (minimum 1d8); each Undead that fails its save takes that much Radiant damage. The damage doesn't end the Turn effect." }
            ],
            7: [
                { name: "Blessed Strikes", desc: "Choose: Divine Strike (+1d8 melee damage once per turn) or Potent Spellcasting (+WIS mod damage on cleric cantrips)." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            10: [
                { name: "Divine Intervention", desc: "As an action: cast a cleric spell of 5th level or lower without a spell slot or material components. Once per Long Rest." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            14: [
                { name: "Improved Blessed Strikes", desc: "Your Divine Strike rises to 2d8, or your Potent Spellcasting adds 2x WIS mod." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ],
            20: [
                { name: "Greater Divine Intervention", desc: "Your Divine Intervention can now cast spells up to 9th level, or Wish once." }
            ]
        },

        subclasses: {
            life: {
                name: "Life Domain",
                level: 3,
                spells: [
                    { name: "Aid", lvl: 3, kind: 'prepared' },
                    { name: "Bless", lvl: 3, kind: 'prepared' },
                    { name: "Cure Wounds", lvl: 3, kind: 'prepared' },
                    { name: "Lesser Restoration", lvl: 3, kind: 'prepared' },
                    { name: "Mass Healing Word", lvl: 5, kind: 'prepared' },
                    { name: "Revivify", lvl: 5, kind: 'prepared' },
                    { name: "Aura of Life", lvl: 7, kind: 'prepared' },
                    { name: "Death Ward", lvl: 7, kind: 'prepared' },
                    { name: "Greater Restoration", lvl: 9, kind: 'prepared' },
                    { name: "Mass Cure Wounds", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Disciple of Life", desc: "When a spell you cast with a spell slot restores HP to a creature, it regains an extra 2 + the slot's level HP that turn." },
                        { name: "Preserve Life", act: 'action', desc: "Magic action, one Channel Divinity use: restore HP equal to 5 × your Cleric level, divided among Bloodied creatures of your choice within 30 ft (you can include yourself). No creature can be healed above half its HP maximum this way." },
                        { name: "Life Domain Spells", desc: "Always prepared: Aid, Bless, Cure Wounds, Lesser Restoration (level 3); Mass Healing Word, Revivify (5); Aura of Life, Death Ward (7); Greater Restoration, Mass Cure Wounds (9)." }
                    ],
                    6: [
                        { name: "Blessed Healer", desc: "When you heal another creature with a spell of 1st level or higher, you also regain 2 + spell level HP." }
                    ],
                    10: [
                        { name: "Divine Strike", desc: "Once per turn: +1d8 radiant damage on your weapon attacks." }
                    ],
                    14: [
                        { name: "Supreme Healing", desc: "With healing spells: instead of rolling, take the maximum result of the healing dice." }
                    ]
                }
            },
            light: {
                name: "Light Domain",
                level: 3,
                spells: [
                    { name: "Burning Hands", lvl: 3, kind: 'prepared' },
                    { name: "Faerie Fire", lvl: 3, kind: 'prepared' },
                    { name: "Scorching Ray", lvl: 3, kind: 'prepared' },
                    { name: "See Invisibility", lvl: 3, kind: 'prepared' },
                    { name: "Daylight", lvl: 5, kind: 'prepared' },
                    { name: "Fireball", lvl: 5, kind: 'prepared' },
                    { name: "Arcane Eye", lvl: 7, kind: 'prepared' },
                    { name: "Wall of Fire", lvl: 7, kind: 'prepared' },
                    { name: "Flame Strike", lvl: 9, kind: 'prepared' },
                    { name: "Scrying", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Radiance of the Dawn", act: 'action', desc: "Magic action, one Channel Divinity use: a 30-ft emanation from you dispels magical Darkness, and each creature of your choice in it makes a Constitution save, taking 2d10 + your Cleric level Radiant damage on a failure or half on a success." },
                        { name: "Warding Flare", act: 'reaction', desc: "When a creature you can see within 30 ft makes an attack roll, Reaction: impose Disadvantage on that roll. Uses = your Wisdom modifier (min 1) per Long Rest." },
                        { name: "Light Domain Spells", desc: "Always prepared: Burning Hands, Faerie Fire, Scorching Ray, See Invisibility (level 3); Daylight, Fireball (5); Arcane Eye, Wall of Fire (7); Flame Strike, Scrying (9)." }
                    ],
                    6: [
                        { name: "Improved Flare", desc: "Warding Flare now also works when an ally within 30ft is attacked." }
                    ],
                    10: [
                        { name: "Blessed Strikes", desc: "Choose: Divine Strike (+1d8 radiant on melee once per turn) or Potent Spellcasting (+WIS mod on cleric cantrip damage)." }
                    ],
                    14: [
                        { name: "Improved Blessed Strikes", desc: "Divine Strike rises to 2d8, or Potent Spellcasting adds 2x WIS mod." }
                    ],
                    17: [
                        { name: "Corona of Light", desc: "As an action: radiate bright light in 60ft. Enemies in the light have disadvantage on saves against your fire and radiant spells. Lasts 1 minute." }
                    ]
                }
            },
            trickery: {
                name: "Trickery Domain",
                level: 3,
                spells: [
                    { name: "Charm Person", lvl: 3, kind: 'prepared' },
                    { name: "Disguise Self", lvl: 3, kind: 'prepared' },
                    { name: "Invisibility", lvl: 3, kind: 'prepared' },
                    { name: "Pass Without Trace", lvl: 3, kind: 'prepared' },
                    { name: "Hypnotic Pattern", lvl: 5, kind: 'prepared' },
                    { name: "Nondetection", lvl: 5, kind: 'prepared' },
                    { name: "Confusion", lvl: 7, kind: 'prepared' },
                    { name: "Dimension Door", lvl: 7, kind: 'prepared' },
                    { name: "Dominate Person", lvl: 9, kind: 'prepared' },
                    { name: "Modify Memory", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Blessing of the Trickster", act: 'action', desc: "Magic action: you or a willing creature within 30 ft has Advantage on Dexterity (Stealth) checks until you finish a Long Rest or use this feature again." },
                        { name: "Invoke Duplicity", act: 'bonus', desc: "Bonus Action, one Channel Divinity use: create an illusory double of yourself within 30 ft for 1 minute. You can cast spells as though you were in its space; when you and the double are both within 5 ft of a creature that can see it, you have Advantage on attacks against that creature; as a Bonus Action you can move the double up to 30 ft (staying within 120 ft of you)." },
                        { name: "Trickery Domain Spells", desc: "Always prepared: Charm Person, Disguise Self, Invisibility, Pass without Trace (level 3); Hypnotic Pattern, Nondetection (5); Confusion, Dimension Door (7); Dominate Person, Modify Memory (9)." }
                    ],
                    6: [
                        { name: "Invoke Duplicity", desc: "Channel Divinity: create an illusory duplicate within 30ft. You have advantage on attacks when you and the duplicate are within 5ft of the same target, and you can cast spells as if you were in the duplicate's space." }
                    ],
                    10: [
                        { name: "Blessed Strikes", desc: "Choose: Divine Strike (+1d8 poison on melee once per turn) or Potent Spellcasting (+WIS mod on cleric cantrip damage)." }
                    ],
                    14: [
                        { name: "Improved Blessed Strikes", desc: "Divine Strike rises to 2d8, or Potent Spellcasting adds 2x WIS mod." }
                    ],
                    17: [
                        { name: "Improved Duplicity", desc: "You can move your duplicate 30ft per turn, and can now have 4 duplicates at once." }
                    ]
                }
            },
            war: {
                name: "War Domain",
                level: 3,
                spells: [
                    { name: "Guiding Bolt", lvl: 3, kind: 'prepared' },
                    { name: "Magic Weapon", lvl: 3, kind: 'prepared' },
                    { name: "Shield of Faith", lvl: 3, kind: 'prepared' },
                    { name: "Spiritual Weapon", lvl: 3, kind: 'prepared' },
                    { name: "Crusader's Mantle", lvl: 5, kind: 'prepared' },
                    { name: "Spirit Guardians", lvl: 5, kind: 'prepared' },
                    { name: "Fire Shield", lvl: 7, kind: 'prepared' },
                    { name: "Freedom of Movement", lvl: 7, kind: 'prepared' },
                    { name: "Hold Monster", lvl: 9, kind: 'prepared' },
                    { name: "Steel Wind Strike", lvl: 9, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Guided Strike", act: 'free', desc: "When you or a creature within 30 ft misses with an attack roll, spend one Channel Divinity use to give that roll +10, possibly turning it into a hit (it costs your Reaction when the attack is someone else's)." },
                        { name: "War Priest", act: 'bonus', desc: "Bonus Action: make one attack with a weapon or an Unarmed Strike. Uses = your Wisdom modifier (min 1); all return on a Short or Long Rest." },
                        { name: "War Domain Spells", desc: "Always prepared: Guiding Bolt, Magic Weapon, Shield of Faith, Spiritual Weapon (level 3); Crusader's Mantle, Spirit Guardians (5); Fire Shield, Freedom of Movement (7); Hold Monster, Steel Wind Strike (9)." }
                    ],
                    6: [
                        { name: "War God's Blessing", desc: "Channel Divinity: when a creature within 30ft makes an attack roll, add +10 to that roll." }
                    ],
                    10: [
                        { name: "Blessed Strikes", desc: "Choose: Divine Strike (+1d8 damage on melee once per turn) or Potent Spellcasting (+WIS mod on cleric cantrip damage)." }
                    ],
                    14: [
                        { name: "Improved Blessed Strikes", desc: "Divine Strike rises to 2d8, or Potent Spellcasting adds 2x WIS mod." }
                    ],
                    17: [
                        { name: "Avatar of Battle", desc: "Resistance to bludgeoning, piercing, and slashing damage from nonmagical weapons." }
                    ]
                }
            }
        }
    },

    // ===== MONK CLASS (5.5e / 2024) =====
    monk: {
        hitDie: 8,
        savingThrows: ["str", "dex"],
        skillOptions: ["acrobatics", "athletics", "history", "insight", "religion", "stealth"],
        skillCount: 2,
        asiLevels: [4, 8, 12, 16, 19],
        spellcasting: "none",

        // 2024: "Ki" was renamed "Focus Points"
        martialArtsDie: { 1:"1d6", 2:"1d6", 3:"1d6", 4:"1d6", 5:"1d8", 6:"1d8", 7:"1d8", 8:"1d8", 9:"1d8", 10:"1d8", 11:"1d10", 12:"1d10", 13:"1d10", 14:"1d10", 15:"1d10", 16:"1d10", 17:"1d12", 18:"1d12", 19:"1d12", 20:"1d12" },
        focusPoints: { 1:0, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 10:10, 11:11, 12:12, 13:13, 14:14, 15:15, 16:16, 17:17, 18:18, 19:19, 20:20 },

        features: {
            1: [
                { name: "Martial Arts", act: 'bonus', desc: "While unarmed or wielding only Monk weapons (Simple Melee weapons and Martial Melee weapons with the Light property) and wearing no armor and no Shield: you can make an Unarmed Strike as a Bonus Action; you can roll your Martial Arts die (d6 at levels 1-4, d8 at 5) instead of the normal damage of Unarmed Strikes and Monk weapons; and you can use Dexterity instead of Strength for their attack and damage rolls (and for the save DC of Grapple and Shove)." },
                { name: "Unarmored Defense", desc: "While you wear no armor and wield no Shield, your base AC equals 10 + your Dexterity and Wisdom modifiers." }
            ],
            2: [
                { name: "Monk's Focus", desc: "You have Focus Points equal to your Monk level (4 at level 4); all return on a Short or Long Rest. Focus save DC = 8 + your Wisdom modifier + Proficiency Bonus. They fuel Flurry of Blows, Patient Defense, Step of the Wind and other Monk features." },
                { name: "Flurry of Blows", act: 'bonus', desc: "Spend 1 Focus Point: make two Unarmed Strikes as a Bonus Action." },
                { name: "Patient Defense", act: 'bonus', desc: "Bonus Action: take the Disengage action, or spend 1 Focus Point to take both Disengage and Dodge." },
                { name: "Step of the Wind", act: 'bonus', desc: "Bonus Action: take the Dash action, or spend 1 Focus Point to take both Disengage and Dash and double your jump distance this turn." },
                { name: "Unarmored Movement", desc: "Your Speed increases by 10 ft while you wear no armor and wield no Shield (more at levels 6, 10, 14 and 18)." },
                { name: "Uncanny Metabolism", act: 'free', desc: "When you roll Initiative, you can regain all expended Focus Points and HP equal to your Monk level + a roll of your Martial Arts die. Once per Long Rest." }
            ],
            3: [
                { name: "Deflect Attacks", act: 'reaction', desc: "When an attack roll hits you and deals Bludgeoning, Piercing or Slashing damage, Reaction: reduce the damage by 1d10 + your Dexterity modifier + your Monk level. If you reduce it to 0, you can spend 1 Focus Point to redirect it: a creature within 5 ft (melee attack) or within 60 ft and not behind Total Cover (ranged attack) makes a Dexterity save or takes two Martial Arts dice + your Dexterity modifier of that damage type." },
                { name: "Monk Subclass", desc: "Choose your Monastic Tradition. It grants features at level 3 and at higher levels." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 12 and 16 (Epic Boon at 19)." },
                { name: "Slow Fall", act: 'reaction', desc: "When you fall, Reaction: reduce the falling damage you take by 5 × your Monk level." }
            ],
            5: [
                { name: "Extra Attack", desc: "You can attack twice instead of once whenever you take the Attack action on your turn." },
                { name: "Stunning Strike", act: 'attack', desc: "Once per turn when you hit a creature with a Monk weapon or an Unarmed Strike, you can spend 1 Focus Point: the target makes a Constitution save. On a failure it is Stunned until the start of your next turn; on a success its Speed is halved until then and the next attack roll against it before then has Advantage." }
            ],
            6: [
                { name: "Empowered Strikes", desc: "Your unarmed strikes deal Force damage (bypassing common resistances)." }
            ],
            7: [
                { name: "Evasion", desc: "When you make a DEX saving throw for half damage: take no damage on a success and half damage on a failure." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            9: [
                { name: "Acrobatic Movement", desc: "You can run along vertical surfaces and across water (as long as you don't end your turn there)." }
            ],
            10: [
                { name: "Heightened Focus", desc: "Upgrade: Patient Defense also grants temp HP, Step of the Wind also grants advantage on Acrobatics, and Flurry of Blows can also push or knock Prone." },
                { name: "Self-Restoration", desc: "End the Charmed or Frightened condition on yourself (once per turn, free)." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            13: [
                { name: "Deflect Energy", desc: "Your Deflect Attacks now also works against spell attacks and energy damage." }
            ],
            14: [
                { name: "Disciplined Survivor", desc: "Proficiency in all saving throws. Spend 1 Focus Point to reroll a failed save." }
            ],
            15: [
                { name: "Perfect Focus", desc: "When you roll initiative with fewer than 4 Focus Points, they replenish to 4." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            18: [
                { name: "Superior Defense", desc: "While Dodging (via Patient Defense): resistance to all damage except force." }
            ],
            19: [
                { name: "Epic Boon", desc: "Choose an Epic Boon feat. Your ability scores can now go up to 30." }
            ],
            20: [
                { name: "Body and Mind", desc: "+4 DEX and +4 WIS (max 25 for both)." }
            ]
        },

        subclasses: {
            openHand: {
                name: "Warrior of the Open Hand",
                level: 3,
                features: {
                    3: [
                        { name: "Open Hand Technique", act: 'attack', desc: "When you hit a creature with a Flurry of Blows strike, impose one effect: Addle — it can't make Opportunity Attacks until the start of its next turn; Push — Strength save or pushed up to 15 ft away; Topple — Dexterity save or Prone." }
                    ],
                    6: [
                        { name: "Wholeness of Body", desc: "Bonus Action: regain HP equal to your Martial Arts die + WIS mod. Uses = prof bonus per Long Rest." }
                    ],
                    11: [
                        { name: "Fleet Step", desc: "+10ft speed. After Flurry of Blows: teleport up to 10ft to an open space you can see." }
                    ],
                    17: [
                        { name: "Quivering Palm", desc: "3 Focus Points on an unarmed hit: plant lethal vibrations. Within 14 days, as an action: CON save or the target drops to 0 HP; on a success it takes 10d12 force damage." }
                    ]
                }
            },
            mercy: {
                name: "Warrior of Mercy",
                level: 3,
                choices: { 3: [{ id: 'skills', fixed: ['insight', 'medicine'], featName: 'Implements of Mercy' }] },
                features: {
                    3: [
                        { name: "Hand of Harm", act: 'attack', desc: "Once per turn, when your Unarmed Strike hits a creature and deals damage, spend 1 Focus Point to add Necrotic damage equal to a roll of your Martial Arts die + your Wisdom modifier." },
                        { name: "Hand of Healing", act: 'action', desc: "Magic action, 1 Focus Point: touch a creature; it regains HP equal to a roll of your Martial Arts die + your Wisdom modifier. When you use Flurry of Blows, you can replace one of its Unarmed Strikes with this healing without spending a Focus Point for it." },
                        { name: "Implements of Mercy", desc: "You gain proficiency in Insight and Medicine and with the Herbalism Kit." }
                    ],
                    6: [
                        { name: "Physician's Touch", desc: "Hand of Healing can now also end one of the following conditions: Blinded, Deafened, Paralyzed, Poisoned, Stunned, or a disease." }
                    ],
                    11: [
                        { name: "Flurry of Healing and Harm", desc: "When you use Flurry of Blows, you can replace any attack with Hand of Healing or Hand of Harm without spending extra Focus Points." }
                    ],
                    17: [
                        { name: "Hand of Ultimate Mercy", desc: "5 Focus Points: touch a creature that died within the last 24 hours. It returns to life with 4d10 + WIS modifier HP. Once per Long Rest." }
                    ]
                }
            },
            shadow: {
                name: "Warrior of Shadow",
                level: 3,
                spellAbility: 'wis',
                spells: [
                    { name: "Minor Illusion", lvl: 3, kind: 'cantrip' },
                    { name: "Darkness", lvl: 3, kind: 'innate', cost: { res: 'focusPoints', n: 1 }, note: "no components; you can see through it and move it 60 ft each turn" }
                ],
                features: {
                    3: [
                        { name: "Shadow Arts", desc: "Darkness: spend 1 Focus Point to cast Darkness without components; you can see within it, and at the start of each of your turns you can move its area to a space within 60 ft. Darkvision: you gain 60 ft (or +60 ft if you already have it). Shadowy Figments: you know Minor Illusion (Wisdom is its spellcasting ability)." }
                    ],
                    6: [
                        { name: "Shadow Step", desc: "Bonus Action: teleport up to 60ft from one point of dim light or darkness to another. You have advantage on the first melee attack after teleporting." }
                    ],
                    11: [
                        { name: "Cloak of Shadows", desc: "You are invisible in dim light or darkness until you attack or cast a spell." }
                    ],
                    17: [
                        { name: "Opportunist", desc: "Reaction: when a creature within 5ft of you is hit by another creature's attack, make a melee attack against the attacker." }
                    ]
                }
            },
            elements: {
                name: "Warrior of the Elements",
                level: 3,
                spellAbility: 'wis',
                spells: [
                    { name: "Elementalism", lvl: 3, kind: 'cantrip' }
                ],
                features: {
                    3: [
                        { name: "Elemental Attunement", act: 'free', desc: "At the start of your turn, spend 1 Focus Point to channel elemental energy for 10 minutes: your Unarmed Strikes gain +10 ft reach and can deal Acid, Cold, Fire, Lightning or Thunder damage; when they do, the target makes a Strength save or is moved up to 10 ft toward or away from you." },
                        { name: "Manipulate Elements", desc: "You know the Elementalism cantrip (Wisdom is its spellcasting ability)." }
                    ],
                    6: [
                        { name: "Environmental Burst", desc: "Additional elemental options. Elemental Burst damage rises to 4d6." }
                    ],
                    11: [
                        { name: "Stride of the Elements", desc: "You gain a fly and swim speed equal to your walking speed when you use Flurry of Blows or Step of the Wind." }
                    ],
                    17: [
                        { name: "Elemental Epitome", desc: "Become an avatar of the elements: extra elemental damage on unarmed strikes, resistance to a chosen element, and your reach becomes 10ft." }
                    ]
                }
            }
        }
    },

    // ===== METAMAGIC OPTIONS (2024 PHB) =====
    metamagic: [
        { name: "Careful Spell", cost: 1, desc: "When you cast a spell that forces other creatures to make a saving throw, choose up to your Charisma modifier (min 1) of them: they automatically succeed, and take no damage if they would take half on a success." },
        { name: "Distant Spell", cost: 1, desc: "Double the range of a spell with a range of 5 ft or more, or give a Touch spell a range of 30 ft." },
        { name: "Empowered Spell", cost: 1, desc: "When you roll damage for a spell, reroll up to your Charisma modifier (min 1) of the damage dice and use the new rolls. Can be combined with another Metamagic option on the same spell." },
        { name: "Extended Spell", cost: 1, desc: "Double the duration of a spell that lasts 1 minute or longer (max 24 hours). If it needs Concentration, you have Advantage on saves to keep it." },
        { name: "Heightened Spell", cost: 2, desc: "When you cast a spell that forces a saving throw, one target of your choice has Disadvantage on its saves against that spell." },
        { name: "Quickened Spell", cost: 2, desc: "Cast a spell that takes an action as a Bonus Action instead. Not if you've already cast a level 1+ spell this turn, and you can't cast another level 1+ spell this turn afterwards." },
        { name: "Seeking Spell", cost: 1, desc: "When you miss with a spell attack roll, reroll the d20 and use the new roll. Can be combined with another Metamagic option on the same spell." },
        { name: "Subtle Spell", cost: 1, desc: "Cast a spell without Verbal, Somatic or Material components (except Material components that are consumed or have a cost)." },
        { name: "Transmuted Spell", cost: 1, desc: "Change a spell's damage type from Acid, Cold, Fire, Lightning, Poison or Thunder to another type from that list." },
        { name: "Twinned Spell", cost: 1, desc: "When you cast a spell that can target an extra creature when cast with a higher-level slot (such as Charm Person), increase the spell's effective level by 1." }
    ],

    // ===== FEATS (2024 PHB) =====
    // Verified against the 2024 PHB feat list (5etools XPHB data, 2026-10-15).
    // category: "origin" (background / Human Versatile / any ASI), "general"
    //   (level 4+ via Ability Score Improvement), "fighting" (Fighting Style
    //   feature), "epic" (level 19+).
    // prereq (all must hold): level, abilities (ANY one ≥ value), spellcasting
    //   (Spellcasting or Pact Magic feature), armor ('light'|'medium'|'heavy'|
    //   'shield' training), fightingStyle (has the Fighting Style feature).
    // abilityBonus = fixed +1; ability = choose one of these for +1 (max 20);
    //   asi = the Ability Score Improvement feat itself (+2 / +1+1).
    // spells = spells the feat grants (see DATA.spellGrantKinds in the leveling
    //   block); `pick` entries are chosen when taking the feat and stored on the
    //   character's feat record (asiChoices[N].cantrips / .spells).
    // spellAbility: 'choose' (pick INT/WIS/CHA) or 'ability' (= the increased one).
    // choices = extra picks made when taking the feat (skills, element, …).
    // actions = what the feat lets you DO, by action type (action/bonus/
    //   reaction/attack = rider on the Attack action/hit, free = no action).
    feats: [
        // --- ORIGIN FEATS ---
        { name: "Alert", category: "origin", prereq: null,
          desc: "Initiative Proficiency: add your Proficiency Bonus to Initiative rolls. Initiative Swap: immediately after you roll Initiative, you can swap Initiative with one willing ally in the same combat (neither of you can be Incapacitated)." },
        { name: "Crafter", category: "origin", prereq: null,
          desc: "Proficiency with three Artisan's Tools of your choice (from the Fast Crafting table). You get a 20% discount on nonmagical items you buy. Fast Crafting: when you finish a Long Rest, you can craft one piece of gear from the Fast Crafting table with tools you're proficient with; it falls apart at your next Long Rest.",
          choices: [{ id: 'tools', count: 3, note: "Artisan's Tools" }] },
        { name: "Healer", category: "origin", prereq: null,
          desc: "Battle Medic: with a Healer's Kit, take a Utilize action and expend one use of the kit on a creature within 5 ft; it can spend one Hit Point Die, you roll it, and it regains that many HP plus your Proficiency Bonus. Healing Rerolls: when you roll a die to restore HP with a spell or Battle Medic, you can reroll a 1 (use the new roll).",
          actions: [{ act: 'action', name: "Battle Medic", desc: "Utilize action + one use of a Healer's Kit: a creature within 5 ft spends a Hit Point Die and regains the roll + your Proficiency Bonus." }] },
        { name: "Lucky", category: "origin", prereq: null,
          desc: "You have Luck Points equal to your Proficiency Bonus, regained on a Long Rest. Spend 1 to give yourself Advantage on a D20 Test, or to impose Disadvantage on an attack roll made against you.",
          actions: [{ act: 'free', name: "Luck Point", desc: "Advantage on your D20 Test, or Disadvantage on an attack roll against you." }] },
        { name: "Magic Initiate (Cleric)", category: "origin", prereq: null, spellList: "cleric", spellAbility: 'choose',
          desc: "Learn two Cleric cantrips and one level 1 Cleric spell. INT, WIS or CHA is your spellcasting ability for them (chosen when you take the feat). The level 1 spell is always prepared: cast it once per Long Rest without a spell slot, or with any spell slots you have. Whenever you gain a level, you can replace one of these spells with another of the same level from the Cleric list. You can take Magic Initiate again with a different spell list.",
          spells: [{ pick: 'cantrips', count: 2, list: 'cleric', level: 0, kind: 'cantrip' },
                   { pick: 'spells', count: 1, list: 'cleric', level: 1, kind: 'innate', free: 1, recharge: 'long', slots: true }] },
        { name: "Magic Initiate (Druid)", category: "origin", prereq: null, spellList: "druid", spellAbility: 'choose',
          desc: "Learn two Druid cantrips and one level 1 Druid spell. INT, WIS or CHA is your spellcasting ability for them (chosen when you take the feat). The level 1 spell is always prepared: cast it once per Long Rest without a spell slot, or with any spell slots you have. Whenever you gain a level, you can replace one of these spells with another of the same level from the Druid list. You can take Magic Initiate again with a different spell list.",
          spells: [{ pick: 'cantrips', count: 2, list: 'druid', level: 0, kind: 'cantrip' },
                   { pick: 'spells', count: 1, list: 'druid', level: 1, kind: 'innate', free: 1, recharge: 'long', slots: true }] },
        { name: "Magic Initiate (Wizard)", category: "origin", prereq: null, spellList: "wizard", spellAbility: 'choose',
          desc: "Learn two Wizard cantrips and one level 1 Wizard spell. INT, WIS or CHA is your spellcasting ability for them (chosen when you take the feat). The level 1 spell is always prepared: cast it once per Long Rest without a spell slot, or with any spell slots you have. Whenever you gain a level, you can replace one of these spells with another of the same level from the Wizard list. You can take Magic Initiate again with a different spell list.",
          spells: [{ pick: 'cantrips', count: 2, list: 'wizard', level: 0, kind: 'cantrip' },
                   { pick: 'spells', count: 1, list: 'wizard', level: 1, kind: 'innate', free: 1, recharge: 'long', slots: true }] },
        { name: "Musician", category: "origin", prereq: null,
          desc: "Proficiency with three Musical Instruments of your choice. Encouraging Song: as you finish a Short or Long Rest, play a song on an instrument you're proficient with and give Heroic Inspiration to allies who hear it, up to your Proficiency Bonus.",
          choices: [{ id: 'tools', count: 3, note: "Musical Instruments" }] },
        { name: "Savage Attacker", category: "origin", prereq: null,
          desc: "Once per turn when you hit a target with a weapon, you can roll the weapon's damage dice twice and use either roll.",
          actions: [{ act: 'attack', name: "Savage Attacker", desc: "Once per turn on a weapon hit: roll the damage dice twice, use either roll." }] },
        { name: "Skilled", category: "origin", prereq: null, repeatable: true,
          desc: "Gain proficiency in any combination of three skills or tools of your choice. You can take this feat more than once.",
          choices: [{ id: 'skills', count: 3, note: "skills or tools" }] },
        { name: "Tavern Brawler", category: "origin", prereq: null,
          desc: "Your Unarmed Strike can deal 1d4 + Strength modifier Bludgeoning damage, and you can reroll a 1 on its damage die (use the new roll). You're proficient with improvised weapons. Once per turn when you hit with an Unarmed Strike as part of the Attack action, you can also push the target 5 ft away.",
          actions: [{ act: 'attack', name: "Tavern Brawler push", desc: "Once per turn on an Unarmed Strike hit (Attack action): deal damage and push the target 5 ft." }] },
        { name: "Tough", category: "origin", prereq: null,
          desc: "Your Hit Point maximum increases by twice your character level when you take this feat, and by 2 more every time you gain a level." },

        // --- GENERAL FEATS (level 4+, via Ability Score Improvement) ---
        // Every 2024 general feat includes a +1 to an ability score (max 20).
        { name: "Ability Score Improvement", category: "general", asi: true, repeatable: true, prereq: { level: 4 },
          desc: "Increase one ability score by 2, or two ability scores by 1. This can't raise a score above 20. You can take this feat more than once." },
        { name: "Actor", category: "general", prereq: { level: 4, abilities: { cha: 13 } }, abilityBonus: { cha: 1 },
          desc: "+1 Charisma. Impersonation: while disguised as a real or fictional person, you have Advantage on Charisma (Deception or Performance) checks to convince others you are that person. Mimicry: you can mimic sounds and speech; a listener needs a Wisdom (Insight) check (DC 8 + your CHA modifier + Proficiency Bonus) to tell it's fake." },
        { name: "Athlete", category: "general", prereq: { level: 4, abilities: { str: 13, dex: 13 } }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. You gain a Climb Speed equal to your Speed. Standing up from Prone costs only 5 ft of movement. You can make a running Long or High Jump after moving only 5 ft." },
        { name: "Charger", category: "general", prereq: { level: 4, abilities: { str: 13, dex: 13 } }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. Improved Dash: when you take the Dash action, your Speed increases by 10 ft for that action. Charge Attack (once per turn): if you move at least 10 ft in a straight line toward a target right before hitting it with a melee attack as part of the Attack action, either add 1d8 to the damage or push it up to 10 ft (if it's no more than one size larger than you).",
          actions: [{ act: 'attack', name: "Charge Attack", desc: "After moving 10+ ft straight at the target: +1d8 damage or push 10 ft (once per turn)." }] },
        { name: "Chef", category: "general", prereq: { level: 4 }, ability: ['con', 'wis'],
          desc: "+1 Constitution or Wisdom. Proficiency with Cook's Utensils. Replenishing Meal: during a Short Rest, cook for 4 + your Proficiency Bonus creatures; each one that spends Hit Point Dice regains an extra 1d8 HP. Bolstering Treats: with 1 hour of work or when you finish a Long Rest, make treats equal to your Proficiency Bonus (they last 8 hours); a creature can eat one as a Bonus Action to gain Temporary HP equal to your Proficiency Bonus." },
        { name: "Crossbow Expert", category: "general", prereq: { level: 4, abilities: { dex: 13 } }, abilityBonus: { dex: 1 },
          desc: "+1 Dexterity. You ignore the Loading property of crossbows and can load one without a free hand. Being within 5 ft of an enemy doesn't give you Disadvantage on crossbow attacks. When you make the extra attack of the Light property with a Light crossbow, you can add your ability modifier to its damage." },
        { name: "Crusher", category: "general", prereq: { level: 4 }, ability: ['str', 'con'],
          desc: "+1 Strength or Constitution. Push: once per turn when you hit a creature with an attack that deals Bludgeoning damage, you can move it 5 ft (if it's no more than one size larger than you). Enhanced Critical: when you score a critical hit that deals Bludgeoning damage, attack rolls against that creature have Advantage until the start of your next turn.",
          actions: [{ act: 'attack', name: "Crusher push", desc: "Once per turn on a Bludgeoning hit: move the target 5 ft." }] },
        { name: "Defensive Duelist", category: "general", prereq: { level: 4, abilities: { dex: 13 } }, abilityBonus: { dex: 1 },
          desc: "+1 Dexterity. Parry: while holding a Finesse weapon, when another creature hits you with a melee attack, you can take a Reaction to add your Proficiency Bonus to your AC against melee attacks until the start of your next turn (possibly turning the hit into a miss).",
          actions: [{ act: 'reaction', name: "Parry", desc: "When hit in melee while holding a Finesse weapon: +Proficiency Bonus AC against melee attacks until your next turn." }] },
        { name: "Dual Wielder", category: "general", prereq: { level: 4, abilities: { str: 13, dex: 13 } }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. Enhanced Dual Wielding: when you take the Attack action and attack with a Light weapon, you can make one extra attack as a Bonus Action later that turn with a different melee weapon that lacks the Two-Handed property (no ability modifier to its damage unless negative). Quick Draw: draw or stow two weapons (without Two-Handed) when you could normally handle only one.",
          actions: [{ act: 'bonus', name: "Dual Wielder attack", desc: "After attacking with a Light weapon (Attack action): one extra attack with a different one-handed melee weapon." }] },
        { name: "Durable", category: "general", prereq: { level: 4 }, abilityBonus: { con: 1 },
          desc: "+1 Constitution. Defy Death: you have Advantage on Death Saving Throws. Speedy Recovery: as a Bonus Action, expend one Hit Point Die, roll it and regain that many HP.",
          actions: [{ act: 'bonus', name: "Speedy Recovery", desc: "Spend one Hit Point Die and regain the roll in HP." }] },
        { name: "Elemental Adept", category: "general", prereq: { level: 4, spellcasting: true }, ability: ['int', 'wis', 'cha'], repeatable: true,
          desc: "+1 Intelligence, Wisdom or Charisma. Energy Mastery: choose Acid, Cold, Fire, Lightning or Thunder. Spells you cast ignore Resistance to that damage type, and you treat any 1 on a damage die for that type as a 2. Repeatable with a different damage type.",
          choices: [{ id: 'element', options: ['acid', 'cold', 'fire', 'lightning', 'thunder'] }] },
        { name: "Fey-Touched", category: "general", prereq: { level: 4 }, ability: ['int', 'wis', 'cha'], spellAbility: 'ability',
          desc: "+1 Intelligence, Wisdom or Charisma. Fey Magic: you always have Misty Step and one level 1 Divination or Enchantment spell of your choice prepared. You can cast each of them once without a spell slot (regained on a Long Rest), and you can also cast them with spell slots. Their spellcasting ability is the ability you increased with this feat.",
          spells: [{ name: "Misty Step", kind: 'innate', free: 1, recharge: 'long', slots: true },
                   { pick: 'spells', count: 1, level: 1, schools: ['Divination', 'Enchantment'], kind: 'innate', free: 1, recharge: 'long', slots: true }] },
        { name: "Grappler", category: "general", prereq: { level: 4, abilities: { str: 13, dex: 13 } }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. Punch and Grab: once per turn, when you hit with an Unarmed Strike as part of the Attack action, you can use both the Damage and the Grapple option. You have Advantage on attack rolls against a creature you're grappling. Moving a grappled creature your size or smaller costs no extra movement.",
          actions: [{ act: 'attack', name: "Punch and Grab", desc: "Once per turn on an Unarmed Strike hit (Attack action): damage AND grapple." }] },
        { name: "Great Weapon Master", category: "general", prereq: { level: 4, abilities: { str: 13 } }, abilityBonus: { str: 1 },
          desc: "+1 Strength. Heavy Weapon Mastery: when you hit a creature with a Heavy weapon as part of the Attack action, you can deal extra damage equal to your Proficiency Bonus. Hew: immediately after you score a critical hit with a melee weapon or reduce a creature to 0 HP with one, you can make one attack with the same weapon as a Bonus Action.",
          actions: [{ act: 'attack', name: "Heavy Weapon Mastery", desc: "Heavy weapon hit (Attack action): + Proficiency Bonus damage." },
                    { act: 'bonus', name: "Hew", desc: "After a melee critical hit or dropping a creature to 0 HP: one more attack with that weapon." }] },
        { name: "Heavily Armored", category: "general", prereq: { level: 4, armor: 'medium' }, ability: ['con', 'str'],
          desc: "+1 Constitution or Strength. You gain training with Heavy armor." },
        { name: "Heavy Armor Master", category: "general", prereq: { level: 4, armor: 'heavy' }, ability: ['con', 'str'],
          desc: "+1 Constitution or Strength. While you wear Heavy armor, Bludgeoning, Piercing and Slashing damage dealt to you by an attack that hits you is reduced by your Proficiency Bonus." },
        { name: "Inspiring Leader", category: "general", prereq: { level: 4, abilities: { wis: 13, cha: 13 } }, ability: ['wis', 'cha'],
          desc: "+1 Wisdom or Charisma. Bolstering Performance: when you finish a Short or Long Rest, you can give an inspiring speech, song or dance; up to six allies (you can include yourself) within 30 ft who witness it gain Temporary HP equal to your character level + the modifier of the ability you increased." },
        { name: "Keen Mind", category: "general", prereq: { level: 4, abilities: { int: 13 } }, abilityBonus: { int: 1 },
          desc: "+1 Intelligence. Lore Knowledge: choose Arcana, History, Investigation, Nature or Religion; you gain proficiency in it, or Expertise if you're already proficient. Quick Study: you can take the Study action as a Bonus Action.",
          choices: [{ id: 'skills', count: 1, options: ['arcana', 'history', 'investigation', 'nature', 'religion'], mode: 'profOrExpertise' }],
          actions: [{ act: 'bonus', name: "Quick Study", desc: "Take the Study action as a Bonus Action." }] },
        { name: "Lightly Armored", category: "general", prereq: { level: 4 }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. You gain training with Light armor and Shields." },
        { name: "Mage Slayer", category: "general", prereq: { level: 4 }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. Concentration Breaker: a creature you damage while it's Concentrating has Disadvantage on the save to keep Concentration. Guarded Mind: when you fail an Intelligence, Wisdom or Charisma saving throw, you can succeed instead; once per Short or Long Rest.",
          actions: [{ act: 'free', name: "Guarded Mind", desc: "Turn a failed INT/WIS/CHA save into a success (once per Short or Long Rest)." }] },
        { name: "Martial Weapon Training", category: "general", prereq: { level: 4 }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. You gain proficiency with Martial weapons." },
        { name: "Medium Armor Master", category: "general", prereq: { level: 4, armor: 'medium' }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. While you wear Medium armor and have Dexterity 16 or higher, you add 3 (instead of 2) for Dexterity to your AC." },
        { name: "Moderately Armored", category: "general", prereq: { level: 4, armor: 'light' }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. You gain training with Medium armor." },
        { name: "Mounted Combatant", category: "general", prereq: { level: 4 }, ability: ['str', 'dex', 'wis'],
          desc: "+1 Strength, Dexterity or Wisdom. While mounted: you have Advantage on attacks against unmounted creatures within 5 ft of your mount that are at least one size smaller than it; your mount takes no damage on a successful Dexterity save against a half-damage effect (and half on a failure); and you can make an attack that hits your mount hit you instead." },
        { name: "Observant", category: "general", prereq: { level: 4, abilities: { int: 13, wis: 13 } }, ability: ['int', 'wis'],
          desc: "+1 Intelligence or Wisdom. Keen Observer: choose Insight, Investigation or Perception; you gain proficiency in it, or Expertise if you're already proficient. Quick Search: you can take the Search action as a Bonus Action.",
          choices: [{ id: 'skills', count: 1, options: ['insight', 'investigation', 'perception'], mode: 'profOrExpertise' }],
          actions: [{ act: 'bonus', name: "Quick Search", desc: "Take the Search action as a Bonus Action." }] },
        { name: "Piercer", category: "general", prereq: { level: 4 }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. Puncture: once per turn when you hit with an attack that deals Piercing damage, you can reroll one of its damage dice (use the new roll). Enhanced Critical: on a critical hit that deals Piercing damage, roll one extra damage die.",
          actions: [{ act: 'attack', name: "Puncture", desc: "Once per turn on a Piercing hit: reroll one damage die." }] },
        { name: "Poisoner", category: "general", prereq: { level: 4 }, ability: ['dex', 'int'],
          desc: "+1 Dexterity or Intelligence. Your Poison damage ignores Resistance to Poison. Brew Poison: proficiency with the Poisoner's Kit; with 1 hour of work and 50 GP of materials you make poison doses equal to your Proficiency Bonus. As a Bonus Action, apply a dose to a weapon or piece of ammunition (lasts 1 minute or until it deals damage); a creature it damages makes a Constitution save (DC 8 + the increased ability's modifier + Proficiency Bonus) or takes 2d8 Poison damage and is Poisoned until the end of your next turn.",
          actions: [{ act: 'bonus', name: "Apply poison", desc: "Coat a weapon or ammunition with a dose (CON save or 2d8 Poison + Poisoned)." }] },
        { name: "Polearm Master", category: "general", prereq: { level: 4, abilities: { str: 13, dex: 13 } }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. Pole Strike: immediately after you take the Attack action and attack with a Quarterstaff, a Spear, or a Heavy weapon with the Reach property, you can make a Bonus Action melee attack with the opposite end (d4 Bludgeoning). Reactive Strike: while holding such a weapon, you can take a Reaction to make one melee attack against a creature that enters your reach.",
          actions: [{ act: 'bonus', name: "Pole Strike", desc: "After the Attack action with a Quarterstaff, Spear or Heavy Reach weapon: d4 Bludgeoning butt-end attack." },
                    { act: 'reaction', name: "Reactive Strike", desc: "Melee attack against a creature that enters your reach." }] },
        { name: "Resilient", category: "general", prereq: { level: 4 }, ability: ['str', 'dex', 'con', 'int', 'wis', 'cha'], abilityNote: 'an ability you lack saving throw proficiency in',
          desc: "+1 to one ability in which you lack saving throw proficiency, and you gain saving throw proficiency with that ability." },
        { name: "Ritual Caster", category: "general", prereq: { level: 4, abilities: { int: 13, wis: 13, cha: 13 } }, ability: ['int', 'wis', 'cha'], spellAbility: 'ability',
          desc: "+1 Intelligence, Wisdom or Charisma. Ritual Spells: choose level 1 spells with the Ritual tag (from any class list) equal to your Proficiency Bonus; you always have them prepared, can cast them as Rituals, and can cast them with any spell slots you have. Each time your Proficiency Bonus increases, add one more. Quick Ritual: once per Long Rest, cast one of your prepared Ritual spells with its normal casting time without a spell slot.",
          spells: [{ pick: 'spells', count: 'pb', level: 1, ritual: true, kind: 'ritual', slots: true }],
          actions: [{ act: 'free', name: "Quick Ritual", desc: "Once per Long Rest: cast a prepared Ritual spell at its normal casting time without a slot." }] },
        { name: "Sentinel", category: "general", prereq: { level: 4, abilities: { str: 13, dex: 13 } }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. Guardian: immediately after a creature within 5 ft of you takes the Disengage action or hits a target other than you with an attack, you can make an Opportunity Attack against it. Halt: a creature you hit with an Opportunity Attack has Speed 0 for the rest of the current turn.",
          actions: [{ act: 'reaction', name: "Guardian", desc: "Opportunity Attack when a creature within 5 ft Disengages or hits someone else; a hit stops its movement." }] },
        { name: "Shadow-Touched", category: "general", prereq: { level: 4 }, ability: ['int', 'wis', 'cha'], spellAbility: 'ability',
          desc: "+1 Intelligence, Wisdom or Charisma. Shadow Magic: you always have Invisibility and one level 1 Illusion or Necromancy spell of your choice prepared. You can cast each of them once without a spell slot (regained on a Long Rest), and you can also cast them with spell slots. Their spellcasting ability is the ability you increased with this feat.",
          spells: [{ name: "Invisibility", kind: 'innate', free: 1, recharge: 'long', slots: true },
                   { pick: 'spells', count: 1, level: 1, schools: ['Illusion', 'Necromancy'], kind: 'innate', free: 1, recharge: 'long', slots: true }] },
        { name: "Sharpshooter", category: "general", prereq: { level: 4, abilities: { dex: 13 } }, abilityBonus: { dex: 1 },
          desc: "+1 Dexterity. Your ranged weapon attacks ignore Half Cover and Three-Quarters Cover. Being within 5 ft of an enemy doesn't give you Disadvantage on ranged weapon attacks, and neither does attacking at long range." },
        { name: "Shield Master", category: "general", prereq: { level: 4, armor: 'shield' }, abilityBonus: { str: 1 },
          desc: "+1 Strength. Shield Bash: once per turn, when you hit a creature within 5 ft with a melee weapon as part of the Attack action, you can bash it with your Shield: it makes a Strength save (DC 8 + STR modifier + Proficiency Bonus) or is pushed 5 ft or knocked Prone (your choice). Interpose Shield: while holding a Shield, when an effect lets you make a Dexterity save for half damage, you can take a Reaction to take no damage on a success.",
          actions: [{ act: 'attack', name: "Shield Bash", desc: "Once per turn on a melee hit within 5 ft (Attack action): STR save or push 5 ft / Prone." },
                    { act: 'reaction', name: "Interpose Shield", desc: "On a successful DEX save for half damage: take no damage instead." }] },
        { name: "Skill Expert", category: "general", prereq: { level: 4 }, ability: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
          desc: "+1 to one ability score of your choice. Gain proficiency in one skill of your choice, and Expertise in one skill you're proficient in (but lack Expertise in).",
          choices: [{ id: 'skills', count: 1, mode: 'proficiency' }, { id: 'expertise', count: 1 }] },
        { name: "Skulker", category: "general", prereq: { level: 4, abilities: { dex: 13 } }, abilityBonus: { dex: 1 },
          desc: "+1 Dexterity. You have Blindsight with a range of 10 ft. Fog of War: in combat, you have Advantage on Dexterity (Stealth) checks made as part of the Hide action. Sniper: if you attack while hidden and miss, the attack doesn't reveal your location." },
        { name: "Slasher", category: "general", prereq: { level: 4 }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. Hamstring: once per turn when you hit with an attack that deals Slashing damage, you can reduce the target's Speed by 10 ft until the start of your next turn. Enhanced Critical: on a critical hit that deals Slashing damage, the target has Disadvantage on attack rolls until the start of your next turn.",
          actions: [{ act: 'attack', name: "Hamstring", desc: "Once per turn on a Slashing hit: target's Speed −10 ft until your next turn." }] },
        { name: "Speedy", category: "general", prereq: { level: 4, abilities: { dex: 13, con: 13 } }, ability: ['dex', 'con'],
          desc: "+1 Dexterity or Constitution. Your Speed increases by 10 ft. When you take the Dash action, Difficult Terrain costs you no extra movement for the rest of that turn. Opportunity Attacks against you have Disadvantage." },
        { name: "Spell Sniper", category: "general", prereq: { level: 4, spellcasting: true }, ability: ['int', 'wis', 'cha'],
          desc: "+1 Intelligence, Wisdom or Charisma. Your spell attack rolls ignore Half Cover and Three-Quarters Cover. Being within 5 ft of an enemy doesn't give you Disadvantage on spell attack rolls. When you cast a spell with a range of 10 ft or more that requires an attack roll, you can increase its range by 60 ft." },
        { name: "Telekinetic", category: "general", prereq: { level: 4 }, ability: ['int', 'wis', 'cha'], spellAbility: 'ability',
          desc: "+1 Intelligence, Wisdom or Charisma. Minor Telekinesis: you learn the Mage Hand cantrip; when you cast it, you need no Verbal or Somatic components, you can make the hand Invisible, and its range and how far it can move from you both increase by 30 ft. Telekinetic Shove: as a Bonus Action, choose a creature you can see within 30 ft; it makes a Strength save (DC 8 + the increased ability's modifier + Proficiency Bonus) or is moved 5 ft toward or away from you.",
          spells: [{ name: "Mage Hand", kind: 'cantrip', note: "no V/S, can be Invisible, +30 ft range" }],
          actions: [{ act: 'bonus', name: "Telekinetic Shove", desc: "A creature within 30 ft: STR save or moved 5 ft toward/away from you." }] },
        { name: "Telepathic", category: "general", prereq: { level: 4 }, ability: ['int', 'wis', 'cha'], spellAbility: 'ability',
          desc: "+1 Intelligence, Wisdom or Charisma. Telepathic Utterance: you can speak telepathically to any creature you can see within 60 ft (in a language you know; it can't answer telepathically). Detect Thoughts: you always have it prepared; cast it once per Long Rest without a spell slot or components, or with spell slots as normal.",
          spells: [{ name: "Detect Thoughts", kind: 'innate', free: 1, recharge: 'long', slots: true, note: "no components when cast for free" }] },
        { name: "War Caster", category: "general", prereq: { level: 4, spellcasting: true }, ability: ['int', 'wis', 'cha'],
          desc: "+1 Intelligence, Wisdom or Charisma. You have Advantage on Constitution saves to maintain Concentration. Reactive Spell: when a creature provokes an Opportunity Attack by leaving your reach, you can take a Reaction to cast a spell at it instead (casting time of one action, targeting only that creature). You can perform Somatic components even with weapons or a Shield in your hands.",
          actions: [{ act: 'reaction', name: "Reactive Spell", desc: "Instead of an Opportunity Attack: cast a 1-action spell that targets only that creature." }] },
        { name: "Weapon Master", category: "general", prereq: { level: 4 }, ability: ['str', 'dex'],
          desc: "+1 Strength or Dexterity. You can use the mastery property of one kind of Simple or Martial weapon you're proficient with. Whenever you finish a Long Rest, you can change that weapon kind." },

        // --- EPIC BOONS (level 19+) — outside the level 1-4 scope, unchanged ---
        { name: "Boon of Combat Prowess", category: "epic", desc: "+1 STR or DEX (max 30). When you miss with a melee attack, you can turn it into a hit. Once per Long Rest.", prereq: null },
        { name: "Boon of Dimensional Travel", category: "epic", desc: "+1 INT, WIS, or CHA (max 30). Teleport up to 30ft as a Bonus Action. Uses = proficiency bonus per Long Rest.", prereq: null },
        { name: "Boon of Energy Resistance", category: "epic", desc: "+1 CON (max 30). When you take acid/cold/fire/lightning/thunder damage: reaction to gain resistance, plus choose allies (up to prof bonus) who also gain it.", prereq: null },
        { name: "Boon of Fate", category: "epic", desc: "+1 INT, WIS, or CHA (max 30). Add 2d4 to, or subtract 2d4 from, an attack roll, ability check, or saving throw (once per Short/Long Rest).", prereq: null },
        { name: "Boon of Fortitude", category: "epic", desc: "+1 CON (max 30). Your max HP increases by 40.", prereq: null },
        { name: "Boon of Irresistible Offense", category: "epic", desc: "+1 STR or DEX (max 30). Your weapon and unarmed attacks ignore resistance, and treat immunity as resistance.", prereq: null },
        { name: "Boon of Recovery", category: "epic", desc: "+1 CON (max 30). On a failed death save: succeed instead and regain HP equal to proficiency bonus x Hit Die.", prereq: null },
        { name: "Boon of Skill", category: "epic", desc: "+1 to one ability (max 30). Proficiency in all skills.", prereq: null },
        { name: "Boon of Speed", category: "epic", desc: "+1 DEX (max 30). +30ft speed. Opportunity attacks against you have disadvantage.", prereq: null },
        { name: "Boon of Spell Recall", category: "epic", desc: "+1 INT, WIS, or CHA (max 30). Cast a spell of 5th level or lower without a spell slot. Once per Long Rest.", prereq: null },
        { name: "Boon of the Night Spirit", category: "epic", desc: "+1 DEX, WIS, or CHA (max 30). Merge with shadows: invisible in dim light/darkness. Resistance to all damage except force/psychic/radiant.", prereq: null },
        { name: "Boon of Truesight", category: "epic", desc: "+1 INT, WIS, or CHA (max 30). Truesight 60ft.", prereq: null },

        // --- FIGHTING STYLE FEATS (prereq: the Fighting Style feature) ---
        { name: "Archery", category: "fighting", desc: "You gain a +2 bonus to attack rolls you make with Ranged weapons.", prereq: { fightingStyle: true } },
        { name: "Blind Fighting", category: "fighting", desc: "You have Blindsight with a range of 10 feet: within that range you can see anything that isn't behind Total Cover, even in darkness or when facing an Invisible creature.", prereq: { fightingStyle: true } },
        { name: "Defense", category: "fighting", desc: "While you're wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.", prereq: { fightingStyle: true } },
        { name: "Dueling", category: "fighting", desc: "When you're holding a Melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon. A Shield is allowed.", prereq: { fightingStyle: true } },
        { name: "Great Weapon Fighting", category: "fighting", desc: "When you roll damage for an attack with a Melee weapon you're holding with two hands (Two-Handed, or Versatile used two-handed), treat any 1 or 2 on a damage die as a 3.", prereq: { fightingStyle: true } },
        { name: "Interception", category: "fighting", desc: "Reaction when a creature you can see hits another creature within 5 feet of you: reduce the damage dealt by 1d10 + your Proficiency Bonus. You must be holding a Shield or a Simple or Martial weapon.", prereq: { fightingStyle: true },
          actions: [{ act: 'reaction', name: "Interception", desc: "An ally within 5 ft is hit: reduce the damage by 1d10 + Proficiency Bonus." }] },
        { name: "Protection", category: "fighting", desc: "Reaction when a creature you can see attacks a target other than you within 5 feet of you, while you're holding a Shield: impose Disadvantage on that attack and on all other attacks against that target until the start of your next turn (as long as you stay within 5 feet of it).", prereq: { fightingStyle: true },
          actions: [{ act: 'reaction', name: "Protection", desc: "With a Shield: Disadvantage on attacks against an adjacent ally until your next turn." }] },
        { name: "Thrown Weapon Fighting", category: "fighting", desc: "You gain a +2 bonus to damage rolls with weapons that have the Thrown property when you make ranged attacks with them.", prereq: { fightingStyle: true } },
        { name: "Two-Weapon Fighting", category: "fighting", desc: "When you make the extra attack granted by the Light weapon property, you can add your ability modifier to that attack's damage.", prereq: { fightingStyle: true } },
        { name: "Unarmed Fighting", category: "fighting", desc: "Your Unarmed Strikes deal 1d6 + STR bludgeoning damage (1d8 if you aren't holding weapons or a Shield). At the start of each of your turns, you can deal 1d4 bludgeoning damage to one creature Grappled by you.", prereq: { fightingStyle: true } }
    ],

    // ===== ALL 18 SKILLS =====
    skills: [
        { name: "Acrobatics", ability: "dex" },
        { name: "Animal Handling", ability: "wis" },
        { name: "Arcana", ability: "int" },
        { name: "Athletics", ability: "str" },
        { name: "Deception", ability: "cha" },
        { name: "History", ability: "int" },
        { name: "Insight", ability: "wis" },
        { name: "Intimidation", ability: "cha" },
        { name: "Investigation", ability: "int" },
        { name: "Medicine", ability: "wis" },
        { name: "Nature", ability: "int" },
        { name: "Perception", ability: "wis" },
        { name: "Performance", ability: "cha" },
        { name: "Persuasion", ability: "cha" },
        { name: "Religion", ability: "int" },
        { name: "Sleight of Hand", ability: "dex" },
        { name: "Stealth", ability: "dex" },
        { name: "Survival", ability: "wis" }
    ],

    // ===== BACKGROUNDS (5.5e / 2024 PHB — 16 core + 1 legacy) =====
    // Each provides: 3 ability scores (+2/+1 or +1/+1/+1), 2 skills, 1 tool, 1 origin feat, equipment (Choice A = themed gear + GP, Choice B = 50 GP).
    // Equipment lists below are best recall of 2024 PHB ch. 4 Backgrounds — verify against the PHB before relying on them.
    backgrounds: {
        // --- LEGACY (not in the 2024 PHB) ---
        urchin: {
            name: "Urchin",
            legacy: true,
            abilityScores: ["DEX", "CON", "WIS"],
            skills: ["Sleight of Hand", "Stealth"],
            tool: "Thieves' Tools",
            feat: "Lucky",
            desc: { nl: "LEGACY (niet in 2024 PHB). Opgegroeid op straat. Je kent de stad beter dan wie dan ook.", en: "LEGACY (not in the 2024 PHB). Raised on the streets. You know the city better than anyone." },
            equipment: {
                A: { items: ["Small knife", "Map of city", "Pet mouse", "Token from parents", "Common clothes", "Pouch"], gp: 10 },
                B: { gp: 50 }
            }
        },

        // --- 2024 PHB BACKGROUNDS ---
        acolyte: {
            name: "Acolyte",
            abilityScores: ["INT", "WIS", "CHA"],
            skills: ["Insight", "Religion"],
            tool: "Calligrapher's Supplies",
            feat: "Magic Initiate (Cleric)",
            desc: { nl: "Je hebt je leven gewijd aan de dienst van een tempel of religieuze orde. Je kent de rituelen en overtuigingen van je geloof.", en: "You have devoted your life to serving a temple or religious order. You know the rites and beliefs of your faith." },
            equipment: {
                A: { items: ["Calligrapher's Supplies", "Book (prayers)", "Holy Symbol", "Parchment (10 sheets)", "Robe"], gp: 8 },
                B: { gp: 50 }
            }
        },
        artisan: {
            name: "Artisan",
            abilityScores: ["STR", "DEX", "INT"],
            skills: ["Investigation", "Persuasion"],
            tool: "Artisan's Tools",
            feat: "Crafter",
            desc: { nl: "Je bent opgeleid als ambachtsman. Je maakt dingen met je handen en hebt een scherp oog voor kwaliteit.", en: "You trained as a craftsperson. You make things with your hands and have a keen eye for quality." },
            equipment: {
                A: { items: ["Artisan's Tools (one of your choice)", "Pouch (x2)", "Traveler's Clothes"], gp: 32 },
                B: { gp: 50 }
            }
        },
        charlatan: {
            name: "Charlatan",
            abilityScores: ["DEX", "CON", "CHA"],
            skills: ["Deception", "Sleight of Hand"],
            tool: "Forgery Kit",
            feat: "Skilled",
            desc: { nl: "Je hebt altijd een talent gehad voor het misleiden van anderen. Valse identiteiten, oplichterij en bedrog zijn je specialiteit.", en: "You have always had a talent for deceiving others. False identities, scams and trickery are your specialty." },
            equipment: {
                A: { items: ["Costume", "Forgery Kit", "Bottle of ink", "Quill", "Sealing wax", "Parchment (12 sheets)", "Pouch"], gp: 15 },
                B: { gp: 50 }
            }
        },
        criminal: {
            name: "Criminal",
            abilityScores: ["DEX", "CON", "INT"],
            skills: ["Sleight of Hand", "Stealth"],
            tool: "Thieves' Tools",
            feat: "Alert",
            desc: { nl: "Je hebt een verleden in de misdaad. Of het nu diefstal, smokkel of erger was — je kent de schaduwzijde van de maatschappij.", en: "You have a past in crime. Whether theft, smuggling or worse — you know the shadowy side of society." },
            equipment: {
                A: { items: ["Dagger (x2)", "Thieves' Tools", "Crowbar", "Pouch (x2)", "Traveler's Clothes"], gp: 16 },
                B: { gp: 50 }
            }
        },
        entertainer: {
            name: "Entertainer",
            abilityScores: ["STR", "DEX", "CHA"],
            skills: ["Acrobatics", "Performance"],
            tool: "Musical Instrument",
            feat: "Musician",
            desc: { nl: "Je leeft voor het publiek. Als muzikant, danser, acteur of verteller weet je hoe je een menigte moet boeien.", en: "You live for the audience. As a musician, dancer, actor or storyteller, you know how to captivate a crowd." },
            equipment: {
                A: { items: ["Musical Instrument (one of your choice)", "Perfume", "Costume", "Traveler's Clothes"], gp: 11 },
                B: { gp: 50 }
            }
        },
        farmer: {
            name: "Farmer",
            abilityScores: ["STR", "CON", "WIS"],
            skills: ["Animal Handling", "Nature"],
            tool: "Carpenter's Tools",
            feat: "Tough",
            desc: { nl: "Je bent opgegroeid op het land. Hard werken, de seizoenen en de natuur hebben je gevormd tot wie je bent.", en: "You grew up on the land. Hard work, the seasons and nature shaped you into who you are." },
            equipment: {
                A: { items: ["Carpenter's Tools", "Shovel", "Iron Pot", "Traveler's Clothes", "Pouch"], gp: 30 },
                B: { gp: 50 }
            }
        },
        guard: {
            name: "Guard",
            abilityScores: ["STR", "INT", "WIS"],
            skills: ["Athletics", "Perception"],
            tool: "Gaming Set",
            feat: "Alert",
            desc: { nl: "Je hebt gediend als wachter, stadswacht of lijfwacht. Je bent getraind om gevaar te herkennen en te reageren.", en: "You have served as a watchman, city guard or bodyguard. You are trained to spot danger and respond." },
            equipment: {
                A: { items: ["Spear", "Light Crossbow", "Bolts (20)", "Quiver", "Gaming Set (one of your choice)", "Hooded Lantern", "Manacles", "Traveler's Clothes", "Pouch"], gp: 12 },
                B: { gp: 50 }
            }
        },
        guide: {
            name: "Guide",
            abilityScores: ["DEX", "WIS", "CON"],
            skills: ["Stealth", "Survival"],
            tool: "Cartographer's Tools",
            feat: "Magic Initiate (Druid)",
            desc: { nl: "You've guided travelers through the wilderness all your life. You know nature's paths and perils.", en: "You have spent your life guiding travelers through the wilderness. You know the paths and perils of nature." },
            equipment: {
                A: { items: ["Shortbow", "Arrows (20)", "Quiver", "Cartographer's Tools", "Musical Instrument (one of your choice)", "Bedroll", "Traveler's Clothes", "Pouch"], gp: 3 },
                B: { gp: 50 }
            }
        },
        hermit: {
            name: "Hermit",
            abilityScores: ["CON", "WIS", "CHA"],
            skills: ["Medicine", "Religion"],
            tool: "Herbalism Kit",
            feat: "Healer",
            desc: { nl: "Je hebt jarenlang in afzondering geleefd — mediterend, studerend of genezend. Je draagt wijsheid mee uit de stilte.", en: "You lived in seclusion for years — meditating, studying or healing. You carry wisdom drawn from the silence." },
            equipment: {
                A: { items: ["Quarterstaff", "Herbalism Kit", "Bedroll", "Book (philosophy)", "Lamp", "Oil flask (x3)", "Traveler's Clothes", "Pouch"], gp: 16 },
                B: { gp: 50 }
            }
        },
        merchant: {
            name: "Merchant",
            abilityScores: ["CON", "INT", "CHA"],
            skills: ["Animal Handling", "Persuasion"],
            tool: "Navigator's Tools",
            feat: "Lucky",
            desc: { nl: "Je bent een handelaar, koopman of marktverkoper. Je kent de waarde van goederen en de kunst van het onderhandelen.", en: "You are a trader, merchant or market vendor. You know the value of goods and the art of negotiation." },
            equipment: {
                A: { items: ["Navigator's Tools", "Pouch (x2)", "Mule with Saddlebags", "Traveler's Clothes"], gp: 22 },
                B: { gp: 50 }
            }
        },
        noble: {
            name: "Noble",
            abilityScores: ["STR", "INT", "CHA"],
            skills: ["History", "Persuasion"],
            tool: "Gaming Set",
            feat: "Skilled",
            desc: { nl: "Je bent geboren in een adellijke familie met invloed en rijkdom. Je kent de etiquette van het hof en de last van verwachtingen.", en: "You were born into a noble family of influence and wealth. You know the etiquette of the court and the weight of expectations." },
            equipment: {
                A: { items: ["Gaming Set (one of your choice)", "Fine Clothes", "Signet Ring", "Scroll of Pedigree", "Pouch"], gp: 29 },
                B: { gp: 50 }
            }
        },
        sage: {
            name: "Sage",
            abilityScores: ["INT", "WIS", "CON"],
            skills: ["Arcana", "History"],
            tool: "Calligrapher's Supplies",
            feat: "Magic Initiate (Wizard)",
            desc: { nl: "For years you've gathered knowledge from books and libraries. You're an expert in your field.", en: "For years you have gathered knowledge from books and libraries. You are an expert in your field." },
            equipment: {
                A: { items: ["Quarterstaff", "Calligrapher's Supplies", "Book (history)", "Parchment (8 sheets)", "Bottle of ink", "Quill", "Robe"], gp: 8 },
                B: { gp: 50 }
            }
        },
        sailor: {
            name: "Sailor",
            abilityScores: ["STR", "DEX", "WIS"],
            skills: ["Acrobatics", "Perception"],
            tool: "Navigator's Tools",
            feat: "Tavern Brawler",
            desc: { nl: "Je hebt gevaren op de open zee. Stormen, piraten en verre havens — je hebt het allemaal meegemaakt.", en: "You have sailed the open sea. Storms, pirates and distant harbors — you have seen it all." },
            equipment: {
                A: { items: ["Dagger", "Navigator's Tools", "Rope (50 ft)", "Traveler's Clothes", "Pouch"], gp: 20 },
                B: { gp: 50 }
            }
        },
        scribe: {
            name: "Scribe",
            abilityScores: ["DEX", "INT", "WIS"],
            skills: ["Investigation", "Perception"],
            tool: "Calligrapher's Supplies",
            feat: "Skilled",
            desc: { nl: "Je hebt gewerkt als schrijver, kopiist of archivaris. Details ontgaan je zelden en je pen is je beste vriend.", en: "You worked as a writer, copyist or archivist. Details rarely escape you and your pen is your best friend." },
            equipment: {
                A: { items: ["Calligrapher's Supplies", "Fine Clothes", "Lamp", "Oil flask (x3)", "Parchment (12 sheets)", "Bottle of ink", "Quill", "Pouch"], gp: 23 },
                B: { gp: 50 }
            }
        },
        soldier: {
            name: "Soldier",
            abilityScores: ["STR", "DEX", "CON"],
            skills: ["Athletics", "Intimidation"],
            tool: "Gaming Set",
            feat: "Savage Attacker",
            desc: { nl: "Je hebt gediend in een leger of militie. Je kent de discipline van het slagveld en de kameraadschap van soldaten.", en: "You have served in an army or militia. You know the discipline of the battlefield and the camaraderie of soldiers." },
            equipment: {
                A: { items: ["Spear", "Shortbow", "Arrows (20)", "Quiver", "Gaming Set (one of your choice)", "Healer's Kit", "Traveler's Clothes", "Pouch"], gp: 14 },
                B: { gp: 50 }
            }
        },
        wayfarer: {
            name: "Wayfarer",
            abilityScores: ["DEX", "WIS", "CHA"],
            skills: ["Insight", "Stealth"],
            tool: "Thieves' Tools",
            feat: "Lucky",
            desc: { nl: "Je bent een zwerver, een reiziger zonder vaste bestemming. De weg is je thuis en je overleefd door je instincten.", en: "You are a wanderer, a traveler without a fixed destination. The road is your home and you survive on your instincts." },
            equipment: {
                A: { items: ["Dagger (x2)", "Thieves' Tools", "Gaming Set (one of your choice)", "Pouch (x2)", "Traveler's Clothes"], gp: 16 },
                B: { gp: 50 }
            }
        }
    },

    // ===== ITEMS DATABASE =====
    items: {
        // Weapon Mastery properties (5.5e): Cleave, Graze, Nick, Push, Sap, Slow, Topple, Vex
        // Only activated by classes with Weapon Mastery feature (Fighter, Barbarian, Paladin, Ranger, Rogue)
        weaponMasteryDesc: {
            cleave: "On a hit, make a second attack against a different creature within 5ft (no ability mod on the damage).",
            graze: "On a miss, deal damage equal to your ability modifier.",
            nick: "The extra dual-wielding attack becomes part of the Attack action (freeing up your Bonus Action).",
            push: "On a hit, push the target 10ft away (Medium or smaller, no save).",
            sap: "On a hit, the target has disadvantage on its next attack before your next turn.",
            slow: "On a hit, reduce the target's speed by 10ft until the start of your next turn.",
            topple: "On a hit, the target makes a CON save (DC 8 + ability mod + prof) or falls Prone.",
            vex: "On a hit, your next attack has advantage before the end of your next turn."
        },
        weapons: [
            { name: "Dagger", weight: 1, mastery: "nick" },
            { name: "Shortsword", weight: 2, mastery: "vex" },
            { name: "Shortbow", weight: 2, mastery: "vex" },   // 2024 PHB: Vex (itemDB had it right)
            { name: "Arrows (20)", weight: 1 },
            { name: "Light crossbow", weight: 5, mastery: "slow" },
            { name: "Bolts (20)", weight: 1.5 },
            { name: "Quarterstaff", weight: 4, mastery: "topple" },
            { name: "Dart", weight: 0.25, mastery: "vex" },
            { name: "Sling", weight: 0, mastery: "slow" },
            { name: "Rapier", weight: 2, mastery: "vex" },
            { name: "Longsword", weight: 3, mastery: "sap" },
            { name: "Handaxe", weight: 2, mastery: "vex" },
            { name: "Greatsword", weight: 6, mastery: "graze" },
            { name: "Greataxe", weight: 7, mastery: "cleave" },
            { name: "Warhammer", weight: 2, mastery: "push" },
            { name: "Battleaxe", weight: 4, mastery: "topple" },
            { name: "Longbow", weight: 2, mastery: "slow" },
            { name: "Maul", weight: 10, mastery: "topple" },
            { name: "Morningstar", weight: 4, mastery: "sap" },
            { name: "Scimitar", weight: 3, mastery: "nick" },
            { name: "Javelin", weight: 2, mastery: "slow" },
            { name: "Spear", weight: 3, mastery: "sap" },
            { name: "Mace", weight: 4, mastery: "sap" },
            { name: "Glaive", weight: 6, mastery: "graze" },
            { name: "Halberd", weight: 6, mastery: "cleave" },
            { name: "Trident", weight: 4, mastery: "topple" },
            { name: "War pick", weight: 2, mastery: "sap" },
            { name: "Whip", weight: 3, mastery: "slow" },
            { name: "Club", weight: 2, mastery: "slow" },
            { name: "Sickle", weight: 2, mastery: "nick" }
        ],
        armor: [
            { name: "Leather armor", weight: 10 },
            { name: "Studded leather", weight: 13 },
            { name: "Shield", weight: 6 },
            { name: "Padded armor", weight: 8 },
            { name: "Hide armor", weight: 12 },
            { name: "Chain shirt", weight: 20 },
            { name: "Scale mail", weight: 45 },
            { name: "Breastplate", weight: 20 },
            { name: "Half plate", weight: 40 },
            { name: "Ring mail", weight: 40 },
            { name: "Chain mail", weight: 55 },
            { name: "Splint armor", weight: 60 },
            { name: "Plate armor", weight: 65 }
        ],
        adventuring: [
            { name: "Backpack", weight: 5 },
            { name: "Bedroll", weight: 7 },
            { name: "Rations (1 dag)", weight: 2 },
            { name: "Waterskin", weight: 5 },
            { name: "Rope (50ft)", weight: 10 },
            { name: "Torch", weight: 1 },
            { name: "Tinderbox", weight: 1 },
            { name: "Grappling hook", weight: 4 },
            { name: "Piton (10)", weight: 2.5 },
            { name: "Lamp", weight: 1 },
            { name: "Oil (flask)", weight: 1 },
            { name: "Candle", weight: 0 },
            { name: "Crowbar", weight: 5 },
            { name: "Hammer", weight: 3 },
            { name: "Caltrops (20)", weight: 2 },
            { name: "Ball bearings (1000)", weight: 2 },
            { name: "Chain (10ft)", weight: 10 },
            { name: "Chalk (1 stuk)", weight: 0 },
            { name: "Climber's kit", weight: 12 },
            { name: "Healer's kit", weight: 3 },
            { name: "Hooded lantern", weight: 2 },
            { name: "Manacles", weight: 6 },
            { name: "Mirror (steel)", weight: 0.5 },
            { name: "Mess kit", weight: 1 },
            { name: "Potion of Healing", weight: 0.5 },
            { name: "Antitoxin (vial)", weight: 0 },
            { name: "Holy water (flask)", weight: 1 }
        ],
        tools: [
            { name: "Thieves' tools", weight: 1 },
            { name: "Disguise kit", weight: 3 },
            { name: "Forgery kit", weight: 5 },
            { name: "Poisoner's kit", weight: 2 },
            { name: "Herbalism kit", weight: 3 },
            { name: "Navigator's tools", weight: 2 },
            { name: "Gaming set", weight: 0 },
            { name: "Cartographer's tools", weight: 6 },
            { name: "Calligrapher's supplies", weight: 5 },
            { name: "Druidic focus (totem)", weight: 0 },
            { name: "Druidic focus (staff)", weight: 4 },
            { name: "Holy symbol (amulet)", weight: 1 },
            { name: "Holy symbol (emblem)", weight: 0 },
            { name: "Holy symbol (reliquary)", weight: 2 }
        ],
        containers: [
            { name: "Pouch", weight: 1 },
            { name: "Sack", weight: 0.5 },
            { name: "Chest", weight: 25 },
            { name: "Barrel", weight: 70 },
            { name: "Basket", weight: 2 },
            { name: "Case (map/scroll)", weight: 1 },
            { name: "Quiver", weight: 1 }
        ],
        spellcasting: [
            { name: "Component pouch", weight: 2 },
            { name: "Arcane focus (crystal)", weight: 1 },
            { name: "Arcane focus (orb)", weight: 3 },
            { name: "Arcane focus (rod)", weight: 2 },
            { name: "Arcane focus (staff)", weight: 4 },
            { name: "Arcane focus (wand)", weight: 1 },
            { name: "Spellbook", weight: 3 }
        ],
        personal: [
            { name: "Schetsboek", weight: 1 },
            { name: "Inkt & pen set", weight: 0.5 },
            { name: "Koperen ring (aan koord)", weight: 0 },
            { name: "Houten drakenbeeldje", weight: 0.25 },
            { name: "Vaders leren jas", weight: 4 },
            { name: "Burglar's pack", weight: 0 },
            { name: "Set versleten kleding", weight: 3 },
            { name: "Nette outfit", weight: 4 }
        ],
        custom: []
    }
};

// ===== ITEM DATABASE (flat, rich) =====
// Single source of truth for the Inventory widget. Extends the thin
// DATA.items.* arrays above (only {name, weight, mastery?}, no longer used
// elsewhere) with type/cost/damage/properties/armor.
// Per-character inventory lives in state.items {name, qty, equipped, notes,
// ref?}; this table is the read-only DEFINITION the widget joins by name.
// Fields listed in _verify are not 100% certain against the 2024 PHB
// (from memory) — see the review list. Damage type lives in damageType
// (not 'type', which is the top-level category).
DATA.itemDB = [
  // ---- Simple melee weapons ----
  { id:"club", name:"Club", type:"weapon", subtype:"simple-melee", weight:2, cost:1, costUnit:"sp", dmg:"1d4", damageType:"bludgeoning", mastery:"slow", properties:["light"] },
  { id:"dagger", name:"Dagger", type:"weapon", subtype:"simple-melee", weight:1, cost:2, costUnit:"gp", dmg:"1d4", damageType:"piercing", mastery:"nick", properties:["finesse","light","thrown"], range:{normal:20,long:60} },
  { id:"greatclub", name:"Greatclub", type:"weapon", subtype:"simple-melee", weight:10, cost:2, costUnit:"sp", dmg:"1d8", damageType:"bludgeoning", mastery:"push", properties:["two-handed"] },
  { id:"handaxe", name:"Handaxe", type:"weapon", subtype:"simple-melee", weight:2, cost:5, costUnit:"gp", dmg:"1d6", damageType:"slashing", mastery:"vex", properties:["light","thrown"], range:{normal:20,long:60} },
  { id:"javelin", name:"Javelin", type:"weapon", subtype:"simple-melee", weight:2, cost:5, costUnit:"sp", dmg:"1d6", damageType:"piercing", mastery:"slow", properties:["thrown"], range:{normal:30,long:120} },
  { id:"light-hammer", name:"Light Hammer", type:"weapon", subtype:"simple-melee", weight:2, cost:2, costUnit:"gp", dmg:"1d4", damageType:"bludgeoning", mastery:"nick", properties:["light","thrown"], range:{normal:20,long:60} },
  { id:"mace", name:"Mace", type:"weapon", subtype:"simple-melee", weight:4, cost:5, costUnit:"gp", dmg:"1d6", damageType:"bludgeoning", mastery:"sap", properties:[] },
  { id:"quarterstaff", name:"Quarterstaff", type:"weapon", subtype:"simple-melee", weight:4, cost:2, costUnit:"sp", dmg:"1d6", damageType:"bludgeoning", mastery:"topple", properties:["versatile"], versatile:"1d8" },
  { id:"sickle", name:"Sickle", type:"weapon", subtype:"simple-melee", weight:2, cost:1, costUnit:"gp", dmg:"1d4", damageType:"slashing", mastery:"nick", properties:["light"] },
  { id:"spear", name:"Spear", type:"weapon", subtype:"simple-melee", weight:3, cost:1, costUnit:"gp", dmg:"1d6", damageType:"piercing", mastery:"sap", properties:["thrown","versatile"], versatile:"1d8", range:{normal:20,long:60} },
  { id:"dart", name:"Dart", type:"weapon", subtype:"simple-ranged", weight:0.25, cost:5, costUnit:"cp", dmg:"1d4", damageType:"piercing", mastery:"vex", properties:["finesse","thrown"], range:{normal:20,long:60} },
  { id:"light-crossbow", name:"Light Crossbow", type:"weapon", subtype:"simple-ranged", weight:5, cost:25, costUnit:"gp", dmg:"1d8", damageType:"piercing", mastery:"slow", properties:["ammunition","loading","two-handed"], range:{normal:80,long:320} },
  { id:"shortbow", name:"Shortbow", type:"weapon", subtype:"simple-ranged", weight:2, cost:25, costUnit:"gp", dmg:"1d6", damageType:"piercing", mastery:"vex", properties:["ammunition","two-handed"], range:{normal:80,long:320}, _verify:{mastery:true} },
  { id:"sling", name:"Sling", type:"weapon", subtype:"simple-ranged", weight:0, cost:1, costUnit:"sp", dmg:"1d4", damageType:"bludgeoning", mastery:"slow", properties:["ammunition"], range:{normal:30,long:120} },
  // ---- Martial melee weapons ----
  { id:"battleaxe", name:"Battleaxe", type:"weapon", subtype:"martial-melee", weight:4, cost:10, costUnit:"gp", dmg:"1d8", damageType:"slashing", mastery:"topple", properties:["versatile"], versatile:"1d10" },
  { id:"glaive", name:"Glaive", type:"weapon", subtype:"martial-melee", weight:6, cost:20, costUnit:"gp", dmg:"1d10", damageType:"slashing", mastery:"graze", properties:["heavy","reach","two-handed"] },
  { id:"greataxe", name:"Greataxe", type:"weapon", subtype:"martial-melee", weight:7, cost:30, costUnit:"gp", dmg:"1d12", damageType:"slashing", mastery:"cleave", properties:["heavy","two-handed"] },
  { id:"greatsword", name:"Greatsword", type:"weapon", subtype:"martial-melee", weight:6, cost:50, costUnit:"gp", dmg:"2d6", damageType:"slashing", mastery:"graze", properties:["heavy","two-handed"] },
  { id:"halberd", name:"Halberd", type:"weapon", subtype:"martial-melee", weight:6, cost:20, costUnit:"gp", dmg:"1d10", damageType:"slashing", mastery:"cleave", properties:["heavy","reach","two-handed"] },
  { id:"longsword", name:"Longsword", type:"weapon", subtype:"martial-melee", weight:3, cost:15, costUnit:"gp", dmg:"1d8", damageType:"slashing", mastery:"sap", properties:["versatile"], versatile:"1d10" },
  { id:"maul", name:"Maul", type:"weapon", subtype:"martial-melee", weight:10, cost:10, costUnit:"gp", dmg:"2d6", damageType:"bludgeoning", mastery:"topple", properties:["heavy","two-handed"] },
  { id:"morningstar", name:"Morningstar", type:"weapon", subtype:"martial-melee", weight:4, cost:15, costUnit:"gp", dmg:"1d8", damageType:"piercing", mastery:"sap", properties:[] },
  { id:"rapier", name:"Rapier", type:"weapon", subtype:"martial-melee", weight:2, cost:25, costUnit:"gp", dmg:"1d8", damageType:"piercing", mastery:"vex", properties:["finesse"] },
  { id:"scimitar", name:"Scimitar", type:"weapon", subtype:"martial-melee", weight:3, cost:25, costUnit:"gp", dmg:"1d6", damageType:"slashing", mastery:"nick", properties:["finesse","light"] },
  { id:"shortsword", name:"Shortsword", type:"weapon", subtype:"martial-melee", weight:2, cost:10, costUnit:"gp", dmg:"1d6", damageType:"piercing", mastery:"vex", properties:["finesse","light"] },
  { id:"trident", name:"Trident", type:"weapon", subtype:"martial-melee", weight:4, cost:5, costUnit:"gp", dmg:"1d8", damageType:"piercing", mastery:"topple", properties:["thrown","versatile"], versatile:"1d10", range:{normal:20,long:60} },
  { id:"warhammer", name:"Warhammer", type:"weapon", subtype:"martial-melee", weight:2, cost:15, costUnit:"gp", dmg:"1d8", damageType:"bludgeoning", mastery:"push", properties:["versatile"], versatile:"1d10" },
  { id:"war-pick", name:"War Pick", type:"weapon", subtype:"martial-melee", weight:2, cost:5, costUnit:"gp", dmg:"1d8", damageType:"piercing", mastery:"sap", properties:["versatile"], versatile:"1d10", _verify:{properties:true} },
  { id:"whip", name:"Whip", type:"weapon", subtype:"martial-melee", weight:3, cost:2, costUnit:"gp", dmg:"1d4", damageType:"slashing", mastery:"slow", properties:["finesse","reach"] },
  { id:"longbow", name:"Longbow", type:"weapon", subtype:"martial-ranged", weight:2, cost:50, costUnit:"gp", dmg:"1d8", damageType:"piercing", mastery:"slow", properties:["ammunition","heavy","two-handed"], range:{normal:150,long:600} },
  { id:"heavy-crossbow", name:"Heavy Crossbow", type:"weapon", subtype:"martial-ranged", weight:18, cost:50, costUnit:"gp", dmg:"1d10", damageType:"piercing", mastery:"push", properties:["ammunition","heavy","loading","two-handed"], range:{normal:100,long:400} },
  { id:"hand-crossbow", name:"Hand Crossbow", type:"weapon", subtype:"martial-ranged", weight:3, cost:75, costUnit:"gp", dmg:"1d6", damageType:"piercing", mastery:"vex", properties:["ammunition","light","loading"], range:{normal:30,long:120} },
  // ---- Ammunition ----
  { id:"arrows-20", name:"Arrows (20)", type:"ammunition", weight:1, cost:1, costUnit:"gp", ammoFor:["bow"], bundleSize:20 },
  { id:"bolts-20", name:"Bolts (20)", type:"ammunition", weight:1.5, cost:1, costUnit:"gp", ammoFor:["crossbow"], bundleSize:20 },
  { id:"sling-bullets-20", name:"Sling Bullets (20)", type:"ammunition", weight:1.5, cost:4, costUnit:"cp", ammoFor:["sling"], bundleSize:20 },
  // ---- Armor ----
  { id:"padded-armor", name:"Padded Armor", type:"armor", subtype:"light", armorCategory:"light", baseAC:11, dexCap:null, strengthReq:null, stealthDisadvantage:true, weight:8, cost:5, costUnit:"gp" },
  { id:"leather-armor", name:"Leather Armor", type:"armor", subtype:"light", armorCategory:"light", baseAC:11, dexCap:null, strengthReq:null, stealthDisadvantage:false, weight:10, cost:10, costUnit:"gp" },
  { id:"studded-leather", name:"Studded Leather Armor", type:"armor", subtype:"light", armorCategory:"light", baseAC:12, dexCap:null, strengthReq:null, stealthDisadvantage:false, weight:13, cost:45, costUnit:"gp" },
  { id:"hide-armor", name:"Hide Armor", type:"armor", subtype:"medium", armorCategory:"medium", baseAC:12, dexCap:2, strengthReq:null, stealthDisadvantage:false, weight:12, cost:10, costUnit:"gp" },
  { id:"chain-shirt", name:"Chain Shirt", type:"armor", subtype:"medium", armorCategory:"medium", baseAC:13, dexCap:2, strengthReq:null, stealthDisadvantage:false, weight:20, cost:50, costUnit:"gp" },
  { id:"scale-mail", name:"Scale Mail", type:"armor", subtype:"medium", armorCategory:"medium", baseAC:14, dexCap:2, strengthReq:null, stealthDisadvantage:true, weight:45, cost:50, costUnit:"gp" },
  { id:"breastplate", name:"Breastplate", type:"armor", subtype:"medium", armorCategory:"medium", baseAC:14, dexCap:2, strengthReq:null, stealthDisadvantage:false, weight:20, cost:400, costUnit:"gp" },
  { id:"half-plate", name:"Half Plate Armor", type:"armor", subtype:"medium", armorCategory:"medium", baseAC:15, dexCap:2, strengthReq:null, stealthDisadvantage:true, weight:40, cost:750, costUnit:"gp" },
  { id:"ring-mail", name:"Ring Mail", type:"armor", subtype:"heavy", armorCategory:"heavy", baseAC:14, dexCap:0, strengthReq:null, stealthDisadvantage:true, weight:40, cost:30, costUnit:"gp" },
  { id:"chain-mail", name:"Chain Mail", type:"armor", subtype:"heavy", armorCategory:"heavy", baseAC:16, dexCap:0, strengthReq:13, stealthDisadvantage:true, weight:55, cost:75, costUnit:"gp" },
  { id:"splint-armor", name:"Splint Armor", type:"armor", subtype:"heavy", armorCategory:"heavy", baseAC:17, dexCap:0, strengthReq:15, stealthDisadvantage:true, weight:60, cost:200, costUnit:"gp" },
  { id:"plate-armor", name:"Plate Armor", type:"armor", subtype:"heavy", armorCategory:"heavy", baseAC:18, dexCap:0, strengthReq:15, stealthDisadvantage:true, weight:65, cost:1500, costUnit:"gp" },
  { id:"shield", name:"Shield", type:"shield", acBonus:2, weight:6, cost:10, costUnit:"gp" },
  // ---- Tools ----
  { id:"thieves-tools", name:"Thieves' Tools", type:"tool", subtype:"kit", ability:"dex", weight:1, cost:25, costUnit:"gp" },
  { id:"disguise-kit", name:"Disguise Kit", type:"tool", subtype:"kit", ability:"cha", weight:3, cost:25, costUnit:"gp" },
  { id:"forgery-kit", name:"Forgery Kit", type:"tool", subtype:"kit", ability:"dex", weight:5, cost:15, costUnit:"gp" },
  { id:"herbalism-kit", name:"Herbalism Kit", type:"tool", subtype:"kit", ability:"int", weight:3, cost:5, costUnit:"gp" },
  { id:"navigators-tools", name:"Navigator's Tools", type:"tool", subtype:"kit", ability:"wis", weight:2, cost:25, costUnit:"gp" },
  { id:"cartographers-tools", name:"Cartographer's Tools", type:"tool", subtype:"artisan", ability:"int", weight:6, cost:15, costUnit:"gp" },
  { id:"calligraphers-supplies", name:"Calligrapher's Supplies", type:"tool", subtype:"artisan", ability:"dex", weight:5, cost:10, costUnit:"gp" },
  { id:"artisans-tools", name:"Artisan's Tools", type:"tool", subtype:"artisan", ability:"varies", weight:5, cost:null, costUnit:"gp", description:"Specifiek artisan-gereedschap, gekozen bij creatie (Smith's, Carpenter's, ...).", _verify:{weight:true,cost:true} },
  { id:"gaming-set", name:"Gaming Set", type:"tool", subtype:"gaming", ability:"varies", weight:0, cost:1, costUnit:"sp", description:"Dobbel- of kaartspel; specifiek spel gekozen bij creatie." },
  { id:"musical-instrument", name:"Musical Instrument", type:"tool", subtype:"instrument", ability:"cha", weight:2, cost:null, costUnit:"gp", description:"Specifiek instrument (luit, fluit, trommel, ...), gekozen bij creatie.", _verify:{weight:true,cost:true} },
  // ---- Spellcasting focus / gear ----
  { id:"holy-symbol", name:"Holy Symbol", type:"gear", subtype:"focus", weight:1, cost:5, costUnit:"gp", description:"Spellcasting focus voor clerics/paladins (amulet, emblem of reliquary).", _verify:{weight:true} },
  { id:"component-pouch", name:"Component Pouch", type:"gear", subtype:"focus", weight:2, cost:25, costUnit:"gp", description:"Holds material spell components; replaces loose components without a gold cost." },
  { id:"spellbook", name:"Spellbook", type:"gear", subtype:"focus", weight:3, cost:50, costUnit:"gp", description:"Wizard-spellbook met 100 pagina's." },
  // ---- Containers ----
  { id:"backpack", name:"Backpack", type:"container", weight:5, cost:2, costUnit:"gp", capacity:"30 lb / 1 cubic ft", _verify:{capacity:true} },
  { id:"pouch", name:"Pouch", type:"container", weight:1, cost:5, costUnit:"sp", capacity:"6 lb / 0.2 cubic ft", _verify:{capacity:true} },
  { id:"quiver", name:"Quiver", type:"container", weight:1, cost:1, costUnit:"gp", capacity:"20 arrows" },
  { id:"case-scroll", name:"Case (map/scroll)", type:"container", weight:1, cost:1, costUnit:"gp" },
  { id:"chest", name:"Chest", type:"container", weight:25, cost:5, costUnit:"gp", capacity:"12 cubic ft / 300 lb" },
  // ---- Adventuring gear ----
  { id:"bedroll", name:"Bedroll", type:"gear", weight:7, cost:1, costUnit:"gp" },
  { id:"rope-50", name:"Rope (50 ft)", type:"gear", weight:10, cost:1, costUnit:"gp", description:"Hennep, 50 voet.", _verify:{weight:true} },
  { id:"travelers-clothes", name:"Traveler's Clothes", type:"gear", subtype:"clothing", weight:4, cost:2, costUnit:"gp" },
  { id:"common-clothes", name:"Common Clothes", type:"gear", subtype:"clothing", weight:3, cost:5, costUnit:"sp" },
  { id:"fine-clothes", name:"Fine Clothes", type:"gear", subtype:"clothing", weight:6, cost:15, costUnit:"gp" },
  { id:"costume", name:"Costume", type:"gear", subtype:"clothing", weight:4, cost:5, costUnit:"gp" },
  { id:"torch", name:"Torch", type:"gear", weight:1, cost:1, costUnit:"cp" },
  { id:"tinderbox", name:"Tinderbox", type:"gear", weight:1, cost:5, costUnit:"sp" },
  { id:"rations-1", name:"Rations (1 day)", type:"gear", subtype:"food", weight:2, cost:5, costUnit:"sp", _verify:{weight:true,cost:true} },
  { id:"waterskin", name:"Waterskin", type:"gear", weight:5, cost:2, costUnit:"sp", description:"Gewicht bij vol." },
  { id:"crowbar", name:"Crowbar", type:"gear", weight:5, cost:2, costUnit:"gp" },
  { id:"hammer", name:"Hammer", type:"gear", weight:3, cost:1, costUnit:"gp" },
  { id:"piton", name:"Piton", type:"gear", weight:0.25, cost:5, costUnit:"cp" },
  { id:"candle", name:"Candle", type:"gear", weight:0, cost:1, costUnit:"cp" },
  { id:"oil-flask", name:"Oil (flask)", type:"gear", weight:1, cost:1, costUnit:"sp" },
  { id:"mess-kit", name:"Mess Kit", type:"gear", weight:1, cost:2, costUnit:"sp" },
  { id:"ball-bearings", name:"Ball Bearings (1000)", type:"gear", weight:2, cost:1, costUnit:"gp", _verify:{weight:true} },
  { id:"hooded-lantern", name:"Hooded Lantern", type:"gear", weight:2, cost:5, costUnit:"gp" },
  { id:"lamp", name:"Lamp", type:"gear", weight:1, cost:5, costUnit:"sp" },
  { id:"manacles", name:"Manacles", type:"gear", weight:6, cost:2, costUnit:"gp" },
  { id:"ink-bottle", name:"Ink (bottle)", type:"gear", weight:0, cost:10, costUnit:"gp" },
  { id:"ink-pen", name:"Ink Pen", type:"gear", weight:0, cost:2, costUnit:"cp" },
  { id:"parchment", name:"Parchment (sheet)", type:"gear", weight:0, cost:1, costUnit:"sp" },
  { id:"paper", name:"Paper (sheet)", type:"gear", weight:0, cost:2, costUnit:"sp" },
  { id:"book", name:"Book", type:"gear", weight:5, cost:25, costUnit:"gp" },
  { id:"perfume", name:"Perfume (vial)", type:"gear", weight:0, cost:5, costUnit:"gp" },
  { id:"sealing-wax", name:"Sealing Wax", type:"gear", weight:0, cost:5, costUnit:"sp" },
  { id:"soap", name:"Soap", type:"gear", weight:0, cost:5, costUnit:"cp" },
  { id:"blanket", name:"Blanket", type:"gear", weight:3, cost:5, costUnit:"sp" },
  { id:"healers-kit", name:"Healer's Kit", type:"gear", subtype:"kit", weight:3, cost:5, costUnit:"gp", charges:{max:10,recharge:"none"}, description:"10 uses; stabiliseer een creature zonder check." },
  { id:"potion-healing", name:"Potion of Healing", type:"consumable", subtype:"potion", weight:0.5, cost:50, costUnit:"gp", magical:true, rarity:"common", description:"Drink (Bonus Action) om 2d4+2 HP te herstellen." },
  { id:"antitoxin", name:"Antitoxin (vial)", type:"consumable", weight:0, cost:50, costUnit:"gp", description:"Advantage on saves against poison for 1 hour." },
  { id:"holy-water", name:"Holy Water (flask)", type:"consumable", weight:1, cost:25, costUnit:"gp", description:"Throw it: fiends/undead within 5ft make a DEX save or take 2d6 radiant." }
];

// Starter equipment packs (2024 PHB). They expand into separate itemDB items
// (counts × outer count). Cost and some counts are marked verify (see the
// review list). ref = itemDB name (matched normalised by the widget).
DATA.itemPacks = {
  "Burglar's Pack":     { cost:16, costUnit:"gp", contents:[["Backpack",1],["Ball Bearings (1000)",1],["Bell",1],["Candle",5],["Crowbar",1],["Hammer",1],["Piton",10],["Hooded Lantern",1],["Oil (flask)",2],["Rations (1 day)",5],["Tinderbox",1],["Waterskin",1],["Rope (50 ft)",1]], _verify:true },
  "Diplomat's Pack":    { cost:39, costUnit:"gp", contents:[["Chest",1],["Case (map/scroll)",2],["Fine Clothes",1],["Ink (bottle)",1],["Ink Pen",1],["Lamp",1],["Oil (flask)",2],["Paper (sheet)",5],["Perfume (vial)",1],["Sealing Wax",1],["Soap",1]], _verify:true },
  "Dungeoneer's Pack":  { cost:12, costUnit:"gp", contents:[["Backpack",1],["Crowbar",1],["Hammer",1],["Piton",10],["Torch",10],["Tinderbox",1],["Rations (1 day)",10],["Waterskin",1],["Rope (50 ft)",1]], _verify:true },
  "Entertainer's Pack": { cost:40, costUnit:"gp", contents:[["Backpack",1],["Bedroll",1],["Costume",2],["Candle",5],["Rations (1 day)",5],["Waterskin",1],["Disguise Kit",1]], _verify:true },
  "Explorer's Pack":    { cost:10, costUnit:"gp", contents:[["Backpack",1],["Bedroll",1],["Mess Kit",1],["Tinderbox",1],["Torch",10],["Rations (1 day)",10],["Waterskin",1],["Rope (50 ft)",1]], _verify:true },
  "Priest's Pack":      { cost:19, costUnit:"gp", contents:[["Backpack",1],["Blanket",1],["Candle",10],["Tinderbox",1],["Incense (block)",2],["Vestments",1],["Rations (1 day)",2],["Waterskin",1]], _verify:true },
  "Scholar's Pack":     { cost:40, costUnit:"gp", contents:[["Backpack",1],["Book",1],["Ink (bottle)",1],["Ink Pen",1],["Parchment (sheet)",10],["Small Knife",1]], _verify:true }
};

// ===== SPELL POOL =====
// All unique spells, keyed by name. Level = spell level (0=cantrip).
// For duplicates across classes, longest/most detailed description is used.
DATA.spellPool = {
    // ===== CANTRIPS (level 0) =====
    "Acid Splash": { level: 0, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Throw a bubble of acid at 1-2 creatures within 5ft of each other. DEX save or take 1d6 acid damage. Scales at levels 5/11/17." },
    "Blade Ward": { level: 0, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 1 min", desc: "Until the spell ends, whenever a creature makes an attack roll against you, it subtracts 1d4 from the roll." },
    "Chill Touch": { level: 0, time: "1 action", range: "Touch", comp: "V, S", dur: "Instant", desc: "Melee spell attack against a target within reach: 1d10 Necrotic damage, and it can't regain HP until the end of your next turn. Damage +1d10 at levels 5, 11 and 17." },
    "Dancing Lights": { level: 0, time: "1 action", range: "120ft", comp: "V, S, M (a bit of phosphorus or wychwood, or a glowworm)", dur: "Concentration, 1 min", desc: "Create up to 4 torch-like lights within 120ft. Move them as a Bonus Action. Concentration, 1 minute." },
    "Druidcraft": { level: 0, time: "1 action", range: "30ft", comp: "V, S", dur: "Instant", desc: "Pick one effect within 30 ft: a tiny effect that predicts the weather at your location for the next 24 hours, make a flower blossom or a seed pod or leaf bud open, a harmless sensory effect (falling leaves, a gentle breeze, an animal sound, a faint smell) in a 5-ft cube, or light or snuff out a candle, torch or small campfire." },
    "Eldritch Blast": { level: 0, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 1d10 force damage. At level 5: 2 beams, 11: 3, 17: 4. Each beam attacks separately." },
    "Elementalism": { level: 0, time: "1 action", range: "30ft", comp: "V, S", dur: "Instant", desc: "Manipulate a small elemental effect: a breeze, a candle-sized flame, a stream of water, or a handful of earth. Pure utility cantrip." },
    "Fire Bolt": { level: 0, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 1d10 fire damage, 120ft. Scales at levels 5/11/17." },
    "Friends": { level: 0, time: "1 action", range: "10ft", comp: "S, M (a bit of makeup)", dur: "Concentration, 1 min", desc: "Concentration, 1 minute. Advantage on CHA checks against one non-hostile creature. When the spell ends, the target knows you used magic." },
    "Guidance": { level: 0, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 min", desc: "The target can add 1d4 to one ability check. Concentration." },
    "Light": { level: 0, time: "1 action", range: "Touch", comp: "V, M (a firefly or piece of phosphorus)", dur: "1 hour", desc: "An object sheds bright light in a 20ft radius and dim light for another 20ft. Lasts 1 hour." },
    "Mage Hand": { level: 0, time: "1 action", range: "30ft", comp: "V, S", dur: "1 min", desc: "Create a spectral hand at 30ft that can manipulate objects, open doors, etc. Lasts 1 minute." },
    "Mending": { level: 0, time: "1 minute", range: "Touch", comp: "V, S, M (twee lodestones)", dur: "Instant", desc: "Repair a single break or tear in an object (a broken chain, a torn piece of cloth, etc.)." },
    "Message": { level: 0, time: "1 action", range: "120ft", comp: "V, S, M (a piece of copper wire)", dur: "1 round", desc: "Whisper a message to a creature within 120ft. Only the target hears it and can whisper a reply." },
    "Mind Sliver": { level: 0, time: "1 action", range: "60ft", comp: "V", dur: "1 round", desc: "INT save or 1d6 psychic damage and -1d4 on its next saving throw before the end of your next turn. 60ft. Scales at levels 5/11/17." },
    "Minor Illusion": { level: 0, time: "1 action", range: "30ft", comp: "S, M (a bit of fleece)", dur: "1 min", desc: "Create a sound or the image of an object within 30ft. Lasts 1 minute. Investigation check to recognise it as an illusion." },
    "Poison Spray": { level: 0, time: "1 action", range: "30ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack against a creature in range: 1d12 Poison damage. Damage +1d12 at levels 5, 11 and 17." },
    "Prestidigitation": { level: 0, time: "1 action", range: "10ft", comp: "V, S", dur: "Up to 1 hour", desc: "Minor magical trick: sparks, sounds, changing flavors, a small illusion, light, cleaning, etc. Lasts up to 1 hour." },
    "Produce Flame": { level: 0, time: "1 bonus action", range: "Self", comp: "V, S", dur: "10 min", desc: "A flame appears in your hand, shedding Bright Light 20 ft and Dim Light 20 ft more (no heat). Until the spell ends, take a Magic action to hurl it at a creature or object within 60 ft: ranged spell attack, 1d8 Fire damage (+1d8 at levels 5, 11 and 17). Casting it again ends the previous flame." },
    "Ray of Frost": { level: 0, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 1d8 cold damage, -10ft speed until the start of your next turn. 60ft range. Scales at levels 5/11/17." },
    "Resistance": { level: 0, time: "1 action", range: "Touch", comp: "V, S, M (miniature mantel)", dur: "Concentration, 1 min", desc: "The target can add 1d4 to one saving throw. Concentration." },
    "Sacred Flame": { level: 0, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "A creature you can see within 60 ft makes a Dexterity save or takes 1d8 Radiant damage; it gets no benefit from Half or Three-Quarters Cover against this save. Cantrip upgrade: 2d8 at level 5, 3d8 at 11, 4d8 at 17." },
    "Shillelagh": { level: 0, time: "1 bonus action", range: "Self", comp: "V, S, M (mistletoe)", dur: "1 min", desc: "A Club or Quarterstaff you hold: use your spellcasting ability instead of Strength for its melee attack and damage rolls; its damage die becomes a d8 (d10 at level 5, d12 at 11, 2d6 at 17) and it can deal Force damage. Ends if you cast it again or let go of the weapon." },
    "Shocking Grasp": { level: 0, time: "1 action", range: "Touch", comp: "V, S", dur: "Instant", desc: "Melee spell attack with advantage against metal armor. 1d8 lightning damage, and the target can't take reactions. Scales." },
    "Sorcerous Burst": { level: 0, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack: 1d8 damage of a random type (roll a d8 for the element). On doubles: add an extra 1d8 (can chain). Scales at levels 5/11/17." },
    "Spare the Dying": { level: 0, time: "1 action", range: "15ft", comp: "V, S", dur: "Instant", desc: "A creature within range that has 0 HP and isn't dead becomes Stable. The range doubles at levels 5 (30 ft), 11 (60 ft) and 17 (120 ft)." },
    "Thaumaturgy": { level: 0, time: "1 action", range: "30ft", comp: "V", dur: "Up to 1 minute", desc: "Create a minor wonder within 30 ft: your eyes change appearance, your voice booms three times as loud (Advantage on Charisma (Intimidation) checks), flames flicker or change colour, or the ground trembles harmlessly — each for 1 minute; or an unlocked door or window flies open or slams shut, or a sound rings out from a point you choose. Up to three 1-minute effects at a time." },
    "Thorn Whip": { level: 0, time: "1 action", range: "30ft", comp: "V, S, M (doornenstengel)", dur: "Instant", desc: "Melee spell attack, 1d6 piercing. Pull the target 10ft toward you if it's Large or smaller. Scales." },
    "Toll the Dead": { level: 0, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "WIS save or 1d8 necrotic damage (1d12 if the target is missing HP). Scales at levels 5/11/17." },
    "True Strike": { level: 0, time: "1 action", range: "Self", comp: "V, M (a weapon with the Finesse or Ranged property worth 1sp+)", dur: "Instant", desc: "2024: Make one attack with the weapon using your spellcasting ability instead of STR/DEX for attack and damage. On a hit: +1d6 extra radiant damage (2d6 at lvl 5, 3d6 at 11, 4d6 at 17). Works with melee or ranged weapon attacks." },
    "Vicious Mockery": { level: 0, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "WIS save or 1d4 psychic damage and disadvantage on its next attack roll. Scales at levels 5/11/17." },
    "Word of Radiance": { level: 0, time: "1 action", range: "Self (5ft)", comp: "V, M", dur: "Instant", desc: "Every creature within 5ft: CON save or 1d6 radiant damage. Scales." },

    // ===== 1ST LEVEL =====
    "Animal Friendship": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (voedsel)", dur: "24 hours", desc: "WIS save or a beast (INT 3 or lower) is Charmed. 24 hours. Upcast: +1 target." },
    "Arms of Hadar": { level: 1, time: "1 action", range: "Self (10ft)", comp: "V, S", dur: "Instant", desc: "STR save or 2d6 necrotic damage and no reactions. Half on a save. Upcast: +1d6." },
    "Armor of Agathys": { level: 1, time: "1 bonus action", range: "Self", comp: "V, S, M (a shard of blue glass)", dur: "1 hour", desc: "You gain 5 Temporary HP. While you have them, a creature that hits you with a melee attack takes 5 Cold damage. The spell ends when the Temporary HP are gone. Higher slot: +5 Temporary HP and +5 Cold damage per slot level above 1." },
    "Bane": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (a drop of blood)", dur: "Concentration, 1 min", desc: "Up to 3 creatures: CHA save or -1d4 on attack rolls and saving throws." },
    "Bless": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (a Holy Symbol worth 5+ GP)", dur: "Concentration, 1 min", desc: "Up to 3 creatures: +1d4 on attack rolls and saving throws. Upcast: +1 target." },
    "Burning Hands": { level: 1, time: "1 action", range: "Self (15ft cone)", comp: "V, S", dur: "Instant", desc: "15ft cone of fire. DEX save, 3d6 fire damage (half on save). Upcast: +1d6 per higher slot level." },
    "Charm Person": { level: 1, time: "1 action", range: "30ft", comp: "V, S", dur: "1 hour", desc: "Charm a humanoid within 30ft. WIS save (advantage if you're fighting it). The target regards you as a friendly acquaintance. Lasts 1 hour." },
    "Chromatic Orb": { level: 1, time: "1 action", range: "90ft", comp: "V, S, M (a diamond worth at least 50gp)", dur: "Instant", desc: "Ranged spell attack, 3d8 damage of a chosen type (acid/cold/fire/lightning/poison/thunder). 90ft. Requires a 50gp diamond." },
    "Color Spray": { level: 1, time: "1 action", range: "Self (15ft cone)", comp: "V, S, M (a pinch of powder or sand colored red, yellow, or blue)", dur: "1 round", desc: "15ft cone. 6d10 HP worth of creatures are Blinded (lowest HP first). No save. Upcast: +2d10 per slot." },
    "Command": { level: 1, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Speak a one-word command to a creature you can see: it makes a Wisdom save or follows it on its next turn — Approach, Drop (what it holds), Flee, Grovel (falls Prone) or Halt (doesn't move or act). Higher slot: one extra creature per slot level above 1." },
    "Compelled Duel": { level: 1, time: "1 bonus action", range: "30ft", comp: "V", dur: "Concentration, 1 min", desc: "WIS save or the target has disadvantage on attacks against others and must stay near you." },
    "Comprehend Languages": { level: 1, time: "1 action", range: "Self", comp: "V, S, M (a pinch of soot and salt)", dur: "1 hour", desc: "Ritual. You understand any spoken language you hear and written text you touch. Lasts 1 hour." },
    "Cure Wounds": { level: 1, time: "1 action", range: "Touch", comp: "V, S", dur: "Instant", desc: "A creature you touch regains 2d8 + your spellcasting ability modifier Hit Points. Upcast: +2d8 per slot level above 1." },
    "Detect Evil and Good": { level: 1, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 10 min", desc: "Detect aberrations, celestials, elementals, fey, fiends, and undead within 30ft." },
    "Detect Magic": { level: 1, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 10 min", desc: "Ritual. Concentration, 10 min. Sense the presence of magic within 30ft and see the school of magic through thin barriers." },
    "Disguise Self": { level: 1, time: "1 action", range: "Self", comp: "V, S", dur: "1 hour", desc: "Change your appearance (clothing, armor, weapons, height ±1ft). Investigation check to see through the illusion. Lasts 1 hour." },
    "Divine Smite": { level: 1, time: "1 bonus action (right after you hit with a Melee weapon or Unarmed Strike)", range: "Self", comp: "V", dur: "Instant", desc: "The target takes an extra 2d8 Radiant damage (+1d8 against a Fiend or Undead). Higher slot: +1d8 per slot level above 1." },
    "Ensnaring Strike": { level: 1, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Your next hit: STR save or Restrained by vines. 1d6 piercing each turn. Upcast: +1d6." },
    "Entangle": { level: 1, time: "1 action", range: "90ft", comp: "V, S", dur: "Concentration, 1 min", desc: "20ft square. STR save or Restrained by grasping vines. The area becomes difficult terrain." },
    "Expeditious Retreat": { level: 1, time: "1 bonus action", range: "Self", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Dash as a Bonus Action each turn." },
    "Faerie Fire": { level: 1, time: "1 action", range: "60ft", comp: "V", dur: "Concentration, 1 min", desc: "20ft cube. DEX save of verlicht. Attacks hebben advantage. Onzichtbaarheid opgeheven." },
    "False Life": { level: 1, time: "1 action", range: "Self", comp: "V, S, M (a small amount of alcohol or distilled spirits)", dur: "1 hour", desc: "Give yourself 1d4+4 temporary HP. Lasts 1 hour. Upcast: +5 temp HP per higher slot." },
    "Feather Fall": { level: 1, time: "1 reaction", range: "60ft", comp: "V, M (a small feather or piece of down)", dur: "1 min", desc: "Reaction: up to 5 falling creatures within 60ft fall slowly (60ft/round) and take no fall damage." },
    "Find Familiar": { level: 1, time: "1 hour", range: "10ft", comp: "V, S, M (burning incense worth 10+ GP, which the spell consumes)", dur: "Instant", desc: "Summon a familiar (owl, cat, etc.). You can see through its senses and deliver spells through it." },
    "Fog Cloud": { level: 1, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 hour", desc: "20ft radius sphere of fog. Heavily obscured area. Concentration, 1 hour. Upcast: +20ft radius per slot." },
    "Goodberry": { level: 1, time: "1 action", range: "Touch", comp: "V, S, M (holly)", dur: "Instant", desc: "Create 10 berries. Each berry restores 1 HP and provides a day's worth of food. They vanish after 24 hours." },
    "Guiding Bolt": { level: 1, time: "1 action", range: "120ft", comp: "V, S", dur: "1 round", desc: "Ranged spell attack, 4d6 radiant. The next attack against the target has advantage. Upcast: +1d6." },
    "Hail of Thorns": { level: 1, time: "1 bonus action (right after you hit with a Ranged weapon)", range: "Self", comp: "V", dur: "Instant", desc: "The target and each creature within 5 ft of it make a Dexterity save: 1d10 Piercing damage, half on a success. Higher slot: +1d10 per slot level above 1." },
    "Healing Word": { level: 1, time: "1 bonus action", range: "60ft", comp: "V", dur: "Instant", desc: "Bonus Action. Restore 1d4 + spellcasting mod HP at 60ft range. Upcast: +1d4 per slot level." },
    "Hellish Rebuke": { level: 1, time: "1 reaction", range: "60ft", comp: "V, S", dur: "Instant", desc: "Reaction when you take damage. DEX save or 2d10 fire (half on save). Upcast: +1d10." },
    "Heroism": { level: 1, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 min", desc: "The target is immune to Frightened and gains temp HP equal to your spellcasting modifier each turn." },
    "Hex": { level: 1, time: "1 bonus action", range: "90ft", comp: "V, S, M (newt-oog)", dur: "Concentration, 1 hour", desc: "Bonus Action. +1d6 necrotic damage on each of your hits. Choose an ability: the target has Disadvantage on checks with it." },
    "Hunter's Mark": { level: 1, time: "1 bonus action", range: "90ft", comp: "V", dur: "Concentration, 1 hour", desc: "2024: Bonus Action. Mark 1 creature: +1d6 extra damage on your weapon hits. Move the mark to a new target (Bonus Action) when it drops to 0 HP. Concentration (Ranger level 13: no longer breaks concentration on damage)." },
    "Ice Knife": { level: 1, time: "1 action", range: "60ft", comp: "S, M (a drop of water or a piece of ice)", dur: "Instant", desc: "Ranged spell attack against a creature within 60 ft: 1d10 Piercing damage on a hit. Hit or miss, the shard then explodes — the target and each creature within 5 ft of it make a Dexterity save or take 2d6 Cold damage. Upcast: +1d6 Cold per slot level above 1." },
    "Identify": { level: 1, time: "1 minute", range: "Touch", comp: "V, S, M (a pearl worth 100gp)", dur: "Instant", desc: "Ritual. Learn the properties of a magic item, or the active spells on a creature." },
    "Inflict Wounds": { level: 1, time: "1 action", range: "Touch", comp: "V, S", dur: "Instant", desc: "A creature you touch makes a Constitution save, taking 2d10 Necrotic damage on a failure or half as much on a success. Upcast: +1d10 per slot level above 1." },
    "Jump": { level: 1, time: "1 bonus action", range: "Touch", comp: "V, S, M (a grasshopper's hind leg)", dur: "1 min", desc: "A willing creature you touch can, once on each of its turns, jump up to 30 ft by spending 10 ft of movement. Higher slot: one extra creature per slot level above 1." },
    "Mage Armor": { level: 1, time: "1 action", range: "Touch", comp: "V, S, M (a piece of cured leather)", dur: "8 hours", desc: "Touch. AC becomes 13 + DEX modifier for a creature not wearing armor. Lasts 8 hours." },
    "Magic Missile": { level: 1, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Three glowing darts hit automatically. Each deals 1d4+1 force damage. Upcast: +1 dart per higher slot." },
    "Protection from Evil and Good": { level: 1, time: "1 action", range: "Touch", comp: "V, S, M (a flask of Holy Water worth 25+ GP, which the spell consumes)", dur: "Concentration, 10 min", desc: "A willing creature you touch is protected against Aberrations, Celestials, Elementals, Fey, Fiends and Undead: they have Disadvantage on attack rolls against it, and it can't be possessed, Charmed or Frightened by them (if it already is, it has Advantage on new saves against that effect)." },
    "Ray of Sickness": { level: 1, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 2d8 poison damage. On a hit: CON save or also Poisoned until the end of its next turn. 60ft." },
    "Sanctuary": { level: 1, time: "1 bonus action", range: "30ft", comp: "V, S, M (a shard of glass from a mirror)", dur: "1 min", desc: "A WIS save is required to attack the target. Ends if the target attacks or deals damage." },
    "Shield": { level: 1, time: "1 reaction", range: "Self", comp: "V, S", dur: "1 round", desc: "Reaction: +5 AC until the start of your next turn, including against the triggering attack. Also blocks Magic Missile." },
    "Shield of Faith": { level: 1, time: "1 bonus action", range: "60ft", comp: "V, S, M (perkament)", dur: "Concentration, 10 min", desc: "The target gains +2 AC. Concentration, 10 minutes." },
    "Silent Image": { level: 1, time: "1 action", range: "60ft", comp: "V, S, M (a bit of fleece)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Create a visual illusion of up to a 15ft cube within 60ft. Move it with an action. Investigation check to discern." },
    "Sleep": { level: 1, time: "1 action", range: "60ft", comp: "V, S, M (a pinch of sand or rose petals)", dur: "Concentration, 1 min", desc: "Each creature of your choice in a 5-ft-radius sphere makes a Wisdom save or is Incapacitated until the end of its next turn, then saves again — a second failure makes it Unconscious for the duration. It wakes if it takes damage or someone within 5 ft uses an action to shake it. Creatures that don't sleep (such as elves) or are immune to Exhaustion automatically succeed." },
    "Speak with Animals": { level: 1, time: "1 action", range: "Self", comp: "V, S", dur: "10 min", desc: "Ritual. Communicate with beasts. They aren't necessarily friendly." },
    "Tasha's Hideous Laughter": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (tiny tarts and a feather)", dur: "Concentration, 1 min", desc: "WIS save or the target falls Prone and is Incapacitated with laughter. Repeat the save each turn and when it takes damage." },
    "Thunderous Smite": { level: 1, time: "1 bonus action (right after you hit with a Melee weapon or Unarmed Strike)", range: "Self", comp: "V", dur: "Instant", desc: "The target takes an extra 2d6 Thunder damage (audible within 300 ft); a creature also makes a Strength save or is pushed 10 ft away and knocked Prone. Higher slot: +1d6 per slot level above 1." },
    "Thunderwave": { level: 1, time: "1 action", range: "Self (15ft cube)", comp: "V, S", dur: "Instant", desc: "15ft cube from you. CON save or 2d8 thunder damage and pushed 10ft. Half damage and no push on a save. Audible up to 300ft away." },
    "Witch Bolt": { level: 1, time: "1 action", range: "60ft", comp: "V, S, M (a twig struck by lightning)", dur: "Concentration, 1 min", desc: "Ranged spell attack: 2d12 Lightning damage on a hit. On each later turn, take a Bonus Action to deal 1d12 Lightning damage to the target automatically (even if the first attack missed). Ends if the target leaves range or has Total Cover. Higher slot: initial damage +1d12 per slot level above 1." },
    "Wrathful Smite": { level: 1, time: "1 bonus action (right after you hit with a Melee weapon or Unarmed Strike)", range: "Self", comp: "V", dur: "1 min", desc: "The target takes an extra 1d6 Necrotic damage and makes a Wisdom save or is Frightened for the duration (it repeats the save at the end of each of its turns). Higher slot: +1d6 per slot level above 1." },

    // ===== 2ND LEVEL =====
    "Aid": { level: 2, time: "1 action", range: "30ft", comp: "V, S, M (wit linnen)", dur: "8 hours", desc: "Up to 3 creatures gain +5 max HP and current HP for 8 hours. Upcast: +5 HP per higher slot." },
    "Alter Self": { level: 2, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. Change your appearance, grow aquatic adaptations, or gain natural weapons (1d6+STR, magical)." },
    "Barkskin": { level: 2, time: "1 bonus action", range: "Touch", comp: "V, S, M (a handful of oak bark)", dur: "1 hour", desc: "A willing creature you touch has an AC of 17 if its AC is lower than that, for the duration." },
    "Blindness/Deafness": { level: 2, time: "1 action", range: "120ft", comp: "V", dur: "1 min", desc: "A creature you can see makes a Constitution save or is Blinded or Deafened (your choice) for the duration; it repeats the save at the end of each of its turns. Higher slot: one extra creature per slot level above 2." },
    "Blur": { level: 2, time: "1 action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Attackers have disadvantage on attack rolls against you. Doesn't work against creatures with truesight or blindsight." },
    "Shining Smite": { level: 2, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "2024 (was Branding Smite): your next hit deals +2d6 radiant damage; the target sheds bright light in a 5ft radius, can't be Invisible, and gains no benefit from being unseen." },
    "Calm Emotions": { level: 2, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "20ft radius. CHA save of charmed/frightened onderdrukt, of maak hostile creature indifferent." },
    "Cloud of Daggers": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a shard of glass)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 5ft cube of spinning daggers. 4d4 slashing damage to creatures that start their turn inside. 60ft. Upcast: +2d4." },
    "Crown of Madness": { level: 2, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save or the target must make melee attacks against a creature of your choice. Repeat the save each turn." },
    "Darkness": { level: 2, time: "1 action", range: "60ft", comp: "V, M (bat fur and a drop of pitch or piece of coal)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. A 15ft radius of magical darkness. Blocks darkvision and nonmagical light. Can be cast on an object." },
    "Darkvision": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (a dried carrot or a pinch of cat fur)", dur: "8 hours", desc: "Touch, 8 hours. The target gains darkvision out to 60ft." },
    "Detect Thoughts": { level: 2, time: "1 action", range: "Self", comp: "V, S, M (a copper piece)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Read surface thoughts. Take an action to probe deeper (WIS save). Detect thinking creatures through barriers." },
    "Enhance Ability": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (fur or a feather from a beast)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. Choose one of 6 buffs: advantage on checks of one ability score, plus extra effects. Upcast: +1 target." },
    "Enlarge/Reduce": { level: 2, time: "1 action", range: "30ft", comp: "V, S, M (a pinch of powdered iron)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. CON save. Enlarge: +1d4 weapon damage, advantage STR checks. Reduce: -1d4 damage, disadvantage STR." },
    "Find Steed": { level: 2, time: "1 action", range: "30ft", comp: "V, S", dur: "Instant", desc: "Summon a loyal otherworldly steed (Otherworldly Steed stat block) that looks like a Large rideable animal of your choice; choose Celestial, Fey or Fiend each time you cast it. It shares your Initiative, acts as a controlled mount while you ride it, and disappears at 0 HP or when you die. Higher slot: use the slot level in the stat block." },
    "Flame Blade": { level: 2, time: "1 bonus action", range: "Self", comp: "V, S, M (a sumac leaf)", dur: "Concentration, 10 min", desc: "Evoke a fiery, scimitar-sized blade in your free hand (if you let go, you can evoke it again as a Bonus Action). As a Magic action, make a melee spell attack with it: 3d6 + your spellcasting modifier Fire damage. It sheds Bright Light 10 ft and Dim Light 10 ft more." },
    "Flaming Sphere": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a ball of wax)", dur: "Concentration, 1 min", desc: "5ft diameter sphere of fire. 2d6 fire damage to creatures it comes near. Bonus Action to move it." },
    "Gust of Wind": { level: 2, time: "1 action", range: "Self (60ft line)", comp: "V, S, M (a seed from a pod)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 60ft line of strong wind. STR save or pushed 15ft. Moving against the wind costs double movement." },
    "Heat Metal": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a piece of iron and a flame)", dur: "Concentration, 1 min", desc: "A manufactured metal object you can see glows red-hot: any creature touching it takes 2d8 Fire damage, and you can deal this again as a Bonus Action on later turns. A creature holding or wearing it makes a Constitution save or drops it if it can; if it keeps it, it has Disadvantage on attack rolls and ability checks until the start of your next turn. Higher slot: +1d8 per slot level above 2." },
    "Hold Person": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a piece of iron)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save or a humanoid is Paralyzed. Repeat the save each turn. Upcast: +1 target per higher slot." },
    "Invisibility": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (an eyelash encased in gum arabic)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. A creature you touch turns invisible. Ends when it attacks or casts a spell. Upcast: +1 target." },
    "Knock": { level: 2, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Open a locked door, chest, or padlock (magical or not). Produces a loud knock audible up to 300ft away." },
    "Lesser Restoration": { level: 2, time: "1 bonus action", range: "Touch", comp: "V, S", dur: "Instant", desc: "End one condition on a creature you touch: Blinded, Deafened, Paralyzed or Poisoned." },
    "Levitate": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a small leather loop or a piece of golden thread)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. One creature or object (up to 500 lbs) rises 20ft. The target can move by pushing off nearby surfaces." },
    "Magic Weapon": { level: 2, time: "1 bonus action", range: "Touch", comp: "V, S", dur: "1 hour", desc: "A nonmagical weapon you touch becomes a magic weapon with +1 to attack and damage rolls (+2 with a level 3-5 slot, +3 with level 6+). Casting it again ends the previous one." },
    "Mirror Image": { level: 2, time: "1 action", range: "Self", comp: "V, S", dur: "1 min", desc: "Three illusory duplicates appear. Attacks may hit a duplicate (AC 10+DEX) instead; a duplicate vanishes when hit. Lasts 1 min." },
    "Misty Step": { level: 2, time: "1 bonus action", range: "Self", comp: "V", dur: "Instant", desc: "Bonus Action: teleport up to 30ft to a spot you can see." },
    "Moonbeam": { level: 2, time: "1 action", range: "120ft", comp: "V, S, M (a moonseed leaf)", dur: "Concentration, 1 min", desc: "A 5-ft-radius, 40-ft-high cylinder of pale light (Dim Light) appears on a point within 120 ft; on later turns a Magic action moves it up to 60 ft. A creature makes a Constitution save when the cylinder appears on it or moves into its space, and when it enters or ends its turn there (once per turn): 2d10 Radiant damage, half on a success; a shape-shifted creature that fails reverts to its true form and can't shape-shift while inside. Upcast: +1d10 per slot level above 2." },
    "Pass Without Trace": { level: 2, time: "1 action", range: "Self", comp: "V, S, M (ashes from burned holly)", dur: "Concentration, 1 hour", desc: "You and allies within 30ft gain +10 to Stealth checks and can't be tracked." },
    "Phantasmal Force": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a bit of fleece)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. INT save or the target perceives an illusion that can deal 1d6 psychic damage per turn. Investigation check to discern." },
    "Prayer of Healing": { level: 2, time: "10 minutes", range: "30ft", comp: "V", dur: "Instant", desc: "Up to 6 creatures: restore 2d8 + modifier HP. Casting time 10 min. Upcast: +1d8." },
    "Protection from Poison": { level: 2, time: "1 action", range: "Touch", comp: "V, S", dur: "1 hour", desc: "Neutralise poison. Advantage on poison saves and resistance to poison damage." },
    "Scorching Ray": { level: 2, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Three rays of fire. Ranged spell attack per ray, 2d6 fire damage each. Upcast: +1 ray per higher slot." },
    "See Invisibility": { level: 2, time: "1 action", range: "Self", comp: "V, S, M (a pinch of talc and powdered silver)", dur: "1 hour", desc: "You see invisible creatures and objects, and you can see into the Ethereal Plane. Lasts 1 hour." },
    "Shatter": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a chip of glass or piece of mica)", dur: "Instant", desc: "10ft radius, 60ft range. CON save or 3d8 thunder damage (half on save). Creatures of inorganic material save with disadvantage. Upcast: +1d8." },
    "Silence": { level: 2, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Ritual. 20ft radius of silence. No sound; verbal spells are blocked." },
    "Spider Climb": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (a drop of bitumen and a spider)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. The target can climb any surface, including ceilings, with hands free. Touch." },
    "Spike Growth": { level: 2, time: "1 action", range: "150ft", comp: "V, S, M (doornen)", dur: "Concentration, 10 min", desc: "20ft radius. Difficult terrain, 2d4 piercing per 5ft of movement. Camouflaged." },
    "Spiritual Weapon": { level: 2, time: "1 bonus action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Create a floating spectral weapon within range and make a melee spell attack against a creature within 5 ft of it: 1d8 + your spellcasting modifier Force damage. As a Bonus Action on later turns, move it up to 20 ft and attack again. Higher slot: +1d8 per slot level above 2." },
    "Suggestion": { level: 2, time: "1 action", range: "30ft", comp: "V, M (a snake's tongue and a bit of honeycomb or a drop of sweet oil)", dur: "Concentration, 8 hours", desc: "Concentration, 8 hours. WIS save or the target follows a reasonable-sounding suggestion of up to two sentences." },
    "Web": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a bit of cobweb)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. 20ft cube of webs. DEX save or Restrained. Difficult terrain. Flammable (2d4 fire per turn)." },
    "Zone of Truth": { level: 2, time: "1 action", range: "60ft", comp: "V, S", dur: "10 min", desc: "15ft radius. CHA save or a creature can't lie. You know whether the save succeeded." },

    // ===== 3RD LEVEL =====
    "Magic Circle": { level: 3, time: "1 minute", range: "10ft", comp: "V, S, M (holy water or powdered silver and iron worth 100gp, consumed)", dur: "1 hour", desc: "A 10-ft-radius, 20-ft-tall cylinder on the ground within 10 ft. Choose one or more of Celestials, Elementals, Fey, Fiends and Undead: they can't willingly enter it by nonmagical means (teleporting in needs a Charisma save), have Disadvantage on attack rolls against targets inside, and can't possess, Charm or Frighten them. You can reverse it to trap such a creature inside instead. Upcast: +1 hour per slot level above 3." },
    "Animate Dead": { level: 3, time: "1 minute", range: "10ft", comp: "V, S, M (a drop of blood, a piece of flesh, and a pinch of bone dust)", dur: "Instant", desc: "Turn the bones or corpse of a Medium or Small Humanoid within 10 ft into a Skeleton or Zombie under your control. As a Bonus Action you command any of your creatures within 60 ft; without orders they only defend themselves. Control lasts 24 hours — recast before then to keep up to four of them. Upcast: +2 creatures per slot level above 3." },
    "Aura of Vitality": { level: 3, time: "1 action", range: "Self (30ft)", comp: "V", dur: "Concentration, 1 min", desc: "A 30-ft emanation of healing surrounds you. When you create it and at the start of each of your turns, you can restore 2d6 Hit Points to one creature in it." },
    "Beacon of Hope": { level: 3, time: "1 action", range: "30ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Any number of creatures in range have Advantage on Wisdom saves and Death Saving Throws, and regain the maximum possible HP from any healing, for the duration." },
    "Bestow Curse": { level: 3, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 min", desc: "A creature you touch makes a Wisdom save or is cursed. Choose one: Disadvantage on ability checks and saves with one ability; Disadvantage on attack rolls against you; in combat a Wisdom save at the start of each of its turns or it must take the Dodge action; or your attack rolls and spells deal an extra 1d8 Necrotic damage to it. Upcast: level 4 slot = Concentration up to 10 minutes; level 5-6 = 8 hours, 7-8 = 24 hours (no Concentration); level 9 = until dispelled." },
    "Blink": { level: 3, time: "1 action", range: "Self", comp: "V, S", dur: "1 min", desc: "For 1 minute, roll 1d6 at the end of each of your turns: on 4-6 you vanish to the Ethereal Plane until the start of your next turn (you can only affect and be affected by creatures there), then return to your space or the nearest free one." },
    "Blinding Smite": { level: 3, time: "1 bonus action", range: "Self", comp: "V", dur: "Instant", desc: "Bonus Action right after you hit with a Melee weapon or an Unarmed Strike: the target takes an extra 3d8 Radiant damage and is Blinded until the spell ends (1 minute); it makes a Constitution save at the end of each of its turns, ending the effect on a success. Upcast: +1d8 per slot level above 3." },
    "Call Lightning": { level: 3, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 10 min", desc: "A storm cloud (10-ft-tall, 60-ft-radius cylinder) appears overhead within 120 ft. A bolt strikes a point you choose under it: each creature within 5 ft makes a Dexterity save, taking 3d10 Lightning damage, half on a success. On later turns a Magic action calls another bolt. If you cast it outdoors in a storm, the damage is 1d10 higher. Upcast: +1d10 per slot level above 3." },
    "Clairvoyance": { level: 3, time: "10 minutes", range: "1 mile", comp: "V, S, M (a focus worth at least 100gp)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Create an invisible sensor at a familiar location up to 1 mile away. See or hear through the sensor." },
    "Conjure Animals": { level: 3, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Conjure a Large pack of spectral nature spirits (wolves, serpents, birds…). You have Advantage on Strength saves within 5 ft of it and can move it 30 ft when you move. When it comes within 10 ft of a creature, or a creature enters or ends its turn within 10 ft of it, that creature makes a Dexterity save or takes 3d10 Slashing damage (once per turn). Higher slot: +1d10 per slot level above 3." },
    "Conjure Barrage": { level: 3, time: "1 action", range: "Self (60ft cone)", comp: "V, S, M (ammunition/a weapon)", dur: "Instant", desc: "Spectral copies of your weapon or ammunition launch in a 60-ft cone: each creature of your choice there makes a Dexterity save, taking 5d8 Force damage, half on a success. Upcast: +1d8 per slot level above 3." },
    "Counterspell": { level: 3, time: "1 reaction", range: "60ft", comp: "S", dur: "Instant", desc: "Reaction when you see a creature within 60 ft casting a spell: it makes a Constitution save. On a failure the spell has no effect and the action, Bonus Action or Reaction used to cast it is wasted; if it was cast with a spell slot, that slot isn't expended." },
    "Crusader's Mantle": { level: 3, time: "1 action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "A 30-ft emanation surrounds you: while in it, you and your allies deal an extra 1d4 Radiant damage when hitting with a weapon or an Unarmed Strike." },
    "Daylight": { level: 3, time: "1 action", range: "60ft", comp: "V, S", dur: "1 hour", desc: "60ft radius of bright light + 60ft of dim light from a point or object. Lasts 1 hour. Dispels magical darkness of 3rd level or lower." },
    "Dispel Magic": { level: 3, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Automatically end a magical effect of 3rd level or lower. Higher effects: ability check DC 10 + spell level." },
    "Fear": { level: 3, time: "1 action", range: "Self (30ft cone)", comp: "V, S, M (a white feather or a hen's heart)", dur: "Concentration, 1 min", desc: "Each creature in a 30-ft cone makes a Wisdom save or drops what it is holding and is Frightened for the duration. A Frightened creature Dashes away from you by the safest route on each of its turns; if it ends its turn where it can't see you, it repeats the save, ending the effect on a success." },
    "Fireball": { level: 3, time: "1 action", range: "150ft", comp: "V, S, M (a tiny ball of bat guano and sulfur)", dur: "Instant", desc: "A 20ft radius explosion at a point within 150ft. DEX save or 8d6 fire damage (half on a save). Upcast: +1d6 per higher slot." },
    "Fly": { level: 3, time: "1 action", range: "Touch", comp: "V, S, M (a wing feather from any bird)", dur: "Concentration, 10 min", desc: "A willing creature you touch gains a Fly Speed of 60 ft and can hover for the duration; when the spell ends it falls if still aloft (unless it can stop the fall). Upcast: +1 creature per slot level above 3." },
    "Gaseous Form": { level: 3, time: "1 action", range: "Touch", comp: "V, S, M (a bit of gauze and a wisp of smoke)", dur: "Concentration, 1 hour", desc: "A willing creature you touch (and its gear) becomes a misty cloud: Fly Speed 10 ft and hover is its only movement, it can enter other creatures' spaces and pass through narrow openings, has Resistance to Bludgeoning, Piercing and Slashing damage, is immune to Prone and has Advantage on Strength, Dexterity and Constitution saves. It can't talk, handle objects, attack or cast spells. Ends at 0 HP or with a Magic action. Upcast: +1 creature per slot level above 3." },
    "Haste": { level: 3, time: "1 action", range: "30ft", comp: "V, S, M (a shaving of licorice root)", dur: "Concentration, 1 min", desc: "A willing creature within 30 ft gets double Speed, +2 AC, Advantage on Dexterity saves and one extra action each turn (only Attack with one attack, Dash, Disengage, Hide or Utilize). When the spell ends it is Incapacitated with Speed 0 until the end of its next turn." },
    "Hunger of Hadar": { level: 3, time: "1 action", range: "150ft", comp: "V, S, M (octopustentakel)", dur: "Concentration, 1 min", desc: "A 20-ft-radius sphere of magical Darkness within 150 ft: Difficult Terrain, no light can illuminate it and creatures fully inside are Blinded. A creature that starts its turn there takes 2d6 Cold damage; one that ends its turn there makes a Dexterity save or takes 2d6 Acid damage. Upcast: +1d6 Cold or Acid (your choice) per slot level above 3." },
    "Hypnotic Pattern": { level: 3, time: "1 action", range: "120ft", comp: "S, M (a glowing stick of incense or a crystal vial of phosphorescent material)", dur: "Concentration, 1 min", desc: "A shifting pattern fills a 30-ft cube within 120 ft. Each creature that sees it makes a Wisdom save or is Charmed for the duration — Incapacitated with Speed 0. The effect ends for a creature that takes damage or is shaken awake with an action." },
    "Lightning Bolt": { level: 3, time: "1 action", range: "Self (100ft line)", comp: "V, S, M (a bit of fur and a rod of amber, crystal, or glass)", dur: "Instant", desc: "100ft line, 5ft wide. DEX save or 8d6 lightning damage (half on save). Ignites flammable material. Upcast: +1d6." },
    "Major Image": { level: 3, time: "1 action", range: "120ft", comp: "V, S, M (a bit of fleece)", dur: "Concentration, 10 min", desc: "An illusion of an object, creature or phenomenon up to a 20-ft cube within 120 ft, with sound, smell and temperature — it can't deal damage or cause conditions. A Magic action moves it within range. A creature that inspects it can see through it with a successful Intelligence (Investigation) check against your spell save DC. Upcast: with a level 4+ slot it lasts until dispelled, without Concentration." },
    "Mass Healing Word": { level: 3, time: "1 bonus action", range: "60ft", comp: "V", dur: "Instant", desc: "Bonus Action: up to six creatures of your choice you can see within 60 ft regain 2d4 + your spellcasting ability modifier Hit Points. Upcast: +1d4 per slot level above 3." },
    "Plant Growth": { level: 3, time: "1 action / 8 hours", range: "150ft", comp: "V, S", dur: "Instant", desc: "100ft radius of dense plant growth (4ft of movement per 1ft moved). Or an 8-hour ritual to enrich the land." },
    "Protection from Energy": { level: 3, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. Touch. The target gains resistance to a chosen damage type (acid/cold/fire/lightning/thunder)." },
    "Revivify": { level: 3, time: "1 action", range: "Touch", comp: "V, S, M (a diamond worth 300+ GP, consumed)", dur: "Instant", desc: "A creature that died within the last minute revives with 1 HP (not from old age; missing body parts don't return)." },
    "Sending": { level: 3, time: "1 action", range: "Unlimited", comp: "V, S, M (a copper wire)", dur: "1 round", desc: "Send a message of up to 25 words to a creature you have met or that was described to you; it hears it in its mind, recognises you if it knows you and can answer the same way. Works across any distance; to another plane there is a 5% chance it doesn't arrive (you know if it fails)." },
    "Sleet Storm": { level: 3, time: "1 action", range: "150ft", comp: "V, S, M (a pinch of dust and a few drops of water)", dur: "Concentration, 1 min", desc: "Sleet falls in a 40-ft-tall, 20-ft-radius cylinder within 150 ft: the area is Heavily Obscured, Difficult Terrain and exposed flames go out. A creature that enters it for the first time on a turn or starts its turn there makes a Dexterity save or falls Prone and loses Concentration." },
    "Slow": { level: 3, time: "1 action", range: "120ft", comp: "V, S, M (a drop of molasses)", dur: "Concentration, 1 min", desc: "Up to six creatures of your choice in a 40-ft cube within 120 ft make a Wisdom save. On a failure: Speed halved, −2 to AC and Dexterity saves, no Reactions, an action or a Bonus Action on their turn (not both), only one attack with the Attack action, and spells with a Somatic component have a 25% chance to fail. They repeat the save at the end of each of their turns." },
    "Speak with Dead": { level: 3, time: "1 action", range: "10ft", comp: "V, S, M (burning incense)", dur: "10 min", desc: "A corpse within 10 ft that still has a mouth answers up to five questions within 10 minutes, with what it knew in life. Answers are brief and cryptic, and it needn't be truthful if it sees you as an enemy. Fails if the creature was Undead or the corpse was targeted by this spell in the last 10 days." },
    "Spirit Guardians": { level: 3, time: "1 action", range: "Self (15ft)", comp: "V, S, M (a prayer scroll)", dur: "Concentration, 10 min", desc: "Spirits fill a 15-ft emanation around you; you choose creatures it doesn't affect. Other creatures have their Speed halved there, and when the emanation reaches them or they enter or end their turn in it (once per turn) they make a Wisdom save: 3d8 Radiant damage (Necrotic if you are evil), half on a success. Upcast: +1d8 per slot level above 3." },
    "Stinking Cloud": { level: 3, time: "1 action", range: "90ft", comp: "V, S, M (a rotten egg or several skunk cabbage leaves)", dur: "Concentration, 1 min", desc: "A 20-ft-radius sphere of nauseating gas within 90 ft, Heavily Obscured, until the spell ends or a strong wind disperses it. A creature that starts its turn inside makes a Constitution save or is Poisoned until the end of that turn and can't take an action or a Bonus Action." },
    "Summon Fey": { level: 3, time: "1 action", range: "90ft", comp: "V, S, M (a gilded flower worth 300gp)", dur: "Concentration, 1 hour", desc: "A Fey Spirit (choose a mood: Fuming, Mirthful or Tricksy) appears within 90 ft. It is your ally, shares your Initiative and acts right after you, obeys your verbal commands (no action needed) and otherwise Dodges and avoids danger. It vanishes at 0 HP or when the spell ends. Upcast: the stat block uses the slot's level." },
    "Tongues": { level: 3, time: "1 action", range: "Touch", comp: "V, M (a small clay ziggurat)", dur: "1 hour", desc: "For 1 hour the creature you touch understands any spoken or signed language it hears or sees, and anyone who knows a language understands it when it speaks or signs." },
    "Water Breathing": { level: 3, time: "1 action", range: "30ft", comp: "V, S, M (a short reed or piece of straw)", dur: "24 hours", desc: "Ritual. Up to 10 creatures can breathe underwater. Lasts 24 hours." },
    "Water Walk": { level: 3, time: "1 action", range: "30ft", comp: "V, S, M (a piece of cork)", dur: "1 hour", desc: "Ritual. Up to 10 creatures can walk on liquid surfaces. Lasts 1 hour." },
    "Wind Wall": { level: 3, time: "1 action", range: "120ft", comp: "V, S, M (a fan and a feather)", dur: "Concentration, 1 min", desc: "A wall of strong wind up to 50 ft long, 15 ft high and 1 ft thick rises along the ground within 120 ft. Creatures in it when it appears make a Strength save: 4d8 Bludgeoning damage, half on a success. It keeps out fog, smoke and gases, stops Small or smaller flyers, and makes arrows, bolts and other ordinary projectiles aimed through it miss (hurled boulders are unaffected)." },

    // ===== 4TH LEVEL =====
    "Arcane Eye": { level: 4, time: "1 action", range: "30ft", comp: "V, S, M (vleermuisvacht)", dur: "Concentration, 1 hour", desc: "An invisible magical eye you can steer and see through." },
    "Aura of Life": { level: 4, time: "1 action", range: "Self (30ft emanation)", comp: "V", dur: "Concentration, 10 min", desc: "You and your allies in the aura have Resistance to Necrotic damage and can't have your HP maximum reduced; an ally that starts its turn there with 0 HP regains 1 HP." },
    "Banishment": { level: 4, time: "1 action", range: "60ft", comp: "V, S, M (an item distasteful to the target)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. CHA save or the target vanishes to a harmless demiplane (or its home plane if it's extraplanar). Upcast: +1 target." },
    "Blight": { level: 4, time: "1 action", range: "30ft", comp: "V, S", dur: "Instant", desc: "CON save or 8d8 necrotic damage (half on save). Plant creatures save with disadvantage and take maximum damage. 30ft." },
    "Confusion": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (drie notenschalen)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 10ft radius, 90ft. WIS save or a random action each turn (a d10 determines behaviour). Repeat the save each turn." },
    "Conjure Woodland Beings": { level: 4, time: "1 action", range: "Self (10ft emanation)", comp: "V, S", dur: "Concentration, 10 min", desc: "Nature spirits flit around you: when the emanation reaches a creature, or a creature enters or ends its turn in it, it makes a Wisdom save — 5d8 Force damage, half on a success (once per turn). You can take the Disengage action as a Bonus Action for the duration. Higher slot: +1d8 per slot level above 4." },
    "Death Ward": { level: 4, time: "1 action", range: "Touch", comp: "V, S", dur: "8 hours", desc: "The first time the target would drop to 0 HP, it drops to 1 HP instead. Once. 8 hours." },
    "Dimension Door": { level: 4, time: "1 action", range: "500ft", comp: "V", dur: "Instant", desc: "Teleport yourself (and optionally 1 willing creature) up to 500ft to a spot you can describe or visualise." },
    "Dominate Beast": { level: 4, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save or a beast follows your telepathic commands. Repeat the save on damage. Higher slots = longer duration." },
    "Freedom of Movement": { level: 4, time: "1 action", range: "Touch", comp: "V, S, M (leren band)", dur: "1 hour", desc: "The target is unaffected by difficult terrain and magical restraints. 1 hour." },
    "Giant Insect": { level: 4, time: "1 action", range: "30ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Transform insects into giant versions. Up to 10 centipedes, 5 wasps, 3 spiders, or 1 scorpion." },
    "Greater Invisibility": { level: 4, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. The target turns invisible. Does NOT end when it attacks or casts a spell!" },
    "Guardian of Faith": { level: 4, time: "1 action", range: "30ft", comp: "V", dur: "8 hours", desc: "A spectral guardian. Hostile creatures within 10ft: DEX save or 20 radiant damage. Vanishes after dealing 60 damage." },
    "Ice Storm": { level: 4, time: "1 action", range: "300ft", comp: "V, S, M (a pinch of dust and a few drops of water)", dur: "Instant", desc: "20ft radius, 300ft range. DEX save or 2d8 bludgeoning + 4d6 cold (half on a save). The area becomes difficult terrain. Scales." },
    "Polymorph": { level: 4, time: "1 action", range: "60ft", comp: "V, S, M (a caterpillar cocoon)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. WIS save. Transform a creature into a beast with CR ≤ the target's level. New HP; it reverts at 0 HP." },
    "Staggering Smite": { level: 4, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Your next melee hit: +4d6 psychic damage. WIS save or disadvantage on attacks and no reactions." },
    "Stoneskin": { level: 4, time: "1 action", range: "Touch", comp: "V, S, M (diamond dust worth 100gp, which the spell consumes)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. Touch, 100gp diamond. Resistance to nonmagical bludgeoning, piercing, and slashing damage." },
    "Summon Aberration": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (a tentacle worth 200gp)", dur: "Concentration, 1 hour", desc: "Summon an aberration. Stronger at higher slot levels." },
    "Wall of Fire": { level: 4, time: "1 action", range: "120ft", comp: "V, S, M (a bit of phosphorus)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 60ft long or a 20ft diameter ring, 20ft high. 5d8 fire damage when entering or starting inside. One side deals damage." },

    // ===== 5TH LEVEL =====
    "Animate Objects": { level: 5, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Animate up to 10 small objects. They have AC, HP, and attack on your Bonus Action. Upcast: +2 objects." },
    "Banishing Smite": { level: 5, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Your next hit: +5d10 force. If the target has 50 HP or fewer after the hit: banished." },
    "Cloudkill": { level: 5, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. 20ft radius of poisonous fog. CON save or 5d8 poison (half on save). Moves 10ft per turn with the wind." },
    "Commune": { level: 5, time: "1 minute", range: "Self", comp: "V, S, M (incense)", dur: "1 min", desc: "Ritual. Ask your deity 3 yes/no questions. The answers are correct, but may be cryptic." },
    "Cone of Cold": { level: 5, time: "1 action", range: "Self (60ft cone)", comp: "V, S, M (a small crystal or glass cone)", dur: "Instant", desc: "60ft cone. CON save or 8d8 cold damage (half on save). Creatures killed become frozen statues. Upcast: +1d8." },
    "Conjure Elemental": { level: 5, time: "1 minute", range: "90ft", comp: "V, S", dur: "Concentration, 1 hour", desc: "Summon an elemental of CR 5 or lower. You lose control if your concentration breaks." },
    "Conjure Volley": { level: 5, time: "1 action", range: "150ft", comp: "V, S, M (ammunition/a weapon)", dur: "Instant", desc: "40ft radius. DEX save or 8d8 damage (weapon's type). Half on save." },
    "Contagion": { level: 5, time: "1 action", range: "Touch", comp: "V, S", dur: "7 days", desc: "Melee spell attack. The target contracts a disease of your choice (blinding sickness, filth fever, etc.). After 3 failed CON saves the effect lasts 7 days." },
    "Creation": { level: 5, time: "1 minute", range: "30ft", comp: "V, S, M (a tiny piece of matter of the same type as the item you plan to create)", dur: "Special", desc: "Create a nonliving object of vegetable or mineral matter, up to a 5ft cube. Duration depends on the material." },
    "Destructive Wave": { level: 5, time: "1 action", range: "Self (30ft)", comp: "V", dur: "Instant", desc: "CON save or 5d6 thunder + 5d6 radiant/necrotic and knocked Prone. Half on save." },
    "Dominate Person": { level: 5, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save or a humanoid follows your telepathic commands. Repeat the save on damage. Higher slots = longer duration." },
    "Greater Restoration": { level: 5, time: "1 action", range: "Touch", comp: "V, S, M (diamond dust worth 100gp)", dur: "Instant", desc: "Beëindig charm/petrification/curse, ability score reductie, of HP max reductie." },
    "Hold Monster": { level: 5, time: "1 action", range: "90ft", comp: "V, S, M (a piece of iron)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save or Paralyzed. Works on any creature type. Repeat the save each turn. Upcast: +1 target." },
    "Insect Plague": { level: 5, time: "1 action", range: "300ft", comp: "V, S, M (a few grains of sugar, some kernels of grain, and a smear of fat)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. 20ft radius swarm, 300ft range. CON save or 4d10 piercing (half on save). Difficult terrain. Upcast: +1d10." },
    "Mass Cure Wounds": { level: 5, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Up to 6 creatures regain 3d8 + spellcasting mod HP. Upcast: +1d8." },
    "Raise Dead": { level: 5, time: "1 hour", range: "Touch", comp: "V, S, M (a diamond worth 500+ GP, which the spell consumes)", dur: "Instant", desc: "You revive a creature that has been dead for no longer than 10 days and wasn't Undead when it died. It returns with 1 Hit Point, poisons are neutralised and mortal wounds close (missing body parts aren't restored; without a vital one the spell fails). It takes a −4 penalty to D20 Tests, reduced by 1 each time it finishes a Long Rest." },
    "Scrying": { level: 5, time: "10 minutes", range: "Self", comp: "V, S, M (a focus worth 1000gp)", dur: "Concentration, 10 min", desc: "Observe a creature on any plane. WIS save, modified by how well you know it." },
    "Seeming": { level: 5, time: "1 action", range: "30ft", comp: "V, S", dur: "8 hours", desc: "Change the appearance of any number of creatures within 30ft. Lasts 8 hours. CHA save for unwilling targets. Investigation check to discern." },
    "Steel Wind Strike": { level: 5, time: "1 action", range: "30ft", comp: "S, M (a weapon)", dur: "Instant", desc: "Melee spell attacks against up to 5 creatures. 6d10 force per hit. Teleport next to each target you strike." },
    "Swift Quiver": { level: 5, time: "1 bonus action", range: "Self", comp: "V, S, M (a Quiver worth 1+ GP)", dur: "Concentration, 1 min", desc: "When you cast it and as a Bonus Action until it ends, make two attacks with a weapon that fires Arrows or Bolts; the spell creates the ammunition, which disintegrates after the attack." },
    "Synaptic Static": { level: 5, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "20ft radius, 120ft range. INT save or 8d6 psychic damage (half on save). Failed targets: -1d6 on attack rolls, checks and concentration saves for 1 min." },
    "Telekinesis": { level: 5, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Move a creature or object of up to 1000 lbs. Creatures: contested ability check. 60ft range." },
    "Teleportation Circle": { level: 5, time: "1 minute", range: "10ft", comp: "V, M (rare chalks and inks infused with gems worth 50gp, which the spell consumes)", dur: "1 round", desc: "Draw a circle that teleports you to a permanent sigil sequence you know. 10ft radius. Lasts 1 round." },
    "Wall of Force": { level: 5, time: "1 action", range: "120ft", comp: "V, S, M (a shard of glass)", dur: "Concentration, 10 min", desc: "Invisible wall of force. Nothing can pass through; only Disintegrate destroys it." },
    "Wall of Stone": { level: 5, time: "1 action", range: "120ft", comp: "V, S, M (a small block of granite)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. 10 panels of 10x10ft stone, 6 inches thick. Each panel AC 15, 30 HP. Can become permanent." },

    // ===== 6TH LEVEL =====
    "Arcane Gate": { level: 6, time: "1 action", range: "500ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Two linked portals within 500ft. Creatures can step through in either direction." },
    "Blade Barrier": { level: 6, time: "1 action", range: "90ft", comp: "V, S", dur: "Concentration, 10 min", desc: "A wall of whirling blades (100ft long, 20ft high, or a circle). DEX save or 6d10 slashing damage for each creature passing through." },
    "Chain Lightning": { level: 6, time: "1 action", range: "150ft", comp: "V, S, M (a bit of fur; a piece of amber, glass, or a crystal rod; and three silver pins)", dur: "Instant", desc: "A bolt strikes one target and leaps to 3 more targets within 30ft. DEX save or 10d8 lightning (half on a save). Scales." },
    "Circle of Death": { level: 6, time: "1 action", range: "150ft", comp: "V, S, M (the powder of a crushed black pearl worth at least 500gp)", dur: "Instant", desc: "60ft radius, 150ft range. CON save or 8d6 necrotic damage (half on save). 500gp material component." },
    "Conjure Fey": { level: 6, time: "1 minute", range: "90ft", comp: "V, S", dur: "Concentration, 1 hour", desc: "Summon a fey creature of CR 6 or lower. It obeys your commands. Concentration is required to keep control." },
    "Contingency": { level: 6, time: "10 minutes", range: "Self", comp: "V, S, M (an ivory statuette of yourself worth 1500gp)", dur: "10 days", desc: "Set a trigger for a spell of 5th level or lower, which then goes off automatically. You can have only one contingency active at a time." },
    "Create Undead": { level: 6, time: "1 minute", range: "10ft", comp: "V, S, M (herbs and oils worth 150gp)", dur: "Instant", desc: "Animate up to 3 corpses as ghouls (or mightier undead at higher slot levels). They obey you for 24 hours." },
    "Disintegrate": { level: 6, time: "1 action", range: "60ft", comp: "V, S, M (a lodestone and a pinch of dust)", dur: "Instant", desc: "DEX save. 10d6+40 force damage. At 0 HP the target is reduced entirely to dust. 60ft." },
    "Eyebite": { level: 6, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Each turn, as an action: put to sleep, panic, or sicken a creature you eye. WIS save." },
    "Find the Path": { level: 6, time: "1 minute", range: "Self", comp: "V, S, M (a set of divinatory tools worth 100gp)", dur: "Concentration, 1 day", desc: "Know the shortest route to a familiar location on the same plane. Gives direction while the spell lasts." },
    "Flesh to Stone": { level: 6, time: "1 action", range: "60ft", comp: "V, S, M (a sprinkling of holy water, rare incense, and ruby dust)", dur: "Concentration, 1 min", desc: "CON save of target begint te verstenen. Drie gefaalde saves = permanent petrified. Concentration, 1 min." },
    "Forbiddance": { level: 6, time: "10 minutes", range: "Touch", comp: "V, S, M (incense and ruby dust worth 1000gp)", dur: "1 day", desc: "Ward an area of up to 40,000 square feet against teleportation and planar travel. Celestials, fiends, or undead take 5d10 damage on entering." },
    "Globe of Invulnerability": { level: 6, time: "1 action", range: "Self (10ft radius)", comp: "V, S, M (a glass or crystal bead that shatters when the spell ends)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. A 10ft radius sphere. Spells of 5th level or lower can't penetrate it. Scales." },
    "Guards and Wards": { level: 6, time: "10 minutes", range: "Touch", comp: "V, S, M (a silver rod worth 10+ GP)", dur: "24 hours", desc: "Ward a building of 2500 square feet with several magical effects: confusion, alarms, fog, magical doors and stairs." },
    "Harm": { level: 6, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "CON save or the target takes 14d6 necrotic damage and its max HP is reduced by the same amount. Half damage on a save." },
    "Heal": { level: 6, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Restore 70 HP to a creature. Also ends blindness, deafness, and all diseases. Upcast: +10 HP per higher slot." },
    "Heroes' Feast": { level: 6, time: "10 minutes", range: "30ft", comp: "V, S, M (a bowl worth 1000gp)", dur: "Instant", desc: "Up to 12 creatures share a divine feast. They become immune to poison and being Frightened, gain advantage on WIS saves, and their max HP rises by 2d10 for 24 hours." },
    "Magic Jar": { level: 6, time: "1 minute", range: "Self", comp: "V, S, M (a gem worth 500gp)", dur: "Until broken", desc: "Leave your body and store your soul in a gem. Attempt to possess a humanoid's body (CHA save). You can leave and return to your own body." },
    "Mass Suggestion": { level: 6, time: "1 action", range: "60ft", comp: "V, M (a snake's tongue and a bit of honeycomb or a drop of sweet oil)", dur: "24 hours", desc: "Suggest an activity to up to 12 creatures. WIS save. No concentration; lasts 24 hours." },
    "Move Earth": { level: 6, time: "1 action", range: "120ft", comp: "V, S, M (an iron blade and a small bag of soil, clay, and sand)", dur: "Concentration, 2 hours", desc: "Concentration, 2 hours. Move earth in a 40ft square. 120ft range. Reshape terrain over time." },
    "Otto's Irresistible Dance": { level: 6, time: "1 action", range: "30ft", comp: "V", dur: "Concentration, 1 min", desc: "WIS save or the target starts a compulsive dance. It has disadvantage on attack rolls and DEX saves, and attackers have advantage. Repeat the save each turn." },
    "Planar Ally": { level: 6, time: "10 minutes", range: "60ft", comp: "V, S", dur: "Instant", desc: "Call a celestial, elemental, or fiend. It performs one task for you in exchange for a reward of its choosing." },
    "Programmed Illusion": { level: 6, time: "1 action", range: "120ft", comp: "V, S, M (jade dust worth 25+ GP)", dur: "Until dispelled", desc: "Create an illusion that activates on a chosen trigger. Runs for 5 minutes and can be triggered multiple times." },
    "Sunbeam": { level: 6, time: "1 action", range: "Self (60ft line)", comp: "V, S, M (a magnifying glass, a piece of sunstone, and a fire-plant seed)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. A 60ft line of light. CON save or 6d8 radiant damage and Blinded. Dispels darkness. Repeat with an action each turn." },
    "True Seeing": { level: 6, time: "1 action", range: "Touch", comp: "V, S, M (an ointment for the eyes worth 25gp, made of mushroom powder, saffron, and fat, which the spell consumes)", dur: "1 hour", desc: "Touch, 1 hour. The target sees in darkness, sees invisible creatures, discerns illusions, and sees into the Ethereal Plane. 120ft truesight." },
    "Wall of Thorns": { level: 6, time: "1 action", range: "120ft", comp: "V, S, M (a handful of thorns)", dur: "Concentration, 10 min", desc: "Create a hedge of thorns 60ft long, 10ft wide, and 5ft high. DEX save or 7d8 piercing damage. Difficult terrain." },
    "Wind Walk": { level: 6, time: "1 minute", range: "30ft", comp: "V, S, M (fire and holy water)", dur: "8 hours", desc: "You and up to 10 creatures become wind-borne mist with a fly speed of 300ft. Return to normal form as a Bonus Action (1-minute transformation)." },
    "Word of Recall": { level: 6, time: "1 action", range: "5ft", comp: "V", dur: "Instant", desc: "You and up to 5 willing creatures instantly teleport to a hallowed location you previously designated." },

    // ===== 7TH LEVEL =====
    "Conjure Celestial": { level: 7, time: "1 minute", range: "90ft", comp: "V, S", dur: "Concentration, 1 hour", desc: "Summon a celestial of CR 4 or lower. It obeys your commands and returns to its plane when the spell ends." },
    "Delayed Blast Fireball": { level: 7, time: "1 action", range: "150ft", comp: "V, S, M (a tiny ball of bat guano and sulfur)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. A glowing bead at a point. Explodes when your concentration ends: 12d6 fire +1d6 per extra round waited. 150ft." },
    "Divine Word": { level: 7, time: "1 bonus action", range: "30ft", comp: "V", dur: "Instant", desc: "Speak a divine word. Creatures with low HP die; others are Blinded, Deafened, or Stunned. Extraplanar creatures that fail are sent back to their plane." },
    "Etherealness": { level: 7, time: "1 action", range: "Self", comp: "V, S", dur: "8 hours", desc: "Step into the Ethereal Plane. You can see the Material Plane (60ft, in shades of gray). Lasts 8 hours. Upcast: +3 targets per slot." },
    "Finger of Death": { level: 7, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "CON save or 7d8+30 necrotic damage (half on a save). Humanoids killed by this spell rise as zombies under your control." },
    "Fire Storm": { level: 7, time: "1 action", range: "150ft", comp: "V, S", dur: "Instant", desc: "Up to 10 cubes of 10ft in an area within 150ft. DEX save or 7d10 fire damage (half on a save). You choose whether it ignites plants." },
    "Forcecage": { level: 7, time: "1 action", range: "100ft", comp: "V, S, M (ruby dust worth 1500gp)", dur: "1 hour", desc: "A prison of force: a cage of bars (20ft cube) or a solid box (10ft cube). No teleportation out. No save, no concentration." },
    "Mordenkainen's Magnificent Mansion": { level: 7, time: "1 minute", range: "300ft", comp: "V, S, M (a miniature ivory door and pieces of polished wood)", dur: "24 hours", desc: "Create an extradimensional palace. Up to 100 creatures fit inside, with invisible servants and ample food and drink." },
    "Mirage Arcane": { level: 7, time: "10 minutes", range: "Sight", comp: "V, S", dur: "10 days", desc: "Transform the appearance of a 1-square-mile area. The terrain looks different and is genuinely as hard to traverse as the illusory terrain would be." },
    "Plane Shift": { level: 7, time: "1 action", range: "Touch", comp: "V, S, M (a forked metal rod worth at least 250gp, attuned to the destination plane)", dur: "Instant", desc: "Touch. Teleport yourself and up to 8 willing creatures to another plane. Or make a ranged attack and force a CHA save to banish a target." },
    "Power Word Fortify": { level: 7, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Choose up to six creatures you can see within range. They share 120 Temporary Hit Points, split among them however you like." },
    "Prismatic Spray": { level: 7, time: "1 action", range: "Self (60ft cone)", comp: "V, S", dur: "Instant", desc: "60ft cone. Each creature rolls a d8 for a random effect: fire/acid/lightning/poison/cold/petrification/banishment. DEX save." },
    "Project Image": { level: 7, time: "1 action", range: "500 miles", comp: "V, S, M (a small replica of yourself worth 5gp)", dur: "Concentration, 1 day", desc: "Create an illusory duplicate of yourself at any place you have visited. You can see and hear through the illusion and cast spells through it." },
    "Regenerate": { level: 7, time: "1 minute", range: "Touch", comp: "V, S, M (prayer beads, a piece of hallowed flesh, and a pouch of healing herbs)", dur: "1 hour", desc: "The target regains 4d8+15 HP and regenerates 1 HP per turn for 1 hour. Severed limbs regrow after 2 minutes." },
    "Resurrection": { level: 7, time: "1 hour", range: "Touch", comp: "V, S, M (a diamond worth 1000gp)", dur: "Instant", desc: "Return a creature that has been dead no longer than 100 years to life with all its HP. The caster gains 1 level of exhaustion." },
    "Reverse Gravity": { level: 7, time: "1 action", range: "100ft", comp: "V, S, M (a lodestone and iron filings)", dur: "Concentration, 1 min", desc: "Gravity reverses in a 50-ft-radius, 100-ft-high cylinder on a point within 100 ft. Creatures and objects that aren't anchored fall upward to the top (a creature can make a Dexterity save to grab a fixed object it can reach) and hover there; anything they hit on the way up is struck as in a normal fall. When the spell ends, everything falls back down." },
    "Sequester": { level: 7, time: "1 action", range: "Touch", comp: "V, S, M (a combination of chrysoberyl, agate, and flint worth 5000gp)", dur: "Until broken", desc: "A willing creature or object becomes invisible and undetectable. A living creature enters suspended animation until a chosen trigger occurs." },
    "Simulacrum": { level: 7, time: "12 hours", range: "Touch", comp: "V, S, M (snow or ice, hair or a flake of skin, and ruby dust worth 1500gp)", dur: "Until destroyed", desc: "Create a duplicate of a humanoid or beast. It has half the HP, can't regain spell slots, and is obedient to you." },
    "Symbol": { level: 7, time: "1 minute", range: "Touch", comp: "V, S, M (mercury, phosphorus and diamond/opal worth 1000gp)", dur: "Until triggered, max 10 min", desc: "Inscribe a magical symbol on a surface. When triggered: choose one of eight effects (death, discord, fear, hopelessness, insanity, pain, sleep, stun)." },
    "Teleport": { level: 7, time: "1 action", range: "10ft", comp: "V", dur: "Instant", desc: "Teleport yourself and up to 8 willing creatures to a known location. The chance of a mishap depends on your familiarity with it." },

    // ===== 8TH LEVEL =====
    "Animal Shapes": { level: 8, time: "1 action", range: "30ft", comp: "V, S", dur: "Concentration, 24 hours", desc: "Transform up to 8 willing creatures into beasts of CR 4 or lower. They keep their intelligence. Lasts 24 hours, concentration." },
    "Antimagic Field": { level: 8, time: "1 action", range: "Self (10ft radius)", comp: "V, S, M (a pinch of powdered iron or a small magnet)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. A 10ft radius around you. Magic doesn't function in the zone: spells, magic items, and curses are suppressed." },
    "Antipathy/Sympathy": { level: 8, time: "1 hour", range: "60ft", comp: "V, S, M (alum soaked in vinegar or a drop of honey)", dur: "10 days", desc: "Choose an object/location and a creature type or specific creature. Antipathy: WIS save or flee. Sympathy: WIS save or be drawn toward it." },
    "Clone": { level: 8, time: "1 hour", range: "Touch", comp: "V, S, M (flesh of the creature + diamonds worth 1000gp + a vessel worth 2000gp)", dur: "Permanent", desc: "Create an inert clone of a living creature. When the original dies, its soul migrates to the clone, which then comes to life." },
    "Control Weather": { level: 8, time: "10 minutes", range: "Self (5-mile radius)", comp: "V, S, M (burning incense)", dur: "Concentration, 8 hours", desc: "Concentration, 8 hours. Change the weather in a 5-mile area. Takes 10 minutes to shift." },
    "Demiplane": { level: 8, time: "1 action", range: "60ft", comp: "S", dur: "1 hour", desc: "Create a door to an extradimensional space of a 30ft cube. The door is 5ft wide and 8ft high and vanishes after 1 hour." },
    "Dominate Monster": { level: 8, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. WIS save or a creature of any type follows your telepathic commands. Repeat the save on damage. Upcast: longer duration." },
    "Earthquake": { level: 8, time: "1 action", range: "500ft", comp: "V, S, M (a pinch of dirt, a piece of rock, and a lump of clay)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 100ft radius. CON save or knocked Prone. Fissures, structural damage, collapsing buildings." },
    "Befuddlement": { level: 8, time: "1 action", range: "150ft", comp: "V, S, M (a key ring with no keys)", dur: "Instant", desc: "2024 (was Feeblemind): INT save or 10d12 psychic damage and the target can't cast spells or take the Magic action, and its communication is limited. Save repeats every 30 days; Greater Restoration, Heal or Wish ends it. Successful save: half damage only." },
    "Glibness": { level: 8, time: "1 action", range: "Self", comp: "V", dur: "1 hour", desc: "Your charm becomes irresistible: whatever you say sounds believable. Attempts to detect your lies also read as truthful." },
    "Holy Aura": { level: 8, time: "1 action", range: "Self", comp: "V, S, M (a small reliquary worth 1000gp)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Friendly creatures within 30ft: advantage on saves, and enemies have disadvantage on attacks against them. Fiends/undead that hit them are Blinded." },
    "Incendiary Cloud": { level: 8, time: "1 action", range: "150ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. A 20ft radius burning cloud. DEX save or 10d8 fire damage (half on a save) each turn. Moves 10ft per round." },
    "Maze": { level: 8, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Banish a creature to an extradimensional maze. It can make a DC 20 INT check each turn to escape. Minotaurs escape automatically." },
    "Mind Blank": { level: 8, time: "1 action", range: "Touch", comp: "V, S", dur: "24 hours", desc: "One creature is immune to psychic damage, mind reading, divination spells and the Charmed condition for 24 hours." },
    "Power Word Stun": { level: 8, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Choose a creature with 150 HP or fewer: it is Stunned. No initial save. CON save each turn to end it." },
    "Sunburst": { level: 8, time: "1 action", range: "150ft", comp: "V, S, M (fire and a piece of sunstone)", dur: "Instant", desc: "60ft radius, 150ft range. CON save of 12d6 radiant en blind 1 min. Verdrijft magische duisternis." },
    "Tsunami": { level: 8, time: "1 minute", range: "Sight", comp: "V, S", dur: "Concentration, 6 rounds", desc: "Create a wall of water 300ft long, 300ft high, and 50ft thick. It moves 50ft per round. STR save or 6d10 bludgeoning damage and be swept along." },

    // ===== 9TH LEVEL =====
    "Astral Projection": { level: 9, time: "1 hour", range: "10ft", comp: "V, S, M (for each target: a jacinth worth 1000gp and a silver bar worth 100gp)", dur: "Special", desc: "You and up to 8 willing creatures travel to the Astral Plane as astral projections, connected by silver cords." },
    "Foresight": { level: 9, time: "1 minute", range: "Touch", comp: "V, S, M (a hummingbird feather)", dur: "8 hours", desc: "8 hours. The target can't be surprised and has advantage on attack rolls, ability checks, and saving throws. Attackers have disadvantage." },
    "Gate": { level: 9, time: "1 action", range: "60ft", comp: "V, S, M (a diamond worth at least 5000gp)", dur: "Concentration, 1 min", desc: "Open a portal to another plane, or call a specific being by name. The portal works both ways. Concentration, 1 min." },
    "Imprisonment": { level: 9, time: "1 minute", range: "30ft", comp: "V, S, M (components worth 500gp per Hit Die of the target)", dur: "Until broken", desc: "WIS save or the target is imprisoned in one of five forms: burial, chaining, hedged prison, minimus containment, or slumber. No escape without the specific countermeasure." },
    "Mass Heal": { level: 9, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Restore 700 HP, divided as you choose among creatures within 60ft. Also ends blindness, deafness, and all diseases." },
    "Meteor Swarm": { level: 9, time: "1 action", range: "1 mile", comp: "V, S", dur: "Instant", desc: "Four 40ft radius explosions at points within 1 mile. DEX save or 20d6 fire + 20d6 bludgeoning damage (half on a save)." },
    "Power Word Heal": { level: 9, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Restore all of a creature's HP. Also ends the Charmed, Frightened, Paralyzed, and Stunned conditions. If Prone, it stands up." },
    "Power Word Kill": { level: 9, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Choose a creature with 100 HP or fewer: it dies instantly. No save." },
    "Prismatic Wall": { level: 9, time: "1 action", range: "60ft", comp: "V, S", dur: "10 min", desc: "Wall or sphere of brilliant multicolored light. Seven layers, each with a unique effect. Creatures that come too close can be Blinded." },
    "Shapechange": { level: 9, time: "1 action", range: "Self", comp: "V, S, M (a jade circlet worth 1500gp)", dur: "Concentration, 1 hour", desc: "Transform into any creature of CR equal to or lower than your level. You keep your INT, WIS, and CHA, and your class features." },
    "Storm of Vengeance": { level: 9, time: "1 action", range: "Sight", comp: "V, S", dur: "Concentration, 1 min", desc: "Call up a colossal storm. Each round a different effect: thunder, lightning, hailstones, acidic rain, or gusts of wind." },
    "Time Stop": { level: 9, time: "1 action", range: "Self", comp: "V", dur: "Instant", desc: "Stop time for 1d4+1 turns. Only you act. Ends if you affect or damage another creature." },
    "True Polymorph": { level: 9, time: "1 action", range: "30ft", comp: "V, S, M (a drop of mercury, a dollop of gum arabic, and a wisp of smoke)", dur: "Concentration, 1 hour", desc: "Transform a creature or object (WIS save). If you maintain concentration for the full hour, the transformation becomes permanent." },
    "True Resurrection": { level: 9, time: "1 hour", range: "Touch", comp: "V, S, M (holy oils worth 25000gp)", dur: "Instant", desc: "Return a creature dead no longer than 200 years to life with all its HP. Creates a new body if the original was destroyed." },
    "Wish": { level: 9, time: "1 action", range: "Self", comp: "V", dur: "Instant", desc: "The mightiest spell. Duplicate any spell of 8th level or lower, or create another effect at the DM's discretion. Risky when used creatively." },
    "Lightning Arrow": { level: 3, time: "1 bonus action", range: "Self", comp: "V, S", dur: "Instant", desc: "Bonus Action as you make a ranged weapon attack: instead of the attack's normal effects, the target takes 4d8 Lightning damage on a hit or half on a miss, and each creature within 10 ft of it makes a Dexterity save, taking 2d8 Lightning damage, half on a success. Upcast: +1d8 to both per slot level above 3." },
    "Transport via Plants": { level: 6, time: "1 action", range: "10ft", comp: "V, S", dur: "1 round", desc: "Create a magical link between two plants on the same plane. You and willing creatures can step into one and emerge from the other." },

    // ===== CORE SPELLS ADDED (5.5e completeness patch) =====
    "Grease": { level: 1, time: "1 action", range: "60ft", comp: "V, S, M (a bit of pork rind or fat)", dur: "1 min", desc: "10ft square: difficult terrain. Creatures in the area: DEX save or Prone. Creatures entering later: DEX save as well." },
    "Longstrider": { level: 1, time: "1 action", range: "Touch", comp: "V, S, M (a pinch of dirt)", dur: "1 hour", desc: "The target gains +10ft speed for 1 hour. Upcast: +1 target per higher slot." },
    "Unseen Servant": { level: 1, time: "1 action", range: "60ft", comp: "V, S, M (a bit of string and a piece of wood)", dur: "1 hour", desc: "Ritual. An invisible spirit (AC 10, 1 HP, STR 2) performs simple tasks: cleaning, carrying, opening doors. 60ft range, 1 hour." },
    "Augury": { level: 2, time: "1 minute", range: "Self", comp: "V, S, M (specially marked sticks or bones worth 25gp)", dur: "Instant", desc: "Ritual. Ask the DM for an omen (weal/woe/both/nothing) about a course of action within the next 30 minutes. Repeated use within 24h reduces accuracy." },
    "Gentle Repose": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (a pinch of salt and one copper piece placed on each eye)", dur: "10 days", desc: "Ritual. A corpse doesn't decay, and the time doesn't count against the raise-dead timer. 10 days." },
    "Locate Object": { level: 2, time: "1 action", range: "Self", comp: "V, S, M (a forked twig)", dur: "Concentration, 10 min", desc: "Sense the direction of a familiar object within 1000ft. Lead and certain obstacles block it." },
    "Warding Bond": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (two platinum rings worth 50gp each)", dur: "1 hour", desc: "Bond with the target. It gains +1 AC and saves and resistance to all damage — you take the same damage it does. Ends beyond 60ft range." },
    "Create or Destroy Water": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (a drop of water or a pinch of sand)", dur: "Instant", desc: "Create 10 gallons of clean water or destroy as much. Or make rain/fog fall in a 30ft cube. Upcast: +10 gallons." },
    "Purify Food and Drink": { level: 1, time: "1 action", range: "10ft", comp: "V, S", dur: "Instant", desc: "Ritual. Purify all nonmagical food and drink in a 5ft sphere of poison and disease." },
    "Dissonant Whispers": { level: 1, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "WIS save or 3d6 psychic damage and the target uses its reaction to flee. Half damage and no fleeing on a save. Upcast: +1d6." },
    "Aura of Purity": { level: 4, time: "1 action", range: "Self (30ft aura)", comp: "V", dur: "Concentration, 10 min", desc: "A 30ft aura. Allies have resistance to poison, advantage on saves against conditions, and can't be diseased." },
    "Summon Celestial": { level: 5, time: "1 action", range: "90ft", comp: "V, S, M (a reliquary worth 500gp)", dur: "Concentration, 1 hour", desc: "Summon a Celestial Spirit (Defender or Avenger). It follows your orders. Stats scale with the spell slot level." },
    "Summon Beast": { level: 2, time: "1 action", range: "90ft", comp: "V, S, M (a gilded flower worth 200gp)", dur: "Concentration, 1 hour", desc: "Summon a Bestial Spirit (Air/Land/Water). It follows your orders. Stats scale with the spell slot level." },

    // ===== 2024 PHB parity additions (2026-08-16, Content-Gap-Audit) =====
    "Starry Wisp": { level: 0, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack against one creature or object. On a hit, 1d8 Radiant damage; the target sheds Dim Light in a 10ft radius and can't benefit from Invisible until the end of your next turn. Scales at levels 5/11/17 (2d8/3d8/4d8)." },
    "Thunderclap": { level: 0, time: "1 action", range: "Self (5ft emanation)", comp: "S", dur: "Instant", desc: "Each creature in the emanation makes a Constitution save or takes 1d6 Thunder damage. The sound is audible up to 100ft away. Scales at levels 5/11/17 (2d6/3d6/4d6)." },
    "Alarm": { level: 1, time: "1 minute or Ritual", range: "30ft", comp: "V, S, M (a bell and silver wire)", dur: "8 hours", desc: "Ward a door, a window or an area up to a 20-ft cube: an alarm (an audible handbell within 60 ft, or a mental ping within 1 mile that wakes you) goes off whenever a creature touches or enters it. You can exclude creatures. Ritual." },
    "Detect Poison and Disease": { level: 1, time: "1 action or Ritual", range: "Self", comp: "V, S, M (a yew leaf)", dur: "Concentration, 10 min", desc: "Sense the location, kind, and source of poisons, poisonous or venomous creatures, and magical contagions within 30ft; blocked by 1ft of stone, dirt, or wood, 1 inch of metal, or a thin sheet of lead. Concentration. Ritual." },
    "Divine Favor": { level: 1, time: "1 bonus action", range: "Self", comp: "V, S", dur: "1 min", desc: "Until the spell ends, your weapon attacks deal an extra 1d4 Radiant damage on a hit." },
    "Illusory Script": { level: 1, time: "1 minute", range: "Touch", comp: "S, M (ink worth 10+ GP, which the spell consumes)", dur: "10 days", desc: "Text you write appears normal, in your handwriting and true meaning, to you and creatures you designate, but as unintelligible magical script to everyone else unless they have Truesight. Optionally disguise the meaning, handwriting, and language (which must be known to you); dispelling the illusion erases the true text too. Ritual." },
    "Searing Smite": { level: 1, time: "1 bonus action (right after you hit with a Melee weapon or Unarmed Strike)", range: "Self", comp: "V", dur: "1 min", desc: "The target takes an extra 1d6 Fire damage, then at the start of each of its turns 1d6 Fire damage and a Constitution save (the spell ends on a success). Higher slot: all damage +1d6 per slot level above 1." },
    "Tenser's Floating Disk": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (a drop of mercury)", dur: "1 hour", desc: "Creates a 3ft-diameter horizontal force disk hovering 3ft above the ground, carrying up to 500 lb (excess weight ends the spell). It stays within 20ft of you, following if you move; the spell ends if you move more than 100ft from it. Ritual." },
    "Animal Messenger": { level: 2, time: "1 action or Ritual", range: "30ft", comp: "V, S, M (a morsel of food)", dur: "24 hours", desc: "A Tiny beast you can see carries a short message to a place you describe, seeking out a creature you designate by appearance. Duration is how long the beast retains the task. Using a higher-level slot: duration increases by 48 hours per slot level above 2. Ritual." },
    "Arcane Lock": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (gold dust worth 25+ GP, consumed)", dur: "Until dispelled", desc: "Magically locks a door, window, gate, container, or hatch; you and creatures you designate can bypass it, and you can set a password that unlocks it for 1 minute when spoken within 5ft. Adds +10 to any check made to break or pick the lock." },
    "Arcane Vigor": { level: 2, time: "Bonus Action", range: "Self", comp: "V, S", dur: "Instant", desc: "Roll 1 or 2 of your unexpended Hit Point Dice and regain that many Hit Points plus your spellcasting ability modifier. Using a higher-level slot: the number of Hit Dice you can roll increases by 1 for each slot level above 2." },
    "Beast Sense": { level: 2, time: "1 action or Ritual", range: "Touch", comp: "S", dur: "Concentration, 1 hour", desc: "Touch a willing Beast and perceive through its senses, including any special senses it has, while retaining your own senses. Concentration. Ritual." },
    "Continual Flame": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (ruby dust worth 50+ GP, consumed)", dur: "Until dispelled", desc: "A heatless, fuelless flame springs from a touched object, casting Bright Light in a 20ft radius and Dim Light for another 20ft. It can be covered but not smothered or quenched." },
    "Cordon of Arrows": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (four or more Arrows or Bolts)", dur: "8 hours", desc: "Plant up to 4 nonmagical Arrows or Bolts in the ground; whenever a creature other than you comes within 30ft of them for the first time on a turn or ends its turn there, one piece of ammunition strikes it (Dexterity save or take 2d4 Piercing damage). Using a higher-level slot: 2 additional pieces of ammunition can be planted per slot level above 2." },
    "Dragon's Breath": { level: 2, time: "1 bonus action", range: "Touch", comp: "V, S, M (a hot pepper)", dur: "Concentration, 1 min", desc: "Touch a willing creature; it can use a Magic action to exhale a 15ft cone of a chosen damage type (acid/cold/fire/lightning/poison). Each creature in the cone makes a Dex save, taking 3d6 damage on a fail, half on success. Using a higher-level slot: damage +1d6 per slot level above 2." },
    "Enthrall": { level: 2, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Each creature in range that can see or hear you makes a Wisdom save (creatures already fighting you or your companions auto-succeed) or suffers a -10 penalty to Wisdom (Perception) checks and Passive Perception until the spell ends." },
    "Find Traps": { level: 2, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Sense whether a trap (any object or mechanism made to cause damage or danger) exists within range and in line of sight, and learn its general nature, though not its exact location." },
    "Locate Animals or Plants": { level: 2, time: "1 action or Ritual", range: "Self", comp: "V, S, M (a bit of fur from a bloodhound)", dur: "Instant", desc: "You learn the direction and distance to the nearest beast or plant of a kind you name, within 5 miles, if any are present. Can be cast as a Ritual." },
    "Magic Mouth": { level: 2, time: "1 min or Ritual", range: "30ft", comp: "V, S, M (jade dust worth 10+ GP, consumed)", dur: "Until dispelled", desc: "Implant a message of 25 words or fewer (deliverable over up to 10 min) in a touched object, spoken when a trigger condition you set is met. Can be cast as a Ritual." },
    "Melf's Acid Arrow": { level: 2, time: "1 action", range: "90ft", comp: "V, S, M (powdered rhubarb leaf and an adder's stomach)", dur: "Instant", desc: "Ranged spell attack: on a hit, 4d4 acid damage plus 2d4 acid damage at the end of its next turn; on a miss, half the initial damage only. Using a higher-level slot: both damage rolls increase by 1d4 for each slot level above 2." },
    "Mind Spike": { level: 2, time: "1 action", range: "120ft", comp: "S", dur: "Concentration, 1 hour", desc: "Target makes a Wisdom save, taking 3d8 psychic damage on a fail (half on success); on a fail, you also know the target's location until the spell ends, as long as you share a plane. Using a higher-level slot: damage increases by 1d8 for each slot level above 2." },
    "Nystul's Magic Aura": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (a small square of silk)", dur: "24 hours", desc: "Alters the magical aura of a touched creature or object, making it appear nonmagical or of a different school/nonexistent magic item type of your choice to Identify and detection spells; a creature can see through the ruse with an Intelligence (Investigation) check against your spell save DC. Cast daily on the same target for 30 days to make the effect last Until dispelled." },
    "Ray of Enfeeblement": { level: 2, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Target makes a Constitution save; on a fail, it subtracts 1d8 from all its damage rolls and has Disadvantage on Strength-based D20 Tests for the duration, repeating the save at the end of each of its turns to end the effect early on success. On an initial success, the target has Disadvantage on its next attack roll before the start of your next turn." },
    "Rope Trick": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (a segment of rope)", dur: "1 hour", desc: "Touch a rope; one end hovers upward and an invisible 3ft-by-5ft portal opens at its upper end to an extradimensional space holding up to 8 Medium or smaller creatures. Attacks and spells can't cross the portal. Contents drop out when the spell ends." },
    "Create Food and Water": { level: 3, time: "1 action", range: "30ft", comp: "V, S", dur: "Instant", desc: "You create 45 pounds of food and 30 gallons of fresh water within 30 ft, on the ground or in containers — enough for 15 creatures for 24 hours. The food is bland but nourishing and spoils after 24 hours if uneaten; the water is clean." },
    "Elemental Weapon": { level: 3, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 hour", desc: "A nonmagical weapon you touch becomes magical, gaining +1 to attack rolls and dealing an extra 1d4 damage of a chosen type (acid/cold/fire/lightning/thunder) on a hit. Using a higher-level slot: a level 5-6 slot grants +2/2d4; a level 7+ slot grants +3/3d4." },
    "Feign Death": { level: 3, time: "1 action", range: "Touch", comp: "V, S, M (a pinch of graveyard dirt)", dur: "1 hour", desc: "A willing touched creature appears dead to all inspection and detection, gaining the Blinded and Incapacitated conditions and Speed 0, along with Resistance to all damage except Psychic and Immunity to the Poisoned condition. Ritual." },
    "Glyph of Warding": { level: 3, time: "1 hour", range: "Touch", comp: "V, S, M (powdered diamond worth 200+ GP, which the spell consumes)", dur: "Until dispelled or triggered", desc: "Inscribe a hidden glyph (max 10ft diameter, on a surface or inside a closed object) with a trigger condition, as either an Explosive Rune (a 20ft-radius Sphere burst dealing 5d8 damage of one chosen type: acid/cold/fire/lightning/thunder, Dex save for half) or a Spell Glyph (store a prepared spell of 3rd level or lower, which triggers on the triggering creature or its location). Using a higher-level slot: Explosive Rune damage +1d8 per slot level above 3; a Spell Glyph can store a spell matching the slot level used." },
    "Leomund's Tiny Hut": { level: 3, time: "1 min or Ritual", range: "Self", comp: "V, S, M (a crystal bead)", dur: "8 hours", desc: "A 10ft Emanation of comfortable, weatherproof shelter surrounds you; creatures/objects inside when cast pass freely, all others are barred, and spells of level 3 or lower can't be cast through it. You can command dim light or darkness inside (no action). Can be cast as a Ritual." },
    "Meld into Stone": { level: 3, time: "1 action or Ritual", range: "Touch", comp: "V, S", dur: "8 hours", desc: "You step into stone you touch that can hold you, merging with your gear for up to 8 hours. You can't see outside, Perception checks to hear are made with Disadvantage, and you can cast spells on yourself. Using 5 ft of movement takes you out where you entered and ends the spell. If the stone is partly destroyed or reshaped you are expelled and take 6d6 Force damage (50 Force if it is destroyed), landing Prone. Ritual." },
    "Nondetection": { level: 3, time: "1 action", range: "Touch", comp: "V, S, M (a pinch of diamond dust worth 25+ GP, consumed)", dur: "8 hours", desc: "A willing creature, place, or object (max 10ft in any dimension) you touch can't be targeted by Divination spells or perceived through magical scrying sensors for the duration." },
    "Phantom Steed": { level: 3, time: "1 min or Ritual", range: "30ft", comp: "V, S", dur: "1 hour", desc: "A Large quasi-real horselike steed with saddle and tack appears within 30 ft for 1 hour. It uses the Riding Horse stat block but has a Speed of 100 ft (13 miles per hour); you or a creature you choose can ride it. The spell ends early if it takes any damage, and the rider gets 1 minute to dismount as it fades. Ritual." },
    "Remove Curse": { level: 3, time: "1 action", range: "Touch", comp: "V, S", dur: "Instant", desc: "All curses affecting one creature or object end. If the object is a cursed magic item, the curse remains but the item's Attunement to its owner breaks, allowing removal." },
    "Speak with Plants": { level: 3, time: "1 action", range: "Self (30ft emanation)", comp: "V, S", dur: "10 min", desc: "Plants in the emanation gain limited sentience, can communicate with you, and follow simple commands. You can question them about events in the area within the past day. You can turn plant-caused difficult terrain into normal terrain or vice versa for the duration." },
    "Summon Undead": { level: 3, time: "1 action", range: "90ft", comp: "V, S, M (a gilded skull worth 300+ GP)", dur: "Concentration, 1 hour", desc: "Summons an Undead Spirit (Ghostly, Putrid, or Skeletal form, chosen on cast) as an ally sharing your initiative, acting immediately after your turn. It obeys verbal commands or Dodges and avoids danger if none given; it disappears at 0 HP or when the spell ends. Using a higher-level slot: use the slot's level for the spirit's stat block." },
    "Vampiric Touch": { level: 3, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 1 min", desc: "Melee spell attack against a creature within reach: 3d6 Necrotic damage, and you regain HP equal to half the damage dealt. Until the spell ends, you can repeat the attack each turn as a Magic action, against the same or a different target. Using a higher-level slot: damage increases by 1d6 per slot level above 3." },
    "Charm Monster": { level: 4, time: "1 action", range: "30ft", comp: "V, S", dur: "1 hour", desc: "One creature you can see makes a Wisdom save (Advantage if you or allies are fighting it); on a failure it has the Charmed condition and is Friendly to you until the spell ends or you/allies damage it. It knows it was charmed once the spell ends. Using a higher-level slot: target one additional creature per slot level above 4." },
    "Compulsion": { level: 4, time: "1 action", range: "30ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Creatures you choose that can hear you make a Wisdom save (auto-success if immune to Charmed); on a failure, each affected target must use as much movement as possible in a direction you designate with a bonus action each turn, provoking Opportunity Attacks as normal. Concentration." },
    "Conjure Minor Elementals": { level: 4, time: "1 action", range: "Self (15ft emanation)", comp: "V, S", dur: "Concentration, 10 min", desc: "Elemental spirits flit around you in a 15ft emanation; your attacks that hit a creature in the emanation deal an extra 2d8 damage (Acid, Cold, Fire, or Lightning, your choice), and the ground there is Difficult Terrain for enemies. Using a higher-level slot: extra damage increases by 2d8 per slot level above 4. Concentration." },
    "Control Water": { level: 4, time: "1 action", range: "300ft", comp: "V, S, M (a mixture of water and dust)", dur: "Concentration, 10 min", desc: "Control water in a 100ft cube within range; choose Flood, Part Water, Redirect Flow, or Whirlpool, switching effects with a Magic action on later turns. Whirlpool forces a Strength save each turn or creatures are pulled 10ft toward the vortex's center and take 2d8 Bludgeoning damage. Concentration." },
    "Divination": { level: 4, time: "1 action or Ritual", range: "Self", comp: "V, S, M (incense and a sacrificial offering worth 25+ GP, consumed)", dur: "Instant", desc: "Contact a deity or servant to receive a truthful, if cryptic, answer about a goal, event, or activity within 7 days. Ritual." },
    "Evard's Black Tentacles": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (a tentacle)", dur: "Concentration, 1 min", desc: "Squirming tentacles fill a 20ft square, which becomes difficult terrain. Each creature there makes a Strength save, taking 3d6 Bludgeoning damage and becoming Restrained on a fail. A Restrained creature can retry the save (as an action, using Athletics vs your spell save DC) to escape." },
    "Fabricate": { level: 4, time: "10 minutes", range: "120ft", comp: "V, S", dur: "Instant", desc: "Convert raw materials into a finished product of the same material, up to Large size (a 10ft cube, or 8 connected 5ft cubes, for wood/hemp/flax/wool; a single 5ft cube max for metal/stone/mineral). Cannot create creatures or magic items; crafting weapons/armor requires your proficiency with the relevant Artisan's Tools." },
    "Fire Shield": { level: 4, time: "1 action", range: "Self", comp: "V, S, M (a bit of phosphorus or a firefly)", dur: "10 min", desc: "Wreathed in flames that shed bright light 10ft and dim light another 10ft; choose a warm shield (Resistance to Cold damage) or chill shield (Resistance to Fire damage). Any creature that hits you with a melee attack from within 5ft takes 2d8 Fire damage (warm) or 2d8 Cold damage (chill)." },
    "Fount of Moonlight": { level: 4, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 10 min", desc: "You glow, shedding bright light 20ft and dim light another 20ft, and gain Resistance to Radiant damage. Your melee attacks deal an extra 2d6 Radiant damage on a hit. When a visible creature within 60ft damages you, you can use your reaction to force a Constitution save on it; on a fail it is Blinded until the end of its next turn." },
    "Grasping Vine": { level: 4, time: "1 bonus action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "A vine sprouts from an unoccupied space in range. Make a melee spell attack against a creature within 30ft of the vine: 4d8 Bludgeoning damage on a hit, and the target is pulled up to 30ft toward the vine and becomes Grappled if Huge or smaller (escape DC = your spell save DC). As a bonus action on later turns, you can attack again with the vine. Using a higher-level slot: the vine can grapple one additional creature per slot level above 4." },
    "Hallucinatory Terrain": { level: 4, time: "10 minutes", range: "300ft", comp: "V, S, M (a mushroom)", dur: "24 hours", desc: "Natural terrain in a 150ft Cube looks, sounds, and smells like different natural terrain (manufactured structures, equipment, and creatures within are unaffected). Physical contact usually reveals the illusion; a creature can take the Study action and succeed on an Intelligence (Investigation) check against your spell save DC to see a vague image of the real terrain superimposed." },
    "Leomund's Secret Chest": { level: 4, time: "1 action", range: "Touch", comp: "V, S, M (a chest, 3ft by 2ft by 2ft, made from rare materials worth 5,000+ GP, and a Tiny replica of the same materials worth 50+ GP)", dur: "Instant", desc: "Touching both the chest and its Tiny replica sends the chest, holding up to 12 cubic feet of nonliving material, to the Ethereal Plane. Using a Magic action to touch the replica recalls the chest to within 5ft of you; touching both again sends it back. After 60 days, there is a cumulative 5% chance per day that the spell ends; it also ends if cast again or if the replica is destroyed." },
    "Locate Creature": { level: 4, time: "1 action", range: "Self", comp: "V, S, M (a bit of fur from a bloodhound)", dur: "Concentration, 1 hour", desc: "Sense the direction to a named or described familiar creature (or creature type) within 1,000ft, blocked by running water and ineffective across planes or against a target warded by Nondetection or similar. Ends early if the target leaves range." },
    "Mordenkainen's Faithful Hound": { level: 4, time: "1 action", range: "30ft", comp: "V, S, M (a silver whistle)", dur: "8 hours", desc: "An invisible (to others), intangible, invulnerable phantom watchdog guards a point in range and barks if a Small or larger creature (other than you or creatures you designate) comes within 30ft. On your turn, you can have it bite an intruder within 5ft of it: +8 to hit, 4d8 piercing damage. Ends early if you and the hound end up more than 300ft apart." },
    "Mordenkainen's Private Sanctum": { level: 4, time: "10 min", range: "120ft", comp: "V, S, M (a thin sheet of lead)", dur: "24 hours", desc: "Wards a cube (5-100ft per side) you designate within range; choose any combination of effects: sounds can't pass its boundary, it appears dark/windowless from outside, creatures scrying into it see/hear nothing, teleportation and planar travel into/out of it are blocked, and creatures/objects within can't be seen or located by anything outside. Using a higher-level slot: at 6th level or higher, the duration becomes Until dispelled and no material component is required." },
    "Otiluke's Resilient Sphere": { level: 4, time: "1 action", range: "30ft", comp: "V, S, M (a glass sphere)", dur: "Concentration, 1 min", desc: "Encloses a Large or smaller creature or object within range in an impervious shimmering sphere; an unwilling creature makes a Dexterity save to avoid being enclosed. Nothing can pass through the sphere in or out, it's immune to all damage, and it can be picked up and moved (it weighs 1lb)." },
    "Phantasmal Killer": { level: 4, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Target makes a Wisdom save, taking 4d10 psychic damage and gaining Disadvantage on ability checks and attack rolls on a fail (half damage and no disadvantage, ending the spell, on success). At the end of each of its turns, the target repeats the save, taking the damage again on a fail or ending the spell on a success. Using a higher-level slot: damage increases by 1d10 for each slot level above 4." },
    "Stone Shape": { level: 4, time: "1 action", range: "Touch", comp: "V, S, M (soft clay)", dur: "Instant", desc: "Touch a stone object of Medium size or smaller, or a section of stone up to 5ft in any dimension, and reshape it into any form you like (weapon, statue, coffer, passage through a 5ft-thick wall, etc.). Up to two hinges and a latch can be included; no fine mechanisms." },
    "Summon Construct": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (a lockbox worth 400+ GP)", dur: "Concentration, 1 hour", desc: "Summons a Construct Spirit (Clay, Metal, or Stone, chosen on cast) as an ally sharing your initiative, acting immediately after your turn. It obeys verbal commands or Dodges and avoids danger if none given; it disappears at 0 HP or when the spell ends. Using a higher-level slot: use the slot's level for the spirit's stat block." },
    "Summon Elemental": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (air, a pebble, ash, and water in a gold-inlaid vial worth 400+ GP)", dur: "Concentration, 1 hour", desc: "Summons an Elemental Spirit (Air, Earth, Fire, or Water, chosen on cast) as an ally sharing your initiative, acting immediately after your turn. It obeys verbal commands or Dodges and avoids danger if none given; it disappears at 0 HP or when the spell ends. Using a higher-level slot: use the slot's level for the spirit's stat block." },
    "Vitriolic Sphere": { level: 4, time: "1 action", range: "150ft", comp: "V, S, M (a drop of bile)", dur: "Instant", desc: "A ball of acid explodes in a 20ft-radius sphere. Each creature in the area makes a Dexterity save, taking 10d4 Acid damage and another 5d4 Acid damage at the end of its next turn on a failure, or half the initial damage only on a success. Using a higher-level slot: initial damage increases by 2d4 per slot level above 4." },
    "Antilife Shell": { level: 5, time: "1 action", range: "Self (10ft emanation)", comp: "V, S", dur: "Concentration, 1 hour", desc: "A 10ft emanation prevents creatures other than Constructs and Undead from passing or reaching through it; affected creatures can still attack or cast spells through it. Concentration." },
    "Awaken": { level: 5, time: "8 hours", range: "Touch", comp: "V, S, M (an agate worth 1,000+ GP, consumed)", dur: "Instant", desc: "Touch a Beast or Plant creature with Intelligence 3 or less; it gains Intelligence 10 and can speak one language you know. It has the Charmed condition toward you for 30 days or until you or your allies damage it." },
    "Bigby's Hand": { level: 5, time: "1 action", range: "120ft", comp: "V, S, M (an eggshell and a glove)", dur: "Concentration, 1 minute", desc: "Creates a Large hand of shimmering force (AC 20, HP = your HP max) that can Clench (2d8 force damage, Strength save or Grappled), Forceful Push (2d8 force damage, Strength save or pushed 5ft and knocked Prone), Grasping (Strength save or Restrained, taking 2d8 force each turn), or interpose as a shield (+4 AC to you). Using a higher-level slot: clench/push/grasp damage increases by 2d8 per slot level above 5. Concentration." },
    "Circle of Power": { level: 5, time: "1 action", range: "Self (30ft emanation)", comp: "V", dur: "Concentration, 10 min", desc: "You and allies in the 30ft emanation have Advantage on saving throws against spells and other magical effects, and take no damage on a successful save that would normally halve damage. Concentration." },
    "Commune with Nature": { level: 5, time: "1 minute or Ritual", range: "Self", comp: "V, S", dur: "Instant", desc: "Gain knowledge of the terrain, plants, minerals, bodies of water, and creatures within 3 miles outdoors (300ft underground); you learn up to 3 facts of your choice. Ritual." },
    "Contact Other Plane": { level: 5, time: "1 minute or Ritual", range: "Self", comp: "V", dur: "1 minute", desc: "Make a DC 15 Intelligence save; on a success, ask an otherworldly entity up to 5 one-word-answer questions within the duration. On a failure, take 6d6 Psychic damage and gain the Incapacitated condition until you finish a Long Rest. Ritual." },
    "Dispel Evil and Good": { level: 5, time: "1 action", range: "Self", comp: "V, S, M (powdered silver and iron)", dur: "Concentration, 1 min", desc: "Celestials, Elementals, Fey, Fiends, and Undead have Disadvantage on attack rolls against you for the duration. You can use a Magic action to end the spell early and either Break Enchantment (end possession/Charmed/Frightened from such creatures on a touched target) or attempt Dismissal (target within 5ft makes a Charisma save or is banished to its home plane). Concentration." },
    "Dream": { level: 5, time: "1 minute", range: "Special", comp: "V, S, M (a handful of sand)", dur: "8 hours", desc: "You or a willing messenger creature enter a trance and become Incapacitated with Speed 0. The messenger appears in the dreams of a known creature on the same plane if it sleeps, allowing conversation and shaping of the dream (if awake, the messenger can wait or end the spell). Optionally deliver a message of up to 10 words and force a Wisdom save; on fail the target gains no rest benefit and takes 3d6 Psychic damage on waking." },
    "Flame Strike": { level: 5, time: "1 action", range: "60ft", comp: "V, S, M (a pinch of sulfur)", dur: "Instant", desc: "Each creature in a 10ft-radius, 40ft-high Cylinder centered on a point in range makes a Dexterity save, taking 5d6 Fire damage and 5d6 Radiant damage on a fail, half as much on success. Using a higher-level slot: Fire and Radiant damage each +1d6 per slot level above 5." },
    "Geas": { level: 5, time: "1 minute", range: "60ft", comp: "V", dur: "30 days", desc: "A creature within range makes a Wisdom save or becomes Charmed by you for the duration. While Charmed, acting against your verbal command deals 5d10 Psychic damage to it (max once per day); it can't be commanded to certain death. Ends early if you or the target dies, or if Remove Curse, Greater Restoration, or Wish is cast on the target. Using a higher-level slot: a level 7-8 slot extends duration to 365 days; a level 9 slot makes it last until dispelled by one of those spells." },
    "Hallow": { level: 5, time: "24 hours", range: "Touch", comp: "V, S, M (incense worth 1,000+ GP, which the spell consumes)", dur: "Until dispelled", desc: "Sanctify a location up to 60ft radius: creatures of a chosen type can't enter it willingly, and possession, Charm, and Fear effects on such creatures already there end. Bind one additional effect to the area: Courage, Darkness, Daylight, Peaceful Rest, Extradimensional Interference, Fear, Resistance, Silence, Tongues, or Vulnerability." },
    "Jallarzi's Storm of Radiance": { level: 5, time: "1 action", range: "120ft", comp: "V, S, M (a pinch of phosphorus)", dur: "Concentration, 1 min", desc: "A 10ft-radius, 40ft-high Cylinder of flashing light and thunder appears; creatures inside have the Blinded and Deafened conditions and can't cast spells with a Verbal component. On appearance, and when a creature enters the area or starts/ends its turn there (max once per turn per creature), it makes a Constitution save, taking 2d10 Radiant damage and 2d10 Thunder damage on a fail, half as much on success. Using a higher-level slot: Radiant and Thunder damage each +1d10 per slot level above 5." },
    "Legend Lore": { level: 5, time: "10 minutes", range: "Self", comp: "V, S, M (incense worth 250+ GP, which the spell consumes, and four ivory strips worth 50+ GP each)", dur: "Instant", desc: "Name or describe a person, place, or object; if it's significant enough, you learn a brief summary of important lore about it, which the DM may deliver cryptically or in verse. If the subject isn't famous enough, the spell fails (with a short, sad musical note)." },
    "Mislead": { level: 5, time: "1 action", range: "Self", comp: "S", dur: "Concentration, 1 hour", desc: "You gain the Invisible condition as an illusory double appears in your space; invisibility ends immediately if you attack, deal damage, or cast a spell. As a Magic action, move the double up to twice your Speed and make it gesture, speak, and behave as you choose." },
    "Modify Memory": { level: 5, time: "1 action", range: "30ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Target makes a Wisdom save (with advantage if you're fighting it); on a fail it has the Charmed condition for the duration, and while charmed you can alter its memory of one event it experienced in the last 24 hours (max 10 min of experience), the change taking effect when concentration ends." },
    "Passwall": { level: 5, time: "1 action", range: "30ft", comp: "V, S, M (a pinch of sesame seeds)", dur: "1 hour", desc: "Creates a passage through a wooden, plaster, or stone surface, up to 5ft wide, 8ft tall, and 20ft deep, dimensions of your choice. Using a higher-level slot: width and height each increase by 5ft, and depth by 10ft, for each slot level above 5." },
    "Planar Binding": { level: 5, time: "1 hour", range: "60ft", comp: "V, S, M (a jewel worth 1,000+ GP, consumed)", dur: "24 hours", desc: "Attempt to bind a Celestial, Elemental, Fey, or Fiend within range to service; it makes a Charisma save (with Disadvantage if you know its true name), and on a fail it is bound to serve you for the duration, unable to willingly move more than 60ft from you and forced to fight on your side. Using a higher-level slot: duration becomes 10 days (6th level), 30 days (7th), 180 days (8th), or 366 days (9th)." },
    "Rary's Telepathic Bond": { level: 5, time: "1 action or Ritual", range: "30ft", comp: "V, S, M (two eggs)", dur: "1 hour", desc: "Forges a telepathic link among up to 8 willing creatures within range; linked creatures can communicate telepathically through the bond over any distance (not across planes) regardless of shared language, for the duration. Can be cast as a Ritual." },
    "Reincarnate": { level: 5, time: "1 hour", range: "Touch", comp: "V, S, M (rare oils worth 1,000+ GP, consumed)", dur: "Instant", desc: "Touch a dead Humanoid (dead no longer than 10 days) or a piece of one. Forms a new body and calls the soul into it. Roll 1d10 to determine the new species (or DM chooses). The creature recalls its former life and retains its capabilities but loses its old species traits and gains the new species' traits." },
    "Summon Dragon": { level: 5, time: "1 action", range: "60ft", comp: "V, S, M (an object engraved with a dragon's image worth 500+ GP)", dur: "Concentration, 1 hour", desc: "Summons a Draconic Spirit as an ally sharing your initiative, acting immediately after your turn. It obeys verbal commands or Dodges and avoids danger if none given; it disappears at 0 HP or when the spell ends. Using a higher-level slot: use the slot's level for the spirit's stat block." },
    "Tree Stride": { level: 5, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 1 min", desc: "You can enter a tree and move to another tree of the same kind within 500ft, using 5ft of movement to enter and another 5ft to appear within 5ft of the destination tree. You know the location of all such trees within 500ft. Usable once per turn; you must end each turn outside a tree." },
    "Yolande's Regal Presence": { level: 5, time: "1 action", range: "Self (10ft emanation)", comp: "V, S, M (a miniature tiara)", dur: "Concentration, 1 min", desc: "Whenever the emanation enters a visible creature's space, or a visible creature enters it or ends its turn there, you can force a Wisdom save (once per turn per creature). On a failure, the target takes 4d6 Psychic damage, falls Prone, and can be pushed up to 10ft; on a success, half damage only." },
    "Drawmij's Instant Summons": { level: 6, time: "1 minute", range: "Touch", comp: "V, S, M (a sapphire worth 1,000+ GP)", dur: "Until dispelled", desc: "Mark an object (10 lb or less, max 6ft dimension) with the sapphire. Later, use a Magic action to speak its name and crush the sapphire to make the object appear in your hand from any distance. If another creature possesses it, you instead learn its holder and location. Ritual." },
    "Otiluke's Freezing Sphere": { level: 6, time: "1 action", range: "300ft", comp: "V, S, M (a miniature crystal sphere)", dur: "Instant", desc: "A frigid globe explodes in a 60ft-radius Sphere; each creature there makes a Constitution save, taking 10d6 cold damage on a fail (half on success). If the sphere strikes water, that water freezes into fragile ice for 1 min, trapping creatures within. Using a higher-level slot: damage increases by 1d6 for each slot level above 6." },
    "Summon Fiend": { level: 6, time: "1 action", range: "90ft", comp: "V, S, M (a bloody vial worth 600+ GP)", dur: "Concentration, 1 hour", desc: "Summons a Fiendish Spirit (Demon, Devil, or Yugoloth, chosen on cast) as an ally sharing your initiative, acting immediately after your turn. It obeys verbal commands or Dodges and avoids danger if none given; it disappears at 0 HP or when the spell ends. Using a higher-level slot: use the slot's level for the spirit's stat block." },
    "Tasha's Bubbling Cauldron": { level: 6, time: "1 action", range: "5ft", comp: "V, S, M (a gilded ladle worth 500+ GP)", dur: "10 min", desc: "Conjures a cauldron within 5ft of you filled with liquid duplicating a Common or Uncommon potion of your choice. As a Bonus Action, you or an ally can withdraw one potion; the cauldron yields a number of potions equal to your spellcasting ability modifier (min 1), then disappears. Unconsumed potions vanish when you cast this spell again." },
    "Wall of Ice": { level: 6, time: "1 action", range: "120ft", comp: "V, S, M (a piece of quartz)", dur: "Concentration, 10 min", desc: "Creates a 1ft-thick wall of ice: a dome/globe of up to 10ft radius, or ten contiguous 10ft-square panels. A creature caught in the wall's space is pushed aside and makes a Dexterity save, taking 10d6 Cold damage on a failure or half on a success. Each 10ft section has AC 12, 30 HP, Immunity to Cold/Poison/Psychic, Vulnerability to Fire; destroying a section leaves frigid air that deals 5d6 Cold damage (Constitution save for half) to a creature passing through it for the first time on a turn. Using a higher-level slot: initial damage increases by 2d6 and frigid-air damage by 1d6 per slot level above 6." },
    "Mordenkainen's Sword": { level: 7, time: "1 action", range: "90ft", comp: "V, S, M (a miniature sword worth 250+ GP)", dur: "Concentration, 1 min", desc: "Melee spell attack against a target within 5ft of the conjured spectral sword: on a hit, 4d12 force damage plus your spellcasting ability modifier. As a Bonus Action on later turns, move the sword up to 30ft to a spot you can see and repeat the attack against the same or a different target." },
    "Telepathy": { level: 8, time: "1 action", range: "Unlimited", comp: "V, S, M (a pair of linked silver rings)", dur: "24 hours", desc: "Creates a telepathic link with a willing, familiar creature anywhere on the same plane; ends if either of you changes plane. You and the target can instantly share words, images, sounds, and other sensory messages, and the target understands your meaning regardless of language." },
    "Weird": { level: 9, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Each creature you choose in a 30ft-radius sphere makes a Wisdom save, taking 10d10 Psychic damage and gaining the Frightened condition on a failure, or half damage only on a success. A Frightened target saves again at the end of each of its turns, taking 5d10 Psychic damage on a failure or ending the spell on itself on a success." },
};

// ===== SPELLS (class lists with name strings) =====
DATA.spells = {
    sorcerer: {
        0: ["Acid Splash","Blade Ward","Chill Touch","Dancing Lights","Elementalism","Fire Bolt","Friends","Light","Mage Hand","Mending","Message","Mind Sliver","Minor Illusion","Poison Spray","Prestidigitation","Ray of Frost","Shocking Grasp","Sorcerous Burst","Thunderclap","True Strike"],
        1: ["Burning Hands","Charm Person","Chromatic Orb","Color Spray","Comprehend Languages","Detect Magic","Disguise Self","Expeditious Retreat","False Life","Feather Fall","Fog Cloud","Grease","Ice Knife","Jump","Mage Armor","Magic Missile","Ray of Sickness","Shield","Silent Image","Sleep","Thunderwave","Witch Bolt"],
        2: ["Alter Self","Arcane Vigor","Blindness/Deafness","Blur","Cloud of Daggers","Crown of Madness","Darkness","Darkvision","Detect Thoughts","Dragon's Breath","Enhance Ability","Enlarge/Reduce","Flame Blade","Flaming Sphere","Gust of Wind","Hold Person","Invisibility","Knock","Levitate","Magic Weapon","Mind Spike","Mirror Image","Misty Step","Phantasmal Force","Scorching Ray","See Invisibility","Shatter","Spider Climb","Suggestion","Web"],
        3: ["Blink","Clairvoyance","Counterspell","Daylight","Dispel Magic","Fear","Fireball","Fly","Gaseous Form","Haste","Hypnotic Pattern","Lightning Bolt","Major Image","Protection from Energy","Sleet Storm","Slow","Stinking Cloud","Tongues","Vampiric Touch","Water Breathing","Water Walk"],
        4: ["Banishment","Blight","Charm Monster","Confusion","Dimension Door","Dominate Beast","Fire Shield","Greater Invisibility","Ice Storm","Polymorph","Stoneskin","Vitriolic Sphere","Wall of Fire"],
        5: ["Animate Objects","Bigby's Hand","Cloudkill","Cone of Cold","Creation","Dominate Person","Hold Monster","Insect Plague","Seeming","Synaptic Static","Telekinesis","Teleportation Circle","Wall of Stone"],
        6: ["Arcane Gate","Chain Lightning","Circle of Death","Disintegrate","Eyebite","Flesh to Stone","Globe of Invulnerability","Mass Suggestion","Move Earth","Otiluke's Freezing Sphere","Sunbeam","True Seeing"],
        7: ["Delayed Blast Fireball","Etherealness","Finger of Death","Fire Storm","Plane Shift","Prismatic Spray","Reverse Gravity","Teleport"],
        8: ["Demiplane","Dominate Monster","Earthquake","Incendiary Cloud","Power Word Stun","Sunburst"],
        9: ["Gate","Meteor Swarm","Power Word Kill","Time Stop","Wish"]
    },

    wizard: {
        0: ["Acid Splash","Blade Ward","Chill Touch","Dancing Lights","Elementalism","Fire Bolt","Friends","Light","Mage Hand","Mending","Message","Mind Sliver","Minor Illusion","Poison Spray","Prestidigitation","Ray of Frost","Shocking Grasp","Thunderclap","Toll the Dead","True Strike"],
        1: ["Alarm","Burning Hands","Charm Person","Chromatic Orb","Color Spray","Comprehend Languages","Detect Magic","Disguise Self","Expeditious Retreat","False Life","Feather Fall","Find Familiar","Fog Cloud","Grease","Ice Knife","Identify","Illusory Script","Jump","Longstrider","Mage Armor","Magic Missile","Protection from Evil and Good","Ray of Sickness","Shield","Silent Image","Sleep","Tasha's Hideous Laughter","Tenser's Floating Disk","Thunderwave","Unseen Servant","Witch Bolt"],
        2: ["Alter Self","Arcane Lock","Arcane Vigor","Augury","Blindness/Deafness","Blur","Cloud of Daggers","Continual Flame","Crown of Madness","Darkness","Darkvision","Detect Thoughts","Dragon's Breath","Enhance Ability","Enlarge/Reduce","Flaming Sphere","Gentle Repose","Gust of Wind","Hold Person","Invisibility","Knock","Levitate","Locate Object","Magic Mouth","Magic Weapon","Melf's Acid Arrow","Mind Spike","Mirror Image","Misty Step","Nystul's Magic Aura","Phantasmal Force","Ray of Enfeeblement","Rope Trick","Scorching Ray","See Invisibility","Shatter","Spider Climb","Suggestion","Web"],
        3: ["Animate Dead","Bestow Curse","Blink","Clairvoyance","Counterspell","Dispel Magic","Fear","Feign Death","Fireball","Fly","Gaseous Form","Glyph of Warding","Haste","Hypnotic Pattern","Leomund's Tiny Hut","Lightning Bolt","Magic Circle","Major Image","Nondetection","Phantom Steed","Protection from Energy","Remove Curse","Sending","Sleet Storm","Slow","Speak with Dead","Stinking Cloud","Summon Fey","Summon Undead","Tongues","Vampiric Touch","Water Breathing"],
        4: ["Arcane Eye","Banishment","Blight","Charm Monster","Confusion","Conjure Minor Elementals","Control Water","Dimension Door","Divination","Evard's Black Tentacles","Fabricate","Fire Shield","Greater Invisibility","Hallucinatory Terrain","Ice Storm","Leomund's Secret Chest","Locate Creature","Mordenkainen's Faithful Hound","Mordenkainen's Private Sanctum","Otiluke's Resilient Sphere","Phantasmal Killer","Polymorph","Stone Shape","Stoneskin","Summon Aberration","Summon Construct","Summon Elemental","Vitriolic Sphere","Wall of Fire"],
        5: ["Animate Objects","Bigby's Hand","Circle of Power","Cloudkill","Cone of Cold","Conjure Elemental","Contact Other Plane","Creation","Dominate Person","Dream","Geas","Hold Monster","Jallarzi's Storm of Radiance","Legend Lore","Mislead","Modify Memory","Passwall","Planar Binding","Rary's Telepathic Bond","Scrying","Seeming","Steel Wind Strike","Summon Dragon","Synaptic Static","Telekinesis","Teleportation Circle","Wall of Force","Wall of Stone","Yolande's Regal Presence"],
        6: ["Arcane Gate","Chain Lightning","Circle of Death","Contingency","Create Undead","Disintegrate","Drawmij's Instant Summons","Eyebite","Flesh to Stone","Globe of Invulnerability","Guards and Wards","Magic Jar","Mass Suggestion","Move Earth","Otiluke's Freezing Sphere","Otto's Irresistible Dance","Programmed Illusion","Summon Fiend","Sunbeam","Tasha's Bubbling Cauldron","True Seeing","Wall of Ice"],
        7: ["Delayed Blast Fireball","Etherealness","Finger of Death","Forcecage","Mirage Arcane","Mordenkainen's Magnificent Mansion","Mordenkainen's Sword","Plane Shift","Prismatic Spray","Project Image","Reverse Gravity","Sequester","Simulacrum","Symbol","Teleport"],
        8: ["Antimagic Field","Antipathy/Sympathy","Befuddlement","Clone","Control Weather","Demiplane","Dominate Monster","Incendiary Cloud","Maze","Mind Blank","Power Word Stun","Sunburst","Telepathy"],
        9: ["Astral Projection","Foresight","Gate","Imprisonment","Meteor Swarm","Power Word Kill","Prismatic Wall","Shapechange","Time Stop","True Polymorph","Weird","Wish"]
    },

    bard: {
        0: ["Blade Ward","Dancing Lights","Friends","Light","Mage Hand","Mending","Message","Minor Illusion","Prestidigitation","Starry Wisp","Thunderclap","True Strike","Vicious Mockery"],
        1: ["Animal Friendship","Bane","Charm Person","Color Spray","Command","Comprehend Languages","Cure Wounds","Detect Magic","Disguise Self","Dissonant Whispers","Faerie Fire","Feather Fall","Healing Word","Heroism","Identify","Illusory Script","Longstrider","Silent Image","Sleep","Speak with Animals","Tasha's Hideous Laughter","Thunderwave","Unseen Servant"],
        2: ["Aid","Animal Messenger","Blindness/Deafness","Calm Emotions","Cloud of Daggers","Crown of Madness","Detect Thoughts","Enhance Ability","Enlarge/Reduce","Enthrall","Heat Metal","Hold Person","Invisibility","Knock","Lesser Restoration","Locate Animals or Plants","Locate Object","Magic Mouth","Mirror Image","Phantasmal Force","See Invisibility","Shatter","Silence","Suggestion","Zone of Truth"],
        3: ["Bestow Curse","Clairvoyance","Dispel Magic","Fear","Feign Death","Glyph of Warding","Hypnotic Pattern","Leomund's Tiny Hut","Major Image","Mass Healing Word","Nondetection","Plant Growth","Sending","Slow","Speak with Dead","Speak with Plants","Stinking Cloud","Tongues"],
        4: ["Charm Monster","Compulsion","Confusion","Dimension Door","Fount of Moonlight","Freedom of Movement","Greater Invisibility","Hallucinatory Terrain","Locate Creature","Phantasmal Killer","Polymorph"],
        5: ["Animate Objects","Awaken","Dominate Person","Dream","Geas","Greater Restoration","Hold Monster","Legend Lore","Mass Cure Wounds","Mislead","Modify Memory","Planar Binding","Raise Dead","Rary's Telepathic Bond","Scrying","Seeming","Synaptic Static","Teleportation Circle","Yolande's Regal Presence"],
        6: ["Eyebite","Find the Path","Guards and Wards","Heroes' Feast","Mass Suggestion","Otto's Irresistible Dance","Programmed Illusion","True Seeing"],
        7: ["Etherealness","Forcecage","Mirage Arcane","Mordenkainen's Magnificent Mansion","Mordenkainen's Sword","Power Word Fortify","Prismatic Spray","Project Image","Regenerate","Resurrection","Symbol","Teleport"],
        8: ["Antipathy/Sympathy","Befuddlement","Dominate Monster","Glibness","Mind Blank","Power Word Stun"],
        9: ["Foresight","Power Word Heal","Power Word Kill","Prismatic Wall","True Polymorph"]
    },

    cleric: {
        0: ["Guidance","Light","Mending","Resistance","Sacred Flame","Spare the Dying","Thaumaturgy","Toll the Dead","Word of Radiance"],
        1: ["Bane","Bless","Command","Create or Destroy Water","Cure Wounds","Detect Evil and Good","Detect Magic","Detect Poison and Disease","Guiding Bolt","Healing Word","Inflict Wounds","Protection from Evil and Good","Purify Food and Drink","Sanctuary","Shield of Faith"],
        2: ["Aid","Augury","Blindness/Deafness","Calm Emotions","Continual Flame","Enhance Ability","Find Traps","Gentle Repose","Hold Person","Lesser Restoration","Locate Object","Prayer of Healing","Protection from Poison","Silence","Spiritual Weapon","Warding Bond","Zone of Truth"],
        3: ["Animate Dead","Aura of Vitality","Beacon of Hope","Bestow Curse","Clairvoyance","Create Food and Water","Daylight","Dispel Magic","Feign Death","Glyph of Warding","Magic Circle","Mass Healing Word","Meld into Stone","Protection from Energy","Remove Curse","Revivify","Sending","Speak with Dead","Spirit Guardians","Tongues","Water Walk"],
        4: ["Aura of Life","Aura of Purity","Banishment","Control Water","Death Ward","Divination","Freedom of Movement","Guardian of Faith","Locate Creature","Stone Shape"],
        5: ["Circle of Power","Commune","Contagion","Dispel Evil and Good","Flame Strike","Geas","Greater Restoration","Hallow","Insect Plague","Legend Lore","Mass Cure Wounds","Planar Binding","Raise Dead","Scrying","Summon Celestial"],
        6: ["Blade Barrier","Create Undead","Find the Path","Forbiddance","Harm","Heal","Heroes' Feast","Planar Ally","Sunbeam","True Seeing","Word of Recall"],
        7: ["Conjure Celestial","Divine Word","Etherealness","Fire Storm","Plane Shift","Power Word Fortify","Regenerate","Resurrection","Symbol"],
        8: ["Antimagic Field","Control Weather","Earthquake","Holy Aura","Sunburst"],
        9: ["Astral Projection","Gate","Mass Heal","Power Word Heal","True Resurrection"]
    },

    druid: {
        0: ["Druidcraft","Elementalism","Guidance","Mending","Message","Poison Spray","Produce Flame","Resistance","Shillelagh","Spare the Dying","Starry Wisp","Thorn Whip","Thunderclap"],
        1: ["Animal Friendship","Charm Person","Create or Destroy Water","Cure Wounds","Detect Magic","Detect Poison and Disease","Entangle","Faerie Fire","Fog Cloud","Goodberry","Healing Word","Ice Knife","Jump","Longstrider","Protection from Evil and Good","Purify Food and Drink","Speak with Animals","Thunderwave"],
        2: ["Aid","Animal Messenger","Augury","Barkskin","Beast Sense","Continual Flame","Darkvision","Enhance Ability","Enlarge/Reduce","Find Traps","Flame Blade","Flaming Sphere","Gust of Wind","Heat Metal","Hold Person","Lesser Restoration","Locate Animals or Plants","Locate Object","Moonbeam","Pass Without Trace","Protection from Poison","Spike Growth","Summon Beast"],
        3: ["Aura of Vitality","Call Lightning","Conjure Animals","Daylight","Dispel Magic","Elemental Weapon","Feign Death","Meld into Stone","Plant Growth","Protection from Energy","Revivify","Sleet Storm","Speak with Plants","Summon Fey","Water Breathing","Water Walk","Wind Wall"],
        4: ["Blight","Charm Monster","Confusion","Conjure Minor Elementals","Conjure Woodland Beings","Control Water","Divination","Dominate Beast","Fire Shield","Fount of Moonlight","Freedom of Movement","Giant Insect","Grasping Vine","Hallucinatory Terrain","Ice Storm","Locate Creature","Polymorph","Stone Shape","Stoneskin","Summon Elemental","Wall of Fire"],
        5: ["Antilife Shell","Awaken","Commune with Nature","Cone of Cold","Conjure Elemental","Contagion","Geas","Greater Restoration","Insect Plague","Mass Cure Wounds","Planar Binding","Reincarnate","Scrying","Tree Stride","Wall of Stone"],
        6: ["Conjure Fey","Find the Path","Flesh to Stone","Heal","Heroes' Feast","Move Earth","Sunbeam","Transport via Plants","Wall of Thorns","Wind Walk"],
        7: ["Fire Storm","Mirage Arcane","Plane Shift","Regenerate","Reverse Gravity","Symbol"],
        8: ["Animal Shapes","Antipathy/Sympathy","Befuddlement","Control Weather","Earthquake","Incendiary Cloud","Sunburst","Tsunami"],
        9: ["Foresight","Shapechange","Storm of Vengeance","True Resurrection"]
    },

    ranger: {
        1: ["Alarm","Animal Friendship","Cure Wounds","Detect Magic","Detect Poison and Disease","Ensnaring Strike","Entangle","Fog Cloud","Goodberry","Hail of Thorns","Hunter's Mark","Jump","Longstrider","Speak with Animals"],
        2: ["Aid","Animal Messenger","Barkskin","Beast Sense","Cordon of Arrows","Darkvision","Enhance Ability","Find Traps","Gust of Wind","Lesser Restoration","Locate Animals or Plants","Locate Object","Magic Weapon","Pass Without Trace","Protection from Poison","Silence","Spike Growth","Summon Beast"],
        3: ["Conjure Animals","Conjure Barrage","Daylight","Dispel Magic","Elemental Weapon","Lightning Arrow","Meld into Stone","Nondetection","Plant Growth","Protection from Energy","Revivify","Speak with Plants","Summon Fey","Water Breathing","Water Walk","Wind Wall"],
        4: ["Conjure Woodland Beings","Dominate Beast","Freedom of Movement","Grasping Vine","Locate Creature","Stoneskin","Summon Elemental"],
        5: ["Commune with Nature","Conjure Volley","Greater Restoration","Steel Wind Strike","Swift Quiver","Tree Stride"]
    },

    paladin: {
        1: ["Bless","Command","Compelled Duel","Cure Wounds","Detect Evil and Good","Detect Magic","Detect Poison and Disease","Divine Favor","Divine Smite","Heroism","Protection from Evil and Good","Purify Food and Drink","Searing Smite","Shield of Faith","Thunderous Smite","Wrathful Smite"],
        2: ["Aid","Find Steed","Gentle Repose","Lesser Restoration","Locate Object","Magic Weapon","Prayer of Healing","Protection from Poison","Shining Smite","Warding Bond","Zone of Truth"],
        3: ["Aura of Vitality","Blinding Smite","Create Food and Water","Crusader's Mantle","Daylight","Dispel Magic","Elemental Weapon","Magic Circle","Remove Curse","Revivify"],
        4: ["Aura of Life","Aura of Purity","Banishment","Death Ward","Locate Creature","Staggering Smite"],
        5: ["Banishing Smite","Circle of Power","Destructive Wave","Dispel Evil and Good","Geas","Greater Restoration","Raise Dead","Summon Celestial"]
    },

    warlock: {
        0: ["Blade Ward","Chill Touch","Eldritch Blast","Friends","Mage Hand","Mind Sliver","Minor Illusion","Poison Spray","Prestidigitation","Thunderclap","Toll the Dead","True Strike"],
        1: ["Armor of Agathys","Arms of Hadar","Bane","Charm Person","Comprehend Languages","Detect Magic","Expeditious Retreat","Hellish Rebuke","Hex","Illusory Script","Protection from Evil and Good","Speak with Animals","Tasha's Hideous Laughter","Unseen Servant","Witch Bolt"],
        2: ["Cloud of Daggers","Crown of Madness","Darkness","Enthrall","Hold Person","Invisibility","Mind Spike","Mirror Image","Misty Step","Ray of Enfeeblement","Spider Climb","Suggestion"],
        3: ["Counterspell","Dispel Magic","Fear","Fly","Gaseous Form","Hunger of Hadar","Hypnotic Pattern","Magic Circle","Major Image","Remove Curse","Summon Fey","Summon Undead","Tongues","Vampiric Touch"],
        4: ["Banishment","Blight","Charm Monster","Dimension Door","Hallucinatory Terrain","Summon Aberration"],
        5: ["Contact Other Plane","Dream","Hold Monster","Jallarzi's Storm of Radiance","Mislead","Planar Binding","Scrying","Synaptic Static","Teleportation Circle"],
        6: ["Arcane Gate","Circle of Death","Create Undead","Eyebite","Summon Fiend","Tasha's Bubbling Cauldron","True Seeing"],
        7: ["Etherealness","Finger of Death","Forcecage","Plane Shift"],
        8: ["Befuddlement","Demiplane","Dominate Monster","Glibness","Power Word Stun"],
        9: ["Astral Projection","Foresight","Gate","Imprisonment","Power Word Kill","True Polymorph","Weird"]
    }
};

// ============================================================
// LEVELING UP subproject (Metadocs/LevelingUp/) — 2024 PHB
// ============================================================

// 2024 prepared-spells maximum: FIXED table per class level (replaces the 2014
// ability-mod + level formula). Index = character level; verified L1-3 only —
// levels beyond the array length fall back to the legacy formula in
// getMaxPrepared() until fase F extends these.
DATA.preparedTable = {
    // 2024 PHB fixed prepared-spells columns. L1-3 verified via class research;
    // L4-5 added 2026-08-04 from the 2024 tables (spot-check PHB). Levels beyond
    // the array fall back to the legacy formula in getMaxPrepared().
    wizard:   [0, 4, 5, 6, 7, 9],
    sorcerer: [0, 2, 4, 6, 7, 9],
    druid:    [0, 4, 5, 6, 7, 9],
    cleric:   [0, 4, 5, 6, 7, 9],
    bard:     [0, 4, 5, 6, 7, 9],
    warlock:  [0, 2, 3, 4, 5, 6],
    // 2024 PHB: half-casters cast from L1 (2 prepared). The earlier aidedd
    // values ([-,2,3] / [-,3,4]) matched the 2014 start-at-L2 layout and
    // contradicted the verified class research — spot-check PHB.
    paladin:  [0, 2, 3, 4, 5, 6],
    ranger:   [0, 2, 3, 4, 5, 6]
};

// #P0hwaBZ — Third casters (Eldritch Knight / Arcane Trickster). The 2024 PHB
// gives them a FIXED prepared column that does NOT use the ability modifier; the
// table is the same for both subclasses and runs from level 3 to 20 (checked
// against the 2024 PHB data).
DATA.thirdCasterPrepared = [0, 0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13];

// Cantrips known per class level. Eldritch Knight: 2 at L3, a 3rd at L10;
// Arcane Trickster: 3 at L3 (Mage Hand is mandatory), a 4th at L10.
DATA.thirdCasterCantrips = {
    eldritchKnight:  [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
    arcaneTrickster: [0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
};

// Arcane Trickster always knows Mage Hand (counts against the maximum and
// can't be swapped).
DATA.thirdCasterFixedCantrips = { arcaneTrickster: ['Mage Hand'] };

// Choices the player makes when REACHING a class level (level-up menu steps).
// Creation-time (level 1) choices belong to the creation wizard. NOT listed here
// (derived generically in getLevelUpDelta): counted options that grow with level
// — invocations, metamagic, wild shape forms, maneuvers, weapon masteries — come
// from DATA.choiceTotals (data-rules.js) with (total − known) semantics, and the
// Ability Score Improvement / feat step comes from each class's asiLevels.
// id → renderer in wg-levelup.js; unknown ids render an informational step.
// { id: 'skills', count, options: [WG_SKILLS keys] | 'class' (class skill list) | absent (any),
//   fixed: [keys] (granted without a choice), featName } — also allowed per subclass as
// subclass.choices[level]; stored in config.defaultSkills, rolled back via levelChoices.
DATA.levelUpChoices = {
    rogue:     { 3: [{ id: 'subclass' }] },
    paladin:   { 2: [{ id: 'fightingStyle' }], 3: [{ id: 'subclass' }] },
    sorcerer:  { 3: [{ id: 'subclass' }] },
    wizard:    { 2: [{ id: 'scholar' }], 3: [{ id: 'subclass' }] },
    fighter:   { 2: [{ id: 'fightingStyle' }], 3: [{ id: 'subclass' }] },  // L1 style self-heals at L2 if never recorded
    druid:     { 3: [{ id: 'subclass' }] },
    warlock:   { 3: [{ id: 'subclass' }] },
    ranger:    { 2: [{ id: 'expertise', count: 1 }, { id: 'fightingStyle' }], 3: [{ id: 'subclass' }] },
    bard:      { 2: [{ id: 'expertise', count: 2 }], 3: [{ id: 'subclass' }] },
    cleric:    { 3: [{ id: 'subclass' }] },
    monk:      { 3: [{ id: 'subclass' }] },
    barbarian: { 3: [{ id: 'subclass' }, { id: 'skills', count: 1, options: 'class', featName: 'Primal Knowledge' }] }
};

// 2024 PHB Eldritch Invocations up to Warlock level 5 (minLevel gates the
// picker; `requires` = another invocation you must have, enforced; other
// prereq text is shown). spells = what the invocation lets you cast
// ('atWill' = without a spell slot, no limit; picks are stored per character in
// state.invocationPicks[name]).
DATA.invocations = [
    { name: "Agonizing Blast", minLevel: 2, prereq: "a Warlock cantrip that deals damage", repeatable: true, desc: "Choose one of your known Warlock cantrips that deals damage: add your Charisma modifier to its damage rolls. You can take this more than once, for a different cantrip each time." },
    { name: "Armor of Shadows", minLevel: 1, prereq: null, desc: "You can cast Mage Armor on yourself without expending a spell slot.", spells: [{ name: "Mage Armor", kind: 'atWill', note: "on yourself" }] },
    { name: "Devil's Sight", minLevel: 2, prereq: null, desc: "You can see normally in Dim Light and Darkness — magical or not — within 120 ft of yourself." },
    { name: "Eldritch Mind", minLevel: 1, prereq: null, desc: "You have Advantage on Constitution saving throws that you make to maintain Concentration." },
    { name: "Eldritch Spear", minLevel: 2, prereq: "a Warlock cantrip that deals damage", repeatable: true, desc: "Choose one of your known damaging Warlock cantrips with a range of 10 ft or more: its range increases by 30 ft × your Warlock level. You can take this more than once, for a different cantrip each time." },
    { name: "Fiendish Vigor", minLevel: 2, prereq: null, desc: "You can cast False Life on yourself without expending a spell slot; when you do, you don't roll — you get the highest number on the die.", spells: [{ name: "False Life", kind: 'atWill', note: "on yourself, maximum Temporary HP" }] },
    { name: "Lessons of the First Ones", minLevel: 2, prereq: null, repeatable: true, desc: "You gain one Origin feat of your choice. You can take this more than once, for a different Origin feat each time." },
    { name: "Mask of Many Faces", minLevel: 2, prereq: null, desc: "You can cast Disguise Self without expending a spell slot.", spells: [{ name: "Disguise Self", kind: 'atWill' }] },
    { name: "Misty Visions", minLevel: 2, prereq: null, desc: "You can cast Silent Image without expending a spell slot.", spells: [{ name: "Silent Image", kind: 'atWill' }] },
    { name: "Otherworldly Leap", minLevel: 2, prereq: null, desc: "You can cast Jump on yourself without expending a spell slot.", spells: [{ name: "Jump", kind: 'atWill', note: "on yourself" }] },
    { name: "Pact of the Blade", minLevel: 1, prereq: null, act: 'bonus', desc: "Bonus Action: conjure a pact weapon (a Simple or Martial Melee weapon) in your hand, or bond with a magic weapon you touch. You're proficient with it and can use it as a spellcasting focus; attacks with it can use Charisma instead of Strength or Dexterity, and it can deal Necrotic, Psychic or Radiant damage instead of its normal type. The bond ends if you use this again, if the weapon is more than 5 ft from you for 1 minute, or if you die." },
    { name: "Pact of the Chain", minLevel: 1, prereq: null, desc: "You learn Find Familiar and can cast it as a Magic action without a spell slot. Your familiar can take a special form (Imp, Pseudodragon, Quasit, Skeleton, Slaad Tadpole, Sphinx of Wonder, Sprite or Venomous Snake). When you take the Attack action, you can give up one of your attacks so your familiar makes one attack with its Reaction.", spells: [{ name: "Find Familiar", kind: 'atWill', note: "Magic action, no spell slot" }] },
    { name: "Pact of the Tome", minLevel: 1, prereq: null, desc: "At the end of a Short or Long Rest you can conjure a Book of Shadows. When it appears, choose three cantrips and two level 1 Ritual spells from any class's spell list (not ones you already have prepared); while you carry the book they're prepared and count as Warlock spells. The book is also a spellcasting focus.", spells: [{ pick: 'cantrips', count: 3, level: 0, kind: 'cantrip' }, { pick: 'spells', count: 2, level: 1, ritual: true, kind: 'ritual' }] },
    { name: "Repelling Blast", minLevel: 2, prereq: "a Warlock cantrip that makes an attack roll", repeatable: true, desc: "Choose one of your known Warlock cantrips that requires an attack roll: when it hits a Large or smaller creature, you can push the creature up to 10 ft straight away from you. You can take this more than once, for a different cantrip each time." },
    { name: "Ascendant Step", minLevel: 5, prereq: null, desc: "You can cast Levitate on yourself without expending a spell slot.", spells: [{ name: "Levitate", kind: 'atWill', note: "on yourself" }] },
    { name: "Eldritch Smite", minLevel: 5, prereq: "Pact of the Blade", requires: "Pact of the Blade", act: 'attack', desc: "Once per turn when you hit a creature with your pact weapon, you can expend a Pact Magic slot: the target takes an extra 1d8 Force damage plus 1d8 per level of the slot, and if it is Huge or smaller you can knock it Prone." },
    { name: "Gaze of Two Minds", minLevel: 5, prereq: null, act: 'bonus', desc: "Bonus Action: touch a willing creature and perceive through its senses until the end of your next turn (a Bonus Action on later turns keeps the link going while you are on the same plane). Meanwhile you have its special senses, and within 60 ft of each other you can cast spells as if you were in its space." },
    { name: "Gift of the Depths", minLevel: 5, prereq: null, desc: "You can breathe underwater and have a Swim Speed equal to your Speed. You can also cast Water Breathing once without a spell slot (regained on a Long Rest).", spells: [{ name: "Water Breathing", kind: 'innate', free: 1, recharge: 'long', slots: true }] },
    { name: "Investment of the Chain Master", minLevel: 5, prereq: "Pact of the Chain", requires: "Pact of the Chain", desc: "Your Find Familiar familiar gets a 40-ft Fly or Swim Speed (your choice); you can command it to take the Attack action as a Bonus Action; its Bludgeoning, Piercing and Slashing damage can be Necrotic or Radiant instead; it uses your spell save DC; and when it takes damage you can use your Reaction to give it Resistance to that damage." },
    { name: "Master of Myriad Forms", minLevel: 5, prereq: null, desc: "You can cast Alter Self without expending a spell slot.", spells: [{ name: "Alter Self", kind: 'atWill' }] },
    { name: "One with Shadows", minLevel: 5, prereq: null, desc: "While you are in Dim Light or Darkness, you can cast Invisibility on yourself without expending a spell slot.", spells: [{ name: "Invisibility", kind: 'atWill', note: "on yourself, in Dim Light or Darkness" }] },
    { name: "Thirsting Blade", minLevel: 5, prereq: "Pact of the Blade", requires: "Pact of the Blade", desc: "You gain Extra Attack for your pact weapon only: you can attack twice with it instead of once when you take the Attack action on your turn." }
];

// Beast forms for Wild Shape: every Beast of CR 6 or lower in the 2025 Monster Manual (generated
// 2026-10-15 from its statistics; names, numbers and dice only). Druid levels 2-3: CR 1/4 or lower;
// levels 4-7: CR 1/2 or lower; level 8+: CR 1 and Fly Speed allowed; Circle of the Moon: CR = druid
// level ÷ 3 (see DATA.wildShapeLimits). 2024 Wild Shape keeps your own Hit Points (plus Temporary
// Hit Points), so the beast's HP is left out. swarm = a Swarm of Tiny Beasts (DM call).
// Includes material from the System Reference Document 5.2 ("SRD 5.2") by Wizards of the Coast LLC,
// licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/legalcode).
DATA.wildShapeForms = [
    { name: "Baboon", cr: "0", desc: "Small · AC 12 · Speed 30 ft., Climb 30 ft. · STR 8, DEX 14, CON 11 · Bite +1 (1d4-1 Piercing) · Pack Tactics" },
    { name: "Badger", cr: "0", desc: "Tiny · AC 11 · Speed 20 ft., Burrow 5 ft. · STR 10, DEX 11, CON 16 · Bite +2 (1 Piercing) · Darkvision 30 ft." },
    { name: "Bat", cr: "0", fly: true, desc: "Tiny · AC 12 · Speed 5 ft., Fly 30 ft. · STR 2, DEX 15, CON 8 · Bite +4 (1 Piercing) · Blindsight 60 ft." },
    { name: "Cat", cr: "0", desc: "Tiny · AC 12 · Speed 40 ft., Climb 40 ft. · STR 3, DEX 15, CON 10 · Scratch +4 (1 Slashing) · Jumper, Darkvision 60 ft." },
    { name: "Crab", cr: "0", desc: "Tiny · AC 11 · Speed 20 ft., Swim 20 ft. · STR 6, DEX 11, CON 12 · Claw +2 (1 Bludgeoning) · Amphibious, Blindsight 30 ft." },
    { name: "Deer", cr: "0", desc: "Medium · AC 13 · Speed 50 ft. · STR 11, DEX 16, CON 11 · Ram +2 (1d4 Bludgeoning) · Agile, Darkvision 60 ft." },
    { name: "Eagle", cr: "0", fly: true, desc: "Small · AC 12 · Speed 10 ft., Fly 60 ft. · STR 6, DEX 15, CON 12 · Talons +4 (1d4+2 Slashing)" },
    { name: "Frog", cr: "0", desc: "Tiny · AC 11 · Speed 20 ft., Swim 20 ft. · STR 1, DEX 13, CON 8 · Bite +3 (1 Piercing) · Amphibious, Standing Leap, Darkvision 30 ft." },
    { name: "Giant Fire Beetle", cr: "0", desc: "Small · AC 13 · Speed 30 ft., Climb 30 ft. · STR 8, DEX 10, CON 12 · Bite +1 (1 Fire) · Illumination, Blindsight 30 ft." },
    { name: "Goat", cr: "0", desc: "Medium · AC 10 · Speed 40 ft., Climb 30 ft. · STR 11, DEX 10, CON 11 · Ram +2 (1 Bludgeoning or 1d4 Bludgeoning after a 20-ft. charge) · Darkvision 60 ft." },
    { name: "Hawk", cr: "0", fly: true, desc: "Tiny · AC 13 · Speed 10 ft., Fly 60 ft. · STR 5, DEX 16, CON 8 · Talons +5 (1 Slashing)" },
    { name: "Hyena", cr: "0", desc: "Medium · AC 11 · Speed 50 ft. · STR 11, DEX 13, CON 12 · Bite +2 (1d6 Piercing) · Pack Tactics, Darkvision 60 ft." },
    { name: "Jackal", cr: "0", desc: "Small · AC 12 · Speed 40 ft. · STR 8, DEX 15, CON 11 · Bite +1 (1d4-1 Piercing) · Darkvision 90 ft." },
    { name: "Lizard", cr: "0", desc: "Tiny · AC 10 · Speed 20 ft., Climb 20 ft. · STR 2, DEX 11, CON 10 · Bite +2 (1 Piercing) · Spider Climb, Darkvision 30 ft." },
    { name: "Octopus", cr: "0", desc: "Small · AC 12 · Speed 5 ft., Swim 30 ft. · STR 4, DEX 15, CON 11 · Tentacles +4 (1 Bludgeoning); Ink Cloud (1/Day) (Reaction) · Compression, Water Breathing, Darkvision 30 ft." },
    { name: "Owl", cr: "0", fly: true, desc: "Tiny · AC 11 · Speed 5 ft., Fly 60 ft. · STR 3, DEX 13, CON 8 · Talons +3 (1 Slashing) · Flyby, Darkvision 120 ft." },
    { name: "Piranha", cr: "0", desc: "Tiny · AC 13 · Speed 5 ft., Swim 40 ft. · STR 2, DEX 16, CON 9 · Bite +5 (1 Piercing) · Water Breathing, Darkvision 60 ft." },
    { name: "Rat", cr: "0", desc: "Tiny · AC 10 · Speed 20 ft., Climb 20 ft. · STR 2, DEX 11, CON 9 · Bite +2 (1 Piercing) · Agile, Darkvision 30 ft." },
    { name: "Raven", cr: "0", fly: true, desc: "Tiny · AC 12 · Speed 10 ft., Fly 50 ft. · STR 2, DEX 14, CON 10 · Beak +4 (1 Piercing) · Mimicry" },
    { name: "Scorpion", cr: "0", desc: "Tiny · AC 11 · Speed 10 ft. · STR 2, DEX 11, CON 8 · Sting +2 (1 Piercing + 1d6 Poison) · Blindsight 10 ft." },
    { name: "Seahorse", cr: "0", desc: "Tiny · AC 12 · Speed 5 ft., Swim 20 ft. · STR 1, DEX 12, CON 8 · Bubble Dash · Water Breathing" },
    { name: "Spider", cr: "0", desc: "Tiny · AC 12 · Speed 20 ft., Climb 20 ft. · STR 2, DEX 14, CON 8 · Bite +4 (1 Piercing + 1d4 Poison) · Spider Climb, Web Walker, Darkvision 30 ft." },
    { name: "Vulture", cr: "0", fly: true, desc: "Medium · AC 10 · Speed 10 ft., Fly 50 ft. · STR 7, DEX 10, CON 13 · Beak +2 (1d4 Piercing) · Pack Tactics" },
    { name: "Weasel", cr: "0", desc: "Tiny · AC 13 · Speed 30 ft., Climb 30 ft. · STR 3, DEX 16, CON 8 · Bite +5 (1 Piercing) · Darkvision 60 ft." },
    { name: "Blood Hawk", cr: "1/8", fly: true, desc: "Small · AC 12 · Speed 10 ft., Fly 60 ft. · STR 6, DEX 14, CON 10 · Beak +4 (1d4+2 Piercing or 1d8+2 Piercing if the target is Bloodied) · Pack Tactics" },
    { name: "Camel", cr: "1/8", desc: "Large · AC 10 · Speed 50 ft. · STR 15, DEX 8, CON 17 · Bite +4 (1d4+2 Bludgeoning) · Darkvision 60 ft." },
    { name: "Giant Crab", cr: "1/8", desc: "Medium · AC 15 · Speed 30 ft., Swim 30 ft. · STR 13, DEX 13, CON 11 · Claw +3 (1d6+1 Bludgeoning) · Amphibious, Blindsight 30 ft." },
    { name: "Giant Rat", cr: "1/8", desc: "Small · AC 13 · Speed 30 ft., Climb 30 ft. · STR 7, DEX 16, CON 11 · Bite +5 (1d4+3 Piercing) · Pack Tactics, Darkvision 60 ft." },
    { name: "Giant Weasel", cr: "1/8", desc: "Medium · AC 13 · Speed 40 ft., Climb 30 ft. · STR 11, DEX 17, CON 10 · Bite +5 (1d4+3 Piercing) · Darkvision 60 ft." },
    { name: "Mastiff", cr: "1/8", desc: "Medium · AC 12 · Speed 40 ft. · STR 13, DEX 14, CON 12 · Bite +3 (1d6+1 Piercing) · Darkvision 60 ft." },
    { name: "Mule", cr: "1/8", desc: "Medium · AC 10 · Speed 40 ft. · STR 14, DEX 10, CON 13 · Hooves +4 (1d4+2 Bludgeoning) · Beast of Burden" },
    { name: "Pony", cr: "1/8", desc: "Medium · AC 10 · Speed 40 ft. · STR 15, DEX 10, CON 13 · Hooves +4 (1d4+2 Bludgeoning)" },
    { name: "Venomous Snake", cr: "1/8", desc: "Tiny · AC 12 · Speed 30 ft., Swim 30 ft. · STR 2, DEX 15, CON 11 · Bite +4 (1d4+2 Piercing + 1d6 Poison) · Blindsight 10 ft." },
    { name: "Boar", cr: "1/4", desc: "Medium · AC 11 · Speed 40 ft. · STR 13, DEX 11, CON 14 · Gore +3 (1d6+1 Piercing + 1d6 Piercing after a 20-ft. charge) · Bloodied Fury" },
    { name: "Constrictor Snake", cr: "1/4", desc: "Large · AC 13 · Speed 30 ft., Swim 30 ft. · STR 15, DEX 14, CON 12 · Bite +4 (1d8+2 Piercing); Constrict DC 12 STR (3d4 Bludgeoning) · Blindsight 10 ft." },
    { name: "Draft Horse", cr: "1/4", desc: "Large · AC 10 · Speed 40 ft. · STR 18, DEX 10, CON 15 · Hooves +6 (1d4+4 Bludgeoning)" },
    { name: "Elk", cr: "1/4", desc: "Large · AC 10 · Speed 50 ft. · STR 16, DEX 10, CON 11 · Ram +5 (1d6+3 Bludgeoning + 1d6 Bludgeoning after a 20-ft. charge) · Darkvision 60 ft." },
    { name: "Giant Badger", cr: "1/4", desc: "Medium · AC 13 · Speed 30 ft., Burrow 10 ft. · STR 13, DEX 10, CON 17 · Bite +3 (2d4+1 Piercing) · Darkvision 60 ft." },
    { name: "Giant Bat", cr: "1/4", fly: true, desc: "Large · AC 13 · Speed 10 ft., Fly 60 ft. · STR 15, DEX 16, CON 11 · Bite +5 (1d6+3 Piercing) · Blindsight 120 ft." },
    { name: "Giant Centipede", cr: "1/4", desc: "Small · AC 14 · Speed 30 ft., Climb 30 ft. · STR 5, DEX 14, CON 12 · Bite +4 (1d4+2 Piercing) · Blindsight 30 ft." },
    { name: "Giant Frog", cr: "1/4", desc: "Medium · AC 11 · Speed 30 ft., Swim 30 ft. · STR 12, DEX 13, CON 11 · Bite +3 (1d6+2 Piercing); Swallow (2d4 Acid) · Amphibious, Standing Leap, Darkvision 30 ft." },
    { name: "Giant Lizard", cr: "1/4", desc: "Large · AC 12 · Speed 40 ft., Climb 40 ft. · STR 15, DEX 12, CON 13 · Bite +4 (1d8+2 Piercing) · Spider Climb, Darkvision 60 ft." },
    { name: "Giant Venomous Snake", cr: "1/4", desc: "Medium · AC 14 · Speed 40 ft., Swim 40 ft. · STR 10, DEX 18, CON 13 · Bite +6 (1d4+4 Piercing + 1d8 Poison) · Blindsight 10 ft." },
    { name: "Giant Wolf Spider", cr: "1/4", desc: "Medium · AC 13 · Speed 40 ft., Climb 40 ft. · STR 12, DEX 16, CON 13 · Bite +5 (1d4+3 Piercing + 2d4 Poison) · Spider Climb, Blindsight 10 ft., Darkvision 60 ft." },
    { name: "Panther", cr: "1/4", desc: "Medium · AC 13 · Speed 50 ft., Climb 40 ft. · STR 14, DEX 16, CON 10 · Rend +5 (1d6+3 Slashing); Nimble Escape (Bonus Action) · Darkvision 60 ft." },
    { name: "Pteranodon", cr: "1/4", fly: true, desc: "Medium · AC 13 · Speed 10 ft., Fly 60 ft. · STR 12, DEX 15, CON 10 · Bite +4 (1d8+2 Piercing) · Flyby" },
    { name: "Riding Horse", cr: "1/4", desc: "Large · AC 11 · Speed 60 ft. · STR 16, DEX 13, CON 12 · Hooves +5 (1d8+3 Bludgeoning)" },
    { name: "Swarm of Bats", cr: "1/4", fly: true, swarm: true, desc: "Large swarm of Tiny beasts · AC 12 · Speed 5 ft., Fly 30 ft. · STR 5, DEX 15, CON 10 · Bites +4 (2d4 Piercing or 1d4 Piercing if the swarm is Bloodied) · Swarm, Blindsight 60 ft." },
    { name: "Swarm of Rats", cr: "1/4", swarm: true, desc: "Medium swarm of Tiny beasts · AC 10 · Speed 30 ft., Climb 30 ft. · STR 9, DEX 11, CON 9 · Bites +2 (2d4 Piercing or 1d4 Piercing if the swarm is Bloodied) · Swarm, Darkvision 30 ft." },
    { name: "Swarm of Ravens", cr: "1/4", fly: true, swarm: true, desc: "Medium swarm of Tiny beasts · AC 12 · Speed 10 ft., Fly 50 ft. · STR 6, DEX 14, CON 12 · Beaks +4 (1d6+2 Piercing or 1d4 Piercing if the swarm is Bloodied); Cacophony (Recharge 6) DC 10 WIS · Swarm" },
    { name: "Wolf", cr: "1/4", desc: "Medium · AC 12 · Speed 40 ft. · STR 14, DEX 15, CON 12 · Bite +4 (1d6+2 Piercing) · Pack Tactics, Darkvision 60 ft." },
    { name: "Ape", cr: "1/2", desc: "Medium · AC 12 · Speed 30 ft., Climb 30 ft. · STR 16, DEX 14, CON 14 · Multiattack (2); Fist +5 (1d4+3 Bludgeoning); Rock (Recharge 6) +5 (2d6+3 Bludgeoning)" },
    { name: "Black Bear", cr: "1/2", desc: "Medium · AC 11 · Speed 30 ft., Climb 30 ft., Swim 30 ft. · STR 15, DEX 12, CON 14 · Multiattack (2); Rend +4 (1d6+2 Slashing) · Darkvision 60 ft." },
    { name: "Crocodile", cr: "1/2", desc: "Large · AC 12 · Speed 20 ft., Swim 30 ft. · STR 15, DEX 10, CON 13 · Bite +4 (1d8+2 Piercing) · Hold Breath" },
    { name: "Giant Goat", cr: "1/2", desc: "Large · AC 11 · Speed 40 ft., Climb 30 ft. · STR 17, DEX 13, CON 12 · Ram +5 (1d6+3 Bludgeoning + 2d4 Bludgeoning after a 20-ft. charge) · Darkvision 60 ft." },
    { name: "Giant Seahorse", cr: "1/2", desc: "Large · AC 14 · Speed 5 ft., Swim 40 ft. · STR 15, DEX 12, CON 11 · Ram +4 (2d6+2 Bludgeoning or 2d8+2 Bludgeoning after a 20-ft. charge); Bubble Dash (Bonus Action) · Water Breathing" },
    { name: "Giant Wasp", cr: "1/2", fly: true, desc: "Medium · AC 13 · Speed 10 ft., Fly 50 ft. · STR 10, DEX 14, CON 10 · Sting +4 (1d6+2 Piercing + 2d4 Poison) · Flyby" },
    { name: "Reef Shark", cr: "1/2", desc: "Medium · AC 12 · Speed 5 ft., Swim 30 ft. · STR 14, DEX 15, CON 13 · Bite +4 (2d4+2 Piercing) · Pack Tactics, Water Breathing, Blindsight 30 ft." },
    { name: "Swarm of Insects", cr: "1/2", swarm: true, desc: "Medium swarm of Tiny beasts · AC 11 · Speed 20 ft. · STR 3, DEX 13, CON 14 · Bites +3 (2d4+1 Poison or 1d4+1 Poison if the swarm is Bloodied) · Spider Climb, Swarm, Blindsight 30 ft." },
    { name: "Warhorse", cr: "1/2", desc: "Large · AC 11 · Speed 60 ft. · STR 18, DEX 12, CON 13 · Hooves +6 (2d4+4 Bludgeoning + 2d4 Bludgeoning after a 20-ft. charge)" },
    { name: "Brown Bear", cr: "1", desc: "Large · AC 11 · Speed 40 ft., Climb 30 ft. · STR 17, DEX 12, CON 15 · Multiattack (2); Bite +5 (1d8+3 Piercing); Claw +5 (1d4+3 Slashing) · Darkvision 60 ft." },
    { name: "Dire Wolf", cr: "1", desc: "Large · AC 14 · Speed 50 ft. · STR 17, DEX 15, CON 15 · Bite +5 (1d10+3 Piercing) · Pack Tactics, Darkvision 60 ft." },
    { name: "Giant Hyena", cr: "1", desc: "Large · AC 12 · Speed 50 ft. · STR 16, DEX 14, CON 14 · Bite +5 (2d6+3 Piercing); Rampage (1/Day) (Bonus Action) · Darkvision 60 ft." },
    { name: "Giant Octopus", cr: "1", desc: "Large · AC 11 · Speed 10 ft., Swim 60 ft. · STR 17, DEX 13, CON 13 · Tentacles +5 (2d6+3 Bludgeoning); Ink Cloud (1/Day) (Reaction) · Water Breathing, Darkvision 60 ft." },
    { name: "Giant Spider", cr: "1", desc: "Large · AC 14 · Speed 30 ft., Climb 30 ft. · STR 14, DEX 16, CON 12 · Bite +5 (1d8+3 Piercing + 2d6 Poison); Web (Recharge 5–6) DC 13 DEX · Spider Climb, Web Walker, Darkvision 60 ft." },
    { name: "Giant Toad", cr: "1", desc: "Large · AC 11 · Speed 30 ft., Swim 30 ft. · STR 15, DEX 13, CON 13 · Bite +4 (1d6+2 Piercing + 2d4 Poison); Swallow (3d6 Acid) · Amphibious, Standing Leap, Darkvision 60 ft." },
    { name: "Lion", cr: "1", desc: "Large · AC 12 · Speed 50 ft. · STR 17, DEX 15, CON 11 · Multiattack (2); Rend +5 (1d8+3 Slashing); Roar DC 11 WIS · Pack Tactics, Running Leap, Darkvision 60 ft." },
    { name: "Swarm of Piranhas", cr: "1", swarm: true, desc: "Medium swarm of Tiny beasts · AC 13 · Speed 5 ft., Swim 40 ft. · STR 13, DEX 16, CON 9 · Bites +5 (2d4+3 Piercing or 1d4+3 Piercing if the swarm is Bloodied) · Swarm, Water Breathing, Darkvision 60 ft." },
    { name: "Tiger", cr: "1", desc: "Large · AC 13 · Speed 40 ft. · STR 17, DEX 16, CON 14 · Rend +5 (2d6+3 Slashing); Nimble Escape (Bonus Action) · Darkvision 60 ft." },
    { name: "Allosaurus", cr: "2", desc: "Large · AC 13 · Speed 60 ft. · STR 19, DEX 13, CON 17 · Bite +6 (2d10+4 Piercing); Claws +6 (1d8+4 Slashing)" },
    { name: "Giant Boar", cr: "2", desc: "Large · AC 13 · Speed 40 ft. · STR 17, DEX 10, CON 16 · Gore +5 (2d6+3 Piercing + 2d6 Piercing after a 20-ft. charge) · Bloodied Fury" },
    { name: "Giant Constrictor Snake", cr: "2", desc: "Huge · AC 12 · Speed 30 ft., Swim 30 ft. · STR 19, DEX 14, CON 12 · Multiattack (1); Bite +6 (2d6+4 Piercing); Constrict DC 14 STR (2d8+4 Bludgeoning) · Blindsight 10 ft." },
    { name: "Hunter Shark", cr: "2", desc: "Large · AC 12 · Speed 5 ft., Swim 40 ft. · STR 18, DEX 14, CON 15 · Bite +6 (3d6+4 Piercing) · Water Breathing, Blindsight 60 ft." },
    { name: "Plesiosaurus", cr: "2", desc: "Large · AC 13 · Speed 20 ft., Swim 40 ft. · STR 18, DEX 15, CON 16 · Bite +6 (2d6+4 Piercing) · Hold Breath" },
    { name: "Polar Bear", cr: "2", desc: "Large · AC 12 · Speed 40 ft., Swim 40 ft. · STR 20, DEX 14, CON 16 · Multiattack (2); Rend +7 (1d8+5 Slashing) · Darkvision 60 ft." },
    { name: "Rhinoceros", cr: "2", desc: "Large · AC 13 · Speed 40 ft. · STR 21, DEX 8, CON 15 · Gore +7 (2d8+5 Piercing + 2d8 Piercing after a 20-ft. charge)" },
    { name: "Saber-Toothed Tiger", cr: "2", desc: "Large · AC 13 · Speed 40 ft. · STR 18, DEX 17, CON 15 · Multiattack (2); Rend +6 (2d6+4 Slashing); Nimble Escape (Bonus Action) · Running Leap, Darkvision 60 ft." },
    { name: "Swarm of Venomous Snakes", cr: "2", swarm: true, desc: "Medium swarm of Tiny beasts · AC 14 · Speed 30 ft., Swim 30 ft. · STR 8, DEX 18, CON 11 · Bites +6 (1d8+4 Piercing or 1d4+4 Piercing if the swarm is Bloodied + 3d6 Poison) · Swarm, Blindsight 10 ft." },
    { name: "Ankylosaurus", cr: "3", desc: "Huge · AC 15 · Speed 30 ft. · STR 19, DEX 11, CON 15 · Multiattack (2); Tail +6 (1d10+4 Bludgeoning)" },
    { name: "Giant Scorpion", cr: "3", desc: "Large · AC 15 · Speed 40 ft. · STR 16, DEX 13, CON 15 · Multiattack (3); Claw +5 (1d6+3 Bludgeoning); Sting +5 (1d8+3 Piercing + 2d10 Poison) · Blindsight 60 ft." },
    { name: "Killer Whale", cr: "3", desc: "Huge · AC 12 · Speed 5 ft., Swim 60 ft. · STR 19, DEX 14, CON 13 · Bite +6 (5d6+4 Piercing) · Hold Breath, Blindsight 120 ft." },
    { name: "Archelon", cr: "4", desc: "Huge · AC 17 · Speed 20 ft., Swim 80 ft. · STR 18, DEX 16, CON 13 · Multiattack (2); Bite +6 (3d6+4 Piercing) · Amphibious" },
    { name: "Elephant", cr: "4", desc: "Huge · AC 12 · Speed 40 ft. · STR 22, DEX 9, CON 17 · Multiattack (2); Gore +8 (2d8+6 Piercing); Trample (Bonus Action)" },
    { name: "Hippopotamus", cr: "4", desc: "Large · AC 14 · Speed 30 ft., Swim 30 ft. · STR 21, DEX 7, CON 15 · Multiattack (2); Bite +7 (2d10+5 Piercing) · Hold Breath" },
    { name: "Giant Crocodile", cr: "5", desc: "Huge · AC 14 · Speed 30 ft., Swim 50 ft. · STR 21, DEX 9, CON 17 · Multiattack (2); Bite +8 (3d10+5 Piercing); Tail +8 (3d8+5 Bludgeoning) · Hold Breath" },
    { name: "Giant Shark", cr: "5", desc: "Huge · AC 13 · Speed 5 ft., Swim 60 ft. · STR 23, DEX 11, CON 21 · Multiattack (2); Bite +9 (3d10+6 Piercing) · Water Breathing, Blindsight 60 ft." },
    { name: "Triceratops", cr: "5", desc: "Huge · AC 14 · Speed 50 ft. · STR 22, DEX 9, CON 17 · Multiattack (2); Gore +9 (2d12+6 Piercing + 2d8 Piercing after a 20-ft. charge)" },
    { name: "Giant Squid", cr: "6", desc: "Huge · AC 12 · Speed 5 ft., Swim 80 ft. · STR 23, DEX 14, CON 12 · Multiattack (2); Bite +9 (4d10+6 Piercing); Tentacle +9 (3d8+6 Bludgeoning); Ink Cloud (1/Day) (Reaction) · Water Breathing, Darkvision 120 ft." },
    { name: "Mammoth", cr: "6", desc: "Huge · AC 13 · Speed 50 ft. · STR 24, DEX 9, CON 21 · Multiattack (2); Gore +10 (2d10+7 Piercing); Trample (Bonus Action)" }
];

// Class-specific alternatives to a Fighting Style feat (2024 PHB). Picking one
// grants cantrips from another class's list — the level-up wizard adds a
// follow-up cantrip step (cantripList/cantripCount below drive that).
DATA.classFightingBonus = {
    paladin: [{ name: "Blessed Warrior", desc: "Instead of a Fighting Style feat: you learn two Cleric cantrips of your choice. Charisma is your spellcasting ability for them, and you can replace one when you gain a Paladin level.", cantripList: "cleric", cantripCount: 2 }],
    ranger:  [{ name: "Druidic Warrior", desc: "Instead of a Fighting Style feat: you learn two Druid cantrips of your choice. Wisdom is your spellcasting ability for them, and you can replace one when you gain a Ranger level.", cantripList: "druid", cantripCount: 2 }]
};

// Species traits that unlock at character levels > 1 (2024). Shown in the
// level-up menu next to class features, badged as "Species". Species SPELLS
// that unlock later (Elven Lineage, Fiendish Legacy) live in the species'
// `spells` grants instead and show up as "new spells".
DATA.speciesProgression = {
    aasimar: {
        3: [{ name: "Celestial Revelation", act: 'bonus', desc: "Bonus Action: transform for 1 minute (end it any time), once per Long Rest. Choose the form EACH time: Heavenly Wings (Fly Speed equal to your Speed), Inner Radiance (Bright Light 10 ft + Dim 10 ft; at the end of each of your turns, every creature within 10 ft takes Radiant damage equal to your Proficiency Bonus) or Necrotic Shroud (creatures other than allies within 10 ft make a Charisma save, DC 8 + CHA modifier + Proficiency Bonus, or are Frightened until the end of your next turn). While transformed, once per turn one attack or spell deals extra damage equal to your Proficiency Bonus (Radiant, or Necrotic for Necrotic Shroud)." }]
    },
    goliath: {
        5: [{ name: "Large Form", act: 'bonus', desc: "Bonus Action (if there's room): become Large for 10 minutes — Advantage on Strength checks and +10 ft Speed. Once per Long Rest." }]
    },
    dragonborn: {
        5: [{ name: "Draconic Flight", act: 'bonus', desc: "Bonus Action: sprout spectral wings for 10 minutes (or until you retract them or are Incapacitated) — Fly Speed equal to your Speed. Once per Long Rest." }]
    },
    human: {}
};

// Generic class/subclass/species/feat resource registry — drives the Resources
// widget (wg-resource.js), the Active part of the Features widget
// (wg-features.js), rest resets (wg-rest.js) and free casts (wg-prepare.js).
// appliesTo gates visibility (className / subclass / race / lineage / feat /
// minLevel / maxLevel); max(cfg, st) and die(st) are functions; stateKey holds
// the USED count in character state. recharge: 'long' (all back on a Long
// Rest), 'short' (all back on a Short or Long Rest), 'short-one' (one back per
// Short Rest, all on a Long Rest). featureNames link the resource to the feature
// rows that spend it (click = spend one); spellNames to spells it casts for free.
// Free casts of granted spells (species, feats, subclass) are generated from
// the `spells` grants by getClassResources() — not listed here.
function _resMod(cfg, st, ab) { return Math.max(1, getMod(getAbilityScore(cfg, st, ab))); }
DATA.classResources = [
    // ---- Barbarian ----
    {
        id: 'rage', label: 'Rage',
        appliesTo: { className: 'barbarian', minLevel: 1 },
        max: function (cfg, st) { return (DATA.barbarian.rages || {})[st.level || 1] || 2; },
        stateKey: 'rageUsed', recharge: 'short-one', featureNames: ['Rage'],
        desc: "Bonus Action: enter a Rage. Regain one use on a Short Rest, all on a Long Rest."
    },
    {
        id: 'warriorOfTheGods', label: 'Warrior of the Gods', unit: 'd12',
        appliesTo: { className: 'barbarian', subclass: 'zealot', minLevel: 3 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 17 ? 7 : l >= 12 ? 6 : l >= 6 ? 5 : 4; },
        stateKey: 'warriorOfTheGodsUsed', recharge: 'long', featureNames: ['Warrior of the Gods'],
        desc: "Pool of d12s. Bonus Action: spend any number, roll them and regain that many HP. Refills on a Long Rest."
    },
    // ---- Bard ----
    {
        id: 'bardicInspiration', label: 'Bardic Inspiration',
        appliesTo: { className: 'bard', minLevel: 1, maxLevel: 4 },
        max: function (cfg, st) { return _resMod(cfg, st, 'cha'); },
        die: function (st) { return 'd6'; },
        stateKey: 'bardicInspirationUsed', recharge: 'long', featureNames: ['Bardic Inspiration', 'Cutting Words', 'Mantle of Inspiration'],
        desc: "Uses = your Charisma modifier (min 1). All return on a Long Rest (from level 5 also on a Short Rest)."
    },
    {
        id: 'bardicInspiration5', label: 'Bardic Inspiration',
        appliesTo: { className: 'bard', minLevel: 5 },
        max: function (cfg, st) { return _resMod(cfg, st, 'cha'); },
        die: function (st) { var l = st.level || 1; return l >= 15 ? 'd12' : l >= 10 ? 'd10' : 'd8'; },
        stateKey: 'bardicInspirationUsed', recharge: 'short', featureNames: ['Bardic Inspiration', 'Cutting Words', 'Mantle of Inspiration'],
        desc: "Uses = your Charisma modifier (min 1). Font of Inspiration: all return on a Short or Long Rest."
    },
    {
        id: 'beguilingMagic', label: 'Beguiling Magic',
        appliesTo: { className: 'bard', subclass: 'glamour', minLevel: 3 },
        max: function (cfg, st) { return 1; },
        stateKey: 'beguilingMagicUsed', recharge: 'long', featureNames: ['Beguiling Magic'],
        desc: "Once per Long Rest (or restore it by spending a Bardic Inspiration use): charm or frighten a creature after casting an Enchantment or Illusion spell with a slot."
    },
    // ---- Cleric ----
    {
        id: 'channelDivinityCleric', label: 'Channel Divinity',
        appliesTo: { className: 'cleric', minLevel: 2 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 18 ? 4 : l >= 6 ? 3 : 2; },
        stateKey: 'channelDivinityUsed', recharge: 'short-one',
        featureNames: ['Channel Divinity', 'Divine Spark', 'Turn Undead', 'Preserve Life', 'Radiance of the Dawn', 'Invoke Duplicity', 'Guided Strike'],
        desc: "Divine Spark, Turn Undead or your Domain's option. Regain one use on a Short Rest, all on a Long Rest."
    },
    {
        id: 'wardingFlare', label: 'Warding Flare',
        appliesTo: { className: 'cleric', subclass: 'light', minLevel: 3 },
        max: function (cfg, st) { return _resMod(cfg, st, 'wis'); },
        stateKey: 'wardingFlareUsed', recharge: 'long', featureNames: ['Warding Flare'],
        desc: "Reaction: Disadvantage on an attack roll against you or a creature within 30 ft. Uses = Wisdom modifier (min 1) per Long Rest."
    },
    {
        id: 'warPriest', label: 'War Priest',
        appliesTo: { className: 'cleric', subclass: 'war', minLevel: 3 },
        max: function (cfg, st) { return _resMod(cfg, st, 'wis'); },
        stateKey: 'warPriestUsed', recharge: 'short', featureNames: ['War Priest'],
        desc: "Bonus Action attack. Uses = Wisdom modifier (min 1); all return on a Short or Long Rest."
    },
    // ---- Druid ----
    {
        id: 'wildResurgence', label: 'Wild Resurgence (spell slot)',
        appliesTo: { className: 'druid', minLevel: 5 },
        max: function (cfg, st) { return 1; },
        stateKey: 'wildResurgenceUsed', recharge: 'long', featureNames: ['Wild Resurgence'],
        desc: "Expend a Wild Shape use to gain a level 1 spell slot (no action). Once per Long Rest."
    },
    {
        id: 'wildShape', label: 'Wild Shape',
        appliesTo: { className: 'druid', minLevel: 2 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 17 ? 4 : l >= 6 ? 3 : 2; },
        stateKey: 'wildShapeUsed', recharge: 'short-one',
        featureNames: ['Wild Shape', 'Wild Companion', "Land's Aid", 'Wrath of the Sea', 'Starry Form'],
        desc: "Bonus Action: transform into a known Beast form. Also fuels Wild Companion and Circle features. Regain one use on a Short Rest, all on a Long Rest.",
        // Known forms (picked via level-up) appended to the widget tooltip.
        extraDesc: function (cfg, st) {
            var forms = st.wildShapeForms || [];
            return forms.length ? 'Known forms: ' + forms.join(', ') + '. You can swap one on each Long Rest.' : '';
        }
    },
    // ---- Fighter ----
    {
        id: 'secondWind', label: 'Second Wind',
        appliesTo: { className: 'fighter', minLevel: 1 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 10 ? 4 : l >= 4 ? 3 : 2; },
        stateKey: 'secondWindUsed', recharge: 'short-one', featureNames: ['Second Wind', 'Tactical Mind'],
        desc: "Bonus Action: regain 1d10 + Fighter level HP. Regain one use on a Short Rest, all on a Long Rest. Tactical Mind can spend a use on a failed ability check (+1d10; not spent if it still fails)."
    },
    {
        id: 'actionSurge', label: 'Action Surge',
        appliesTo: { className: 'fighter', minLevel: 2 },
        max: function (cfg, st) { return (st.level || 1) >= 17 ? 2 : 1; },
        stateKey: 'actionSurgeUsed', recharge: 'short', featureNames: ['Action Surge'],
        desc: "One extra action on your turn (not Magic). Back on a Short or Long Rest."
    },
    {
        id: 'superiorityDice', label: 'Superiority Dice',
        appliesTo: { className: 'fighter', subclass: 'battleMaster', minLevel: 3 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 15 ? 6 : l >= 7 ? 5 : 4; },
        die: function (st) { var l = st.level || 1; return l >= 18 ? 'd12' : l >= 10 ? 'd10' : 'd8'; },
        stateKey: 'superiorityDiceUsed', recharge: 'short', featureNames: ['Combat Superiority'],
        desc: "Fuel for your maneuvers (one per attack). All dice return on a Short or Long Rest."
    },
    {
        id: 'psiWarriorDice', label: 'Psionic Energy Dice',
        appliesTo: { className: 'fighter', subclass: 'psiWarrior', minLevel: 3 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 17 ? 12 : l >= 13 ? 10 : l >= 9 ? 8 : l >= 5 ? 6 : 4; },
        die: function (st) { var l = st.level || 1; return l >= 17 ? 'd12' : l >= 11 ? 'd10' : l >= 5 ? 'd8' : 'd6'; },
        stateKey: 'psionicDiceUsed', recharge: 'short-one', featureNames: ['Psionic Power', 'Protective Field', 'Psionic Strike'],
        desc: "Fuel for Protective Field, Psionic Strike and extra uses of Telekinetic Movement. Regain one die on a Short Rest, all on a Long Rest."
    },
    {
        id: 'telekineticMovement', label: 'Telekinetic Movement',
        appliesTo: { className: 'fighter', subclass: 'psiWarrior', minLevel: 3 },
        max: function (cfg, st) { return 1; },
        stateKey: 'telekineticMovementUsed', recharge: 'short', featureNames: ['Telekinetic Movement'],
        desc: "Magic action: move an object or willing creature up to 30 ft. Once per Short or Long Rest (or spend a Psionic Energy Die)."
    },
    // ---- Monk ----
    {
        id: 'focusPoints', label: 'Focus Points',
        appliesTo: { className: 'monk', minLevel: 2 },
        max: function (cfg, st) { return st.level || 1; },
        stateKey: 'focusPointsUsed', recharge: 'short', featureNames: ["Monk's Focus", 'Flurry of Blows'],
        desc: "Fuel for Flurry of Blows, Patient Defense, Step of the Wind and your subclass. All points return on a Short or Long Rest."
    },
    {
        id: 'uncannyMetabolism', label: 'Uncanny Metabolism',
        appliesTo: { className: 'monk', minLevel: 2 },
        max: function (cfg, st) { return 1; },
        stateKey: 'uncannyMetabolismUsed', recharge: 'long', featureNames: ['Uncanny Metabolism'],
        desc: "On rolling Initiative: regain all Focus Points and heal Monk level + a Martial Arts die. Once per Long Rest."
    },
    // ---- Paladin ----
    {
        id: 'layOnHands', label: 'Lay on Hands',
        appliesTo: { className: 'paladin', minLevel: 1 },
        max: function (cfg, st) { return 5 * (st.level || 1); },
        stateKey: 'layOnHandsUsed', recharge: 'long', featureNames: ['Lay on Hands'], unit: 'points',
        desc: "Healing pool of 5 × Paladin level HP. Bonus Action, touch: restore any number of points, or spend 5 to end the Poisoned condition. Refills on a Long Rest."
    },
    {
        id: 'paladinSmite', label: "Paladin's Smite",
        appliesTo: { className: 'paladin', minLevel: 2 },
        max: function (cfg, st) { return 1; },
        stateKey: 'paladinSmiteUsed', recharge: 'long', featureNames: ["Paladin's Smite"], spellNames: ['Divine Smite'],
        desc: "Once per Long Rest: cast Divine Smite without expending a spell slot. Divine Smite is always prepared and can also be cast with slots as normal."
    },
    {
        id: 'channelDivinity', label: 'Channel Divinity',
        appliesTo: { className: 'paladin', minLevel: 3 },
        max: function (cfg, st) { return (st.level || 1) >= 11 ? 3 : 2; },
        stateKey: 'channelDivinityUsed', recharge: 'short-one',
        featureNames: ['Channel Divinity', 'Divine Sense', 'Sacred Weapon', 'Inspiring Smite', 'Peerless Athlete', "Nature's Wrath", 'Vow of Enmity'],
        desc: "Divine Sense or your Oath's option. Regain one use on a Short Rest, all on a Long Rest."
    },
    // ---- Ranger ----
    {
        id: 'favoredEnemy', label: 'Favored Enemy',
        appliesTo: { className: 'ranger', minLevel: 1 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 17 ? 6 : l >= 13 ? 5 : l >= 9 ? 4 : l >= 5 ? 3 : 2; },
        stateKey: 'favoredEnemyUsed', recharge: 'long', featureNames: ['Favored Enemy'], spellNames: ["Hunter's Mark"],
        desc: "Hunter's Mark is always prepared and doesn't count against your prepared spells. Cast it this many times without a spell slot; all uses return on a Long Rest."
    },
    {
        id: 'dreadfulStrike', label: 'Dreadful Strike',
        appliesTo: { className: 'ranger', subclass: 'gloomStalker', minLevel: 3 },
        max: function (cfg, st) { return _resMod(cfg, st, 'wis'); },
        stateKey: 'dreadfulStrikeUsed', recharge: 'long', featureNames: ['Dread Ambusher'],
        desc: "Extra 2d6 Psychic damage on a weapon hit (once per turn). Uses = Wisdom modifier (min 1) per Long Rest."
    },
    // ---- Rogue ----
    {
        id: 'psionicDice', label: 'Psionic Energy Dice',
        appliesTo: { className: 'rogue', subclass: 'soulknife', minLevel: 3 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 17 ? 12 : l >= 13 ? 10 : l >= 9 ? 8 : l >= 5 ? 6 : 4; },
        die: function (st) { var l = st.level || 1; return l >= 17 ? 'd12' : l >= 11 ? 'd10' : l >= 5 ? 'd8' : 'd6'; },
        stateKey: 'psionicDiceUsed', recharge: 'short-one', featureNames: ['Psionic Power'],
        desc: "Fuel for Soulknife powers. Psi-Bolstered Knack: after failing a check with a proficient skill/tool, roll a die and add it (spent only if the check then succeeds). Psychic Whispers: telepathy with up to Proficiency Bonus creatures for die-roll hours (first use per Long Rest is free). Regain one die on a Short Rest, all on a Long Rest."
    },
    // ---- Sorcerer ----
    {
        id: 'innateSorcery', label: 'Innate Sorcery',
        appliesTo: { className: 'sorcerer', minLevel: 1 },
        max: function (cfg, st) { return 2; },
        stateKey: 'innateSorceryUsed', recharge: 'long', featureNames: ['Innate Sorcery'],
        desc: "Bonus Action: unleash your magic for 1 minute. Spell save DC +1 and Advantage on attack rolls of Sorcerer spells. Two uses; all return on a Long Rest."
    },
    {
        id: 'sorcerousRestoration', label: 'Sorcerous Restoration',
        appliesTo: { className: 'sorcerer', minLevel: 5 },
        max: function (cfg, st) { return 1; },
        stateKey: 'sorcerousRestorationUsed', recharge: 'long', featureNames: ['Sorcerous Restoration'],
        desc: "After a Short Rest: regain up to half your Sorcerer level (round down) in Sorcery Points. Once per Long Rest."
    },
    {
        id: 'sorceryPoints', label: 'Sorcery Points',
        appliesTo: { className: 'sorcerer', minLevel: 2 },
        max: function (cfg, st) { return st.level || 1; },
        stateKey: 'sorceryPointsUsed', recharge: 'long', featureNames: ['Font of Magic'],
        desc: "Font of Magic. Bonus Action: turn points into a spell slot (level 1 = 2 points, 2 = 3, 3 = 5, 4 = 6, 5 = 7; you need Sorcerer level 2/3/5/7/9) or a slot into points (= its level, no action). Fuels Metamagic. All points return on a Long Rest."
    },
    {
        id: 'restoreBalance', label: 'Restore Balance',
        appliesTo: { className: 'sorcerer', subclass: 'clockwork', minLevel: 3 },
        max: function (cfg, st) { return _resMod(cfg, st, 'cha'); },
        stateKey: 'restoreBalanceUsed', recharge: 'long', featureNames: ['Restore Balance'],
        desc: "Reaction: cancel Advantage/Disadvantage on a d20 roll within 60 ft. Uses = Charisma modifier (min 1) per Long Rest."
    },
    {
        id: 'tidesOfChaos', label: 'Tides of Chaos',
        appliesTo: { className: 'sorcerer', subclass: 'wildMagic', minLevel: 3 },
        max: function (cfg, st) { return 1; },
        stateKey: 'tidesOfChaosUsed', recharge: 'long', featureNames: ['Tides of Chaos'],
        desc: "Advantage on one D20 Test. Back on a Long Rest, or when you cast a Sorcerer spell with a slot (which triggers a Wild Magic Surge roll)."
    },
    // ---- Warlock ----
    {
        id: 'magicalCunning', label: 'Magical Cunning',
        appliesTo: { className: 'warlock', minLevel: 2 },
        max: function (cfg, st) { return 1; },
        stateKey: 'magicalCunningUsed', recharge: 'long', featureNames: ['Magical Cunning'],
        desc: "Spend 1 minute in an esoteric rite: regain expended Pact Magic slots equal to half your maximum (round up). Once per Long Rest."
    },
    {
        id: 'healingLight', label: 'Healing Light', unit: 'd6',
        appliesTo: { className: 'warlock', subclass: 'celestial', minLevel: 3 },
        max: function (cfg, st) { return 1 + (st.level || 1); },
        stateKey: 'healingLightUsed', recharge: 'long', featureNames: ['Healing Light'],
        desc: "Pool of d6s (1 + Warlock level). Bonus Action: heal a creature within 60 ft with up to your Charisma modifier (min 1) dice. Refills on a Long Rest."
    },
    // ---- Wizard ----
    {
        id: 'arcaneRecovery', label: 'Arcane Recovery',
        appliesTo: { className: 'wizard', minLevel: 1 },
        max: function (cfg, st) { return 1; },
        stateKey: 'arcaneRecoveryUsed', recharge: 'long', featureNames: ['Arcane Recovery'],
        desc: "Once per day when you finish a Short Rest: recover expended spell slots with a combined level of up to half your Wizard level (round up)."
    },
    {
        id: 'arcaneWard', label: 'Arcane Ward',
        appliesTo: { className: 'wizard', subclass: 'abjuration', minLevel: 3 },
        max: function (cfg, st) { return 1; },
        stateKey: 'arcaneWardUsed', recharge: 'long', featureNames: ['Arcane Ward'],
        desc: "Create your ward once per Long Rest (when you cast an Abjuration spell with a slot). Ward HP = 2 × Wizard level + INT modifier."
    },
    {
        id: 'portent', label: 'Portent', unit: 'd20 rolls',
        appliesTo: { className: 'wizard', subclass: 'divination', minLevel: 3 },
        max: function (cfg, st) { return (st.level || 1) >= 14 ? 3 : 2; },
        stateKey: 'portentUsed', recharge: 'long', featureNames: ['Portent'],
        desc: "Foretelling rolls (two d20s after each Long Rest) to replace a D20 Test of you or a creature you can see. Unused rolls are lost on your next Long Rest."
    },
    // ---- Species ----
    {
        id: 'healingHands', label: 'Healing Hands',
        appliesTo: { race: 'aasimar', minLevel: 1 },
        max: function (cfg, st) { return 1; },
        stateKey: 'healingHandsUsed', recharge: 'long', featureNames: ['Healing Hands'],
        desc: "Magic action: touch a creature; it regains HP equal to Proficiency Bonus × d4. Once per Long Rest."
    },
    {
        id: 'celestialRevelation', label: 'Celestial Revelation',
        appliesTo: { race: 'aasimar', minLevel: 3 },
        max: function (cfg, st) { return 1; },
        stateKey: 'celestialRevelationUsed', recharge: 'long', featureNames: ['Celestial Revelation'],
        desc: "Bonus Action: transform for 1 minute (choose Heavenly Wings, Inner Radiance or Necrotic Shroud each time). Once per Long Rest."
    },
    {
        id: 'breathWeapon', label: 'Breath Weapon',
        appliesTo: { race: 'dragonborn', minLevel: 1 },
        max: function (cfg, st) { return getProfBonus(st.level || 1); },
        stateKey: 'breathWeaponUsed', recharge: 'long', featureNames: ['Breath Weapon'],
        desc: "Replace one attack with a 15-ft Cone or 30-ft Line (DEX save). Uses = Proficiency Bonus per Long Rest."
    },
    {
        id: 'draconicFlight', label: 'Draconic Flight',
        appliesTo: { race: 'dragonborn', minLevel: 5 },
        max: function (cfg, st) { return 1; },
        stateKey: 'draconicFlightUsed', recharge: 'long', featureNames: ['Draconic Flight'],
        desc: "Bonus Action: spectral wings for 10 minutes (Fly Speed = Speed). Once per Long Rest."
    },
    {
        id: 'stonecunning', label: 'Stonecunning',
        appliesTo: { race: 'dwarf', minLevel: 1 },
        max: function (cfg, st) { return getProfBonus(st.level || 1); },
        stateKey: 'stonecunningUsed', recharge: 'long', featureNames: ['Stonecunning'],
        desc: "Bonus Action: Tremorsense 60 ft for 10 minutes while on or touching stone. Uses = Proficiency Bonus per Long Rest."
    },
    {
        id: 'giantAncestry', label: 'Giant Ancestry',
        appliesTo: { race: 'goliath', minLevel: 1 },
        max: function (cfg, st) { return getProfBonus(st.level || 1); },
        stateKey: 'giantAncestryUsed', recharge: 'long',
        featureNames: ['Giant Ancestry', "Cloud's Jaunt", "Fire's Burn", "Frost's Chill", "Hill's Tumble", "Stone's Endurance", "Storm's Thunder"],
        desc: "Your giant boon. Uses = Proficiency Bonus per Long Rest."
    },
    {
        id: 'largeForm', label: 'Large Form',
        appliesTo: { race: 'goliath', minLevel: 5 },
        max: function (cfg, st) { return 1; },
        stateKey: 'largeFormUsed', recharge: 'long', featureNames: ['Large Form'],
        desc: "Bonus Action: become Large for 10 minutes. Once per Long Rest."
    },
    {
        id: 'heroicInspiration', label: 'Heroic Inspiration',
        appliesTo: { race: 'human', minLevel: 1 },
        max: function (cfg, st) { return 1; },
        stateKey: 'heroicInspirationUsed', recharge: 'long', featureNames: ['Resourceful'],
        desc: "Resourceful: you gain Heroic Inspiration on every Long Rest. Spend it to reroll any die right after rolling it."
    },
    {
        id: 'adrenalineRush', label: 'Adrenaline Rush',
        appliesTo: { race: 'orc', minLevel: 1 },
        max: function (cfg, st) { return getProfBonus(st.level || 1); },
        stateKey: 'adrenalineRushUsed', recharge: 'short', featureNames: ['Adrenaline Rush'],
        desc: "Bonus Action Dash + Temporary HP equal to your Proficiency Bonus. Uses = Proficiency Bonus; all return on a Short or Long Rest."
    },
    {
        id: 'relentlessEndurance', label: 'Relentless Endurance',
        appliesTo: { race: 'orc', minLevel: 1 },
        max: function (cfg, st) { return 1; },
        stateKey: 'relentlessEnduranceUsed', recharge: 'long', featureNames: ['Relentless Endurance'],
        desc: "Drop to 1 HP instead of 0 (unless killed outright). Once per Long Rest."
    },
    // ---- Feats ----
    {
        id: 'luckPoints', label: 'Luck Points',
        appliesTo: { feat: 'Lucky' },
        max: function (cfg, st) { return getProfBonus(st.level || 1); },
        stateKey: 'luckPointsUsed', recharge: 'long', featureNames: ['Lucky'],
        desc: "Lucky: spend one for Advantage on your D20 Test or Disadvantage on an attack roll against you. Uses = Proficiency Bonus per Long Rest."
    },
    {
        id: 'guardedMind', label: 'Guarded Mind',
        appliesTo: { feat: 'Mage Slayer' },
        max: function (cfg, st) { return 1; },
        stateKey: 'guardedMindUsed', recharge: 'short', featureNames: ['Mage Slayer'],
        desc: "Mage Slayer: turn a failed INT, WIS or CHA save into a success. Once per Short or Long Rest."
    },
    {
        id: 'quickRitual', label: 'Quick Ritual',
        appliesTo: { feat: 'Ritual Caster' },
        max: function (cfg, st) { return 1; },
        stateKey: 'quickRitualUsed', recharge: 'long', featureNames: ['Ritual Caster'],
        desc: "Ritual Caster: cast a prepared Ritual spell at its normal casting time without a slot. Once per Long Rest."
    }
];

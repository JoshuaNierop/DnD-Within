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
            7: [
                { name: "Sorcery Incarnate", desc: "With no Innate Sorcery uses left, you can still activate it by spending 2 Sorcery Points as part of the Bonus Action. While Innate Sorcery is active, you can apply up to two Metamagic options to each spell you cast." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for, including Origin feats. You get this again at levels 8, 12 and 16 (Epic Boon at 19)." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            10: [
                { name: "Metamagic", desc: "You learn two more Metamagic options (four in total). Still one option per spell unless an option or Sorcery Incarnate says otherwise." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
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
                        { name: "Bend Luck", act: 'reaction', desc: "Right after another creature you can see rolls the d20 for a D20 Test, you can take a Reaction and spend 1 Sorcery Point: roll 1d4 and add it to or subtract it from that d20 roll (your choice)." }
                    ],
                    14: [
                        { name: "Controlled Chaos", desc: "Whenever you roll on the Wild Magic Surge table, you can roll twice and use either number." }
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
                        { name: "Elemental Affinity", desc: "Pick a dragon damage type: Acid, Cold, Fire, Lightning or Poison. You have Resistance to it, and when you cast a spell that deals that type of damage, add your Charisma modifier to one damage roll of the spell." }
                    ],
                    14: [
                        { name: "Dragon Wings", act: 'bonus', desc: "Bonus Action: draconic wings give you a Fly Speed of 60 ft for 1 hour or until you dismiss them (no action). Once per Long Rest, or restore it by spending 3 Sorcery Points (no action)." }
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
                        { name: "Bastion of Law", act: 'action', desc: "Magic action: spend 1 to 5 Sorcery Points to ward yourself or a creature you can see within 30 ft with that many d8s. When the warded creature takes damage, it can spend some of those dice, roll them and reduce the damage by the total. The ward lasts until you finish a Long Rest or use this feature again." }
                    ],
                    14: [
                        { name: "Trance of Order", act: 'bonus', desc: "Bonus Action: for 1 minute, attack rolls against you can't have Advantage, and when you make a D20 Test you can treat a d20 roll of 9 or lower as a 10. Once per Long Rest, or restore it by spending 5 Sorcery Points (no action)." }
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
                        { name: "Psionic Sorcery", desc: "You can cast your level 1+ Psionic Spells with a spell slot or by spending Sorcery Points equal to the spell's level. Cast with points, the spell needs no Verbal or Somatic components, and no Material components unless they are consumed or have a cost." },
                        { name: "Psychic Defenses", desc: "You have Resistance to Psychic damage, and Advantage on saving throws to avoid or end the Charmed or Frightened condition." }
                    ],
                    14: [
                        { name: "Revelation in Flesh", act: 'bonus', desc: "Bonus Action: spend 1 or more Sorcery Points to change your body for 10 minutes, gaining one benefit per point: Aquatic Adaptation (Swim Speed twice your Speed, breathe underwater), Glistening Flight (Fly Speed equal to your Speed, hover), See the Invisible (see Invisible creatures within 60 ft not behind Total Cover) or Wormlike Movement (move through spaces as narrow as 1 inch; spend 5 ft of movement to escape the Grappled condition or nonmagical restraints)." }
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
                { name: "Expertise", desc: "You gain Expertise in two more of your skill proficiencies." }
            ],
            7: [
                { name: "Evasion", desc: "When an effect lets you make a Dexterity saving throw to take only half damage, you take no damage on a success and half damage on a failure. Not while you have the Incapacitated condition." },
                { name: "Reliable Talent", desc: "When you make an ability check that uses one of your skill or tool proficiencies, you can treat a d20 roll of 9 or lower as a 10." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            10: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            11: [
                { name: "Improved Cunning Strike", desc: "You can use up to two Cunning Strike effects when you deal Sneak Attack damage, paying the die cost of each." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            14: [
                { name: "Devious Strikes", act: 'attack', desc: "New Cunning Strike options: Daze (cost 2d6; Constitution save or on its next turn the target can only move, or take an action, or take a Bonus Action), Knock Out (cost 6d6; Constitution save or Unconscious for 1 minute or until it takes damage, repeating the save at the end of each of its turns) and Obscure (cost 3d6; Dexterity save or Blinded until the end of its next turn)." }
            ],
            15: [
                { name: "Slippery Mind", desc: "You gain proficiency in Wisdom and Charisma saving throws." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
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
                        { name: "Supreme Sneak", act: 'attack', desc: "New Cunning Strike option — Stealth Attack (cost 1d6): if you have the Invisible condition from the Hide action, this attack doesn't end it as long as you end the turn behind Three-Quarters or Total Cover." }
                    ],
                    13: [
                        { name: "Use Magic Device", desc: "You can attune to up to four magic items at once. When you use a magic item property that expends charges, roll 1d6: on a 6 it costs no charges. You can use any Spell Scroll with Intelligence as your spellcasting ability — cantrips and level 1 spells reliably, higher levels after a successful Intelligence (Arcana) check (DC 10 + spell level; on a failure the scroll crumbles)." }
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
                        { name: "Infiltration Expertise", desc: "Masterful Mimicry: after studying someone for at least 1 hour, you can flawlessly imitate their speech, handwriting or both. Roving Aim: using Steady Aim no longer reduces your Speed to 0." }
                    ],
                    13: [
                        { name: "Envenom Weapons", desc: "When you use the Poison option of Cunning Strike, a target that fails the save also takes 2d6 Poison damage; this damage ignores Resistance to Poison damage." }
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
                        { name: "Magical Ambush", desc: "If you have the Invisible condition when you cast a spell on a creature, it has Disadvantage on any saving throw it makes against that spell on the same turn." }
                    ],
                    13: [
                        { name: "Versatile Trickster", desc: "When you use the Trip option of Cunning Strike on a creature, you can also use it on another creature within 5 ft of your spectral Mage Hand." }
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
                        { name: "Soul Blades", desc: "Your Psychic Blades gain two powers: Homing Strikes and Psychic Teleportation." },
                        { name: "Homing Strikes", act: 'free', desc: "When an attack roll with your Psychic Blade misses, you can roll one Psionic Energy Die and add it to the roll; the die is spent only if the attack then hits." },
                        { name: "Psychic Teleportation", act: 'bonus', desc: "Bonus Action: manifest a Psychic Blade, spend and roll one Psionic Energy Die, and throw the blade at an unoccupied space you can see up to 10 × the roll in feet away. You teleport to that space and the blade vanishes." }
                    ],
                    13: [
                        { name: "Psychic Veil", act: 'action', desc: "Magic action: you have the Invisible condition for 1 hour or until you dismiss it (no action); it ends right after you deal damage to a creature or force one to make a saving throw. Once per Long Rest, or restore it by spending a Psionic Energy Die (no action)." }
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
                { name: "Roving", desc: "While you aren't wearing Heavy armor your Speed increases by 10 ft, and you have a Climb Speed and a Swim Speed equal to your Speed." }
            ],
            9: [
                { name: "Expertise", desc: "You gain Expertise in two of your skill proficiencies that don't have it yet." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            10: [
                { name: "Tireless", act: 'action', desc: "Magic action: give yourself Temporary Hit Points equal to 1d8 + your Wisdom modifier (min 1). Uses = your Wisdom modifier (min 1) per Long Rest. Whenever you finish a Short Rest, your Exhaustion level (if any) drops by 1." }
            ],
            13: [
                { name: "Relentless Hunter", desc: "Taking damage can't break your Concentration on Hunter's Mark." }
            ],
            14: [
                { name: "Nature's Veil", act: 'bonus', desc: "Bonus Action: give yourself the Invisible condition until the end of your next turn. Uses = your Wisdom modifier (min 1) per Long Rest." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
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
                        { name: "Defensive Tactics", desc: "Pick one option (asked at level-up); you can switch whenever you finish a Short or Long Rest. Escape the Horde: Opportunity Attacks have Disadvantage against you. Multiattack Defense: when a creature hits you with an attack roll, it has Disadvantage on all its other attack rolls against you this turn." }
                    ],
                    11: [
                        { name: "Superior Hunter's Prey", desc: "Once per turn, when you deal damage to a creature marked by your Hunter's Mark, you can also deal that spell's extra damage to a different creature you can see within 30 ft of the first." }
                    ],
                    15: [
                        { name: "Superior Hunter's Defense", act: 'reaction', desc: "When you take damage, you can take a Reaction to give yourself Resistance to that damage and any other damage of the same type until the end of the current turn." }
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
                        { name: "Exceptional Training", desc: "When you use a Bonus Action to command your Primal Companion to take an action, you can also have it take the Dash, Disengage, Dodge or Help action with its Bonus Action. Whenever it hits with an attack roll and deals damage, it can deal Force damage or its normal damage type." }
                    ],
                    11: [
                        { name: "Bestial Fury", desc: "When you command your Primal Companion to take the Beast's Strike action, it can use it twice. The first time each turn it hits a creature marked by your Hunter's Mark, it deals extra Force damage equal to that spell's bonus damage." }
                    ],
                    15: [
                        { name: "Share Spells", desc: "When you cast a spell targeting yourself, it can also affect your Primal Companion if it is within 30 ft of you." }
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
                    { name: "Summon Fey", lvl: 11, kind: 'innate', free: 1, recharge: 'long', slots: true, note: "Fey Reinforcements: no Material component; you can drop Concentration (lasts 1 minute)" },
                    { name: "Dimension Door", lvl: 13, kind: 'prepared' },
                    { name: "Misty Step", lvl: 15, kind: 'innate', free: 'wis', recharge: 'long', slots: true, note: "Misty Wanderer: you can bring one willing creature within 5 ft" },
                    { name: "Mislead", lvl: 17, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Dreadful Strikes", act: 'attack', desc: "When you hit a creature with a weapon, you can deal an extra 1d4 Psychic damage (once per turn per creature; 1d6 from level 11)." },
                        { name: "Otherworldly Glamour", desc: "Add your Wisdom modifier (min +1) to your Charisma checks, and gain proficiency in Deception, Performance or Persuasion (your choice)." },
                        { name: "Fey Wanderer Spells", desc: "Always prepared: Charm Person (level 3); Misty Step (5); Summon Fey (9); Dimension Door (13); Mislead (17). You also carry a small fey blessing (a harmless quirk of your choice)." }
                    ],
                    7: [
                        { name: "Beguiling Twist", act: 'reaction', desc: "You have Advantage on saving throws to avoid or end the Charmed or Frightened condition. When you or a creature you can see within 120 ft succeeds on such a save, you can take a Reaction: another creature you can see within 120 ft makes a Wisdom saving throw against your spell save DC or is Charmed or Frightened (your choice) for 1 minute, repeating the save at the end of each of its turns." }
                    ],
                    11: [
                        { name: "Fey Reinforcements", desc: "You can cast Summon Fey without a Material component, and once per Long Rest without a spell slot. When you cast it, you can drop the Concentration requirement; that casting then lasts 1 minute." }
                    ],
                    15: [
                        { name: "Misty Wanderer", desc: "You can cast Misty Step without a spell slot a number of times equal to your Wisdom modifier (min 1) per Long Rest. Whenever you cast Misty Step, you can bring one willing creature you can see within 5 ft; it arrives within 5 ft of your destination." }
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
                        { name: "Iron Mind", desc: "You gain proficiency in Wisdom saving throws; if you already have it, you gain proficiency in Intelligence or Charisma saving throws instead (your choice)." }
                    ],
                    11: [
                        { name: "Stalker's Flurry", act: 'attack', desc: "Your Dreadful Strike's Psychic damage becomes 2d8, and when you use Dreadful Strike you can add one effect: Sudden Strike (another attack with the same weapon against a different creature within 5 ft of the target and in range) or Mass Fear (the target and each creature within 10 ft of it make a Wisdom save against your spell save DC or are Frightened until the start of your next turn)." }
                    ],
                    15: [
                        { name: "Shadowy Dodge", act: 'reaction', desc: "When a creature makes an attack roll against you, you can take a Reaction to give it Disadvantage; hit or miss, you can then teleport up to 30 ft to an unoccupied space you can see." }
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
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
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
                        { name: "Sculpt Spells", desc: "When you cast an Evocation spell that affects other creatures you can see, choose up to 1 + the spell's level of them: they automatically succeed on their saving throws against it and take no damage where they would take half on a success." }
                    ],
                    10: [
                        { name: "Empowered Evocation", desc: "Whenever you cast a Wizard spell of the Evocation school, you can add your Intelligence modifier to one damage roll of that spell." }
                    ],
                    14: [
                        { name: "Overchannel", desc: "When you cast a damaging Wizard spell with a level 1-5 spell slot, you can deal maximum damage with it on that turn. The first use has no drawback; each further use before a Long Rest deals you 2d12 Necrotic damage per slot level right after casting (ignoring Resistance and Immunity), growing by 1d12 per level with every later use." }
                    ]
                }
            },
            abjuration: {
                name: "Abjurer",
                level: 3,
                spells: [
                    { name: "Counterspell", lvl: 10, kind: 'prepared' },
                    { name: "Dispel Magic", lvl: 10, kind: 'prepared', note: "also as a Bonus Action; add your Proficiency Bonus to its ability check" }
                ],
                features: {
                    3: [
                        { name: "Abjuration Savant", desc: "Add two Abjuration spells of level 2 or lower to your spellbook for free. Whenever you gain access to a new level of spell slots, add one Abjuration spell of that level for free." },
                        { name: "Arcane Ward", act: 'bonus', desc: "When you cast an Abjuration spell with a spell slot, you can create a magical ward on yourself (once per Long Rest; it lasts until then) with HP = 2 × your Wizard level + your Intelligence modifier. It takes damage before you (after Resistances). Casting an Abjuration spell with a slot restores 2 × the slot's level HP to it; as a Bonus Action you can also expend a spell slot to restore 2 × its level." }
                    ],
                    6: [
                        { name: "Projected Ward", act: 'reaction', desc: "When a creature you can see within 30 ft takes damage, you can take a Reaction to have your Arcane Ward absorb it (after the creature's Resistances or Vulnerabilities). If the ward drops to 0 Hit Points, the creature takes the rest." }
                    ],
                    10: [
                        { name: "Spell Breaker", desc: "You always have Counterspell and Dispel Magic prepared. You can cast Dispel Magic as a Bonus Action and add your Proficiency Bonus to its ability check. When you cast either spell with a spell slot and it fails to stop a spell, the slot isn't expended." }
                    ],
                    14: [
                        { name: "Spell Resistance", desc: "You have Advantage on saving throws against spells and Resistance to the damage of spells." }
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
                        { name: "Expert Divination", desc: "When you cast a Divination spell with a level 2+ spell slot, you regain one expended spell slot of a lower level than the one you used (level 5 at most)." }
                    ],
                    10: [
                        { name: "The Third Eye", act: 'bonus', desc: "Bonus Action: choose one benefit that lasts until you start a Short or Long Rest — Darkvision 120 ft, read any language (Greater Comprehension), or cast See Invisibility without a spell slot. Once per Short or Long Rest." }
                    ],
                    14: [
                        { name: "Greater Portent", desc: "You roll three d20s for Portent instead of two." }
                    ]
                }
            },
            illusion: {
                name: "Illusionist",
                level: 3,
                spells: [
                    { name: "Minor Illusion", lvl: 3, kind: 'cantrip', ifKnown: 'wizard', note: "Bonus Action; sound and image at once" },
                    { name: "Summon Beast", lvl: 6, kind: 'prepared', free: 1, recharge: 'long', slots: true, note: "free cast = Illusion version with half Hit Points" },
                    { name: "Summon Fey", lvl: 6, kind: 'prepared', free: 1, recharge: 'long', slots: true, note: "free cast = Illusion version with half Hit Points" }
                ],
                features: {
                    3: [
                        { name: "Illusion Savant", desc: "Add two Illusion spells of level 2 or lower to your spellbook for free. Whenever you gain access to a new level of spell slots, add one Illusion spell of that level for free." },
                        { name: "Improved Illusions", act: 'bonus', desc: "You cast Illusion spells without Verbal components, and Illusion spells with a range of 10 ft or more get +60 ft range. You know Minor Illusion (if you already knew it, learn another Wizard cantrip instead); it doesn't count against your cantrips, creates both a sound and an image in one casting, and can be cast as a Bonus Action." }
                    ],
                    6: [
                        { name: "Phantasmal Creatures", desc: "You always have Summon Beast and Summon Fey prepared. When you cast either, you can make it an Illusion spell so the creature looks spectral. You can cast the Illusion version of each spell once per Long Rest without a spell slot, but then the creature has half its Hit Points." }
                    ],
                    10: [
                        { name: "Illusory Self", act: 'reaction', desc: "When a creature hits you with an attack roll, you can take a Reaction to put an illusory double between you: the attack automatically misses, then the illusion fades. Once per Short or Long Rest, or restore it by spending a level 2+ spell slot (no action)." }
                    ],
                    14: [
                        { name: "Illusory Reality", act: 'bonus', desc: "When you cast an Illusion spell with a spell slot, you can make one inanimate, nonmagical object in the illusion real (a Bonus Action on your turn while the spell lasts). It stays real for 1 minute and can't deal damage or cause conditions — an illusory bridge you can actually cross." }
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
                { name: "Aura of Protection", desc: "You radiate an invisible 10-ft Emanation (inactive while you have the Incapacitated condition). You and your allies in it add your Charisma modifier (min +1) to saving throws. A creature in more than one Paladin's aura benefits from only one, its choice. (Not added to saves on this site — apply it at the table.)" }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            9: [
                { name: "Abjure Foes", act: 'action', desc: "Magic action, one Channel Divinity use: up to your Charisma modifier (min 1) creatures you can see within 60 ft each make a Wisdom saving throw or have the Frightened condition for 1 minute or until they take damage. While Frightened this way, a target can only move, take an action or take a Bonus Action on its turn — one of the three." }
            ],
            10: [
                { name: "Aura of Courage", desc: "You and your allies have Immunity to the Frightened condition while in your Aura of Protection; an ally who is already Frightened ignores the condition while there." }
            ],
            11: [
                { name: "Radiant Strikes", act: 'attack', desc: "When you hit a target with an attack roll using a Melee weapon or an Unarmed Strike, it takes an extra 1d8 Radiant damage." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            14: [
                { name: "Restoring Touch", desc: "When you use Lay on Hands on a creature, you can also remove one or more of these conditions from it: Blinded, Charmed, Deafened, Frightened, Paralyzed or Stunned — 5 Hit Points from the pool per condition (those points don't heal)." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
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
                        { name: "Aura of Devotion", desc: "You and your allies have Immunity to the Charmed condition while in your Aura of Protection; an ally who is already Charmed ignores the condition while there." }
                    ],
                    15: [
                        { name: "Smite of Protection", desc: "Whenever you cast Divine Smite, you and your allies have Half Cover while in your Aura of Protection, until the start of your next turn." }
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
                        { name: "Aura of Warding", desc: "You and your allies have Resistance to Necrotic, Psychic and Radiant damage while in your Aura of Protection." }
                    ],
                    15: [
                        { name: "Undying Sentinel", desc: "When you are reduced to 0 Hit Points and not killed outright, you can drop to 1 Hit Point instead and regain Hit Points equal to three times your Paladin level (once per Long Rest). You can't be aged magically and you stop visibly aging." }
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
                        { name: "Aura of Alacrity", desc: "Your Speed increases by 10 ft. When an ally enters your Aura of Protection for the first time on a turn or starts its turn there, its Speed increases by 10 ft until the end of its next turn." }
                    ],
                    15: [
                        { name: "Glorious Defense", act: 'reaction', desc: "When you or a creature you can see within 10 ft is hit by an attack roll, you can take a Reaction to add your Charisma modifier (min +1) to the target's AC against it, possibly making it miss; if it misses, you can make one weapon attack against the attacker as part of the Reaction if it's in range. Uses = your Charisma modifier (min 1) per Long Rest." }
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
                        { name: "Relentless Avenger", act: 'reaction', desc: "When you hit a creature with an Opportunity Attack, you can reduce its Speed to 0 until the end of the current turn, then move up to half your Speed as part of the same Reaction without provoking Opportunity Attacks." }
                    ],
                    15: [
                        { name: "Soul of Vengeance", act: 'reaction', desc: "Right after a creature under your Vow of Enmity hits or misses with an attack roll, you can take a Reaction to make a melee attack against it if it's within range." }
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
                { name: "Elemental Fury", desc: "Pick one option (asked at level-up): Potent Spellcasting — add your Wisdom modifier to the damage of your Druid cantrips; or Primal Strike — once on each of your turns when you hit a creature with a weapon attack or a Beast form's attack in Wild Shape, it takes an extra 1d8 Cold, Fire, Lightning or Thunder damage (choose when you hit)." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            15: [
                { name: "Improved Elemental Fury", desc: "Your Elemental Fury option grows: Potent Spellcasting — your Druid cantrips with a range of 10 ft or more gain 300 ft of range; Primal Strike — the extra damage becomes 2d8." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
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
                        { name: "Natural Recovery", desc: "Once per Long Rest you can cast one of your level 1+ Circle Spells without a spell slot. Also once per Long Rest, when you finish a Short Rest, you can recover expended spell slots with a combined level of up to half your Druid level (round up), none of level 6 or higher." }
                    ],
                    10: [
                        { name: "Nature's Ward", desc: "You have Immunity to the Poisoned condition and Resistance to the damage type of your current land: Arid — Fire, Polar — Cold, Temperate — Lightning, Tropical — Poison." }
                    ],
                    14: [
                        { name: "Nature's Sanctuary", act: 'action', desc: "Magic action, one Wild Shape use: spectral trees and vines fill a 15-ft Cube on the ground within 120 ft for 1 minute (or until you're Incapacitated or die). You and your allies in it have Half Cover, and your allies there gain your current Nature's Ward Resistance. Bonus Action: move the Cube up to 60 ft (staying within 120 ft of you)." }
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
                        { name: "Improved Circle Forms", desc: "While in a Wild Shape form: each attack can deal its normal damage type or Radiant damage (choose on each hit), and you can add your Wisdom modifier to your Constitution saving throws." }
                    ],
                    10: [
                        { name: "Moonlight Step", act: 'bonus', desc: "Bonus Action: teleport up to 30 ft to an unoccupied space you can see, and have Advantage on the next attack roll you make before the end of this turn. Uses = your Wisdom modifier (min 1) per Long Rest; you can also restore a use by spending a level 2+ spell slot (no action)." }
                    ],
                    14: [
                        { name: "Lunar Form", desc: "Improved Lunar Radiance: once per turn, a Wild Shape form's attack that hits deals an extra 2d10 Radiant damage. Shared Moonlight: when you use Moonlight Step, you can also teleport one willing creature within 10 ft of you to a space within 10 ft of your destination." }
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
                        { name: "Aquatic Affinity", desc: "The Emanation of your Wrath of the Sea grows to 10 ft, and you gain a Swim Speed equal to your Speed." }
                    ],
                    10: [
                        { name: "Stormborn", desc: "While your Wrath of the Sea is active you have a Fly Speed equal to your Speed and Resistance to Cold, Lightning and Thunder damage." }
                    ],
                    14: [
                        { name: "Oceanic Gift", desc: "You can manifest the Emanation of your Wrath of the Sea around a willing creature within 60 ft instead of yourself; it gets all the benefits and uses your spell save DC and Wisdom modifier. By spending two Wild Shape uses instead of one, you can manifest it around both of you." }
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
                        { name: "Cosmic Omen", act: 'reaction', desc: "When you finish a Long Rest, roll a die. Even — Weal: when a creature you can see within 30 ft is about to make a D20 Test, you can take a Reaction to add 1d6 to it. Odd — Woe: same trigger, but you subtract 1d6. Uses = your Wisdom modifier (min 1) per Long Rest." }
                    ],
                    10: [
                        { name: "Twinkling Constellations", desc: "The Archer's and the Chalice's 1d8 become 2d8, and while the Dragon is active you have a Fly Speed of 20 ft and can hover. At the start of each of your turns in Starry Form, you can switch to another constellation." }
                    ],
                    14: [
                        { name: "Full of Stars", desc: "While in your Starry Form you are partly incorporeal: Resistance to Bludgeoning, Piercing and Slashing damage." }
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
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            9: [
                { name: "Indomitable", act: 'free', desc: "When you fail a saving throw, you can reroll it with a bonus equal to your Fighter level; you must use the new roll. Once per Long Rest (twice from level 13, three times from level 17)." },
                { name: "Tactical Master", act: 'attack', desc: "When you attack with a weapon whose mastery property you can use, you can replace that property with Push, Sap or Slow for that attack." }
            ],
            11: [
                { name: "Two Extra Attacks", desc: "You can attack three times instead of once whenever you take the Attack action on your turn." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            13: [
                { name: "Studied Attacks", desc: "When you make an attack roll against a creature and miss, you have Advantage on your next attack roll against it before the end of your next turn." },
                { name: "Indomitable", desc: "You can now use Indomitable twice per Long Rest (three times from level 17)." }
            ],
            14: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
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
                        { name: "Additional Fighting Style", desc: "You gain another Fighting Style feat of your choice (asked at level-up)." }
                    ],
                    10: [
                        { name: "Heroic Warrior", desc: "During combat, whenever you start your turn without Heroic Inspiration, you gain it." }
                    ],
                    15: [
                        { name: "Superior Critical", desc: "Your attack rolls with weapons and Unarmed Strikes score a Critical Hit on a roll of 18-20." }
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
                        { name: "Know Your Enemy", act: 'bonus', desc: "Bonus Action: learn whether a creature you can see within 30 ft has any Immunities, Resistances or Vulnerabilities, and what they are. Once per Long Rest, or restore it by spending a Superiority Die (no action)." }
                    ],
                    10: [
                        { name: "Improved Combat Superiority", desc: "Your Superiority Die becomes a d10." }
                    ],
                    15: [
                        { name: "Relentless", desc: "Once per turn, when you use a maneuver, you can roll 1d8 and use that instead of spending a Superiority Die." }
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
                        { name: "War Magic", desc: "When you take the Attack action on your turn, you can replace one of the attacks with casting one of your Wizard cantrips that has a casting time of an action." }
                    ],
                    10: [
                        { name: "Eldritch Strike", desc: "When you hit a creature with a weapon attack, it has Disadvantage on the next saving throw it makes against a spell you cast before the end of your next turn." }
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
                        { name: "Telekinetic Adept", desc: "You gain two new telekinetic powers: Psi-Powered Leap and Telekinetic Thrust." },
                        { name: "Psi-Powered Leap", act: 'bonus', desc: "Bonus Action: gain a Fly Speed equal to twice your Speed until the end of the turn. Once per Short or Long Rest, or restore it by spending a Psionic Energy Die (no action)." },
                        { name: "Telekinetic Thrust", act: 'attack', desc: "When your Psionic Strike damages a target, you can force it to make a Strength saving throw (DC 8 + Intelligence modifier + Proficiency Bonus); on a failure you give it the Prone condition or move it up to 10 ft horizontally." }
                    ],
                    10: [
                        { name: "Guarded Mind", desc: "You have Resistance to Psychic damage. If you start your turn Charmed or Frightened, you can spend a Psionic Energy Die (no action) to end every effect on you that causes those conditions." }
                    ],
                    15: [
                        { name: "Bulwark of Force", act: 'bonus', desc: "Bonus Action: up to your Intelligence modifier (min 1) creatures within 30 ft, yourself included, have Half Cover for 1 minute or until you're Incapacitated. Once per Long Rest, or restore it by spending a Psionic Energy Die (no action)." }
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
        // Contact Patron (9): Contact Other Plane always prepared, one free cast per Long Rest
        spells: [
            { name: "Contact Other Plane", lvl: 9, kind: 'innate', free: 1, recharge: 'long', slots: true, note: "to contact your patron; you automatically succeed on its saving throw" },
            // Mystic Arcanum: picks stored in state.featurePicks.mysticArcanum.arcanum<level>
            { pick: 'arcanum6', count: 1, list: 'warlock', level: 6, kind: 'innate', free: 1, recharge: 'long', lvl: 11, key: 'mysticArcanum', label: 'Mystic Arcanum (level 6)' },
            { pick: 'arcanum7', count: 1, list: 'warlock', level: 7, kind: 'innate', free: 1, recharge: 'long', lvl: 13, key: 'mysticArcanum', label: 'Mystic Arcanum (level 7)' },
            { pick: 'arcanum8', count: 1, list: 'warlock', level: 8, kind: 'innate', free: 1, recharge: 'long', lvl: 15, key: 'mysticArcanum', label: 'Mystic Arcanum (level 8)' },
            { pick: 'arcanum9', count: 1, list: 'warlock', level: 9, kind: 'innate', free: 1, recharge: 'long', lvl: 17, key: 'mysticArcanum', label: 'Mystic Arcanum (level 9)' }
        ],

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
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            9: [
                { name: "Contact Patron", desc: "You always have Contact Other Plane prepared. Once per Long Rest you can cast it without a spell slot to contact your patron, and you automatically succeed on its saving throw." }
            ],
            11: [
                { name: "Mystic Arcanum", desc: "Choose one level 6 Warlock spell (asked at level-up). You can cast it once without a spell slot, regained on a Long Rest. You gain another such arcanum at Warlock level 13 (level 7 spell), 15 (level 8) and 17 (level 9). Whenever you gain a Warlock level, you can replace one arcanum spell with another Warlock spell of the same level." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            13: [
                { name: "Mystic Arcanum", desc: "You gain a level 7 Warlock spell as an arcanum (cast once per Long Rest without a spell slot)." }
            ],
            15: [
                { name: "Mystic Arcanum", desc: "You gain a level 8 Warlock spell as an arcanum (cast once per Long Rest without a spell slot)." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            17: [
                { name: "Mystic Arcanum", desc: "You gain a level 9 Warlock spell as an arcanum (cast once per Long Rest without a spell slot)." }
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
                        { name: "Dark One's Own Luck", act: 'free', desc: "When you make an ability check or a saving throw, you can add 1d10 to the roll — even after seeing it, but before its effects. Uses = your Charisma modifier (min 1) per Long Rest, at most once per roll." }
                    ],
                    10: [
                        { name: "Fiendish Resilience", desc: "Whenever you finish a Short or Long Rest, choose one damage type other than Force. You have Resistance to it until you choose a different one with this feature." }
                    ],
                    14: [
                        { name: "Hurl Through Hell", act: 'attack', desc: "Once per turn when you hit a creature with an attack roll, it makes a Charisma saving throw against your spell save DC or vanishes through the Lower Planes: 8d10 Psychic damage (unless it's a Fiend) and Incapacitated until the end of your next turn, when it returns to its space (or the nearest free one). Once per Long Rest, or restore it by spending a Pact Magic slot (no action)." }
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
                        { name: "Misty Escape", act: 'reaction', desc: "You can cast Misty Step as a Reaction when you take damage. Two new Steps of the Fey options: Disappearing Step (you have the Invisible condition until the start of your next turn or until right after you make an attack roll, deal damage or cast a spell) and Dreadful Step (creatures within 5 ft of the space you left or arrive in — your choice — make a Wisdom saving throw against your spell save DC or take 2d10 Psychic damage)." }
                    ],
                    10: [
                        { name: "Beguiling Defenses", act: 'reaction', desc: "You have Immunity to the Charmed condition. Right after a creature you can see hits you with an attack roll, you can take a Reaction to halve the damage (round down); the attacker makes a Wisdom saving throw against your spell save DC or takes Psychic damage equal to the damage you take. Once per Long Rest, or restore it by spending a Pact Magic slot (no action)." }
                    ],
                    14: [
                        { name: "Bewitching Magic", desc: "Right after you cast an Enchantment or Illusion spell using an action and a spell slot, you can cast Misty Step as part of the same action without a spell slot." }
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
                        { name: "Radiant Soul", desc: "You have Resistance to Radiant damage. Once per turn, when a spell you cast deals Radiant or Fire damage, you can add your Charisma modifier to that spell's damage against one of its targets." }
                    ],
                    10: [
                        { name: "Celestial Resilience", desc: "Whenever you use Magical Cunning or finish a Short or Long Rest, you gain Temporary Hit Points equal to your Warlock level + Charisma modifier, and up to five creatures you can see each gain half your Warlock level + your Charisma modifier." }
                    ],
                    14: [
                        { name: "Searing Vengeance", desc: "When you or an ally within 60 ft is about to make a Death Saving Throw, you can release radiant energy: that creature regains Hit Points equal to half its Hit Point maximum and can end the Prone condition on itself, and creatures of your choice within 30 ft of it take 2d8 + your Charisma modifier Radiant damage and are Blinded until the end of the current turn. Once per Long Rest." }
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
                    { name: "Telekinesis", lvl: 9, kind: 'prepared' },
                    { name: "Hex", lvl: 10, kind: 'prepared' }
                ],
                features: {
                    3: [
                        { name: "Awakened Mind", act: 'bonus', desc: "Bonus Action: link minds with a creature you can see within 30 ft. You can talk telepathically (in a language you both know) while within your Charisma modifier in miles (min 1) of each other, for a number of minutes equal to your Warlock level." },
                        { name: "Psychic Spells", desc: "When you cast a Warlock spell that deals damage, you can change its damage type to Psychic. You can cast Warlock Enchantment and Illusion spells without Verbal or Somatic components." },
                        { name: "Great Old One Spells", desc: "Always prepared: Detect Thoughts, Dissonant Whispers, Phantasmal Force, Tasha's Hideous Laughter (level 3); Clairvoyance, Hunger of Hadar (5); Confusion, Summon Aberration (7); Modify Memory, Telekinesis (9)." }
                    ],
                    6: [
                        { name: "Clairvoyant Combatant", desc: "When you form a telepathic bond with Awakened Mind, you can force the creature to make a Wisdom saving throw against your spell save DC. On a failure, for the duration of the bond it has Disadvantage on attack rolls against you and you have Advantage on attack rolls against it. Once per Short or Long Rest, or restore it by spending a Pact Magic slot (no action)." }
                    ],
                    10: [
                        { name: "Eldritch Hex", desc: "You always have Hex prepared. When you cast Hex and choose an ability, the target also has Disadvantage on saving throws of that ability for the spell's duration." },
                        { name: "Thought Shield", desc: "Your thoughts can't be read by telepathy or other means unless you allow it. You have Resistance to Psychic damage, and a creature that deals Psychic damage to you takes the same amount of damage." }
                    ],
                    14: [
                        { name: "Create Thrall", desc: "When you cast Summon Aberration, you can drop the Concentration requirement (the casting then lasts 1 minute); the Aberration arrives with Temporary Hit Points equal to your Warlock level + Charisma modifier. The first time each turn it hits a creature under your Hex, it deals extra Psychic damage equal to Hex's bonus damage." }
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
                { name: "Feral Instinct", desc: "You have Advantage on Initiative rolls." },
                { name: "Instinctive Pounce", desc: "As part of the Bonus Action you take to enter your Rage, you can move up to half your Speed." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            9: [
                { name: "Brutal Strike", act: 'attack', desc: "When you use Reckless Attack, you can give up the Advantage on one Strength-based attack roll on your turn (it must not have Disadvantage). If it hits, the target takes an extra 1d10 damage of the weapon's or Unarmed Strike's type and you add one effect: Forceful Blow (push the target 15 ft straight away, then you may move up to half your Speed straight toward it without provoking Opportunity Attacks) or Hamstring Blow (its Speed drops by 15 ft until the start of your next turn; only the latest Hamstring Blow counts)." }
            ],
            11: [
                { name: "Relentless Rage", desc: "If you drop to 0 Hit Points while your Rage is active and don't die outright, you can make a DC 10 Constitution saving throw; on a success your Hit Points become twice your Barbarian level instead. Each use after the first raises the DC by 5; it resets to 10 when you finish a Short or Long Rest." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            13: [
                { name: "Improved Brutal Strike", desc: "New Brutal Strike effects: Staggering Blow (the target has Disadvantage on its next saving throw and can't make Opportunity Attacks until the start of your next turn) and Sundering Blow (before the start of your next turn, the next attack roll another creature makes against the target gets +5; only one such bonus per roll)." }
            ],
            15: [
                { name: "Persistent Rage", desc: "When you roll Initiative, you can regain all expended Rage uses (once per Long Rest). Your Rage now lasts 10 minutes without needing to be extended each round; it ends early only if you have the Unconscious condition or don Heavy armor." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
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
                        { name: "Mindless Rage", desc: "While your Rage is active you have Immunity to the Charmed and Frightened conditions; if you have either when you enter your Rage, it ends." }
                    ],
                    10: [
                        { name: "Retaliation", act: 'reaction', desc: "When a creature within 5 ft of you deals damage to you, you can take a Reaction to make one melee attack against it with a weapon or an Unarmed Strike." }
                    ],
                    14: [
                        { name: "Intimidating Presence", act: 'bonus', desc: "Bonus Action: each creature of your choice in a 30-ft Emanation makes a Wisdom saving throw (DC 8 + Strength modifier + Proficiency Bonus) or is Frightened for 1 minute, repeating the save at the end of each of its turns. Once per Long Rest, or restore it by spending a Rage use (no action)." }
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
                        { name: "Aspect of the Wilds", desc: "Pick one option; you can change it whenever you finish a Long Rest. Owl: Darkvision 60 ft (or +60 ft if you already have it). Panther: a Climb Speed equal to your Speed. Salmon: a Swim Speed equal to your Speed." }
                    ],
                    10: [
                        { name: "Nature Speaker", desc: "You can cast Commune with Nature, but only as a Ritual. Wisdom is your spellcasting ability for it." }
                    ],
                    14: [
                        { name: "Power of the Wilds", desc: "Each time you activate your Rage, choose one: Falcon (while raging and wearing no armor, a Fly Speed equal to your Speed), Lion (while raging, enemies within 5 ft of you have Disadvantage on attack rolls against targets other than you or another Barbarian with this option) or Ram (while raging, a melee hit can knock a Large or smaller creature Prone)." }
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
                        { name: "Branches of the Tree", act: 'reaction', desc: "While your Rage is active, when a creature you can see starts its turn within 30 ft of you, you can take a Reaction: it makes a Strength saving throw (DC 8 + Strength modifier + Proficiency Bonus) or is teleported to an unoccupied space you can see within 5 ft of you (or the nearest one). After it teleports, you can reduce its Speed to 0 until the end of the current turn." }
                    ],
                    10: [
                        { name: "Battering Roots", desc: "On your turn your reach with melee weapons is 10 ft greater. When you hit with such a weapon on your turn, you can activate its Push or Topple mastery property in addition to a different mastery property you're using with it." }
                    ],
                    14: [
                        { name: "Travel Along the Tree", act: 'bonus', desc: "When you activate your Rage, and as a Bonus Action while it is active, you can teleport up to 60 ft to an unoccupied space you can see. Once per Rage you can extend that to 150 ft and bring up to six willing creatures within 10 ft of you, each arriving within 10 ft of your destination." }
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
                        { name: "Fanatical Focus", desc: "Once per active Rage, when you fail a saving throw, you can reroll it with a bonus equal to your Rage Damage bonus; you must use the new roll." }
                    ],
                    10: [
                        { name: "Zealous Presence", act: 'bonus', desc: "Bonus Action: a divine battle cry gives up to ten other creatures of your choice within 60 ft Advantage on attack rolls and saving throws until the start of your next turn. Once per Long Rest, unless you spend a Rage use (no action) to restore it." }
                    ],
                    14: [
                        { name: "Rage of the Gods", desc: "When you activate your Rage, you can take the form of a divine warrior for 1 minute or until you drop to 0 Hit Points (once per Long Rest): a Fly Speed equal to your Speed with hover; Resistance to Necrotic, Psychic and Radiant damage; and when a creature within 30 ft would drop to 0 Hit Points, you can take a Reaction and spend a Rage use to set its Hit Points to your Barbarian level instead." }
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
                { name: "Countercharm", act: 'reaction', desc: "When you or a creature within 30 ft of you fails a saving throw against an effect that applies the Charmed or Frightened condition, you can take a Reaction to have the save rerolled with Advantage." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            9: [
                { name: "Expertise", desc: "You gain Expertise in two more of your skill proficiencies." }
            ],
            10: [
                { name: "Magical Secrets", desc: "From now on, whenever your number of prepared spells goes up, the new spells can come from the Bard, Cleric, Druid or Wizard list; they count as Bard spells for you. When you replace a prepared Bard spell, the replacement can also come from those lists." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
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
                // Magical Discoveries: picks stored in state.featurePicks.magicalDiscoveries.spells
                spells: [
                    { pick: 'spells', count: 2, list: ['cleric', 'druid', 'wizard'], level: 'slot', cantrips: true, kind: 'prepared', lvl: 6, key: 'magicalDiscoveries', label: 'Magical Discoveries' }
                ],
                features: {
                    3: [
                        { name: "Bonus Proficiencies", desc: "You gain proficiency in three skills of your choice." },
                        { name: "Cutting Words", act: 'reaction', desc: "When a creature you can see within 60 ft makes a damage roll or succeeds on an ability check or attack roll, Reaction: spend a Bardic Inspiration use, roll the die and subtract it from that roll (possibly turning a success into a failure)." }
                    ],
                    6: [
                        { name: "Magical Discoveries", desc: "You learn two spells from the Cleric, Druid or Wizard list (any mix): cantrips or spells of a level you have spell slots for. They are always prepared, and whenever you gain a Bard level you can replace one with another that meets these rules." }
                    ],
                    14: [
                        { name: "Peerless Skill", act: 'free', desc: "When you fail an ability check or attack roll, you can spend a Bardic Inspiration use: roll the die and add it to the d20, possibly turning the failure into a success. If it still fails, the use isn't spent." }
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
                        { name: "Inspiring Movement", act: 'reaction', desc: "When an enemy you can see ends its turn within 5 ft of you, you can take a Reaction and spend a Bardic Inspiration use to move up to half your Speed; then one ally within 30 ft can use their Reaction to move up to half their Speed. None of this movement provokes Opportunity Attacks." },
                        { name: "Tandem Footwork", desc: "When you roll Initiative and don't have the Incapacitated condition, you can spend a Bardic Inspiration use: roll the die, and you and each ally within 30 ft who can see or hear you add the roll to Initiative." }
                    ],
                    14: [
                        { name: "Leading Evasion", desc: "When an effect lets you make a Dexterity saving throw to take only half damage, you take no damage on a success and half on a failure; creatures within 5 ft of you making the same save share this benefit. Not while you have the Incapacitated condition." }
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
                        { name: "Mantle of Majesty", act: 'bonus', desc: "Command is always prepared. Bonus Action: cast Command without a spell slot and take on an unearthly look for 1 minute or until your Concentration ends; meanwhile you can cast Command as a Bonus Action without a slot, and creatures Charmed by you automatically fail the save against it. Once per Long Rest, or restore it by spending a level 3+ spell slot (no action)." }
                    ],
                    14: [
                        { name: "Unbreakable Majesty", act: 'bonus', desc: "Bonus Action: take on a majestic presence for 1 minute or until you're Incapacitated. Whenever a creature hits you with an attack roll for the first time on a turn, it makes a Charisma saving throw against your spell save DC or the attack misses instead. Once per Short or Long Rest." }
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
                        { name: "Extra Attack", desc: "You can attack twice instead of once whenever you take the Attack action on your turn, and you can cast one of your cantrips that has a casting time of an action in place of one of those attacks." }
                    ],
                    14: [
                        { name: "Battle Magic", act: 'bonus', desc: "After you cast a spell that has a casting time of an action, you can make one weapon attack as a Bonus Action." }
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
                { name: "Blessed Strikes", desc: "Pick one option (asked at level-up): Divine Strike — once on each of your turns when you hit a creature with a weapon attack, it takes an extra 1d8 Necrotic or Radiant damage (your choice); or Potent Spellcasting — add your Wisdom modifier to the damage of your Cleric cantrips." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            10: [
                { name: "Divine Intervention", act: 'action', desc: "Magic action: choose any Cleric spell of level 5 or lower that doesn't take a Reaction to cast, and cast it as part of the same action without a spell slot or Material components. Once per Long Rest." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            14: [
                { name: "Improved Blessed Strikes", desc: "Your Blessed Strikes option grows: Divine Strike deals 2d8 instead of 1d8; Potent Spellcasting — when a Cleric cantrip of yours damages a creature, you can give yourself or a creature within 60 ft Temporary Hit Points equal to twice your Wisdom modifier." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
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
                        { name: "Blessed Healer", desc: "Right after you cast a spell with a spell slot that restores Hit Points to one or more creatures other than you, you regain Hit Points equal to 2 + the slot's level." }
                    ],
                    17: [
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
                        { name: "Improved Warding Flare", desc: "Warding Flare now returns on a Short or Long Rest. Whenever you use it, you can give the target of the attack Temporary Hit Points equal to 2d6 + your Wisdom modifier." }
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
                        { name: "Trickster's Transposition", act: 'bonus', desc: "Whenever you take the Bonus Action to create or move the double of your Invoke Duplicity, you can teleport, swapping places with it." }
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
                        { name: "War God's Blessing", desc: "You can spend a Channel Divinity use instead of a spell slot to cast Shield of Faith or Spiritual Weapon. Cast this way, the spell needs no Concentration and lasts 1 minute, ending early if you cast that spell again, have the Incapacitated condition or die." }
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
                { name: "Empowered Strikes", desc: "Whenever you deal damage with your Unarmed Strike, it can deal Force damage or its normal damage type (your choice)." }
            ],
            7: [
                { name: "Evasion", desc: "When an effect lets you make a Dexterity saving throw to take only half damage, you take no damage on a success and half damage on a failure. Not while you have the Incapacitated condition." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            9: [
                { name: "Acrobatic Movement", desc: "While you wear no armor and wield no Shield, you can move along vertical surfaces and across liquids on your turn without falling during the movement." }
            ],
            10: [
                { name: "Heightened Focus", desc: "Flurry of Blows: spend 1 Focus Point to make three Unarmed Strikes instead of two. Patient Defense: when you spend a Focus Point on it, gain Temporary Hit Points equal to two rolls of your Martial Arts die. Step of the Wind: when you spend a Focus Point on it, you can take a willing Large or smaller creature within 5 ft along until the end of your turn; its movement doesn't provoke Opportunity Attacks." },
                { name: "Self-Restoration", desc: "At the end of each of your turns you can remove one of these conditions from yourself: Charmed, Frightened or Poisoned. Going without food and drink doesn't give you Exhaustion levels." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
            ],
            13: [
                { name: "Deflect Energy", act: 'reaction', desc: "Deflect Attacks now works against attacks of any damage type, not only Bludgeoning, Piercing or Slashing." }
            ],
            14: [
                { name: "Disciplined Survivor", desc: "You have proficiency in all saving throws. When you fail a saving throw, you can spend 1 Focus Point to reroll it; you must use the new roll." }
            ],
            15: [
                { name: "Perfect Focus", desc: "When you roll Initiative and don't use Uncanny Metabolism, you regain Focus Points until you have 4, if you had 3 or fewer." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Take the Ability Score Improvement feat (+2 to one ability or +1 to two, max 20) or another feat you qualify for." }
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
                        { name: "Wholeness of Body", act: 'bonus', desc: "Bonus Action: roll your Martial Arts die and regain that many Hit Points + your Wisdom modifier (min 1). Uses = your Wisdom modifier (min 1) per Long Rest." }
                    ],
                    11: [
                        { name: "Fleet Step", act: 'bonus', desc: "When you take a Bonus Action other than Step of the Wind, you can also use Step of the Wind right after it." }
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
                        { name: "Physician's Touch", desc: "Hand of Harm can also give the creature the Poisoned condition until the end of your next turn. Hand of Healing can also end one of these conditions on the creature you heal: Blinded, Deafened, Paralyzed, Poisoned or Stunned." }
                    ],
                    11: [
                        { name: "Flurry of Healing and Harm", desc: "With Flurry of Blows you can replace each Unarmed Strike with a Hand of Healing that costs no Focus Point, and when a Flurry strike deals damage you can add Hand of Harm without spending a Focus Point (still once per turn). Uses = your Wisdom modifier (min 1) per Long Rest." }
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
                        { name: "Shadow Step", act: 'bonus', desc: "While entirely within Dim Light or Darkness, Bonus Action: teleport up to 60 ft to an unoccupied space you can see that is also in Dim Light or Darkness. You then have Advantage on your next melee attack before the end of the turn." }
                    ],
                    11: [
                        { name: "Improved Shadow Step", act: 'bonus', desc: "When you use Shadow Step you can spend 1 Focus Point to drop the requirement to start and end in Dim Light or Darkness, and as part of the same Bonus Action you can make an Unarmed Strike right after teleporting." }
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
                        { name: "Elemental Burst", act: 'action', desc: "Magic action, 2 Focus Points: elemental energy bursts in a 20-ft-radius Sphere centered on a point within 120 ft. Choose Acid, Cold, Fire, Lightning or Thunder; each creature in the Sphere makes a Dexterity saving throw, taking three rolls of your Martial Arts die of that type on a failure, or half on a success." }
                    ],
                    11: [
                        { name: "Stride of the Elements", desc: "While your Elemental Attunement is active, you also have a Fly Speed and a Swim Speed equal to your Speed." }
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
    "Arcane Eye": { level: 4, time: "1 action", range: "30ft", comp: "V, S, M (a bit of bat fur)", dur: "Concentration, 1 hour", desc: "An Invisible, invulnerable eye appears within range and hovers for the duration. You see through it in every direction, with Darkvision 30 ft. Bonus Action: move it up to 30 ft; solid barriers stop it, but it fits through a 1-inch opening." },
    "Aura of Life": { level: 4, time: "1 action", range: "Self (30ft)", comp: "V", dur: "Concentration, 10 min", desc: "A 30-ft Emanation around you: you and your allies in it have Resistance to Necrotic damage and can't have their Hit Point maximum reduced. An ally at 0 Hit Points who starts its turn in the aura regains 1 Hit Point." },
    "Banishment": { level: 4, time: "1 action", range: "30ft", comp: "V, S, M (a pentacle)", dur: "Concentration, 1 min", desc: "A creature you can see within range makes a Charisma save or is sent to a harmless demiplane, Incapacitated there, until the spell ends; then it returns to its space (or the nearest free one). An Aberration, Celestial, Elemental, Fey or Fiend doesn't come back if the spell lasts the full minute — it goes to a plane tied to its type instead. Upcast: +1 target per slot level above 4." },
    "Blight": { level: 4, time: "1 action", range: "30ft", comp: "V, S", dur: "Instant", desc: "A creature you can see within range makes a Constitution save: 8d8 Necrotic damage, half on a success. Plant creatures fail automatically. Or target a nonmagical plant that isn't a creature (a tree, a shrub): it withers and dies, no save. Upcast: +1d8 per slot level above 4." },
    "Confusion": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (three nut shells)", dur: "Concentration, 1 min", desc: "Creatures in a 10-ft-radius Sphere within range make a Wisdom save. On a failure a target can't take Bonus Actions or Reactions and rolls 1d10 at the start of each of its turns: 1 — moves in a random direction (1d4) and takes no action; 2-6 — doesn't move or act; 7-8 — makes one melee attack against a random creature in reach (or does nothing); 9-10 — acts normally. It repeats the save at the end of each of its turns. Upcast: radius +5 ft per slot level above 4." },
    "Conjure Woodland Beings": { level: 4, time: "1 action", range: "Self (10ft)", comp: "V, S", dur: "Concentration, 10 min", desc: "Nature spirits fill a 10-ft Emanation around you. When it reaches a creature you can see, or such a creature enters it or ends its turn there, you can force a Wisdom save: 5d8 Force damage, half on a success (once per turn per creature). You can also take the Disengage action as a Bonus Action for the duration. Upcast: +1d8 per slot level above 4." },
    "Death Ward": { level: 4, time: "1 action", range: "Touch", comp: "V, S", dur: "8 hours", desc: "Touch a creature. The first time it would drop to 0 Hit Points before the spell ends, it drops to 1 instead and the spell ends. If it's hit by an effect that would kill it instantly without dealing damage, that effect is negated and the spell ends." },
    "Dimension Door": { level: 4, time: "1 action", range: "500ft", comp: "V", dur: "Instant", desc: "Teleport to any spot within 500 ft that you can see, picture, or describe by distance and direction. You can bring one willing creature within 5 ft of you; it arrives within 5 ft of your destination. If either of you would arrive in an occupied or filled space, each takes 4d6 Force damage and the teleport fails." },
    "Dominate Beast": { level: 4, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "A Beast you can see within range makes a Wisdom save (Advantage if you or your allies are fighting it) or is Charmed for the duration; it repeats the save whenever it takes damage. Through a telepathic link you give it commands on your turn (no action) and it obeys as best it can; making it take a Reaction costs your own Reaction. Upcast: Concentration up to 10 minutes (level 5 slot), 1 hour (level 6) or 8 hours (level 7+)." },
    "Freedom of Movement": { level: 4, time: "1 action", range: "Touch", comp: "V, S, M (a leather strap)", dur: "1 hour", desc: "Touch a willing creature. For the duration Difficult Terrain doesn't slow it, magic can't reduce its Speed or make it Paralyzed or Restrained, it has a Swim Speed equal to its Speed, and it can spend 5 ft of movement to escape nonmagical restraints or a grapple. Upcast: +1 creature per slot level above 4." },
    "Giant Insect": { level: 4, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 10 min", desc: "You summon a giant centipede, spider or wasp (your choice) in an unoccupied space within range, using the Giant Insect stat block. It is your ally, acts right after you on your Initiative, obeys your spoken commands (no action) and otherwise Dodges. It disappears at 0 Hit Points or when the spell ends. Upcast: use the slot's level in the stat block." },
    "Greater Invisibility": { level: 4, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 min", desc: "A creature you touch has the Invisible condition until the spell ends — attacking or casting spells doesn't end it." },
    "Guardian of Faith": { level: 4, time: "1 action", range: "30ft", comp: "V", dur: "8 hours", desc: "A Large, invulnerable spectral guardian hovers in a space you can see within range for the duration. An enemy that moves within 10 ft of it for the first time on a turn, or starts its turn there, makes a Dexterity save: 20 Radiant damage, half on a success. The guardian vanishes after dealing 60 damage in total." },
    "Ice Storm": { level: 4, time: "1 action", range: "300ft", comp: "V, S, M (a mitten)", dur: "Instant", desc: "Hail pounds a 20-ft-radius, 40-ft-high Cylinder within range. Each creature in it makes a Dexterity save: 2d10 Bludgeoning + 4d6 Cold damage, half on a success. The ground there is Difficult Terrain until the end of your next turn. Upcast: +1d10 Bludgeoning per slot level above 4." },
    "Polymorph": { level: 4, time: "1 action", range: "60ft", comp: "V, S, M (a caterpillar cocoon)", dur: "Concentration, 1 hour", desc: "A creature you can see within range makes a Wisdom save or turns into a Beast of your choice with a Challenge Rating no higher than its own (or its level). It takes the Beast's statistics but keeps its alignment, personality, creature type, Hit Points and Hit Point Dice, and gains Temporary Hit Points equal to the Beast's HP; the spell ends early when those are gone. It can't speak or cast spells, and its gear melds into the new form." },
    "Staggering Smite": { level: 4, time: "1 bonus action", range: "Self", comp: "V", dur: "Instant", desc: "Cast right after you hit a target with a melee weapon or an Unarmed Strike: it takes an extra 4d6 Psychic damage and makes a Wisdom save or is Stunned until the end of your next turn. Upcast: +1d6 per slot level above 4." },
    "Stoneskin": { level: 4, time: "1 action", range: "Touch", comp: "V, S, M (diamond dust worth 100+ GP, which the spell consumes)", dur: "Concentration, 1 hour", desc: "Until the spell ends, a willing creature you touch has Resistance to Bludgeoning, Piercing and Slashing damage." },
    "Summon Aberration": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (a pickled tentacle and an eyeball in a platinum-inlaid vial worth 400+ GP)", dur: "Concentration, 1 hour", desc: "You summon an aberrant spirit (Beholderkin, Mind Flayer or Slaad — your choice) in an unoccupied space within range, using the Aberrant Spirit stat block. It is your ally, acts right after you on your Initiative, obeys your spoken commands (no action) and otherwise Dodges. It disappears at 0 Hit Points or when the spell ends. Upcast: use the slot's level in the stat block." },
    "Wall of Fire": { level: 4, time: "1 action", range: "120ft", comp: "V, S, M (a piece of charcoal)", dur: "Concentration, 1 min", desc: "A wall of fire on solid ground within range: up to 60 ft long, 20 ft high and 1 ft thick, or a ring up to 20 ft across; it blocks sight. Creatures in its area when it appears make a Dexterity save: 5d8 Fire damage, half on a success. One side (your choice) deals 5d8 Fire damage to each creature that ends its turn within 10 ft of it or inside the wall, and to a creature entering the wall for the first time on a turn. Upcast: +1d8 per slot level above 4." },

    // ===== 5TH LEVEL =====
    "Animate Objects": { level: 5, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Nonmagical objects within range that aren't worn, carried, fixed in place or Gargantuan come to life as Constructs (Animated Object stat block) under your control: up to your spellcasting ability modifier in objects, where Medium or smaller counts as one, Large as two and Huge as three. They are your allies and act right after you on your Initiative. Bonus Action: command any of them within 500 ft (one shared command); without orders they Dodge. At 0 Hit Points an object reverts and leftover damage carries over. Upcast: Slam damage +1d4 (Medium or smaller), +1d6 (Large) or +1d12 (Huge) per slot level above 5." },
    "Banishing Smite": { level: 5, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Cast right after you hit with an attack roll: the target takes an extra 5d10 Force damage, and if that leaves it at 50 Hit Points or fewer it makes a Charisma save or is sent to a harmless demiplane (Incapacitated) for the duration, returning to its space or the nearest free one when the spell ends." },
    "Cloudkill": { level: 5, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 10 min", desc: "A 20-ft-radius Sphere of poisonous yellow-green fog appears within range (Heavily Obscured) until the spell ends or strong wind disperses it. Creatures in it make a Constitution save: 5d8 Poison damage, half on a success — also when the fog moves into their space or they enter it or end their turn there (once per turn). The fog moves 10 ft away from you at the start of each of your turns. Upcast: +1d8 per slot level above 5." },
    "Commune": { level: 5, time: "1 minute", range: "Self", comp: "V, S, M (incense)", dur: "1 min", desc: "You contact a deity or divine proxy and ask up to three yes-or-no questions before the spell ends; each gets a correct answer (or \"unclear\" if beyond the deity's knowledge; a short phrase if one word would mislead). Each extra casting before a Long Rest has a cumulative 25% chance of no answer." },
    "Cone of Cold": { level: 5, time: "1 action", range: "Self (60ft cone)", comp: "V, S, M (a small crystal or glass cone)", dur: "Instant", desc: "Freezing air blasts a 60-ft Cone from you. Each creature in it makes a Constitution save: 8d8 Cold damage, half on a success. A creature killed by it becomes a frozen statue until it thaws. Upcast: +1d8 per slot level above 5." },
    "Conjure Elemental": { level: 5, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 10 min", desc: "A Large, intangible elemental spirit appears in an unoccupied space within range; choose its element: air (Lightning), earth (Thunder), fire (Fire) or water (Cold). While it isn't restraining anyone, when a creature you can see enters its space or starts its turn within 5 ft of it, you can force a Dexterity save: on a failure 8d8 damage of its type and Restrained until the spell ends. The Restrained creature repeats the save at the start of each of its turns: 4d8 damage on a failure, freed on a success. Upcast: +1d8 per slot level above 5." },
    "Conjure Volley": { level: 5, time: "1 action", range: "150ft", comp: "V, S, M (a Melee or Ranged weapon worth at least 1 CP)", dur: "Instant", desc: "Brandish the weapon you cast with and pick a point within range: a volley of spectral copies (or ammunition) rains down. Creatures of your choice you can see in a 40-ft-radius, 20-ft-high Cylinder make a Dexterity save: 8d8 Force damage, half on a success." },
    "Contagion": { level: 5, time: "1 action", range: "Touch", comp: "V, S", dur: "7 days", desc: "Your touch infects a creature: Constitution save or it takes 11d8 Necrotic damage and is Poisoned; while Poisoned it has Disadvantage on saves with one ability you choose. It repeats the save at the end of each of its turns until it has three successes (the spell ends) or three failures (it lasts 7 days). While Poisoned this way, any effect that would end the condition needs a Constitution save to work." },
    "Creation": { level: 5, time: "1 minute", range: "30ft", comp: "V, S, M (a paintbrush)", dur: "Special", desc: "You shape shadow material into a nonliving object of vegetable matter (cloth, rope, wood) or mineral matter (stone, crystal, metal) within range: no larger than a 5-ft Cube, of a form and material you've seen. It lasts by material: vegetable 24 hours, stone or crystal 12 hours, precious metals 1 hour, gems 10 minutes, adamantine or mithral 1 minute (mixed: the shortest). Used as a Material component, it makes that spell fail. Upcast: Cube +5 ft per slot level above 5." },
    "Destructive Wave": { level: 5, time: "1 action", range: "Self (30ft)", comp: "V", dur: "Instant", desc: "Energy ripples out in a 30-ft Emanation from you. Creatures you choose in it make a Constitution save: on a failure 5d6 Thunder + 5d6 Radiant or Necrotic damage (your choice) and Prone; on a success half damage only." },
    "Dominate Person": { level: 5, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "A Humanoid you can see within range makes a Wisdom save (Advantage if you or your allies are fighting it) or is Charmed for the duration; it repeats the save whenever it takes damage. Through a telepathic link you give it commands on your turn (no action) and it obeys as best it can; making it take a Reaction costs your own Reaction. Upcast: Concentration up to 10 minutes (level 6 slot), 1 hour (level 7) or 8 hours (level 8+)." },
    "Greater Restoration": { level: 5, time: "1 action", range: "Touch", comp: "V, S, M (diamond dust worth 100+ GP, which the spell consumes)", dur: "Instant", desc: "Touch a creature to remove one effect: 1 Exhaustion level; the Charmed or Petrified condition; a curse (including Attunement to a cursed magic item); any reduction to one of its ability scores; or any reduction to its Hit Point maximum." },
    "Hold Monster": { level: 5, time: "1 action", range: "90ft", comp: "V, S, M (a straight piece of iron)", dur: "Concentration, 1 min", desc: "A creature you can see within range makes a Wisdom save or is Paralyzed for the duration; it repeats the save at the end of each of its turns, ending the effect on a success. Upcast: +1 target per slot level above 5." },
    "Insect Plague": { level: 5, time: "1 action", range: "300ft", comp: "V, S, M (a locust)", dur: "Concentration, 10 min", desc: "Locusts swarm a 20-ft-radius Sphere within range for the duration (Lightly Obscured, Difficult Terrain). Creatures in it when it appears make a Constitution save: 4d10 Piercing damage, half on a success — also when they enter it for the first time on a turn or end their turn there (once per turn). Upcast: +1d10 per slot level above 5." },
    "Mass Cure Wounds": { level: 5, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Healing washes out from a point you can see within range: up to six creatures in a 30-ft-radius Sphere each regain 5d8 + your spellcasting ability modifier Hit Points. Upcast: +1d8 per slot level above 5." },
    "Raise Dead": { level: 5, time: "1 hour", range: "Touch", comp: "V, S, M (a diamond worth 500+ GP, which the spell consumes)", dur: "Instant", desc: "Touch a creature that has been dead no longer than 10 days and wasn't Undead when it died: it returns to life with 1 Hit Point, free of any poison that affected it and with mortal wounds closed, but missing body parts aren't restored (without its head or another vital part the spell fails). It takes a -4 penalty to D20 Tests, reduced by 1 each time it finishes a Long Rest." },
    "Scrying": { level: 5, time: "10 minutes", range: "Self", comp: "V, S, M (a focus worth 1,000+ GP, such as a crystal ball, mirror, or water-filled font)", dur: "Concentration, 10 min", desc: "See and hear a creature you choose on your plane. It makes a Wisdom save modified by your knowledge (secondhand +5, met it +0, know it well -5) and connection (likeness -2, possession or garment -4, body part, hair or nail -10). Success: you can't target it again for 24 hours. Failure: an Invisible, intangible sensor appears within 10 ft of it and follows it; you perceive through the sensor. Instead of a creature you can target a place you've seen; the sensor then stays there." },
    "Seeming": { level: 5, time: "1 action", range: "30ft", comp: "V, S", dur: "8 hours", desc: "Creatures of your choice you can see within range get an illusory appearance (body and equipment), the same or different for each; an unwilling target can make a Charisma save to resist. You can make them seem up to 1 ft shorter or taller, heavier or lighter, with the same basic limb layout. Touch reveals the illusion; a creature that takes the Study action and succeeds on an Intelligence (Investigation) check against your spell save DC sees through the disguise." },
    "Steel Wind Strike": { level: 5, time: "1 action", range: "30ft", comp: "S, M (a Melee weapon worth 1+ SP)", dur: "Instant", desc: "Flourish the weapon you cast with: make a melee spell attack against each of up to five creatures you can see within range, 6d10 Force damage on a hit. Then teleport to an unoccupied space you can see within 5 ft of one of the targets." },
    "Swift Quiver": { level: 5, time: "1 bonus action", range: "Self", comp: "V, S, M (a Quiver worth 1+ GP)", dur: "Concentration, 1 min", desc: "When you cast it, and as a Bonus Action until it ends, you can make two attacks with a weapon that fires Arrows or Bolts (a Longbow, a Light Crossbow, …). The spell creates the ammunition, which deals normal damage for its kind and disintegrates after it hits or misses." },
    "Synaptic Static": { level: 5, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Psychic energy erupts at a point within range: creatures in a 20-ft-radius Sphere make an Intelligence save, taking 8d6 Psychic damage, half on a success. On a failure a target's thoughts are also muddled for 1 minute: it subtracts 1d6 from its attack rolls, ability checks and Constitution saves to keep Concentration, repeating the save at the end of each of its turns to end this." },
    "Telekinesis": { level: 5, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 10 min", desc: "When you cast it, and as a Magic action on later turns, you work your will on one creature or object you can see within range (switching targets releases the old one). Creature (Huge or smaller): Strength save or you move it up to 30 ft and it is Restrained until the end of your next turn (suspended in the air, falling unless you hold it again). Object (Huge or smaller): move it up to 30 ft — if it's worn or carried, the holder makes a Strength save to keep it. You can also handle objects finely: use a simple tool, open a door, pour out a vial." },
    "Teleportation Circle": { level: 5, time: "1 minute", range: "10ft", comp: "V, M (rare inks worth 50+ GP, which the spell consumes)", dur: "1 round", desc: "You draw a 5-ft-radius circle of sigils linked to a permanent teleportation circle on your plane whose sigil sequence you know. A portal opens in it until the end of your next turn; any creature entering it appears within 5 ft of the destination circle. You start knowing two Material Plane sequences (DM's choice) and can memorize a new one by studying it for 1 minute. Casting it in the same spot daily for 365 days makes a permanent circle." },
    "Wall of Force": { level: 5, time: "1 action", range: "120ft", comp: "V, S, M (a shard of glass)", dur: "Concentration, 10 min", desc: "An Invisible wall of force appears at a point within range, in any orientation, floating or resting on a surface: a dome or globe up to 10 ft in radius, or a flat surface of ten connected 10-by-10-ft panels, 1/4 inch thick. A creature in its path is pushed to one side (your choice). Nothing physically passes through; it is immune to all damage, can't be dispelled by Dispel Magic, blocks ethereal travel, and is destroyed only by Disintegrate." },
    "Wall of Stone": { level: 5, time: "1 action", range: "120ft", comp: "V, S, M (a cube of granite)", dur: "Concentration, 10 min", desc: "A nonmagical stone wall appears at a point within range: ten connected 10-by-10-ft panels 6 inches thick (or 10-by-20-ft panels 3 inches thick), any shape, merged with and supported by existing stone — a bridge or ramp is possible (spans over 20 ft need half-size panels as supports). A creature in its path is pushed aside; one fully enclosed can make a Dexterity save to escape with its Reaction. Each panel has AC 15, 30 Hit Points per inch of thickness, and Immunity to Poison and Psychic damage. Hold Concentration for the full duration and the wall becomes permanent." },

    // ===== 6TH LEVEL =====
    "Arcane Gate": { level: 6, time: "1 action", range: "500ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Two linked portals open for the duration: one in a Large unoccupied ground space you can see within range, one within 10 ft of you. Each is a misty ring (blocking sight) hovering just above the ground and open on one side (your choice); whatever enters the open side of one exits the open side of the other. Bonus Action: change which sides are open." },
    "Blade Barrier": { level: 6, time: "1 action", range: "90ft", comp: "V, S", dur: "Concentration, 10 min", desc: "A wall of whirling force blades appears within range: straight (up to 100 ft long, 20 ft high, 5 ft thick) or a ring (up to 60 ft across, 20 ft high, 5 ft thick). It gives Three-Quarters Cover and its space is Difficult Terrain. A creature in the wall, or entering it or ending its turn there (once per turn), makes a Dexterity save: 6d10 Force damage, half on a success." },
    "Chain Lightning": { level: 6, time: "1 action", range: "150ft", comp: "V, S, M (three silver pins)", dur: "Instant", desc: "A bolt strikes a target you can see within range, then three bolts leap to up to three other targets within 30 ft of it (creatures or objects, one bolt each). Each target makes a Dexterity save: 10d8 Lightning damage, half on a success. Upcast: one more leaping bolt per slot level above 6." },
    "Circle of Death": { level: 6, time: "1 action", range: "150ft", comp: "V, S, M (the powder of a crushed black pearl worth 500+ GP)", dur: "Instant", desc: "Negative energy fills a 60-ft-radius Sphere around a point within range. Each creature in it makes a Constitution save: 8d8 Necrotic damage, half on a success. Upcast: +2d8 per slot level above 6." },
    "Conjure Fey": { level: 6, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 10 min", desc: "A Medium Feywild spirit (looking like a Fey of your choice) appears in an unoccupied space you can see within range for the duration. When it appears, make a melee spell attack against a creature within 5 ft of it: 3d12 + your spellcasting modifier Psychic damage, and the target is Frightened of you and the spirit until the start of your next turn. Bonus Action on later turns: teleport the spirit up to 30 ft and attack again. Upcast: +1d12 per slot level above 6." },
    "Contingency": { level: 6, time: "10 minutes", range: "Self", comp: "V, S, M (a gem-encrusted statuette of yourself worth 1,500+ GP)", dur: "10 days", desc: "Choose a spell of level 5 or lower that you can cast, that takes an action and can target you; cast it as part of this spell (spending both slots) and describe a trigger. The contingent spell takes effect on you only, right after the trigger first occurs, and Contingency ends. Only one Contingency at a time; it also ends if its material component leaves your person." },
    "Create Undead": { level: 6, time: "1 minute", range: "10ft", comp: "V, S, M (one 150+ GP black onyx stone for each corpse)", dur: "Instant", desc: "Only at night: up to three Small or Medium Humanoid corpses within range become Ghouls under your control. Bonus Action each turn: command any within 120 ft (one shared command, or a lasting order); without orders they Dodge. Control lasts 24 hours; recast within that time to keep control of up to three instead of making new ones. Upcast: level 7 — four Ghouls; level 8 — five Ghouls or two Ghasts or Wights; level 9 — six Ghouls, three Ghasts or Wights, or two Mummies." },
    "Disintegrate": { level: 6, time: "1 action", range: "60ft", comp: "V, S, M (a lodestone and dust)", dur: "Instant", desc: "A green ray hits a target you can see within range: a creature, a nonmagical object or a creation of magical force (like Wall of Force). A creature makes a Dexterity save or takes 10d6 + 40 Force damage; reduced to 0 Hit Points, it and its nonmagical gear turn to dust and only True Resurrection or Wish can revive it. A Large or smaller nonmagical object or force creation is destroyed outright (a 10-ft Cube of a larger one). Upcast: +3d6 per slot level above 6." },
    "Eyebite": { level: 6, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 1 min", desc: "Your eyes become an inky void. One creature you can see within 60 ft makes a Wisdom save or suffers an effect of your choice for the duration: Asleep (Unconscious; wakes on damage or when shaken awake), Panicked (Frightened, must Dash away from you by the safest route each turn; ends if it's 60+ ft away and can't see you) or Sickened (Poisoned). Each turn a Magic action targets another creature (not one that already saved against this casting)." },
    "Find the Path": { level: 6, time: "1 minute", range: "Self", comp: "V, S, M (a set of divination tools—such as cards or runes—worth 100+ GP)", dur: "Concentration, 1 day", desc: "Name a location you know on your plane (not moving or vague): for the duration you know how far away it is and in which direction, and at every fork you know the most direct path." },
    "Flesh to Stone": { level: 6, time: "1 action", range: "60ft", comp: "V, S, M (a cockatrice feather)", dur: "Concentration, 1 min", desc: "A creature you can see within range makes a Constitution save (Constructs succeed): on a failure it is Restrained; on a success its Speed is 0 until the start of your next turn. A Restrained target repeats the save at the end of each of its turns: three successes end the spell, three failures turn it to stone (Petrified) for the duration. Hold Concentration for the full minute and it stays Petrified until Greater Restoration or similar magic." },
    "Forbiddance": { level: 6, time: "10 minutes", range: "Touch", comp: "V, S, M (ruby dust worth 1,000+ GP)", dur: "1 day", desc: "Ward up to 40,000 square feet of floor (30 ft high) for the duration: no teleporting in, no portals, no planar travel (Astral, Ethereal, Feywild, Shadowfell, Plane Shift). Choose Aberrations, Celestials, Elementals, Fey, Fiends and/or Undead: such a creature entering the area for the first time on a turn or ending its turn there takes 5d10 Radiant or Necrotic damage (chosen when cast), unless it speaks your password. Areas can't overlap. Cast it daily for 30 days on the same place and it lasts until dispelled." },
    "Globe of Invulnerability": { level: 6, time: "1 action", range: "Self (10ft)", comp: "V, S, M (a glass bead)", dur: "Concentration, 1 min", desc: "An immobile shimmering barrier fills a 10-ft Emanation around you. Spells of level 5 or lower cast from outside can't affect anything inside it — targets inside are unaffected and the area is excluded from such spells' areas. Upcast: blocks spells one level higher per slot level above 6." },
    "Guards and Wards": { level: 6, time: "1 hour", range: "Touch", comp: "V, S, M (a silver rod worth 10+ GP)", dur: "24 hours", desc: "Ward up to 2,500 square feet of floor (20 ft high; one 50-ft square, 100 contiguous 5-ft squares or 25 10-ft squares). Named individuals and anyone who speaks your password within 5 ft are unaffected. Effects: Corridors — fog (Heavily Obscured) and a 50% chance at each fork that a creature goes the opposite way it thinks; Doors — magically locked as by Arcane Lock, up to ten hidden behind an illusion of wall; Stairs — filled with Web (regrows in 10 minutes); plus one of Dancing Lights in four corridors, Magic Mouth in two places, Stinking Cloud in two places, Gust of Wind in one corridor or room, or Suggestion in one 5-ft square. Dispel Magic can remove single effects; the spell ends when all four are gone. Cast daily for 365 days and it lasts until all effects are dispelled." },
    "Harm": { level: 6, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "A creature you can see within range makes a Constitution save: on a failure 14d6 Necrotic damage and its Hit Point maximum drops by the damage taken (not below 1); on a success half damage only." },
    "Heal": { level: 6, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "A creature you can see within range regains 70 Hit Points, and the spell ends its Blinded, Deafened and Poisoned conditions. Upcast: +10 healing per slot level above 6." },
    "Heroes' Feast": { level: 6, time: "10 minutes", range: "Self (10ft cube)", comp: "V, S, M (a gem-encrusted bowl worth 1,000+ GP, which the spell consumes)", dur: "Instant", desc: "A feast appears in a 10-ft Cube next to you; up to twelve creatures can eat it over 1 hour, after which each gains, for 24 hours: Resistance to Poison damage, Immunity to the Frightened and Poisoned conditions, and +2d10 Hit Point maximum (and as many Hit Points)." },
    "Magic Jar": { level: 6, time: "1 minute", range: "Self", comp: "V, S, M (a gem, crystal, or reliquary worth 500+ GP)", dur: "Until dispelled", desc: "Your soul moves into the container (your body falls catatonic). From it you can perceive but only act to project your soul up to 100 ft: back to your body (ending the spell) or into a Humanoid you can see — it makes a Charisma save (Protection from Evil and Good or Magic Circle protect it); on a failure you possess it and its soul is trapped in the container, on a success you can't try it again for 24 hours. You take the host's Hit Points, Hit Point Dice, STR, DEX, CON, Speed and senses. Magic action: return to the container if within 100 ft. If the host dies, you make a Charisma save against your own DC to return (else you die). If the container is destroyed or the spell ends, your soul returns to your body — or you die if it's more than 100 ft away or dead. The container is destroyed when the spell ends." },
    "Mass Suggestion": { level: 6, time: "1 action", range: "60ft", comp: "V, M (a snake's tongue)", dur: "24 hours", desc: "Suggest an achievable, not obviously harmful course of action (up to 25 words) to up to twelve creatures you can see within range that can hear and understand you. Each makes a Wisdom save or is Charmed and follows it as best it can for the duration, or until you or your allies damage it; a task completed early ends the spell for that creature. Upcast: 10 days (level 7), 30 days (8), 366 days (9)." },
    "Move Earth": { level: 6, time: "1 action", range: "120ft", comp: "V, S, M (a miniature shovel)", dur: "Concentration, 2 hours", desc: "Reshape dirt, sand or clay in an area up to 40 ft on a side within range: raise or lower it, dig or fill a trench, raise or flatten a wall, form a pillar — up to half the area's largest dimension. Each change takes 10 minutes, so creatures are rarely trapped or hurt; every 10 minutes of Concentration you can pick a new area. It can't shape natural stone or stone construction; structures shift and might collapse if made unstable; plants are carried along." },
    "Otto's Irresistible Dance": { level: 6, time: "1 action", range: "30ft", comp: "V", dur: "Concentration, 1 min", desc: "A creature you can see within range makes a Wisdom save. Success: it dances in place (using all its movement) until the end of its next turn. Failure: it is Charmed for the duration, dancing in place with all its movement, with Disadvantage on Dexterity saves and attack rolls while others have Advantage on attacks against it; each turn it can use an action to repeat the save, ending the spell on a success." },
    "Planar Ally": { level: 6, time: "10 minutes", range: "60ft", comp: "V, S", dur: "Instant", desc: "You beseech a powerful entity you know (a god, a demon prince, …), which sends a loyal Celestial, Elemental or Fiend to an unoccupied space within range (you can request a specific one by name). It isn't compelled: you bargain for a service and its payment — roughly 100 GP per minute, 1,000 GP per hour or 10,000 GP per day (up to 10 days), adjusted by the DM for danger and the creature's ethos. It returns home after the task or agreed time, or at once if you can't agree." },
    "Programmed Illusion": { level: 6, time: "1 action", range: "120ft", comp: "V, S, M (jade dust worth 25+ GP)", dur: "Until dispelled", desc: "An illusion (object, creature or other visible effect, no larger than a 30-ft Cube) lies imperceptible within range until a trigger you set — something seen or heard within 30 ft — then performs a script of up to 5 minutes with sounds you choose, and goes dormant for 10 minutes before it can trigger again. Physical contact reveals it; a creature that takes the Study action and succeeds on an Intelligence (Investigation) check against your spell save DC sees through it." },
    "Sunbeam": { level: 6, time: "1 action", range: "Self (60ft line)", comp: "V, S, M (a magnifying glass)", dur: "Concentration, 1 min", desc: "A 5-ft-wide, 60-ft-long Line of sunlight from you: each creature in it makes a Constitution save — on a failure 6d8 Radiant damage and Blinded until the start of your next turn, on a success half damage only. Magic action on later turns: create a new Line. A mote above you sheds sunlight (Bright Light 30 ft, Dim Light 30 ft more) for the duration." },
    "True Seeing": { level: 6, time: "1 action", range: "Touch", comp: "V, S, M (mushroom powder worth 25+ GP, which the spell consumes)", dur: "1 hour", desc: "A willing creature you touch has Truesight with a range of 120 ft for the duration." },
    "Wall of Thorns": { level: 6, time: "1 action", range: "120ft", comp: "V, S, M (a handful of thorns)", dur: "Concentration, 10 min", desc: "A wall of thorny brush on a solid surface within range blocks sight: up to 60 ft long, 10 ft high and 5 ft thick, or a ring 20 ft across, up to 20 ft high and 5 ft thick. Creatures in its area when it appears make a Dexterity save: 7d8 Piercing damage, half on a success. Moving through it costs 4 ft per 1 ft, and a creature entering a space of it for the first time on a turn or ending its turn there makes a Dexterity save: 7d8 Slashing damage, half on a success (once per turn). Upcast: +1d8 to both per slot level above 6." },
    "Wind Walk": { level: 6, time: "1 minute", range: "30ft", comp: "V, S, M (a candle)", dur: "8 hours", desc: "You and up to ten willing creatures within range become wisps of cloud for the duration: Fly Speed 300 ft with hover, Immunity to the Prone condition, Resistance to Bludgeoning, Piercing and Slashing damage. In cloud form a creature can only Dash or use a Magic action to start changing back (1 minute, Stunned meanwhile); it can change into cloud form again the same way while the spell lasts. If the spell ends while it flies, it descends 60 ft per round for 1 minute, then falls the rest." },
    "Word of Recall": { level: 6, time: "1 action", range: "5ft", comp: "V", dur: "Instant", desc: "You and up to five willing creatures within 5 ft of you teleport to the sanctuary you designated earlier by casting this spell there, appearing in the nearest unoccupied spaces. Without a prepared sanctuary the spell does nothing." },

    // ===== 7TH LEVEL =====
    "Conjure Celestial": { level: 7, time: "1 action", range: "90ft", comp: "V, S", dur: "Concentration, 10 min", desc: "A pillar of celestial light fills a 10-ft-radius, 40-ft-high Cylinder within range (Bright Light) for the duration. For each creature you can see in it, choose a light: Healing — it regains 4d12 + your spellcasting modifier Hit Points; Searing — Dexterity save, 6d12 Radiant damage, half on a success. When you move on your turn you can move the Cylinder up to 30 ft; when it reaches a creature you can see, or such a creature enters it or ends its turn there, you can bathe it in a light (once per turn per creature). Upcast: +1d12 healing and damage per slot level above 7." },
    "Delayed Blast Fireball": { level: 7, time: "1 action", range: "150ft", comp: "V, S, M (a ball of bat guano and sulfur)", dur: "Concentration, 1 min", desc: "A glowing bead settles at a point within range for the duration. When the spell ends it explodes in a 20-ft-radius Sphere: Dexterity save for the accumulated Fire damage, half on a success — 12d6 to start, +1d6 at the end of each of your turns while it lasts. A creature touching the bead makes a Dexterity save: on a failure it explodes, on a success it can throw the bead up to 40 ft (it explodes on hitting a creature or solid object). Unattended flammable objects in the blast catch fire. Upcast: +1d6 base damage per slot level above 7." },
    "Divine Word": { level: 7, time: "1 bonus action", range: "30ft", comp: "V", dur: "Instant", desc: "Creatures of your choice within range make a Charisma save. One that fails with 50 Hit Points or fewer suffers by its current HP: 0-20 dies; 21-30 Blinded, Deafened and Stunned for 1 hour; 31-40 Blinded and Deafened for 10 minutes; 41-50 Deafened for 1 minute. Any Celestial, Elemental, Fey or Fiend that fails is sent back to its home plane and can't return for 24 hours (short of Wish)." },
    "Etherealness": { level: 7, time: "1 action", range: "Self", comp: "V, S", dur: "8 hours", desc: "You step into the Border Ethereal for the duration: you move in any direction (up or down costs double), see the plane you left in grey up to 60 ft, and can only affect and be affected by things on the Ethereal Plane. When the spell ends you return to the matching spot; if it's occupied you are shunted to the nearest free space and take 2 Force damage per foot moved. It ends at once if cast on the Ethereal Plane or a plane that doesn't border it. Upcast: up to three more willing creatures within 10 ft per slot level above 7." },
    "Finger of Death": { level: 7, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "A creature you can see within range makes a Constitution save: 7d8 + 30 Necrotic damage, half on a success. A Humanoid killed by it rises at the start of your next turn as a Zombie that obeys your spoken orders." },
    "Fire Storm": { level: 7, time: "1 action", range: "150ft", comp: "V, S", dur: "Instant", desc: "Fire fills up to ten connected 10-ft Cubes you arrange within range. Each creature there makes a Dexterity save: 7d10 Fire damage, half on a success. Unattended flammable objects catch fire." },
    "Forcecage": { level: 7, time: "1 action", range: "100ft", comp: "V, S, M (ruby dust worth 1,500+ GP, which the spell consumes)", dur: "Concentration, 1 hour", desc: "An immobile, Invisible prison of force forms around an area within range: a cage up to 20 ft on a side (bars 1/2 inch apart) or a solid box up to 10 ft on a side that blocks matter and spells in and out. Creatures fully inside are trapped; others are pushed out. A trapped creature can't leave by nonmagical means; teleportation or planar travel out first needs a Charisma save (on a failure the magic is wasted). It also blocks ethereal travel and can't be dispelled by Dispel Magic." },
    "Mordenkainen's Magnificent Mansion": { level: 7, time: "1 minute", range: "300ft", comp: "V, S, M (a miniature door worth 15+ GP)", dur: "24 hours", desc: "A shimmering door (5 by 10 ft) appears within range for the duration, leading to an extradimensional mansion of up to 50 connected 10-ft Cubes, furnished as you like, with food for a nine-course banquet for 100 and 100 invisible-looking servants who obey you but can't harm anyone or leave. You and creatures you name can enter; within 30 ft you open or close the door (no action), and closed it's imperceptible. Objects taken out turn to smoke; when the spell ends, everything inside is expelled near the entrance." },
    "Mirage Arcane": { level: 7, time: "10 minutes", range: "Sight", comp: "V, S", dur: "10 days", desc: "Terrain in an area up to 1 mile square looks, sounds, smells and even feels like another kind of terrain, and structures can be changed or added (creatures aren't). Because it's tactile, it can create or remove Difficult Terrain; pieces taken out of the area vanish. Creatures with Truesight see the real terrain but can still physically interact with the illusion." },
    "Plane Shift": { level: 7, time: "1 action", range: "Touch", comp: "V, S, M (a forked, metal rod worth 250+ GP and attuned to a plane of existence)", dur: "Instant", desc: "You and up to eight willing creatures holding hands in a circle travel to another plane, arriving in or near a destination you describe (DM's call) — or at a teleportation circle on that plane whose sigil sequence you know (overflow appears next to it)." },
    "Power Word Fortify": { level: 7, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Choose up to six creatures you can see within range. They share 120 Temporary Hit Points, split among them however you like." },
    "Prismatic Spray": { level: 7, time: "1 action", range: "Self (60ft cone)", comp: "V, S", dur: "Instant", desc: "Eight rays flash in a 60-ft Cone from you. Each creature in it makes a Dexterity save, and you roll 1d8 for its ray: 1-5 — 12d6 Fire (red), Acid (orange), Lightning (yellow), Poison (green) or Cold (blue) damage, half on a success; 6 indigo — on a failure Restrained, then Constitution saves at the end of each turn: three successes end it, three failures leave it Petrified until Greater Restoration or similar; 7 violet — on a failure Blinded, then a Wisdom save at the start of your next turn: success ends it, failure ends it but sends the creature to another plane (DM's choice); 8 — two rays (roll twice, rerolling 8s)." },
    "Project Image": { level: 7, time: "1 action", range: "500 miles", comp: "V, S, M (a statuette of yourself worth 5+ GP)", dur: "Concentration, 1 day", desc: "An illusory copy of you appears anywhere within range you've seen before, for the duration; you see and hear through it. Magic action: move it up to 60 ft and make it act and speak as you like. It is intangible and vanishes if it takes damage. Touch reveals it; a creature that takes the Study action and succeeds on an Intelligence (Investigation) check against your spell save DC sees through it." },
    "Regenerate": { level: 7, time: "1 minute", range: "Touch", comp: "V, S, M (a prayer wheel)", dur: "1 hour", desc: "A creature you touch regains 4d8 + 15 Hit Points; for the duration it regains 1 Hit Point at the start of each of its turns, and severed body parts regrow after 2 minutes." },
    "Resurrection": { level: 7, time: "1 hour", range: "Touch", comp: "V, S, M (a diamond worth 1,000+ GP, which the spell consumes)", dur: "Instant", desc: "Touch a creature dead no more than a century, not of old age and not Undead when it died: it returns with all its Hit Points, free of poisons that affected it at death, wounds closed and missing body parts restored. It takes a -4 penalty to D20 Tests, reduced by 1 per Long Rest. Reviving a creature dead 365 days or more taxes you: until you finish a Long Rest you can't cast spells and have Disadvantage on D20 Tests." },
    "Reverse Gravity": { level: 7, time: "1 action", range: "100ft", comp: "V, S, M (a lodestone and iron filings)", dur: "Concentration, 1 min", desc: "Gravity reverses in a 50-ft-radius, 100-ft-high Cylinder within range: unanchored creatures and objects fall upward to the top (hitting ceilings or anchored objects as in a normal fall) and hover there for the duration. A creature can make a Dexterity save to grab a fixed object in reach instead. When the spell ends, everything falls back down." },
    "Sequester": { level: 7, time: "1 action", range: "Touch", comp: "V, S, M (gem dust worth 5,000+ GP, which the spell consumes)", dur: "Until dispelled", desc: "Touch an object or a willing creature: until the spell ends it is Invisible and can't be targeted by Divination spells, detected by magic or viewed remotely. A creature is held in suspended animation — Unconscious, not aging, needing no food, water or air. You can set an end condition that occurs or is visible within 1 mile (\"after 1,000 years\"); damage also ends it." },
    "Simulacrum": { level: 7, time: "12 hours", range: "Touch", comp: "V, S, M (powdered ruby worth 1,500+ GP, which the spell consumes)", dur: "Until dispelled", desc: "A Beast or Humanoid within 10 ft for the whole casting is copied into a pile of ice or snow of its size: a Construct with its statistics at casting time, half its Hit Point maximum, unable to cast this spell, gain levels or rest. It is Friendly to you and those you choose, obeys your commands and acts on your turn. You can repair it during a Long Rest (100 GP of components per Hit Point, within 5 ft). It melts at 0 Hit Points; casting the spell again destroys the previous one." },
    "Symbol": { level: 7, time: "1 minute", range: "Touch", comp: "V, S, M (powdered diamond worth 1,000+ GP, which the spell consumes)", dur: "Until dispelled or triggered", desc: "Inscribe a nearly invisible glyph (up to 10 ft across) on a surface or inside a closable object (moving the object more than 10 ft breaks it); spotting it takes a Wisdom (Perception) check against your spell save DC. Set a trigger (you can limit it by creature type or a password). When triggered it fills a 60-ft-radius Sphere with Dim Light for 10 minutes, affecting creatures in it and any that enter it or end their turn there (once per turn) with one effect you chose: Death (Constitution save, 10d10 Necrotic, half on success), Discord (Wisdom save or argue for 1 minute: no meaningful communication, Disadvantage on attacks and checks), Fear (Wisdom save or Frightened for 1 minute, moving 30 ft away each turn), Pain (Constitution save or Incapacitated for 1 minute), Sleep (Wisdom save or Unconscious for 10 minutes, wakes on damage or being shaken) or Stunning (Wisdom save or Stunned for 1 minute)." },
    "Teleport": { level: 7, time: "1 action", range: "10ft", comp: "V", dur: "Instant", desc: "You and up to eight willing creatures you can see within range (or one Large or smaller object not held by an unwilling creature) teleport to a known destination on your plane. The DM rolls 1d100 against your familiarity: a permanent circle you know or a linked object always works; very familiar — mishap 01-05, similar area 06-13, off target 14-24, on target 25-00; seen casually — 01-33 / 34-43 / 44-53 / 54-00; viewed once or described — 01-43 / 44-53 / 54-73 / 74-00; false destination — mishap 01-50, similar area 51-00. Mishap: each traveller takes 3d10 Force damage and the DM rolls again. Similar area: the nearest look-alike place. Off target: 2d12 miles away in a random direction." },

    // ===== 8TH LEVEL =====
    "Animal Shapes": { level: 8, time: "1 action", range: "30ft", comp: "V, S", dur: "24 hours", desc: "Any number of willing creatures you can see within range turn into Large or smaller Beasts of CR 4 or lower (a different form each, if you like); a Magic action on later turns reshapes them. They take the Beast's statistics but keep their creature type, Hit Points, Hit Point Dice, alignment, ability to communicate and INT, WIS and CHA; they can't cast spells, their gear melds in, and each gains Temporary Hit Points equal to its first form's HP (gone when the spell ends). A target can end it as a Bonus Action." },
    "Antimagic Field": { level: 8, time: "1 action", range: "Self (10ft)", comp: "V, S, M (iron filings)", dur: "Concentration, 1 hour", desc: "A 10-ft Emanation of antimagic surrounds you. Inside it no one can cast spells, take Magic actions or create magical effects, nothing magical from outside can target or affect what's inside, magic items lose their properties, spell areas can't extend into it, and teleporting or planar travel in or out fails (portals close there). Ongoing spells are suppressed while inside (time still runs), except those of Artifacts or deities. Dispel Magic doesn't affect it, and two fields don't cancel each other." },
    "Antipathy/Sympathy": { level: 8, time: "1 hour", range: "60ft", comp: "V, S, M (a mix of vinegar and honey)", dur: "10 days", desc: "Target a Huge or smaller creature or object and name a kind of creature (red dragons, goblins, vampires…). When such a creature comes within 120 ft of the target it makes a Wisdom save; on a failure — Antipathy: it is Frightened and must use its movement to get as far away as possible; Sympathy: it is Charmed and must use its movement to get as close as possible, unable to move away willingly once within 5 ft (if the target damages it, it can repeat the save). A creature that ends its turn more than 120 ft away repeats the save; on a success it is free and immune for 1 minute." },
    "Clone": { level: 8, time: "1 hour", range: "Touch", comp: "V, S, M (a diamond worth 1,000+ GP, which the spell consumes, and a sealable vessel worth 2,000+ GP that is large enough to hold the creature being cloned)", dur: "Instant", desc: "Touch a creature or at least 1 cubic inch of its flesh: an inert duplicate grows in the spell's vessel over 120 days, at the same or a younger age, and lasts indefinitely while the vessel is undisturbed. If the original dies after the clone is finished, its soul (if free and willing) moves into the clone — same body, personality, memories and abilities, but none of its equipment; the old remains can't be revived." },
    "Control Weather": { level: 8, time: "10 minutes", range: "Self (5ft sphere)", comp: "V, S, M (burning incense)", dur: "Concentration, 8 hours", desc: "You control the weather within 5 miles for the duration (you must stay outdoors). Change precipitation, temperature or wind by one stage up or down at a time — precipitation from clear to torrential rain or blizzard, temperature from heat wave to freezing, wind from calm to storm (and its direction). Each change takes 1d4 × 10 minutes to arrive; when the spell ends the weather slowly returns to normal." },
    "Demiplane": { level: 8, time: "1 action", range: "60ft", comp: "S", dur: "1 hour", desc: "A shadowy Medium door appears on a flat solid surface you can see within range, leading to an empty 30-ft room of wood or stone. When the spell ends the door vanishes; objects stay inside, and creatures inside stay too unless they choose to be shunted out (landing Prone next to the door). Each casting can make a new demiplane or connect to one you made before — or to another caster's if you know its nature and contents." },
    "Dominate Monster": { level: 8, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 hour", desc: "A creature you can see within range makes a Wisdom save (Advantage if you or your allies are fighting it) or is Charmed for the duration; it repeats the save whenever it takes damage. Through a telepathic link you give it commands on your turn (no action) and it obeys as best it can; making it take a Reaction costs your own Reaction. Upcast: Concentration up to 8 hours with a level 9 slot." },
    "Earthquake": { level: 8, time: "1 action", range: "500ft", comp: "V, S, M (a fractured rock)", dur: "Concentration, 1 min", desc: "A tremor shakes a 100-ft-radius circle of ground within range for the duration (Difficult Terrain). When you cast it and at the end of each of your turns, creatures on the ground there make a Dexterity save or fall Prone and lose Concentration. Fissures: 1d6 fissures (1d10 × 10 ft deep, 10 ft wide, edge to edge, not under structures) open at the end of your casting turn; a creature in one's path makes a Dexterity save or falls in. Structures: each takes 50 Bludgeoning damage when cast and at the end of each of your turns; one that collapses forces creatures within half its height to make a Dexterity save — on a failure 12d6 Bludgeoning damage, Prone and buried (a DC 20 Strength (Athletics) check as an action to escape), half damage only on a success." },
    "Befuddlement": { level: 8, time: "1 action", range: "150ft", comp: "V, S, M (a key ring with no keys)", dur: "Instant", desc: "A creature you can see within range makes an Intelligence save. Failure: 10d12 Psychic damage, and it can't cast spells or take the Magic action; it repeats the save every 30 days, and Greater Restoration, Heal or Wish ends the effect. Success: half damage only." },
    "Glibness": { level: 8, time: "1 action", range: "Self", comp: "V", dur: "1 hour", desc: "Until the spell ends, when you make a Charisma check you can replace the roll with a 15, and magic that would tell whether you're lying always reads you as truthful." },
    "Holy Aura": { level: 8, time: "1 action", range: "Self (30ft)", comp: "V, S, M (a reliquary worth 1,000+ GP)", dur: "Concentration, 1 min", desc: "A 30-ft Emanation around you for the duration: creatures of your choice in it have Advantage on all saving throws and others have Disadvantage on attack rolls against them. A Fiend or Undead that hits an affected creature with a melee attack roll makes a Constitution save or is Blinded until the end of its next turn." },
    "Incendiary Cloud": { level: 8, time: "1 action", range: "150ft", comp: "V, S", dur: "Concentration, 1 min", desc: "A cloud of embers fills a 20-ft-radius Sphere within range (Heavily Obscured) until the spell ends or strong wind disperses it. Creatures in it when it appears make a Dexterity save: 10d8 Fire damage, half on a success — also when the cloud moves into their space or they enter it or end their turn there (once per turn). At the start of each of your turns it moves 10 ft away from you in a direction you choose." },
    "Maze": { level: 8, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 10 min", desc: "A creature you can see within range is banished into a labyrinth demiplane for the duration. It can take the Study action to make a DC 20 Intelligence (Investigation) check; on a success it escapes and the spell ends. It then returns to its space or the nearest free one." },
    "Mind Blank": { level: 8, time: "1 action", range: "Touch", comp: "V, S", dur: "24 hours", desc: "A willing creature you touch has Immunity to Psychic damage and the Charmed condition for the duration, and nothing — not even Wish — can sense its emotions or alignment, read its thoughts, magically detect its location, gather information about it, observe it remotely or control its mind." },
    "Power Word Stun": { level: 8, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "A creature you can see within range with 150 Hit Points or fewer is Stunned, repeating a Constitution save at the end of each of its turns to end it; one with more Hit Points has Speed 0 until the start of your next turn." },
    "Sunburst": { level: 8, time: "1 action", range: "150ft", comp: "V, S, M (a piece of sunstone)", dur: "Instant", desc: "Sunlight flashes in a 60-ft-radius Sphere within range. Each creature in it makes a Constitution save: on a failure 12d6 Radiant damage and Blinded for 1 minute (repeating the save at the end of each of its turns), on a success half damage only. It dispels magical Darkness in the area." },
    "Tsunami": { level: 8, time: "1 minute", range: "1 mile", comp: "V, S", dur: "Concentration, 6 rounds", desc: "A wall of water up to 300 ft long, 300 ft high and 50 ft thick appears within range. Creatures in it make a Strength save: 6d10 Bludgeoning damage, half on a success. At the start of each of your turns it moves 50 ft away from you with everything in it; a Huge or smaller creature inside it or in its path makes a Strength save or takes 5d10 Bludgeoning damage (once per round). After each turn the wall loses 50 ft of height and later damage drops by 1d10; at 0 ft the spell ends. Moving within it takes a Strength (Athletics) check against your spell save DC." },

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
    "Transport via Plants": { level: 6, time: "1 action", range: "10ft", comp: "V, S", dur: "1 min", desc: "Link a Large or larger inanimate plant within range to another plant on the same plane that you have seen or touched before. For the duration, any creature can step into the first plant and out of the other using 5 ft of movement." },

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
    "Aura of Purity": { level: 4, time: "1 action", range: "Self (30ft)", comp: "V", dur: "Concentration, 10 min", desc: "A 30-ft Emanation around you: you and your allies in it have Resistance to Poison damage and Advantage on saves to avoid or end effects that cause the Blinded, Charmed, Deafened, Frightened, Paralyzed, Poisoned or Stunned condition." },
    "Summon Celestial": { level: 5, time: "1 action", range: "90ft", comp: "V, S, M (a reliquary worth 500+ GP)", dur: "Concentration, 1 hour", desc: "You summon a Celestial spirit in angelic form (Avenger or Defender — your choice) in an unoccupied space within range, using the Celestial Spirit stat block. It is your ally, acts right after you on your Initiative, obeys your spoken commands (no action) and otherwise Dodges. It disappears at 0 Hit Points or when the spell ends. Upcast: use the slot's level in the stat block." },
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
    "Charm Monster": { level: 4, time: "1 action", range: "30ft", comp: "V, S", dur: "1 hour", desc: "A creature you can see within range makes a Wisdom save (Advantage if you or your allies are fighting it) or is Charmed until the spell ends or you or your allies damage it; it is Friendly to you. When the spell ends it knows you charmed it. Upcast: +1 target per slot level above 4." },
    "Compulsion": { level: 4, time: "1 action", range: "30ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Creatures of your choice you can see within range make a Wisdom save or are Charmed until the spell ends. Each turn, as a Bonus Action, you can name a horizontal direction: each Charmed target must use as much of its movement as possible to go that way on its next turn (by the safest route), then repeats the save, ending the effect on itself on a success." },
    "Conjure Minor Elementals": { level: 4, time: "1 action", range: "Self (15ft)", comp: "V, S", dur: "Concentration, 10 min", desc: "Elemental spirits fill a 15-ft Emanation around you. While the spell lasts, your attacks deal an extra 2d8 Acid, Cold, Fire or Lightning damage (your choice) when they hit a creature in the Emanation, and the ground there is Difficult Terrain for your enemies. Upcast: +1d8 per slot level above 4." },
    "Control Water": { level: 4, time: "1 action", range: "300ft", comp: "V, S, M (a mixture of water and dust)", dur: "Concentration, 10 min", desc: "You control water in a Cube up to 100 ft on a side, using one effect; on later turns a Magic action repeats it or switches. Flood — standing water rises up to 20 ft, or a 20-ft wave crosses a large body of water (Huge or smaller vehicles in it may capsize, 25%). Part Water — a trench opens through the area. Redirect Flow — flowing water moves in the direction you choose, even uphill. Whirlpool (water at least 50 ft square and 25 ft deep) — swimmers within 25 ft are pulled 10 ft toward it; a creature entering it or ending its turn there makes a Strength save: 2d8 Bludgeoning damage, half on a success; swimming away takes an action and a Strength (Athletics) check against your spell save DC." },
    "Divination": { level: 4, time: "1 action", range: "Self", comp: "V, S, M (incense worth 25+ GP, which the spell consumes)", dur: "Instant", desc: "Ask a god or its servants one question about a goal, event or activity within the next 7 days; the DM gives a truthful answer, perhaps a short phrase or cryptic rhyme. Each extra casting before you finish a Long Rest has a cumulative 25% chance of no answer." },
    "Evard's Black Tentacles": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (a tentacle)", dur: "Concentration, 1 min", desc: "Tentacles fill a 20-ft square of ground within range, which becomes Difficult Terrain. Each creature there makes a Strength save — and a creature entering the area or ending its turn there does too (once per turn): on a failure it takes 3d6 Bludgeoning damage and is Restrained until the spell ends. A Restrained creature can use an action to make a Strength (Athletics) check against your spell save DC to escape." },
    "Fabricate": { level: 4, time: "10 minutes", range: "120ft", comp: "V, S", dur: "Instant", desc: "Turn raw materials you can see within range into products of the same material (a bridge from trees, rope from hemp, clothes from wool): a Large or smaller object (a 10-ft Cube or eight connected 5-ft Cubes), or Medium at most (one 5-ft Cube) for metal, stone or other minerals. Quality follows the material. No creatures or magic items, and items that take great skill (weapons, armor) need proficiency with the right Artisan's Tools." },
    "Fire Shield": { level: 4, time: "1 action", range: "Self", comp: "V, S, M (a bit of phosphorus or a firefly)", dur: "10 min", desc: "Flames wreathe you for the duration (Bright Light 10 ft, Dim Light 10 ft more). Choose a warm shield (Resistance to Cold) or a chill shield (Resistance to Fire). When a creature within 5 ft hits you with a melee attack roll, it takes 2d8 Fire (warm) or 2d8 Cold (chill) damage." },
    "Fount of Moonlight": { level: 4, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 10 min", desc: "Cool light surrounds you (Bright Light 20 ft, Dim Light 20 ft more). You have Resistance to Radiant damage, and your melee attacks deal an extra 2d6 Radiant damage on a hit. Right after a creature you can see within 60 ft damages you, you can take a Reaction to make it pass a Constitution save or be Blinded until the end of your next turn." },
    "Grasping Vine": { level: 4, time: "1 bonus action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "A vine sprouts in an unoccupied space within range for the duration. Make a melee spell attack against a creature within 30 ft of it: 4d8 Bludgeoning damage, and it is pulled up to 30 ft toward the vine and, if Huge or smaller, Grappled (escape DC = your spell save DC). The vine holds one creature at a time and you can release it (no action). Bonus Action on later turns: attack again. Upcast: it can grapple +1 creature per slot level above 4." },
    "Hallucinatory Terrain": { level: 4, time: "10 minutes", range: "300ft", comp: "V, S, M (a mushroom)", dur: "24 hours", desc: "Natural terrain in a 150-ft Cube looks, sounds and smells like another kind of natural terrain (a road like a swamp, a cliff like a gentle slope). Structures, equipment and creatures aren't changed, and touch reveals the difference. A creature can take the Study action and make an Intelligence (Investigation) check against your spell save DC to disbelieve it, then sees a faint image of the real terrain." },
    "Leomund's Secret Chest": { level: 4, time: "1 action", range: "Touch", comp: "V, S, M (a chest, 3 feet by 2 feet by 2 feet, constructed from rare materials worth 5,000+ GP, and a Tiny replica of the chest made from the same materials worth 50+ GP)", dur: "Until dispelled", desc: "Touch the chest and its Tiny replica to hide the chest (up to 12 cubic feet of nonliving contents) on the Ethereal Plane. Magic action, touching the replica: the chest appears on the ground within 5 ft of you; touching both again sends it back. After 60 days there is a cumulative 5% chance each day that the spell ends; it also ends if you cast it again or the replica is destroyed — then the chest stays lost on the Ethereal Plane." },
    "Locate Creature": { level: 4, time: "1 action", range: "Self", comp: "V, S, M (fur from a bloodhound)", dur: "Concentration, 1 hour", desc: "Name or describe a creature familiar to you: you sense the direction to it (and its movement) if it is within 1,000 ft. It can be a specific creature you know or the nearest of a kind you've seen up close (within 30 ft) at least once. It fails on a creature in another form (Polymorph, Flesh to Stone) and is blocked by any thickness of lead in the direct path." },
    "Mordenkainen's Faithful Hound": { level: 4, time: "1 action", range: "30ft", comp: "V, S, M (a silver whistle)", dur: "8 hours", desc: "A phantom watchdog only you can see guards a space within range for the duration, or until you are more than 300 ft apart; it is intangible and invulnerable and has Truesight 30 ft. It barks loudly when a Small or larger creature comes within 30 ft without speaking your password. At the start of each of your turns it bites one enemy within 5 ft: Dexterity save or 4d8 Force damage. Magic action on later turns: move it up to 30 ft." },
    "Mordenkainen's Private Sanctum": { level: 4, time: "10 minutes", range: "120ft", comp: "V, S, M (a thin sheet of lead)", dur: "24 hours", desc: "Secure a Cube from 5 to 100 ft on a side within range for the duration. Choose any of: no sound passes the edge; the edge looks dark and foggy (no sight through it, Darkvision included); Divination sensors can't appear inside or pass through; creatures inside can't be targeted by Divination spells; no teleporting in or out; no planar travel inside. Cast on the same spot daily for 365 days and it lasts until dispelled. Upcast: Cube +100 ft per slot level above 4." },
    "Otiluke's Resilient Sphere": { level: 4, time: "1 action", range: "30ft", comp: "V, S, M (a glass sphere)", dur: "Concentration, 1 min", desc: "A shimmering sphere encloses a Large or smaller creature or object within range; an unwilling creature makes a Dexterity save to avoid it. Nothing — objects, energy, spell effects — passes through, though those inside can breathe. The sphere is immune to all damage, and nothing inside or outside can harm the other side. An enclosed creature can use an action to roll it at half its Speed; others can pick it up and move it. Disintegrate destroys it harmlessly." },
    "Phantasmal Killer": { level: 4, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 min", desc: "A creature you can see within range faces an illusion of its worst fears and makes a Wisdom save. Failure: 4d10 Psychic damage and Disadvantage on ability checks and attack rolls for the duration. Success: half damage and the spell ends. It repeats the save at the end of each of its turns, taking the damage again on a failure or ending the spell on a success. Upcast: +1d10 per slot level above 4." },
    "Stone Shape": { level: 4, time: "1 action", range: "Touch", comp: "V, S, M (soft clay)", dur: "Instant", desc: "Touch a Medium or smaller stone object, or a section of stone no more than 5 ft in any dimension, and reshape it as you like — a weapon, a statue, a coffer, a passage through a 5-ft wall, or a door sealed to its frame. It can have up to two hinges and a latch, but no finer mechanisms." },
    "Summon Construct": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (a lockbox worth 400+ GP)", dur: "Concentration, 1 hour", desc: "You summon a Construct spirit (Clay, Metal or Stone — your choice) shaped like an animated statue in an unoccupied space within range, using the Construct Spirit stat block. It is your ally, acts right after you on your Initiative, obeys your spoken commands (no action) and otherwise Dodges. It disappears at 0 Hit Points or when the spell ends. Upcast: use the slot's level in the stat block." },
    "Summon Elemental": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (air, a pebble, ash, and water inside a gold-inlaid vial worth 400+ GP)", dur: "Concentration, 1 hour", desc: "You summon an Elemental spirit (Air, Earth, Fire or Water — your choice) in an unoccupied space within range, using the Elemental Spirit stat block. It is your ally, acts right after you on your Initiative, obeys your spoken commands (no action) and otherwise Dodges. It disappears at 0 Hit Points or when the spell ends. Upcast: use the slot's level in the stat block." },
    "Vitriolic Sphere": { level: 4, time: "1 action", range: "150ft", comp: "V, S, M (a drop of bile)", dur: "Instant", desc: "A ball of acid bursts in a 20-ft-radius Sphere within range. Each creature there makes a Dexterity save: 10d4 Acid damage plus another 5d4 Acid at the end of its next turn on a failure; half the first damage only on a success. Upcast: +2d4 initial damage per slot level above 4." },
    "Antilife Shell": { level: 5, time: "1 action", range: "Self (10ft)", comp: "V, S", dur: "Concentration, 1 hour", desc: "A 10-ft Emanation around you keeps out creatures other than Constructs and Undead: they can't pass or reach through it, though they can still cast spells or attack with Ranged or Reach weapons through it. If you move so that such a creature would have to pass through the barrier, the spell ends." },
    "Awaken": { level: 5, time: "8 hours", range: "Touch", comp: "V, S, M (an agate worth 1,000+ GP, which the spell consumes)", dur: "Instant", desc: "During the casting you trace pathways in a gem, then touch a Beast or Plant creature with Intelligence 3 or less, or a natural plant. It gains Intelligence 10 and can speak one language you know; a plant becomes a Plant creature that can move its limbs and has human-like senses (DM picks its statistics, e.g. Awakened Shrub or Tree). It is Charmed by you for 30 days or until you or your allies damage it; then it chooses its attitude toward you." },
    "Bigby's Hand": { level: 5, time: "1 action", range: "120ft", comp: "V, S, M (an eggshell and a glove)", dur: "Concentration, 1 min", desc: "A Large hand of magical force appears in an unoccupied space within range (AC 20, Hit Points equal to your HP maximum; the spell ends at 0). When you cast it and as a Bonus Action later, move it up to 60 ft and choose: Clenched Fist — melee spell attack against a target within 5 ft, 5d8 Force damage; Forceful Hand — a Huge or smaller creature within 5 ft makes a Strength save or is pushed 5 ft + 5 × your spellcasting modifier; Grasping Hand — a Huge or smaller creature within 5 ft makes a Dexterity save or is Grappled (escape DC = your spell save DC), and a Bonus Action crushes it for 4d6 + your spellcasting modifier Bludgeoning; Interposing Hand — Half Cover for you against things from or through its space, which is Difficult Terrain for enemies. Upcast: Fist +2d8, Grasping crush +2d6 per slot level above 5." },
    "Circle of Power": { level: 5, time: "1 action", range: "Self (30ft)", comp: "V", dur: "Concentration, 10 min", desc: "A 30-ft Emanation around you: you and your allies in it have Advantage on saving throws against spells and other magical effects, and take no damage on a successful save that would normally halve it." },
    "Commune with Nature": { level: 5, time: "1 minute", range: "Self", comp: "V, S", dur: "1 min", desc: "Nature spirits tell you about the area within 3 miles (300 ft in natural underground places; not where construction has replaced nature). Learn three of: locations of settlements; locations of portals to other planes; the location of one CR 10+ Celestial, Elemental, Fey, Fiend or Undead (DM's choice); the most common plant, mineral or Beast (your pick); locations of bodies of water." },
    "Contact Other Plane": { level: 5, time: "1 minute", range: "Self", comp: "V", dur: "1 min", desc: "You contact a knowledgeable otherworldly entity and make a DC 15 Intelligence save. Success: ask up to five questions before the spell ends; each gets a one-word answer (\"yes\", \"no\", \"maybe\", \"never\", \"irrelevant\", \"unclear\") or a short phrase if one word would mislead. Failure: 6d6 Psychic damage and Incapacitated until you finish a Long Rest (Greater Restoration ends it)." },
    "Dispel Evil and Good": { level: 5, time: "1 action", range: "Self", comp: "V, S, M (powdered silver and iron)", dur: "Concentration, 1 min", desc: "For the duration, Celestials, Elementals, Fey, Fiends and Undead have Disadvantage on attack rolls against you. You can end the spell early with a Magic action: Break Enchantment — touch a creature possessed, Charmed or Frightened by such creatures to free it; or Dismissal — one such creature within 5 ft makes a Charisma save or is sent back to its home plane (Undead to the Shadowfell, Fey to the Feywild if they aren't on their own plane)." },
    "Dream": { level: 5, time: "1 minute", range: "Self", comp: "V, S, M (a handful of sand)", dur: "8 hours", desc: "Target a creature you know on your plane. You or a willing creature you touch enter a trance (Incapacitated, Speed 0) as a dream messenger. If the target sleeps, the messenger appears in its dreams, can talk with it and shape the dream; it remembers the dream perfectly. If it's awake, the messenger can wait for it to sleep. A terrifying messenger can deliver a message of up to ten words; the target then makes a Wisdom save or gains no benefit from that rest and takes 3d6 Psychic damage when it wakes." },
    "Flame Strike": { level: 5, time: "1 action", range: "60ft", comp: "V, S, M (a pinch of sulfur)", dur: "Instant", desc: "A column of fire roars down: each creature in a 10-ft-radius, 40-ft-high Cylinder within range makes a Dexterity save, taking 5d6 Fire + 5d6 Radiant damage, half on a success. Upcast: +1d6 Fire and +1d6 Radiant per slot level above 5." },
    "Geas": { level: 5, time: "1 minute", range: "60ft", comp: "V", dur: "30 days", desc: "Give a creature you can see within range a spoken command to do or avoid something. It makes a Wisdom save (automatic success if it can't understand you) or is Charmed for the duration; while Charmed, acting directly against the command deals it 5d10 Psychic damage, at most once a day. A command that would mean certain death ends the spell. Remove Curse, Greater Restoration or Wish ends it. Upcast: 365 days with a level 7 or 8 slot; with level 9 it lasts until ended by those spells." },
    "Hallow": { level: 5, time: "24 hours", range: "Touch", comp: "V, S, M (incense worth 1,000+ GP, which the spell consumes)", dur: "Until dispelled", desc: "Touch a point to bless or curse the area around it, up to a 60-ft radius (fails if it overlaps another Hallow). Hallowed Ward: choose Aberrations, Celestials, Elementals, Fey, Fiends and/or Undead — they can't willingly enter, and creatures possessed, Charmed or Frightened by them are freed of that while inside. Add one extra effect: Courage, Darkness, Daylight, Peaceful Rest, Extradimensional Interference, Fear, Resistance, Silence, Tongues or Vulnerability (each aimed at creature types or a damage type you choose)." },
    "Jallarzi's Storm of Radiance": { level: 5, time: "1 action", range: "120ft", comp: "V, S, M (a pinch of phosphorus)", dur: "Concentration, 1 min", desc: "A storm of light and thunder fills a 10-ft-radius, 40-ft-high Cylinder within range. Creatures inside are Blinded and Deafened and can't cast spells with a Verbal component. When it appears, and when a creature enters it for the first time on a turn or ends its turn there (once per turn), the creature makes a Constitution save: 2d10 Radiant + 2d10 Thunder damage, half on a success. Upcast: +1d10 Radiant and +1d10 Thunder per slot level above 5." },
    "Legend Lore": { level: 5, time: "10 minutes", range: "Self", comp: "V, S, M (incense worth 250+ GP, which the spell consumes, and four ivory strips worth 50+ GP each)", dur: "Instant", desc: "Name or describe a famous person, place or object: you learn a short summary of its significant lore (the DM decides), more precise the more you already know, accurate but perhaps in figurative language. If it isn't actually famous, you hear a sad trombone and the spell fails." },
    "Mislead": { level: 5, time: "1 action", range: "Self", comp: "S", dur: "Concentration, 1 hour", desc: "You become Invisible as an illusory double appears where you stand. The double lasts for the duration, but your invisibility ends right after you make an attack roll, deal damage or cast a spell. Magic action: move the double up to twice your Speed and make it act and speak as you like; it is intangible and invulnerable, and you can see and hear through it." },
    "Modify Memory": { level: 5, time: "1 action", range: "30ft", comp: "V, S", dur: "Concentration, 1 min", desc: "A creature you can see within range makes a Wisdom save (Advantage if you're fighting it) or is Charmed — and Incapacitated, unaware of its surroundings but able to hear you — for the duration; damage or another spell ends this without changes. Meanwhile you can erase, sharpen, change or invent its memory of an event from the last 24 hours that lasted at most 10 minutes, by describing it in a language it understands; the change takes hold when the spell ends. Remove Curse or Greater Restoration restores the true memory. Upcast: events up to 7 days ago (level 6), 30 days (7), 365 days (8) or any time (9)." },
    "Passwall": { level: 5, time: "1 action", range: "30ft", comp: "V, S, M (a pinch of sesame seeds)", dur: "1 hour", desc: "A passage opens in a wooden, plaster or stone surface you can see within range for the duration, up to 5 ft wide, 8 ft tall and 20 ft deep, without weakening the structure. When it closes, anything still inside is ejected safely to the nearest unoccupied space by the surface." },
    "Planar Binding": { level: 5, time: "1 hour", range: "60ft", comp: "V, S, M (a jewel worth 1,000+ GP, which the spell consumes)", dur: "24 hours", desc: "A Celestial, Elemental, Fey or Fiend that stays within range for the whole casting makes a Charisma save or is bound to serve you for the duration (a summoned creature's spell lasts as long). It follows your commands as best it can (a Hostile one twists them), and reports back when done. Upcast: 10 days (level 6), 30 days (7), 180 days (8), 366 days (9)." },
    "Rary's Telepathic Bond": { level: 5, time: "1 action", range: "30ft", comp: "V, S, M (two eggs)", dur: "1 hour", desc: "Up to eight willing creatures of your choice within range are linked telepathically for the duration and can talk through the bond over any distance on the same plane, even without a shared language. Creatures that can't communicate in any language aren't affected." },
    "Reincarnate": { level: 5, time: "1 hour", range: "Touch", comp: "V, S, M (rare oils worth 1,000+ GP, which the spell consumes)", dur: "Instant", desc: "Touch a dead Humanoid (or a piece of one) dead no longer than 10 days: it gets a new body and its soul returns. Roll 1d10 for the species (1 Aasimar, 2 Dragonborn, 3 Dwarf, 4 Elf, 5 Gnome, 6 Goliath, 7 Halfling, 8 Human, 9 Orc, 10 Tiefling) or the DM picks one. It remembers its life and keeps its capabilities, but swaps its old species traits for the new ones." },
    "Summon Dragon": { level: 5, time: "1 action", range: "60ft", comp: "V, S, M (an object with the image of a dragon engraved on it worth 500+ GP)", dur: "Concentration, 1 hour", desc: "You summon a Dragon spirit in an unoccupied space within range, using the Draconic Spirit stat block. It is your ally, acts right after you on your Initiative, obeys your spoken commands (no action) and otherwise Dodges. It disappears at 0 Hit Points or when the spell ends. Upcast: use the slot's level in the stat block." },
    "Tree Stride": { level: 5, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 1 min", desc: "You can step into a living tree at least your size (5 ft of movement) and out of another of the same kind within 500 ft, appearing within 5 ft of it (another 5 ft of movement); you know where all such trees are. Once per turn, and you must end each turn outside a tree." },
    "Yolande's Regal Presence": { level: 5, time: "1 action", range: "Self (10ft)", comp: "V, S, M (a miniature tiara)", dur: "Concentration, 1 min", desc: "Majesty surrounds you in a 10-ft Emanation. When it reaches a creature you can see, or such a creature enters it or ends its turn there, you can force a Wisdom save (once per turn per creature): on a failure 4d6 Psychic damage, Prone, and you can push it up to 10 ft away; on a success half damage only." },
    "Drawmij's Instant Summons": { level: 6, time: "1 minute", range: "Touch", comp: "V, S, M (a sapphire worth 1,000+ GP)", dur: "Until dispelled", desc: "Touch the sapphire and an object of 10 pounds or less (longest dimension 6 ft or less) to mark the object and write its name on the sapphire (a new sapphire each casting). Later, a Magic action — speak the name and crush the sapphire — brings the object to your hand from any distance or plane, ending the spell. If someone holds or carries it, you instead learn who they are and where they are." },
    "Otiluke's Freezing Sphere": { level: 6, time: "1 action", range: "300ft", comp: "V, S, M (a miniature crystal sphere)", dur: "Instant", desc: "A frigid globe flies to a point within range and bursts in a 60-ft-radius Sphere: each creature in it makes a Constitution save, taking 10d6 Cold damage, half on a success. On water it freezes a 30-ft square 6 inches deep for 1 minute; swimmers on the surface are Restrained (an action and a Strength (Athletics) check against your spell save DC frees them). You can instead keep the globe as a sling-bullet-sized orb that anyone can throw (40 ft) or sling; it bursts on impact, or by itself after 1 minute. Upcast: +1d6 per slot level above 6." },
    "Summon Fiend": { level: 6, time: "1 action", range: "90ft", comp: "V, S, M (a bloody vial worth 600+ GP)", dur: "Concentration, 1 hour", desc: "You summon a fiendish spirit (Demon, Devil or Yugoloth — your choice) in an unoccupied space within range, using the Fiendish Spirit stat block. It is your ally, acts right after you on your Initiative, obeys your spoken commands (no action) and otherwise Dodges. It disappears at 0 Hit Points or when the spell ends. Upcast: use the slot's level in the stat block." },
    "Tasha's Bubbling Cauldron": { level: 6, time: "1 action", range: "5ft", comp: "V, S, M (a gilded ladle worth 500 + GP)", dur: "10 min", desc: "An immovable cauldron appears in an unoccupied space within 5 ft of you for the duration, its liquid copying a Common or Uncommon potion of your choice (e.g. Potion of Healing). As a Bonus Action, you or an ally can take out one such potion; it makes up to your spellcasting modifier (min 1) potions, then the cauldron vanishes and the spell ends. Unused potions vanish when you cast the spell again." },
    "Wall of Ice": { level: 6, time: "1 action", range: "120ft", comp: "V, S, M (a piece of quartz)", dur: "Concentration, 10 min", desc: "A wall of ice on a solid surface within range, 1 ft thick: a dome or globe up to 10 ft in radius, or ten connected 10-ft-square panels. A creature in its path is pushed to one side and makes a Dexterity save: 10d6 Cold damage, half on a success. Each 10-ft section has AC 12 and 30 Hit Points, Immunity to Cold, Poison and Psychic damage and Vulnerability to Fire; a destroyed section leaves frigid air, and a creature moving through it for the first time on a turn makes a Constitution save: 5d6 Cold damage, half on a success. Upcast: +2d6 for the appearing damage and +1d6 for the frigid air per slot level above 6." },
    "Mordenkainen's Sword": { level: 7, time: "1 action", range: "90ft", comp: "V, S, M (a miniature sword worth 250+ GP)", dur: "Concentration, 1 min", desc: "A spectral sword hovers within range for the duration. When it appears, make a melee spell attack against a target within 5 ft of it: 4d12 + your spellcasting modifier Force damage. Bonus Action on later turns: move it up to 30 ft and attack again (same or another target)." },
    "Telepathy": { level: 8, time: "1 action", range: "Unlimited", comp: "V, S, M (a pair of linked silver rings)", dur: "24 hours", desc: "Link minds with a willing creature you know anywhere on your plane for the duration: you can instantly share words, images, sounds and other sensations, it recognizes you, and it understands the meaning of your words. The spell ends if you're no longer on the same plane." },
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
    // 2024 PHB fixed prepared-spells columns, levels 1-20 (checked against the
    // PHB data by build-smoke.mjs). Half casters prepare spells from level 1.
    wizard:   [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
    sorcerer: [0, 2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
    druid:    [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
    cleric:   [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
    bard:     [0, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
    warlock:  [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
    paladin:  [0, 2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15],
    ranger:   [0, 2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15]
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
    rogue:     { 3: [{ id: 'subclass' }], 6: [{ id: 'expertise', count: 2 }] },
    paladin:   { 2: [{ id: 'fightingStyle' }], 3: [{ id: 'subclass' }] },
    sorcerer:  { 3: [{ id: 'subclass' }] },
    wizard:    { 2: [{ id: 'scholar' }], 3: [{ id: 'subclass' }] },
    fighter:   { 2: [{ id: 'fightingStyle' }], 3: [{ id: 'subclass' }], 7: [{ id: 'fightingStyle', total: 2, subclass: 'champion' }] },  // L1 style self-heals at L2 if never recorded
    druid:     { 3: [{ id: 'subclass' }] },
    warlock:   { 3: [{ id: 'subclass' }] },
    ranger:    { 2: [{ id: 'expertise', count: 1 }, { id: 'fightingStyle' }], 3: [{ id: 'subclass' }], 9: [{ id: 'expertise', count: 2 }] },
    bard:      { 2: [{ id: 'expertise', count: 2 }], 3: [{ id: 'subclass' }], 9: [{ id: 'expertise', count: 2 }] },
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
    { name: "Thirsting Blade", minLevel: 5, prereq: "Pact of the Blade", requires: "Pact of the Blade", desc: "You gain Extra Attack for your pact weapon only: you can attack twice with it instead of once when you take the Attack action on your turn." },
    { name: "Whispers of the Grave", minLevel: 7, prereq: null, desc: "You can cast Speak with Dead without expending a spell slot.", spells: [{ name: "Speak with Dead", kind: 'atWill' }] },
    { name: "Gift of the Protectors", minLevel: 9, prereq: "Pact of the Tome", requires: "Pact of the Tome", desc: "A new page appears in your Book of Shadows. Up to your Charisma modifier (min 1) creatures can write their name on it (an action each, with your permission). When a named creature drops to 0 Hit Points but isn't killed outright, it drops to 1 Hit Point instead; after that, no one benefits until you finish a Long Rest. Magic action: touch a name to erase it." },
    { name: "Lifedrinker", minLevel: 9, prereq: "Pact of the Blade", requires: "Pact of the Blade", act: 'attack', desc: "Once per turn when you hit a creature with your pact weapon, it takes an extra 1d6 Necrotic, Psychic or Radiant damage (your choice), and you can spend one Hit Point Die to regain Hit Points equal to its roll + your Constitution modifier (min 1)." },
    { name: "Visions of Distant Realms", minLevel: 9, prereq: null, desc: "You can cast Arcane Eye without expending a spell slot.", spells: [{ name: "Arcane Eye", kind: 'atWill' }] },
    { name: "Devouring Blade", minLevel: 12, prereq: "Thirsting Blade", requires: "Thirsting Blade", desc: "Thirsting Blade gives you two extra attacks with your pact weapon instead of one." },
    { name: "Witch Sight", minLevel: 15, prereq: null, desc: "You have Truesight with a range of 30 ft." }
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
        id: 'intimidatingPresence', label: 'Intimidating Presence',
        appliesTo: { className: 'barbarian', subclass: 'berserker', minLevel: 14 },
        max: function (cfg, st) { return 1; },
        stateKey: 'intimidatingPresenceUsed', recharge: 'long', featureNames: ['Intimidating Presence'],
        desc: "Once per Long Rest; spending a Rage use (no action) restores it."
    },
    {
        id: 'rageOfTheGods', label: 'Rage of the Gods',
        appliesTo: { className: 'barbarian', subclass: 'zealot', minLevel: 14 },
        max: function (cfg, st) { return 1; },
        stateKey: 'rageOfTheGodsUsed', recharge: 'long', featureNames: ['Rage of the Gods'],
        desc: "Divine warrior form for 1 minute. Once per Long Rest."
    },
    {
        id: 'persistentRage', label: 'Persistent Rage (regain Rages)',
        appliesTo: { className: 'barbarian', minLevel: 15 },
        max: function (cfg, st) { return 1; },
        stateKey: 'persistentRageUsed', recharge: 'long', featureNames: ['Persistent Rage'],
        desc: "When you roll Initiative, regain all expended Rage uses. Once per Long Rest."
    },
    {
        id: 'warriorOfTheGods', label: 'Warrior of the Gods', unit: 'd12',
        appliesTo: { className: 'barbarian', subclass: 'zealot', minLevel: 3 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 17 ? 7 : l >= 12 ? 6 : l >= 6 ? 5 : 4; },
        stateKey: 'warriorOfTheGodsUsed', recharge: 'long', featureNames: ['Warrior of the Gods'],
        desc: "Pool of d12s. Bonus Action: spend any number, roll them and regain that many HP. Refills on a Long Rest."
    },
    {
        id: 'zealousPresence', label: 'Zealous Presence',
        appliesTo: { className: 'barbarian', subclass: 'zealot', minLevel: 10 },
        max: function (cfg, st) { return 1; },
        stateKey: 'zealousPresenceUsed', recharge: 'long', featureNames: ['Zealous Presence'],
        desc: "Once per Long Rest; spending a Rage use (no action) restores it."
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
        id: 'mantleOfMajesty', label: 'Mantle of Majesty',
        appliesTo: { className: 'bard', subclass: 'glamour', minLevel: 6 },
        max: function (cfg, st) { return 1; },
        stateKey: 'mantleOfMajestyUsed', recharge: 'long', featureNames: ['Mantle of Majesty'],
        desc: "Once per Long Rest; spending a level 3+ spell slot (no action) restores it."
    },
    {
        id: 'unbreakableMajesty', label: 'Unbreakable Majesty',
        appliesTo: { className: 'bard', subclass: 'glamour', minLevel: 14 },
        max: function (cfg, st) { return 1; },
        stateKey: 'unbreakableMajestyUsed', recharge: 'short', featureNames: ['Unbreakable Majesty'],
        desc: "Once per Short or Long Rest."
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
        featureNames: ['Channel Divinity', 'Divine Spark', 'Turn Undead', 'Preserve Life', 'Radiance of the Dawn', 'Invoke Duplicity', 'Guided Strike', "War God's Blessing"],
        desc: "Divine Spark, Turn Undead or your Domain's option. Regain one use on a Short Rest, all on a Long Rest."
    },
    {
        id: 'wardingFlare', label: 'Warding Flare',
        appliesTo: { className: 'cleric', subclass: 'light', minLevel: 3, maxLevel: 5 },
        max: function (cfg, st) { return _resMod(cfg, st, 'wis'); },
        stateKey: 'wardingFlareUsed', recharge: 'long', featureNames: ['Warding Flare'],
        desc: "Reaction: Disadvantage on an attack roll against you or a creature within 30 ft. Uses = Wisdom modifier (min 1) per Long Rest."
    },
    {
        id: 'wardingFlare6', label: 'Warding Flare',
        appliesTo: { className: 'cleric', subclass: 'light', minLevel: 6 },
        max: function (cfg, st) { return _resMod(cfg, st, 'wis'); },
        stateKey: 'wardingFlareUsed', recharge: 'short', featureNames: ['Warding Flare', 'Improved Warding Flare'],
        desc: "Reaction: Disadvantage on an attack roll against you or a creature within 30 ft, and the target can gain 2d6 + Wisdom modifier Temporary HP. Uses = Wisdom modifier (min 1); all return on a Short or Long Rest."
    },
    {
        id: 'divineIntervention', label: 'Divine Intervention',
        appliesTo: { className: 'cleric', minLevel: 10 },
        max: function (cfg, st) { return 1; },
        stateKey: 'divineInterventionUsed', recharge: 'long', featureNames: ['Divine Intervention'],
        desc: "Cast a Cleric spell of level 5 or lower without a slot or Material components (Magic action). Once per Long Rest."
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
        id: 'naturalRecovery', label: 'Natural Recovery (free Circle Spell)',
        appliesTo: { className: 'druid', subclass: 'land', minLevel: 6 },
        max: function (cfg, st) { return 1; },
        stateKey: 'naturalRecoveryCastUsed', recharge: 'long', featureNames: ['Natural Recovery'],
        desc: "Cast one of your level 1+ Circle Spells without a spell slot. Once per Long Rest."
    },
    {
        id: 'naturalRecoverySlots', label: 'Natural Recovery (slots on a Short Rest)',
        appliesTo: { className: 'druid', subclass: 'land', minLevel: 6 },
        max: function (cfg, st) { return 1; },
        stateKey: 'naturalRecoverySlotsUsed', recharge: 'long', featureNames: [],
        desc: "After a Short Rest, recover spell slots with a combined level up to half your Druid level (round up), none of level 6+. Once per Long Rest."
    },
    {
        id: 'moonlightStep', label: 'Moonlight Step',
        appliesTo: { className: 'druid', subclass: 'moon', minLevel: 10 },
        max: function (cfg, st) { return _resMod(cfg, st, 'wis'); },
        stateKey: 'moonlightStepUsed', recharge: 'long', featureNames: ['Moonlight Step'],
        desc: "Uses = Wisdom modifier (min 1) per Long Rest; a level 2+ spell slot restores one use."
    },
    {
        id: 'cosmicOmen', label: 'Cosmic Omen',
        appliesTo: { className: 'druid', subclass: 'stars', minLevel: 6 },
        max: function (cfg, st) { return _resMod(cfg, st, 'wis'); },
        stateKey: 'cosmicOmenUsed', recharge: 'long', featureNames: ['Cosmic Omen'],
        desc: "Weal (even roll after a Long Rest) adds 1d6 to a D20 Test, Woe (odd) subtracts 1d6. Uses = Wisdom modifier (min 1) per Long Rest."
    },
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
        id: 'bulwarkOfForce', label: 'Bulwark of Force',
        appliesTo: { className: 'fighter', subclass: 'psiWarrior', minLevel: 15 },
        max: function (cfg, st) { return 1; },
        stateKey: 'bulwarkOfForceUsed', recharge: 'long', featureNames: ['Bulwark of Force'],
        desc: "Once per Long Rest; spending a Psionic Energy Die restores it."
    },
    {
        id: 'indomitable', label: 'Indomitable',
        appliesTo: { className: 'fighter', minLevel: 9 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 17 ? 3 : l >= 13 ? 2 : 1; },
        stateKey: 'indomitableUsed', recharge: 'long', featureNames: ['Indomitable'],
        desc: "Reroll a failed saving throw with a bonus equal to your Fighter level. Uses return on a Long Rest."
    },
    {
        id: 'knowYourEnemy', label: 'Know Your Enemy',
        appliesTo: { className: 'fighter', subclass: 'battleMaster', minLevel: 7 },
        max: function (cfg, st) { return 1; },
        stateKey: 'knowYourEnemyUsed', recharge: 'long', featureNames: ['Know Your Enemy'],
        desc: "Once per Long Rest; spending a Superiority Die restores it."
    },
    {
        id: 'psiPoweredLeap', label: 'Psi-Powered Leap',
        appliesTo: { className: 'fighter', subclass: 'psiWarrior', minLevel: 7 },
        max: function (cfg, st) { return 1; },
        stateKey: 'psiPoweredLeapUsed', recharge: 'short', featureNames: ['Psi-Powered Leap'],
        desc: "Once per Short or Long Rest; spending a Psionic Energy Die restores it."
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
        id: 'flurryOfHealingAndHarm', label: 'Flurry of Healing and Harm',
        appliesTo: { className: 'monk', subclass: 'mercy', minLevel: 11 },
        max: function (cfg, st) { return _resMod(cfg, st, 'wis'); },
        stateKey: 'flurryOfHealingAndHarmUsed', recharge: 'long', featureNames: ['Flurry of Healing and Harm'],
        desc: "Free Hand of Healing / Hand of Harm during Flurry of Blows. Uses = Wisdom modifier (min 1) per Long Rest."
    },
    {
        id: 'wholenessOfBody', label: 'Wholeness of Body',
        appliesTo: { className: 'monk', subclass: 'openHand', minLevel: 6 },
        max: function (cfg, st) { return _resMod(cfg, st, 'wis'); },
        stateKey: 'wholenessOfBodyUsed', recharge: 'long', featureNames: ['Wholeness of Body'],
        desc: "Bonus Action heal: Martial Arts die + Wisdom modifier. Uses = Wisdom modifier (min 1) per Long Rest."
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
        featureNames: ['Channel Divinity', 'Divine Sense', 'Sacred Weapon', 'Inspiring Smite', 'Peerless Athlete', "Nature's Wrath", 'Vow of Enmity', 'Abjure Foes'],
        desc: "Divine Sense or your Oath's option. Regain one use on a Short Rest, all on a Long Rest."
    },
    // ---- Ranger ----
    {
        id: 'gloriousDefense', label: 'Glorious Defense',
        appliesTo: { className: 'paladin', subclass: 'glory', minLevel: 15 },
        max: function (cfg, st) { return _resMod(cfg, st, 'cha'); },
        stateKey: 'gloriousDefenseUsed', recharge: 'long', featureNames: ['Glorious Defense'],
        desc: "Reaction: +Charisma modifier to AC against a hit. Uses = Charisma modifier (min 1) per Long Rest."
    },
    {
        id: 'undyingSentinel', label: 'Undying Sentinel',
        appliesTo: { className: 'paladin', subclass: 'ancients', minLevel: 15 },
        max: function (cfg, st) { return 1; },
        stateKey: 'undyingSentinelUsed', recharge: 'long', featureNames: ['Undying Sentinel'],
        desc: "Drop to 1 HP instead of 0 and regain 3 × Paladin level HP. Once per Long Rest."
    },
    {
        id: 'tireless', label: 'Tireless',
        appliesTo: { className: 'ranger', minLevel: 10 },
        max: function (cfg, st) { return _resMod(cfg, st, 'wis'); },
        stateKey: 'tirelessUsed', recharge: 'long', featureNames: ['Tireless'],
        desc: "Magic action: Temporary HP = 1d8 + Wisdom modifier. Uses = Wisdom modifier (min 1) per Long Rest."
    },
    {
        id: 'naturesVeil', label: "Nature's Veil",
        appliesTo: { className: 'ranger', minLevel: 14 },
        max: function (cfg, st) { return _resMod(cfg, st, 'wis'); },
        stateKey: 'naturesVeilUsed', recharge: 'long', featureNames: ["Nature's Veil"],
        desc: "Bonus Action: Invisible until the end of your next turn. Uses = Wisdom modifier (min 1) per Long Rest."
    },
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
        id: 'psychicVeil', label: 'Psychic Veil',
        appliesTo: { className: 'rogue', subclass: 'soulknife', minLevel: 13 },
        max: function (cfg, st) { return 1; },
        stateKey: 'psychicVeilUsed', recharge: 'long', featureNames: ['Psychic Veil'],
        desc: "Invisible for 1 hour. Once per Long Rest; a Psionic Energy Die restores it."
    },
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
        id: 'tranceOfOrder', label: 'Trance of Order',
        appliesTo: { className: 'sorcerer', subclass: 'clockwork', minLevel: 14 },
        max: function (cfg, st) { return 1; },
        stateKey: 'tranceOfOrderUsed', recharge: 'long', featureNames: ['Trance of Order'],
        desc: "Once per Long Rest; 5 Sorcery Points restore it."
    },
    {
        id: 'dragonWings', label: 'Dragon Wings',
        appliesTo: { className: 'sorcerer', subclass: 'draconic', minLevel: 14 },
        max: function (cfg, st) { return 1; },
        stateKey: 'dragonWingsUsed', recharge: 'long', featureNames: ['Dragon Wings'],
        desc: "Fly Speed 60 ft for 1 hour. Once per Long Rest; 3 Sorcery Points restore it."
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
        id: 'hurlThroughHell', label: 'Hurl Through Hell',
        appliesTo: { className: 'warlock', subclass: 'fiend', minLevel: 14 },
        max: function (cfg, st) { return 1; },
        stateKey: 'hurlThroughHellUsed', recharge: 'long', featureNames: ['Hurl Through Hell'],
        desc: "Once per Long Rest; a Pact Magic slot restores it."
    },
    {
        id: 'searingVengeance', label: 'Searing Vengeance',
        appliesTo: { className: 'warlock', subclass: 'celestial', minLevel: 14 },
        max: function (cfg, st) { return 1; },
        stateKey: 'searingVengeanceUsed', recharge: 'long', featureNames: ['Searing Vengeance'],
        desc: "Once per Long Rest."
    },
    {
        id: 'darkOnesOwnLuck', label: "Dark One's Own Luck",
        appliesTo: { className: 'warlock', subclass: 'fiend', minLevel: 6 },
        max: function (cfg, st) { return _resMod(cfg, st, 'cha'); },
        stateKey: 'darkOnesOwnLuckUsed', recharge: 'long', featureNames: ["Dark One's Own Luck"],
        desc: "Add 1d10 to an ability check or saving throw. Uses = Charisma modifier (min 1) per Long Rest."
    },
    {
        id: 'clairvoyantCombatant', label: 'Clairvoyant Combatant',
        appliesTo: { className: 'warlock', subclass: 'greatOldOne', minLevel: 6 },
        max: function (cfg, st) { return 1; },
        stateKey: 'clairvoyantCombatantUsed', recharge: 'short', featureNames: ['Clairvoyant Combatant'],
        desc: "Once per Short or Long Rest; a Pact Magic slot restores it."
    },
    {
        id: 'beguilingDefenses', label: 'Beguiling Defenses',
        appliesTo: { className: 'warlock', subclass: 'archfey', minLevel: 10 },
        max: function (cfg, st) { return 1; },
        stateKey: 'beguilingDefensesUsed', recharge: 'long', featureNames: ['Beguiling Defenses'],
        desc: "Once per Long Rest; a Pact Magic slot restores it."
    },
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
        id: 'thirdEye', label: 'The Third Eye',
        appliesTo: { className: 'wizard', subclass: 'divination', minLevel: 10 },
        max: function (cfg, st) { return 1; },
        stateKey: 'thirdEyeUsed', recharge: 'short', featureNames: ['The Third Eye'],
        desc: "Once per Short or Long Rest."
    },
    {
        id: 'illusorySelf', label: 'Illusory Self',
        appliesTo: { className: 'wizard', subclass: 'illusion', minLevel: 10 },
        max: function (cfg, st) { return 1; },
        stateKey: 'illusorySelfUsed', recharge: 'short', featureNames: ['Illusory Self'],
        desc: "Once per Short or Long Rest; a level 2+ spell slot restores it."
    },
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

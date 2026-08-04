const DATA = {
    // Index 0 unused, index 1-20 = character levels
    profBonus: [0, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],

    // NOTE: Half-Elf is VERWIJDERD in 5.5e (2024 PHB). Spelers kiezen Human of Elf.
    // Behouden als legacy voor bestaande characters.
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

    // ===== HUMAN RACE (2024) =====
    human: {
        speed: 30,
        features: [
            { name: "Resourceful", desc: { nl: "Je krijgt Heroic Inspiration na elke long rest.", en: "You gain Heroic Inspiration after every long rest." } },
            { name: "Skillful", desc: { nl: "Je krijgt proficiency in 1 extra skill naar keuze.", en: "You gain proficiency in 1 additional skill of your choice." } },
            { name: "Versatile", desc: { nl: "Je krijgt een origin feat naar keuze.", en: "You gain an origin feat of your choice." } }
        ]
    },

    // ===== HALFLING RACE (2024) =====
    halfling: {
        speed: 30,
        features: [
            { name: "Brave", desc: { nl: "Advantage op saving throws tegen frightened.", en: "Advantage on saving throws against frightened." } },
            { name: "Halfling Nimbleness", desc: { nl: "Je kunt door de ruimte van creatures bewegen die groter zijn dan jij (Medium of groter).", en: "You can move through the space of creatures larger than you (Medium or larger)." } },
            { name: "Luck", desc: { nl: "Als je een 1 rolt op een d20 voor een attack roll, ability check of saving throw, mag je opnieuw rollen en het nieuwe resultaat gebruiken.", en: "When you roll a 1 on a d20 for an attack roll, ability check or saving throw, you can reroll and use the new result." } },
            { name: "Naturally Stealthy", desc: { nl: "Je kunt je verbergen achter een creature dat minstens Medium is.", en: "You can hide behind a creature that is at least Medium." } }
        ]
    },

    // ===== TIEFLING RACE (2024) =====
    tiefling: {
        speed: 30,
        darkvision: 60,
        features: [
            { name: "Darkvision", desc: { nl: "Je kunt in dim light zien als bright light tot 60ft, en in duisternis als dim light.", en: "You can see in dim light as if it were bright light up to 60ft, and in darkness as if it were dim light." } },
            { name: "Fiendish Legacy", desc: { nl: "Kies een legacy: Abyssal (poison resistance), Chthonic (necrotic resistance), of Infernal (fire resistance). Je krijgt bijbehorende spells op hogere levels.", en: "Choose a legacy: Abyssal (poison resistance), Chthonic (necrotic resistance), or Infernal (fire resistance). You gain associated spells at higher levels." } },
            { name: "Otherworldly Presence", desc: { nl: "Je kent de Thaumaturgy cantrip.", en: "You know the Thaumaturgy cantrip." } }
        ]
    },

    // ===== AASIMAR RACE (2024) =====
    aasimar: {
        speed: 30,
        darkvision: 60,
        features: [
            { name: "Celestial Resistance", desc: { nl: "Je hebt resistance tegen necrotic en radiant damage.", en: "You have resistance to necrotic and radiant damage." } },
            { name: "Darkvision", desc: { nl: "Je kunt in dim light zien als bright light tot 60ft, en in duisternis als dim light.", en: "You can see in dim light as if it were bright light up to 60ft, and in darkness as if it were dim light." } },
            { name: "Healing Hands", desc: { nl: "Magic action: raak een creature aan; het herstelt HP gelijk aan je proficiency bonus × d4. 1x per long rest.", en: "Magic action: touch a creature; it regains HP equal to your proficiency bonus × d4. Once per long rest." } },
            { name: "Light Bearer", desc: { nl: "Je kent de Light cantrip.", en: "You know the Light cantrip." } },
            { name: "Celestial Revelation", desc: { nl: "Vanaf level 3: kies Heavenly Wings (vliegende speed), Inner Radiance (extra radiant damage in een aura), of Necrotic Shroud (frightened aura + extra necrotic damage).", en: "From level 3: choose Heavenly Wings (flying speed), Inner Radiance (extra radiant damage in an aura), or Necrotic Shroud (frightened aura + extra necrotic damage)." } }
        ]
    },

    // ===== WOOD ELF RACE (2024) =====
    woodElf: {
        speed: 35,
        darkvision: 60,
        features: [
            { name: "Darkvision", desc: { nl: "Je kunt in dim light zien als bright light tot 60ft, en in duisternis als dim light.", en: "You can see in dim light as if it were bright light up to 60ft, and in darkness as if it were dim light." } },
            { name: "Fey Ancestry", desc: { nl: "Advantage op saving throws tegen de charmed condition. Je bent immuun voor magische slaap.", en: "Advantage on saving throws against the charmed condition. You are immune to magical sleep." } },
            { name: "Keen Senses", desc: { nl: "Proficiency in Insight, Perception of Survival (keuze).", en: "Proficiency in Insight, Perception, or Survival (your choice)." } },
            { name: "Trance", desc: { nl: "Je hoeft niet te slapen. In plaats daarvan mediteer je 4 uur per long rest.", en: "You do not need to sleep. Instead, you meditate for 4 hours per long rest." } },
            { name: "Elf Lineage: Wood Elf", desc: { nl: "Walking speed 35ft. Level 3: Longstrider (1x/long rest gratis). Level 5: Pass Without Trace (1x/long rest gratis).", en: "Walking speed 35ft. Level 3: Longstrider (free, 1x/long rest). Level 5: Pass Without Trace (free, 1x/long rest)." } }
        ]
    },

    // ===== HIGH ELF RACE (2024) =====
    highElf: {
        speed: 30,
        darkvision: 60,
        features: [
            { name: "Darkvision", desc: { nl: "Je kunt in dim light zien als bright light tot 60ft, en in duisternis als dim light.", en: "You can see in dim light as if it were bright light up to 60ft, and in darkness as if it were dim light." } },
            { name: "Fey Ancestry", desc: { nl: "Advantage op saving throws tegen de charmed condition. Je bent immuun voor magische slaap.", en: "Advantage on saving throws against the charmed condition. You are immune to magical sleep." } },
            { name: "Keen Senses", desc: { nl: "Proficiency in Insight, Perception of Survival (keuze).", en: "Proficiency in Insight, Perception, or Survival (your choice)." } },
            { name: "Trance", desc: { nl: "Je hoeft niet te slapen. In plaats daarvan mediteer je 4 uur per long rest.", en: "You do not need to sleep. Instead, you meditate for 4 hours per long rest." } },
            { name: "Elf Lineage: High Elf", desc: { nl: "Leer 1 wizard cantrip (INT). Level 3: Detect Magic (1x/long rest gratis). Level 5: Misty Step (1x/long rest gratis). Bij long rest: wissel cantrip optioneel.", en: "Learn 1 wizard cantrip (INT). Level 3: Detect Magic (free, 1x/long rest). Level 5: Misty Step (free, 1x/long rest). On a long rest: optionally swap the cantrip." } }
        ]
    },

    // ===== DROW RACE (2024) =====
    drow: {
        speed: 30,
        darkvision: 120,
        features: [
            { name: "Superior Darkvision", desc: { nl: "Je kunt in dim light zien als bright light tot 120ft, en in duisternis als dim light.", en: "You can see in dim light as if it were bright light up to 120ft, and in darkness as if it were dim light." } },
            { name: "Fey Ancestry", desc: { nl: "Advantage op saving throws tegen de charmed condition. Je bent immuun voor magische slaap.", en: "Advantage on saving throws against the charmed condition. You are immune to magical sleep." } },
            { name: "Keen Senses", desc: { nl: "Proficiency in Insight, Perception of Survival (keuze).", en: "Proficiency in Insight, Perception, or Survival (your choice)." } },
            { name: "Trance", desc: { nl: "Je hoeft niet te slapen. In plaats daarvan mediteer je 4 uur per long rest.", en: "You do not need to sleep. Instead, you meditate for 4 hours per long rest." } },
            { name: "Elf Lineage: Drow", desc: { nl: "Leer Dancing Lights cantrip (CHA). Level 3: Faerie Fire (1x/long rest gratis). Level 5: Darkness (1x/long rest gratis).", en: "Learn the Dancing Lights cantrip (CHA). Level 3: Faerie Fire (free, 1x/long rest). Level 5: Darkness (free, 1x/long rest)." } }
        ]
    },

    // ===== DWARF RACE (2024) =====
    dwarf: {
        speed: 30,
        darkvision: 120,
        features: [
            { name: "Darkvision", desc: { nl: "Je kunt in dim light zien als bright light tot 120ft, en in duisternis als dim light.", en: "You can see in dim light as if it were bright light up to 120ft, and in darkness as if it were dim light." } },
            { name: "Dwarven Resilience", desc: { nl: "Resistance tegen poison damage. Advantage op saving throws tegen de poisoned condition.", en: "Resistance to poison damage. Advantage on saving throws against the poisoned condition." } },
            { name: "Dwarven Toughness", desc: { nl: "Je max HP stijgt met 1 per level (retroactief).", en: "Your max HP increases by 1 per level (retroactive)." } },
            { name: "Stonecunning", desc: { nl: "Als bonus action, activeer Tremorsense 60ft op stenen oppervlakken voor 10 minuten. Aantal keer = proficiency bonus per long rest.", en: "As a bonus action, activate Tremorsense 60ft on stone surfaces for 10 minutes. Number of uses = proficiency bonus per long rest." } }
        ]
    },

    // ===== GNOME RACE (2024) =====
    gnome: {
        speed: 30,
        darkvision: 60,
        features: [
            { name: "Darkvision", desc: { nl: "Je kunt in dim light zien als bright light tot 60ft, en in duisternis als dim light.", en: "You can see in dim light as if it were bright light up to 60ft, and in darkness as if it were dim light." } },
            { name: "Gnome Cunning", desc: { nl: "Advantage op INT, WIS en CHA saving throws tegen spells en magische effecten.", en: "Advantage on INT, WIS and CHA saving throws against spells and magical effects." } },
            { name: "Gnome Lineage", desc: { nl: "Kies Forest Gnome (Minor Illusion cantrip + Speak with Animals prof bonus keer/long rest) of Rock Gnome (Mending + Prestidigitation cantrips, Tinker: maak clockwork devices).", en: "Choose Forest Gnome (Minor Illusion cantrip + Speak with Animals, prof bonus times/long rest) or Rock Gnome (Mending + Prestidigitation cantrips, Tinker: make clockwork devices)." } }
        ]
    },

    // ===== GOLIATH RACE (2024) =====
    goliath: {
        speed: 35,
        features: [
            { name: "Giant Ancestry", desc: { nl: "Kies een Giant lineage: Cloud (Fog Cloud bonus action), Fire (fire resistance + 1d10 fire damage reactie), Frost (cold resistance + 1d10 cold damage reactie), Hill (knock prone op hit), Stone (resistance via reaction), Storm (fly 30ft als bonus action). Uses = prof bonus per long rest.", en: "Choose a Giant lineage: Cloud (Fog Cloud bonus action), Fire (fire resistance + 1d10 fire damage reaction), Frost (cold resistance + 1d10 cold damage reaction), Hill (knock prone on hit), Stone (resistance via reaction), Storm (fly 30ft as a bonus action). Uses = prof bonus per long rest." } },
            { name: "Large Form", desc: { nl: "Vanaf level 5: als bonus action word je Large voor 10 minuten. Advantage op STR checks, +10ft speed. 1x per long rest.", en: "From level 5: as a bonus action you become Large for 10 minutes. Advantage on STR checks, +10ft speed. Once per long rest." } },
            { name: "Powerful Build", desc: { nl: "Je telt als Large voor carrying capacity en push/drag/lift.", en: "You count as Large for carrying capacity and push/drag/lift." } }
        ]
    },

    // ===== ORC RACE (2024) =====
    orc: {
        speed: 30,
        darkvision: 120,
        features: [
            { name: "Darkvision", desc: { nl: "Je kunt in dim light zien als bright light tot 120ft, en in duisternis als dim light.", en: "You can see in dim light as if it were bright light up to 120ft, and in darkness as if it were dim light." } },
            { name: "Adrenaline Rush", desc: { nl: "Als bonus action, Dash en krijg temporary HP gelijk aan je proficiency bonus x hit die. Uses = prof bonus per long rest.", en: "As a bonus action, Dash and gain temporary HP equal to your proficiency bonus x hit die. Uses = prof bonus per long rest." } },
            { name: "Relentless Endurance", desc: { nl: "Als je naar 0 HP gaat maar niet instant killed, ga je naar 1 HP in plaats daarvan. 1x per long rest.", en: "When you drop to 0 HP but are not instantly killed, you drop to 1 HP instead. Once per long rest." } }
        ]
    },

    // ===== DRAGONBORN RACE (2024) =====
    dragonborn: {
        speed: 30,
        features: [
            { name: "Draconic Ancestry", desc: { nl: "Kies een drakentype. Je krijgt resistance tegen het bijbehorende element (acid/cold/fire/lightning/poison).", en: "Choose a dragon type. You gain resistance to the associated element (acid/cold/fire/lightning/poison)." } },
            { name: "Breath Weapon", desc: { nl: "Vervang 1 attack in je Attack action: 15ft cone of 30ft line (kies per gebruik). DEX/CON save. Damage: 1d10 (lvl 1), 2d10 (lvl 5), 3d10 (lvl 11), 4d10 (lvl 17). Uses = prof bonus per long rest.", en: "Replace 1 attack in your Attack action: 15ft cone or 30ft line (choose per use). DEX/CON save. Damage: 1d10 (lvl 1), 2d10 (lvl 5), 3d10 (lvl 11), 4d10 (lvl 17). Uses = prof bonus per long rest." } },
            { name: "Draconic Flight", desc: { nl: "Vanaf level 5: als bonus action, groei spectrale vleugels. Fly speed = walking speed voor 10 minuten. 1x per long rest.", en: "From level 5: as a bonus action, grow spectral wings. Fly speed = walking speed for 10 minutes. Once per long rest." } }
        ]
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
                { name: "Spellcasting", desc: { nl: "Cast sorcerer spells met CHA als spellcasting ability. Je bereidt spells voor uit de volledige Sorcerer spell list.", en: "Cast sorcerer spells with CHA as your spellcasting ability. You prepare spells from the full Sorcerer spell list." } },
                { name: "Innate Sorcery", desc: { nl: "Bonus action: activeer voor 1 minuut. Je spell save DC stijgt met 1 en je hebt advantage op attack rolls van sorcerer spells. 2 uses, alle terug na een Long Rest.", en: "Bonus Action: activate for 1 minute. Your spell save DC increases by 1 and you have advantage on attack rolls of sorcerer spells. 2 uses, all restored on a Long Rest." } }
            ],
            2: [
                { name: "Font of Magic", desc: { nl: "Je krijgt sorcery points die je kunt omzetten in spell slots of gebruiken voor Metamagic.", en: "You gain sorcery points that you can convert into spell slots or spend on Metamagic." } },
                { name: "Metamagic", desc: { nl: "Kies 2 Metamagic opties. Hiermee pas je spells aan door sorcery points te besteden.", en: "Choose 2 Metamagic options. They let you modify spells by spending sorcery points." } }
            ],
            3: [
                { name: "Sorcerer Subclass", desc: { nl: "Kies je magische oorsprong. Dit bepaalt je subclass features.", en: "Choose your magical origin. It determines your subclass features." } }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
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
                name: "Wild Magic",
                level: 3,
                features: {
                    3: [
                        { name: "Wild Magic Surge", desc: { nl: "Direct na het casten van een sorcerer spell van 1st level of hoger kan de DM je laten rollen op de Wild Magic Surge tabel.", en: "Right after you cast a sorcerer spell of 1st level or higher, the DM can have you roll on the Wild Magic Surge table." } },
                        { name: "Tides of Chaos", desc: { nl: "Eén keer per long rest: geef jezelf advantage op een attack roll, ability check of saving throw.", en: "Once per Long Rest: give yourself advantage on an attack roll, ability check or saving throw." } }
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
                features: {
                    3: [
                        { name: "Draconic Resilience", desc: { nl: "Max HP +1 per sorcerer level. Zonder armor: AC = 13 + DEX mod.", en: "Max HP +1 per sorcerer level. Without armor: AC = 13 + DEX mod." } },
                        { name: "Draconic Ancestry", desc: { nl: "Kies een drakentype. Je leert bijbehorende spells en krijgt resistance tegen dat element op hogere levels.", en: "Choose a dragon type. You learn associated spells and gain resistance to that element at higher levels." } }
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
                features: {
                    3: [
                        { name: "Clockwork Magic", desc: { nl: "Extra spells altijd prepared: Alarm, Protection from Evil and Good (1st), Aid, Lesser Restoration (3rd), Dispel Magic, Protection from Energy (5th).", en: "Extra spells always prepared: Alarm, Protection from Evil and Good (1st), Aid, Lesser Restoration (3rd), Dispel Magic, Protection from Energy (5th)." } },
                        { name: "Restore Balance", desc: { nl: "Reaction: als een creature binnen 60ft advantage of disadvantage heeft, neem het weg. Uses = prof bonus per long rest.", en: "Reaction: when a creature within 60ft has advantage or disadvantage, remove it. Uses = prof bonus per Long Rest." } }
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
                features: {
                    3: [
                        { name: "Psionic Spells", desc: { nl: "Extra spells altijd prepared: Arms of Hadar, Dissonant Whispers (1st), Calm Emotions, Detect Thoughts (3rd), Hunger of Hadar, Sending (5th).", en: "Extra spells always prepared: Arms of Hadar, Dissonant Whispers (1st), Calm Emotions, Detect Thoughts (3rd), Hunger of Hadar, Sending (5th)." } },
                        { name: "Telepathic Speech", desc: { nl: "Als bonus action, maak telepathisch contact met een creature binnen 30ft. Duurt een aantal minuten = sorcerer level. Geen taal nodig.", en: "As a Bonus Action, make telepathic contact with a creature within 30ft. Lasts a number of minutes = sorcerer level. No shared language needed." } }
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
        skillOptions: ["acrobatics", "athletics", "deception", "insight", "intimidation", "investigation", "perception", "performance", "persuasion", "sleight of hand", "stealth"],
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
                { name: "Expertise", desc: "Choose 2 skills you're proficient in (or Thieves' Tools). Your proficiency bonus is doubled for those checks." },
                { name: "Sneak Attack", desc: "Once per turn, deal extra damage when you have advantage or an ally is within 5ft of the target. Requires a finesse or ranged weapon." },
                { name: "Thieves' Cant", desc: "The secret language of thieves. You can leave and understand hidden messages in conversation." },
                { name: "Weapon Mastery", desc: "You can use the mastery property of 2 weapons. Choose 2 finesse or light weapons to activate it with." }
            ],
            2: [
                { name: "Cunning Action", desc: "Bonus action om te Dash, Disengage of Hide." }
            ],
            3: [
                { name: "Roguish Archetype", desc: "Choose your subclass. It defines your specialisation as a rogue." },
                { name: "Steady Aim", desc: "Bonus Action: advantage on your next attack roll this turn. Only if you haven't moved yet; your speed becomes 0 until the end of your turn." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            5: [
                { name: "Uncanny Dodge", desc: "Reaction: when an attacker you can see hits you, halve that attack's damage." },
                { name: "Cunning Strike", desc: "Trade Sneak Attack dice for extra effects: Disarm (1d6), Poison (1d6, CON save or Poisoned), Trip (1d6, DEX save or Prone), Withdraw (1d6, no opportunity attacks)." }
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
            // NOTE: Scout is LEGACY — niet in 2024 PHB. 5.5e subclasses: Arcane Trickster, Assassin, Soulknife, Thief.
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
                        { name: "Fast Hands", desc: "Bonus Action: make a Sleight of Hand check, use Thieves' Tools, or take the Use an Object action." },
                        { name: "Second-Story Work", desc: "Climbing costs no extra movement. Your running jump distance increases by your DEX mod in feet." }
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
                        { name: "Assassinate", desc: "Advantage on attack rolls against creatures that haven't acted yet in combat. Hits against surprised creatures are automatic critical hits." },
                        { name: "Bonus Proficiencies", desc: "Proficiency with the Disguise Kit and Poisoner's Kit." }
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
                        { name: "Spellcasting", desc: "Cast wizard spells (enchantment/illusion plus free picks) using INT. Third-caster spell slots." },
                        { name: "Mage Hand Legerdemain", desc: "Your Mage Hand is invisible. Bonus Action: direct it, use Sleight of Hand at range, or plant/retrieve objects." }
                    ],
                    9: [
                        { name: "Magical Ambush", desc: "When you're hidden and cast a spell: targets have disadvantage on the saving throw." }
                    ],
                    13: [
                        { name: "Versatile Trickster", desc: "Bonus Action: use Mage Hand to distract a creature. You have advantage on attacks against it until the end of your turn." }
                    ],
                    17: [
                        { name: "Spell Thief", desc: "Reaction: when a creature within 30ft casts a spell at you, make an Arcana check (DC 10 + spell level). On a success the spell fails and you know it for 8 hours. Once per Long Rest." }
                    ]
                }
            },
            soulknife: {
                name: "Soulknife",
                level: 3,
                features: {
                    3: [
                        { name: "Psionic Power", desc: "You have Psionic Energy dice (d6, growing later). Amount = 2x prof bonus. Spend them on Psi-Bolstered Knack (add a die to a failed skill check) or Psychic Whispers (telepathy with creatures)." },
                        { name: "Psychic Blades", desc: "When you take the Attack action: manifest a psychic blade (1d6 psychic, finesse, thrown 60ft). Bonus Action: a second blade (1d4)." }
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

        features: {
            // 2024 PHB: Spellcasting from L1; Deft Explorer is L2 (was wrongly L1).
            1: [
                { name: "Favored Enemy", desc: "Hunter's Mark is always prepared (it doesn't count against your prepared spells). You can cast it twice without a spell slot; uses return on a Long Rest and grow at higher levels." },
                { name: "Spellcasting", desc: "Cast Ranger spells with Wisdom as your spellcasting ability. You prepare a fixed number of spells (2 at level 1) and can swap one when you finish a Long Rest." },
                { name: "Weapon Mastery", desc: "You can use the mastery property of 2 weapons of your choice. Swap one on a Long Rest." }
            ],
            2: [
                { name: "Deft Explorer", desc: "Thanks to your travels you gain Expertise in one skill you're proficient in, and you learn two languages of your choice." },
                { name: "Fighting Style", desc: "Choose a Fighting Style feat (Archery, Defense, Dueling, Two-Weapon Fighting, ...) or Druidic Warrior (two Druid cantrips). Picked in the level-up menu." }
            ],
            3: [
                { name: "Ranger Subclass", desc: "Choose your Ranger subclass: Beast Master, Fey Wanderer, Gloom Stalker or Hunter." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            5: [
                { name: "Extra Attack", desc: "You can attack twice, instead of once, whenever you take the Attack action." }
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
                        { name: "Hunter's Prey", desc: "Choose one option: Colossus Slayer (+1d8 damage once per turn against wounded targets), Giant Killer (reaction attack against Large+ creatures that miss you), or Horde Breaker (one extra attack per turn against a different target within 5ft)." },
                        { name: "Hunter's Lore", desc: "As an action, study a creature to learn whether it has immunities, resistances, or vulnerabilities." }
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
                        { name: "Primal Companion", desc: "Summon a Primal Companion: choose Beast of the Land, Sea, or Sky, each with its own stat block. The beast attacks on your command (your Bonus Action). Temp HP = 5x ranger level." }
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
                features: {
                    3: [
                        { name: "Dreadful Strikes", desc: "Once per turn when you hit a creature with a weapon attack: +1d4 psychic damage." },
                        { name: "Fey Wanderer Magic", desc: "Bonus spells altijd prepared: Charm Person (3rd), Misty Step (5th), Dispel Magic (9th), Dimension Door (13th), Mislead (17th)." },
                        { name: "Otherworldly Glamour", desc: "Add your WIS modifier to CHA checks. You gain proficiency in Deception, Performance, or Persuasion." }
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
                features: {
                    3: [
                        { name: "Dread Ambusher", desc: "Add your WIS modifier to initiative rolls. In the first round of combat: +10ft walking speed and one extra attack dealing +1d8 damage." },
                        { name: "Umbral Sight", desc: "You gain Darkvision 60ft (or +30ft if you already have it). You are invisible to creatures that rely on darkvision to see you." }
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
        skillOptions: ["arcana", "history", "insight", "investigation", "medicine", "religion"],
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
                { name: "Spellcasting", desc: "Cast Wizard spells with Intelligence as your spellcasting ability. You prepare a fixed number of spells (4 at level 1) and can change your entire prepared list when you finish a Long Rest." },
                { name: "Ritual Adept", desc: "You can cast any spell in your spellbook as a Ritual if it has the Ritual tag. The spell doesn't need to be prepared." },
                { name: "Arcane Recovery", desc: "Once per day when you finish a Short Rest: recover spell slots with a combined level equal to half your Wizard level (round up)." }
            ],
            2: [
                { name: "Scholar", desc: "You gain Expertise in one of the following skills you're proficient in: Arcana, History, Investigation, Medicine, Nature, or Religion." }
            ],
            3: [
                { name: "Arcane Tradition", desc: "Choose your subclass: the school of magic you specialise in." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            5: [
                { name: "Memorize Spell", desc: "When you finish a Short Rest, you can swap 1 prepared spell for another spell from your spellbook." }
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
                        { name: "Evocation Savant", desc: "Copying evocation spells into your spellbook takes half the usual time and gold." },
                        { name: "Sculpt Spells", desc: "When you cast an evocation spell that affects other creatures, you can choose up to 1 + spell level creatures that automatically succeed on their save and take no damage." }
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
                        { name: "Abjuration Savant", desc: "Copying abjuration spells into your spellbook takes half the usual time and gold." },
                        { name: "Arcane Ward", desc: "When you cast an abjuration spell of 1st level or higher, you create a magical ward with HP = 2x wizard level + INT modifier. Casting more abjuration spells replenishes the ward by 2x spell level HP." }
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
                        { name: "Divination Savant", desc: "Copying divination spells into your spellbook takes half the usual time and gold." },
                        { name: "Portent", desc: "After a Long Rest: roll 2d20 and record the results. You can replace any attack roll, saving throw, or ability check with a stored roll (before the roll is made)." }
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
                features: {
                    3: [
                        { name: "Illusion Savant", desc: "Copying illusion spells into your spellbook takes half the usual time and gold." },
                        { name: "Improved Minor Illusion", desc: "You learn the Minor Illusion cantrip and can create both a sound and an image with a single casting." }
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

        features: {
            // 2024 PHB: Spellcasting from L1; Divine Sense is part of Channel
            // Divinity (L3), no longer a separate L1 feature; L2 = Paladin's Smite.
            1: [
                { name: "Lay On Hands", desc: "Healing pool of 5 x Paladin level HP. Magic action, touch: restore any number of points from the pool, or spend 5 points to remove one Poisoned condition. The pool refills on a Long Rest." },
                { name: "Spellcasting", desc: "Cast Paladin spells with Charisma as your spellcasting ability. You prepare a fixed number of spells (2 at level 1) and can swap one when you finish a Long Rest." },
                { name: "Weapon Mastery", desc: "You can use the mastery property of 2 weapons of your choice. Swap one on a Long Rest." }
            ],
            2: [
                { name: "Fighting Style", desc: "Choose a Fighting Style feat (Defense, Dueling, Great Weapon Fighting, Protection, ...) or Blessed Warrior (two Cleric cantrips). Picked in the level-up menu." },
                { name: "Paladin's Smite", desc: "You always have Divine Smite prepared (it doesn't count against your prepared spells). Once per Long Rest you can cast it without expending a spell slot." }
            ],
            3: [
                { name: "Sacred Oath", desc: "Choose your Sacred Oath subclass. It grants oath features, a Channel Divinity option and oath spells that are always prepared." },
                { name: "Channel Divinity", desc: "Channel divine energy: Divine Sense (Bonus Action, 10 min: sense Celestials, Fiends and Undead within 60ft) plus your oath's option. Two uses (three at level 11); regain one on a Short Rest, all on a Long Rest." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            5: [
                { name: "Extra Attack", desc: "You can attack twice, instead of once, whenever you take the Attack action." },
                { name: "Faithful Steed", desc: "Find Steed is always prepared and you can cast it once per Long Rest without a spell slot." }
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
                features: {
                    3: [
                        { name: "Sacred Weapon", desc: "Channel Divinity: as an action, add your CHA modifier to attack rolls with one weapon for 1 minute. The weapon also sheds bright light in 20ft." },
                        { name: "Turn the Unholy", desc: "Channel Divinity: every fiend and undead within 30ft makes a WIS save or is Turned for 1 minute." }
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
                features: {
                    3: [
                        { name: "Nature's Wrath", desc: "Channel Divinity: a creature of your choice within 10ft makes a STR or DEX save (its choice) or is Restrained by spectral vines until it succeeds or the effect ends." },
                        { name: "Turn the Faithless", desc: "Channel Divinity: every fey and fiend within 30ft makes a WIS save or is Turned for 1 minute." },
                        { name: "Oath Spells", desc: "Altijd prepared: Ensnaring Strike, Speak with Animals (3rd), Moonbeam, Misty Step (5th), Plant Growth, Protection from Energy (9th), Ice Storm, Stoneskin (13th), Commune with Nature, Tree Stride (17th)." }
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
                features: {
                    3: [
                        { name: "Peerless Athlete", desc: "Channel Divinity: as a Bonus Action, +10ft jump distance and advantage on Athletics and Acrobatics checks for 10 minutes." },
                        { name: "Inspiring Smite", desc: "Channel Divinity: immediately after a Divine Smite, distribute temp HP equal to 2d8 + paladin level among creatures of your choice within 30ft." },
                        { name: "Oath Spells", desc: "Altijd prepared: Guiding Bolt, Heroism (3rd), Enhance Ability, Magic Weapon (5th), Haste, Protection from Energy (9th), Compulsion, Freedom of Movement (13th), Commune, Flame Strike (17th)." }
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
                features: {
                    3: [
                        { name: "Abjure Enemy", desc: "Channel Divinity: choose a creature within 60ft; WIS save or Frightened for 1 minute with speed 0. Fiends and undead have disadvantage on the save." },
                        { name: "Vow of Enmity", desc: "Channel Divinity: as a Bonus Action, choose a creature within 10ft. You have advantage on attack rolls against it for 1 minute." },
                        { name: "Oath Spells", desc: "Altijd prepared: Bane, Hunter's Mark (3rd), Hold Person, Misty Step (5th), Haste, Protection from Energy (9th), Banishment, Dimension Door (13th), Hold Monster, Scrying (17th)." }
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

        features: {
            1: [
                { name: "Druidic", desc: "You know Druidic, the secret language of Druids, and can leave hidden messages only other Druids understand. Because of it you always have Speak with Animals prepared." },
                { name: "Spellcasting", desc: "Cast Druid spells with Wisdom as your spellcasting ability. You prepare a fixed number of spells (4 at level 1) and can change your entire prepared list when you finish a Long Rest." },
                { name: "Primal Order", desc: "Choose your order (level-1 choice): Magician — you know one extra Druid cantrip and add your Wisdom modifier to Intelligence (Arcana or Nature) checks; or Warden — proficiency with Martial weapons and training with Medium armor." }
            ],
            2: [
                { name: "Wild Shape", desc: "Bonus Action: transform into a known Beast form (levels 2-3: max CR 1/4, no Fly Speed). You can speak in beast form and keep INT/WIS/CHA. Two uses; regain one on a Short Rest, all on a Long Rest. You know 4 forms and can swap one whenever you finish a Long Rest." },
                { name: "Wild Companion", desc: "Spend a use of Wild Shape (or a spell slot) to cast Find Familiar without material components." }
            ],
            3: [
                { name: "Druid Subclass", desc: "Choose your Druid Circle: the subclass that shapes how you approach nature." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            5: [
                { name: "Wild Resurgence", desc: "Spend 1 use of Wild Shape to recover an expended spell slot (max 3rd level). Once per Long Rest." }
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
                features: {
                    3: [
                        { name: "Bonus Cantrip", desc: "You learn one extra Druid cantrip of your choice." },
                        { name: "Natural Recovery", desc: "During a Short Rest you can recover spell slots with a combined level of up to half your Druid level (round up), with no slot of 6th level or higher." }
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
                features: {
                    3: [
                        { name: "Combat Wild Shape", desc: "Use Wild Shape as a Bonus Action instead of an action. When you transform, regain 1d8 x proficiency bonus HP." },
                        { name: "Circle Forms", desc: "You can transform into beasts of a higher CR than normal (CR = druid level / 3, round down). At higher levels you can also become elementals." }
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
                features: {
                    3: [
                        { name: "Wrath of the Sea", desc: "After casting a spell: push a creature within 5ft away by 5ft, or give an ally within 5ft temp HP equal to your WIS modifier." },
                        { name: "Ocean's Gift", desc: "You gain a swim speed of 30ft and can breathe underwater." }
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
                name: "Circle of Stars",
                level: 3,
                features: {
                    3: [
                        { name: "Star Map", desc: "You gain Guiding Bolt as a bonus spell and can cast it for free a number of times equal to your proficiency bonus per Long Rest." },
                        { name: "Starry Form", desc: "As a Bonus Action (or when using Wild Shape): assume a starry constellation. Archer: Bonus Action ranged attack for +1d8 radiant (60ft). Chalice: when you cast a healing spell, also heal a creature within 30ft for 1d8 + WIS mod. Dragon: treat rolls of 9 or lower as a 10 on concentration saves." }
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
        skillOptions: ["acrobatics", "animal handling", "athletics", "history", "insight", "intimidation", "perception", "survival"],
        skillCount: 2,
        asiLevels: [4, 6, 8, 12, 14, 16, 19],

        // No spellcasting by default (Eldritch Knight subclass adds it)
        spellcasting: "none",

        features: {
            1: [
                { name: "Fighting Style", desc: "Choose a Fighting Style feat: Archery, Defense, Dueling, Great Weapon Fighting, Protection, Two-Weapon Fighting, and more." },
                { name: "Second Wind", desc: "Bonus Action: regain 1d10 + Fighter level HP. Two uses (three at level 4, four at level 10); regain one on a Short Rest, all on a Long Rest." },
                { name: "Weapon Mastery", desc: "You can use the mastery property of 3 weapons of your choice. Swap one on a Long Rest." }
            ],
            2: [
                { name: "Action Surge", desc: "Once per Short or Long Rest, take one extra action on top of your normal action. At level 17 you get two uses." },
                { name: "Tactical Mind", desc: "When you fail an ability check, add a Second Wind roll (1d10) to the result. This spends one use of Second Wind (the use isn't spent if you still fail)." }
            ],
            3: [
                { name: "Martial Archetype", desc: "Choose your subclass: it defines your martial specialisation." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            5: [
                { name: "Extra Attack", desc: "You can attack twice, instead of once, whenever you take the Attack action." },
                { name: "Tactical Shift", desc: "When you use Second Wind, you can move up to half your speed without provoking opportunity attacks." }
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
                        { name: "Improved Critical", desc: "You score a critical hit on a roll of 19 or 20." }
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
                features: {
                    3: [
                        { name: "Combat Superiority", desc: "You gain 4 superiority dice (d8) and learn 3 maneuvers from: Commander's Strike, Disarming Attack, Distracting Strike, Evasive Footwork, Feinting Attack, Goading Attack, Lunging Attack, Maneuvering Attack, Menacing Attack, Parry, Precision Attack, Pushing Attack, Rally, Riposte, Sweeping Attack, Trip Attack. Dice return on a Short or Long Rest." },
                        { name: "Student of War", desc: "You gain proficiency with one type of artisan's tools of your choice." }
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
                        { name: "Spellcasting", desc: "You can cast wizard spells (abjuration/evocation focus) with INT as your spellcasting ability. Third caster: slower spell slot progression." },
                        { name: "War Bond", desc: "Bond with a weapon through a 1-hour ritual. You can't be disarmed of it and can summon it to your hand as a Bonus Action. You can be bonded with up to 2 weapons." }
                    ],
                    7: [
                        { name: "War Magic", desc: "When you cast a cantrip, you can make one weapon attack as a Bonus Action." }
                    ],
                    10: [
                        { name: "Eldritch Strike", desc: "When you hit a creature with a weapon attack, it has disadvantage on the next saving throw against a spell you cast before the end of your next turn." }
                    ],
                    15: [
                        { name: "Arcane Charge", desc: "When you use Action Surge, you can teleport up to 30ft to an unoccupied space you can see (before or after the extra action)." }
                    ],
                    18: [
                        { name: "Improved War Magic", desc: "When you cast a spell of 1st or 2nd level, you can make one weapon attack as a Bonus Action." }
                    ]
                }
            },
            psiWarrior: {
                name: "Psi Warrior",
                level: 3,
                features: {
                    3: [
                        { name: "Psionic Power", desc: "You gain Psionic Energy dice (d6, 2x proficiency bonus per Long Rest). Spend them on: Protective Field (reaction: reduce damage to yourself or an ally within 30ft by die + INT mod), Psionic Strike (once per turn on a hit: +die force damage), Telekinetic Movement (action: move a Large or smaller object or willing creature up to 30ft)." }
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
                { name: "Pact Magic", desc: "Cast Warlock spells with Charisma as your spellcasting ability. Your spell slots are all of the same level and return on a Short or Long Rest." },
                { name: "Eldritch Invocations", desc: "Pieces of forbidden knowledge that enhance your powers (pact boons are invocations too). You know 1 invocation at level 1 and 3 at level 2, and can replace one whenever you gain a Warlock level." }
            ],
            2: [
                { name: "Eldritch Invocations", desc: "Your invocations grow to 3 total — pick the new ones in the level-up menu." },
                { name: "Magical Cunning", desc: "Spend 1 minute in an esoteric rite: regain expended Pact Magic slots equal to half your maximum (round up). Once per Long Rest." }
            ],
            3: [
                { name: "Warlock Subclass", desc: "Choose your Otherworldly Patron. It grants your subclass features." },
                { name: "Pact Magic Improvement", desc: "Your Pact Magic slots become level 2." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
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
                name: "The Fiend",
                level: 3,
                features: {
                    3: [
                        { name: "Dark One's Blessing", desc: "When you reduce a hostile creature to 0 HP, you gain temporary HP equal to your CHA modifier + warlock level." }
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
                name: "The Archfey",
                level: 3,
                features: {
                    3: [
                        { name: "Fey Presence", desc: "As an action: every creature in a 10ft cube from you makes a WIS save or is Charmed or Frightened (your choice) until the end of your next turn. Once per Short or Long Rest." }
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
                name: "The Celestial",
                level: 3,
                features: {
                    3: [
                        { name: "Healing Light", desc: "Bonus Action: you have a pool of d6s (1 + warlock level). Heal a creature within 60ft by spending 1-5 dice from the pool. The pool refills on a Long Rest." },
                        { name: "Bonus Cantrips", desc: "You learn the Light and Sacred Flame cantrips. They don't count against your cantrips known." },
                        { name: "Celestial Spells", desc: "Expanded spell list: Cure Wounds, Guiding Bolt (1st), Flaming Sphere, Lesser Restoration (2nd), Daylight, Revivify (3rd), Guardian of Faith, Wall of Fire (4th), Flame Strike, Greater Restoration (5th)." }
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
                name: "The Great Old One",
                level: 3,
                features: {
                    3: [
                        { name: "Awakened Mind", desc: "You can communicate telepathically with any creature you can see within 30ft. You don't need to share a language." },
                        { name: "Psychic Spells", desc: "Expanded spell list: Dissonant Whispers, Tasha's Hideous Laughter (1st), Detect Thoughts, Phantasmal Force (2nd), Clairvoyance, Sending (3rd), Dominate Beast, Evard's Black Tentacles (4th), Dominate Person, Telekinesis (5th)." }
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
                { name: "Rage", desc: "Bonus Action: enter a Rage for 10 minutes. +2-4 melee damage (STR-based), resistance to B/P/S damage, advantage on STR checks and saves. Uses per Long Rest scale with level." },
                { name: "Unarmored Defense", desc: "Without armor: AC = 10 + DEX mod + CON mod. A shield is allowed." },
                { name: "Weapon Mastery", desc: "You can use the mastery property of 2 weapons. Choose 2 melee weapons to activate it with." }
            ],
            2: [
                { name: "Danger Sense", desc: "Advantage on DEX saving throws against effects you can see (traps, spells, etc.). Doesn't work while you're Blinded, Deafened, or Incapacitated." },
                { name: "Reckless Attack", desc: "On your first attack of the turn: choose to gain advantage on all STR melee attacks this turn. Attacks against you also have advantage until your next turn." }
            ],
            3: [
                { name: "Primal Path", desc: "Choose your Barbarian subclass: it shapes how your Rage manifests." },
                { name: "Primal Knowledge", desc: "You gain proficiency in one more Barbarian skill. While your Rage is active, Acrobatics, Intimidation, Perception, Stealth and Survival checks you make count as Strength-based (you channel primal power)." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            5: [
                { name: "Extra Attack", desc: "You can attack twice, instead of once, whenever you take the Attack action." },
                { name: "Fast Movement", desc: "+10ft speed while you aren't wearing heavy armor." }
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
                        { name: "Frenzy", desc: "While raging you can go into a Frenzy: make one extra melee attack as a Bonus Action each turn. No longer causes exhaustion (2024 change)." }
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
                features: {
                    3: [
                        { name: "Totem Spirit", desc: "Choose a totem: Bear (resistance to all damage except psychic while raging), Eagle (enemies have disadvantage on opportunity attacks against you, Dash as a Bonus Action), or Wolf (allies have advantage on melee attacks against enemies within 5ft of you while you rage)." }
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
                        { name: "Vitality of the Tree", desc: "While raging: at the start of each of your turns, gain temp HP equal to your proficiency bonus + your Hit Die." }
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
                        { name: "Divine Fury", desc: "The first time you hit a creature each turn while raging: +1d6 necrotic or radiant damage (chosen when you pick this path). Scales with level." },
                        { name: "Warrior of the Gods", desc: "If you die, spells cast to revive you require no material components." }
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
                { name: "Spellcasting", desc: "Cast Bard spells with Charisma as your spellcasting ability. You prepare a fixed number of spells (4 at level 1) and can swap 1 when you gain a Bard level." },
                { name: "Bardic Inspiration", desc: "Bonus Action: give a creature within 60ft a Bardic Inspiration die (d6, growing at higher levels). The creature adds the die to an attack roll, ability check, or saving throw. Lasts 1 hour. Uses = CHA mod per Long Rest." }
            ],
            2: [
                { name: "Jack of All Trades", desc: "Add half your proficiency bonus (round down) to ability checks that don't already use your proficiency bonus." },
                { name: "Expertise", desc: "Choose 2 skills you're proficient in. Your proficiency bonus is doubled for those checks." }
            ],
            3: [
                { name: "Bard Subclass", desc: "Choose your Bard College. It grants your subclass features." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            5: [
                { name: "Font of Inspiration", desc: "Your Bardic Inspiration now recharges on a Short Rest (instead of only a Long Rest)." }
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
                features: {
                    3: [
                        { name: "Bonus Proficiencies", desc: "Proficiency in 3 additional skills of your choice." },
                        { name: "Cutting Words", desc: "Reaction: when a creature within 60ft makes an attack roll, ability check, or damage roll, subtract your Bardic Inspiration die from the result." }
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
                        { name: "Dazzling Footwork", desc: "+10ft speed, and your unarmed strikes use a martial arts die. When you hit a creature with an unarmed strike, you can use Bardic Inspiration on yourself (doesn't count as a use)." }
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
                features: {
                    3: [
                        { name: "Mantle of Inspiration", desc: "Bonus Action, spend a Bardic Inspiration: up to 5 creatures within 60ft gain CHA mod temp HP and can move their full speed as a reaction without provoking opportunity attacks." },
                        { name: "Enthralling Performance", desc: "After a 1-minute performance: a number of creatures equal to your CHA modifier are Charmed for 1 hour (WIS save negates). On a failed save they don't realise you tried to charm them." }
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
                        { name: "Combat Inspiration", desc: "A Bardic Inspiration die can also be spent to add damage to a weapon attack, or as a reaction to add the result to AC against one attack." },
                        { name: "Bonus Proficiencies", desc: "Proficiency with medium armor, shields, and martial weapons." }
                    ],
                    6: [
                        { name: "Extra Attack", desc: "You can attack twice, instead of once, whenever you take the Attack action." }
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
                { name: "Spellcasting", desc: "Cast Cleric spells with Wisdom as your spellcasting ability. You prepare a fixed number of spells (4 at level 1) and can change your entire prepared list when you finish a Long Rest." },
                { name: "Divine Order", desc: "Choose Protector (heavy armor + martial weapons proficiency) or Thaumaturge (1 extra cantrip and add your WIS mod to Religion/Arcana checks)." }
            ],
            2: [
                { name: "Channel Divinity", desc: "Channel divine energy: 2 uses (3 at level 6), regain one on a Short Rest, all on a Long Rest. Options: Turn Undead (WIS save or Turned) and Divine Spark (1d8+WIS healing or radiant damage at 30ft)." }
            ],
            3: [
                { name: "Cleric Subclass", desc: "Choose your Divine Domain. It grants your subclass features and bonus spells." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." }
            ],
            5: [
                { name: "Sear Undead", desc: "When an undead fails its Turn Undead save: it takes WIS modifier x d8 radiant damage." },
                { name: "Smite Undead", desc: "Turn Undead can now destroy undead of a low enough CR." }
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
                features: {
                    3: [
                        { name: "Disciple of Life", desc: "Healing spells herstellen extra HP gelijk aan 2 + spell level." },
                        { name: "Life Domain Spells", desc: "Altijd prepared: Bless, Cure Wounds (1st), Aid, Lesser Restoration (3rd), Mass Healing Word, Revivify (5th), Death Ward, Guardian of Faith (7th), Greater Restoration, Mass Cure Wounds (9th)." }
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
                features: {
                    3: [
                        { name: "Warding Flare", desc: "Reaction: when a creature within 30ft attacks you, impose disadvantage on the attack roll. Uses = WIS modifier per Long Rest." },
                        { name: "Bonus Cantrip", desc: "You learn the Light cantrip if you don't already know it." },
                        { name: "Light Domain Spells", desc: "Altijd prepared: Burning Hands, Faerie Fire (1st), Flaming Sphere, Scorching Ray (3rd), Daylight, Fireball (5th), Guardian of Faith, Wall of Fire (7th), Flame Strike, Scrying (9th)." }
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
                features: {
                    3: [
                        { name: "Blessing of the Trickster", desc: "As an action: give an ally advantage on Stealth checks for 1 hour." },
                        { name: "Trickery Domain Spells", desc: "Altijd prepared: Charm Person, Disguise Self (1st), Mirror Image, Pass without Trace (3rd), Blink, Dispel Magic (5th), Dimension Door, Polymorph (7th), Dominate Person, Modify Memory (9th)." }
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
                features: {
                    3: [
                        { name: "War Priest", desc: "Bonus Action weapon attack after taking the Attack action. Uses = WIS modifier per Long Rest." },
                        { name: "War Domain Spells", desc: "Altijd prepared: Divine Favor, Shield of Faith (1st), Magic Weapon, Spiritual Weapon (3rd), Crusader's Mantle, Spirit Guardians (5th), Freedom of Movement, Stoneskin (7th), Flame Strike, Hold Monster (9th)." },
                        { name: "Bonus Proficiencies", desc: "Proficiency with martial weapons and heavy armor." }
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

        // 5.5e: "Ki" hernoemd naar "Focus Points"
        martialArtsDie: { 1:"1d6", 2:"1d6", 3:"1d6", 4:"1d6", 5:"1d8", 6:"1d8", 7:"1d8", 8:"1d8", 9:"1d8", 10:"1d8", 11:"1d10", 12:"1d10", 13:"1d10", 14:"1d10", 15:"1d10", 16:"1d10", 17:"1d12", 18:"1d12", 19:"1d12", 20:"1d12" },
        focusPoints: { 1:0, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 10:10, 11:11, 12:12, 13:13, 14:14, 15:15, 16:16, 17:17, 18:18, 19:19, 20:20 },

        features: {
            1: [
                { name: "Martial Arts", desc: "Unarmed strikes and monk weapons use DEX. Unarmed strikes deal 1d6 (scaling). After an Attack action: 1 Bonus Action unarmed strike." },
                { name: "Unarmored Defense", desc: "Without armor: AC = 10 + DEX mod + WIS mod." }
            ],
            2: [
                { name: "Focus Points", desc: "You gain Focus Points (formerly Ki). Spend them on: Flurry of Blows (2 bonus unarmed strikes), Patient Defense (Dodge as a Bonus Action), Step of the Wind (Dash or Disengage as a Bonus Action + double jump distance)." },
                { name: "Unarmored Movement", desc: "+10ft speed while unarmored. Grows at higher levels (+15ft lvl 6, +20ft lvl 10, +25ft lvl 14, +30ft lvl 18)." },
                { name: "Uncanny Metabolism", desc: "Once per Long Rest when you roll Initiative: regain all expended Focus Points and regain HP equal to your Monk level + one roll of your Martial Arts die." }
            ],
            3: [
                { name: "Monk Subclass", desc: "Choose your Monastic Tradition. It shapes how you apply your martial arts." },
                { name: "Deflect Attacks", desc: "Reaction: reduce the damage of a melee or ranged attack by 1d10 + DEX mod + monk level. If the damage drops to 0, make a ranged counterattack (20/60ft)." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Increase one ability score by 2, or two scores by 1. Or pick a feat instead." },
                { name: "Slow Fall", desc: "Reaction: reduce fall damage by 5x your monk level." }
            ],
            5: [
                { name: "Extra Attack", desc: "You can attack twice, instead of once, whenever you take the Attack action." },
                { name: "Stunning Strike", desc: "1 Focus Point: on a hit the target makes a CON save or is Stunned until the end of your next turn." }
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
                        { name: "Open Hand Technique", desc: "With Flurry of Blows: choose an extra effect per hit. Push 15ft, knock Prone (DEX save), or the target can't take reactions." }
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
                features: {
                    3: [
                        { name: "Hand of Healing", desc: "1 Focus Point: as an action, heal a creature you touch for 1d6 + WIS modifier HP. You can also use this in place of one Flurry of Blows attack." },
                        { name: "Hand of Harm", desc: "1 Focus Point: when you hit with an unarmed strike, deal +1d6 + WIS modifier necrotic damage. You can also force the target to make a CON save or be Poisoned until the end of your next turn." }
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
                features: {
                    3: [
                        { name: "Shadow Arts", desc: "2 Focus Points: cast Darkness, Darkvision, Pass without Trace of Silence. Minor Illusion cantrip gratis." }
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
                features: {
                    3: [
                        { name: "Elemental Attunement", desc: "You learn elemental cantrips. Elemental Burst: 2 Focus Points, 20ft radius, CON save, 3d6 damage of a chosen element (acid, cold, fire, lightning, or thunder)." }
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

    // ===== METAMAGIC OPTIONS =====
    metamagic: [
        { name: "Careful Spell", cost: 1, desc: { nl: "Kies een aantal creatures gelijk aan je CHA modifier (min 1). Ze slagen automatisch op de saving throw van je spell.", en: "Choose a number of creatures equal to your CHA modifier (min 1). They automatically succeed on the spell's saving throw." } },
        { name: "Distant Spell", cost: 1, desc: { nl: "Verdubbel de range van een spell met range 5ft+. Spells met touch krijgen range 30ft.", en: "Double the range of a spell with a range of 5ft+. Touch spells get a range of 30ft." } },
        { name: "Empowered Spell", cost: 1, desc: { nl: "Rol opnieuw tot je CHA modifier (min 1) damage dice. Combineerbaar met andere Metamagic.", en: "Reroll up to your CHA modifier (min 1) damage dice. Can be combined with other Metamagic." } },
        { name: "Extended Spell", cost: 1, desc: { nl: "Verdubbel de duur van een spell (max 24 uur).", en: "Double the duration of a spell (max 24 hours)." } },
        { name: "Heightened Spell", cost: 3, desc: { nl: "Kies één target van de spell. Dat target heeft disadvantage op de eerste saving throw tegen de spell.", en: "Choose one target of the spell. That target has disadvantage on its first saving throw against the spell." } },
        { name: "Quickened Spell", cost: 2, desc: { nl: "Cast een spell met casting time 1 action als bonus action.", en: "Cast a spell with a casting time of 1 action as a bonus action." } },
        { name: "Subtle Spell", cost: 1, desc: { nl: "Cast een spell zonder verbal of somatic components. Ideaal tegen Counterspell.", en: "Cast a spell without verbal or somatic components. Ideal against Counterspell." } },
        { name: "Twinned Spell", cost: "spell level (1 min)", desc: { nl: "Target een tweede creature met een single-target spell. Kost sorcery points gelijk aan het spell level (1 voor cantrips).", en: "Target a second creature with a single-target spell. Costs sorcery points equal to the spell level (1 for cantrips)." } }
    ],

    // ===== FEATS (5.5e / 2024 PHB) =====
    // Categories: "origin" (level 1 via background), "general" (level 4+ via ASI), "fighting" (class feature), "epic" (level 19+)
    feats: [
        // --- ORIGIN FEATS (level 1, via background) ---
        { name: "Alert", category: "origin", desc: "+2 Initiative bonus. You can't be Surprised. If you have Heroic Inspiration at the start of combat, you can give it to an ally.", prereq: null },
        { name: "Crafter", category: "origin", desc: "Proficiency with 3 artisan's tools of your choice. 20% discount on nonmagical items. You can craft simple items overnight (rope, torches, etc.).", prereq: null },
        { name: "Healer", category: "origin", desc: "With a Healer's Kit, as an action: restore 1d6 + 4 + the target's number of Hit Dice HP to a creature (once per Short/Long Rest per creature). Stabilise a creature at 0 HP as a Bonus Action.", prereq: null },
        { name: "Lucky", category: "origin", desc: "You have Luck Points equal to your proficiency bonus, restored on a Long Rest. Spend 1 point to roll an extra d20 after seeing your roll and choose which one counts. Also usable on an attack roll made against you.", prereq: null },
        { name: "Magic Initiate (Cleric)", category: "origin", desc: "Learn 2 cleric cantrips and 1 first-level cleric spell. Cast the spell once per Long Rest for free, or with spell slots. WIS is your spellcasting ability for these spells. Can be taken again for a different spell list.", prereq: null, spellList: "cleric", repeatable: true },
        { name: "Magic Initiate (Druid)", category: "origin", desc: "Learn 2 druid cantrips and 1 first-level druid spell. Cast the spell once per Long Rest for free, or with spell slots. WIS is your spellcasting ability for these spells. Can be taken again for a different spell list.", prereq: null, spellList: "druid", repeatable: true },
        { name: "Magic Initiate (Wizard)", category: "origin", desc: "Learn 2 wizard cantrips and 1 first-level wizard spell. Cast the spell once per Long Rest for free, or with spell slots. INT is your spellcasting ability for these spells. Can be taken again for a different spell list.", prereq: null, spellList: "wizard", repeatable: true },
        { name: "Musician", category: "origin", desc: "Proficiency with 3 musical instruments of your choice. After a Short or Long Rest: play a song and give Heroic Inspiration to a number of allies equal to your proficiency bonus.", prereq: null },
        { name: "Savage Attacker", category: "origin", desc: "Once per turn when you roll melee weapon damage, reroll the damage dice and use the higher result.", prereq: null },
        { name: "Skilled", category: "origin", desc: "Proficiency in 3 skills or tools of your choice. You can take this feat more than once (different skills/tools).", prereq: null },
        { name: "Tavern Brawler", category: "origin", desc: "Proficiency with improvised weapons. Your unarmed strike deals 1d4. On an unarmed strike hit: push the target 5ft. Reroll one damage die on unarmed/improvised weapon attacks.", prereq: null },
        { name: "Tough", category: "origin", desc: "Your max HP increases by 2 per level (retroactive), including future levels.", prereq: null },

        // --- GENERAL FEATS (level 4+ via ASI) ---
        { name: "Actor", category: "general", desc: "+1 CHA (max 20). Advantage on Deception and Performance checks to pass yourself off as someone else. Mimic the speech and sounds of others.", prereq: { cha: 13 }, abilityBonus: { cha: 1 } },
        { name: "Athlete", category: "general", desc: "+1 STR or DEX (max 20). Standing up costs only 5ft of movement. Climbing costs no extra movement. Running long/high jumps after only a 5ft run-up.", prereq: { strOrDex: 13 } },
        { name: "Charger", category: "general", desc: "+1 STR or DEX (max 20). After a Dash action: Bonus Action melee attack with +1d8 damage, or push the target 10ft.", prereq: { strOrDex: 13 } },
        { name: "Crossbow Expert", category: "general", desc: "+1 DEX (max 20). No disadvantage on ranged attacks in melee. Ignore the loading property. After attacking with a one-handed weapon: Bonus Action hand crossbow attack.", prereq: { dex: 13 }, abilityBonus: { dex: 1 } },
        { name: "Defensive Duelist", category: "general", desc: "Reaction when you're attacked in melee while wielding a finesse weapon: add your proficiency bonus to AC against that attack.", prereq: { dex: 13 } },
        { name: "Dual Wielder", category: "general", desc: "+1 STR or DEX (max 20). +1 AC while wielding two weapons. Two-weapon fighting with non-light weapons. Draw two weapons at once.", prereq: { strOrDex: 13 } },
        { name: "Durable", category: "general", desc: "+1 CON (max 20). On a Short Rest you can spend Hit Dice as normal, and you regain all your Hit Dice on a Long Rest instead of half.", prereq: { con: 13 }, abilityBonus: { con: 1 } },
        { name: "Elemental Adept", category: "general", desc: "Choose an element (acid/cold/fire/lightning/thunder). Your spells ignore resistance to it, and you treat 1s on damage dice as 2s. Repeatable (different element).", prereq: { spellcasting: true } },
        { name: "Fey Touched", category: "general", desc: "+1 INT, WIS, or CHA (max 20). Learn Misty Step + 1 first-level divination/enchantment spell. Cast each once per Long Rest for free, or with spell slots.", prereq: { intWisOrCha: 13 } },
        { name: "Great Weapon Master", category: "general", desc: "+1 STR (max 20). On a critical hit or kill with a heavy melee weapon: Bonus Action extra melee attack. Once per turn when you hit with a heavy weapon: add extra damage equal to your proficiency bonus.", prereq: { str: 13 }, abilityBonus: { str: 1 } },
        { name: "Inspiring Leader", category: "general", desc: "+1 CHA (max 20). Spend 10 minutes: up to 6 creatures gain 2d6 + CHA modifier temporary HP. Scales with level.", prereq: { cha: 13 }, abilityBonus: { cha: 1 } },
        { name: "Mage Slayer", category: "general", desc: "+1 STR or DEX (max 20). Reaction: melee attack when an adjacent creature casts a spell. Advantage on saves against spells of adjacent creatures. Impose disadvantage on their concentration saves.", prereq: { strOrDex: 13 } },
        { name: "Mobile", category: "general", desc: "+10ft speed. Dashing through difficult terrain costs no extra movement. No opportunity attacks from creatures you made a melee attack against this turn.", prereq: { dex: 13 } },
        { name: "Observant", category: "general", desc: "+1 INT or WIS (max 20). Read lips if you understand the language. +5 to passive Perception and passive Investigation.", prereq: { intOrWis: 13 } },
        { name: "Polearm Master", category: "general", desc: "+1 STR or DEX (max 20). Bonus Action attack (1d4 bludgeoning) with the other end of a glaive/halberd/quarterstaff/spear. Opportunity attack when a creature enters your reach.", prereq: { strOrDex: 13 } },
        { name: "Resilient", category: "general", desc: "+1 to one ability score of your choice (max 20). Proficiency in saving throws for that ability.", prereq: null },
        { name: "Ritual Caster", category: "general", desc: "+1 INT, WIS, or CHA (max 20). Learn 2 ritual spells and cast them as rituals from a ritual book. You can add new ritual spells you find.", prereq: { intWisOrCha: 13 } },
        { name: "Sentinel", category: "general", desc: "+1 STR or DEX (max 20). Reaction melee attack when a creature within 5ft attacks an ally (not you). Creatures you hit with an opportunity attack have speed 0 for the rest of the turn.", prereq: { strOrDex: 13 } },
        { name: "Shadow Touched", category: "general", desc: "+1 INT, WIS, or CHA (max 20). Learn Invisibility + 1 first-level illusion/necromancy spell. Cast each once per Long Rest for free, or with spell slots.", prereq: { intWisOrCha: 13 } },
        { name: "Sharpshooter", category: "general", desc: "+1 DEX (max 20). No disadvantage at long range. Ignore half and three-quarters cover. Once per turn when you hit with a ranged weapon: +proficiency bonus extra damage.", prereq: { dex: 13 }, abilityBonus: { dex: 1 } },
        { name: "Skulker", category: "general", desc: "+1 DEX (max 20). You can hide while lightly obscured. Missing with a ranged attack doesn't reveal your position. Dim light imposes no disadvantage on your Perception checks.", prereq: { dex: 13 }, abilityBonus: { dex: 1 } },
        { name: "War Caster", category: "general", desc: "+1 INT, WIS, or CHA (max 20). Advantage on concentration saves. Perform somatic components with your hands full. Reaction: cast a cantrip instead of making an opportunity attack.", prereq: { spellcasting: true } },
        { name: "Weapon Master", category: "general", desc: "+1 STR or DEX (max 20). Proficiency with 4 weapons of your choice. On each Long Rest: swap 1 weapon mastery property.", prereq: { strOrDex: 13 } },
        { name: "Keen Mind", category: "general", desc: "+1 INT (max 20). You can take the Study action as a Bonus Action. You always know which way is north and how many hours remain until the next sunrise or sunset.", prereq: { int: 13 }, abilityBonus: { int: 1 } },
        { name: "Piercer", category: "general", desc: "+1 STR or DEX (max 20). Once per turn when you roll piercing damage, you may reroll one damage die. On a critical hit with a piercing weapon: roll one extra damage die.", prereq: { strOrDex: 13 } },
        { name: "Slasher", category: "general", desc: "+1 STR or DEX (max 20). Once per turn on slashing damage: reduce the target's speed by 10ft until the start of your next turn. On a critical hit: the target has disadvantage on attacks until your next turn.", prereq: { strOrDex: 13 } },
        { name: "Crusher", category: "general", desc: "+1 STR or DEX (max 20). Once per turn on bludgeoning damage: push the target 5ft. On a critical hit: attackers have advantage against the target until your next turn.", prereq: { strOrDex: 13 } },
        { name: "Chef", category: "general", desc: "+1 CON or WIS (max 20). Proficiency with cook's utensils. During a Short Rest you can cook food that restores extra HP; after a Long Rest you can make treats that grant temporary HP.", prereq: null },
        { name: "Skill Expert", category: "general", desc: "+1 to one ability score of your choice (max 20). Proficiency in one skill of your choice. Expertise in one skill you're already proficient in.", prereq: null },
        { name: "Telekinetic", category: "general", desc: "+1 INT, WIS, or CHA (max 20). Learn the Mage Hand cantrip (invisible hand). Bonus Action: telekinetically push or pull a creature 5ft (STR save).", prereq: { intWisOrCha: 13 } },
        { name: "Telepathic", category: "general", desc: "+1 INT, WIS, or CHA (max 20). Telepathy up to 60ft with creatures that speak a language. Cast Detect Thoughts once per Long Rest for free, or with spell slots.", prereq: { intWisOrCha: 13 } },
        { name: "Metamagic Adept", category: "general", desc: "Learn 2 Metamagic options of your choice. You gain 2 Sorcery Points to fuel them (restored on a Long Rest). Repeatable (new options + 2 extra points).", prereq: { spellcasting: true }, repeatable: true },
        { name: "Grappler", category: "general", desc: "+1 STR or DEX (max 20). Advantage on attacks against a creature you've Grappled. Bonus Action: move a grappled target (at half your speed).", prereq: { strOrDex: 13 } },
        { name: "Poisoner", category: "general", desc: "Ignore poison resistance. As an action: coat a weapon or ammunition with poison (CON save DC 8 + prof + DEX or 2d8 poison damage + Poisoned). Proficiency with the poisoner's kit; brew poison doses during a rest.", prereq: null },
        { name: "Heavily Armored", category: "general", desc: "+1 STR (max 20). You gain training with heavy armor. (Requires: training with medium armor.)", prereq: null, abilityBonus: { str: 1 } },
        { name: "Moderately Armored", category: "general", desc: "+1 STR or DEX (max 20). You gain training with medium armor and shields. (Requires: training with light armor.)", prereq: null },

        // --- EPIC BOONS (level 19+) ---
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

        // --- FIGHTING STYLE FEATS (class feature, kies via Fighter/Paladin/Ranger) ---
        // 2024 PHB Fighting Style feats — English + 2024 wording (fase F; the old
        // Dutch texts partly used 2014 rules: GWF reroll, TWF off-hand, Thrown draw).
        { name: "Archery", category: "fighting", desc: "You gain a +2 bonus to attack rolls you make with Ranged weapons.", prereq: null },
        { name: "Blind Fighting", category: "fighting", desc: "You have Blindsight with a range of 10 feet: within that range you can see anything that isn't behind Total Cover, even in darkness or when facing an Invisible creature.", prereq: null },
        { name: "Defense", category: "fighting", desc: "While you're wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.", prereq: null },
        { name: "Dueling", category: "fighting", desc: "When you're holding a Melee weapon in one hand and no other weapons, you gain a +2 bonus to damage rolls with that weapon. A Shield is allowed.", prereq: null },
        { name: "Great Weapon Fighting", category: "fighting", desc: "When you roll damage for an attack with a Melee weapon you're holding with two hands (Two-Handed, or Versatile used two-handed), treat any 1 or 2 on a damage die as a 3.", prereq: null },
        { name: "Interception", category: "fighting", desc: "Reaction when a creature you can see hits another creature within 5 feet of you: reduce the damage dealt by 1d10 + your Proficiency Bonus. You must be holding a Shield or a Simple or Martial weapon.", prereq: null },
        { name: "Protection", category: "fighting", desc: "Reaction when a creature you can see attacks a target other than you within 5 feet of you, while you're holding a Shield: interpose your Shield to impose Disadvantage on that attack roll.", prereq: null },
        { name: "Thrown Weapon Fighting", category: "fighting", desc: "You gain a +2 bonus to damage rolls with weapons that have the Thrown property when you make ranged attacks with them.", prereq: null },
        { name: "Two-Weapon Fighting", category: "fighting", desc: "When you make the extra attack granted by the Light weapon property, you can add your ability modifier to that attack's damage.", prereq: null },
        { name: "Unarmed Fighting", category: "fighting", desc: "Your Unarmed Strikes deal 1d6 + STR bludgeoning damage (1d8 if you aren't holding weapons or a Shield). At the start of each of your turns, you can deal 1d4 bludgeoning damage to one creature Grappled by you.", prereq: null }
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
    // Equipment lists below zijn best-recall van 2024 PHB Ch.4 Backgrounds — verifieer tegen PHB voordat je op production rekent.
    backgrounds: {
        // --- LEGACY (niet in 2024 PHB) ---
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

    // ===== TOOLTIPS =====
    tooltips: {
        halfElf: {
            title: "Half-Elf (Legacy)",
            desc: "LEGACY — Removed in the 2024 PHB. Choose Human or Elf for new characters.",
            abilities: "+2 Charisma, +1 op twee andere ability scores naar keuze",
            traits: "Darkvision 60ft, Fey Ancestry (advantage vs charm), Skill Versatility (2 extra skill proficiencies)",
            languages: "Common, Elvish, +1 naar keuze",
            speed: "30ft",
            size: "Medium"
        },
        sorcerer: {
            title: "Sorcerer",
            desc: "Magic runs in your blood. You don't have to learn it — it's already there.",
            hitDie: "d6",
            primaryAbility: "Charisma",
            savingThrows: "Constitution, Charisma",
            armorProf: "Geen",
            weaponProf: "Daggers, darts, slings, quarterstaffs, light crossbows",
            spellcasting: "Bereid spells voor uit de volledige Sorcerer spell list. Aantal = CHA mod + level."
        },
        rogue: {
            title: "Rogue",
            desc: "A specialist in precision, stealth, and exploiting weak spots.",
            hitDie: "d8",
            primaryAbility: "Dexterity",
            savingThrows: "Dexterity, Intelligence",
            armorProf: "Light armor",
            weaponProf: "Simple weapons, hand crossbows, longswords, rapiers, shortswords",
            tools: "Thieves' tools"
        },
        wildMagic: {
            title: "Wild Magic Origin",
            desc: "Your magic flows from a chaotic source. Unpredictable but powerful — every spell carries a chance of a Wild Magic Surge.",
            keyFeatures: "Wild Magic Surge, Tides of Chaos (lvl 3), Bend Luck (lvl 6), Controlled Chaos (lvl 14), Spell Bombardment (lvl 18)"
        },
        scout: {
            title: "Scout Archetype (Legacy)",
            desc: "LEGACY — Not in the 2024 PHB. 5.5e Rogue subclasses: Arcane Trickster, Assassin, Soulknife, Thief.",
            keyFeatures: "Skirmisher, Survivalist (lvl 3), Superior Mobility (lvl 9), Ambush Master (lvl 13), Sudden Strike (lvl 17)"
        },
        urchin: {
            title: "Urchin Background (Legacy)",
            desc: "LEGACY — Not in the 2024 PHB. Consider Criminal or Wayfarer as an alternative.",
            skillProf: "Sleight of Hand, Stealth",
            toolProf: "Thieves' tools",
            feature: "Lucky — Origin feat",
            abilityScores: "+2/+1 verdeeld over DEX, CON, WIS"
        },

        // New race tooltips
        human: {
            title: "Human (2024)",
            desc: "Versatile and ambitious. Humans adapt to any situation.",
            abilities: "+1 op drie ability scores naar keuze (via background), of +2/+1",
            traits: "Resourceful (Heroic Inspiration op long rest), Skillful (1 extra skill proficiency), Versatile (origin feat naar keuze)",
            languages: "Common, +1 naar keuze",
            speed: "30ft",
            size: "Medium"
        },
        halfling: {
            title: "Halfling (2024)",
            desc: "Klein maar dapper. Halflings zijn optimistisch en buitengewoon gelukkig.",
            abilities: "+1 op drie ability scores naar keuze (via background), of +2/+1",
            traits: "Brave (advantage vs frightened), Halfling Nimbleness (door grotere creatures bewegen), Luck (herrol nat 1), Naturally Stealthy (verbergen achter grotere creatures)",
            languages: "Common, Halfling",
            speed: "30ft",
            size: "Small"
        },
        tiefling: {
            title: "Tiefling (2024)",
            desc: "Descended from fiendish powers. Tieflings bear the marks of their heritage.",
            abilities: "+1 op drie ability scores naar keuze (via background), of +2/+1",
            traits: "Darkvision 60ft, Fiendish Legacy (kies Abyssal/Chthonic/Infernal voor resistance + spells), Otherworldly Presence (Thaumaturgy cantrip)",
            languages: "Common, +1 naar keuze",
            speed: "30ft",
            size: "Medium"
        },
        aasimar: {
            title: "Aasimar (2024)",
            desc: "Blessed with celestial power. Aasimar carry a divine spark in their soul.",
            abilities: "+1 op drie ability scores naar keuze (via background), of +2/+1",
            traits: "Celestial Resistance (necrotic + radiant resistance), Darkvision 60ft, Healing Hands (heal = prof bonus, 1x/long rest), Light Bearer (Light cantrip), Celestial Revelation (lvl 3: Wings/Radiance/Shroud)",
            languages: "Common, +1 naar keuze",
            speed: "30ft",
            size: "Medium"
        },
        woodElf: {
            title: "Wood Elf (2024)",
            desc: "Swift and unobtrusive. Wood Elves live in harmony with nature and move through the forest like shadows.",
            abilities: "+1 op drie ability scores naar keuze (via background), of +2/+1",
            traits: "Darkvision 60ft, Fey Ancestry (advantage vs charmed, immuun magische slaap), Keen Senses (Perception proficiency), Trance (4 uur meditatie i.p.v. slaap), Elf Lineage: Wood Elf (speed 35ft, Longstrider lvl 3, Pass Without Trace lvl 5)",
            languages: "Common, Elvish",
            speed: "35ft",
            size: "Medium"
        },

        // New class tooltips
        ranger: {
            title: "Ranger",
            desc: "A warrior of the wilds who blends magic with martial skill and survival craft.",
            hitDie: "d10",
            primaryAbility: "Dexterity & Wisdom",
            savingThrows: "Strength, Dexterity",
            armorProf: "Light armor, medium armor, shields",
            weaponProf: "Simple weapons, martial weapons",
            spellcasting: "Half caster (WIS). Bereidt spells voor: WIS mod + half ranger level. Geen cantrips."
        },
        wizard: {
            title: "Wizard",
            desc: "Geleerde magiër die magie bestudeert vanuit boeken en eeuwenoude kennis.",
            hitDie: "d6",
            primaryAbility: "Intelligence",
            savingThrows: "Intelligence, Wisdom",
            armorProf: "Geen",
            weaponProf: "Daggers, darts, slings, quarterstaffs, light crossbows",
            spellcasting: "Full caster (INT). Bereidt spells voor uit spellbook: INT mod + wizard level."
        },
        paladin: {
            title: "Paladin",
            desc: "A holy warrior bound by an oath, combining divine magic with skill at arms.",
            hitDie: "d10",
            primaryAbility: "Strength & Charisma",
            savingThrows: "Wisdom, Charisma",
            armorProf: "Alle armor, shields",
            weaponProf: "Simple weapons, martial weapons",
            spellcasting: "Half caster (CHA). Bereidt spells voor: CHA mod + half paladin level. Divine Smite voor extra radiant damage."
        },
        druid: {
            title: "Druid",
            desc: "A guardian of nature who calls on the power of the elements and wild beasts.",
            hitDie: "d8",
            primaryAbility: "Wisdom",
            savingThrows: "Intelligence, Wisdom",
            armorProf: "Light armor, medium armor, shields (no metal)",
            weaponProf: "Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears",
            spellcasting: "Full caster (WIS). Bereidt spells voor: WIS mod + druid level. Wild Shape om in dieren te transformeren."
        },
        fighter: {
            title: "Fighter",
            desc: "A master of weapons and tactics. The most versatile martial class.",
            hitDie: "d10",
            primaryAbility: "Strength of Dexterity",
            savingThrows: "Strength, Constitution",
            armorProf: "Alle armor, shields",
            weaponProf: "Simple weapons, martial weapons",
            spellcasting: "Geen (tenzij Eldritch Knight subclass). Krijgt meer ASIs dan andere klassen (7 totaal)."
        },
        warlock: {
            title: "Warlock",
            desc: "A mage who draws power from a pact with an otherworldly being.",
            hitDie: "d8",
            primaryAbility: "Charisma",
            savingThrows: "Wisdom, Charisma",
            armorProf: "Light armor",
            weaponProf: "Simple weapons",
            spellcasting: "Pact Magic (CHA). Beperkte spell slots die herstellen na short rest. Alle slots zijn van hetzelfde level. Mystic Arcanum voor hogere spells."
        },
        barbarian: {
            title: "Barbarian",
            desc: "Woeste krijger die primitieve kracht en ontembare woede inzet.",
            hitDie: "d12",
            primaryAbility: "Strength",
            savingThrows: "Strength, Constitution",
            armorProf: "Light armor, medium armor, shields",
            weaponProf: "Simple weapons, martial weapons",
            spellcasting: "None. Rage grants bonus melee damage and resistance to B/P/S. Weapon Mastery (2 properties)."
        },
        bard: {
            title: "Bard",
            desc: "An artist-mage who wields music and words as magical power.",
            hitDie: "d8",
            primaryAbility: "Charisma",
            savingThrows: "Dexterity, Charisma",
            armorProf: "Light armor",
            weaponProf: "Simple weapons, hand crossbows, longswords, rapiers, shortswords",
            spellcasting: "Full caster (CHA). Bereidt spells voor: CHA mod + bard level. Bardic Inspiration voor allies."
        },
        cleric: {
            title: "Cleric",
            desc: "A divine caster in service of a higher power. Healer and protector.",
            hitDie: "d8",
            primaryAbility: "Wisdom",
            savingThrows: "Wisdom, Charisma",
            armorProf: "Light armor, medium armor, shields (+ heavy via Divine Order: Protector)",
            weaponProf: "Simple weapons (+ martial via Divine Order: Protector)",
            spellcasting: "Full caster (WIS). Bereidt spells voor: WIS mod + cleric level. Channel Divinity voor goddelijke effecten."
        },
        monk: {
            title: "Monk",
            desc: "A martial artist pursuing physical perfection, fueled by Focus Points.",
            hitDie: "d8",
            primaryAbility: "Dexterity & Wisdom",
            savingThrows: "Strength, Dexterity",
            armorProf: "Geen (Unarmored Defense: 10 + DEX + WIS)",
            weaponProf: "Simple weapons, shortswords",
            spellcasting: "Geen. Focus Points (voorheen Ki) voor Flurry of Blows, Patient Defense, Step of the Wind. Unarmed strikes schalen."
        },

        // Species tooltips for new races
        dwarf: {
            title: "Dwarf (2024)",
            desc: "Tough and resilient. Dwarves are masters of stone and smithing.",
            abilities: "+1 op drie ability scores naar keuze (via background), of +2/+1",
            traits: "Darkvision 120ft, Dwarven Resilience (poison resistance + advantage vs poisoned), Dwarven Toughness (+1 HP/level), Stonecunning (Tremorsense 60ft op steen)",
            languages: "Common, Dwarvish",
            speed: "30ft",
            size: "Medium"
        },
        gnome: {
            title: "Gnome (2024)",
            desc: "Klein, slim en boordevol curiositeit. Gnomes zijn natuurlijke uitvinders.",
            abilities: "+1 op drie ability scores naar keuze (via background), of +2/+1",
            traits: "Darkvision 60ft, Gnome Cunning (advantage INT/WIS/CHA saves vs magic), Gnome Lineage (Forest: Minor Illusion + Speak with Animals / Rock: Mending + Prestidigitation + Tinker)",
            languages: "Common, Gnomish",
            speed: "30ft",
            size: "Small"
        },
        goliath: {
            title: "Goliath (2024)",
            desc: "Towering and unyielding. Goliaths descend from giants.",
            abilities: "+1 op drie ability scores naar keuze (via background), of +2/+1",
            traits: "Giant Ancestry (kies Cloud/Fire/Frost/Hill/Stone/Storm), Large Form (lvl 5: word Large), Powerful Build (tel als Large voor carry/push/drag)",
            languages: "Common, Giant",
            speed: "35ft",
            size: "Medium"
        },
        orc: {
            title: "Orc (2024)",
            desc: "Powerful and indomitable. Orcs thrive on adrenaline and survival.",
            abilities: "+1 op drie ability scores naar keuze (via background), of +2/+1",
            traits: "Darkvision 120ft, Adrenaline Rush (Dash + temp HP als bonus action), Relentless Endurance (1 HP i.p.v. 0, 1x/long rest)",
            languages: "Common, Orc",
            speed: "30ft",
            size: "Medium"
        },
        dragonborn: {
            title: "Dragonborn (2024)",
            desc: "Descended from dragons. Dragonborn carry the power of their ancestors.",
            abilities: "+1 op drie ability scores naar keuze (via background), of +2/+1",
            traits: "Draconic Ancestry (element choice + resistance), Breath Weapon (15ft cone or 30ft line, scaling), Draconic Flight (lvl 5: fly speed 10 min)",
            languages: "Common, Draconic",
            speed: "30ft",
            size: "Medium"
        },

        // New background tooltips
        guide: {
            title: "Guide Background",
            desc: "You've guided travelers through the wilderness all your life. You know nature's paths and perils.",
            skillProf: "Stealth, Survival",
            toolProf: "Cartographer's Tools",
            feature: "Magic Initiate (Druid) — Leer 2 druid cantrips en 1 first-level druid spell.",
            abilityScores: "+2/+1 verdeeld over DEX, WIS, CON"
        },
        sage: {
            title: "Sage Background",
            desc: "For years you've gathered knowledge from books and libraries. You're an expert in your field.",
            skillProf: "Arcana, History",
            toolProf: "Calligrapher's Supplies",
            feature: "Magic Initiate (Wizard) — Leer 2 wizard cantrips en 1 first-level wizard spell.",
            abilityScores: "+2/+1 verdeeld over INT, WIS, CON"
        },
        soldier: {
            title: "Soldier Background",
            desc: "You served in an army or militia. You know the discipline of the battlefield.",
            skillProf: "Athletics, Intimidation",
            toolProf: "Gaming Set",
            feature: "Savage Attacker — Once per turn, reroll melee weapon damage dice and use the higher result.",
            abilityScores: "+2/+1 verdeeld over STR, DEX, CON"
        },
        acolyte: {
            title: "Acolyte Background",
            desc: "You've devoted your life to the service of a temple or religious order.",
            skillProf: "Insight, Religion",
            toolProf: "Calligrapher's Supplies",
            feature: "Magic Initiate (Cleric) — Leer 2 cleric cantrips en 1 first-level cleric spell.",
            abilityScores: "+2/+1 verdeeld over INT, WIS, CHA"
        },
        charlatan: {
            title: "Charlatan Background",
            desc: "False identities, cons, and deception are your specialty.",
            skillProf: "Deception, Sleight of Hand",
            toolProf: "Forgery Kit",
            feature: "Skilled — Proficiency in 3 extra skills of tools naar keuze.",
            abilityScores: "+2/+1 verdeeld over DEX, CON, CHA"
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
// Single source of truth voor de Inventory-widget. Verrijkt de magere
// DATA.items.* arrays hierboven (die alleen {name, weight, mastery?} hadden en
// nergens anders meer geconsumeerd worden) met type/cost/damage/properties/armor.
// Per-character inventory leeft los in state.items {name, qty, equipped, notes,
// ref?}; deze tabel is de read-only DEFINITIE die de widget op naam joint.
// Velden met "verify:true" in _verify zijn niet 100% zeker uit de 2024 PHB
// (geheugen) — zie de review-lijst in de chat. Damage-type staat in damageType
// (niet 'type', dat is de top-level categorie).
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

// Starter equipment-packs (2024 PHB). Klappen uit naar losse itemDB-items.
// counts × outer-count bij expansie. Cost/sommige counts staan op verify
// (zie review-lijst). ref = itemDB-naam (genormaliseerd gematcht door de widget).
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
    "Blade Ward": { level: 0, time: "1 reaction", range: "Self", comp: "V, S", dur: "Instant", desc: "2024: Reaction when an attacker within 5ft attacks you. The attacker has Disadvantage on that attack roll. No concentration." },
    "Booming Blade": { level: 0, time: "1 action", range: "Self (5ft)", comp: "S, M (a weapon)", dur: "1 round", desc: "Melee weapon attack. Bij hit: als target beweegt, 1d8 thunder damage. Schaalt." },
    "Chill Touch": { level: 0, time: "1 action", range: "120ft", comp: "V, S", dur: "1 round", desc: "A ghostly skeletal hand touches a creature. 1d8 necrotic damage, and the target can't regain HP until your next turn. Undead get disadvantage on attacks." },
    "Dancing Lights": { level: 0, time: "1 action", range: "120ft", comp: "V, S, M (a bit of phosphorus or wychwood, or a glowworm)", dur: "Concentration, 1 min", desc: "Create up to 4 torch-like lights within 120ft. Move them as a Bonus Action. Concentration, 1 minute." },
    "Druidcraft": { level: 0, time: "1 action", range: "30ft", comp: "V, S", dur: "Instant", desc: "Klein natuurlijk trucje: weer voorspellen, bloem laten bloeien, sensorisch effect, of vlammetje aan/uit." },
    "Eldritch Blast": { level: 0, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 1d10 force damage. At level 5: 2 beams, 11: 3, 17: 4. Each beam attacks separately." },
    "Elementalism": { level: 0, time: "1 action", range: "30ft", comp: "V, S", dur: "Instant", desc: "Manipulate a small elemental effect: a breeze, a candle-sized flame, a stream of water, or a handful of earth. Pure utility cantrip." },
    "Fire Bolt": { level: 0, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 1d10 fire damage, 120ft. Scales at levels 5/11/17." },
    "Friends": { level: 0, time: "1 action", range: "10ft", comp: "S, M (a bit of makeup)", dur: "Concentration, 1 min", desc: "Concentration, 1 minute. Advantage on CHA checks against one non-hostile creature. When the spell ends, the target knows you used magic." },
    "Guidance": { level: 0, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 min", desc: "The target can add 1d4 to one ability check. Concentration." },
    "Light": { level: 0, time: "1 action", range: "Touch", comp: "V, M (a firefly or piece of phosphorus)", dur: "1 hour", desc: "An object sheds bright light in a 20ft radius and dim light for another 20ft. Lasts 1 hour." },
    "Mage Hand": { level: 0, time: "1 action", range: "30ft", comp: "V, S", dur: "1 min", desc: "Create a spectral hand at 30ft that can manipulate objects, open doors, etc. Lasts 1 minute." },
    "Mending": { level: 0, time: "1 minute", range: "Touch", comp: "V, S, M (twee lodestones)", dur: "Instant", desc: "Repair a single break or tear in an object (a broken chain, a torn piece of cloth, etc.)." },
    "Message": { level: 0, time: "1 action", range: "120ft", comp: "V, S, M (a piece of copper wire)", dur: "1 round", desc: "Whisper a message to a creature within 120ft. Only the target hears it and can whisper a reply." },
    "Mind Sliver": { level: 0, time: "1 action", range: "60ft", comp: "V", dur: "1 round", desc: "INT save of 1d6 psychic damage en -1d4 van de volgende saving throw voor einde volgende beurt. 60ft. Schaalt." },
    "Minor Illusion": { level: 0, time: "1 action", range: "30ft", comp: "S, M (a bit of fleece)", dur: "1 min", desc: "Create a sound or the image of an object within 30ft. Lasts 1 minute. Investigation check to recognise it as an illusion." },
    "Poison Spray": { level: 0, time: "1 action", range: "10ft", comp: "V, S", dur: "Instant", desc: "A puff of toxic mist at a creature within 10ft. CON save or 1d12 poison damage. Scales at levels 5/11/17." },
    "Prestidigitation": { level: 0, time: "1 action", range: "10ft", comp: "V, S", dur: "Up to 1 hour", desc: "Minor magical trick: sparks, sounds, changing flavors, a small illusion, light, cleaning, etc. Lasts up to 1 hour." },
    "Produce Flame": { level: 0, time: "1 action", range: "Self", comp: "V, S", dur: "10 min", desc: "Flame in your hand, shedding light in 10ft. Throw it as a ranged spell attack for 1d8 fire damage. Scales." },
    "Ray of Frost": { level: 0, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 1d8 cold damage, -10ft speed tot begin volgende beurt. 60ft range. Schaalt." },
    "Resistance": { level: 0, time: "1 action", range: "Touch", comp: "V, S, M (miniature mantel)", dur: "Concentration, 1 min", desc: "The target can add 1d4 to one saving throw. Concentration." },
    "Sacred Flame": { level: 0, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "DEX save of 1d8 radiant damage. Negeert cover. Schaalt." },
    "Shillelagh": { level: 0, time: "1 bonus action", range: "Touch", comp: "V, S, M (hulst of eikentakje)", dur: "1 min", desc: "Bonus Action. A wooden club or quarterstaff uses WIS for attacks and its damage becomes 1d8." },
    "Shocking Grasp": { level: 0, time: "1 action", range: "Touch", comp: "V, S", dur: "Instant", desc: "Melee spell attack with advantage against metal armor. 1d8 lightning damage, and the target can't take reactions. Scales." },
    "Sorcerous Burst": { level: 0, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack: 1d8 damage of a random type (roll a d8 for the element). On doubles: add an extra 1d8 (can chain). Scales at levels 5/11/17." },
    "Spare the Dying": { level: 0, time: "1 action", range: "Touch", comp: "V, S", dur: "Instant", desc: "Stabilise a creature at 0 HP." },
    "Thaumaturgy": { level: 0, time: "1 action", range: "30ft", comp: "V", dur: "Up to 1 minute", desc: "Kleine goddelijke effecten: stem versterken, vlammen flikkeren, deuren opengooien, etc." },
    "Thorn Whip": { level: 0, time: "1 action", range: "30ft", comp: "V, S, M (doornenstengel)", dur: "Instant", desc: "Melee spell attack, 1d6 piercing. Pull the target 10ft toward you if it's Large or smaller. Scales." },
    "Toll the Dead": { level: 0, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "WIS save of 1d8 necrotic damage (1d12 als target HP mist). Schaalt." },
    "True Strike": { level: 0, time: "1 action", range: "Self", comp: "V, M (a weapon with the Finesse or Ranged property worth 1sp+)", dur: "Instant", desc: "2024: Make one attack with the weapon using your spellcasting ability instead of STR/DEX for attack and damage. On a hit: +1d6 extra radiant damage (2d6 at lvl 5, 3d6 at 11, 4d6 at 17). Works with melee or ranged weapon attacks." },
    "Vicious Mockery": { level: 0, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "WIS save of 1d4 psychic damage en disadvantage op volgende attack roll. Schaalt." },
    "Word of Radiance": { level: 0, time: "1 action", range: "Self (5ft)", comp: "V, M", dur: "Instant", desc: "Every creature within 5ft: CON save or 1d6 radiant damage. Scales." },

    // ===== 1ST LEVEL =====
    "Absorb Elements": { level: 1, time: "1 reaction", range: "Self", comp: "S", dur: "1 round", desc: "Reaction when taking acid/cold/fire/lightning/thunder damage. Resistance against that damage; your next melee attack deals +1d6 of that type." },
    "Animal Friendship": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (voedsel)", dur: "24 hours", desc: "WIS save or a beast (INT 3 or lower) is Charmed. 24 hours. Upcast: +1 target." },
    "Arms of Hadar": { level: 1, time: "1 action", range: "Self (10ft)", comp: "V, S", dur: "Instant", desc: "STR save or 2d6 necrotic damage and no reactions. Half on a save. Upcast: +1d6." },
    "Armor of Agathys": { level: 1, time: "1 action", range: "Self", comp: "V, S, M (water)", dur: "1 hour", desc: "5 temp HP. Melee attackers take 5 cold damage while you have the temp HP. Upcast: +5 per slot level." },
    "Bane": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (bloed)", dur: "Concentration, 1 min", desc: "Tot 3 creatures: CHA save of -1d4 van attack rolls en saving throws." },
    "Bless": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (heilig water)", dur: "Concentration, 1 min", desc: "Tot 3 creatures: +1d4 op attack rolls en saving throws. Schaalt +1 target." },
    "Burning Hands": { level: 1, time: "1 action", range: "Self (15ft cone)", comp: "V, S", dur: "Instant", desc: "15ft cone of fire. DEX save, 3d6 fire damage (half on save). Upcast: +1d6 per higher slot level." },
    "Chaos Bolt": { level: 1, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 2d8+1d6 damage. Type determined by a d8 roll. On doubles: the bolt leaps to a new target!" },
    "Charm Person": { level: 1, time: "1 action", range: "30ft", comp: "V, S", dur: "1 hour", desc: "Charm a humanoid within 30ft. WIS save (advantage if you're fighting it). The target regards you as a friendly acquaintance. Lasts 1 hour." },
    "Chromatic Orb": { level: 1, time: "1 action", range: "90ft", comp: "V, S, M (a diamond worth at least 50gp)", dur: "Instant", desc: "Ranged spell attack, 3d8 damage of a chosen type (acid/cold/fire/lightning/poison/thunder). 90ft. Requires a 50gp diamond." },
    "Color Spray": { level: 1, time: "1 action", range: "Self (15ft cone)", comp: "V, S, M (a pinch of powder or sand colored red, yellow, or blue)", dur: "1 round", desc: "15ft cone. 6d10 HP aan creatures worden blind (laagste HP eerst). Geen save. Schaalt +2d10 per slot." },
    "Command": { level: 1, time: "1 action", range: "60ft", comp: "V", dur: "1 round", desc: "Eén-woord commando. WIS save of target volgt op. Schaalt +1 target." },
    "Compelled Duel": { level: 1, time: "1 bonus action", range: "30ft", comp: "V", dur: "Concentration, 1 min", desc: "WIS save or the target has disadvantage on attacks against others and must stay near you." },
    "Comprehend Languages": { level: 1, time: "1 action", range: "Self", comp: "V, S, M (a pinch of soot and salt)", dur: "1 hour", desc: "Ritual. You understand any spoken language you hear and written text you touch. Lasts 1 hour." },
    "Cure Wounds": { level: 1, time: "1 action", range: "Touch", comp: "V, S", dur: "Instant", desc: "Herstel 1d8 + spellcasting mod HP. Schaalt +1d8." },
    "Detect Evil and Good": { level: 1, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 10 min", desc: "Detect aberrations, celestials, elementals, fey, fiends, and undead within 30ft." },
    "Detect Magic": { level: 1, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 10 min", desc: "Ritual. Concentration, 10 min. Sense the presence of magic within 30ft and see the school of magic through thin barriers." },
    "Disguise Self": { level: 1, time: "1 action", range: "Self", comp: "V, S", dur: "1 hour", desc: "Change your appearance (clothing, armor, weapons, height ±1ft). Investigation check to see through the illusion. Lasts 1 hour." },
    "Divine Smite": { level: 1, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, until end of turn", desc: "2024: Cast as a Bonus Action after hitting with a melee weapon or Unarmed Strike this turn. Extra 2d8 radiant damage (+1d8 vs Undead/Fiends). Upcast: +1d8 per higher slot level. Requires concentration until the end of your turn - cannot stack with other smite spells." },
    "Ensnaring Strike": { level: 1, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Volgende hit: STR save of restrained door wijnranken. 1d6 piercing per beurt. Schaalt +1d6." },
    "Entangle": { level: 1, time: "1 action", range: "90ft", comp: "V, S", dur: "Concentration, 1 min", desc: "20ft square. STR save or Restrained by grasping vines. The area becomes difficult terrain." },
    "Expeditious Retreat": { level: 1, time: "1 bonus action", range: "Self", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Dash as a Bonus Action each turn." },
    "Faerie Fire": { level: 1, time: "1 action", range: "60ft", comp: "V", dur: "Concentration, 1 min", desc: "20ft cube. DEX save of verlicht. Attacks hebben advantage. Onzichtbaarheid opgeheven." },
    "False Life": { level: 1, time: "1 action", range: "Self", comp: "V, S, M (a small amount of alcohol or distilled spirits)", dur: "1 hour", desc: "Geef jezelf 1d4+4 temporary HP. Duurt 1 uur. Schaalt +5 temp HP per hogere slot." },
    "Feather Fall": { level: 1, time: "1 reaction", range: "60ft", comp: "V, M (a small feather or piece of down)", dur: "1 min", desc: "Reaction: up to 5 falling creatures within 60ft fall slowly (60ft/round) and take no fall damage." },
    "Find Familiar": { level: 1, time: "1 hour", range: "10ft", comp: "V, S, M (10gp houtskool en kruiden)", dur: "Instant", desc: "Summon a familiar (owl, cat, etc.). You can see through its senses and deliver spells through it." },
    "Fog Cloud": { level: 1, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 hour", desc: "20ft radius bol van mist. Heavily obscured area. Concentration, 1 uur. Schaalt +20ft radius per slot." },
    "Goodberry": { level: 1, time: "1 action", range: "Touch", comp: "V, S, M (hulst)", dur: "Instant", desc: "Create 10 berries. Each berry restores 1 HP and provides a day's worth of food. They vanish after 24 hours." },
    "Guiding Bolt": { level: 1, time: "1 action", range: "120ft", comp: "V, S", dur: "1 round", desc: "Ranged spell attack, 4d6 radiant. Volgende attack op target heeft advantage. Schaalt +1d6." },
    "Hail of Thorns": { level: 1, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Volgende ranged hit: 5ft radius. DEX save of 1d10 piercing (half bij save). Schaalt +1d10." },
    "Healing Word": { level: 1, time: "1 bonus action", range: "60ft", comp: "V", dur: "Instant", desc: "Bonus Action. Restore 1d4 + spellcasting mod HP at 60ft range. Upcast: +1d4 per slot level." },
    "Hellish Rebuke": { level: 1, time: "1 reaction", range: "60ft", comp: "V, S", dur: "Instant", desc: "Reaction bij damage. DEX save of 2d10 fire (half bij save). Schaalt +1d10." },
    "Heroism": { level: 1, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 min", desc: "The target is immune to Frightened and gains temp HP equal to your spellcasting modifier each turn." },
    "Hex": { level: 1, time: "1 bonus action", range: "90ft", comp: "V, S, M (newt-oog)", dur: "Concentration, 1 hour", desc: "Bonus Action. +1d6 necrotic damage on each of your hits. Choose an ability: the target has Disadvantage on checks with it." },
    "Hunter's Mark": { level: 1, time: "1 bonus action", range: "90ft", comp: "V", dur: "Concentration, 1 hour", desc: "2024: Bonus Action. Mark 1 creature: +1d6 extra damage on your weapon hits. Move the mark to a new target (Bonus Action) when it drops to 0 HP. Concentration (Ranger level 13: no longer breaks concentration on damage)." },
    "Ice Knife": { level: 1, time: "1 action", range: "60ft", comp: "S, M (ijs)", dur: "Instant", desc: "Ranged spell attack, 1d10 piercing. Explodeert: DEX save of 2d6 cold in 5ft. Schaalt +1d6." },
    "Identify": { level: 1, time: "1 minute", range: "Touch", comp: "V, S, M (parel van 100gp)", dur: "Instant", desc: "Ritual. Learn the properties of a magic item, or the active spells on a creature." },
    "Inflict Wounds": { level: 1, time: "1 action", range: "Touch", comp: "V, S", dur: "Instant", desc: "Melee spell attack, 3d10 necrotic damage. Schaalt +1d10 per slot." },
    "Jump": { level: 1, time: "1 action", range: "Touch", comp: "V, S, M (a grasshopper's hind leg)", dur: "1 min", desc: "Triple the jump distance of a creature you touch. Lasts 1 minute." },
    "Mage Armor": { level: 1, time: "1 action", range: "Touch", comp: "V, S, M (a piece of cured leather)", dur: "8 hours", desc: "Touch. AC becomes 13 + DEX modifier for a creature not wearing armor. Lasts 8 hours." },
    "Magic Missile": { level: 1, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Drie gloeiende pijlen raken automatisch. Elk doet 1d4+1 force damage. Schaalt +1 pijl per hogere slot." },
    "Protection from Evil and Good": { level: 1, time: "1 action", range: "Touch", comp: "V, S, M (heilig water)", dur: "Concentration, 10 min", desc: "Aberrations, celestials, elementals, fey, fiends, and undead have disadvantage on attacks against the target." },
    "Ray of Sickness": { level: 1, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 2d8 poison damage. On a hit: CON save or also Poisoned until the end of its next turn. 60ft." },
    "Sanctuary": { level: 1, time: "1 bonus action", range: "30ft", comp: "V, S, M (zilveren spiegel)", dur: "1 min", desc: "WIS save vereist om target aan te vallen. Eindigt als target aanvalt of schade doet." },
    "Shield": { level: 1, time: "1 reaction", range: "Self", comp: "V, S", dur: "1 round", desc: "Reaction: +5 AC until the start of your next turn, including against the triggering attack. Also blocks Magic Missile." },
    "Shield of Faith": { level: 1, time: "1 bonus action", range: "60ft", comp: "V, S, M (perkament)", dur: "Concentration, 10 min", desc: "The target gains +2 AC. Concentration, 10 minutes." },
    "Silent Image": { level: 1, time: "1 action", range: "60ft", comp: "V, S, M (a bit of fleece)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Create a visual illusion of up to a 15ft cube within 60ft. Move it with an action. Investigation check to discern." },
    "Silvery Barbs": { level: 1, time: "1 reaction", range: "60ft", comp: "V", dur: "Instant", desc: "Reaction: a creature rerolls a success and takes the lower result. You can then give an ally advantage on their next roll." },
    "Sleep": { level: 1, time: "1 action", range: "90ft", comp: "V, S, M (a pinch of fine sand, rose petals, or a cricket)", dur: "1 min", desc: "5d8 HP worth of creatures in a 20ft radius fall asleep (lowest HP first). No save. Upcast: +2d8 per slot." },
    "Speak with Animals": { level: 1, time: "1 action", range: "Self", comp: "V, S", dur: "10 min", desc: "Ritual. Communicate with beasts. They aren't necessarily friendly." },
    "Tasha's Hideous Laughter": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (tiny tarts and a feather)", dur: "Concentration, 1 min", desc: "WIS save or the target falls Prone and is Incapacitated with laughter. Repeat the save each turn and when it takes damage." },
    "Thunderous Smite": { level: 1, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Volgende melee hit: +2d6 thunder. STR save of 10ft weggeduwd en prone." },
    "Thunderwave": { level: 1, time: "1 action", range: "Self (15ft cube)", comp: "V, S", dur: "Instant", desc: "15ft cube from you. CON save or 2d8 thunder damage and pushed 10ft. Half damage and no push on a save. Audible up to 300ft away." },
    "Witch Bolt": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (a twig from a tree that has been struck by lightning)", dur: "Concentration, 1 min", desc: "Ranged spell attack, 1d12 lightning damage. Concentration: an action each turn deals 1d12 damage automatically. 30ft." },
    "Wrathful Smite": { level: 1, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Volgende melee hit: +1d6 psychic. WIS save of frightened." },

    // ===== 2ND LEVEL =====
    "Aid": { level: 2, time: "1 action", range: "30ft", comp: "V, S, M (wit linnen)", dur: "8 hours", desc: "Tot 3 creatures krijgen +5 max HP en huidige HP voor 8 uur. Schaalt +5 HP per hogere slot." },
    "Alter Self": { level: 2, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. Change your appearance, grow aquatic adaptations, or gain natural weapons (1d6+STR, magical)." },
    "Barkskin": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (eikenschors)", dur: "Concentration, 1 hour", desc: "The target's AC can't be lower than 16." },
    "Blindness/Deafness": { level: 2, time: "1 action", range: "30ft", comp: "V", dur: "1 min", desc: "CON save or a creature is Blinded or Deafened. Lasts 1 minute; repeat the save at the end of each turn. Upcast: +1 target per slot." },
    "Blur": { level: 2, time: "1 action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Attackers have disadvantage on attack rolls against you. Doesn't work against creatures with truesight or blindsight." },
    "Branding Smite": { level: 2, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Your next hit: +2d6 radiant damage, and the target becomes visible." },
    "Calm Emotions": { level: 2, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "20ft radius. CHA save of charmed/frightened onderdrukt, of maak hostile creature indifferent." },
    "Cloud of Daggers": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a shard of glass)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 5ft cube met draaiende dolken. 4d4 slashing damage aan creatures die erin starten. 60ft. Schaalt +2d4." },
    "Crown of Madness": { level: 2, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save or the target must make melee attacks against a creature of your choice. Repeat the save each turn." },
    "Darkness": { level: 2, time: "1 action", range: "60ft", comp: "V, M (bat fur and a drop of pitch or piece of coal)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. A 15ft radius of magical darkness. Blocks darkvision and nonmagical light. Can be cast on an object." },
    "Darkvision": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (a dried carrot or a pinch of cat fur)", dur: "8 hours", desc: "Touch, 8 hours. The target gains darkvision out to 60ft." },
    "Detect Thoughts": { level: 2, time: "1 action", range: "Self", comp: "V, S, M (a copper piece)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Lees oppervlaktegedachten. Action om dieper te graven (WIS save). Detecteer denkende creatures door barrières." },
    "Enhance Ability": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (fur or a feather from a beast)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. Choose one of 6 buffs: advantage on checks of one ability score, plus extra effects. Upcast: +1 target." },
    "Enlarge/Reduce": { level: 2, time: "1 action", range: "30ft", comp: "V, S, M (a pinch of powdered iron)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. CON save. Enlarge: +1d4 weapon damage, advantage STR checks. Reduce: -1d4 damage, disadvantage STR." },
    "Find Steed": { level: 2, time: "10 minutes", range: "30ft", comp: "V, S", dur: "Instant", desc: "Summon a spirit steed. Intelligent and obedient." },
    "Flame Blade": { level: 2, time: "1 bonus action", range: "Self", comp: "V, S, M (sumacblad)", dur: "Concentration, 10 min", desc: "Vlammend zwaard. Melee spell attack voor 3d6 fire damage. Geeft licht." },
    "Flaming Sphere": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (talg en ijzerpoeder)", dur: "Concentration, 1 min", desc: "5ft diameter vuurbol. 2d6 fire damage bij nadering. Bonus action om te verplaatsen." },
    "Gust of Wind": { level: 2, time: "1 action", range: "Self (60ft line)", comp: "V, S, M (a seed from a pod)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 60ft lijn van sterke wind. STR save of 15ft weggeduwd. Difficult terrain met de wind mee." },
    "Heat Metal": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (ijzer en vlam)", dur: "Concentration, 1 min", desc: "Metalen object gloeit op. 2d8 fire damage. Vasthoudend target: disadvantage op checks." },
    "Hold Person": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a piece of iron)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save or a humanoid is Paralyzed. Repeat the save each turn. Upcast: +1 target per higher slot." },
    "Invisibility": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (an eyelash encased in gum arabic)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. A creature you touch turns invisible. Ends when it attacks or casts a spell. Upcast: +1 target." },
    "Knock": { level: 2, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Open a locked door, chest, or padlock (magical or not). Produces a loud knock audible up to 300ft away." },
    "Lesser Restoration": { level: 2, time: "1 action", range: "Touch", comp: "V, S", dur: "Instant", desc: "End one disease or condition: Blinded, Deafened, Paralyzed, or Poisoned." },
    "Levitate": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a small leather loop or a piece of golden thread)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Een creature of object (tot 500 lbs) stijgt 20ft. Target kan zich voortbewegen door ergens af te zetten." },
    "Magic Weapon": { level: 2, time: "1 bonus action", range: "Touch", comp: "V, S", dur: "Concentration, 1 hour", desc: "The weapon becomes +1 to attack and damage. Upcast: +2/+3." },
    "Mirror Image": { level: 2, time: "1 action", range: "Self", comp: "V, S", dur: "1 min", desc: "Three illusory duplicates appear. Attacks may hit a duplicate (AC 10+DEX) instead; a duplicate vanishes when hit. Lasts 1 min." },
    "Misty Step": { level: 2, time: "1 bonus action", range: "Self", comp: "V", dur: "Instant", desc: "Bonus Action: teleport up to 30ft to a spot you can see." },
    "Moonbeam": { level: 2, time: "1 action", range: "120ft", comp: "V, S, M (maansteen)", dur: "Concentration, 1 min", desc: "5ft radius lichtcilinder. CON save of 2d10 radiant. Shapechangers hebben disadvantage. Schaalt." },
    "Pass Without Trace": { level: 2, time: "1 action", range: "Self", comp: "V, S, M (as van hulst)", dur: "Concentration, 1 hour", desc: "You and allies within 30ft gain +10 to Stealth checks and can't be tracked." },
    "Phantasmal Force": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a bit of fleece)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. INT save or the target perceives an illusion that can deal 1d6 psychic damage per turn. Investigation check to discern." },
    "Prayer of Healing": { level: 2, time: "10 minutes", range: "30ft", comp: "V", dur: "Instant", desc: "Up to 6 creatures: restore 2d8 + modifier HP. Casting time 10 min. Upcast: +1d8." },
    "Protection from Poison": { level: 2, time: "1 action", range: "Touch", comp: "V, S", dur: "1 hour", desc: "Neutralise poison. Advantage on poison saves and resistance to poison damage." },
    "Scorching Ray": { level: 2, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Drie stralen van vuur. Ranged spell attack per straal, 2d6 fire damage elk. Schaalt +1 straal per hogere slot." },
    "See Invisibility": { level: 2, time: "1 action", range: "Self", comp: "V, S, M (a pinch of talc and powdered silver)", dur: "1 hour", desc: "You see invisible creatures and objects, and you can see into the Ethereal Plane. Lasts 1 hour." },
    "Shatter": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a chip of glass or piece of mica)", dur: "Instant", desc: "10ft radius, 60ft range. CON save of 3d8 thunder damage (half bij save). Inorganic materiaal heeft disadvantage. Schaalt +1d8." },
    "Silence": { level: 2, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Ritual. 20ft radius stilte. Geen geluid, verbal spells geblokkeerd." },
    "Spider Climb": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (a drop of bitumen and a spider)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. The target can climb any surface, including ceilings, with hands free. Touch." },
    "Spike Growth": { level: 2, time: "1 action", range: "150ft", comp: "V, S, M (doornen)", dur: "Concentration, 10 min", desc: "20ft radius. Moeilijk terrein, 2d4 piercing per 5ft movement. Gecamoufleerd." },
    "Spiritual Weapon": { level: 2, time: "1 bonus action", range: "60ft", comp: "V, S", dur: "1 min", desc: "Spectral wapen. Bonus action melee spell attack: 1d8 + modifier force. Verplaats 20ft. Schaalt +1d8 per 2 slots." },
    "Suggestion": { level: 2, time: "1 action", range: "30ft", comp: "V, M (a snake's tongue and a bit of honeycomb or a drop of sweet oil)", dur: "Concentration, 8 hours", desc: "Concentration, 8 hours. WIS save or the target follows a reasonable-sounding suggestion of up to two sentences." },
    "Web": { level: 2, time: "1 action", range: "60ft", comp: "V, S, M (a bit of cobweb)", dur: "Concentration, 1 hour", desc: "Concentration, 1 uur. 20ft cube webs. DEX save of restrained. Moeilijk terrein. Brandbaar (2d4 fire per beurt)." },
    "Zone of Truth": { level: 2, time: "1 action", range: "60ft", comp: "V, S", dur: "10 min", desc: "15ft radius. CHA save or a creature can't lie. You know whether the save succeeded." },

    // ===== 3RD LEVEL =====
    "Magic Circle": { level: 3, time: "1 minute", range: "10ft", comp: "V, S, M (heilig water of gepoederd zilver/ijzer ter waarde van 100gp, verbruikt)", dur: "1 hour", desc: "A cylinder 10ft in radius, 20ft high. Choose a creature type (celestials/elementals/fey/fiends/undead): they can't willingly enter the cylinder, have disadvantage on attacks against creatures inside, and can't charm/frighten/possess them. Can be reversed to keep them in. Extend with higher slots (+1 hour per level)." },
    "Animate Dead": { level: 3, time: "1 minute", range: "10ft", comp: "V, S, M (bloed en botsplinter)", dur: "Instant", desc: "Animate a skeleton or zombie from a corpse. It obeys your commands. Recast to maintain control." },
    "Aura of Vitality": { level: 3, time: "1 action", range: "Self (30ft)", comp: "V", dur: "Concentration, 1 min", desc: "Bonus Action each turn: restore 2d6 HP to a creature within 30ft." },
    "Beacon of Hope": { level: 3, time: "1 action", range: "30ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Gekozen creatures: advantage op WIS saves en death saves, en healing spells geven max HP." },
    "Bestow Curse": { level: 3, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 min", desc: "WIS save or choose a curse: disadvantage on ability checks/attacks, wasted turns, or an extra 1d8 necrotic from you. Higher slots: longer duration." },
    "Blink": { level: 3, time: "1 action", range: "Self", comp: "V, S", dur: "1 min", desc: "Roll a d20 at the end of each of your turns: on 11+ you vanish to the Ethereal Plane until the start of your next turn. Lasts 1 minute." },
    "Blinding Smite": { level: 3, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Volgende melee hit: +3d8 radiant. CON save of blinded." },
    "Call Lightning": { level: 3, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Stormwolk. Elke beurt als action: 3d10 lightning in 5ft radius. Schaalt +1d10." },
    "Clairvoyance": { level: 3, time: "10 minutes", range: "1 mile", comp: "V, S, M (a focus worth at least 100gp)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Create an invisible sensor at a familiar location up to 1 mile away. See or hear through the sensor." },
    "Conjure Animals": { level: 3, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 hour", desc: "Roep fey beesten op. Eén CR 2, twee CR 1, vier CR 1/2, of acht CR 1/4." },
    "Conjure Barrage": { level: 3, time: "1 action", range: "Self (60ft cone)", comp: "V, S, M (munitie/wapen)", dur: "Instant", desc: "60ft cone. DEX save of 3d8 damage (wapentype). Half bij save." },
    "Counterspell": { level: 3, time: "1 reaction", range: "60ft", comp: "S", dur: "Instant", desc: "Reaction: automatically cancel a spell of 3rd level or lower. Higher spells: ability check DC 10 + spell level." },
    "Crusader's Mantle": { level: 3, time: "1 action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Allies within 30ft: +1d4 radiant damage on each melee weapon hit." },
    "Daylight": { level: 3, time: "1 action", range: "60ft", comp: "V, S", dur: "1 hour", desc: "60ft radius of bright light + 60ft of dim light from a point or object. Lasts 1 hour. Dispels magical darkness of 3rd level or lower." },
    "Dispel Magic": { level: 3, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Automatically end a magical effect of 3rd level or lower. Higher effects: ability check DC 10 + spell level." },
    "Fear": { level: 3, time: "1 action", range: "Self (30ft cone)", comp: "V, S, M (a white feather or a hen's heart)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 30ft cone. WIS save or Frightened and must Dash away from you. Repeat the save each turn (with line of sight to you)." },
    "Fireball": { level: 3, time: "1 action", range: "150ft", comp: "V, S, M (a tiny ball of bat guano and sulfur)", dur: "Instant", desc: "A 20ft radius explosion at a point within 150ft. DEX save or 8d6 fire damage (half on a save). Upcast: +1d6 per higher slot." },
    "Fly": { level: 3, time: "1 action", range: "Touch", comp: "V, S, M (a wing feather from any bird)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. The target gains a 60ft flying speed. When it ends: the target falls if still aloft. Upcast: +1 target." },
    "Gaseous Form": { level: 3, time: "1 action", range: "Touch", comp: "V, S, M (a bit of gauze and a wisp of smoke)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. The target becomes a misty cloud. Flying speed 10ft, resistance to nonmagical damage, and it can pass through small openings." },
    "Haste": { level: 3, time: "1 action", range: "30ft", comp: "V, S, M (a shaving of licorice root)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. The target gains +2 AC, doubled speed, advantage on DEX saves, and one extra action per turn. When it ends: the target can't move or take actions for one turn." },
    "Hunger of Hadar": { level: 3, time: "1 action", range: "150ft", comp: "V, S, M (octopustentakel)", dur: "Concentration, 1 min", desc: "20ft radius leegte. 2d6 cold begin beurt, 2d6 acid einde. Blind, moeilijk terrein." },
    "Hypnotic Pattern": { level: 3, time: "1 action", range: "120ft", comp: "S, M (a glowing stick of incense or a crystal vial of phosphorescent material)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 30ft cube, 120ft range. WIS save or Charmed and Incapacitated. Ends if the target takes damage or is shaken awake." },
    "Lightning Bolt": { level: 3, time: "1 action", range: "Self (100ft line)", comp: "V, S, M (a bit of fur and a rod of amber, crystal, or glass)", dur: "Instant", desc: "100ft lijn, 5ft breed. DEX save of 8d6 lightning damage (half bij save). Steekt brandbaar materiaal aan. Schaalt +1d6." },
    "Major Image": { level: 3, time: "1 action", range: "120ft", comp: "V, S, M (a bit of fleece)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Create an illusion of up to a 20ft cube with sound, smell, and temperature. 120ft. Investigation check to discern." },
    "Mass Healing Word": { level: 3, time: "1 bonus action", range: "60ft", comp: "V", dur: "Instant", desc: "Up to 6 creatures: restore 1d4 + modifier HP. Bonus Action. Upcast: +1d4." },
    "Plant Growth": { level: 3, time: "1 action / 8 hours", range: "150ft", comp: "V, S", dur: "Instant", desc: "100ft radius dichte plantengroei (4ft per 1ft movement). Of 8 uur ritual voor vruchtbare grond." },
    "Protection from Energy": { level: 3, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. Touch. The target gains resistance to a chosen damage type (acid/cold/fire/lightning/thunder)." },
    "Revivify": { level: 3, time: "1 action", range: "Touch", comp: "V, S, M (diamanten van 300gp)", dur: "Instant", desc: "Breng creature terug dat max 1 minuut dood is. Komt terug met 1 HP." },
    "Sending": { level: 3, time: "1 action", range: "Onbeperkt", comp: "V, S, M (koperdraad)", dur: "1 round", desc: "Send a message of up to 25 words to a creature you know. It can reply immediately." },
    "Sleet Storm": { level: 3, time: "1 action", range: "150ft", comp: "V, S, M (a pinch of dust and a few drops of water)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 40ft radius, 150ft range. Difficult terrain, heavily obscured. CON save of prone. Concentration check DC 12." },
    "Slow": { level: 3, time: "1 action", range: "120ft", comp: "V, S, M (a drop of molasses)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Up to 6 creatures. WIS save or -2 AC, -2 DEX saves, no reactions, halved speed, max 1 attack, and a 50% chance spells fail." },
    "Speak with Dead": { level: 3, time: "1 action", range: "10ft", comp: "V, S, M (brandende wierook)", dur: "10 min", desc: "Ask a corpse up to 5 questions. It answers briefly and can lie." },
    "Spirit Guardians": { level: 3, time: "1 action", range: "Self (15ft)", comp: "V, S, M (heilig symbool)", dur: "Concentration, 10 min", desc: "15ft radius om jou. Vijanden: halve speed en WIS save of 3d8 radiant/necrotic. Schaalt +1d8." },
    "Spirit Shroud": { level: 3, time: "1 bonus action", range: "Self", comp: "V, S", dur: "Concentration, 1 min", desc: "Attacks within 10ft: +1d8 extra damage, and targets can't regain HP." },
    "Stinking Cloud": { level: 3, time: "1 action", range: "90ft", comp: "V, S, M (a rotten egg or several skunk cabbage leaves)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. A 20ft radius of nauseating gas. CON save or spend your turn retching. 90ft. Spreads with the wind." },
    "Summon Fey": { level: 3, time: "1 action", range: "90ft", comp: "V, S, M (gilded flower van 300gp)", dur: "Concentration, 1 hour", desc: "Summon a fey spirit that follows your commands. Stronger at higher slot levels." },
    "Thunder Step": { level: 3, time: "1 action", range: "90ft", comp: "V", dur: "Instant", desc: "Teleporteer tot 90ft. Creatures bij vertrekpunt: CON save of 3d10 thunder. Neem 1 ally mee." },
    "Tongues": { level: 3, time: "1 action", range: "Touch", comp: "V, M (a small clay ziggurat)", dur: "1 hour", desc: "Touch, 1 hour. The target understands any spoken language and is understood by creatures that know a language." },
    "Water Breathing": { level: 3, time: "1 action", range: "30ft", comp: "V, S, M (a short reed or piece of straw)", dur: "24 hours", desc: "Ritual. Tot 10 creatures kunnen ademen onder water. Duurt 24 uur." },
    "Water Walk": { level: 3, time: "1 action", range: "30ft", comp: "V, S, M (a piece of cork)", dur: "1 hour", desc: "Ritual. Tot 10 creatures kunnen lopen over vloeistofoppervlakken. Duurt 1 uur." },
    "Wind Wall": { level: 3, time: "1 action", range: "120ft", comp: "V, S, M (waaier en veer)", dur: "Concentration, 1 min", desc: "50ft lang, 15ft hoog. 3d8 bludgeoning. Blokkeert projectielen en gas." },

    // ===== 4TH LEVEL =====
    "Arcane Eye": { level: 4, time: "1 action", range: "30ft", comp: "V, S, M (vleermuisvacht)", dur: "Concentration, 1 hour", desc: "An invisible magical eye you can steer and see through." },
    "Aura of Life": { level: 4, time: "1 action", range: "Self (30ft)", comp: "V", dur: "Concentration, 10 min", desc: "Allies: resistance necrotic, herstellen 1 HP als ze met 0 beginnen." },
    "Banishment": { level: 4, time: "1 action", range: "60ft", comp: "V, S, M (an item distasteful to the target)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. CHA save or the target vanishes to a harmless demiplane (or its home plane if it's extraplanar). Upcast: +1 target." },
    "Blight": { level: 4, time: "1 action", range: "30ft", comp: "V, S", dur: "Instant", desc: "CON save of 8d8 necrotic damage (half bij save). Plant creatures hebben disadvantage en nemen max damage. 30ft." },
    "Confusion": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (drie notenschalen)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 10ft radius, 90ft. WIS save or a random action each turn (a d10 determines behaviour). Repeat the save each turn." },
    "Conjure Woodland Beings": { level: 4, time: "1 action", range: "60ft", comp: "V, S, M (hulstbes)", dur: "Concentration, 1 hour", desc: "Roep fey creatures op. Eén CR 2, twee CR 1, vier CR 1/2 of acht CR 1/4." },
    "Death Ward": { level: 4, time: "1 action", range: "Touch", comp: "V, S", dur: "8 hours", desc: "The first time the target would drop to 0 HP, it drops to 1 HP instead. Once. 8 hours." },
    "Dimension Door": { level: 4, time: "1 action", range: "500ft", comp: "V", dur: "Instant", desc: "Teleport yourself (and optionally 1 willing creature) up to 500ft to a spot you can describe or visualise." },
    "Dominate Beast": { level: 4, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save or a beast follows your telepathic commands. Repeat the save on damage. Higher slots = longer duration." },
    "Find Greater Steed": { level: 4, time: "10 minutes", range: "30ft", comp: "V, S", dur: "Instant", desc: "Roep krachtige geest op: griffon, pegasus, dire wolf, etc." },
    "Freedom of Movement": { level: 4, time: "1 action", range: "Touch", comp: "V, S, M (leren band)", dur: "1 hour", desc: "The target is unaffected by difficult terrain and magical restraints. 1 hour." },
    "Giant Insect": { level: 4, time: "1 action", range: "30ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Transformeer insecten in giant versies. Tot 10 duizendpoten, 5 wespen, 3 spinnen of 1 schorpioen." },
    "Greater Invisibility": { level: 4, time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. The target turns invisible. Does NOT end when it attacks or casts a spell!" },
    "Guardian of Faith": { level: 4, time: "1 action", range: "30ft", comp: "V", dur: "8 hours", desc: "A spectral guardian. Hostile creatures within 10ft: DEX save or 20 radiant damage. Vanishes after dealing 60 damage." },
    "Guardian of Nature": { level: 4, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Primal Beast (speed+10, advantage melee, +1d6 force) of Great Tree (10 temp HP, advantage ranged)." },
    "Ice Storm": { level: 4, time: "1 action", range: "300ft", comp: "V, S, M (a pinch of dust and a few drops of water)", dur: "Instant", desc: "20ft radius, 300ft range. DEX save or 2d8 bludgeoning + 4d6 cold (half on a save). The area becomes difficult terrain. Scales." },
    "Polymorph": { level: 4, time: "1 action", range: "60ft", comp: "V, S, M (a caterpillar cocoon)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. WIS save. Transform a creature into a beast with CR ≤ the target's level. New HP; it reverts at 0 HP." },
    "Shadow of Moil": { level: 4, time: "1 action", range: "Self", comp: "V, S, M (edelsteen van 150gp)", dur: "Concentration, 1 min", desc: "Heavily obscured, resistance radiant. 2d8 necrotic bij melee hit op jou." },
    "Sickening Radiance": { level: 4, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 10 min", desc: "30ft radius. CON save of 4d10 radiant en 1 level exhaustion." },
    "Staggering Smite": { level: 4, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Your next melee hit: +4d6 psychic damage. WIS save or disadvantage on attacks and no reactions." },
    "Stoneskin": { level: 4, time: "1 action", range: "Touch", comp: "V, S, M (diamond dust worth 100gp, which the spell consumes)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. Touch, 100gp diamond. Resistance to nonmagical bludgeoning, piercing, and slashing damage." },
    "Summon Aberration": { level: 4, time: "1 action", range: "90ft", comp: "V, S, M (tentacle van 200gp)", dur: "Concentration, 1 hour", desc: "Roep aberration op. Sterker op hogere slots." },
    "Wall of Fire": { level: 4, time: "1 action", range: "120ft", comp: "V, S, M (a bit of phosphorus)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 60ft lang of 20ft diameter ring, 20ft hoog. 5d8 fire damage bij binnentreden of starten. Eén zijde doet damage." },

    // ===== 5TH LEVEL =====
    "Animate Objects": { level: 5, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Animate up to 10 small objects. They have AC, HP, and attack on your Bonus Action. Upcast: +2 objects." },
    "Banishing Smite": { level: 5, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Volgende hit: +5d10 force. Bij 50 HP of minder na hit: gebanished." },
    "Cloudkill": { level: 5, time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. 20ft radius giftige mist. CON save of 5d8 poison (half bij save). Beweegt 10ft per beurt met de wind." },
    "Commune": { level: 5, time: "1 minute", range: "Self", comp: "V, S, M (wierook)", dur: "1 min", desc: "Ritual. Ask your deity 3 yes/no questions. The answers are correct, but may be cryptic." },
    "Cone of Cold": { level: 5, time: "1 action", range: "Self (60ft cone)", comp: "V, S, M (a small crystal or glass cone)", dur: "Instant", desc: "60ft cone. CON save of 8d8 cold damage (half bij save). Gedode creatures worden bevroren. Schaalt +1d8." },
    "Conjure Elemental": { level: 5, time: "1 minute", range: "90ft", comp: "V, S, M (elementaal materiaal)", dur: "Concentration, 1 hour", desc: "Roep elemental van CR 5 of lager op. Verliest controle bij concentratieverlies." },
    "Conjure Volley": { level: 5, time: "1 action", range: "150ft", comp: "V, S, M (munitie/wapen)", dur: "Instant", desc: "40ft radius. DEX save of 8d8 damage (wapentype). Half bij save." },
    "Contagion": { level: 5, time: "1 action", range: "Touch", comp: "V, S", dur: "7 days", desc: "Melee spell attack. The target contracts a disease of your choice (blinding sickness, filth fever, etc.). After 3 failed CON saves the effect lasts 7 days." },
    "Creation": { level: 5, time: "1 minute", range: "30ft", comp: "V, S, M (a tiny piece of matter of the same type as the item you plan to create)", dur: "Special", desc: "Create a nonliving object of vegetable or mineral matter, up to a 5ft cube. Duration depends on the material." },
    "Destructive Wave": { level: 5, time: "1 action", range: "Self (30ft)", comp: "V", dur: "Instant", desc: "CON save of 5d6 thunder + 5d6 radiant/necrotic en prone. Half bij save." },
    "Dominate Person": { level: 5, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save or a humanoid follows your telepathic commands. Repeat the save on damage. Higher slots = longer duration." },
    "Enervation": { level: 5, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "DEX save or 4d8 necrotic damage. An action each turn: 4d8 automatically. You heal half the damage dealt." },
    "Far Step": { level: 5, time: "1 bonus action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Bonus Action each turn: teleport up to 60ft." },
    "Greater Restoration": { level: 5, time: "1 action", range: "Touch", comp: "V, S, M (diamantstof van 100gp)", dur: "Instant", desc: "Beëindig charm/petrification/curse, ability score reductie, of HP max reductie." },
    "Hold Monster": { level: 5, time: "1 action", range: "90ft", comp: "V, S, M (a piece of iron)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save or Paralyzed. Works on any creature type. Repeat the save each turn. Upcast: +1 target." },
    "Holy Weapon": { level: 5, time: "1 bonus action", range: "Touch", comp: "V, S", dur: "Concentration, 1 hour", desc: "Wapen doet +2d8 radiant per hit. Bonus action ontploffing: 4d8 radiant in 30ft." },
    "Insect Plague": { level: 5, time: "1 action", range: "300ft", comp: "V, S, M (a few grains of sugar, some kernels of grain, and a smear of fat)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. 20ft radius zwerm, 300ft. CON save of 4d10 piercing (half bij save). Difficult terrain. Schaalt +1d10." },
    "Mass Cure Wounds": { level: 5, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Tot 6 creatures herstellen 3d8 + spellcasting mod HP. Schaalt +1d8." },
    "Raise Dead": { level: 5, time: "1 hour", range: "Touch", comp: "V, S, M (diamant van 500gp)", dur: "Instant", desc: "Breng creature terug dat max 10 dagen dood is. -4 penalty, vermindert per long rest." },
    "Scrying": { level: 5, time: "10 minutes", range: "Self", comp: "V, S, M (focus van 1000gp)", dur: "Concentration, 10 min", desc: "Observe a creature on any plane. WIS save, modified by how well you know it." },
    "Seeming": { level: 5, time: "1 action", range: "30ft", comp: "V, S", dur: "8 hours", desc: "Change the appearance of any number of creatures within 30ft. Lasts 8 hours. CHA save for unwilling targets. Investigation check to discern." },
    "Steel Wind Strike": { level: 5, time: "1 action", range: "30ft", comp: "S, M (wapen)", dur: "Instant", desc: "Melee spell attacks against up to 5 creatures. 6d10 force per hit. Teleport next to each target you strike." },
    "Swift Quiver": { level: 5, time: "1 bonus action", range: "Touch", comp: "V, S, M (koker met munitie)", dur: "Concentration, 1 min", desc: "Eindeloze munitie. Bonus action: twee extra ranged weapon attacks per beurt." },
    "Synaptic Static": { level: 5, time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "20ft radius, 120ft. INT save of 8d6 psychic damage (half bij save). Gefaalde targets: -1d6 van attack rolls, checks en concentration saves, 1 min." },
    "Telekinesis": { level: 5, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Move a creature or object of up to 1000 lbs. Creatures: contested ability check. 60ft range." },
    "Teleportation Circle": { level: 5, time: "1 minute", range: "10ft", comp: "V, M (rare chalks and inks infused with gems worth 50gp, which the spell consumes)", dur: "1 round", desc: "Draw a circle that teleports you to a permanent sigil sequence you know. 10ft radius. Lasts 1 round." },
    "Wall of Force": { level: 5, time: "1 action", range: "120ft", comp: "V, S, M (edelsteenpoeder)", dur: "Concentration, 10 min", desc: "Onzichtbare muur van kracht. Niets kan erdoorheen. Geen Disintegrate." },
    "Wall of Light": { level: 5, time: "1 action", range: "120ft", comp: "V, S, M (handspiegel)", dur: "Concentration, 10 min", desc: "60ft lang, 10ft hoog. 4d8 radiant bij binnentreden. Action: ranged attack 4d8." },
    "Wall of Stone": { level: 5, time: "1 action", range: "120ft", comp: "V, S, M (a small block of granite)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. 10 panelen van 10x10ft steen, 6 inches dik. Elk paneel AC 15, 30 HP. Kan permanent worden." },

    // ===== 6TH LEVEL =====
    "Arcane Gate": { level: 6, time: "1 action", range: "500ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Two linked portals within 500ft. Creatures can step through in either direction." },
    "Blade Barrier": { level: 6, time: "1 action", range: "90ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Een muur van draaiende zwaarden (100ft lang, 20ft hoog of cirkel). DEX save of 6d10 slashing damage voor elk creature dat erdoorheen gaat." },
    "Chain Lightning": { level: 6, time: "1 action", range: "150ft", comp: "V, S, M (a bit of fur; a piece of amber, glass, or a crystal rod; and three silver pins)", dur: "Instant", desc: "A bolt strikes one target and leaps to 3 more targets within 30ft. DEX save or 10d8 lightning (half on a save). Scales." },
    "Circle of Death": { level: 6, time: "1 action", range: "150ft", comp: "V, S, M (the powder of a crushed black pearl worth at least 500gp)", dur: "Instant", desc: "60ft radius, 150ft range. CON save of 8d6 necrotic damage (half bij save). 500gp materiaal component." },
    "Conjure Fey": { level: 6, time: "1 minute", range: "90ft", comp: "V, S", dur: "Concentration, 1 hour", desc: "Summon a fey creature of CR 6 or lower. It obeys your commands. Concentration is required to keep control." },
    "Contingency": { level: 6, time: "10 minutes", range: "Self", comp: "V, S, M (ivoren statuette van jezelf ter waarde van 1500gp)", dur: "10 days", desc: "Set a trigger for a spell of 5th level or lower, which then goes off automatically. You can have only one contingency active at a time." },
    "Create Undead": { level: 6, time: "1 minute", range: "10ft", comp: "V, S, M (kruiden en oliën ter waarde van 150gp)", dur: "Instant", desc: "Animeer tot 3 lijken als ghouls (of machtigere undead op hogere slots). Je hebt controle over hen gedurende 24 uur." },
    "Disintegrate": { level: 6, time: "1 action", range: "60ft", comp: "V, S, M (a lodestone and a pinch of dust)", dur: "Instant", desc: "DEX save. 10d6+40 force damage. At 0 HP the target is reduced entirely to dust. 60ft." },
    "Eyebite": { level: 6, time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Each turn, as an action: put to sleep, panic, or sicken a creature you eye. WIS save." },
    "Find the Path": { level: 6, time: "1 minute", range: "Self", comp: "V, S, M (a set of divinatory tools worth 100gp)", dur: "Concentration, 1 day", desc: "Know the shortest route to a familiar location on the same plane. Gives direction while the spell lasts." },
    "Flesh to Stone": { level: 6, time: "1 action", range: "60ft", comp: "V, S, M (a sprinkling of holy water, rare incense, and ruby dust)", dur: "Concentration, 1 min", desc: "CON save of target begint te verstenen. Drie gefaalde saves = permanent petrified. Concentration, 1 min." },
    "Forbiddance": { level: 6, time: "10 minutes", range: "Touch", comp: "V, S, M (wierook en robijnstof ter waarde van 1000gp)", dur: "1 day", desc: "Ward an area of up to 40,000 square feet against teleportation and planar travel. Celestials, fiends, or undead take 5d10 damage on entering." },
    "Globe of Invulnerability": { level: 6, time: "1 action", range: "Self (10ft radius)", comp: "V, S, M (a glass or crystal bead that shatters when the spell ends)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. A 10ft radius sphere. Spells of 5th level or lower can't penetrate it. Scales." },
    "Guards and Wards": { level: 6, time: "10 minutes", range: "Touch", comp: "V, S, M (brandende wierook, stukje zwavel, inkt en 10gp)", dur: "24 hours", desc: "Ward a building of 2500 square feet with several magical effects: confusion, alarms, fog, magical doors and stairs." },
    "Harm": { level: 6, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "CON save or the target takes 14d6 necrotic damage and its max HP is reduced by the same amount. Half damage on a save." },
    "Heal": { level: 6, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Restore 70 HP to a creature. Also ends blindness, deafness, and all diseases. Upcast: +10 HP per higher slot." },
    "Heroes' Feast": { level: 6, time: "10 minutes", range: "30ft", comp: "V, S, M (a bowl worth 1000gp)", dur: "Instant", desc: "Up to 12 creatures share a divine feast. They become immune to poison and being Frightened, gain advantage on WIS saves, and their max HP rises by 2d10 for 24 hours." },
    "Magic Jar": { level: 6, time: "1 minute", range: "Self", comp: "V, S, M (a gem worth 500gp)", dur: "Until broken", desc: "Leave your body and store your soul in a gem. Attempt to possess a humanoid's body (CHA save). You can leave and return to your own body." },
    "Mass Suggestion": { level: 6, time: "1 action", range: "60ft", comp: "V, M (a snake's tongue and a bit of honeycomb or a drop of sweet oil)", dur: "24 hours", desc: "Suggest an activity to up to 12 creatures. WIS save. No concentration; lasts 24 hours." },
    "Move Earth": { level: 6, time: "1 action", range: "120ft", comp: "V, S, M (an iron blade and a small bag of soil, clay, and sand)", dur: "Concentration, 2 hours", desc: "Concentration, 2 hours. Move earth in a 40ft square. 120ft range. Reshape terrain over time." },
    "Otto's Irresistible Dance": { level: 6, time: "1 action", range: "30ft", comp: "V", dur: "Concentration, 1 min", desc: "WIS save or the target starts a compulsive dance. It has disadvantage on attack rolls and DEX saves, and attackers have advantage. Repeat the save each turn." },
    "Planar Ally": { level: 6, time: "10 minutes", range: "60ft", comp: "V, S", dur: "Instant", desc: "Call a celestial, elemental, or fiend. It performs one task for you in exchange for a reward of its choosing." },
    "Programmed Illusion": { level: 6, time: "1 action", range: "120ft", comp: "V, S, M (fleece en jadestof ter waarde van 25gp)", dur: "Totdat getriggerd", desc: "Create an illusion that activates on a chosen trigger. Runs for 5 minutes and can be triggered multiple times." },
    "Sunbeam": { level: 6, time: "1 action", range: "Self (60ft line)", comp: "V, S, M (a magnifying glass, a piece of sunstone, and a fire-plant seed)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. A 60ft line of light. CON save or 6d8 radiant damage and Blinded. Dispels darkness. Repeat with an action each turn." },
    "True Seeing": { level: 6, time: "1 action", range: "Touch", comp: "V, S, M (an ointment for the eyes worth 25gp, made of mushroom powder, saffron, and fat, which the spell consumes)", dur: "1 hour", desc: "Touch, 1 hour. The target sees in darkness, sees invisible creatures, discerns illusions, and sees into the Ethereal Plane. 120ft truesight." },
    "Wall of Thorns": { level: 6, time: "1 action", range: "120ft", comp: "V, S, M (a handful of thorns)", dur: "Concentration, 10 min", desc: "Create a hedge of thorns 60ft long, 10ft wide, and 5ft high. DEX save or 7d8 piercing damage. Difficult terrain." },
    "Wind Walk": { level: 6, time: "1 minute", range: "30ft", comp: "V, S, M (vuur en heilig water)", dur: "8 hours", desc: "You and up to 10 creatures become wind-borne mist with a fly speed of 300ft. Return to normal form as a Bonus Action (1-minute transformation)." },
    "Word of Recall": { level: 6, time: "1 action", range: "5ft", comp: "V", dur: "Instant", desc: "You and up to 5 willing creatures instantly teleport to a hallowed location you previously designated." },

    // ===== 7TH LEVEL =====
    "Conjure Celestial": { level: 7, time: "1 minute", range: "90ft", comp: "V, S", dur: "Concentration, 1 hour", desc: "Summon a celestial of CR 4 or lower. It obeys your commands and returns to its plane when the spell ends." },
    "Delayed Blast Fireball": { level: 7, time: "1 action", range: "150ft", comp: "V, S, M (a tiny ball of bat guano and sulfur)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. A glowing bead at a point. Explodes when your concentration ends: 12d6 fire +1d6 per extra round waited. 150ft." },
    "Divine Word": { level: 7, time: "1 bonus action", range: "30ft", comp: "V", dur: "Instant", desc: "Speak a divine word. Creatures with low HP die; others are Blinded, Deafened, or Stunned. Extraplanar creatures that fail are sent back to their plane." },
    "Dream of the Blue Veil": { level: 7, time: "10 minutes", range: "20ft", comp: "V, S, M (a drop of molasses)", dur: "6 hours", desc: "You and up to 8 willing creatures fall asleep and journey to another plane of existence, awakening there after 6 hours." },
    "Etherealness": { level: 7, time: "1 action", range: "Self", comp: "V, S", dur: "8 hours", desc: "Step into the Ethereal Plane. You can see the Material Plane (60ft, in shades of gray). Lasts 8 hours. Upcast: +3 targets per slot." },
    "Finger of Death": { level: 7, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "CON save or 7d8+30 necrotic damage (half on a save). Humanoids killed by this spell rise as zombies under your control." },
    "Fire Storm": { level: 7, time: "1 action", range: "150ft", comp: "V, S", dur: "Instant", desc: "Up to 10 cubes of 10ft in an area within 150ft. DEX save or 7d10 fire damage (half on a save). You choose whether it ignites plants." },
    "Forcecage": { level: 7, time: "1 action", range: "100ft", comp: "V, S, M (robijnstof ter waarde van 1500gp)", dur: "1 hour", desc: "A prison of force: a cage of bars (20ft cube) or a solid box (10ft cube). No teleportation out. No save, no concentration." },
    "Magnificent Mansion": { level: 7, time: "1 minute", range: "300ft", comp: "V, S, M (a miniature ivory door and pieces of polished wood)", dur: "24 hours", desc: "Create an extradimensional palace. Up to 100 creatures fit inside, with invisible servants and ample food and drink." },
    "Mirage Arcane": { level: 7, time: "10 minutes", range: "Sight", comp: "V, S", dur: "10 days", desc: "Transform the appearance of a 1-square-mile area. The terrain looks different and is genuinely as hard to traverse as the illusory terrain would be." },
    "Plane Shift": { level: 7, time: "1 action", range: "Touch", comp: "V, S, M (a forked metal rod worth at least 250gp, attuned to the destination plane)", dur: "Instant", desc: "Touch. Teleport yourself and up to 8 willing creatures to another plane. Or make a ranged attack and force a CHA save to banish a target." },
    "Prismatic Spray": { level: 7, time: "1 action", range: "Self (60ft cone)", comp: "V, S", dur: "Instant", desc: "60ft cone. Each creature rolls a d8 for a random effect: fire/acid/lightning/poison/cold/petrification/banishment. DEX save." },
    "Project Image": { level: 7, time: "1 action", range: "500 miles", comp: "V, S, M (a small replica of yourself worth 5gp)", dur: "Concentration, 1 day", desc: "Create an illusory duplicate of yourself at any place you have visited. You can see and hear through the illusion and cast spells through it." },
    "Regenerate": { level: 7, time: "1 minute", range: "Touch", comp: "V, S, M (prayer beads, a piece of hallowed flesh, and a pouch of healing herbs)", dur: "1 hour", desc: "Target herstelt 4d8+15 HP en regenereert 1 HP per beurt gedurende 1 uur. Afgehakte ledematen groeien terug na 2 minuten." },
    "Resurrection": { level: 7, time: "1 hour", range: "Touch", comp: "V, S, M (a diamond worth 1000gp)", dur: "Instant", desc: "Return a creature that has been dead no longer than 100 years to life with all its HP. The caster gains 1 level of exhaustion." },
    "Reverse Gravity": { level: 7, time: "1 action", range: "100ft", comp: "V, S, M (a lodestone and iron filings)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 50ft radius, 100ft hoog. Alles valt omhoog. DEX save om iets vast te grijpen." },
    "Sequester": { level: 7, time: "1 action", range: "Touch", comp: "V, S, M (a combination of chrysoberyl, agate, and flint worth 5000gp)", dur: "Until broken", desc: "A willing creature or object becomes invisible and undetectable. A living creature enters suspended animation until a chosen trigger occurs." },
    "Simulacrum": { level: 7, time: "12 hours", range: "Touch", comp: "V, S, M (sneeuw of ijs, haar of huidschilfertje, en robijnstof ter waarde van 1500gp)", dur: "Until destroyed", desc: "Create a duplicate of a humanoid or beast. It has half the HP, can't regain spell slots, and is obedient to you." },
    "Symbol": { level: 7, time: "1 minute", range: "Touch", comp: "V, S, M (kwik, fosforus en diamant/opaal ter waarde van 1000gp)", dur: "Until triggered, max 10 min", desc: "Inscribe a magical symbol on a surface. When triggered: choose one of eight effects (death, discord, fear, hopelessness, insanity, pain, sleep, stun)." },
    "Teleport": { level: 7, time: "1 action", range: "10ft", comp: "V", dur: "Instant", desc: "Teleport yourself and up to 8 willing creatures to a known location. The chance of a mishap depends on your familiarity with it." },
    "Temple of the Gods": { level: 7, time: "1 hour", range: "120ft", comp: "V, S, M (heilig symbool ter waarde van 5gp)", dur: "24 hours", desc: "Create a holy temple. Invisible from the outside, warded against planar travel, and furnished with magical light sources and altars." },

    // ===== 8TH LEVEL =====
    "Animal Shapes": { level: 8, time: "1 action", range: "30ft", comp: "V, S", dur: "Concentration, 24 hours", desc: "Transformeer tot 8 willing creatures in beasts van CR 4 of lager. Ze behouden hun intelligentie. Duurt 24 uur, concentration." },
    "Antimagic Field": { level: 8, time: "1 action", range: "Self (10ft radius)", comp: "V, S, M (a pinch of powdered iron or a small magnet)", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. A 10ft radius around you. Magic doesn't function in the zone: spells, magic items, and curses are suppressed." },
    "Antipathy/Sympathy": { level: 8, time: "1 hour", range: "60ft", comp: "V, S, M (alum soaked in vinegar or a drop of honey)", dur: "10 days", desc: "Choose an object/location and a creature type or specific creature. Antipathy: WIS save or flee. Sympathy: WIS save or be drawn toward it." },
    "Clone": { level: 8, time: "1 hour", range: "Touch", comp: "V, S, M (flesh of the creature + diamonds worth 1000gp + a vessel worth 2000gp)", dur: "Permanent", desc: "Create an inert clone of a living creature. When the original dies, its soul migrates to the clone, which then comes to life." },
    "Control Weather": { level: 8, time: "10 minutes", range: "Self (5-mile radius)", comp: "V, S, M (brandende wierook en stukjes aarde en hout gemengd in water)", dur: "Concentration, 8 hours", desc: "Concentration, 8 hours. Change the weather in a 5-mile area. Takes 10 minutes to shift." },
    "Demiplane": { level: 8, time: "1 action", range: "60ft", comp: "S", dur: "1 hour", desc: "Create a door to an extradimensional space of a 30ft cube. The door is 5ft wide and 8ft high and vanishes after 1 hour." },
    "Dominate Monster": { level: 8, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 hour", desc: "Concentration, 1 hour. WIS save or a creature of any type follows your telepathic commands. Repeat the save on damage. Upcast: longer duration." },
    "Earthquake": { level: 8, time: "1 action", range: "500ft", comp: "V, S, M (a pinch of dirt, a piece of rock, and a lump of clay)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 100ft radius. CON save of prone. Fissures, structurele schade, instorting van gebouwen." },
    "Feeblemind": { level: 8, time: "1 action", range: "150ft", comp: "V, S, M (a handful of clay, crystal, glass, or a mineral sphere)", dur: "Instant", desc: "INT save or the target's INT and CHA become 1. It can't cast spells or use magic items and no longer understands language. New INT save every 30 days." },
    "Glibness": { level: 8, time: "1 action", range: "Self", comp: "V", dur: "1 hour", desc: "Your charm becomes irresistible: whatever you say sounds believable. Attempts to detect your lies also read as truthful." },
    "Holy Aura": { level: 8, time: "1 action", range: "Self", comp: "V, S, M (a small reliquary worth 1000gp)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Friendly creatures within 30ft: advantage on saves, and enemies have disadvantage on attacks against them. Fiends/undead that hit them are Blinded." },
    "Incendiary Cloud": { level: 8, time: "1 action", range: "150ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. A 20ft radius burning cloud. DEX save or 10d8 fire damage (half on a save) each turn. Moves 10ft per round." },
    "Maze": { level: 8, time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Banish a creature to an extradimensional maze. It can make a DC 20 INT check each turn to escape. Minotaurs escape automatically." },
    "Mind Blank": { level: 8, time: "1 action", range: "Touch", comp: "V, S", dur: "24 hours", desc: "Een creature is immuun voor psychic damage, mind reading, divination spells en de charmed condition voor 24 uur." },
    "Power Word Stun": { level: 8, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Choose a creature with 150 HP or fewer: it is Stunned. No initial save. CON save each turn to end it." },
    "Sunburst": { level: 8, time: "1 action", range: "150ft", comp: "V, S, M (fire and a piece of sunstone)", dur: "Instant", desc: "60ft radius, 150ft range. CON save of 12d6 radiant en blind 1 min. Verdrijft magische duisternis." },
    "Tsunami": { level: 8, time: "1 minute", range: "Sight", comp: "V, S", dur: "Concentration, 6 rounds", desc: "Create a wall of water 300ft long, 300ft high, and 50ft thick. It moves 50ft per round. STR save or 6d10 bludgeoning damage and be swept along." },

    // ===== 9TH LEVEL =====
    "Astral Projection": { level: 9, time: "1 hour", range: "10ft", comp: "V, S, M (for each target: a jacinth worth 1000gp and a silver bar worth 100gp)", dur: "Special", desc: "You and up to 8 willing creatures travel to the Astral Plane as astral projections, connected by silver cords." },
    "Foresight": { level: 9, time: "1 minute", range: "Touch", comp: "V, S, M (a hummingbird feather)", dur: "8 hours", desc: "8 hours. The target can't be surprised and has advantage on attack rolls, ability checks, and saving throws. Attackers have disadvantage." },
    "Gate": { level: 9, time: "1 action", range: "60ft", comp: "V, S, M (a diamond worth at least 5000gp)", dur: "Concentration, 1 min", desc: "Open a portal to another plane, or call a specific being by name. The portal works both ways. Concentration, 1 min." },
    "Imprisonment": { level: 9, time: "1 minute", range: "30ft", comp: "V, S, M (components worth 500gp per Hit Die of the target)", dur: "Until broken", desc: "WIS save or the target is imprisoned in one of five forms: burial, chaining, hedged prison, minimus containment, or slumber. No escape without the specific countermeasure." },
    "Mass Heal": { level: 9, time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Restore 700 HP, divided as you choose among creatures within 60ft. Also ends blindness, deafness, and all diseases." },
    "Mass Polymorph": { level: 9, time: "1 action", range: "120ft", comp: "V, S, M (a caterpillar cocoon)", dur: "Concentration, 1 hour", desc: "Transform up to 10 creatures you can see into beasts. WIS save. A creature reverts at 0 HP. No further upcast." },
    "Meteor Swarm": { level: 9, time: "1 action", range: "1 mile", comp: "V, S", dur: "Instant", desc: "Four 40ft radius explosions at points within 1 mile. DEX save or 20d6 fire + 20d6 bludgeoning damage (half on a save)." },
    "Power Word Heal": { level: 9, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Restore all of a creature's HP. Also ends the Charmed, Frightened, Paralyzed, and Stunned conditions. If Prone, it stands up." },
    "Power Word Kill": { level: 9, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Choose a creature with 100 HP or fewer: it dies instantly. No save." },
    "Prismatic Wall": { level: 9, time: "1 action", range: "60ft", comp: "V, S", dur: "10 min", desc: "Muur of bol van krachtig kleurenlicht. Zeven lagen elk met uniek effect. Gaat door creatures die te dichtbij staan." },
    "Psychic Scream": { level: 9, time: "1 action", range: "90ft", comp: "S", dur: "Instant", desc: "Up to 10 creatures within 90ft. INT save or 14d6 psychic damage and Stunned. On a failure with INT 2 or lower: the head explodes." },
    "Shapechange": { level: 9, time: "1 action", range: "Self", comp: "V, S, M (jadepoort ter waarde van 1500gp)", dur: "Concentration, 1 hour", desc: "Transform into any creature of CR equal to or lower than your level. You keep your INT, WIS, and CHA, and your class features." },
    "Storm of Vengeance": { level: 9, time: "1 action", range: "Sight", comp: "V, S", dur: "Concentration, 1 min", desc: "Call up a colossal storm. Each round a different effect: thunder, lightning, hailstones, acidic rain, or gusts of wind." },
    "Time Stop": { level: 9, time: "1 action", range: "Self", comp: "V", dur: "Instant", desc: "Stop time for 1d4+1 turns. Only you act. Ends if you affect or damage another creature." },
    "True Polymorph": { level: 9, time: "1 action", range: "30ft", comp: "V, S, M (a drop of mercury, a dollop of gum arabic, and a wisp of smoke)", dur: "Concentration, 1 hour", desc: "Transform a creature or object (WIS save). If you maintain concentration for the full hour, the transformation becomes permanent." },
    "True Resurrection": { level: 9, time: "1 hour", range: "Touch", comp: "V, S, M (heilige oliën ter waarde van 25000gp)", dur: "Instant", desc: "Return a creature dead no longer than 200 years to life with all its HP. Creates a new body if the original was destroyed." },
    "Wish": { level: 9, time: "1 action", range: "Self", comp: "V", dur: "Instant", desc: "The mightiest spell. Duplicate any spell of 8th level or lower, or create another effect at the DM's discretion. Risky when used creatively." },
    "Lightning Arrow": { level: 3, time: "1 bonus action", range: "Self", comp: "V, S", dur: "Concentration, 1 min", desc: "Your next ranged weapon attack: 4d8 lightning damage (half on a DEX save). Creatures within 10ft of the target take 2d8 lightning. Upcast: +1d8." },
    "Transport via Plants": { level: 6, time: "1 action", range: "10ft", comp: "V, S", dur: "1 round", desc: "Create a magical link between two plants on the same plane. You and willing creatures can step into one and emerge from the other." },

    // ===== CORE SPELLS ADDED (5.5e completeness patch) =====
    "Grease": { level: 1, time: "1 action", range: "60ft", comp: "V, S, M (a bit of pork rind or fat)", dur: "1 min", desc: "10ft vierkant: difficult terrain. Creatures in area: DEX save of prone. Nieuwe creatures die binnenlopen: DEX save." },
    "Longstrider": { level: 1, time: "1 action", range: "Touch", comp: "V, S, M (a pinch of dirt)", dur: "1 hour", desc: "The target gains +10ft speed for 1 hour. Upcast: +1 target per higher slot." },
    "Unseen Servant": { level: 1, time: "1 action", range: "60ft", comp: "V, S, M (a bit of string and a piece of wood)", dur: "1 hour", desc: "Ritual. Onzichtbare geest (AC 10, 1 HP, STR 2) voert eenvoudige taken uit: schoonmaken, dragen, deuren openen. 60ft range, 1 uur." },
    "Augury": { level: 2, time: "1 minute", range: "Self", comp: "V, S, M (speciaal gemarkeerde stokjes of botten ter waarde van 25gp)", dur: "Instant", desc: "Ritual. Ask the DM for an omen (weal/woe/both/nothing) about a course of action within the next 30 minutes. Repeated use within 24h reduces accuracy." },
    "Gentle Repose": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (a pinch of salt and one copper piece placed on each eye)", dur: "10 days", desc: "Ritual. A corpse doesn't decay, and the time doesn't count against the raise-dead timer. 10 days." },
    "Locate Object": { level: 2, time: "1 action", range: "Self", comp: "V, S, M (a forked twig)", dur: "Concentration, 10 min", desc: "Sense the direction of a familiar object within 1000ft. Lead and certain obstacles block it." },
    "Warding Bond": { level: 2, time: "1 action", range: "Touch", comp: "V, S, M (twee platina ringen ter waarde van 50gp elk)", dur: "1 hour", desc: "Bond with the target. It gains +1 AC and saves and resistance to all damage — you take the same damage it does. Ends beyond 60ft range." },
    "Create or Destroy Water": { level: 1, time: "1 action", range: "30ft", comp: "V, S, M (a drop of water or a pinch of sand)", dur: "Instant", desc: "Create 10 gallons of clean water or destroy as much. Or make rain/fog fall in a 30ft cube. Upcast: +10 gallons." },
    "Purify Food and Drink": { level: 1, time: "1 action", range: "10ft", comp: "V, S", dur: "Instant", desc: "Ritual. Purify all nonmagical food and drink in a 5ft sphere of poison and disease." },
    "Dissonant Whispers": { level: 1, time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "WIS save or 3d6 psychic damage and the target uses its reaction to flee. Half damage and no fleeing on a save. Upcast: +1d6." },
    "Aura of Purity": { level: 4, time: "1 action", range: "Self (30ft aura)", comp: "V", dur: "Concentration, 10 min", desc: "A 30ft aura. Allies have resistance to poison, advantage on saves against conditions, and can't be diseased." },
    "Summon Celestial": { level: 5, time: "1 action", range: "90ft", comp: "V, S, M (reliekwieën ter waarde van 500gp)", dur: "Concentration, 1 hour", desc: "Summon a Celestial Spirit (Defender or Avenger). It follows your orders. Stats scale with the spell slot level." },
    "Summon Beast": { level: 2, time: "1 action", range: "90ft", comp: "V, S, M (a gilded flower worth 200gp)", dur: "Concentration, 1 hour", desc: "Summon a Bestial Spirit (Air/Land/Water). It follows your orders. Stats scale with the spell slot level." },
    "Find Steed": { level: 2, time: "10 minutes", range: "30ft", comp: "V, S", dur: "Instant", desc: "Summon a loyal steed (warhorse, pony, camel, elk, mastiff). Telepathic bond. Touch spells you cast can also affect it." }
};

// ===== SPELLS (class lists with name strings) =====
DATA.spells = {
    sorcerer: {
        0: ["Acid Splash","Blade Ward","Chill Touch","Dancing Lights","Fire Bolt","Friends","Light","Mage Hand","Mending","Message","Mind Sliver","Minor Illusion","Poison Spray","Prestidigitation","Ray of Frost","Shocking Grasp","Sorcerous Burst","True Strike","Elementalism"],
        1: ["Absorb Elements","Burning Hands","Chaos Bolt","Charm Person","Chromatic Orb","Color Spray","Comprehend Languages","Detect Magic","Disguise Self","Expeditious Retreat","False Life","Feather Fall","Fog Cloud","Grease","Ice Knife","Jump","Mage Armor","Magic Missile","Ray of Sickness","Shield","Silent Image","Sleep","Tasha's Hideous Laughter","Thunderwave","Witch Bolt"],
        2: ["Alter Self","Blindness/Deafness","Blur","Cloud of Daggers","Crown of Madness","Darkness","Darkvision","Detect Thoughts","Enhance Ability","Enlarge/Reduce","Gust of Wind","Hold Person","Invisibility","Knock","Levitate","Mirror Image","Misty Step","Phantasmal Force","Scorching Ray","See Invisibility","Shatter","Spider Climb","Suggestion","Web"],
        3: ["Blink","Clairvoyance","Counterspell","Daylight","Dispel Magic","Fear","Fireball","Fly","Gaseous Form","Haste","Hypnotic Pattern","Lightning Bolt","Major Image","Protection from Energy","Sleet Storm","Slow","Stinking Cloud","Tongues","Water Breathing","Water Walk"],
        4: ["Banishment","Blight","Confusion","Dimension Door","Dominate Beast","Greater Invisibility","Ice Storm","Polymorph","Stoneskin","Wall of Fire"],
        5: ["Animate Objects","Cloudkill","Cone of Cold","Creation","Dominate Person","Hold Monster","Insect Plague","Seeming","Synaptic Static","Telekinesis","Teleportation Circle","Wall of Stone"],
        6: ["Arcane Gate","Chain Lightning","Circle of Death","Disintegrate","Eyebite","Globe of Invulnerability","Mass Suggestion","Move Earth","Sunbeam","True Seeing"],
        7: ["Delayed Blast Fireball","Etherealness","Finger of Death","Fire Storm","Plane Shift","Prismatic Spray","Reverse Gravity","Teleport"],
        8: ["Dominate Monster","Earthquake","Incendiary Cloud","Power Word Stun","Sunburst"],
        9: ["Gate","Meteor Swarm","Power Word Kill","Psychic Scream","Time Stop","Wish"]
    },

    wizard: {
        0: ["Blade Ward","Booming Blade","Chill Touch","Dancing Lights","Fire Bolt","Friends","Light","Mage Hand","Mending","Message","Mind Sliver","Minor Illusion","Prestidigitation","Ray of Frost","Shocking Grasp","Toll the Dead","True Strike"],
        1: ["Absorb Elements","Burning Hands","Charm Person","Chromatic Orb","Color Spray","Comprehend Languages","Detect Magic","Disguise Self","False Life","Feather Fall","Find Familiar","Fog Cloud","Grease","Ice Knife","Identify","Longstrider","Mage Armor","Magic Missile","Shield","Silent Image","Silvery Barbs","Sleep","Tasha's Hideous Laughter","Thunderwave","Unseen Servant"],
        2: ["Alter Self","Blindness/Deafness","Blur","Cloud of Daggers","Crown of Madness","Darkness","Darkvision","Detect Thoughts","Enlarge/Reduce","Flaming Sphere","Gust of Wind","Hold Person","Invisibility","Knock","Levitate","Mirror Image","Misty Step","Phantasmal Force","Scorching Ray","See Invisibility","Shatter","Spider Climb","Suggestion","Web"],
        3: ["Animate Dead","Blink","Clairvoyance","Counterspell","Daylight","Dispel Magic","Fear","Fireball","Fly","Gaseous Form","Haste","Hypnotic Pattern","Lightning Bolt","Major Image","Protection from Energy","Sending","Sleet Storm","Slow","Stinking Cloud","Tongues"],
        4: ["Arcane Eye","Banishment","Confusion","Dimension Door","Dominate Beast","Greater Invisibility","Ice Storm","Polymorph","Stoneskin","Wall of Fire"],
        5: ["Animate Objects","Cone of Cold","Hold Monster","Scrying","Telekinesis","Wall of Force","Wall of Stone"],
        6: ["Arcane Gate","Chain Lightning","Circle of Death","Contingency","Create Undead","Disintegrate","Eyebite","Flesh to Stone","Globe of Invulnerability","Guards and Wards","Magic Jar","Mass Suggestion","Move Earth","Programmed Illusion","Sunbeam","True Seeing"],
        7: ["Delayed Blast Fireball","Etherealness","Finger of Death","Fire Storm","Forcecage","Magnificent Mansion","Mirage Arcane","Plane Shift","Prismatic Spray","Project Image","Reverse Gravity","Sequester","Simulacrum","Symbol","Teleport"],
        8: ["Antimagic Field","Antipathy/Sympathy","Clone","Control Weather","Demiplane","Dominate Monster","Earthquake","Feeblemind","Incendiary Cloud","Maze","Mind Blank","Power Word Stun","Sunburst"],
        9: ["Astral Projection","Foresight","Gate","Imprisonment","Meteor Swarm","Power Word Kill","Prismatic Wall","Psychic Scream","Shapechange","Time Stop","True Polymorph","Wish"]
    },

    bard: {
        0: ["Friends","Light","Mage Hand","Mending","Message","Minor Illusion","Prestidigitation","Vicious Mockery"],
        1: ["Bane","Charm Person","Color Spray","Command","Cure Wounds","Detect Magic","Disguise Self","Dissonant Whispers","Faerie Fire","Feather Fall","Healing Word","Heroism","Identify","Longstrider","Silent Image","Silvery Barbs","Sleep","Speak with Animals","Tasha's Hideous Laughter","Thunderwave","Unseen Servant"],
        2: ["Calm Emotions","Enhance Ability","Heat Metal","Hold Person","Invisibility","Knock","Lesser Restoration","See Invisibility","Shatter","Silence","Suggestion"],
        3: ["Bestow Curse","Dispel Magic","Fear","Hypnotic Pattern","Major Image","Sending","Speak with Dead","Tongues"],
        4: ["Dimension Door","Freedom of Movement","Greater Invisibility","Polymorph"],
        5: ["Animate Objects","Greater Restoration","Hold Monster","Mass Cure Wounds","Synaptic Static"],
        6: ["Eyebite","Find the Path","Guards and Wards","Mass Suggestion","Otto's Irresistible Dance","Programmed Illusion","True Seeing"],
        7: ["Dream of the Blue Veil","Etherealness","Forcecage","Magnificent Mansion","Mirage Arcane","Project Image","Regenerate","Symbol","Teleport"],
        8: ["Antipathy/Sympathy","Dominate Monster","Feeblemind","Glibness","Mind Blank","Power Word Stun"],
        9: ["Foresight","Mass Polymorph","Power Word Heal","Power Word Kill","Prismatic Wall","True Polymorph"]
    },

    cleric: {
        0: ["Guidance","Light","Mending","Sacred Flame","Spare the Dying","Thaumaturgy","Toll the Dead","Word of Radiance"],
        1: ["Bane","Bless","Command","Create or Destroy Water","Cure Wounds","Detect Evil and Good","Detect Magic","Guiding Bolt","Healing Word","Inflict Wounds","Protection from Evil and Good","Purify Food and Drink","Sanctuary","Shield of Faith"],
        2: ["Aid","Augury","Calm Emotions","Enhance Ability","Gentle Repose","Hold Person","Lesser Restoration","Locate Object","Prayer of Healing","Silence","Spiritual Weapon","Warding Bond","Zone of Truth"],
        3: ["Beacon of Hope","Bestow Curse","Daylight","Dispel Magic","Mass Healing Word","Revivify","Sending","Spirit Guardians","Tongues"],
        4: ["Banishment","Death Ward","Freedom of Movement","Guardian of Faith"],
        5: ["Commune","Contagion","Greater Restoration","Holy Weapon","Mass Cure Wounds","Raise Dead","Summon Celestial"],
        6: ["Blade Barrier","Create Undead","Find the Path","Forbiddance","Harm","Heal","Heroes' Feast","Planar Ally","True Seeing","Word of Recall"],
        7: ["Conjure Celestial","Divine Word","Etherealness","Fire Storm","Plane Shift","Regenerate","Resurrection","Symbol","Temple of the Gods"],
        8: ["Antimagic Field","Control Weather","Earthquake","Holy Aura","Sunburst"],
        9: ["Astral Projection","Gate","Mass Heal","Power Word Heal","True Resurrection"]
    },

    druid: {
        0: ["Druidcraft","Elementalism","Guidance","Mending","Poison Spray","Produce Flame","Resistance","Shillelagh","Thorn Whip"],
        1: ["Absorb Elements","Animal Friendship","Charm Person","Create or Destroy Water","Cure Wounds","Detect Magic","Entangle","Faerie Fire","Fog Cloud","Goodberry","Healing Word","Ice Knife","Jump","Longstrider","Protection from Evil and Good","Purify Food and Drink","Speak with Animals","Thunderwave"],
        2: ["Barkskin","Enhance Ability","Flame Blade","Flaming Sphere","Gust of Wind","Heat Metal","Hold Person","Lesser Restoration","Locate Object","Moonbeam","Pass Without Trace","Spike Growth","Summon Beast"],
        3: ["Call Lightning","Conjure Animals","Dispel Magic","Plant Growth","Sleet Storm","Water Breathing","Water Walk","Wind Wall"],
        4: ["Conjure Woodland Beings","Giant Insect","Ice Storm","Polymorph","Wall of Fire"],
        5: ["Conjure Elemental","Greater Restoration","Mass Cure Wounds","Wall of Stone"],
        6: ["Conjure Fey","Find the Path","Heal","Heroes' Feast","Move Earth","Sunbeam","Transport via Plants","Wall of Thorns","Wind Walk"],
        7: ["Fire Storm","Mirage Arcane","Plane Shift","Regenerate","Reverse Gravity"],
        8: ["Animal Shapes","Antipathy/Sympathy","Control Weather","Earthquake","Feeblemind","Sunburst","Tsunami"],
        9: ["Foresight","Shapechange","Storm of Vengeance","True Resurrection"]
    },

    ranger: {
        1: ["Absorb Elements","Animal Friendship","Cure Wounds","Detect Magic","Ensnaring Strike","Fog Cloud","Goodberry","Hail of Thorns","Hunter's Mark","Longstrider","Speak with Animals"],
        2: ["Aid","Darkvision","Enhance Ability","Lesser Restoration","Locate Object","Magic Weapon","Misty Step","Pass Without Trace","Silence","Spike Growth","Summon Beast"],
        3: ["Conjure Animals","Conjure Barrage","Daylight","Lightning Arrow","Plant Growth","Revivify","Summon Fey"],
        4: ["Freedom of Movement","Guardian of Nature","Stoneskin","Summon Beast"],
        5: ["Conjure Volley","Steel Wind Strike","Swift Quiver"]
    },

    paladin: {
        1: ["Bless","Command","Compelled Duel","Cure Wounds","Detect Evil and Good","Detect Magic","Divine Smite","Protection from Evil and Good","Purify Food and Drink","Shield of Faith","Thunderous Smite","Wrathful Smite"],
        2: ["Aid","Branding Smite","Find Steed","Gentle Repose","Lesser Restoration","Locate Object","Magic Weapon","Protection from Poison","Warding Bond","Zone of Truth"],
        3: ["Aura of Vitality","Blinding Smite","Crusader's Mantle","Daylight","Dispel Magic","Revivify","Spirit Shroud"],
        4: ["Aura of Life","Aura of Purity","Banishment","Death Ward","Find Greater Steed","Staggering Smite"],
        5: ["Banishing Smite","Destructive Wave","Holy Weapon","Raise Dead","Summon Celestial"]
    },

    warlock: {
        0: ["Booming Blade","Chill Touch","Eldritch Blast","Friends","Mage Hand","Mind Sliver","Minor Illusion","Poison Spray","Prestidigitation","Toll the Dead","True Strike"],
        1: ["Arms of Hadar","Armor of Agathys","Charm Person","Expeditious Retreat","Hellish Rebuke","Hex","Protection from Evil and Good","Witch Bolt"],
        2: ["Crown of Madness","Darkness","Hold Person","Invisibility","Mirror Image","Misty Step","Shatter","Spider Climb","Suggestion"],
        3: ["Counterspell","Dispel Magic","Fear","Fly","Hunger of Hadar","Hypnotic Pattern","Summon Fey","Thunder Step"],
        4: ["Banishment","Dimension Door","Shadow of Moil","Sickening Radiance","Summon Aberration"],
        5: ["Enervation","Far Step","Hold Monster","Synaptic Static","Wall of Light"],
        6: ["Arcane Gate","Circle of Death","Conjure Fey","Create Undead","Eyebite","Flesh to Stone","Mass Suggestion","True Seeing"],
        7: ["Etherealness","Finger of Death","Forcecage","Plane Shift"],
        8: ["Demiplane","Dominate Monster","Feeblemind","Glibness","Power Word Stun"],
        9: ["Astral Projection","Foresight","Imprisonment","Power Word Kill","True Polymorph"]
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

// Choices the player must make when REACHING a given class level (level-up menu
// steps). Creation-time (L1) choices are owned by the creation wizard, not here.
// id → renderer in wg-levelup.js; unsupported ids render as an informational
// step so a level-up never blocks.
// `count` = pick exactly N new options at this level. `total` = the character
// should KNOW N options after this level; the picker asks for (total − known),
// which self-heals characters whose earlier (creation-time) picks were never
// recorded — e.g. a Warlock without an L1 invocation picks 3 at L2.
DATA.levelUpChoices = {
    rogue:    { 3: [{ id: 'subclass' }] },
    paladin:  { 2: [{ id: 'fightingStyle' }], 3: [{ id: 'subclass' }] },
    sorcerer: { 2: [{ id: 'metamagic', count: 2 }], 3: [{ id: 'subclass' }] },
    wizard:   { 2: [{ id: 'scholar' }], 3: [{ id: 'subclass' }] },
    fighter:  { 2: [{ id: 'fightingStyle' }], 3: [{ id: 'subclass' }] },  // L1 style self-heals at L2 if never recorded
    druid:    { 2: [{ id: 'wildShapeForms', total: 4 }], 3: [{ id: 'subclass' }] },
    warlock:  { 2: [{ id: 'invocations', total: 3 }], 3: [{ id: 'subclass' }] },
    ranger:   { 2: [{ id: 'expertise', count: 1 }, { id: 'fightingStyle' }], 3: [{ id: 'subclass' }] },
    // Non-party classes — subclass step at L3 so the menu is complete for all
    // twelve. Bard L2 also picks Expertise (2 skills). Fighter's fightingStyle
    // entry self-heals: the step only appears when no style was recorded at
    // creation (needed = 0 otherwise).
    bard:      { 2: [{ id: 'expertise', count: 2 }], 3: [{ id: 'subclass' }] },
    cleric:    { 3: [{ id: 'subclass' }] },
    monk:      { 3: [{ id: 'subclass' }] },
    barbarian: { 3: [{ id: 'subclass' }] }
};

// 2024 PHB Eldritch Invocations selectable at warlock level <= 3 (scope batch 1;
// level 5+ invocations follow with the higher-level batch). minLevel gates the
// picker; prereq is display-only. ⚠ texts unverified against physical PHB.
DATA.invocations = [
    { name: "Agonizing Blast", minLevel: 2, prereq: "a Warlock cantrip that deals damage", desc: "Choose one of your known Warlock cantrips that deals damage. Add your Charisma modifier to that cantrip's damage rolls. You can take this invocation more than once, each time for a different cantrip." },
    { name: "Armor of Shadows", minLevel: 1, prereq: null, desc: "You can cast Mage Armor on yourself at will, without expending a spell slot." },
    { name: "Devil's Sight", minLevel: 2, prereq: null, desc: "You can see normally in Dim Light and Darkness — magical or not — within 120 feet of yourself." },
    { name: "Eldritch Mind", minLevel: 1, prereq: null, desc: "You have Advantage on Constitution saving throws that you make to maintain Concentration." },
    { name: "Eldritch Spear", minLevel: 2, prereq: "a Warlock cantrip that deals damage", desc: "Choose one of your known Warlock cantrips that deals damage. Its range increases by a number of feet equal to 30 x your Warlock level. Repeatable for different cantrips." },
    { name: "Fiendish Vigor", minLevel: 2, prereq: null, desc: "You can cast False Life on yourself at will, without expending a spell slot. When you cast it this way, you don't roll the die — you gain the maximum Temporary Hit Points." },
    { name: "Lessons of the First Ones", minLevel: 2, prereq: null, desc: "You gain one Origin feat of your choice. You can take this invocation more than once, each time for a different Origin feat." },
    { name: "Mask of Many Faces", minLevel: 2, prereq: null, desc: "You can cast Disguise Self at will, without expending a spell slot." },
    { name: "Misty Visions", minLevel: 2, prereq: null, desc: "You can cast Silent Image at will, without expending a spell slot." },
    { name: "Otherworldly Leap", minLevel: 2, prereq: null, desc: "You can cast Jump on yourself at will, without expending a spell slot." },
    { name: "Pact of the Blade", minLevel: 1, prereq: null, desc: "Bonus Action: conjure a pact weapon in your hand or bond with a weapon you touch. You can attack with it using Charisma instead of Strength or Dexterity, and its damage can be Necrotic, Psychic, Radiant, or its normal type." },
    { name: "Pact of the Chain", minLevel: 1, prereq: null, desc: "You learn Find Familiar (always prepared; once per Long Rest without a slot). Your familiar can take special forms such as Imp, Pseudodragon, Quasit, Skeleton, Slaad Tadpole, Sphinx of Wonder, Sprite, or Venomous Snake, and can attack when you take the Attack action (forgo one of your own attacks)." },
    { name: "Pact of the Tome", minLevel: 1, prereq: null, desc: "You gain a Book of Shadows with three cantrips of your choice from any class's spell list (always prepared) and two level-1 spells with the Ritual tag, which you can cast as Rituals from the book." },
    { name: "Repelling Blast", minLevel: 2, prereq: "a Warlock cantrip that deals damage via an attack roll", desc: "Choose one of your known Warlock cantrips that requires an attack roll. When you hit a Large or smaller creature with it, you can push the creature up to 10 feet straight away from you. Repeatable for different cantrips." }
];

// Beast forms legal for Wild Shape at druid levels 2-3 (2024: max CR 1/4, no
// Fly Speed). Curated iconic picks; the DM supplies full stat blocks. ⚠ speeds/
// traits summarised from the 2025 Monster Manual — spot-check when it matters.
DATA.wildShapeForms = [
    { name: "Cat", cr: "0", desc: "Speed 40 ft., Climb 30 ft. Tiny, stealthy scout with keen smell." },
    { name: "Rat", cr: "0", desc: "Speed 20 ft., Climb 20 ft. Tiny sneak — squeeze through small spaces." },
    { name: "Spider", cr: "0", desc: "Speed 20 ft., Climb 20 ft. Tiny; Spider Climb (walls and ceilings) and web sense." },
    { name: "Frog", cr: "0", desc: "Speed 20 ft., Swim 20 ft. Tiny amphibian with a strong standing leap." },
    { name: "Badger", cr: "0", desc: "Speed 20 ft., Burrow 5 ft. Tiny digger with keen smell." },
    { name: "Crab", cr: "0", desc: "Speed 20 ft., Swim 20 ft. Tiny amphibious scuttler." },
    { name: "Weasel", cr: "0", desc: "Speed 30 ft., Climb 30 ft. Tiny; keen hearing and smell." },
    { name: "Giant Rat", cr: "1/8", desc: "Speed 30 ft., Climb 30 ft. Small; Pack Tactics with allies nearby." },
    { name: "Mastiff", cr: "1/8", desc: "Speed 40 ft. Loyal hound; bite can knock a target Prone." },
    { name: "Poisonous Snake", cr: "1/8", desc: "Speed 30 ft., Swim 30 ft. Venomous bite (CON save)." },
    { name: "Mule", cr: "1/8", desc: "Speed 40 ft. Sure-footed beast of burden — carry heavy loads." },
    { name: "Boar", cr: "1/4", desc: "Speed 40 ft. Charge attack; Relentless — drops to 1 HP instead of 0 once per rest." },
    { name: "Constrictor Snake", cr: "1/4", desc: "Speed 30 ft., Swim 30 ft. Constrict: grapple and squeeze." },
    { name: "Riding Horse", cr: "1/4", desc: "Speed 60 ft. Fast overland travel." },
    { name: "Elk", cr: "1/4", desc: "Speed 50 ft. Charge with ram attack; hooves against Prone targets." },
    { name: "Giant Badger", cr: "1/4", desc: "Speed 30 ft., Burrow 10 ft. Digs tunnels; bite and claws." },
    { name: "Giant Frog", cr: "1/4", desc: "Speed 30 ft., Swim 30 ft. Standing leap; can swallow Tiny prey whole." },
    { name: "Giant Lizard", cr: "1/4", desc: "Speed 30 ft., Climb 30 ft. Wall-crawling mount-sized reptile." },
    { name: "Panther", cr: "1/4", desc: "Speed 50 ft., Climb 40 ft. Stealthy; pounce can knock a target Prone." },
    { name: "Wolf", cr: "1/4", desc: "Speed 40 ft. Pack Tactics; bite can knock a target Prone." }
];

// Class-specific alternatives to a Fighting Style feat (2024 PHB). Picking one
// grants cantrips from another class's list — the level-up wizard adds a
// follow-up cantrip step (cantripList/cantripCount below drive that).
DATA.classFightingBonus = {
    paladin: [{ name: "Blessed Warrior", desc: "Instead of a Fighting Style feat: you learn two Cleric cantrips of your choice. Charisma is your spellcasting ability for them, and you can replace one when you gain a Paladin level.", cantripList: "cleric", cantripCount: 2 }],
    ranger:  [{ name: "Druidic Warrior", desc: "Instead of a Fighting Style feat: you learn two Druid cantrips of your choice. Wisdom is your spellcasting ability for them, and you can replace one when you gain a Ranger level.", cantripList: "druid", cantripCount: 2 }]
};

// Species features that unlock at character levels > 1 (2024). Shown in the
// level-up menu next to class features, badged as "Species".
DATA.speciesProgression = {
    aasimar: {
        3: [{ name: "Celestial Revelation", desc: "Bonus Action: transform for 1 minute, once per Long Rest. Choose the form EACH time you transform: Heavenly Wings (fly speed = speed), Inner Radiance (10ft light aura; creatures within 10ft take radiant damage = prof bonus at the end of your turn), or Necrotic Shroud (CHA-save or Frightened). While transformed: once per turn, one attack deals extra damage = prof bonus (radiant, or necrotic for Necrotic Shroud)." }]
    },
    highElf: {
        3: [{ name: "Elf Lineage: Detect Magic", desc: "You always have Detect Magic prepared. Cast it once per Long Rest without a spell slot (or with slots as normal). (Level 5: Misty Step.)" }]
    },
    tiefling: {
        3: [{ name: "Fiendish Legacy Spell", desc: "You gain your legacy's level-3 spell, castable once per Long Rest without a spell slot: Abyssal = Ray of Sickness, Chthonic = False Life, Infernal = Hellish Rebuke." }]
    },
    human: {}
};

// Generic class/subclass/species resource registry — drives the classResource
// widget (wg-resource.js) and the Active-section of the features widget
// (wg-features.js). appliesTo gates visibility; max/die are functions of
// (config, state); stateKey tracks USED count in character state.
// featureNames links a resource to the feature rows that spend it — those rows
// become clickable in the features widget (click = spend 1 use).
DATA.classResources = [
    {
        id: 'psionicDice', label: 'Psionic Energy Dice',
        appliesTo: { className: 'rogue', subclass: 'soulknife', minLevel: 3 },
        max: function (cfg, st) { return 2 * getProfBonus(st.level || 1); },
        die: function (st) { var l = st.level || 1; return l >= 17 ? 'd12' : l >= 11 ? 'd10' : l >= 5 ? 'd8' : 'd6'; },
        stateKey: 'psionicDiceUsed', recharge: 'long', featureNames: ['Psionic Power'],
        desc: "Fuel for Soulknife powers. Psi-Bolstered Knack: after failing a check with a proficient skill/tool, roll a die and add it (die only spent if it turns the failure into a success). Psychic Whispers: telepathy with up to prof-bonus willing creatures for die-roll hours (first use per Long Rest is free). All dice return on a Long Rest."
    },
    {
        id: 'innateSorcery', label: 'Innate Sorcery',
        appliesTo: { className: 'sorcerer', minLevel: 1 },
        max: function (cfg, st) { return 2; },
        stateKey: 'innateSorceryUsed', recharge: 'long', featureNames: ['Innate Sorcery'],
        desc: "Bonus Action: unleash your magic for 1 minute. Spell save DC +1 and advantage on attack rolls of sorcerer spells. Two uses; all return on a Long Rest."
    },
    {
        id: 'sorceryPoints', label: 'Sorcery Points',
        appliesTo: { className: 'sorcerer', minLevel: 2 },
        max: function (cfg, st) { return st.level || 1; },
        stateKey: 'sorceryPointsUsed', recharge: 'long', featureNames: ['Font of Magic'],
        desc: "Font of Magic. Bonus Action: convert points into spell slots (level-1 slot = 2 points) or slots into points (points = slot level). Fuels Metamagic. All points return on a Long Rest."
    },
    {
        id: 'secondWind', label: 'Second Wind',
        appliesTo: { className: 'fighter', minLevel: 1 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 10 ? 4 : l >= 4 ? 3 : 2; },
        stateKey: 'secondWindUsed', recharge: 'short-one', featureNames: ['Second Wind', 'Tactical Mind'],
        desc: "Bonus Action: regain 1d10 + Fighter level HP. Two uses; regain one on a Short Rest, all on a Long Rest. From level 2, Tactical Mind lets you spend a use to add 1d10 to a failed ability check (use not spent if it still fails)."
    },
    {
        id: 'channelDivinity', label: 'Channel Divinity',
        appliesTo: { className: 'paladin', minLevel: 3 },
        max: function (cfg, st) { return 2; },
        stateKey: 'channelDivinityUsed', recharge: 'short-one', featureNames: ['Channel Divinity'],
        desc: "Channel divine energy. Baseline: Divine Sense (Bonus Action, 10 min: detect Celestials, Fiends and Undead within 60ft). Your oath adds an option. Two uses; regain one on a Short Rest, all on a Long Rest."
    },
    {
        id: 'wildShape', label: 'Wild Shape',
        appliesTo: { className: 'druid', minLevel: 2 },
        max: function (cfg, st) { return 2; },
        stateKey: 'wildShapeUsed', recharge: 'short-one', featureNames: ['Wild Shape', 'Wild Companion'],
        desc: "Bonus Action: transform into a known Beast form (levels 2-3: max CR 1/4, no fly speed). You keep INT/WIS/CHA. Two uses; regain one on a Short Rest, all on a Long Rest.",
        // Known forms (picked via level-up) appended to the widget tooltip.
        extraDesc: function (cfg, st) {
            var forms = st.wildShapeForms || [];
            return forms.length ? 'Known forms: ' + forms.join(', ') + '. You can swap one on each Long Rest.' : '';
        }
    },
    {
        id: 'layOnHands', label: 'Lay On Hands',
        appliesTo: { className: 'paladin', minLevel: 1 },
        max: function (cfg, st) { return 5 * (st.level || 1); },
        stateKey: 'layOnHandsUsed', recharge: 'long', featureNames: ['Lay On Hands'], unit: 'points',
        desc: "Healing pool of 5 x Paladin level HP. Magic action, touch: restore any number of points from the pool, or spend 5 to remove one Poisoned condition. The pool refills on a Long Rest."
    },
    {
        id: 'paladinSmite', label: "Paladin's Smite",
        appliesTo: { className: 'paladin', minLevel: 2 },
        max: function (cfg, st) { return 1; },
        stateKey: 'paladinSmiteUsed', recharge: 'long', featureNames: ["Paladin's Smite"], spellNames: ['Divine Smite'],
        desc: "Once per Long Rest: cast Divine Smite without expending a spell slot. Divine Smite is always prepared and can also be cast with slots as normal."
    },
    {
        id: 'favoredEnemy', label: 'Favored Enemy',
        appliesTo: { className: 'ranger', minLevel: 1 },
        max: function (cfg, st) { var l = st.level || 1; return l >= 17 ? 6 : l >= 13 ? 5 : l >= 9 ? 4 : l >= 5 ? 3 : 2; },
        stateKey: 'favoredEnemyUsed', recharge: 'long', featureNames: ['Favored Enemy'], spellNames: ["Hunter's Mark"],
        desc: "Hunter's Mark is always prepared and doesn't count against your prepared spells. Cast it this many times without a spell slot; all uses return on a Long Rest."
    },
    {
        id: 'arcaneRecovery', label: 'Arcane Recovery',
        appliesTo: { className: 'wizard', minLevel: 1 },
        max: function (cfg, st) { return 1; },
        stateKey: 'arcaneRecoveryUsed', recharge: 'long', featureNames: ['Arcane Recovery'],
        desc: "Once per day when you finish a Short Rest: recover expended spell slots with a combined level of up to half your Wizard level (round up)."
    },
    {
        id: 'magicalCunning', label: 'Magical Cunning',
        appliesTo: { className: 'warlock', minLevel: 2 },
        max: function (cfg, st) { return 1; },
        stateKey: 'magicalCunningUsed', recharge: 'long', featureNames: ['Magical Cunning'],
        desc: "Spend 1 minute in an esoteric rite: regain expended Pact Magic slots equal to half your maximum (round up). Once per Long Rest."
    },
    {
        id: 'healingHands', label: 'Healing Hands',
        appliesTo: { race: 'aasimar', minLevel: 1 },
        max: function (cfg, st) { return 1; },
        stateKey: 'healingHandsUsed', recharge: 'long', featureNames: ['Healing Hands'],
        desc: "Magic action: touch a creature; it regains HP equal to prof-bonus × d4. Once per Long Rest."
    },
    {
        id: 'celestialRevelation', label: 'Celestial Revelation',
        appliesTo: { race: 'aasimar', minLevel: 3 },
        max: function (cfg, st) { return 1; },
        stateKey: 'celestialRevelationUsed', recharge: 'long', featureNames: ['Celestial Revelation'],
        desc: "Bonus Action: transform for 1 minute (choose Heavenly Wings, Inner Radiance or Necrotic Shroud each time). Once per Long Rest."
    },
    {
        id: 'fiendishLegacy', label: 'Fiendish Legacy Spell',
        appliesTo: { race: 'tiefling', minLevel: 3 },
        max: function (cfg, st) { return 1; },
        stateKey: 'fiendishLegacyUsed', recharge: 'long', featureNames: ['Fiendish Legacy Spell'], spellNames: ['Ray of Sickness', 'False Life', 'Hellish Rebuke'],
        desc: "Cast your legacy's level-3 spell (Abyssal: Ray of Sickness, Chthonic: False Life, Infernal: Hellish Rebuke) once without a spell slot. Returns on a Long Rest; you can also cast it with spell slots as normal."
    },
    {
        id: 'highElfSpell', label: 'Detect Magic (Elf Lineage)',
        appliesTo: { race: 'highElf', minLevel: 3 },
        max: function (cfg, st) { return 1; },
        stateKey: 'highElfSpellUsed', recharge: 'long', featureNames: ['Elf Lineage: Detect Magic'], spellNames: ['Detect Magic'],
        desc: "You always have Detect Magic prepared. Cast it once without a spell slot; returns on a Long Rest. You can also cast it with spell slots as normal."
    }
];

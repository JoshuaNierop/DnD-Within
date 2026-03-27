const DATA = {
    // Index 0 unused, index 1-20 = character levels
    profBonus: [0, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6],

    halfElf: {
        speed: 30,
        darkvision: 60,
        features: [
            { name: "Darkvision", desc: "Je kunt in dim light zien als bright light tot 60ft, en in duisternis als dim light." },
            { name: "Fey Ancestry", desc: "Advantage op saving throws tegen charmed. Magie kan je niet in slaap brengen." },
            { name: "Skill Versatility", desc: "Proficiency in 2 extra skills naar keuze." }
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
                { name: "Spellcasting", desc: "Cast sorcerer spells met CHA als spellcasting ability. Je kent een beperkt aantal spells." },
                { name: "Sorcerous Origin", desc: "Kies je magische oorsprong. Dit bepaalt je subclass features." }
            ],
            2: [
                { name: "Font of Magic", desc: "Je krijgt sorcery points die je kunt omzetten in spell slots of gebruiken voor Metamagic." },
                { name: "Metamagic", desc: "Kies 2 Metamagic opties. Hiermee pas je spells aan door sorcery points te besteden." }
            ],
            3: [],
            4: [
                { name: "Ability Score Improvement", desc: "Verhoog één ability score met 2, of twee scores met 1. Of kies een feat." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Verhoog één ability score met 2, of twee scores met 1. Of kies een feat." }
            ],
            10: [
                { name: "Additional Metamagic", desc: "Kies nog 1 extra Metamagic optie." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Verhoog één ability score met 2, of twee scores met 1. Of kies een feat." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Verhoog één ability score met 2, of twee scores met 1. Of kies een feat." }
            ],
            17: [
                { name: "Additional Metamagic", desc: "Kies nog 1 extra Metamagic optie." }
            ],
            19: [
                { name: "Ability Score Improvement", desc: "Verhoog één ability score met 2, of twee scores met 1. Of kies een feat." }
            ],
            20: [
                { name: "Sorcerous Restoration", desc: "Na een short rest krijg je 4 sorcery points terug." }
            ]
        },

        subclasses: {
            wildMagic: {
                name: "Wild Magic",
                level: 1,
                features: {
                    1: [
                        { name: "Wild Magic Surge", desc: "Direct na het casten van een sorcerer spell van 1st level of hoger kan de DM je laten rollen op de Wild Magic Surge tabel." },
                        { name: "Tides of Chaos", desc: "Eén keer per long rest: geef jezelf advantage op een attack roll, ability check of saving throw." }
                    ],
                    6: [
                        { name: "Bend Luck", desc: "Reaction, 2 sorcery points: voeg 1d4 toe of trek 1d4 af van een attack roll, ability check of saving throw van een creature dat je kunt zien." }
                    ],
                    14: [
                        { name: "Controlled Chaos", desc: "Als je rolt op de Wild Magic Surge tabel, rol je twee keer en kies je welk effect plaatsvindt." }
                    ],
                    18: [
                        { name: "Spell Bombardment", desc: "Als je damage rolt voor een spell en een of meer dobbelstenen het maximale getal tonen, kies er één en rol die opnieuw. Voeg het resultaat toe aan de damage." }
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
                { name: "Expertise", desc: "Kies 2 skills met proficiency (of thieves' tools). Je proficiency bonus wordt verdubbeld voor die checks." },
                { name: "Sneak Attack", desc: "Eén keer per beurt extra schade als je advantage hebt of een ally binnen 5ft van het doelwit staat. Finesse of ranged weapon vereist." },
                { name: "Thieves' Cant", desc: "Geheime dieventaal. Je kunt verborgen berichten achterlaten en begrijpen in gesprekken." }
            ],
            2: [
                { name: "Cunning Action", desc: "Bonus action om te Dash, Disengage of Hide." }
            ],
            3: [
                { name: "Roguish Archetype", desc: "Kies je subclass. Dit bepaalt je specialisatie als rogue." }
            ],
            4: [
                { name: "Ability Score Improvement", desc: "Verhoog één ability score met 2, of twee scores met 1. Of kies een feat." }
            ],
            5: [
                { name: "Uncanny Dodge", desc: "Reaction: als een attacker die je kunt zien je raakt, halveer de damage van die aanval." }
            ],
            6: [
                { name: "Expertise", desc: "Kies nog 2 extra skills (of thieves' tools) voor verdubbelde proficiency bonus." }
            ],
            7: [
                { name: "Evasion", desc: "Bij een DEX saving throw voor halve damage: neem 0 damage bij succes, halve damage bij falen." }
            ],
            8: [
                { name: "Ability Score Improvement", desc: "Verhoog één ability score met 2, of twee scores met 1. Of kies een feat." }
            ],
            10: [
                { name: "Ability Score Improvement", desc: "Verhoog één ability score met 2, of twee scores met 1. Of kies een feat." }
            ],
            11: [
                { name: "Reliable Talent", desc: "Als je een ability check maakt waar je proficiency hebt, wordt elke d20 roll van 9 of lager behandeld als een 10." }
            ],
            12: [
                { name: "Ability Score Improvement", desc: "Verhoog één ability score met 2, of twee scores met 1. Of kies een feat." }
            ],
            14: [
                { name: "Blindsense", desc: "Als je kunt horen, weet je de locatie van verborgen of onzichtbare creatures binnen 10ft." }
            ],
            15: [
                { name: "Slippery Mind", desc: "Je krijgt proficiency in Wisdom saving throws." }
            ],
            16: [
                { name: "Ability Score Improvement", desc: "Verhoog één ability score met 2, of twee scores met 1. Of kies een feat." }
            ],
            18: [
                { name: "Elusive", desc: "Geen attack roll heeft advantage tegen jou, zolang je niet incapacitated bent." }
            ],
            19: [
                { name: "Ability Score Improvement", desc: "Verhoog één ability score met 2, of twee scores met 1. Of kies een feat." }
            ],
            20: [
                { name: "Stroke of Luck", desc: "Als je een aanval mist, verander het in een hit. Of bij een failed ability check, behandel de d20 als een 20. Eén keer per short/long rest." }
            ]
        },

        subclasses: {
            scout: {
                name: "Scout",
                level: 3,
                features: {
                    3: [
                        { name: "Skirmisher", desc: "Reaction: als een vijand binnen 5ft van je eindigt, kun je tot de helft van je speed wegbewegen zonder opportunity attacks." },
                        { name: "Survivalist", desc: "Je krijgt proficiency in Nature en Survival. Je expertise in deze skills wordt verdubbeld." }
                    ],
                    9: [
                        { name: "Superior Mobility", desc: "Je walking speed stijgt met 10ft. Dit geldt ook voor climb en swim speed als je die hebt." }
                    ],
                    13: [
                        { name: "Ambush Master", desc: "Advantage op initiative rolls. De eerste creature die je raakt in de eerste ronde van combat krijgt alle allies advantage op attacks tegen dat doelwit tot het begin van je volgende beurt." }
                    ],
                    17: [
                        { name: "Sudden Strike", desc: "Als je de Attack action neemt, kun je een extra aanval doen als bonus action. Je kunt Sneak Attack op beide aanvallen toepassen, maar niet op hetzelfde doelwit." }
                    ]
                }
            }
        }
    },

    // ===== METAMAGIC OPTIONS =====
    metamagic: [
        { name: "Careful Spell", cost: 1, desc: "Kies een aantal creatures gelijk aan je CHA modifier (min 1). Ze slagen automatisch op de saving throw van je spell." },
        { name: "Distant Spell", cost: 1, desc: "Verdubbel de range van een spell met range 5ft+. Spells met touch krijgen range 30ft." },
        { name: "Empowered Spell", cost: 1, desc: "Rol opnieuw tot je CHA modifier (min 1) damage dice. Combineerbaar met andere Metamagic." },
        { name: "Extended Spell", cost: 1, desc: "Verdubbel de duur van een spell (max 24 uur)." },
        { name: "Heightened Spell", cost: 3, desc: "Kies één target van de spell. Dat target heeft disadvantage op de eerste saving throw tegen de spell." },
        { name: "Quickened Spell", cost: 2, desc: "Cast een spell met casting time 1 action als bonus action." },
        { name: "Subtle Spell", cost: 1, desc: "Cast een spell zonder verbal of somatic components. Ideaal tegen Counterspell." },
        { name: "Twinned Spell", cost: "spell level (1 min)", desc: "Target een tweede creature met een single-target spell. Kost sorcery points gelijk aan het spell level (1 voor cantrips)." }
    ],

    // ===== FEATS =====
    feats: [
        { name: "Alert", desc: "+5 op initiative. Je kunt niet surprised worden. Verborgen aanvallers hebben geen advantage tegen jou.", prereq: null },
        { name: "Athlete", desc: "+1 STR of DEX. Opstaan kost maar 5ft movement. Climbing kost geen extra movement. Running long/high jump met 5ft aanloop.", prereq: null },
        { name: "Actor", desc: "+1 CHA. Advantage op Deception en Performance checks om jezelf voor te doen als iemand anders. Imiteer spraak/geluiden van anderen.", prereq: null },
        { name: "Crossbow Expert", desc: "Geen disadvantage op ranged attacks in melee. Negeer loading property. Na een attack met one-handed weapon: bonus action hand crossbow attack.", prereq: null },
        { name: "Defensive Duelist", desc: "Reaction als je wordt aangevallen in melee: voeg je proficiency bonus toe aan AC voor die aanval. Vereist finesse weapon.", prereq: { dex: 13 } },
        { name: "Dual Wielder", desc: "+1 AC als je twee wapens draagt. Two-weapon fighting met non-light wapens. Trek twee wapens tegelijk.", prereq: null },
        { name: "Dungeon Delver", desc: "Advantage om verborgen deuren te vinden. Advantage op saving throws tegen traps. Resistance tegen trap damage. Zoek naar traps op normaal tempo.", prereq: null },
        { name: "Durable", desc: "+1 CON. Bij het rollen van hit dice voor HP herstel, minimum waarde is 2x CON modifier.", prereq: null },
        { name: "Elemental Adept", desc: "Kies een element. Spells negeren resistance tegen dat element. Behandel 1'en op damage dice als 2'en.", prereq: { spellcasting: true } },
        { name: "Inspiring Leader", desc: "Besteed 10 minuten om een speech te geven. Tot 6 creatures krijgen temporary HP gelijk aan je level + CHA modifier.", prereq: { cha: 13 } },
        { name: "Keen Mind", desc: "+1 INT. Je weet altijd welke kant noorden is, hoeveel uur tot zonsopgang/-ondergang, en alles wat je de afgelopen maand hebt gezien of gehoord.", prereq: null },
        { name: "Lucky", desc: "3 luck points per long rest. Besteed er één om een extra d20 te rollen bij een attack, ability check, of saving throw en kies welke telt.", prereq: null },
        { name: "Mage Slayer", desc: "Reaction: melee attack als een creature naast je een spell cast. Targets in je melee range hebben disadvantage op concentration saves. Advantage op saves tegen spells van creatures naast je.", prereq: null },
        { name: "Magic Initiate", desc: "Kies een class. Leer 2 cantrips en 1 first-level spell van die class. Cast de spell eens per long rest.", prereq: null },
        { name: "Mobile", desc: "+10ft speed. Dash door difficult terrain kost geen extra movement. Geen opportunity attack van een creature waartegen je een melee attack hebt gedaan.", prereq: null },
        { name: "Observant", desc: "+1 INT of WIS. Lees lippen als je de taal begrijpt. +5 op passive Perception en passive Investigation.", prereq: null },
        { name: "Resilient", desc: "+1 op een ability score naar keuze. Proficiency in saving throws voor die ability.", prereq: null },
        { name: "Ritual Caster", desc: "Leer ritual spells en cast ze als rituals vanuit een ritual book. Je kunt nieuwe ritual spells toevoegen die je vindt.", prereq: { intOrWis: 13 } },
        { name: "Savage Attacker", desc: "Eén keer per beurt als je melee weapon damage rolt, rol de damage dice opnieuw en kies het hoogste resultaat.", prereq: null },
        { name: "Sentinel", desc: "Creatures die je raakt met opportunity attack krijgen speed 0. Opportunity attacks ook als target Disengaged. Reaction melee attack als een creature naast je iemand anders aanvalt.", prereq: null },
        { name: "Sharpshooter", desc: "Geen disadvantage op long range. Negeer half en three-quarters cover. Neem -5 op attack roll voor +10 damage met ranged weapons.", prereq: null },
        { name: "Skilled", desc: "Proficiency in 3 skills of tools naar keuze.", prereq: null },
        { name: "Skulker", desc: "Je kunt je verbergen als je lightly obscured bent. Missen met ranged attack onthult je positie niet. Dim light geeft geen disadvantage op Perception.", prereq: { dex: 13 } },
        { name: "Spell Sniper", desc: "Verdubbel range van spell attacks. Negeer half en three-quarters cover bij spell attacks. Leer 1 cantrip met attack roll.", prereq: { spellcasting: true } },
        { name: "Tavern Brawler", desc: "+1 STR of CON. Proficiency met improvised weapons. Unarmed strike doet 1d4. Bonus action grapple na een hit met unarmed/improvised weapon.", prereq: null },
        { name: "Tough", desc: "Je max HP stijgt met 2 per level. Ook bij toekomstige levels.", prereq: null },
        { name: "War Caster", desc: "Advantage op concentration saves. Somatic components met volle handen. Reaction: cast een spell als opportunity attack.", prereq: { spellcasting: true } },
        { name: "Weapon Master", desc: "+1 STR of DEX. Proficiency met 4 wapens naar keuze.", prereq: null }
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

    // ===== TOOLTIPS =====
    tooltips: {
        halfElf: {
            title: "Half-Elf",
            desc: "Afstammeling van mens en elf. Combineert de beste eigenschappen van beide rassen.",
            abilities: "+2 Charisma, +1 op twee andere ability scores naar keuze",
            traits: "Darkvision 60ft, Fey Ancestry (advantage vs charm), Skill Versatility (2 extra skill proficiencies)",
            languages: "Common, Elvish, +1 naar keuze",
            speed: "30ft",
            size: "Medium"
        },
        sorcerer: {
            title: "Sorcerer",
            desc: "Magie zit in je bloed. Je hoeft het niet te leren — het ís er al.",
            hitDie: "d6",
            primaryAbility: "Charisma",
            savingThrows: "Constitution, Charisma",
            armorProf: "Geen",
            weaponProf: "Daggers, darts, slings, quarterstaffs, light crossbows",
            spellcasting: "Bereid spells voor uit de volledige Sorcerer spell list. Aantal = CHA mod + level."
        },
        rogue: {
            title: "Rogue",
            desc: "Specialist in precisie, stealth en het exploiteren van zwakke plekken.",
            hitDie: "d8",
            primaryAbility: "Dexterity",
            savingThrows: "Dexterity, Intelligence",
            armorProf: "Light armor",
            weaponProf: "Simple weapons, hand crossbows, longswords, rapiers, shortswords",
            tools: "Thieves' tools"
        },
        wildMagic: {
            title: "Wild Magic Origin",
            desc: "Je magie komt uit een chaotische bron. Onvoorspelbaar maar krachtig. Bij elke spell is er een kans op een Wild Magic Surge.",
            keyFeatures: "Wild Magic Surge, Tides of Chaos (lvl 1), Bend Luck (lvl 6), Controlled Chaos (lvl 14), Spell Bombardment (lvl 18)"
        },
        scout: {
            title: "Scout Archetype",
            desc: "Een meester in verkenning en overleven in de wildernis. Sneller en moeilijker te vangen dan andere rogues.",
            keyFeatures: "Skirmisher, Survivalist (lvl 3), Superior Mobility (lvl 9), Ambush Master (lvl 13), Sudden Strike (lvl 17)"
        },
        urchin: {
            title: "Urchin Background",
            desc: "Opgegroeid op straat. Je kent de stad beter dan wie dan ook en je hebt geleerd te overleven met niets.",
            skillProf: "Sleight of Hand, Stealth",
            toolProf: "Disguise kit, Thieves' tools",
            feature: "City Secrets — Je kent geheime routes door de stad. Je reist twee keer zo snel door stedelijk gebied.",
            equipment: "Klein mes, kaart van de stad, huisdier (muis), set gewone kleding, buidel met 10gp"
        }
    },

    // ===== ITEMS DATABASE =====
    items: {
        weapons: [
            { name: "Dagger", weight: 1 },
            { name: "Shortsword", weight: 2 },
            { name: "Shortbow", weight: 2 },
            { name: "Arrows (20)", weight: 1 },
            { name: "Light crossbow", weight: 5 },
            { name: "Bolts (20)", weight: 1.5 },
            { name: "Quarterstaff", weight: 4 },
            { name: "Dart", weight: 0.25 },
            { name: "Sling", weight: 0 },
            { name: "Rapier", weight: 2 },
            { name: "Longsword", weight: 3 },
            { name: "Handaxe", weight: 2 }
        ],
        armor: [
            { name: "Leather armor", weight: 10 },
            { name: "Studded leather", weight: 13 },
            { name: "Shield", weight: 6 },
            { name: "Padded armor", weight: 8 }
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
            { name: "Gaming set", weight: 0 }
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
    },

    // ===== SORCERER SPELLS =====
    spells: {
        sorcerer: {
            // CANTRIPS
            0: [
                { name: "Acid Splash", time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Gooi een bubbel zuur naar 1-2 creatures binnen 5ft van elkaar. DEX save of 1d6 acid damage. Schaalt op 5e/11e/17e level." },
                { name: "Blade Ward", time: "1 action", range: "Self", comp: "V, S", dur: "1 ronde", desc: "Resistance tegen bludgeoning, piercing en slashing damage van weapon attacks tot het einde van je volgende beurt." },
                { name: "Chill Touch", time: "1 action", range: "120ft", comp: "V, S", dur: "1 ronde", desc: "Ghostly skeletal hand raakt een creature. 1d8 necrotic damage, target kan geen HP herstellen tot je volgende beurt. Undead krijgen disadvantage op attacks." },
                { name: "Dancing Lights", time: "1 action", range: "120ft", comp: "V, S, M (een beetje fosforus of wychwood, of een glowworm)", dur: "Concentration, 1 min", desc: "Creëer tot 4 fakkelvormige lichtjes binnen 120ft. Verplaats ze als bonus action. Concentration, 1 minuut." },
                { name: "Fire Bolt", time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 1d10 fire damage, 120ft. Schaalt op 5e/11e/17e level." },
                { name: "Friends", time: "1 action", range: "Self", comp: "S, M (een beetje make-up)", dur: "Concentration, 1 min", desc: "Advantage op CHA checks tegen een non-hostile creature. Na afloop weet het target dat je magie hebt gebruikt. Concentration, 1 minuut." },
                { name: "Light", time: "1 action", range: "Touch", comp: "V, M (een vuurvliegje of stukje fosforus)", dur: "1 uur", desc: "Een object straalt bright light uit in 20ft radius en dim light voor nog eens 20ft. Duurt 1 uur." },
                { name: "Mage Hand", time: "1 action", range: "30ft", comp: "V, S", dur: "1 min", desc: "Creëer een spectrale hand op 30ft die objecten kan manipuleren, deuren openen, etc. Duurt 1 minuut." },
                { name: "Mending", time: "1 minute", range: "Touch", comp: "V, S, M (twee lodestones)", dur: "Instant", desc: "Repareer een enkele breuk of scheur in een object (gebroken ketting, gescheurd stuk stof, etc.)." },
                { name: "Message", time: "1 action", range: "120ft", comp: "V, S, M (een stukje koperdraad)", dur: "1 ronde", desc: "Fluister een bericht naar een creature binnen 120ft. Alleen het target hoort het en kan fluisterend antwoorden." },
                { name: "Minor Illusion", time: "1 action", range: "30ft", comp: "S, M (een beetje fleece)", dur: "1 min", desc: "Creëer een geluid of beeld van een object binnen 30ft. Duurt 1 minuut. Investigation check om als illusie te herkennen." },
                { name: "Poison Spray", time: "1 action", range: "10ft", comp: "V, S", dur: "Instant", desc: "Giftige mist naar een creature binnen 10ft. CON save of 1d12 poison damage. Schaalt op 5e/11e/17e level." },
                { name: "Prestidigitation", time: "1 action", range: "10ft", comp: "V, S", dur: "Tot 1 uur", desc: "Klein magisch trucje: vonken, geluid, smaak veranderen, kleine illusie, licht, schoonmaken, etc. Duurt tot 1 uur." },
                { name: "Ray of Frost", time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 1d8 cold damage, -10ft speed tot begin volgende beurt. 60ft range. Schaalt." },
                { name: "Shocking Grasp", time: "1 action", range: "Touch", comp: "V, S", dur: "Instant", desc: "Melee spell attack met advantage tegen metalen armor. 1d8 lightning damage, target kan geen reactions nemen. Schaalt." },
                { name: "True Strike", time: "1 action", range: "30ft", comp: "S", dur: "Concentration, 1 ronde", desc: "Concentration, 1 ronde. Je krijgt advantage op je eerste attack roll tegen het target op je volgende beurt." },
                { name: "Mind Sliver", time: "1 action", range: "60ft", comp: "V", dur: "1 ronde", desc: "INT save of 1d6 psychic damage en -1d4 van de volgende saving throw voor einde volgende beurt. 60ft. Schaalt." }
            ],

            // 1ST LEVEL
            1: [
                { name: "Burning Hands", time: "1 action", range: "Self (15ft cone)", comp: "V, S", dur: "Instant", desc: "15ft cone of fire. DEX save, 3d6 fire damage (half bij save). Schaalt +1d6 per hogere spell slot." },
                { name: "Charm Person", time: "1 action", range: "30ft", comp: "V, S", dur: "1 uur", desc: "Betover een humanoid binnen 30ft. WIS save (advantage als je vecht). Het target beschouwt je als een goede vriend. Duurt 1 uur." },
                { name: "Chromatic Orb", time: "1 action", range: "90ft", comp: "V, S, M (een diamant ter waarde van minstens 50gp)", dur: "Instant", desc: "Ranged spell attack, 3d8 damage van een gekozen type (acid/cold/fire/lightning/poison/thunder). 90ft. Vereist 50gp diamant." },
                { name: "Color Spray", time: "1 action", range: "Self (15ft cone)", comp: "V, S, M (een snufje poeder of zand, rood/geel/blauw gekleurd)", dur: "1 ronde", desc: "15ft cone. 6d10 HP aan creatures worden blind (laagste HP eerst). Geen save. Schaalt +2d10 per slot." },
                { name: "Comprehend Languages", time: "1 action", range: "Self", comp: "V, S, M (een snufje roet en zout)", dur: "1 uur", desc: "Ritual. Je begrijpt elke gesproken taal die je hoort en geschreven tekst die je aanraakt. Duurt 1 uur." },
                { name: "Detect Magic", time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 10 min", desc: "Ritual. Concentration, 10 min. Voel de aanwezigheid van magie binnen 30ft. Zie de school of magic door dunne barrières heen." },
                { name: "Disguise Self", time: "1 action", range: "Self", comp: "V, S", dur: "1 uur", desc: "Verander je uiterlijk (kleding, armor, wapens, lengte ±1ft). Investigation check om door de illusie te kijken. Duurt 1 uur." },
                { name: "Expeditious Retreat", time: "1 bonus action", range: "Self", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Bonus action Dash elke beurt." },
                { name: "False Life", time: "1 action", range: "Self", comp: "V, S, M (een kleine hoeveelheid alcohol of gedistilleerde geesten)", dur: "1 uur", desc: "Geef jezelf 1d4+4 temporary HP. Duurt 1 uur. Schaalt +5 temp HP per hogere slot." },
                { name: "Feather Fall", time: "1 reaction", range: "60ft", comp: "V, M (een kleine veer of stukje dons)", dur: "1 min", desc: "Reaction: tot 5 falling creatures binnen 60ft vallen langzaam (60ft/ronde) en nemen geen fall damage." },
                { name: "Fog Cloud", time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 uur", desc: "20ft radius bol van mist. Heavily obscured area. Concentration, 1 uur. Schaalt +20ft radius per slot." },
                { name: "Jump", time: "1 action", range: "Touch", comp: "V, S, M (de achterpoot van een sprinkhaan)", dur: "1 min", desc: "Verdrievoudig de sprong-afstand van een creature dat je aanraakt. Duurt 1 minuut." },
                { name: "Mage Armor", time: "1 action", range: "Touch", comp: "V, S, M (een stukje gelooid leer)", dur: "8 uur", desc: "Touch. AC wordt 13 + DEX modifier voor een creature zonder armor. Duurt 8 uur." },
                { name: "Magic Missile", time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Drie gloeiende pijlen raken automatisch. Elk doet 1d4+1 force damage. Schaalt +1 pijl per hogere slot." },
                { name: "Ray of Sickness", time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 2d8 poison damage. Bij een hit: CON save of ook poisoned tot einde volgende beurt. 60ft." },
                { name: "Shield", time: "1 reaction", range: "Self", comp: "V, S", dur: "1 ronde", desc: "Reaction: +5 AC tot begin volgende beurt, inclusief tegen de triggering attack. Blokkeert ook Magic Missile." },
                { name: "Silent Image", time: "1 action", range: "60ft", comp: "V, S, M (een beetje fleece)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Creëer een visuele illusie tot 15ft cube binnen 60ft. Verplaats met action. Investigation check." },
                { name: "Sleep", time: "1 action", range: "90ft", comp: "V, S, M (een snufje fijn zand, rozenblaadjes, of een krekel)", dur: "1 min", desc: "5d8 HP aan creatures in een 20ft radius vallen in slaap (laagste HP eerst). Geen save. Schaalt +2d8 per slot." },
                { name: "Thunderwave", time: "1 action", range: "Self (15ft cube)", comp: "V, S", dur: "Instant", desc: "15ft cube vanuit jou. CON save of 2d8 thunder damage en 10ft weggeduwd. Half damage bij save, niet geduwd. Luid geluid tot 300ft." },
                { name: "Witch Bolt", time: "1 action", range: "30ft", comp: "V, S, M (een takje van een boom die door bliksem is geraakt)", dur: "Concentration, 1 min", desc: "Ranged spell attack, 1d12 lightning damage. Concentration: action elke beurt voor automatisch 1d12 damage. 30ft." },
                { name: "Chaos Bolt", time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Ranged spell attack, 2d8+1d6 damage. Type bepaald door d8 roll. Bij dubbele d8: bolt springt naar een nieuw target!" },
                { name: "Absorb Elements", time: "1 reaction", range: "Self", comp: "S", dur: "1 ronde", desc: "Reaction bij acid/cold/fire/lightning/thunder damage. Resistance tegen die damage. Volgende melee attack doet +1d6 van dat type." }
            ],

            // 2ND LEVEL
            2: [
                { name: "Alter Self", time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 1 uur", desc: "Concentration, 1 uur. Verander je uiterlijk, groei aquatic adaptations, of krijg natural weapons (1d6+STR, magic)." },
                { name: "Blindness/Deafness", time: "1 action", range: "30ft", comp: "V", dur: "1 min", desc: "CON save of een creature wordt blind of deaf. Duurt 1 minuut, save elk einde van beurt. Schaalt +1 target per slot." },
                { name: "Blur", time: "1 action", range: "Self", comp: "V", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Attackers hebben disadvantage op attack rolls tegen jou. Werkt niet tegen creatures met truesight of blindsight." },
                { name: "Cloud of Daggers", time: "1 action", range: "60ft", comp: "V, S, M (een glasscherf)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 5ft cube met draaiende dolken. 4d4 slashing damage aan creatures die erin starten. 60ft. Schaalt +2d4." },
                { name: "Crown of Madness", time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save of target moet melee attack doen tegen een creature naar jouw keuze. Save elke beurt." },
                { name: "Darkness", time: "1 action", range: "60ft", comp: "V, M (vleermuisvacht en een druppel pek of stukje kool)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. 15ft radius magische duisternis. Blokkeert darkvision en niet-magisch licht. Op object castbaar." },
                { name: "Darkvision", time: "1 action", range: "Touch", comp: "V, S, M (een gedroogde wortel of een snufje kattenhaar)", dur: "8 uur", desc: "Touch, 8 uur. Target krijgt darkvision tot 60ft." },
                { name: "Detect Thoughts", time: "1 action", range: "Self", comp: "V, S, M (een koperen stuk)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Lees oppervlaktegedachten. Action om dieper te graven (WIS save). Detecteer denkende creatures door barrières." },
                { name: "Enhance Ability", time: "1 action", range: "Touch", comp: "V, S, M (haar of veer van een dier)", dur: "Concentration, 1 uur", desc: "Concentration, 1 uur. Kies een van 6 buffs: advantage op checks van een ability score, plus extra effecten. Schaalt +1 target." },
                { name: "Enlarge/Reduce", time: "1 action", range: "30ft", comp: "V, S, M (een snufje ijzerpoeder)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. CON save. Enlarge: +1d4 weapon damage, advantage STR checks. Reduce: -1d4 damage, disadvantage STR." },
                { name: "Gust of Wind", time: "1 action", range: "Self (60ft line)", comp: "V, S, M (een zaad van een peul)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 60ft lijn van sterke wind. STR save of 15ft weggeduwd. Difficult terrain met de wind mee." },
                { name: "Hold Person", time: "1 action", range: "60ft", comp: "V, S, M (een stukje ijzer)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save of een humanoid is paralyzed. Save elke beurt. Schaalt +1 target per hogere slot." },
                { name: "Invisibility", time: "1 action", range: "Touch", comp: "V, S, M (een wimper gehuld in gum arabic)", dur: "Concentration, 1 uur", desc: "Concentration, 1 uur. Een creature dat je aanraakt wordt onzichtbaar. Eindigt bij aanval of spell casten. Schaalt +1 target." },
                { name: "Knock", time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Open een gesloten deur, kist of hangslot (magisch of niet). Produceert een luid geluid hoorbaar tot 300ft." },
                { name: "Levitate", time: "1 action", range: "60ft", comp: "V, S, M (een kleine leren lus of een stukje goudgaren)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Een creature of object (tot 500 lbs) stijgt 20ft. Target kan zich voortbewegen door ergens af te zetten." },
                { name: "Mirror Image", time: "1 action", range: "Self", comp: "V, S", dur: "1 min", desc: "Drie illusoire duplicaten verschijnen. Aanvallen raken mogelijk een duplicaat (AC 10+DEX). Duplicaat verdwijnt bij een hit. Duurt 1 min." },
                { name: "Misty Step", time: "1 bonus action", range: "Self", comp: "V", dur: "Instant", desc: "Bonus action: teleporteer tot 30ft naar een plek die je kunt zien." },
                { name: "Phantasmal Force", time: "1 action", range: "60ft", comp: "V, S, M (een beetje fleece)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. INT save of target percipieert een illusie die 1d6 psychic damage per beurt kan doen. Investigation check." },
                { name: "Scorching Ray", time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Drie stralen van vuur. Ranged spell attack per straal, 2d6 fire damage elk. Schaalt +1 straal per hogere slot." },
                { name: "See Invisibility", time: "1 action", range: "Self", comp: "V, S, M (een snufje talk en zilverpoeder)", dur: "1 uur", desc: "Je ziet onzichtbare creatures en objecten. Je ziet ook het Ethereal Plane. Duurt 1 uur." },
                { name: "Shatter", time: "1 action", range: "60ft", comp: "V, S, M (een glassplinter of stukje mica)", dur: "Instant", desc: "10ft radius, 60ft range. CON save of 3d8 thunder damage (half bij save). Inorganic materiaal heeft disadvantage. Schaalt +1d8." },
                { name: "Spider Climb", time: "1 action", range: "Touch", comp: "V, S, M (een druppel bitumen en een spin)", dur: "Concentration, 1 uur", desc: "Concentration, 1 uur. Target kan klimmen op elke ondergrond inclusief plafonds, handen vrij. Touch." },
                { name: "Suggestion", time: "1 action", range: "30ft", comp: "V, M (een slangetong en een stukje honingraat of een druppel zoete olie)", dur: "Concentration, 8 uur", desc: "Concentration, 8 uur. WIS save of target volgt een redelijk-klinkende suggestie van maximaal twee zinnen op." },
                { name: "Web", time: "1 action", range: "60ft", comp: "V, S, M (een beetje spinnenweb)", dur: "Concentration, 1 uur", desc: "Concentration, 1 uur. 20ft cube webs. DEX save of restrained. Moeilijk terrein. Brandbaar (2d4 fire per beurt)." }
            ],

            // 3RD LEVEL
            3: [
                { name: "Blink", time: "1 action", range: "Self", comp: "V, S", dur: "1 min", desc: "Rol einde beurt d20: 11+ verdwijn naar Ethereal Plane tot begin volgende beurt. Duurt 1 minuut." },
                { name: "Clairvoyance", time: "10 minutes", range: "1 mile", comp: "V, S, M (een focus ter waarde van minstens 100gp)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Creëer een onzichtbare sensor op een bekende plek tot 1 mijl. Zie of hoor door de sensor." },
                { name: "Counterspell", time: "1 reaction", range: "60ft", comp: "S", dur: "Instant", desc: "Reaction: annuleer een spell van 3rd level of lager automatisch. Hogere spells: ability check DC 10 + spell level." },
                { name: "Daylight", time: "1 action", range: "60ft", comp: "V, S", dur: "1 uur", desc: "60ft radius bright light + 60ft dim light vanuit een punt of object. Duurt 1 uur. Verdrijft magische duisternis van 3rd level of lager." },
                { name: "Dispel Magic", time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "Beëindig een magisch effect van 3rd level of lager automatisch. Hogere effecten: ability check DC 10 + spell level." },
                { name: "Fear", time: "1 action", range: "Self (30ft cone)", comp: "V, S, M (een witte veer of het hart van een kip)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 30ft cone. WIS save of frightened en moet Dash weg van jou. Save elke beurt (met line of sight naar jou)." },
                { name: "Fireball", time: "1 action", range: "150ft", comp: "V, S, M (een klein balletje vleermuismest en zwavel)", dur: "Instant", desc: "20ft radius explosie op een punt binnen 150ft. DEX save of 8d6 fire damage (half bij save). Schaalt +1d6 per hogere slot." },
                { name: "Fly", time: "1 action", range: "Touch", comp: "V, S, M (een veertje van een vogelvleugel)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Target krijgt 60ft flying speed. Bij einde: valt als het nog in de lucht is. Schaalt +1 target." },
                { name: "Gaseous Form", time: "1 action", range: "Touch", comp: "V, S, M (een beetje gaas en een wisje rook)", dur: "Concentration, 1 uur", desc: "Concentration, 1 uur. Target wordt een mistige wolk. Flying speed 10ft, resistance tegen nonmagical damage, kan door kleine openingen." },
                { name: "Haste", time: "1 action", range: "30ft", comp: "V, S, M (een snufje zoethout wortelpoeder)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Target krijgt +2 AC, double speed, advantage DEX saves, en een extra action per beurt. Bij einde: een beurt lang geen movement of actions." },
                { name: "Hypnotic Pattern", time: "1 action", range: "120ft", comp: "S, M (een gloeiend stokje wierook of een kristallen flesje met fosforescentie)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 30ft cube, 120ft range. WIS save of charmed en incapacitated. Stopt als target damage neemt of wakker geschud wordt." },
                { name: "Lightning Bolt", time: "1 action", range: "Self (100ft line)", comp: "V, S, M (een beetje vacht en een staaf van barnsteen, kristal of glas)", dur: "Instant", desc: "100ft lijn, 5ft breed. DEX save of 8d6 lightning damage (half bij save). Steekt brandbaar materiaal aan. Schaalt +1d6." },
                { name: "Major Image", time: "1 action", range: "120ft", comp: "V, S, M (een beetje fleece)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Creëer een illusie tot 20ft cube met geluid, geur en temperatuur. 120ft. Investigation check." },
                { name: "Protection from Energy", time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 uur", desc: "Concentration, 1 uur. Touch. Target krijgt resistance tegen een gekozen damage type (acid/cold/fire/lightning/thunder)." },
                { name: "Sleet Storm", time: "1 action", range: "150ft", comp: "V, S, M (een snufje stof en een paar druppels water)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 40ft radius, 150ft range. Difficult terrain, heavily obscured. CON save of prone. Concentration check DC 12." },
                { name: "Slow", time: "1 action", range: "120ft", comp: "V, S, M (een druppel stroop)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Tot 6 creatures. WIS save of -2 AC, -2 DEX saves, geen reactions, halve speed, max 1 attack, en 50% kans spell mislukt." },
                { name: "Stinking Cloud", time: "1 action", range: "90ft", comp: "V, S, M (een rot ei of koolbladeren)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 20ft radius giftige mist. CON save of je beurt verliezen aan kokhalzen. 90ft. Spreidt met wind." },
                { name: "Tongues", time: "1 action", range: "Touch", comp: "V, M (een kleine kleipiramide)", dur: "1 uur", desc: "Touch, 1 uur. Target begrijpt elke gesproken taal en wordt begrepen door creatures die een taal kennen." },
                { name: "Water Breathing", time: "1 action", range: "30ft", comp: "V, S, M (een korte rietstengel of stukje stro)", dur: "24 uur", desc: "Ritual. Tot 10 creatures kunnen ademen onder water. Duurt 24 uur." },
                { name: "Water Walk", time: "1 action", range: "30ft", comp: "V, S, M (een stukje kurk)", dur: "1 uur", desc: "Ritual. Tot 10 creatures kunnen lopen over vloeistofoppervlakken. Duurt 1 uur." }
            ],

            // 4TH LEVEL
            4: [
                { name: "Banishment", time: "1 action", range: "60ft", comp: "V, S, M (een item dat het target weerzinwekkend vindt)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. CHA save of target verdwijnt naar een harmless demiplane (of thuisplane als het een extraplanar is). Schaalt +1 target." },
                { name: "Blight", time: "1 action", range: "30ft", comp: "V, S", dur: "Instant", desc: "CON save of 8d8 necrotic damage (half bij save). Plant creatures hebben disadvantage en nemen max damage. 30ft." },
                { name: "Confusion", time: "1 action", range: "90ft", comp: "V, S, M (drie notenschalen)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 10ft radius, 90ft. WIS save of random actie elke beurt (d10 bepaalt gedrag). Save elke beurt." },
                { name: "Dimension Door", time: "1 action", range: "500ft", comp: "V", dur: "Instant", desc: "Teleporteer jezelf (en optioneel 1 willing creature) tot 500ft naar een plek die je kunt beschrijven of voorstellen." },
                { name: "Dominate Beast", time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save of een beast volgt jouw telepathische commando's. Save bij damage. Hogere slots = langere duur." },
                { name: "Greater Invisibility", time: "1 action", range: "Touch", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Target wordt onzichtbaar. Eindigt NIET bij aanval of spell casten!" },
                { name: "Ice Storm", time: "1 action", range: "300ft", comp: "V, S, M (een snufje stof en een paar druppels water)", dur: "Instant", desc: "20ft radius, 300ft range. DEX save of 2d8 bludgeoning + 4d6 cold (half bij save). Gebied wordt difficult terrain. Schaalt." },
                { name: "Polymorph", time: "1 action", range: "60ft", comp: "V, S, M (een rups-cocon)", dur: "Concentration, 1 uur", desc: "Concentration, 1 uur. WIS save. Transformeer een creature in een beast met CR ≤ target's level. Nieuwe HP, reverteert bij 0 HP." },
                { name: "Stoneskin", time: "1 action", range: "Touch", comp: "V, S, M (diamantstof ter waarde van 100gp, wordt verbruikt)", dur: "Concentration, 1 uur", desc: "Concentration, 1 uur. Touch, 100gp diamant. Resistance tegen nonmagical bludgeoning, piercing en slashing damage." },
                { name: "Wall of Fire", time: "1 action", range: "120ft", comp: "V, S, M (een stukje fosforus)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 60ft lang of 20ft diameter ring, 20ft hoog. 5d8 fire damage bij binnentreden of starten. Eén zijde doet damage." }
            ],

            // 5TH LEVEL
            5: [
                { name: "Animate Objects", time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Animeer tot 10 kleine objecten. Ze hebben AC, HP, en een bonus action om te aanvallen. Schaalt +2 objecten." },
                { name: "Cloudkill", time: "1 action", range: "120ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. 20ft radius giftige mist. CON save of 5d8 poison (half bij save). Beweegt 10ft per beurt met de wind." },
                { name: "Cone of Cold", time: "1 action", range: "Self (60ft cone)", comp: "V, S, M (een kleine kristallen of glazen kegel)", dur: "Instant", desc: "60ft cone. CON save of 8d8 cold damage (half bij save). Gedode creatures worden bevroren. Schaalt +1d8." },
                { name: "Creation", time: "1 minute", range: "30ft", comp: "V, S, M (een stukje van het te creëren materiaal)", dur: "Speciaal", desc: "Maak een niet-levend object van plantaardig of mineraal materiaal. Grootte tot 5ft cube. Duur afhankelijk van materiaal." },
                { name: "Dominate Person", time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save of een humanoid volgt jouw telepathische commando's. Save bij damage. Hogere slots = langere duur." },
                { name: "Hold Monster", time: "1 action", range: "90ft", comp: "V, S, M (een stukje ijzer)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. WIS save of paralyzed. Werkt op elk creature type. Save elke beurt. Schaalt +1 target." },
                { name: "Insect Plague", time: "1 action", range: "300ft", comp: "V, S, M (een paar suikerkorrels, wat graankorrels en een veeg vet)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. 20ft radius zwerm, 300ft. CON save of 4d10 piercing (half bij save). Difficult terrain. Schaalt +1d10." },
                { name: "Seeming", time: "1 action", range: "30ft", comp: "V, S", dur: "8 uur", desc: "Verander het uiterlijk van elke creature binnen 30ft. Duurt 8 uur. CHA save als target unwilling. Investigation check." },
                { name: "Telekinesis", time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Beweeg een creature of object tot 1000 lbs. Creatures: contested ability check. 60ft range." },
                { name: "Teleportation Circle", time: "1 minute", range: "10ft", comp: "V, M (zeldzaam krijt en inkt met edelstenen ter waarde van 50gp, wordt verbruikt)", dur: "1 ronde", desc: "Teken een cirkel die je teleporteert naar een permanente sigil sequence die je kent. 10ft radius. Duurt 1 ronde." },
                { name: "Wall of Stone", time: "1 action", range: "120ft", comp: "V, S, M (een klein blok graniet)", dur: "Concentration, 10 min", desc: "Concentration, 10 min. 10 panelen van 10x10ft steen, 6 inches dik. Elk paneel AC 15, 30 HP. Kan permanent worden." },
                { name: "Synaptic Static", time: "1 action", range: "120ft", comp: "V, S", dur: "Instant", desc: "20ft radius, 120ft. INT save of 8d6 psychic damage (half bij save). Gefaalde targets: -1d6 van attack rolls, checks en concentration saves, 1 min." }
            ],

            // 6TH LEVEL
            6: [
                { name: "Arcane Gate", time: "1 action", range: "500ft", comp: "V, S", dur: "Concentration, 10 min", desc: "Concentration, 10 min. Twee gelinkte portalen binnen 500ft. Creatures kunnen er doorheen stappen in beide richtingen." },
                { name: "Chain Lightning", time: "1 action", range: "150ft", comp: "V, S, M (een beetje vacht, een stukje barnsteen, glas of kristallen staaf, en drie zilveren pinnen)", dur: "Instant", desc: "Bliksemschicht raakt een target en springt naar 3 extra targets binnen 30ft. DEX save of 10d8 lightning (half bij save). Schaalt." },
                { name: "Circle of Death", time: "1 action", range: "150ft", comp: "V, S, M (het poeder van een verpletterde zwarte parel ter waarde van minstens 500gp)", dur: "Instant", desc: "60ft radius, 150ft range. CON save of 8d6 necrotic damage (half bij save). 500gp materiaal component." },
                { name: "Disintegrate", time: "1 action", range: "60ft", comp: "V, S, M (een lodestone en een snufje stof)", dur: "Instant", desc: "Ranged spell attack-achtige DEX save. 10d6+40 force damage. Bij 0 HP: target wordt volledig tot stof gereduceerd. 60ft." },
                { name: "Eyebite", time: "1 action", range: "Self", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Elke beurt als action: sleep, panic, of sicken een creature dat je aankijkt. WIS save." },
                { name: "Globe of Invulnerability", time: "1 action", range: "Self (10ft radius)", comp: "V, S, M (een glazen of kristallen kraal die uiteenspat als de spell eindigt)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 10ft radius bol. Spells van 5th level of lager kunnen de bol niet penetreren. Schaalt." },
                { name: "Mass Suggestion", time: "1 action", range: "60ft", comp: "V, M (een slangetong en een stukje honingraat of een druppel zoete olie)", dur: "24 uur", desc: "Suggereer een activiteit aan tot 12 creatures. WIS save. Geen concentration, duurt 24 uur." },
                { name: "Move Earth", time: "1 action", range: "120ft", comp: "V, S, M (een ijzeren kling en een klein zakje met aarde, klei en zand)", dur: "Concentration, 2 uur", desc: "Concentration, 2 uur. Verplaats aarde in een 40ft vierkant. 120ft range. Reshape terrein over tijd." },
                { name: "Sunbeam", time: "1 action", range: "Self (60ft line)", comp: "V, S, M (een vergrootglas, een stukje zonnesteen, en een zaad van een vuurplant)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 60ft lijn van licht. CON save of 6d8 radiant en blind. Undo darkness. Action elke beurt herhalen." },
                { name: "True Seeing", time: "1 action", range: "Touch", comp: "V, S, M (zalf voor de ogen ter waarde van 25gp, gemaakt van paddenstoelpoeder, saffraan en vet, wordt verbruikt)", dur: "1 uur", desc: "Touch, 1 uur. Target ziet in duisternis, ziet onzichtbare creatures, illusies doorzien, en het Ethereal Plane. 120ft truesight." }
            ],

            // 7TH LEVEL
            7: [
                { name: "Delayed Blast Fireball", time: "1 action", range: "150ft", comp: "V, S, M (een klein balletje vleermuismest en zwavel)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. Gloeiende korrel op een punt. Ontploft bij concentration einde: 12d6 fire +1d6 per extra ronde gewacht. 150ft." },
                { name: "Etherealness", time: "1 action", range: "Self", comp: "V, S", dur: "8 uur", desc: "Stap naar het Ethereal Plane. Je kunt de Material Plane zien (60ft, grijs). Duurt 8 uur. Schaalt +3 targets per slot." },
                { name: "Finger of Death", time: "1 action", range: "60ft", comp: "V, S", dur: "Instant", desc: "CON save of 7d8+30 necrotic (half bij save). Humanoids gedood door deze spell staan op als zombie onder jouw controle." },
                { name: "Fire Storm", time: "1 action", range: "150ft", comp: "V, S", dur: "Instant", desc: "Tot 10 cubes van 10ft in een gebied binnen 150ft. DEX save of 7d10 fire (half bij save). Kies of het planten aansteekt." },
                { name: "Plane Shift", time: "1 action", range: "Touch", comp: "V, S, M (een gevorkte metalen staaf ter waarde van minstens 250gp, afgestemd op het doelplane)", dur: "Instant", desc: "Touch. Teleporteer jezelf en tot 8 willing creatures naar een ander plane. Of ranged CHA save om een target te banishen." },
                { name: "Prismatic Spray", time: "1 action", range: "Self (60ft cone)", comp: "V, S", dur: "Instant", desc: "60ft cone. Elke creature rolt d8 voor een random effect: fire/acid/lightning/poison/cold/petrification/banishment. DEX save." },
                { name: "Reverse Gravity", time: "1 action", range: "100ft", comp: "V, S, M (een lodestone en ijzervijlsel)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 50ft radius, 100ft hoog. Alles valt omhoog. DEX save om iets vast te grijpen." },
                { name: "Teleport", time: "1 action", range: "10ft", comp: "V", dur: "Instant", desc: "Teleporteer jezelf en tot 8 willing creatures naar een bekende locatie. Kans op mishap afhankelijk van bekendheid." }
            ],

            // 8TH LEVEL
            8: [
                { name: "Dominate Monster", time: "1 action", range: "60ft", comp: "V, S", dur: "Concentration, 1 uur", desc: "Concentration, 1 uur. WIS save of elk type creature volgt jouw telepathische commando's. Save bij damage. Schaalt in duur." },
                { name: "Earthquake", time: "1 action", range: "500ft", comp: "V, S, M (een snufje aarde, een stukje rots en een klomp klei)", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 100ft radius. CON save of prone. Fissures, structurele schade, instorting van gebouwen." },
                { name: "Incendiary Cloud", time: "1 action", range: "150ft", comp: "V, S", dur: "Concentration, 1 min", desc: "Concentration, 1 min. 20ft radius brandende wolk. DEX save of 10d8 fire (half bij save) elke beurt. Beweegt 10ft/ronde." },
                { name: "Power Word Stun", time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Kies een creature met 150 HP of minder: het is stunned. Geen save. CON save elke beurt om te eindigen." },
                { name: "Sunburst", time: "1 action", range: "150ft", comp: "V, S, M (vuur en een stukje zonnesteen)", dur: "Instant", desc: "60ft radius, 150ft range. CON save of 12d6 radiant en blind 1 min. Verdrijft magische duisternis." }
            ],

            // 9TH LEVEL
            9: [
                { name: "Gate", time: "1 action", range: "60ft", comp: "V, S, M (een diamant ter waarde van minstens 5000gp)", dur: "Concentration, 1 min", desc: "Open een portaal naar een ander plane of roep een specifiek wezen op bij naam. Het portaal is tweezijdig. Concentration, 1 min." },
                { name: "Meteor Swarm", time: "1 action", range: "1 mile", comp: "V, S", dur: "Instant", desc: "Vier 40ft radius explosies op punten binnen 1 mijl. DEX save of 20d6 fire + 20d6 bludgeoning (half bij save)." },
                { name: "Power Word Kill", time: "1 action", range: "60ft", comp: "V", dur: "Instant", desc: "Kies een creature met 100 HP of minder: het sterft onmiddellijk. Geen save." },
                { name: "Time Stop", time: "1 action", range: "Self", comp: "V", dur: "Instant", desc: "Stop de tijd voor 1d4+1 beurten. Je handelt alleen. Eindigt als je een ander creature beïnvloedt of beschadigt." },
                { name: "Wish", time: "1 action", range: "Self", comp: "V", dur: "Instant", desc: "De machtigste spell. Dupliceer elke spell van 8th level of lager, of creëer een ander effect naar DM's oordeel. Risicovol bij creatief gebruik." },
                { name: "Psychic Scream", time: "1 action", range: "90ft", comp: "S", dur: "Instant", desc: "Tot 10 creatures binnen 90ft. INT save of 14d6 psychic damage en stunned. Bij falen met INT 2 of lager: hoofd ontploft." }
            ]
        }
    }
};

// Default dashboard layouts per character × tab × device (proposal 2026-10-23).
// Run: node Metadocs/Dashboards/default-layouts.mjs  → writes default-layouts.json
// Widgets use the saved-dashboard shape (type, globalCol, startRowIdx, spanUnits,
// spanUnitsY), so a layout can later be seeded 1:1 into dashboardsByDevice.
// Phone layouts are not stored: wg-mobile.js derives them from desktop; the
// derived order is computed here with the same rule (column-major, HP first,
// portrait last).
import { writeFileSync, existsSync, readFileSync as readF } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GRID = {
  desktop: { cols: 47, rows: 18, pageCols: 47, note: 'Measured in the app at a 1904×874 browser viewport (≈ 1920×1080 screen): 47 × 18 tiles. Laptops of ~1366–1440 px show ~31–33 columns: everything right of the dashed line moves to page 2.' },
  tablet:  { cols: 44, rows: 30, pageCols: 22, note: 'Portrait tablet 810–834 px wide (measured: 23 × 32 tiles at 820 × 1180); designed on a safe 22 × 30 page. Page 1 = what you need at the table, page 2 = the rest.' },
};
const LAPTOP_COLS = 31;

const WIDGETS = {
  profilePicture:  { label: 'Profile picture',  cat: 'character' },
  basicInfo:       { label: 'Character Info',   cat: 'character' },
  abilityScores:   { label: 'Ability Scores',   cat: 'stats' },
  savingThrows:    { label: 'Saving Throws',    cat: 'stats' },
  skills:          { label: 'Skills',           cat: 'stats' },
  hpBase:          { label: 'Hit Points',       cat: 'stats' },
  conditions:      { label: 'Conditions',       cat: 'combat' },
  longRest:        { label: 'Rest',             cat: 'stats' },
  levelUp:         { label: 'Level Up',         cat: 'stats' },
  classResource:   { label: 'Resources',        cat: 'stats' },
  featuresActive:  { label: 'Active Features',  cat: 'stats' },
  featuresPassive: { label: 'Passive Features', cat: 'stats' },
  preparedSpells:  { label: 'Prepared Spells',  cat: 'spells' },
  spellSlots:      { label: 'Spell Slots',      cat: 'spells' },
  attacks:         { label: 'Attacks',          cat: 'combat' },
  turnActions:     { label: 'Your Turn',        cat: 'combat' },
  initiativeTracker: { label: 'Initiative Tracker', cat: 'combat' },
  map:             { label: 'Campaign map',     cat: 'exploring' },
  inventory:       { label: 'Inventory',        cat: 'inventory' },
};

// ---- layout DSL: columns of stacked widgets; a `row` splits a band sideways
const W = (t, h) => ({ t, h });
const row = (h, ...parts) => ({ row: parts.map(([t, w]) => ({ t, w })), h });
const col = (w, ...items) => ({ w, items: items.filter(Boolean) });
const gap = w => ({ w, items: [] });

function place(columns, startCol = 0) {
  const out = [];
  let x = startCol;
  for (const c of columns) {
    let y = 0;
    for (const it of c.items) {
      if (it.row) {
        let rx = x;
        for (const p of it.row) {
          out.push({ type: p.t, globalCol: rx, startRowIdx: y, spanUnits: p.w, spanUnitsY: it.h });
          rx += p.w;
        }
      } else {
        out.push({ type: it.t, globalCol: x, startRowIdx: y, spanUnits: c.w, spanUnitsY: it.h });
      }
      y += it.h;
    }
    x += c.w;
  }
  return out;
}
const pages = (...pageCols) => pageCols.flatMap((cols, i) => place(cols, i * GRID.tablet.pageCols));

// ---- characters (snapshot 2026-09-26; designed for levels 3–5)
const CHARS = [
  { id: 'ren', name: 'Ren Ashvane', cls: 'Rogue · Soulknife', species: 'Aasimar', bg: 'Criminal', level: 3,
    caster: false, res: 3, resList: 'Psionic Energy Dice, Healing Hands, Celestial Revelation',
    focus: 'Stealth & skills specialist without spells: Your Turn and Skills carry the dashboard; Psionic Energy Dice are his "spell slots".' },
  { id: 'saya', name: 'Saya Ashvane', cls: 'Sorcerer', species: 'Aasimar', bg: 'Hermit', level: 1,
    caster: true, res: 4, resList: 'Innate Sorcery, Sorcery Points (L2), Healing Hands, Celestial Revelation (L3)',
    focus: 'Full caster with CHA 17: spells and Sorcery Points up front; strong on the Social tab.' },
  { id: 'addybluelight', name: 'Addy Bluelight', cls: 'Sorcerer', species: 'High Elf', bg: 'Merchant', level: 1,
    caster: true, res: 2, resList: 'Innate Sorcery, Sorcery Points (L2)',
    focus: 'Caster and trader: like Saya, plus Inventory on the Social tab for bargaining.' },
  { id: 'ancha', name: 'Ancha', cls: 'Ranger · Hunter', species: 'Human', bg: 'Guide', level: 1,
    caster: true, smallCaster: true, res: 1, resList: 'Favored Enemy (free Hunter\'s Mark)',
    focus: 'Scout and archer (DEX/WIS 17): Exploring is her main tab; little on Social (CHA 8).' },
  { id: 'barius', name: 'Bastion Ember', cls: 'Paladin · Vengeance', species: 'Tiefling', bg: 'Soldier', level: 3,
    caster: true, smallCaster: true, res: 3, resList: 'Lay on Hands, Paladin\'s Smite, Channel Divinity (Vow of Enmity)',
    focus: 'Frontliner with healing pool and smites: Resources and Attacks dominate Combat.' },
  { id: 'io', name: 'Io Starbloom', cls: 'Druid · Circle of the Land', species: 'Aasimar', bg: 'Scribe', level: 3,
    caster: true, res: 3, resList: 'Wild Shape (also fuels Land\'s Aid), Healing Hands, Celestial Revelation',
    focus: 'Utility and nature caster: big spell list on Exploring (rituals), Wild Shape on every tab.' },
  { id: 'lira', name: 'Lyra Moonwhisper', cls: 'Wizard · Divination', species: 'High Elf', bg: 'Sage', level: 3,
    caster: true, res: 2, resList: 'Portent, Arcane Recovery',
    focus: 'Knowledge caster: Portent on every tab, rituals and INT skills on Exploring.' },
  { id: 'nero', name: 'Nero', cls: 'Warlock · Fiend', species: 'Tiefling', bg: 'Noble', level: 1,
    caster: true, res: 2, resList: 'Magical Cunning (L2), Dark One\'s Own Luck (L6)',
    focus: 'Face of the party (CHA 19): the Social tab is his biggest; few slots, so Pact slots stay visible in Combat.' },
  { id: 'varragoth', name: 'Varragoth Sarulf', cls: 'Fighter · Eldritch Knight', species: 'Tiefling', bg: 'Guard', level: 3,
    caster: true, smallCaster: true, res: 2, resList: 'Second Wind, Action Surge',
    focus: 'Heavy hitter (STR 17) with a little magic (Shield): Attacks and Your Turn up front, spells small.' },
];

const resH = c => (c.res >= 4 ? 5 : c.res === 3 ? 4 : 3);

// ================= DESKTOP (46 × 18) =================
function deskCharacter(c) {
  const r = resH(c);
  const left = col(8, W('profilePicture', 9), W('basicInfo', 5), row(3, ['levelUp', 4], ['longRest', 4]));
  const mid = col(12, W('abilityScores', 3), W('savingThrows', 3), W('skills', 7), row(5, ['hpBase', 4], ['conditions', 8]));
  if (!c.caster) {
    return place([left, mid, col(9, W('classResource', 5), W('featuresActive', 13)), col(10, W('featuresPassive', 18))]);
  }
  const prepH = c.smallCaster ? 8 : 15;
  const spells = col(8, W('spellSlots', 3), W('preparedSpells', prepH), c.smallCaster ? W('attacks', 5) : null);
  return place([left, mid, spells, col(10, W('classResource', r), W('featuresActive', 7), W('featuresPassive', 18 - r - 7))]);
}

const status = (c, { rest = true, res = true } = {}) =>
  col(5, W('hpBase', 4), W('conditions', 5), res ? W('classResource', resH(c)) : null, rest ? W('longRest', 2) : null);

function deskSocial(c) {
  const who = col(8, W('profilePicture', 9), W('basicInfo', 6));
  const talk = col(12, W('skills', 7), W('abilityScores', 3), W('featuresPassive', 8));
  const cols = [status(c, { res: false }), who, talk];
  if (c.id === 'nero') cols.push(col(9, W('preparedSpells', 12), W('spellSlots', 3)), col(9, W('featuresActive', 10)));
  else if (c.id === 'ancha') cols.push(col(8, W('featuresActive', 7)));
  else if (c.caster) cols.push(col(8, W('preparedSpells', 12), W('spellSlots', 3)));
  else cols.push(col(8, W('featuresActive', 9), W('classResource', resH(c))));
  if (c.id === 'addybluelight') cols.push(col(9, W('inventory', 12)));
  if (c.id === 'barius') cols.push(col(8, W('featuresActive', 7)));
  return place(cols);
}

function deskExploring(c) {
  const bigSkills = c.id === 'ancha' || c.id === 'ren';
  const mapCol = col(20, W('map', 15), W('abilityScores', 3));
  const senses = col(12, W('skills', bigSkills ? 9 : 7), W('featuresPassive', bigSkills ? 9 : 11));
  const cols = [status(c), mapCol, senses];
  if (!c.caster) cols.push(col(9, W('featuresActive', 9), W('inventory', 9)));
  else if (c.id === 'io' || c.id === 'lira') cols.push(col(9, W('spellSlots', 3), W('preparedSpells', 15)));
  else cols.push(col(9, W('spellSlots', 3), W('preparedSpells', c.smallCaster ? 7 : 11), W('featuresActive', c.smallCaster ? 8 : 4)));
  return place(cols);
}

function deskCombat(c) {
  const turn = col(10, W('turnActions', 15), W('savingThrows', 3));
  let gear;
  if (!c.caster) gear = col(8, W('attacks', 5), W('featuresActive', 13));
  else if (c.smallCaster) gear = col(8, W('attacks', c.id === 'varragoth' ? 6 : 5), W('spellSlots', 3), W('preparedSpells', c.id === 'varragoth' ? 5 : 6), W('featuresActive', c.id === 'varragoth' ? 4 : 4));
  else gear = col(8, W('attacks', 4), W('spellSlots', 3), W('preparedSpells', 11));
  const cols = [status(c, { rest: false }), turn, gear, col(12, W('initiativeTracker', 13))];
  if (c.caster && !c.smallCaster) cols.push(col(9, W('featuresActive', 10), W('abilityScores', 3)));
  else cols.push(col(9, W('featuresPassive', 10), W('skills', 8)));
  return place(cols);
}

function deskInventory(c) {
  const side = col(8, W('attacks', c.caster && !c.smallCaster ? 4 : 6), W('abilityScores', 3), W('basicInfo', 5));
  const cols = [col(24, W('inventory', 16)), side];
  if (c.id === 'lira' || c.id === 'io') cols.push(col(8, W('preparedSpells', 12)));
  if (c.id === 'addybluelight') cols.push(col(8, W('skills', 7)));
  return place(cols);
}

// ================= TABLET (2 pages × 21 cols, 26 rows) =================
function tabCharacter(c) {
  const r = resH(c);
  const p1 = [
    col(9, W('profilePicture', 9), W('basicInfo', 5), W('abilityScores', 3), W('savingThrows', 3), row(4, ['hpBase', 4], ['levelUp', 5]), W('longRest', 2)),
    col(12, W('skills', 8), W('conditions', 5), W('classResource', r), W('featuresActive', 26 - 8 - 5 - r)),
  ];
  const p2 = c.caster
    ? [col(10, W('spellSlots', 3), W('preparedSpells', 17)), col(11, W('featuresPassive', 20))]
    : [col(21, W('featuresPassive', 20))];
  return pages(p1, p2);
}
function tabSocial(c) {
  const p1 = [
    col(9, W('profilePicture', 9), W('basicInfo', 6), W('hpBase', 4), W('conditions', 5)),
    col(12, W('skills', 8), W('abilityScores', 3), c.caster && c.id !== 'ancha' ? W('preparedSpells', 12) : W('featuresActive', 10)),
  ];
  const p2 = [col(11, W('featuresPassive', 14))];
  if (c.id === 'nero') p2.push(col(10, W('featuresActive', 10), W('spellSlots', 3)));
  if (c.id === 'addybluelight') p2.push(col(10, W('inventory', 14)));
  return pages(p1, p2);
}
function tabExploring(c) {
  const p1 = [
    col(21, W('map', 14), row(5, ['hpBase', 5], ['conditions', 7], ['classResource', 9]), row(7, ['skills', 21])),
  ];
  const p2 = [col(11, W('featuresPassive', 14), W('longRest', 2))];
  if (c.caster) p2.push(col(10, W('spellSlots', 3), W('preparedSpells', 15)));
  else p2.push(col(10, W('featuresActive', 9), W('inventory', 9)));
  return pages(p1, p2);
}
function tabCombat(c) {
  const right = c.caster
    ? col(11, W('attacks', 4), W('spellSlots', 3), W('preparedSpells', c.smallCaster ? 7 : 10), W('classResource', resH(c)))
    : col(11, W('attacks', 5), W('classResource', resH(c)), W('featuresActive', 10));
  const p1 = [col(10, W('hpBase', 4), W('conditions', 5), W('turnActions', 14), W('savingThrows', 3)), right];
  const p2 = [col(12, W('initiativeTracker', 14)), col(9, c.caster ? W('featuresActive', 12) : W('skills', 12))];
  return pages(p1, p2);
}
function tabInventory(c) {
  const p1 = [col(21, W('inventory', 18), row(5, ['attacks', 12], ['abilityScores', 9]))];
  const p2 = [col(10, W('basicInfo', 6))];
  if (c.id === 'lira' || c.id === 'io') p2.push(col(11, W('preparedSpells', 14)));
  return pages(p1, p2);
}

// ---- per-tab intent (same for everyone) + per-character notes
const TAB_INTENT = {
  character: 'The full sheet: who you are, your numbers, and what you can do. Level Up and Rest live here.',
  social:    'Talking, bargaining and lying: portrait and info for roleplay, CHA/WIS skills, spells that help in a conversation.',
  exploring: 'Travel and searching: the map in the middle, Perception/Survival/Stealth, senses (passive features) and utility spells.',
  combat:    'Your turn at a glance: HP and Conditions top-left, Your Turn in the middle, attacks/spells beside it, the shared Initiative Tracker on the right.',
  inventory: 'Gear and carrying: Inventory large, equipped weapons in Attacks, STR for carry weight.',
};
const NOTES = {
  ren: {
    character: 'No spell widgets; that space goes to Features (Cunning Action, Sneak Attack, Psychic Blades).',
    social: 'Active Features shows Psi-Bolstered Knack and his telepathy; Resources beside it for the Psionic Dice.',
    exploring: 'Skills gets the extra height (Expertise in Stealth/Perception). Inventory with thieves\' tools beside the map.',
    combat: 'Attacks (Dagger with Nick, Shortbow with Vex) + Active Features; Skills on the right for Stealth to Hide.',
    inventory: 'Attacks taller: both weapons with their mastery.',
  },
  saya: {
    social: 'Prepared Spells next to Skills: Minor Illusion and Friends-like spells are social tools for her.',
    combat: 'Resources holds Sorcery Points + Healing Hands; at L3 Celestial Revelation joins it.',
  },
  addybluelight: {
    social: 'Merchant: Inventory on Social so she can trade straight from the conversation.',
    inventory: 'Skills beside Inventory (Persuasion/Insight while trading).',
  },
  ancha: {
    social: 'CHA 8: small Social tab without spells; Active Features instead.',
    exploring: 'Her main tab: Skills taller (Survival, Perception, Stealth); Favored Enemy in Resources.',
    combat: 'Attacks first (Longbow/Shortsword); Hunter\'s Mark in Prepared Spells.',
  },
  barius: {
    character: 'Half caster: compact spell list, with Attacks below it.',
    social: 'Extra Active Features (Channel Divinity can also help in a conversation).',
    combat: 'Lay on Hands, Smite and Vow of Enmity in Resources; spell list kept short.',
  },
  io: {
    exploring: 'Full spell list on Exploring for rituals and nature magic; Wild Shape in Resources for scouting.',
    inventory: 'Prepared Spells beside Inventory (material components).',
    combat: 'Wild Shape forms have no widget yet; for now via Resources + Active Features.',
  },
  lira: {
    exploring: 'Full spell list (Detect Magic and other rituals); Investigation/Arcana in Skills.',
    combat: 'Portent in Resources, always in view.',
    inventory: 'Prepared Spells beside Inventory (spellbook and components).',
  },
  nero: {
    social: 'His biggest tab: Skills, Prepared Spells and Active Features side by side.',
    combat: 'Pact slots (Spell Slots) above Prepared Spells; Eldritch Blast shows up in Attacks.',
  },
  varragoth: {
    character: 'Third caster: compact spell list with Attacks below it.',
    combat: 'Attacks taller (Weapon Mastery); small spell list for Shield.',
    inventory: 'Attacks taller: weapons and armor.',
  },
};

// ---- phone order = wg-mobile.js derivation
const MOBILE_FIRST = ['hpBase'], MOBILE_LAST = ['profilePicture'];
function phoneOrder(desk) {
  const list = desk.slice().sort((a, b) => (a.globalCol - b.globalCol) || (a.startRowIdx - b.startRowIdx)).map(w => w.type);
  const first = list.filter(t => MOBILE_FIRST.includes(t));
  const last = list.filter(t => MOBILE_LAST.includes(t));
  return [...first, ...list.filter(t => !MOBILE_FIRST.includes(t) && !MOBILE_LAST.includes(t)), ...last];
}

// ---- validation: in bounds, no overlap, no duplicate type per tab, page-safe
const errors = [];
function validate(where, device, widgets) {
  const g = GRID[device];
  const seen = new Set();
  for (const w of widgets) {
    if (!WIDGETS[w.type]) errors.push(`${where}: unknown type ${w.type}`);
    if (seen.has(w.type)) errors.push(`${where}: duplicate ${w.type}`);
    seen.add(w.type);
    if (w.globalCol + w.spanUnits > g.cols || w.startRowIdx + w.spanUnitsY > g.rows)
      errors.push(`${where}: ${w.type} out of bounds`);
    const p0 = Math.floor(w.globalCol / g.pageCols), p1 = Math.floor((w.globalCol + w.spanUnits - 1) / g.pageCols);
    if (p0 !== p1) errors.push(`${where}: ${w.type} straddles a page`);
  }
  for (let i = 0; i < widgets.length; i++) for (let j = i + 1; j < widgets.length; j++) {
    const a = widgets[i], b = widgets[j];
    if (a.globalCol < b.globalCol + b.spanUnits && b.globalCol < a.globalCol + a.spanUnits &&
        a.startRowIdx < b.startRowIdx + b.spanUnitsY && b.startRowIdx < a.startRowIdx + a.spanUnitsY)
      errors.push(`${where}: ${a.type} overlaps ${b.type}`);
  }
}

const BUILD = {
  character: [deskCharacter, tabCharacter], social: [deskSocial, tabSocial], exploring: [deskExploring, tabExploring],
  combat: [deskCombat, tabCombat], inventory: [deskInventory, tabInventory],
};
// Fitted layouts (build-fitted.mjs) replace the template where they exist.
const here0 = dirname(fileURLToPath(import.meta.url));
const FITTED = {};
function fitted(device, id, tab, fallback) {
  const key = device + "-" + id;
  if (!(key in FITTED)) {
    const f = join(here0, "fitted-" + key + ".json");
    FITTED[key] = existsSync(f) ? JSON.parse(readF(f, "utf8")) : null;
  }
  const r = FITTED[key] && FITTED[key][tab];
  return r && r.widgets ? r.widgets : fallback;
}
const TEMPLATE = {};

const characters = CHARS.map(c => {
  const tabs = {};
  for (const [tab, [d, t]] of Object.entries(BUILD)) {
    const desktop = fitted('desktop', c.id, tab, d(c)), tablet = fitted('tablet', c.id, tab, t(c));
    (TEMPLATE[c.id] ||= { desktop: {}, tablet: {} }).desktop[tab] = d(c); TEMPLATE[c.id].tablet[tab] = t(c);
    validate(`${c.id}/${tab}/desktop`, 'desktop', desktop);
    validate(`${c.id}/${tab}/tablet`, 'tablet', tablet);
    tabs[tab] = { desktop, tablet, phone: phoneOrder(desktop), note: (NOTES[c.id] || {})[tab] || '' };
  }
  const { caster, smallCaster, res, ...info } = c;
  return { ...info, tabs };
});

// Generic layouts for characters without their own entry (picked by class at runtime).
const GENERIC = [
  { id: '_full', caster: true, res: 3 },
  { id: '_half', caster: true, smallCaster: true, res: 3 },
  { id: '_martial', caster: false, res: 3 },
];
const runtime = {};
for (const c of [...CHARS, ...GENERIC]) {
  const entry = { desktop: {}, tablet: {} };
  for (const [tab, [d, t]] of Object.entries(BUILD)) {
    entry.desktop[tab] = fitted('desktop', c.id, tab, d(c));
    entry.tablet[tab] = fitted('tablet', c.id, tab, t(c));
    validate(`${c.id}/${tab}/desktop`, 'desktop', entry.desktop[tab]);
    validate(`${c.id}/${tab}/tablet`, 'tablet', entry.tablet[tab]);
  }
  runtime[c.id] = entry;
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const GAPS = [
  'Wild Shape forms: no widget (Io). Now only Resources + Active Features.',
  'Lucky (Luck Points): not in Resources (Addy). Origin feat without a counter.',
  'Social widgets (NPC relations, quests, factions) no longer exist; old dashboards still reference them (npcRelations, quests, factionRenown, background).',
  'Exploring has no Senses widget (darkvision, passive Perception) or travel pace; old dashboards still reference senses/travelPace.',
  'Currency/encumbrance as separate widgets are gone (old types currency, encumbrance, equipment, attunedItems); check whether Inventory shows gold and weight.',
  'Unknown types render as Ability Scores on desktop: Nero\'s desktop (snapshot 2026-09-26) is full of them; Ren\'s phone slot too.',
  'Laptop: the desktop slot is one layout for every screen size. Rows below row ~13 get clamped on 1366×768.',
];

const out = { generated: new Date().toISOString().slice(0, 10), grid: GRID, laptopCols: LAPTOP_COLS,
  widgets: WIDGETS, tabIntent: TAB_INTENT, tabs: Object.keys(BUILD), gaps: GAPS, characters };
const here = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(here, 'default-layouts.json'), JSON.stringify(out, null, 1));
writeFileSync(join(here, 'template-layouts.json'), JSON.stringify(TEMPLATE));
const compact = JSON.stringify(runtime, (k, v) => (v && v.type && 'globalCol' in v)
  ? [v.type, v.globalCol, v.startRowIdx, v.spanUnits, v.spanUnitsY] : v);
writeFileSync(join(here, '..', '..', 'wg-defaults.js'),
`// ===== wg-defaults.js — suggested dashboard layouts (GENERATED) =====
// Do not edit by hand: source is Metadocs/Dashboards/default-layouts.mjs.
// Rows are [type, globalCol, startRowIdx, spanUnits, spanUnitsY]. Tablet
// layouts are drawn on 21-column pages; wgDefaultLayout remaps page 2 onto the
// real page width.
const WG_DEFAULT_LAYOUTS = ${compact};
const WG_DEFAULT_TABLET_PAGE = ${GRID.tablet.pageCols};
`);
console.log(`ok: ${characters.length} characters × ${Object.keys(BUILD).length} tabs × 2 devices (+ ${GENERIC.length} generic)`);

// Viewer page (published as an artifact): template + inlined data.
import { readFileSync } from 'node:fs';
const tpl = readFileSync(join(here, 'viewer.template.html'), 'utf8');
writeFileSync(join(here, 'viewer.html'), tpl.replace('__DATA__', () => JSON.stringify(out)));

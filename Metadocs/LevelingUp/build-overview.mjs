// build-overview.mjs — writes Metadocs/LevelingUp/L<N>-Combinations.md (N = 4 or 5): every 2024
// class × subclass × species combination at that level, generated from the same
// rules engine the site uses (getBuildProfile), so the document can't drift
// from the app. Run from the project root:  node Metadocs/LevelingUp/build-overview.mjs [4|5]
//
// A combination = its class/subclass section + its species section; the
// matrix flags combinations whose parts interact (overlapping spells, Rage or
// Wild Shape vs. spellcasting, …) and links to those notes. "Reviewed" marks
// the batches that were read through one by one (REVIEWED below).

import { writeFileSync } from 'fs';
import { join } from 'path';
import { ROOT, loadEngine } from './harness.mjs';

const E = loadEngine();
const { DATA } = E;

// Batches of 20 combinations (2 subclasses × 10 species) read through by hand.
const LVL = Math.max(4, Math.min(5, Number(process.argv[2]) || 4));
const REVIEWED_BY_LEVEL = { 4: { 'barbarian/berserker': 'batch 1', 'barbarian/wildHeart': 'batch 1', 'barbarian/worldTree': 'batch 2', 'barbarian/zealot': 'batch 2', 'bard/lore': 'batch 3', 'bard/dance': 'batch 3', 'bard/glamour': 'batch 4', 'bard/valor': 'batch 4', 'cleric/life': 'batch 5', 'cleric/light': 'batch 5', 'cleric/trickery': 'batch 6', 'cleric/war': 'batch 6', 'druid/land': 'batch 7', 'druid/moon': 'batch 7', 'druid/sea': 'batch 8', 'druid/stars': 'batch 8', 'fighter/champion': 'batch 9', 'fighter/battleMaster': 'batch 9', 'fighter/eldritchKnight': 'batch 10', 'fighter/psiWarrior': 'batch 10', 'monk/openHand': 'batch 11', 'monk/mercy': 'batch 11', 'monk/shadow': 'batch 12', 'monk/elements': 'batch 12', 'paladin/devotion': 'batch 13', 'paladin/ancients': 'batch 13', 'paladin/glory': 'batch 14', 'paladin/vengeance': 'batch 14', 'ranger/hunter': 'batch 15', 'ranger/beastMaster': 'batch 15', 'ranger/feyWanderer': 'batch 16', 'ranger/gloomStalker': 'batch 16', 'rogue/thief': 'batch 17', 'rogue/assassin': 'batch 17', 'rogue/arcaneTrickster': 'batch 18', 'rogue/soulknife': 'batch 18', 'sorcerer/wildMagic': 'batch 19', 'sorcerer/draconic': 'batch 19', 'sorcerer/clockwork': 'batch 20', 'sorcerer/aberrant': 'batch 20', 'warlock/fiend': 'batch 21', 'warlock/archfey': 'batch 21', 'warlock/celestial': 'batch 22', 'warlock/greatOldOne': 'batch 22', 'wizard/evocation': 'batch 23', 'wizard/abjuration': 'batch 23', 'wizard/divination': 'batch 24', 'wizard/illusion': 'batch 24' }, 5: { 'barbarian/berserker': 'batch 1', 'barbarian/wildHeart': 'batch 1', 'barbarian/worldTree': 'batch 2', 'barbarian/zealot': 'batch 2', 'bard/lore': 'batch 3', 'bard/dance': 'batch 3', 'bard/glamour': 'batch 4', 'bard/valor': 'batch 4', 'cleric/life': 'batch 5', 'cleric/light': 'batch 5', 'cleric/trickery': 'batch 6', 'cleric/war': 'batch 6', 'druid/land': 'batch 7', 'druid/moon': 'batch 7', 'druid/sea': 'batch 8', 'druid/stars': 'batch 8', 'fighter/champion': 'batch 9', 'fighter/battleMaster': 'batch 9', 'fighter/eldritchKnight': 'batch 10', 'fighter/psiWarrior': 'batch 10', 'monk/openHand': 'batch 11', 'monk/mercy': 'batch 11', 'monk/shadow': 'batch 12', 'monk/elements': 'batch 12', 'paladin/devotion': 'batch 13', 'paladin/ancients': 'batch 13' } };
const REVIEWED = REVIEWED_BY_LEVEL[LVL] || {};

const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
const SPECIES = [
  { key: 'aasimar', label: 'Aasimar', variants: [['aasimar', null]] },
  { key: 'dragonborn', label: 'Dragonborn', variants: Object.keys(DATA.dragonborn.lineages).map((l) => ['dragonborn', l]) },
  { key: 'dwarf', label: 'Dwarf', variants: [['dwarf', null]] },
  { key: 'elf', label: 'Elf', variants: [['drow', null], ['highElf', null], ['woodElf', null]] },
  { key: 'gnome', label: 'Gnome', variants: [['gnome', 'forest'], ['gnome', 'rock']] },
  { key: 'goliath', label: 'Goliath', variants: Object.keys(DATA.goliath.lineages).map((l) => ['goliath', l]) },
  { key: 'halfling', label: 'Halfling', variants: [['halfling', null]] },
  { key: 'human', label: 'Human', variants: [['human', null]] },
  { key: 'orc', label: 'Orc', variants: [['orc', null]] },
  { key: 'tiefling', label: 'Tiefling', variants: [['tiefling', 'abyssal'], ['tiefling', 'chthonic'], ['tiefling', 'infernal']] },
];
const PRIMARY = { barbarian: 'str', bard: 'cha', cleric: 'wis', druid: 'wis', fighter: 'str', monk: 'dex', paladin: 'str', ranger: 'dex', rogue: 'dex', sorcerer: 'cha', warlock: 'cha', wizard: 'int' };
const ACT = { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction', attack: 'On a hit / Attack action', free: 'No action', other: '1 min+' };
const RECH = { long: 'Long Rest', short: 'Short or Long Rest', 'short-one': '1 per Short Rest, all on a Long Rest' };
const WHEN = { longRest: 'on a Long Rest', shortRest: 'on a Short or Long Rest', levelUp: 'when you gain a level', use: 'each time you use it' };
const SUB_SWAPS = ['landType', 'huntersPrey', 'companion', 'rageWilds', 'starryForm', 'stepsOfFey', 'maneuver', 'preparedOneTC', 'cantripTC', 'cantripAT'];

function template(cls, sub, race, lineage, opts = {}) {
  const ab = { str: 10, dex: 14, con: 14, int: 10, wis: 12, cha: 10 };
  ab[PRIMARY[cls]] = 16;
  const cfg = { className: cls, subclass: sub, race, baseAbilities: ab, defaultSkills: [], expertSkills: [] };
  if (lineage) cfg.lineage = lineage;
  if ((DATA[race] || {}).spellAbility === 'choose') cfg.speciesAbility = ['int', 'wis', 'cha'].includes(E.getSpellcastingAbility(cls, sub)) ? E.getSpellcastingAbility(cls, sub) : 'cha';
  if (cls === 'cleric') cfg.divineOrder = opts.order || 'protector';
  if (cls === 'druid') cfg.primalOrder = opts.order || 'warden';
  const st = { level: LVL, cantrips: [], prepared: [], asiChoices: { 4: { type: 'asi', abilities: {} } } };
  if (sub === 'land') st.landType = opts.land || 'arid';
  if (race === 'human') st.speciesFeat = { type: 'feat', feat: 'Alert', origin: true };
  return { cfg, st };
}
const freeTxt = (g) => g.kind === 'atWill' ? 'at will' : g.cost ? g.cost.n + ' Focus Point' : g.res === 'wildShape' ? 'slot or Wild Shape use'
  : g.res ? 'free via ' + ((DATA.classResources.find((r) => r.id === g.res) || {}).label || g.res)
  : g.freeMax != null ? g.freeMax + '×/' + (g.recharge === 'short' ? 'Short Rest' : 'Long Rest') + ' free' + (g.slots ? ' + slots' : '')
  : g.kind === 'ritual' ? 'ritual only' : g.kind === 'cantrip' ? 'cantrip' : 'always prepared';
const spellLine = (g) => g.name + ' (' + (g.spellLevel === 0 ? 'C' : 'L' + g.spellLevel) + ', ' + freeTxt(g) + ')';
const uniq = (a) => a.filter((x, i) => a.indexOf(x) === i);

let md = '# Level ' + LVL + ' — every class × subclass × species (2024 PHB)\n\n';
md += '> Generated by `node Metadocs/LevelingUp/build-overview.mjs ' + LVL + '` from the rules engine the site uses (`getBuildProfile`). Regenerate after any rules change. ';
md += 'Mechanics of all 720 level 1→' + LVL + ' combinations (48 subclasses × 15 species variants) are verified by `build-smoke.mjs ' + LVL + '` against facts from the 2024 PHB data.\n\n';
md += '**How to read it.** A combination = its *class/subclass* section + its *species* section. Everything at level ' + LVL + ' is listed per kind: **spells** (level, free uses, reset), **actions** (by action type), **feats**, **uses & resets**, what you **choose** (and how many), and what you can **swap** and when. ';
md += 'The matrix flags combinations whose parts interact (⚑) — the note is in the class section.\n\n';

// { id: 'skills' } choice as text: "Primal Knowledge (L3): 1 skill from the Barbarian list"
function skillChoiceText(c, cls, L) {
  const nm = (k) => k.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase());
  if (c.fixed) return c.featName + ' (L' + L + '): proficiency in ' + c.fixed.map(nm).join(' and ');
  const from = c.options === 'class' ? 'the ' + cls.charAt(0).toUpperCase() + cls.slice(1) + ' list' : c.options ? c.options.map(nm).join(', ') : 'any skill';
  return c.featName + ' (L' + L + '): ' + (c.count || 1) + ' skill' + ((c.count || 1) > 1 ? 's' : '') + ' — ' + from + (c.note ? '. ' + c.note : '');
}

// '×d8' for dice pools, ' points' for point pools (Lay on Hands)
const dieTxt = (r) => { const u = r.die || r.unit; return !u ? '' : /^d\d/.test(u) ? '×' + u : ' ' + u; };

// ---------- matrix ----------
const notesByCombo = {};
const classNotes = {};
md += '## Matrix\n\n| Class — Subclass | ' + SPECIES.map((s) => s.label).join(' | ') + ' | Reviewed |\n|' + '---|'.repeat(SPECIES.length + 2) + '\n';
for (const cls of CLASSES) {
  for (const [sub, sd] of Object.entries(DATA[cls].subclasses)) {
    if (sd.legacy) continue;
    const cells = [];
    // Notes that every species gets (class-level) are not a combination effect.
    const baseNotes = E.getBuildProfile(...Object.values(template(cls, sub, 'halfling', null))).notes;
    classNotes[cls + '/' + sub] = baseNotes;
    for (const sp of SPECIES) {
      // note -> variants it applies to; a note for every variant gets no prefix
      const byNote = new Map();
      for (const [race, lin] of sp.variants) {
        const { cfg, st } = template(cls, sub, race, lin);
        const p = E.getBuildProfile(cfg, st);
        const vName = lin ? (DATA[race].lineages[lin] || {}).name || lin : ({ drow: 'Drow', highElf: 'High Elf', woodElf: 'Wood Elf' }[race] || race);
        p.notes.filter((n) => baseNotes.indexOf(n) === -1).forEach((n) => { if (!byNote.has(n)) byNote.set(n, []); byNote.get(n).push(vName); });
      }
      const notes = [...byNote].map(([n, vs]) => (vs.length === sp.variants.length ? '' : vs.join(', ') + ': ') + n);
      const key = cls + '/' + sub + '/' + sp.key;
      notesByCombo[key] = uniq(notes);
      cells.push(notesByCombo[key].length ? '⚑' : '✓');
    }
    md += '| ' + E.DATA[cls].subclasses[sub].name.replace(/^(Path|College|Circle|Oath|Warrior) of (the )?/, '') + ' (' + cls + ') | ' + cells.join(' | ') + ' | ' + (REVIEWED[cls + '/' + sub] || '') + ' |\n';
  }
}
md += '\n✓ = no interaction between the parts · ⚑ = see "Combination notes" in the class section.\n\n';

// ---------- species ----------
md += '## Species at level ' + LVL + '\n\nThe species part is the same for every class (spell DCs use the class or the chosen ability). One block per species; lineage variants list only what differs.\n\n';
for (const sp of SPECIES) {
  md += '### ' + sp.label + '\n\n';
  const rows = sp.variants.map(([race, lin]) => {
    const { cfg, st } = template('fighter', 'champion', race, lin);
    const p = E.getBuildProfile(cfg, st);
    const linName = lin ? (DATA[race].lineages[lin] || {}).name || lin : ({ drow: 'Drow', highElf: 'High Elf', woodElf: 'Wood Elf' }[race] || '');
    const linData = lin ? DATA[race].lineages[lin] : null;
    return {
      race, lin, linName, p,
      head: 'Speed ' + p.who.speed + ' ft' + (p.who.darkvision ? ', Darkvision ' + p.who.darkvision + ' ft' : '') + (p.who.size ? ', ' + p.who.size : ''),
      spells: p.granted.filter((x) => x.source === 'species').map(spellLine),
      acts: p.features.filter((x) => x.source === 'species' && x.act).map((x) => x.name + ' (' + ACT[x.act] + ')'),
      passive: p.features.filter((x) => x.source === 'species' && !x.act).map((x) => x.name),
      uses: p.resources.filter((r) => ['healingHands', 'celestialRevelation', 'breathWeapon', 'draconicFlight', 'stonecunning', 'giantAncestry', 'largeForm', 'adrenalineRush', 'relentlessEndurance', 'heroicInspiration'].includes(r.id) || r.dynamic)
        .map((r) => r.label.replace(/ — .*/, '') + ' ' + r.max + '/' + (RECH[r.recharge] || r.recharge)),
      swaps: [].concat(...Object.entries(p.swaps).map(([k, v]) => v.filter((x) => ['elfCantrip', 'revelation', 'breath'].includes(x.id)).map((x) => x.what + ' (' + WHEN[k] + ')'))),
      extra: linData ? [linData.resist ? 'Resistance: ' + linData.resist : '', linData.damage ? 'Damage type: ' + linData.damage : ''].filter(Boolean) : []
    };
  });
  const common = (k) => rows.every((r) => JSON.stringify(r[k]) === JSON.stringify(rows[0][k]));
  const r0 = rows[0];
  if (common('head')) md += r0.head + '\n';
  const line = (label, arr) => (arr && arr.length ? '- ' + label + ': ' + arr.join('; ') + '\n' : '');
  if (common('spells')) md += line('Spells', r0.spells);
  if (common('acts')) md += line('Actions', r0.acts);
  if (common('passive')) md += line('Passive', r0.passive);
  if (common('uses')) md += line('Uses', r0.uses);
  if (common('swaps')) md += line('Swap', r0.swaps);
  if (rows.length > 1) {
    md += '- Variants:\n';
    rows.forEach((r) => {
      const bits = [].concat(common('head') ? [] : [r.head], r.extra,
        common('spells') ? [] : ['spells ' + (r.spells.join(', ') || '—')],
        common('acts') ? [] : ['actions ' + (r.acts.join(', ') || '—')],
        common('passive') ? [] : ['passive ' + (r.passive.join(', ') || '—')],
        common('uses') ? [] : ['uses ' + (r.uses.join(', ') || '—')],
        common('swaps') ? [] : r.swaps.map((x) => 'swap: ' + x));
      md += '  - **' + r.linName + '**: ' + bits.join(' · ') + '\n';
    });
  }
  const ability = DATA[r0.race].spellAbility;
  if (ability) md += '- Spellcasting ability for these spells: ' + (ability === 'choose' ? 'INT, WIS or CHA (chosen with the lineage)' : ability.toUpperCase()) + '\n';
  const choose = { aasimar: '—', dragonborn: 'Draconic Ancestry (damage type)', dwarf: '—', elf: 'Lineage (Drow / High Elf / Wood Elf), Keen Senses skill, spellcasting ability', gnome: 'Lineage (Forest / Rock), spellcasting ability', goliath: 'Giant Ancestry (Cloud, Fire, Frost, Hill, Stone, Storm)', halfling: '—', human: 'Skillful skill, Versatile Origin feat', orc: '—', tiefling: 'Fiendish Legacy (Abyssal / Chthonic / Infernal), spellcasting ability' }[sp.key];
  md += '- Choose at creation: ' + choose + '\n\n';
}

// ---------- classes ----------
md += '## Classes and subclasses at level ' + LVL + '\n\nPer class: what every subclass shares, then each subclass. Level 4 always brings **Ability Score Improvement or a feat** (any Origin feat or a General feat you qualify for; spell-granting feats: Magic Initiate, Fey-Touched, Shadow-Touched, Telepathic, Telekinetic, Ritual Caster).\n\n';
for (const cls of CLASSES) {
  const cd = DATA[cls];
  const subs = Object.keys(cd.subclasses).filter((k) => !cd.subclasses[k].legacy);
  const base = E.getBuildProfile(...Object.values(template(cls, subs[0], 'human', null)));
  md += '### ' + cls.charAt(0).toUpperCase() + cls.slice(1) + ' (d' + cd.hitDie + ')\n\n';
  const classFeats = base.features.filter((f) => f.source === 'class');
  md += '- Class features L1–' + LVL + ': ' + classFeats.map((f) => f.name + (f.act ? ' [' + ACT[f.act] + ']' : '')).join(', ') + '\n';
  if (base.casting) {
    const c = base.casting;
    md += '- Spellcasting at L' + LVL + ': ' + c.ability.toUpperCase() + ', ' + (c.cantrips.max ? c.cantrips.max + ' cantrips, ' : '') + c.prepared.max + ' prepared (level ≤ ' + c.prepared.maxLevel + '), ' +
      (c.pact ? c.pact.count + ' Pact slots of level ' + c.pact.level + ' (Short Rest)' : 'slots ' + c.slots.filter((n) => n > 0).map((n, i) => n + '×L' + (i + 1)).join(', ')) + '\n';
  }
  const classSpells = base.granted.filter((x) => x.source === 'class');
  if (classSpells.length) md += '- Class spells: ' + classSpells.map(spellLine).join('; ') + '\n';
  const classRes = base.resources.filter((r) => !r.dynamic && DATA.classResources.find((x) => x.id === r.id && x.appliesTo.className === cls && !x.appliesTo.subclass));
  if (classRes.length) md += '- Uses: ' + classRes.map((r) => r.label + ' ' + r.max + dieTxt(r) + '/' + (RECH[r.recharge] || r.recharge)).join('; ') + '\n';
  // What you choose per level, from the data (not from the template character).
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const skName = (k) => k.replace(/([A-Z])/g, ' $1').split(' ').map((w) => (w.toLowerCase() === 'of' ? 'of' : cap(w))).join(' ');
  const CREATION_EXTRA = { bard: '3 musical instruments', cleric: 'Divine Order (Protector or Thaumaturge)', druid: 'Primal Order (Magician or Warden)',
    fighter: 'a Fighting Style feat', monk: "one type of Artisan's Tools or a musical instrument", rogue: "Expertise in 2 skills, 1 language besides Thieves' Cant",
    wizard: '6 level 1 Wizard spells for your spellbook' };
  const opts = (DATA[cls].skillOptions || []).filter((o) => o !== 'any');
  const byLevel = { 1: [DATA[cls].skillCount + ' skills (' + (opts.length ? opts.map(skName).join(', ') : 'any') + ')'] };
  if (CREATION_EXTRA[cls]) byLevel[1].push(CREATION_EXTRA[cls]);
  const TOT = { invocations: 'Eldritch Invocation', metamagic: 'Metamagic option', wildShapeForms: 'Wild Shape form', weaponMasteries: 'Weapon Mastery weapon' };
  for (const [id, label] of Object.entries(TOT)) {
    const col = (DATA.choiceTotals[id] || {})[cls];
    if (!col) continue;
    for (let L = 1; L <= LVL; L++) {
      const add = col[L] - col[L - 1];
      if (add > 0) (byLevel[L] = byLevel[L] || []).push((L === 1 || col[L - 1] === 0 ? add + ' ' : '+' + add + ' ') + label + (add > 1 ? 's' : '') + (col[L - 1] > 0 ? ' (' + col[L] + ' total)' : ''));
    }
  }
  const LU = { expertise: (c) => 'Expertise in ' + (c.count || 1) + ' skill' + ((c.count || 1) > 1 ? 's' : ''),
    fightingStyle: () => 'a Fighting Style feat' + (cls === 'paladin' ? ' or Blessed Warrior (2 Cleric cantrips)' : cls === 'ranger' ? ' or Druidic Warrior (2 Druid cantrips)' : ''),
    scholar: () => 'Scholar: Expertise in Arcana, History, Investigation, Medicine, Nature or Religion', subclass: () => 'your subclass' };
  for (const [L, list] of Object.entries(DATA.levelUpChoices[cls] || {})) {
    if (L > LVL) continue;
    // fighter: the L2 entry only heals a level 1 style that was never recorded
    list.filter((c) => !(cls === 'fighter' && c.id === 'fightingStyle')).forEach((c) => (byLevel[L] = byLevel[L] || []).push(c.id === 'skills' ? skillChoiceText(c, cls, L).replace(/ \(L\d+\)/, '') : LU[c.id] ? LU[c.id](c) : c.id));
  }
  if (cls === 'ranger') (byLevel[2] = byLevel[2] || []).push('2 languages (Deft Explorer)');
  if (cls === 'wizard') [2, 3, 4, 5].filter((L) => L <= LVL).forEach((L) => (byLevel[L] = byLevel[L] || []).push('2 Wizard spells for your spellbook'));
  (DATA[cls].asiLevels || []).filter((L) => L <= LVL).forEach((L) => (byLevel[L] = byLevel[L] || []).push('Ability Score Improvement or a feat'));
  md += '- Choose:\n' + Object.keys(byLevel).sort((a, b) => a - b).map((L) => '  - ' + (L === '1' ? 'At creation' : 'Level ' + L) + ': ' + byLevel[L].join('; ') + '\n').join('');
  const sw = [].concat(...Object.entries(base.swaps).map(([k, v]) => v.filter((x) => !SUB_SWAPS.includes(x.id)).map((x) => x.what + ' (' + WHEN[k] + ')')));
  if (sw.length) md += '- Swap: ' + uniq(sw).join('; ') + '\n';
  md += '\n';
  for (const sub of subs) {
    const sd = cd.subclasses[sub];
    const { cfg, st } = template(cls, sub, 'human', null);
    const p = E.getBuildProfile(cfg, st);
    md += '#### ' + sd.name + '\n\n';
    const sf = p.features.filter((f) => f.source === 'subclass');
    md += '- Features (L3' + (sf.some((x) => x.level > 3) ? '–' + LVL : '') + '): ' + sf.map((f) => f.name + (f.act ? ' [' + ACT[f.act] + ']' : '')).join(', ') + '\n';
    const subCh = [].concat(...Object.entries(DATA[cls].subclasses[sub].choices || {}).filter(([L]) => L <= LVL).map(([L, list]) => list.filter((c) => c.id === 'skills').map((c) => [!!c.fixed, skillChoiceText(c, cls, L)])));
    if (subCh.some(([fx]) => !fx)) md += '- Choose: ' + subCh.filter(([fx]) => !fx).map(([, t]) => t).join('; ') + '\n';
    const savant = cls === 'wizard' && { abjuration: 'Abjuration', divination: 'Divination', evocation: 'Evocation', illusion: 'Illusion' }[sub];
    if (savant) md += '- Choose: ' + savant + ' Savant (L3): 2 ' + savant + " spells of level 2 or lower for your spellbook (free; the site doesn't track the spellbook yet)\n";
    if (subCh.some(([fx]) => fx)) md += '- Gain: ' + subCh.filter(([fx]) => fx).map(([, t]) => t).join('; ') + '\n';
    if (p.casting && !base.casting) {
      const c = p.casting;
      md += '- Spellcasting at L' + LVL + ': ' + c.ability.toUpperCase() + ' (' + c.list.charAt(0).toUpperCase() + c.list.slice(1) + ' list), ' + c.cantrips.max + ' cantrips, ' + c.prepared.max + ' prepared (level ≤ ' + c.prepared.maxLevel + '), slots ' +
        c.slots.filter((n) => n > 0).map((n, k) => n + '×L' + (k + 1)).join(', ') + '\n';
    }
    const sg = p.granted.filter((g) => g.source === 'subclass');
    const fixedC = ((DATA.thirdCasterFixedCantrips || {})[sub] || []).map((n) => n + ' (C, cantrip, always known — counts toward your cantrips)');
    if (sg.length || fixedC.length) md += '- Spells: ' + fixedC.concat(sg.map(spellLine)).join('; ') + (sub === 'land' ? ' — Arid shown; Polar/Temperate/Tropical on other Long Rests' : '') + '\n';
    const sres = p.resources.filter((r) => { const x = DATA.classResources.find((y) => y.id === r.id); return (x && x.appliesTo.subclass === sub) || (r.dynamic && sg.some((g) => r.id === g.key)); });
    if (sres.length) md += '- Uses: ' + sres.map((r) => r.label.replace(/ — .*/, '') + ' ' + r.max + dieTxt(r) + '/' + (RECH[r.recharge] || r.recharge)).join('; ') + '\n';
    const subActs = ACT ? Object.keys(ACT).map((a) => [a, (p.actions[a] || []).filter((x) => !x.spell && (x.source === 'class' || x.source === 'subclass'))]).filter(([, v]) => v.length) : [];
    if (subActs.length) md += '- Actions (no spells): ' + subActs.map(([a, v]) => ACT[a] + ': ' + v.map((x) => x.name).join(', ')).join(' · ') + '\n';
    const subSwaps = [].concat(...Object.entries(p.swaps).map(([k, v]) => v.filter((x) => SUB_SWAPS.includes(x.id)).map((x) => x.what + ' (' + WHEN[k] + ')')));
    if (subSwaps.length) md += '- Swap: ' + uniq(subSwaps).join('; ') + '\n';
    if ((classNotes[cls + '/' + sub] || []).length) md += '- Good to know: ' + classNotes[cls + '/' + sub].join(' ') + '\n';
    const comboNotes = SPECIES.map((s) => [s.label, notesByCombo[cls + '/' + sub + '/' + s.key]]).filter(([, n]) => n && n.length);
    if (comboNotes.length) {
      md += '- Combination notes:\n';
      // Notes shared by every species are listed once.
      const all = comboNotes.map(([, n]) => n);
      const shared = all[0].filter((n) => comboNotes.length === SPECIES.length && all.every((x) => x.includes(n)));
      if (shared.length) md += '  - All species: ' + shared.join(' ') + '\n';
      comboNotes.forEach(([lbl, n]) => { const own = n.filter((x) => !shared.includes(x)); if (own.length) md += '  - ' + lbl + ': ' + own.join(' · ') + '\n'; });
    }
    md += '\n';
  }
}
writeFileSync(join(ROOT, 'Metadocs/LevelingUp/L' + LVL + '-Combinations.md'), md);
console.log('L' + LVL + '-Combinations.md written: ' + md.split('\n').length + ' lines');

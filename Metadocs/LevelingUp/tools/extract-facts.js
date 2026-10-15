// Extracts FACTS (numbers + names, no rules text) from the 2024 PHB data (5etools XPHB JSON)
// and the 2025 Monster Manual beasts (XMM) into build-facts.json for the D&D Within build
// smoke test. usage: XPHB_DATA=<dir> node extract-facts.js <out.json> [maxLevel=5]
const { load, stripTags } = require('./lib.js');
const fs = require('fs');
const MAXL = Number(process.argv[3]) || 5;
const out = { generated: new Date().toISOString().slice(0, 10), source: '2024 PHB + 2025 MM (5etools XPHB/XMM data)', levels: MAXL,
  classes: {}, subclasses: {}, species: {}, spells: {}, spellLists: {}, beasts: {} };
const KEYS = { 'Path of the Berserker': 'berserker', 'Path of the Wild Heart': 'wildHeart', 'Path of the World Tree': 'worldTree', 'Path of the Zealot': 'zealot',
  'College of Dance': 'dance', 'College of Glamour': 'glamour', 'College of Lore': 'lore', 'College of Valor': 'valor',
  'Life Domain': 'life', 'Light Domain': 'light', 'Trickery Domain': 'trickery', 'War Domain': 'war',
  'Circle of the Land': 'land', 'Circle of the Moon': 'moon', 'Circle of the Sea': 'sea', 'Circle of the Stars': 'stars',
  'Battle Master': 'battleMaster', 'Champion': 'champion', 'Eldritch Knight': 'eldritchKnight', 'Psi Warrior': 'psiWarrior',
  'Warrior of Mercy': 'mercy', 'Warrior of Shadow': 'shadow', 'Warrior of the Elements': 'elements', 'Warrior of the Open Hand': 'openHand',
  'Oath of Devotion': 'devotion', 'Oath of Glory': 'glory', 'Oath of the Ancients': 'ancients', 'Oath of Vengeance': 'vengeance',
  'Beast Master': 'beastMaster', 'Fey Wanderer': 'feyWanderer', 'Gloom Stalker': 'gloomStalker', 'Hunter': 'hunter',
  'Arcane Trickster': 'arcaneTrickster', 'Assassin': 'assassin', 'Soulknife': 'soulknife', 'Thief': 'thief',
  'Aberrant Sorcery': 'aberrant', 'Clockwork Sorcery': 'clockwork', 'Draconic Sorcery': 'draconic', 'Wild Magic Sorcery': 'wildMagic',
  'Archfey Patron': 'archfey', 'Celestial Patron': 'celestial', 'Fiend Patron': 'fiend', 'Great Old One Patron': 'greatOldOne',
  'Abjurer': 'abjuration', 'Diviner': 'divination', 'Evoker': 'evocation', 'Illusionist': 'illusion' };
const title = (s) => s.split('|')[0].replace(/#c$/, '').split(' ').map((w) => /^(of|the|and|from|without|with)$/.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace(/^./, (c) => c.toUpperCase());
function names(arr) { if (arr && !Array.isArray(arr)) arr = arr._ || []; return (arr || []).filter((x) => typeof x === 'string').map(title); }
// table cell → number or dice string ("1d8") or null
function cell(v) {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const n = Number(stripTags(v).replace(/[^\d-]/g, '')); return isNaN(n) ? stripTags(v) : n; }
  if (v && v.type === 'dice') return v.toRoll.map((d) => d.number + 'd' + d.faces).join('+');
  if (v && v.type === 'bonus') return v.value;
  if (v && v.type === 'bonusSpeed') return v.value;
  if (v && v.value != null) return v.value;
  return null;
}
for (const cls of ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard']) {
  const j = load('class/class-' + cls + '.json');
  const c = (j.class || []).find((x) => x.source === 'XPHB');
  const f = { hitDie: c.hd && c.hd.faces, saves: c.proficiency, table: {} };
  if (c.cantripProgression) f.cantrips = c.cantripProgression.slice(0, MAXL);
  if (c.preparedSpellsProgression) f.prepared = c.preparedSpellsProgression.slice(0, MAXL);
  (c.classTableGroups || []).forEach((g) => {
    const rows = g.rows || g.rowsSpellProgression || [];
    if (g.rowsSpellProgression || /Spell Slots/.test(g.title || '')) { f.slots = rows.slice(0, MAXL).map((r) => r.filter((v) => typeof v === 'number' && v > 0)); return; }
    (g.colLabels || []).forEach((lab, i) => {
      const L = stripTags(lab).replace(/^feature type=ei$/i, 'Eldritch Invocations');
      if (/^level=/.test(L)) return; // cantrips / prepared duplicates
      f.table[L] = rows.slice(0, MAXL).map((r) => cell(r[i]));
    });
  });
  f.asiAt4 = !!(j.classFeature || []).find((x) => x.source === 'XPHB' && x.className === c.name && x.level === 4 && /Ability Score Improvement/.test(x.name));
  // levels with an Ability Score Improvement or the Epic Boon (both a feat choice)
  f.asiLevels = (j.classFeature || []).filter((x) => x.source === 'XPHB' && x.className === c.name && x.level <= MAXL && /^(Ability Score Improvement|Epic Boon)$/.test(x.name))
    .map((x) => x.level).sort((a, b) => a - b);
  // feature names per level (names only), to compare with our class features
  f.features = {};
  (j.classFeature || []).filter((x) => x.source === 'XPHB' && x.className === c.name && x.level <= MAXL)
    .forEach((x) => { (f.features[x.level] = f.features[x.level] || []).push(x.name); });
  out.classes[cls] = f;
  (j.subclass || []).filter((s) => s.source === 'XPHB' && s.classSource === 'XPHB').forEach((s) => {
    const key = KEYS[s.name]; if (!key) return;
    const g = { cls, name: s.name, preparedAt: {}, knownAt: {}, features: {} };
    (j.subclassFeature || []).filter((x) => x.source === 'XPHB' && x.className === c.name && x.subclassShortName === s.shortName && x.level <= MAXL && x.name !== s.name)
      .forEach((x) => { (g.features[x.level] = g.features[x.level] || []).push(x.name); });
    (s.additionalSpells || []).forEach((as) => {
      const p = as.prepared || {}; const k = as.known || {};
      for (let L = 1; L <= MAXL; L++) {
        // subclass spells listed at character levels 1-3 arrive with the subclass (level 3)
        const at = Math.max(3, L);
        g.preparedAt[at] = (g.preparedAt[at] || []).concat(names(p[String(L)]));
        g.knownAt[at] = (g.knownAt[at] || []).concat(names(k[String(L)]));
      }
      if (as.name) { g.variants = g.variants || {}; g.variants[as.name] = Object.fromEntries([3, 5, 7, 9].filter((L) => L <= Math.max(5, MAXL)).map((L) => [L, names(p[String(L)])])); }
    });
    if (s.cantripProgression) g.cantrips = s.cantripProgression.slice(0, MAXL);
    if (s.preparedSpellsProgression) g.prepared = s.preparedSpellsProgression.slice(0, MAXL);
    out.subclasses[cls + '/' + key] = g;
  });
}
const races = load('races.json').race.filter((r) => r.source === 'XPHB');
races.forEach((r) => {
  const sp = { speed: r.speed, darkvision: r.darkvision || 0, resist: r.resist || [] };
  const take = (as, lineage) => {
    const known = names((as.known || {})['1']); const at3 = []; const at5 = [];
    Object.keys(as.innate || {}).forEach((l) => { const d = as.innate[l].daily || {}; Object.keys(d).forEach((n) => { (l === '3' ? at3 : l === '5' ? at5 : known).push(...names(d[n])); }); });
    sp.spells = sp.spells || {}; sp.spells[lineage] = { cantrips: known, level3: at3, level5: at5, ability: as.ability };
  };
  (r.additionalSpells || []).forEach((as) => take(as, as.name || '_'));
  (r._versions || []).forEach((v) => (v.additionalSpells || []).forEach((as) => {
    const nm = (v.name || '').replace(/^.*; /, '').replace(/ (Lineage|Legacy)$/, '');
    if (sp.spells && sp.spells[nm]) return;
    take(as, nm);
  }));
  out.species[r.name] = sp;
});
// Every 2024 PHB spell (name → spell level) and the class spell lists.
load('spells/spells-xphb.json').spell.forEach((s) => { out.spells[s.name] = s.level; });
const srcs = load('spells/sources.json').XPHB || {};
Object.keys(srcs).sort().forEach((name) => (srcs[name].class || []).filter((c) => c.source === 'XPHB').forEach((c) => {
  const k = c.name.toLowerCase(), L = out.spells[name];
  out.spellLists[k] = out.spellLists[k] || {};
  (out.spellLists[k][L] = out.spellLists[k][L] || []).push(name);
}));
// Beasts of the 2025 Monster Manual: challenge rating and Fly Speed (Wild Shape limits).
const crOf = (c) => (typeof c === 'object' ? c.cr : c);
load('bestiary/bestiary-xmm.json').monster.filter((m) => (typeof m.type === 'string' ? m.type : m.type && m.type.type) === 'beast')
  .sort((a, b) => a.name.localeCompare(b.name))
  .forEach((m) => { out.beasts[m.name] = { cr: String(crOf(m.cr)), fly: !!(m.speed && m.speed.fly != null), swarm: !!(m.type && m.type.swarmSize) }; });
fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log('classes', Object.keys(out.classes).length, 'subclasses', Object.keys(out.subclasses).length, 'species', Object.keys(out.species).length,
  'spells', Object.keys(out.spells).length, 'beasts', Object.keys(out.beasts).length);

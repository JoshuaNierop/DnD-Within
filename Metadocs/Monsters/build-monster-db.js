// Builds monsters-data.js (repo root): every Monster Manual 2025 creature, normalised to the
// Creature field strings used by the editor. SRD 5.2 monsters (CC-BY-4.0) keep their text; for
// the other monsters only the game facts come from the data, and the trait/action text comes from
// our own paraphrase in mm-own-words.json (see Metadocs/Monsters/Rules.md).
// usage: XPHB_DATA=<dir with bestiary/bestiary-xmm.json> node build-monster-db.js [out=../../monsters-data.js]
//        DUMP_DIR=<scratch dir> [BATCHES=6] → writes the non-SRD source text in batches to paraphrase (never commit)
//        ALLOW_MISSING=1 → skip non-SRD monsters that have no own words yet
const fs = require('fs'), path = require('path');
const RAW = process.env.XPHB_DATA;
if (!RAW) { console.error('Set XPHB_DATA to the folder with bestiary/bestiary-xmm.json'); process.exit(1); }
const OUT = process.argv[2] || path.join(__dirname, '..', '..', 'monsters-data.js');
const OWN = path.join(__dirname, 'mm-own-words.json');
const own = fs.existsSync(OWN) ? JSON.parse(fs.readFileSync(OWN, 'utf8')) : {};
const src = JSON.parse(fs.readFileSync(path.join(RAW, 'bestiary', 'bestiary-xmm.json'), 'utf8')).monster;

const SIZE = { T: 'Tiny', S: 'Small', M: 'Medium', L: 'Large', H: 'Huge', G: 'Gargantuan' };
const ALIGN = { L: 'Lawful', C: 'Chaotic', N: 'Neutral', G: 'Good', E: 'Evil', U: 'Unaligned', A: 'Any alignment' };
const ABIL = { str: 'Strength', dex: 'Dexterity', con: 'Constitution', int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma' };
const XP = { '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900,
  '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500, '15': 13000, '16': 15000, '17': 18000, '18': 20000,
  '19': 22000, '20': 25000, '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000,
  '28': 120000, '29': 135000, '30': 155000 };
const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
const titleCase = (s) => String(s).split(' ').map(cap).join(' ');
const sign = (n) => (n >= 0 ? '+' : '') + n;
const mod = (score) => Math.floor((score - 10) / 2);
const crNum = (cr) => (cr.indexOf('/') > 0 ? cr.split('/').reduce((a, b) => a / b) : Number(cr));
const pbFor = (cr) => Math.max(2, Math.ceil(crNum(cr) / 4) + 1);
const idOf = (m) => m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// SRD 5.2 drops the wizard names from spell titles (Melf's Acid Arrow -> Acid Arrow, Bigby's Hand -> Arcane Hand)
const SRD_SPELL = { "Bigby's Hand": 'Arcane Hand', "Mordenkainen's Sword": 'Arcane Sword', "Nystul's Magic Aura": "Arcanist's Magic Aura",
  "Leomund's Tiny Hut": 'Tiny Hut', "Leomund's Secret Chest": 'Secret Chest', "Mordenkainen's Faithful Hound": 'Faithful Hound',
  "Mordenkainen's Magnificent Mansion": 'Magnificent Mansion', "Mordenkainen's Private Sanctum": 'Private Sanctum',
  "Rary's Telepathic Bond": 'Telepathic Bond', "Drawmij's Instant Summons": 'Instant Summons', "Evard's Black Tentacles": 'Black Tentacles',
  "Otto's Irresistible Dance": 'Irresistible Dance', "Tenser's Floating Disk": 'Floating Disk', "Otiluke's Freezing Sphere": 'Freezing Sphere',
  "Otiluke's Resilient Sphere": 'Resilient Sphere', "Tasha's Hideous Laughter": 'Hideous Laughter', "Melf's Acid Arrow": 'Acid Arrow' };
function tags(s) {
  return String(s)
    .replace(/\{@spell ([^|}]*)/g, (m, n) => '{@spell ' + (SRD_SPELL[n] || n))
    .replace(/\{@atkr ([^}]*)\}/g, (m, k) => ({ m: 'Melee Attack Roll:', r: 'Ranged Attack Roll:', 'm,r': 'Melee or Ranged Attack Roll:' }[k] || 'Attack Roll:'))
    .replace(/\{@hit (-?\d+)\}/g, (m, n) => sign(Number(n)))
    .replace(/\{@h\}/g, 'Hit: ')
    .replace(/\{@hom\}/g, 'Hit or Miss: ')
    .replace(/\{@actSave (\w+)\}/g, (m, a) => (ABIL[a] || cap(a)) + ' Saving Throw:')
    .replace(/\{@actSaveFail (\d+)\}/g, (m, n) => 'Failure by ' + n + ' or More:')
    .replace(/\{@actSaveFailBy (\d+)\}/g, (m, n) => 'Failure by ' + n + ' or More:')
    .replace(/\{@actSaveFail\}/g, 'Failure:')
    .replace(/\{@actSaveSuccess\}/g, 'Success:')
    .replace(/\{@actSaveSuccessOrFail\}/g, 'Failure or Success:')
    .replace(/\{@actTrigger\}/g, 'Trigger:')
    .replace(/\{@actResponse[^}]*\}/g, 'Response:')
    .replace(/\{@recharge (\d)\}/g, (m, n) => '(Recharge ' + (n === '6' ? '6' : n + '–6') + ')')
    .replace(/\{@recharge\}/g, '(Recharge 6)')
    .replace(/\{@dc (\d+)[^}]*\}/g, 'DC $1')
    .replace(/\{@(\w+) ([^}]*)\}/g, (m, tag, body) => {
      const p = body.split('|');
      return (p.length > 2 && p[2] ? p[2] : p[0]).replace(/ \[Area of Effect\]$/, '');
    })
    .replace(/\{@\w+\}/g, '');
}
function flat(e) {
  if (e == null) return '';
  if (typeof e === 'string') return tags(e);
  if (Array.isArray(e)) return e.map(flat).filter(Boolean).join('\n');
  if (e.type === 'list') return (e.items || []).map((x) => '• ' + flat(x)).join('\n');
  if (e.type === 'item') return (e.name ? tags(e.name) + ' ' : '') + flat(e.entries || e.entry);
  return flat(e.entries || e.items || e.entry || []);
}
// Section → [{name, text}]; joined as "Name. text" blocks separated by a blank line
function list(arr) { return (arr || []).map((b) => ({ name: b.name ? tags(b.name) : '', text: flat(b.entries) })); }
function join(items) { return (items || []).map((b) => (b.name ? b.name + '. ' : '') + b.text).join('\n\n'); }
function typeStr(t) {
  if (typeof t === 'string') return cap(t);
  if (t.swarmSize) return 'Swarm of ' + SIZE[t.swarmSize] + ' ' + cap(typeof t.type === 'string' ? t.type : t.type.choose.join(' or ')) + (t.type === 'undead' ? '' : 's');
  const base = typeof t.type === 'string' ? cap(t.type) : t.type.choose.map(cap).join(' or ');
  const tg = (t.tags || []).map((x) => (typeof x === 'string' ? titleCase(x) : titleCase(x.prefix ? x.prefix + ' ' + x.tag : x.tag)));
  return base + (tg.length ? ' (' + tg.join(', ') + ')' : '');
}
function alignStr(a) {
  if (!a || !a.length) return '';
  if (a.length === 1) return a[0] === 'N' ? 'Neutral' : (ALIGN[a[0]] || a[0]);
  if (a.length === 2) return a.map((x) => ALIGN[x]).join(' ');
  return a.map((x) => (typeof x === 'string' ? ALIGN[x] || x : '')).filter(Boolean).join(' ');
}
function speedStr(sp) {
  const out = [];
  const one = (v) => (typeof v === 'number' ? v + ' ft.' : v.number + ' ft.' + (v.condition ? ' ' + tags(v.condition) : ''));
  if (sp.walk != null) out.push(one(sp.walk));
  ['burrow', 'climb', 'fly', 'swim'].forEach((k) => {
    if (sp[k] == null) return;
    out.push(cap(k) + ' ' + one(sp[k]) + (k === 'fly' && sp.canHover ? ' (hover)' : ''));
  });
  if (sp.alternate) Object.keys(sp.alternate).forEach((k) => sp.alternate[k].forEach((v) => out.push((k === 'walk' ? '' : cap(k) + ' ') + one(v))));
  if (sp.choose) out.push(sp.choose.from.map(cap).join(' or ') + ' ' + sp.choose.amount + ' ft.' + (sp.choose.note ? ' ' + sp.choose.note : ''));
  return out.join(', ');
}
// resist/immune/vulnerable/conditionImmune: strings, {special}, or nested groups with a note
function defList(arr, key) {
  return (arr || []).map((x) => {
    if (typeof x === 'string') return cap(x);
    if (x.special) return tags(x.special);
    const inner = defList(x[key], key);
    return [x.preNote && tags(x.preNote), inner, x.note && tags(x.note)].filter(Boolean).join(' ');
  }).join(', ');
}
function gearStr(g) {
  return (g || []).map((x) => (typeof x === 'string' ? tags('{@item ' + x + '}') : tags('{@item ' + x.item + '}') + ' (' + x.quantity + ')'))
    .map((s) => titleCase(s.replace(/\|.*$/, ''))).join(', ');
}
function spellList(scs) {
  return (scs || []).map((sc) => {
    const lines = [flat(sc.headerEntries)];
    if (sc.will) lines.push('At Will: ' + sc.will.map(tags).join(', '));
    ['daily', 'restLong', 'rest', 'recharge'].forEach((k) => {
      if (!sc[k]) return;
      Object.keys(sc[k]).forEach((n) => {
        const each = n.endsWith('e'), num = n.replace('e', '');
        const per = { daily: 'Day', restLong: 'Long Rest', rest: 'Rest', recharge: 'Recharge' }[k];
        lines.push(num + '/' + per + (each ? ' Each' : '') + ': ' + sc[k][n].map(tags).join(', '));
      });
    });
    if (sc.footerEntries) lines.push(flat(sc.footerEntries));
    return { name: sc.name ? tags(sc.name) : '', text: lines.join('\n') };
  });
}
const SECTIONS = { traits: 'trait', actions: 'action', bonusActions: 'bonus', reactions: 'reaction', legendary: 'legendary' };
function sections(m) {
  const out = {};
  Object.keys(SECTIONS).forEach((k) => { if (m[SECTIONS[k]] && m[SECTIONS[k]].length) out[k] = list(m[SECTIONS[k]]); });
  if (m.spellcasting && m.spellcasting.length) out.spellcasting = spellList(m.spellcasting);
  return out;
}
// Non-SRD text must come from our own paraphrase, with the same sections and block names
const missingOwn = [];
function textFor(m) {
  const sec = sections(m);
  if (m.srd52) return sec;
  const id = idOf(m), ow = own[id];
  if (!ow) { missingOwn.push(id); return null; }
  Object.keys(sec).forEach((k) => {
    const a = sec[k], b = ow[k] || [];
    if (a.length !== b.length || a.some((x, i) => x.name !== b[i].name || !b[i].text)) throw new Error('own words do not match the source blocks: ' + id + ' / ' + k);
  });
  Object.keys(ow).forEach((k) => { if (!sec[k]) throw new Error('own words have an extra section: ' + id + ' / ' + k); });
  return ow;
}
function legendaryStr(m, items) {
  if (!items || !items.length) return '';
  const n = m.legendaryActions || 3, lair = m.legendaryActionsLair;
  const short = m.shortName === true ? m.name.toLowerCase() : (m.shortName || m.name.toLowerCase());
  const head = 'Legendary Action Uses: ' + n + (lair ? ' (' + lair + ' in Lair)' : '') + '. Immediately after another creature\'s turn, the ' + short +
    ' can expend a use to take one of the following actions. The ' + short + ' regains all expended uses at the start of each of its turns.';
  return head + '\n\n' + join(items);
}

if (process.env.DUMP_DIR) {
  const rest = src.filter((m) => !m.srd52).sort((a, b) => a.name.localeCompare(b.name));
  const per = Math.ceil(rest.length / (Number(process.env.BATCHES) || 6));
  let n = 0;
  for (let i = 0; i * per < rest.length; i++, n++) {
    const batch = {};
    rest.slice(i * per, (i + 1) * per).forEach((m) => { batch[idOf(m)] = { name: m.name, sections: sections(m) }; });
    fs.writeFileSync(path.join(process.env.DUMP_DIR, 'source-' + (i + 1) + '.json'), JSON.stringify(batch, null, 1));
  }
  console.log('dumped', rest.length, 'non-SRD monsters in', n, 'batches');
  process.exit(0);
}

const monsters = src.filter((m) => m.srd52 || process.env.ALLOW_MISSING !== '1' || own[idOf(m)]).map((m) => {
  const cr = typeof m.cr === 'string' ? m.cr : m.cr.cr;
  const pb = pbFor(cr);
  const initMod = mod(m.dex) + (m.initiative && m.initiative.proficiency ? m.initiative.proficiency * pb : 0);
  const saves = Object.keys(m.save || {}).map((k) => cap(k) + ' ' + m.save[k]).join(', ');
  const skills = Object.keys(m.skill || {}).map((k) => titleCase(k) + ' ' + m.skill[k]).join(', ');
  const senses = (m.senses || []).map(tags).concat(['Passive Perception ' + m.passive]).join(', ');
  const xp = typeof m.cr === 'object' && m.cr.xp ? m.cr.xp : XP[cr];
  const xpLair = typeof m.cr === 'object' && m.cr.xpLair ? m.cr.xpLair : null;
  const txt = textFor(m) || {};
  const typeKey = typeof m.type === 'string' ? m.type : (typeof m.type.type === 'string' ? m.type.type : m.type.type.choose[0]);
  const rec = {
    id: idOf(m),
    name: m.name,
    src: m.srd52 ? 'SRD' : 'MM',
    size: m.size.map((s) => SIZE[s]).join(' or '),
    mtype: typeStr(m.type),
    alignment: alignStr(m.alignment),
    ac: String(m.ac[0] && typeof m.ac[0] === 'object' ? m.ac[0].ac : m.ac[0]),
    initiative: initMod,
    hp: m.hp.average != null ? m.hp.average + ' (' + m.hp.formula + ')' : tags(m.hp.special || ''),
    speed: speedStr(m.speed),
    abilities: { str: m.str, dex: m.dex, con: m.con, int: m.int, wis: m.wis, cha: m.cha },
    saves, skills,
    resistances: defList(m.resist, 'resist'),
    immunities: defList(m.immune, 'immune'),
    condImmunities: defList(m.conditionImmune, 'conditionImmune'),
    vulnerabilities: defList(m.vulnerable, 'vulnerable'),
    gear: gearStr(m.gear),
    senses,
    languages: (m.languages || []).map(tags).join(', ') || 'None',
    cr, xp, xpLair, profBonus: pb,
    traits: join(txt.traits),
    actions: join(txt.actions),
    bonusActions: join(txt.bonusActions),
    reactions: join(txt.reactions),
    legendary: legendaryStr(m, txt.legendary),
    spellcasting: join(txt.spellcasting),
    // filter keys
    crNum: crNum(cr), typeKey, env: m.environment || []
  };
  Object.keys(rec).forEach((k) => { if (rec[k] === '' || rec[k] == null) delete rec[k]; });
  return rec;
}).sort((a, b) => a.name.localeCompare(b.name));

if (missingOwn.length) { console.error('no own words for', missingOwn.length, 'non-SRD monsters (ALLOW_MISSING=1 skips them):', missingOwn.slice(0, 10).join(', ')); process.exit(1); }
const ids = new Set();
monsters.forEach((m) => { if (ids.has(m.id)) throw new Error('duplicate id ' + m.id); ids.add(m.id); });
const leftover = JSON.stringify(monsters).match(/\{@[^}]*\}?/g);
if (leftover) { console.error('unrendered tags:', [...new Set(leftover)].slice(0, 20)); process.exit(1); }

const srdCount = monsters.filter((m) => m.src === 'SRD').length;
const header = '// Monster Manual 2025 creatures — generated by Metadocs/Monsters/build-monster-db.js, do not edit by hand.\n' +
  '// Monsters with src "SRD": this work includes material from the System Reference Document 5.2 ("SRD 5.2") by\n' +
  '// Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is licensed under the Creative\n' +
  '// Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.\n' +
  '// Monsters with src "MM": game statistics only; every description is our own paraphrase (Metadocs/Monsters/mm-own-words.json).\n';
const meta = { source: 'Monster Manual 2025 stat blocks', count: monsters.length, srd: srdCount,
  attribution: 'Includes material from the System Reference Document 5.2 by Wizards of the Coast LLC, licensed under CC-BY-4.0.' };
fs.writeFileSync(OUT, header + 'window.DW_MONSTER_DB = ' + JSON.stringify({ meta, monsters }) + ';\n');
console.log('wrote', OUT, monsters.length, 'monsters (' + srdCount + ' SRD),', Math.round(fs.statSync(OUT).size / 1024), 'kB');

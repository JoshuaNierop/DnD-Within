// build-smoke.mjs — level 1→T test over EVERY class × subclass × species
// variant (48 × 15 = 720 characters). Run from the project root:
//   node Metadocs/LevelingUp/build-smoke.mjs      (T = 4)
//   node Metadocs/LevelingUp/build-smoke.mjs 5    (T = 5)
//
// Per character: fresh level 1 (origin feat in rotation, creation picks such as
// lineage / species ability / Divine Order deliberately missing), level-up
// 1→…→T through the real builders (subclass = the combo's, a different L4 feat
// in rotation, an optional swap now and then), then checks against
// build-facts.json — numbers and spell names taken from the 2024 PHB data, an
// independent source — and finally level-down T→1 with an exact rollback check.

import { readFileSync } from 'fs';
import { join } from 'path';
import { ROOT, loadEngine, makeChar, autoLevelUp, autoLevelDown, snapshot } from './harness.mjs';

const E = loadEngine();
const { DATA } = E;
const FACTS = JSON.parse(readFileSync(join(ROOT, 'Metadocs/LevelingUp/build-facts.json'), 'utf8'));
const T = Math.max(4, Math.min(FACTS.levels, Number(process.argv[2]) || 4));
const at = (arr, L) => (arr || [])[L - 1];   // facts arrays run from level 1

let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) pass++;
  else { fail++; failures.push(name + (detail ? ' — ' + detail : '')); }
}

const CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];
// Species variants: [label, race key, lineage, facts species name, facts spell key]
const SPECIES = [
  ['Aasimar', 'aasimar', null, 'Aasimar', '_'],
  ['Dragonborn (Red)', 'dragonborn', 'red', 'Dragonborn', null],
  ['Dwarf', 'dwarf', null, 'Dwarf', null],
  ['Elf (Drow)', 'drow', null, 'Elf', 'Drow'],
  ['Elf (High Elf)', 'highElf', null, 'Elf', 'High Elf'],
  ['Elf (Wood Elf)', 'woodElf', null, 'Elf', 'Wood Elf'],
  ['Gnome (Forest)', 'gnome', 'forest', 'Gnome', 'Forest Gnome Lineage'],
  ['Gnome (Rock)', 'gnome', 'rock', 'Gnome', 'Rock Gnome Lineage'],
  ['Goliath (Stone)', 'goliath', 'stone', 'Goliath', null],
  ['Halfling', 'halfling', null, 'Halfling', null],
  ['Human', 'human', null, 'Human', null],
  ['Orc', 'orc', null, 'Orc', null],
  ['Tiefling (Abyssal)', 'tiefling', 'abyssal', 'Tiefling', 'Abyssal'],
  ['Tiefling (Chthonic)', 'tiefling', 'chthonic', 'Tiefling', 'Chthonic'],
  ['Tiefling (Infernal)', 'tiefling', 'infernal', 'Tiefling', 'Infernal'],
];
const L4_FEATS = ['Fey-Touched', 'Magic Initiate (Cleric)', 'Skilled', 'Resilient', 'Ritual Caster', 'War Caster', 'Telekinetic',
  'Shadow-Touched', 'Telepathic', 'Skill Expert', 'Keen Mind', 'Observant', 'Elemental Adept', 'Great Weapon Master', 'Tough',
  'Ability Score Improvement', 'Magic Initiate (Wizard)', 'Lucky', 'Speedy', 'Mage Slayer', 'Spell Sniper', 'Sentinel', 'Durable'];
const ORIGIN_FEATS = ['Magic Initiate (Wizard)', 'Alert', 'Tough', 'Skilled', 'Magic Initiate (Druid)', 'Lucky', 'Savage Attacker',
  'Healer', 'Musician', 'Crafter', 'Tavern Brawler', 'Magic Initiate (Cleric)'];
const exercised = {};
// Counted options at level T (2024 tables; columns where the facts have them)
function totalsAt(cls, L) {
  const tb = FACTS.classes[cls].table || {};
  const t = {};
  if (cls === 'warlock') t.invocations = at(tb['Eldritch Invocations'], L);
  if (cls === 'sorcerer') t.metamagic = L >= 17 ? 6 : L >= 10 ? 4 : L >= 2 ? 2 : 0;
  if (cls === 'druid') t.wildShapeForms = L >= 8 ? 8 : L >= 4 ? 6 : L >= 2 ? 4 : 0;
  if (tb['Weapon Mastery']) t.weaponMasteries = at(tb['Weapon Mastery'], L);
  else if (['paladin', 'ranger', 'rogue'].includes(cls)) t.weaponMasteries = 2;
  return t;
}
// Class resources that have a column in the class table: resource id → column
const RES_COLUMNS = { rage: 'Rages', sorceryPoints: 'Sorcery Points', focusPoints: 'Focus Points', favoredEnemy: 'Favored Enemy',
  channelDivinityCleric: 'Channel Divinity', channelDivinity: 'Channel Divinity', wildShape: 'Wild Shape', secondWind: 'Second Wind' };

let run = 0;
for (const cls of CLASSES) {
  const subs = Object.keys(DATA[cls].subclasses).filter((k) => !DATA[cls].subclasses[k].legacy);
  check(cls + ': 4 subclasses', subs.length === 4, subs.join(','));
  for (const sub of subs) {
    for (const [label, race, lineage, factsSpecies, factsKey] of SPECIES) {
      run++;
      const combo = cls + '/' + sub + ' × ' + label;
      const origin = ORIGIN_FEATS[run % ORIGIN_FEATS.length];
      const { config: cfg, state: st } = makeChar(E, cls, race, { originFeat: origin });
      const prefs = { subclass: sub, lineage: lineage || undefined, asiFeat: L4_FEATS[run % L4_FEATS.length],
        speciesAbility: ['int', 'wis', 'cha'][run % 3], classStyle: run % 2 === 0, swap: run % 4 === 0,
        order: cls === 'cleric' ? (run % 2 ? 'thaumaturge' : 'protector') : (run % 2 ? 'magician' : 'warden'),
        invocations: run % 3 === 0 ? ['Pact of the Tome'] : run % 3 === 1 ? ['Lessons of the First Ones', 'Pact of the Chain'] : ['Pact of the Blade'] };

      const snaps = { 1: snapshot(cfg, st) };
      try {
        for (let to = 2; to <= T; to++) {
          const { picked } = autoLevelUp(E, combo, cfg, st, prefs);
          snaps[to] = snapshot(cfg, st);
          check(combo + ' L' + to + ': level', st.level === to);
          // per-level counts against the engine's own tables
          const ab = E.getSpellcastingAbility(cls, cfg.subclass);
          const mod = E.getMod(E.getAbilityScore(cfg, st, ab));
          const wantP = E.getMaxPrepared(st, mod, cls, cfg.subclass);
          check(combo + ' L' + to + ': prepared = ' + wantP, (st.prepared || []).length === wantP, String((st.prepared || []).length));
          const listCn = E.getSpellListClass(cls, cfg.subclass);
          const sC = ((st.levelChoices[2] || {}).styleCantrips || []).length;
          const wantCl = Math.min(E.getMaxCantrips(to, cls, cfg.subclass, cfg), ((DATA.spells[listCn] || {})[0] || []).length) + sC;
          check(combo + ' L' + to + ': cantrips = ' + wantCl, (st.cantrips || []).length === wantCl, String((st.cantrips || []).length));
          if (to === 4) {
            const f = picked.asi && (picked.asi.type === 'asi' ? 'Ability Score Improvement' : picked.asi.feat);
            exercised[f] = (exercised[f] || 0) + 1;
          }
        }
        // ---------- level T checks against the 2024 facts ----------
        const cf = FACTS.classes[cls];
        const tc = E.isThirdCaster(cls, cfg.subclass);
        const sf = FACTS.subclasses[cls + '/' + cfg.subclass] || {};
        check(combo + ': subclass is the requested one', cfg.subclass === sub);
        check(combo + ': L4 ASI/feat recorded', !!(st.asiChoices && st.asiChoices[4]), JSON.stringify(st.asiChoices));
        check(combo + ': hp = max', st.hp.current === E.getMaxHP(cfg, st), st.hp.current + ' vs ' + E.getMaxHP(cfg, st));
        const wantPrep = tc ? at(sf.prepared, T) : (at(cf.prepared, T) || 0);
        check(combo + ': prepared = ' + wantPrep, (st.prepared || []).length === wantPrep, String((st.prepared || []).length));
        const styleC = ((st.levelChoices[2] || {}).styleCantrips || []).length;
        const orderBonus = (cls === 'cleric' && cfg.divineOrder === 'thaumaturge') || (cls === 'druid' && cfg.primalOrder === 'magician') ? 1 : 0;
        const wantC = tc ? at(sf.cantrips, T) + (cfg.subclass === 'arcaneTrickster' ? 1 : 0) : (at(cf.cantrips, T) || 0) + orderBonus;
        check(combo + ': cantrips = ' + (wantC + styleC), (st.cantrips || []).length === wantC + styleC, String((st.cantrips || []).length));
        if (cf.slots && !tc) {
          const slots = E.getSpellSlots(cls, T, cfg.subclass).filter((n) => n > 0);
          check(combo + ': slots ' + at(cf.slots, T).join('/'), JSON.stringify(slots) === JSON.stringify(at(cf.slots, T)), slots.join('/'));
        }
        const prof = E.getBuildProfile(cfg, st);
        if (cls === 'warlock') {
          const pact = (prof.casting || {}).pact || {};
          check(combo + ': pact slots', pact.count === at(cf.table['Spell Slots'], T) && pact.level === at(cf.table['Slot Level'], T), JSON.stringify(pact));
        }
        // counted options
        for (const [id, want] of Object.entries(totalsAt(cls, T))) {
          check(combo + ': ' + id + ' = ' + want, (st[id] || []).length === want, String((st[id] || []).length));
        }
        if (cfg.subclass === 'battleMaster') {
          const wantM = T >= 15 ? 9 : T >= 10 ? 7 : T >= 7 ? 5 : 3;   // 2024 Battle Master: 3/5/7/9 at 3/7/10/15
          check(combo + ': ' + wantM + ' maneuvers', (st.maneuvers || []).length === wantM, String((st.maneuvers || []).length));
        }
        // an ASI or feat (Epic Boon at 19) recorded at every 2024 ASI level
        const asiMiss = (cf.asiLevels || []).filter((L) => L <= T && !(st.asiChoices || {})[L]);
        check(combo + ': ASI/feat at ' + (cf.asiLevels || []).filter((L) => L <= T).join(','), asiMiss.length === 0, 'missing ' + asiMiss.join(','));
        // class resources with a table column, dice that grow with level
        prof.resources.forEach((r) => {
          const col = RES_COLUMNS[r.id];
          if (col && cf.table[col]) check(combo + ': ' + r.label + ' = ' + at(cf.table[col], T), r.max === at(cf.table[col], T), String(r.max));
        });
        if (cls === 'bard') {
          const bi = prof.resources.find((r) => /^bardicInspiration/.test(r.id)) || {};
          check(combo + ': Bardic Inspiration die ' + at(cf.table['Bardic Die'], T), '1' + bi.die === at(cf.table['Bardic Die'], T), String(bi.die));
          check(combo + ': Bardic Inspiration recharge', bi.recharge === (T >= 5 ? 'short' : 'long'), bi.recharge);
        }
        if (cls === 'monk') {
          check(combo + ': Martial Arts die', DATA.monk.martialArtsDie[T] === at(cf.table['Martial Arts'], T), DATA.monk.martialArtsDie[T]);
          const speedy = Object.values(st.asiChoices || {}).some((x) => x && x.feat === 'Speedy') ? 10 : 0;
          check(combo + ': Unarmored Movement', prof.who.speed - ((DATA[race] || {}).speed || 30) - speedy === at(cf.table['Unarmored Movement'], T), String(prof.who.speed));
        }
        if (cls === 'rogue') check(combo + ': Sneak Attack dice', Math.ceil(T / 2) + 'd6' === at(cf.table['Sneak Attack'], T));
        // L3 skill proficiencies: Primal Knowledge, Bonus Proficiencies, Student of War, Otherworldly Glamour, Implements of Mercy
        const skillL3 = (cls === 'barbarian' ? 1 : 0) + ({ lore: 3, battleMaster: 1, feyWanderer: 1, mercy: 2 }[sub] || 0);
        const gotL3 = snaps[3].__defaultSkills.length - snaps[2].__defaultSkills.length;
        check(combo + ': L3 skill proficiencies +' + skillL3, gotL3 === skillL3, String(gotL3));
        // build profile
        const gNames = prof.granted.map((g) => g.name);
        const openIds = prof.open.map((o) => o.id);
        check(combo + ': no open choices', openIds.length === 0, prof.open.map((o) => o.what).join(' | '));
        // subclass always-prepared spells up to level T (2024 facts)
        let wantSub = [];
        for (let L = 3; L <= T; L++) wantSub = wantSub.concat((sf.preparedAt || {})[L] || [], (sf.knownAt || {})[L] || []);
        if (cls === 'druid' && cfg.subclass === 'land') wantSub = [3, 5, 7, 9].filter((L) => L <= T).flatMap((L) => sf.variants['Arid Land'][L] || []);
        const have = gNames.concat(st.cantrips || []).map((x) => x.toLowerCase());
        const missSub = wantSub.filter((n) => have.indexOf(n.toLowerCase()) === -1);
        check(combo + ': subclass spells', missSub.length === 0, 'missing ' + missSub.join(', '));
        // species spells (2024 facts)
        if (factsKey) {
          const sp = (FACTS.species[factsSpecies].spells || {})[factsKey] || {};
          const want = (sp.cantrips || []).concat(sp.level3 || []).concat(T >= 5 ? sp.level5 || [] : []);
          const miss = want.filter((n) => gNames.map((x) => x.toLowerCase()).indexOf(n.toLowerCase()) === -1);
          check(combo + ': species spells', miss.length === 0, 'missing ' + miss.join(', '));
        }
        // granted spells resolve; free casts have a key; DCs are numbers
        prof.granted.forEach((g) => {
          check(combo + ': ' + g.name + ' in spellPool', !!DATA.spellPool[g.name]);
          if (g.free != null && !g.res) check(combo + ': ' + g.name + ' free-cast key', !!g.key);
          check(combo + ': ' + g.name + ' has a DC', typeof g.dc === 'number', g.from + ' ability=' + g.ability);
        });
        prof.resources.forEach((r) => check(combo + ': resource ' + r.label + ' max', Number.isInteger(r.max) && r.max >= 1, String(r.max)));
        // the L4 feat is visible and its fixed spells are granted
        const a4 = st.asiChoices[4];
        if (a4.type === 'feat') {
          check(combo + ': L4 feat in profile', prof.feats.some((f) => f.name === E.findFeat(a4.feat).name));
          const fe = E.findFeat(a4.feat);
          (fe.spells || []).filter((s) => s.name).forEach((s) => check(combo + ': feat spell ' + s.name, gNames.includes(s.name)));
        }
        // interaction notes for unusual combos
        if (cls === 'barbarian' && prof.granted.length) check(combo + ': rage note', prof.notes.some((n) => /raging/.test(n)));
        if (cls === 'druid') check(combo + ': wild shape casting note', prof.notes.some((n) => /Wild Shape/.test(n)));
        // known Wild Shape forms obey the 2024 Beast Shapes limits (MM 2025 CR + Fly Speed)
        if (cls === 'druid') {
          let maxCr = T >= 8 ? 1 : T >= 4 ? 0.5 : 0.25;
          if (cfg.subclass === 'moon' && T >= 3) maxCr = Math.max(maxCr, Math.floor(T / 3));
          const bad = (st.wildShapeForms || []).filter((n) => { const b = FACTS.beasts[n]; return !b || E.wgxCrValue(b.cr) > maxCr || (b.fly && T < 8); });
          check(combo + ': Wild Shape forms within limits', bad.length === 0, bad.join(', '));
        }
        // ---------- level-down T → 1 ----------
        for (let back = T - 1; back >= 1; back--) {
          autoLevelDown(E, cfg, st);
          const a = snapshot(cfg, st), b = snaps[back];
          if (back === 1) { delete a.__defaultSkills; delete b.__defaultSkills; }
          check(combo + ': rollback to L' + back, JSON.stringify(a) === JSON.stringify(b),
            JSON.stringify(Object.keys(a).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))));
        }
      } catch (err) {
        check(combo + ': flow completes', false, err.message + ' @ ' + (err.stack || '').split('\n')[1]);
      }
    }
  }
}

// ---- data integrity ----
{
  const missing = [];
  for (const [cls, levels] of Object.entries(DATA.spells)) {
    for (const [lvl, names] of Object.entries(levels)) for (const n of names) if (!DATA.spellPool[n]) missing.push(cls + ' L' + lvl + ': ' + n);
  }
  check('spell lists resolve in spellPool', missing.length === 0, missing.slice(0, 5).join('; '));
  const noMeta = Object.keys(DATA.spellPool).filter((n) => !DATA.spellMeta[n]);
  check('every spell has school/ritual meta', noMeta.length === 0, noMeta.join(', '));
  // House rule (2026-10-15): only 2024 PHB spells, on the 2024 class lists. Case-insensitive
  // because of the known "Pass Without Trace" casing (stored character data uses that key).
  const lc = (n) => n.toLowerCase();
  const phb = {}; Object.entries(FACTS.spells).forEach(([n, l]) => { phb[lc(n)] = l; });
  const notPhb = Object.keys(DATA.spellPool).filter((n) => !(lc(n) in phb));
  check('spellPool holds 2024 PHB spells only', notPhb.length === 0, notPhb.join(', '));
  const wrongLvl = Object.entries(DATA.spellPool).filter(([n, p]) => lc(n) in phb && p.level !== phb[lc(n)]).map(([n]) => n);
  check('spell levels match the 2024 PHB', wrongLvl.length === 0, wrongLvl.join(', '));
  const poolLc = new Set(Object.keys(DATA.spellPool).map(lc));
  const absent = Object.keys(FACTS.spells).filter((n) => !poolLc.has(lc(n)));
  check('every 2024 PHB spell is in spellPool', absent.length === 0, absent.join(', '));
  for (const [cls, lv] of Object.entries(FACTS.spellLists)) {
    for (let L = 0; L <= 9; L++) {
      const want = (lv[L] || []).map(lc).sort(), have = ((DATA.spells[cls] || {})[L] || []).map(lc).sort();
      check(cls + ' spell list level ' + L + ' = 2024 PHB', JSON.stringify(want) === JSON.stringify(have),
        'missing ' + want.filter((n) => !have.includes(n)).join(', ') + ' / extra ' + have.filter((n) => !want.includes(n)).join(', '));
    }
  }
  // Wild Shape forms: every 2025 Monster Manual Beast up to CR 6 (Circle of the Moon at 18), CR/Fly/swarm as in the MM
  const wantForms = Object.keys(FACTS.beasts).filter((n) => E.wgxCrValue(FACTS.beasts[n].cr) <= 6).sort();
  const haveForms = DATA.wildShapeForms.map((f) => f.name).sort();
  check('Wild Shape forms = MM 2025 beasts up to CR 6', JSON.stringify(wantForms) === JSON.stringify(haveForms),
    'missing ' + wantForms.filter((n) => !haveForms.includes(n)).join(', ') + ' / extra ' + haveForms.filter((n) => !wantForms.includes(n)).join(', '));
  DATA.wildShapeForms.forEach((f) => {
    const b = FACTS.beasts[f.name] || {};
    check('Wild Shape ' + f.name + ': CR/Fly/swarm as MM 2025', b.cr === f.cr && b.fly === !!f.fly && b.swarm === !!f.swarm, JSON.stringify(b));
  });
  check('77 feats (2024 PHB)', DATA.feats.length === 77, String(DATA.feats.length));
  // Class and subclass feature names per level = the 2024 PHB (levels 1..T). The PHB data also lists
  // option entries (Divine Order choices, Cunning Strike options, …) as features; those are skipped.
  const OPTION_ENTRIES = new Set(['Subclass Feature', 'Ability Score Improvement', 'Epic Boon', 'Protector', 'Thaumaturge',
    'Magician', 'Warden', 'Archer', 'Chalice', 'Dragon', 'Maneuver Options', 'Bonus Unarmed Strike', 'Dexterous Attacks',
    'Martial Arts Die', 'Darkness', 'Darkvision', 'Shadowy Figments', 'Poison (Cost: 1d6)', 'Trip (Cost: 1d6)',
    'Withdraw (Cost: 1d6)', 'Metamagic Options', 'Eldritch Invocation Options', 'Bardic Damage', 'Dance Virtuoso',
    'Unarmored Defense', 'Divine Strike', 'Potent Spellcasting', 'Primal Strike']);
  const nm = (s) => s.toLowerCase().replace(/[’']/g, "'").trim();
  const cmpNames = (label, want, have) => {
    const h = (have || []).map((f) => nm(f.name)), all = (want || []).map(nm);
    const w = (want || []).filter((n) => !OPTION_ENTRIES.has(n) || h.includes(nm(n))).map(nm);
    const miss = w.filter((n) => !h.includes(n)), extra = h.filter((n) => !all.includes(n));
    check(label + ' feature names = 2024 PHB', miss.length === 0 && extra.length === 0, 'missing ' + miss.join(' | ') + ' / ours only ' + extra.join(' | '));
  };
  for (const cls of CLASSES) {
    for (let L = 1; L <= T; L++) {
      cmpNames(cls + ' L' + L, FACTS.classes[cls].features[L], ((DATA[cls].features || {})[L] || []).filter((f) => !/^(Ability Score Improvement|Epic Boon)$/.test(f.name)));
      for (const [key, sub] of Object.entries(DATA[cls].subclasses)) {
        const sf = FACTS.subclasses[cls + '/' + key];
        if (sf && L >= 3) cmpNames(cls + '/' + key + ' L' + L, sf.features[L], (sub.features || {})[L]);
      }
    }
  }
  for (const cls of CLASSES) {
    const f = FACTS.classes[cls];
    check(cls + ': hit die ' + f.hitDie, DATA[cls].hitDie === f.hitDie);
    for (let L = 1; L <= T; L++) {
      if (f.prepared) check(cls + ': prepared table L' + L, (DATA.preparedTable[cls] || [])[L] === at(f.prepared, L), String((DATA.preparedTable[cls] || [])[L]));
      if (f.cantrips) check(cls + ': cantrips table L' + L, (DATA[cls].cantripsKnown || {})[L] === at(f.cantrips, L), String((DATA[cls].cantripsKnown || {})[L]));
    }
    check(cls + ': ASI at level 4', (DATA[cls].asiLevels || []).includes(4) === f.asiAt4);
  }
}

console.log('\nbuild-smoke (level ' + T + '): ' + pass + '/' + (pass + fail) + ' checks passed (' + run + ' characters)');
console.log('L4 feats exercised: ' + Object.entries(exercised).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v).join(', '));
if (failures.length) {
  const uniq = {};
  failures.forEach((f) => { const k = f.replace(/^[^:]+: /, ''); uniq[k] = (uniq[k] || 0) + 1; });
  console.log('\nFAILURES (' + failures.length + '), grouped:');
  Object.entries(uniq).sort((a, b) => b[1] - a[1]).slice(0, 60).forEach(([k, v]) => console.log(' ✗ ×' + v + '  ' + k));
  console.log('\nfirst 25 raw:');
  failures.slice(0, Number(process.env.RAW || 25)).forEach((f) => console.log('   ' + f));
  process.exit(1);
}

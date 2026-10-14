// build-smoke.mjs — level 1→4 test over EVERY class × subclass × species
// variant (48 × 15 = 720 characters). Run from the project root:
//   node Metadocs/LevelingUp/build-smoke.mjs
//
// Per character: fresh level 1 (origin feat in rotation, creation picks such as
// lineage / species ability / Divine Order deliberately missing), level-up
// 1→2→3→4 through the real builders (subclass = the combo's, a different L4
// feat in rotation, an optional swap now and then), then checks against
// l4-facts.json — numbers and spell names taken from the 2024 PHB data, an
// independent source — and finally level-down 4→1 with an exact rollback check.

import { readFileSync } from 'fs';
import { join } from 'path';
import { ROOT, loadEngine, makeChar, autoLevelUp, autoLevelDown, snapshot } from './harness.mjs';

const E = loadEngine();
const { DATA } = E;
const FACTS = JSON.parse(readFileSync(join(ROOT, 'Metadocs/LevelingUp/l4-facts.json'), 'utf8'));

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
const TOTALS = { invocations: { warlock: 3 }, metamagic: { sorcerer: 2 }, wildShapeForms: { druid: 6 },
  weaponMasteries: { barbarian: 3, fighter: 4, paladin: 2, ranger: 2, rogue: 2 } };

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
        for (const to of [2, 3, 4]) {
          const { picked } = autoLevelUp(E, combo, cfg, st, prefs);
          snaps[to] = snapshot(cfg, st);
          check(combo + ' L' + to + ': level', st.level === to);
          // per-level counts against the tables (covers what combo-smoke.mjs did for L1-3)
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
        // ---------- level 4 checks ----------
        const cf = FACTS.classes[cls];
        const tc = E.isThirdCaster(cls, cfg.subclass);
        const sf = FACTS.subclasses[cls + '/' + cfg.subclass] || {};
        check(combo + ': subclass is the requested one', cfg.subclass === sub);
        check(combo + ': L4 ASI/feat recorded', !!(st.asiChoices && st.asiChoices[4]), JSON.stringify(st.asiChoices));
        check(combo + ': hp = max', st.hp.current === E.getMaxHP(cfg, st), st.hp.current + ' vs ' + E.getMaxHP(cfg, st));
        // prepared / cantrips vs the 2024 tables
        const wantPrep = tc ? sf.preparedL4 : (cf.preparedL4 || 0);
        check(combo + ': prepared = ' + wantPrep, (st.prepared || []).length === wantPrep, String((st.prepared || []).length));
        const styleC = ((st.levelChoices[2] || {}).styleCantrips || []).length;
        const orderBonus = (cls === 'cleric' && cfg.divineOrder === 'thaumaturge') || (cls === 'druid' && cfg.primalOrder === 'magician') ? 1 : 0;
        const wantC = tc ? sf.cantripsL4 + (cfg.subclass === 'arcaneTrickster' ? 1 : 0) : (cf.cantripsL4 || 0) + orderBonus;
        check(combo + ': cantrips = ' + (wantC + styleC), (st.cantrips || []).length === wantC + styleC, String((st.cantrips || []).length));
        if (cf.slotsL4 && !tc) {
          const slots = E.getSpellSlots(cls, 4, cfg.subclass).filter((n) => n > 0);
          check(combo + ': slots ' + cf.slotsL4.join('/'), JSON.stringify(slots) === JSON.stringify(cf.slotsL4), slots.join('/'));
        }
        // counted options
        for (const [id, per] of Object.entries(TOTALS)) {
          if (per[cls] != null) check(combo + ': ' + id + ' = ' + per[cls], (st[id] || []).length === per[cls], String((st[id] || []).length));
        }
        if (cfg.subclass === 'battleMaster') check(combo + ': 3 maneuvers', (st.maneuvers || []).length === 3);
        // build profile
        const prof = E.getBuildProfile(cfg, st);
        const gNames = prof.granted.map((g) => g.name);
        const openIds = prof.open.map((o) => o.id);
        check(combo + ': no open choices', openIds.length === 0, prof.open.map((o) => o.what).join(' | '));
        // subclass always-prepared spells (2024 facts)
        let wantSub = sf.preparedAt3 || [];
        if (cls === 'druid' && cfg.subclass === 'land') wantSub = sf.variants['Arid Land'];
        const lc = (a) => a.map((x) => x.toLowerCase());
        const have = lc(gNames.concat(st.cantrips || []));
        const missSub = wantSub.concat(sf.knownAt3 || []).filter((n) => have.indexOf(n.toLowerCase()) === -1);
        check(combo + ': subclass spells', missSub.length === 0, 'missing ' + missSub.join(', '));
        // species spells (2024 facts)
        if (factsKey) {
          const sp = (FACTS.species[factsSpecies].spells || {})[factsKey] || {};
          const want = (sp.cantrips || []).concat(sp.level3 || []).concat(sp.innate || []);
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
        // ---------- level-down 4 → 1 ----------
        for (const back of [3, 2, 1]) {
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
  check('77 feats (2024 PHB)', DATA.feats.length === 77, String(DATA.feats.length));
  for (const cls of CLASSES) {
    const f = FACTS.classes[cls];
    check(cls + ': hit die ' + f.hitDie, DATA[cls].hitDie === f.hitDie);
    if (f.preparedL4) check(cls + ': prepared table L4', (DATA.preparedTable[cls] || [])[4] === f.preparedL4);
    if (f.cantripsL4) check(cls + ': cantrips table L4', (DATA[cls].cantripsKnown || {})[4] === f.cantripsL4);
    check(cls + ': ASI at level 4', (DATA[cls].asiLevels || []).includes(4) === f.asiAt4);
  }
}

console.log('\nbuild-smoke: ' + pass + '/' + (pass + fail) + ' checks passed (' + run + ' characters)');
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

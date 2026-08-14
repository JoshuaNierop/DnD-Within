// combo-smoke.mjs — level-up engine smoke test over class × species combinations.
// Run from the project root:  node Metadocs/LevelingUp/combo-smoke.mjs
//
// Loads data.js + engine.js + wg-levelup.js in a Node vm sandbox (browser
// globals stubbed) and drives the pure level-up builders exactly like the
// modal does: for every combination it levels a fresh character 1→2→3 with
// auto-picked choices, verifies the resulting state against the 2024 tables,
// then levels back down to 1 and verifies a byte-precise rollback.
//
// Matrix: classes × species below. Human is the negative control (no species
// progression); tiefling/aasimar verify species features + resources at L3.

import { readFileSync } from 'fs';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (f) => readFileSync(join(ROOT, f), 'utf8');

// ---- sandbox: data.js + engine.js + wg-levelup.js + WG_SKILLS ----
const wgData = read('wg-data.js');
const skillsMatch = wgData.match(/const WG_SKILLS = \[[\s\S]*?\n\];/);
if (!skillsMatch) throw new Error('WG_SKILLS not found in wg-data.js');

const prelude = `
var WG_WIDGET_TYPES = {}; var WG_EDIT_CONFIG = {}; var WG_SOURCE_LABELS = {};
var localStorage = { getItem: function(){ return null; }, setItem: function(){} };
${skillsMatch[0]}
`;
const epilogue = `
__exports = { DATA, WG_SKILLS, getMod, getProfBonus, getAbilityScore, getHP, getMaxHP,
  getMaxPrepared, getMaxCantrips, getSpellcastingAbility, getSpellSlots, getClassResources,
  getLevelUpDelta, wgxScholarSkillKeys, wgxEligibleExpertise, wgxStyleBonus, wgxMaxSpellLevel,
  wgxChoiceNeeded, wgxLevelUpSteps, wgxBuildLevelUpPatch, wgxBuildLevelDownPatch };
`;
const sandbox = { console, __exports: null };
vm.createContext(sandbox);
vm.runInContext(prelude + read('data.js') + '\n' + read('engine.js') + '\n' + read('wg-levelup.js') + epilogue, sandbox);
const E = sandbox.__exports;
const { DATA } = E;

// ---- tiny check harness ----
let pass = 0, fail = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(name + (detail ? ' — ' + detail : '')); }
}

// Firebase-PATCH semantics: 'a/b' keys are deep paths; null AND empty
// arrays/objects delete the key (RTDB never stores empty containers).
function isEmptyContainer(v) {
  return (Array.isArray(v) && v.length === 0) ||
    (v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
}
function applyPatch(obj, patch) {
  for (const [key, val] of Object.entries(patch || {})) {
    const parts = key.split('/');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null || typeof o[parts[i]] !== 'object') o[parts[i]] = {};
      o = o[parts[i]];
    }
    const last = parts[parts.length - 1];
    if (val === null || isEmptyContainer(val)) delete o[last]; else o[last] = val;
  }
}

const clone = (o) => JSON.parse(JSON.stringify(o));

// ---- synthetic character ----
function makeChar(className, race) {
  const config = {
    className, race,
    baseAbilities: { str: 10, dex: 14, con: 14, int: 14, wis: 14, cha: 14 },
    // arcana/history make Wizard Scholar eligible; stealth/perception generic.
    defaultSkills: ['arcana', 'history', 'stealth', 'perception'],
    expertSkills: [],
  };
  const state = { level: 1, cantrips: [], prepared: [], levelChoices: {} };
  state.hp = { current: E.getHP(config, state) };
  return { config, state };
}

// ---- auto-picker: mirrors the modal's pick logic ----
function stepSatisfied(step, picked) {
  const id = step.choice.id;
  if (id === 'subclass') return !!picked.subclass;
  if (id === 'fightingStyle') return !!picked.fightingStyle || step.needed === 0;
  if (id === 'scholar') return step.needed === 0 || !!picked.scholar;
  return (picked[id] || []).length === step.needed;
}

function firstN(arr, n) { return arr.slice(0, n); }

function makePick(step, cfg, st, delta, picked) {
  const cn = cfg.className, id = step.choice.id, n = step.needed;
  if (id === 'subclass') {
    const subs = DATA[cn].subclasses || {};
    const key = Object.keys(subs).find((k) => !subs[k].legacy);
    if (!key) throw new Error(cn + ': no non-legacy subclass');
    picked.subclass = key;
  } else if (id === 'metamagic') {
    const known = st.metamagic || [];
    picked.metamagic = firstN((DATA.metamagic || []).map((m) => m.name).filter((x) => !known.includes(x)), n);
  } else if (id === 'invocations') {
    const known = st.invocations || [];
    picked.invocations = firstN((DATA.invocations || [])
      .filter((op) => (op.minLevel || 1) <= delta.to && !known.includes(op.name)).map((op) => op.name), n);
  } else if (id === 'wildShapeForms') {
    const known = st.wildShapeForms || [];
    picked.wildShapeForms = firstN((DATA.wildShapeForms || []).map((f) => f.name).filter((x) => !known.includes(x)), n);
  } else if (id === 'fightingStyle') {
    // Prefer the class-bonus option (Blessed/Druidic Warrior) to exercise the
    // dynamic bonus-cantrip follow-up step.
    const extras = (DATA.classFightingBonus || {})[cn] || [];
    if (extras.length) picked.fightingStyle = extras[0].name;
    else picked.fightingStyle = (DATA.feats || []).filter((f) => f.category === 'fighting')[0].name;
    delete picked.styleCantrips; // like the UI: style change resets bonus picks
  } else if (id === 'styleCantrips') {
    const list = (DATA.spells[step.choice.list] || {})[0] || [];
    picked.styleCantrips = firstN(list.filter((x) => !(st.cantrips || []).includes(x)), n);
  } else if (id === 'expertise') {
    picked.expertise = firstN(E.wgxEligibleExpertise(cfg, null).map((s) => s.key), n);
  } else if (id === 'scholar') {
    const el = E.wgxEligibleExpertise(cfg, E.wgxScholarSkillKeys());
    if (el.length) picked.scholar = el[0].key;
  } else if (id === 'cantrips') {
    const list = (DATA.spells[cn] || {})[0] || [];
    picked.cantrips = firstN(list.filter((x) => !(st.cantrips || []).includes(x)), n);
  } else if (id === 'spells') {
    const maxLvl = E.wgxMaxSpellLevel(cn, delta);
    let pool = [];
    for (let sl = 1; sl <= maxLvl; sl++) pool = pool.concat((DATA.spells[cn] || {})[sl] || []);
    picked.spells = firstN(pool.filter((x) => !(st.prepared || []).includes(x)), n);
  } else {
    throw new Error('unknown choice id: ' + id);
  }
}

function autoLevelUp(combo, cfg, st) {
  const delta = E.getLevelUpDelta(cfg, st, (st.level || 1) + 1);
  const picked = {};
  let guard = 0;
  for (;;) {
    if (++guard > 25) throw new Error(combo + ': autopick did not converge');
    const steps = E.wgxLevelUpSteps(delta, cfg, st, picked);
    const open = steps.find((s) => s.kind === 'choice' && !stepSatisfied(s, picked));
    if (!open) break;
    makePick(open, cfg, st, delta, picked);
    // A pick may still leave the step unsatisfied (pool too small) — that is a
    // real data bug; detect no-progress instead of looping forever.
    const after = E.wgxLevelUpSteps(delta, cfg, st, picked).find((s) => s.kind === 'choice' && !stepSatisfied(s, picked));
    if (after && after.choice.id === open.choice.id &&
        JSON.stringify(after.choice) === JSON.stringify(open.choice)) {
      throw new Error(combo + ': cannot satisfy step "' + open.choice.id + '" (needed ' + open.needed + ', pool exhausted)');
    }
  }
  const patches = E.wgxBuildLevelUpPatch(cfg, st, delta, picked);
  applyPatch(st, patches.statePatch);
  if (patches.configPatch) applyPatch(cfg, patches.configPatch);
  return { delta, picked };
}

function autoLevelDown(cfg, st) {
  const patches = E.wgxBuildLevelDownPatch(cfg, st);
  applyPatch(st, patches.statePatch);
  if (patches.configPatch) applyPatch(cfg, patches.configPatch);
  return patches;
}

// Keys whose values must round-trip exactly through level-down.
const ROLLBACK_KEYS = ['level', 'cantrips', 'prepared', 'metamagic', 'invocations',
  'wildShapeForms', 'fightingStyles', 'levelChoices', 'hp'];
function snapshot(cfg, st) {
  // Normalize like Firebase: empty containers don't exist.
  const norm = (v) => (v == null || isEmptyContainer(v)) ? null : clone(v);
  const s = {};
  for (const k of ROLLBACK_KEYS) s[k] = norm(st[k]);
  s.__subclass = cfg.subclass ?? null;
  s.__expertSkills = norm(cfg.expertSkills);
  return s;
}
function sameSnapshot(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// ---- expectations per class/species ----
const CASTERS = ['paladin', 'druid', 'sorcerer', 'wizard', 'warlock', 'ranger', 'bard', 'cleric'];
const SPECIES_L3 = {
  tiefling: { feature: 'Fiendish Legacy Spell', resource: 'fiendishLegacy' },
  aasimar: { feature: 'Celestial Revelation', resource: 'celestialRevelation' },
  highElf: { feature: 'Elf Lineage: Detect Magic', resource: 'highElfSpell' },
  human: null,
};
const CLASS_RESOURCES_L3 = {
  paladin: ['layOnHands', 'paladinSmite', 'channelDivinity'],
  druid: ['wildShape'],
  sorcerer: ['innateSorcery', 'sorceryPoints'],
  wizard: ['arcaneRecovery'],
  warlock: ['magicalCunning'],
  ranger: ['favoredEnemy'],
  fighter: ['secondWind'],
  rogue: [], // psionicDice only for soulknife — checked dynamically below
  bard: [], cleric: [], monk: [], barbarian: [],
};

// Full 12 × 4 matrix — the requested combos (paladin/druid/sorcerer/wizard/
// rogue/warlock × tiefling/aasimar) plus the rest, which costs nothing extra.
const CLASSES = ['paladin', 'druid', 'sorcerer', 'wizard', 'rogue', 'warlock',
  'ranger', 'fighter', 'bard', 'cleric', 'monk', 'barbarian'];
const SPECIES = ['tiefling', 'aasimar', 'highElf', 'human'];

for (const cls of CLASSES) {
  for (const race of SPECIES) {
    const combo = cls + '×' + race;
    const { config: cfg, state: st } = makeChar(cls, race);
    const snaps = { 1: snapshot(cfg, st) };
    const deltas = {};

    try {
      for (const to of [2, 3]) {
        const { delta, picked } = autoLevelUp(combo, cfg, st);
        deltas[to] = delta;
        snaps[to] = snapshot(cfg, st);

        check(combo + ' L' + to + ': level', st.level === to);
        // Empty records are dropped (Firebase never stores {}), so only levels
        // with actual picks must appear in levelChoices.
        const madePicks = Object.keys(picked).length > 0;
        check(combo + ' L' + to + ': levelChoices recorded', madePicks ? !!st.levelChoices[to] : !st.levelChoices[to]);
        check(combo + ' L' + to + ': hp.current = new max', st.hp.current === delta.newMaxHp,
          st.hp.current + ' vs ' + delta.newMaxHp);

        const mod = E.getMod(E.getAbilityScore(cfg, st, E.getSpellcastingAbility(cls, cfg.subclass)));
        const wantPrepared = CASTERS.includes(cls) ? E.getMaxPrepared(st, mod, cls) : 0;
        check(combo + ' L' + to + ': prepared count = 2024 table', (st.prepared || []).length === wantPrepared,
          (st.prepared || []).length + ' vs ' + wantPrepared);

        const list0 = (DATA.spells[cls] || {})[0] || [];
        const bonusCantrips = ((st.levelChoices[2] || {}).styleCantrips || []).length;
        const wantCantrips = Math.min(E.getMaxCantrips(to, cls), list0.length) + bonusCantrips;
        check(combo + ' L' + to + ': cantrip count', (st.cantrips || []).length === wantCantrips,
          (st.cantrips || []).length + ' vs ' + wantCantrips);
      }

      // L3 class-specific totals (self-heal semantics)
      if (cls === 'sorcerer') check(combo + ': 2 metamagic', (st.metamagic || []).length === 2);
      if (cls === 'warlock') check(combo + ': 3 invocations (total heal)', (st.invocations || []).length === 3);
      if (cls === 'druid') check(combo + ': 4 wild shape forms (total heal)', (st.wildShapeForms || []).length === 4);
      if (cls === 'paladin') {
        check(combo + ': Blessed Warrior picked', (st.fightingStyles || []).includes('Blessed Warrior'));
        check(combo + ': 2 cleric bonus cantrips', ((st.levelChoices[2] || {}).styleCantrips || []).length === 2);
      }
      if (cls === 'wizard') check(combo + ': scholar expertise', (cfg.expertSkills || []).length === 1);
      check(combo + ': subclass set at L3', !!cfg.subclass);

      // Species progression at L3
      const spec = SPECIES_L3[race];
      const featNames = deltas[3].features.filter((f) => f.source === 'species').map((f) => f.name);
      if (spec) {
        check(combo + ': species feature in L3 delta', featNames.includes(spec.feature), featNames.join(',') || 'none');
        check(combo + ': species resource unlocks at L3', deltas[3].newResources.some((r) => r.id === spec.resource));
      } else {
        check(combo + ': human has no species features', featNames.length === 0, featNames.join(','));
      }

      // Resources active at L3
      const resIds = E.getClassResources(cfg, st).map((r) => r.id);
      for (const id of CLASS_RESOURCES_L3[cls]) {
        check(combo + ': resource ' + id + ' active', resIds.includes(id), 'have: ' + resIds.join(','));
      }
      if (cls === 'rogue' && cfg.subclass === 'soulknife') {
        check(combo + ': psionicDice active', resIds.includes('psionicDice'));
      }
      if (race === 'aasimar') check(combo + ': healingHands active', resIds.includes('healingHands'));

      // Level-down rollback 3→2→1 must restore each snapshot exactly
      for (const back of [2, 1]) {
        autoLevelDown(cfg, st);
        check(combo + ': rollback to L' + back + ' exact', sameSnapshot(snapshot(cfg, st), snaps[back]));
      }
    } catch (err) {
      check(combo + ': flow completes', false, err.message);
    }
  }
}

// ---- data integrity: every class spell list entry resolves in spellPool ----
{
  const missing = [];
  for (const [cls, levels] of Object.entries(DATA.spells)) {
    for (const [lvl, names] of Object.entries(levels)) {
      for (const n of names) if (!DATA.spellPool[n]) missing.push(cls + ' L' + lvl + ': ' + n);
    }
  }
  check('spell lists resolve in spellPool', missing.length === 0, missing.slice(0, 5).join('; '));
  for (const cls of CLASSES) {
    check('levelUpChoices defined: ' + cls, !!DATA.levelUpChoices[cls]);
  }
  for (const race of ['tiefling', 'aasimar', 'highElf', 'human']) {
    check('speciesProgression defined: ' + race, race in DATA.speciesProgression);
  }
}

// ---- report ----
console.log('\ncombo-smoke: ' + pass + '/' + (pass + fail) + ' checks passed');
if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log(' ✗ ' + f);
  process.exit(1);
}

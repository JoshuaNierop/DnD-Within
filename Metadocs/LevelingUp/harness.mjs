// harness.mjs — loads the real D&D Within rules engine + level-up builders in a
// Node vm sandbox (browser globals stubbed) and drives them like the modal does.
// Shared by build-smoke.mjs (tests) and build-overview.mjs (combination overviews).

import { readFileSync } from 'fs';
import vm from 'vm';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const read = (f) => readFileSync(join(ROOT, f), 'utf8');

export function loadEngine() {
  const wgData = read('wg-data.js');
  const skillsMatch = wgData.match(/const WG_SKILLS = \[[\s\S]*?\n\];/);
  const labelsMatch = wgData.match(/const WG_ABILITY_LABELS = \{[\s\S]*?\n\};/);
  if (!skillsMatch || !labelsMatch) throw new Error('WG_SKILLS / WG_ABILITY_LABELS not found in wg-data.js');
  const prelude = `
var WG_WIDGET_TYPES = {}; var WG_EDIT_CONFIG = {}; var WG_SOURCE_LABELS = {};
var localStorage = { getItem: function(){ return null; }, setItem: function(){} };
${skillsMatch[0]}
${labelsMatch[0]}
`;
  const epilogue = `
__exports = { DATA, WG_SKILLS, getMod, getProfBonus, getAbilityScore, getHP, getMaxHP, getAC,
  getMaxPrepared, getMaxCantrips, getSpellcastingAbility, getSpellSlots, getClassResources, getSpellListClass, getSpellLists,
  getLevelUpDelta, getBuildProfile, getGrantedSpells, featInstances, featPrereqMet, findFeat, choiceTotal,
  openFeatPicks, numMap, isThirdCaster,
  wgxScholarSkillKeys, wgxEligibleExpertise, wgxStyleBonus, wgxMaxSpellLevel, wgxSpellOptions, wgxMasteryOptions,
  wgxCrValue, wgxWildShapeOptions, wgxChoiceNeeded, wgxLevelUpSteps, wgxStepComplete, wgxSwapOptions, wgxBuildLevelUpPatch,
  wgxBuildLevelDownPatch, wgxHasSkill, getSkillBonus, getEffectiveAbilities, getSpeed, getDarkvision, getInitiative };
__exports.__global = this;   // the sandbox itself (UI tests drive the level-up window through it)
`;
  const sandbox = { console, __exports: null };
  vm.createContext(sandbox);
  vm.runInContext(prelude + read('data.js') + '\n' + read('data-rules.js') + '\n' + read('engine.js') + '\n' +
    read('wg-levelup.js') + epilogue, sandbox);
  return sandbox.__exports;
}

// Firebase-PATCH semantics: 'a/b' keys are deep paths; null AND empty
// arrays/objects delete the key (RTDB never stores empty containers).
export function isEmptyContainer(v) {
  return (Array.isArray(v) && v.length === 0) ||
    (v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);
}
export function applyPatch(obj, patch) {
  for (const [key, val] of Object.entries(patch || {})) {
    const parts = key.split('/');
    let o = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null || typeof o[parts[i]] !== 'object') o[parts[i]] = {};
      o = o[parts[i]];
    }
    const last = parts[parts.length - 1];
    if (val === null || isEmptyContainer(val)) delete o[last]; else o[last] = JSON.parse(JSON.stringify(val));
  }
}
export const clone = (o) => JSON.parse(JSON.stringify(o));

// Primary ability per class (synthetic characters get 16 there, 14 in CON).
const PRIMARY = { barbarian: 'str', bard: 'cha', cleric: 'wis', druid: 'wis', fighter: 'str', monk: 'dex',
  paladin: 'str', ranger: 'dex', rogue: 'dex', sorcerer: 'cha', warlock: 'cha', wizard: 'int' };
const SECONDARY = { barbarian: 'con', bard: 'dex', cleric: 'con', druid: 'con', fighter: 'con', monk: 'wis',
  paladin: 'cha', ranger: 'wis', rogue: 'int', sorcerer: 'con', warlock: 'con', wizard: 'con' };
export function makeChar(E, cls, race, opts = {}) {
  const ab = { str: 10, dex: 13, con: 14, int: 10, wis: 12, cha: 10 };
  ab[PRIMARY[cls]] = 16;
  if (SECONDARY[cls] !== 'con') ab[SECONDARY[cls]] = 14;
  const config = {
    className: cls, race,
    baseAbilities: ab,
    defaultSkills: ['arcana', 'history', 'stealth', 'perception'],
    expertSkills: [],
  };
  if (opts.originFeat) config.originFeat = opts.originFeat;
  const state = { level: 1, cantrips: [], prepared: [], levelChoices: {} };
  if (opts.originFeat) state.asiChoices = { 1: { type: 'feat', feat: opts.originFeat, origin: true } };
  state.hp = { current: E.getHP(config, state) };
  return { config, state };
}

const firstN = (arr, n) => arr.slice(0, n);
const getPath = (o, path) => path.split('.').reduce((a, p) => (a == null ? undefined : a[p]), o);
const setPath = (o, path, v) => {
  const parts = path.split('.');
  let x = o;
  for (let i = 0; i < parts.length - 1; i++) { if (x[parts[i]] == null || typeof x[parts[i]] !== 'object') x[parts[i]] = {}; x = x[parts[i]]; }
  x[parts[parts.length - 1]] = v;
};

// Auto-picker: mirrors the modal; `prefs` steer the picks so a test matrix
// exercises many options (subclass, lineage, feat at L4, swaps…).
export function makePick(E, step, cfg, st, delta, picked, prefs) {
  const { DATA } = E;
  const c = step.choice, id = c.id, n = step.needed;
  const eff = Object.assign({}, cfg, picked.subclass ? { subclass: picked.subclass } : {});
  const stAt = Object.assign({ asiChoices: {} }, st, { level: delta.to });
  if (id === 'subclass') picked.subclass = prefs.subclass;
  else if (id === 'lineage') picked.lineage = prefs.lineage || Object.keys(DATA[cfg.race].lineages)[0];
  else if (id === 'landType') picked.landType = prefs.landType || 'arid';
  else if (id === 'huntersPrey') picked.huntersPrey = 'Colossus Slayer';
  else if (id === 'option') {
    const od = DATA.optionChoices.find((o) => o.id === c.opt);
    picked.options = picked.options || {};
    picked.options[c.opt] = od.options[(prefs.optionIndex || 0) % od.options.length].name;
  }
  else if (id === 'speciesAbility') picked.speciesAbility = prefs.speciesAbility || 'cha';
  else if (id === 'order') picked.order = prefs.order || (cfg.className === 'cleric' ? 'thaumaturge' : 'magician');
  else if (id === 'versatileFeat' || id === 'asi' || id === 'lessonsFeat') {
    const owner = id === 'asi' ? 'asi' : id === 'lessonsFeat' ? 'lessons' : 'versatile';
    // level 19: an Epic Boon (rotated through the matrix)
    const want = id === 'asi' ? (delta.to === 19 && prefs.epicBoon ? prefs.epicBoon : prefs.asiFeat) : id === 'lessonsFeat' ? 'Tough' : (prefs.versatileFeat || 'Skilled');
    const fe = want && want !== 'Ability Score Improvement' ? E.findFeat(want) : null;
    const ok = fe && E.featPrereqMet(fe, eff, stAt, delta.to).ok;
    if (id === 'asi' && !ok) picked.asi = { type: 'asi', abilities: {} };
    else if (!ok) {
      const alt = DATA.feats.filter((f) => f.category === 'origin' && E.featPrereqMet(f, eff, stAt, delta.to).ok && !f.spells)[0];
      picked[owner] = { type: 'feat', feat: alt.name };
    } else {
      picked[owner] = { type: 'feat', feat: fe.name };
      if (Array.isArray(fe.ability) && fe.ability.length === 1) picked[owner].ability = fe.ability[0];
    }
  } else if (id === 'asiAbilities') {
    const ab = {};
    const pri = PRIMARY[cfg.className];
    const score = (k) => E.getAbilityScore(cfg, stAt, k);
    if (score(pri) + 2 <= 20) ab[pri] = 2;
    else { const two = ['con', 'dex', 'wis', 'str', 'int', 'cha'].filter((k) => score(k) < 20).slice(0, 2); two.forEach((k) => { ab[k] = 1; }); }
    picked.asi.abilities = ab;
  } else if (id === 'featAbility') {
    const rec = getPath(picked, c.owner);
    const saves = (DATA[cfg.className] || {}).savingThrows || [];
    const capA = (E.findFeat(rec.feat) || {}).abilityMax || 20;
    const opts = c.options.filter((a) => rec.feat !== 'Resilient' || saves.indexOf(a) === -1).filter((a) => E.getAbilityScore(cfg, stAt, a) < capA);
    rec.ability = opts[0];
  } else if (id === 'featSpellAbility') setPath(picked, c.owner + '.spellAbility', prefs.spellAbility || 'wis');
  else if (id === 'featElement') setPath(picked, c.owner + '.element', 'fire');
  else if (id === 'featSpells') {
    const known = (st.cantrips || []).concat(st.prepared || []).concat(E.getGrantedSpells(cfg, st).filter((g) => !g.open).map((g) => g.name));
    const opts = E.wgxSpellOptions(c.filter).map((e) => e.nm).filter((nm) => !known.includes(nm));   // the picker greys out what you already have
    setPath(picked, c.owner + '.' + c.pick, firstN(opts, n));
  } else if (id === 'featSkills' || id === 'featExpertise') {
    const rec = getPath(picked, c.owner) || {};
    const prof = c.anySkill ? E.WG_SKILLS.map((s) => s.key) : (cfg.defaultSkills || []).concat(id === 'featExpertise' ? (rec.skills || []) : []);
    const keys = E.WG_SKILLS.map((s) => s.key).filter((k) => !c.options || c.options.indexOf(k) !== -1).filter((k) => {
      const isProf = E.wgxHasSkill(prof, k), isXp = E.wgxHasSkill(cfg.expertSkills, k);
      if (id === 'featExpertise') return isProf && !isXp;
      if (c.mode === 'proficiency') return !isProf;
      return !isXp;
    });
    setPath(picked, c.owner + '.' + (id === 'featExpertise' ? 'expertise' : 'skills'), firstN(keys, n));
  } else if (id === 'metamagic') picked.metamagic = firstN(DATA.metamagic.map((m) => m.name).filter((x) => !(st.metamagic || []).includes(x)), n);
  else if (id === 'invocations') {
    const known = st.invocations || [];
    const want = prefs.invocations || [];
    const pool = DATA.invocations.filter((op) => (op.minLevel || 1) <= delta.to && !known.includes(op.name) && (!op.requires || known.includes(op.requires))).map((op) => op.name);
    picked.invocations = firstN(want.filter((w) => pool.includes(w)).concat(pool.filter((p) => !want.includes(p))), n);
  } else if (id === 'wildShapeForms') {
    picked.wildShapeForms = firstN(E.wgxWildShapeOptions(delta.to, eff.subclass).map((f) => f.name).filter((x) => !(st.wildShapeForms || []).includes(x)), n);
  } else if (id === 'maneuvers') picked.maneuvers = firstN(DATA.maneuvers.map((m) => m.name).filter((x) => !(st.maneuvers || []).includes(x)), n);
  else if (id === 'weaponMasteries') picked.weaponMasteries = firstN(E.wgxMasteryOptions(cfg.className).map((w) => w.name).filter((x) => !(st.weaponMasteries || []).includes(x)), n);
  else if (id === 'fightingStyle') {
    const extras = (DATA.classFightingBonus || {})[cfg.className] || [];
    const have = st.fightingStyles || [];
    picked.fightingStyle = (prefs.classStyle && extras.length && !have.length) ? extras[0].name
      : DATA.feats.filter((f) => f.category === 'fighting' && !have.includes(f.name))[0].name;
    delete picked.styleCantrips;
  } else if (id === 'styleCantrips') {
    const list = (DATA.spells[c.list] || {})[0] || [];
    picked.styleCantrips = firstN(list.filter((x) => !(st.cantrips || []).includes(x)), n);
  } else if (id === 'expertise') picked.expertise = firstN(E.wgxEligibleExpertise(cfg, null).map((s) => s.key), n);
  else if (id === 'scholar') { const el = E.wgxEligibleExpertise(cfg, E.wgxScholarSkillKeys()); if (el.length) picked.scholar = el[0].key; }
  else if (id === 'cantrips') {
    const listCn = E.getSpellListClass(cfg.className, eff.subclass);
    picked.cantrips = firstN(((DATA.spells[listCn] || {})[0] || []).filter((x) => !(st.cantrips || []).includes(x)), n);
  } else if (id === 'spells') {
    const maxLvl = E.wgxMaxSpellLevel(cfg.className, delta, E.getSpellSlots(cfg.className, delta.to, eff.subclass));
    const pool = E.wgxSpellOptions({ list: E.getSpellLists(cfg.className, eff.subclass, delta.to), maxLevel: maxLvl }).map((e) => e.nm);
    // a Bard with Magical Secrets takes the last new spell from another list, so that path is exercised too
    const fresh = pool.filter((x) => !(st.prepared || []).includes(x));
    const other = cfg.className === 'bard' && delta.to >= 10 ? fresh.filter((x) => !Object.values(DATA.spells.bard).flat().includes(x)) : [];
    picked.spells = other.length && n > 0 ? firstN(fresh.filter((x) => x !== other[0]), n - 1).concat([other[0]]) : firstN(fresh, n);
  } else if (id === 'swaps') {
    picked.swaps = {};
    if (prefs.swap) {
      const o = E.wgxSwapOptions(cfg, st, delta)[0];
      if (o) picked.swaps[o.id] = { out: o.have[0], in: o.pool[0] };
    }
  } else throw new Error('unknown choice id: ' + id);
}

export function autoLevelUp(E, combo, cfg, st, prefs = {}) {
  const delta = E.getLevelUpDelta(cfg, st, (st.level || 1) + 1);
  const picked = {};
  let guard = 0;
  const done = new Set();
  for (;;) {
    if (++guard > 60) throw new Error(combo + ': autopick did not converge');
    const steps = E.wgxLevelUpSteps(delta, cfg, st, picked);
    const open = steps.find((s) => s.kind === 'choice' && !E.wgxStepComplete(s, picked) && !done.has(JSON.stringify(s.choice)));
    if (!open) break;
    makePick(E, open, cfg, st, delta, picked, prefs);
    if (open.choice.id === 'swaps') done.add(JSON.stringify(open.choice));
    const again = E.wgxLevelUpSteps(delta, cfg, st, picked).find((s) => s.kind === 'choice' && JSON.stringify(s.choice) === JSON.stringify(open.choice));
    if (again && !E.wgxStepComplete(again, picked) && open.choice.id !== 'swaps') {
      throw new Error(combo + ': cannot satisfy step "' + open.choice.id + '" (needed ' + open.needed + ')');
    }
  }
  const patches = E.wgxBuildLevelUpPatch(cfg, st, delta, picked);
  applyPatch(st, patches.statePatch);
  if (patches.configPatch) applyPatch(cfg, patches.configPatch);
  return { delta, picked };
}

export function autoLevelDown(E, cfg, st) {
  const patches = E.wgxBuildLevelDownPatch(cfg, st);
  applyPatch(st, patches.statePatch);
  if (patches.configPatch) applyPatch(cfg, patches.configPatch);
  return patches;
}

// Keys whose values must round-trip exactly through level-down (creation-time
// fixes such as lineage or origin-feat picks are kept on purpose).
const ROLLBACK_KEYS = ['level', 'cantrips', 'prepared', 'metamagic', 'invocations', 'wildShapeForms', 'maneuvers',
  'weaponMasteries', 'fightingStyles', 'levelChoices', 'hp', 'featurePicks'];
export function snapshot(cfg, st, E) {
  const norm = (v) => (v == null || isEmptyContainer(v)) ? null : clone(v);
  const s = {};
  for (const k of ROLLBACK_KEYS) s[k] = norm(st[k]);
  // stored picks of one-of-N feature options (Blessed Strikes, …)
  for (const o of ((E && E.DATA.optionChoices) || [])) s['opt:' + o.stateKey] = norm(st[o.stateKey]);
  const asi = Object.assign({}, st.asiChoices || {}); delete asi[1];
  s.asi = norm(asi);
  s.__subclass = cfg.subclass ?? null;
  s.__expertSkills = norm(cfg.expertSkills);
  s.__defaultSkills = norm(cfg.defaultSkills);
  return s;
}

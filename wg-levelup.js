// wg-levelup.js — Level Up / Level Down widget + BG3-style level-up menu.
// Leveling Up subproject (Metadocs/LevelingUp/Design.md + L4-Design.md).
//
// Widget: three tiles. "Level N · Build" opens the Build overview (wg-build.js).
// "Level Up" glows when character level < party level (dw_party_level). Click →
// step-based modal: overview of everything gained (class + subclass + species,
// badged by source), one step per choice, then confirm → PATCH state/config via
// the standard wg pipeline. "Level Down" asks for confirmation, then removes the
// top level and the choices recorded for it (state.levelChoices[N]).
//
// Steps (built purely from getLevelUpDelta + current picks):
//   fixes      — creation picks that were never recorded (lineage, species
//                spellcasting ability, Divine/Primal Order, Human Versatile feat,
//                open feat spell picks). Kept on Level Down (not level-bound).
//   choices    — subclass, fighting style (+ Blessed/Druidic Warrior cantrips),
//                expertise, scholar, Ability Score Improvement or feat (+ the
//                feat's own picks), and counted options with (total − known)
//                semantics: invocations, metamagic, wild shape forms,
//                maneuvers, weapon masteries.
//   spells     — new cantrips / prepared spells (2024 fixed tables).
//   swaps      — optional level-up swaps (cantrip, spell, invocation,
//                metamagic, fighter Fighting Style).
// Every pick is stored under state.levelChoices[N] so Level Down can roll it
// back precisely. The ASI/feat itself lives in state.asiChoices[N] (the engine
// reads ability bonuses, Tough, Defense etc. from there).
//
// Load order: AFTER wg-data.js (WG_SKILLS) and AFTER wg-rest.js (reuses wgxPatchState).
// Runtime globals: WG_CHAR_CACHE, state, DATA, engine fns (getLevelUpDelta,
// getMaxHP, getProfBonus, featInstances, featPrereqMet, …), FIREBASE_DB,
// fetchCharacterData, showToast, wgxConfirmModal (wg-ui.js).

var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};
var WG_INFOBOX_CLICK_HANDLERS = (typeof WG_INFOBOX_CLICK_HANDLERS !== 'undefined') ? WG_INFOBOX_CLICK_HANDLERS : {};

Object.assign(WG_WIDGET_TYPES, {
  levelUp: {
    label: 'Level Up', kind: 'infobox', source: 'levelup',
    spanUnits: 4, spanUnitsY: 3,
    cfg: { cellPadding: 6, widgetPadding: 6, infoBoxSpacing: 4, infoBoxPadding: 0 },
  },
});
WG_EDIT_CONFIG.levelup = { mode: 'always', editColumnIdx: 0 };
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.levelup = 'Level Up';

// ===== Party level (DM-set display level, localStorage-synced) =====
function wgxPartyLevel() {
  var v = parseInt(localStorage.getItem('dw_party_level') || '0', 10);
  return (v > 0) ? v : 0;
}

// ===== Infobox-builder =====
function wgxBuildLevelUp(widget) {
  var raw = WG_CHAR_CACHE[state.characterId] || {};
  var st = raw.state || {};
  var lvl = st.level || 1;
  var d = widget.data, L = widget.layout;
  d.tooltips = null;
  d.columns = [{ key: 'cell', label: 'Level' }];
  var behind = wgxPartyLevel() > lvl;
  var rows = [], rowCls = [];
  // Row 0: current level — opens the Build overview (spells, feats, actions).
  rows.push(['Level ' + lvl + ' · Build']);
  rowCls.push('wgx-lu-levelrow wgx-act-build');
  rows.push(['⬆ Level Up (' + lvl + ' → ' + (lvl + 1) + ')']);
  rowCls.push('wgx-act-levelup' + (behind ? ' wgx-act-levelup-glow' : ''));
  rows.push(['⬇ Level Down']);
  rowCls.push(lvl > 1 ? 'wgx-act-leveldown' : 'wgx-act-leveldown wgx-act-disabled');
  d.rows = rows;
  L.columnHighlight = [false]; L.columnAlign = ['center']; L.columnAllCaps = [false];
  L.columnMaxChars = [null]; L.columnExtraClass = [null]; L.columnMinWidthPx = [null];
  L.columnFontScale = [1]; L.rowExtraClass = rowCls; L.stacking = 'horizontal';
}
WG_EXTRA_INFOBOX_BUILDERS.levelup = wgxBuildLevelUp;

// ===== Firebase config-PATCH (state PATCH comes from wg-rest.js: wgxPatchState) =====
async function wgxPatchConfig(charId, patch) {
  var url = FIREBASE_DB + '/dw/characters/' + encodeURIComponent(charId) + '/config.json';
  if (typeof dwRefreshIdToken === 'function') await dwRefreshIdToken();
  var res = await fetch(wgAuthUrl(url), { method: 'PATCH', body: JSON.stringify(patch), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' on config' + (await wgxHttpReason(res)));
}

// Firebase's own error text ({"error": "..."}) so a failed save toast says why.
async function wgxHttpReason(res) {
  try { var j = await res.json(); return j && j.error ? ' (' + j.error + ')' : ''; } catch (e) { return ''; }
}

// ============================================================
// Pure helpers (also exercised by the node smoke tests)
// ============================================================

var WGX_ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
var WGX_SCHOOL = { A: 'Abjuration', C: 'Conjuration', D: 'Divination', E: 'Enchantment', V: 'Evocation', I: 'Illusion', N: 'Necromancy', T: 'Transmutation' };

function wgxScholarSkillKeys() {
  return ['arcana', 'history', 'investigation', 'medicine', 'nature', 'religion'];
}

// Skill keys are stored inconsistently (creation wizard: "sleight of hand",
// level-up pickers: "sleightOfHand"); compare on a normalised form.
function wgxSkillNorm(k) { return String(k || '').toLowerCase().replace(/[^a-z]/g, ''); }
function wgxHasSkill(list, key) {
  var n = wgxSkillNorm(key);
  return (list || []).some(function (s) { return wgxSkillNorm(s) === n; });
}

// Skills eligible for a new Expertise pick: proficient, not already expert,
// optionally restricted to a fixed list (Wizard Scholar).
function wgxEligibleExpertise(cfg, restrictTo) {
  var prof = cfg.defaultSkills || [], xp = cfg.expertSkills || [];
  var skills = (typeof WG_SKILLS !== 'undefined') ? WG_SKILLS : [];
  return skills.filter(function (s) {
    if (!wgxHasSkill(prof, s.key)) return false;
    if (wgxHasSkill(xp, s.key)) return false;
    if (restrictTo && restrictTo.indexOf(s.key) === -1) return false;
    return true;
  });
}

// The class-specific Fighting Style alternative (Blessed/Druidic Warrior) that
// matches the currently picked style, or null.
function wgxStyleBonus(className, pickedStyle) {
  if (!pickedStyle) return null;
  var extras = (DATA.classFightingBonus || {})[className] || [];
  for (var i = 0; i < extras.length; i++) if (extras[i].name === pickedStyle) return extras[i];
  return null;
}

// Prepared maximum and slots at delta.to with this level-up's picks applied
// (an Eldritch Knight / Arcane Trickster gains spellcasting with its subclass).
function wgxEffCasting(cfg, st, delta, picked) {
  var eff = wgxEffCfg(cfg, picked || {});
  var stTo = Object.assign({ asiChoices: {} }, st, { level: delta.to });
  var ab = (typeof getSpellcastingAbility === 'function') ? getSpellcastingAbility(eff.className, eff.subclass) : 'cha';
  var mod = (typeof getMod === 'function') ? getMod(getAbilityScore(eff, stTo, ab)) : 0;
  return {
    prepared: (typeof getMaxPrepared === 'function') ? getMaxPrepared(stTo, mod, eff.className, eff.subclass) : (delta.prepared['new'] || 0),
    slots: (typeof getSpellSlots === 'function') ? getSpellSlots(eff.className, delta.to, eff.subclass) : (delta.slots['new'] || [])
  };
}

// Skill option list for a { id: 'skills' } choice as WG_SKILLS keys
// ('class' = the class's skill list; absent = every skill).
function wgxSkillOptionKeys(opts, className) {
  if (opts === 'class') opts = ((DATA[className] || {}).skillOptions || []).filter(function (o) { return o !== 'any'; });
  if (!opts || !opts.length) return null;
  var all = (typeof WG_SKILLS !== 'undefined') ? WG_SKILLS : [];
  return all.filter(function (s) { return opts.some(function (o) { return wgxSkillNorm(o) === wgxSkillNorm(s.key); }); }).map(function (s) { return s.key; });
}

// Subclass choices (subclass.choices[level]) for the levels this level-up
// covers — the subclass may be picked in this same level-up, so use eff.
function wgxSubclassChoices(eff, delta) {
  var cd = DATA[eff.className] || {};
  var sub = eff.subclass && cd.subclasses && cd.subclasses[eff.subclass];
  var out = [];
  if (!sub || !sub.choices) return out;
  for (var L = delta.from + 1; L <= delta.to; L++) (sub.choices[L] || []).forEach(function (c) { out.push(Object.assign({ level: L, source: 'subclass' }, c)); });
  return out;
}

// A { id: 'skills' } choice as a featSkills step (null when nothing is left to pick).
function wgxSkillChoiceStep(c, owner, eff) {
  if (c.fixed) return null;
  var opts = wgxSkillOptionKeys(c.options, eff.className);
  var all = (typeof WG_SKILLS !== 'undefined') ? WG_SKILLS.map(function (s) { return s.key; }) : [];
  var free = (opts || all).filter(function (k) { return !wgxHasSkill(eff.defaultSkills, k); }).length;
  var need = Math.min(c.count || 1, free);
  if (!need) return null;
  return { kind: 'choice', choice: { id: 'featSkills', owner: owner, count: need, options: opts, mode: 'proficiency', featName: c.featName, note: c.note || '' }, needed: need };
}

// Highest spell level pickable after this level-up (warlock = pact magic).
// delta.slots may predate a subclass picked in this level-up — pass slots
// (wgxEffCasting) to override.
function wgxMaxSpellLevel(className, delta, slots) {
  if (className === 'warlock') {
    var pl = (DATA.warlock && DATA.warlock.pactSlotLevel) || {};
    return pl[delta.to] || (delta.to >= 3 ? 2 : 1);
  }
  var s = slots || delta.slots['new'] || [];
  var m = 0;
  for (var i = 0; i < s.length; i++) if (s[i] > 0) m = i + 1;
  return m;
}

// Config as it will be after this level-up's picks (subclass, order, lineage…).
function wgxEffCfg(cfg, picked) {
  var c = Object.assign({}, cfg);
  if (picked.subclass) c.subclass = picked.subclass;
  if (picked.lineage) c.lineage = picked.lineage;
  if (picked.speciesAbility) c.speciesAbility = picked.speciesAbility;
  if (picked.order) { if (cfg.className === 'cleric') c.divineOrder = picked.order; else c.primalOrder = picked.order; }
  return c;
}

var WGX_LANDS = [['arid', 'Arid'], ['polar', 'Polar'], ['temperate', 'Temperate'], ['tropical', 'Tropical']];
var WGX_HUNTERS_PREY = [
  ['Colossus Slayer', 'Once per turn, a weapon hit deals an extra 1d8 damage if the target is missing any HP.'],
  ['Horde Breaker', 'Once per turn, make another attack with the same weapon against a different creature within 5 ft of the first target.']
];
var WGX_TOTAL_IDS = { invocations: 'invocations', metamagic: 'metamagic', wildShapeForms: 'wildShapeForms', maneuvers: 'maneuvers', weaponMasteries: 'weaponMasteries' };

// How many picks a choice step needs for this character right now.
// `total` semantics subtract what is already known; `count` is absolute.
function wgxChoiceNeeded(choice, cfg, st, picked) {
  var id = choice.id;
  picked = picked || {};
  if (id === 'subclass') return cfg.subclass ? 0 : 1;
  if (id === 'fightingStyle') return Math.max(0, (choice.total || 1) - (st.fightingStyles || []).length);
  if (id === 'expertise') {
    var el = wgxEligibleExpertise(cfg, null);
    return Math.min(choice.count || 1, el.length);
  }
  if (id === 'scholar') {
    return wgxEligibleExpertise(cfg, wgxScholarSkillKeys()).length ? 1 : 0;
  }
  if (WGX_TOTAL_IDS[id] && choice.totalAt) {
    var eff = wgxEffCfg(cfg, picked);
    var tot = (typeof choiceTotal === 'function') ? choiceTotal(id, eff, choice.totalAt) : 0;
    return Math.max(0, tot - (st[WGX_TOTAL_IDS[id]] || []).length);
  }
  if (choice.total != null) {
    var knownKey = WGX_TOTAL_IDS[id];
    var have = (knownKey && st[knownKey] || []).length;
    return Math.max(0, choice.total - have);
  }
  return choice.count || 1;
}

// Spells for a picker: { list?: class key or array of keys (absent = every
// class list), level (or maxLevel: every level 1..maxLevel), schools?:
// ['Divination', …], ritual?: true }. Returns [{ nm, lvl, sp, school, ritual }].
function wgxSpellOptions(filter) {
  var lists = filter.list ? [].concat(filter.list) : Object.keys(DATA.spells || {});
  var levels = [filter.level];
  if (filter.maxLevel) { levels = []; for (var L = filter.minLevel != null ? filter.minLevel : 1; L <= filter.maxLevel; L++) levels.push(L); }
  var seen = {}, out = [];
  levels.forEach(function (lv) {
    lists.forEach(function (cl) {
      ((DATA.spells[cl] || {})[lv] || []).forEach(function (nm) {
        if (seen[nm]) return;
        seen[nm] = true;
        var meta = (DATA.spellMeta || {})[nm] || '';
        var school = WGX_SCHOOL[meta.charAt(0)] || '';
        var ritual = meta.indexOf('r') !== -1;
        if (filter.schools && filter.schools.indexOf(school) === -1) return;
        if (filter.ritual && !ritual) return;
        if (filter.actionOnly && (DATA.spellPool[nm] || {}).time !== '1 action') return;   // Spell Mastery
        out.push({ nm: nm, lvl: lv, sp: DATA.spellPool[nm] || {}, school: school, ritual: ritual });
      });
    });
  });
  out.sort(function (a, b) { return (a.lvl - b.lvl) || a.nm.localeCompare(b.nm); });
  return out;
}

// Weapon kinds a class may pick for Weapon Mastery (2024: proficient kinds;
// Barbarian: melee only; Rogue: Simple + Martial with Finesse or Light).
function wgxMasteryOptions(className) {
  var all = DATA.weaponMasteryList || [];
  if (className === 'barbarian') return all.filter(function (w) { return /melee/.test(w.kind); });
  if (className === 'rogue') {
    var rogueMartial = ['Rapier', 'Scimitar', 'Shortsword', 'Whip', 'Hand Crossbow'];
    return all.filter(function (w) { return /^simple/.test(w.kind) || rogueMartial.indexOf(w.name) !== -1; });
  }
  return all;
}
function wgxCrValue(cr) { if (cr === '1/8') return 0.125; if (cr === '1/4') return 0.25; if (cr === '1/2') return 0.5; return parseFloat(cr) || 0; }

// Beast forms a druid of this level may learn: CR limit, Fly Speed from level 8.
function wgxWildShapeOptions(level, subclass) {
  var lim = (DATA.wildShapeLimits || function () { return { cr: 0.25 }; })(level, subclass);
  return (DATA.wildShapeForms || []).filter(function (fm) { return wgxCrValue(fm.cr) <= lim.cr && (lim.fly || !fm.fly); });
}

// The feat-specific picks (ability +1, spellcasting ability, spells, skills,
// element) a feat needs → list of sub-step descriptors.
function wgxFeatSubSteps(feat, owner, cfg, st) {
  var steps = [];
  if (!feat) return steps;
  if (feat.asi) { steps.push({ id: 'asiAbilities', owner: owner }); return steps; }
  if (Array.isArray(feat.ability) && feat.ability.length > 1) steps.push({ id: 'featAbility', owner: owner, options: feat.ability });
  if (feat.spellAbility === 'choose') steps.push({ id: 'featSpellAbility', owner: owner });
  (feat.spells || []).forEach(function (s) {
    if (!s.pick) return;
    var count = s.count === 'pb' ? getProfBonus((st.level || 1)) : (s.count || 1);
    steps.push({ id: 'featSpells', owner: owner, pick: s.pick, count: count, filter: { list: s.list, level: s.level, schools: s.schools, ritual: s.ritual } });
  });
  (feat.choices || []).forEach(function (c) {
    if (c.id === 'skills') {
      // Never ask for more skills than are still available (Skilled taken several times).
      var mode = c.mode || 'proficiency', cnt = c.count || 1;
      if (typeof WG_SKILLS !== 'undefined') {
        var elig = WG_SKILLS.filter(function (sk) {
          if (c.options && c.options.indexOf(sk.key) === -1) return false;
          return mode === 'proficiency' ? !wgxHasSkill(cfg.defaultSkills, sk.key) : !wgxHasSkill(cfg.expertSkills, sk.key);
        }).length;
        cnt = Math.min(cnt, elig);
      }
      if (cnt > 0) steps.push({ id: 'featSkills', owner: owner, count: cnt, options: c.options || null, mode: mode });
    }
    else if (c.id === 'expertise') {
      // anySkill (Boon of Skill): every skill counts as proficient. Never ask for more than is left.
      var xcnt = c.count || 1;
      if (typeof WG_SKILLS !== 'undefined') xcnt = Math.min(xcnt, WG_SKILLS.filter(function (sk) { return (c.anySkill || wgxHasSkill(cfg.defaultSkills, sk.key)) && !wgxHasSkill(cfg.expertSkills, sk.key); }).length);
      if (xcnt > 0) steps.push({ id: 'featExpertise', owner: owner, count: xcnt, anySkill: !!c.anySkill });
    }
    else if (c.id === 'element') steps.push({ id: 'featElement', owner: owner, options: c.options });
  });
  return steps;
}

// picked.<owner> holds a feat record under construction ('asi' or 'versatile').
function wgxOwnerRec(picked, owner) { return picked[owner] || {}; }

// Build the wizard steps from the delta + current picks. Re-run after picks
// that change the step chain (fighting style, subclass, ASI/feat, versatile).
function wgxLevelUpSteps(delta, cfg, st, picked) {
  picked = picked || {};
  var steps = [{ kind: 'overview' }];
  var eff = wgxEffCfg(cfg, picked);
  for (var i = 0; i < delta.choices.length; i++) {
    var c = delta.choices[i];
    if (c.id === 'lineage' || c.id === 'speciesAbility' || c.id === 'order') { steps.push({ kind: 'choice', choice: c, needed: 1 }); continue; }
    if (c.id === 'versatileFeat') {
      steps.push({ kind: 'choice', choice: c, needed: 1 });
      var vf = picked.versatile && picked.versatile.feat && findFeat(picked.versatile.feat);
      wgxFeatSubSteps(vf, 'versatile', eff, st).forEach(function (s) { steps.push({ kind: 'choice', choice: s, needed: s.count || 1 }); });
      continue;
    }
    if (c.id === 'featPicks') {
      openFeatPicks(cfg, Object.assign({}, st, { level: delta.to })).forEach(function (o) {
        var own = 'fix:' + (o.src === 'asi' ? 'asi' + o.level : o.src === 'invocation' ? 'inv:' + o.feat : o.src);
        if (o.pick === 'spellAbility') steps.push({ kind: 'choice', choice: { id: 'featSpellAbility', owner: own, featName: o.feat }, needed: 1 });
        else steps.push({ kind: 'choice', choice: { id: 'featSpells', owner: own, featName: o.feat, pick: o.pick, count: o.need, filter: { list: o.spec.list, level: o.spec.level, schools: o.spec.schools, ritual: o.spec.ritual } }, needed: o.need });
      });
      continue;
    }
    if (c.id === 'invocationPicks') {
      openInvocationPicks(cfg, st).forEach(function (o) {
        steps.push({ kind: 'choice', choice: { id: 'featSpells', owner: 'tome', featName: o.invocation, pick: o.pick, count: o.need, filter: { level: o.spec.level, ritual: o.spec.ritual } }, needed: o.need });
      });
      continue;
    }
    if (c.id === 'skills') {
      var sks = wgxSkillChoiceStep(c, 'clsSkills', eff);
      if (sks) steps.push(sks);
      continue;
    }
    if (c.id === 'asi') {
      steps.push({ kind: 'choice', choice: c, needed: 1 });
      var a = picked.asi;
      if (a) {
        var af = a.type === 'asi' ? { asi: true } : (a.feat ? findFeat(a.feat) : null);
        wgxFeatSubSteps(af, 'asi', eff, Object.assign({}, st, { level: delta.to })).forEach(function (s) { steps.push({ kind: 'choice', choice: s, needed: s.count || 1 }); });
      }
      continue;
    }
    // raw cfg: a subclass picked in this level-up must keep its step (to change it);
    // wgxChoiceNeeded applies the picks itself where they matter (totals).
    var needed = wgxChoiceNeeded(c, cfg, st, picked);
    // Skip what is already settled (subclass pre-set at creation, known style,
    // counted options already at total) — but keep zero-eligible expertise/
    // scholar steps visible so the player sees why nothing is asked.
    if (needed === 0 && c.id !== 'scholar' && c.id !== 'expertise') continue;
    steps.push({ kind: 'choice', choice: c, needed: needed });
    if (c.id === 'invocations') {
      var pi = picked.invocations || [];
      if (pi.indexOf('Pact of the Tome') !== -1) {
        steps.push({ kind: 'choice', choice: { id: 'featSpells', owner: 'tome', featName: 'Pact of the Tome', pick: 'cantrips', count: 3, filter: { level: 0 } }, needed: 3 });
        steps.push({ kind: 'choice', choice: { id: 'featSpells', owner: 'tome', featName: 'Pact of the Tome', pick: 'spells', count: 2, filter: { level: 1, ritual: true } }, needed: 2 });
      }
      if (pi.indexOf('Lessons of the First Ones') !== -1) {
        steps.push({ kind: 'choice', choice: { id: 'lessonsFeat' }, needed: 1 });
        var lf = picked.lessons && picked.lessons.feat && findFeat(picked.lessons.feat);
        wgxFeatSubSteps(lf, 'lessons', eff, st).forEach(function (s) { steps.push({ kind: 'choice', choice: s, needed: s.count || 1 }); });
      }
    }
    if (c.id === 'fightingStyle') {
      var bonus = wgxStyleBonus(cfg.className, picked.fightingStyle);
      if (bonus) {
        steps.push({
          kind: 'choice', needed: bonus.cantripCount,
          choice: { id: 'styleCantrips', count: bonus.cantripCount, list: bonus.cantripList, styleName: bonus.name },
        });
      }
    }
  }
  // Subclass skill choices (Bonus Proficiencies, Student of War, Otherworldly Glamour).
  wgxSubclassChoices(eff, delta).forEach(function (c) {
    if (c.id !== 'skills') return;
    var sst = wgxSkillChoiceStep(c, 'subSkills', eff);
    if (sst) steps.push(sst);
  });
  // Replacement cantrip for a feature cantrip you already know (Improved Illusions).
  if (typeof getGrantedSpells === 'function') {
    getGrantedSpells(eff, Object.assign({}, st, { level: delta.to, cantrips: (st.cantrips || []).concat(picked.cantrips || []) })).forEach(function (g) {
      if (g.open && g.pick === 'replacement') steps.push({ kind: 'choice', choice: { id: 'featSpells', owner: 'repl', pick: g.replaces, featName: g.from + ' (instead of ' + g.replaces + ')', count: 1, filter: { list: g.spec.list, level: 0 } }, needed: 1 });
    });
  }
  // Spells a class or subclass feature lets you choose (Magical Discoveries, …):
  // stored in state.featurePicks[key][pick]; level 'slot' = any level you have slots for.
  if (typeof getGrantedSpells === 'function') {
    getGrantedSpells(eff, Object.assign({}, st, { level: delta.to })).forEach(function (g) {
      if (!g.open || (g.source !== 'class' && g.source !== 'subclass') || g.pick === 'replacement') return;
      var key = g.spec.key || (g.source === 'subclass' ? eff.subclass : eff.className);
      var flt = { list: g.spec.list, schools: g.spec.schools, ritual: g.spec.ritual, actionOnly: g.spec.actionOnly };
      if (g.spec.level === 'slot') {
        flt.maxLevel = wgxMaxSpellLevel(eff.className, delta, getSpellSlots(eff.className, delta.to, eff.subclass));
        flt.minLevel = g.spec.cantrips ? 0 : 1;
      }
      else flt.level = g.spec.level;
      steps.push({ kind: 'choice', choice: { id: 'featSpells', owner: 'fp.' + key, featName: g.spec.label || g.from, pick: g.pick, count: g.count, filter: flt }, needed: g.count });
    });
  }
  // One-of-N feature options (Blessed Strikes, Elemental Fury, Aspect of the Wilds, …)
  if (typeof openOptionChoices === 'function') {
    openOptionChoices(eff, Object.assign({}, st, { level: delta.to })).forEach(function (o) {
      steps.push({ kind: 'choice', choice: { id: 'option', opt: o.id }, needed: 1 });
    });
  }
  // Long/Short-Rest choices that must have a starting value.
  if (eff.className === 'druid' && eff.subclass === 'land' && !st.landType && delta.to >= 3) steps.push({ kind: 'choice', choice: { id: 'landType' }, needed: 1 });
  if (eff.className === 'ranger' && eff.subclass === 'hunter' && !st.huntersPrey && delta.to >= 3) steps.push({ kind: 'choice', choice: { id: 'huntersPrey' }, needed: 1 });
  // New cantrips / prepared spells (2024 fixed tables). (total − known) instead
  // of (new − old): heals characters whose creation picks were never recorded.
  var maxC = (typeof getMaxCantrips === 'function') ? getMaxCantrips(delta.to, eff.className, eff.subclass, eff) : (delta.cantrips['new'] || 0);
  var cNeed = Math.max(0, maxC - (st.cantrips || []).length);
  // Mandatory subclass cantrips (AT: Mage Hand) count towards the maximum,
  // so they are deducted from the number of free choices.
  ((DATA.thirdCasterFixedCantrips || {})[eff.subclass] || []).forEach(function (nm) {
    if ((st.cantrips || []).indexOf(nm) === -1) cNeed = Math.max(0, cNeed - 1);
  });
  // #P0hwaBZ: third casters (EK/AT) choose from the wizard list.
  var spellCn = (typeof getSpellListClass === 'function')
    ? getSpellListClass(eff.className, eff.subclass) : eff.className;
  var list0 = (DATA.spells[spellCn] || {})[0] || [];
  cNeed = Math.min(cNeed, Math.max(0, list0.length - (st.cantrips || []).length));
  if (cNeed > 0) steps.push({ kind: 'choice', choice: { id: 'cantrips', count: cNeed }, needed: cNeed });
  var pNeed = Math.max(0, wgxEffCasting(cfg, st, delta, picked).prepared - (st.prepared || []).length);
  if (pNeed > 0) steps.push({ kind: 'choice', choice: { id: 'spells', count: pNeed }, needed: pNeed });
  if (delta.to > delta.from && wgxSwapOptions(cfg, st, delta).length) steps.push({ kind: 'choice', choice: { id: 'swaps' }, needed: 0 });
  steps.push({ kind: 'confirm' });
  return steps;
}

// Optional swaps allowed when gaining a level (2024 PHB). Only offered when the
// character actually has something to swap.
function wgxSwapOptions(cfg, st, delta) {
  var cn = cfg.className, out = [];
  var tc = (typeof isThirdCaster === 'function') && isThirdCaster(cn, cfg.subclass) && delta.from >= 3;
  var spellCn = (typeof getSpellListClass === 'function') ? getSpellListClass(cn, cfg.subclass) : cn;
  var cantripSwap = ['bard', 'cleric', 'druid', 'sorcerer', 'warlock'].indexOf(cn) !== -1 || tc;
  var known = function (k) { return (st[k] || []).slice(); };
  if (cantripSwap && known('cantrips').length) {
    var fixed = (DATA.thirdCasterFixedCantrips || {})[cfg.subclass] || [];
    out.push({ id: 'cantrip', label: 'Replace a cantrip', stateKey: 'cantrips',
      have: known('cantrips').filter(function (n) { return fixed.indexOf(n) === -1; }),
      pool: ((DATA.spells[spellCn] || {})[0] || []).filter(function (n) { return known('cantrips').indexOf(n) === -1; }) });
  }
  if ((['bard', 'sorcerer', 'warlock'].indexOf(cn) !== -1 || tc) && known('prepared').length) {
    var maxL = wgxMaxSpellLevel(cn, delta);
    var pool = wgxSpellOptions({ list: getSpellLists(cn, cfg.subclass, delta.to), maxLevel: maxL }).map(function (e) { return e.nm; });
    out.push({ id: 'spell', label: 'Replace a prepared spell', stateKey: 'prepared', have: known('prepared'),
      pool: pool.filter(function (n) { return known('prepared').indexOf(n) === -1; }) });
  }
  if (cn === 'warlock' && known('invocations').length) {
    out.push({ id: 'invocation', label: 'Replace an Eldritch Invocation', stateKey: 'invocations', have: known('invocations'),
      pool: (DATA.invocations || []).filter(function (iv) { return (iv.minLevel || 1) <= delta.to && (known('invocations').indexOf(iv.name) === -1 || iv.repeatable) && (!iv.requires || known('invocations').indexOf(iv.requires) !== -1); }).map(function (iv) { return iv.name; }) });
  }
  if (cn === 'sorcerer' && known('metamagic').length) {
    out.push({ id: 'metamagic', label: 'Replace a Metamagic option', stateKey: 'metamagic', have: known('metamagic'),
      pool: (DATA.metamagic || []).map(function (m) { return m.name; }).filter(function (n) { return known('metamagic').indexOf(n) === -1; }) });
  }
  if (cn === 'fighter' && known('fightingStyles').length) {
    out.push({ id: 'fightingStyle', label: 'Replace your Fighting Style feat', stateKey: 'fightingStyles', have: known('fightingStyles'),
      pool: (DATA.feats || []).filter(function (f) { return f.category === 'fighting'; }).map(function (f) { return f.name; }).filter(function (n) { return known('fightingStyles').indexOf(n) === -1; }) });
  }
  return out.filter(function (o) { return o.have.length && o.pool.length; });
}

// Feat record to store from a picked owner object (asi / versatile).
function wgxFeatRecord(p, extra) {
  var rec = { type: p.type || 'feat' };
  if (rec.type === 'asi') { rec.abilities = Object.assign({}, p.abilities || {}); return Object.assign(rec, extra || {}); }
  rec.feat = p.feat;
  ['ability', 'spellAbility', 'element'].forEach(function (k) { if (p[k]) rec[k] = p[k]; });
  ['cantrips', 'spells', 'skills', 'expertise'].forEach(function (k) { if (p[k] && p[k].length) rec[k] = p[k].slice(); });
  return Object.assign(rec, extra || {});
}

// Skills/expertise a feat record adds to the character (Skilled, Skill Expert,
// Keen Mind, Observant). Returns { prof: [], expert: [] } as WG_SKILLS keys.
function wgxFeatSkillGains(featName, rec, cfg) {
  var feat = findFeat(featName) || {};
  var out = { prof: [], expert: [] };
  var choice = (feat.choices || []).filter(function (c) { return c.id === 'skills'; })[0];
  (rec.skills || []).forEach(function (k) {
    if (choice && choice.mode === 'profOrExpertise' && wgxHasSkill(cfg.defaultSkills, k)) out.expert.push(k);
    else out.prof.push(k);
  });
  (rec.expertise || []).forEach(function (k) { out.expert.push(k); });
  return out;
}

// Pure: a deep copy of obj with Firebase-PATCH semantics applied ('a/b' deep
// paths; null or empty containers delete).
function wgxApplyPaths(obj, patch) {
  var out = JSON.parse(JSON.stringify(obj || {}));
  Object.keys(patch || {}).forEach(function (key) {
    var parts = key.split('/'), o = out;
    for (var i = 0; i < parts.length - 1; i++) {
      if (o[parts[i]] == null || typeof o[parts[i]] !== 'object') o[parts[i]] = {};
      o = o[parts[i]];
    }
    var v = patch[key], last = parts[parts.length - 1];
    var empty = v === null || (Array.isArray(v) && !v.length) || (v && typeof v === 'object' && !Array.isArray(v) && !Object.keys(v).length);
    if (empty) delete o[last]; else o[last] = JSON.parse(JSON.stringify(v));
  });
  return out;
}

// Everything to write on confirm, derived purely from (cfg, st, delta, picked).
// Returns { statePatch, configPatch } — configPatch is null when nothing
// config-side changes. config.hp is patched shallowly (pre-existing semantics).
function wgxBuildLevelUpPatch(cfg, st, delta, picked) {
  var rec = {};
  var statePatch = { level: delta.to };
  var configPatch = null;
  var addCfg = function (k, v) { configPatch = configPatch || {}; configPatch[k] = v; };
  var newProf = [], newExpert = [];

  // --- creation-time fixes (not rolled back on Level Down) ---
  if (picked.lineage) addCfg('lineage', picked.lineage);
  if (picked.speciesAbility) addCfg('speciesAbility', picked.speciesAbility);
  if (picked.order) addCfg(cfg.className === 'cleric' ? 'divineOrder' : 'primalOrder', picked.order);
  if (picked.versatile && picked.versatile.feat) {
    var vrec = wgxFeatRecord(picked.versatile, { origin: true });
    statePatch.speciesFeat = vrec;
    var vg = wgxFeatSkillGains(vrec.feat, vrec, cfg);
    newProf = newProf.concat(vg.prof); newExpert = newExpert.concat(vg.expert);
  }
  var cantripsOut = [];
  Object.keys(picked).forEach(function (k) {
    if (k.indexOf('fix:') !== 0) return;
    var src = k.slice(4), p = picked[k] || {};
    var am = src.match(/^asi(\d+)$/);
    var base = src === 'species' ? 'speciesFeat' : am ? 'asiChoices/' + am[1] : src.indexOf('inv:') === 0 ? 'invocationPicks/Lessons of the First Ones/rec/' + src.slice(4) : 'asiChoices/1';
    if (src === 'origin' && !(numMap(st.asiChoices)[1])) {
      // Origin feat only known from config.originFeat → create the record.
      statePatch['asiChoices/1'] = Object.assign({ type: 'feat', feat: cfg.originFeat, origin: true }, p);
    } else {
      // Merge list picks into what the record already has (Ritual Caster adds one
      // spell each time PB grows); record additions so Level Down can undo them.
      var curRec = src === 'species' ? (st.speciesFeat || {}) : am ? (numMap(st.asiChoices)[am[1]] || {}) : src.indexOf('inv:') === 0 ? (((st.invocationPicks || {})['Lessons of the First Ones'] || {}).rec || {})[src.slice(4)] || {} : (numMap(st.asiChoices)[1] || {});
      Object.keys(p).forEach(function (f) {
        var had = Array.isArray(curRec[f]) ? curRec[f] : [];
        if (Array.isArray(p[f]) && had.length) {
          var add = p[f].filter(function (n) { return had.indexOf(n) === -1; });
          statePatch[base + '/' + f] = had.concat(add);
          if (add.length && delta.to > delta.from) { rec.featAdded = rec.featAdded || {}; rec.featAdded[(base + '/' + f).split('/').join('|')] = add; }
        } else statePatch[base + '/' + f] = p[f];
      });
    }
    // Feat cantrips that also sat in the class cantrip list move out of it
    // (they never counted against the class maximum).
    (p.cantrips || []).forEach(function (n) { if ((st.cantrips || []).indexOf(n) !== -1) cantripsOut.push(n); });
  });

  // --- level choices ---
  if (picked.subclass) { rec.subclass = picked.subclass; addCfg('subclass', picked.subclass); }
  Object.keys(WGX_TOTAL_IDS).forEach(function (id) {
    if (picked[id] && picked[id].length) {
      rec[id] = picked[id];
      statePatch[WGX_TOTAL_IDS[id]] = (st[WGX_TOTAL_IDS[id]] || []).concat(picked[id]);
    }
  });
  if (picked.tome && (picked.tome.cantrips || picked.tome.spells)) {
    var tomePrev = (st.invocationPicks || {})['Pact of the Tome'] || {};
    statePatch['invocationPicks/Pact of the Tome'] = { cantrips: picked.tome.cantrips || tomePrev.cantrips || [], spells: picked.tome.spells || tomePrev.spells || [] };
    rec.tome = true;
  }
  if (picked.lessons && picked.lessons.feat) {
    var lp = (st.invocationPicks || {})['Lessons of the First Ones'] || {};
    var lrec = Object.assign({}, lp.rec || {});
    lrec[picked.lessons.feat] = wgxFeatRecord(picked.lessons);
    statePatch['invocationPicks/Lessons of the First Ones'] = { feats: (lp.feats || []).concat([picked.lessons.feat]), rec: lrec };
    rec.lessonsFeat = picked.lessons.feat;
  }
  // Replacement cantrips (stored per replaced spell; kept like other feature picks)
  Object.keys(picked.repl || {}).forEach(function (k) {
    var v = picked.repl[k];
    if (Array.isArray(v) && v[0]) statePatch['replacementCantrips/' + k] = v[0];
  });
  // Long/Short-Rest choices (not rolled back: they are swapped on rests anyway)
  if (picked.landType) statePatch.landType = picked.landType;
  if (picked.huntersPrey) statePatch.huntersPrey = picked.huntersPrey;
  // One-of-N feature options (rolled back on Level Down)
  Object.keys(picked.options || {}).forEach(function (id) {
    var od = (DATA.optionChoices || []).filter(function (o) { return o.id === id; })[0];
    if (!od || !picked.options[id]) return;
    statePatch[od.stateKey] = picked.options[id];
    rec.options = rec.options || {};
    rec.options[od.stateKey] = picked.options[id];
  });
  // Spells picked for a class/subclass feature (whole object, so empties never linger)
  var fpAdd = picked.fp || {};
  if (Object.keys(fpAdd).length) {
    var fpAll = JSON.parse(JSON.stringify(st.featurePicks || {}));
    Object.keys(fpAdd).forEach(function (key) {
      Object.keys(fpAdd[key] || {}).forEach(function (pk) {
        var add = (fpAdd[key][pk] || []).filter(function (n) { return n; });
        if (!add.length) return;
        fpAll[key] = fpAll[key] || {};
        fpAll[key][pk] = (fpAll[key][pk] || []).concat(add);
        rec.featurePicks = rec.featurePicks || {};
        rec.featurePicks[key + '|' + pk] = add;
      });
    });
    statePatch.featurePicks = fpAll;
  }
  if (picked.fightingStyle) {
    rec.fightingStyle = picked.fightingStyle;
    statePatch.fightingStyles = (st.fightingStyles || []).concat([picked.fightingStyle]);
  }
  if (picked.expertise && picked.expertise.length) { rec.expertise = picked.expertise; newExpert = newExpert.concat(picked.expertise); }
  if (picked.scholar) { rec.scholar = picked.scholar; newExpert.push(picked.scholar); }
  if (picked.asi && (picked.asi.type === 'asi' || picked.asi.feat)) {
    var arec = wgxFeatRecord(picked.asi);
    var asiCh = (delta.choices || []).filter(function (c) { return c.id === 'asi'; })[0];
    var asiLvl = (asiCh && asiCh.level) || delta.to;
    statePatch['asiChoices/' + asiLvl] = arec;
    rec.asi = true;
    if (arec.type === 'feat') {
      var ag = wgxFeatSkillGains(arec.feat, arec, cfg);
      if (ag.prof.length) rec.featProf = ag.prof;
      if (ag.expert.length) rec.featExpert = ag.expert;
      newProf = newProf.concat(ag.prof); newExpert = newExpert.concat(ag.expert);
    }
  }
  // Class/subclass skill proficiencies (picked, or fixed like Implements of Mercy).
  var clsProf = [];
  ['clsSkills', 'subSkills'].forEach(function (o) { clsProf = clsProf.concat((picked[o] && picked[o].skills) || []); });
  (delta.choices || []).concat(wgxSubclassChoices(wgxEffCfg(cfg, picked), delta)).forEach(function (c) {
    if (c.id === 'skills' && c.fixed) clsProf = clsProf.concat(c.fixed);
  });
  clsProf = clsProf.filter(function (k, i, a) { return a.indexOf(k) === i && !wgxHasSkill(cfg.defaultSkills, k) && !wgxHasSkill(newProf, k); });
  if (clsProf.length) { rec.classProf = clsProf; newProf = newProf.concat(clsProf); }
  if (newProf.length) addCfg('defaultSkills', (cfg.defaultSkills || []).concat(newProf.filter(function (k) { return !wgxHasSkill(cfg.defaultSkills, k); })));
  if (rec.expertise || rec.scholar || rec.featExpert || newExpert.length) {
    var xp = (cfg.expertSkills || []).concat(newExpert.filter(function (k) { return !wgxHasSkill(cfg.expertSkills, k); }));
    addCfg('expertSkills', xp);
  }
  if (picked.spells && picked.spells.length) {
    rec.spellsAdded = picked.spells;
    statePatch.prepared = (st.prepared || []).concat(picked.spells);
  }
  var newCantrips = [];
  if (picked.cantrips && picked.cantrips.length) { rec.cantripsAdded = picked.cantrips; newCantrips = newCantrips.concat(picked.cantrips); }
  if (picked.styleCantrips && picked.styleCantrips.length) { rec.styleCantrips = picked.styleCantrips; newCantrips = newCantrips.concat(picked.styleCantrips); }
  // #P0hwaBZ: Arcane Trickster gets Mage Hand as a mandatory cantrip —
  // it counts towards the maximum and cannot be swapped, so we add it
  // ourselves as soon as the subclass gains spellcasting.
  var fixedCantrips = (DATA.thirdCasterFixedCantrips || {})[picked.subclass || cfg.subclass] || [];
  fixedCantrips.forEach(function (nm) {
    if ((st.cantrips || []).indexOf(nm) === -1 && newCantrips.indexOf(nm) === -1) {
      newCantrips.push(nm);
      rec.cantripsAdded = (rec.cantripsAdded || []).concat([nm]);
    }
  });
  if (newCantrips.length || cantripsOut.length) {
    statePatch.cantrips = (st.cantrips || []).filter(function (n) { return cantripsOut.indexOf(n) === -1; }).concat(newCantrips);
  }

  // --- optional swaps (recorded as {out, in} pairs for Level Down) ---
  var swaps = picked.swaps || {};
  var swapRec = {};
  var swapDefs = {};
  wgxSwapOptions(cfg, st, delta).forEach(function (o) { swapDefs[o.id] = o; });
  Object.keys(swaps).forEach(function (id) {
    var s = swaps[id], def = swapDefs[id];
    if (!def || !s || !s.out || !s['in']) return;
    var base = statePatch[def.stateKey] || (st[def.stateKey] || []).slice();
    var ix = base.indexOf(s.out);
    if (ix === -1) return;
    base = base.slice(); base[ix] = s['in'];
    statePatch[def.stateKey] = base;
    swapRec[id] = { key: def.stateKey, out: s.out, 'in': s['in'] };
  });
  if (Object.keys(swapRec).length) rec.swaps = swapRec;

  if (delta.from === delta.to) {
    // Fix mode: merge into the existing record of this level instead of
    // replacing it (arrays are extended), so Level Down stays exact.
    var prevRec = numMap(st.levelChoices)[delta.to] || {};
    Object.keys(rec).forEach(function (k) {
      var v = rec[k];
      var pv = prevRec[k], isObj = function (x) { return x && typeof x === 'object' && !Array.isArray(x); };
      statePatch['levelChoices/' + delta.to + '/' + k] = Array.isArray(v) && Array.isArray(pv) ? pv.concat(v) : isObj(v) && isObj(pv) ? Object.assign({}, pv, v) : v;
    });
  } else {
    statePatch['levelChoices/' + delta.to] = rec;
  }
  // HP: max is derived — recompute on the state as it will be after this patch
  // (CON increase, Tough from any source, Draconic Resilience…) and raise
  // current by the actual difference.
  var stAfter = wgxApplyPaths(Object.assign({ asiChoices: {} }, st), statePatch);
  var cfgAfter = wgxApplyPaths(cfg, configPatch || {});
  var oldMax = getMaxHP(cfg, Object.assign({ asiChoices: {} }, st));
  var newMax = getHP(cfgAfter, stAfter);
  var gain = newMax - getHP(cfg, Object.assign({ asiChoices: {} }, st));
  var curHp = (st.hp && typeof st.hp.current === 'number') ? st.hp.current : oldMax;
  statePatch['hp/current'] = Math.max(1, Math.min(curHp + gain, (cfg.hp && cfg.hp.max > 0) ? cfg.hp.max + gain : newMax));
  if (cfg.hp && typeof cfg.hp.max === 'number' && cfg.hp.max > 0) {
    addCfg('hp', { max: cfg.hp.max + gain });
  }
  return { statePatch: statePatch, configPatch: configPatch };
}

// Everything to write on level-down. Rolls back exactly what levelChoices[lvl]
// recorded (creation-time fixes made during that level-up stay). Returns
// { statePatch, configPatch, lost } — `lost` feeds the confirmation dialog.
function wgxBuildLevelDownPatch(cfg, stRaw) {
  var st = Object.assign({ asiChoices: {} }, stRaw || {});
  if (!st.asiChoices) st.asiChoices = {};
  var lvl = st.level || 1;
  var choices = numMap(st.levelChoices)[lvl] || {};
  var newLevel = lvl - 1;

  var statePatch = { level: newLevel };
  statePatch['levelChoices/' + lvl] = null;
  var configPatch = null;
  var addCfg = function (k, v) { configPatch = configPatch || {}; configPatch[k] = v; };
  var lost = [];
  var notIn = function (arr) { return function (n) { return arr.indexOf(n) === -1; }; };
  var work = {};   // arrays being rolled back (swaps first, then additions)
  var arr = function (k) { if (!work[k]) work[k] = (st[k] || []).slice(); return work[k]; };

  if (choices.subclass) { addCfg('subclass', null); lost.push('your subclass choice'); }
  // Swaps: put the old option back.
  Object.keys(choices.swaps || {}).forEach(function (id) {
    var s = choices.swaps[id], a = arr(s.key), ix = a.indexOf(s['in']);
    if (ix !== -1) a[ix] = s.out;
    lost.push('swap ' + s.out + ' → ' + s['in']);
  });
  var labels = { metamagic: 'Metamagic', invocations: 'Invocations', wildShapeForms: 'Wild Shape forms', maneuvers: 'Maneuvers', weaponMasteries: 'Weapon Mastery' };
  Object.keys(WGX_TOTAL_IDS).forEach(function (id) {
    if (choices[id] && choices[id].length) {
      work[WGX_TOTAL_IDS[id]] = arr(WGX_TOTAL_IDS[id]).filter(notIn(choices[id]));
      lost.push(labels[id] + ': ' + choices[id].join(', '));
    }
  });
  if (choices.tome) { statePatch['invocationPicks/Pact of the Tome'] = null; lost.push('Book of Shadows spells'); }
  // Feat picks added to an existing record at this level (Ritual Caster growth)
  Object.keys(choices.featAdded || {}).forEach(function (key) {
    var path = key.split('|').join('/'), parts = path.split('/'), cur = st;
    parts.forEach(function (p) { cur = cur && (Array.isArray(cur) ? cur[+p] : cur[p]); });
    var drop = choices.featAdded[key];
    statePatch[path] = (Array.isArray(cur) ? cur : []).filter(function (n) { return drop.indexOf(n) === -1; });
    lost.push('feat pick: ' + drop.join(', '));
  });
  if (choices.lessonsFeat) {
    var lp2 = (st.invocationPicks || {})['Lessons of the First Ones'] || {};
    var lrec2 = Object.assign({}, lp2.rec || {}); delete lrec2[choices.lessonsFeat];
    var lfeats = (lp2.feats || []).filter(function (n) { return n !== choices.lessonsFeat; });
    statePatch['invocationPicks/Lessons of the First Ones'] = lfeats.length ? { feats: lfeats, rec: lrec2 } : null;
    lost.push('Origin feat ' + choices.lessonsFeat);
  }
  if (choices.fightingStyle) {
    work.fightingStyles = arr('fightingStyles').filter(function (n) { return n !== choices.fightingStyle; });
    lost.push('Fighting Style: ' + choices.fightingStyle);
  }
  Object.keys(choices.options || {}).forEach(function (k) {
    statePatch[k] = null;
    lost.push(k.charAt(0).toUpperCase() + k.slice(1).replace(/([A-Z])/g, ' $1') + ': ' + choices.options[k]);
  });
  if (choices.featurePicks) {
    var fpLeft = JSON.parse(JSON.stringify(st.featurePicks || {}));
    Object.keys(choices.featurePicks).forEach(function (kp) {
      var parts = kp.split('|'), drop = choices.featurePicks[kp];
      if (!fpLeft[parts[0]]) return;
      fpLeft[parts[0]][parts[1]] = (fpLeft[parts[0]][parts[1]] || []).filter(notIn(drop));
      if (!fpLeft[parts[0]][parts[1]].length) delete fpLeft[parts[0]][parts[1]];
      if (!Object.keys(fpLeft[parts[0]]).length) delete fpLeft[parts[0]];
      lost.push('Spells: ' + drop.join(', '));
    });
    statePatch.featurePicks = Object.keys(fpLeft).length ? fpLeft : null;
  }
  var dropExpert = (choices.expertise || []).slice().concat(choices.featExpert || []);
  if (choices.scholar) dropExpert.push(choices.scholar);
  if (dropExpert.length) {
    addCfg('expertSkills', (cfg.expertSkills || []).filter(function (k) { return !dropExpert.some(function (d) { return wgxSkillNorm(d) === wgxSkillNorm(k); }); }));
    lost.push('Expertise: ' + dropExpert.join(', '));
  }
  var dropProf = (choices.featProf || []).concat(choices.classProf || []);
  if (dropProf.length) {
    addCfg('defaultSkills', (cfg.defaultSkills || []).filter(function (k) { return !dropProf.some(function (d) { return wgxSkillNorm(d) === wgxSkillNorm(k); }); }));
    if (choices.classProf && choices.classProf.length) lost.push('Skill proficiency: ' + choices.classProf.join(', '));
  }
  if (choices.asi) {
    var a = numMap(st.asiChoices)[lvl] || {};
    statePatch['asiChoices/' + lvl] = null;
    lost.push(a.type === 'asi' ? 'your Ability Score Improvement' : 'the feat ' + (a.feat || ''));
  }
  if (choices.spellsAdded && choices.spellsAdded.length) {
    work.prepared = arr('prepared').filter(notIn(choices.spellsAdded));
    lost.push('Spells: ' + choices.spellsAdded.join(', '));
  }
  var dropCantrips = (choices.cantripsAdded || []).concat(choices.styleCantrips || []);
  if (dropCantrips.length) {
    work.cantrips = arr('cantrips').filter(notIn(dropCantrips));
    lost.push('Cantrips: ' + dropCantrips.join(', '));
  }
  Object.keys(work).forEach(function (k) { statePatch[k] = work[k]; });

  // Free-cast counters of grants that disappear with this level → remove.
  // stNew = the state as it will be after this patch (generic, so every
  // rolled-back source of HP or grants is accounted for).
  var stNew = wgxApplyPaths(st, statePatch);
  var cfgNew = wgxApplyPaths(cfg, configPatch || {});
  if (typeof getClassResources === 'function') {
    var keep = {};
    getClassResources(cfgNew, stNew).forEach(function (r) { keep[r.stateKey] = true; });
    getClassResources(cfg, st).forEach(function (r) { if (!keep[r.stateKey] && st[r.stateKey] != null) statePatch[r.stateKey] = null; });
  }
  var newMax = getHP(cfgNew, stNew);
  var curHp = (st.hp && typeof st.hp.current === 'number') ? st.hp.current : newMax;
  // Manual HP-max override: shrink by what this level added.
  if (cfg.hp && typeof cfg.hp.max === 'number' && cfg.hp.max > 0) {
    var loss = getHP(cfg, st) - getHP(cfgNew, stNew);
    var ovr = Math.max(1, cfg.hp.max - loss);
    addCfg('hp', { max: ovr });
    statePatch['hp/current'] = Math.min(curHp, ovr);
  } else {
    statePatch['hp/current'] = Math.min(curHp, newMax);
  }
  return { statePatch: statePatch, configPatch: configPatch, lost: lost, newLevel: newLevel };
}

// ============================================================
// Level-up modal (BG3-style: overview → choices → confirm)
// ============================================================
var wgxLU = null; // { charId, raw, delta, steps, stepIdx, picked }

function wgxRegenLUSteps() {
  if (!wgxLU) return;
  var cfg = wgxLU.raw.config || {}, st = wgxLU.raw.state || {};
  var cur = wgxLU.steps[wgxLU.stepIdx];
  wgxLU.steps = wgxLevelUpSteps(wgxLU.delta, cfg, st, wgxLU.picked);
  // Keep the player on the step they were on (same id/owner) after a regen.
  if (cur && cur.kind === 'choice') {
    for (var i = 0; i < wgxLU.steps.length; i++) {
      var s = wgxLU.steps[i];
      if (s.kind === 'choice' && s.choice.id === cur.choice.id && s.choice.owner === cur.choice.owner && s.choice.pick === cur.choice.pick) { wgxLU.stepIdx = i; return; }
    }
  }
  wgxLU.stepIdx = Math.min(wgxLU.stepIdx, wgxLU.steps.length - 1);
}

function wgxOpenLevelUpModal(charId, opts) {
  var raw = WG_CHAR_CACHE[charId] || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var fixOnly = !!(opts && opts.fixOnly);
  // fixOnly: same flow without a level change — only the choices that were
  // never recorded ("Complete missing choices" in the Build overview).
  var delta = getLevelUpDelta(cfg, st, (st.level || 1) + (fixOnly ? 0 : 1));
  // Levelled down earlier? Start from the picks made last time (state.demotedChoices[N]).
  var picked = {};
  var demoted = !fixOnly && numMap(st.demotedChoices)[delta.to];
  if (demoted) { try { picked = JSON.parse(demoted) || {}; } catch (e) { picked = {}; } }
  wgxLU = { charId: charId, raw: raw, delta: delta, steps: [], stepIdx: 0, picked: picked, fixOnly: fixOnly };
  wgxRegenLUSteps();
  if (demoted && Object.keys(picked).length) showToast('Your choices from the last time you reached level ' + delta.to + ' are filled in — change anything before confirming');
  var host = document.createElement('div');
  host.className = 'wgx-levelup-modal-active';
  // NB: no stopPropagation on the card — the delegated host listener must
  // receive clicks from inside it. Overlay-click-to-close is handled in
  // wgxLUClick by checking the actual event target.
  host.innerHTML = '<div class="modal-overlay"><div class="modal-card wgx-lu-card"></div></div>';
  document.body.appendChild(host);
  host.addEventListener('click', wgxLUClick);
  host.addEventListener('change', wgxLUChange);
  wgxRenderLUStep();
}

function wgxCloseLevelUpModal() {
  var el = document.querySelector('.wgx-levelup-modal-active');
  if (el) el.remove();
  wgxLU = null;
}

function wgxLUBadge(source) {
  var map = { class: 'Class', subclass: 'Subclass', species: 'Species', feat: 'Feat', invocation: 'Invocation' };
  return '<span class="wgx-lu-badge wgx-lu-badge-' + source + '">' + (map[source] || source) + '</span>';
}

function wgxLUFeatureDesc(desc) {
  if (desc && typeof desc === 'object') desc = desc.en || desc.nl || '';
  return String(desc || '');
}

function wgxEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wgxTrunc(s, n) {
  s = String(s || '');
  return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s;
}

// Generic selectable card grid. items: [{ val, title, sub, desc, known,
// knownLabel }] — known items render greyed and unclickable. `single` = radio
// semantics (data-wgx-lu="pick-single"), otherwise count-gated multi-select.
// key may be a path ('asi.feat') into wgxLU.picked.
function wgxLUGrid(items, key, single, picked) {
  var html = '<div class="wgx-lu-subgrid">';
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var isSel = single ? picked === it.val : (picked || []).indexOf(it.val) !== -1;
    html += '<div class="wgx-lu-subcard' + (isSel ? ' selected' : '') + (it.known ? ' wgx-lu-known' : '') + '"' +
      (it.known ? '' : ' data-wgx-lu="' + (single ? 'pick-single' : 'pick-multi') + '" data-key="' + key + '" data-val="' + wgxEsc(it.val) + '"') + '>' +
      '<h4>' + wgxEsc(it.title) + (it.sub ? ' <span class="wgx-lu-cost">' + wgxEsc(it.sub) + '</span>' : '') + (it.known ? ' · ' + wgxEsc(it.knownLabel || 'known') : '') + '</h4>' +
      (it.desc ? '<p>' + wgxEsc(it.desc) + '</p>' : '') + '</div>';
  }
  return html + '</div>';
}

function wgxLUCountNote(pickedArr, needed) {
  return '<p class="wgx-lu-note">Selected ' + (pickedArr || []).length + ' / ' + needed + '</p>';
}

// picked path helpers ('asi.spells' → wgxLU.picked.asi.spells)
function wgxPGet(path) {
  var o = wgxLU.picked, parts = path.split('.');
  for (var i = 0; i < parts.length; i++) { if (o == null) return undefined; o = o[parts[i]]; }
  return o;
}
function wgxPSet(path, val) {
  var o = wgxLU.picked, parts = path.split('.');
  for (var i = 0; i < parts.length - 1; i++) { if (o[parts[i]] == null || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
  o[parts[parts.length - 1]] = val;
}
// Store key of a feat sub-pick: 'asi.spells', 'versatile.cantrips', 'fix:origin.spells'
function wgxOwnerPath(owner, field) { return owner + '.' + field; }

function wgxSpellCard(e, known) {
  var sp = e.sp || {};
  return {
    val: e.nm, title: e.nm,
    sub: (e.lvl ? 'Lvl ' + e.lvl + ' · ' : '') + (sp.time || '') + (e.school ? ' · ' + e.school : '') + (e.ritual ? ' · Ritual' : ''),
    desc: wgxTrunc(sp.desc, 110), known: known,
  };
}

function wgxRenderLUStep() {
  var card = document.querySelector('.wgx-lu-card');
  if (!card || !wgxLU) return;
  var d = wgxLU.delta, step = wgxLU.steps[wgxLU.stepIdx], picked = wgxLU.picked;
  var cfg = wgxLU.raw.config || {}, st = wgxLU.raw.state || {};
  var eff = wgxEffCfg(cfg, picked);
  var cn = cfg.className;
  // Class list that spells are picked from — for EK/AT that is wizard.
  var spellCn = (typeof getSpellListClass === 'function')
    ? getSpellListClass(cn, eff.subclass) : cn;
  var html = '<div class="modal-header"><h2>' + (wgxLU.fixOnly ? 'Complete missing choices' : 'Level Up — ' + d.from + ' → ' + d.to) + '</h2>' +
    '<button class="modal-close" data-wgx-lu="cancel">&times;</button></div>';
  // Stepper dots + current-step label
  html += '<div class="wgx-lu-steps">';
  for (var i = 0; i < wgxLU.steps.length; i++) {
    html += '<span class="wgx-lu-dot' + (i === wgxLU.stepIdx ? ' active' : (i < wgxLU.stepIdx ? ' done' : '')) + '"></span>';
  }
  var labels = {
    subclass: 'Choose Subclass', metamagic: 'Choose Metamagic', invocations: 'Choose Invocations',
    wildShapeForms: 'Choose Wild Shape Forms', fightingStyle: 'Choose Fighting Style',
    expertise: 'Choose Expertise', scholar: 'Scholar', spells: 'Choose Spells',
    cantrips: 'Choose Cantrips', styleCantrips: 'Choose Cantrips', asi: 'Ability Score Improvement or Feat',
    asiAbilities: 'Ability Score Improvement', featAbility: 'Feat: +1 Ability', featSpellAbility: 'Spellcasting Ability',
    featSpells: 'Feat Spells', featSkills: 'Feat Skills', featExpertise: 'Feat Expertise', featElement: 'Feat: Damage Type',
    maneuvers: 'Choose Maneuvers', weaponMasteries: 'Weapon Mastery', swaps: 'Optional Swaps',
    lineage: 'Complete Your Species', speciesAbility: 'Species Spellcasting', order: 'Complete Your Class',
    versatileFeat: 'Human: Versatile Feat', lessonsFeat: 'Lessons of the First Ones',
    landType: 'Circle of the Land', huntersPrey: "Hunter's Prey"
  };
  var optDef = step.choice && step.choice.id === 'option' ? (DATA.optionChoices || []).filter(function (o) { return o.id === step.choice.opt; })[0] : null;
  var stepLabel = step.kind === 'overview' ? 'Overview'
    : step.kind === 'confirm' ? 'Confirm'
    : optDef ? optDef.label
    : (step.choice.id === 'featSpells' && /^fp\./.test(step.choice.owner || '')) ? step.choice.featName
    : (step.choice.id === 'featSkills' && /^(cls|sub)Skills$/.test(step.choice.owner || '')) ? step.choice.featName
    : (labels[step.choice.id] || step.choice.id.charAt(0).toUpperCase() + step.choice.id.slice(1).replace(/([A-Z])/g, ' $1'));
  html += '</div><div class="wgx-lu-steplabel">' + wgxEsc(stepLabel) + '</div>';
  html += '<div class="modal-body wgx-lu-body">';

  if (step.kind === 'overview' && wgxLU.fixOnly) {
    var nSteps = wgxLU.steps.filter(function (s) { return s.kind === 'choice'; }).length;
    html += '<h3>Choices that were never recorded</h3><p class="wgx-lu-note">' + (nSteps ? nSteps + ' step' + (nSteps > 1 ? 's' : '') + ' to go. Your level stays ' + d.to + '.' : 'Nothing to complete — everything is recorded.') + '</p>';
  } else if (step.kind === 'overview') {
    html += '<h3>What you gain</h3><ul class="wgx-lu-gains">';
    html += '<li><b>Hit Points</b> +' + d.hpGain + ' (new max ' + d.newMaxHp + ')</li>';
    if (d.profBonus.old !== d.profBonus['new']) html += '<li><b>Proficiency bonus</b> +' + d.profBonus.old + ' → +' + d.profBonus['new'] + '</li>';
    if (d.sneakAttack && d.sneakAttack.old !== d.sneakAttack['new']) html += '<li><b>Sneak Attack</b> ' + d.sneakAttack.old + ' → ' + d.sneakAttack['new'] + '</li>';
    var fmtSlots = function (a) { a = (a || []).slice(); while (a.length && !a[a.length - 1]) a.pop(); return a.join('/') || '—'; };
    if (JSON.stringify(d.slots.old) !== JSON.stringify(d.slots['new'])) html += '<li><b>Spell slots</b> ' + fmtSlots(d.slots.old) + ' → ' + fmtSlots(d.slots['new']) + '</li>';
    if (d.prepared.old !== d.prepared['new'] && d.prepared['new'] > 0) html += '<li><b>Prepared spells</b> ' + d.prepared.old + ' → ' + d.prepared['new'] + '</li>';
    if (d.cantrips.old !== d.cantrips['new']) html += '<li><b>Cantrips</b> ' + d.cantrips.old + ' → ' + d.cantrips['new'] + '</li>';
    if (d.spellbookAdds) html += '<li><b>Spellbook</b> +' + d.spellbookAdds + ' new spells</li>';
    html += '</ul>';
    if (d.features.length) {
      html += '<h3>New features</h3>';
      for (var f = 0; f < d.features.length; f++) {
        var ft = d.features[f];
        html += '<div class="wgx-lu-feature">' + wgxLUBadge(ft.source) + '<b>' + wgxEsc(ft.name) + '</b><p>' + wgxEsc(wgxLUFeatureDesc(ft.desc)) + '</p></div>';
      }
    }
    if ((d.newGrantedSpells || []).length) {
      html += '<h3>New spells (granted)</h3>';
      d.newGrantedSpells.forEach(function (g) {
        var free = g.free != null ? (g.free === 1 ? 'once' : g.free === 'pb' ? 'Proficiency Bonus times' : g.free + ' times') + ' per ' + (g.recharge === 'short' ? 'Short or Long Rest' : 'Long Rest') + ' without a slot' : (g.kind === 'prepared' ? 'always prepared' : g.kind);
        html += '<div class="wgx-lu-feature">' + wgxLUBadge(g.source) + '<b>' + wgxEsc(g.name) + '</b><p>' + wgxEsc(g.from + ' — ' + free + (g.slots ? '; also castable with spell slots' : '')) + '</p></div>';
      });
    }
    if (d.newResources.length) {
      html += '<h3>New resources</h3>';
      for (var r = 0; r < d.newResources.length; r++) {
        html += '<div class="wgx-lu-feature"><b>' + wgxEsc(d.newResources[r].label) + '</b><p>' + wgxEsc(d.newResources[r].desc) + '</p></div>';
      }
    }
  } else if (step.kind === 'choice' && step.choice.id === 'subclass') {
    var classData = DATA[cn] || {};
    var subs = classData.subclasses || {};
    html += '<h3>Choose your subclass</h3><div class="wgx-lu-subgrid">';
    for (var key in subs) {
      if (subs[key].legacy) continue;
      var sel = picked.subclass === key ? ' selected' : '';
      var feats = (subs[key].features && subs[key].features[3]) || [];
      html += '<div class="wgx-lu-subcard' + sel + '" data-wgx-lu="pick-single" data-key="subclass" data-val="' + key + '"><h4>' + wgxEsc(subs[key].name) + '</h4>';
      for (var sf = 0; sf < feats.length; sf++) {
        html += '<p><b>' + wgxEsc(feats[sf].name) + '</b> — ' + wgxEsc(wgxLUFeatureDesc(feats[sf].desc)) + '</p>';
      }
      html += '</div>';
    }
    html += '</div>';
  } else if (step.kind === 'choice' && step.choice.id === 'landType') {
    html += '<h3>Circle of the Land: choose a land type</h3><p class="wgx-lu-note">You have its spells prepared. You can pick another land type on every Long Rest (Build overview).</p>';
    html += wgxLUGrid(WGX_LANDS.map(function (l) {
      var sp = ((DATA.druid.subclasses.land || {}).spells || []).filter(function (s) { return s.land === l[0] && s.lvl <= d.to; }).map(function (s) { return s.name; });
      return { val: l[0], title: l[1], desc: sp.join(', ') };
    }), 'landType', true, picked.landType);
  } else if (optDef) {
    html += '<h3>' + wgxEsc(optDef.label) + ': choose one option</h3>' +
      (optDef.swap ? '<p class="wgx-lu-note">You can change it on every ' + (optDef.swap === 'shortRest' ? 'Short or ' : '') + 'Long Rest (Build overview).</p>' : '');
    html += wgxLUGrid(optDef.options.map(function (op) { return { val: op.name, title: op.name, desc: op.desc }; }), 'options.' + optDef.id, true, (picked.options || {})[optDef.id]);
  } else if (step.kind === 'choice' && step.choice.id === 'huntersPrey') {
    html += "<h3>Hunter's Prey</h3><p class=\"wgx-lu-note\">You can switch on every Short or Long Rest (Build overview).</p>";
    html += wgxLUGrid(WGX_HUNTERS_PREY.map(function (h) { return { val: h[0], title: h[0], desc: h[1] }; }), 'huntersPrey', true, picked.huntersPrey);
  } else if (step.kind === 'choice' && step.choice.id === 'lineage') {
    var rd = DATA[cfg.race] || {};
    html += '<h3>Choose your ' + wgxEsc(rd.lineageLabel || 'lineage') + '</h3><p class="wgx-lu-note">This was never recorded for your character. It decides spells, resistances or actions — pick the one you play.</p>';
    html += wgxLUGrid(Object.keys(rd.lineages || {}).map(function (k) {
      var ln = rd.lineages[k];
      var desc = [];
      if (ln.resist) desc.push('Resistance: ' + ln.resist);
      if (ln.damage) desc.push('Damage type: ' + ln.damage);
      (ln.spells || []).forEach(function (s) { desc.push((s.kind === 'cantrip' ? 'Cantrip ' : 'Level ' + s.lvl + ': ') + s.name); });
      (ln.features || []).forEach(function (fe) { desc.push(fe.name + ' — ' + fe.desc); });
      return { val: k, title: ln.name, desc: desc.join(' · ') };
    }), 'lineage', true, picked.lineage);
  } else if (step.kind === 'choice' && (step.choice.id === 'speciesAbility' || step.choice.id === 'featSpellAbility')) {
    var isSp = step.choice.id === 'speciesAbility';
    var path = isSp ? 'speciesAbility' : wgxOwnerPath(step.choice.owner, 'spellAbility');
    html += '<h3>' + (isSp ? 'Spellcasting ability for your species spells' : 'Spellcasting ability for ' + wgxEsc(step.choice.featName || wgxOwnerRec(picked, step.choice.owner).feat || 'this feat')) + '</h3>' +
      '<p class="wgx-lu-note">Intelligence, Wisdom or Charisma — it sets the save DC and attack bonus of these spells.</p>';
    html += wgxLUGrid(['int', 'wis', 'cha'].map(function (a) {
      var sc = getAbilityScore(eff, Object.assign({ asiChoices: {} }, st), a);
      return { val: a, title: WG_ABILITY_LABELS[a] || a, sub: 'score ' + sc + ' (' + formatMod(getMod(sc)) + ')' };
    }), path, true, wgxPGet(path));
  } else if (step.kind === 'choice' && step.choice.id === 'order') {
    var isCleric = cn === 'cleric';
    html += '<h3>' + (isCleric ? 'Divine Order' : 'Primal Order') + '</h3><p class="wgx-lu-note">A level 1 choice that was never recorded.</p>';
    html += wgxLUGrid(isCleric ? [
      { val: 'protector', title: 'Protector', desc: 'Proficiency with Martial weapons and training with Heavy armor.' },
      { val: 'thaumaturge', title: 'Thaumaturge', desc: 'One extra Cleric cantrip; add your Wisdom modifier (min +1) to Arcana and Religion checks.' }
    ] : [
      { val: 'magician', title: 'Magician', desc: 'One extra Druid cantrip; add your Wisdom modifier (min +1) to Arcana and Nature checks.' },
      { val: 'warden', title: 'Warden', desc: 'Proficiency with Martial weapons and training with Medium armor.' }
    ], 'order', true, picked.order);
  } else if (step.kind === 'choice' && (step.choice.id === 'versatileFeat' || step.choice.id === 'asi' || step.choice.id === 'lessonsFeat')) {
    var isAsi = step.choice.id === 'asi';
    var owner = isAsi ? 'asi' : step.choice.id === 'lessonsFeat' ? 'lessons' : 'versatile';
    var cur = wgxOwnerRec(picked, owner);
    var curVal = cur.type === 'asi' ? '__asi__' : (cur.feat || null);
    var stLvl = Object.assign({ asiChoices: {} }, st, { level: d.to });
    var asiLvl = (step.choice.level || d.to);
    var feats = (DATA.feats || []).filter(function (fe) { return isAsi ? (fe.category === 'general' || fe.category === 'origin' || fe.category === 'fighting' || (fe.category === 'epic' && asiLvl >= 19)) : fe.category === 'origin'; });
    html += '<h3>' + (isAsi ? (asiLvl >= 19 ? 'Level ' + asiLvl + ': choose an Epic Boon (or another feat)' : 'Level ' + d.to + ': increase your abilities or take a feat') : owner === 'lessons' ? 'Lessons of the First Ones: choose an Origin feat' : 'Human Versatile: choose an Origin feat') + '</h3>';
    html += '<p class="wgx-lu-note">' + (isAsi ? 'Ability Score Improvement = +2 to one ability or +1 to two (max 20). Every General feat also gives +1 to an ability. Greyed feats show what you are missing.' : owner === 'lessons' ? 'An extra Origin feat from your invocation.' : 'This level 1 choice was never recorded. You get it on top of your background\'s Origin feat.') + '</p>';
    var items = [];
    if (isAsi) items.push({ val: '__asi__', title: 'Ability Score Improvement', sub: '+2 / +1 +1', desc: 'Increase one ability by 2, or two abilities by 1 (max 20).' });
    var order = { epic: -1, general: 0, origin: 1, fighting: 2 };
    feats.slice().sort(function (a, b) { return (order[a.category] - order[b.category]) || a.name.localeCompare(b.name); }).forEach(function (fe) {
      if (fe.asi) return;
      var pr = featPrereqMet(fe, eff, stLvl, d.to);
      var sub = fe.category === 'epic' ? 'Epic Boon' : fe.category === 'general' ? 'General' : fe.category === 'origin' ? 'Origin' : 'Fighting Style';
      if (fe.spells) sub += ' · spells';
      items.push({ val: fe.name, title: fe.name, sub: sub, desc: wgxTrunc(wgxLUFeatureDesc(fe.desc), 150), known: !pr.ok, knownLabel: pr.reason });
    });
    html += wgxLUGrid(items, owner + '.__pick', true, curVal);
  } else if (step.kind === 'choice' && step.choice.id === 'asiAbilities') {
    var ab = (wgxOwnerRec(picked, 'asi').abilities) || {};
    var total = WGX_ABILITIES.reduce(function (s, k) { return s + (ab[k] || 0); }, 0);
    html += '<h3>Ability Score Improvement</h3><p class="wgx-lu-note">Click an ability once for +1, twice for +2. Spend 2 points in total; no score above 20. (' + total + ' / 2)</p><div class="wgx-lu-subgrid">';
    WGX_ABILITIES.forEach(function (k) {
      var base = getAbilityScore(cfg, Object.assign({ asiChoices: {} }, st), k);
      var inc = ab[k] || 0;
      html += '<div class="wgx-lu-subcard' + (inc ? ' selected' : '') + '" data-wgx-lu="asi-ab" data-ab="' + k + '"><h4>' + (WG_ABILITY_LABELS[k] || k) + ' <span class="wgx-lu-cost">' + base + (inc ? ' → ' + (base + inc) : '') + '</span></h4><p>' + (inc ? '+' + inc : 'no change') + (base >= 20 ? ' · already 20' : '') + '</p></div>';
    });
    html += '</div>';
  } else if (step.kind === 'choice' && step.choice.id === 'featAbility') {
    var fr = wgxOwnerRec(picked, step.choice.owner);
    var fobj = findFeat(fr.feat) || {};
    var saves = ((DATA[cn] || {}).savingThrows || []);
    var opts = (step.choice.options || []).filter(function (a) { return fobj.name !== 'Resilient' || saves.indexOf(a) === -1; });
    html += '<h3>' + wgxEsc(fr.feat || 'Feat') + ': +1 to which ability?</h3>' + (fobj.abilityNote ? '<p class="wgx-lu-note">Choose ' + wgxEsc(fobj.abilityNote) + '.</p>' : '');
    html += wgxLUGrid(opts.map(function (a) {
      var sc = getAbilityScore(cfg, Object.assign({ asiChoices: {} }, st), a);
      var capA = fobj.abilityMax || 20;   // Epic Boons go up to 30
      return { val: a, title: WG_ABILITY_LABELS[a] || a, sub: sc + ' → ' + Math.min(capA, sc + 1), known: sc >= capA, knownLabel: 'already ' + capA };
    }), wgxOwnerPath(step.choice.owner, 'ability'), true, fr.ability);
  } else if (step.kind === 'choice' && step.choice.id === 'featSpells') {
    var fowner = step.choice.owner, fpath = wgxOwnerPath(fowner, step.choice.pick);
    var fName = step.choice.featName || wgxOwnerRec(picked, fowner).feat || 'Feat';
    var flt = step.choice.filter || {};
    var cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };
    var fLists = flt.list ? [].concat(flt.list).map(cap) : [];
    var desc2 = (flt.maxLevel ? 'spell' : flt.level === 0 ? 'cantrip' : 'level ' + flt.level + ' spell') + (step.needed > 1 ? 's' : '') +
      (flt.maxLevel ? ' of level ' + flt.maxLevel + ' or lower' : '') +
      (fLists.length ? ' from the ' + (fLists.length > 1 ? fLists.slice(0, -1).join(', ') + ' or ' + fLists[fLists.length - 1] + ' lists' : fLists[0] + ' list') : ' from any class list') +
      (flt.schools ? ' (' + flt.schools.join(' or ') + ')' : '') + (flt.ritual ? ' with the Ritual tag' : '');
    html += '<h3>' + wgxEsc(fName) + ': choose ' + step.needed + ' ' + wgxEsc(desc2) + '</h3>' + wgxLUCountNote(wgxPGet(fpath), step.needed);
    var already = wgxKnownSpellNames(eff, st, picked, fpath);
    var curPicks = wgxPGet(fpath) || [];
    html += wgxLUGrid(wgxSpellOptions(flt).map(function (e) {
      var dup = already.indexOf(e.nm) !== -1 && curPicks.indexOf(e.nm) === -1;
      var c = wgxSpellCard(e, flt.level === 0 && dup);
      if (dup) { c.knownLabel = 'already known'; if (flt.level !== 0) c.sub = 'already prepared · ' + c.sub; }
      return c;
    }), fpath, false, wgxPGet(fpath));
  } else if (step.kind === 'choice' && (step.choice.id === 'featSkills' || step.choice.id === 'featExpertise')) {
    var sOwner = step.choice.owner, isExp = step.choice.id === 'featExpertise';
    var sPath = wgxOwnerPath(sOwner, isExp ? 'expertise' : 'skills');
    var fr2 = wgxOwnerRec(picked, sOwner);
    var prof = (cfg.defaultSkills || []).concat(isExp ? (fr2.skills || []) : []);
    if (isExp && step.choice.anySkill && typeof WG_SKILLS !== 'undefined') prof = WG_SKILLS.map(function (sk) { return sk.key; });
    var allSk = (typeof WG_SKILLS !== 'undefined') ? WG_SKILLS : [];
    var skItems = allSk.filter(function (s) { return !step.choice.options || step.choice.options.indexOf(s.key) !== -1; }).map(function (s) {
      var isProf = wgxHasSkill(prof, s.key), isXp = wgxHasSkill(cfg.expertSkills, s.key);
      var known = isExp ? (!isProf || isXp) : (step.choice.mode === 'proficiency' && isProf) || (step.choice.mode === 'profOrExpertise' && isXp);
      var label = isExp ? (!isProf ? 'not proficient' : 'already Expertise') : (isXp ? 'already Expertise' : 'already proficient');
      var sub = step.choice.mode === 'profOrExpertise' && isProf ? '→ Expertise' : (isExp ? 'Expertise' : 'Proficiency');
      return { val: s.key, title: s.label, sub: sub, known: known, knownLabel: label };
    });
    html += '<h3>' + wgxEsc(fr2.feat || step.choice.featName || 'Feat') + ': ' + (isExp ? 'choose Expertise' : 'choose ' + step.needed + ' skill' + (step.needed > 1 ? 's' : '')) + '</h3>' + wgxLUCountNote(wgxPGet(sPath), step.needed);
    if (fr2.feat === 'Skilled') html += '<p class="wgx-lu-note">Skilled also allows tools instead of skills — record tools with your DM.</p>';
    if (step.choice.note) html += '<p class="wgx-lu-note">' + wgxEsc(step.choice.note) + '</p>';
    html += wgxLUGrid(skItems, sPath, false, wgxPGet(sPath));
  } else if (step.kind === 'choice' && step.choice.id === 'featElement') {
    var ePath = wgxOwnerPath(step.choice.owner, 'element');
    html += '<h3>Elemental Adept: choose a damage type</h3>';
    html += wgxLUGrid((step.choice.options || []).map(function (e) { return { val: e, title: e.charAt(0).toUpperCase() + e.slice(1) }; }), ePath, true, wgxPGet(ePath));
  } else if (step.kind === 'choice' && step.choice.id === 'metamagic') {
    var mmNeed = step.needed;
    var mmKnown = st.metamagic || [];
    html += '<h3>Choose ' + mmNeed + ' Metamagic option' + (mmNeed > 1 ? 's' : '') + '</h3>' + wgxLUCountNote(picked.metamagic, mmNeed);
    html += wgxLUGrid((DATA.metamagic || []).map(function (op) {
      return { val: op.name, title: op.name, sub: String(op.cost) + ' SP', desc: wgxLUFeatureDesc(op.desc), known: mmKnown.indexOf(op.name) !== -1 };
    }), 'metamagic', false, picked.metamagic);
  } else if (step.kind === 'choice' && step.choice.id === 'invocations') {
    var invNeed = step.needed;
    var invKnown = st.invocations || [];
    html += '<h3>Choose ' + invNeed + ' Eldritch Invocation' + (invNeed > 1 ? 's' : '') + '</h3>' + wgxLUCountNote(picked.invocations, invNeed);
    var invHave = invKnown.concat(picked.invocations || []);
    html += wgxLUGrid((DATA.invocations || []).filter(function (op) { return (op.minLevel || 1) <= d.to; }).map(function (op) {
      var desc = (op.prereq ? 'Requires ' + op.prereq + '. ' : '') + op.desc;
      var c = { val: op.name, title: op.name, desc: desc, known: invKnown.indexOf(op.name) !== -1 && !op.repeatable };
      if (op.requires && invHave.indexOf(op.requires) === -1) { c.known = true; c.knownLabel = 'needs ' + op.requires; }
      return c;
    }), 'invocations', false, picked.invocations);
  } else if (step.kind === 'choice' && step.choice.id === 'wildShapeForms') {
    var wsNeed = step.needed;
    var wsKnown = st.wildShapeForms || [];
    var lim = (DATA.wildShapeLimits || function () { return { cr: 0.25 }; })(d.to, eff.subclass);
    html += '<h3>Choose ' + wsNeed + ' Wild Shape form' + (wsNeed > 1 ? 's' : '') + '</h3>' +
      '<p class="wgx-lu-note">Beasts of CR ' + (lim.cr === 0.25 ? '1/4' : lim.cr === 0.5 ? '1/2' : lim.cr) + ' or lower' + (lim.fly ? '' : ' without a Fly Speed') + '. You can swap one known form on each Long Rest.</p>' +
      wgxLUCountNote(picked.wildShapeForms, wsNeed);
    html += wgxLUGrid(wgxWildShapeOptions(d.to, eff.subclass).map(function (fm) {
      return { val: fm.name, title: fm.name, sub: 'CR ' + fm.cr + (fm.fly ? ' · Fly' : '') + (fm.swarm ? ' · Swarm' : ''), desc: fm.desc, known: wsKnown.indexOf(fm.name) !== -1 };
    }), 'wildShapeForms', false, picked.wildShapeForms);
  } else if (step.kind === 'choice' && step.choice.id === 'maneuvers') {
    var mnNeed = step.needed, mnKnown = st.maneuvers || [];
    html += '<h3>Choose ' + mnNeed + ' maneuver' + (mnNeed > 1 ? 's' : '') + '</h3><p class="wgx-lu-note">Each use costs a Superiority Die; one maneuver per attack.</p>' + wgxLUCountNote(picked.maneuvers, mnNeed);
    html += wgxLUGrid((DATA.maneuvers || []).map(function (m) {
      return { val: m.name, title: m.name, sub: { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction', attack: 'On hit', free: 'No action' }[m.act] || '', desc: m.desc, known: mnKnown.indexOf(m.name) !== -1 };
    }), 'maneuvers', false, picked.maneuvers);
  } else if (step.kind === 'choice' && step.choice.id === 'weaponMasteries') {
    var wmNeed = step.needed, wmKnown = st.weaponMasteries || [];
    var mDesc = ((DATA.items || {}).weaponMasteryDesc) || {};
    html += '<h3>Weapon Mastery: choose ' + wmNeed + ' weapon kind' + (wmNeed > 1 ? 's' : '') + '</h3><p class="wgx-lu-note">You can use the mastery property of these weapons. ' + (cn === 'barbarian' || cn === 'fighter' ? 'Swap one on each Long Rest.' : 'Change them on each Long Rest.') + '</p>' + wgxLUCountNote(picked.weaponMasteries, wmNeed);
    html += wgxLUGrid(wgxMasteryOptions(cn).map(function (w) {
      var md = mDesc[w.mastery] || mDesc[w.mastery.toLowerCase()] || '';
      return { val: w.name, title: w.name, sub: w.mastery + ' · ' + w.kind, desc: wgxLUFeatureDesc(md), known: wmKnown.indexOf(w.name) !== -1 };
    }), 'weaponMasteries', false, picked.weaponMasteries);
  } else if (step.kind === 'choice' && step.choice.id === 'fightingStyle') {
    var styles = (DATA.feats || []).filter(function (ftt) { return ftt.category === 'fighting'; });
    var extras = (DATA.classFightingBonus || {})[cn] || [];
    html += '<h3>Choose a Fighting Style</h3>';
    if (extras.length) html += '<p class="wgx-lu-note">Or take your class option (' + wgxEsc(extras.map(function (e) { return e.name; }).join(', ')) + ') instead of a style feat.</p>';
    html += wgxLUGrid(extras.map(function (e) {
      return { val: e.name, title: e.name, sub: 'Class option', desc: e.desc, known: false };
    }).concat(styles.map(function (s) {
      return { val: s.name, title: s.name, desc: wgxLUFeatureDesc(s.desc), known: (st.fightingStyles || []).indexOf(s.name) !== -1 };
    })), 'fightingStyle', true, picked.fightingStyle);
  } else if (step.kind === 'choice' && step.choice.id === 'styleCantrips') {
    var scNeed = step.needed;
    var scList = (DATA.spells[step.choice.list] || {})[0] || [];
    html += '<h3>' + wgxEsc(step.choice.styleName) + ': choose ' + scNeed + ' cantrip' + (scNeed > 1 ? 's' : '') + '</h3>' +
      '<p class="wgx-lu-note">From the ' + wgxEsc(step.choice.list) + ' spell list.</p>' + wgxLUCountNote(picked.styleCantrips, scNeed);
    html += wgxLUGrid(scList.map(function (nm) {
      var sp = DATA.spellPool[nm] || {};
      return { val: nm, title: nm, sub: (sp.time || '') + (sp.range ? ' · ' + sp.range : ''), desc: wgxTrunc(sp.desc, 110), known: (st.cantrips || []).indexOf(nm) !== -1 };
    }), 'styleCantrips', false, picked.styleCantrips);
  } else if (step.kind === 'choice' && (step.choice.id === 'expertise' || step.choice.id === 'scholar')) {
    var isScholar = step.choice.id === 'scholar';
    var eligible = wgxEligibleExpertise(cfg, isScholar ? wgxScholarSkillKeys() : null);
    var exNeed = step.needed;
    html += '<h3>' + (isScholar ? 'Scholar: choose your specialty' : 'Choose Expertise') + '</h3>' +
      '<p class="wgx-lu-note">Your Proficiency Bonus is doubled for the chosen skill.' +
      (isScholar ? ' Options: Arcana, History, Investigation, Medicine, Nature or Religion (proficiency required).' : '') +
      (cn === 'ranger' && !isScholar ? ' Deft Explorer also grants two languages of your choice — record those with your DM.' : '') + '</p>';
    if (!eligible.length) {
      html += '<p class="wgx-lu-note">No eligible skills: you need proficiency in ' + (isScholar ? 'one of the listed skills' : 'a skill that is not already Expertise') + '. Record this choice with your DM.</p>';
    } else {
      if (!isScholar) html += wgxLUCountNote(picked.expertise, exNeed);
      var abLbl = (typeof WG_ABILITY_LABELS === 'object' && WG_ABILITY_LABELS) ? WG_ABILITY_LABELS : {};
      var skDesc = (typeof WG_SKILL_DESC === 'object' && WG_SKILL_DESC) ? WG_SKILL_DESC : {};
      html += wgxLUGrid(eligible.map(function (s) {
        return { val: s.key, title: s.label, sub: abLbl[s.ability] || s.ability, desc: skDesc[s.key] || '', known: false };
      }), step.choice.id, isScholar, isScholar ? picked.scholar : picked.expertise);
    }
  } else if (step.kind === 'choice' && (step.choice.id === 'spells' || step.choice.id === 'cantrips')) {
    var isCantrip = step.choice.id === 'cantrips';
    var spNeed = step.needed;
    var knownList = isCantrip ? (st.cantrips || []) : (st.prepared || []);
    var pool = [];
    if (isCantrip) {
      pool = wgxSpellOptions({ list: spellCn, level: 0 });
    } else {
      var maxLvl = wgxMaxSpellLevel(cn, d, wgxEffCasting(cfg, st, d, picked).slots);
      pool = wgxSpellOptions({ list: getSpellLists(cn, eff.subclass, d.to), maxLevel: maxLvl });
    }
    html += '<h3>Choose ' + spNeed + ' new ' + (isCantrip ? 'cantrip' : 'spell') + (spNeed > 1 ? 's' : '') + '</h3>';
    if (!isCantrip && cn === 'wizard') html += '<p class="wgx-lu-note">Your spellbook also gains 2 spells of your choice — record it with your DM (the app tracks prepared spells only).</p>';
    if (!isCantrip && (cn === 'wizard' || cn === 'druid' || cn === 'cleric')) html += '<p class="wgx-lu-note">You can freely change your full prepared list on a Long Rest — this pick is just your starting point.</p>';
    html += wgxLUCountNote(isCantrip ? picked.cantrips : picked.spells, spNeed);
    // Also grey out what another source already gives you (species, feats,
    // subclass always-prepared, Book of Shadows) — picking it again wastes a slot.
    var grantedBy = {};
    if (typeof getGrantedSpells === 'function') getGrantedSpells(eff, Object.assign({}, st, { level: d.to })).forEach(function (g) { if (!g.open && !grantedBy[g.name]) grantedBy[g.name] = g.from; });
    var otherPicks = wgxKnownSpellNames(eff, st, picked, isCantrip ? 'cantrips' : 'spells').filter(function (n) { return knownList.indexOf(n) === -1; });
    html += wgxLUGrid(pool.map(function (e) {
      var c = wgxSpellCard(e, knownList.indexOf(e.nm) !== -1 || !!grantedBy[e.nm] || otherPicks.indexOf(e.nm) !== -1);
      if (grantedBy[e.nm]) c.knownLabel = 'already from ' + grantedBy[e.nm];
      else if (otherPicks.indexOf(e.nm) !== -1 && knownList.indexOf(e.nm) === -1) c.knownLabel = 'already picked';
      return c;
    }), step.choice.id, false, isCantrip ? picked.cantrips : picked.spells);
  } else if (step.kind === 'choice' && step.choice.id === 'swaps') {
    html += '<h3>Optional: swap when you gain a level</h3><p class="wgx-lu-note">2024 rules let you replace these when you level up. Leave on "Keep" to change nothing.</p>';
    wgxSwapOptions(cfg, st, d).forEach(function (o) {
      var cur2 = (picked.swaps || {})[o.id] || {};
      html += '<div class="wgx-lu-feature"><b>' + wgxEsc(o.label) + '</b><div class="wgx-lu-swaprow">' +
        '<select data-wgx-swap="' + o.id + '" data-part="out"><option value="">Keep</option>' + o.have.map(function (n) { return '<option' + (cur2.out === n ? ' selected' : '') + '>' + wgxEsc(n) + '</option>'; }).join('') + '</select>' +
        '<span>→</span><select data-wgx-swap="' + o.id + '" data-part="in"><option value="">—</option>' + o.pool.map(function (n) { return '<option' + (cur2['in'] === n ? ' selected' : '') + '>' + wgxEsc(n) + '</option>'; }).join('') + '</select></div></div>';
    });
  } else if (step.kind === 'choice') {
    // Generic fallback for choice types without a dedicated renderer yet:
    // informational, never blocks.
    html += '<h3>Choice: ' + wgxEsc(step.choice.id) + (step.choice.count ? ' (× ' + step.choice.count + ')' : '') + '</h3>' +
      '<p class="wgx-lu-note">This choice type does not have an in-app picker yet. Continue and record your pick with your DM; it can be added to your sheet later.</p>';
  } else if (step.kind === 'confirm') {
    html += '<h3>Summary</h3>' + (wgxLU.fixOnly ? '<p>Saving your choices — your level stays <b>' + d.to + '</b>.</p>' : '<p>Level ' + d.from + ' → <b>' + d.to + '</b></p>');
    html += wgxLUSummaryHtml(cfg, st, d, picked);
    html += '<p class="wgx-lu-note">You can undo this later with Level Down.</p>';
  }

  html += '</div><div class="wgx-lu-nav">';
  html += '<button class="wgx-lu-btn" data-wgx-lu="' + (wgxLU.stepIdx === 0 ? 'cancel' : 'prev') + '">' + (wgxLU.stepIdx === 0 ? 'Cancel' : 'Back') + '</button>';
  var isLast = wgxLU.stepIdx === wgxLU.steps.length - 1;
  var needsPick = step.kind === 'choice' && !wgxStepComplete(step, picked);
  html += '<button class="wgx-lu-btn wgx-lu-primary" data-wgx-lu="' + (isLast ? 'confirm' : 'next') + '"' + (needsPick ? ' disabled' : '') + '>' + (isLast ? (wgxLU.fixOnly ? 'Save' : 'Level Up!') : 'Next') + '</button>';
  html += '</div>';
  card.innerHTML = html;
}

// Is a choice step complete (Next enabled)?
// Every spell name the character already has (class lists, granted spells) plus
// what was picked elsewhere in this level-up flow (other feats, Book of Shadows).
function wgxKnownSpellNames(cfg, st, picked, exceptPath) {
  var out = (st.cantrips || []).concat(st.prepared || []);
  if (typeof getGrantedSpells === 'function') getGrantedSpells(cfg, st).forEach(function (g) { if (!g.open) out.push(g.name); });
  ['asi', 'versatile', 'lessons', 'tome', 'repl'].concat(Object.keys(picked).filter(function (k) { return k.indexOf('fix:') === 0; })).forEach(function (o) {
    ['cantrips', 'spells'].forEach(function (f) {
      if (o + '.' + f === exceptPath) return;
      var v = picked[o] && picked[o][f];
      if (Array.isArray(v)) out = out.concat(v);
    });
  });
  return out;
}

function wgxStepComplete(step, picked) {
  var c = step.choice, id = c.id;
  var get = function (path) { var o = picked; path.split('.').forEach(function (p) { o = o == null ? undefined : o[p]; }); return o; };
  if (id === 'subclass') return !!picked.subclass;
  if (id === 'lineage') return !!picked.lineage;
  if (id === 'landType') return !!picked.landType;
  if (id === 'huntersPrey') return !!picked.huntersPrey;
  if (id === 'option') return !!(picked.options || {})[c.opt];
  if (id === 'speciesAbility') return !!picked.speciesAbility;
  if (id === 'order') return !!picked.order;
  if (id === 'fightingStyle') return !!picked.fightingStyle || step.needed === 0;
  if (id === 'scholar') return step.needed === 0 || !!picked.scholar;
  if (id === 'asi') return !!(picked.asi && (picked.asi.type === 'asi' || picked.asi.feat));
  if (id === 'versatileFeat') return !!(picked.versatile && picked.versatile.feat);
  if (id === 'lessonsFeat') return !!(picked.lessons && picked.lessons.feat);
  if (id === 'asiAbilities') { var ab = (picked.asi || {}).abilities || {}; return WGX_ABILITIES.reduce(function (s, k) { return s + (ab[k] || 0); }, 0) === 2; }
  if (id === 'featAbility') return !!get(c.owner + '.ability');
  if (id === 'featSpellAbility') return !!get(c.owner + '.spellAbility');
  if (id === 'featElement') return !!get(c.owner + '.element');
  if (id === 'featSpells') return (get(c.owner + '.' + c.pick) || []).length === step.needed;
  if (id === 'featSkills') return (get(c.owner + '.skills') || []).length === step.needed;
  if (id === 'featExpertise') return (get(c.owner + '.expertise') || []).length === step.needed;
  if (id === 'swaps') return Object.keys(picked.swaps || {}).every(function (k) { var s = picked.swaps[k]; return !s.out || !!s['in']; });
  if (WGX_TOTAL_IDS[id] || id === 'spells' || id === 'cantrips' || id === 'styleCantrips' || id === 'expertise') {
    return (picked[id] || []).length === step.needed;
  }
  return true;
}

function wgxLUSummaryHtml(cfg, st, d, picked) {
  var cn = cfg.className, sum = [];
  var skillLabel = function (k) {
    var skills = (typeof WG_SKILLS !== 'undefined') ? WG_SKILLS : [];
    for (var q = 0; q < skills.length; q++) if (skills[q].key === k) return skills[q].label;
    return k;
  };
  var featLine = function (p) {
    if (!p) return '';
    if (p.type === 'asi') return 'Ability Score Improvement (' + Object.keys(p.abilities || {}).map(function (a) { return a.toUpperCase() + ' +' + p.abilities[a]; }).join(', ') + ')';
    var bits = [];
    if (p.ability) bits.push('+1 ' + p.ability.toUpperCase());
    if (p.spellAbility) bits.push('casts with ' + p.spellAbility.toUpperCase());
    if (p.cantrips && p.cantrips.length) bits.push('cantrips: ' + p.cantrips.join(', '));
    if (p.spells && p.spells.length) bits.push('spells: ' + p.spells.join(', '));
    if (p.skills && p.skills.length) bits.push('skills: ' + p.skills.map(skillLabel).join(', '));
    if (p.expertise && p.expertise.length) bits.push('expertise: ' + p.expertise.map(skillLabel).join(', '));
    if (p.element) bits.push(p.element);
    return p.feat + (bits.length ? ' (' + bits.join('; ') + ')' : '');
  };
  if (picked.lineage) sum.push([(DATA[cfg.race] || {}).lineageLabel || 'Lineage', ((DATA[cfg.race].lineages || {})[picked.lineage] || {}).name || picked.lineage]);
  if (picked.speciesAbility) sum.push(['Species spellcasting ability', picked.speciesAbility.toUpperCase()]);
  if (picked.order) sum.push([cn === 'cleric' ? 'Divine Order' : 'Primal Order', picked.order]);
  if (picked.versatile && picked.versatile.feat) sum.push(['Versatile (origin feat)', featLine(picked.versatile)]);
  Object.keys(picked).forEach(function (k) {
    if (k.indexOf('fix:') !== 0) return;
    var p = picked[k] || {}, bits = [];
    if (p.spellAbility) bits.push('casts with ' + p.spellAbility.toUpperCase());
    if (p.cantrips) bits.push('cantrips: ' + p.cantrips.join(', '));
    if (p.spells) bits.push('spells: ' + p.spells.join(', '));
    sum.push(['Feat picks (' + k.slice(4) + ')', bits.join('; ')]);
  });
  if (picked.tome) sum.push(['Book of Shadows', [].concat(picked.tome.cantrips || [], picked.tome.spells || []).join(', ')]);
  if (picked.lessons && picked.lessons.feat) sum.push(['Lessons of the First Ones', featLine(picked.lessons)]);
  if (picked.landType) sum.push(['Land type', picked.landType]);
  if (picked.huntersPrey) sum.push(["Hunter's Prey", picked.huntersPrey]);
  Object.keys(picked.options || {}).forEach(function (id) {
    var od = (DATA.optionChoices || []).filter(function (o) { return o.id === id; })[0];
    if (od && picked.options[id]) sum.push([od.label, picked.options[id]]);
  });
  Object.keys(picked.fp || {}).forEach(function (key) {
    Object.keys(picked.fp[key] || {}).forEach(function (pk) {
      if ((picked.fp[key][pk] || []).length) sum.push([(wgxLU && (wgxLU.steps || []).filter(function (s) { return s.choice && s.choice.owner === 'fp.' + key; }).map(function (s) { return s.choice.featName; })[0]) || 'Feature spells', picked.fp[key][pk].join(', ')]);
    });
  });
  if (picked.subclass) sum.push(['Subclass', ((DATA[cn].subclasses || {})[picked.subclass] || {}).name || picked.subclass]);
  if (picked.asi) sum.push(['Level ' + d.to, featLine(picked.asi)]);
  if (picked.metamagic && picked.metamagic.length) sum.push(['Metamagic', picked.metamagic.join(', ')]);
  if (picked.invocations && picked.invocations.length) sum.push(['Invocations', picked.invocations.join(', ')]);
  if (picked.wildShapeForms && picked.wildShapeForms.length) sum.push(['Wild Shape forms', picked.wildShapeForms.join(', ')]);
  if (picked.maneuvers && picked.maneuvers.length) sum.push(['Maneuvers', picked.maneuvers.join(', ')]);
  if (picked.weaponMasteries && picked.weaponMasteries.length) sum.push(['Weapon Mastery', picked.weaponMasteries.join(', ')]);
  if (picked.fightingStyle) sum.push(['Fighting Style', picked.fightingStyle]);
  if (picked.expertise && picked.expertise.length) sum.push(['Expertise', picked.expertise.map(skillLabel).join(', ')]);
  if (picked.scholar) sum.push(['Scholar (Expertise)', skillLabel(picked.scholar)]);
  if (picked.cantrips && picked.cantrips.length) sum.push(['New cantrips', picked.cantrips.join(', ')]);
  if (picked.styleCantrips && picked.styleCantrips.length) sum.push([((wgxStyleBonus(cn, picked.fightingStyle) || {}).name || 'Style') + ' cantrips', picked.styleCantrips.join(', ')]);
  if (picked.spells && picked.spells.length) sum.push(['New spells', picked.spells.join(', ')]);
  Object.keys(picked.swaps || {}).forEach(function (k) { var s = picked.swaps[k]; if (s.out && s['in']) sum.push(['Swap', s.out + ' → ' + s['in']]); });
  var html = '';
  for (var su = 0; su < sum.length; su++) html += '<p>' + wgxEsc(sum[su][0]) + ': <b>' + wgxEsc(sum[su][1]) + '</b></p>';
  // HP preview with the picks (a CON increase raises every level)
  try {
    var pt = wgxBuildLevelUpPatch(cfg, st, d, picked);
    html += '<p>Hit points: <b>' + pt.statePatch['hp/current'] + '</b> now</p>';
  } catch (e) { /* preview only */ }
  return html;
}

function wgxLUClick(e) {
  if (!wgxLU) return;
  // Click on the dimmed backdrop itself (not something inside the card) → close.
  if (e.target.classList && e.target.classList.contains('modal-overlay')) { wgxCloseLevelUpModal(); return; }
  var t = e.target.closest('[data-wgx-lu]');
  if (!t) return;
  var act = t.getAttribute('data-wgx-lu');
  if (act === 'cancel') { wgxCloseLevelUpModal(); return; }
  if (act === 'prev') { wgxLU.stepIdx = Math.max(0, wgxLU.stepIdx - 1); wgxRenderLUStep(); return; }
  if (act === 'next') { wgxLU.stepIdx = Math.min(wgxLU.steps.length - 1, wgxLU.stepIdx + 1); wgxRenderLUStep(); return; }
  if (act === 'asi-ab') {
    var abk = t.getAttribute('data-ab');
    var asi = wgxLU.picked.asi || (wgxLU.picked.asi = { type: 'asi' });
    var ab = asi.abilities || (asi.abilities = {});
    var cfgA = wgxLU.raw.config || {}, stA = Object.assign({ asiChoices: {} }, wgxLU.raw.state || {});
    var total = WGX_ABILITIES.reduce(function (s, k) { return s + (ab[k] || 0); }, 0);
    var cur = ab[abk] || 0;
    var score = getAbilityScore(cfgA, stA, abk);
    if (cur === 2) delete ab[abk];
    else if (cur === 1) { if (total === 1 && score + 2 <= 20) ab[abk] = 2; else delete ab[abk]; }
    else if (total < 2 && score + 1 <= 20) ab[abk] = 1;
    wgxRenderLUStep(); return;
  }
  if (act === 'pick-single') {
    var sKey = t.getAttribute('data-key');
    var val = t.getAttribute('data-val');
    if (sKey === 'asi.__pick' || sKey === 'versatile.__pick' || sKey === 'lessons.__pick') {
      var owner = sKey.split('.')[0];
      // A different feat invalidates the sub-picks of the old one.
      wgxLU.picked[owner] = (val === '__asi__') ? { type: 'asi', abilities: {} } : { type: 'feat', feat: val };
      var fe = val === '__asi__' ? null : findFeat(val);
      if (fe && Array.isArray(fe.ability) && fe.ability.length === 1) wgxLU.picked[owner].ability = fe.ability[0];
      wgxRegenLUSteps();
      wgxRenderLUStep(); return;
    }
    wgxPSet(sKey, val);
    if (sKey === 'fightingStyle') {
      // Style change invalidates bonus-cantrip picks from another class list
      // and can add/remove the follow-up step → regenerate the step chain.
      delete wgxLU.picked.styleCantrips;
      wgxRegenLUSteps();
    }
    if (sKey === 'subclass' || sKey === 'order') {
      // Subclass/order can change counted choices (maneuvers) and cantrip max.
      delete wgxLU.picked.maneuvers;
      wgxRegenLUSteps();
    }
    wgxRenderLUStep(); return;
  }
  if (act === 'pick-multi') {
    var mKey = t.getAttribute('data-key');
    var name = t.getAttribute('data-val');
    var arr = wgxPGet(mKey);
    if (!Array.isArray(arr)) { arr = []; wgxPSet(mKey, arr); }
    var idx = arr.indexOf(name);
    var step = wgxLU.steps[wgxLU.stepIdx];
    var cap = (step && step.needed) || 1;
    if (idx !== -1) arr.splice(idx, 1);
    else if (arr.length < cap) arr.push(name);
    wgxRenderLUStep(); return;
  }
  if (act === 'confirm') { wgxConfirmLevelUp(); return; }
}

// Swap dropdowns (optional swaps step).
function wgxLUChange(e) {
  if (!wgxLU) return;
  var t = e.target;
  var id = t && t.getAttribute && t.getAttribute('data-wgx-swap');
  if (!id) return;
  var sw = wgxLU.picked.swaps || (wgxLU.picked.swaps = {});
  var cur = sw[id] || (sw[id] = {});
  cur[t.getAttribute('data-part')] = t.value || null;
  if (!cur.out) delete sw[id];
  wgxRenderLUStep();
}

async function wgxConfirmLevelUp() {
  if (!wgxLU) return;
  var lu = wgxLU, cfg = lu.raw.config || {}, st = lu.raw.state || {};
  try {
    var patches = wgxBuildLevelUpPatch(cfg, st, lu.delta, lu.picked);
    if (!lu.fixOnly) {
      // Keep the raw picks with the level record, so a later Level Down can remember them.
      patches.statePatch['levelChoices/' + lu.delta.to + '/_picked'] = JSON.stringify(lu.picked);
      patches.statePatch['demotedChoices/' + lu.delta.to] = null;
    }
    if (patches.configPatch) await wgxPatchConfig(lu.charId, patches.configPatch);
    await wgxPatchState(lu.charId, patches.statePatch);
    wgxCloseLevelUpModal();
    showToast(lu.fixOnly ? '✓ Choices saved' : '⬆ Level ' + lu.delta.to + ' reached!');
  } catch (err) {
    showToast('Level up failed · ' + err.message, 'error');
  }
}

// ============================================================
// Level down
// ============================================================
async function wgxLevelDown(charId) {
  var raw = WG_CHAR_CACHE[charId] || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var lvl = (st && st.level) || 1;
  if (lvl <= 1) { showToast('Already at level 1', 'error'); return; }
  var patches = wgxBuildLevelDownPatch(cfg, st);
  var msg = 'This removes everything gained at level ' + lvl +
    (patches.lost.length ? ' (including ' + patches.lost.join(' and ') + ')' : '') + '.';
  var ok = (typeof wgxConfirmModal === 'function')
    ? await wgxConfirmModal({ title: 'Level down to ' + (lvl - 1) + '?', message: msg, confirmLabel: 'Level Down', cancelLabel: 'Cancel' })
    : false;
  if (!ok) return;
  // Remember this level's picks so levelling up again starts from them.
  var prevPicked = (numMap(st.levelChoices)[lvl] || {})._picked;
  if (prevPicked) patches.statePatch['demotedChoices/' + lvl] = prevPicked;
  try {
    if (patches.configPatch) await wgxPatchConfig(charId, patches.configPatch);
    await wgxPatchState(charId, patches.statePatch);
    showToast('⬇ Back to level ' + patches.newLevel);
  } catch (err) {
    showToast('Level down failed · ' + err.message, 'error');
  }
}

// ===== Click-handler =====
WG_INFOBOX_CLICK_HANDLERS.levelup = async function (ctx) {
  var raw = ctx.raw || {};
  var lvl = ((raw.state || {}).level) || 1;
  if (ctx.rowIdx === 0) { if (typeof wgxOpenBuildModal === 'function') wgxOpenBuildModal(ctx.charId); return; }
  if (ctx.rowIdx === 1) { wgxOpenLevelUpModal(ctx.charId); return; }
  if (ctx.rowIdx === 2) {
    if (lvl <= 1) return;
    await wgxLevelDown(ctx.charId);
  }
};

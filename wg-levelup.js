// wg-levelup.js — Level Up / Level Down widget + BG3-style level-up menu.
// Leveling Up subproject (Metadocs/LevelingUp/Design.md).
//
// Widget: two action tiles. "Level Up" glows when character level < party level
// (dw_party_level). Click → step-based modal: overview of everything gained
// (class + subclass + species combined, badged by source), one step per choice
// (subclass, metamagic, invocations, wild shape forms, fighting style,
// expertise/scholar, new spells & cantrips), then confirm → PATCH state/config
// via the standard wg pipeline. "Level Down" asks for confirmation, then
// removes the top level and the choices recorded for it (state.levelChoices[N]).
//
// Choice bookkeeping: every pick is stored under state.levelChoices[N] so Level
// Down can roll it back precisely. Choices with `total` semantics (invocations,
// wild shape forms) ask for (total − already known), which self-heals characters
// whose creation-time picks were never recorded.
//
// Load order: NA wg-data.js (WG_SKILLS) en NA wg-rest.js (reuses wgxPatchState).
// Runtime globals: WG_CHAR_CACHE, state, DATA, engine fns (getLevelUpDelta,
// getMaxHP, getProfBonus), FIREBASE_DB, fetchCharacterData, showToast.

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
  // Row 0: current level, plain display cell (not clickable).
  rows.push(['Level ' + lvl]);
  rowCls.push('wgx-lu-levelrow');
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

// ===== Firebase config-PATCH (state-PATCH komt uit wg-rest.js: wgxPatchState) =====
async function wgxPatchConfig(charId, patch) {
  var url = FIREBASE_DB + '/dw/characters/' + encodeURIComponent(charId) + '/config.json';
  var res = await fetch(url, { method: 'PATCH', body: JSON.stringify(patch), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' on config');
}

// ============================================================
// Pure helpers (also exercised by the node smoke test)
// ============================================================

function wgxScholarSkillKeys() {
  return ['arcana', 'history', 'investigation', 'medicine', 'nature', 'religion'];
}

// Skills eligible for a new Expertise pick: proficient, not already expert,
// optionally restricted to a fixed list (Wizard Scholar).
function wgxEligibleExpertise(cfg, restrictTo) {
  var prof = cfg.defaultSkills || [], xp = cfg.expertSkills || [];
  var skills = (typeof WG_SKILLS !== 'undefined') ? WG_SKILLS : [];
  return skills.filter(function (s) {
    if (prof.indexOf(s.key) === -1) return false;
    if (xp.indexOf(s.key) !== -1) return false;
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

// Highest spell level pickable after this level-up (warlock = pact magic).
function wgxMaxSpellLevel(className, delta) {
  if (className === 'warlock') return delta.to >= 3 ? 2 : 1;
  var s = delta.slots['new'] || [];
  var m = 0;
  for (var i = 0; i < s.length; i++) if (s[i] > 0) m = i + 1;
  return m;
}

// How many picks a choice step needs for this character right now.
// `total` semantics subtract what is already known; `count` is absolute.
function wgxChoiceNeeded(choice, cfg, st) {
  var id = choice.id;
  if (id === 'subclass') return cfg.subclass ? 0 : 1;
  if (id === 'fightingStyle') return (st.fightingStyles || []).length ? 0 : 1;
  if (id === 'expertise') {
    var el = wgxEligibleExpertise(cfg, null);
    return Math.min(choice.count || 1, el.length);
  }
  if (id === 'scholar') {
    return wgxEligibleExpertise(cfg, wgxScholarSkillKeys()).length ? 1 : 0;
  }
  if (choice.total != null) {
    var knownKey = { invocations: 'invocations', wildShapeForms: 'wildShapeForms', metamagic: 'metamagic' }[id];
    var have = (knownKey && st[knownKey] || []).length;
    return Math.max(0, choice.total - have);
  }
  return choice.count || 1;
}

// Build the wizard steps from the delta + current picks. Re-run after a
// fighting-style pick: Blessed/Druidic Warrior appends a bonus-cantrip step.
function wgxLevelUpSteps(delta, cfg, st, picked) {
  var steps = [{ kind: 'overview' }];
  for (var i = 0; i < delta.choices.length; i++) {
    var c = delta.choices[i];
    var needed = wgxChoiceNeeded(c, cfg, st);
    // Skip what is already settled (subclass pre-set at creation, known style,
    // invocations/forms already at total) — but keep zero-eligible expertise/
    // scholar steps visible so the player sees why nothing is asked.
    if (needed === 0 && c.id !== 'scholar' && c.id !== 'expertise') continue;
    steps.push({ kind: 'choice', choice: c, needed: needed });
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
  // New cantrips / prepared spells (2024 fixed tables). (total − known) instead
  // of (new − old): heals characters whose creation picks were never recorded.
  var cNeed = Math.max(0, (delta.cantrips['new'] || 0) - (st.cantrips || []).length);
  var list0 = (DATA.spells[cfg.className] || {})[0] || [];
  cNeed = Math.min(cNeed, Math.max(0, list0.length - (st.cantrips || []).length));
  if (cNeed > 0) steps.push({ kind: 'choice', choice: { id: 'cantrips', count: cNeed }, needed: cNeed });
  var pNeed = Math.max(0, (delta.prepared['new'] || 0) - (st.prepared || []).length);
  if (pNeed > 0) steps.push({ kind: 'choice', choice: { id: 'spells', count: pNeed }, needed: pNeed });
  steps.push({ kind: 'confirm' });
  return steps;
}

// Everything to write on confirm, derived purely from (cfg, st, delta, picked).
// Returns { statePatch, configPatch } — configPatch is null when nothing
// config-side changes. config.hp is patched shallowly (pre-existing semantics).
function wgxBuildLevelUpPatch(cfg, st, delta, picked) {
  var rec = {};
  var statePatch = { level: delta.to };
  var configPatch = null;
  var addCfg = function (k, v) { configPatch = configPatch || {}; configPatch[k] = v; };

  if (picked.subclass) { rec.subclass = picked.subclass; addCfg('subclass', picked.subclass); }
  if (picked.metamagic && picked.metamagic.length) {
    rec.metamagic = picked.metamagic;
    statePatch.metamagic = (st.metamagic || []).concat(picked.metamagic);
  }
  if (picked.invocations && picked.invocations.length) {
    rec.invocations = picked.invocations;
    statePatch.invocations = (st.invocations || []).concat(picked.invocations);
  }
  if (picked.wildShapeForms && picked.wildShapeForms.length) {
    rec.wildShapeForms = picked.wildShapeForms;
    statePatch.wildShapeForms = (st.wildShapeForms || []).concat(picked.wildShapeForms);
  }
  if (picked.fightingStyle) {
    rec.fightingStyle = picked.fightingStyle;
    statePatch.fightingStyles = (st.fightingStyles || []).concat([picked.fightingStyle]);
  }
  var newExpert = [];
  if (picked.expertise && picked.expertise.length) { rec.expertise = picked.expertise; newExpert = newExpert.concat(picked.expertise); }
  if (picked.scholar) { rec.scholar = picked.scholar; newExpert.push(picked.scholar); }
  if (newExpert.length) addCfg('expertSkills', (cfg.expertSkills || []).concat(newExpert));
  if (picked.spells && picked.spells.length) {
    rec.spellsAdded = picked.spells;
    statePatch.prepared = (st.prepared || []).concat(picked.spells);
  }
  var newCantrips = [];
  if (picked.cantrips && picked.cantrips.length) { rec.cantripsAdded = picked.cantrips; newCantrips = newCantrips.concat(picked.cantrips); }
  if (picked.styleCantrips && picked.styleCantrips.length) { rec.styleCantrips = picked.styleCantrips; newCantrips = newCantrips.concat(picked.styleCantrips); }
  if (newCantrips.length) statePatch.cantrips = (st.cantrips || []).concat(newCantrips);

  statePatch['levelChoices/' + delta.to] = rec;
  // HP: raise current by the gain (max is derived; manual override bumps too).
  var curHp = (st.hp && typeof st.hp.current === 'number') ? st.hp.current : delta.newMaxHp - delta.hpGain;
  statePatch['hp/current'] = Math.min(curHp + delta.hpGain, delta.newMaxHp);
  if (cfg.hp && typeof cfg.hp.max === 'number' && cfg.hp.max > 0) {
    addCfg('hp', { max: cfg.hp.max + delta.hpGain });
  }
  return { statePatch: statePatch, configPatch: configPatch };
}

// Everything to write on level-down. Rolls back exactly what levelChoices[lvl]
// recorded. Returns { statePatch, configPatch, lost } — `lost` feeds the
// confirmation dialog.
function wgxBuildLevelDownPatch(cfg, stRaw) {
  var st = Object.assign({ asiChoices: {} }, stRaw || {});
  if (!st.asiChoices) st.asiChoices = {};
  var lvl = st.level || 1;
  var choices = (st.levelChoices || {})[lvl] || {};
  var newLevel = lvl - 1;
  var stNew = Object.assign({}, st, { level: newLevel });
  var newMax = getMaxHP(cfg, stNew);

  var statePatch = { level: newLevel };
  statePatch['levelChoices/' + lvl] = null;
  var configPatch = null;
  var addCfg = function (k, v) { configPatch = configPatch || {}; configPatch[k] = v; };
  var lost = [];
  var notIn = function (arr) { return function (n) { return arr.indexOf(n) === -1; }; };

  if (choices.subclass) { addCfg('subclass', null); lost.push('your subclass choice'); }
  if (choices.metamagic && choices.metamagic.length) {
    statePatch.metamagic = (st.metamagic || []).filter(notIn(choices.metamagic));
    lost.push('Metamagic: ' + choices.metamagic.join(', '));
  }
  if (choices.invocations && choices.invocations.length) {
    statePatch.invocations = (st.invocations || []).filter(notIn(choices.invocations));
    lost.push('Invocations: ' + choices.invocations.join(', '));
  }
  if (choices.wildShapeForms && choices.wildShapeForms.length) {
    statePatch.wildShapeForms = (st.wildShapeForms || []).filter(notIn(choices.wildShapeForms));
    lost.push('Wild Shape forms: ' + choices.wildShapeForms.join(', '));
  }
  if (choices.fightingStyle) {
    statePatch.fightingStyles = (st.fightingStyles || []).filter(function (n) { return n !== choices.fightingStyle; });
    lost.push('Fighting Style: ' + choices.fightingStyle);
  }
  var dropExpert = (choices.expertise || []).slice();
  if (choices.scholar) dropExpert.push(choices.scholar);
  if (dropExpert.length) {
    addCfg('expertSkills', (cfg.expertSkills || []).filter(notIn(dropExpert)));
    lost.push('Expertise: ' + dropExpert.join(', '));
  }
  if (choices.spellsAdded && choices.spellsAdded.length) {
    statePatch.prepared = (st.prepared || []).filter(notIn(choices.spellsAdded));
    lost.push('Spells: ' + choices.spellsAdded.join(', '));
  }
  var dropCantrips = (choices.cantripsAdded || []).concat(choices.styleCantrips || []);
  if (dropCantrips.length) {
    statePatch.cantrips = (st.cantrips || []).filter(notIn(dropCantrips));
    lost.push('Cantrips: ' + dropCantrips.join(', '));
  }

  var curHp = (st.hp && typeof st.hp.current === 'number') ? st.hp.current : newMax;
  statePatch['hp/current'] = Math.min(curHp, newMax);
  // Manual HP-max override: shrink by the per-level average gain.
  if (cfg.hp && typeof cfg.hp.max === 'number' && cfg.hp.max > 0) {
    var hitDie = (DATA[cfg.className] || {}).hitDie || 8;
    var conMod = getMod(getAbilityScore(cfg, st, 'con'));
    addCfg('hp', { max: Math.max(1, cfg.hp.max - (Math.floor(hitDie / 2) + 1 + conMod)) });
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
  wgxLU.steps = wgxLevelUpSteps(wgxLU.delta, cfg, st, wgxLU.picked);
}

function wgxOpenLevelUpModal(charId) {
  var raw = WG_CHAR_CACHE[charId] || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var delta = getLevelUpDelta(cfg, st, (st.level || 1) + 1);
  wgxLU = { charId: charId, raw: raw, delta: delta, steps: [], stepIdx: 0, picked: {} };
  wgxRegenLUSteps();
  var host = document.createElement('div');
  host.className = 'wgx-levelup-modal-active';
  // NB: no stopPropagation on the card — the delegated host listener must
  // receive clicks from inside it. Overlay-click-to-close is handled in
  // wgxLUClick by checking the actual event target.
  host.innerHTML = '<div class="modal-overlay"><div class="modal-card wgx-lu-card"></div></div>';
  document.body.appendChild(host);
  host.addEventListener('click', wgxLUClick);
  wgxRenderLUStep();
}

function wgxCloseLevelUpModal() {
  var el = document.querySelector('.wgx-levelup-modal-active');
  if (el) el.remove();
  wgxLU = null;
}

function wgxLUBadge(source) {
  var map = { class: 'Class', subclass: 'Subclass', species: 'Species' };
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
function wgxLUGrid(items, key, single, picked) {
  var html = '<div class="wgx-lu-subgrid">';
  for (var i = 0; i < items.length; i++) {
    var it = items[i];
    var isSel = single ? picked === it.val : (picked || []).indexOf(it.val) !== -1;
    html += '<div class="wgx-lu-subcard' + (isSel ? ' selected' : '') + (it.known ? ' wgx-lu-known' : '') + '"' +
      (it.known ? '' : ' data-wgx-lu="' + (single ? 'pick-single' : 'pick-multi') + '" data-key="' + key + '" data-val="' + wgxEsc(it.val) + '"') + '>' +
      '<h4>' + wgxEsc(it.title) + (it.sub ? ' <span class="wgx-lu-cost">' + wgxEsc(it.sub) + '</span>' : '') + (it.known ? ' · ' + (it.knownLabel || 'known') : '') + '</h4>' +
      (it.desc ? '<p>' + wgxEsc(it.desc) + '</p>' : '') + '</div>';
  }
  return html + '</div>';
}

function wgxLUCountNote(pickedArr, needed) {
  return '<p class="wgx-lu-note">Selected ' + (pickedArr || []).length + ' / ' + needed + '</p>';
}

function wgxRenderLUStep() {
  var card = document.querySelector('.wgx-lu-card');
  if (!card || !wgxLU) return;
  var d = wgxLU.delta, step = wgxLU.steps[wgxLU.stepIdx], picked = wgxLU.picked;
  var cfg = wgxLU.raw.config || {}, st = wgxLU.raw.state || {};
  var cn = cfg.className;
  var html = '<div class="modal-header"><h2>Level Up — ' + d.from + ' → ' + d.to + '</h2>' +
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
    cantrips: 'Choose Cantrips', styleCantrips: 'Choose Cantrips',
  };
  var stepLabel = step.kind === 'overview' ? 'Overview'
    : step.kind === 'confirm' ? 'Confirm'
    : (labels[step.choice.id] || step.choice.id.charAt(0).toUpperCase() + step.choice.id.slice(1).replace(/([A-Z])/g, ' $1'));
  html += '</div><div class="wgx-lu-steplabel">' + wgxEsc(stepLabel) + '</div>';
  html += '<div class="modal-body wgx-lu-body">';

  if (step.kind === 'overview') {
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
    html += wgxLUGrid((DATA.invocations || []).filter(function (op) { return (op.minLevel || 1) <= d.to; }).map(function (op) {
      var desc = (op.prereq ? 'Requires ' + op.prereq + '. ' : '') + op.desc;
      return { val: op.name, title: op.name, desc: desc, known: invKnown.indexOf(op.name) !== -1 };
    }), 'invocations', false, picked.invocations);
  } else if (step.kind === 'choice' && step.choice.id === 'wildShapeForms') {
    var wsNeed = step.needed;
    var wsKnown = st.wildShapeForms || [];
    html += '<h3>Choose ' + wsNeed + ' Wild Shape form' + (wsNeed > 1 ? 's' : '') + '</h3>' +
      '<p class="wgx-lu-note">Beasts of CR 1/4 or lower without a Fly Speed. You can swap one known form on each Long Rest.</p>' +
      wgxLUCountNote(picked.wildShapeForms, wsNeed);
    html += wgxLUGrid((DATA.wildShapeForms || []).map(function (fm) {
      return { val: fm.name, title: fm.name, sub: 'CR ' + fm.cr, desc: fm.desc, known: wsKnown.indexOf(fm.name) !== -1 };
    }), 'wildShapeForms', false, picked.wildShapeForms);
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
      pool = ((DATA.spells[cn] || {})[0] || []).map(function (nm) { return { nm: nm, lvl: 0 }; });
    } else {
      var maxLvl = wgxMaxSpellLevel(cn, d);
      for (var sl = 1; sl <= maxLvl; sl++) {
        pool = pool.concat(((DATA.spells[cn] || {})[sl] || []).map(function (nm) { return { nm: nm, lvl: sl }; }));
      }
    }
    html += '<h3>Choose ' + spNeed + ' new ' + (isCantrip ? 'cantrip' : 'spell') + (spNeed > 1 ? 's' : '') + '</h3>';
    if (!isCantrip && cn === 'wizard') html += '<p class="wgx-lu-note">Your spellbook also gains 2 spells of your choice — record it with your DM (the app tracks prepared spells only).</p>';
    if (!isCantrip && (cn === 'wizard' || cn === 'druid')) html += '<p class="wgx-lu-note">You can freely change your full prepared list on a Long Rest — this pick is just your starting point.</p>';
    html += wgxLUCountNote(isCantrip ? picked.cantrips : picked.spells, spNeed);
    html += wgxLUGrid(pool.map(function (e) {
      var sp = DATA.spellPool[e.nm] || {};
      return {
        val: e.nm, title: e.nm, sub: (isCantrip ? '' : 'Lvl ' + e.lvl + ' · ') + (sp.time || '') + (sp.range ? ' · ' + sp.range : ''),
        desc: wgxTrunc(sp.desc, 110), known: knownList.indexOf(e.nm) !== -1,
      };
    }), step.choice.id, false, isCantrip ? picked.cantrips : picked.spells);
  } else if (step.kind === 'choice') {
    // Generic fallback for choice types without a dedicated renderer yet:
    // informational, never blocks.
    html += '<h3>Choice: ' + wgxEsc(step.choice.id) + (step.choice.count ? ' (× ' + step.choice.count + ')' : '') + '</h3>' +
      '<p class="wgx-lu-note">This choice type does not have an in-app picker yet. Continue and record your pick with your DM; it can be added to your sheet later.</p>';
  } else if (step.kind === 'confirm') {
    html += '<h3>Summary</h3><p>Level ' + d.from + ' → <b>' + d.to + '</b> · +' + d.hpGain + ' HP</p>';
    var sum = [];
    if (picked.subclass) {
      var sname = ((DATA[cn].subclasses || {})[picked.subclass] || {}).name || picked.subclass;
      sum.push(['Subclass', sname]);
    }
    if (picked.metamagic && picked.metamagic.length) sum.push(['Metamagic', picked.metamagic.join(', ')]);
    if (picked.invocations && picked.invocations.length) sum.push(['Invocations', picked.invocations.join(', ')]);
    if (picked.wildShapeForms && picked.wildShapeForms.length) sum.push(['Wild Shape forms', picked.wildShapeForms.join(', ')]);
    if (picked.fightingStyle) sum.push(['Fighting Style', picked.fightingStyle]);
    var skillLabel = function (k) {
      var skills = (typeof WG_SKILLS !== 'undefined') ? WG_SKILLS : [];
      for (var q = 0; q < skills.length; q++) if (skills[q].key === k) return skills[q].label;
      return k;
    };
    if (picked.expertise && picked.expertise.length) sum.push(['Expertise', picked.expertise.map(skillLabel).join(', ')]);
    if (picked.scholar) sum.push(['Scholar (Expertise)', skillLabel(picked.scholar)]);
    if (picked.cantrips && picked.cantrips.length) sum.push(['New cantrips', picked.cantrips.join(', ')]);
    if (picked.styleCantrips && picked.styleCantrips.length) sum.push([wgxEsc((wgxStyleBonus(cn, picked.fightingStyle) || {}).name || 'Style') + ' cantrips', picked.styleCantrips.join(', ')]);
    if (picked.spells && picked.spells.length) sum.push(['New spells', picked.spells.join(', ')]);
    for (var su = 0; su < sum.length; su++) {
      html += '<p>' + sum[su][0] + ': <b>' + wgxEsc(sum[su][1]) + '</b></p>';
    }
    html += '<p class="wgx-lu-note">You can undo this later with Level Down.</p>';
  }

  html += '</div><div class="wgx-lu-nav">';
  html += '<button class="wgx-lu-btn" data-wgx-lu="' + (wgxLU.stepIdx === 0 ? 'cancel' : 'prev') + '">' + (wgxLU.stepIdx === 0 ? 'Cancel' : 'Back') + '</button>';
  var isLast = wgxLU.stepIdx === wgxLU.steps.length - 1;
  var needsPick = false;
  if (step.kind === 'choice') {
    var id = step.choice.id;
    if (id === 'subclass') needsPick = !picked.subclass;
    else if (id === 'fightingStyle') needsPick = !picked.fightingStyle && step.needed > 0;
    else if (id === 'scholar') needsPick = step.needed > 0 && !picked.scholar;
    else if (id === 'metamagic' || id === 'invocations' || id === 'wildShapeForms' ||
             id === 'spells' || id === 'cantrips' || id === 'styleCantrips' || id === 'expertise') {
      needsPick = (picked[id] || []).length !== step.needed;
    }
  }
  html += '<button class="wgx-lu-btn wgx-lu-primary" data-wgx-lu="' + (isLast ? 'confirm' : 'next') + '"' + (needsPick ? ' disabled' : '') + '>' + (isLast ? 'Level Up!' : 'Next') + '</button>';
  html += '</div>';
  card.innerHTML = html;
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
  if (act === 'pick-single') {
    var sKey = t.getAttribute('data-key');
    wgxLU.picked[sKey] = t.getAttribute('data-val');
    if (sKey === 'fightingStyle') {
      // Style change invalidates bonus-cantrip picks from another class list
      // and can add/remove the follow-up step → regenerate the step chain.
      delete wgxLU.picked.styleCantrips;
      wgxRegenLUSteps();
    }
    wgxRenderLUStep(); return;
  }
  if (act === 'pick-multi') {
    var mKey = t.getAttribute('data-key');
    var name = t.getAttribute('data-val');
    var arr = wgxLU.picked[mKey] = wgxLU.picked[mKey] || [];
    var idx = arr.indexOf(name);
    var step = wgxLU.steps[wgxLU.stepIdx];
    var cap = (step && step.needed) || 1;
    if (idx !== -1) arr.splice(idx, 1);
    else if (arr.length < cap) arr.push(name);
    wgxRenderLUStep(); return;
  }
  if (act === 'confirm') { wgxConfirmLevelUp(); return; }
}

async function wgxConfirmLevelUp() {
  if (!wgxLU) return;
  var lu = wgxLU, cfg = lu.raw.config || {}, st = lu.raw.state || {};
  try {
    var patches = wgxBuildLevelUpPatch(cfg, st, lu.delta, lu.picked);
    if (patches.configPatch) await wgxPatchConfig(lu.charId, patches.configPatch);
    await wgxPatchState(lu.charId, patches.statePatch);
    wgxCloseLevelUpModal();
    showToast('⬆ Level ' + lu.delta.to + ' reached!');
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
  var msg = 'Are you sure? This removes everything gained at level ' + lvl +
    (patches.lost.length ? ' (including ' + patches.lost.join(' and ') + ')' : '') + '.';
  if (!window.confirm(msg)) return;
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
  if (ctx.rowIdx === 0) return; // level display row — not an action
  if (ctx.rowIdx === 1) { wgxOpenLevelUpModal(ctx.charId); return; }
  if (ctx.rowIdx === 2) {
    if (lvl <= 1) return;
    await wgxLevelDown(ctx.charId);
  }
};

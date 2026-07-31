// wg-levelup.js — Level Up / Level Down widget + BG3-style level-up menu.
// Leveling Up subproject (Metadocs/LevelingUp/Design.md).
//
// Widget: two action tiles. "Level Up" glows when character level < party level
// (dw_party_level). Click → step-based modal: overview of everything gained
// (class + subclass + species combined, badged by source), one step per choice
// (subclass at L3, etc.), then confirm → PATCH state/config via the standard
// wg pipeline. "Level Down" asks for confirmation, then removes the top level
// and the choices recorded for it (state.levelChoices[N]).
//
// Load order: NA wg-state.js en NA wg-rest.js (reuses wgxPatchState).
// Runtime globals: WG_CHAR_CACHE, state, DATA, engine fns (getLevelUpDelta,
// getMaxHP, getProfBonus), FIREBASE_DB, fetchCharacterData, showToast.

var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};
var WG_INFOBOX_CLICK_HANDLERS = (typeof WG_INFOBOX_CLICK_HANDLERS !== 'undefined') ? WG_INFOBOX_CLICK_HANDLERS : {};

Object.assign(WG_WIDGET_TYPES, {
  levelUp: {
    label: 'Level Up', kind: 'infobox', source: 'levelup',
    spanUnits: 4, spanUnitsY: 2,
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
// Level-up modal (BG3-style: overview → choices → confirm)
// ============================================================
var wgxLU = null; // { charId, raw, delta, steps, stepIdx, picked }

function wgxLevelUpSteps(delta) {
  var steps = [{ kind: 'overview' }];
  for (var i = 0; i < delta.choices.length; i++) steps.push({ kind: 'choice', choice: delta.choices[i] });
  steps.push({ kind: 'confirm' });
  return steps;
}

function wgxOpenLevelUpModal(charId) {
  var raw = WG_CHAR_CACHE[charId] || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var delta = getLevelUpDelta(cfg, st, (st.level || 1) + 1);
  wgxLU = { charId: charId, raw: raw, delta: delta, steps: wgxLevelUpSteps(delta), stepIdx: 0, picked: {} };
  var host = document.createElement('div');
  host.className = 'wgx-levelup-modal-active';
  host.innerHTML = '<div class="modal-overlay" data-wgx-lu="cancel"><div class="modal-card wgx-lu-card" onclick="event.stopPropagation();"></div></div>';
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

function wgxRenderLUStep() {
  var card = document.querySelector('.wgx-lu-card');
  if (!card || !wgxLU) return;
  var d = wgxLU.delta, step = wgxLU.steps[wgxLU.stepIdx];
  var cfg = wgxLU.raw.config || {}, st = wgxLU.raw.state || {};
  var html = '<div class="modal-header"><h2>Level Up — ' + d.from + ' → ' + d.to + '</h2>' +
    '<button class="modal-close" data-wgx-lu="cancel">&times;</button></div>';
  // Stepper dots
  html += '<div class="wgx-lu-steps">';
  for (var i = 0; i < wgxLU.steps.length; i++) {
    html += '<span class="wgx-lu-dot' + (i === wgxLU.stepIdx ? ' active' : (i < wgxLU.stepIdx ? ' done' : '')) + '"></span>';
  }
  html += '</div><div class="modal-body wgx-lu-body">';

  if (step.kind === 'overview') {
    html += '<h3>What you gain</h3><ul class="wgx-lu-gains">';
    html += '<li><b>Hit Points</b> +' + d.hpGain + ' (new max ' + d.newMaxHp + ')</li>';
    if (d.profBonus.old !== d.profBonus.new) html += '<li><b>Proficiency bonus</b> +' + d.profBonus.old + ' → +' + d.profBonus.new + '</li>';
    if (d.sneakAttack && d.sneakAttack.old !== d.sneakAttack.new) html += '<li><b>Sneak Attack</b> ' + d.sneakAttack.old + ' → ' + d.sneakAttack.new + '</li>';
    if (JSON.stringify(d.slots.old) !== JSON.stringify(d.slots.new)) html += '<li><b>Spell slots</b> ' + (d.slots.old.join('/') || '—') + ' → ' + d.slots.new.join('/') + '</li>';
    if (d.prepared.old !== d.prepared.new && d.prepared.new > 0) html += '<li><b>Prepared spells</b> ' + d.prepared.old + ' → ' + d.prepared.new + '</li>';
    if (d.cantrips.old !== d.cantrips.new) html += '<li><b>Cantrips</b> ' + d.cantrips.old + ' → ' + d.cantrips.new + '</li>';
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
    var classData = DATA[cfg.className] || {};
    var subs = classData.subclasses || {};
    html += '<h3>Choose your subclass</h3><div class="wgx-lu-subgrid">';
    for (var key in subs) {
      if (subs[key].legacy) continue;
      var sel = wgxLU.picked.subclass === key ? ' selected' : '';
      var feats = (subs[key].features && subs[key].features[3]) || [];
      html += '<div class="wgx-lu-subcard' + sel + '" data-wgx-lu="pick-sub" data-sub="' + key + '"><h4>' + wgxEsc(subs[key].name) + '</h4>';
      for (var sf = 0; sf < feats.length; sf++) {
        html += '<p><b>' + wgxEsc(feats[sf].name) + '</b> — ' + wgxEsc(wgxLUFeatureDesc(feats[sf].desc)) + '</p>';
      }
      html += '</div>';
    }
    html += '</div>';
  } else if (step.kind === 'choice' && step.choice.id === 'metamagic') {
    var need = step.choice.count || 1;
    var have = (st.metamagic || []).slice(); // already-known options (higher levels)
    var picked = wgxLU.picked.metamagic || [];
    html += '<h3>Choose ' + need + ' Metamagic option' + (need > 1 ? 's' : '') + '</h3>' +
      '<p class="wgx-lu-note">Selected ' + picked.length + ' / ' + need + '</p><div class="wgx-lu-subgrid">';
    var opts = DATA.metamagic || [];
    for (var m = 0; m < opts.length; m++) {
      var op = opts[m];
      var known = have.indexOf(op.name) !== -1;
      var isSel = picked.indexOf(op.name) !== -1;
      html += '<div class="wgx-lu-subcard' + (isSel ? ' selected' : '') + (known ? ' wgx-lu-known' : '') + '"' +
        (known ? '' : ' data-wgx-lu="pick-meta" data-meta="' + wgxEsc(op.name) + '"') + '>' +
        '<h4>' + wgxEsc(op.name) + ' <span class="wgx-lu-cost">' + wgxEsc(String(op.cost)) + ' SP</span>' + (known ? ' · known' : '') + '</h4>' +
        '<p>' + wgxEsc(wgxLUFeatureDesc(op.desc)) + '</p></div>';
    }
    html += '</div>';
  } else if (step.kind === 'choice') {
    // Generic fallback for choice types without a dedicated renderer yet
    // (invocations, fighting style, …): informational, never blocks.
    html += '<h3>Choice: ' + wgxEsc(step.choice.id) + (step.choice.count ? ' (× ' + step.choice.count + ')' : '') + '</h3>' +
      '<p class="wgx-lu-note">This choice type does not have an in-app picker yet. Continue and record your pick with your DM; it can be added to your sheet later.</p>';
  } else if (step.kind === 'confirm') {
    html += '<h3>Confirm</h3><p>Level ' + d.from + ' → <b>' + d.to + '</b> · +' + d.hpGain + ' HP';
    if (wgxLU.picked.subclass) {
      var sname = (DATA[cfg.className].subclasses[wgxLU.picked.subclass] || {}).name || wgxLU.picked.subclass;
      html += ' · Subclass: <b>' + wgxEsc(sname) + '</b>';
    }
    if (wgxLU.picked.metamagic && wgxLU.picked.metamagic.length) {
      html += ' · Metamagic: <b>' + wgxEsc(wgxLU.picked.metamagic.join(', ')) + '</b>';
    }
    html += '</p><p class="wgx-lu-note">You can undo this later with Level Down.</p>';
  }

  html += '</div><div class="wgx-lu-nav">';
  html += '<button class="wgx-lu-btn" data-wgx-lu="' + (wgxLU.stepIdx === 0 ? 'cancel' : 'prev') + '">' + (wgxLU.stepIdx === 0 ? 'Cancel' : 'Back') + '</button>';
  var isLast = wgxLU.stepIdx === wgxLU.steps.length - 1;
  var needsPick = step.kind === 'choice' && (
    (step.choice.id === 'subclass' && !wgxLU.picked.subclass) ||
    (step.choice.id === 'metamagic' && (wgxLU.picked.metamagic || []).length !== (step.choice.count || 1))
  );
  html += '<button class="wgx-lu-btn wgx-lu-primary" data-wgx-lu="' + (isLast ? 'confirm' : 'next') + '"' + (needsPick ? ' disabled' : '') + '>' + (isLast ? 'Level Up!' : 'Next') + '</button>';
  html += '</div>';
  card.innerHTML = html;
}

function wgxLUClick(e) {
  var t = e.target.closest('[data-wgx-lu]');
  if (!t || !wgxLU) return;
  var act = t.getAttribute('data-wgx-lu');
  if (act === 'cancel') { wgxCloseLevelUpModal(); return; }
  if (act === 'prev') { wgxLU.stepIdx = Math.max(0, wgxLU.stepIdx - 1); wgxRenderLUStep(); return; }
  if (act === 'next') { wgxLU.stepIdx = Math.min(wgxLU.steps.length - 1, wgxLU.stepIdx + 1); wgxRenderLUStep(); return; }
  if (act === 'pick-sub') { wgxLU.picked.subclass = t.getAttribute('data-sub'); wgxRenderLUStep(); return; }
  if (act === 'pick-meta') {
    var name = t.getAttribute('data-meta');
    var arr = wgxLU.picked.metamagic = wgxLU.picked.metamagic || [];
    var idx = arr.indexOf(name);
    var step = wgxLU.steps[wgxLU.stepIdx], cap = (step.choice && step.choice.count) || 1;
    if (idx !== -1) arr.splice(idx, 1);
    else if (arr.length < cap) arr.push(name);
    wgxRenderLUStep(); return;
  }
  if (act === 'confirm') { wgxConfirmLevelUp(); return; }
}

async function wgxConfirmLevelUp() {
  if (!wgxLU) return;
  var lu = wgxLU, d = lu.delta, cfg = lu.raw.config || {}, st = lu.raw.state || {};
  try {
    // Record choices keyed by the new level → level-down knows what to remove.
    var choiceRec = {};
    if (lu.picked.subclass) choiceRec.subclass = lu.picked.subclass;
    if (lu.picked.metamagic && lu.picked.metamagic.length) choiceRec.metamagic = lu.picked.metamagic;
    var patch = { level: d.to };
    patch['levelChoices/' + d.to] = choiceRec;
    if (choiceRec.metamagic) {
      patch.metamagic = (st.metamagic || []).concat(choiceRec.metamagic);
    }
    // HP: raise current by the gain (max is derived; manual override bumps too).
    var curHp = (st.hp && typeof st.hp.current === 'number') ? st.hp.current : d.newMaxHp - d.hpGain;
    patch['hp/current'] = Math.min(curHp + d.hpGain, d.newMaxHp);
    if (lu.picked.subclass) await wgxPatchConfig(lu.charId, { subclass: lu.picked.subclass });
    if (cfg.hp && typeof cfg.hp.max === 'number' && cfg.hp.max > 0) {
      await wgxPatchConfig(lu.charId, { 'hp': { max: cfg.hp.max + d.hpGain } });
    }
    await wgxPatchState(lu.charId, patch);
    wgxCloseLevelUpModal();
    showToast('⬆ Level ' + d.to + ' reached!');
  } catch (err) {
    showToast('Level up failed · ' + err.message, 'error');
  }
}

// ============================================================
// Level down
// ============================================================
async function wgxLevelDown(charId) {
  var raw = WG_CHAR_CACHE[charId] || {};
  var cfg = raw.config || {}, st = Object.assign({ asiChoices: {} }, raw.state || {});
  if (!st.asiChoices) st.asiChoices = {};
  var lvl = st.level || 1;
  if (lvl <= 1) { showToast('Already at level 1', 'error'); return; }
  var choices = (st.levelChoices || {})[lvl] || {};
  var lost = [];
  if (choices.subclass) lost.push('your subclass choice');
  if (choices.metamagic && choices.metamagic.length) lost.push('Metamagic: ' + choices.metamagic.join(', '));
  var msg = 'Are you sure? This removes everything gained at level ' + lvl +
    (lost.length ? ' (including ' + lost.join(' and ') + ')' : '') + '.';
  if (!window.confirm(msg)) return;
  try {
    var newLevel = lvl - 1;
    var stNew = Object.assign({}, st, { level: newLevel });
    var newMax = getMaxHP(cfg, stNew);
    var patch = { level: newLevel };
    patch['levelChoices/' + lvl] = null;
    if (choices.metamagic && choices.metamagic.length) {
      patch.metamagic = (st.metamagic || []).filter(function (n) { return choices.metamagic.indexOf(n) === -1; });
    }
    var curHp = (st.hp && typeof st.hp.current === 'number') ? st.hp.current : newMax;
    patch['hp/current'] = Math.min(curHp, newMax);
    if (choices.subclass) await wgxPatchConfig(charId, { subclass: null });
    // Manual HP-max override: shrink by the per-level average gain.
    if (cfg.hp && typeof cfg.hp.max === 'number' && cfg.hp.max > 0) {
      var hitDie = (DATA[cfg.className] || {}).hitDie || 8;
      var conMod = getMod(getAbilityScore(cfg, st, 'con'));
      await wgxPatchConfig(charId, { 'hp': { max: Math.max(1, cfg.hp.max - (Math.floor(hitDie / 2) + 1 + conMod)) } });
    }
    await wgxPatchState(charId, patch);
    showToast('⬇ Back to level ' + newLevel);
  } catch (err) {
    showToast('Level down failed · ' + err.message, 'error');
  }
}

// ===== Click-handler =====
WG_INFOBOX_CLICK_HANDLERS.levelup = async function (ctx) {
  var raw = ctx.raw || {};
  var lvl = ((raw.state || {}).level) || 1;
  if (ctx.rowIdx === 0) { wgxOpenLevelUpModal(ctx.charId); return; }
  if (ctx.rowIdx === 1) {
    if (lvl <= 1) return;
    await wgxLevelDown(ctx.charId);
  }
};

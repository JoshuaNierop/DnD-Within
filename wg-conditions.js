// wg-conditions.js — Conditions widget: Heroic Inspiration, Exhaustion,
// Concentration and (Abjurer) Arcane Ward HP. Always clickable during play.
//
// state.heroicInspiration (bool) — Resourceful (Human) sets it on a Long Rest.
// state.exhaustion (0-6)         — −2 per level on D20 Tests and −5 ft Speed (engine
//                                  getExhaustion); a Long Rest removes one level.
// state.arcaneWardHp             — 0 after a Long Rest until the ward is created again.
// Concentration reads state.activeEffects (wg-turn.js); taking damage while
// concentrating asks for the CON save (wgxConcentrationCheck, called from wg-hp.js).
//
// Load order: after wg-rest.js (wgxPatchState, registries) and before wg-events.js.

var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};
var WG_INFOBOX_CLICK_HANDLERS = (typeof WG_INFOBOX_CLICK_HANDLERS !== 'undefined') ? WG_INFOBOX_CLICK_HANDLERS : {};

Object.assign(WG_WIDGET_TYPES, {
  conditions: {
    label: 'Conditions', kind: 'infobox', source: 'conditions',
    spanUnits: 5, spanUnitsY: 5,
    cfg: { cellPadding: 4, widgetPadding: 4, infoBoxSpacing: 3, infoBoxPadding: 0 },
  },
});
WG_EDIT_CONFIG.conditions = { mode: 'always', editColumnIdx: 0 };
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.conditions = 'Conditions';

function wgxArcaneWardMax(cfg, st) {
  if (cfg.className !== 'wizard' || cfg.subclass !== 'abjuration' || (st.level || 1) < 3) return 0;
  return 2 * (st.level || 1) + getMod(getAbilityScore(cfg, Object.assign({ asiChoices: {} }, st), 'int'));
}
function wgxConcentrating(st) {
  return (typeof wgxActiveEffects === 'function') ? wgxActiveEffects(st).filter(function (x) { return x.eff.conc; })[0] || null : null;
}

// Row model shared by the builder and the click handler.
function wgxConditionRows(cfg, st) {
  var rows = [];
  var hi = !!st.heroicInspiration;
  rows.push({ kind: 'inspiration', text: (hi ? '✦ Heroic Inspiration' : '✧ No Heroic Inspiration'), cls: hi ? 'wgx-act-on' : '',
    tip: { title: 'Heroic Inspiration', body: (hi ? 'You have Heroic Inspiration. Spend it to reroll any die right after rolling it; you must use the new roll.' : 'You have no Heroic Inspiration. The DM can award it; Humans gain it on every Long Rest (Resourceful).') + '\nClick to ' + (hi ? 'spend it.' : 'gain it.') } });
  var ex = getExhaustion(st);
  rows.push({ kind: 'exhaustion', text: 'Exhaustion ' + ex + ' / 6', cls: ex ? 'wgx-act-warn' : '',
    tip: { title: 'Exhaustion', body: (ex ? '−' + (2 * ex) + ' on every D20 Test (already in your skills, saves and initiative) and −' + (5 * ex) + ' ft Speed.' : 'No Exhaustion.') + '\nAt level 6 you die. A Long Rest removes one level.\nClick to add a level.' } });
  if (ex > 0) rows.push({ kind: 'exhaustion-down', text: '− Remove 1 Exhaustion level', cls: '', tip: { title: 'Exhaustion', body: 'Remove one level (for example after a Long Rest or Greater Restoration).' } });
  var c = wgxConcentrating(st);
  rows.push({ kind: 'concentration', text: c ? '◉ Concentrating: ' + c.eff.spell : '○ Not concentrating', cls: c ? 'wgx-act-on' : '', fx: c,
    tip: c ? { title: 'Concentration — ' + c.eff.spell, body: 'Taking damage asks for a Constitution saving throw (DC 10 or half the damage, max 30). Incapacitated or dead ends it.\nClick to end the spell.' }
           : { title: 'Concentration', body: 'Cast a Concentration spell from the Your Turn or Prepared Spells widget to track it here.' } });
  var wmax = wgxArcaneWardMax(cfg, st);
  if (wmax) {
    var w = Math.min(st.arcaneWardHp || 0, wmax);
    rows.push({ kind: 'ward', text: '🛡 Arcane Ward ' + w + ' / ' + wmax, cls: w ? 'wgx-act-on' : '', max: wmax, cur: w,
      tip: { title: 'Arcane Ward', body: 'Hit Points: 2 × Wizard level + Intelligence modifier. Damage to you hits the ward first. Casting an Abjuration spell with a slot restores 2 × the slot level.\nClick to set the ward\'s Hit Points.' } });
  }
  return rows;
}

function wgxBuildConditions(widget) {
  var raw = WG_CHAR_CACHE[state.characterId] || {};
  var rows = wgxConditionRows(raw.config || {}, raw.state || {});
  var d = widget.data, L = widget.layout;
  d.columns = [{ key: 'cell', label: 'Conditions' }];
  d.rows = rows.map(function (r) { return [r.text]; });
  d.tooltips = rows.map(function (r) { return [r.tip]; });
  L.columnHighlight = [false];
  L.columnAlign = ['left'];
  L.columnAllCaps = [false];
  L.columnMaxChars = [null];
  L.columnExtraClass = [null];
  L.columnMinWidthPx = [null];
  L.columnFontScale = [1];
  L.rowExtraClass = rows.map(function (r) { return r.cls || null; });
  L.stacking = 'horizontal';
}
WG_EXTRA_INFOBOX_BUILDERS.conditions = wgxBuildConditions;

WG_INFOBOX_CLICK_HANDLERS.conditions = async function (ctx) {
  var raw = ctx.raw || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var r = wgxConditionRows(cfg, st)[ctx.rowIdx];
  if (!r) return;
  if (r.kind === 'inspiration') {
    await wgxPatchState(ctx.charId, { heroicInspiration: !st.heroicInspiration });
    showToast(st.heroicInspiration ? 'Heroic Inspiration spent' : 'Heroic Inspiration gained');
  } else if (r.kind === 'exhaustion' || r.kind === 'exhaustion-down') {
    var ex = getExhaustion(st), next = r.kind === 'exhaustion' ? Math.min(6, ex + 1) : Math.max(0, ex - 1);
    if (next === ex) return;
    if (next === 6 && !(await showConfirmModal({ title: 'Exhaustion 6', message: 'At Exhaustion level 6 your character dies. Continue?', confirmLabel: 'Set to 6', danger: true }))) return;
    await wgxPatchState(ctx.charId, { exhaustion: next || null });
    showToast('Exhaustion → ' + next);
  } else if (r.kind === 'concentration') {
    if (!r.fx) return;
    if (!(await showConfirmModal({ title: 'End ' + r.fx.eff.spell + '?', message: 'You stop concentrating and the spell ends.', confirmLabel: 'End spell' }))) return;
    var p = {}; p['activeEffects/' + r.fx.id] = null;
    await wgxPatchState(ctx.charId, p);
    showToast(r.fx.eff.spell + ' ended');
  } else if (r.kind === 'ward') {
    var v = await showPromptModal({ title: 'Arcane Ward', label: 'Hit Points (0–' + r.max + ')', value: String(r.cur), confirmLabel: 'Save',
      validate: function (s) { var n = Number(s); return (Number.isInteger(n) && n >= 0 && n <= r.max) ? null : 'Enter a whole number from 0 to ' + r.max + '.'; } });
    if (v === null) return;
    await wgxPatchState(ctx.charId, { arcaneWardHp: Number(v) || null });
  }
};

// Called after damage lands on a character (wg-hp.js). Asks for the CON save
// when the character concentrates; ends the spell on a failure or at 0 HP.
async function wgxConcentrationCheck(charId, damage, next) {
  if (!(damage > 0)) return;
  var raw = WG_CHAR_CACHE[charId] || {};
  var st = raw.state || {};
  var c = wgxConcentrating(st);
  if (!c) return;
  var end = async function (why) {
    var p = {}; p['activeEffects/' + c.id] = null;
    await wgxPatchState(charId, p);
    showToast(c.eff.spell + ' ended — ' + why);
  };
  if (next && (next.current === 0 || next.dead)) { await end('you dropped to 0 Hit Points'); return; }
  var dc = Math.min(30, Math.max(10, Math.floor(damage / 2)));
  var sb = getSaveBonus(raw.config || {}, st, 'con');
  var adv = sb.notes.filter(function (n) { return /Concentration/.test(n); }).map(function (n) { return n.split(':')[0]; });
  var kept = await showConfirmModal({
    title: 'Concentration check — ' + c.eff.spell,
    message: 'Make a Constitution saving throw: DC ' + dc + ', your bonus ' + (sb.total >= 0 ? '+' : '') + sb.total + (adv.length ? ' with Advantage (' + adv.join(', ') + ')' : '') + '. Did you succeed?',
    confirmLabel: 'Succeeded', cancelLabel: 'Failed — spell ends',
  });
  if (!kept) await end('Concentration lost');
}

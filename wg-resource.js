// wg-resource.js — generic class/species resource tracker widget.
// Leveling Up subproject. Shows every entry from DATA.classResources that
// applies to the current character (Soulknife → Psionic Energy Dice, Sorcerer →
// Sorcery Points, Aasimar → Healing Hands, …). The widget renders nothing for
// characters without applicable resources, so subclass-only resources are
// automatically invisible for everyone else.
//
// Interaction: click a row = spend 1 use; when everything is spent, the next
// click restores all (tooltip explains). Usage is tracked in state[stateKey].
//
// Load order: NA wg-state.js en NA wg-rest.js (reuses wgxPatchState).

var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};
var WG_INFOBOX_CLICK_HANDLERS = (typeof WG_INFOBOX_CLICK_HANDLERS !== 'undefined') ? WG_INFOBOX_CLICK_HANDLERS : {};

Object.assign(WG_WIDGET_TYPES, {
  classResource: {
    label: 'Resources', kind: 'infobox', source: 'resource',
    spanUnits: 4, spanUnitsY: 3,
    cfg: { cellPadding: 6, widgetPadding: 6, infoBoxSpacing: 4, infoBoxPadding: 2 },
  },
});
WG_EDIT_CONFIG.resource = { mode: 'always', editColumnIdx: 1 };
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.resource = 'Resources';

function wgxResourcePips(used, max) {
  var s = '';
  for (var i = 0; i < max; i++) s += (i < max - used) ? '●' : '○';
  return s;
}

function wgxBuildResources(widget) {
  var raw = WG_CHAR_CACHE[state.characterId] || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var d = widget.data, L = widget.layout;
  var list = (typeof getClassResources === 'function') ? getClassResources(cfg, st) : [];
  d.columns = [{ key: 'name', label: 'Resource' }, { key: 'pips', label: '' }];
  var rows = [], tips = [];
  if (!list.length) {
    rows.push(['No class resources', '']);
    tips.push(null);
  } else {
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      var max = r.max(cfg, st);
      var used = Math.min(st[r.stateKey] || 0, max);
      var die = r.die ? (' ' + r.die(st)) : '';
      rows.push([r.label + die, wgxResourcePips(used, max)]);
      var rechargeTxt = r.recharge === 'long' ? 'Recharges on a Long Rest.' : 'Regain one on a Short Rest, all on a Long Rest.';
      var extra = (typeof r.extraDesc === 'function') ? r.extraDesc(cfg, st) : '';
      var tip = { title: r.label + ' · ' + (max - used) + '/' + max + die, body: r.desc + (extra ? '\n\n' + extra : '') + '\n\n' + rechargeTxt + '\n\nClick: spend 1. When empty, click restores all.' };
      tips.push([tip, tip]);
    }
  }
  d.rows = rows; d.tooltips = tips;
  L.columnHighlight = [false, false];
  L.columnAlign = ['left', 'right'];
  L.columnMaxChars = [18, null];
  L.columnAllCaps = [false, false];
  L.columnExtraClass = [null, null];
  L.columnMinWidthPx = [null, 40];
  L.columnFontScale = [1, 1];
  L.stacking = 'horizontal';
}
WG_EXTRA_INFOBOX_BUILDERS.resource = wgxBuildResources;

WG_INFOBOX_CLICK_HANDLERS.resource = async function (ctx) {
  var raw = ctx.raw || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var list = (typeof getClassResources === 'function') ? getClassResources(cfg, st) : [];
  var r = list[ctx.rowIdx];
  if (!r) return;
  var max = r.max(cfg, st);
  var used = Math.min(st[r.stateKey] || 0, max);
  var next = (used >= max) ? 0 : used + 1;   // all spent → click restores all
  try {
    var patch = {}; patch[r.stateKey] = next;
    await wgxPatchState(ctx.charId, patch);
    showToast(r.label + ': ' + (max - next) + '/' + max + (next === 0 ? ' (restored)' : ''));
  } catch (err) {
    showToast('Update failed · ' + err.message, 'error');
  }
};

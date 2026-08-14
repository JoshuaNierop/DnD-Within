// wg-features.js — Features widget: every class + subclass + species feature
// the character has at its current level, split into an ACTIVE section
// (features backed by a use-counter from DATA.classResources — click the uses
// cell to spend one; click when empty to restore all, same semantics as the
// Resources widget) and a PASSIVE section (rules text only). Full rules text
// in the shared hover/long-press tooltip, plus uses/recharge info for active
// features. Leveling Up subproject.
//
// Load order: NA wg-state.js, NA wg-rest.js (wgxPatchState) en NA
// wg-resource.js (wgxResourcePips).

var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};
var WG_INFOBOX_CLICK_HANDLERS = (typeof WG_INFOBOX_CLICK_HANDLERS !== 'undefined') ? WG_INFOBOX_CLICK_HANDLERS : {};

Object.assign(WG_WIDGET_TYPES, {
  featureList: {
    label: 'Features', kind: 'infobox', source: 'features',
    spanUnits: 5, spanUnitsY: 5,
    cfg: { cellPadding: 6, widgetPadding: 6, infoBoxSpacing: 4, infoBoxPadding: 2 },
  },
});
WG_EDIT_CONFIG.features = { mode: 'always', editColumnIdx: 2 }; // uses-kolom klikbaar
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.features = 'Features';

function wgxFeatureText(desc) {
  if (desc && typeof desc === 'object') return desc.en || desc.nl || '';
  return String(desc || '');
}

// All features up to the current level: [{src:'C'|'S'|'R'|'M'|'I'|'F', name, desc, level}]
function wgxCollectFeatures(cfg, st) {
  var lvl = st.level || 1;
  var out = [];
  var classData = DATA[cfg.className] || {};
  var feats = classData.features || {};
  for (var l = 1; l <= lvl; l++) {
    var fl = feats[l] || [];
    for (var i = 0; i < fl.length; i++) out.push({ src: 'C', name: fl[i].name, desc: fl[i].desc, level: l });
    var sub = cfg.subclass && classData.subclasses && classData.subclasses[cfg.subclass];
    var sfl = (sub && sub.features && sub.features[l]) || [];
    for (var s = 0; s < sfl.length; s++) out.push({ src: 'S', name: sfl[s].name, desc: sfl[s].desc, level: l });
    var spl = ((DATA.speciesProgression || {})[cfg.race] || {})[l] || [];
    for (var p = 0; p < spl.length; p++) out.push({ src: 'R', name: spl[p].name, desc: spl[p].desc, level: l });
  }
  // Species base features (level 1, flat array on the race entry). Skip names
  // already added by speciesProgression — e.g. Aasimar list "Celestial
  // Revelation" as a base feature ("from level 3: …") AND as the real L3
  // progression entry; from L3 on only the progression version should show.
  var race = DATA[cfg.race] || {};
  var rfl = race.features || [];
  var seen = {};
  for (var o = 0; o < out.length; o++) seen[out[o].name.toLowerCase()] = true;
  for (var r = 0; r < rfl.length; r++) {
    if (seen[rfl[r].name.toLowerCase()]) continue;
    out.push({ src: 'R', name: rfl[r].name, desc: rfl[r].desc, level: 1 });
  }
  // Picked options stored in state (level-up menu): the level a pick was made
  // at is recoverable from levelChoices[N].<recKey>.
  var pickLevel = function (recKey, name, fallback) {
    var lc = st.levelChoices || {};
    for (var k in lc) {
      var v = (lc[k] || {})[recKey];
      if (Array.isArray(v) ? v.indexOf(name) !== -1 : v === name) return parseInt(k, 10);
    }
    return fallback;
  };
  // Known Metamagic options
  var mm = st.metamagic || [];
  for (var m = 0; m < mm.length; m++) {
    var op = (DATA.metamagic || []).filter(function (o) { return o.name === mm[m]; })[0];
    if (op) out.push({ src: 'M', name: op.name + ' (' + op.cost + ' SP)', desc: op.desc, level: pickLevel('metamagic', op.name, 2) });
  }
  // Known Eldritch Invocations
  var inv = st.invocations || [];
  for (var iv = 0; iv < inv.length; iv++) {
    var io = (DATA.invocations || []).filter(function (o) { return o.name === inv[iv]; })[0];
    out.push({ src: 'I', name: inv[iv], desc: io ? io.desc : '', level: pickLevel('invocations', inv[iv], 1) });
  }
  // Fighting Styles (feat list + class options like Blessed/Druidic Warrior)
  var fs = st.fightingStyles || [];
  var fsDesc = function (name) {
    var ft = (DATA.feats || []).filter(function (o) { return o.category === 'fighting' && o.name === name; })[0];
    if (ft) return ft.desc;
    var extras = (DATA.classFightingBonus || {})[cfg.className] || [];
    var ex = extras.filter(function (o) { return o.name === name; })[0];
    return ex ? ex.desc : '';
  };
  for (var fi = 0; fi < fs.length; fi++) {
    out.push({ src: 'F', name: fs[fi], desc: fsDesc(fs[fi]), level: pickLevel('fightingStyle', fs[fi], 2) });
  }
  return out;
}

// Feature-name (lowercased) → applicable classResource entry.
function wgxFeatureResourceMap(cfg, st) {
  var map = {};
  var list = (typeof getClassResources === 'function') ? getClassResources(cfg, st) : [];
  for (var i = 0; i < list.length; i++) {
    var names = list[i].featureNames || [];
    for (var n = 0; n < names.length; n++) map[names[n].toLowerCase()] = list[i];
  }
  return map;
}

// Row model shared by builder and click-handler (1:1 with rendered rows).
// Entries: { header: 'Active'|'Passive' } or { feat, res|null }.
function wgxFeatureRowModel(cfg, st) {
  var feats = wgxCollectFeatures(cfg, st);
  feats.sort(function (a, b) { return (a.level - b.level) || a.name.localeCompare(b.name); });
  var resMap = wgxFeatureResourceMap(cfg, st);
  var active = [], passive = [];
  for (var i = 0; i < feats.length; i++) {
    var res = resMap[feats[i].name.toLowerCase()] || null;
    (res ? active : passive).push({ feat: feats[i], res: res });
  }
  if (!active.length) return passive; // flat list, no section headers needed
  var rows = [{ header: 'Active' }].concat(active);
  if (passive.length) rows = rows.concat([{ header: 'Passive' }], passive);
  return rows;
}

function wgxFeatureUsesCell(res, cfg, st) {
  var max = res.max(cfg, st);
  var used = Math.min(st[res.stateKey] || 0, max);
  if (max <= 6 && typeof wgxResourcePips === 'function') return wgxResourcePips(used, max);
  return (max - used) + '/' + max;
}

function wgxBuildFeatures(widget) {
  var raw = WG_CHAR_CACHE[state.characterId] || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var d = widget.data, L = widget.layout;
  d.columns = [
    { key: 'lvl', label: 'Lvl' }, { key: 'name', label: 'Feature' },
    { key: 'uses', label: '' }, { key: 'src', label: '' },
  ];
  var model = wgxFeatureRowModel(cfg, st);
  var rows = [], tips = [], rowCls = [];
  if (!model.length) {
    rows.push(['', 'No features', '', '']);
    tips.push(null); rowCls.push(null);
  } else {
    var srcLabel = { C: 'Class', S: 'Subclass', R: 'Species', M: 'Metamagic', I: 'Invocation', F: 'Fighting Style' };
    for (var i = 0; i < model.length; i++) {
      var row = model[i];
      if (row.header) {
        rows.push(['', row.header.toUpperCase(), '', '']);
        tips.push(null);
        rowCls.push('wgx-feat-header');
        continue;
      }
      var f = row.feat, res = row.res;
      var usesCell = res ? wgxFeatureUsesCell(res, cfg, st) : '';
      rows.push([String(f.level), f.name, usesCell, f.src]);
      var body = wgxFeatureText(f.desc);
      if (res) {
        var max = res.max(cfg, st);
        var used = Math.min(st[res.stateKey] || 0, max);
        var unit = res.unit === 'points' ? 'points' : 'uses';
        var die = res.die ? (' (' + res.die(st) + ')') : '';
        var rechargeTxt = res.recharge === 'long' ? 'All return on a Long Rest.' : 'Regain one on a Short Rest, all on a Long Rest.';
        var extra = (typeof res.extraDesc === 'function') ? res.extraDesc(cfg, st) : '';
        body += (extra ? '\n\n' + extra : '') +
          '\n\n' + (max - used) + '/' + max + ' ' + unit + die + ' left. ' + rechargeTxt +
          '\n\nClick the counter to spend 1' + (res.unit === 'points' ? ' point' : ' use') + '; click when empty to restore all.';
      }
      var tip = { title: f.name + ' · ' + srcLabel[f.src] + ' (level ' + f.level + ')', body: body };
      tips.push([tip, tip, tip, tip]);
      rowCls.push(res ? 'wgx-feat-active' : 'wgx-feat-passive');
    }
  }
  d.rows = rows; d.tooltips = tips;
  L.columnHighlight = [false, false, true, false];
  L.columnAlign = ['center', 'left', 'right', 'right'];
  L.columnMaxChars = [null, 18, null, null];
  L.columnAllCaps = [false, false, false, false];
  L.columnExtraClass = ['is-prof-col', null, null, null];
  L.columnMinWidthPx = [20, null, 34, 16];
  L.columnFontScale = [1.15, 1, 0.95, 0.9];
  L.rowExtraClass = rowCls;
  L.stacking = 'horizontal';
}
WG_EXTRA_INFOBOX_BUILDERS.features = wgxBuildFeatures;

// Klik op de uses-cel van een active feature = 1 use verbruiken; bij leeg =
// alles herstellen (zelfde semantiek als de Resources-widget).
WG_INFOBOX_CLICK_HANDLERS.features = async function (ctx) {
  var raw = ctx.raw || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var model = wgxFeatureRowModel(cfg, st);
  var row = model[ctx.rowIdx];
  if (!row || row.header || !row.res) return;
  var r = row.res;
  var max = r.max(cfg, st);
  var used = Math.min(st[r.stateKey] || 0, max);
  var next = (used >= max) ? 0 : used + 1;
  try {
    var patch = {}; patch[r.stateKey] = next;
    await wgxPatchState(ctx.charId, patch);
    showToast(r.label + ': ' + (max - next) + '/' + max + (next === 0 ? ' (restored)' : ''));
  } catch (err) {
    showToast('Update failed · ' + err.message, 'error');
  }
};

// wg-features.js — generic Features widget: every class + subclass + species
// feature the character has at its current level, one row each, with the full
// rules text in the shared hover/long-press tooltip. Leveling Up subproject.
//
// Generally applicable to any character; also the "explain spells/feats/
// features somewhere" surface for things gained via the level-up menu.
//
// Load order: NA wg-state.js. Display-only.

var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};

Object.assign(WG_WIDGET_TYPES, {
  featureList: {
    label: 'Features', kind: 'infobox', source: 'features',
    spanUnits: 5, spanUnitsY: 5,
    cfg: { cellPadding: 6, widgetPadding: 6, infoBoxSpacing: 4, infoBoxPadding: 2 },
  },
});
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.features = 'Features';

function wgxFeatureText(desc) {
  if (desc && typeof desc === 'object') return desc.en || desc.nl || '';
  return String(desc || '');
}

// All features up to the current level: [{src:'C'|'S'|'R', name, desc, level}]
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
  // Species base features (level 1, flat array on the race entry)
  var race = DATA[cfg.race] || {};
  var rfl = race.features || [];
  for (var r = 0; r < rfl.length; r++) out.push({ src: 'R', name: rfl[r].name, desc: rfl[r].desc, level: 1 });
  return out;
}

function wgxBuildFeatures(widget) {
  var raw = WG_CHAR_CACHE[state.characterId] || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var d = widget.data, L = widget.layout;
  d.columns = [{ key: 'lvl', label: 'Lvl' }, { key: 'name', label: 'Feature' }, { key: 'src', label: '' }];
  var feats = wgxCollectFeatures(cfg, st);
  feats.sort(function (a, b) { return (a.level - b.level) || a.name.localeCompare(b.name); });
  var rows = [], tips = [];
  if (!feats.length) {
    rows.push(['', 'No features', '']);
    tips.push(null);
  } else {
    var srcLabel = { C: 'Class', S: 'Subclass', R: 'Species' };
    for (var i = 0; i < feats.length; i++) {
      var f = feats[i];
      rows.push([String(f.level), f.name, f.src]);
      var tip = { title: f.name + ' · ' + srcLabel[f.src] + ' (level ' + f.level + ')', body: wgxFeatureText(f.desc) };
      tips.push([tip, tip, tip]);
    }
  }
  d.rows = rows; d.tooltips = tips;
  L.columnHighlight = [false, false, false];
  L.columnAlign = ['center', 'left', 'right'];
  L.columnMaxChars = [null, 20, null];
  L.columnAllCaps = [false, false, false];
  L.columnExtraClass = ['is-prof-col', null, null];
  L.columnMinWidthPx = [20, null, 16];
  L.columnFontScale = [1.15, 1, 0.9];
  L.stacking = 'horizontal';
}
WG_EXTRA_INFOBOX_BUILDERS.features = wgxBuildFeatures;

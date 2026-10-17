// wg-saves.js — Saving Throws widget: one row per ability with the save bonus
// from getSaveBonus (engine.js). Hover shows the breakdown and situational
// Advantage/reroll effects. Read-only: proficiency follows class, feats and features.
//
// Load order: after wg-state.js (WG_WIDGET_TYPES) and wg-rest.js (registries).

var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};

Object.assign(WG_WIDGET_TYPES, {
  savingThrows: {
    label: 'Saving Throws', kind: 'infobox', source: 'saves',
    spanUnits: 4, spanUnitsY: 6,
    cfg: { cellPadding: 0, widgetPadding: 4, infoBoxSpacing: 2, infoBoxPadding: 2 },
  },
});
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.saves = 'Saving Throws';

function wgxBuildSaves(widget) {
  const raw = WG_CHAR_CACHE[state.characterId] || {};
  const cfg = raw.config || {}, st = raw.state || {};
  const d = widget.data, L = widget.layout;
  const fmt = (n) => `${n >= 0 ? '+' : ''}${n}`;
  d.columns = [
    { key: 'prof', label: 'Prof' },
    { key: 'save', label: 'Save' },
    { key: 'bonus', label: 'Bonus' },
  ];
  const tips = [];
  d.rows = ['str', 'dex', 'con', 'int', 'wis', 'cha'].map((ab) => {
    const sb = getSaveBonus(cfg, st, ab);
    const name = (typeof WG_ABILITY_LABELS !== 'undefined' && WG_ABILITY_LABELS[ab]) || ab.toUpperCase();
    const mark = sb.prof ? '●' : '○';
    const body = sb.parts.map((p) => `${fmt(p.value)} ${p.label}`).join('\n') + `\n= ${fmt(sb.total)}`;
    const notes = sb.notes.length ? sb.notes.join('\n') : 'No situational effects.';
    tips.push([
      { title: 'Proficiency', body: sb.prof ? 'Proficient — your proficiency bonus is added.' : 'Not proficient — only the ability modifier (and bonuses) apply.' },
      { title: `${name} saving throw`, body: notes },
      { title: 'Modifier breakdown', body },
    ]);
    return [mark, { main: name, suffix: sb.notes.length ? ' ✦' : '' }, fmt(sb.total)];
  });
  d.tooltips = tips;
  L.columnHighlight = [false, false, true];
  L.columnAlign = ['center', 'left', 'right'];
  L.columnMaxChars = [null, null, null];
  L.columnAllCaps = [false, false, false];
  L.columnExtraClass = ['is-prof-col', null, null];
  L.columnMinWidthPx = [20, null, null];
  L.columnFontScale = [1.25, 1, 1];
  L.stacking = 'horizontal';
}
WG_EXTRA_INFOBOX_BUILDERS.saves = wgxBuildSaves;

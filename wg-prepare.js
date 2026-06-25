// wg-prepare.js — Prepared Spells widget (E5.5/2024).
//
// Toont de voorbereide spells + cantrips van een character als info-box-lijst,
// in dezelfde stijl als de Skills-widget: 3 kolommen [level-badge | naam |
// micro-icons], per-rij hover/long-press-tooltip met spell-details, en
// auto-rescaling (rebuildWidget → recomputeDataLayout → compactSpanUnitsY) zodat
// de widget zich om de inhoud fit.
//
// Info-architectuur door de D&D 5.5e-agent:
//  - Rij: badge (C / 1-9) · naam · [◆ concentration] [action-tag B/R/(R)/⏱].
//  - Hover-tooltip: title "<naam> · <Cantrip|Lvl N>"; body "time · range [·Conc][·Ritual]",
//    "Componenten: …", lege regel, beschrijving, dan "Spell save DC X · Aanval +Y".
//  - Volgorde: cantrips eerst, dan leveled oplopend, alfabetisch binnen level.
//  - Concentration betrouwbaar uit `dur`; ritual best-effort uit `desc` (zwak —
//    zie review-flag); save-vs-attack niet afleidbaar → toon generiek beide
//    character-waarden (DC = 8 + prof + mod, attack = prof + mod).
//
// Display-only (geen WG_EDIT_CONFIG): niet klikbaar, wel hover-tooltips (de
// tooltip-laag leest data-tip-* op de cel-bg, los van editable-cell).
//
// Load order: NA wg-state.js. Gebruikt app-core globals: DATA, getMod,
// getProfBonus, getSpellcastingAbility, en runtime: WG_CHAR_CACHE, state.

// ===== Registries =====
var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};

// ===== Widget-type =====
Object.assign(WG_WIDGET_TYPES, {
  preparedSpells: {
    label: 'Prepared Spells', kind: 'infobox', source: 'prepared',
    spanUnits: 5, spanUnitsY: 6,
    cfg: { cellPadding: 6, widgetPadding: 6, infoBoxSpacing: 4, infoBoxPadding: 2 },
  },
});
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.prepared = 'Prepared Spells';

// ===== Afleidingsregels =====
function wgxSpellIsConcentration(sp) { return /concentration/i.test((sp && sp.dur) || ''); }
function wgxSpellIsRitual(sp) { return /\britual\b/i.test((sp && sp.desc) || ''); }   // best-effort, zie review-flag

// Action-economy / ritual tag voor de micro-icon-kolom (slot 2).
function wgxSpellActionTag(sp) {
  const time = (sp && sp.time) || '';
  if (/bonus/i.test(time)) return 'B';
  if (/reaction/i.test(time)) return 'R';
  if (wgxSpellIsRitual(sp)) return '(R)';
  if (/minute|hour|min\b|uur/i.test(time)) return '⏱';
  return '';
}

// ===== Character spell-DC + attack (generiek, per character) =====
function wgxSpellStats(raw) {
  const cfg = (raw && raw.config) || {};
  const st  = (raw && raw.state)  || {};
  const lvl = (typeof st.level === 'number') ? st.level : 1;
  const ability = (typeof getSpellcastingAbility === 'function')
    ? getSpellcastingAbility(cfg.className, cfg.subclass) : 'cha';
  const score = (cfg.baseAbilities || {})[ability];
  const mod = (typeof score === 'number')
    ? ((typeof getMod === 'function') ? getMod(score) : Math.floor((score - 10) / 2)) : 0;
  const prof = (typeof cfg.proficiencyBonus === 'number') ? cfg.proficiencyBonus
    : ((typeof getProfBonus === 'function') ? getProfBonus(lvl) : 2);
  return { dc: 8 + prof + mod, atk: prof + mod };
}

// ===== Tooltip-body opbouw (D&D 5.5e-agent template) =====
function wgxSpellTooltip(name, sp, stats) {
  const isCantrip = sp && sp.level === 0;
  const lvlLabel = sp ? (isCantrip ? 'Cantrip' : 'Lvl ' + sp.level) : '?';
  const title = name + ' · ' + lvlLabel;
  if (!sp) return { title: title, body: 'Unknown spell — no data available.' };
  // Regel 1: time · range [· Concentration] [· Ritual]
  let line1 = (sp.time || '?') + ' · ' + (sp.range || '?');
  if (wgxSpellIsConcentration(sp)) line1 += ' · Concentration';
  if (wgxSpellIsRitual(sp)) line1 += ' · Ritual';
  const body =
    line1 + '\n' +
    'Components: ' + (sp.comp || '—') + '\n\n' +
    (sp.desc || '—') + '\n\n' +
    'Spell save DC ' + stats.dc + ' · Attack +' + stats.atk;
  return { title: title, body: body };
}

// ===== Infobox-builder =====
function wgxBuildPrepared(widget) {
  const raw = WG_CHAR_CACHE[state.characterId] || {};
  const st  = raw.state || {};
  const d = widget.data, L = widget.layout;
  const spellData = (typeof DATA !== 'undefined' && DATA.spellPool) || {};
  const stats = wgxSpellStats(raw);

  d.columns = [
    { key: 'lvl',   label: 'Lvl' },
    { key: 'name',  label: 'Spell' },
    { key: 'flags', label: '' },
  ];

  // Entries verzamelen: cantrips (level 0) + prepared (leveled), elk opgezocht.
  const names = []
    .concat(Array.isArray(st.cantrips) ? st.cantrips : [])
    .concat(Array.isArray(st.prepared) ? st.prepared : []);
  const seen = new Set();
  const entries = [];
  for (const nm of names) {
    if (!nm || seen.has(nm)) continue;
    seen.add(nm);
    const sp = spellData[nm] || null;
    entries.push({ name: nm, sp: sp, level: sp ? (sp.level || 0) : 99 });
  }
  // Sorteer: level oplopend (cantrips=0 eerst), alfabetisch binnen level.
  entries.sort((a, b) => (a.level - b.level) || a.name.localeCompare(b.name));

  const rows = [], tips = [];
  if (entries.length === 0) {
    rows.push(['', 'No spells prepared', '']);
    tips.push(null);
  } else {
    for (const e of entries) {
      const isCantrip = e.sp && e.sp.level === 0;
      const badge = e.sp ? (isCantrip ? 'C' : String(e.sp.level)) : '?';
      const conc = e.sp && wgxSpellIsConcentration(e.sp) ? '◆' : '';
      const tag = e.sp ? wgxSpellActionTag(e.sp) : '';
      const flags = (conc && tag) ? (conc + ' ' + tag) : (conc || tag);
      rows.push([badge, e.name, flags]);
      const tip = wgxSpellTooltip(e.name, e.sp, stats);
      tips.push([tip, tip, tip]);   // zelfde tip op alle 3 cellen → hover overal op de rij
    }
  }

  d.rows = rows;
  d.tooltips = tips;
  L.columnHighlight  = [false, false, false];
  L.columnAlign      = ['center', 'left', 'right'];
  L.columnMaxChars   = [null, 20, null];
  L.columnAllCaps    = [false, false, false];
  L.columnExtraClass = ['is-prof-col', null, null];
  L.columnMinWidthPx = [20, null, 28];
  L.columnFontScale  = [1.15, 1, 1];
  L.stacking = 'horizontal';
}
WG_EXTRA_INFOBOX_BUILDERS.prepared = wgxBuildPrepared;

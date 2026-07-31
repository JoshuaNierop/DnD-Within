// wg-rest.js — Long Rest / Short Rest widget (E5.5/2024).
//
// Eerste bouwsteen van de BG3-achtige level-up + spell-prepare flow. Bewust de
// laagste-risico-start: puur een state-reset (geen nieuwe data-tabellen, geen
// keuze-UI). Oefent de volledige nieuwe-widget-pipeline end-to-end
// (WG_WIDGET_TYPES → infobox-builder → click-handler → PATCH+refresh+rebuild),
// die de prepare- en level-up-widgets straks hergebruiken.
//
// Long Rest (2024 RAW): HP → max, temp 0, death saves reset, alle spell slots
// terug, Warlock pact slots terug, en de helft van je hit dice terug (afgerond
// naar beneden, minimaal 1). Daarna opent — zodra wg-prepare.js bestaat — de
// spell-prepare-window voor casters (forward-compat hook, no-op tot fase 2).
//
// Short Rest (alleen Warlock getoond): herstelt Pact Magic slots.
//
// Load order: NA wg-state.js (Object.assign op de registries) en NA wg-hp.js
// (hergebruikt wgxDefaultHp). Verder runtime-globals: WG_CHAR_CACHE/STATUS,
// FIREBASE_DB, fetchCharacterData, wgSyncCharToLocal, rebuildWidget, render,
// showToast, state, en uit de app-core: DATA, isThirdCaster.

// ===== Registries (gedeeld met wg-hp.js via var-hijack) =====
var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};
var WG_INFOBOX_CLICK_HANDLERS = (typeof WG_INFOBOX_CLICK_HANDLERS !== 'undefined') ? WG_INFOBOX_CLICK_HANDLERS : {};

// ===== Widget-type + edit-config =====
Object.assign(WG_WIDGET_TYPES, {
  longRest: {
    label: 'Rest', kind: 'infobox', source: 'rest',
    spanUnits: 4, spanUnitsY: 2,
    cfg: { cellPadding: 6, widgetPadding: 6, infoBoxSpacing: 4, infoBoxPadding: 0 },
  },
});
// mode 'always' = klik zonder edit-toggle (rust hoort tijdens spel klikbaar).
WG_EDIT_CONFIG.rest = { mode: 'always', editColumnIdx: 0 };
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.rest = 'Rest';

// ===== Caster-detectie (bepaalt of na long rest de prepare-window opent) =====
function wgxIsCaster(raw) {
  const cfg = (raw && raw.config) || {};
  const st  = (raw && raw.state)  || {};
  const cn = cfg.className, sub = cfg.subclass, lvl = st.level || 1;
  if (!cn) return false;
  if (cn === 'warlock') return true;
  if (typeof isThirdCaster === 'function' && isThirdCaster(cn, sub)) return lvl >= 3; // EK/AT vanaf L3
  const cd = (typeof DATA !== 'undefined' && DATA[cn]) || {};
  if (cd.spellSlots) return true;                    // full caster
  if (cd.spellcasting === 'half') return lvl >= 2;   // Paladin/Ranger vanaf L2
  return false;
}

// ===== Firebase write — PATCH op /state (meerdere velden tegelijk) =====
async function wgxPatchState(charId, patch) {
  const url = FIREBASE_DB + '/dw/characters/' + encodeURIComponent(charId) + '/state.json';
  const res = await fetch(url, { method: 'PATCH', body: JSON.stringify(patch), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' on state');
  WG_CHAR_STATUS[charId] = null;
  await new Promise(resolve => {
    fetchCharacterData(charId);
    let n = 0;
    const iv = setInterval(() => {
      n++;
      if (WG_CHAR_STATUS[charId] === 'ready' || WG_CHAR_STATUS[charId] === 'error' || n > 50) { clearInterval(iv); resolve(); }
    }, 100);
  });
  if (typeof wgSyncCharToLocal === 'function') wgSyncCharToLocal(charId);
  // Meerdere stats wijzigen (HP, slots, hit dice) → herbouw alle infobox-widgets.
  for (const w of state.widgets) if (w.data && w.data.source) rebuildWidget(w);
  render();
}

// ===== Long rest (2024 RAW) =====
async function wgxLongRest(charId) {
  const raw = WG_CHAR_CACHE[charId] || {};
  const st  = raw.state || {};
  const level = st.level || 1;
  const hp = wgxDefaultHp(raw);                       // hergebruikt uit wg-hp.js
  const restore = Math.max(1, Math.floor(level / 2)); // helft van je hit dice, min 1
  const newHitDiceUsed = Math.max(0, (st.hitDiceUsed || 0) - restore);
  const patch = {
    spellSlotsUsed: {},      // Firebase verwijdert lege node → "geen slots gebruikt"
    pactSlotsUsed: 0,        // Warlock
    hitDiceUsed: newHitDiceUsed,
    hp: { current: hp.max, temp: 0, deathSaves: { successes: 0, failures: 0 }, stable: false, dead: false },
  };
  // All class/subclass/species resources recharge fully on a Long Rest.
  const resources = (typeof getClassResources === 'function') ? getClassResources(raw.config || {}, st) : [];
  for (const r of resources) patch[r.stateKey] = 0;
  await wgxPatchState(charId, patch);
  return { max: hp.max, restoredHitDice: restore };
}

// ===== Short rest (Warlock Pact Magic + short-one resources) =====
async function wgxShortRest(charId) {
  const raw = WG_CHAR_CACHE[charId] || {};
  const st = raw.state || {};
  const patch = { pactSlotsUsed: 0 };
  // 'short-one' resources (Second Wind, Channel Divinity, Wild Shape, …)
  // regain one use on a Short Rest.
  const resources = (typeof getClassResources === 'function') ? getClassResources(raw.config || {}, st) : [];
  for (const r of resources) {
    if (r.recharge === 'short-one' && (st[r.stateKey] || 0) > 0) patch[r.stateKey] = (st[r.stateKey] || 0) - 1;
  }
  await wgxPatchState(charId, patch);
}

// ===== Infobox-builder (1-koloms tile-stack) =====
function wgxBuildRest(widget) {
  const raw = WG_CHAR_CACHE[state.characterId] || {};
  const cn = (raw.config || {}).className;
  const d = widget.data, L = widget.layout;
  d.tooltips = null;
  d.columns = [{ key: 'cell', label: 'Rest' }];
  const rows = [], rowCls = [];
  rows.push(['🌙 Long Rest']); rowCls.push('wgx-act-rest-long');
  // Short Rest matters for Pact Magic and for any 'short-one' resource.
  const res = (typeof getClassResources === 'function') ? getClassResources(raw.config || {}, raw.state || {}) : [];
  const hasShort = cn === 'warlock' || res.some(r => r.recharge === 'short-one');
  if (hasShort) { rows.push(['☀️ Short Rest']); rowCls.push('wgx-act-rest-short'); }
  d.rows = rows;
  L.columnHighlight = [false];
  L.columnAlign = ['center'];
  L.columnAllCaps = [false];
  L.columnMaxChars = [null];
  L.columnExtraClass = [null];
  L.columnMinWidthPx = [null];
  L.columnFontScale = [1];
  L.rowExtraClass = rowCls;
  L.stacking = 'horizontal';
}
WG_EXTRA_INFOBOX_BUILDERS.rest = wgxBuildRest;

// ===== Click-handler (infobox, source 'rest') =====
WG_INFOBOX_CLICK_HANDLERS.rest = async ({ charId, rowIdx, raw }) => {
  const isShort = rowIdx === 1; // row 1 only exists when short rest applies
  if (isShort) {
    if (!window.confirm('Short rest? Restores Pact Magic slots and one use of short-rest resources.')) return;
    try { await wgxShortRest(charId); showToast('☀️ Short rest complete'); }
    catch (err) { showToast('Rest failed · ' + err.message, 'error'); }
    return;
  }
  if (!window.confirm('Long rest? Restores HP, all spell slots, class resources and half your hit dice; resets death saves.')) return;
  try {
    const r = await wgxLongRest(charId);
    showToast(`🌙 Long rest — HP ${r.max}/${r.max}, +${r.restoredHitDice} hit dice`);
    // Forward-compat: fase 2 (wg-prepare.js) definieert wgxOpenPrepareWindow en
    // de prepare-window opent dan automatisch voor casters. Tot dan: no-op.
    if (typeof wgxOpenPrepareWindow === 'function' && wgxIsCaster(raw)) wgxOpenPrepareWindow(charId);
  } catch (err) { showToast('Rest failed · ' + err.message, 'error'); }
};

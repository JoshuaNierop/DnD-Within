// wg-rest.js — Long Rest / Short Rest widget (E5.5/2024).
//
// First building block of the BG3-style level-up + spell-prepare flow. Deliberately the
// lowest-risk start: purely a state reset (no new data tables, no
// choice UI). Exercises the full new-widget pipeline end-to-end
// (WG_WIDGET_TYPES → infobox builder → click handler → PATCH+refresh+rebuild),
// which the prepare and level-up widgets will reuse shortly.
//
// Long Rest (2024 RAW): HP → max, temp 0, death saves reset, all spell slots
// back, Warlock pact slots back, and half of your hit dice back (rounded
// down, minimum 1). Afterwards — once wg-prepare.js exists — the
// spell-prepare window opens for casters (forward-compat hook, no-op until phase 2).
//
// Short Rest (shown for Warlock only): restores Pact Magic slots.
//
// Load order: AFTER wg-state.js (Object.assign on the registries) and AFTER wg-hp.js
// (reuses wgxDefaultHp). Other runtime globals: WG_CHAR_CACHE/STATUS,
// FIREBASE_DB, fetchCharacterData, wgSyncCharToLocal, rebuildWidget, render,
// showToast, state, and from the app core: DATA, isThirdCaster.

// ===== Registries (shared with wg-hp.js via var-hijack) =====
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
// mode 'always' = click without edit toggle (rest should be clickable during play).
WG_EDIT_CONFIG.rest = { mode: 'always', editColumnIdx: 0 };
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.rest = 'Rest';

// ===== Caster detection (decides whether the prepare window opens after long rest) =====
function wgxIsCaster(raw) {
  const cfg = (raw && raw.config) || {};
  const st  = (raw && raw.state)  || {};
  const cn = cfg.className, sub = cfg.subclass, lvl = st.level || 1;
  if (!cn) return false;
  if (cn === 'warlock') return true;
  if (typeof isThirdCaster === 'function' && isThirdCaster(cn, sub)) return lvl >= 3; // EK/AT from L3
  const cd = (typeof DATA !== 'undefined' && DATA[cn]) || {};
  if (cd.spellSlots) return true;                    // full caster
  if (cd.spellcasting === 'half') return lvl >= (cd.spellcastingStart || 1); // 2024: Paladin/Ranger cast from L1
  return false;
}

// ===== Firebase write — PATCH on /state (multiple fields at once) =====
async function wgxPatchState(charId, patch) {
  const url = FIREBASE_DB + '/dw/characters/' + encodeURIComponent(charId) + '/state.json';
  if (typeof dwRefreshIdToken === 'function') await dwRefreshIdToken();
  const res = await fetch(wgAuthUrl(url), { method: 'PATCH', body: JSON.stringify(patch), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' on state' + (await wgxHttpReason(res)));
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
  // Several stats change (HP, slots, hit dice) → rebuild all infobox widgets.
  for (const w of state.widgets) if (w.data && w.data.source) rebuildWidget(w);
  render();
}

// ===== Long rest (2024 RAW) =====
async function wgxLongRest(charId) {
  const raw = WG_CHAR_CACHE[charId] || {};
  const st  = raw.state || {};
  const level = st.level || 1;
  const hp = wgxDefaultHp(raw);                       // reused from wg-hp.js
  const restore = Math.max(1, Math.floor(level / 2)); // half of your hit dice, min 1
  const newHitDiceUsed = Math.max(0, (st.hitDiceUsed || 0) - restore);
  const patch = {
    spellSlotsUsed: {},      // Firebase removes empty node → "no slots used"
    pactSlotsUsed: 0,        // Warlock
    hitDiceUsed: newHitDiceUsed,
    hp: { current: hp.max, temp: 0, deathSaves: { successes: 0, failures: 0 }, stable: false, dead: false },
  };
  // All class/subclass/species resources recharge fully on a Long Rest.
  const resources = (typeof getClassResources === 'function') ? getClassResources(raw.config || {}, st) : [];
  for (const r of resources) patch[r.stateKey] = 0;
  patch.activeEffects = null;                         // 8 hours: every running spell has ended
  // Conditions widget (wg-conditions.js): one Exhaustion level off, the Arcane Ward
  // is gone until recreated, Humans regain Heroic Inspiration (Resourceful).
  const ex = (typeof getExhaustion === 'function') ? getExhaustion(st) : 0;
  if (ex) patch.exhaustion = ex - 1 || null;
  if (st.arcaneWardHp) patch.arcaneWardHp = null;
  if ((raw.config || {}).race === 'human') patch.heroicInspiration = true;
  await wgxPatchState(charId, patch);
  return { max: hp.max, restoredHitDice: restore };
}

// ===== Short rest (Warlock Pact Magic + short / short-one resources) =====
async function wgxShortRest(charId) {
  const raw = WG_CHAR_CACHE[charId] || {};
  const st = raw.state || {};
  const patch = { pactSlotsUsed: 0 };
  // 'short-one' resources (Second Wind, Channel Divinity, Wild Shape, …)
  // regain one use on a Short Rest.
  const resources = (typeof getClassResources === 'function') ? getClassResources(raw.config || {}, st) : [];
  for (const r of resources) {
    if (r.recharge === 'short-one' && (st[r.stateKey] || 0) > 0) patch[r.stateKey] = (st[r.stateKey] || 0) - 1;
    // 'short': all uses return (Action Surge, Focus Points, Adrenaline Rush, Superiority Dice …)
    if (r.recharge === 'short' && (st[r.stateKey] || 0) > 0) patch[r.stateKey] = 0;
  }
  // 1 hour: spells of up to an hour have ended.
  const effs = st.activeEffects || {};
  for (const id in effs) if (effs[id] && effs[id].rounds > 0 && effs[id].rounds <= 600) patch['activeEffects/' + id] = null;
  await wgxPatchState(charId, patch);
}

// ===== Infobox builder (1-column tile stack) =====
function wgxBuildRest(widget) {
  const raw = WG_CHAR_CACHE[state.characterId] || {};
  const cn = (raw.config || {}).className;
  const d = widget.data, L = widget.layout;
  d.tooltips = null;
  d.columns = [{ key: 'cell', label: 'Rest' }];
  const rows = [], rowCls = [];
  rows.push(['🌙 Long Rest']); rowCls.push('wgx-act-rest-long');
  // Short Rest matters for Pact Magic and for any 'short' / 'short-one' resource.
  const res = (typeof getClassResources === 'function') ? getClassResources(raw.config || {}, raw.state || {}) : [];
  const hasShort = cn === 'warlock' || wgxHasMemorizeSpell(raw) || res.some(r => r.recharge === 'short-one' || r.recharge === 'short');
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

// Memorize Spell (Wizard 5): after a Short Rest, swap one prepared spell.
function wgxHasMemorizeSpell(raw) {
  const cfg = (raw && raw.config) || {}, st = (raw && raw.state) || {};
  return cfg.className === 'wizard' && (st.level || 1) >= 5;
}

// ===== Click-handler (infobox, source 'rest') =====
WG_INFOBOX_CLICK_HANDLERS.rest = async ({ charId, rowIdx, raw }) => {
  const isShort = rowIdx === 1; // row 1 only exists when short rest applies
  if (isShort) {
    if (!(await showConfirmModal({ title: 'Short rest', message: 'Restores Pact Magic slots and one use of short-rest resources.', confirmLabel: 'Short rest' }))) return;
    try { await wgxShortRest(charId); showToast('☀️ Short rest complete'); }
    catch (err) { showToast('Rest failed · ' + err.message, 'error'); return; }
    if (wgxHasMemorizeSpell(raw) && typeof wgxOpenPrepareWindow === 'function' &&
        await showConfirmModal({ title: 'Memorize Spell', message: 'Replace one of your prepared spells with another from your spellbook?', confirmLabel: 'Choose spell', cancelLabel: 'Not now' })) {
      wgxOpenPrepareWindow(charId, { swapOne: true });
    }
    return;
  }
  if (!(await showConfirmModal({ title: 'Long rest', message: 'Restores HP, all spell slots, class resources and half your hit dice; resets death saves.', confirmLabel: 'Long rest' }))) return;
  try {
    const r = await wgxLongRest(charId);
    showToast(`🌙 Long rest — HP ${r.max}/${r.max}, +${r.restoredHitDice} hit dice`);
    // Phase 2 (wg-prepare.js): prepare window opens automatically for casters.
    if (typeof wgxOpenPrepareWindow === 'function' && wgxIsCaster(raw)) wgxOpenPrepareWindow(charId);
  } catch (err) { showToast('Rest failed · ' + err.message, 'error'); }
};

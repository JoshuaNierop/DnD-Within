// wg-hp.js — Hit Points widget, geport uit Widget-Grid-VIX (wg-widgets-extra-3.js).
//
// Eén HP-widget: 'hpBase', kind 'infobox'. Een 1-koloms info-box-stack die
// meedoet aan de bestaande infobox-layout/-render (equal spacing + content-fit),
// dus schaalt identiek aan de andere dashboard-widgets.
//
// Content (compact): Current/Max, Temp, Damage, Heal. Death saves alleen bij 0 HP.
// Damage/Heal-tiles krijgen een doffe rood/groen-tint als subtiele actie-indicator.
//
// Interactie: WG_EDIT_CONFIG.hp.mode === 'always' → klikbaar zónder edit-toggle
// (damage/heal tijdens spel). Schrijft atomisch naar state/hp via PATCH.
//
// Load order: NA wg-state.js (Object.assign op WG_WIDGET_TYPES/WG_EDIT_CONFIG),
// gebruikt verder runtime-globals (render, rebuildWidget, showToast,
// fetchCharacterData, WG_CHAR_CACHE/STATUS, FIREBASE_DB, wgSyncCharToLocal).

// ===== Registries (extension-points die wg-state.js / wg-events.js aanroepen) =====
var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};
var WG_INFOBOX_CLICK_HANDLERS = (typeof WG_INFOBOX_CLICK_HANDLERS !== 'undefined') ? WG_INFOBOX_CLICK_HANDLERS : {};

// ===== Widget-type + edit-config =====
Object.assign(WG_WIDGET_TYPES, {
  hpBase: {
    label: 'Hit Points', kind: 'infobox', source: 'hp',
    spanUnits: 4, spanUnitsY: 5,
    // infoBoxPadding 0 → de cel vult de hele info-box, dus de tint is de
    // ACHTERGROND van de infobox (geen aparte ingesprongen knop-rect).
    cfg: { cellPadding: 6, widgetPadding: 6, infoBoxSpacing: 4, infoBoxPadding: 0 },
  },
});
// mode 'always' = klik zonder edit-toggle; editColumnIdx 0 = de enige kolom is klikbaar.
WG_EDIT_CONFIG.hp = { mode: 'always', editColumnIdx: 0 };
// Auto-titel voor infobox-bron 'hp' (widgetBaseLabel leest WG_SOURCE_LABELS).
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.hp = 'Hit Points';

// ===== HP-state reader (max uit config.hp.max of 10 + CON-mod) =====
function wgxDefaultHp(raw) {
  const cfg = (raw && raw.config) || {};
  const st  = (raw && raw.state)  || {};
  // Max: rules-afgeleid via de hoofd-app (getMaxHP = override > getHP). Fallback
  // op 10 + CON-mod als de engine niet geladen is (bv. standalone widget-grid).
  let max;
  if (cfg.hp && typeof cfg.hp.max === 'number' && cfg.hp.max > 0) {
    max = cfg.hp.max;
  } else if (typeof getMaxHP === 'function') {
    try { max = getMaxHP(cfg, st); } catch (e) {}
  }
  if (typeof max !== 'number' || !(max > 0)) {
    const con = (cfg.baseAbilities && cfg.baseAbilities.con) ?? 10;
    max = 10 + Math.floor((con - 10) / 2);
  }
  // Canoniek = state.hp.*; legacy platte velden (currentHP/tempHP/deathSaves) als fallback.
  const hpSt = st.hp || {};
  const flatCur = (typeof st.currentHP === 'number') ? st.currentHP : undefined;
  return {
    max,
    current: (typeof hpSt.current === 'number') ? hpSt.current : (flatCur != null ? flatCur : max),
    temp:    (typeof hpSt.temp    === 'number') ? hpSt.temp    : (typeof st.tempHP === 'number' ? st.tempHP : 0),
    deathSaves: hpSt.deathSaves || st.deathSaves || { successes: 0, failures: 0 },
    stable: !!hpSt.stable,
    dead:   !!hpSt.dead,
  };
}

// ===== D&D 5.5e (2024) regelcorrecte HP-mutaties =====
function wgxApplyDamage(hp, amount, opts = {}) {
  amount = Math.max(0, Math.trunc(amount));
  const next = { ...hp, deathSaves: { ...hp.deathSaves } };
  if (amount === 0) return next;
  if (next.current === 0 && !next.dead) {
    const fails = opts.isCrit ? 2 : 1;
    next.deathSaves.failures = Math.min(3, next.deathSaves.failures + fails);
    next.stable = false;
    if (next.deathSaves.failures >= 3) next.dead = true;
    return next;
  }
  const fromTemp = Math.min(next.temp, amount);
  next.temp -= fromTemp;
  const remaining = amount - fromTemp;
  const overflow = remaining - next.current;
  next.current = Math.max(0, next.current - remaining);
  if (next.current === 0 && overflow >= next.max) {
    next.dead = true;
    next.deathSaves = { successes: 0, failures: 3 };
  }
  return next;
}
function wgxApplyHeal(hp, amount) {
  amount = Math.max(0, Math.trunc(amount));
  if (amount === 0 || hp.dead) return { ...hp, deathSaves: { ...hp.deathSaves } };
  return { ...hp, current: Math.min(hp.max, hp.current + amount), deathSaves: { successes: 0, failures: 0 }, stable: false };
}

// ===== Firebase write — atomische PATCH op state/hp =====
async function wgxPatchHpState(charId, patch) {
  const url = FIREBASE_DB + '/dw/characters/' + encodeURIComponent(charId) + '/state/hp.json';
  const res = await fetch(url, { method: 'PATCH', body: JSON.stringify(patch), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' on state/hp');
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
  for (const w of state.widgets) if (w.data && w.data.source === 'hp') rebuildWidget(w);
  render();
}
async function wgxHpMutate(charId, mutator) {
  const cur = wgxDefaultHp(WG_CHAR_CACHE[charId]);
  const next = mutator({ ...cur, deathSaves: { ...cur.deathSaves } });
  await wgxPatchHpState(charId, {
    current: next.current, temp: next.temp, deathSaves: next.deathSaves,
    stable: !!next.stable, dead: !!next.dead,
  });
  return next;
}
function wgxHpToast(next, verb) {
  if (next.dead) { showToast('💀 Dood', 'error'); return; }
  if (next.current === 0 && verb === 'damage') { showToast('Death save failure', 'error'); return; }
  showToast(`${verb === 'heal' ? 'Heal' : 'Damage'} → ${next.current}/${next.max}` + (next.temp > 0 ? ` (+${next.temp})` : ''));
}
async function wgxApplyMode(charId, mode, amt) {
  try {
    const next = await wgxHpMutate(charId, hp => mode === 'heal' ? wgxApplyHeal(hp, amt) : wgxApplyDamage(hp, amt));
    wgxHpToast(next, mode);
  } catch (err) { showToast('Save faalde · ' + err.message, 'error'); }
}

// ===== hpBase — infobox-builder (1-koloms tile-stack) =====
function wgxBuildHpBase(widget) {
  const t = wgxDefaultHp(WG_CHAR_CACHE[state.characterId]);
  const d = widget.data, L = widget.layout;
  d.tooltips = null;
  d.columns = [{ key: 'cell', label: 'HP' }];
  const rows = [];
  const rowCls = [];
  rows.push([`♥ ${t.current} / ${t.max}`]); rowCls.push(null);
  rows.push([t.temp > 0 ? `Temp +${t.temp}` : 'Temp 0']); rowCls.push('wgx-act-temp');
  rows.push(['Damage']); rowCls.push('wgx-act-dmg');
  rows.push(['Heal']);   rowCls.push('wgx-act-heal');
  if (t.current === 0) {
    if (t.dead) { rows.push(['💀 Dood']); rowCls.push(null); }
    else if (t.stable) { rows.push(['Stabiel']); rowCls.push(null); }
    else {
      rows.push([`Saves ${'●'.repeat(t.deathSaves.successes)}${'○'.repeat(3 - t.deathSaves.successes)}`]); rowCls.push(null);
      rows.push([`Fails ${'●'.repeat(t.deathSaves.failures)}${'○'.repeat(3 - t.deathSaves.failures)}`]); rowCls.push(null);
    }
  }
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
WG_EXTRA_INFOBOX_BUILDERS.hp = wgxBuildHpBase;

// Welke actie hoort bij rij rowIdx (deterministisch uit de HP-state).
function wgxHpBaseAction(rowIdx, t) {
  const base = ['current', 'temp', 'damage', 'heal'];
  if (rowIdx < 4) return base[rowIdx];
  if (t.current !== 0 || t.dead || t.stable) return 'none';
  return rowIdx === 4 ? 'ds-success' : 'ds-failure';
}

// ===== Number-prompt overlay (inline op de geklikte cel) =====
function wgxPromptNumberOverlay(cellG, curVal, min, max) {
  return new Promise(resolve => {
    const rect = cellG.getBoundingClientRect();
    const inp = document.createElement('input');
    inp.type = 'number';
    inp.className = 'edit-input-overlay';
    inp.value = String(curVal);
    inp.min = String(min);
    inp.max = String(max);
    inp.step = '1';
    inp.inputMode = 'numeric';
    inp.setAttribute('pattern', '[0-9]*');
    inp.style.fontSize = '16px';   // iOS focus-zoom voorkomen
    const w = Math.max(rect.width, 90);
    const vw = window.innerWidth, vh = window.innerHeight;
    const left = Math.min(rect.left, vw - w - 8);
    const top  = Math.min(rect.top, vh * 0.5);
    inp.style.left = Math.round(Math.max(8, left) + window.scrollX) + 'px';
    inp.style.top  = Math.round(Math.max(8, top)  + window.scrollY) + 'px';
    inp.style.width  = w + 'px';
    inp.style.height = rect.height > 0 ? rect.height + 'px' : 'auto';
    document.body.appendChild(inp);
    inp.focus(); inp.select();
    let done = false;
    function commit() {
      if (done) return; done = true;
      inp.remove();
      const v = parseInt(inp.value, 10);
      if (isNaN(v)) return resolve(null);
      resolve(Math.max(min, Math.min(max, v)));
    }
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { done = true; inp.remove(); resolve(null); }
    });
    inp.addEventListener('blur', () => { if (!done) commit(); });
  });
}

// ===== Quick-amount overlay (heal/damage delta's, blijft open voor stapelen) =====
function wgxOpenQuickOverlay(anchorEl, mode, onApply) {
  document.querySelectorAll('.wgx-quick-overlay').forEach(n => n.remove());
  const panel = document.createElement('div');
  panel.className = 'wgx-quick-overlay';
  const amounts = [1, 5, 10];
  const addRow = (m) => {
    const row = document.createElement('div');
    row.className = 'wgx-quick-row wgx-quick-' + m;
    const lbl = document.createElement('span'); lbl.className = 'wgx-quick-label'; lbl.textContent = m === 'heal' ? 'Heal' : 'Damage';
    row.appendChild(lbl);
    amounts.forEach(a => {
      const b = document.createElement('button'); b.className = 'wgx-quick-btn wgx-' + m;
      b.textContent = (m === 'heal' ? '+' : '−') + a;
      b.addEventListener('click', () => onApply(m, a));
      row.appendChild(b);
    });
    const c = document.createElement('button'); c.className = 'wgx-quick-btn wgx-quick-custom'; c.textContent = '…'; c.title = 'Exact bedrag';
    c.addEventListener('click', async () => { const v = await wgxPromptNumberOverlay(c, 0, 0, 999); if (v != null && v > 0) onApply(m, v); });
    row.appendChild(c);
    panel.appendChild(row);
  };
  if (mode === 'damage' || mode === 'both') addRow('damage');
  if (mode === 'heal' || mode === 'both') addRow('heal');
  const done = document.createElement('button'); done.className = 'wgx-quick-done'; done.textContent = 'Klaar';
  done.addEventListener('click', () => close());
  panel.appendChild(done);
  document.body.appendChild(panel);
  const rect = anchorEl.getBoundingClientRect();
  const pw = panel.offsetWidth, ph = panel.offsetHeight, vw = window.innerWidth, vh = window.innerHeight;
  let left = rect.left + rect.width / 2 - pw / 2;
  let top = rect.bottom + 6;
  if (top + ph > vh - 8) top = Math.max(8, rect.top - ph - 6);
  left = Math.max(8, Math.min(left, vw - pw - 8));
  panel.style.left = Math.round(left + window.scrollX) + 'px';
  panel.style.top = Math.round(top + window.scrollY) + 'px';
  function close() { panel.remove(); document.removeEventListener('pointerdown', onOutside, true); }
  function onOutside(e) { if (!panel.contains(e.target)) close(); }
  setTimeout(() => document.addEventListener('pointerdown', onOutside, true), 0);
}

// ===== Click-handler (infobox, source 'hp') — per-rij dispatch =====
WG_INFOBOX_CLICK_HANDLERS.hp = async ({ cellG, raw, charId, rowIdx }) => {
  const t = wgxDefaultHp(raw);
  const action = wgxHpBaseAction(rowIdx, t);
  if (action === 'current') {
    const v = await wgxPromptNumberOverlay(cellG, t.current, 0, 999);
    if (v == null) return;
    const delta = v - t.current;
    const next = await wgxHpMutate(charId, hp => delta >= 0 ? wgxApplyHeal(hp, delta) : wgxApplyDamage(hp, -delta));
    wgxHpToast(next, delta >= 0 ? 'heal' : 'damage');
  } else if (action === 'temp') {
    const v = await wgxPromptNumberOverlay(cellG, t.temp, 0, 999);
    if (v == null) return;
    await wgxHpMutate(charId, hp => ({ ...hp, temp: Math.max(0, v), deathSaves: { ...hp.deathSaves } }));
    showToast('Temp HP → ' + Math.max(0, v));
  } else if (action === 'damage' || action === 'heal') {
    wgxOpenQuickOverlay(cellG, action, (m, amt) => wgxApplyMode(charId, m, amt));
  } else if (action === 'ds-success' || action === 'ds-failure') {
    const key = action === 'ds-success' ? 'successes' : 'failures';
    const cur = t.deathSaves[key];
    const n = (cur >= 3) ? 0 : cur + 1;
    await wgxHpMutate(charId, hp => {
      hp.deathSaves = { ...hp.deathSaves, [key]: n };
      hp.dead = key === 'failures' && n >= 3;
      hp.stable = key === 'successes' && n >= 3;
      return hp;
    });
  }
};

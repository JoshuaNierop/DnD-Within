// ===== wg-combat.js — Combat Tracker (DM) + Initiative Tracker (speler) =====
// Een nieuwe widget-`kind: 'combat'`. Twee types delen de renderer:
//   - combatTracker     → mode 'dm'     (volledige tabel, bewerkbaar, turn-control)
//   - initiativeTracker → mode 'player' (read-only publieke variant: portret+naam)
//
// De encounter-DATA is NIET per-widget: ze leeft in localStorage-key
// `dw_initiative` ↔ Firebase `dm/initiative` (al in de sync-allowlist). De DM
// schrijft; alle clients lezen live via de bestaande sync (sync.js child_changed
// op dw/dm → applyLeaves → renderApp). Door localStorage VÓÓR syncUpload te
// zetten is de eigen Firebase-echo een no-op (changed===0, geen re-mount-flits).
// De widget is dus een live VIEW, geen data-container; serialize slaat alleen
// geometrie + cfg.transpose op.

const WG_VIS_CYCLE = ['hidden', 'silhouette', 'revealed'];
const WG_VIS_GLYPH = { hidden: '—', silhouette: '?', revealed: '◉' };
// i18n: labels worden op render-tijd opgehaald zodat een taalwissel (NL/EN)
// de combat-widget direct meeneemt. ct() valt terug op de key als t() ontbreekt.
function ct(key) { return (typeof t === 'function') ? t(key) : key; }
function combatVisLabel(vis) { return ct('combat.vis.' + vis); }
function combatKindLabel(kind) { return ct('combat.kind.' + kind); }
function combatFieldLabel(field) {
  if (field === 'portrait' || field === 'del') return '';
  return ct('combat.col.' + field);
}

// ---- Encounter model (gedeeld, auto-synced) ----
function emptyEncounter() {
  return { round: 1, activeId: null, running: false, entities: [], updatedAt: 0 };
}
function getEncounter() {
  try {
    const raw = localStorage.getItem('dw_initiative');
    if (raw) {
      const e = JSON.parse(raw);
      if (e && Array.isArray(e.entities)) {
        if (typeof e.round !== 'number') e.round = 1;
        if (!('activeId' in e)) e.activeId = null;
        if (!('running' in e)) e.running = false;
        return e;
      }
    }
  } catch (e) {}
  return emptyEncounter();
}
// Schrijf encounter: localStorage EERST (zodat de eigen sync-echo changed===0
// geeft), dan syncUpload, dan render. opts.render===false slaat de render over.
//
// CRUCIAAL: Firebase strijpt `null`-velden (en lege arrays) bij het opslaan. Als
// localStorage die nulls WEL bewat, verschilt de eigen echo structureel → sync.js
// telt changed>0 → renderApp() remount de hele dashboard bij élke HP/init-edit.
// Daarom serialiseren we met een replacer die null/undefined weglaat, zodat de
// localStorage-vorm exact matcht met wat Firebase terugstuurt (→ changed===0).
function combatStripNulls(k, v) {
  if (v === null || v === undefined) return undefined;
  // Firebase dropt lege arrays/objects volledig → doe lokaal hetzelfde.
  if (Array.isArray(v) && v.length === 0) return undefined;
  if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) return undefined;
  return v;
}
function saveEncounter(enc, opts) {
  enc.updatedAt = Date.now();
  try { localStorage.setItem('dw_initiative', JSON.stringify(enc, combatStripNulls)); } catch (e) {}
  if (typeof syncUpload === 'function') { try { syncUpload('dw_initiative'); } catch (e) {} }
  if (!opts || opts.render !== false) { if (typeof render === 'function') render(); }
}
function mutateEncounter(fn) {
  const e = getEncounter();
  fn(e);
  saveEncounter(e);
}

// ---- Helpers ----
function combatMode(widget) {
  return (widget && widget.type === 'initiativeTracker') ? 'player' : 'dm';
}
function parseLeadingInt(s, def) {
  if (typeof s === 'number') return Math.round(s);
  const m = String(s == null ? '' : s).match(/-?\d+/);
  return m ? parseInt(m[0], 10) : (def == null ? 0 : def);
}
function combatNewId() {
  return 'ce' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
}
function dexModFromAbilities(ab) {
  if (ab && typeof ab.dex === 'number') return Math.floor((ab.dex - 10) / 2);
  return 0;
}
// Initiative-sort: hoog→laag; null (nog niet gerold) ONDERAAN; tiebreak dexMod
// desc → kind (pc<npc<monster) → stabiel op id. JS sort is stabiel → null-groep
// behoudt invoeg-volgorde.
function combatSortEntities(list) {
  const kindOrder = (k) => (k === 'pc' ? 0 : k === 'npc' ? 1 : 2);
  return list.slice().sort((a, b) => {
    const an = (a.initiative == null), bn = (b.initiative == null);
    if (an && bn) return 0;
    if (an) return 1;
    if (bn) return -1;
    if (b.initiative !== a.initiative) return b.initiative - a.initiative;
    const ad = a.dexMod || 0, bd = b.dexMod || 0;
    if (bd !== ad) return bd - ad;
    if (kindOrder(a.kind) !== kindOrder(b.kind)) return kindOrder(a.kind) - kindOrder(b.kind);
    return String(a.id).localeCompare(String(b.id));
  });
}

// ---- Entity-fabrieken uit de bronnen ----
function combatEntityFromCharacter(charId) {
  const raw = WG_CHAR_CACHE[charId] || {};
  const cfg = raw.config || {};
  const st = raw.state || {};
  let maxHP = 1, ac = 10, dexMod = 0;
  try { if (typeof getHP === 'function') maxHP = getHP(cfg, st) || maxHP; } catch (e) {}
  try { if (typeof getAC === 'function') ac = getAC(cfg, st) || ac; } catch (e) {}
  try {
    if (typeof getAbilityScore === 'function' && typeof getMod === 'function') {
      dexMod = getMod(getAbilityScore(cfg, st, 'dex'));
    }
  } catch (e) {}
  const name = cfg.name || raw.name || charId;
  const portrait = (raw.images && raw.images.portrait) || null;
  return {
    id: combatNewId(), kind: 'pc', ref: charId, name: name, portrait: portrait,
    initiative: null, dexMod: dexMod, currentHP: maxHP, maxHP: maxHP, tempHP: 0,
    ac: ac, visibility: 'revealed',
  };
}
function combatEntityFromNpc(npc) {
  const hp = parseLeadingInt(npc.hp, 0);
  return {
    id: combatNewId(), kind: 'npc', ref: npc.id || null, name: npc.name || 'NPC',
    portrait: npc.image || null, initiative: null, dexMod: dexModFromAbilities(npc.abilities),
    currentHP: hp, maxHP: hp, tempHP: 0, ac: parseLeadingInt(npc.ac, 10), visibility: 'hidden',
  };
}
function combatEntityFromMonster(m) {
  const hp = parseLeadingInt(m.hp, 1);
  return {
    id: combatNewId(), kind: 'monster', ref: m.id || null, name: m.name || 'Monster',
    portrait: m.image || null, initiative: null, dexMod: dexModFromAbilities(m.abilities),
    currentHP: hp, maxHP: hp, tempHP: 0, ac: parseLeadingInt(m.ac, 10), visibility: 'hidden',
  };
}

// ---- HP-mutaties (temp HP eerst bij schade; heal raakt temp nooit) ----
function combatApplyHpDelta(ent, delta) {
  delta = Math.round(delta) || 0;
  if (delta < 0) {
    let dmg = -delta;
    if (ent.tempHP > 0) {
      const fromTemp = Math.min(ent.tempHP, dmg);
      ent.tempHP -= fromTemp; dmg -= fromTemp;
    }
    ent.currentHP = Math.max(0, ent.currentHP - dmg);
  } else {
    ent.currentHP = Math.min(ent.maxHP, ent.currentHP + delta);
  }
}
function combatSetHp(ent, val) {
  if (typeof val !== 'number' || isNaN(val)) return;
  ent.currentHP = Math.max(0, Math.min(ent.maxHP, Math.round(val)));
}
// HP-tier op basis van (current + temp) / max. Bepaalt de kleur van de HP-box:
//   ok  : >50%  (groen)
//   warn: 25–50% (oranje)
//   crit: 0–25%  (rood)
//   ko  : <=0    (KO)
function combatHpTier(ent) {
  const max = ent.maxHP > 0 ? ent.maxHP : 1;
  const cur = (ent.currentHP || 0) + (ent.tempHP || 0);
  if (cur <= 0) return 'ko';
  const pct = cur / max;
  if (pct > 0.5) return 'ok';
  if (pct > 0.25) return 'warn';
  return 'crit';
}

// ===========================================================================
//  Render
// ===========================================================================
const WG_XHTML_NS = 'http://www.w3.org/1999/xhtml';
function hEl(tag, cls, txt) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}
function combatPortraitNode(ent, masked) {
  const wrap = hEl('div', 'combat-portrait');
  const src = (!masked && ent.portrait && typeof resolveImageSrc === 'function')
    ? resolveImageSrc(ent.portrait) : (masked ? '' : (ent.portrait || ''));
  if (src) {
    const img = document.createElement('img');
    img.src = src; img.alt = '';
    // PC-portretten volgen dezelfde profielfoto-uitsnede als overal (#fATDUg).
    if (!masked && ent.kind === 'pc' && ent.ref && typeof portraitCropStyle === 'function') {
      const cs = portraitCropStyle(loadPortraitCrop(ent.ref));
      if (cs) img.style.cssText += cs;
    }
    img.addEventListener('error', () => {
      if (img.parentNode) img.parentNode.replaceChild(combatInitialNode(masked ? '?' : ent.name), img);
    });
    wrap.appendChild(img);
  } else {
    wrap.appendChild(combatInitialNode(masked ? '?' : ent.name));
  }
  return wrap;
}
function combatInitialNode(name) {
  const s = hEl('span', 'combat-portrait-empty', (String(name || '?').charAt(0) || '?').toUpperCase());
  return s;
}

// Kleine stepper: [−] <input> [+]. onStep(delta), onSet(absoluteOrDelta).
function combatStepper(value, cls, onDec, onInc, onCommit, placeholder) {
  const box = hEl('div', 'combat-stepper ' + (cls || ''));
  const dec = hEl('button', 'combat-step-btn', '−');
  const inp = document.createElement('input');
  inp.type = 'text'; inp.className = 'combat-step-input';
  inp.value = (value == null ? '' : String(value));
  if (placeholder) inp.placeholder = placeholder;
  const inc = hEl('button', 'combat-step-btn', '+');
  dec.addEventListener('click', (e) => { e.stopPropagation(); onDec(); });
  inc.addEventListener('click', (e) => { e.stopPropagation(); onInc(); });
  const commit = () => { onCommit(inp.value); };
  inp.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') { e.preventDefault(); inp.blur(); }
    if (e.key === 'Escape') { inp.value = (value == null ? '' : String(value)); inp.blur(); }
  });
  inp.addEventListener('blur', commit);
  inp.addEventListener('pointerdown', (e) => e.stopPropagation());
  box.appendChild(dec); box.appendChild(inp); box.appendChild(inc);
  return box;
}

// Bouw één cel-node voor een veld van een entity (gedeeld door normaal+transpose).
function combatCell(field, ent, widgetIdx) {
  if (field === 'portrait') {
    const c = hEl('div', 'combat-cell combat-cell-portrait');
    c.appendChild(combatPortraitNode(ent, false));
    return c;
  }
  if (field === 'name') {
    const c = hEl('div', 'combat-cell combat-cell-name');
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'combat-name-input'; inp.value = ent.name || '';
    inp.addEventListener('pointerdown', (e) => e.stopPropagation());
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); });
    inp.addEventListener('blur', () => {
      const v = inp.value.trim();
      if (v && v !== ent.name) mutateEncounter((enc) => { const t = enc.entities.find(x => x.id === ent.id); if (t) t.name = v; });
    });
    const kind = hEl('span', 'combat-kind-badge combat-kind-' + ent.kind, combatKindLabel(ent.kind) || '');
    c.appendChild(inp); c.appendChild(kind);
    return c;
  }
  if (field === 'init') {
    const c = hEl('div', 'combat-cell combat-cell-init');
    c.appendChild(combatStepper(
      ent.initiative, 'init',
      () => mutateEncounter((enc) => { const t = enc.entities.find(x => x.id === ent.id); if (t) t.initiative = (t.initiative == null ? 0 : t.initiative) - 1; }),
      () => mutateEncounter((enc) => { const t = enc.entities.find(x => x.id === ent.id); if (t) t.initiative = (t.initiative == null ? 0 : t.initiative) + 1; }),
      (raw) => {
        const s = String(raw).trim();
        mutateEncounter((enc) => {
          const t = enc.entities.find(x => x.id === ent.id); if (!t) return;
          if (s === '') { t.initiative = null; return; }
          const n = parseInt(s, 10); if (!isNaN(n)) t.initiative = n;
        });
      },
      '—'
    ));
    return c;
  }
  if (field === 'hp') {
    const c = hEl('div', 'combat-cell combat-cell-hp');
    const stepper = combatStepper(
      ent.currentHP, 'hp hp-' + combatHpTier(ent) + (ent.currentHP <= 0 ? ' down' : ''),
      () => mutateEncounter((enc) => { const t = enc.entities.find(x => x.id === ent.id); if (t) combatApplyHpDelta(t, -1); }),
      () => mutateEncounter((enc) => { const t = enc.entities.find(x => x.id === ent.id); if (t) combatApplyHpDelta(t, +1); }),
      (raw) => {
        const s = String(raw).trim();
        mutateEncounter((enc) => {
          const t = enc.entities.find(x => x.id === ent.id); if (!t) return;
          if (/^[+-]/.test(s)) { const d = parseInt(s, 10); if (!isNaN(d)) combatApplyHpDelta(t, d); }
          else { const n = parseInt(s, 10); if (!isNaN(n)) combatSetHp(t, n); }
        });
      },
      null
    );
    const max = hEl('span', 'combat-hp-max', '/ ' + ent.maxHP + (ent.tempHP > 0 ? ' +' + ent.tempHP : ''));
    c.appendChild(stepper); c.appendChild(max);
    return c;
  }
  if (field === 'ac') {
    const c = hEl('div', 'combat-cell combat-cell-ac');
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'combat-ac-input'; inp.value = String(ent.ac);
    inp.addEventListener('pointerdown', (e) => e.stopPropagation());
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); });
    inp.addEventListener('blur', () => {
      const n = parseInt(inp.value, 10);
      if (!isNaN(n)) mutateEncounter((enc) => { const t = enc.entities.find(x => x.id === ent.id); if (t) t.ac = n; });
    });
    c.appendChild(inp);
    return c;
  }
  if (field === 'vis') {
    const c = hEl('div', 'combat-cell combat-cell-vis');
    const btn = hEl('button', 'combat-vis-btn vis-' + ent.visibility, WG_VIS_GLYPH[ent.visibility]);
    btn.title = combatVisLabel(ent.visibility);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      mutateEncounter((enc) => {
        const t = enc.entities.find(x => x.id === ent.id); if (!t) return;
        const i = WG_VIS_CYCLE.indexOf(t.visibility);
        t.visibility = WG_VIS_CYCLE[(i + 1) % WG_VIS_CYCLE.length];
      });
    });
    c.appendChild(btn);
    return c;
  }
  if (field === 'del') {
    const c = hEl('div', 'combat-cell combat-cell-del');
    const btn = hEl('button', 'combat-del-btn', '×');
    btn.title = ct('combat.delete');
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      mutateEncounter((enc) => {
        enc.entities = enc.entities.filter(x => x.id !== ent.id);
        if (enc.activeId === ent.id) enc.activeId = enc.entities.length ? null : null;
      });
    });
    c.appendChild(btn);
    return c;
  }
  return hEl('div', 'combat-cell');
}

const WG_COMBAT_FIELDS = ['portrait', 'name', 'init', 'hp', 'ac', 'vis', 'del'];

// DM-tabel (volledige tracker).
function combatBuildDmTable(root, enc, widgetIdx, transpose) {
  const sorted = combatSortEntities(enc.entities);
  const table = hEl('div', 'combat-table' + (transpose ? ' transposed' : ''));
  if (!sorted.length) {
    table.appendChild(hEl('div', 'combat-empty', ct('combat.empty.dm')));
    root.appendChild(table);
    return;
  }
  if (!transpose) {
    const head = hEl('div', 'combat-row combat-head');
    WG_COMBAT_FIELDS.forEach(f => head.appendChild(hEl('div', 'combat-cell combat-head-cell combat-head-' + f, combatFieldLabel(f))));
    table.appendChild(head);
    sorted.forEach(ent => {
      // KO (0 HP): monster-rij dimt (KO = goed nieuws voor de DM); pc/npc-rij
      // valt juist op (KO van een bondgenoot is doorgaans slecht) — zónder amber.
      const ko = ent.currentHP <= 0;
      const koCls = ko ? (ent.kind === 'monster' ? ' combat-row-ko-monster' : ' combat-row-ko-ally') : '';
      const row = hEl('div', 'combat-row' + (enc.running && enc.activeId === ent.id ? ' is-active' : '') + koCls);
      WG_COMBAT_FIELDS.forEach(f => row.appendChild(combatCell(f, ent, widgetIdx)));
      table.appendChild(row);
    });
  } else {
    // Transpose: één rij per veld, één kolom per entity.
    WG_COMBAT_FIELDS.forEach(f => {
      const row = hEl('div', 'combat-row');
      row.appendChild(hEl('div', 'combat-cell combat-head-cell combat-head-' + f, combatFieldLabel(f)));
      sorted.forEach(ent => {
        const cell = combatCell(f, ent, widgetIdx);
        if (enc.running && enc.activeId === ent.id) cell.classList.add('col-active');
        row.appendChild(cell);
      });
      table.appendChild(row);
    });
  }
  root.appendChild(table);
}

// Speler-variant: alleen niet-verborgen, portret+naam, op volgorde, actieve gemarkeerd.
function combatBuildPlayerList(root, enc, transpose) {
  const visible = combatSortEntities(enc.entities.filter(e => e.visibility !== 'hidden'));
  const list = hEl('div', 'combat-initiative' + (transpose ? ' horizontal' : ''));
  if (!visible.length) {
    list.appendChild(hEl('div', 'combat-empty', enc.running ? ct('combat.empty.novisible') : ct('combat.empty.nofight')));
    root.appendChild(list);
    return;
  }
  visible.forEach(ent => {
    const masked = ent.visibility === 'silhouette';
    const item = hEl('div', 'combat-init-item' + (enc.running && enc.activeId === ent.id ? ' is-active' : '') + (masked ? ' masked' : ''));
    item.appendChild(combatPortraitNode(ent, masked));
    item.appendChild(hEl('span', 'combat-init-name', masked ? '??' : (ent.name || '')));
    list.appendChild(item);
  });
  root.appendChild(list);
}

// Hoofd-render — aangeroepen door drawWidgetOnDashboard voor kind 'combat'.
function drawCombatTable(g, widget, x, contentY, w, contentH, widgetIdx) {
  if (w <= 0 || contentH <= 0) return;
  const mode = combatMode(widget);
  const transpose = !!(widget.cfg && widget.cfg.transpose);
  const enc = getEncounter();

  const fo = el('foreignObject', { x: x, y: contentY, width: w, height: contentH });
  const root = document.createElement('div');
  root.setAttribute('xmlns', WG_XHTML_NS);
  root.className = 'combat-root combat-mode-' + mode;
  // Combat-interacties mogen de canvas-drag-arbiter niet triggeren.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());

  // Header
  const header = hEl('div', 'combat-header');
  const roundPill = hEl('div', 'combat-round', enc.running ? (ct('combat.round') + ' ' + enc.round) : (mode === 'dm' ? ct('combat.notstarted') : ct('combat.initiative')));
  header.appendChild(roundPill);

  if (mode === 'dm') {
    const controls = hEl('div', 'combat-controls');
    const startBtn = hEl('button', 'combat-ctrl-btn' + (enc.running ? ' active' : ''), enc.running ? ct('combat.stop') : ct('combat.start'));
    startBtn.addEventListener('click', (e) => { e.stopPropagation(); combatToggleRunning(); });
    const prevBtn = hEl('button', 'combat-ctrl-btn', '▲');
    prevBtn.title = ct('combat.prevturn');
    prevBtn.disabled = !enc.running;
    prevBtn.addEventListener('click', (e) => { e.stopPropagation(); combatAdvanceTurn(-1); });
    const nextBtn = hEl('button', 'combat-ctrl-btn', '▼');
    nextBtn.title = ct('combat.nextturn');
    nextBtn.disabled = !enc.running;
    nextBtn.addEventListener('click', (e) => { e.stopPropagation(); combatAdvanceTurn(1); });
    const addBtn = hEl('button', 'combat-ctrl-btn combat-add-btn', ct('combat.addparticipant'));
    addBtn.addEventListener('click', (e) => { e.stopPropagation(); showCombatAddPanel(e.clientX, e.clientY); });
    controls.appendChild(startBtn);
    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    controls.appendChild(addBtn);
    header.appendChild(controls);
  }
  root.appendChild(header);

  const body = hEl('div', 'combat-body');
  if (mode === 'dm') combatBuildDmTable(body, enc, widgetIdx, transpose);
  else combatBuildPlayerList(body, enc, transpose);
  root.appendChild(body);

  fo.appendChild(root);
  g.appendChild(fo);
}

// ---- Turn-control ----
function combatToggleRunning() {
  mutateEncounter((enc) => {
    if (enc.running) { enc.running = false; enc.activeId = null; }
    else {
      enc.running = true; enc.round = 1;
      const sorted = combatSortEntities(enc.entities);
      enc.activeId = sorted.length ? sorted[0].id : null;
    }
  });
}
function combatAdvanceTurn(dir) {
  mutateEncounter((enc) => {
    if (!enc.running) return;
    const sorted = combatSortEntities(enc.entities);
    if (!sorted.length) { enc.activeId = null; return; }
    let idx = sorted.findIndex(e => e.id === enc.activeId);
    if (idx < 0) idx = 0;
    let next = idx + dir;
    if (next >= sorted.length) { next = 0; enc.round += 1; }
    else if (next < 0) { next = sorted.length - 1; enc.round = Math.max(1, enc.round - 1); }
    enc.activeId = sorted[next].id;
  });
}

// Keyboard: ↑/↓ verschuift de beurt zolang er een lopend gevecht is en de focus
// niet in een invoerveld zit. Eén keer binden.
let _combatKeysBound = false;
function combatBindKeys() {
  if (_combatKeysBound) return;
  _combatKeysBound = true;
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const enc = getEncounter();
    if (!enc.running) return;
    // Alleen actief als er een Combat Tracker (DM) op het dashboard staat.
    if (typeof state === 'undefined' || state.context !== 'dm') return;
    const hasTracker = (state.widgets || []).some(w => w && w.type === 'combatTracker');
    if (!hasTracker) return;
    const tag = (e.target && e.target.tagName) || '';
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(tag) || (e.target && e.target.isContentEditable)) return;
    e.preventDefault();
    combatAdvanceTurn(e.key === 'ArrowDown' ? 1 : -1);
  });
}
combatBindKeys();

// ===========================================================================
//  Add-deelnemer paneel (in-page, geen pop-up — kloon van .map-edit-popover)
// ===========================================================================
let _combatAddPanelEl = null;
let _combatAddTab = 'party';
function dismissCombatAddPanel() {
  if (_combatAddPanelEl) { _combatAddPanelEl.remove(); _combatAddPanelEl = null; }
}
function combatAddSources(tab) {
  if (tab === 'party') {
    let ids = [];
    try { if (typeof getPartyCharIds === 'function') ids = getPartyCharIds() || []; } catch (e) {}
    return ids.map(id => {
      const raw = WG_CHAR_CACHE[id] || {};
      const cfg = raw.config || {};
      return {
        key: id,
        name: cfg.name || raw.name || id,
        portrait: (raw.images && raw.images.portrait) || null,
        meta: WG_CHAR_STATUS[id] === 'ready' ? '' : ct('combat.loading'),
        make: () => {
          if (!WG_CHAR_CACHE[id] && typeof fetchCharacterData === 'function') {
            fetchCharacterData(id);
            const ent = { id: combatNewId(), kind: 'pc', ref: id, name: cfg.name || id, portrait: null, initiative: null, dexMod: 0, currentHP: 1, maxHP: 1, tempHP: 0, ac: 10, visibility: 'revealed' };
            return ent;
          }
          return combatEntityFromCharacter(id);
        },
      };
    });
  }
  if (tab === 'npcs') {
    let npcs = [];
    try { if (typeof getNPCData === 'function') npcs = (getNPCData().npcs) || []; } catch (e) {}
    return npcs.map(n => ({
      key: n.id || n.name,
      name: n.name || 'NPC',
      portrait: n.image || null,
      meta: (n.disposition && n.disposition !== 'unknown') ? n.disposition : '',
      make: () => combatEntityFromNpc(n),
    }));
  }
  // monsters
  let mons = [];
  try { if (typeof getLoreCatEntries === 'function') mons = getLoreCatEntries('monsters') || []; } catch (e) {}
  return mons.map(m => ({
    key: m.id || m.name,
    name: m.name || 'Monster',
    portrait: m.image || null,
    meta: m.cr ? ('CR ' + m.cr) : '',
    make: () => combatEntityFromMonster(m),
  }));
}
function showCombatAddPanel(clientX, clientY) {
  dismissCombatAddPanel();
  const pop = document.createElement('div');
  pop.className = 'map-edit-popover combat-add-panel';
  pop.style.left = (clientX + 8) + 'px';
  pop.style.top = (clientY + 8) + 'px';

  const tabs = hEl('div', 'combat-add-tabs');
  [['party', ct('combat.tab.party')], ['npcs', ct('combat.tab.npcs')], ['monsters', ct('combat.tab.monsters')]].forEach(([id, label]) => {
    const b = hEl('button', 'combat-add-tab' + (_combatAddTab === id ? ' active' : ''), label);
    b.addEventListener('click', (e) => { e.stopPropagation(); _combatAddTab = id; renderList(); pop.querySelectorAll('.combat-add-tab').forEach(t => t.classList.toggle('active', t.textContent === label)); });
    tabs.appendChild(b);
  });
  pop.appendChild(tabs);

  const listWrap = hEl('div', 'combat-add-list');
  pop.appendChild(listWrap);

  function renderList() {
    listWrap.innerHTML = '';
    const items = combatAddSources(_combatAddTab);
    if (!items.length) { listWrap.appendChild(hEl('div', 'combat-empty', ct('combat.empty.cat'))); return; }
    items.forEach(src => {
      const row = hEl('button', 'combat-add-item');
      const pic = hEl('div', 'combat-portrait small');
      const psrc = (src.portrait && typeof resolveImageSrc === 'function') ? resolveImageSrc(src.portrait) : (src.portrait || '');
      if (psrc) { const img = document.createElement('img'); img.src = psrc; img.alt = ''; if (_combatAddTab === 'party' && src.key && typeof portraitCropStyle === 'function') { const cs = portraitCropStyle(loadPortraitCrop(src.key)); if (cs) img.style.cssText += cs; } img.addEventListener('error', () => { img.replaceWith(combatInitialNode(src.name)); }); pic.appendChild(img); }
      else pic.appendChild(combatInitialNode(src.name));
      row.appendChild(pic);
      row.appendChild(hEl('span', 'combat-add-name', src.name));
      if (src.meta) row.appendChild(hEl('span', 'combat-add-meta', src.meta));
      row.addEventListener('click', (e) => {
        e.stopPropagation();
        const ent = src.make();
        if (ent) {
          mutateEncounter((enc) => { enc.entities.push(ent); });
          row.classList.add('added');
          setTimeout(() => row.classList.remove('added'), 600);
        }
      });
      listWrap.appendChild(row);
    });
  }
  renderList();

  const foot = hEl('div', 'mep-row');
  const close = hEl('button', 'btn-cancel', ct('combat.close'));
  close.addEventListener('click', (e) => { e.stopPropagation(); dismissCombatAddPanel(); });
  foot.appendChild(close);
  pop.appendChild(foot);

  // De .map-edit-popover styles zijn @scope (.character-page); hang het paneel
  // dáárin zodat de styling pakt (body-niveau zou ongestyled zijn).
  const scopeRoot = document.querySelector('.character-page') || document.body;
  scopeRoot.appendChild(pop);
  _combatAddPanelEl = pop;

  const pr = pop.getBoundingClientRect();
  if (pr.right > window.innerWidth - 8) pop.style.left = (window.innerWidth - pr.width - 8) + 'px';
  if (pr.bottom > window.innerHeight - 8) pop.style.top = Math.max(8, clientY - pr.height - 8) + 'px';

  const outside = (ev) => {
    if (_combatAddPanelEl && !_combatAddPanelEl.contains(ev.target)) {
      dismissCombatAddPanel();
      document.removeEventListener('mousedown', outside, true);
    }
  };
  document.addEventListener('mousedown', outside, true);
}

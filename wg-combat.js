// ===== wg-combat.js — Combat Tracker (DM) + Initiative Tracker (speler) =====
// A new widget `kind: 'combat'`. Two types share the renderer:
//   - combatTracker     → mode 'dm'     (full table, editable, turn control)
//   - initiativeTracker → mode 'player' (read-only public variant: portrait+name)
//
// The encounter DATA is NOT per-widget: it lives in localStorage key
// `dw_initiative` ↔ Firebase `dm/initiative` (already in the sync allowlist). The DM
// writes; all clients read live via the existing sync (sync.js child_changed
// on dw/dm → applyLeaves → renderApp). By setting localStorage BEFORE syncUpload
// the own Firebase echo is a no-op (changed===0, no re-mount flash).
// The widget is thus a live VIEW, not a data container; serialize only stores
// geometry + cfg.transpose.

const WG_VIS_CYCLE = ['hidden', 'silhouette', 'revealed'];
const WG_VIS_GLYPH = { hidden: '—', silhouette: '?', revealed: '◉' };
// i18n: labels are fetched at render time so a language switch (NL/EN)
// is picked up by the combat widget right away. ct() falls back to the key if t() is missing.
function ct(key) { return (typeof t === 'function') ? t(key) : key; }
function combatVisLabel(vis) { return ct('combat.vis.' + vis); }
function combatKindLabel(kind) { return ct('combat.kind.' + kind); }
function combatFieldLabel(field) {
  if (field === 'portrait' || field === 'del') return '';
  return ct('combat.col.' + field);
}

// ---- Encounter model (shared, auto-synced) ----
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
// Write encounter: localStorage FIRST (so the own sync echo gives changed===0),
// then syncUpload, then render. opts.render===false skips the render.
//
// CRUCIAL: Firebase strips `null` fields (and empty arrays) on save. If
// localStorage DOES keep those nulls, the own echo differs structurally → sync.js
// counts changed>0 → renderApp() remounts the whole dashboard on every HP/init edit.
// So we serialize with a replacer that drops null/undefined, so that the
// localStorage shape matches exactly what Firebase sends back (→ changed===0).
function combatStripNulls(k, v) {
  if (v === null || v === undefined) return undefined;
  // Firebase drops empty arrays/objects entirely → do the same locally.
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
// Initiative sort: high→low; null (not yet rolled) AT THE BOTTOM; tiebreak dexMod
// desc → kind (pc<npc<monster) → stable on id. JS sort is stable → null group
// keeps insertion order.
// #P0huIQ1: 'familiar' is a full fourth kind next to pc/npc/monster.
// Familiars belong to the party → they sort with the allies, are visible
// to players by default and get the ally KO style (not the dim style).
const WG_COMBAT_KINDS = ['pc', 'familiar', 'npc', 'monster'];
// Kind cycle on the badge — 'pc' is deliberately not in it: it hangs on a real
// character record (ent.ref) and must not accidentally become a monster.
const WG_KIND_CYCLE = ['familiar', 'npc', 'monster'];
function combatIsAlly(ent) { return !ent || ent.kind !== 'monster'; }

function combatSortEntities(list) {
  const kindOrder = (k) => {
    const i = WG_COMBAT_KINDS.indexOf(k);
    return i === -1 ? WG_COMBAT_KINDS.length : i;
  };
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

// ---- Entity factories from the sources ----
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
  const name = cfg.name || raw.name || combatCapId(charId);
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
// kind: 'monster' (default) or 'familiar' — same statblock source, but a
// familiar is an ally: it starts visible instead of hidden.
function combatEntityFromMonster(m, kind) {
  const hp = parseLeadingInt(m.hp, 1);
  const k = (kind === 'familiar') ? 'familiar' : 'monster';
  return {
    id: combatNewId(), kind: k, ref: m.id || null, name: m.name || (k === 'familiar' ? 'Familiar' : 'Monster'),
    portrait: m.image || null, initiative: null, dexMod: dexModFromAbilities(m.abilities),
    currentHP: hp, maxHP: hp, tempHP: 0, ac: parseLeadingInt(m.ac, 10),
    cr: (m.cr != null && m.cr !== '') ? String(m.cr) : null,
    visibility: (k === 'familiar') ? 'revealed' : 'hidden',
  };
}

// ---- Encounter difficulty (2024 DMG: XP budget per character) ----
const COMBAT_XP_BUDGET = [null,
  [50, 75, 100], [100, 150, 200], [150, 225, 400], [250, 375, 500], [500, 750, 1100],
  [600, 1000, 1400], [750, 1300, 1700], [1000, 1700, 2100], [1300, 2000, 2600], [1600, 2300, 3100],
  [1900, 2900, 4100], [2200, 3700, 4700], [2600, 4200, 5400], [2900, 4900, 6200], [3300, 5400, 7800],
  [3800, 6100, 9800], [4500, 7200, 11700], [5000, 8700, 14200], [5500, 10700, 17200], [6400, 13200, 22000]];
const COMBAT_CR_XP = { '0': 10, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450, '3': 700, '4': 1100, '5': 1800,
  '6': 2300, '7': 2900, '8': 3900, '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500,
  '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000, '21': 33000, '22': 41000,
  '23': 50000, '24': 62000, '25': 75000, '26': 90000, '27': 105000, '28': 120000, '29': 135000, '30': 155000 };
function combatEntityCr(ent) {
  if (ent.cr != null && ent.cr !== '') return String(ent.cr).trim();
  if (!ent.ref) return null;
  const db = (typeof monsterDbGet === 'function') ? monsterDbGet(ent.ref) : null;
  if (db && db.cr != null) return String(db.cr);
  let mons = [];
  try { if (typeof getLoreCatEntries === 'function') mons = getLoreCatEntries('monsters') || []; } catch (e) {}
  const m = mons.find(x => x && x.id === ent.ref);
  return (m && m.cr != null && m.cr !== '') ? String(m.cr).trim() : null;
}
function combatPcLevel(ent) {
  const raw = (typeof WG_CHAR_CACHE !== 'undefined' && WG_CHAR_CACHE[ent.ref]) || null;
  const lvl = raw && raw.state && raw.state.level;
  if (lvl) return lvl;
  const party = parseInt(localStorage.getItem('dw_party_level'), 10);
  return party >= 1 && party <= 20 ? party : 1;
}
// null when there are no player characters or no monsters with a known CR.
function combatDifficulty(enc) {
  const pcs = enc.entities.filter(e => e.kind === 'pc');
  const foes = enc.entities.filter(e => e.kind === 'monster');
  if (!pcs.length || !foes.length) return null;
  const budget = [0, 0, 0];
  pcs.forEach(p => { const b = COMBAT_XP_BUDGET[Math.min(20, Math.max(1, combatPcLevel(p)))]; budget[0] += b[0]; budget[1] += b[1]; budget[2] += b[2]; });
  let xp = 0, unknown = 0;
  foes.forEach(f => { const cr = combatEntityCr(f); const v = cr != null ? COMBAT_CR_XP[cr] : undefined; if (v === undefined) unknown++; else xp += v; });
  if (unknown === foes.length) return null;
  const tier = xp > budget[2] ? 'above' : xp > budget[1] ? 'high' : xp > budget[0] ? 'moderate' : 'low';
  return { xp, budget, tier, unknown, pcs: pcs.length };
}
function combatDifficultyPill(enc) {
  const d = combatDifficulty(enc);
  if (!d) return null;
  const label = { low: 'Low', moderate: 'Moderate', high: 'High', above: 'Above High' }[d.tier];
  const pill = hEl('div', 'combat-diff combat-diff-' + d.tier, label + ' · ' + d.xp.toLocaleString('en') + ' XP');
  const lines = [
    'Monster XP: ' + d.xp.toLocaleString('en'),
    'Budget for ' + d.pcs + ' character' + (d.pcs === 1 ? '' : 's') + ':',
    'Low ' + d.budget[0].toLocaleString('en') + ' · Moderate ' + d.budget[1].toLocaleString('en') + ' · High ' + d.budget[2].toLocaleString('en'),
  ];
  if (d.unknown) lines.push('', d.unknown + ' monster' + (d.unknown === 1 ? ' has' : 's have') + ' no CR and ' + (d.unknown === 1 ? 'is' : 'are') + ' not counted.');
  lines.push('', 'XP budget per character from the 2024 DMG. NPCs and familiars are not counted.');
  pill.setAttribute('data-tip-title', 'Encounter difficulty');
  pill.setAttribute('data-tip-body', lines.join('\n'));
  return pill;
}

// Make sure a character record is in the cache before we snapshot an entity
// from it. Without this an uncached character got a placeholder snapshot
// (name = lowercase id, portrait null, HP 1, AC 10) that never updated → the
// image/name/HP were only correct after removing + re-adding.
async function combatEnsureChar(id) {
  if (!id || WG_CHAR_CACHE[id]) return;
  if (typeof fetchCharacterData !== 'function') return;
  try { await fetchCharacterData(id); } catch (e) {}
  // If a fetch was already 'loading', fetchCharacterData returns immediately without
  // waiting → poll briefly until the cache is filled (or errored).
  for (let i = 0; i < 60 && !WG_CHAR_CACHE[id] &&
       (typeof WG_CHAR_STATUS === 'undefined' || WG_CHAR_STATUS[id] !== 'error'); i++) {
    await new Promise(r => setTimeout(r, 50));
  }
}

// Identity (name + portrait) of a PC entity is NOT frozen combat state:
// it should always follow the real character. So resolve at render time
// from the cache (also heals old placeholder snapshots once the data arrives).
// HP/AC remain a snapshot (deliberate choice).
// Capitalise a character id for use as a name fallback (character without
// config.name → "ancha" becomes "Ancha"). Doesn't touch real names.
function combatCapId(id) {
  const s = String(id || '');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
function combatDisplayName(ent) {
  if (!ent) return '';
  if (ent.kind === 'pc' && ent.ref && WG_CHAR_CACHE[ent.ref]) {
    const c = WG_CHAR_CACHE[ent.ref].config;
    if (c && c.name) return c.name;
  }
  let nm = ent.name || '';
  // id fallback (old placeholder snapshot, or character without name) → capitalise.
  if (!nm || nm === ent.ref) nm = combatCapId(ent.ref || nm);
  return nm;
}
function combatDisplayPortrait(ent) {
  if (ent && ent.kind === 'pc' && ent.ref && WG_CHAR_CACHE[ent.ref]) {
    const im = WG_CHAR_CACHE[ent.ref].images;
    if (im && im.portrait) return im.portrait;
  }
  return (ent && ent.portrait) || null;
}

// ---- HP mutations (temp HP first on damage; heal never touches temp) ----
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
  combatSyncConcentration(ent);
}
function combatSetHp(ent, val) {
  if (typeof val !== 'number' || isNaN(val)) return;
  ent.currentHP = Math.max(0, Math.min(ent.maxHP, Math.round(val)));
  combatSyncConcentration(ent);
}
// Spells a PC is maintaining (state.activeEffects, wg-turn.js), as small chips:
// only a symbol and the rounds left; hover shows the spell and its countdown.
function combatEffectList(ent) {
  if (!ent || ent.kind !== 'pc' || !ent.ref || typeof wgxActiveEffects !== 'function') return [];
  try { return wgxActiveEffects(wgxLiveCharState(ent.ref)); } catch (e) { return []; }
}
function combatEffectChips(ent) {
  return combatEffectList(ent).map(x => {
    const chip = hEl('span', 'combat-fx' + (x.eff.conc ? ' is-conc' : ''), (x.eff.conc ? '◆' : '✦') + wgxEffectShort(x).replace(' rnd', ''));
    const tip = wgxEffectTip(x);
    chip.setAttribute('data-tip-title', tip.title);
    chip.setAttribute('data-tip-body', tip.body);
    return chip;
  });
}
// Concentration from a cast spell when nobody typed one in the tracker.
function combatDerivedConcentration(ent) {
  const c = combatEffectList(ent).filter(x => x.eff.conc)[0];
  return c ? c.eff.spell : '';
}

// RAW: at 0 HP you become Unconscious and thereby lose concentration. The
// tracker therefore clears the field itself as soon as someone drops.
function combatSyncConcentration(ent) {
  if (ent && ent.concentration && ent.currentHP <= 0) ent.concentration = '';
}
// HP tier based on (current + temp) / max. Determines the colour of the HP box:
//   ok  : >50%  (green)
//   warn: 25–50% (orange)
//   crit: 0–25%  (red)
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
  const portrait = combatDisplayPortrait(ent);
  const dispName = combatDisplayName(ent);
  const src = (!masked && portrait && typeof resolveImageSrc === 'function')
    ? resolveImageSrc(portrait) : (masked ? '' : (portrait || ''));
  if (src) {
    const img = document.createElement('img');
    img.src = src; img.alt = '';
    // PC portraits follow the same profile-photo crop as everywhere else (#fATDUg).
    if (!masked && ent.kind === 'pc' && ent.ref && typeof portraitCropStyle === 'function') {
      const cs = portraitCropStyle(loadPortraitCrop(ent.ref));
      if (cs) img.style.cssText += cs;
    }
    img.addEventListener('error', () => {
      if (img.parentNode) img.parentNode.replaceChild(combatInitialNode(masked ? '?' : dispName), img);
    });
    wrap.appendChild(img);
  } else {
    wrap.appendChild(combatInitialNode(masked ? '?' : dispName));
  }
  return wrap;
}
function combatInitialNode(name) {
  const s = hEl('span', 'combat-portrait-empty', (String(name || '?').charAt(0) || '?').toUpperCase());
  return s;
}

// Small stepper: [−] <input> [+]. onStep(delta), onSet(absoluteOrDelta).
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

// Build one cell node for a field of an entity (shared by normal+transpose).
function combatCell(field, ent, widgetIdx) {
  if (field === 'portrait') {
    const c = hEl('div', 'combat-cell combat-cell-portrait');
    c.appendChild(combatPortraitNode(ent, false));
    return c;
  }
  if (field === 'name') {
    const c = hEl('div', 'combat-cell combat-cell-name');
    const inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'combat-name-input'; inp.value = combatDisplayName(ent);
    inp.addEventListener('pointerdown', (e) => e.stopPropagation());
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); });
    inp.addEventListener('blur', () => {
      const v = inp.value.trim();
      if (v && v !== ent.name) mutateEncounter((enc) => { const t = enc.entities.find(x => x.id === ent.id); if (t) t.name = v; });
    });
    // #P0huIQ1: for everything except a PC the badge is a button that cycles through the
    // kinds (familiar → npc → monster). This lets you turn an already added
    // monster into a familiar without having to add it again.
    const cycles = (ent.kind !== 'pc');
    const kind = hEl(cycles ? 'button' : 'span', 'combat-kind-badge combat-kind-' + ent.kind + (cycles ? ' is-cycle' : ''), combatKindLabel(ent.kind) || '');
    if (cycles) {
      kind.title = ct('combat.kind.cycle');
      kind.addEventListener('pointerdown', (e) => e.stopPropagation());
      kind.addEventListener('click', (e) => {
        e.stopPropagation();
        mutateEncounter((enc) => {
          const t = enc.entities.find(x => x.id === ent.id); if (!t) return;
          const i = WG_KIND_CYCLE.indexOf(t.kind);
          t.kind = WG_KIND_CYCLE[(i + 1) % WG_KIND_CYCLE.length];
          // A familiar belongs to the party → make it visible by default.
          if (t.kind === 'familiar' && t.visibility === 'hidden') t.visibility = 'revealed';
        });
      });
    }
    const meta = hEl('div', 'combat-name-meta');
    meta.appendChild(kind);
    combatEffectChips(ent).forEach(ch => meta.appendChild(ch));
    c.appendChild(inp); c.appendChild(meta);
    return c;
  }
  // #P0ihGxA: concentration — free text with the spell being concentrated on.
  // Empty = no concentration. The player tracker shows it badge-only,
  // so the table sees who is keeping something up (and what) without DM rights.
  if (field === 'conc') {
    const c = hEl('div', 'combat-cell combat-cell-conc');
    const inp = document.createElement('input');
    inp.type = 'text';
    const derived = ent.concentration ? '' : combatDerivedConcentration(ent);
    inp.className = 'combat-conc-input' + (ent.concentration || derived ? ' active' : '');
    inp.value = ent.concentration || '';
    inp.placeholder = derived || ct('combat.conc.placeholder');
    inp.title = ent.concentration ? (ct('combat.conc.on') + ': ' + ent.concentration) : ct('combat.conc.none');
    inp.addEventListener('pointerdown', (e) => e.stopPropagation());
    inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') inp.blur(); });
    inp.addEventListener('blur', () => {
      const v = inp.value.trim();
      if (v === (ent.concentration || '')) return;
      mutateEncounter((enc) => { const t = enc.entities.find(x => x.id === ent.id); if (t) t.concentration = v; });
    });
    c.appendChild(inp);
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

const WG_COMBAT_FIELDS = ['portrait', 'name', 'init', 'hp', 'ac', 'conc', 'vis', 'del'];

// DM table (full tracker).
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
      // KO (0 HP): monster row dims (KO = good news for the DM); pc/npc row
      // stands out instead (an ally KO is usually bad) — without amber.
      const ko = ent.currentHP <= 0;
      const koCls = ko ? (combatIsAlly(ent) ? ' combat-row-ko-ally' : ' combat-row-ko-monster') : '';
      const row = hEl('div', 'combat-row' + (enc.running && enc.activeId === ent.id ? ' is-active' : '') + koCls);
      WG_COMBAT_FIELDS.forEach(f => row.appendChild(combatCell(f, ent, widgetIdx)));
      table.appendChild(row);
    });
  } else {
    // Transpose: one row per field, one column per entity.
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

// Player variant: only non-hidden, portrait+name, in order, active one highlighted.
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
    const ko = ent.currentHP <= 0;
    const item = hEl('div', 'combat-init-item'
      + (enc.running && enc.activeId === ent.id ? ' is-active' : '')
      + (masked ? ' masked' : '')
      + (ko && !masked ? (combatIsAlly(ent) ? ' ko-ally' : ' ko-monster') : ''));

    // #P0ihGxA: the player tracker only showed portrait + name while the DM table
    // shows everything. Now: initiative, name + kind, HP status and concentration.
    // A silhouette stays fully masked — that is the whole fog-of-war function.
    item.appendChild(hEl('span', 'combat-init-order', ent.initiative == null ? '—' : String(ent.initiative)));
    item.appendChild(combatPortraitNode(ent, masked));

    const idBlock = hEl('div', 'combat-init-id');
    idBlock.appendChild(hEl('span', 'combat-init-name', masked ? '??' : combatDisplayName(ent)));
    if (!masked) idBlock.appendChild(hEl('span', 'combat-kind-badge combat-kind-' + ent.kind, combatKindLabel(ent.kind) || ''));
    item.appendChild(idBlock);

    if (!masked) {
      // HP: exact numbers only for allies (they're already on the table's
      // character sheets anyway). A monster only reveals its tier,
      // so the DM doesn't give away a statblock via the player widget.
      const tier = combatHpTier(ent);
      const hpBox = hEl('span', 'combat-init-hp hp-' + tier);
      if (ent.kind === 'pc' || ent.kind === 'familiar') {
        hpBox.textContent = ent.currentHP + '/' + ent.maxHP + (ent.tempHP > 0 ? ' +' + ent.tempHP : '');
      } else {
        hpBox.textContent = ct('combat.tier.' + tier);
      }
      item.appendChild(hpBox);

      const concName = ent.concentration || combatDerivedConcentration(ent);
      if (concName) {
        const conc = hEl('span', 'combat-init-conc', '◎ ' + concName);
        conc.title = ct('combat.conc.on') + ': ' + concName;
        item.appendChild(conc);
      }
      combatEffectChips(ent).filter(ch => !ch.classList.contains('is-conc')).forEach(ch => item.appendChild(ch));
    }
    list.appendChild(item);
  });
  root.appendChild(list);
}

// Main render — called by drawWidgetOnDashboard for kind 'combat'.
function drawCombatTable(g, widget, x, contentY, w, contentH, widgetIdx) {
  if (w <= 0 || contentH <= 0) return;
  const mode = combatMode(widget);
  const transpose = !!(widget.cfg && widget.cfg.transpose);
  const enc = getEncounter();

  // Very old/placeholder PC entities: warm the character cache so name +
  // portrait (combatDisplayName/Portrait) resolve. Guarded on WG_CHAR_STATUS
  // so a 'loading'/'ready'/'error' doesn't re-fetch on every render.
  if (typeof fetchCharacterData === 'function' && Array.isArray(enc.entities)) {
    enc.entities.forEach(e => {
      if (!e || e.kind !== 'pc' || !e.ref || WG_CHAR_CACHE[e.ref]) return;
      const st = (typeof WG_CHAR_STATUS !== 'undefined') ? WG_CHAR_STATUS[e.ref] : null;
      if (st === 'loading' || st === 'ready' || st === 'error') return;
      fetchCharacterData(e.ref);
    });
  }

  const fo = el('foreignObject', { x: x, y: contentY, width: w, height: contentH });
  const root = document.createElement('div');
  root.setAttribute('xmlns', WG_XHTML_NS);
  root.className = 'combat-root combat-mode-' + mode + (widget._combatFits ? ' combat-fitted' : '');
  root.setAttribute('data-widget-idx', String(widgetIdx));
  // Combat interactions must not trigger the canvas drag arbiter.
  root.addEventListener('pointerdown', (e) => e.stopPropagation());

  // Header
  const header = hEl('div', 'combat-header');
  const roundPill = hEl('div', 'combat-round', enc.running ? (ct('combat.round') + ' ' + enc.round) : (mode === 'dm' ? ct('combat.notstarted') : ct('combat.initiative')));
  header.appendChild(roundPill);
  if (mode === 'dm') { const diff = combatDifficultyPill(enc); if (diff) header.appendChild(diff); }

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

// ---- Size measurement ----
// After a render, measure what each combat widget really needs: the natural
// height of header + rows and the narrowest width that still shows everything
// (normal table/list: max-content; transposed/horizontal: one column, the rest
// wraps). Stored on the widget as _combatM, in the same units as
// widgetPxWFor / widgetContentPxHFor, so the fit no longer relies on estimates.
function combatMeasureRoot(root, widget) {
  const fo = root.parentNode;
  const header = root.querySelector('.combat-header');
  const body = root.querySelector('.combat-body');
  const content = body && body.firstElementChild;
  if (!fo || !header || !content || !root.isConnected) return null;
  const px = (cs, p) => parseFloat(cs[p]) || 0;
  const hcs = getComputedStyle(header), bcs = getComputedStyle(body), ccs = getComputedStyle(content);

  const kids = Array.from(header.children);
  let headerW = px(hcs, 'paddingLeft') + px(hcs, 'paddingRight') + Math.max(0, kids.length - 1) * px(hcs, 'columnGap');
  kids.forEach(k => { headerW += k.scrollWidth; });

  const transpose = !!(widget.cfg && widget.cfg.transpose);
  const saved = content.getAttribute('style');
  content.style.height = 'auto';
  content.style.justifyContent = 'flex-start';
  const natH = content.offsetHeight;
  content.style.width = transpose ? 'min-content' : 'max-content';
  const natW = content.offsetWidth;
  if (saved == null) content.removeAttribute('style'); else content.setAttribute('style', saved);

  const rows = Array.from(content.children).filter(c => !c.classList.contains('combat-head') && !c.classList.contains('combat-empty'));
  const rowH = rows.length ? rows.reduce((t, r) => t + r.offsetHeight, 0) / rows.length : 0;
  const scrollbar = Math.max(0, body.offsetWidth - body.clientWidth);
  const padW = px(bcs, 'paddingLeft') + px(bcs, 'paddingRight') + scrollbar;
  const padH = px(bcs, 'paddingTop') + px(bcs, 'paddingBottom');
  const foW = parseFloat(fo.getAttribute('width')) || 0;
  const foH = parseFloat(fo.getAttribute('height')) || 0;
  const dW = widgetPxWFor(widget.spanUnits) - foW;
  const dH = widgetContentPxHFor(widget.spanUnitsY) - foH;
  return {
    key: combatMode(widget) + (transpose ? '-t' : ''),
    n: rows.length,
    minW: Math.ceil(Math.max(headerW, natW + padW) + dW + 2),
    needH: Math.ceil(header.offsetHeight + padH + natH + dH + 1),
    perRow: rowH + px(ccs, 'rowGap'),
  };
}

// Returns true when a measurement changed (the caller re-renders once more).
function combatMeasureWidgets() {
  let changed = false;
  document.querySelectorAll('#canvas .combat-root[data-widget-idx]').forEach(root => {
    const w = state.widgets[parseInt(root.getAttribute('data-widget-idx'), 10)];
    if (!w) return;
    const m = combatMeasureRoot(root, w);
    if (!m) return;
    const o = w._combatM;
    if (!o || o.key !== m.key || o.n !== m.n || Math.abs(o.minW - m.minW) > 1 || Math.abs(o.needH - m.needH) > 1) {
      w._combatM = m;
      changed = true;
    }
  });
  return changed;
}

// ---- Turn control ----
function combatToggleRunning() {
  mutateEncounter((enc) => {
    if (enc.running) { enc.running = false; enc.activeId = null; }
    else {
      enc.running = true; enc.round = 1;
      enc.startedAt = Date.now();   // fight id: spell effects count rounds per fight (wg-turn.js)
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

// Keyboard: ↑/↓ shifts the turn as long as a fight is running and the focus
// is not in an input field. Bind once.
let _combatKeysBound = false;
function combatBindKeys() {
  if (_combatKeysBound) return;
  _combatKeysBound = true;
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    const enc = getEncounter();
    if (!enc.running) return;
    // Only active if there is a Combat Tracker (DM) on the dashboard.
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
//  Add-participant panel (in-page, no pop-up — clone of .map-edit-popover)
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
        name: cfg.name || raw.name || combatCapId(id),
        portrait: (raw.images && raw.images.portrait) || null,
        meta: WG_CHAR_STATUS[id] === 'ready' ? '' : ct('combat.loading'),
        // ensure() fetches the character data before we snapshot; make()
        // then builds the entity from the (now warm) cache → correct name/portrait/HP/AC.
        ensure: () => combatEnsureChar(id),
        make: () => combatEntityFromCharacter(id),
      };
    });
  }
  // Monster Manual (SRD 5.2): straight from the lazy-loaded database, no Creature entry needed.
  if (tab === 'srd') {
    const db = (typeof monsterDbList === 'function') ? monsterDbList() : [];
    return db.map(m => ({
      key: 'srd:' + m.id,
      name: m.name,
      portrait: null,
      meta: 'CR ' + m.cr,
      search: (m.name + ' ' + m.mtype).toLowerCase(),
      make: () => combatEntityFromMonster(m, 'monster'),
    }));
  }
  let mons = [];
  try { if (typeof getLoreCatEntries === 'function') mons = getLoreCatEntries('monsters') || []; } catch (e) {}
  // #OvywGWk: one Creatures source (lore category 'monsters', incl. migrated
  // NPCs) instead of separate NPC and monster lists → no more duplicate names.
  // Default kind: hostile = monster, otherwise npc; the DM can switch it via the badge.
  if (tab === 'creatures') {
    return mons.filter(Boolean).map(m => ({
      key: m.id || m.name,
      name: m.name || 'Creature',
      portrait: m.image || null,
      meta: [m.cr ? ('CR ' + m.cr) : '', (m.disposition && m.disposition !== 'unknown') ? m.disposition : ''].filter(Boolean).join(' · '),
      make: () => (m.disposition === 'hostile') ? combatEntityFromMonster(m, 'monster') : combatEntityFromNpc(m),
    }));
  }
  // familiars: same statblock source, only kind 'familiar'. This lets you add an Owl
  // or Imp as a familiar to the initiative without separate data entry.
  const asFamiliar = (tab === 'familiars');
  return mons.filter(Boolean).map(m => ({
    key: m.id || m.name,
    name: m.name || (asFamiliar ? 'Familiar' : 'Monster'),
    portrait: m.image || null,
    meta: m.cr ? ('CR ' + m.cr) : '',
    make: () => combatEntityFromMonster(m, asFamiliar ? 'familiar' : 'monster'),
  }));
}
function showCombatAddPanel(clientX, clientY) {
  dismissCombatAddPanel();
  const pop = document.createElement('div');
  pop.className = 'map-edit-popover combat-add-panel';
  pop.style.left = (clientX + 8) + 'px';
  pop.style.top = (clientY + 8) + 'px';

  const tabs = hEl('div', 'combat-add-tabs');
  [['party', ct('combat.tab.party')], ['familiars', ct('combat.tab.familiars')], ['creatures', ct('combat.tab.creatures')], ['srd', ct('combat.tab.srd')]].forEach(([id, label]) => {
    const b = hEl('button', 'combat-add-tab' + (_combatAddTab === id ? ' active' : ''), label);
    b.dataset.tab = id;
    // Active marking on the tab id, not on the label: two tabs can get the same text
    // in a translation and then the comparison would break.
    b.addEventListener('click', (e) => { e.stopPropagation(); _combatAddTab = id; renderList(); pop.querySelectorAll('.combat-add-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id)); });
    tabs.appendChild(b);
  });
  pop.appendChild(tabs);

  const listWrap = hEl('div', 'combat-add-list');
  pop.appendChild(listWrap);

  let srdQuery = '';
  function renderList() {
    listWrap.innerHTML = '';
    let items = combatAddSources(_combatAddTab);
    if (_combatAddTab === 'srd') {
      if (typeof loadMonsterDb !== 'function') return;
      if (!window.DW_MONSTER_DB) {
        listWrap.appendChild(hEl('div', 'combat-empty', ct('combat.loading')));
        loadMonsterDb().then(() => { if (_combatAddTab === 'srd' && pop.isConnected) renderList(); },
          () => { listWrap.innerHTML = ''; listWrap.appendChild(hEl('div', 'combat-empty', 'Could not load the monster database.')); });
        return;
      }
      const q = hEl('input', 'edit-input combat-add-search');
      q.type = 'search'; q.placeholder = 'Search monsters…'; q.value = srdQuery;
      q.addEventListener('click', (e) => e.stopPropagation());
      q.addEventListener('input', () => {
        srdQuery = q.value;
        renderList();
        const nq = listWrap.querySelector('.combat-add-search');
        if (nq) { nq.focus(); nq.setSelectionRange(nq.value.length, nq.value.length); }
      });
      listWrap.appendChild(q);
      const needle = srdQuery.trim().toLowerCase();
      if (needle) items = items.filter(src => src.search.indexOf(needle) >= 0);
    }
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
      row.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (row._adding) return;          // double-click guard during async fetch
        row._adding = true;
        try {
          // First fetch any data (party chars) so the snapshot is correct.
          if (typeof src.ensure === 'function') {
            row.classList.add('loading');
            await src.ensure();
            row.classList.remove('loading');
          }
          const ent = src.make();
          if (ent) {
            mutateEncounter((enc) => { enc.entities.push(ent); });
            row.classList.add('added');
            setTimeout(() => row.classList.remove('added'), 600);
          }
        } finally {
          row._adding = false;
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

  // The .map-edit-popover styles are @scope (.character-page); attach the panel
  // inside it so the styling applies (body level would be unstyled).
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

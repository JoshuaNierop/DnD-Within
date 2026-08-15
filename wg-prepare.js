// wg-prepare.js — Prepared Spells widget + cast flow + Spell Slots widget +
// prepare-window (E5.5/2024).
//
// Prepared Spells: cantrips + prepared spells als info-box-lijst, 3 kolommen
// [level-badge | naam | micro-icons], per-rij hover/long-press-tooltip met
// volledige spell-details (casting time, range, components, duration,
// concentration, ritual, save-DC/attack, beschrijving). Kolom "naam" is
// klikbaar → cast-window met alle cast-opties: cantrip/at-will, gewone slots
// (incl. upcast naar hogere slot-levels), Warlock pact slots, ritual casting,
// en gratis casts via een gekoppelde resource (Favored Enemy → Hunter's Mark,
// Paladin's Smite → Divine Smite, species-spells). Casten verbruikt
// state.spellSlotsUsed[level] / pactSlotsUsed / de resource-teller.
//
// Spell Slots: compacte tracker-widget (rij per slot-level, pips). Klik = 1
// slot verbruiken; klik-bij-leeg = alles van dat level herstellen (zelfde
// semantiek als de Resources-widget; long rest reset alles automatisch).
//
// Load order: NA wg-state.js en NA wg-rest.js (wgxPatchState). Gebruikt
// app-core globals: DATA, getMod, getProfBonus, getSpellcastingAbility,
// getSpellSlots, getClassResources, en runtime: WG_CHAR_CACHE, state.

// ===== Registries =====
var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};
var WG_INFOBOX_CLICK_HANDLERS = (typeof WG_INFOBOX_CLICK_HANDLERS !== 'undefined') ? WG_INFOBOX_CLICK_HANDLERS : {};

// ===== Widget-types =====
Object.assign(WG_WIDGET_TYPES, {
  preparedSpells: {
    label: 'Prepared Spells', kind: 'infobox', source: 'prepared',
    spanUnits: 5, spanUnitsY: 6,
    cfg: { cellPadding: 6, widgetPadding: 6, infoBoxSpacing: 4, infoBoxPadding: 2 },
  },
  spellSlots: {
    label: 'Spell Slots', kind: 'infobox', source: 'slots',
    spanUnits: 4, spanUnitsY: 3,
    cfg: { cellPadding: 6, widgetPadding: 6, infoBoxSpacing: 4, infoBoxPadding: 2 },
  },
});
WG_EDIT_CONFIG.prepared = { mode: 'always', editColumnIdx: 1 }; // spell-naam klikbaar → cast
WG_EDIT_CONFIG.slots = { mode: 'always', editColumnIdx: 1 };    // pips klikbaar → spend
if (typeof WG_SOURCE_LABELS !== 'undefined') {
  WG_SOURCE_LABELS.prepared = 'Prepared Spells';
  WG_SOURCE_LABELS.slots = 'Spell Slots';
}

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
  return { dc: 8 + prof + mod, atk: prof + mod, ability: ability };
}

// ===== Slot-model per character =====
// Std casters: { kind:'std', totals:[n1..n9], used:{lvl:n} }.
// Warlock:     { kind:'pact', total, used, slotLevel }.
// Non-casters: { kind:'none' }.
function wgxSlotModel(raw) {
  const cfg = (raw && raw.config) || {};
  const st  = (raw && raw.state)  || {};
  const lvl = st.level || 1;
  if (cfg.className === 'warlock') {
    const wl = DATA.warlock || {};
    return {
      kind: 'pact',
      total: (wl.pactSlots || {})[lvl] || 0,
      used: st.pactSlotsUsed || 0,
      slotLevel: (wl.pactSlotLevel || {})[lvl] || 1,
    };
  }
  const totals = (typeof getSpellSlots === 'function')
    ? (getSpellSlots(cfg.className, lvl, cfg.subclass) || []) : [];
  let any = false;
  for (let i = 0; i < totals.length; i++) if (totals[i] > 0) any = true;
  if (!any) return { kind: 'none' };
  return { kind: 'std', totals: totals, used: st.spellSlotsUsed || {} };
}

// Resources (met uses over) die deze spell gratis kunnen casten.
function wgxFreeCastResources(cfg, st, spellName) {
  const list = (typeof getClassResources === 'function') ? getClassResources(cfg, st) : [];
  return list.filter(function (r) {
    return (r.spellNames || []).indexOf(spellName) !== -1;
  });
}

// ===== Tooltip-body opbouw (volledig: alle spell-metadata) =====
function wgxSpellTooltip(name, sp, stats) {
  const isCantrip = sp && sp.level === 0;
  const lvlLabel = sp ? (isCantrip ? 'Cantrip' : 'Level ' + sp.level) : '?';
  const title = name + ' · ' + lvlLabel;
  if (!sp) return { title: title, body: 'Unknown spell — no data available.' };
  const flags = [];
  if (wgxSpellIsConcentration(sp)) flags.push('Concentration');
  if (wgxSpellIsRitual(sp)) flags.push('Ritual');
  const body =
    'Casting time: ' + (sp.time || '—') + '\n' +
    'Range: ' + (sp.range || '—') + '\n' +
    'Components: ' + (sp.comp || '—') + '\n' +
    'Duration: ' + (sp.dur || '—') + (flags.length ? '\n' + flags.join(' · ') : '') + '\n\n' +
    (sp.desc || '—') + '\n\n' +
    'Spell save DC ' + stats.dc + ' · Spell attack +' + stats.atk +
    (isCantrip ? '' : '\nClick the spell to cast it.');
  return { title: title, body: body };
}

// ===== Gedeeld entry-model (builder + click-handler, 1:1 met rijen) =====
function wgxPreparedEntries(st) {
  const spellData = (typeof DATA !== 'undefined' && DATA.spellPool) || {};
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
  return entries;
}

// ===== Infobox-builder: Prepared Spells =====
function wgxBuildPrepared(widget) {
  const raw = WG_CHAR_CACHE[state.characterId] || {};
  const st  = raw.state || {};
  const d = widget.data, L = widget.layout;
  const stats = wgxSpellStats(raw);

  d.columns = [
    { key: 'lvl',   label: 'Lvl' },
    { key: 'name',  label: 'Spell' },
    { key: 'flags', label: '' },
  ];

  const entries = wgxPreparedEntries(st);
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
  // Laatste rij = ingang naar de prepare-window (ook zonder Long Rest bruikbaar).
  if (wgxIsCaster(raw)) {
    rows.push(['', '⚙ Change spells', '']);
    const prepTip = { title: 'Change prepared spells', body: 'Open the prepare window to change which spells you have prepared. This also opens automatically after a Long Rest.' };
    tips.push([prepTip, prepTip, prepTip]);
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

// Klik op een spell-rij → cast-window; klik op de laatste rij → prepare-window.
WG_INFOBOX_CLICK_HANDLERS.prepared = function (ctx) {
  const raw = ctx.raw || {};
  const entries = wgxPreparedEntries(raw.state || {});
  const e = entries[ctx.rowIdx];
  if (!e) { wgxOpenPrepareWindow(ctx.charId); return; }
  wgxOpenCastModal(ctx.charId, e.name);
};

// ===== Infobox-builder: Spell Slots =====
function wgxSlotRowModel(raw) {
  const sm = wgxSlotModel(raw);
  const rows = [];
  if (sm.kind === 'pact') {
    rows.push({ kind: 'pact', label: 'Pact Magic (lvl ' + sm.slotLevel + ')', total: sm.total, used: Math.min(sm.used, sm.total) });
  } else if (sm.kind === 'std') {
    for (let i = 0; i < sm.totals.length; i++) {
      if (!sm.totals[i]) continue;
      const lvl = i + 1;
      rows.push({ kind: 'std', level: lvl, label: 'Level ' + lvl, total: sm.totals[i], used: Math.min(sm.used[lvl] || 0, sm.totals[i]) });
    }
  }
  return rows;
}

function wgxBuildSlots(widget) {
  const raw = WG_CHAR_CACHE[state.characterId] || {};
  const d = widget.data, L = widget.layout;
  d.columns = [{ key: 'lvl', label: 'Slots' }, { key: 'pips', label: '' }];
  const model = wgxSlotRowModel(raw);
  const rows = [], tips = [];
  if (!model.length) {
    rows.push(['No spell slots', '']);
    tips.push(null);
  } else {
    for (const r of model) {
      const pips = (typeof wgxResourcePips === 'function') ? wgxResourcePips(r.used, r.total) : (r.total - r.used) + '/' + r.total;
      rows.push([r.label, pips]);
      const tip = {
        title: r.label + ' · ' + (r.total - r.used) + '/' + r.total,
        body: (r.kind === 'pact'
          ? 'Pact Magic: all your slots are level ' + (wgxSlotModel(raw).slotLevel) + '. They all return on a Short or Long Rest.'
          : 'Spell slots of level ' + r.level + '. All slots return on a Long Rest.') +
          '\n\nCasting a spell from the Prepared Spells widget spends these automatically. Click: spend 1 slot manually. When empty, click restores all (manual correction).',
      };
      tips.push([tip, tip]);
    }
  }
  d.rows = rows; d.tooltips = tips;
  L.columnHighlight = [false, false];
  L.columnAlign = ['left', 'right'];
  L.columnMaxChars = [14, null];
  L.columnAllCaps = [false, false];
  L.columnExtraClass = [null, null];
  L.columnMinWidthPx = [null, 40];
  L.columnFontScale = [1, 1];
  L.stacking = 'horizontal';
}
WG_EXTRA_INFOBOX_BUILDERS.slots = wgxBuildSlots;

WG_INFOBOX_CLICK_HANDLERS.slots = async function (ctx) {
  const raw = ctx.raw || {};
  const model = wgxSlotRowModel(raw);
  const r = model[ctx.rowIdx];
  if (!r) return;
  const next = (r.used >= r.total) ? 0 : r.used + 1;
  const patch = {};
  if (r.kind === 'pact') patch.pactSlotsUsed = next;
  else patch['spellSlotsUsed/' + r.level] = next;
  try {
    await wgxPatchState(ctx.charId, patch);
    showToast(r.label + ': ' + (r.total - next) + '/' + r.total + (next === 0 ? ' (restored)' : ''));
  } catch (err) {
    showToast('Update failed · ' + err.message, 'error');
  }
};

// ============================================================
// Cast-window (cast / upcast / free cast / ritual / cancel)
// ============================================================
var wgxCast = null; // { charId, name, sp }

function wgxOpenCastModal(charId, name) {
  const raw = WG_CHAR_CACHE[charId] || {};
  const sp = ((typeof DATA !== 'undefined' && DATA.spellPool) || {})[name] || null;
  wgxCast = { charId: charId, name: name, sp: sp };
  const host = document.createElement('div');
  host.className = 'wgx-cast-modal-active';
  host.innerHTML = '<div class="modal-overlay"><div class="modal-card wgx-cast-card"></div></div>';
  document.body.appendChild(host);
  host.addEventListener('click', wgxCastClick);
  wgxRenderCastModal();
}

function wgxCloseCastModal() {
  const el = document.querySelector('.wgx-cast-modal-active');
  if (el) el.remove();
  wgxCast = null;
}

function wgxCastEsc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wgxRenderCastModal() {
  const card = document.querySelector('.wgx-cast-card');
  if (!card || !wgxCast) return;
  const raw = WG_CHAR_CACHE[wgxCast.charId] || {};
  const cfg = raw.config || {}, st = raw.state || {};
  const sp = wgxCast.sp;
  const stats = wgxSpellStats(raw);
  const isCantrip = sp && sp.level === 0;
  const lvlLabel = sp ? (isCantrip ? 'Cantrip' : 'Level ' + sp.level) : '';
  const conc = sp && wgxSpellIsConcentration(sp);
  const ritual = sp && wgxSpellIsRitual(sp);

  let html = '<div class="modal-header"><h2>' + wgxCastEsc(wgxCast.name) +
    (lvlLabel ? ' <span class="wgx-cast-lvl">' + lvlLabel + '</span>' : '') + '</h2>' +
    '<button class="modal-close" data-wgx-cast="cancel">&times;</button></div>';
  html += '<div class="modal-body wgx-cast-body">';

  if (sp) {
    html += '<div class="wgx-cast-meta">' +
      '<span><b>Time</b> ' + wgxCastEsc(sp.time || '—') + '</span>' +
      '<span><b>Range</b> ' + wgxCastEsc(sp.range || '—') + '</span>' +
      '<span><b>Components</b> ' + wgxCastEsc(sp.comp || '—') + '</span>' +
      '<span><b>Duration</b> ' + wgxCastEsc(sp.dur || '—') + '</span>' +
      (conc ? '<span class="wgx-cast-flag">◆ Concentration</span>' : '') +
      (ritual ? '<span class="wgx-cast-flag">(R) Ritual</span>' : '') +
      '</div>';
    html += '<p class="wgx-cast-desc">' + wgxCastEsc(sp.desc || '') + '</p>';
    html += '<p class="wgx-cast-stats">Spell save DC <b>' + stats.dc + '</b> · Spell attack <b>+' + stats.atk + '</b></p>';
  } else {
    html += '<p class="wgx-cast-desc">Unknown spell — no data available. You can still track the cast manually via the Spell Slots widget.</p>';
  }

  // ===== Cast-opties =====
  html += '<h3 class="wgx-cast-h3">Cast</h3><div class="wgx-cast-opts">';
  let anyOption = false;

  if (isCantrip) {
    html += '<button class="wgx-cast-opt" data-wgx-cast="cantrip"><b>Cast</b><span>Cantrip — at will, no slot</span></button>';
    anyOption = true;
  }

  // Gratis casts via gekoppelde resources (Favored Enemy, Paladin's Smite, species-spells)
  const freeRes = sp ? wgxFreeCastResources(cfg, st, wgxCast.name) : [];
  for (let i = 0; i < freeRes.length; i++) {
    const r = freeRes[i];
    const max = r.max(cfg, st);
    const used = Math.min(st[r.stateKey] || 0, max);
    const left = max - used;
    html += '<button class="wgx-cast-opt" data-wgx-cast="resource" data-res="' + i + '"' + (left <= 0 ? ' disabled' : '') + '>' +
      '<b>Cast without a slot</b><span>' + wgxCastEsc(r.label) + ' — ' + left + '/' + max + ' left</span></button>';
    anyOption = true;
  }

  // Ritual casting (2024: prepared spell met Ritual-tag)
  if (ritual && !isCantrip) {
    html += '<button class="wgx-cast-opt" data-wgx-cast="ritual"><b>Cast as Ritual</b><span>No slot — casting time +10 minutes</span></button>';
    anyOption = true;
  }

  // Slots (std: per level vanaf spell-level = upcast; pact: vaste slot-level)
  if (sp && !isCantrip) {
    const sm = wgxSlotModel(raw);
    if (sm.kind === 'std') {
      for (let L = sp.level; L <= sm.totals.length; L++) {
        const total = sm.totals[L - 1] || 0;
        if (!total) continue;
        const used = Math.min(sm.used[L] || 0, total);
        const left = total - used;
        const upcast = L > sp.level;
        html += '<button class="wgx-cast-opt" data-wgx-cast="slot" data-level="' + L + '"' + (left <= 0 ? ' disabled' : '') + '>' +
          '<b>' + (upcast ? 'Upcast · level ' + L + ' slot' : 'Cast · level ' + L + ' slot') + '</b>' +
          '<span>' + left + '/' + total + ' slot' + (total > 1 ? 's' : '') + ' left</span></button>';
        anyOption = true;
      }
    } else if (sm.kind === 'pact') {
      if (sm.slotLevel >= sp.level && sm.total > 0) {
        const left = sm.total - Math.min(sm.used, sm.total);
        html += '<button class="wgx-cast-opt" data-wgx-cast="pact"' + (left <= 0 ? ' disabled' : '') + '>' +
          '<b>Cast · Pact slot (level ' + sm.slotLevel + ')</b><span>' + left + '/' + sm.total + ' left · returns on a Short Rest</span></button>';
        anyOption = true;
      }
    }
  }

  if (!anyOption) {
    html += '<p class="wgx-lu-note">No way to cast this right now — no matching spell slots. Take a rest, or track it manually via the Spell Slots widget.</p>';
  }
  html += '</div></div>';
  html += '<div class="wgx-lu-nav"><button class="wgx-lu-btn" data-wgx-cast="cancel">Cancel</button><span></span></div>';
  card.innerHTML = html;
}

function wgxCastClick(e) {
  if (!wgxCast) return;
  if (e.target.classList && e.target.classList.contains('modal-overlay')) { wgxCloseCastModal(); return; }
  const t = e.target.closest('[data-wgx-cast]');
  if (!t || t.disabled) return;
  const act = t.getAttribute('data-wgx-cast');
  if (act === 'cancel') { wgxCloseCastModal(); return; }
  wgxDoCast(act, t);
}

async function wgxDoCast(act, t) {
  const cast = wgxCast;
  const raw = WG_CHAR_CACHE[cast.charId] || {};
  const cfg = raw.config || {}, st = raw.state || {};
  const conc = cast.sp && wgxSpellIsConcentration(cast.sp) ? ' · Concentration' : '';
  const patch = {};
  let detail = '';
  try {
    if (act === 'cantrip') {
      detail = 'cantrip';
    } else if (act === 'ritual') {
      detail = 'ritual, no slot';
    } else if (act === 'resource') {
      const freeRes = wgxFreeCastResources(cfg, st, cast.name);
      const r = freeRes[parseInt(t.getAttribute('data-res'), 10)];
      if (!r) return;
      const max = r.max(cfg, st);
      const used = Math.min(st[r.stateKey] || 0, max);
      if (used >= max) return;
      patch[r.stateKey] = used + 1;
      detail = r.label + ', ' + (max - used - 1) + '/' + max + ' left';
    } else if (act === 'slot') {
      const L = parseInt(t.getAttribute('data-level'), 10);
      const sm = wgxSlotModel(raw);
      if (sm.kind !== 'std') return;
      const total = sm.totals[L - 1] || 0;
      const used = Math.min(sm.used[L] || 0, total);
      if (used >= total) return;
      patch['spellSlotsUsed/' + L] = used + 1;
      detail = 'level-' + L + ' slot, ' + (total - used - 1) + '/' + total + ' left';
    } else if (act === 'pact') {
      const sm = wgxSlotModel(raw);
      if (sm.kind !== 'pact') return;
      const used = Math.min(sm.used, sm.total);
      if (used >= sm.total) return;
      patch.pactSlotsUsed = used + 1;
      detail = 'pact slot, ' + (sm.total - used - 1) + '/' + sm.total + ' left';
    } else {
      return;
    }
    wgxCloseCastModal();
    if (Object.keys(patch).length) await wgxPatchState(cast.charId, patch);
    showToast('✨ ' + cast.name + ' cast (' + detail + ')' + conc);
  } catch (err) {
    showToast('Cast failed · ' + err.message, 'error');
  }
}

// ============================================================
// Prepare-window (fase 2) — change prepared spells.
// Opens automatically after a Long Rest for casters (hook in wg-rest.js),
// and manually via the "⚙ Change spells" row in the Prepared Spells widget.
// Reuses the level-up modal shell + card-grid CSS (wgx-lu-*).
// ============================================================
var wgxPrep = null; // { charId, pool: [{nm,lvl,sp}], selected: [names], max }

// Highest spell level this character can currently cast (slots, not level-up delta).
function wgxPrepMaxSpellLevel(raw) {
  const sm = wgxSlotModel(raw);
  if (sm.kind === 'pact') return sm.slotLevel;
  if (sm.kind !== 'std') return 0;
  let m = 0;
  for (let i = 0; i < sm.totals.length; i++) if (sm.totals[i] > 0) m = i + 1;
  return m;
}

// 2024 rules-note per class (web-verified 2026-08-15: aidedd/roll20/wikidot).
// Not hard-enforced: the window always allows a full re-pick; the note tells
// the player what RAW says (DM's call beyond it). House rule: a character with
// no prepared spells recorded yet may always fill their full list.
function wgxPrepRulesNote(cn, startedEmpty) {
  if (startedEmpty) return 'No prepared spells recorded yet — pick your full list.';
  if (cn === 'wizard') return 'RAW: you can change your entire prepared list whenever you finish a Long Rest. You prepare from your spellbook — the app shows the full wizard list, so check your spellbook with your DM.';
  if (cn === 'cleric' || cn === 'druid') return 'RAW: you can change your entire prepared list whenever you finish a Long Rest.';
  if (cn === 'paladin' || cn === 'ranger') return 'RAW: on a Long Rest you can replace one prepared spell. Bigger changes are the DM’s call.';
  if (cn === 'bard' || cn === 'sorcerer' || cn === 'warlock') return 'RAW: you swap a spell when you gain a level, not on a Long Rest. Treat changes here as the DM’s call.';
  return '';
}

function wgxOpenPrepareWindow(charId) {
  const raw = WG_CHAR_CACHE[charId] || {};
  const cfg = raw.config || {}, st = raw.state || {};
  const cn = cfg.className;
  const spellData = (typeof DATA !== 'undefined' && DATA.spellPool) || {};
  // Pool = class list up to the highest castable spell level.
  const maxLvl = wgxPrepMaxSpellLevel(raw);
  const pool = [];
  const inPool = new Set();
  for (let sl = 1; sl <= maxLvl; sl++) {
    const list = ((DATA.spells || {})[cn] || {})[sl] || [];
    for (const nm of list) { pool.push({ nm: nm, lvl: sl, sp: spellData[nm] || null }); inPool.add(nm); }
  }
  // Currently prepared spells outside the class list (DM grants, always-prepared
  // subclass spells, legacy data) stay visible so they never silently vanish.
  const current = Array.isArray(st.prepared) ? st.prepared.slice() : [];
  for (const nm of current) {
    if (inPool.has(nm)) continue;
    const sp = spellData[nm] || null;
    pool.push({ nm: nm, lvl: sp ? (sp.level || 0) : 0, sp: sp, extra: true });
    inPool.add(nm);
  }
  pool.sort((a, b) => (a.lvl - b.lvl) || a.nm.localeCompare(b.nm));

  // Max prepared = 2024 table (fallback formula) op spellcasting-ability mod.
  const stats = wgxSpellStats(raw);
  const score = (cfg.baseAbilities || {})[stats.ability];
  const mod = (typeof score === 'number')
    ? ((typeof getMod === 'function') ? getMod(score) : Math.floor((score - 10) / 2)) : 0;
  const max = (typeof getMaxPrepared === 'function') ? getMaxPrepared(st, mod, cn) : current.length;

  wgxPrep = { charId: charId, pool: pool, selected: current, max: max, startedEmpty: current.length === 0 };
  const host = document.createElement('div');
  host.className = 'wgx-prep-modal-active';
  host.innerHTML = '<div class="modal-overlay"><div class="modal-card wgx-lu-card"></div></div>';
  document.body.appendChild(host);
  host.addEventListener('click', wgxPrepClick);
  wgxRenderPrepModal();
}

function wgxClosePrepareWindow() {
  const el = document.querySelector('.wgx-prep-modal-active');
  if (el) el.remove();
  wgxPrep = null;
}

function wgxRenderPrepModal() {
  const card = document.querySelector('.wgx-prep-modal-active .wgx-lu-card');
  if (!card || !wgxPrep) return;
  const raw = WG_CHAR_CACHE[wgxPrep.charId] || {};
  const cn = (raw.config || {}).className;
  const sel = wgxPrep.selected;

  let html = '<div class="modal-header"><h2>Prepare Spells</h2>' +
    '<button class="modal-close" data-wgx-prep="cancel">&times;</button></div>';
  html += '<div class="modal-body wgx-lu-body">';

  if (!wgxPrep.pool.length) {
    html += '<p class="wgx-lu-note">No spell list is available for this class in the app yet. Record your prepared spells with your DM.</p>';
  } else {
    html += '<h3>Choose your prepared spells</h3>';
    const note = wgxPrepRulesNote(cn, wgxPrep.startedEmpty);
    if (note) html += '<p class="wgx-lu-note">' + wgxCastEsc(note) + '</p>';
    html += '<p class="wgx-lu-note">Prepared ' + sel.length + ' / ' + wgxPrep.max + ' · cantrips are not affected.</p>';
    html += '<div class="wgx-lu-subgrid">';
    for (let i = 0; i < wgxPrep.pool.length; i++) {
      const e = wgxPrep.pool[i];
      const isSel = sel.indexOf(e.nm) !== -1;
      const sub = 'Lvl ' + e.lvl +
        (e.sp && e.sp.time ? ' · ' + e.sp.time : '') +
        (e.sp && e.sp.range ? ' · ' + e.sp.range : '') +
        (e.extra ? ' · not on class list' : '');
      const desc = e.sp ? wgxTrunc(e.sp.desc || '', 110) : '';
      html += '<div class="wgx-lu-subcard' + (isSel ? ' selected' : '') + '" data-wgx-prep="toggle" data-val="' + wgxCastEsc(e.nm) + '">' +
        '<h4>' + wgxCastEsc(e.nm) + ' <span class="wgx-lu-cost">' + wgxCastEsc(sub) + '</span></h4>' +
        (desc ? '<p>' + wgxCastEsc(desc) + '</p>' : '') + '</div>';
    }
    html += '</div>';
  }
  html += '</div>';

  const over = sel.length > wgxPrep.max;
  html += '<div class="wgx-lu-nav">' +
    '<button class="wgx-lu-btn" data-wgx-prep="cancel">Cancel</button>' +
    '<button class="wgx-lu-btn wgx-lu-primary" data-wgx-prep="confirm"' + ((over || !wgxPrep.pool.length) ? ' disabled' : '') + '>Save</button>' +
    '</div>';
  card.innerHTML = html;
}

function wgxPrepClick(e) {
  if (!wgxPrep) return;
  if (e.target.classList && e.target.classList.contains('modal-overlay')) { wgxClosePrepareWindow(); return; }
  const t = e.target.closest('[data-wgx-prep]');
  if (!t || t.disabled) return;
  const act = t.getAttribute('data-wgx-prep');
  if (act === 'cancel') { wgxClosePrepareWindow(); return; }
  if (act === 'toggle') {
    const nm = t.getAttribute('data-val');
    const idx = wgxPrep.selected.indexOf(nm);
    if (idx !== -1) wgxPrep.selected.splice(idx, 1);
    else if (wgxPrep.selected.length < wgxPrep.max) wgxPrep.selected.push(nm);
    else { showToast('Maximum reached (' + wgxPrep.max + ') — deselect a spell first'); return; }
    wgxRenderPrepModal();
    return;
  }
  if (act === 'confirm') wgxConfirmPrepare();
}

async function wgxConfirmPrepare() {
  if (!wgxPrep) return;
  const p = wgxPrep;
  // Sorteer zoals de widget: level oplopend, alfabetisch binnen level.
  const lvlOf = {};
  for (const e of p.pool) lvlOf[e.nm] = e.lvl;
  const list = p.selected.slice().sort((a, b) => ((lvlOf[a] || 0) - (lvlOf[b] || 0)) || a.localeCompare(b));
  try {
    await wgxPatchState(p.charId, { prepared: list });
    wgxClosePrepareWindow();
    showToast('📖 Prepared spells updated (' + list.length + '/' + p.max + ')');
  } catch (err) {
    showToast('Save failed · ' + err.message, 'error');
  }
}

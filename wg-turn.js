// wg-turn.js — "Your Turn" widget + active spell effects.
//
// Your Turn: everything the character can do on a turn, grouped by what it
// costs — Action (attacks, action spells, action features, the standard
// actions), Bonus Action, Reaction (Opportunity Attack, reaction spells and
// features) and Other (riders such as Sneak Attack, free/use-counter
// features). Spells you are maintaining sit on top under Active Spells.
// Click a spell to cast it, a use-counter to spend a use, an active spell to
// end it. Passive features stay in the Passive Features widget.
//
// Active spell effects: casting a spell with a duration stores
// state.activeEffects/<id> = { spell, rounds, conc, castRound?, combatId? }
// on the caster's own character (players can't write the encounter once the
// DM-only rules are live). The countdown is derived from the shared encounter
// (dw_initiative): rounds left = castRound + rounds − current round. A spell
// cast outside combat starts counting at round 1 of the next fight. Expired
// effects are hidden and pruned on the next cast or rest.
//
// Load order: NA wg-prepare.js, wg-features.js en wg-attack.js.

var WG_EXTRA_INFOBOX_BUILDERS = (typeof WG_EXTRA_INFOBOX_BUILDERS !== 'undefined') ? WG_EXTRA_INFOBOX_BUILDERS : {};
var WG_INFOBOX_CLICK_HANDLERS = (typeof WG_INFOBOX_CLICK_HANDLERS !== 'undefined') ? WG_INFOBOX_CLICK_HANDLERS : {};

Object.assign(WG_WIDGET_TYPES, {
  turnActions: {
    label: 'Your Turn', kind: 'infobox', source: 'turn',
    spanUnits: 6, spanUnitsY: 8,
    cfg: { cellPadding: 6, widgetPadding: 6, infoBoxSpacing: 4, infoBoxPadding: 2 },
  },
});
WG_EDIT_CONFIG.turn = { mode: 'always', editColumnIdx: 1 };   // name column: cast / spend / end
if (typeof WG_SOURCE_LABELS !== 'undefined') WG_SOURCE_LABELS.turn = 'Your Turn';

// ===== Spell durations =====
// Duration in combat rounds: 0 = instantaneous (no effect), -1 = until
// dispelled / special (no countdown). 1 minute = 10 rounds.
function wgxSpellDurationRounds(sp) {
  var d = String((sp && sp.dur) || '').toLowerCase();
  if (!d || /instant/.test(d)) return 0;
  var m = d.match(/(\d+)\s*(round|min|hour|day)/);
  if (!m) return -1;
  var n = parseInt(m[1], 10);
  return m[2] === 'round' ? n : m[2] === 'min' ? n * 10 : m[2] === 'hour' ? n * 600 : n * 14400;
}
function wgxRoundsLabel(r) {
  if (r <= 20) return r + ' rnd';
  if (r < 600) return Math.ceil(r / 10) + ' min';
  if (r < 14400) return Math.ceil(r / 600) + ' h';
  return Math.ceil(r / 14400) + ' d';
}
function wgxCombatId(enc) { return (enc && enc.startedAt) || 'legacy'; }
function wgxCurrentEncounter() {
  try { return (typeof getEncounter === 'function') ? getEncounter() : null; } catch (e) { return null; }
}

// { left: rounds left | null (no countdown), expired }
function wgxEffectStatus(eff, enc) {
  if (!eff || !(eff.rounds > 0) || !enc) return { left: null, expired: false };
  var start;
  if (eff.combatId && eff.combatId === wgxCombatId(enc)) {
    start = eff.castRound || 1;
  } else {
    if (!enc.running) return { left: null, expired: false };
    // Cast in an earlier fight: a spell of up to a minute is long gone; longer
    // ones (and spells cast outside combat) count from round 1 of this fight.
    if (eff.combatId && eff.rounds <= 10) return { left: 0, expired: true };
    start = 1;
  }
  var left = start + eff.rounds - (enc.round || 1);
  return { left: left, expired: left <= 0 };
}

// Running effects of a character state, oldest first: [{ id, eff, sp, status }]
function wgxActiveEffects(st, enc) {
  var effs = (st && st.activeEffects) || {};
  var pool = (typeof DATA !== 'undefined' && DATA.spellPool) || {};
  if (enc === undefined) enc = wgxCurrentEncounter();
  return Object.keys(effs).sort().map(function (id) {
    var eff = effs[id];
    return eff ? { id: id, eff: eff, sp: pool[eff.spell] || null, status: wgxEffectStatus(eff, enc) } : null;
  }).filter(function (x) { return x && !x.status.expired; });
}
function wgxActiveEffectFor(st, spellName) {
  return wgxActiveEffects(st).filter(function (x) { return x.eff.spell === spellName; })[0] || null;
}
function wgxEffectStatusText(x) {
  var s = x.status;
  if (s.left != null) return s.left + (s.left === 1 ? ' round' : ' rounds') + ' left';
  if (x.eff.rounds < 0) return 'Until dispelled';
  return wgxRoundsLabel(x.eff.rounds) + ' duration; counts down once combat starts';
}
function wgxEffectShort(x) {
  if (x.status.left != null) return wgxRoundsLabel(x.status.left);
  return x.eff.rounds < 0 ? '∞' : wgxRoundsLabel(x.eff.rounds);
}
function wgxEffectTip(x, extra) {
  var base = (typeof wgxSpellTooltip === 'function' && x.sp)
    ? wgxSpellTooltip(x.eff.spell, x.sp, { dc: '—', atk: '—' }, []) : { title: x.eff.spell, body: '' };
  var body = (base.body || '').replace(/\n?Spell save DC[^\n]*/, '').replace(/\nClick the spell to cast it\./, '');
  return {
    title: x.eff.spell + ' · active' + (x.eff.conc ? ' (Concentration)' : ''),
    body: wgxEffectStatusText(x) + '.' + (extra ? '\n' + extra : '') + '\n\n' + body,
  };
}

// State patch for casting spellName: adds the effect (if it lasts), ends an
// earlier cast of the same spell, ends other Concentration spells when this
// one needs Concentration, and prunes expired effects.
function wgxSpellEffectPatch(st, spellName, sp) {
  var patch = {};
  var rounds = wgxSpellDurationRounds(sp);
  if (!rounds) return patch;
  var enc = wgxCurrentEncounter();
  var conc = (typeof wgxSpellIsConcentration === 'function') && wgxSpellIsConcentration(sp);
  var effs = (st && st.activeEffects) || {};
  Object.keys(effs).forEach(function (id) {
    var e = effs[id];
    if (!e) return;
    if (wgxEffectStatus(e, enc).expired || e.spell === spellName || (conc && e.conc)) patch['activeEffects/' + id] = null;
  });
  var eff = { spell: spellName, rounds: rounds, conc: !!conc };
  if (enc && enc.running) { eff.castRound = enc.round || 1; eff.combatId = wgxCombatId(enc); }
  patch['activeEffects/e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)] = eff;
  return patch;
}

// Live state of any character (synced localStorage first, then the dashboard cache).
function wgxLiveCharState(charId) {
  try {
    var s = localStorage.getItem('dw_char_' + charId);
    if (s) { var o = JSON.parse(s); if (o && typeof o === 'object') return o; }
  } catch (e) {}
  var raw = (typeof WG_CHAR_CACHE !== 'undefined') ? WG_CHAR_CACHE[charId] : null;
  return (raw && raw.state) || {};
}

// ===== Your Turn: row model =====
function wgxSpellAct(sp) {
  var t = String((sp && sp.time) || '').toLowerCase();
  if (/bonus/.test(t)) return 'bonus';
  if (/reaction/.test(t)) return 'reaction';
  if (/^(1 )?action/.test(t)) return 'action';
  return null;                              // 1 minute or longer: not something for a turn
}

// Rows: { header, tip } | { kind: 'effect'|'attack'|'spell'|'feat'|'std'|'oa', … }
function wgxTurnRowModel(cfg, st) {
  var groups = { action: [], bonus: [], reaction: [], other: [] };
  var atks = (typeof wgxCollectAttacks === 'function') ? wgxCollectAttacks(cfg, st) : [];
  atks.forEach(function (a) {
    (a.hit === '1/turn' ? groups.other : groups.action).push({ kind: 'attack', atk: a });
  });
  var spells = (typeof wgxPreparedEntries === 'function') ? wgxPreparedEntries(cfg, st) : [];
  spells.forEach(function (e) {
    var act = wgxSpellAct(e.sp);
    if (act) groups[act].push({ kind: 'spell', e: e });
  });
  var feats = (typeof wgxFeatureRowModel === 'function') ? wgxFeatureRowModel(cfg, st, 'active') : [];
  feats.forEach(function (r) {
    if (r.header) return;
    groups[wgxActGroupOf(r.feat.act)].push({ kind: 'feat', feat: r.feat, res: r.res });
  });
  groups.action.push({ kind: 'std' });
  groups.reaction.unshift({ kind: 'oa' });

  var rows = [];
  var fx = wgxActiveEffects(st);
  if (fx.length) {
    rows.push({ header: 'Active spells', tip: 'Spells you are maintaining. During combat they count down with the Combat Tracker rounds. Click one to end it early.' });
    fx.forEach(function (x) { rows.push({ kind: 'effect', fx: x }); });
  }
  (typeof WGX_ACT_GROUPS !== 'undefined' ? WGX_ACT_GROUPS : []).forEach(function (g) {
    if (!groups[g.id].length) return;
    rows.push({ header: g.label, tip: g.tip });
    rows = rows.concat(groups[g.id]);
  });
  return rows;
}

function wgxBuildTurn(widget) {
  var raw = WG_CHAR_CACHE[state.characterId] || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var d = widget.data, L = widget.layout;
  d.columns = [{ key: 'tag', label: '' }, { key: 'name', label: 'Option' }, { key: 'info', label: '' }];
  var stats = (typeof wgxSpellStats === 'function') ? wgxSpellStats(raw) : { dc: '—', atk: '—' };
  var srcLabel = { C: 'Class', S: 'Subclass', R: 'Species', M: 'Metamagic', I: 'Invocation', F: 'Fighting Style', T: 'Feat', B: 'Maneuver' };
  var model = wgxTurnRowModel(cfg, st);
  var rows = [], tips = [], cls = [];
  model.forEach(function (r) {
    var tip = null, row, c = null;
    if (r.header) {
      row = ['', r.header.toUpperCase(), ''];
      tip = { title: r.header, body: r.tip };
      c = 'wgx-feat-header';
    } else if (r.kind === 'effect') {
      row = [r.fx.eff.conc ? '◆' : '✦', r.fx.eff.spell, wgxEffectShort(r.fx)];
      tip = wgxEffectTip(r.fx, 'Click to end it early.');
      c = 'wgx-turn-effect';
    } else if (r.kind === 'attack') {
      row = ['⚔', r.atk.name, r.atk.hit];
      tip = r.atk.tip;
    } else if (r.kind === 'spell') {
      var sp = r.e.sp;
      var badge = sp ? (sp.level === 0 ? 'C' : String(sp.level)) : '?';
      var live = wgxActiveEffectFor(st, r.e.name);
      var info = live ? '⏳' + wgxEffectShort(live) : (sp && wgxSpellIsConcentration(sp) ? '◆' : '');
      row = [badge, r.e.name, info];
      var gAb = r.e.granted && r.e.grants[0] && r.e.grants[0].ability;
      tip = wgxSpellTooltip(r.e.name, sp, gAb ? wgxSpellStats(raw, gAb) : stats, r.e.grants);
      if (live) tip = { title: tip.title, body: 'Active: ' + wgxEffectStatusText(live) + '.\n\n' + tip.body };
    } else if (r.kind === 'feat') {
      var f = r.feat, res = r.res;
      row = ['', f.name, res ? wgxFeatureUsesCell(res, cfg, st) : ''];
      var body = wgxFeatureText(f.desc);
      if (res) {
        var max = res.max(cfg, st), used = Math.min(st[res.stateKey] || 0, max);
        body += '\n\n' + (max - used) + '/' + max + (res.unit === 'points' ? ' points' : ' uses') + ' left. Click to spend one; click when empty to restore all.';
      }
      tip = { title: f.name + ' · ' + srcLabel[f.src] + ' (level ' + f.level + ')', body: body };
      if (res) c = 'wgx-feat-active';
    } else if (r.kind === 'std') {
      row = ['…', 'Other actions', ''];
      tip = { title: 'Other actions', body: 'Every creature can also take one of these as its action:\n' + WGX_STANDARD_ACTIONS.join('\n') };
    } else if (r.kind === 'oa') {
      row = ['⚔', 'Opportunity Attack', ''];
      tip = wgxTermTip('Opportunity Attack');
    }
    rows.push(row); tips.push(tip ? [tip, tip, tip] : null); cls.push(c);
  });
  if (!rows.length) { rows.push(['', 'Nothing to do', '']); tips.push(null); cls.push(null); }
  d.rows = rows; d.tooltips = tips;
  L.columnHighlight = [false, false, true];
  L.columnAlign = ['center', 'left', 'right'];
  L.columnMaxChars = [null, 20, null];
  L.columnAllCaps = [false, false, false];
  L.columnExtraClass = ['is-prof-col', null, null];
  L.columnMinWidthPx = [20, null, 34];
  L.columnFontScale = [1.1, 1, 0.95];
  L.rowExtraClass = cls;
  L.stacking = 'horizontal';
}
WG_EXTRA_INFOBOX_BUILDERS.turn = wgxBuildTurn;

WG_INFOBOX_CLICK_HANDLERS.turn = async function (ctx) {
  var raw = ctx.raw || {};
  var cfg = raw.config || {}, st = raw.state || {};
  var r = wgxTurnRowModel(cfg, st)[ctx.rowIdx];
  if (!r || r.header) return;
  if (r.kind === 'spell') { wgxOpenCastModal(ctx.charId, r.e.name); return; }
  if (r.kind === 'effect') {
    var ok = await showConfirmModal({ title: 'End ' + r.fx.eff.spell + '?', message: 'The spell stops now (' + wgxEffectStatusText(r.fx).toLowerCase() + ').', confirmLabel: 'End spell' });
    if (!ok) return;
    var p = {}; p['activeEffects/' + r.fx.id] = null;
    await wgxPatchState(ctx.charId, p);
    showToast(r.fx.eff.spell + ' ended');
    return;
  }
  if (r.kind === 'feat' && r.res) {
    var res = r.res, max = res.max(cfg, st), used = Math.min(st[res.stateKey] || 0, max);
    var next = (used >= max) ? 0 : used + 1;
    var patch = {}; patch[res.stateKey] = next;
    await wgxPatchState(ctx.charId, patch);
    showToast(res.label + ': ' + (max - next) + '/' + max + (next === 0 ? ' (restored)' : ''));
  }
};

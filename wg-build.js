// wg-build.js — Build overview: everything a character has at its level, from
// getBuildProfile() (engine.js): spells (class + granted, with level, free uses
// and reset), actions by action type, feats, resources, what was chosen, what
// can be swapped when, open choices, and notes on unusual combinations.
// Opened from the Level Up widget ("Level N · Build"). "Explore builds" renders
// the same view for any class / subclass / species / level from a synthetic
// character, so players can compare options before leveling up.
//
// Lives on document.body (styles outside @scope, see wg-style.css).
// Runtime globals: WG_CHAR_CACHE, DATA, engine fns, wgxEsc (wg-levelup.js).

var wgxBD = null; // { charId, mode: 'char'|'explore', ex: {cls, sub, race, lineage, level} }

var WGX_ACT_LABEL = { action: 'Action', bonus: 'Bonus Action', reaction: 'Reaction', attack: 'On a hit / Attack action', free: 'No action', other: '1 minute or longer' };
var WGX_ACT_SHORT = { action: 'A', bonus: 'BA', reaction: 'R', attack: 'Hit', free: '—', other: '1m+' };
var WGX_RECHARGE = { 'long': 'Long Rest', 'short': 'Short or Long Rest', 'short-one': '1 back per Short Rest, all on a Long Rest' };
var WGX_SWAP_LABEL = { longRest: 'On a Long Rest', shortRest: 'On a Short Rest', levelUp: 'When you gain a level', use: 'Each time you use it' };

// Species variants for the explorer (race key + lineage).
var WGX_EX_SPECIES = [
  ['aasimar', null, 'Aasimar'], ['dragonborn', 'red', 'Dragonborn'], ['dwarf', null, 'Dwarf'],
  ['drow', null, 'Elf — Drow'], ['highElf', null, 'Elf — High Elf'], ['woodElf', null, 'Elf — Wood Elf'],
  ['gnome', 'forest', 'Gnome — Forest'], ['gnome', 'rock', 'Gnome — Rock'], ['goliath', 'cloud', 'Goliath — Cloud'],
  ['goliath', 'fire', 'Goliath — Fire'], ['goliath', 'frost', 'Goliath — Frost'], ['goliath', 'hill', 'Goliath — Hill'],
  ['goliath', 'stone', 'Goliath — Stone'], ['goliath', 'storm', 'Goliath — Storm'], ['halfling', null, 'Halfling'],
  ['human', null, 'Human'], ['orc', null, 'Orc'], ['tiefling', 'abyssal', 'Tiefling — Abyssal'],
  ['tiefling', 'chthonic', 'Tiefling — Chthonic'], ['tiefling', 'infernal', 'Tiefling — Infernal']
];
var WGX_EX_CLASSES = ['barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard'];

// A synthetic character for the explorer: standard-array-like scores with the
// class's main ability first, no picks (open choices show what you'd choose).
function wgxSyntheticChar(cls, sub, race, lineage, level) {
  var primary = { barbarian: 'str', bard: 'cha', cleric: 'wis', druid: 'wis', fighter: 'str', monk: 'dex', paladin: 'str', ranger: 'dex', rogue: 'dex', sorcerer: 'cha', warlock: 'cha', wizard: 'int' }[cls];
  var ab = { str: 10, dex: 14, con: 14, int: 10, wis: 12, cha: 10 };
  ab[primary] = 16;
  var cfg = { className: cls, race: race, baseAbilities: ab, defaultSkills: [], expertSkills: [] };
  if (sub && level >= 3) cfg.subclass = sub;
  if (lineage) cfg.lineage = lineage;
  var ca = (typeof getSpellcastingAbility === 'function') ? getSpellcastingAbility(cls, sub) : 'cha';
  if ((DATA[race] || {}).spellAbility === 'choose') cfg.speciesAbility = ['int', 'wis', 'cha'].indexOf(ca) !== -1 ? ca : 'cha';
  return { config: cfg, state: { level: level, cantrips: [], prepared: [], asiChoices: {} } };
}

function wgxOpenBuildModal(charId) {
  wgxBD = { charId: charId, mode: 'char', ex: null };
  var raw = WG_CHAR_CACHE[charId] || {};
  var cfg = raw.config || {}, st = raw.state || {};
  wgxBD.ex = { cls: cfg.className || 'fighter', sub: cfg.subclass || '', race: cfg.race || 'human', lineage: cfg.lineage || '', level: Math.min(4, st.level || 1) };
  var host = document.createElement('div');
  host.className = 'wgx-build-host';
  host.innerHTML = '<div class="modal-overlay"><div class="modal-card wgx-bd-card"></div></div>';
  document.body.appendChild(host);
  host.addEventListener('click', wgxBDClick);
  host.addEventListener('change', wgxBDChange);
  document.addEventListener('keydown', wgxBDKey, true);
  wgxRenderBuild();
}
function wgxCloseBuildModal() {
  var el = document.querySelector('.wgx-build-host');
  if (el) el.remove();
  document.removeEventListener('keydown', wgxBDKey, true);
  wgxBD = null;
}
function wgxBDKey(e) { if (e.key === 'Escape' && wgxBD) { e.stopPropagation(); wgxCloseBuildModal(); } }

function wgxBDChip(text, cls, tip) {
  return '<span class="wgx-bd-chip' + (cls ? ' ' + cls : '') + '"' + (tip ? ' title="' + wgxEsc(tip) + '"' : '') + '>' + wgxEsc(text) + '</span>';
}
function wgxFreeText(g) {
  if (g.kind === 'atWill') return 'at will, no slot';
  if (g.cost) return g.cost.n + ' ' + (g.cost.res === 'focusPoints' ? 'Focus Point' : g.cost.res) + ' per cast';
  if (g.res === 'wildShape') return 'spell slot or a Wild Shape use';
  if (g.res) { var r = (DATA.classResources || []).filter(function (x) { return x.id === g.res; })[0]; return r ? 'free via ' + r.label : ''; }
  if (g.freeMax != null) return g.freeMax + '× free per ' + (g.recharge === 'short' ? 'Short/Long Rest' : 'Long Rest');
  if (g.kind === 'ritual') return 'as a Ritual';
  if (g.kind === 'cantrip') return 'at will';
  return 'always prepared';
}

function wgxBuildProfileHtml(prof, isChar) {
  var h = '';
  var who = prof.who;
  // --- identity strip ---
  h += '<div class="wgx-bd-who"><div class="wgx-bd-title">Level ' + prof.level + ' ' + wgxEsc(who.classLabel) +
    (who.subclassLabel ? ' · ' + wgxEsc(who.subclassLabel) : '') + ' · ' + wgxEsc(who.speciesLabel) + '</div><div class="wgx-bd-stats">' +
    wgxBDChip('HP ' + who.hp, 'stat') + wgxBDChip('AC ' + who.ac, 'stat', 'Class default armor') + wgxBDChip('Proficiency +' + prof.pb, 'stat') +
    wgxBDChip('Speed ' + who.speed + ' ft', 'stat') + (who.darkvision ? wgxBDChip('Darkvision ' + who.darkvision + ' ft', 'stat') : '') +
    (prof.casting ? wgxBDChip('Spell DC ' + prof.casting.dc, 'stat') + wgxBDChip('Spell attack +' + prof.casting.atk, 'stat') : '') + '</div></div>';
  // --- open choices ---
  if (prof.open.length) {
    h += '<section class="wgx-bd-open"><h3>' + (isChar ? 'Missing choices' : 'What you choose') + '</h3><ul>' +
      prof.open.map(function (o) { return '<li>' + wgxEsc(o.what) + '</li>'; }).join('') + '</ul>' +
      (isChar ? '<p class="wgx-lu-note">Your next Level Up asks for these. Level-independent ones you can also fill in now:</p><button class="wgx-lu-btn wgx-lu-primary" data-bd="fix">Complete missing choices</button>' : '') + '</section>';
  }
  // --- spells ---
  h += '<section><h3>Spells</h3>';
  if (prof.casting) {
    var c = prof.casting;
    var slotTxt = c.pact ? c.pact.count + ' Pact slot' + (c.pact.count > 1 ? 's' : '') + ' (level ' + c.pact.level + ', back on a Short Rest)'
      : (c.slots || []).map(function (n, i) { return n ? n + '× level ' + (i + 1) : ''; }).filter(Boolean).join(', ');
    h += '<div class="wgx-bd-row"><span class="wgx-bd-k">' + wgxEsc(classLabel(c.list)) + ' spells (' + wgxEsc((c.ability || '').toUpperCase()) + ')</span> ' + wgxEsc(slotTxt || 'no slots yet') + '</div>';
    h += '<div class="wgx-bd-row"><span class="wgx-bd-k">Cantrips ' + c.cantrips.known.length + '/' + c.cantrips.max + '</span> ' +
      (c.cantrips.known.length ? c.cantrips.known.map(function (n) { return wgxBDChip(n, 'spell'); }).join('') : '<i>none recorded</i>') + '</div>';
    h += '<div class="wgx-bd-row"><span class="wgx-bd-k">Prepared ' + c.prepared.known.length + '/' + c.prepared.max + ' (level ≤ ' + c.prepared.maxLevel + ')</span> ' +
      (c.prepared.known.length ? c.prepared.known.map(function (n) { var sp = DATA.spellPool[n] || {}; return wgxBDChip(n + (sp.level ? ' ·' + sp.level : ''), 'spell'); }).join('') : '<i>none recorded</i>') + '</div>';
  } else {
    h += '<div class="wgx-bd-row"><i>No Spellcasting feature' + (prof.granted.length ? ' — only the granted spells below.' : '.') + '</i></div>';
  }
  if (prof.granted.length) {
    h += '<table class="wgx-bd-table"><thead><tr><th>Granted spell</th><th>Lvl</th><th>Cast</th><th>From</th><th>Use</th></tr></thead><tbody>';
    prof.granted.slice().sort(function (a, b) { return (a.spellLevel - b.spellLevel) || a.name.localeCompare(b.name); }).forEach(function (g) {
      var sp = DATA.spellPool[g.name] || {};
      var act = _castAct(sp);
      var dcNote = prof.casting && g.dc !== prof.casting.dc && g.dc != null ? ' · DC ' + g.dc : (!prof.casting && g.dc != null ? ' · DC ' + g.dc : '');
      h += '<tr title="' + wgxEsc((sp.time || '') + ' · ' + (sp.range || '') + ' · ' + (sp.dur || '') + '\n' + (sp.desc || '')) + '"><td>' + wgxEsc(g.name) + (g.note ? ' <span class="wgx-bd-dim">(' + wgxEsc(g.note) + ')</span>' : '') + '</td>' +
        '<td>' + (g.spellLevel === 0 ? 'C' : g.spellLevel) + '</td><td>' + WGX_ACT_SHORT[act] + '</td><td>' + wgxEsc(g.from) + '</td><td>' + wgxEsc(wgxFreeText(g) + (g.slots && g.freeMax != null ? ' + slots' : '') + dcNote) + '</td></tr>';
    });
    h += '</tbody></table>';
  }
  h += '</section>';
  // --- actions ---
  h += '<section><h3>Actions</h3><div class="wgx-bd-actions">';
  ['action', 'bonus', 'reaction', 'attack', 'free', 'other'].forEach(function (a) {
    var list = prof.actions[a] || [];
    if (!list.length) return;
    h += '<div class="wgx-bd-actcol"><div class="wgx-bd-acthead">' + WGX_ACT_LABEL[a] + '</div>' +
      list.map(function (x) {
        var tip = (x.desc || '') + (x.froms && x.froms.length ? '\nFrom: ' + x.froms.join(', ') : '') + (x.res ? '\nUses: ' + x.res : '');
        return wgxBDChip(x.name + (x.spell ? (x.level ? ' ·' + x.level : ' ·C') : ''), x.spell ? 'spell' : 'feat-' + (x.source || ''), tip);
      }).join('') + '</div>';
  });
  h += '</div><p class="wgx-lu-note">Everyone can also Attack, Dash, Disengage, Dodge, Help, Hide, Influence, Ready, Search, Study and Utilize, and make an Opportunity Attack as a Reaction.</p></section>';
  // --- feats ---
  if (prof.feats.length) {
    h += '<section><h3>Feats</h3><div class="wgx-bd-cards">' + prof.feats.map(function (f) {
      var r = f.rec || {}, bits = [];
      if (r.ability) bits.push('+1 ' + r.ability.toUpperCase());
      if (r.abilities) bits.push(Object.keys(r.abilities).map(function (k) { return k.toUpperCase() + ' +' + r.abilities[k]; }).join(', '));
      if (r.spellAbility) bits.push('casts with ' + r.spellAbility.toUpperCase());
      ['cantrips', 'spells', 'skills', 'expertise'].forEach(function (k) { if (r[k] && r[k].length) bits.push(k + ': ' + r[k].join(', ')); });
      if (r.element) bits.push(r.element);
      return '<div class="wgx-bd-feat" title="' + wgxEsc(f.desc) + '"><b>' + wgxEsc(f.name) + '</b><span class="wgx-bd-dim">' + wgxEsc(f.sourceLabel) + '</span>' + (bits.length ? '<p>' + wgxEsc(bits.join(' · ')) + '</p>' : '') + '</div>';
    }).join('') + '</div></section>';
  }
  // --- resources ---
  if (prof.resources.length) {
    h += '<section><h3>Uses &amp; resets</h3><div class="wgx-bd-res">' + prof.resources.map(function (r) {
      return '<div class="wgx-bd-resrow"><b>' + wgxEsc(r.label) + '</b><span>' + r.max + (r.unit ? ' ' + wgxEsc(r.unit) : '') + (r.die ? ' × ' + r.die : '') + '</span><span class="wgx-bd-dim">' + wgxEsc(WGX_RECHARGE[r.recharge] || r.recharge) + '</span></div>';
    }).join('') + '</div></section>';
  }
  // --- swaps ---
  var anySwap = Object.keys(prof.swaps).some(function (k) { return prof.swaps[k].length; });
  if (anySwap) {
    h += '<section><h3>What you can swap</h3>';
    if (isChar) h += wgxBDQuickSwaps(prof);
    h += '<div class="wgx-bd-swaps">';
    ['longRest', 'shortRest', 'levelUp', 'use'].forEach(function (k) {
      if (!prof.swaps[k].length) return;
      h += '<div><div class="wgx-bd-acthead">' + WGX_SWAP_LABEL[k] + '</div><ul>' + prof.swaps[k].map(function (s) { return '<li>' + wgxEsc(s.what) + '</li>'; }).join('') + '</ul></div>';
    });
    h += '</div></section>';
  }
  // --- chosen ---
  if (prof.chosen.length) {
    h += '<section><h3>Chosen</h3><dl class="wgx-bd-dl">' + prof.chosen.map(function (c2) { return '<dt>' + wgxEsc(c2.what) + '</dt><dd>' + wgxEsc(c2.value) + '</dd>'; }).join('') + '</dl></section>';
  }
  // --- notes ---
  if (prof.notes.length) {
    h += '<section class="wgx-bd-notes"><h3>Good to know</h3><ul>' + prof.notes.map(function (n) { return '<li>' + wgxEsc(n) + '</li>'; }).join('') + '</ul></section>';
  }
  // --- all features (collapsible) ---
  h += '<details class="wgx-bd-feats"><summary>All features (' + prof.features.length + ')</summary>' + prof.features.map(function (f) {
    return '<div class="wgx-lu-feature">' + (typeof wgxLUBadge === 'function' ? wgxLUBadge(f.source) : '') + '<b>' + wgxEsc(f.name) + '</b>' +
      (f.act ? ' <span class="wgx-bd-act">' + WGX_ACT_SHORT[f.act] + '</span>' : '') + '<p>' + wgxEsc(f.desc || '') + '</p></div>';
  }).join('') + '</details>';
  return h;
}

// Inline controls for rest swaps the app tracks itself (real character only).
function wgxBDQuickSwaps(prof) {
  var raw = WG_CHAR_CACHE[wgxBD.charId] || {};
  var st = raw.state || {}, cfg = raw.config || {};
  var ids = prof.swaps.longRest.concat(prof.swaps.shortRest).map(function (s) { return s.id; });
  var h = '';
  var sel = function (field, label, opts, cur) {
    return '<label class="wgx-bd-quick">' + wgxEsc(label) + '<select data-bd-set="' + field + '"><option value="">Choose…</option>' +
      opts.map(function (o) { return '<option value="' + wgxEsc(o[0]) + '"' + (o[0] === cur ? ' selected' : '') + '>' + wgxEsc(o[1]) + '</option>'; }).join('') + '</select></label>';
  };
  if (ids.indexOf('landType') !== -1 && typeof WGX_LANDS !== 'undefined') h += sel('landType', 'Land type (Long Rest)', WGX_LANDS, st.landType || '');
  if (ids.indexOf('huntersPrey') !== -1 && typeof WGX_HUNTERS_PREY !== 'undefined') h += sel('huntersPrey', "Hunter's Prey (Short Rest)", WGX_HUNTERS_PREY.map(function (x) { return [x[0], x[0]]; }), st.huntersPrey || '');
  if (ids.indexOf('elfCantrip') !== -1) {
    var cur = st.speciesCantrip || 'Prestidigitation';
    h += sel('speciesCantrip', 'High Elf cantrip (Long Rest)', ((DATA.spells.wizard || {})[0] || []).map(function (n) { return [n, n]; }), cur);
  }
  return h ? '<div class="wgx-bd-quickrow">' + h + '</div>' : '';
}

function wgxRenderBuild() {
  var card = document.querySelector('.wgx-bd-card');
  if (!card || !wgxBD) return;
  var isChar = wgxBD.mode === 'char';
  var raw = WG_CHAR_CACHE[wgxBD.charId] || {};
  var cfg, st, title;
  if (isChar) {
    cfg = raw.config || {}; st = raw.state || {};
    title = (cfg.name || 'Character') + ' — Build';
  } else {
    var ex = wgxBD.ex;
    var syn = wgxSyntheticChar(ex.cls, ex.sub, ex.race, ex.lineage || null, ex.level);
    cfg = syn.config; st = syn.state;
    title = 'Explore builds';
  }
  var prof;
  try { prof = getBuildProfile(cfg, st); }
  catch (err) { card.innerHTML = '<div class="modal-header"><h2>Build</h2><button class="modal-close" data-bd="close">&times;</button></div><div class="modal-body"><p>Could not build the overview: ' + wgxEsc(err.message) + '</p></div>'; return; }
  var h = '<div class="modal-header"><h2>' + wgxEsc(title) + '</h2><div class="wgx-bd-headbtns">' +
    '<button class="wgx-lu-btn" data-bd="toggle">' + (isChar ? 'Explore builds' : 'Back to character') + '</button>' +
    '<button class="modal-close" data-bd="close">&times;</button></div></div>';
  if (!isChar) {
    var ex2 = wgxBD.ex, cd = DATA[ex2.cls] || {};
    var subs = Object.keys(cd.subclasses || {}).filter(function (k) { return !cd.subclasses[k].legacy; });
    var spKey = ex2.race + '|' + (ex2.lineage || '');
    h += '<div class="wgx-bd-explorer">' +
      '<label>Class<select data-ex="cls">' + WGX_EX_CLASSES.map(function (c) { return '<option value="' + c + '"' + (c === ex2.cls ? ' selected' : '') + '>' + classLabel(c) + '</option>'; }).join('') + '</select></label>' +
      '<label>Subclass<select data-ex="sub">' + subs.map(function (s) { return '<option value="' + s + '"' + (s === ex2.sub ? ' selected' : '') + '>' + wgxEsc(cd.subclasses[s].name) + '</option>'; }).join('') + '</select></label>' +
      '<label>Species<select data-ex="species">' + WGX_EX_SPECIES.map(function (s) { var k = s[0] + '|' + (s[1] || ''); return '<option value="' + k + '"' + (k === spKey ? ' selected' : '') + '>' + wgxEsc(s[2]) + '</option>'; }).join('') + '</select></label>' +
      '<label>Level<select data-ex="level">' + [1, 2, 3, 4].map(function (l) { return '<option' + (l === ex2.level ? ' selected' : '') + '>' + l + '</option>'; }).join('') + '</select></label></div>';
  }
  h += '<div class="modal-body wgx-bd-body">' + wgxBuildProfileHtml(prof, isChar) + '</div>';
  card.innerHTML = h;
}

function wgxBDClick(e) {
  if (!wgxBD) return;
  if (e.target.classList && e.target.classList.contains('modal-overlay')) { wgxCloseBuildModal(); return; }
  var t = e.target.closest('[data-bd]');
  if (!t) return;
  var act = t.getAttribute('data-bd');
  if (act === 'close') { wgxCloseBuildModal(); return; }
  if (act === 'toggle') {
    wgxBD.mode = wgxBD.mode === 'char' ? 'explore' : 'char';
    if (wgxBD.mode === 'explore') {
      var cd = DATA[wgxBD.ex.cls] || {};
      var subs = Object.keys(cd.subclasses || {}).filter(function (k) { return !cd.subclasses[k].legacy; });
      if (subs.indexOf(wgxBD.ex.sub) === -1) wgxBD.ex.sub = subs[0];
      var known = WGX_EX_SPECIES.some(function (s) { return s[0] === wgxBD.ex.race && (s[1] || '') === (wgxBD.ex.lineage || ''); });
      if (!known) { var m = WGX_EX_SPECIES.filter(function (s) { return s[0] === wgxBD.ex.race; })[0] || WGX_EX_SPECIES[0]; wgxBD.ex.race = m[0]; wgxBD.ex.lineage = m[1] || ''; }
    }
    wgxRenderBuild(); return;
  }
  if (act === 'fix') {
    var id = wgxBD.charId;
    wgxCloseBuildModal();
    if (typeof wgxOpenLevelUpModal === 'function') wgxOpenLevelUpModal(id, { fixOnly: true });
  }
}
function wgxBDChange(e) {
  if (!wgxBD) return;
  var setField = e.target && e.target.getAttribute && e.target.getAttribute('data-bd-set');
  if (setField && wgxBD.mode === 'char') {
    var patch = {}; patch[setField] = e.target.value || null;
    var id = wgxBD.charId;
    wgxPatchState(id, patch).then(function () { showToast('Saved'); if (wgxBD) wgxRenderBuild(); })
      .catch(function (err) { showToast('Save failed · ' + err.message, 'error'); });
    return;
  }
  var k = e.target && e.target.getAttribute && e.target.getAttribute('data-ex');
  if (!k) return;
  var ex = wgxBD.ex, v = e.target.value;
  if (k === 'cls') {
    ex.cls = v;
    var cd = DATA[v] || {};
    ex.sub = Object.keys(cd.subclasses || {}).filter(function (s) { return !cd.subclasses[s].legacy; })[0];
  } else if (k === 'sub') ex.sub = v;
  else if (k === 'species') { var p = v.split('|'); ex.race = p[0]; ex.lineage = p[1] || ''; }
  else if (k === 'level') ex.level = parseInt(v, 10) || 1;
  wgxRenderBuild();
}

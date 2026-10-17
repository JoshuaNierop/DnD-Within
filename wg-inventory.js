// wg-inventory.js — Inventory widget (E5.5/2024). Custom kind:'inventory'.
//
// Follows the wg-combat.js pattern (foreignObject + HTML), NOT the simple
// infobox column model: items are info boxes with sub-info + long notes + optionally
// a mini image — that does not fit in a fixed-column table.
//
//  - Items from per-character state.items {name, qty?, weight?, notes?, ref?,
//    equipped?}, joined onto DATA.itemDB (the read-only definition) for derived
//    fields (type, damage, mastery, armor AC, cost, ...).
//  - Two display variants via cfg.display: 'text' (default) | 'image'
//    (mini image with glyph fallback). Toggle in widget settings.
//  - Hover/long-press tooltip per box via data-tip-title/data-tip-body — relies on
//    the existing tooltip layer (wg-events.js initInfoTooltip → closest('[data-tip-*]')).
//  - Reflow: CSS grid auto-fill (--inv-box-min) → the browser rearranges the
//    boxes by itself on every width change (req 6).
//  - Fit-to-content: _fitInventorySpanY (mirror of _fitCombatSpanY) picks the
//    smallest spanUnitsY in which all boxes fit; recomputeInventoryWidgets in
//    the render pass (wg-render.js) keeps it fitted even when items change.
//
// Read-only v1 (Joshua's choice): no edit interaction; display + tooltips.
// Load order: AFTER wg-state.js (WG_WIDGET_TYPES) and AFTER wg-combat.js (hEl/WG_XHTML_NS).
// Engine/render call _fitInventorySpanY/drawInventoryGrid/recomputeInventoryWidgets
// at runtime with typeof guards, so the exact load order relative to engine is free.

// ===== Widget type registration =====
Object.assign(WG_WIDGET_TYPES, {
  inventory: { label: 'Inventory', kind: 'inventory', spanUnits: 7, spanUnitsY: 8,
               cfg: { widgetPadding: 6, display: 'text', boxMinPx: 138 } },
});

// ===== Type → glyph (image-variant fallback + text-variant accent) =====
var INV_GLYPH = {
  weapon: '⚔️', armor: '🛡️', shield: '🛡️',
  ammunition: '🏹', tool: '🔧', gear: '🎒',
  container: '🧳', consumable: '🧪', potion: '🧪',
  pack: '📦', scroll: '📜', wand: '✨', ring: '💍',
  currency: '🪙', treasure: '💎', misc: '❓',
};
var INV_TYPE_LABEL = {
  weapon: 'Weapon', armor: 'Armor', shield: 'Shield', ammunition: 'Ammunition',
  tool: 'Tool', gear: 'Gear', container: 'Container', consumable: 'Consumable',
  potion: 'Potion', pack: 'Equipment Pack', misc: 'Item',
};
function invGlyph(item) {
  if (item && item.subtype === 'focus') return '✨';
  return (item && INV_GLYPH[item.type]) || INV_GLYPH.misc;
}

// ===== Name normalization + lookup =====
function invNorm(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .replace(/[‘’ʼ`´]/g, "'")   // unify apostrophes
    .replace(/\s+/g, ' ')
    .trim();
}
// Aliases for wizard/seed strings that do not match an itemDB name 1:1.
var INV_ALIASES = {
  'rope': 'rope-50', 'rope (50ft)': 'rope-50', 'hempen rope': 'rope-50',
  'rations': 'rations-1', 'rations (1 dag)': 'rations-1',
  'studded leather': 'studded-leather',
  'leather': 'leather-armor', 'hide': 'hide-armor',
  'thieves tools': 'thieves-tools', "thieves' tools": 'thieves-tools',
  'small knife': 'dagger', 'knife': 'dagger', 'small knife (dagger)': 'dagger',
  'holy symbol (amulet)': 'holy-symbol', 'holy symbol (emblem)': 'holy-symbol',
  'holy symbol (reliquary)': 'holy-symbol',
  'arrows': 'arrows-20', 'bolts': 'bolts-20', 'sling bullets': 'sling-bullets-20',
};
var _invIndex = null;
function invIndex() {
  if (_invIndex) return _invIndex;
  var idx = {};
  var db = (typeof DATA !== 'undefined' && Array.isArray(DATA.itemDB)) ? DATA.itemDB : [];
  for (var i = 0; i < db.length; i++) {
    var it = db[i];
    idx[invNorm(it.name)] = it;
    if (it.id) idx[invNorm(it.id.replace(/-/g, ' '))] = it;
    // secondary key without trailing " armor" → "studded leather" matches "Studded Leather Armor"
    var noArmor = invNorm(it.name).replace(/ armor$/, '');
    if (!(noArmor in idx)) idx[noArmor] = it;
  }
  _invIndex = idx;
  return idx;
}
// Resolve a (already normalized) base name → itemDB entry or null.
function invLookup(name) {
  var n = invNorm(name);
  if (!n) return null;
  var idx = invIndex();
  if (idx[n]) return idx[n];
  if (INV_ALIASES[n]) {
    var aliasNorm = invNorm(INV_ALIASES[n].replace(/-/g, ' '));
    if (idx[aliasNorm]) return idx[aliasNorm];
  }
  var noArmor = n.replace(/ armor$/, '');
  if (idx[noArmor]) return idx[noArmor];
  return null;
}
// Pack lookup (separate from itemDB).
function invPack(name) {
  if (typeof DATA === 'undefined' || !DATA.itemPacks) return null;
  var n = invNorm(name);
  for (var key in DATA.itemPacks) {
    if (invNorm(key) === n) return { key: key, def: DATA.itemPacks[key] };
  }
  return null;
}

// Parse a raw equipment string → { base, count, choice, notes }.
function invParseRaw(raw) {
  var s = String(raw || '').trim();
  var count = 1, choice = false, noteBits = [];
  // count: "(x2)" | "(20)" | "x10"
  var m;
  if ((m = s.match(/\(x(\d+)\)/i))) { count = parseInt(m[1], 10); s = s.replace(m[0], ' '); }
  else if ((m = s.match(/\((\d+)\)/))) { count = parseInt(m[1], 10); s = s.replace(m[0], ' '); }
  else if ((m = s.match(/\bx(\d+)\b/i))) { count = parseInt(m[1], 10); s = s.replace(m[0], ' '); }
  // choice-markers
  if (/\(one of your choice\)|\(your choice\)|\(of your choice\)|\(naar keuze\)/i.test(s)) {
    choice = true; s = s.replace(/\((?:one )?(?:of )?your choice\)|\(naar keuze\)/ig, ' ');
  }
  // modifier suffixes → notes, not in the base name
  var modRe = /\((offhand|thrown|main hand|mainhand|reserve)\)/ig;
  while ((m = modRe.exec(s))) noteBits.push(m[1]);
  s = s.replace(modRe, ' ');
  var base = s.replace(/\s+/g, ' ').trim();
  return { base: base, count: Math.max(1, count || 1), choice: choice, notes: noteBits.join(', ') };
}

// Resolve a list of raw equipment strings → inventory records (for the wizard).
// Packs are expanded into their individual items. Unmatchable strings become
// custom items without ref (still shown with their name).
function invMakeRecord(db, fallbackName, qty, noteBits) {
  var rec = { name: db ? db.name : fallbackName, qty: qty };
  if (db && db.id) rec.ref = db.id;
  if (db && typeof db.weight === 'number') rec.weight = db.weight;
  var notes = (noteBits || []).filter(Boolean);
  if (notes.length) rec.notes = notes.join(' · ');
  return rec;
}
function invResolveStrings(strings, outerCount) {
  outerCount = outerCount || 1;
  var out = [];
  if (!Array.isArray(strings)) return out;
  for (var i = 0; i < strings.length; i++) {
    var raw = String(strings[i] == null ? '' : strings[i]).trim();
    if (!raw) continue;
    // 1. Pack? → expand into individual items.
    var pk = invPack(raw);
    if (pk) {
      for (var c = 0; c < pk.def.contents.length; c++) {
        var ref = pk.def.contents[c][0], q = pk.def.contents[c][1] || 1;
        out = out.concat(invResolveStrings([ref], q * outerCount));
      }
      continue;
    }
    // 2. Direct full-name match: the count is part of the canonical name
    //    ("Ball Bearings (1000)", "Arrows (20)", "Rations (1 day)") → 1 unit.
    var direct = invLookup(raw);
    if (direct && invNorm(direct.name) === invNorm(raw)) {
      out.push(invMakeRecord(direct, raw, outerCount, []));
      continue;
    }
    // 3. Parse count/choice/notes, then look up the base name.
    var p = invParseRaw(raw);
    if (!p.base) continue;
    var db = invLookup(p.base);
    var qty = p.count * outerCount;
    // ammo bundle: "Arrows (20)" with bundleSize 20 = 1 bundle, not 20 pieces
    if (db && db.type === 'ammunition' && db.bundleSize && db.bundleSize === p.count) qty = outerCount;
    out.push(invMakeRecord(db, p.base, qty, [p.choice ? 'choose variant' : '', p.notes]));
  }
  return out;
}

// ===== Merged item view for render =====
// Reads state.items of the active character, joined onto itemDB.
function invItemsForChar() {
  var raw = (typeof WG_CHAR_CACHE !== 'undefined' && WG_CHAR_CACHE[state.characterId]) || {};
  var st = raw.state || {};
  var items = Array.isArray(st.items) ? st.items : [];
  return items.map(function (it) {
    var db = it.ref ? invLookupById(it.ref) : invLookup(it.name);
    var pk = db ? null : invPack(it.name);
    var type = db ? db.type : (pk ? 'pack' : 'misc');
    var weight = (typeof it.weight === 'number') ? it.weight
      : (db && typeof db.weight === 'number' ? db.weight : null);
    return {
      name: it.name || (db && db.name) || '—',
      qty: (typeof it.qty === 'number' && it.qty > 0) ? it.qty : 1,
      weight: weight,
      notes: it.notes || '',
      type: type, subtype: db ? db.subtype : null,
      db: db, pack: pk,
    };
  });
}
function invLookupById(id) {
  var db = (typeof DATA !== 'undefined' && Array.isArray(DATA.itemDB)) ? DATA.itemDB : [];
  for (var i = 0; i < db.length; i++) if (db[i].id === id) return db[i];
  return invLookup(id.replace(/-/g, ' '));
}

// ===== Tooltip construction =====
function invFmtCost(db) {
  if (!db || db.cost == null) return null;
  return db.cost + ' ' + (db.costUnit || 'gp');
}
function invMasteryDesc(key) {
  var m = (typeof DATA !== 'undefined' && DATA.items && DATA.items.weaponMasteryDesc) || {};
  return m[key] || '';
}
function invCap(s) { s = String(s || ''); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

// Compact meta line under the name (text variant).
function invMetaLine(item) {
  var db = item.db, bits = [];
  if (item.weight != null) bits.push(item.weight + ' lb');
  if (db) {
    if (db.type === 'weapon') { if (db.dmg) bits.push(db.dmg + ' ' + (db.damageType || '')); if (db.mastery) bits.push(invCap(db.mastery)); }
    else if (db.type === 'armor') { bits.push('AC ' + db.baseAC + (db.dexCap === null ? ' + Dex' : db.dexCap === 0 ? '' : ' + Dex (max ' + db.dexCap + ')')); }
    else if (db.type === 'shield') { bits.push('+' + db.acBonus + ' AC'); }
    else if (db.type === 'ammunition') { /* weight only */ }
    else { bits.push(INV_TYPE_LABEL[db.type] || invCap(db.type)); }
  } else if (item.pack) { bits.push(INV_TYPE_LABEL.pack); }
  if (item.qty > 1) bits.unshift('×' + item.qty);
  return bits.filter(Boolean).join(' · ');
}

function invTooltip(item) {
  var db = item.db;
  var title = item.name + (item.qty > 1 ? ' ×' + item.qty : '');
  var lines = [];
  if (item.pack) {
    lines.push(INV_TYPE_LABEL.pack);
    var cost = (item.pack.def.cost != null) ? (item.pack.def.cost + ' ' + (item.pack.def.costUnit || 'gp')) : null;
    if (cost) lines.push('Cost: ' + cost);
    lines.push('');
    lines.push('Contents:');
    item.pack.def.contents.forEach(function (c) { lines.push('• ' + c[0] + (c[1] > 1 ? ' ×' + c[1] : '')); });
  } else if (db) {
    var sub = db.subtype ? (' · ' + invCap(db.subtype.replace('-', ' '))) : '';
    lines.push((INV_TYPE_LABEL[db.type] || invCap(db.type)) + sub);
    if (db.type === 'weapon') {
      if (db.dmg) lines.push('Damage: ' + db.dmg + ' ' + (db.damageType || ''));
      if (db.versatile) lines.push('Versatile: ' + db.versatile + ' (two-handed)');
      if (db.range) lines.push('Range: ' + db.range.normal + '/' + db.range.long + ' ft');
      if (db.properties && db.properties.length) lines.push('Properties: ' + db.properties.join(', '));
      if (db.mastery) { lines.push(''); lines.push('Mastery — ' + invCap(db.mastery)); var md = invMasteryDesc(db.mastery); if (md) lines.push(md); }
    } else if (db.type === 'armor') {
      lines.push('Base AC: ' + db.baseAC + (db.dexCap === null ? ' + Dex' : db.dexCap === 0 ? ' (no Dex)' : ' + Dex (max ' + db.dexCap + ')'));
      if (db.strengthReq) lines.push('Requires Str ' + db.strengthReq);
      if (db.stealthDisadvantage) lines.push('Disadvantage on Stealth');
    } else if (db.type === 'shield') {
      lines.push('AC-bonus: +' + db.acBonus);
    }
    if (db.description) { lines.push(''); lines.push(db.description); }
    var foot = [];
    if (item.weight != null) foot.push(item.weight + ' lb');
    var cst = invFmtCost(db); if (cst) foot.push(cst);
    if (foot.length) { lines.push(''); lines.push(foot.join(' · ')); }
  } else {
    lines.push(INV_TYPE_LABEL.misc);
    if (item.weight != null) lines.push(item.weight + ' lb');
  }
  if (item.notes) { lines.push(''); lines.push(item.notes); }
  return { title: title, body: lines.join('\n') };
}

// ===== Render =====
function invHEl(tag, cls, txt) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt != null) e.textContent = txt;
  return e;
}
function drawInventoryGrid(g, widget, x, contentY, w, contentH, widgetIdx) {
  if (w <= 0 || contentH <= 0) return;
  // Warm the character cache so state.items resolves, also on an inventory-only
  // tab where no infobox widget triggered the fetch yet (guard against refetch storm).
  if (typeof fetchCharacterData === 'function' && state.characterId &&
      !(typeof WG_CHAR_CACHE !== 'undefined' && WG_CHAR_CACHE[state.characterId])) {
    var _st = (typeof WG_CHAR_STATUS !== 'undefined') ? WG_CHAR_STATUS[state.characterId] : null;
    if (_st !== 'loading' && _st !== 'ready' && _st !== 'error') fetchCharacterData(state.characterId);
  }
  var display = (widget.cfg && widget.cfg.display === 'image') ? 'image' : 'text';
  var boxMin = (widget.cfg && widget.cfg.boxMinPx) || 138;
  var pad = (widget.cfg && typeof widget.cfg.widgetPadding === 'number') ? widget.cfg.widgetPadding : 6;
  var items = invItemsForChar();

  var fo = el('foreignObject', { x: x, y: contentY, width: w, height: contentH });
  var root = document.createElement('div');
  root.setAttribute('xmlns', (typeof WG_XHTML_NS !== 'undefined') ? WG_XHTML_NS : 'http://www.w3.org/1999/xhtml');
  root.className = 'inv-root inv-display-' + display + (widget._invFits ? ' inv-fitted' : '');
  root.style.setProperty('--inv-box-min', boxMin + 'px');
  root.style.setProperty('--inv-pad', pad + 'px');
  // Inventory interactions must not trigger the canvas drag arbiter.
  root.addEventListener('pointerdown', function (e) { e.stopPropagation(); });

  var grid = invHEl('div', 'inv-grid');
  if (items.length === 0) {
    grid.appendChild(invHEl('div', 'inv-empty', 'No items'));
  } else {
    for (var i = 0; i < items.length; i++) {
      grid.appendChild(invBoxNode(items[i], display));
    }
  }
  root.appendChild(grid);

  // Summary: total weight + count.
  var total = 0, known = false;
  for (var k = 0; k < items.length; k++) {
    if (items[k].weight != null) { total += items[k].weight * items[k].qty; known = true; }
  }
  var summary = invHEl('div', 'inv-summary');
  var cnt = items.reduce(function (a, it) { return a + it.qty; }, 0);
  summary.appendChild(invHEl('span', 'inv-summary-count', cnt + (cnt === 1 ? ' item' : ' items')));
  if (known) summary.appendChild(invHEl('span', 'inv-summary-weight', (Math.round(total * 10) / 10) + ' lb'));
  root.appendChild(summary);

  fo.appendChild(root);
  g.appendChild(fo);
}

function invBoxNode(item, display) {
  var box = invHEl('div', 'inv-box inv-type-' + (item.type || 'misc'));
  var tip = invTooltip(item);
  box.setAttribute('data-tip-title', tip.title);
  box.setAttribute('data-tip-body', tip.body);

  if (display === 'image') {
    var imgWrap = invHEl('div', 'inv-img');
    var src = item.db && item.db.image;
    if (src && typeof resolveImageSrc === 'function') src = resolveImageSrc(src);
    if (src) {
      var img = document.createElement('img');
      img.src = src; img.alt = '';
      img.addEventListener('error', function () {
        if (img.parentNode) img.parentNode.replaceChild(invHEl('span', 'inv-glyph', invGlyph(item.db || item)), img);
      });
      imgWrap.appendChild(img);
    } else {
      imgWrap.appendChild(invHEl('span', 'inv-glyph', invGlyph(item.db || item)));
    }
    box.appendChild(imgWrap);
    var nm = invHEl('div', 'inv-name', item.name);
    box.appendChild(nm);
    if (item.qty > 1) box.appendChild(invHEl('div', 'inv-qty', '×' + item.qty));
  } else {
    var head = invHEl('div', 'inv-box-head');
    head.appendChild(invHEl('span', 'inv-name', item.name));
    if (item.qty > 1) head.appendChild(invHEl('span', 'inv-qty', '×' + item.qty));
    box.appendChild(head);
    var meta = invMetaLine(item);
    if (meta) box.appendChild(invHEl('div', 'inv-meta', meta));
    // #OvvLMOV: notes NOT on the card (variable height → overflow). They are in the
    // tooltip (invTooltip line ~266). Cards thus keep a uniform fixed size.
  }
  return box;
}

// ===== Fit-to-content =====
// row px estimates (deliberately generous — same philosophy as COMBAT_FIT). Text box
// is taller (name + meta + optional notes); image box more compact but with thumbnail.
// #OvvLMOV: rowPx == the fixed grid-auto-rows heights (54 text / 96 image) so that
// the height fit is exact and nothing clips.
var INV_FIT = { headPx: 6, summaryPx: 22, gapPx: 8, textRowPx: 54, imageRowPx: 96, minSpanY: 3 };
function _fitInventorySpanY(growOnly) {
  var w = state.widget;
  if (!w) return;
  var items = invItemsForChar();
  var n = Math.max(items.length, 1);
  var display = (w.cfg && w.cfg.display === 'image') ? 'image' : 'text';
  var boxMin = (w.cfg && w.cfg.boxMinPx) || 138;
  var pad = (w.cfg && typeof w.cfg.widgetPadding === 'number') ? w.cfg.widgetPadding : 6;
  var W = widgetPxWFor(w.spanUnits);
  var avail = W - 2 * pad;
  var perRow = Math.max(1, Math.floor((avail + INV_FIT.gapPx) / (boxMin + INV_FIT.gapPx)));
  var rows = Math.ceil(n / perRow);
  var rowPx = (display === 'image') ? INV_FIT.imageRowPx : INV_FIT.textRowPx;
  var pxNeeded = INV_FIT.headPx + 2 * pad + INV_FIT.summaryPx + rows * rowPx + (rows - 1) * INV_FIT.gapPx;
  var maxSpanUnitsY = Math.max(INV_FIT.minSpanY, rowsPerPage());
  var chosen = maxSpanUnitsY;
  for (var s = INV_FIT.minSpanY; s <= maxSpanUnitsY; s++) {
    if (widgetContentPxHFor(s) >= pxNeeded) { chosen = s; break; }
  }
  chosen = Math.max(INV_FIT.minSpanY, Math.min(chosen, maxSpanUnitsY));
  w.spanUnitsY = growOnly ? Math.max(w.spanUnitsY, chosen) : chosen;
  w._invFits = widgetContentPxHFor(w.spanUnitsY) >= pxNeeded;
}

// Fit all inventory widgets before a render pass (idempotent → no render storm).
function recomputeInventoryWidgets(growOnly) {
  if (!state.widgets) return;
  for (var i = 0; i < state.widgets.length; i++) {
    var w = state.widgets[i];
    if (widgetKind(w) !== 'inventory') continue;
    withWidget(w, function () { _fitInventorySpanY(!!growOnly); });
  }
}

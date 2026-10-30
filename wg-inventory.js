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
// Editable: click a box to edit/remove it, "+ Add" adds from itemDB/packs or a
// custom item. Equipped armor/shield feed getAC; the summary shows carried weight
// vs carrying capacity and attunement slots.
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
  return items.map(function (it, idx) {
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
      idx: idx, equipped: !!it.equipped, attuned: !!it.attuned,
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
  var flags = [item.equipped ? 'Equipped' : '', item.attuned ? 'Attuned' : ''].filter(Boolean);
  if (flags.length) { lines.push(''); lines.push(flags.join(' · ')); }
  if (item.notes) { lines.push(''); lines.push(item.notes); }
  lines.push(''); lines.push('Click to edit');
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
  var add = invHEl('button', 'inv-add', '+ Add');
  add.type = 'button';
  add.addEventListener('click', function (e) { e.stopPropagation(); invAddItem(state.characterId); });
  summary.appendChild(add);
  var cnt = items.reduce(function (a, it) { return a + it.qty; }, 0);
  summary.appendChild(invHEl('span', 'inv-summary-count', cnt + (cnt === 1 ? ' item' : ' items')));
  var rawC = (typeof WG_CHAR_CACHE !== 'undefined' && WG_CHAR_CACHE[state.characterId]) || {};
  var cfgC = rawC.config || {}, stC = rawC.state || {};
  var attuned = items.filter(function (it) { return it.attuned; }).length;
  if (attuned && typeof getAttunementMax === 'function') {
    summary.appendChild(invHEl('span', 'inv-summary-attune', 'Attuned ' + attuned + '/' + getAttunementMax(cfgC, stC)));
  }
  if (known) {
    var lb = Math.round(total * 10) / 10;
    var cap = (typeof getCarryingCapacity === 'function' && cfgC.className) ? getCarryingCapacity(cfgC, stC) : null;
    var wt = invHEl('span', 'inv-summary-weight' + (cap && lb > cap ? ' inv-summary-over' : ''), lb + (cap ? ' / ' + cap : '') + ' lb');
    if (cap) {
      wt.setAttribute('data-tip-title', 'Carrying capacity');
      wt.setAttribute('data-tip-body', 'Strength × 15 = ' + cap + ' lb.' + (lb > cap ? '\nOver capacity: you can only drag, lift or push this much, at a Speed of at most 5 ft.' : ''));
    }
    summary.appendChild(wt);
  }
  root.appendChild(summary);

  fo.appendChild(root);
  g.appendChild(fo);
}

function invBoxNode(item, display) {
  var box = invHEl('div', 'inv-box inv-type-' + (item.type || 'misc') + (item.equipped ? ' is-equipped' : ''));
  box.addEventListener('click', function (e) { e.stopPropagation(); invEditItem(state.characterId, item.idx); });
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
    var fl = (item.equipped ? 'E' : '') + (item.attuned ? 'A' : '');
    if (fl) head.appendChild(invHEl('span', 'inv-flag', fl));
    box.appendChild(head);
    var meta = invMetaLine(item);
    if (meta) box.appendChild(invHEl('div', 'inv-meta', meta));
    // #OvvLMOV: notes NOT on the card (variable height → overflow). They are in the
    // tooltip (invTooltip line ~266). Cards thus keep a uniform fixed size.
  }
  return box;
}

// ===== Editing =====
function invRawList(charId) {
  var raw = (typeof WG_CHAR_CACHE !== 'undefined' && WG_CHAR_CACHE[charId]) || {};
  var items = (raw.state && Array.isArray(raw.state.items)) ? raw.state.items : [];
  return items.map(function (it) { return Object.assign({}, it); });
}
function invClean(rec) {
  var out = {};
  Object.keys(rec).forEach(function (k) {
    var v = rec[k];
    if (v === null || v === undefined || v === '' || v === false) return;
    out[k] = v;
  });
  return out;
}
async function invSaveList(charId, list) {
  var items = list.map(invClean);
  var patch = { items: items.length ? items : null };
  // Keep the legacy shield flag in step with what is equipped.
  var gear = (typeof getEquippedGear === 'function') ? getEquippedGear({ items: items }) : {};
  patch.equippedShield = gear.shield ? true : null;
  try { await wgxPatchState(charId, patch); }
  catch (e) { showToast('Could not save the inventory: ' + e.message, 'error'); }
}
function invDbNames() {
  var db = (typeof DATA !== 'undefined' && Array.isArray(DATA.itemDB)) ? DATA.itemDB.map(function (d) { return d.name; }) : [];
  var packs = (typeof DATA !== 'undefined' && DATA.itemPacks) ? Object.keys(DATA.itemPacks) : [];
  return db.concat(packs).sort();
}
function invAttuneCheck(charId, list, skipIdx) {
  var raw = (typeof WG_CHAR_CACHE !== 'undefined' && WG_CHAR_CACHE[charId]) || {};
  var max = (typeof getAttunementMax === 'function') ? getAttunementMax(raw.config || {}, raw.state || {}) : 3;
  var used = list.filter(function (it, i) { return i !== skipIdx && it.attuned; }).length;
  return used >= max ? 'You can be attuned to at most ' + max + ' items. Unattune another item first.' : null;
}
async function invAddItem(charId) {
  if (!charId) return;
  var res = await showFormModal({
    title: 'Add item', confirmLabel: 'Add',
    fields: [
      { key: 'name', label: 'Item', list: invDbNames(), placeholder: 'Pick from the list or type your own',
        hint: 'Equipment packs are unpacked into their separate items.' },
      { key: 'qty', label: 'Quantity', type: 'number', value: 1, min: 1 },
    ],
    validate: function (v) {
      if (!v.name) return 'Please enter an item name.';
      if (!(v.qty >= 1)) return 'Quantity must be at least 1.';
      return null;
    },
  });
  if (!res) return;
  var list = invRawList(charId);
  var recs = invResolveStrings([res.values.name], Math.floor(res.values.qty));
  recs.forEach(function (rec) {
    // Stack onto an existing record of the same item that has no notes.
    var same = list.find(function (it) { return !it.notes && (rec.ref ? it.ref === rec.ref : invNorm(it.name) === invNorm(rec.name)); });
    if (same && !rec.notes) same.qty = (typeof same.qty === 'number' ? same.qty : 1) + rec.qty;
    else list.push(rec);
  });
  await invSaveList(charId, list);
  showToast(recs.length === 1 ? recs[0].name + ' added' : recs.length + ' items added');
}
async function invEditItem(charId, idx) {
  var list = invRawList(charId);
  var it = list[idx];
  if (!it) return;
  var db = it.ref ? invLookupById(it.ref) : invLookup(it.name);
  var eqLabel = db && db.type === 'armor' ? 'Equipped (wearing it, sets your AC)'
    : db && db.type === 'shield' ? 'Equipped (+' + (db.acBonus || 2) + ' AC)' : 'Equipped (in hand or worn)';
  var res = await showFormModal({
    title: 'Edit ' + (it.name || 'item'), confirmLabel: 'Save',
    fields: [
      { key: 'name', label: 'Name', value: it.name || '' },
      { key: 'qty', label: 'Quantity', type: 'number', value: typeof it.qty === 'number' ? it.qty : 1, min: 1 },
      { key: 'weight', label: 'Weight per item (lb)', type: 'number', step: 0.1, min: 0,
        value: typeof it.weight === 'number' ? it.weight : (db && typeof db.weight === 'number' ? db.weight : '') },
      { key: 'equipped', label: eqLabel, type: 'checkbox', value: !!it.equipped },
      { key: 'attuned', label: 'Attuned (magic item)', type: 'checkbox', value: !!it.attuned },
      { key: 'notes', label: 'Notes', type: 'textarea', value: it.notes || '' },
    ],
    actions: [{ label: 'Remove', value: 'remove', danger: true }],
    validate: function (v) {
      if (!v.name) return 'Please enter a name.';
      if (!(v.qty >= 1)) return 'Quantity must be at least 1.';
      if (v.attuned && !it.attuned) return invAttuneCheck(charId, list, idx);
      return null;
    },
  });
  if (!res) return;
  if (res.action === 'remove') {
    if (!(await showConfirmModal({ title: 'Remove ' + (it.name || 'item') + '?', message: 'It disappears from this inventory.', confirmLabel: 'Remove', danger: true }))) return;
    list.splice(idx, 1);
    await invSaveList(charId, list);
    showToast((it.name || 'Item') + ' removed');
    return;
  }
  var v = res.values;
  if (v.name !== it.name) { delete it.ref; var nd = invLookup(v.name); if (nd && nd.id) it.ref = nd.id; }
  it.name = v.name;
  it.qty = Math.floor(v.qty);
  it.weight = (typeof v.weight === 'number') ? v.weight : null;
  it.notes = v.notes;
  it.attuned = v.attuned;
  it.equipped = v.equipped;
  // Only one suit of armor and one shield can be worn at a time.
  var nowDb = it.ref ? invLookupById(it.ref) : invLookup(it.name);
  if (v.equipped && nowDb && (nowDb.type === 'armor' || nowDb.type === 'shield')) {
    list.forEach(function (o, i) {
      if (i === idx || !o.equipped) return;
      var od = o.ref ? invLookupById(o.ref) : invLookup(o.name);
      if (od && od.type === nowDb.type) o.equipped = false;
    });
  }
  await invSaveList(charId, list);
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

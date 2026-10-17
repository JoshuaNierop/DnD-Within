
// Effective title: set by the user, otherwise auto.
// Map → name of the current map; image → type label; info → data-source label.
// Base label of a widget (without dupe number): map → map name, infobox →
// data-source label, other kinds → type label.
function widgetBaseLabel(widget) {
  if (!widget) return 'Widget';
  const kind = widgetKind(widget);
  if (kind === 'map') return currentMapName(widget) || WG_WIDGET_TYPES.map.label;
  if (kind === 'infobox') return WG_SOURCE_LABELS[widget.data && widget.data.source] || 'Widget';
  return (WG_WIDGET_TYPES[widget.type] || {}).label || 'Widget';
}
function autoTitle(widget) {
  if (!widget) return 'Widget';
  // Maps keep their map name (no numbering — every map has its own name).
  if (widgetKind(widget) === 'map') return widgetBaseLabel(widget);
  const base = widgetBaseLabel(widget);
  // Number duplicates of the same base label for ALL kinds (Ability
  // Scores, Skills, Profile picture, …): the first keeps the name, the second
  // gets " 2", etc. This way a pasted copy automatically gets a number.
  const idx = state.widgets.indexOf(widget);
  let dupes = 0;
  for (let i = 0; i < idx; i++) {
    const ow = state.widgets[i];
    if (widgetKind(ow) === 'map') continue;
    if (widgetBaseLabel(ow) === base) dupes++;
  }
  return dupes === 0 ? base : `${base} ${dupes + 1}`;
}
function displayTitle(widget) {
  if (!widget) return 'Widget';
  const t = (widget.title || '').trim();
  return t || autoTitle(widget);
}

// ===== Campaign maps =======================================================
// Catmull-Rom → smooth closed path for organic pin polygons.
function smoothClosedPath(pts) {
  const n = pts.length;
  if (n < 3) return '';
  let d = 'M' + pts[0].x.toFixed(2) + ',' + pts[0].y.toFixed(2);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i],
          p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ' C' + c1x.toFixed(2) + ',' + c1y.toFixed(2) +
         ' ' + c2x.toFixed(2) + ',' + c2y.toFixed(2) +
         ' ' + p2.x.toFixed(2) + ',' + p2.y.toFixed(2);
  }
  return d + ' Z';
}
// Legacy pin {x,y,w,h} → {shape:{kind,cx,cy,r,nodes}} (like D&D Within).
function normalizePin(pin) {
  if (!pin) return pin;
  if (pin.shape && pin.shape.kind) {
    if (!Array.isArray(pin.shape.nodes)) pin.shape.nodes = [];
    return pin;
  }
  const cx = (typeof pin.x === 'number') ? pin.x : 50;
  const cy = (typeof pin.y === 'number') ? pin.y : 50;
  let r = 5;
  if (typeof pin.w === 'number' && typeof pin.h === 'number' && (pin.w > 0 || pin.h > 0)) {
    r = (pin.w + pin.h) / 4;
  }
  pin.shape = { kind: 'circle', cx, cy, r, nodes: [] };
  return pin;
}

async function fetchMapsData() {
  if (_mapsFetchState === 'loading' || _mapsFetchState === 'ready') return;
  _mapsFetchState = 'loading';
  try {
    const res = await fetch(wgAuthUrl(`${FIREBASE_DB}/dw/world/maps.json`));
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    WG_MAPS_CACHE = (json && Array.isArray(json.dimensions)) ? json : { dimensions: [] };
    _mapsFetchState = 'ready';
  } catch (e) {
    WG_MAPS_CACHE = { dimensions: [] };
    _mapsFetchState = 'error';
  }
  render();
}

// Finds a map by id across all dimensions. → { dimIdx, map } | null
function findMapById(id) {
  if (!WG_MAPS_CACHE || !id) return null;
  const dims = WG_MAPS_CACHE.dimensions || [];
  for (let di = 0; di < dims.length; di++) {
    for (const mp of (dims[di].maps || [])) {
      if (mp.id === id) return { dimIdx: di, map: mp };
    }
  }
  return null;
}
// Resolves the map a map widget is currently showing (mapId, or the dimension's root).
function resolveWidgetMap(widget) {
  if (!WG_MAPS_CACHE || !widget || !widget.map) return null;
  const dim = (WG_MAPS_CACHE.dimensions || [])[widget.map.dimIdx];
  if (!dim) return null;
  const maps = dim.maps || [];
  if (widget.map.mapId) {
    const found = maps.find(mp => mp.id === widget.map.mapId);
    if (found) return found;
  }
  return maps.find(mp => mp.isRoot) || maps[0] || null;
}
function currentMapName(widget) {
  const mp = resolveWidgetMap(widget);
  return mp ? mp.name : null;
}

// Navigate a map widget to another map (via pin link).
function navigateMapWidget(widgetIdx, targetMapId) {
  const w = state.widgets[widgetIdx];
  if (!w || !w.map) return;
  const loc = findMapById(targetMapId);
  if (!loc) return;
  const cur = resolveWidgetMap(w);
  w.map.history.push({ dimIdx: w.map.dimIdx, mapId: cur ? cur.id : null });
  w.map.dimIdx = loc.dimIdx;
  w.map.mapId = targetMapId;
  render();
}
// Back to the previous map in the history.
function mapWidgetBack(widgetIdx) {
  const w = state.widgets[widgetIdx];
  if (!w || !w.map || !w.map.history.length) return;
  const prev = w.map.history.pop();
  w.map.dimIdx = prev.dimIdx;
  w.map.mapId = prev.mapId;
  render();
}
// Switch dimension (plane) — to the root map of that dimension.
function setMapWidgetDim(widgetIdx, dimIdx) {
  const w = state.widgets[widgetIdx];
  if (!w || !w.map) return;
  w.map.dimIdx = dimIdx;
  w.map.mapId = null;
  w.map.history = [];
  render();
}

function setActiveWidget(idx) {
  if (idx < 0 || idx >= state.widgets.length) return;
  state.activeWidgetIdx = idx;
  if (settingsScope === 'widget' && _settingsPanel && _settingsPanel.classList.contains('open')) {
    syncWidgetPanel();
  }
}

// Deselects all widgets (click in empty grid space). activeWidgetIdx = -1
// → render() draws no widget as 'active'. state.widget internally falls
// back to widget 0, so nothing crashes.
function deselectWidgets() {
  state.activeWidgetIdx = -1;
  wgClearMultiSelection();
  if (settingsScope === 'widget' && _settingsPanel && _settingsPanel.classList.contains('open')) {
    closeSettings();
  }
  render();
}

// V9: finds a free spot (down-then-right) on the current page, then on
// every existing page, then on a new page. Returns { globalCol, startRowIdx }.
function findFreeWidgetSpot(spanX, spanY) {
  const tpp = tilesPerPage();
  const rpp = rowsPerPage();
  if (tpp < 1 || rpp < 1) return { globalCol: 0, startRowIdx: 0 };
  spanX = Math.min(Math.max(1, spanX), tpp);
  spanY = Math.min(Math.max(1, spanY), rpp);
  const tryPage = (p) => {
    for (let c = 0; c <= tpp - spanX; c++) {
      for (let r = 0; r <= rpp - spanY; r++) {
        if (rectIsFree(p * tpp + c, r, spanX, spanY, state.widgets)) {
          return { globalCol: p * tpp + c, startRowIdx: r };
        }
      }
    }
    return null;
  };
  let spot = tryPage(state.currentPage);
  if (spot) return spot;
  const pc = pageCount();
  for (let p = 0; p < pc; p++) {
    if (p === state.currentPage) continue;
    spot = tryPage(p);
    if (spot) return spot;
  }
  return { globalCol: pc * tpp, startRowIdx: 0 };
}

function addWidget(partial = {}) {
  const typeKey = partial.type || WG_DEFAULT_WIDGET_TYPE;
  const t = WG_WIDGET_TYPES[typeKey] || WG_WIDGET_TYPES[WG_DEFAULT_WIDGET_TYPE];
  const spanX = Math.max(1, Math.floor(partial.spanUnits ?? t.spanUnits));
  const spanY = Math.max(1, Math.floor(partial.spanUnitsY ?? t.spanUnitsY));
  const free = findFreeWidgetSpot(spanX, spanY);
  const widget = {
    globalCol:    partial.globalCol ?? free.globalCol,
    startRowIdx:  partial.startRowIdx  ?? free.startRowIdx,
    spanUnits:    spanX,
    spanUnitsY:   spanY,
    title:        partial.title ?? '',
    type:         typeKey,
    data:         makeWidgetData(t.source || 'abilities'),
    layout:       makeWidgetLayout(),
    cfg:          makeTypeCfg(typeKey),
    map:          t.kind === 'map'   ? makeWidgetMap()   : null,
    image:        t.kind === 'image' ? makeWidgetImage() : null,
  };
  state.widgets.push(widget);
  state.activeWidgetIdx = state.widgets.length - 1;
  state.currentPage = pageOf(widget.globalCol);   // V9: jump to the page of the new widget
  if (t.kind === 'map') fetchMapsData();                          // map → shared maps
  else if (t.kind === 'infobox') {
    if (WG_CHAR_CACHE[state.characterId]) rebuildWidget(widget);     // cache hit → rows right away
    else fetchCharacterData(state.characterId);                   // cache miss → fetch + rebuild on arrival
  }
  render();
  return state.activeWidgetIdx;
}

// Applies a widget type to an existing widget: overwrites source/size
// (info) or sets up map state (map). The caller handles the confirm dialog.
function applyWidgetType(widget, typeKey) {
  const t = WG_WIDGET_TYPES[typeKey];
  if (!t || !widget) return;
  widget.type = typeKey;
  widget.spanUnits = t.spanUnits;
  widget.spanUnitsY = t.spanUnitsY;
  widget.cfg = makeTypeCfg(typeKey);
  normalizePositions();
  const _typeIdx = state.widgets.indexOf(widget);
  if (_typeIdx >= 0) resolveCollisions(_typeIdx);
  if (t.kind === 'map') {
    if (!widget.map) widget.map = makeWidgetMap();
    fetchMapsData();
    render();
  } else if (t.kind === 'image') {
    if (!widget.image) widget.image = makeWidgetImage();
    render();
  } else {
    widget.data.source = t.source;
    rebuildWidget(widget);
    render();
  }
}

function removeWidget(idx) {
  if (idx < 0 || idx >= state.widgets.length) return false;
  // V11: per-tab arrays can go to zero; no global minimum widget count
  state.widgets.splice(idx, 1);
  wgClearMultiSelection();
  if (state.activeWidgetIdx >= state.widgets.length) {
    state.activeWidgetIdx = state.widgets.length - 1;
  } else if (state.activeWidgetIdx > idx) {
    state.activeWidgetIdx -= 1;
  }
  render();
  return true;
}

// Remove all selected widgets at once (Delete with multi-select).
function removeSelectedWidgets() {
  const idxs = wgGetSelectedIdxs().sort((a, b) => b - a); // high→low: splice-safe
  if (!idxs.length) return false;
  wgClearMultiSelection();
  for (const i of idxs) state.widgets.splice(i, 1);
  state.activeWidgetIdx = -1;
  render();
  return true;
}

// ----- Click selection (user gesture) -----
// additive = Ctrl/Cmd held → toggle in the multi-selection. Otherwise: only
// this widget. The primary (last-clicked) is always state.activeWidgetIdx;
// opening settings therefore acts on the last-clicked widget.
function selectWidgetClick(idx, additive) {
  if (idx < 0 || idx >= state.widgets.length) return;
  if (!additive) {
    wgClearMultiSelection();
    setActiveWidget(idx);
    render();
    return;
  }
  const pos = wgSelectedIdxs.indexOf(idx);
  if (idx === state.activeWidgetIdx) {
    // Ctrl-clicking the active one again → deselect; promote another.
    if (pos >= 0) wgSelectedIdxs.splice(pos, 1);
    const remaining = wgSelectedIdxs.filter(i => i !== idx);
    state.activeWidgetIdx = remaining.length ? remaining[remaining.length - 1] : -1;
  } else if (pos >= 0) {
    // Selected (not active) → remove from the selection.
    wgSelectedIdxs.splice(pos, 1);
  } else {
    // Add: keep the current active one in the selection, make this one active.
    if (state.activeWidgetIdx >= 0 && wgSelectedIdxs.indexOf(state.activeWidgetIdx) < 0) {
      wgSelectedIdxs.push(state.activeWidgetIdx);
    }
    wgSelectedIdxs.push(idx);
    state.activeWidgetIdx = idx;
  }
  if (settingsScope === 'widget' && _settingsPanel && _settingsPanel.classList.contains('open')) {
    if (state.activeWidgetIdx >= 0) syncWidgetPanel(); else closeSettings();
  }
  render();
}

// ----- Clipboard (copy/paste of widgets) -----
let _wgClipboard = [];
function wgCopySelected() {
  const idxs = wgGetSelectedIdxs();
  if (!idxs.length) return false;
  _wgClipboard = idxs.map(i => {
    try { return JSON.parse(JSON.stringify(state.widgets[i])); } catch (e) { return null; }
  }).filter(Boolean);
  return _wgClipboard.length > 0;
}
// Make a custom title unique (only needed if the source had a manual title;
// empty titles are numbered by autoTitle itself).
function wgUniqueTitle(base) {
  const existing = new Set(state.widgets.map(w => (w.title || '').trim()).filter(Boolean));
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}
function wgPasteClipboard() {
  if (!_wgClipboard || !_wgClipboard.length) return false;
  const newIdxs = [];
  for (const src of _wgClipboard) {
    let clone;
    try { clone = JSON.parse(JSON.stringify(src)); } catch (e) { continue; }
    clone.spanUnits = Math.max(1, Math.floor(clone.spanUnits || 1));
    clone.spanUnitsY = Math.max(1, Math.floor(clone.spanUnitsY || 1));
    const free = findFreeWidgetSpot(clone.spanUnits, clone.spanUnitsY);
    clone.globalCol = free.globalCol;
    clone.startRowIdx = free.startRowIdx;
    // Empty title → autoTitle numbers it ("Skills", "Skills 2", …). Custom title →
    // make it unique so it doesn't clash with the original.
    if (clone.title && clone.title.trim()) clone.title = wgUniqueTitle(clone.title.trim());
    state.widgets.push(clone);
    const ni = state.widgets.length - 1;
    newIdxs.push(ni);
    const t = WG_WIDGET_TYPES[clone.type];
    if (t && t.kind === 'map') fetchMapsData();
    else if (t && t.kind === 'infobox') {
      if (WG_CHAR_CACHE[state.characterId]) rebuildWidget(clone);
      else fetchCharacterData(state.characterId);
    }
  }
  if (!newIdxs.length) return false;
  const last = newIdxs[newIdxs.length - 1];
  wgSetSelection(newIdxs);
  state.activeWidgetIdx = last;
  state.currentPage = pageOf(state.widgets[last].globalCol);
  render();
  return true;
}

// V10: DASH_Y/VERT_X/WIDGET_Y/INFO_START_Y/INFO_ROW_H were removed — they
// were only used by the since-removed rail+tick renderers.
const WIDGET_TOPBAR_H = 22; // fixed height for widget title bar

// ----- Geometry helpers -----

function flexLayout(W, tile, minSpacing) {
  // Generic flex-grid layout: fit as many tiles as possible at >= minSpacing,
  // then distribute remaining width over the (n+1) spacing slots.
  if (tile <= 0 || W <= 0) return { tileCount: 0, spacing: W / 2, valid: false };
  let n = Math.floor((W - minSpacing) / (tile + minSpacing));
  if (n < 0) n = 0;
  while (n > 0 && (n + 1) * minSpacing + n * tile > W) n--;
  const slots = n + 1;
  const remaining = W - n * tile;
  const spacing = slots > 0 ? remaining / slots : 0;
  return { tileCount: n, spacing, valid: true };
}

function dashLayout() {
  const { dashTile, dashMinSpacing } = state.config;
  return flexLayout(state.dashboard.width, dashTile, dashMinSpacing);
}

function dashVLayout() {
  const { dashTile, dashMinSpacing } = state.config;
  return flexLayout(state.dashboard.height, dashTile, dashMinSpacing);
}

// ===== V9 — Pagination engine ===============================================
// Widget position is canonically `globalCol`: absolute column on a pageless
// strip. Pages are purely derived. See Metadocs/Architecture.md.
function tilesPerPage() { return dashLayout().tileCount; }
function rowsPerPage()  { return dashVLayout().tileCount; }
function pageOf(globalCol) {
  const tpp = tilesPerPage();
  return tpp > 0 ? Math.floor(globalCol / tpp) : 0;
}
function colInPage(globalCol) {
  const tpp = tilesPerPage();
  if (tpp <= 0) return 0;
  return ((globalCol % tpp) + tpp) % tpp;
}
function widgetCol(w) { return w ? colInPage(w.globalCol) : 0; }
function pageCount() {
  let max = 0;
  for (const w of state.widgets) {
    const p = pageOf(w.globalCol + Math.max(1, w.spanUnits) - 1);
    if (p > max) max = p;
  }
  return max + 1;
}
function goToPage(p) {
  const clamped = Math.max(0, Math.min(p, pageCount() - 1));
  if (clamped !== state.currentPage) { state.currentPage = clamped; render(); }
}

// Geometry-only overlap test on the pageless strip.
function widgetsOverlap(a, b) {
  if (a.globalCol >= b.globalCol + b.spanUnits) return false;
  if (b.globalCol >= a.globalCol + a.spanUnits) return false;
  if (a.startRowIdx >= b.startRowIdx + b.spanUnitsY) return false;
  if (b.startRowIdx >= a.startRowIdx + a.spanUnitsY) return false;
  return true;
}
function rectIsFree(gc, row, span, spanY, avoid) {
  const probe = { globalCol: gc, startRowIdx: row, spanUnits: span, spanUnitsY: spanY };
  for (const w of avoid) {
    if (w === probe) continue;
    if (widgetsOverlap(probe, w)) return false;
  }
  return true;
}

// Clamp + page-boundary normalization. Replaces the span shrinking of V8's
// ensureWidgetInBounds — horizontal span is NEVER shrunk.
function normalizePositions() {
  const tpp = tilesPerPage();
  const rpp = rowsPerPage();
  for (const w of state.widgets) {
    if (!(w.globalCol >= 0)) w.globalCol = 0;
    if (w.spanUnits < 1) w.spanUnits = 1;
    if (tpp >= 1) {
      if (w.spanUnits > tpp) w.spanUnits = tpp;
      // widget may not span a page boundary → move it wholly to the next page
      if (colInPage(w.globalCol) + w.spanUnits > tpp) {
        w.globalCol = (pageOf(w.globalCol) + 1) * tpp;
      }
    }
    if (w.startRowIdx < 0) w.startRowIdx = 0;
    if (w.spanUnitsY < 1) w.spanUnitsY = 1;
    if (rpp >= 1) {
      if (w.spanUnitsY > rpp) w.spanUnitsY = rpp;
      if (w.startRowIdx + w.spanUnitsY > rpp) {
        w.startRowIdx = Math.max(0, rpp - w.spanUnitsY);
      }
    }
  }
}

// Find the first free spot for widget `w`, forward (down-then-right) from
// its current position. `avoid` = widgets not to collide with.
function scanFreeSpot(w, avoid) {
  const tpp = tilesPerPage(), rpp = rowsPerPage();
  if (tpp < 1 || rpp < 1) return { globalCol: w.globalCol, startRowIdx: w.startRowIdx };
  const span  = Math.min(w.spanUnits, tpp);
  const spanY = Math.min(w.spanUnitsY, rpp);
  const p0 = pageOf(w.globalCol), c0 = colInPage(w.globalCol), r0 = w.startRowIdx;
  const maxPage = p0 + state.widgets.length + 2;
  for (let p = p0; p <= maxPage; p++) {
    const cStart = (p === p0) ? c0 : 0;
    for (let c = cStart; c <= tpp - span; c++) {
      const rStart = (p === p0 && c === c0) ? r0 : 0;
      for (let r = rStart; r <= rpp - spanY; r++) {
        if (rectIsFree(p * tpp + c, r, span, spanY, avoid)) {
          return { globalCol: p * tpp + c, startRowIdx: r };
        }
      }
    }
  }
  return { globalCol: pageCount() * tpp, startRowIdx: 0 };
}

// Push-cascade: `anchorIdx` stays fixed, colliding widgets get the
// first free spot (down-first-then-right). Geometry-only.
function resolveCollisions(anchorIdx) {
  const tpp = tilesPerPage(), rpp = rowsPerPage();
  if (tpp < 1 || rpp < 1) return;
  const anchor = state.widgets[anchorIdx];
  if (!anchor) return;
  const placed = [anchor];
  const others = state.widgets
    .map((w, i) => ({ w, i }))
    .filter(o => o.i !== anchorIdx)
    .sort((a, b) => (a.w.globalCol - b.w.globalCol) || (a.w.startRowIdx - b.w.startRowIdx));
  for (const { w } of others) {
    let collides = false;
    for (const p of placed) { if (widgetsOverlap(w, p)) { collides = true; break; } }
    if (collides) {
      const spot = scanFreeSpot(w, placed);
      w.globalCol = spot.globalCol;
      w.startRowIdx = spot.startRowIdx;
    }
    placed.push(w);
  }
}
// Safety net: resolve any remaining overlap (e.g. after auto-fit growth).
function resolveCollisionsAll() {
  if (state.widgets.length < 2) return;
  let anchorIdx = 0, best = Infinity;
  state.widgets.forEach((w, i) => {
    const key = w.globalCol * 100000 + w.startRowIdx;
    if (key < best) { best = key; anchorIdx = i; }
  });
  resolveCollisions(anchorIdx);
}

// V10: shift widgets on later pages back so there is never an empty
// in-between page. Calls render without side-effects — is called by render()
// itself when no drag is in progress.
function compactEmptyPages() {
  const tpp = tilesPerPage();
  if (tpp < 1 || state.widgets.length === 0) return;
  // Iterative: as long as there is an empty page somewhere between occupied pages,
  // shift all widgets on pages > that index back one page.
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 64) {
    changed = false;
    const occupied = new Set(state.widgets.map(w => pageOf(w.globalCol)));
    if (occupied.size === 0) break;
    const maxP = Math.max(...occupied);
    for (let p = 0; p < maxP; p++) {
      if (!occupied.has(p)) {
        for (const w of state.widgets) {
          if (pageOf(w.globalCol) > p) w.globalCol -= tpp;
        }
        changed = true;
        break;
      }
    }
  }
}

// "Clean up": pack all widgets compactly from page 0 (down-then-right).
function compactGrid() {
  const tpp = tilesPerPage(), rpp = rowsPerPage();
  if (tpp < 1 || rpp < 1) return;
  const order = state.widgets.slice()
    .sort((a, b) => (a.globalCol - b.globalCol) || (a.startRowIdx - b.startRowIdx));
  const placed = [];
  const maxPage = state.widgets.length + 2;
  for (const w of order) {
    const span  = Math.min(w.spanUnits, tpp);
    const spanY = Math.min(w.spanUnitsY, rpp);
    let done = false;
    for (let p = 0; p <= maxPage && !done; p++) {
      for (let c = 0; c <= tpp - span && !done; c++) {
        for (let r = 0; r <= rpp - spanY && !done; r++) {
          if (rectIsFree(p * tpp + c, r, span, spanY, placed)) {
            w.globalCol = p * tpp + c;
            w.startRowIdx = r;
            done = true;
          }
        }
      }
    }
    placed.push(w);
  }
  normalizePositions();
  render();
}

function dashWidth() {
  return state.dashboard.width;
}

function dashRight() {
  return state.dashboard.leftX + state.dashboard.width;
}

function dashBottom() {
  return state.dashboard.topY + state.dashboard.height;
}

function dashTileLeftX(i) {
  const { dashTile: t } = state.config;
  const { spacing } = dashLayout();
  return state.dashboard.leftX + spacing + i * (t + spacing);
}

function dashTileTopY(i) {
  const { dashTile: t } = state.config;
  const { spacing } = dashVLayout();
  return state.dashboard.topY + spacing + i * (t + spacing);
}

function widgetLeftX() {
  return dashTileLeftX(widgetCol(state.widget));
}

function widgetRightX() {
  const { dashTile: t } = state.config;
  return dashTileLeftX(widgetCol(state.widget) + state.widget.spanUnits - 1) + t;
}

function widgetWidth() {
  return widgetRightX() - widgetLeftX();
}

function widgetTopOnDash() {
  return dashTileTopY(state.widget.startRowIdx);
}

function widgetBottomOnDash() {
  const { dashTile: t } = state.config;
  return dashTileTopY(state.widget.startRowIdx + state.widget.spanUnitsY - 1) + t;
}

function widgetHeightOnDash() {
  return widgetBottomOnDash() - widgetTopOnDash();
}

function widgetContentHeight() {
  // Dynamic topbar height (1 or 2 title lines)
  const tH = (typeof titleLayout === 'function') ? titleLayout().totalH : WIDGET_TOPBAR_H;
  return Math.max(0, widgetHeightOnDash() - tH);
}

// Hypothetical widget pixel width/height for a given span (without mutating state)
function widgetPxWFor(spanUnits) {
  if (spanUnits < 1) return 0;
  const dl = dashLayout();
  const { dashTile } = state.config;
  return spanUnits * dashTile + (spanUnits - 1) * dl.spacing;
}

function widgetContentPxHFor(spanUnitsY) {
  if (spanUnitsY < 1) return 0;
  const vl = dashVLayout();
  const { dashTile } = state.config;
  const h = spanUnitsY * dashTile + (spanUnitsY - 1) * vl.spacing;
  const tH = (typeof titleLayout === 'function') ? titleLayout().totalH : WIDGET_TOPBAR_H;
  return Math.max(0, h - tH);
}

// Adjust height so all info boxes fit exactly, given the current width.
// growOnly=true (viewport resize): span may grow but never shrink
// (dashboard resize never gives a widget fewer tiles). growOnly=false
// (widget resize / data switch): exact content fit, may also shrink.
function compactSpanUnitsY(growOnly = false) {
  const w = state.widget;
  if (!w) return;
  if (widgetKind(w) === 'combat') { _fitCombatSpanY(growOnly); return; }
  if (widgetKind(w) === 'inventory') { if (typeof _fitInventorySpanY === 'function') _fitInventorySpanY(growOnly); return; }
  if (widgetKind(w) !== 'infobox') return;             // map/image: free, independent dimensions
  const boxPxW = state.layout.boxPxW;
  const boxPxH = state.layout.boxPxH;
  const count = state.data.rows.length;
  if (count < 1 || boxPxW <= 0 || boxPxH <= 0) return;
  const minPad = state.cfg.widgetPadding;
  const minSp = state.cfg.infoBoxSpacing;
  const W = widgetPxWFor(w.spanUnits);
  // Cap at the actual number of boxes — otherwise distributeAxis spreads the
  // space over too many slots and the boxes cluster on the left.
  const boxesPerRow = Math.min(fitCount(W, boxPxW, minPad, minSp), count);
  if (boxesPerRow < 1) return;
  const rowsNeeded = Math.ceil(count / boxesPerRow);
  const pxNeeded = rowsNeeded * boxPxH + 2 * minPad + (rowsNeeded - 1) * minSp;
  const maxSpanUnitsY = Math.max(1, rowsPerPage());    // cap at screen height
  let chosen = maxSpanUnitsY;
  for (let s = 1; s <= maxSpanUnitsY; s++) {
    if (widgetContentPxHFor(s) >= pxNeeded) { chosen = s; break; }
  }
  w.spanUnitsY = growOnly ? Math.max(w.spanUnitsY, chosen) : chosen;
}

// Combat/Initiative widget: height follows the number of VISIBLE entities, in whole
// dashboard tiles (#NU-YZ6). Hidden entities do NOT count in the player variant
// — otherwise the widget size would reveal a hidden enemy (fog-of-war). The
// remaining slack is distributed between the rows via .combat-fitted
// (space-between) in the CSS. growOnly just like compactSpanUnitsY: a
// viewport resize may grow but never shrink.
//
// NOTE: the row/header px constants are estimates and must be fine-tuned
// at the table (see Todo #NU-YZ6). Deliberately a bit generous → better one tile
// too many than content that just gets cut off.
// transposeRows = number of field rows in the transposed DM table. Derived from
// WG_COMBAT_FIELDS so a new field (like 'conc') doesn't silently make the fit
// one row too short; the 8 is only the fallback if wg-combat hasn't loaded yet.
const COMBAT_FIT = { headerPx: 30, bodyPadPx: 12, rowPx: 40, rowGapPx: 5, dmHeadPx: 18, transposeRows: 8, minSpanY: 2 };
function combatFieldCount() {
  return (typeof WG_COMBAT_FIELDS !== 'undefined' && WG_COMBAT_FIELDS.length)
    ? WG_COMBAT_FIELDS.length : COMBAT_FIT.transposeRows;
}
// Measurement of the last render, only while mode + orientation are unchanged.
function combatMeasured(w) {
  const m = w && w._combatM;
  return (m && m.key === combatMode(w) + (w.cfg && w.cfg.transpose ? '-t' : '')) ? m : null;
}
// Content height (px, widgetContentPxHFor units) the combat widget needs. Uses
// the sizes measured after the last render (combatMeasureWidgets); the
// COMBAT_FIT estimates are only the fallback before the first measurement.
function combatNeededPxH(w) {
  const mode = (typeof combatMode === 'function')
    ? combatMode(w) : (w.type === 'initiativeTracker' ? 'player' : 'dm');
  let ents = [];
  try { const enc = getEncounter(); if (enc && Array.isArray(enc.entities)) ents = enc.entities; } catch (e) {}
  const n = (mode === 'player')
    ? ents.filter(e => e && e.visibility !== 'hidden').length
    : ents.length;
  const transpose = !!(w.cfg && w.cfg.transpose);
  const m = combatMeasured(w);
  if (m) {
    if (m.n === n || transpose) return m.needH;
    if (m.n > 0 && n > 0) return m.needH + (n - m.n) * m.perRow;
  }
  const C = COMBAT_FIT;
  if (transpose) {
    // Transposed: fixed row set (one row per field), doesn't grow with entities.
    const tRows = combatFieldCount();
    return C.headerPx + C.bodyPadPx + tRows * C.rowPx + (tRows - 1) * C.rowGapPx;
  }
  const rows = Math.max(n, 1);
  const headExtra = (mode === 'dm') ? (C.dmHeadPx + C.rowGapPx) : 0;
  return C.headerPx + C.bodyPadPx + headExtra + rows * C.rowPx + (rows - 1) * C.rowGapPx;
}
function combatMinSpanUnitsY(w) {
  const C = COMBAT_FIT;
  const pxNeeded = combatNeededPxH(w);
  const maxSpanUnitsY = Math.max(C.minSpanY, rowsPerPage());   // cap at screen height
  for (let s = C.minSpanY; s <= maxSpanUnitsY; s++) {
    if (widgetContentPxHFor(s) >= pxNeeded) return s;
  }
  return maxSpanUnitsY;
}
function _fitCombatSpanY(growOnly) {
  const w = state.widget;
  if (!w) return;
  const chosen = combatMinSpanUnitsY(w);
  w.spanUnitsY = growOnly ? Math.max(w.spanUnitsY, chosen) : chosen;
  // Flag for the renderer: does ALL content fit within the chosen height? If so →
  // space-between distributes the slack between the rows; if not → body scrolls.
  w._combatFits = widgetContentPxHFor(w.spanUnitsY) >= combatNeededPxH(w);
}

// Minimum WIDTH (in dashboard tiles / spanUnits) at which the combat tracker
// shows everything without horizontal scrolling. Measured after the render
// (w._combatM.minW: widest of header and table/list); until the first measurement
// only a fixed lower bound for the normal DM table (8 columns ≈ 600px).
const COMBAT_MIN_PX = 610;
function combatMinSpanUnits(w) {
  if (!w || widgetKind(w) !== 'combat') return 1;
  const m = combatMeasured(w);
  const minPx = m ? m.minW
    : ((w.cfg && w.cfg.transpose) || combatMode(w) === 'player') ? 0 : COMBAT_MIN_PX;
  const maxSpan = Math.max(1, tilesPerPage());
  for (let s = 1; s <= maxSpan; s++) {
    if (widgetPxWFor(s) >= minPx) return s;
  }
  return maxSpan;                                    // page too narrow → as wide as possible
}

// Fit all combat widgets (DM tracker + player tracker) before a render pass.
// Idempotent: same entities → same spanUnitsY, so no render storm.
function recomputeCombatWidgets(growOnly) {
  if (!state.widgets) return;
  for (const w of state.widgets) {
    if (widgetKind(w) !== 'combat') continue;
    withWidget(w, () => {
      // Enforce the width lower bound: existing too-narrow widgets (or after a
      // layout switch) grow back until all columns are visible.
      const tpp = Math.max(1, tilesPerPage());
      const minSpan = Math.min(combatMinSpanUnits(w), tpp);
      if (w.spanUnits < minSpan) {
        w.spanUnits = minSpan;
        // Shift left if needed so the wider widget fits within the page.
        const col = colInPage(w.globalCol);
        if (col + minSpan > tpp) {
          w.globalCol = pageOf(w.globalCol) * tpp + Math.max(0, tpp - minSpan);
        }
      }
      // Height after the width: a wrapped list depends on the width.
      _fitCombatSpanY(!!growOnly);
    });
  }
}

// Adjust width so all info boxes fit exactly, given the current height.
function compactSpanUnits(growOnly = false) {
  const w = state.widget;
  if (!w) return;
  if (widgetKind(w) !== 'infobox') return;             // map/image: free, independent dimensions
  const boxPxW = state.layout.boxPxW;
  const boxPxH = state.layout.boxPxH;
  const count = state.data.rows.length;
  if (count < 1 || boxPxW <= 0 || boxPxH <= 0) return;
  const minPad = state.cfg.widgetPadding;
  const minSp = state.cfg.infoBoxSpacing;
  const H = widgetContentPxHFor(w.spanUnitsY);
  const maxRowsFitting = fitCount(H, boxPxH, minPad, minSp);
  if (maxRowsFitting < 1) return;
  const minBoxesPerRow = Math.ceil(count / maxRowsFitting);
  const pxNeeded = minBoxesPerRow * boxPxW + 2 * minPad + (minBoxesPerRow - 1) * minSp;
  const maxSpanUnits = Math.max(1, tilesPerPage());    // cap at page width
  let chosen = maxSpanUnits;
  for (let s = 1; s <= maxSpanUnits; s++) {
    if (widgetPxWFor(s) >= pxNeeded) { chosen = s; break; }
  }
  w.spanUnits = growOnly ? Math.max(w.spanUnits, chosen) : chosen;
}

// How many fixed boxes fit in length L given the minimums.
// Slot model: 2 padding slots (edges) + (n-1) spacing slots (between boxes).
function fitCount(L, box, minPad, minSp) {
  if (box <= 0 || L <= 0) return 0;
  let n = Math.floor((L - 2 * minPad + minSp) / (box + minSp));
  if (n < 0) n = 0;
  while (n > 0 && 2 * minPad + n * box + (n - 1) * minSp > L) n--;
  return n;
}

// Distribute the surplus equally over all (n+1) slots: 2 padding + (n-1) spacing.
// padding and spacing thus grow equally far above their minimum, and the
// boxes stay symmetrically centered in the widget.
function distributeAxis(L, box, minPad, minSp, n) {
  if (n < 1) return { padding: minPad, spacing: minSp };
  const surplus = L - n * box - 2 * minPad - (n - 1) * minSp;
  const share = surplus / (n + 1);
  return { padding: minPad + share, spacing: minSp + share };
}

function infoBoxLayout() {
  const boxPxW = state.layout.boxPxW || 0;
  const boxPxH = state.layout.boxPxH || 0;
  const count = state.data.rows.length || 0;
  const minPad = state.cfg.widgetPadding || 0;
  const minSp = state.cfg.infoBoxSpacing || 0;

  const base = {
    boxesPerRow: 0, rows: 0, rowsNeeded: 0,
    boxPxW, boxPxH,
    paddingX: minPad, spacingX: minSp,
    paddingY: minPad, spacingY: minSp,
    fits: false,
  };

  if (boxPxW <= 0 || boxPxH <= 0 || count < 1) return base;

  const W = widgetWidth();
  const H = widgetContentHeight();

  // Cap at the actual number of boxes — otherwise distributeAxis spreads the
  // space over too many slots and the boxes cluster on the left.
  const maxPerRow = Math.min(fitCount(W, boxPxW, minPad, minSp), count);
  if (maxPerRow < 1) return base;

  const maxRowsFitting = fitCount(H, boxPxH, minPad, minSp);
  if (maxRowsFitting < 1) return base;

  const rowsNeeded = Math.ceil(count / maxPerRow);
  // Balance the boxes over the rows: not a full row + an almost-empty
  // remainder row, but roughly equal length (6 boxes, 2 rows → 3 + 3).
  const boxesPerRow = Math.ceil(count / rowsNeeded);
  const rows = Math.min(rowsNeeded, maxRowsFitting);
  const fits = rowsNeeded <= maxRowsFitting;

  const dx = distributeAxis(W, boxPxW, minPad, minSp, boxesPerRow);
  const dy = distributeAxis(H, boxPxH, minPad, minSp, rows);

  return {
    boxesPerRow, rows, rowsNeeded,
    boxPxW, boxPxH,
    paddingX: dx.padding, spacingX: dx.spacing,
    paddingY: dy.padding, spacingY: dy.spacing,
    fits,
  };
}

// V10: dashboard has a fixed size — no more user resize. Width/height simply fill
// the available space; no fraction state or bounds clamp needed.
function maxDashWidth() {
  const wrap = document.querySelector('.canvas-wrap');
  if (!wrap) return Infinity;
  const containerW = wrap.clientWidth - 4;   // canvas-wrap padding 2px → 4 px horizontal
  // Minimal so the grid runs tight along the edge of the box (request 2026-06-04).
  const PAD = 2;
  return Math.max(50, containerW - Math.max(state.dashboard.leftX, PAD) - PAD);
}

function applyResponsiveWidth() {
  const minSize = 2 * state.config.dashMinSpacing + state.config.dashTile;
  state.dashboard.width = Math.max(minSize, maxDashWidth());
}

function availableDashHeight() {
  const isMobile = window.innerWidth < 600;
  // Grid fills the box further vertically (smaller reserve). The FABs are now 70%
  // (smaller) so less clearance is needed at the bottom (2026-06-04).
  const reserved = isMobile ? 410 : 210;
  const padding = (state.config.dashPadding || 0) * 2;
  return Math.max(120, window.innerHeight - reserved - padding);
}

function naturalDashHeight() {
  return availableDashHeight();
}

function applyResponsiveHeight() {
  const minSize = 2 * state.config.dashMinSpacing + state.config.dashTile;
  state.dashboard.height = Math.max(minSize, naturalDashHeight());
}

// V9: ensureWidgetInBounds (span shrinking = the V8 bug) replaced by
// normalizePositions() — which clamps position + page boundary without shrinking span.

// ----- SVG helpers -----


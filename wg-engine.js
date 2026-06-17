
// Effectieve titel: door de gebruiker gezet, anders auto.
// Map → naam van de huidige map; image → type-label; info → data-source-label.
// Basis-label van een widget (zonder dupe-nummer): map → mapnaam, infobox →
// data-source-label, overige soorten → type-label.
function widgetBaseLabel(widget) {
  if (!widget) return 'Widget';
  const kind = widgetKind(widget);
  if (kind === 'map') return currentMapName(widget) || WG_WIDGET_TYPES.map.label;
  if (kind === 'infobox') return WG_SOURCE_LABELS[widget.data && widget.data.source] || 'Widget';
  return (WG_WIDGET_TYPES[widget.type] || {}).label || 'Widget';
}
function autoTitle(widget) {
  if (!widget) return 'Widget';
  // Maps houden hun kaartnaam (geen nummering — elke map heeft een eigen naam).
  if (widgetKind(widget) === 'map') return widgetBaseLabel(widget);
  const base = widgetBaseLabel(widget);
  // Nummer duplicaten van hetzelfde basis-label voor ALLE soorten (Ability
  // Scores, Skills, Profile picture, …): de eerste houdt de naam, de tweede
  // krijgt " 2", enz. Zo krijgt een ge-paste kopie automatisch een nummer.
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

// ===== Campagne-maps ======================================================
// Catmull-Rom → vloeiend gesloten pad voor organische pin-polygonen.
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
// Legacy pin {x,y,w,h} → {shape:{kind,cx,cy,r,nodes}} (zoals D&D Within).
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
    const res = await fetch(`${FIREBASE_DB}/dw/world/maps.json`);
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

// Zoekt een map op id over alle dimensies. → { dimIdx, map } | null
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
// Lost de map op die een map-widget nu toont (mapId, of root van de dimensie).
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

// Navigeer een map-widget naar een andere map (via pin-link).
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
// Terug naar de vorige map in de history.
function mapWidgetBack(widgetIdx) {
  const w = state.widgets[widgetIdx];
  if (!w || !w.map || !w.map.history.length) return;
  const prev = w.map.history.pop();
  w.map.dimIdx = prev.dimIdx;
  w.map.mapId = prev.mapId;
  render();
}
// Wissel van dimensie (plane) — naar de root-map van die dimensie.
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

// Deselecteert alle widgets (klik in lege grid-ruimte). activeWidgetIdx = -1
// → render() tekent geen enkele widget als 'active'. state.widget valt intern
// terug op widget 0, dus er crasht niets.
function deselectWidgets() {
  state.activeWidgetIdx = -1;
  wgClearMultiSelection();
  if (settingsScope === 'widget' && _settingsPanel && _settingsPanel.classList.contains('open')) {
    closeSettings();
  }
  render();
}

// V9: zoekt een vrije plek (omlaag-dan-rechts) op de huidige pagina, daarna op
// elke bestaande pagina, daarna op een nieuwe pagina. Returnt { globalCol, startRowIdx }.
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
  state.currentPage = pageOf(widget.globalCol);   // V9: spring naar de pagina van de nieuwe widget
  if (t.kind === 'map') fetchMapsData();                          // map → gedeelde maps
  else if (t.kind === 'infobox') {
    if (WG_CHAR_CACHE[state.characterId]) rebuildWidget(widget);     // cache hit → meteen rijen
    else fetchCharacterData(state.characterId);                   // cache miss → fetch + rebuild bij komst
  }
  render();
  return state.activeWidgetIdx;
}

// Past een widget-type toe op een bestaande widget: overschrijft source/size
// (info) of zet map-state op (map). De aanroeper regelt de confirm-dialoog.
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

// Verwijder alle geselecteerde widgets in één keer (Delete met multi-select).
function removeSelectedWidgets() {
  const idxs = wgGetSelectedIdxs().sort((a, b) => b - a); // hoog→laag: splice-veilig
  if (!idxs.length) return false;
  wgClearMultiSelection();
  for (const i of idxs) state.widgets.splice(i, 1);
  state.activeWidgetIdx = -1;
  render();
  return true;
}

// ----- Klik-selectie (user-gesture) -----
// additive = Ctrl/Cmd ingedrukt → toggle in de multi-selectie. Anders: enkel
// deze widget. De primaire (laatst-aangeklikte) is altijd state.activeWidgetIdx;
// settings openen werkt dus op de laatst aangeklikte widget.
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
    // Actieve nogmaals ctrl-klikken → deselecteren; promoveer een andere.
    if (pos >= 0) wgSelectedIdxs.splice(pos, 1);
    const remaining = wgSelectedIdxs.filter(i => i !== idx);
    state.activeWidgetIdx = remaining.length ? remaining[remaining.length - 1] : -1;
  } else if (pos >= 0) {
    // Geselecteerd (niet-actief) → uit de selectie halen.
    wgSelectedIdxs.splice(pos, 1);
  } else {
    // Toevoegen: bewaar de huidige actieve in de selectie, maak deze actief.
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

// ----- Clipboard (copy/paste van widgets) -----
let _wgClipboard = [];
function wgCopySelected() {
  const idxs = wgGetSelectedIdxs();
  if (!idxs.length) return false;
  _wgClipboard = idxs.map(i => {
    try { return JSON.parse(JSON.stringify(state.widgets[i])); } catch (e) { return null; }
  }).filter(Boolean);
  return _wgClipboard.length > 0;
}
// Maak een custom titel uniek (alleen nodig als de bron een handmatige titel
// had; lege titels nummert autoTitle vanzelf).
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
    // Lege titel → autoTitle nummert ("Skills", "Skills 2", …). Custom titel →
    // uniek maken zodat hij niet botst met het origineel.
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

// V10: DASH_Y/VERT_X/WIDGET_Y/INFO_START_Y/INFO_ROW_H zijn verwijderd — die
// werden alleen gebruikt door de inmiddels verwijderde rail+tick-renderers.
const WIDGET_TOPBAR_H = 22; // vaste hoogte voor widget-titelbalk

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

// ===== V9 — Paginerings-engine ==============================================
// Widget-positie is canoniek `globalCol`: absolute kolom op een paginaloze
// strook. Pagina's zijn puur afgeleid. Zie Metadocs/Architecture.md.
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

// Geometrie-only overlap-test op de paginaloze strook.
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

// Clamp + paginagrens-normalisatie. Vervangt de span-krimp van V8's
// ensureWidgetInBounds — horizontale span wordt NOOIT ingekrompen.
function normalizePositions() {
  const tpp = tilesPerPage();
  const rpp = rowsPerPage();
  for (const w of state.widgets) {
    if (!(w.globalCol >= 0)) w.globalCol = 0;
    if (w.spanUnits < 1) w.spanUnits = 1;
    if (tpp >= 1) {
      if (w.spanUnits > tpp) w.spanUnits = tpp;
      // widget mag geen paginagrens overspannen → schuif heel naar volgende pagina
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

// Zoek de eerste vrije plek voor widget `w`, vooruit (omlaag-dan-rechts) vanaf
// z'n huidige positie. `avoid` = widgets om niet mee te botsen.
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

// Push-cascade: `anchorIdx` blijft vast staan, botsende widgets krijgen de
// eerste vrije plek (omlaag-eerst-dan-rechts). Geometrie-only.
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
// Vangnet: los elke resterende overlap op (bv. na auto-fit-groei).
function resolveCollisionsAll() {
  if (state.widgets.length < 2) return;
  let anchorIdx = 0, best = Infinity;
  state.widgets.forEach((w, i) => {
    const key = w.globalCol * 100000 + w.startRowIdx;
    if (key < best) { best = key; anchorIdx = i; }
  });
  resolveCollisions(anchorIdx);
}

// V10: schuif widgets op latere pagina's terug zodat er nooit een lege
// tussen-pagina is. Roept render aan zonder side-effects — wordt door render()
// zelf opgeroepen wanneer er geen drag bezig is.
function compactEmptyPages() {
  const tpp = tilesPerPage();
  if (tpp < 1 || state.widgets.length === 0) return;
  // Iteratief: zolang er ergens een lege pagina tussen bezette pagina's
  // zit, schuif alle widgets op pagina's > die index één page terug.
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

// "Opruimen": pak alle widgets compact vanaf pagina 0 (omlaag-dan-rechts).
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
  // Dynamische topbar height (1 of 2 regels titel)
  const tH = (typeof titleLayout === 'function') ? titleLayout().totalH : WIDGET_TOPBAR_H;
  return Math.max(0, widgetHeightOnDash() - tH);
}

// Hypothetische widget-pixel-breedte/hoogte voor een gegeven span (zonder state te muteren)
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

// Pas hoogte aan zodat alle info-boxes precies passen, gegeven huidige breedte.
// growOnly=true (viewport-resize): span mag wel groeien maar nooit krimpen
// (dashboard-resize maakt een widget nooit minder tegels). growOnly=false
// (widget-resize / data-wissel): exacte content-fit, mag ook krimpen.
function compactSpanUnitsY(growOnly = false) {
  const w = state.widget;
  if (!w) return;
  if (widgetKind(w) === 'combat') { _fitCombatSpanY(growOnly); return; }
  if (widgetKind(w) !== 'infobox') return;             // map/image: vrije, onafhankelijke afmetingen
  const boxPxW = state.layout.boxPxW;
  const boxPxH = state.layout.boxPxH;
  const count = state.data.rows.length;
  if (count < 1 || boxPxW <= 0 || boxPxH <= 0) return;
  const minPad = state.cfg.widgetPadding;
  const minSp = state.cfg.infoBoxSpacing;
  const W = widgetPxWFor(w.spanUnits);
  // Cap op het werkelijke aantal boxes — anders verdeelt distributeAxis de
  // ruimte over te veel slots en clusteren de boxes links.
  const boxesPerRow = Math.min(fitCount(W, boxPxW, minPad, minSp), count);
  if (boxesPerRow < 1) return;
  const rowsNeeded = Math.ceil(count / boxesPerRow);
  const pxNeeded = rowsNeeded * boxPxH + 2 * minPad + (rowsNeeded - 1) * minSp;
  const maxSpanUnitsY = Math.max(1, rowsPerPage());    // cap op schermhoogte
  let chosen = maxSpanUnitsY;
  for (let s = 1; s <= maxSpanUnitsY; s++) {
    if (widgetContentPxHFor(s) >= pxNeeded) { chosen = s; break; }
  }
  w.spanUnitsY = growOnly ? Math.max(w.spanUnitsY, chosen) : chosen;
}

// Combat/Initiative-widget: hoogte volgt het aantal ZICHTBARE entities, in hele
// dashboard-tegels (#NU-YZ6). Hidden entities tellen NIET mee in de speler-variant
// — anders verraadt de widget-grootte een verborgen vijand (fog-of-war). De
// resterende speling wordt tussen de rijen verdeeld via .combat-fitted
// (space-between) in de CSS. growOnly net als compactSpanUnitsY: een
// viewport-resize mag groeien maar nooit krimpen.
//
// LET OP: de rij-/header-px-constanten zijn schattingen en moeten aan tafel
// fijngesteld worden (zie Todo #NU-YZ6). Bewust iets royaal → liever één tegel
// te veel dan content die net wegvalt.
const COMBAT_FIT = { headerPx: 30, bodyPadPx: 12, rowPx: 40, rowGapPx: 5, dmHeadPx: 18, transposeRows: 7, minSpanY: 2 };
function _fitCombatSpanY(growOnly) {
  const w = state.widget;
  if (!w) return;
  const mode = (typeof combatMode === 'function')
    ? combatMode(w) : (w.type === 'initiativeTracker' ? 'player' : 'dm');
  let ents = [];
  try { const enc = getEncounter(); if (enc && Array.isArray(enc.entities)) ents = enc.entities; } catch (e) {}
  const n = (mode === 'player')
    ? ents.filter(e => e && e.visibility !== 'hidden').length
    : ents.length;
  const C = COMBAT_FIT;
  const transpose = !!(w.cfg && w.cfg.transpose);
  let pxNeeded;
  if (transpose) {
    // Getransponeerd: vaste rij-set (één rij per veld), groeit niet met entities.
    pxNeeded = C.headerPx + C.bodyPadPx + C.transposeRows * C.rowPx + (C.transposeRows - 1) * C.rowGapPx;
  } else {
    const rows = Math.max(n, 1);
    const headExtra = (mode === 'dm') ? (C.dmHeadPx + C.rowGapPx) : 0;
    pxNeeded = C.headerPx + C.bodyPadPx + headExtra + rows * C.rowPx + (rows - 1) * C.rowGapPx;
  }
  const maxSpanUnitsY = Math.max(C.minSpanY, rowsPerPage());   // cap op schermhoogte
  let chosen = maxSpanUnitsY;
  for (let s = C.minSpanY; s <= maxSpanUnitsY; s++) {
    if (widgetContentPxHFor(s) >= pxNeeded) { chosen = s; break; }
  }
  chosen = Math.max(C.minSpanY, Math.min(chosen, maxSpanUnitsY));
  w.spanUnitsY = growOnly ? Math.max(w.spanUnitsY, chosen) : chosen;
  // Vlag voor de renderer: past álle content binnen de gekozen hoogte? Zo ja →
  // space-between verdeelt de speling tussen de rijen; zo nee → body scrollt.
  w._combatFits = widgetContentPxHFor(w.spanUnitsY) >= pxNeeded;
}

// Fit alle combat-widgets (DM-tracker + speler-tracker) vóór een render-pass.
// Idempotent: zelfde entities → zelfde spanUnitsY, dus geen render-storm.
function recomputeCombatWidgets(growOnly) {
  if (!state.widgets) return;
  for (const w of state.widgets) {
    if (widgetKind(w) === 'combat') withWidget(w, () => _fitCombatSpanY(!!growOnly));
  }
}

// Pas breedte aan zodat alle info-boxes precies passen, gegeven huidige hoogte.
function compactSpanUnits(growOnly = false) {
  const w = state.widget;
  if (!w) return;
  if (widgetKind(w) !== 'infobox') return;             // map/image: vrije, onafhankelijke afmetingen
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
  const maxSpanUnits = Math.max(1, tilesPerPage());    // cap op pagina-breedte
  let chosen = maxSpanUnits;
  for (let s = 1; s <= maxSpanUnits; s++) {
    if (widgetPxWFor(s) >= pxNeeded) { chosen = s; break; }
  }
  w.spanUnits = growOnly ? Math.max(w.spanUnits, chosen) : chosen;
}

// Hoeveel vaste boxes passen in lengte L bij gegeven minima.
// Slot-model: 2 padding-slots (randen) + (n-1) spacing-slots (tussen boxes).
function fitCount(L, box, minPad, minSp) {
  if (box <= 0 || L <= 0) return 0;
  let n = Math.floor((L - 2 * minPad + minSp) / (box + minSp));
  if (n < 0) n = 0;
  while (n > 0 && 2 * minPad + n * box + (n - 1) * minSp > L) n--;
  return n;
}

// Verdeel het surplus gelijk over alle (n+1) slots: 2 padding + (n-1) spacing.
// padding én spacing groeien dus even hard mee boven hun minimum uit, en de
// boxes blijven symmetrisch gecentreerd in de widget.
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

  // Cap op het werkelijke aantal boxes — anders verdeelt distributeAxis de
  // ruimte over te veel slots en clusteren de boxes links.
  const maxPerRow = Math.min(fitCount(W, boxPxW, minPad, minSp), count);
  if (maxPerRow < 1) return base;

  const maxRowsFitting = fitCount(H, boxPxH, minPad, minSp);
  if (maxRowsFitting < 1) return base;

  const rowsNeeded = Math.ceil(count / maxPerRow);
  // Balanceer de boxes over de rijen: niet een volle rij + bijna-lege
  // rest-rij, maar grofweg even lang (6 boxes, 2 rijen → 3 + 3).
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

// V10: dashboard heeft vaste maat — geen user-resize meer. Width/height vullen
// gewoon de beschikbare ruimte; geen fraction-state of bounds-clamp nodig.
function maxDashWidth() {
  const wrap = document.querySelector('.canvas-wrap');
  if (!wrap) return Infinity;
  const containerW = wrap.clientWidth - 4;   // canvas-wrap padding 2px → 4 px horizontaal
  // Minimaal zodat de grid strak langs de rand van de box loopt (verzoek 2026-06-04).
  const PAD = 2;
  return Math.max(50, containerW - Math.max(state.dashboard.leftX, PAD) - PAD);
}

function applyResponsiveWidth() {
  const minSize = 2 * state.config.dashMinSpacing + state.config.dashTile;
  state.dashboard.width = Math.max(minSize, maxDashWidth());
}

function availableDashHeight() {
  const isMobile = window.innerWidth < 600;
  // Grid vult de box verticaal verder (kleinere reserve). De FABs zijn nu 70%
  // (kleiner) dus er is minder clearance nodig onderaan (2026-06-04).
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

// V9: ensureWidgetInBounds (span-krimp = de V8-bug) vervangen door
// normalizePositions() — die clampt positie + paginagrens zonder span te krimpen.

// ----- SVG helpers -----


// ===== wg-events.js — drag/gesture-arbiter (V9), drag-handle proximity (V10), V11 Phase 3.2/3.3 click handlers =====
// Extracted from index.html lines 3569-3801 + 4400-4456 + 4605-5104

// ----- Drag (V9: gesture-arbiter + drag-threshold + paginering) ----- (orig 3569-3801)
// ----- Dragging (V9: gesture-arbiter + drag-threshold + paginering) -----

let dragHandle = null;
let dragOffset = { x: 0, y: 0 };
let pendingGesture = null;        // afwachtende gesture vóór de drag-threshold
let gestureCommitted = false;
let lastPointerClient = { x: 0, y: 0 };
let pageFlipAt = 0;               // debounce-timestamp voor cross-page drag
const WG_DRAG_THRESHOLD = 5;         // px — onder deze afstand is het een klik

function getSVGPoint(svg, evt) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  return pt.matrixTransform(ctm.inverse());
}

function onPointerDown(evt) {
  // Bug-reporter actief (#6): de canvas mag de interactie NIET kapen. Zonder
  // deze guard zet pointerdown een select-gesture en re-rendert pointerup de
  // hele SVG-inhoud — het aangeklikte sub-div van de widget is dan weg vóór de
  // native click landt, dus de element-picker selecteert niets. Vroeg uitstappen
  // (geen pendingGesture) laat pointerup een no-op zijn → de click bereikt het
  // intacte sub-div → picker kan delen van widgets selecteren.
  if (typeof bugReporterActive !== 'undefined' && bugReporterActive) return;
  // Map-action buttons (upload-portrait, etc.) moeten SYNCHROON afgehandeld
  // worden in pointerdown. Anders triggert pointerup een setActiveWidget+
  // render() die de SVG-target vervangt vóór de click event fires, en gaat
  // de transient user-activation verloren in de async click-handler →
  // file picker opent niet. Sync afhandelen omzeilt beide problemen.
  if (typeof state !== 'undefined' && state.config && state.config.editValuesMode) {
    const mapActionEl = evt.target.closest && evt.target.closest('[data-map-action]');
    if (mapActionEl) {
      const action = mapActionEl.dataset.mapAction;
      const widgetG = mapActionEl.closest('[data-widget-idx]');
      const wIdx = widgetG ? parseInt(widgetG.dataset.widgetIdx, 10) : state.activeWidgetIdx;
      evt.preventDefault();
      try { handleMapAction(action, wIdx); } catch (e) { console.error('[wg] handleMapAction failed', e); }
      pendingGesture = null;
      gestureCommitted = false;
      return;
    }
  }

  let t = evt.target;
  while (t && (!t.dataset || !t.dataset.handle) && t !== document.body) {
    t = t.parentNode;
  }
  const hasHandle = !!(t && t.dataset && t.dataset.handle);

  let wEl = hasHandle ? t : evt.target;
  while (wEl && (!wEl.dataset || wEl.dataset.widgetIdx == null) && wEl !== document.body) {
    wEl = wEl.parentNode;
  }
  const wIdx = (wEl && wEl.dataset && wEl.dataset.widgetIdx != null)
    ? parseInt(wEl.dataset.widgetIdx, 10) : NaN;

  const svg = document.getElementById('canvas');
  pendingGesture = null;
  gestureCommitted = false;
  lastPointerClient = { x: evt.clientX, y: evt.clientY };

  // Bug #rC2HV4: in edit-values mode kun je een widget NIET als geheel
  // selecteren of slepen — alleen losse infobox-cellen zijn bewerkbaar (die
  // worden in de click-listener afgehandeld). Een klik op (een deel van) een
  // widget of een resize-handle doet hier dus niets; lege ruimte mag nog
  // swipen tussen pagina's.
  if (state.config && state.config.editValuesMode) {
    if (!Number.isNaN(wIdx) || hasHandle) return;
    if (evt.target.closest && evt.target.closest('#canvas')) {
      pendingGesture = { kind: 'swipe', startX: evt.clientX, startY: evt.clientY };
      try { svg && svg.setPointerCapture(evt.pointerId); } catch (e) {}
    }
    return;
  }

  if (!hasHandle) {
    // Geen handle: widget-body → selecteer-op-pointerup; lege ruimte → swipe/deselect.
    if (!Number.isNaN(wIdx)) {
      pendingGesture = { kind: 'select', widgetIdx: wIdx, startX: evt.clientX, startY: evt.clientY,
                         additive: !!(evt.ctrlKey || evt.metaKey) };
    } else if (evt.target.closest && evt.target.closest('#canvas')) {
      pendingGesture = { kind: 'swipe', startX: evt.clientX, startY: evt.clientY };
      try { svg && svg.setPointerCapture(evt.pointerId); } catch (e) {}
    }
    return;
  }

  if (!Number.isNaN(wIdx)) setActiveWidget(wIdx);
  const h = t.dataset.handle;

  // Directe acties — geen drag. (V9: widget-delete/-settings zitten niet meer
  // op de widget; verwijderen = Delete-toets, settings = topbar-knop.)
  if (h === 'map-pin')  { evt.preventDefault(); navigateMapWidget(state.activeWidgetIdx, t.dataset.target); return; }
  if (h === 'map-back') { evt.preventDefault(); mapWidgetBack(state.activeWidgetIdx); return; }
  if (h === 'map-dim')  { evt.preventDefault(); setMapWidgetDim(state.activeWidgetIdx, parseInt(t.dataset.dim, 10)); return; }

  // V10: edit-mode is altijd actief — alle widget-handles (resize + topbar
  // move) zijn beschikbaar. Handles tonen alleen op proximity (CSS), maar
  // de pointer-down accepteert ze altijd zolang ze in de DOM staan.

  // Drag-gesture in afwachting — pas vastgelegd na WG_DRAG_THRESHOLD.
  const pg = { kind: 'drag', handle: h, widgetIdx: wIdx,
               startX: evt.clientX, startY: evt.clientY, offX: 0, offY: 0 };
  if (h === 'widget-move-2d' && state.widget) {
    const p = getSVGPoint(svg, evt);
    pg.offX = p.x - widgetLeftX();
    pg.offY = p.y - dashTileTopY(state.widget.startRowIdx);
  }
  pendingGesture = pg;
  try { svg && svg.setPointerCapture(evt.pointerId); } catch (e) {}
  evt.preventDefault();
}

function onPointerMove(evt) {
  if (!pendingGesture) return;
  lastPointerClient = { x: evt.clientX, y: evt.clientY };
  if (!gestureCommitted) {
    const dx = evt.clientX - pendingGesture.startX;
    const dy = evt.clientY - pendingGesture.startY;
    if (Math.hypot(dx, dy) < WG_DRAG_THRESHOLD) return;
    gestureCommitted = true;
    if (pendingGesture.kind === 'select') {
      // Sleep vanaf een widget-body → geen drag (drag enkel via topbar). Stop.
      pendingGesture = null;
      return;
    }
    if (pendingGesture.kind === 'drag') {
      dragHandle = pendingGesture.handle;
      dragOffset.x = pendingGesture.offX;
      dragOffset.y = pendingGesture.offY;
      const svg = document.getElementById('canvas');
      if (svg && dragHandle === 'widget-move-2d') svg.classList.add('is-dragging');
    }
  }
  if (gestureCommitted && pendingGesture && pendingGesture.kind === 'drag' && dragHandle) {
    const svg = document.getElementById('canvas');
    const p = getSVGPoint(svg, evt);
    applyDrag(dragHandle, p.x, p.y);
  }
}

function onPointerUp(evt) {
  const svg = document.getElementById('canvas');
  try { if (evt && svg && evt.pointerId != null) svg.releasePointerCapture(evt.pointerId); } catch (e) {}
  const pg = pendingGesture;
  const committed = gestureCommitted;
  const hDrag = dragHandle;
  pendingGesture = null;
  gestureCommitted = false;
  dragHandle = null;
  if (svg) svg.classList.remove('is-dragging');
  if (!pg) return;

  if (!committed) {
    // Onder de drag-threshold gebleven → het was een klik.
    if (pg.kind === 'select') selectWidgetClick(pg.widgetIdx, pg.additive);
    else if (pg.kind === 'swipe') deselectWidgets();
    else render();
    return;
  }

  if (pg.kind === 'drag') {
    const idx = state.activeWidgetIdx;
    if (hDrag === 'widget-left-2d' || hDrag === 'widget-right-2d' ||
        hDrag === 'widget-bottom-2d') {
      if (idx >= 0) resolveCollisions(idx);
    } else if (hDrag === 'widget-move-2d') {
      if (idx >= 0) trySwapOrResolve(idx);
    }
  } else if (pg.kind === 'swipe') {
    finishSwipe(pg);
  }
  render();
}

// Drop op precies één andere widget → wissel posities; anders push-cascade.
function trySwapOrResolve(idx) {
  const a = state.widgets[idx];
  if (!a) return;
  const hits = [];
  state.widgets.forEach((w, j) => { if (j !== idx && widgetsOverlap(a, w)) hits.push(j); });
  if (hits.length === 1) {
    const b = state.widgets[hits[0]];
    const ag = a.globalCol, ar = a.startRowIdx;
    a.globalCol = b.globalCol; a.startRowIdx = b.startRowIdx;
    b.globalCol = ag;          b.startRowIdx = ar;
  }
  resolveCollisions(idx);
}

// Veeg in lege grid-ruimte → vorige/volgende pagina.
function finishSwipe(pg) {
  const dx = lastPointerClient.x - pg.startX;
  const SWIPE_MIN = 50;
  if (dx <= -SWIPE_MIN) goToPage(state.currentPage + 1);
  else if (dx >= SWIPE_MIN) goToPage(state.currentPage - 1);
  else deselectWidgets();
}

function applyDrag(handle, svgX, svgY) {
  const { dashTile: t } = state.config;
  // V10: dashboard heeft geen drag-handles meer — alleen widget-handles.

  if (handle === 'widget-move-2d') {
    const tpp = tilesPerPage(), rpp = rowsPerPage();
    const dl = dashLayout(), vl = dashVLayout();
    const w = state.widget;
    if (tpp < 1 || rpp < 1 || !w) return;
    // Horizontaal: snap aan kolom; rand → naburige pagina (gedebounced).
    const unitX = t + dl.spacing;
    const targetLeft = svgX - dragOffset.x;
    const relX = targetLeft - state.dashboard.leftX - dl.spacing;
    let colIdx = Math.round(relX / unitX);
    const maxCol = Math.max(0, tpp - w.spanUnits);
    const now = Date.now();
    if (colIdx < 0 && state.currentPage > 0 && now - pageFlipAt > 350) {
      state.currentPage--; pageFlipAt = now; colIdx = maxCol;
    } else if (colIdx > maxCol && now - pageFlipAt > 350) {
      state.currentPage++; pageFlipAt = now; colIdx = 0;
    }
    colIdx = Math.max(0, Math.min(colIdx, maxCol));
    w.globalCol = state.currentPage * tpp + colIdx;
    // Verticaal: snap aan rij, geclamped binnen schermhoogte.
    const unitY = t + vl.spacing;
    const targetTop = svgY - dragOffset.y;
    const relY = targetTop - state.dashboard.topY - vl.spacing;
    let rowIdx = Math.round(relY / unitY);
    rowIdx = Math.max(0, Math.min(rowIdx, Math.max(0, rpp - w.spanUnitsY)));
    w.startRowIdx = rowIdx;
  } else if (handle === 'widget-left-2d') {
    const tpp = tilesPerPage();
    const dl = dashLayout();
    const w = state.widget;
    if (tpp < 1 || !w) return;
    const unit = t + dl.spacing;
    const relX = svgX - state.dashboard.leftX - dl.spacing;
    let col = Math.round(relX / unit);
    if (col < 0) col = 0;
    const rightCol = colInPage(w.globalCol) + w.spanUnits - 1;
    if (col > rightCol) col = rightCol;
    w.spanUnits = rightCol - col + 1;
    w.globalCol = pageOf(w.globalCol) * tpp + col;
    compactSpanUnitsY();
  } else if (handle === 'widget-right-2d') {
    const tpp = tilesPerPage();
    const dl = dashLayout();
    const w = state.widget;
    if (tpp < 1 || !w) return;
    const unit = t + dl.spacing;
    const relX = svgX - state.dashboard.leftX - dl.spacing - t;
    let col = Math.round(relX / unit);
    const leftCol = colInPage(w.globalCol);
    if (col < leftCol) col = leftCol;
    if (col > tpp - 1) col = tpp - 1;
    w.spanUnits = col - leftCol + 1;
    compactSpanUnitsY();
  } else if (handle === 'widget-bottom-2d') {
    const rpp = rowsPerPage();
    const vl = dashVLayout();
    const w = state.widget;
    if (rpp < 1 || !w) return;
    const unit = t + vl.spacing;
    const relY = svgY - state.dashboard.topY - vl.spacing - t;
    let row = Math.round(relY / unit);
    if (row < w.startRowIdx) row = w.startRowIdx;
    if (row > rpp - 1) row = rpp - 1;
    w.spanUnitsY = row - w.startRowIdx + 1;
    compactSpanUnits();
  }
  render();
}

// ----- Drag-handle proximity (V10) + global pointer listeners ----- (orig 4400-4456)
// ----- Drag-handle proximity (V10) ------------------------------------------
// Toont handles alleen wanneer de muis er dichtbij is. We bewaren de laatste
// muispositie globaal en hercheck'en na elke render (handles worden vers
// getekend dus de class is anders verloren). Handles zijn display:none als ze
// niet near zijn, dus we kunnen hun screen-positie niet via getBoundingClientRect
// halen — we parsen het transform-attribuut (translate(x,y)) en mappen die
// SVG-coords naar client-coords via de SVG screen-CTM.
let _lastPointerXY = null;        // {x, y} in client-coords, of null = onbekend
const WG_HANDLE_PROXIMITY_PX = 80;   // afstand-drempel in viewport-pixels

function updateHandleProximity() {
  const xy = _lastPointerXY;
  const svg = document.getElementById('canvas');
  const ctm = svg && svg.getScreenCTM ? svg.getScreenCTM() : null;
  // Tijdens een actieve drag (resize of move) mogen handles van andere widgets
  // niet meer reageren op proximity — de cursor schiet anders door hun zone.
  const dragActive = !!dragHandle;
  const activeIdx = state.activeWidgetIdx;
  document.querySelectorAll('svg g.resize-handle').forEach(g => {
    // Drag-state nooit overschrijven — de handle die zelf gedragd wordt blijft zichtbaar.
    if (g.classList.contains('dragging')) {
      g.classList.add('proximity-near');
      return;
    }
    if (dragActive) {
      const widgetG = g.closest('g.widget');
      const wIdx = widgetG ? parseInt(widgetG.getAttribute('data-widget-idx'), 10) : NaN;
      if (wIdx !== activeIdx) { g.classList.remove('proximity-near'); return; }
    }
    if (!xy || !ctm) { g.classList.remove('proximity-near'); return; }
    const tr = g.getAttribute('transform') || '';
    const m = /translate\(\s*([\-\d.]+)[\s,]+([\-\d.]+)\s*\)/.exec(tr);
    if (!m) { g.classList.remove('proximity-near'); return; }
    const pt = svg.createSVGPoint();
    pt.x = parseFloat(m[1]);
    pt.y = parseFloat(m[2]);
    const c = pt.matrixTransform(ctm);
    const d = Math.hypot(xy.x - c.x, xy.y - c.y);
    g.classList.toggle('proximity-near', d <= WG_HANDLE_PROXIMITY_PX);
  });
}

document.addEventListener('pointermove', (e) => {
  _lastPointerXY = { x: e.clientX, y: e.clientY };
  updateHandleProximity();
});
document.addEventListener('pointerleave', () => {
  _lastPointerXY = null;
  updateHandleProximity();
});

document.addEventListener('pointerdown', onPointerDown);
document.addEventListener('pointermove', onPointerMove);
document.addEventListener('pointerup', onPointerUp);
document.addEventListener('pointercancel', onPointerUp);

// Settings menu toggle

// ===== V11 Phase 3.2 + 3.3 edit-mode click handlers ===== (orig 4605-5104)
// ===== V11 Phase 3.2: Edit-values click handler =====

// Refresh WG_CHAR_CACHE for a character id by forcing a re-fetch.
async function refreshCharCache(id) {
  WG_CHAR_STATUS[id] = null;  // clear ready/error so fetchCharacterData will re-fetch
  await new Promise(resolve => {
    const orig = WG_CHAR_CACHE;
    fetchCharacterData(id);
    // fetchCharacterData is async; wait for it via a polling check
    let t = 0;
    const check = setInterval(() => {
      t++;
      if (WG_CHAR_STATUS[id] === 'ready' || WG_CHAR_STATUS[id] === 'error' || t > 50) {
        clearInterval(check);
        resolve();
      }
    }, 100);
  });
}

// Optimistische lokale update bij een value-edit. Past de gecachte
// character-config aan, spiegelt 'm naar de D&D Within localStorage
// (`dw_charconfig_<id>`) en herbouwt alleen de widgets — GEEN re-fetch en GEEN
// renderApp. Dat is cruciaal: de Firebase-echo van de schrijfactie zou anders
// (via sync.js applyLeaves) een main-app renderApp triggeren die de hele
// character-page remount → edit-values toggle 'lijkt uit' + zichtbare flits.
// Door localStorage vóór de echo al kloppend te zetten, ziet applyLeaves
// `changed === 0` en blijft de render uit.
function wgApplyConfigEdit(charId, mutate) {
  const raw = WG_CHAR_CACHE[charId];
  if (raw) {
    if (!raw.config) raw.config = {};
    mutate(raw.config);
    try { localStorage.setItem('dw_charconfig_' + charId, JSON.stringify(raw.config)); } catch (e) {}
  }
  if (typeof rebuildAllInfoboxWidgets === 'function') rebuildAllInfoboxWidgets();
  if (typeof render === 'function') render();
}

// Write an ability score to Firebase (optimistisch, geen re-render van de app).
async function writeAbilityScore(abilityKey, value) {
  const charId = state.characterId;
  wgApplyConfigEdit(charId, cfg => {
    cfg.baseAbilities = Object.assign({}, cfg.baseAbilities || {}, { [abilityKey]: value });
  });
  const url = FIREBASE_DB + '/dw/characters/' + encodeURIComponent(charId) + '/config/baseAbilities.json';
  const body = {};
  body[abilityKey] = value;
  const res = await fetch(url, { method: 'PATCH', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
}

// Write a single character-config field (Character Info widget) to Firebase
// and refresh. Enumerated fields (race/className/subclass) are normalised back
// to their internal key so the engine stays in sync; age becomes a number when
// numeric; background is stored as typed.
async function writeCharConfigField(fieldKey, rawValue) {
  const charId = state.characterId;
  let value = String(rawValue == null ? '' : rawValue).trim();
  if (fieldKey === 'className' && typeof classKeyFromName === 'function') value = classKeyFromName(value);
  else if (fieldKey === 'race' && typeof raceKeyFromName === 'function') value = raceKeyFromName(value);
  else if (fieldKey === 'subclass' && typeof subclassKeyFromName === 'function') value = subclassKeyFromName(value);
  else if (fieldKey === 'age') { const n = parseInt(value, 10); if (!isNaN(n)) value = n; }
  const url = FIREBASE_DB + '/dw/characters/' + encodeURIComponent(charId) + '/config/' + encodeURIComponent(fieldKey) + '.json';
  wgApplyConfigEdit(charId, cfg => { cfg[fieldKey] = value; });
  const res = await fetch(url, { method: 'PUT', body: JSON.stringify(value), headers: { 'Content-Type': 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
}

// Write skill prof/expert arrays to Firebase (optimistisch, geen app-render).
async function writeSkillProficiency(skillKey, nextMark) {
  const charId = state.characterId;
  const raw = WG_CHAR_CACHE[charId];
  const cfg = (raw && raw.config) || {};
  const prof = new Set(cfg.defaultSkills || []);
  const xp   = new Set(cfg.expertSkills || []);
  if (nextMark === '○') { prof.delete(skillKey); xp.delete(skillKey); }
  else if (nextMark === '●') { prof.add(skillKey); xp.delete(skillKey); }
  else if (nextMark === '★') { prof.add(skillKey); xp.add(skillKey); }
  const profArr = [...prof], xpArr = [...xp];
  // Optimistisch: lege arrays uit de cache HALEN (Firebase dropt lege arrays,
  // dus zo blijft de lokale config structureel gelijk aan de echo → geen render).
  wgApplyConfigEdit(charId, c => {
    if (profArr.length) c.defaultSkills = profArr; else delete c.defaultSkills;
    if (xpArr.length)   c.expertSkills  = xpArr;   else delete c.expertSkills;
  });
  const base = FIREBASE_DB + '/dw/characters/' + encodeURIComponent(charId);
  const r1 = await fetch(base + '/config/defaultSkills.json', { method: 'PUT', body: JSON.stringify(profArr), headers: { 'Content-Type': 'application/json' } });
  if (!r1.ok) throw new Error('defaultSkills HTTP ' + r1.status);
  const r2 = await fetch(base + '/config/expertSkills.json',  { method: 'PUT', body: JSON.stringify(xpArr),   headers: { 'Content-Type': 'application/json' } });
  if (!r2.ok) throw new Error('expertSkills HTTP ' + r2.status);
}

// ===== V11 Phase 3.3 -- Map widget edit-mode helpers =====

function imgEvToPct(widgetIdx, e) {
  const w = state.widgets[widgetIdx];
  if (!w || !w.map) return null;
  const mapObj = resolveWidgetMap(w);
  if (!mapObj) return null;
  const svg = document.getElementById('canvas');
  const svgRect = svg.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const scaleX = vb.width  / svgRect.width;
  const scaleY = vb.height / svgRect.height;
  const svgX = (e.clientX - svgRect.left) * scaleX + vb.x;
  const svgY = (e.clientY - svgRect.top)  * scaleY + vb.y;
  const prevActive = state.activeWidgetIdx;
  state.activeWidgetIdx = widgetIdx;
  const wx = widgetLeftX();
  const wy = widgetTopOnDash();
  const ww = widgetWidth();
  const wh = widgetHeightOnDash();
  const tl = titleLayout();
  const barH = Math.min(tl.totalH, Math.max(0, wh));
  const contentY = wy + barH;
  const contentH = wh - barH;
  state.activeWidgetIdx = prevActive;
  const pad = (w.cfg && w.cfg.widgetPadding) || 0;
  const mx = wx + pad, my = contentY + pad;
  const mw = ww - 2 * pad, mh = contentH - 2 * pad;
  if (mw <= 0 || mh <= 0) return null;
  let pinX = mx, pinY = my, pinW = mw, pinH = mh;
  if (mapObj.image) {
    const dims = WG_MAP_IMAGE_DIMS.get(mapObj.image);
    if (dims && dims !== 'error' && dims !== null && dims.nw > 0 && dims.nh > 0) {
      const imgAspect = dims.nw / dims.nh;
      const rectAspect = mw / mh;
      let iw, ih;
      if (imgAspect > rectAspect) { iw = mw; ih = mw / imgAspect; }
      else                        { ih = mh; iw = mh * imgAspect; }
      pinX = mx + (mw - iw) / 2;
      pinY = my + (mh - ih) / 2;
      pinW = iw; pinH = ih;
    }
  }
  if (svgX < pinX || svgX > pinX + pinW || svgY < pinY || svgY > pinY + pinH) return null;
  const pctX = Math.max(0, Math.min(100, (svgX - pinX) / pinW * 100));
  const pctY = Math.max(0, Math.min(100, (svgY - pinY) / pinH * 100));
  return { x: pctX, y: pctY };
}

let _mapPopoverEl = null;

function dismissMapPopover() {
  if (_mapPopoverEl) { _mapPopoverEl.remove(); _mapPopoverEl = null; }
}

function showPinEditPopover(widgetIdx, pinIdOrNull, pctOrNull, clientX, clientY) {
  dismissMapPopover();
  const w = state.widgets[widgetIdx];
  if (!w) return;
  const mapObj = resolveWidgetMap(w);
  if (!mapObj) return;
  const isNew = pinIdOrNull === null;
  const existingPin = isNew ? null : (mapObj.pins || []).find(p => p.id === pinIdOrNull);

  // Gather available maps for target-map selector (excl. current map — pin can't link to its own map)
  const currentMapId = w.map && w.map.mapId;
  const allMaps = [];
  if (WG_MAPS_CACHE && WG_MAPS_CACHE.dimensions) {
    for (const dim of WG_MAPS_CACHE.dimensions) {
      if (Array.isArray(dim.maps)) for (const m of dim.maps) {
        if (m.id === currentMapId) continue;
        allMaps.push({ id: m.id, title: m.name || m.title || m.id });
      }
    }
  }

  const pop = document.createElement("div");
  pop.className = "map-edit-popover";
  pop.style.left = (clientX + 8) + "px";
  pop.style.top  = (clientY - 8) + "px";

  const labelVal  = existingPin ? (existingPin.label || "") : "";
  const targetVal = existingPin ? (existingPin.targetMap || "") : "";

  const mapOptions = allMaps.map(m =>
    "<option value=" + JSON.stringify(m.id) + (m.id === targetVal ? " selected" : "") + ">" + (m.title || m.id) + "</option>"
  ).join("");

  pop.innerHTML =
    "<div class=" + JSON.stringify("mep-row") + ">" +
    "<label>Label</label>" +
    "<input id=" + JSON.stringify("mep-label") + " type=" + JSON.stringify("text") + " value=" + JSON.stringify(labelVal) + " placeholder=" + JSON.stringify("Pin label") + " autocomplete=" + JSON.stringify("off") + ">"+
    "</div>" +
    "<div class=" + JSON.stringify("mep-row") + ">" +
    "<label>Doelkaart</label>" +
    "<select id=" + JSON.stringify("mep-target") + "><option value=" + JSON.stringify("") + ">— geen —</option>" + mapOptions + "</select>" +
    "</div>" +
    "<div class=" + JSON.stringify("mep-row mep-btns") + ">" +
    (!isNew ? "<button class=" + JSON.stringify("btn-delete") + " id=" + JSON.stringify("mep-del") + ">Verwijderen</button>" : "") +
    "<button class=" + JSON.stringify("btn-cancel") + " id=" + JSON.stringify("mep-cancel") + ">Annuleer</button>" +
    "<button class=" + JSON.stringify("btn-save") + "   id=" + JSON.stringify("mep-save") + ">Opslaan</button>" +
    "</div>";
  document.body.appendChild(pop);
  _mapPopoverEl = pop;

  // Clamp to viewport
  const pr = pop.getBoundingClientRect();
  if (pr.right > window.innerWidth - 8)  pop.style.left = (window.innerWidth - pr.width - 8) + "px";
  if (pr.bottom > window.innerHeight - 8) pop.style.top  = (clientY - pr.height - 8) + "px";

  pop.querySelector("#mep-label").focus();

  pop.querySelector("#mep-save").addEventListener("click", async () => {
    const label     = pop.querySelector("#mep-label").value.trim();
    const targetMap = pop.querySelector("#mep-target").value || null;
    const pins = [...(mapObj.pins || [])];
    if (isNew) {
      const newId = "pin_" + Date.now();
      pins.push({ id: newId, label, shape: { kind: "circle", cx: pctOrNull.x, cy: pctOrNull.y, r: 5 }, targetMap });
    } else {
      const idx = pins.findIndex(p => p.id === pinIdOrNull);
      if (idx >= 0) Object.assign(pins[idx], { label, targetMap });
    }
    dismissMapPopover();
    await savePinsToFirebase(widgetIdx, pins);
  });

  pop.querySelector("#mep-cancel").addEventListener("click", dismissMapPopover);

  const delBtn = pop.querySelector("#mep-del");
  if (delBtn) delBtn.addEventListener("click", async () => {
    const pins = (mapObj.pins || []).filter(p => p.id !== pinIdOrNull);
    dismissMapPopover();
    await savePinsToFirebase(widgetIdx, pins);
  });

  // Outside-click dismissal
  const outside = (ev) => {
    if (_mapPopoverEl && !_mapPopoverEl.contains(ev.target)) {
      dismissMapPopover();
      document.removeEventListener("mousedown", outside, true);
    }
  };
  document.addEventListener("mousedown", outside, true);
}

async function savePinsToFirebase(widgetIdx, newPins) {
  const w = state.widgets[widgetIdx];
  if (!w || !w.map) return;
  const dimIdx = w.map.dimIdx;
  const dim = (WG_MAPS_CACHE && WG_MAPS_CACHE.dimensions) ? WG_MAPS_CACHE.dimensions[dimIdx] : null;
  if (!dim) { showToast("Dimensie niet gevonden", "error"); return; }
  const maps = dim.maps || [];
  const mapArrIdx = maps.findIndex(m => m.id === w.map.mapId || (!w.map.mapId && m.isRoot));
  if (mapArrIdx < 0) { showToast("Map niet gevonden", "error"); return; }
  const url = FIREBASE_DB + "/dw/world/maps/dimensions/" + dimIdx + "/maps/" + mapArrIdx + "/pins.json";
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPins.length ? newPins : null),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    showToast("Pins opgeslagen", "success");
    WG_MAPS_CACHE = null;
    _mapsFetchState = "idle";
    await fetchMapsData();
    wgSyncMapsToLocal(); // WGI-M6
    // V11 phase 3.4: na succesvolle pin-save direct uit pin-add-modus
    if (state.config.pinAddMode === widgetIdx) {
      state.config.pinAddMode = null;
      document.body.classList.remove("pin-add-mode");
    }
    render();
  } catch (err) {
    showToast("Fout: " + err.message, "error");
  }
}

// Convert any image File to a downscaled JPEG dataURL before upload, so the
// stored payload stays small. Mirrors the canvas-resize the events.js upload
// handlers already do. Falls back to the raw dataURL if anything goes wrong.
function wgFileToJpeg(file, maxSize, quality) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height, m = maxSize || 1200;
        if (w > m || h > m) {
          if (w > h) { h = h * (m / w); w = m; }
          else { w = w * (m / h); h = m; }
        }
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        try { resolve(c.toDataURL('image/jpeg', quality || 0.8)); }
        catch (e) { resolve(ev.target.result); }
      };
      img.onerror = function () { resolve(ev.target.result); };
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadMapImage(widgetIdx, file) {
  const w = state.widgets[widgetIdx];
  if (!w || !w.map) return;
  const dimIdx = w.map.dimIdx;
  const dim = (WG_MAPS_CACHE && WG_MAPS_CACHE.dimensions) ? WG_MAPS_CACHE.dimensions[dimIdx] : null;
  if (!dim) { showToast("Dimensie niet gevonden", "error"); return; }
  const maps = dim.maps || [];
  const mapArrIdx = maps.findIndex(m => m.id === w.map.mapId || (!w.map.mapId && m.isRoot));
  if (mapArrIdx < 0) { showToast("Map niet gevonden", "error"); return; }
  showToast("Afbeelding laden...");
  // Downscale + JPEG-encode before upload (smaller payload).
  const dataUrl = await wgFileToJpeg(file, 1200, 0.8);
  // Upload binary to Firebase Storage; store only the URL (base64 fallback).
  let toStore = dataUrl;
  try { if (window.DWImages) toStore = await DWImages.save('campaign', 'maps/dim' + dimIdx + '_map' + mapArrIdx, dataUrl); } catch (_) { toStore = dataUrl; }
  const url = FIREBASE_DB + "/dw/world/maps/dimensions/" + dimIdx + "/maps/" + mapArrIdx + "/image.json";
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toStore),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    showToast("Afbeelding opgeslagen", "success");
    WG_MAPS_CACHE = null;
    _mapsFetchState = "idle";
    await fetchMapsData();
    wgSyncMapsToLocal(); // WGI-M6
  } catch (err) {
    showToast("Fout: " + err.message, "error");
  }
}

async function deleteMapFromFirebase(widgetIdx) {
  const w = state.widgets[widgetIdx];
  if (!w || !w.map) return;
  const dimIdx = w.map.dimIdx;
  const dim = (WG_MAPS_CACHE && WG_MAPS_CACHE.dimensions) ? WG_MAPS_CACHE.dimensions[dimIdx] : null;
  if (!dim) { showToast("Dimensie niet gevonden", "error"); return; }
  const maps = dim.maps || [];
  const mapArrIdx = maps.findIndex(m => m.id === w.map.mapId || (!w.map.mapId && m.isRoot));
  if (mapArrIdx < 0) { showToast("Map niet gevonden", "error"); return; }
  if (!confirm("Map verwijderen? Dit kan niet ongedaan worden gemaakt.")) return;
  const oldImg = maps[mapArrIdx] && maps[mapArrIdx].image;
  const url = FIREBASE_DB + "/dw/world/maps/dimensions/" + dimIdx + "/maps/" + mapArrIdx + ".json";
  try {
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error("HTTP " + res.status);
    if (oldImg && window.DWImages) DWImages.del(oldImg);
    showToast("Map verwijderd", "success");
    w.map = null;
    WG_MAPS_CACHE = null;
    _mapsFetchState = "idle";
    await fetchMapsData();
    wgSyncMapsToLocal(); // WGI-M6
  } catch (err) {
    showToast("Fout: " + err.message, "error");
  }
}

let _uploadInput = null;
function getUploadInput() {
  if (!_uploadInput) {
    _uploadInput = document.createElement("input");
    _uploadInput.type = "file";
    _uploadInput.accept = "image/*";
    _uploadInput.style.display = "none";
    document.body.appendChild(_uploadInput);
  }
  return _uploadInput;
}

function handleMapAction(action, widgetIdx) {
  if (action === "add-pin") {
    if (state.config.pinAddMode === widgetIdx) {
      state.config.pinAddMode = null;
      document.body.classList.remove("pin-add-mode");
    } else {
      state.config.pinAddMode = widgetIdx;
      document.body.classList.add("pin-add-mode");
    }
    render();
  } else if (action === "upload-image") {
    const inp = getUploadInput();
    inp.onchange = (ev) => {
      const file = ev.target.files[0];
      if (file) uploadMapImage(widgetIdx, file);
      inp.value = "";
    };
    inp.click();
  } else if (action === "delete-map") {
    deleteMapFromFirebase(widgetIdx);
  } else if (action === "upload-portrait") {
    const inp = getUploadInput();
    inp.onchange = (ev) => {
      const file = ev.target.files[0];
      if (file) uploadPortrait(widgetIdx, file);
      inp.value = "";
    };
    inp.click();
  } else if (action === "crop-portrait") {
    cropWidgetPortrait(widgetIdx);
  }
}

// #fATDUg: open de crop-editor voor het profielfoto-widget en sla de focal/zoom
// op onder /dw/characters/{id}/images/portraitCrop (sibling van portrait).
function cropWidgetPortrait(widgetIdx) {
  const charId = state.characterId;
  if (!charId) { showToast("Geen actieve character", "error"); return; }
  const raw = WG_CHAR_CACHE[charId];
  const src = raw && raw.images && raw.images.portrait;
  if (!src) { showToast("Geen portret om bij te snijden", "error"); return; }
  const crop = (raw.images && raw.images.portraitCrop) || null;
  if (typeof openCropEditor !== "function") { showToast("Crop-editor niet geladen", "error"); return; }
  openCropEditor({
    src: src,
    crop: crop,
    shape: "circle",
    onSave: (newCrop) => {
      if (state.characterId !== charId) return; // race-guard
      savePortraitCrop(charId, newCrop); // schrijft cache + firebase + mirror
      render();
      showToast("Uitsnede opgeslagen", "success");
    },
  });
}

// V11 Phase 3.4: upload portret naar /dw/characters/{id}/images/portrait.json
async function uploadPortrait(widgetIdx, file) {
  const charId = state.characterId;
  if (!charId) { showToast("Geen actieve character", "error"); return; }
  showToast("Afbeelding laden...");
  // Capture the existing portrait URL so we can clean up the old Cloudinary
  // asset after the replacement lands (no-op until the delete-worker is live).
  const oldPortrait = (function () { try { return localStorage.getItem('dw_img_' + charId + '_portrait') || ''; } catch (_) { return ''; } })();
  // Downscale + JPEG-encode before upload (smaller payload).
  const dataUrl = await wgFileToJpeg(file, 1200, 0.8);
  // Upload binary to Firebase Storage (off the text DB); store only the
  // resulting URL. Falls back to the base64 dataURL if Storage is off.
  let toStore = dataUrl;
  try { if (window.DWImages) toStore = await DWImages.save('player', charId + '/portrait', dataUrl); } catch (_) { toStore = dataUrl; }
  const url = FIREBASE_DB + "/dw/characters/" + encodeURIComponent(charId) + "/images/portrait.json";
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toStore),
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    // Race-guard: character may have switched during async write
    if (state.characterId !== charId) { showToast("Character gewijzigd tijdens upload", "error"); return; }
    // Refresh WG_CHAR_CACHE and rerender
    WG_CHAR_CACHE[charId] = null;
    await fetchCharacterData(charId);
    wgSyncCharToLocal(charId); // WGI-M6
    render();
    // Clean up the replaced asset (safe: live refs resolve to the entity, not
    // this URL). No-op for base64, non-Cloudinary, or when the worker is off.
    if (window.DWImages && oldPortrait && oldPortrait !== toStore && DWImages.isHttpUrl(oldPortrait)) {
      try { DWImages.del(oldPortrait); } catch (_) {}
    }
    showToast("Portret opgeslagen", "success");
  } catch (err) {
    showToast("Fout: " + err.message, "error");
  }
}

// ===== End Phase 3.3 helpers =====

// Delegated click on the SVG canvas for editable cells + map actions (V11 Phase 3.3).
// WGI fix: bind aan document zodat de listener ook werkt na latere mount
// (in standalone V8 bestaat #canvas bij script-load, in D&D Within inline-mount niet).
document.addEventListener("click", async (e) => {
  if (typeof state === "undefined" || !state.config || !state.config.editValuesMode) return;
  if (!e.target.closest || !e.target.closest("#canvas")) return;

  // Map action buttons (topbar icons in edit-values mode for map widgets)
  const mapActionEl = e.target.closest("[data-map-action]");
  if (mapActionEl) {
    const action = mapActionEl.dataset.mapAction;
    // Find which widget this button belongs to
    const widgetG = mapActionEl.closest("[data-widget-idx]");
    const wIdx = widgetG ? parseInt(widgetG.dataset.widgetIdx, 10) : state.activeWidgetIdx;
    handleMapAction(action, wIdx);
    return;
  }

  // Pin-add mode: click on map area places a new pin
  if (state.config.pinAddMode !== null) {
    const pct = imgEvToPct(state.config.pinAddMode, e);
    if (pct) {
      showPinEditPopover(state.config.pinAddMode, null, pct, e.clientX, e.clientY);
    }
    return;
  }

  // Existing pin click in edit-values mode: open edit popover
  if (state.config.editValuesMode) {
    const pinEl = e.target.closest("[data-pin-id]");
    if (pinEl) {
      // Find which widget owns this pin
      const widgetG = pinEl.closest("[data-widget-idx]");
      const wIdx = widgetG ? parseInt(widgetG.dataset.widgetIdx, 10) : state.activeWidgetIdx;
      showPinEditPopover(wIdx, pinEl.dataset.pinId, null, e.clientX, e.clientY);
      return;
    }
  }

  const cellG = e.target.closest("g.editable-cell");
  if (!cellG) return;

  const src     = cellG.dataset.source;
  const rowIdx  = parseInt(cellG.dataset.rowIdx, 10);
  const editCfg = WG_EDIT_CONFIG[src];
  if (!editCfg) return;

  const charId = state.characterId;

  // ---- WG_SKILLS: cycle the proficiency mark ----
  if (src === 'skills' && editCfg.type === 'cycle') {
    const skillKey  = WG_SKILLS[rowIdx]?.key;
    if (!skillKey) return;
    const raw = WG_CHAR_CACHE[charId];
    const cfg = (raw && raw.config) || {};
    const isExpert = new Set(cfg.expertSkills || []).has(skillKey);
    const isProf   = new Set(cfg.defaultSkills || []).has(skillKey);
    const curMark  = isExpert ? '★' : (isProf ? '●' : '○');
    const nextMark = nextSkillMark(curMark);
    try {
      await writeSkillProficiency(skillKey, nextMark);
      if (charId !== state.characterId) return; // character switched during await
      showToast('Opgeslagen');
    } catch (err) {
      showToast('Save faalde · ' + err.message, 'error');
    }
    return;
  }

  // ---- ABILITIES: show number input overlay ----
  if (src === 'abilities' && editCfg.type === 'number') {
    const abilityKeys = ['str','dex','con','int','wis','cha'];
    const abilityKey  = abilityKeys[rowIdx];
    if (!abilityKey) return;
    const raw = WG_CHAR_CACHE[charId];
    const curScore = (raw && raw.config && raw.config.baseAbilities && raw.config.baseAbilities[abilityKey]) ?? '';

    // Position the overlay over the clicked SVG cell
    const rect = cellG.getBoundingClientRect();
    const inp = document.createElement('input');
    inp.type = 'number';
    inp.className = 'edit-input-overlay';
    inp.value = String(curScore);
    inp.min = String(editCfg.min);
    inp.max = String(editCfg.max);
    inp.step = String(editCfg.step);
    inp.style.left = Math.round(rect.left + window.scrollX) + 'px';
    inp.style.top  = Math.round(rect.top  + window.scrollY) + 'px';
    inp.style.width = Math.max(rect.width, 60) + 'px';
    inp.style.height = rect.height > 0 ? rect.height + 'px' : 'auto';
    document.body.appendChild(inp);
    inp.focus();
    inp.select();

    let committed = false;
    async function commitValue() {
      if (committed) return;
      committed = true;
      inp.remove();
      const raw = parseInt(inp.value, 10);
      if (isNaN(raw)) return;
      let val = raw;
      if (val < editCfg.min) { showToast('Range ' + editCfg.min + '-' + editCfg.max, 'error'); val = editCfg.min; }
      if (val > editCfg.max) { showToast('Range ' + editCfg.min + '-' + editCfg.max, 'error'); val = editCfg.max; }
      try {
        await writeAbilityScore(abilityKey, val);
        if (charId !== state.characterId) return;
        showToast('Opgeslagen');
      } catch (err) {
        showToast('Save faalde · ' + err.message, 'error');
      }
    }

    inp.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter')  { ev.preventDefault(); commitValue(); }
      if (ev.key === 'Escape') { committed = true; inp.remove(); }
    });
    inp.addEventListener('blur', () => { if (!committed) commitValue(); });
    return;
  }

  // ---- CHARACTER INFO: text input overlay, write back to config field ----
  if (src === 'basicInfo' && editCfg.type === 'text') {
    const widgetG = cellG.closest('[data-widget-idx]');
    const wIdx = widgetG ? parseInt(widgetG.dataset.widgetIdx, 10) : state.activeWidgetIdx;
    const w = state.widgets[wIdx];
    const fieldKey = w && w.data && Array.isArray(w.data.fieldKeys) ? w.data.fieldKeys[rowIdx] : null;
    if (!fieldKey) return;
    const raw = WG_CHAR_CACHE[charId];
    const curVal = (raw && raw.config && raw.config[fieldKey] != null) ? raw.config[fieldKey] : '';

    const rect = cellG.getBoundingClientRect();
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'edit-input-overlay';
    inp.value = String(curVal);
    inp.style.left = Math.round(rect.left + window.scrollX) + 'px';
    inp.style.top  = Math.round(rect.top  + window.scrollY) + 'px';
    inp.style.width = Math.max(rect.width, 80) + 'px';
    inp.style.height = rect.height > 0 ? rect.height + 'px' : 'auto';
    document.body.appendChild(inp);
    inp.focus();
    inp.select();

    let committed = false;
    async function commitValue() {
      if (committed) return;
      committed = true;
      inp.remove();
      const typed = inp.value.trim();
      if (typed === String(curVal).trim()) return;   // niets veranderd
      try {
        await writeCharConfigField(fieldKey, typed);
        if (charId !== state.characterId) return;
        showToast('Opgeslagen');
      } catch (err) {
        showToast('Save faalde · ' + err.message, 'error');
      }
    }
    inp.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter')  { ev.preventDefault(); commitValue(); }
      if (ev.key === 'Escape') { committed = true; inp.remove(); }
    });
    inp.addEventListener('blur', () => { if (!committed) commitValue(); });
    return;
  }
});

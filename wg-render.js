function el(tag, attrs = {}) {
  const e = document.createElementNS(WG_SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function clearSVG(svg) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

// V10: drawTick/drawTickH/drawDashboard/drawDashboardVertical zijn verwijderd
// nu de dev-view een volledig raster toont i.p.v. rails met ticks aan de zijkant.

// V9: pill-vormige resize-handle met drie grip-bollen — passend bij de
// warme D&D-stijl. Centrum (x,y) ligt midden op de widget-/dashboard-rand;
// de lange as van de pill loopt evenwijdig aan die rand.
function drawHandle(svg, x, y, id) {
  const isDragging = dragHandle === id;
  const isNS = (id === 'dash-top' || id === 'dash-bottom' || id === 'widget-bottom-2d');
  const LONG = 26, SHORT = 7;
  const pillW = isNS ? LONG  : SHORT;
  const pillH = isNS ? SHORT : LONG;
  const g = el('g', {
    class: 'resize-handle ' + (isNS ? 'ns' : 'ew') + (isDragging ? ' dragging' : ''),
    transform: `translate(${x}, ${y})`,
  });
  // Onzichtbare touch-hitbox (44×44).
  g.appendChild(el('rect', {
    x: -22, y: -22, width: 44, height: 44,
    class: 'resize-handle-hit',
    'data-handle': id,
  }));
  // Zichtbare pill.
  g.appendChild(el('rect', {
    x: -pillW / 2, y: -pillH / 2, width: pillW, height: pillH,
    rx: SHORT / 2, ry: SHORT / 2,
    class: 'resize-handle-pill',
  }));
  // Drie grip-bollen langs de lange as.
  const gap = 5;
  for (let i = -1; i <= 1; i++) {
    g.appendChild(el('circle', {
      cx: isNS ? i * gap : 0,
      cy: isNS ? 0 : i * gap,
      r: 1.1,
      class: 'resize-handle-grip',
    }));
  }
  svg.appendChild(g);
}

// ----- Rendering -----

function render() {
  applyResponsive();
  // V10: dashboard heeft vaste maat — vult de beschikbare ruimte elke render.
  applyResponsiveWidth();
  applyResponsiveHeight();
  // V9 pipeline: normaliseer posities → los overlap op (niet tijdens drag) →
  // clamp de zichtbare pagina → teken.
  normalizePositions();
  if (!dragHandle) {
    recomputeCombatWidgets(false);   // #NU-YZ6: combat-widgets fitten op zichtbare content
    if (typeof recomputeInventoryWidgets === 'function') recomputeInventoryWidgets(false); // inventory-widget fit-om-content
    resolveCollisionsAll();
    normalizePositions();
    // V10: lege tussen-pagina's wegwerken (geen "page 2 leeg, page 3 vol").
    compactEmptyPages();
  }
  state.currentPage = Math.max(0, Math.min(state.currentPage, pageCount() - 1));
  updateReadouts();
  updateSettingsToggleScope();
  const svg = document.getElementById('canvas');
  clearSVG(svg);
  svg.classList.toggle('is-editing', !!state.config.editMode);
  svg.classList.toggle('dev-view',   !!state.config.devView);

  // Bind layout-anchors aan dashboard-state
  const dL = state.dashboard.leftX;
  const dT = state.dashboard.topY;
  const dR = dashRight();

  const padL = 22;
  const padR = 22;
  const viewMinX = Math.min(dL - padL, 0);
  const viewMaxX = dR + padR;
  // Geen vaste 800-minimum: dat veroorzaakt overflow + scrollbar
  // wanneer de container smaller is dan 800 px.
  const viewW = Math.floor(viewMaxX - viewMinX);

  const dl = dashLayout();
  const viewMinY = Math.min(0, dT - 22);
  const viewMaxY = dashBottom() + 22;
  const viewH = viewMaxY - viewMinY;

  svg.setAttribute('viewBox', `${viewMinX} ${viewMinY} ${viewW} ${viewH}`);
  svg.setAttribute('width', viewW);
  svg.setAttribute('height', viewH);

  // V10: rail+ticks aan de zijkant zijn vervangen door het amber-grid dat
  // draw2DDashboard alleen tekent als dev-view aanstaat.
  draw2DDashboard(svg);

  // Render alle widgets — actieve laatst zodat handles bovenop liggen
  if (dl.tileCount >= 1) {
    const prevActive = state.activeWidgetIdx;
    const order = state.widgets.map((_, i) => i)
      .sort((a, b) => (a === prevActive ? 1 : 0) - (b === prevActive ? 1 : 0));
    for (const i of order) {
      const w = state.widgets[i];
      if (w.spanUnits < 1) continue;
      if (pageOf(w.globalCol) !== state.currentPage) continue;  // V9: alleen huidige pagina
      // Bug: bepaal active/multi-select VÓÓR het muteren van activeWidgetIdx.
      // De assignment hieronder zet activeWidgetIdx = i zodat de geometrie-helpers
      // in drawWidgetOnDashboard de juiste widget lezen; maar wgIsSelected(i) leest
      // óók activeWidgetIdx — als je dat na de mutatie evalueert is i === activeWidgetIdx
      // altijd waar en glowt élke widget. Daarom hier eerst vastleggen.
      const isActive = (i === prevActive);
      const isMultiSelected = wgIsSelected(i) && !isActive;
      state.activeWidgetIdx = i;
      drawWidgetOnDashboard(svg, i, isActive, isMultiSelected);
    }
    state.activeWidgetIdx = prevActive;
  }

  // V10: dashboard heeft geen drag-handles meer — vaste maat (% van scherm).

  renderInfo();
  renderPageNav();
  // Na render: opnieuw proximity-toets uitvoeren zodat handles van nieuwe
  // widgets meteen reageren op de huidige muispositie.
  updateHandleProximity();
}

// V9: paginanavigatie (pijlen + dots) onder het canvas. Alleen zichtbaar bij >1 pagina.
function renderPageNav() {
  const nav = document.getElementById('pageNav');
  if (!nav) return;
  const pc = pageCount();
  if (pc <= 1) { nav.innerHTML = ''; nav.style.display = 'none'; return; }
  nav.style.display = 'flex';
  const cur = state.currentPage;
  let html = `<button class="page-arrow" data-page-arrow="prev"${cur <= 0 ? ' disabled' : ''} aria-label="Vorige pagina">‹</button>`;
  html += '<div class="page-dots">';
  for (let p = 0; p < pc; p++) {
    html += `<button class="page-dot${p === cur ? ' active' : ''}" data-page-dot="${p}" aria-label="Pagina ${p + 1}"></button>`;
  }
  html += '</div>';
  html += `<button class="page-arrow" data-page-arrow="next"${cur >= pc - 1 ? ' disabled' : ''} aria-label="Volgende pagina">›</button>`;
  nav.innerHTML = html;
}

// V9: kleurt de topbar-instellingenknop mee met de scope. Widget geselecteerd
// → widget-settings (accent-kleur); niets geselecteerd → dashboard-settings.
function updateSettingsToggleScope() {
  const btn = document.getElementById('settingsToggle');
  if (!btn) return;
  const widgetScope = state.activeWidgetIdx >= 0 && !!state.widget;
  btn.classList.toggle('widget-scope', widgetScope);
  btn.title = widgetScope
    ? `Instellingen — ${displayTitle(state.widget)}`
    : 'Dashboard-instellingen';
  btn.setAttribute('aria-label', widgetScope ? 'Widget-instellingen' : 'Dashboard-instellingen');
}

function drawInfoBoxesInWidget(svg, widgetX, widgetY, barH) {
  const ib = infoBoxLayout();
  if (ib.boxesPerRow < 1 || ib.rows < 1) return;
  const contentY = widgetY + (barH ?? WIDGET_TOPBAR_H);
  const count = state.data.rows.length;
  const renderCount = Math.min(count, ib.boxesPerRow * ib.rows);
  const r = state.style.cellRadius || 0;
  const ipad = state.cfg.infoBoxPadding || 0;   // padding rond de cel-stack
  for (let i = 0; i < renderCount; i++) {
    const boxRow = Math.floor(i / ib.boxesPerRow);
    const boxCol = i % ib.boxesPerRow;
    const bx = widgetX + ib.paddingX + boxCol * (ib.boxPxW + ib.spacingX);
    const by = contentY + ib.paddingY + boxRow * (ib.boxPxH + ib.spacingY);
    // Cel-stack ingesnoerd met infoBoxPadding; outer outline op de volledige box.
    drawBoxCells(svg, bx + ipad, by + ipad, ib.boxPxW - 2 * ipad, ib.boxPxH - 2 * ipad, state.data.rows[i], i);
    svg.appendChild(el('path', {
      d: roundedPath(bx, by, ib.boxPxW, ib.boxPxH, r, r, r, r),
      class: 'info-box-outer',
    }));
  }
}

// Teken de cellen binnen één info-box volgens stacking + columnPxWidths.
// Geen intra-cell spacing — cellen plakken direct tegen elkaar (Joshua-spec).
// Per-kolom alignment komt uit state.layout.columnAlign.
function drawBoxCells(svg, bx, by, bw, bh, rowData, rowIdx) {
  if (!rowData) return;
  const cols = state.data.columns;
  const widths = state.layout.columnPxWidths;
  const aligns = state.layout.columnAlign;
  const stacking = state.layout.stacking;
  const last = cols.length - 1;
  const src = state.data.source;
  const editCfg = WG_EDIT_CONFIG[src];
  const highlights = state.layout.columnHighlight || [];
  const rowTips = (state.data.tooltips && state.data.tooltips[rowIdx]) || null;
  // Per-rij extra cel-class (bv. HP-widget actie-tints wgx-act-*).
  const rowExtraCls = (state.layout.rowExtraClass && state.layout.rowExtraClass[rowIdx]) || null;

  // Helper: wrap a draw call in an editable-cell <g> if in edit-values mode + column matches.
  // editCfg.mode === 'always' → ook klikbaar buiten edit-values mode (HP-widget:
  // damage/heal tijdens spel zonder edit-toggle).
  function wrapEditable(colIdx, drawFn) {
    const isEditable = editCfg && editCfg.editColumnIdx === colIdx
      && (state.config.editValuesMode || editCfg.mode === 'always');
    if (isEditable) {
      const g = el('g', {
        class: 'editable-cell',
        'data-source': src,
        'data-row-idx': String(rowIdx ?? 0),
        'data-col-idx': String(colIdx),
      });
      drawFn(g);
      svg.appendChild(g);
    } else {
      drawFn(svg);
    }
  }

  if (stacking === 'horizontal') {
    let cx = bx;
    for (let i = 0; i < cols.length; i++) {
      const cw = widths[i] || 0;
      if (cw <= 0) continue;
      const _cx = cx, _i = i, _cw = cw;
      wrapEditable(i, (target) => {
        drawCellBg(target, _cx, by, _cw, bh, _i, _i === 0, _i === last, 'horizontal', rowTips && rowTips[_i], rowExtraCls);
        drawCellText(target, _cx, by, _cw, bh, displayValue(rowData[_i], _i), aligns[_i] || 'left', highlights[_i], _i);
      });
      cx += cw;
    }
  } else {
    // vertical: cellen onder elkaar; elk vult de box-breedte.
    // Alignment in vertical stacking is altijd center.
    const rowH = cellRowPxH();
    let cy = by;
    for (let i = 0; i < cols.length; i++) {
      const _cy = cy, _i = i;
      wrapEditable(i, (target) => {
        drawCellBg(target, bx, _cy, bw, rowH, _i, _i === 0, _i === last, 'vertical', rowTips && rowTips[_i], rowExtraCls);
        drawCellText(target, bx, _cy, bw, rowH, displayValue(rowData[_i], _i), 'center', highlights[_i], _i);
      });
      cy += rowH;
    }
  }
}

// SVG path met per-corner radius. Radii worden geclamped op w/2, h/2.
function roundedPath(x, y, w, h, tl, tr, br, bl) {
  const maxR = Math.min(w, h) / 2;
  tl = Math.max(0, Math.min(tl, maxR));
  tr = Math.max(0, Math.min(tr, maxR));
  br = Math.max(0, Math.min(br, maxR));
  bl = Math.max(0, Math.min(bl, maxR));
  const p = [];
  p.push(`M ${x + tl} ${y}`);
  p.push(`L ${x + w - tr} ${y}`);
  if (tr > 0) p.push(`A ${tr} ${tr} 0 0 1 ${x + w} ${y + tr}`);
  p.push(`L ${x + w} ${y + h - br}`);
  if (br > 0) p.push(`A ${br} ${br} 0 0 1 ${x + w - br} ${y + h}`);
  p.push(`L ${x + bl} ${y + h}`);
  if (bl > 0) p.push(`A ${bl} ${bl} 0 0 1 ${x} ${y + h - bl}`);
  p.push(`L ${x} ${y + tl}`);
  if (tl > 0) p.push(`A ${tl} ${tl} 0 0 1 ${x + tl} ${y}`);
  p.push('Z');
  return p.join(' ');
}

// Cell-bg met buitenste-corner rounding: alleen de buitenkant van de
// info-box als geheel is afgerond; aanrakingen tussen cellen blijven scherp.
function drawCellBg(svg, x, y, w, h, colIdx, isFirst, isLast, stacking, tooltip, extraCls) {
  const cls = `info-box-cell col-${colIdx % 3}` + (extraCls ? ' ' + extraCls : '');
  const r = state.style.cellRadius || 0;
  let tl, tr, br, bl;
  if (stacking === 'horizontal') {
    tl = isFirst ? r : 0; bl = isFirst ? r : 0;
    tr = isLast  ? r : 0; br = isLast  ? r : 0;
  } else {
    tl = isFirst ? r : 0; tr = isFirst ? r : 0;
    bl = isLast  ? r : 0; br = isLast  ? r : 0;
  }
  const attrs = { d: roundedPath(x, y, w, h, tl, tr, br, bl), class: cls };
  // Tooltip-payload op de cel-bg (#bug Ov6e4Bv9). De cel-bg vult de hele cel en
  // de tekst erboven staat op pointer-events:none → hover/long-press landt altijd
  // hier. De custom tooltip-laag (wg-events.js) leest deze data-attributen.
  if (tooltip && (tooltip.title || tooltip.body)) {
    if (tooltip.title) attrs['data-tip-title'] = tooltip.title;
    if (tooltip.body)  attrs['data-tip-body'] = tooltip.body;
  }
  svg.appendChild(el('path', attrs));
}

function drawCellText(svg, x, y, w, h, value, align, highlight, colIdx) {
  const { fontSize } = state.config;
  const { cellPadding } = state.cfg;
  const fs = fontSize + (highlight ? 1 : -1);
  if (h < fs) return;
  let tx, anchor;
  if (align === 'center') { tx = x + w / 2; anchor = 'middle'; }
  else if (align === 'right') { tx = x + w - cellPadding; anchor = 'end'; }
  else { tx = x + cellPadding; anchor = 'start'; }
  let cls = 'info-box-text' + (highlight ? ' highlight' : '');
  if (colIdx != null) {
    const extraClass = state.layout.columnExtraClass?.[colIdx];
    if (extraClass) cls += ' ' + extraClass;
  }
  const txt = el('text', {
    x: tx, y: y + h / 2,
    'text-anchor': anchor,
    'dominant-baseline': 'central',
    class: cls,
    'font-size': fs.toFixed(2),
  });
  txt.textContent = String(value ?? '');
  svg.appendChild(txt);
}

// Compute title layout (1 of 2 regels) op basis van widget breedte
function titleLayout() {
  const w = widgetWidth();
  const titleStr = displayTitle(state.widget).toUpperCase();
  const fs = state.config.fontSize - 1;
  const family = getComputedStyle(document.documentElement).getPropertyValue('--info-font-display').trim() || 'serif';
  const ctx = measureCtx();
  ctx.font = `600 ${fs}px ${family}`;
  const GEAR_RESERVE = 0;   // V9: geen in-widget gear meer → titel krijgt volle breedte
  const PAD_X = 12;
  const maxW = Math.max(0, w - 2 * PAD_X - GEAR_RESERVE);
  const single = ctx.measureText(titleStr).width;
  const lineH = fs * 1.25;
  if (maxW <= 0 || single <= maxW) {
    return { lines: [titleStr], fs, lineH, totalH: WIDGET_TOPBAR_H };
  }
  const words = titleStr.split(/\s+/).filter(Boolean);
  if (words.length < 2) {
    return { lines: [titleStr], fs, lineH, totalH: WIDGET_TOPBAR_H };
  }
  let lineA = words[0];
  let splitAt = 1;
  for (let i = 1; i < words.length; i++) {
    const tryA = lineA + ' ' + words[i];
    if (ctx.measureText(tryA).width <= maxW) { lineA = tryA; splitAt = i + 1; }
    else break;
  }
  const lineB = words.slice(splitAt).join(' ');
  if (!lineB) return { lines: [titleStr], fs, lineH, totalH: WIDGET_TOPBAR_H };
  return { lines: [lineA, lineB], fs, lineH, totalH: Math.max(WIDGET_TOPBAR_H, Math.ceil(lineH * 2) + 8) };
}

function drawWidgetOnDashboard(svg, widgetIdx = 0, isActive = true, isMultiSelected = false) {
  const vl = dashVLayout();
  if (vl.tileCount < 1) return;
  const x = widgetLeftX();
  const y = widgetTopOnDash();
  const w = widgetWidth();
  const h = widgetHeightOnDash();
  const isDragging = dragHandle === 'widget-move-2d' && state.activeWidgetIdx === widgetIdx;

  // Type-afhankelijke content: info-box-grid, campagne-kaart of afbeelding.
  const kind = widgetKind(state.widget);
  // Alert state (info-widget): kan zelfs niet 1 rij/kolom info-boxes herbergen.
  const ib = kind === 'infobox' ? infoBoxLayout() : null;
  const isAlert = kind === 'infobox' && state.data.rows.length > 0 && (ib.boxesPerRow < 1 || ib.rows < 1);

  // Wrap alles in een <g class="widget"> zodat hover-detection alleen op de
  // widget zelf werkt (gear-icon visibility). data-widget-idx wordt door
  // onPointerDown opgepikt voor multi-widget targeting.
  const widgetG = el('g', {
    class: 'widget' + (isActive ? ' is-active' : ' is-inactive')
                     + (isMultiSelected ? ' is-multi-selected' : '')
                     + (isDragging ? ' is-dragging-self' : ''),
    'data-widget-idx': String(widgetIdx),
  });
  svg.appendChild(widgetG);

  // Widget-rechthoek (rand + zachte vulling) — altijd palette-rounded
  const _wr = state.style.widgetRadius || 0;
  const widgetRectAttrs = {
    x, y, width: w, height: h,
    class: 'widget-onboard-rect' + (isAlert ? ' alert' : ''),
  };
  if (_wr > 0) { widgetRectAttrs.rx = _wr; widgetRectAttrs.ry = _wr; }
  widgetG.appendChild(el('rect', widgetRectAttrs));

  // Title layout bepalen → topbar height volgt
  const tl = titleLayout();
  const barH = Math.min(tl.totalH, Math.max(0, h));
  const contentY = y + barH;
  const contentH = h - barH;
  if (contentH > 0) {
    widgetG.appendChild(el('rect', {
      x, y: contentY, width: w, height: contentH,
      class: 'widget-content-area',
    }));
    if (kind === 'map') drawMapInWidget(widgetG, state.widget, x, contentY, w, contentH, widgetIdx);
    else if (kind === 'image') drawImageInWidget(widgetG, state.widget, x, contentY, w, contentH, widgetIdx);
    else if (kind === 'combat') drawCombatTable(widgetG, state.widget, x, contentY, w, contentH, widgetIdx);
    else if (kind === 'inventory') { if (typeof drawInventoryGrid === 'function') drawInventoryGrid(widgetG, state.widget, x, contentY, w, contentH, widgetIdx); }
    else drawInfoBoxesInWidget(widgetG, x, y, barH);
  }

  // Topbar — alleen TL+TR rond, BL+BR scherp
  const topR = state.style.widgetRadius || 0;
  widgetG.appendChild(el('path', {
    d: roundedPath(x, y, w, barH, topR, topR, 0, 0),
    class: 'widget-onboard-topbar' + (isDragging ? ' dragging' : '') + (isAlert ? ' alert' : ''),
    'data-handle': 'widget-move-2d',
  }));

  // Titel — 1 of 2 regels (tspan)
  const titleEl = el('text', {
    x: x + w / 2,
    y: y + barH / 2,
    class: 'widget-title',
    'text-anchor': 'middle',
    'dominant-baseline': 'central',
    'font-size': tl.fs.toFixed(2),
  });
  if (tl.lines.length === 1) {
    titleEl.textContent = tl.lines[0];
  } else {
    const topOffset = -((tl.lines.length - 1) * tl.lineH) / 2;
    tl.lines.forEach((line, i) => {
      const tspan = el('tspan', {
        x: x + w / 2,
        dy: i === 0 ? topOffset : tl.lineH,
      });
      tspan.textContent = line;
      titleEl.appendChild(tspan);
    });
  }
  widgetG.appendChild(titleEl);

  // V9: geen in-widget gear/delete meer — settings via de topbar-knop (die
  // van scope wisselt bij selectie), verwijderen via de Delete-toets. De
  // topbalk-titel heeft daardoor de volle breedte.

  // Map widget action buttons (add-pin / upload-image / delete-map) zijn
  // verwijderd: deze edits horen alleen op de Maps-page (DM/Admin only).

  // V11 Phase 3.4: profile-picture widget upload-button (+ crop-button, #fATDUg)
  if (kind === 'image' && state.config.editValuesMode) {
    const BTN_W = 20, BTN_H = 16, GAP = 4;
    const btnY = y + (barH - BTN_H) / 2;

    // Upload-knop (rechts)
    const bxUp = x + w - 6 - BTN_W;
    const btnG = el('g', { class: 'map-action-btn', 'data-map-action': 'upload-portrait' });
    const btnTitle = el('title', {});
    btnTitle.textContent = 'Afbeelding uploaden';
    btnG.appendChild(btnTitle);
    btnG.appendChild(el('rect', { x: bxUp, y: btnY, width: BTN_W, height: BTN_H, rx: 3 }));
    const cx = bxUp + BTN_W / 2, cy = btnY + BTN_H / 2;
    btnG.appendChild(el('polyline', { points: `${cx - 4},${cy + 1} ${cx},${cy - 4} ${cx + 4},${cy + 1}` }));
    btnG.appendChild(el('line',     { x1: cx, y1: cy - 4, x2: cx, y2: cy + 5 }));
    btnG.appendChild(el('line',     { x1: cx - 5, y1: cy + 5, x2: cx + 5, y2: cy + 5 }));
    widgetG.appendChild(btnG);

    // Crop-knop (links van upload) — alleen op het profielfoto-widget mét portret
    const hasPortrait = (function () {
      if (!state.widget || state.widget.type !== 'profilePicture') return false;
      const raw = WG_CHAR_CACHE[state.characterId];
      return !!(raw && raw.images && raw.images.portrait);
    })();
    if (hasPortrait) {
      const bxCr = bxUp - GAP - BTN_W;
      const crG = el('g', { class: 'map-action-btn', 'data-map-action': 'crop-portrait' });
      const crTitle = el('title', {});
      crTitle.textContent = 'Bijsnijden';
      crG.appendChild(crTitle);
      crG.appendChild(el('rect', { x: bxCr, y: btnY, width: BTN_W, height: BTN_H, rx: 3 }));
      drawCropGlyph(crG, bxCr + BTN_W / 2, btnY + BTN_H / 2);
      widgetG.appendChild(crG);
    }
  }

  // Resize handles — in widgetG zodat data-widget-idx propageert via parent
  drawHandle(widgetG, x, y + h / 2, 'widget-left-2d');
  drawHandle(widgetG, x + w, y + h / 2, 'widget-right-2d');
  drawHandle(widgetG, x + w / 2, y + h, 'widget-bottom-2d');
}

// Crop-icoon (twee L-hoeken) getekend met lijnen, gecentreerd op (cx,cy).
function drawCropGlyph(parent, cx, cy) {
  // bovenste/linker hoek + onderste/rechter hoek vormen het crop-frame
  parent.appendChild(el('polyline', { points: `${cx - 5},${cy - 2} ${cx - 2},${cy - 2} ${cx - 2},${cy - 6}` }));
  parent.appendChild(el('polyline', { points: `${cx + 5},${cy + 2} ${cx + 2},${cy + 2} ${cx + 2},${cy + 6}` }));
  parent.appendChild(el('line', { x1: cx - 6, y1: cy + 2, x2: cx + 3, y2: cy + 2 }));
  parent.appendChild(el('line', { x1: cx - 2, y1: cy - 3, x2: cx - 2, y2: cy + 6 }));
}

// Cache van natuurlijke beeldafmetingen (voor exacte cover+focal-point crop).
// src → {w,h}; 'pending' terwijl de Image() laadt. Bij load → render().
const WG_IMG_DIMS = {};
function wgImgNatural(src, onReady) {
  if (!src) return null;
  const cached = WG_IMG_DIMS[src];
  if (cached && cached !== 'pending') return cached;
  if (cached === 'pending') return null;
  WG_IMG_DIMS[src] = 'pending';
  const im = new Image();
  im.onload = function () {
    WG_IMG_DIMS[src] = { w: im.naturalWidth || 1, h: im.naturalHeight || 1 };
    if (typeof onReady === 'function') onReady();
  };
  im.onerror = function () { WG_IMG_DIMS[src] = { w: 1, h: 1 }; };
  im.src = src;
  return null;
}

// Tekent één afbeelding in een 'image'-widget (bv. Profile picture).
// Vult het rect via cover/slice; past optioneel crop-params (focal + zoom) toe.
function drawImageInWidget(g, widget, x, contentY, w, contentH, widgetIdx) {
  const pad = (widget.cfg && widget.cfg.widgetPadding) || 0;
  const mx = x + pad, my = contentY + pad;
  const mw = w - 2 * pad, mh = contentH - 2 * pad;
  if (mw <= 0 || mh <= 0) return;
  const r = Math.min(state.style.widgetRadius || 0, Math.min(mw, mh) / 2);
  // V9: profielfoto-widget leest het portrait van de huidige character;
  // andere image-widgets gebruiken hun eigen widget.image.src.
  let src = null, crop = null;
  if (widget.type === 'profilePicture') {
    const raw = WG_CHAR_CACHE[state.characterId];
    src = (raw && raw.images && raw.images.portrait) || null;
    crop = (raw && raw.images && raw.images.portraitCrop) || null;
  } else {
    src = widget.image && widget.image.src;
    crop = widget.image && widget.image.crop;
  }
  if (!src) {
    // Nog geen afbeelding ingesteld → placeholder.
    g.appendChild(el('rect', { x: mx, y: my, width: mw, height: mh, rx: r, class: 'map-placeholder' }));
    const txt = el('text', {
      x: mx + mw / 2, y: my + mh / 2,
      'text-anchor': 'middle', 'dominant-baseline': 'central',
      class: 'map-status',
    });
    txt.textContent = 'Profielfoto';
    g.appendChild(txt);
    return;
  }
  // Afbeelding vult het rect met behoud van aspect (cover/slice — fit op de
  // grootste dimensie, overschot valt buiten beeld), geclipt op het ronde rect
  // (#b2s0wu).
  const clipId = `imgclip-${widgetIdx}`;
  const clip = el('clipPath', { id: clipId });
  clip.appendChild(el('path', { d: roundedPath(mx, my, mw, mh, r, r, r, r) }));
  g.appendChild(clip);
  const clipG = el('g', { 'clip-path': `url(#${clipId})` });
  g.appendChild(clipG);
  clipG.appendChild(el('rect', { x: mx, y: my, width: mw, height: mh, class: 'map-placeholder' }));

  // Crop-params: {x,y} focal in 0-100 (50=midden), zoom>=1. Exacte cover+focal
  // vereist de natuurlijke beeldverhouding → async geladen via wgImgNatural.
  const hasCrop = crop && (crop.zoom > 1.001 || crop.x !== 50 || crop.y !== 50);
  const nat = hasCrop ? wgImgNatural(src, () => render()) : null;
  if (hasCrop && nat) {
    const z = Math.max(1, crop.zoom || 1);
    const fx = Math.min(1, Math.max(0, (crop.x == null ? 50 : crop.x) / 100));
    const fy = Math.min(1, Math.max(0, (crop.y == null ? 50 : crop.y) / 100));
    const scale = Math.max(mw / nat.w, mh / nat.h) * z;
    const rw = nat.w * scale, rh = nat.h * scale;
    const ox = -(rw - mw) * fx, oy = -(rh - mh) * fy;
    const img = el('image', {
      x: mx + ox, y: my + oy, width: rw, height: rh,
      preserveAspectRatio: 'none', class: 'map-image',
    });
    img.setAttribute('href', src);
    clipG.appendChild(img);
  } else {
    // Geen crop (of nat-dims nog niet geladen): cover/slice gecentreerd.
    const img = el('image', {
      x: mx, y: my, width: mw, height: mh,
      preserveAspectRatio: 'xMidYMid slice', class: 'map-image',
    });
    img.setAttribute('href', src);
    clipG.appendChild(img);
  }
}

// Tekent een campagne-kaart in een map-widget: SVG-image + klikbare pin-shapes.
// De kaart wordt met cfg.widgetPadding ingesnoerd binnen het content-rect.
function drawMapInWidget(g, widget, x, contentY, w, contentH, widgetIdx) {
  const pad = (widget.cfg && widget.cfg.widgetPadding) || 0;
  const mx = x + pad, my = contentY + pad;
  const mw = w - 2 * pad, mh = contentH - 2 * pad;
  const drawStatus = (msg) => {
    const txt = el('text', {
      x: x + w / 2, y: contentY + contentH / 2,
      'text-anchor': 'middle', 'dominant-baseline': 'central',
      class: 'map-status',
    });
    txt.textContent = msg;
    g.appendChild(txt);
  };
  if (!WG_MAPS_CACHE) { drawStatus('Kaarten laden…'); return; }
  const mapObj = resolveWidgetMap(widget);
  if (!mapObj) { drawStatus('Geen kaart'); return; }
  if (mw <= 0 || mh <= 0) return;

  // Clip op het (met widgetPadding ingesnoerde) map-rect.
  const cr = Math.min(state.style.widgetRadius || 0, Math.min(mw, mh) / 2);
  const clipId = `mapclip-${widgetIdx}`;
  const clip = el('clipPath', { id: clipId });
  clip.appendChild(el('path', {
    d: pad > 0 ? roundedPath(mx, my, mw, mh, cr, cr, cr, cr)
               : roundedPath(mx, my, mw, mh, 0, 0, cr, cr),
  }));
  g.appendChild(clip);
  const clipG = el('g', { 'clip-path': `url(#${clipId})` });
  g.appendChild(clipG);

  // Achtergrond achter het geletterboxte beeld.
  clipG.appendChild(el('rect', { x: mx, y: my, width: mw, height: mh, class: 'map-placeholder' }));

  // Map-beeld — letterbox (behoudt aspect) binnen het map-rect.
  if (mapObj.image) {
    const img = el('image', {
      x: mx, y: my, width: mw, height: mh,
      preserveAspectRatio: 'xMidYMid meet', class: 'map-image',
    });
    img.setAttribute('href', mapObj.image);
    clipG.appendChild(img);

    // Kick off async natural-dimension fetch so next render() can plot pins
    // in the same letterboxed sub-rect as the <image> element above.
    if (!WG_MAP_IMAGE_DIMS.has(mapObj.image)) {
      WG_MAP_IMAGE_DIMS.set(mapObj.image, null); // pending
      const _tmpImg = new window.Image();
      const _src = mapObj.image;
      _tmpImg.onload = () => {
        WG_MAP_IMAGE_DIMS.set(_src, { nw: _tmpImg.naturalWidth, nh: _tmpImg.naturalHeight });
        render();
      };
      _tmpImg.onerror = () => { WG_MAP_IMAGE_DIMS.set(_src, 'error'); };
      _tmpImg.src = _src;
    }
  }

  // Pins — opgeslagen als 0..100 % van de kaart-afbeelding.
  // Plot in hetzelfde letterboxed sub-rect als de <image> hierboven.
  // Fallback (geen image of dims nog niet geladen): het hele map-rect.
  let _pinX = mx, _pinY = my, _pinW = mw, _pinH = mh;
  if (mapObj.image) {
    const _dims = WG_MAP_IMAGE_DIMS.get(mapObj.image);
    if (_dims && _dims !== 'error' && _dims !== null && _dims.nw > 0 && _dims.nh > 0) {
      const _imgAspect = _dims.nw / _dims.nh;
      const _rectAspect = mw / mh;
      let _iw, _ih;
      if (_imgAspect > _rectAspect) {
        _iw = mw; _ih = mw / _imgAspect; // pillarbox
      } else {
        _ih = mh; _iw = mh * _imgAspect; // letterbox
      }
      _pinX = mx + (mw - _iw) / 2;
      _pinY = my + (mh - _ih) / 2;
      _pinW = _iw; _pinH = _ih;
    }
  }
  const px = v => _pinX + (v / 100) * _pinW;
  const py = v => _pinY + (v / 100) * _pinH;
  const pr = v => (v / 100) * Math.min(_pinW, _pinH);
  for (const rawPin of (mapObj.pins || [])) {
    const pin = normalizePin(rawPin);
    const s = pin.shape;
    const link = pin.targetMap ? findMapById(pin.targetMap) : null;
    let pinEl;
    if (s.kind === 'polygon' && s.nodes && s.nodes.length >= 3) {
      pinEl = el('path', {
        d: smoothClosedPath(s.nodes.map(n => ({ x: px(n.x), y: py(n.y) }))),
        class: 'map-pin' + (link ? ' has-link' : ''),
      });
    } else {
      pinEl = el('ellipse', {
        cx: px(s.cx), cy: py(s.cy),
        rx: pr(s.r), ry: pr(s.r),
        class: 'map-pin' + (link ? ' has-link' : ''),
      });
    }
    if (pin.id) pinEl.setAttribute('data-pin-id', pin.id);
    if (link) {
      pinEl.setAttribute('data-handle', 'map-pin');
      pinEl.setAttribute('data-target', pin.targetMap);
      const title = el('title', {});
      title.textContent = (pin.label ? pin.label + ' ' : '') + '→ ' + link.map.name;
      pinEl.appendChild(title);
    }
    clipG.appendChild(pinEl);
  }

  // Overlay: back-knop linksboven (alleen als er navigatie-history is).
  const m = widget.map;
  if (m.history && m.history.length) {
    const bx = mx + 6, by = my + 6;
    const back = el('g', { class: 'map-btn', 'data-handle': 'map-back' });
    back.appendChild(el('rect', { x: bx, y: by, width: 24, height: 20, rx: 5, class: 'map-btn-bg' }));
    const bl = el('text', {
      x: bx + 12, y: by + 11, 'text-anchor': 'middle', 'dominant-baseline': 'central',
      class: 'map-btn-label',
    });
    bl.textContent = '‹';
    back.appendChild(bl);
    g.appendChild(back);
  }

  // Overlay: dimensie-toggle rechtsboven (alleen bij >1 dimensie).
  const dims = WG_MAPS_CACHE.dimensions || [];
  if (dims.length > 1) {
    let dx = mx + mw - 6 - 14;
    const dy = my + 6;
    for (let di = 0; di < dims.length; di++) {
      const dimG = el('g', { class: 'map-btn', 'data-handle': 'map-dim', 'data-dim': String(di) });
      dimG.appendChild(el('circle', {
        cx: dx + 7, cy: dy + 7, r: 6,
        class: 'map-dim-pip' + (di === m.dimIdx ? ' active' : ''),
      }));
      const dt = el('title', {});
      dt.textContent = dims[di].name;
      dimG.appendChild(dt);
      g.appendChild(dimG);
      dx -= 18;
    }
  }
}

function draw2DDashboard(svg) {
  const { dashTile: t } = state.config;
  const hl = dashLayout();
  const vl = dashVLayout();
  if (hl.tileCount < 1 || vl.tileCount < 1) return;

  // V10: in dev-view, eerst een doffe amber-laag over het hele dashboard-vlak
  // tekenen. De tile-rects in bg-kleur erboven laten de spacing als raster
  // doorschijnen — lijndikte == spacing zonder dat we lijnen hoeven tekenen.
  if (state.config.devView) {
    svg.appendChild(el('rect', {
      x: state.dashboard.leftX,
      y: state.dashboard.topY,
      width: state.dashboard.width,
      height: state.dashboard.height,
      class: 'dev-grid-bg',
    }));
  }

  // 2D tile-rechthoeken (in dev-view: bg-kleur; CSS regelt het uiterlijk)
  for (let row = 0; row < vl.tileCount; row++) {
    for (let col = 0; col < hl.tileCount; col++) {
      svg.appendChild(el('rect', {
        x: dashTileLeftX(col),
        y: dashTileTopY(row),
        width: t, height: t,
        class: 'tile-dash-2d',
      }));
    }
  }
}

// V10: drawDashboard/drawDashboardVertical zijn verwijderd — de rail+ticks
// aan de zijkant zijn vervangen door het dev-grid in draw2DDashboard.

function updateReadouts() {
  const mode = viewportMode();
  const vp = document.getElementById('vpReadout');
  if (vp) vp.innerHTML = `<span class="mode-pill">${mode}</span>${window.innerWidth} px`;
  const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setText('dashTile_curr', `${state.config.dashTile} px`);
  setText('dashMinSpacing_curr', `${state.config.dashMinSpacing} px`);
  setText('fontSize_curr', `${state.config.fontSize.toFixed(1)} px`);
}

function bindResponsiveInputs() {
  document.querySelectorAll('[data-rv]').forEach(container => {
    const rv = container.dataset.rv;
    container.querySelectorAll('input[data-end]').forEach(inp => {
      const end = inp.dataset.end;
      inp.value = state.responsive[rv][end];
      inp.addEventListener('input', () => {
        const v = parseFloat(inp.value);
        if (!isNaN(v) && v >= 0) {
          state.responsive[rv][end] = v;
          applyResponsive();
          applyResponsiveWidth();
          applyResponsiveHeight();
          recomputeAllWidgets();
          render();
        }
      });
    });
  });
}

function renderInfo() {
  const { dashTile: dt, dashMinSpacing: ds } = state.config;
  const dl = dashLayout();
  const dW = state.dashboard.width;
  const dMinNeeded = (dl.tileCount + 1) * ds + dl.tileCount * dt;
  const dSurplus = dW - dMinNeeded;

  const dvl = dashVLayout();
  const dH = state.dashboard.height;
  const dvMinNeeded = (dvl.tileCount + 1) * ds + dvl.tileCount * dt;
  const dvSurplus = dH - dvMinNeeded;

  document.getElementById('dashInfo').innerHTML = `
    <h3>Dashboard</h3>
    <div class="info-row"><span class="key">Tile-grootte</span><span class="val">${dt} px</span></div>
    <div class="info-row"><span class="key">Min spacing</span><span class="val">${ds} px</span></div>
    <div class="info-row" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px;"><span class="key">Horizontaal</span><span class="val">→</span></div>
    <div class="info-row"><span class="key">Breedte</span><span class="val highlight">${dW.toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Tiles × spacing</span><span class="val">${dl.tileCount} × ${dl.spacing.toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Surplus</span><span class="val">${dSurplus.toFixed(2)} px / ${dl.tileCount + 1} slots</span></div>
    <div class="info-row" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px;"><span class="key">Verticaal</span><span class="val">↓</span></div>
    <div class="info-row"><span class="key">Hoogte</span><span class="val highlight">${dH.toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Tiles × spacing</span><span class="val">${dvl.tileCount} × ${dvl.spacing.toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Surplus</span><span class="val">${dvSurplus.toFixed(2)} px / ${dvl.tileCount + 1} slots</span></div>
  `;

  if (!state.widget) {
    document.getElementById('widgetInfo').innerHTML = '<h3>Widget</h3><div class="info-row"><span class="key">—</span><span class="val">geen actieve widget</span></div>';
    document.getElementById('infoBoxInfo').innerHTML = '<h3>Info boxes (data-driven)</h3><div class="info-row"><span class="key">—</span><span class="val">geen actieve widget</span></div>';
    return;
  }

  const wSpan = state.widget.spanUnits;
  const wW = widgetWidth();

  document.getElementById('widgetInfo').innerHTML = `
    <h3>Widget</h3>
    <div class="info-row"><span class="key">Positie (pag·col, row)</span><span class="val">${pageOf(state.widget.globalCol)}·${widgetCol(state.widget)}, ${state.widget.startRowIdx}</span></div>
    <div class="info-row"><span class="key">Span (cols × rows)</span><span class="val">${wSpan} × ${state.widget.spanUnitsY}</span></div>
    <div class="info-row"><span class="key">Widget-breedte</span><span class="val highlight">${wW.toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Widget-hoogte</span><span class="val highlight">${widgetHeightOnDash().toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Formule breedte</span><span class="val">${wSpan}×${dt} + ${Math.max(wSpan - 1, 0)}×${dl.spacing.toFixed(2)}</span></div>
    <div class="info-row"><span class="key">Widget-padding (min)</span><span class="val">${state.cfg.widgetPadding} px</span></div>
    <div class="info-row"><span class="key">Info-box spacing (min)</span><span class="val">${state.cfg.infoBoxSpacing} px</span></div>
  `;

  const ib = infoBoxLayout();
  const count = state.data.rows.length;
  const rendered = Math.min(count, ib.boxesPerRow * ib.rows);
  const overflow = Math.max(0, count - rendered);
  const cols = state.data.columns || [];
  const widths = state.layout.columnPxWidths || [];
  const aligns = state.layout.columnAlign || [];
  const colSummary = cols.map((c, i) => `${c.label}=${widths[i] ?? '?'}px·${aligns[i] || 'left'}`).join(' · ');

  document.getElementById('infoBoxInfo').innerHTML = `
    <h3>Info boxes (data-driven)</h3>
    <div class="info-row"><span class="key">Character</span><span class="val highlight">${state.characterId}</span></div>
    <div class="info-row"><span class="key">Bron</span><span class="val">${state.data.source}</span></div>
    <div class="info-row"><span class="key">Status</span><span class="val ${WG_CHAR_STATUS[state.characterId]==='error'?'warn':''}">${WG_CHAR_STATUS[state.characterId] || 'idle'}${WG_CHAR_ERROR[state.characterId] ? ' · '+WG_CHAR_ERROR[state.characterId] : ''}</span></div>
    <div class="info-row"><span class="key">Edit / Dev-view</span><span class="val">${state.config.editMode ? 'edit' : '—'} / ${state.config.devView ? 'dev' : '—'}</span></div>
    <div class="info-row"><span class="key">Stacking</span><span class="val">${state.layout.stacking}</span></div>
    <div class="info-row" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px;"><span class="key">Kolommen</span><span class="val highlight">${colSummary || '—'}</span></div>
    <div class="info-row"><span class="key">Box-px (b × h)</span><span class="val">${ib.boxPxW.toFixed(2)} × ${ib.boxPxH.toFixed(2)}</span></div>
    <div class="info-row"><span class="key">Aantal rijen (data)</span><span class="val">${count}</span></div>
    <div class="info-row"><span class="key">Padding (x / y)</span><span class="val">${ib.paddingX.toFixed(1)} / ${ib.paddingY.toFixed(1)} px</span></div>
    <div class="info-row"><span class="key">Spacing (x / y)</span><span class="val">${ib.spacingX.toFixed(1)} / ${ib.spacingY.toFixed(1)} px</span></div>
    <div class="info-row"><span class="key">Boxes per rij</span><span class="val ${ib.boxesPerRow < 1 ? 'warn' : 'highlight'}">${ib.boxesPerRow}</span></div>
    <div class="info-row"><span class="key">Rijen (nodig / past)</span><span class="val ${ib.fits ? 'highlight' : 'warn'}">${ib.rowsNeeded} / ${ib.rows}</span></div>
    <div class="info-row"><span class="key">Gerendered / overflow</span><span class="val ${overflow > 0 ? 'warn' : ''}">${rendered} / ${overflow}</span></div>
  `;
}

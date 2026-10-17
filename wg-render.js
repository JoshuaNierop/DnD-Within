function el(tag, attrs = {}) {
  const e = document.createElementNS(WG_SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
}

function clearSVG(svg) {
  while (svg.firstChild) svg.removeChild(svg.firstChild);
}

// V10: drawTick/drawTickH/drawDashboard/drawDashboardVertical were removed
// now that the dev view shows a full grid instead of rails with ticks on the side.

// V9: pill-shaped resize handle with three grip dots — matching the
// warm D&D style. Center (x,y) sits on the middle of the widget/dashboard edge;
// the long axis of the pill runs parallel to that edge.
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
  // Invisible touch hitbox (44×44).
  g.appendChild(el('rect', {
    x: -22, y: -22, width: 44, height: 44,
    class: 'resize-handle-hit',
    'data-handle': id,
  }));
  // Visible pill.
  g.appendChild(el('rect', {
    x: -pillW / 2, y: -pillH / 2, width: pillW, height: pillH,
    rx: SHORT / 2, ry: SHORT / 2,
    class: 'resize-handle-pill',
  }));
  // Three grip dots along the long axis.
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

let _combatRemeasure = 0;
function render() {
  applyResponsive();
  const mobile = typeof wgMobileActive === 'function' && wgMobileActive();
  // V10: dashboard has a fixed size — fills the available space every render.
  applyResponsiveWidth();
  if (mobile) {
    // Phone (wg-mobile.js): one full-width column, height follows the content.
    wgMobileLayout();
  } else {
    applyResponsiveHeight();
    // V9 pipeline: normalize positions → resolve overlap (not during drag) →
    // clamp the visible page → draw.
    normalizePositions();
    if (!dragHandle) {
      recomputeCombatWidgets(false);   // #NU-YZ6: fit combat widgets to visible content
      if (typeof recomputeInventoryWidgets === 'function') recomputeInventoryWidgets(false); // inventory widget fit-to-content
      resolveCollisionsAll();
      normalizePositions();
      // V10: eliminate empty in-between pages (no "page 2 empty, page 3 full").
      compactEmptyPages();
    }
  }
  state.currentPage = Math.max(0, Math.min(state.currentPage, pageCount() - 1));
  updateReadouts();
  updateSettingsToggleScope();
  const svg = document.getElementById('canvas');
  clearSVG(svg);
  svg.classList.toggle('is-editing', !!state.config.editMode);
  svg.classList.toggle('dev-view',   !!state.config.devView);

  // Bind layout anchors to dashboard state
  const dL = state.dashboard.leftX;
  const dT = state.dashboard.topY;
  const dR = dashRight();

  const padL = mobile ? 4 : 22;
  const padR = mobile ? 4 : 22;
  const viewMinX = Math.min(dL - padL, 0);
  const viewMaxX = dR + padR;
  // No fixed 800 minimum: that causes overflow + scrollbar
  // when the container is narrower than 800 px.
  const viewW = Math.floor(viewMaxX - viewMinX);

  const dl = dashLayout();
  const viewMinY = Math.min(0, dT - 22);
  const viewMaxY = dashBottom() + 22;
  const viewH = viewMaxY - viewMinY;

  svg.setAttribute('viewBox', `${viewMinX} ${viewMinY} ${viewW} ${viewH}`);
  svg.setAttribute('width', viewW);
  svg.setAttribute('height', viewH);

  // V10: rail+ticks on the side were replaced by the amber grid that
  // draw2DDashboard only draws when dev view is on.
  draw2DDashboard(svg);

  // Render all widgets — active last so handles sit on top
  if (dl.tileCount >= 1) {
    const prevActive = state.activeWidgetIdx;
    const order = state.widgets.map((_, i) => i)
      .sort((a, b) => (a === prevActive ? 1 : 0) - (b === prevActive ? 1 : 0));
    for (const i of order) {
      const w = state.widgets[i];
      if (w.spanUnits < 1) continue;
      if (pageOf(w.globalCol) !== state.currentPage) continue;  // V9: current page only
      // Bug: determine active/multi-select BEFORE mutating activeWidgetIdx.
      // The assignment below sets activeWidgetIdx = i so the geometry helpers
      // in drawWidgetOnDashboard read the right widget; but wgIsSelected(i) reads
      // activeWidgetIdx too — if you evaluate that after the mutation, i === activeWidgetIdx
      // is always true and EVERY widget glows. Hence capture it here first.
      const isActive = (i === prevActive);
      const isMultiSelected = wgIsSelected(i) && !isActive;
      state.activeWidgetIdx = i;
      drawWidgetOnDashboard(svg, i, isActive, isMultiSelected);
    }
    state.activeWidgetIdx = prevActive;
  }

  // V10: dashboard has no drag handles anymore — fixed size (% of screen).

  // Combat widgets: measure real sizes; on a change one more (max 3)
  // render pass so width/height match the measured content.
  if (!dragHandle && typeof combatMeasureWidgets === 'function') {
    let changed = false;
    try { changed = combatMeasureWidgets(); } catch (e) { console.warn('combat measure', e); }
    if (changed && _combatRemeasure < 3) {
      _combatRemeasure++;
      requestAnimationFrame(render);
    } else {
      _combatRemeasure = 0;
    }
  }

  renderInfo();
  renderPageNav();
  if (mobile) {
    if (typeof wgMobileAfterRender === 'function') wgMobileAfterRender();
    return;   // no resize handles on phones
  }
  // After render: re-run the proximity check so handles of new
  // widgets react immediately to the current mouse position.
  updateHandleProximity();
}

// V9: page navigation (arrows + dots) below the canvas. Only visible with >1 page.
function renderPageNav() {
  const nav = document.getElementById('pageNav');
  if (!nav) return;
  const pc = pageCount();
  if (pc <= 1) { nav.innerHTML = ''; nav.style.display = 'none'; return; }
  nav.style.display = 'flex';
  const cur = state.currentPage;
  let html = `<button class="page-arrow" data-page-arrow="prev"${cur <= 0 ? ' disabled' : ''} aria-label="Previous page">‹</button>`;
  html += '<div class="page-dots">';
  for (let p = 0; p < pc; p++) {
    html += `<button class="page-dot${p === cur ? ' active' : ''}" data-page-dot="${p}" aria-label="Page ${p + 1}"></button>`;
  }
  html += '</div>';
  html += `<button class="page-arrow" data-page-arrow="next"${cur >= pc - 1 ? ' disabled' : ''} aria-label="Next page">›</button>`;
  nav.innerHTML = html;
}

// V9: colors the topbar settings button along with the scope. Widget selected
// → widget settings (accent color); nothing selected → dashboard settings.
function updateSettingsToggleScope() {
  const btn = document.getElementById('settingsToggle');
  if (!btn) return;
  const widgetScope = state.activeWidgetIdx >= 0 && !!state.widget;
  btn.classList.toggle('widget-scope', widgetScope);
  btn.title = widgetScope
    ? `Settings — ${displayTitle(state.widget)}`
    : 'Dashboard settings';
  btn.setAttribute('aria-label', widgetScope ? 'Widget settings' : 'Dashboard settings');
}

function drawInfoBoxesInWidget(svg, widgetX, widgetY, barH) {
  const ib = infoBoxLayout();
  if (ib.boxesPerRow < 1 || ib.rows < 1) return;
  const contentY = widgetY + (barH ?? WIDGET_TOPBAR_H);
  const count = state.data.rows.length;
  const renderCount = Math.min(count, ib.boxesPerRow * ib.rows);
  const r = state.style.cellRadius || 0;
  const ipad = state.cfg.infoBoxPadding || 0;   // padding around the cell stack
  for (let i = 0; i < renderCount; i++) {
    const boxRow = Math.floor(i / ib.boxesPerRow);
    const boxCol = i % ib.boxesPerRow;
    const bx = widgetX + ib.paddingX + boxCol * (ib.boxPxW + ib.spacingX);
    const by = contentY + ib.paddingY + boxRow * (ib.boxPxH + ib.spacingY);
    // Cell stack inset by infoBoxPadding; outer outline on the full box.
    drawBoxCells(svg, bx + ipad, by + ipad, ib.boxPxW - 2 * ipad, ib.boxPxH - 2 * ipad, state.data.rows[i], i);
    svg.appendChild(el('path', {
      d: roundedPath(bx, by, ib.boxPxW, ib.boxPxH, r, r, r, r),
      class: 'info-box-outer',
    }));
  }
}

// Draw the cells within one info box according to stacking + columnPxWidths.
// No intra-cell spacing — cells touch each other directly (Joshua spec).
// Per-column alignment comes from state.layout.columnAlign.
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
  // Per-row extra cell class (e.g. HP widget action tints wgx-act-*).
  const rowExtraCls = (state.layout.rowExtraClass && state.layout.rowExtraClass[rowIdx]) || null;

  // Helper: wrap a draw call in an editable-cell <g> if in edit-values mode + column matches.
  // editCfg.mode === 'always' → also clickable outside edit-values mode (HP widget:
  // damage/heal during play without edit toggle).
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
    // vertical: cells stacked; each fills the box width.
    // Alignment in vertical stacking is always center.
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

// SVG path with per-corner radius. Radii are clamped to w/2, h/2.
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

// Cell bg with outer-corner rounding: only the outside of the
// info box as a whole is rounded; contacts between cells stay sharp.
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
  // Tooltip payload on the cell bg (#bug Ov6e4Bv9). The cell bg fills the whole cell and
  // the text above it has pointer-events:none → hover/long-press always lands
  // here. The custom tooltip layer (wg-events.js) reads these data attributes.
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

// Compute title layout (1 or 2 lines) based on widget width
function titleLayout() {
  const w = widgetWidth();
  const titleStr = displayTitle(state.widget).toUpperCase();
  const fs = state.config.fontSize - 1;
  const family = getComputedStyle(document.documentElement).getPropertyValue('--info-font-display').trim() || 'serif';
  const ctx = measureCtx();
  ctx.font = `600 ${fs}px ${family}`;
  const GEAR_RESERVE = 0;   // V9: no in-widget gear anymore → title gets full width
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

  // Type-dependent content: info-box grid, campaign map or image.
  const kind = widgetKind(state.widget);
  // Alert state (info widget): can't even hold 1 row/column of info boxes.
  const ib = kind === 'infobox' ? infoBoxLayout() : null;
  const isAlert = kind === 'infobox' && state.data.rows.length > 0 && (ib.boxesPerRow < 1 || ib.rows < 1);

  // Wrap everything in a <g class="widget"> so hover detection only works on the
  // widget itself (gear-icon visibility). data-widget-idx is picked up by
  // onPointerDown for multi-widget targeting.
  const widgetG = el('g', {
    class: 'widget' + (isActive ? ' is-active' : ' is-inactive')
                     + (isMultiSelected ? ' is-multi-selected' : '')
                     + (isDragging ? ' is-dragging-self' : ''),
    'data-widget-idx': String(widgetIdx),
  });
  svg.appendChild(widgetG);

  // Widget rectangle (border + soft fill) — always palette-rounded
  const _wr = state.style.widgetRadius || 0;
  const widgetRectAttrs = {
    x, y, width: w, height: h,
    class: 'widget-onboard-rect' + (isAlert ? ' alert' : ''),
  };
  if (_wr > 0) { widgetRectAttrs.rx = _wr; widgetRectAttrs.ry = _wr; }
  widgetG.appendChild(el('rect', widgetRectAttrs));

  // Determine title layout → topbar height follows
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
    // Alert state: the widget has rows but is too small to fit even one info
    // box — without a hint it looks like an empty/broken widget.
    if (isAlert && contentH >= 24) {
      const hint = el('text', {
        x: x + w / 2, y: contentY + contentH / 2,
        class: 'widget-alert-hint', 'text-anchor': 'middle',
        'dominant-baseline': 'central', 'font-size': Math.min(10, w / 14).toFixed(1),
      });
      hint.textContent = 'Enlarge widget to show content';
      widgetG.appendChild(hint);
    }
  }

  // Topbar — only TL+TR rounded, BL+BR sharp
  const topR = state.style.widgetRadius || 0;
  widgetG.appendChild(el('path', {
    d: roundedPath(x, y, w, barH, topR, topR, 0, 0),
    class: 'widget-onboard-topbar' + (isDragging ? ' dragging' : '') + (isAlert ? ' alert' : ''),
    'data-handle': 'widget-move-2d',
  }));

  // Title — 1 or 2 lines (tspan)
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

  // V9: no in-widget gear/delete anymore — settings via the topbar button (which
  // switches scope on selection), deleting via the Delete key. The
  // topbar title therefore has the full width.

  // Map widget action buttons (add-pin / upload-image / delete-map) were
  // removed: these edits belong only on the Maps page (DM/Admin only).

  // V11 Phase 3.4: profile-picture widget upload-button (+ crop-button, #fATDUg)
  if (kind === 'image' && state.config.editValuesMode) {
    const BTN_W = 20, BTN_H = 16, GAP = 4;
    const btnY = y + (barH - BTN_H) / 2;

    // Upload button (right)
    const bxUp = x + w - 6 - BTN_W;
    const btnG = el('g', { class: 'map-action-btn', 'data-map-action': 'upload-portrait' });
    const btnTitle = el('title', {});
    btnTitle.textContent = 'Upload image';
    btnG.appendChild(btnTitle);
    btnG.appendChild(el('rect', { x: bxUp, y: btnY, width: BTN_W, height: BTN_H, rx: 3 }));
    const cx = bxUp + BTN_W / 2, cy = btnY + BTN_H / 2;
    btnG.appendChild(el('polyline', { points: `${cx - 4},${cy + 1} ${cx},${cy - 4} ${cx + 4},${cy + 1}` }));
    btnG.appendChild(el('line',     { x1: cx, y1: cy - 4, x2: cx, y2: cy + 5 }));
    btnG.appendChild(el('line',     { x1: cx - 5, y1: cy + 5, x2: cx + 5, y2: cy + 5 }));
    widgetG.appendChild(btnG);

    // Crop button (left of upload) — only on the profile-picture widget WITH a portrait
    const hasPortrait = (function () {
      if (!state.widget || state.widget.type !== 'profilePicture') return false;
      const raw = WG_CHAR_CACHE[state.characterId];
      return !!(raw && raw.images && raw.images.portrait);
    })();
    if (hasPortrait) {
      const bxCr = bxUp - GAP - BTN_W;
      const crG = el('g', { class: 'map-action-btn', 'data-map-action': 'crop-portrait' });
      const crTitle = el('title', {});
      crTitle.textContent = 'Crop';
      crG.appendChild(crTitle);
      crG.appendChild(el('rect', { x: bxCr, y: btnY, width: BTN_W, height: BTN_H, rx: 3 }));
      drawCropGlyph(crG, bxCr + BTN_W / 2, btnY + BTN_H / 2);
      widgetG.appendChild(crG);
    }
  }

  // Resize handles — in widgetG so data-widget-idx propagates via parent.
  // Phones (wg-mobile.js) have a fixed one-column layout → no handles.
  if (!(typeof wgMobileActive === 'function' && wgMobileActive())) {
    drawHandle(widgetG, x, y + h / 2, 'widget-left-2d');
    drawHandle(widgetG, x + w, y + h / 2, 'widget-right-2d');
    drawHandle(widgetG, x + w / 2, y + h, 'widget-bottom-2d');
  }
}

// Crop icon (two L-corners) drawn with lines, centered on (cx,cy).
function drawCropGlyph(parent, cx, cy) {
  // top/left corner + bottom/right corner form the crop frame
  parent.appendChild(el('polyline', { points: `${cx - 5},${cy - 2} ${cx - 2},${cy - 2} ${cx - 2},${cy - 6}` }));
  parent.appendChild(el('polyline', { points: `${cx + 5},${cy + 2} ${cx + 2},${cy + 2} ${cx + 2},${cy + 6}` }));
  parent.appendChild(el('line', { x1: cx - 6, y1: cy + 2, x2: cx + 3, y2: cy + 2 }));
  parent.appendChild(el('line', { x1: cx - 2, y1: cy - 3, x2: cx - 2, y2: cy + 6 }));
}

// Cache of natural image dimensions (for exact cover+focal-point crop).
// src → {w,h}; 'pending' while the Image() loads. On load → render().
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

// Draws one image in an 'image' widget (e.g. Profile picture).
// Fills the rect via cover/slice; optionally applies crop params (focal + zoom).
function drawImageInWidget(g, widget, x, contentY, w, contentH, widgetIdx) {
  const pad = (widget.cfg && widget.cfg.widgetPadding) || 0;
  const mx = x + pad, my = contentY + pad;
  const mw = w - 2 * pad, mh = contentH - 2 * pad;
  if (mw <= 0 || mh <= 0) return;
  const r = Math.min(state.style.widgetRadius || 0, Math.min(mw, mh) / 2);
  // V9: profile-picture widget reads the portrait of the current character;
  // other image widgets use their own widget.image.src.
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
    // No image set yet → placeholder.
    g.appendChild(el('rect', { x: mx, y: my, width: mw, height: mh, rx: r, class: 'map-placeholder' }));
    const txt = el('text', {
      x: mx + mw / 2, y: my + mh / 2,
      'text-anchor': 'middle', 'dominant-baseline': 'central',
      class: 'map-status',
    });
    txt.textContent = 'Profile picture';
    g.appendChild(txt);
    return;
  }
  // Image fills the rect preserving aspect (cover/slice — fit on the
  // largest dimension, overflow falls out of view), clipped to the rounded rect
  // (#b2s0wu).
  const clipId = `imgclip-${widgetIdx}`;
  const clip = el('clipPath', { id: clipId });
  clip.appendChild(el('path', { d: roundedPath(mx, my, mw, mh, r, r, r, r) }));
  g.appendChild(clip);
  const clipG = el('g', { 'clip-path': `url(#${clipId})` });
  g.appendChild(clipG);
  clipG.appendChild(el('rect', { x: mx, y: my, width: mw, height: mh, class: 'map-placeholder' }));

  // Crop params: {x,y} focal in 0-100 (50=center), zoom>=1. Exact cover+focal
  // requires the natural aspect ratio → loaded async via wgImgNatural.
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
    // No crop (or nat dims not loaded yet): cover/slice centered.
    const img = el('image', {
      x: mx, y: my, width: mw, height: mh,
      preserveAspectRatio: 'xMidYMid slice', class: 'map-image',
    });
    img.setAttribute('href', src);
    clipG.appendChild(img);
  }
}

// Draws a campaign map in a map widget: SVG image + clickable pin shapes.
// The map is inset by cfg.widgetPadding within the content rect.
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
  if (!WG_MAPS_CACHE) { drawStatus('Loading maps…'); return; }
  const mapObj = resolveWidgetMap(widget);
  if (!mapObj) { drawStatus('No map'); return; }
  if (mw <= 0 || mh <= 0) return;

  // Clip to the map rect (inset by widgetPadding).
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

  // Background behind the letterboxed image.
  clipG.appendChild(el('rect', { x: mx, y: my, width: mw, height: mh, class: 'map-placeholder' }));

  // Map image — letterbox (preserves aspect) within the map rect.
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

  // Pins — stored as 0..100 % of the map image.
  // Plot in the same letterboxed sub-rect as the <image> above.
  // Fallback (no image or dims not loaded yet): the whole map rect.
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

  // Overlay: back button top-left (only if there is navigation history).
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

  // Overlay: dimension toggle top-right (only with >1 dimension).
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

  // V10: in dev view, first draw a dull amber layer over the whole dashboard area.
  // The tile rects in bg color on top let the spacing show through as a grid
  // — line thickness == spacing without having to draw lines.
  if (state.config.devView) {
    svg.appendChild(el('rect', {
      x: state.dashboard.leftX,
      y: state.dashboard.topY,
      width: state.dashboard.width,
      height: state.dashboard.height,
      class: 'dev-grid-bg',
    }));
  }

  // 2D tile rectangles (in dev view: bg color; CSS handles the appearance)
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

// V10: drawDashboard/drawDashboardVertical were removed — the rail+ticks
// on the side were replaced by the dev grid in draw2DDashboard.

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
    <div class="info-row"><span class="key">Tile size</span><span class="val">${dt} px</span></div>
    <div class="info-row"><span class="key">Min spacing</span><span class="val">${ds} px</span></div>
    <div class="info-row" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px;"><span class="key">Horizontal</span><span class="val">→</span></div>
    <div class="info-row"><span class="key">Width</span><span class="val highlight">${dW.toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Tiles × spacing</span><span class="val">${dl.tileCount} × ${dl.spacing.toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Surplus</span><span class="val">${dSurplus.toFixed(2)} px / ${dl.tileCount + 1} slots</span></div>
    <div class="info-row" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px;"><span class="key">Vertical</span><span class="val">↓</span></div>
    <div class="info-row"><span class="key">Height</span><span class="val highlight">${dH.toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Tiles × spacing</span><span class="val">${dvl.tileCount} × ${dvl.spacing.toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Surplus</span><span class="val">${dvSurplus.toFixed(2)} px / ${dvl.tileCount + 1} slots</span></div>
  `;

  if (!state.widget) {
    document.getElementById('widgetInfo').innerHTML = '<h3>Widget</h3><div class="info-row"><span class="key">—</span><span class="val">no active widget</span></div>';
    document.getElementById('infoBoxInfo').innerHTML = '<h3>Info boxes (data-driven)</h3><div class="info-row"><span class="key">—</span><span class="val">no active widget</span></div>';
    return;
  }

  const wSpan = state.widget.spanUnits;
  const wW = widgetWidth();

  document.getElementById('widgetInfo').innerHTML = `
    <h3>Widget</h3>
    <div class="info-row"><span class="key">Position (page·col, row)</span><span class="val">${pageOf(state.widget.globalCol)}·${widgetCol(state.widget)}, ${state.widget.startRowIdx}</span></div>
    <div class="info-row"><span class="key">Span (cols × rows)</span><span class="val">${wSpan} × ${state.widget.spanUnitsY}</span></div>
    <div class="info-row"><span class="key">Widget width</span><span class="val highlight">${wW.toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Widget height</span><span class="val highlight">${widgetHeightOnDash().toFixed(2)} px</span></div>
    <div class="info-row"><span class="key">Width formula</span><span class="val">${wSpan}×${dt} + ${Math.max(wSpan - 1, 0)}×${dl.spacing.toFixed(2)}</span></div>
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
    <div class="info-row"><span class="key">Source</span><span class="val">${state.data.source}</span></div>
    <div class="info-row"><span class="key">Status</span><span class="val ${WG_CHAR_STATUS[state.characterId]==='error'?'warn':''}">${WG_CHAR_STATUS[state.characterId] || 'idle'}${WG_CHAR_ERROR[state.characterId] ? ' · '+WG_CHAR_ERROR[state.characterId] : ''}</span></div>
    <div class="info-row"><span class="key">Edit / Dev-view</span><span class="val">${state.config.editMode ? 'edit' : '—'} / ${state.config.devView ? 'dev' : '—'}</span></div>
    <div class="info-row"><span class="key">Stacking</span><span class="val">${state.layout.stacking}</span></div>
    <div class="info-row" style="margin-top:6px;border-top:1px solid var(--border);padding-top:6px;"><span class="key">Columns</span><span class="val highlight">${colSummary || '—'}</span></div>
    <div class="info-row"><span class="key">Box px (w × h)</span><span class="val">${ib.boxPxW.toFixed(2)} × ${ib.boxPxH.toFixed(2)}</span></div>
    <div class="info-row"><span class="key">Rows (data)</span><span class="val">${count}</span></div>
    <div class="info-row"><span class="key">Padding (x / y)</span><span class="val">${ib.paddingX.toFixed(1)} / ${ib.paddingY.toFixed(1)} px</span></div>
    <div class="info-row"><span class="key">Spacing (x / y)</span><span class="val">${ib.spacingX.toFixed(1)} / ${ib.spacingY.toFixed(1)} px</span></div>
    <div class="info-row"><span class="key">Boxes per row</span><span class="val ${ib.boxesPerRow < 1 ? 'warn' : 'highlight'}">${ib.boxesPerRow}</span></div>
    <div class="info-row"><span class="key">Rows (needed / fit)</span><span class="val ${ib.fits ? 'highlight' : 'warn'}">${ib.rowsNeeded} / ${ib.rows}</span></div>
    <div class="info-row"><span class="key">Rendered / overflow</span><span class="val ${overflow > 0 ? 'warn' : ''}">${rendered} / ${overflow}</span></div>
  `;
}

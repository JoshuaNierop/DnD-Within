// D&D Within — Dashboard Edit Mode
// Sidebar palette + drag-from-palette + in-grid drag + corner resize + save.
// Pointer-event based (works on touch + mouse).
// Requires: dashboard-data.js, widgets.js, dashboard.js, core.js

// Per-edit-session in-memory layout (mutated until user clicks Save).
var dashboardWorkingLayout = null;     // array of widget instances for current bp
var dashboardEditingTabId = null;
var dashboardEditingCharId = null;
var dashboardSidebarOpen = false;
var dashboardSidebarActiveCat = 'core';

// ====================================================================
// Edit-mode lifecycle
// ====================================================================

function dashboardEnterEditMode(charId, tabId) {
    dashboardEditMode = true;
    dashboardEditingCharId = charId;
    dashboardEditingTabId = tabId;
    dashboardSidebarOpen = true;
    var bp = dashboardActiveBP();
    var live = getActiveLayoutForBreakpoint(charId, tabId, bp) || [];
    ensureWidgetIds(live);
    dashboardWorkingLayout = JSON.parse(JSON.stringify(live));
    if (typeof renderApp === 'function') renderApp();
}

function dashboardExitEditMode(saveCurrent) {
    if (saveCurrent && dashboardWorkingLayout && dashboardEditingCharId && dashboardEditingTabId) {
        dashboardSaveCurrentBP();
    }
    dashboardEditMode = false;
    dashboardSidebarOpen = false;
    dashboardWorkingLayout = null;
    if (typeof renderApp === 'function') renderApp();
}

function dashboardSaveCurrentBP() {
    if (!dashboardEditingCharId || !dashboardEditingTabId || !dashboardWorkingLayout) return;
    var bp = dashboardActiveBP();
    var existing = loadTabLayout(dashboardEditingCharId, dashboardEditingTabId) || dashboardDefaultLayoutForTab(dashboardEditingTabId);
    existing[bp] = JSON.parse(JSON.stringify(dashboardWorkingLayout));
    if (!existing.primary) existing.primary = bp;
    saveTabLayout(dashboardEditingCharId, dashboardEditingTabId, existing);
}

function dashboardClearCurrentBP() {
    if (!dashboardEditingCharId || !dashboardEditingTabId) return;
    var bp = dashboardActiveBP();
    if (bp === 'desktop') return; // desktop is the master, can't clear
    var existing = loadTabLayout(dashboardEditingCharId, dashboardEditingTabId) || dashboardDefaultLayoutForTab(dashboardEditingTabId);
    existing[bp] = null;
    saveTabLayout(dashboardEditingCharId, dashboardEditingTabId, existing);
    // refresh working layout with auto-reflow result
    dashboardWorkingLayout = getActiveLayoutForBreakpoint(dashboardEditingCharId, dashboardEditingTabId, bp) || [];
    ensureWidgetIds(dashboardWorkingLayout);
    if (typeof renderApp === 'function') renderApp();
}

function dashboardSetBP(bp) {
    if (!DASHBOARD_BREAKPOINTS[bp]) return;
    dashboardPreviewBP = bp;
    if (dashboardEditMode && dashboardEditingCharId && dashboardEditingTabId) {
        // Reload working layout for new bp.
        var live = getActiveLayoutForBreakpoint(dashboardEditingCharId, dashboardEditingTabId, bp) || [];
        ensureWidgetIds(live);
        dashboardWorkingLayout = JSON.parse(JSON.stringify(live));
    }
    if (typeof renderApp === 'function') renderApp();
}

function dashboardToggleGrid() {
    dashboardGridVisible = !dashboardGridVisible;
    if (typeof renderApp === 'function') renderApp();
}

// ====================================================================
// Sidebar palette
// ====================================================================

function renderDashboardEditSidebar(charId, tabId) {
    var grouped = widgetTypesByCategory();
    var html = '<div class="dash-edit-sidebar' + (dashboardSidebarOpen ? ' open' : '') + '" id="dash-edit-sidebar">';

    // Vertical category tabs
    html += '<div class="dash-sidebar-cats">';
    for (var i = 0; i < WIDGET_CATEGORIES.length; i++) {
        var cat = WIDGET_CATEGORIES[i];
        if (!grouped[cat.id] || !grouped[cat.id].length) continue;
        var isActive = cat.id === dashboardSidebarActiveCat;
        html += '<button class="dash-sidebar-cat' + (isActive ? ' active' : '') + '" data-action="dash-sidebar-cat" data-cat="' + cat.id + '" title="' + escapeHtml(cat.label) + '">';
        html += '<span class="dash-sidebar-cat-icon">' + cat.icon + '</span>';
        html += '<span>' + escapeHtml(cat.label) + '</span>';
        html += '</button>';
    }
    html += '</div>';

    // Active category content
    html += '<div class="dash-sidebar-content">';
    html += '<div class="dash-sidebar-header">';
    html += '<h3>Add widget</h3>';
    html += '<button class="dash-sidebar-close" data-action="dash-sidebar-close" title="Close">×</button>';
    html += '</div>';

    var items = grouped[dashboardSidebarActiveCat] || [];
    if (!items.length) {
        html += '<p class="block-note">No widgets in this category.</p>';
    } else {
        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            var def = item.def;
            html += '<div class="dash-palette-item" data-palette-type="' + item.type + '" draggable="false">';
            html += '<div class="dash-palette-item-head">';
            html += '<span class="dash-palette-item-icon">' + (def.icon || '◇') + '</span>';
            html += '<span>' + escapeHtml(def.label) + '</span>';
            html += '</div>';
            html += '<div class="dash-palette-item-desc">' + escapeHtml(def.description || '') + '</div>';
            html += '<div class="dash-size-picker">';
            var sizeOptions = computePaletteSizes(def);
            for (var so = 0; so < sizeOptions.length; so++) {
                var sz = sizeOptions[so];
                var isDefault = sz[0] === def.defaultSize[0] && sz[1] === def.defaultSize[1];
                html += '<button class="dash-size-option' + (isDefault ? ' active' : '') + '" data-size="' + sz[0] + 'x' + sz[1] + '" title="' + sz[0] + ' columns × ' + sz[1] + ' rows">' + sz[0] + '×' + sz[1] + '</button>';
            }
            html += '</div>';
            html += '</div>';
        }
    }

    html += '</div>'; // .dash-sidebar-content
    html += '</div>'; // .dash-edit-sidebar
    return html;
}

// ====================================================================
// Working-layout helpers
// ====================================================================

function dashboardWidgetByWid(wid) {
    if (!dashboardWorkingLayout) return null;
    for (var i = 0; i < dashboardWorkingLayout.length; i++) {
        if (dashboardWorkingLayout[i].wid === wid) return dashboardWorkingLayout[i];
    }
    return null;
}

function dashboardRemoveWidget(wid) {
    if (!dashboardWorkingLayout) return;
    dashboardWorkingLayout = dashboardWorkingLayout.filter(function(w) { return w.wid !== wid; });
    if (typeof renderApp === 'function') renderApp();
}

function dashboardToggleStar(wid) {
    var w = dashboardWidgetByWid(wid);
    if (!w) return;
    w.starred = !w.starred;
    if (typeof renderApp === 'function') renderApp();
}

// Check whether a rectangle (x,y,w,h) overlaps any other widget (excluding ignored wid).
function dashboardRectOverlaps(x, y, w, h, ignoreWid) {
    if (!dashboardWorkingLayout) return false;
    for (var i = 0; i < dashboardWorkingLayout.length; i++) {
        var ww = dashboardWorkingLayout[i];
        if (ignoreWid && ww.wid === ignoreWid) continue;
        if (x < ww.x + ww.w && x + w > ww.x && y < ww.y + ww.h && y + h > ww.y) return true;
    }
    return false;
}

function dashboardCols() {
    return DASHBOARD_BREAKPOINTS[dashboardActiveBP()].cols;
}

// Find first free spot for a widget of size w×h, walking row by row.
function dashboardFindFreeSpot(w, h, ignoreWid) {
    var cols = dashboardCols();
    var y = 0;
    while (y < 200) {
        for (var x = 0; x + w <= cols; x++) {
            if (!dashboardRectOverlaps(x, y, w, h, ignoreWid)) return { x: x, y: y };
        }
        y++;
    }
    return { x: 0, y: y };
}

// Compact: pull all widgets up to fill gaps. Preserves star priority + read order.
function dashboardCompact() {
    if (!dashboardWorkingLayout) return;
    var cols = dashboardCols();
    var packed = reflowLayout(dashboardWorkingLayout, cols, cols);
    dashboardWorkingLayout = packed;
}

// ====================================================================
// Pointer drag/resize engine
// ====================================================================
// Tracks: dragging from palette (creating new widget), dragging existing widget,
// resizing an existing widget. All driven by pointer events on the dashboard grid.

var dashDrag = null; // { mode: 'palette'|'move'|'resize', wid?, type?, w, h, originX, originY, gridRect, cellW, cellH, previewEl }

function dashboardInitEditPointerHandlers() {
    var grid = document.querySelector('.dashboard.is-editing .dashboard-grid');
    if (!grid) return;
    if (grid._dashHandlersBound) return;
    grid._dashHandlersBound = true;

    // Pointer-down on widget → resize if on handle, else move (unless on an interactive child).
    grid.addEventListener('pointerdown', function(e) {
        if (!isDashboardEditMode()) return;
        var resizeH = e.target.closest && e.target.closest('.widget-resize-handle');
        if (resizeH) {
            var widR = resizeH.dataset.wid;
            var w = dashboardWidgetByWid(widR);
            if (!w) return;
            startDrag({ mode: 'resize', wid: widR, w: w.w, h: w.h, startX: w.x, startY: w.y }, e, grid);
            return;
        }
        // Skip drag if pointer started on an interactive child (button, input, contenteditable).
        var interactive = e.target.closest && e.target.closest('button, input, textarea, select, label, [contenteditable="true"]');
        if (interactive) return;
        var widgetEl = e.target.closest && e.target.closest('.widget');
        if (widgetEl) {
            var widM = widgetEl.dataset.wid;
            var w = dashboardWidgetByWid(widM);
            if (!w) return;
            startDrag({ mode: 'move', wid: widM, w: w.w, h: w.h, startX: w.x, startY: w.y }, e, grid);
            return;
        }
    });

    document.addEventListener('pointermove', dashOnPointerMove, true);
    document.addEventListener('pointerup', dashOnPointerUp, true);
    document.addEventListener('pointercancel', dashOnPointerUp, true);
}

function dashboardInitPalettePointerHandlers() {
    var sidebar = document.getElementById('dash-edit-sidebar');
    if (!sidebar) return;
    if (sidebar._dashHandlersBound) return;
    sidebar._dashHandlersBound = true;

    // Size button clicks (no drag) — toggle active size for that palette item.
    sidebar.addEventListener('click', function(e) {
        var sizeBtn = e.target.closest && e.target.closest('.dash-size-option');
        if (!sizeBtn) return;
        e.stopPropagation();
        var item = sizeBtn.closest('.dash-palette-item');
        if (!item) return;
        var sibs = item.querySelectorAll('.dash-size-option');
        for (var i = 0; i < sibs.length; i++) sibs[i].classList.remove('active');
        sizeBtn.classList.add('active');
    });

    sidebar.addEventListener('pointerdown', function(e) {
        // Skip drag if pointer landed on a size-option button.
        if (e.target.closest && e.target.closest('.dash-size-option')) return;
        var item = e.target.closest && e.target.closest('.dash-palette-item');
        if (!item) return;
        var type = item.dataset.paletteType;
        var def = WIDGET_REGISTRY[type];
        if (!def) return;
        // Read the currently selected size for this item, fall back to default.
        var activeBtn = item.querySelector('.dash-size-option.active');
        var w, h;
        if (activeBtn) {
            var parts = activeBtn.dataset.size.split('x');
            w = parseInt(parts[0], 10);
            h = parseInt(parts[1], 10);
        } else {
            w = def.defaultSize[0]; h = def.defaultSize[1];
        }
        var grid = document.querySelector('.dashboard.is-editing .dashboard-grid');
        if (!grid) return;
        startDrag({ mode: 'palette', type: type, w: w, h: h }, e, grid);
        item.classList.add('is-dragging');
    });
}

// Build a small set of size options for a widget: min, default, max (deduped),
// optionally with one intermediate if the range is wide.
function computePaletteSizes(def) {
    var sizes = [];
    function key(arr) { return arr[0] + 'x' + arr[1]; }
    var seen = {};
    function add(arr) {
        var k = key(arr);
        if (!seen[k]) { seen[k] = true; sizes.push(arr.slice()); }
    }
    add(def.minSize);
    // Optional intermediate between min and default if both differ enough.
    var midW = Math.round((def.minSize[0] + def.defaultSize[0]) / 2);
    var midH = Math.round((def.minSize[1] + def.defaultSize[1]) / 2);
    if (midW !== def.minSize[0] && midW !== def.defaultSize[0]) add([midW, midH]);
    add(def.defaultSize);
    var midW2 = Math.round((def.defaultSize[0] + def.maxSize[0]) / 2);
    var midH2 = Math.round((def.defaultSize[1] + def.maxSize[1]) / 2);
    if (midW2 !== def.defaultSize[0] && midW2 !== def.maxSize[0]) add([midW2, midH2]);
    add(def.maxSize);
    return sizes;
}

function startDrag(opts, e, grid) {
    var rect = grid.getBoundingClientRect();
    var cols = parseInt(grid.dataset.cols, 10) || dashboardCols();
    var styleVal = getComputedStyle(grid).getPropertyValue('--dash-row-h').trim();
    var rowH = parseInt(styleVal, 10) || 80;
    var gapStr = getComputedStyle(grid).getPropertyValue('gap').trim();
    var gap = parseInt(gapStr, 10) || 10;
    var cellW = (rect.width - gap * (cols - 1)) / cols;

    dashDrag = {
        mode: opts.mode,
        wid: opts.wid || null,
        type: opts.type || null,
        w: opts.w,
        h: opts.h,
        startX: opts.startX != null ? opts.startX : 0,
        startY: opts.startY != null ? opts.startY : 0,
        gridRect: rect,
        gridEl: grid,
        cols: cols,
        cellW: cellW,
        cellH: rowH,
        gap: gap
    };

    // Create floating preview element
    var preview = document.createElement('div');
    preview.className = 'dash-drop-preview';
    preview.style.position = 'fixed';
    preview.style.width = (opts.w * cellW + (opts.w - 1) * gap) + 'px';
    preview.style.height = (opts.h * rowH + (opts.h - 1) * gap) + 'px';
    document.body.appendChild(preview);
    dashDrag.previewEl = preview;

    if (opts.mode === 'resize') {
        // For resize: anchor to widget origin, grow towards pointer
        // Track the "ghost" width/height being computed live
    }

    // Capture pointer (only for non-palette: palette click already lifted pointer over sidebar)
    try { grid.setPointerCapture && grid.setPointerCapture(e.pointerId); } catch (err) {}
    e.preventDefault();
}

function dashOnPointerMove(e) {
    if (!dashDrag) return;
    var rect = dashDrag.gridRect = dashDrag.gridEl.getBoundingClientRect(); // refresh in case of scroll
    var preview = dashDrag.previewEl;

    // Compute grid coordinates from pointer
    var localX = e.clientX - rect.left;
    var localY = e.clientY - rect.top;
    var col = Math.max(0, Math.floor(localX / (dashDrag.cellW + dashDrag.gap)));
    var row = Math.max(0, Math.floor(localY / (dashDrag.cellH + dashDrag.gap)));

    if (dashDrag.mode === 'resize') {
        // Resize: compute new w/h from pointer position relative to widget origin
        var widget = dashboardWidgetByWid(dashDrag.wid);
        if (!widget) return;
        var newW = Math.max(1, col - widget.x + 1);
        var newH = Math.max(1, row - widget.y + 1);
        var def = WIDGET_REGISTRY[widget.type];
        if (def) {
            newW = Math.min(def.maxSize[0], Math.max(def.minSize[0], newW));
            newH = Math.min(def.maxSize[1], Math.max(def.minSize[1], newH));
        }
        newW = Math.min(newW, dashDrag.cols - widget.x);
        dashDrag.w = newW;
        dashDrag.h = newH;
        // Position preview at widget origin
        var px = rect.left + widget.x * (dashDrag.cellW + dashDrag.gap);
        var py = rect.top + widget.y * (dashDrag.cellH + dashDrag.gap);
        preview.style.left = px + 'px';
        preview.style.top = py + 'px';
        preview.style.width = (newW * dashDrag.cellW + (newW - 1) * dashDrag.gap) + 'px';
        preview.style.height = (newH * dashDrag.cellH + (newH - 1) * dashDrag.gap) + 'px';
        var overlap = dashboardRectOverlaps(widget.x, widget.y, newW, newH, widget.wid);
        preview.classList.toggle('invalid', overlap);
    } else {
        // move or palette: snap to grid
        var w = dashDrag.w, h = dashDrag.h;
        var x = Math.min(Math.max(0, col), dashDrag.cols - w);
        var y = Math.max(0, row);
        dashDrag.previewX = x;
        dashDrag.previewY = y;
        var px = rect.left + x * (dashDrag.cellW + dashDrag.gap);
        var py = rect.top + y * (dashDrag.cellH + dashDrag.gap);
        preview.style.left = px + 'px';
        preview.style.top = py + 'px';
        preview.style.width = (w * dashDrag.cellW + (w - 1) * dashDrag.gap) + 'px';
        preview.style.height = (h * dashDrag.cellH + (h - 1) * dashDrag.gap) + 'px';
        var overlap = dashboardRectOverlaps(x, y, w, h, dashDrag.wid);
        preview.classList.toggle('invalid', overlap);
    }
    e.preventDefault();
}

function dashOnPointerUp(e) {
    if (!dashDrag) return;
    var preview = dashDrag.previewEl;
    var commit = preview && !preview.classList.contains('invalid');

    if (commit) {
        if (dashDrag.mode === 'palette') {
            var spot = (dashDrag.previewX != null) ? { x: dashDrag.previewX, y: dashDrag.previewY } : dashboardFindFreeSpot(dashDrag.w, dashDrag.h);
            if (!dashboardRectOverlaps(spot.x, spot.y, dashDrag.w, dashDrag.h, null)) {
                if (!dashboardWorkingLayout) dashboardWorkingLayout = [];
                dashboardWorkingLayout.push({
                    wid: generateWidgetId(),
                    type: dashDrag.type,
                    x: spot.x, y: spot.y,
                    w: dashDrag.w, h: dashDrag.h,
                    starred: false,
                    config: {}
                });
            }
        } else if (dashDrag.mode === 'move') {
            var w = dashboardWidgetByWid(dashDrag.wid);
            if (w && dashDrag.previewX != null) {
                w.x = dashDrag.previewX;
                w.y = dashDrag.previewY;
            }
        } else if (dashDrag.mode === 'resize') {
            var ww = dashboardWidgetByWid(dashDrag.wid);
            if (ww) { ww.w = dashDrag.w; ww.h = dashDrag.h; }
        }
    }

    // Cleanup preview
    if (preview && preview.parentNode) preview.parentNode.removeChild(preview);
    var draggingItems = document.querySelectorAll('.dash-palette-item.is-dragging');
    for (var i = 0; i < draggingItems.length; i++) draggingItems[i].classList.remove('is-dragging');

    dashDrag = null;
    if (typeof renderApp === 'function') renderApp();
}

// ====================================================================
// Events binding (called from events.js click delegate)
// ====================================================================

function dashboardHandleAction(action, target, event) {
    if (action === 'dashboard-toggle-edit') {
        var dash = target.closest('.dashboard');
        if (!dash) return true;
        var charIdEl = document.querySelector('.character-page');
        var charId = charIdEl && charIdEl.dataset.charId;
        var tabId = dash.dataset.tabId;
        // Done auto-saves current breakpoint so users don't lose work.
        if (dashboardEditMode) dashboardExitEditMode(true);
        else dashboardEnterEditMode(charId, tabId);
        return true;
    }
    if (action === 'dashboard-toggle-grid') {
        dashboardToggleGrid();
        return true;
    }
    if (action === 'dashboard-set-bp') {
        var bp = target.dataset.bp;
        dashboardSetBP(bp);
        return true;
    }
    if (action === 'dashboard-save-bp') {
        dashboardSaveCurrentBP();
        // Visual ack
        target.textContent = '✓ Saved';
        setTimeout(function() {
            if (typeof renderApp === 'function') renderApp();
        }, 600);
        return true;
    }
    if (action === 'dashboard-clear-bp') {
        if (confirm('Clear saved layout for ' + DASHBOARD_BREAKPOINTS[dashboardActiveBP()].label + '? This will revert to auto-reflow from desktop.')) {
            dashboardClearCurrentBP();
        }
        return true;
    }
    if (action === 'dashboard-compact') {
        dashboardCompact();
        if (typeof renderApp === 'function') renderApp();
        return true;
    }
    if (action === 'dashboard-save-as-template') {
        var name = prompt('Template name?', dashboardEditingTabId + ' template');
        if (name) {
            saveTabAsTemplate(dashboardEditingCharId, dashboardEditingTabId, name);
            alert('Template saved.');
        }
        return true;
    }
    if (action === 'widget-toggle-star') {
        dashboardToggleStar(target.dataset.wid);
        return true;
    }
    if (action === 'widget-remove') {
        dashboardRemoveWidget(target.dataset.wid);
        return true;
    }
    if (action === 'dash-sidebar-cat') {
        dashboardSidebarActiveCat = target.dataset.cat;
        if (typeof renderApp === 'function') renderApp();
        return true;
    }
    if (action === 'dash-sidebar-close') {
        dashboardSidebarOpen = false;
        if (typeof renderApp === 'function') renderApp();
        return true;
    }
    return false;
}

// Hook: called from app.js postRenderEffects to (re)bind pointer handlers after each render.
function dashboardPostRender() {
    if (isDashboardEditMode()) {
        dashboardInitEditPointerHandlers();
        dashboardInitPalettePointerHandlers();
    }
    dashboardBindWidgetContentEditors();
}

// ====================================================================
// Widget content editing (text title/body, image upload)
// View-mode editing — survives without entering edit-mode. Persists to saved layout
// (auto-creates if necessary so subsequent renders show the edit).
// ====================================================================

function dashboardBindWidgetContentEditors() {
    var charPage = document.querySelector('.character-page');
    if (!charPage) return;
    var charId = charPage.dataset.charId;
    var dash = charPage.querySelector('.dashboard');
    if (!dash) return;
    var tabId = dash.dataset.tabId;
    if (!charId || !tabId) return;
    if (!canEdit(charId)) return;

    // Text widgets — save on blur of contenteditable
    var editables = dash.querySelectorAll('[contenteditable="true"][data-action^="widget-text-"]');
    for (var i = 0; i < editables.length; i++) {
        var el = editables[i];
        if (el._dashBound) continue;
        el._dashBound = true;
        el.addEventListener('blur', function(e) {
            var t = e.currentTarget;
            var wid = t.dataset.wid;
            var field = t.dataset.action === 'widget-text-title' ? 'title' : 'body';
            var newValue = (t.textContent || '').trim();
            dashboardUpdateWidgetConfig(charId, tabId, wid, field, newValue);
        });
        // Prevent Enter from bubbling drag/etc; allow line breaks in body only
        el.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && e.currentTarget.dataset.action === 'widget-text-title') {
                e.preventDefault();
                e.currentTarget.blur();
            }
        });
    }

    // Image upload
    var fileInputs = dash.querySelectorAll('input[type="file"][data-action="widget-image-upload"]');
    for (var j = 0; j < fileInputs.length; j++) {
        var fi = fileInputs[j];
        if (fi._dashBound) continue;
        fi._dashBound = true;
        fi.addEventListener('change', function(e) {
            var inp = e.currentTarget;
            var wid = inp.dataset.wid;
            var file = inp.files && inp.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) {
                dashboardUpdateWidgetConfig(charId, tabId, wid, 'src', ev.target.result);
            };
            reader.readAsDataURL(file);
        });
    }
}

function dashboardUpdateWidgetConfig(charId, tabId, wid, field, value) {
    // Materialise saved layout if missing so wid is stable.
    var layout = loadTabLayout(charId, tabId);
    var bp = dashboardActiveBP();
    if (!layout) {
        // Use current rendered widgets as the seed (they already have wids assigned by the latest render).
        var rendered = Array.from(document.querySelectorAll('.dashboard[data-tab-id="' + tabId + '"] .widget')).map(function(el) {
            return {
                wid: el.dataset.wid,
                type: el.dataset.type,
                x: parseInt(el.dataset.x, 10) || 0,
                y: parseInt(el.dataset.y, 10) || 0,
                w: parseInt(el.dataset.w, 10) || 1,
                h: parseInt(el.dataset.h, 10) || 1,
                config: {}
            };
        });
        // Preserve existing config from the in-memory rendered widgets if any (text default config).
        // Pull from default layout to recover original config (titles like "Allies"/"Enemies").
        var defaults = dashboardDefaultLayoutForTab(tabId);
        // Match by index/type — defaults order matches rendered for fresh dashboards.
        for (var i = 0; i < rendered.length && i < defaults.desktop.length; i++) {
            if (rendered[i].type === defaults.desktop[i].type && defaults.desktop[i].config) {
                rendered[i].config = JSON.parse(JSON.stringify(defaults.desktop[i].config));
            }
        }
        layout = { primary: bp, desktop: null, tablet: null, mobile: null };
        layout[bp] = rendered;
        // If current bp isn't desktop, populate desktop with the same widgets at the same coords (best-effort).
        if (bp !== 'desktop') layout.desktop = rendered.slice();
    }
    // Find widget in current bp's layout (or primary).
    var arr = layout[bp] || layout[layout.primary] || layout.desktop;
    if (!Array.isArray(arr)) return;
    for (var k = 0; k < arr.length; k++) {
        if (arr[k].wid === wid) {
            if (!arr[k].config) arr[k].config = {};
            arr[k].config[field] = value;
            break;
        }
    }
    saveTabLayout(charId, tabId, layout);
    // No re-render needed for text (DOM already shows the edit). For image upload, re-render to show.
    if (field === 'src') {
        if (typeof renderApp === 'function') renderApp();
    }
}

// ====================================================================
// Tab management modal (add/hide/rename/reorder/delete custom tabs)
// ====================================================================

function showTabManageModal(charId) {
    var existing = document.getElementById('tab-manage-modal-root');
    if (existing) existing.remove();

    var root = document.createElement('div');
    root.id = 'tab-manage-modal-root';
    root.className = 'modal-overlay';
    root.style.zIndex = '1500';
    root.addEventListener('click', function(e) { if (e.target === root) root.remove(); });
    document.body.appendChild(root);

    function rerender() {
        var cfg = loadDashboardConfig(charId);
        var html = '<div class="modal-card" onclick="event.stopPropagation();" style="max-width:520px;">';
        html += '<div class="modal-header"><h2>Manage Tabs</h2><button class="modal-close" id="tab-manage-close">&times;</button></div>';
        html += '<div class="modal-body">';
        html += '<p class="block-note">Drag to reorder. Toggle 👁 to hide. System tabs cannot be deleted, only hidden.</p>';
        html += '<div class="tab-manage-list" id="tab-manage-list">';
        for (var i = 0; i < cfg.tabs.length; i++) {
            var tab = cfg.tabs[i];
            html += '<div class="tab-manage-row' + (tab.hidden ? ' is-hidden' : '') + '" data-tab-id="' + tab.id + '" data-idx="' + i + '" draggable="true">';
            html += '<span class="tab-manage-handle">≡</span>';
            html += '<span>' + (tab.icon || '○') + '</span>';
            html += '<input type="text" class="tab-manage-label" value="' + escapeAttr(tab.label) + '" data-tab-id="' + tab.id + '">';
            html += '<button class="tab-manage-toggle" data-tm-action="toggle-hide" data-tab-id="' + tab.id + '" title="' + (tab.hidden ? 'Show' : 'Hide') + '">' + (tab.hidden ? '👁' : '◉') + '</button>';
            if (tab.custom) {
                html += '<button class="tab-manage-delete" data-tm-action="delete" data-tab-id="' + tab.id + '" title="Delete custom tab">🗑</button>';
            } else {
                html += '<span style="width:24px;"></span>';
            }
            html += '</div>';
        }
        html += '</div>';

        html += '<div class="tab-manage-add">';
        html += '<input type="text" id="tab-manage-new-label" placeholder="New tab name…">';
        html += '<input type="text" id="tab-manage-new-icon" placeholder="Icon" style="width:50px;text-align:center;" value="○">';
        html += '<button class="btn btn-primary btn-sm" data-tm-action="add">+ Add</button>';
        html += '</div>';

        html += '</div>'; // modal-body
        html += '<div class="modal-footer" style="padding:0.6rem 1rem;display:flex;justify-content:flex-end;gap:0.5rem;border-top:1px solid var(--border);">';
        html += '<button class="btn btn-ghost" id="tab-manage-cancel">Close</button>';
        html += '</div>';
        html += '</div>';
        root.innerHTML = html;
        bindTabManageEvents(charId, root, rerender);
    }
    rerender();
}

function bindTabManageEvents(charId, root, rerender) {
    root.querySelector('#tab-manage-close').onclick = function() { root.remove(); };
    root.querySelector('#tab-manage-cancel').onclick = function() { root.remove(); };

    // Label edits (live save on blur)
    var labelInputs = root.querySelectorAll('.tab-manage-label');
    for (var i = 0; i < labelInputs.length; i++) {
        labelInputs[i].addEventListener('change', function(e) {
            var tabId = e.target.dataset.tabId;
            var cfg = loadDashboardConfig(charId);
            for (var j = 0; j < cfg.tabs.length; j++) {
                if (cfg.tabs[j].id === tabId) cfg.tabs[j].label = e.target.value || cfg.tabs[j].label;
            }
            saveDashboardConfig(charId, cfg);
        });
    }

    // Action buttons
    root.addEventListener('click', function(e) {
        var btn = e.target.closest && e.target.closest('[data-tm-action]');
        if (!btn) return;
        var tmAction = btn.dataset.tmAction;
        var tabId = btn.dataset.tabId;
        var cfg = loadDashboardConfig(charId);

        if (tmAction === 'toggle-hide') {
            for (var k = 0; k < cfg.tabs.length; k++) {
                if (cfg.tabs[k].id === tabId) cfg.tabs[k].hidden = !cfg.tabs[k].hidden;
            }
            saveDashboardConfig(charId, cfg);
            rerender();
        } else if (tmAction === 'delete') {
            cfg.tabs = cfg.tabs.filter(function(t) { return t.id !== tabId; });
            if (cfg.layouts && cfg.layouts[tabId]) delete cfg.layouts[tabId];
            saveDashboardConfig(charId, cfg);
            rerender();
            if (typeof renderApp === 'function') renderApp();
        } else if (tmAction === 'add') {
            var lbl = root.querySelector('#tab-manage-new-label').value.trim();
            var icon = root.querySelector('#tab-manage-new-icon').value.trim() || '○';
            if (!lbl) return;
            var newId = 'custom_' + Date.now().toString(36);
            cfg.tabs.push({ id: newId, label: lbl, icon: icon, custom: true, hidden: false });
            saveDashboardConfig(charId, cfg);
            rerender();
            if (typeof renderApp === 'function') renderApp();
        }
    });

    // Drag-reorder via HTML5 drag events on rows
    var rows = root.querySelectorAll('.tab-manage-row');
    var draggedIdx = -1;
    for (var r = 0; r < rows.length; r++) {
        rows[r].addEventListener('dragstart', function(e) {
            draggedIdx = parseInt(e.currentTarget.dataset.idx, 10);
            e.currentTarget.classList.add('is-dragging');
            try { e.dataTransfer.effectAllowed = 'move'; } catch (err) {}
        });
        rows[r].addEventListener('dragend', function(e) { e.currentTarget.classList.remove('is-dragging'); });
        rows[r].addEventListener('dragover', function(e) { e.preventDefault(); });
        rows[r].addEventListener('drop', function(e) {
            e.preventDefault();
            var dropIdx = parseInt(e.currentTarget.dataset.idx, 10);
            if (draggedIdx < 0 || draggedIdx === dropIdx) return;
            var cfg2 = loadDashboardConfig(charId);
            var moved = cfg2.tabs.splice(draggedIdx, 1)[0];
            cfg2.tabs.splice(dropIdx, 0, moved);
            saveDashboardConfig(charId, cfg2);
            rerender();
            if (typeof renderApp === 'function') renderApp();
        });
    }
}

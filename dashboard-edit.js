// D&D Within — Dashboard Edit Mode
// Edit lifecycle (enter/exit/save/clear/compact), palette sidebar,
// view-mode content editing (text + image), tab management modal.
// Drag/resize is handled by Gridstack (configured in dashboard.js).
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
    dashboardWorkingLayout = getActiveLayoutForBreakpoint(dashboardEditingCharId, dashboardEditingTabId, bp) || [];
    ensureWidgetIds(dashboardWorkingLayout);
    if (typeof renderApp === 'function') renderApp();
}

function dashboardSetBP(bp) {
    if (!DASHBOARD_BREAKPOINTS[bp]) return;
    dashboardPreviewBP = bp;
    if (dashboardEditMode && dashboardEditingCharId && dashboardEditingTabId) {
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
            html += '<div class="dash-palette-item" data-palette-type="' + item.type + '">';
            html += '<div class="dash-palette-item-head">';
            html += '<span class="dash-palette-item-icon">' + (def.icon || '◇') + '</span>';
            html += '<span>' + escapeHtml(def.label) + '</span>';
            html += '</div>';
            html += '<div class="dash-palette-item-desc">' + escapeHtml(def.description || '') + '</div>';
            html += '<div class="dash-size-picker">';
            var sizeOptions = computePaletteSizes(def);
            for (var so = 0; so < sizeOptions.length; so++) {
                var sz = sizeOptions[so];
                html += '<button class="dash-size-option" data-action="dash-add-widget" data-type="' + item.type + '" data-w="' + sz[0] + '" data-h="' + sz[1] + '" title="Add at ' + sz[0] + '×' + sz[1] + '">' + sz[0] + '×' + sz[1] + '</button>';
            }
            html += '</div>';
            html += '</div>';
        }
    }

    html += '</div>'; // .dash-sidebar-content
    html += '</div>'; // .dash-edit-sidebar
    return html;
}

// Build a small set of size options for a widget: min, default, max (deduped).
function computePaletteSizes(def) {
    var sizes = [];
    var seen = {};
    function add(arr) {
        var k = arr[0] + 'x' + arr[1];
        if (!seen[k]) { seen[k] = true; sizes.push(arr.slice()); }
    }
    add(def.minSize);
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

function dashboardCols() {
    return DASHBOARD_BREAKPOINTS[dashboardActiveBP()].cols;
}

// Add a widget from the palette at default position (Gridstack auto-finds free spot).
function dashboardAddWidget(type, w, h) {
    var def = WIDGET_REGISTRY[type];
    if (!def) return;
    var cols = dashboardCols();
    w = Math.max(def.minSize[0], Math.min(def.maxSize[0], w || def.defaultSize[0]));
    h = Math.max(def.minSize[1], Math.min(def.maxSize[1], h || def.defaultSize[1]));
    w = Math.min(w, cols);

    if (!Array.isArray(dashboardWorkingLayout)) dashboardWorkingLayout = [];

    // Find first free spot using the same algorithm as reflowLayout — keeps consistency.
    var occ = [];
    function isFree(x, y, ww, hh) {
        for (var yy = y; yy < y + hh; yy++) {
            if (!occ[yy]) continue;
            for (var xx = x; xx < x + ww; xx++) {
                if (occ[yy][xx]) return false;
            }
        }
        return true;
    }
    function fill(x, y, ww, hh) {
        for (var yy = y; yy < y + hh; yy++) {
            if (!occ[yy]) occ[yy] = [];
            for (var xx = x; xx < x + ww; xx++) occ[yy][xx] = true;
        }
    }
    dashboardWorkingLayout.forEach(function(ww) {
        fill(ww.x || 0, ww.y || 0, ww.w || 1, ww.h || 1);
    });
    var spot = { x: 0, y: 0 };
    var found = false;
    for (var y = 0; y < 200 && !found; y++) {
        for (var x = 0; x + w <= cols; x++) {
            if (isFree(x, y, w, h)) { spot = { x: x, y: y }; found = true; break; }
        }
    }

    dashboardWorkingLayout.push({
        wid: generateWidgetId(),
        type: type,
        x: spot.x, y: spot.y, w: w, h: h,
        starred: false,
        config: {}
    });
    if (typeof renderApp === 'function') renderApp();
}

// Compact: re-pack to remove gaps, preserve star priority + read order.
function dashboardCompact() {
    if (!dashboardWorkingLayout) return;
    var cols = dashboardCols();
    dashboardWorkingLayout = reflowLayout(dashboardWorkingLayout, cols, cols);
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
        if (dashboardEditMode) dashboardExitEditMode(true);
        else dashboardEnterEditMode(charId, tabId);
        return true;
    }
    if (action === 'dashboard-toggle-grid') {
        dashboardToggleGrid();
        return true;
    }
    if (action === 'dashboard-toggle-bp-menu') {
        var wrap = target.closest('.dash-bp-popover-wrap');
        var pop = wrap && wrap.querySelector('.dash-bp-popover');
        if (pop) pop.hidden = !pop.hidden;
        return true;
    }
    if (action === 'dashboard-set-bp') {
        var bp = target.dataset.bp;
        var pop2 = target.closest('.dash-bp-popover');
        if (pop2) pop2.hidden = true;
        dashboardSetBP(bp);
        return true;
    }
    if (action === 'dashboard-save-bp') {
        dashboardSaveCurrentBP();
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
    if (action === 'dash-add-widget') {
        var type = target.dataset.type;
        var w = parseInt(target.dataset.w, 10);
        var h = parseInt(target.dataset.h, 10);
        dashboardAddWidget(type, w, h);
        return true;
    }
    return false;
}

// Hook: called from app.js postRenderEffects.
// Initialises Gridstack for the active dashboard, then binds content editors.
function dashboardPostRender() {
    if (typeof dashboardInitGridstack === 'function') dashboardInitGridstack();
    dashboardBindWidgetContentEditors();
}

// ====================================================================
// Widget content editing (text title/body, image upload) in view-mode
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
    var layout = loadTabLayout(charId, tabId);
    var bp = dashboardActiveBP();
    if (!layout) {
        // Materialise saved layout from currently-rendered widgets so wid is stable.
        var rendered = Array.from(document.querySelectorAll('.dashboard[data-tab-id="' + tabId + '"] .grid-stack-item')).map(function(el) {
            var n = el.gridstackNode || {};
            return {
                wid: el.dataset.wid,
                type: el.dataset.type,
                x: n.x || 0, y: n.y || 0, w: n.w || 1, h: n.h || 1,
                config: {}
            };
        });
        var defaults = dashboardDefaultLayoutForTab(tabId);
        for (var i = 0; i < rendered.length && i < defaults.desktop.length; i++) {
            if (rendered[i].type === defaults.desktop[i].type && defaults.desktop[i].config) {
                rendered[i].config = JSON.parse(JSON.stringify(defaults.desktop[i].config));
            }
        }
        layout = { primary: bp, desktop: null, tablet: null, mobile: null };
        layout[bp] = rendered;
        if (bp !== 'desktop') layout.desktop = rendered.slice();
    }
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
    // Refresh the widget body in place (avoids losing focus / scroll on rerender).
    if (typeof dashboardRefreshWidget === 'function') {
        dashboardRefreshWidget(wid);
    } else if (field === 'src' && typeof renderApp === 'function') {
        renderApp();
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

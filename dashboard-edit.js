// D&D Within — Dashboard Edit Mode (simplified for intrinsic-grid)
//
// Responsibilities (was: ~600 lines with Gridstack drag/resize/reflow):
//   - Enter / exit edit mode (no working-layout snapshot; mutations write through)
//   - Render the palette sidebar (click a widget to add at default size M)
//   - Dispatch click-actions: toggle-edit, set-fs, save-as-template, sidebar nav,
//     widget cycle-size / toggle-star / remove
//   - View-mode content editors (contenteditable for text-widget title/body, image upload)
//   - Tab management modal (add/hide/rename/reorder/delete custom tabs)
//
// No drag/resize. No per-breakpoint state. No reflow algorithm — CSS handles it.
// Requires: dashboard-data.js, widgets.js, dashboard.js, core.js

var dashboardEditingCharId = null;
var dashboardEditingTabId  = null;
var dashboardSidebarOpen   = false;
var dashboardSidebarActiveCat = 'core';

// ====================================================================
// Edit-mode lifecycle
// ====================================================================
function dashboardEnterEditMode(charId, tabId) {
    dashboardEditMode = true;
    dashboardEditingCharId = charId;
    dashboardEditingTabId = tabId;
    dashboardSidebarOpen = true;
    if (typeof renderApp === 'function') renderApp();
}

function dashboardExitEditMode() {
    dashboardEditMode = false;
    dashboardSidebarOpen = false;
    if (typeof renderApp === 'function') renderApp();
}

// ====================================================================
// Palette sidebar
// ====================================================================
function widgetTypesByCategory() {
    var grouped = {};
    for (var type in WIDGET_REGISTRY) {
        if (!Object.prototype.hasOwnProperty.call(WIDGET_REGISTRY, type)) continue;
        var def = WIDGET_REGISTRY[type];
        var cat = def.category || 'core';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({ type: type, def: def });
    }
    return grouped;
}

function renderDashboardEditSidebar(charId, tabId) {
    var grouped = widgetTypesByCategory();
    var html = '<div class="dash-edit-sidebar' + (dashboardSidebarOpen ? ' open cat-open' : '') + '" id="dash-edit-sidebar">';

    // Category strip
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
    html += '<h3>Add Widget</h3>';
    html += '<button class="dash-sidebar-close" data-action="dash-sidebar-close" title="Close">×</button>';
    html += '</div>';

    var items = grouped[dashboardSidebarActiveCat] || [];
    if (!items.length) {
        html += '<p class="block-note">No widgets in this category.</p>';
    } else {
        for (var j = 0; j < items.length; j++) {
            var item = items[j];
            var def = item.def;
            html += '<button class="dash-palette-item" data-action="dash-add-widget" data-type="' + item.type + '">';
            html += '<div class="dash-palette-item-head">';
            html += '<span class="dash-palette-item-icon">' + (def.icon || '◇') + '</span>';
            html += '<span>' + escapeHtml(def.label) + '</span>';
            html += '</div>';
            html += '<div class="dash-palette-item-desc">' + escapeHtml(def.description || '') + '</div>';
            html += '</button>';
        }
    }

    html += '</div>'; // .dash-sidebar-content
    html += '</div>'; // .dash-edit-sidebar
    return html;
}

// ====================================================================
// Action dispatcher (called from events.js click delegate)
// ====================================================================
function dashboardHandleAction(action, target, event) {
    if (action === 'dashboard-toggle-edit') {
        var dash = target.closest('.dashboard');
        var charPage = document.querySelector('.character-page');
        var charId = charPage && charPage.dataset.charId;
        var tabId = dash && dash.dataset.tabId;
        if (dashboardEditMode) dashboardExitEditMode();
        else dashboardEnterEditMode(charId, tabId);
        return true;
    }
    if (action === 'dashboard-toggle-fs-menu') {
        var fwrap = target.closest('.dash-fs-popover-wrap');
        var fpop = fwrap && fwrap.querySelector('.dash-fs-popover');
        if (fpop) fpop.hidden = !fpop.hidden;
        return true;
    }
    if (action === 'dashboard-set-fs') {
        var fs = target.dataset.fs;
        var fpop2 = target.closest('.dash-fs-popover');
        if (fpop2) fpop2.hidden = true;
        if (typeof setFontSize === 'function') setFontSize(fs);
        if (typeof renderApp === 'function') renderApp();
        return true;
    }
    if (action === 'dashboard-save-as-template') {
        if (!dashboardEditingCharId || !dashboardEditingTabId) return true;
        var name = prompt('Template name?', dashboardEditingTabId + ' template');
        if (name) {
            saveTabAsTemplate(dashboardEditingCharId, dashboardEditingTabId, name);
            alert('Template saved.');
        }
        return true;
    }
    if (action === 'widget-cycle-w' || action === 'widget-cycle-h') {
        var charPage1 = document.querySelector('.character-page');
        var dash1 = target.closest('.dashboard');
        if (!charPage1 || !dash1) return true;
        var dim = (action === 'widget-cycle-w') ? 'w' : 'h';
        cycleWidgetDim(charPage1.dataset.charId, dash1.dataset.tabId, target.dataset.wid, dim);
        if (typeof renderApp === 'function') renderApp();
        return true;
    }
    if (action === 'widget-toggle-star') {
        var charPage2 = document.querySelector('.character-page');
        var dash2 = target.closest('.dashboard');
        if (!charPage2 || !dash2) return true;
        toggleWidgetStar(charPage2.dataset.charId, dash2.dataset.tabId, target.dataset.wid);
        if (typeof renderApp === 'function') renderApp();
        return true;
    }
    if (action === 'widget-remove') {
        var charPage3 = document.querySelector('.character-page');
        var dash3 = target.closest('.dashboard');
        if (!charPage3 || !dash3) return true;
        removeWidget(charPage3.dataset.charId, dash3.dataset.tabId, target.dataset.wid);
        if (typeof renderApp === 'function') renderApp();
        return true;
    }
    if (action === 'dash-sidebar-cat') {
        var sb = target.closest('.dash-edit-sidebar');
        var clickedCat = target.dataset.cat;
        if (sb && dashboardSidebarActiveCat === clickedCat && sb.classList.contains('cat-open')) {
            sb.classList.remove('cat-open');
            return true;
        }
        if (sb) sb.classList.add('cat-open');
        dashboardSidebarActiveCat = clickedCat;
        if (typeof renderApp === 'function') renderApp();
        return true;
    }
    if (action === 'dash-sidebar-close') {
        dashboardSidebarOpen = false;
        if (typeof renderApp === 'function') renderApp();
        return true;
    }
    if (action === 'dash-add-widget') {
        var charPage4 = document.querySelector('.character-page');
        if (!charPage4 || !dashboardEditingTabId) return true;
        var type = target.dataset.type;
        if (!type) return true;
        addWidget(charPage4.dataset.charId, dashboardEditingTabId, type);
        if (typeof renderApp === 'function') renderApp();
        return true;
    }
    return false;
}

// ====================================================================
// Post-render hook — bind in-place content editors (text, image upload)
// ====================================================================
function dashboardPostRender() {
    dashboardBindWidgetContentEditors();
}

function dashboardBindWidgetContentEditors() {
    var charPage = document.querySelector('.character-page');
    if (!charPage) return;
    var charId = charPage.dataset.charId;
    var dash = charPage.querySelector('.dashboard');
    if (!dash) return;
    var tabId = dash.dataset.tabId;
    if (!charId || !tabId) return;
    if (!canEdit(charId)) return;

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
    var widgets = loadTabWidgets(charId, tabId);
    if (!widgets) widgets = dashboardDefaultWidgetsForTab(tabId);
    for (var i = 0; i < widgets.length; i++) {
        if (widgets[i].wid === wid) {
            if (!widgets[i].config) widgets[i].config = {};
            widgets[i].config[field] = value;
            break;
        }
    }
    saveTabWidgets(charId, tabId, widgets);
    if (typeof dashboardRefreshWidget === 'function') {
        dashboardRefreshWidget(wid);
    } else if (typeof renderApp === 'function') {
        renderApp();
    }
}

// ====================================================================
// Tab management modal (unchanged behaviour — just uses new config shape)
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
            if (cfg.widgets && cfg.widgets[tabId]) delete cfg.widgets[tabId];
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

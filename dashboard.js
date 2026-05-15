// D&D Within — Dashboard Renderer (Intrinsic CSS Grid)
//
// Replaces the old Gridstack-based renderer with a pure CSS-grid approach:
//   - OUTER  .dashboard       repeat(auto-fit, minmax(MIN, 1fr))  (CSS)
//   - WIDGET .widget          --span via data-size attribute       (CSS)
//
// Each widget's "size" is one of 'S' | 'M' | 'L' | 'XL' (span 1/2/3/4).
// The user cycles size by clicking the ⬡ button in the widget header.
//
// Requires: dashboard-data.js, widgets.js, core.js (no CDN dependency).

// Edit-mode flag — set by dashboard-edit.js
var dashboardEditMode = false;

function isDashboardEditMode() { return !!dashboardEditMode; }

// Context cached during render so single-widget refresh has the data it needs.
var dashRenderCtx = null;

// Render the dashboard tab shell. CSS-grid does the layout work — no post-init
// step needed for the grid itself.
function renderDashboardTab(charId, tabId) {
    var editable = canEdit(charId);

    var widgets = loadTabWidgets(charId, tabId);
    if (!widgets || !widgets.length) {
        // First-open: fall back to the default layout (now flat, size-keyed)
        widgets = dashboardDefaultWidgetsForTab(tabId);
    }
    ensureWidgetIds(widgets);

    var config = loadCharConfig(charId);
    var state = loadCharState(charId);

    dashRenderCtx = { charId: charId, tabId: tabId, config: config, state: state, editable: editable };

    var html = '<div class="dashboard' + (dashboardEditMode ? ' is-editing' : '') + '" data-tab-id="' + tabId + '" data-char-id="' + charId + '">';

    // Toolbar — verticaal floating rechtsboven
    html += renderDashboardToolbar(charId, tabId, editable);

    // Widget grid (intrinsic — CSS handles placement)
    if (!widgets.length) {
        html += '<div class="dashboard-empty">';
        html += '<p>Dit dashboard is leeg.</p>';
        if (editable) {
            html += '<button class="btn btn-primary" data-action="dashboard-toggle-edit">✎ Bewerken</button>';
        }
        html += '</div>';
    } else {
        for (var i = 0; i < widgets.length; i++) {
            var inst = widgets[i];
            var def = WIDGET_REGISTRY[inst.type];
            var dims = resolveWidgetDims(def, inst);
            var ctx = {
                charId: charId, config: config, state: state,
                editable: editable, instance: inst
            };
            html += '<div class="widget widget-' + inst.type + (inst.starred ? ' is-starred' : '') + '"';
            html += ' data-wid="' + inst.wid + '"';
            html += ' data-type="' + inst.type + '"';
            html += ' style="--w:' + dims.w + ';--h:' + dims.h + '">';
            html += buildWidgetContent(def, inst, ctx, editable);
            html += '</div>';
        }
    }

    html += '</div>'; // .dashboard
    return html;
}

// Toolbar (icon-only buttons rechtsboven) — unchanged from the old renderer
// except active-state cleanup and no breakpoint preview anymore (auto-fit
// handles responsive width). FS-popover is kept (it sets html[data-font-size]).
function renderDashboardToolbar(charId, tabId, editable) {
    var html = '<div class="dashboard-toolbar dash-toolbar-vertical">';

    // Font-size popover (S/M/L)
    var fsCurrent = (typeof getFontSize === 'function') ? getFontSize() : 'medium';
    var fsIcons = { small: 'A⁻', medium: 'A', large: 'A⁺' };
    var fsLabels = { small: 'Klein', medium: 'Middel', large: 'Groot' };
    html += '<div class="dash-fs-popover-wrap">';
    html += '<button class="dash-tool-btn dash-fs-current" data-action="dashboard-toggle-fs-menu" title="Lettergrootte: ' + fsLabels[fsCurrent] + '">' + fsIcons[fsCurrent] + '</button>';
    html += '<div class="dash-fs-popover" hidden>';
    var fsList = ['small', 'medium', 'large'];
    for (var fi = 0; fi < fsList.length; fi++) {
        var fk = fsList[fi];
        var fActive = fk === fsCurrent;
        html += '<button class="dash-bp-btn' + (fActive ? ' active' : '') + '" data-action="dashboard-set-fs" data-fs="' + fk + '">';
        html += '<span class="dash-bp-icon">' + fsIcons[fk] + '</span><span class="dash-bp-label">' + fsLabels[fk] + '</span>';
        html += '</button>';
    }
    html += '</div></div>';

    // Quick-actions
    html += '<button class="dash-tool-btn" data-action="toggle-notes-panel" title="Notities">📝</button>';
    html += '<button class="dash-tool-btn" data-action="toggle-dice-panel" title="Dice roller">🎲</button>';
    html += '<a class="dash-tool-btn" href="' + (typeof WIDGET_EDITOR_URL !== 'undefined' ? WIDGET_EDITOR_URL : 'http://localhost:8766/') + '?back=' + encodeURIComponent(window.location.href) + '" target="_blank" rel="noopener" title="Open Widget Editor">⚒</a>';

    if (editable) {
        html += '<button class="dash-tool-btn' + (dashboardEditMode ? ' active' : '') + '" data-action="dashboard-toggle-edit" title="Edit dashboard">' + (dashboardEditMode ? '✓' : '✎') + '</button>';
        if (dashboardEditMode) {
            html += '<button class="dash-tool-btn" data-action="dashboard-save-as-template" title="Save as template">⎘</button>';
        }
    }
    html += '</div>';
    return html;
}

// Resolve W×H for a widget instance, falling back to def.defaultSize then [4,3].
function resolveWidgetDims(def, inst) {
    var w = parseInt(inst && inst.w, 10);
    var h = parseInt(inst && inst.h, 10);
    if (!w && def && def.defaultSize) w = def.defaultSize[0];
    if (!h && def && def.defaultSize) h = def.defaultSize[1];
    if (!w) w = 4;
    if (!h) h = 3;
    return { w: w, h: h };
}

// Build inner HTML for one widget — header (icon, title, actions) + body.
function buildWidgetContent(def, inst, ctx, editable) {
    var dims = resolveWidgetDims(def, inst);
    var html = '<div class="widget-header">';
    html += '<span class="widget-icon">' + (def && def.icon || '◇') + '</span>';
    html += '<span class="widget-title">' + escapeHtml(def && def.label || inst.type) + '</span>';

    // Resize controls only in edit mode — two cycle buttons for width and height.
    if (editable && dashboardEditMode) {
        html += '<button class="widget-action widget-resize widget-resize-w" data-action="widget-cycle-w" data-wid="' + inst.wid + '" title="Width: click to increase (wraps at max)" aria-label="Cycle width">↔ ' + dims.w + '</button>';
        html += '<button class="widget-action widget-resize widget-resize-h" data-action="widget-cycle-h" data-wid="' + inst.wid + '" title="Height: click to increase (wraps at max)" aria-label="Cycle height">↕ ' + dims.h + '</button>';
        html += '<button class="widget-action widget-star' + (inst.starred ? ' active' : '') + '" data-action="widget-toggle-star" data-wid="' + inst.wid + '" title="Pin to top">★</button>';
        html += '<button class="widget-action widget-remove" data-action="widget-remove" data-wid="' + inst.wid + '" title="Remove">×</button>';
    }
    html += '</div>';

    html += '<div class="widget-body">';
    if (def && typeof def.render === 'function') {
        try {
            html += def.render(ctx);
        } catch (e) {
            html += '<div class="widget-error">Render error: ' + escapeHtml(String(e && e.message || e)) + '</div>';
        }
    } else {
        html += '<div class="widget-error">Unknown widget type: ' + escapeHtml(inst.type) + '</div>';
    }
    html += '</div>';

    return html;
}

// Re-render a single widget body (without rebuilding the whole dashboard).
// Called after a state mutation that already wrote to storage.
function dashboardRefreshWidget(wid) {
    if (!dashRenderCtx) return false;
    var el = document.querySelector('.widget[data-wid="' + wid + '"]');
    if (!el) return false;
    var type = el.dataset.type;
    var def = WIDGET_REGISTRY[type];
    if (!def) return false;
    var widgets = loadTabWidgets(dashRenderCtx.charId, dashRenderCtx.tabId) || [];
    var inst = null;
    for (var i = 0; i < widgets.length; i++) if (widgets[i].wid === wid) { inst = widgets[i]; break; }
    if (!inst) return false;
    el.innerHTML = buildWidgetContent(def, inst, {
        charId: dashRenderCtx.charId, config: dashRenderCtx.config, state: dashRenderCtx.state,
        editable: dashRenderCtx.editable, instance: inst
    }, dashRenderCtx.editable);
    el.dataset.size = inst.size || 'M';
    return true;
}

// Cycle width or height of a widget — wraps from max back to min.
// Step uses def.minSize and def.maxSize as bounds (with sane fallbacks).
function cycleWidgetDim(charId, tabId, wid, dimKey) {
    var widgets = loadTabWidgets(charId, tabId) || dashboardDefaultWidgetsForTab(tabId);
    var changed = false;
    for (var i = 0; i < widgets.length; i++) {
        if (widgets[i].wid !== wid) continue;
        var def = WIDGET_REGISTRY[widgets[i].type] || {};
        var minSize = def.minSize || [2, 2];
        var maxSize = def.maxSize || [12, 8];
        var idx = (dimKey === 'w') ? 0 : 1;
        var current = parseInt(widgets[i][dimKey], 10);
        if (!current) current = def.defaultSize ? def.defaultSize[idx] : (idx ? 3 : 4);
        var next = current + 1;
        if (next > maxSize[idx]) next = minSize[idx];
        widgets[i][dimKey] = next;
        changed = true;
        break;
    }
    if (changed) saveTabWidgets(charId, tabId, widgets);
    return changed;
}
// Back-compat alias for any old callers
function cycleWidgetSize(charId, tabId, wid) {
    return cycleWidgetDim(charId, tabId, wid, 'w');
}

// Toggle star on a widget (pinned widgets keep their leading position when
// the user re-orders or resets).
function toggleWidgetStar(charId, tabId, wid) {
    var widgets = loadTabWidgets(charId, tabId) || dashboardDefaultWidgetsForTab(tabId);
    for (var i = 0; i < widgets.length; i++) {
        if (widgets[i].wid === wid) {
            widgets[i].starred = !widgets[i].starred;
            saveTabWidgets(charId, tabId, widgets);
            return true;
        }
    }
    return false;
}

// Remove a widget from the tab.
function removeWidget(charId, tabId, wid) {
    var widgets = loadTabWidgets(charId, tabId) || dashboardDefaultWidgetsForTab(tabId);
    for (var i = 0; i < widgets.length; i++) {
        if (widgets[i].wid === wid) {
            widgets.splice(i, 1);
            saveTabWidgets(charId, tabId, widgets);
            return true;
        }
    }
    return false;
}

// Add a widget at the end of the tab using its default W×H.
function addWidget(charId, tabId, type) {
    var widgets = loadTabWidgets(charId, tabId) || dashboardDefaultWidgetsForTab(tabId) || [];
    var def = WIDGET_REGISTRY[type] || {};
    var dims = def.defaultSize || [4, 3];
    widgets.push({
        wid: generateWidgetId(),
        type: type,
        w: dims[0],
        h: dims[1],
        starred: false,
        config: {}
    });
    saveTabWidgets(charId, tabId, widgets);
    return true;
}

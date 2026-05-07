// D&D Within — Dashboard Renderer
// Renders a tab as a dashboard: grid container + positioned widget cards.
// View-mode here; edit-mode lives in dashboard-edit.js.
// Requires: dashboard-data.js, widgets.js, core.js

// Toggle state: which breakpoint is being PREVIEWED. Defaults to actual viewport breakpoint.
var dashboardPreviewBP = null;

function dashboardActiveBP() { return dashboardPreviewBP || dashboardCurrentBreakpoint(); }

// Edit mode global flag (set by dashboard-edit.js).
var dashboardEditMode = false;
var dashboardGridVisible = false;

function isDashboardEditMode() { return !!dashboardEditMode; }

// Render a full dashboard tab (toolbar + grid + widgets).
function renderDashboardTab(charId, tabId) {
    var config = loadCharConfig(charId);
    var state = loadCharState(charId);
    var editable = canEdit(charId);
    var bp = dashboardActiveBP();
    var cols = DASHBOARD_BREAKPOINTS[bp].cols;

    // In edit mode, render from the in-memory working layout (mutations from drag/resize
    // are kept here until the user saves). Outside edit mode, load fresh from storage.
    var widgets;
    if (dashboardEditMode && dashboardEditingCharId === charId && dashboardEditingTabId === tabId && Array.isArray(dashboardWorkingLayout)) {
        widgets = dashboardWorkingLayout;
    } else {
        widgets = getActiveLayoutForBreakpoint(charId, tabId, bp) || [];
    }
    ensureWidgetIds(widgets);

    var hasSavedForBP = (function() {
        var l = loadTabLayout(charId, tabId) || dashboardDefaultLayoutForTab(tabId);
        return !!(l && Array.isArray(l[bp]) && l[bp].length);
    })();

    var html = '<div class="dashboard ' + (dashboardEditMode ? 'is-editing ' : '') + (dashboardGridVisible ? 'show-grid ' : '') + 'bp-' + bp + '" data-tab-id="' + tabId + '" data-cols="' + cols + '" data-bp="' + bp + '">';

    // Toolbar
    html += '<div class="dashboard-toolbar">';
    html += '<div class="dash-toolbar-group dash-bp-toggle" role="tablist" aria-label="Layout breakpoint">';
    var bps = ['mobile', 'tablet', 'desktop'];
    for (var i = 0; i < bps.length; i++) {
        var bId = bps[i];
        var isActive = bId === bp;
        var hasLayout = (function(k) {
            var l = loadTabLayout(charId, tabId) || dashboardDefaultLayoutForTab(tabId);
            return !!(l && Array.isArray(l[k]) && l[k].length);
        })(bId);
        var icon = bId === 'mobile' ? '📱' : bId === 'tablet' ? '🭿' : '🖥';
        html += '<button class="dash-bp-btn' + (isActive ? ' active' : '') + (hasLayout ? ' has-layout' : '') + '" data-action="dashboard-set-bp" data-bp="' + bId + '" title="' + DASHBOARD_BREAKPOINTS[bId].label + (hasLayout ? ' — saved layout' : ' — auto-reflow') + '">';
        html += '<span class="dash-bp-icon">' + icon + '</span><span class="dash-bp-label">' + DASHBOARD_BREAKPOINTS[bId].label + '</span>';
        html += '</button>';
    }
    html += '</div>';

    if (editable) {
        html += '<div class="dash-toolbar-group dash-toolbar-actions">';
        html += '<button class="dash-tool-btn' + (dashboardGridVisible ? ' active' : '') + '" data-action="dashboard-toggle-grid" title="Toggle grid lines">⊞ Grid</button>';
        html += '<button class="dash-tool-btn' + (dashboardEditMode ? ' active' : '') + '" data-action="dashboard-toggle-edit" title="Edit dashboard">' + (dashboardEditMode ? '✓ Done' : '✎ Edit') + '</button>';
        if (dashboardEditMode) {
            html += '<button class="dash-tool-btn" data-action="dashboard-compact" title="Compact: pull widgets up to remove gaps">⇧ Compact</button>';
            html += '<button class="dash-tool-btn" data-action="dashboard-save-bp" title="Save current layout for ' + DASHBOARD_BREAKPOINTS[bp].label + '">💾 Save ' + DASHBOARD_BREAKPOINTS[bp].label + '</button>';
            if (hasSavedForBP && bp !== 'desktop') {
                html += '<button class="dash-tool-btn dash-tool-danger" data-action="dashboard-clear-bp" title="Clear saved layout for this breakpoint (revert to auto-reflow)">⌫ Clear ' + DASHBOARD_BREAKPOINTS[bp].label + '</button>';
            }
            html += '<button class="dash-tool-btn" data-action="dashboard-save-as-template" title="Save as template">⎘ Save as template</button>';
        }
        html += '</div>';
    }
    html += '</div>';

    // Grid container
    var rowH = 80; // px per row
    html += '<div class="dashboard-grid" style="--dash-cols:' + cols + ';--dash-row-h:' + rowH + 'px;" data-cols="' + cols + '">';

    if (!widgets.length) {
        html += '<div class="dashboard-empty">';
        html += '<p>This dashboard is empty.</p>';
        if (editable) html += '<button class="btn btn-primary" data-action="dashboard-toggle-edit">✎ Edit dashboard</button>';
        html += '</div>';
    }

    for (var w = 0; w < widgets.length; w++) {
        html += renderWidgetCard(charId, config, state, editable, widgets[w], bp);
    }

    // Edit-mode sidebar palette is rendered by dashboard-edit.js (after this).
    html += '</div>'; // .dashboard-grid

    if (dashboardEditMode && editable && typeof renderDashboardEditSidebar === 'function') {
        html += renderDashboardEditSidebar(charId, tabId);
    }

    html += '</div>'; // .dashboard
    return html;
}

function renderWidgetCard(charId, config, state, editable, instance, bp) {
    var def = WIDGET_REGISTRY[instance.type];
    if (!def) {
        return '<div class="widget widget-unknown" style="grid-column:span ' + (instance.w || 2) + ';grid-row:span ' + (instance.h || 2) + ';" data-wid="' + (instance.wid || '') + '">Unknown widget: ' + escapeHtml(instance.type) + '</div>';
    }

    var ctx = {
        charId: charId, config: config, state: state, editable: editable,
        instance: instance, breakpoint: bp
    };

    // Grid placement: span columns/rows. We use grid-column/row-start so explicit (x,y).
    // Column/row are 1-based in CSS Grid.
    var gcStart = (instance.x || 0) + 1;
    var gcEnd = gcStart + (instance.w || 1);
    var grStart = (instance.y || 0) + 1;
    var grEnd = grStart + (instance.h || 1);
    var styleParts = [
        'grid-column:' + gcStart + ' / ' + gcEnd,
        'grid-row:' + grStart + ' / ' + grEnd
    ];

    var classes = ['widget', 'widget-' + instance.type];
    if (instance.starred) classes.push('is-starred');
    if (dashboardEditMode) classes.push('is-editing');

    var html = '<div class="' + classes.join(' ') + '" style="' + styleParts.join(';') + '" data-wid="' + instance.wid + '" data-type="' + instance.type + '" data-x="' + (instance.x || 0) + '" data-y="' + (instance.y || 0) + '" data-w="' + (instance.w || 1) + '" data-h="' + (instance.h || 1) + '">';

    html += '<div class="widget-header">';
    html += '<span class="widget-icon">' + (def.icon || '◇') + '</span>';
    html += '<span class="widget-title">' + escapeHtml(def.label) + '</span>';
    if (editable && dashboardEditMode) {
        html += '<button class="widget-star' + (instance.starred ? ' active' : '') + '" data-action="widget-toggle-star" data-wid="' + instance.wid + '" title="Star (stays at top on reflow)">★</button>';
        html += '<button class="widget-remove" data-action="widget-remove" data-wid="' + instance.wid + '" title="Remove">×</button>';
    }
    html += '</div>';

    try {
        html += def.render(ctx);
    } catch (e) {
        html += '<div class="widget-body widget-error">Render error: ' + escapeHtml(String(e && e.message || e)) + '</div>';
    }

    if (editable && dashboardEditMode) {
        html += '<div class="widget-resize-handle" data-resize="se" data-wid="' + instance.wid + '"></div>';
    }

    html += '</div>';
    return html;
}

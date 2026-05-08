// D&D Within — Dashboard Renderer (Gridstack-based)
// Renders a tab as a dashboard with Gridstack engine for drag/resize/pack.
// Edit-mode toolbar + working-layout lifecycle live in dashboard-edit.js.
// Requires: dashboard-data.js, widgets.js, core.js, gridstack-all.js (CDN)

// Toggle state: which breakpoint is being PREVIEWED. Defaults to actual viewport breakpoint.
var dashboardPreviewBP = null;

function dashboardActiveBP() { return dashboardPreviewBP || dashboardCurrentBreakpoint(); }

// Edit mode global flag (set by dashboard-edit.js).
var dashboardEditMode = false;
var dashboardGridVisible = false;

function isDashboardEditMode() { return !!dashboardEditMode; }

// Active Gridstack instance — destroyed and recreated on every dashboardPostRender.
var dashGridInstance = null;

// Context cached during init so 'added' events (palette drag) can re-render with full data.
var dashRenderCtx = null;

// Render the dashboard tab shell. Gridstack is initialised in dashboardPostRender below.
function renderDashboardTab(charId, tabId) {
    var bp = dashboardActiveBP();
    var cols = DASHBOARD_BREAKPOINTS[bp].cols;
    var editable = canEdit(charId);

    // One-shot normalization on first render (idempotent for already-tight layouts).
    if (typeof ensureLayoutNormalized === 'function') {
        try { ensureLayoutNormalized(charId, tabId); } catch (e) {}
    }

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

    // Empty grid container — Gridstack populates in dashboardPostRender.
    html += '<div class="dash-stage">';
    html += '<div class="grid-stack" data-cols="' + cols + '"></div>';
    html += '<div class="dashboard-empty" data-empty-hint hidden><p>This dashboard is empty.</p>';
    if (editable) html += '<button class="btn btn-primary" data-action="dashboard-toggle-edit">✎ Edit dashboard</button>';
    html += '</div>';
    html += '</div>';

    // Edit-mode sidebar palette
    if (dashboardEditMode && editable && typeof renderDashboardEditSidebar === 'function') {
        html += renderDashboardEditSidebar(charId, tabId);
    }

    html += '</div>'; // .dashboard
    return html;
}

// Build the inner HTML for one widget (header + body via def.render(ctx)).
function buildWidgetContent(def, inst, ctx, editable) {
    var html = '<div class="widget-header">';
    html += '<span class="widget-icon">' + (def.icon || '◇') + '</span>';
    html += '<span class="widget-title">' + escapeHtml(def.label) + '</span>';
    if (editable && dashboardEditMode) {
        html += '<button class="widget-star' + (inst.starred ? ' active' : '') + '" data-action="widget-toggle-star" data-wid="' + inst.wid + '" title="Star (stays at top on reflow)">★</button>';
        html += '<button class="widget-remove" data-action="widget-remove" data-wid="' + inst.wid + '" title="Remove">×</button>';
    }
    html += '</div>';

    try {
        html += def.render(ctx);
    } catch (e) {
        html += '<div class="widget-body widget-error">Render error: ' + escapeHtml(String(e && e.message || e)) + '</div>';
    }
    return html;
}

// Initialise (or re-initialise) Gridstack for the currently rendered dashboard.
// Called from dashboardPostRender after every renderApp().
function dashboardInitGridstack() {
    var dashEl = document.querySelector('.dashboard');
    if (!dashEl) {
        // No dashboard on screen — clean up any leftover instance.
        if (dashGridInstance) {
            try { dashGridInstance.destroy(false); } catch (e) {}
            dashGridInstance = null;
        }
        return;
    }
    var gridEl = dashEl.querySelector('.grid-stack');
    if (!gridEl) return;

    // Gather context.
    var charPage = document.querySelector('.character-page');
    var charId = charPage && charPage.dataset.charId;
    var tabId = dashEl.dataset.tabId;
    var bp = dashboardActiveBP();
    var cols = DASHBOARD_BREAKPOINTS[bp].cols;
    if (!charId || !tabId) return;

    // Working layout vs persisted.
    var widgets;
    if (dashboardEditMode && dashboardEditingCharId === charId && dashboardEditingTabId === tabId && Array.isArray(dashboardWorkingLayout)) {
        widgets = dashboardWorkingLayout;
    } else {
        widgets = getActiveLayoutForBreakpoint(charId, tabId, bp) || [];
    }
    ensureWidgetIds(widgets);

    var config = loadCharConfig(charId);
    var state = loadCharState(charId);
    var editable = canEdit(charId);

    dashRenderCtx = { charId: charId, tabId: tabId, bp: bp, config: config, state: state, editable: editable };

    // Tear down any previous instance + clean DOM.
    if (dashGridInstance) {
        try { dashGridInstance.destroy(false); } catch (e) {}
        dashGridInstance = null;
    }
    gridEl.innerHTML = '';
    gridEl.className = 'grid-stack';
    Array.from(gridEl.attributes).forEach(function(a) {
        if (a.name.indexOf('gs-') === 0) gridEl.removeAttribute(a.name);
    });

    var emptyHint = dashEl.querySelector('[data-empty-hint]');
    if (emptyHint) emptyHint.hidden = !!widgets.length;

    if (typeof GridStack === 'undefined') {
        gridEl.innerHTML = '<p class="block-note">Gridstack failed to load. Reload page.</p>';
        return;
    }

    dashGridInstance = GridStack.init({
        column: cols,
        cellHeight: 80,
        margin: 6,
        float: false,
        animate: true,
        staticGrid: !dashboardEditMode,
        handle: '.widget-header',
        resizable: { handles: 'se, sw, e, s, w' },
        disableOneColumnMode: true,
        acceptWidgets: dashboardEditMode,
    }, gridEl);

    // Add widgets.
    widgets.forEach(function(inst) {
        var def = WIDGET_REGISTRY[inst.type];
        var ctx = { charId: charId, config: config, state: state, editable: editable, instance: inst, breakpoint: bp };

        var content;
        var minW = 1, minH = 1, maxW = cols, maxH = 99;
        if (def) {
            content = buildWidgetContent(def, inst, ctx, editable);
            if (def.minSize) { minW = def.minSize[0]; minH = def.minSize[1]; }
            if (def.maxSize) { maxW = def.maxSize[0]; maxH = def.maxSize[1]; }
        } else {
            content = '<div class="widget-header"><span class="widget-title">Unknown widget</span></div>' +
                      '<div class="widget-body widget-error">Unknown type: ' + escapeHtml(inst.type) + '</div>';
        }

        var node = {
            id: inst.wid,
            x: inst.x || 0, y: inst.y || 0,
            w: Math.min(inst.w || 1, cols),
            h: inst.h || 1,
            minW: minW, minH: minH,
            maxW: Math.min(maxW, cols), maxH: maxH,
            content: content,
        };
        var el = dashGridInstance.addWidget(node);
        el.dataset.wid = inst.wid;
        el.dataset.type = inst.type;
        el.classList.add('widget', 'widget-' + inst.type);
        if (inst.starred) el.classList.add('is-starred');
        if (dashboardEditMode) el.classList.add('is-editing');
    });

    // In edit mode: sync grid changes back to working layout, and handle palette drops.
    if (dashboardEditMode) {
        dashGridInstance.on('change', function(_event, items) {
            if (!Array.isArray(dashboardWorkingLayout)) return;
            items.forEach(function(node) {
                for (var i = 0; i < dashboardWorkingLayout.length; i++) {
                    var w = dashboardWorkingLayout[i];
                    if (w.wid === node.id) {
                        w.x = node.x; w.y = node.y; w.w = node.w; w.h = node.h;
                        break;
                    }
                }
            });
        });

        dashGridInstance.on('added', function(_event, items) {
            // Items added by Gridstack drag-in from palette won't have id matching working layout.
            // Detect new items, hydrate working layout, then re-render so def.render(ctx) is applied.
            var hadNew = false;
            items.forEach(function(node) {
                if (node.id && dashboardWidgetByWid(node.id)) return; // already tracked
                var elNode = node.el;
                if (!elNode) return;
                var type = elNode.dataset.paletteType || elNode.getAttribute('data-palette-type');
                if (!type) return;
                var wid = generateWidgetId();
                if (!Array.isArray(dashboardWorkingLayout)) dashboardWorkingLayout = [];
                dashboardWorkingLayout.push({
                    wid: wid, type: type,
                    x: node.x, y: node.y, w: node.w, h: node.h,
                    starred: false, config: {}
                });
                hadNew = true;
            });
            if (hadNew && typeof renderApp === 'function') setTimeout(renderApp, 0);
        });
    }

    // Setup external drag-in for palette items in edit mode.
    if (dashboardEditMode && typeof GridStack.setupDragIn === 'function') {
        GridStack.setupDragIn('.dash-palette-item', { appendTo: 'body', helper: 'clone' });
    }
}

// Re-render a single widget body (without rebuilding the whole grid).
// Used by view-mode text/image edits that already wrote to storage and want
// the visible body to reflect new content (e.g. uploaded image).
function dashboardRefreshWidget(wid) {
    if (!dashGridInstance || !dashRenderCtx) return false;
    var el = document.querySelector('.grid-stack-item[data-wid="' + wid + '"]');
    if (!el) return false;
    var type = el.dataset.type;
    var def = WIDGET_REGISTRY[type];
    if (!def) return false;
    var widgets = getActiveLayoutForBreakpoint(dashRenderCtx.charId, dashRenderCtx.tabId, dashRenderCtx.bp) || [];
    var inst = null;
    for (var i = 0; i < widgets.length; i++) if (widgets[i].wid === wid) { inst = widgets[i]; break; }
    if (!inst) return false;
    var content = el.querySelector('.grid-stack-item-content');
    if (!content) return false;
    content.innerHTML = buildWidgetContent(def, inst, {
        charId: dashRenderCtx.charId, config: dashRenderCtx.config, state: dashRenderCtx.state,
        editable: dashRenderCtx.editable, instance: inst, breakpoint: dashRenderCtx.bp
    }, dashRenderCtx.editable);
    return true;
}

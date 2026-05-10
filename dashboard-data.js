// D&D Within — Dashboard Data Layer
// Per-character storage of tabs configuration + per-tab dashboard layouts.
// Layout = {primary, desktop, tablet?, mobile?} where each is array of widget instances.
// Requires: core.js, sync.js

// Default tab definitions. system=true means it cannot be permanently deleted (only hidden).
var DASHBOARD_DEFAULT_TABS = [
    { id: 'overview',  label: 'Overview',  icon: '✣', system: true,  legacy: true  },
    { id: 'stats',     label: 'Stats',     icon: '☆', system: true,  legacy: true  },
    { id: 'social',    label: 'Social',    icon: '♠', system: true,  legacy: false },
    { id: 'exploring', label: 'Exploring', icon: '⚑', system: true,  legacy: false },
    { id: 'combat',    label: 'Combat',    icon: '⚔', system: true,  legacy: true  },
    { id: 'spells',    label: 'Spells',    icon: '✨', system: true,  legacy: true  },
    { id: 'story',     label: 'Story',     icon: '✎', system: true,  legacy: true  },
    { id: 'family',    label: 'Family',    icon: '⚶', system: true,  legacy: false },
    { id: 'inventory', label: 'Inventory', icon: '⛂', system: true,  legacy: true  }
];

// URL of the standalone Widget Editor — externe app waar custom widgets
// gebouwd worden uit blocks. Default: live Cloudflare Pages deploy.
// Override met window.WIDGET_EDITOR_URL voor lokaal-development (bv 'http://localhost:8766/').
var WIDGET_EDITOR_URL = (typeof window !== 'undefined' && window.WIDGET_EDITOR_URL) || 'https://dnd-widget-editor.pages.dev/';

// Breakpoint definitions. Width thresholds in CSS pixels.
// cellMode 'fixed-px' = cellHeight uit dashboardCellHeightPx() (gekoppeld aan font-size).
//          'auto-square' = GridStack 'auto' (cell square, schaalt met stage-width).
var DASHBOARD_BREAKPOINTS = {
    desktop: { cols: 12, minWidth: 1025, label: 'Desktop', cellMode: 'fixed-px' },
    tablet:  { cols: 8,  minWidth: 641,  label: 'Tablet',  cellMode: 'fixed-px' },
    mobile:  { cols: 6,  minWidth: 0,    label: 'Mobile',  cellMode: 'fixed-px' }
};

function dashboardCurrentBreakpoint() {
    var w = window.innerWidth;
    if (w >= DASHBOARD_BREAKPOINTS.desktop.minWidth) return 'desktop';
    if (w >= DASHBOARD_BREAKPOINTS.tablet.minWidth)  return 'tablet';
    return 'mobile';
}

// Dashboard cell-size (px) — cells zijn VIERKANT (cellW = cellH). Gekoppeld
// aan body font-size, maar groter dan strict "1 regel" zodat widget-content
// (header + body + controls) zonder clipping past en de grid leesbaar blijft.
// Grid totaal-breedte = cols × cellSize, vast (geen viewport-scaling).
function dashboardCellHeightPx() {
    var fs = (typeof getFontSize === 'function') ? getFontSize() : 'medium';
    if (fs === 'small')  return 44;
    if (fs === 'large')  return 60;
    return 52; // medium
}

// Body font-size in px (informatief — voor sizing-berekeningen).
function dashboardBodyFontPx() {
    var fs = (typeof getFontSize === 'function') ? getFontSize() : 'medium';
    if (fs === 'small')  return 12;
    if (fs === 'large')  return 16;
    return 13.5;
}

// Storage key per character.
function dashboardKey(charId) { return 'dw_dashboard_' + charId; }

// Load full dashboard config: { tabs: [...], layouts: { tabId: {primary, desktop, tablet, mobile} } }
function loadDashboardConfig(charId) {
    var key = dashboardKey(charId);
    var saved = null;
    try {
        var raw = localStorage.getItem(key);
        if (raw) saved = JSON.parse(raw);
    } catch (e) { saved = null; }

    if (!saved || typeof saved !== 'object') saved = {};
    if (!Array.isArray(saved.tabs)) saved.tabs = [];
    if (!saved.layouts || typeof saved.layouts !== 'object') saved.layouts = {};

    // Merge default tabs with stored overrides (hidden state, custom labels, order).
    var stored = {};
    for (var i = 0; i < saved.tabs.length; i++) stored[saved.tabs[i].id] = saved.tabs[i];

    var merged = [];
    var seen = {};

    // First, follow stored order if it exists (otherwise default order).
    var orderSource = saved.tabs.length ? saved.tabs : DASHBOARD_DEFAULT_TABS;
    for (var j = 0; j < orderSource.length; j++) {
        var entry = orderSource[j];
        var def = dashboardFindDefaultTab(entry.id);
        if (def) {
            merged.push({
                id: def.id,
                label: entry.label || def.label,
                icon: entry.icon || def.icon,
                system: true,
                legacy: def.legacy,
                hidden: !!entry.hidden
            });
        } else if (entry.custom) {
            merged.push({
                id: entry.id,
                label: entry.label || entry.id,
                icon: entry.icon || '○',
                system: false,
                custom: true,
                hidden: !!entry.hidden
            });
        }
        seen[entry.id] = true;
    }
    // Add any default tabs that weren't in stored order yet (new defaults added later).
    for (var k = 0; k < DASHBOARD_DEFAULT_TABS.length; k++) {
        var d = DASHBOARD_DEFAULT_TABS[k];
        if (!seen[d.id]) merged.push({ id: d.id, label: d.label, icon: d.icon, system: true, legacy: d.legacy, hidden: false });
    }

    return { tabs: merged, layouts: saved.layouts };
}

function dashboardFindDefaultTab(id) {
    for (var i = 0; i < DASHBOARD_DEFAULT_TABS.length; i++) {
        if (DASHBOARD_DEFAULT_TABS[i].id === id) return DASHBOARD_DEFAULT_TABS[i];
    }
    return null;
}

function saveDashboardConfig(charId, dashConfig) {
    var key = dashboardKey(charId);
    // Strip transient fields before persisting.
    var slim = {
        tabs: dashConfig.tabs.map(function(t) {
            var o = { id: t.id, label: t.label, icon: t.icon, hidden: !!t.hidden };
            if (t.custom) o.custom = true;
            return o;
        }),
        layouts: dashConfig.layouts || {}
    };
    localStorage.setItem(key, JSON.stringify(slim));
    if (typeof syncUpload === 'function') syncUpload(key);
}

// Layout helpers ---------------------------------------------------------------

function loadTabLayout(charId, tabId) {
    var cfg = loadDashboardConfig(charId);
    var layout = cfg.layouts[tabId];
    if (!layout) return null;
    if (typeof layout !== 'object') return null;
    if (!Array.isArray(layout.desktop)) layout.desktop = [];
    if (!layout.primary) layout.primary = 'desktop';
    return layout;
}

function saveTabLayout(charId, tabId, layout) {
    var cfg = loadDashboardConfig(charId);
    cfg.layouts[tabId] = layout;
    saveDashboardConfig(charId, cfg);
}

// Get the active layout for the current breakpoint, falling back to primary + auto-reflow.
// Returns a deep clone so callers can mutate freely.
function getActiveLayoutForBreakpoint(charId, tabId, bp) {
    var layout = loadTabLayout(charId, tabId) || dashboardDefaultLayoutForTab(tabId);
    if (!layout) return null;
    if (layout[bp] && Array.isArray(layout[bp]) && layout[bp].length) {
        return JSON.parse(JSON.stringify(layout[bp]));
    }
    var primary = layout.primary || 'desktop';
    var primaryWidgets = layout[primary] || [];
    return reflowLayout(primaryWidgets, DASHBOARD_BREAKPOINTS[primary].cols, DASHBOARD_BREAKPOINTS[bp].cols);
}

// Default layout per tab (used first time a tab is opened with no saved layout).
// Returns a deep clone so callers can mutate (e.g. assign widget ids) without polluting the
// shared DASHBOARD_DEFAULT_LAYOUTS template.
function dashboardDefaultLayoutForTab(tabId) {
    var defaults = DASHBOARD_DEFAULT_LAYOUTS[tabId];
    if (!defaults) return { primary: 'desktop', desktop: [], tablet: null, mobile: null };
    return {
        primary: 'desktop',
        desktop: JSON.parse(JSON.stringify(defaults)),
        tablet: null,
        mobile: null
    };
}

// Default widget instances per tab. Each: {wid, type, x, y, w, h, starred?, config?}
// wid is a stable per-instance id (generated). Coordinates assume 12-col desktop grid.
var DASHBOARD_DEFAULT_LAYOUTS = {
    overview: [
        { type: 'hp-tracker',     x: 0, y: 0, w: 4, h: 4 },
        { type: 'core-stats',     x: 4, y: 0, w: 8, h: 2 },
        { type: 'xp-tracker',     x: 4, y: 2, w: 8, h: 2 },
        { type: 'ability-scores', x: 0, y: 4, w: 12, h: 4 },
        { type: 'quote',          x: 0, y: 8, w: 12, h: 2 }
    ],
    stats: [
        { type: 'ability-scores', x: 0, y: 0, w: 12, h: 4 },
        { type: 'saving-throws',  x: 0, y: 4, w: 4, h: 4 },
        { type: 'skills',         x: 4, y: 4, w: 4, h: 5 },
        { type: 'ability-radar',  x: 8, y: 4, w: 4, h: 4 }
    ],
    combat: [
        { type: 'hp-tracker',     x: 0, y: 0, w: 4, h: 4 },
        { type: 'core-stats',     x: 4, y: 0, w: 8, h: 2 },
        { type: 'death-saves',    x: 4, y: 2, w: 4, h: 2 },
        { type: 'inspiration',    x: 8, y: 2, w: 4, h: 2 },
        { type: 'weapons',        x: 0, y: 4, w: 8, h: 4 },
        { type: 'combat-log',     x: 8, y: 4, w: 4, h: 4 }
    ],
    spells: [
        { type: 'spell-slots',     x: 0, y: 0, w: 6, h: 4 },
        { type: 'spells-prepared', x: 6, y: 0, w: 6, h: 5 },
        { type: 'metamagic',       x: 0, y: 4, w: 6, h: 4 }
    ],
    story: [
        { type: 'quote',     x: 0, y: 0, w: 12, h: 2 },
        { type: 'text',      x: 0, y: 2, w: 8, h: 6, config: { title: 'Background', body: '' } },
        { type: 'image',     x: 8, y: 2, w: 4, h: 6 }
    ],
    inventory: [
        { type: 'inventory', x: 0, y: 0, w: 8, h: 6 },
        { type: 'text',      x: 8, y: 0, w: 4, h: 6, config: { title: 'Notes', body: '' } }
    ],
    social: [
        { type: 'text',  x: 0, y: 0, w: 6, h: 4, config: { title: 'Allies', body: '' } },
        { type: 'text',  x: 6, y: 0, w: 6, h: 4, config: { title: 'Enemies', body: '' } },
        { type: 'image', x: 0, y: 4, w: 12, h: 4 }
    ],
    exploring: [
        { type: 'image', x: 0, y: 0, w: 12, h: 5 },
        { type: 'text',  x: 0, y: 5, w: 12, h: 4, config: { title: 'Locations', body: '' } }
    ],
    family: [
        { type: 'family-diagram', x: 0, y: 0, w: 12, h: 8 }
    ]
};

// Auto-reflow: pack widgets into a new column count without leaving holes.
// Sort: starred first, then originalY, then originalX.
// For each widget: scale w to min(w, newCols), keep h. Place using bottom-left-fill.
function reflowLayout(widgets, oldCols, newCols) {
    if (!widgets || !widgets.length) return [];
    var sorted = widgets.slice().sort(function(a, b) {
        var sa = a.starred ? 0 : 1, sb = b.starred ? 0 : 1;
        if (sa !== sb) return sa - sb;
        if ((a.y || 0) !== (b.y || 0)) return (a.y || 0) - (b.y || 0);
        return (a.x || 0) - (b.x || 0);
    });

    var placed = [];
    var occupancy = []; // 2D grid: occupancy[y][x] = true if filled

    function isFree(x, y, w, h) {
        for (var yy = y; yy < y + h; yy++) {
            if (!occupancy[yy]) continue;
            for (var xx = x; xx < x + w; xx++) {
                if (occupancy[yy][xx]) return false;
            }
        }
        return true;
    }
    function fill(x, y, w, h) {
        for (var yy = y; yy < y + h; yy++) {
            if (!occupancy[yy]) occupancy[yy] = [];
            for (var xx = x; xx < x + w; xx++) {
                occupancy[yy][xx] = true;
            }
        }
    }
    function findSpot(w, h) {
        var y = 0;
        while (y < 200) {
            for (var x = 0; x + w <= newCols; x++) {
                if (isFree(x, y, w, h)) return { x: x, y: y };
            }
            y++;
        }
        return { x: 0, y: y };
    }

    for (var i = 0; i < sorted.length; i++) {
        var w = sorted[i].w || 1;
        var h = sorted[i].h || 1;
        // Scale width down if exceeding new grid.
        if (w > newCols) {
            // Scale h proportionally, rounded up so content stays readable.
            var scale = w / newCols;
            h = Math.max(1, Math.ceil(h * scale));
            w = newCols;
        }
        var spot = findSpot(w, h);
        fill(spot.x, spot.y, w, h);
        placed.push(Object.assign({}, sorted[i], { x: spot.x, y: spot.y, w: w, h: h }));
    }
    return placed;
}

// Normalize a saved layout so each breakpoint has tightly-packed, non-overlapping widgets.
// Runs reflowLayout in-place per breakpoint at the SAME column count — purely a clean-up pass.
// Idempotent: a tight layout passes through unchanged.
function normalizeLayout(layout) {
    if (!layout) return layout;
    var bps = ['desktop', 'tablet', 'mobile'];
    for (var i = 0; i < bps.length; i++) {
        var bp = bps[i];
        var arr = layout[bp];
        if (!Array.isArray(arr) || !arr.length) continue;
        var cols = DASHBOARD_BREAKPOINTS[bp].cols;
        layout[bp] = reflowLayout(arr, cols, cols);
    }
    return layout;
}

// One-shot normalization: reads, normalizes, writes back if changed.
function ensureLayoutNormalized(charId, tabId) {
    var raw = loadTabLayout(charId, tabId);
    if (!raw) return; // default layout will be normalized on first save
    var before = JSON.stringify(raw);
    normalizeLayout(raw);
    var after = JSON.stringify(raw);
    if (before !== after) saveTabLayout(charId, tabId, raw);
}

// Generate a unique widget instance id.
function generateWidgetId() {
    return 'w_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

// Ensure all widgets in a layout have a wid; mutates the array.
function ensureWidgetIds(widgets) {
    if (!Array.isArray(widgets)) return widgets;
    for (var i = 0; i < widgets.length; i++) {
        if (!widgets[i].wid) widgets[i].wid = generateWidgetId();
    }
    return widgets;
}

// Templates (per user, copied to character on apply) -------------------------

function dashboardTemplatesKey() {
    var u = currentUser();
    return 'dw_dashtemplates_' + (u ? u.id : 'anon');
}

function loadDashboardTemplates() {
    try {
        var raw = localStorage.getItem(dashboardTemplatesKey());
        if (!raw) return [];
        var arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
}

function saveDashboardTemplates(arr) {
    var key = dashboardTemplatesKey();
    localStorage.setItem(key, JSON.stringify(arr || []));
    if (typeof syncUpload === 'function') syncUpload(key);
}

function saveTabAsTemplate(charId, tabId, templateName) {
    var layout = loadTabLayout(charId, tabId);
    if (!layout) return null;
    var templates = loadDashboardTemplates();
    var tpl = {
        id: 't_' + Date.now().toString(36),
        name: templateName || (tabId + ' template'),
        sourceTabId: tabId,
        layout: JSON.parse(JSON.stringify(layout)),
        created: Date.now()
    };
    templates.push(tpl);
    saveDashboardTemplates(templates);
    return tpl;
}

function applyTemplateToTab(charId, templateId, targetTabId) {
    var templates = loadDashboardTemplates();
    var tpl = null;
    for (var i = 0; i < templates.length; i++) if (templates[i].id === templateId) { tpl = templates[i]; break; }
    if (!tpl) return false;
    var clonedLayout = JSON.parse(JSON.stringify(tpl.layout));
    // Regenerate widget ids so source and target don't share refs.
    var bps = ['desktop', 'tablet', 'mobile'];
    for (var b = 0; b < bps.length; b++) {
        if (Array.isArray(clonedLayout[bps[b]])) {
            for (var w = 0; w < clonedLayout[bps[b]].length; w++) {
                clonedLayout[bps[b]][w].wid = generateWidgetId();
            }
        }
    }
    saveTabLayout(charId, targetTabId, clonedLayout);
    return true;
}

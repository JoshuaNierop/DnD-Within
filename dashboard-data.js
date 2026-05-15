// D&D Within — Dashboard Data Layer (simplified for intrinsic-grid model)
//
// Storage shape per character (localStorage key: dw_dashboard_<charId>):
//   {
//     tabs:    [ {id, label, icon, hidden, custom?}, ... ],
//     widgets: { tabId: [ {wid, type, size, starred?, config?}, ... ] }
//   }
//
// "size" is one of 'S' | 'M' | 'L' | 'XL' (= 1, 2, 3, 4 column-spans).
// Order in the array = display order. No per-breakpoint variants — the CSS
// auto-fit grid handles responsive packing automatically.
//
// Requires: core.js, sync.js

// ====================================================================
// Tab catalog
// ====================================================================
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

// External Widget Editor URL — overrideable via window.WIDGET_EDITOR_URL.
var WIDGET_EDITOR_URL = (typeof window !== 'undefined' && window.WIDGET_EDITOR_URL) || 'https://dnd-widget-editor.pages.dev/';

// Font-size scaling. Tokens consumed in dashboard.css via html[data-font-size].
function dashboardBodyFontPx() {
    var fs = (typeof getFontSize === 'function') ? getFontSize() : 'medium';
    if (fs === 'small') return 12;
    if (fs === 'large') return 16;
    return 13.5;
}

// Backwards-compat shim — widget-demo.js still references this.
// The new system has no fixed cell size; we return a representative value
// for the demo preview only.
function dashboardCellHeightPx() {
    var fs = (typeof getFontSize === 'function') ? getFontSize() : 'medium';
    if (fs === 'small') return 44;
    if (fs === 'large') return 60;
    return 52;
}

// Map a legacy `w` (1-12 grid units) to a discrete size for migration.
function _widthToSize(w) {
    var n = parseInt(w, 10) || 1;
    if (n <= 3) return 'S';
    if (n <= 6) return 'M';
    if (n <= 9) return 'L';
    return 'XL';
}

// ====================================================================
// Storage
// ====================================================================
function dashboardKey(charId) { return 'dw_dashboard_' + charId; }

function loadDashboardConfig(charId) {
    var key = dashboardKey(charId);
    var saved = null;
    try {
        var raw = localStorage.getItem(key);
        if (raw) saved = JSON.parse(raw);
    } catch (e) { saved = null; }

    if (!saved || typeof saved !== 'object') saved = {};
    if (!Array.isArray(saved.tabs))   saved.tabs   = [];
    if (!saved.widgets || typeof saved.widgets !== 'object') saved.widgets = {};

    // Legacy migration: old shape had `layouts: { tabId: {desktop:[...], tablet:[...], mobile:[...]} }`
    // with x/y/w/h per widget. We pick the desktop layout (richest), sort by y/x, map w → size,
    // and write back. Triggers ONCE per character.
    if (saved.layouts && typeof saved.layouts === 'object' && !Object.keys(saved.widgets).length) {
        var migrated = {};
        for (var tabId in saved.layouts) {
            if (!Object.prototype.hasOwnProperty.call(saved.layouts, tabId)) continue;
            var layout = saved.layouts[tabId];
            var source = (layout && Array.isArray(layout.desktop) && layout.desktop.length) ? layout.desktop :
                         (layout && Array.isArray(layout.tablet)) ? layout.tablet :
                         (layout && Array.isArray(layout.mobile)) ? layout.mobile : [];
            var sorted = source.slice().sort(function(a, b) {
                if ((a.y || 0) !== (b.y || 0)) return (a.y || 0) - (b.y || 0);
                return (a.x || 0) - (b.x || 0);
            });
            migrated[tabId] = sorted.map(function(w) {
                return {
                    wid: w.wid || generateWidgetId(),
                    type: w.type,
                    size: _widthToSize(w.w),
                    starred: !!w.starred,
                    config: w.config || {}
                };
            });
        }
        saved.widgets = migrated;
        delete saved.layouts;
        // Persist migration result so we don't redo this every load.
        try { localStorage.setItem(key, JSON.stringify({ tabs: saved.tabs, widgets: saved.widgets })); } catch (e) {}
    }

    // Merge stored tab overrides with defaults
    var stored = {};
    for (var i = 0; i < saved.tabs.length; i++) stored[saved.tabs[i].id] = saved.tabs[i];

    var merged = [];
    var seen = {};
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
    for (var k = 0; k < DASHBOARD_DEFAULT_TABS.length; k++) {
        var d = DASHBOARD_DEFAULT_TABS[k];
        if (!seen[d.id]) merged.push({ id: d.id, label: d.label, icon: d.icon, system: true, legacy: d.legacy, hidden: false });
    }

    return { tabs: merged, widgets: saved.widgets };
}

function dashboardFindDefaultTab(id) {
    for (var i = 0; i < DASHBOARD_DEFAULT_TABS.length; i++) {
        if (DASHBOARD_DEFAULT_TABS[i].id === id) return DASHBOARD_DEFAULT_TABS[i];
    }
    return null;
}

function saveDashboardConfig(charId, dashConfig) {
    var key = dashboardKey(charId);
    var slim = {
        tabs: dashConfig.tabs.map(function(t) {
            var o = { id: t.id, label: t.label, icon: t.icon, hidden: !!t.hidden };
            if (t.custom) o.custom = true;
            return o;
        }),
        widgets: dashConfig.widgets || {}
    };
    localStorage.setItem(key, JSON.stringify(slim));
    if (typeof syncUpload === 'function') syncUpload(key);
}

// ====================================================================
// Per-tab widget arrays
// ====================================================================
function loadTabWidgets(charId, tabId) {
    var cfg = loadDashboardConfig(charId);
    var arr = cfg.widgets[tabId];
    if (Array.isArray(arr)) return JSON.parse(JSON.stringify(arr));
    return null;
}

function saveTabWidgets(charId, tabId, widgets) {
    var cfg = loadDashboardConfig(charId);
    cfg.widgets[tabId] = widgets.map(function(w) {
        return {
            wid: w.wid || generateWidgetId(),
            type: w.type,
            size: w.size || 'M',
            starred: !!w.starred,
            config: w.config || {}
        };
    });
    saveDashboardConfig(charId, cfg);
}

// Default per-tab widget layouts (flat array, size-keyed). These are returned
// as a deep clone so callers can mutate freely.
function dashboardDefaultWidgetsForTab(tabId) {
    var src = DASHBOARD_DEFAULT_WIDGETS[tabId];
    if (!src) return [];
    return JSON.parse(JSON.stringify(src));
}

// New flat defaults — size-keyed, no x/y/w/h.
// Widgets are rendered in array order; the auto-fit grid packs them.
var DASHBOARD_DEFAULT_WIDGETS = {
    overview: [
        { type: 'hp-tracker',     size: 'M' },
        { type: 'core-stats',     size: 'L' },
        { type: 'xp-tracker',     size: 'M' },
        { type: 'ability-scores', size: 'XL' },
        { type: 'quote',          size: 'XL' }
    ],
    stats: [
        { type: 'ability-scores', size: 'XL' },
        { type: 'saving-throws',  size: 'M' },
        { type: 'skills',         size: 'M' },
        { type: 'ability-radar',  size: 'M' }
    ],
    combat: [
        { type: 'hp-tracker',     size: 'M' },
        { type: 'core-stats',     size: 'L' },
        { type: 'death-saves',    size: 'S' },
        { type: 'inspiration',    size: 'S' },
        { type: 'weapons',        size: 'L' },
        { type: 'combat-log',     size: 'M' }
    ],
    spells: [
        { type: 'spell-slots',     size: 'M' },
        { type: 'spells-prepared', size: 'L' },
        { type: 'metamagic',       size: 'M' }
    ],
    story: [
        { type: 'quote', size: 'XL' },
        { type: 'text',  size: 'L', config: { title: 'Background', body: '' } },
        { type: 'image', size: 'M' }
    ],
    inventory: [
        { type: 'inventory', size: 'L' },
        { type: 'text',      size: 'M', config: { title: 'Notes', body: '' } }
    ],
    social: [
        { type: 'text',  size: 'M', config: { title: 'Allies', body: '' } },
        { type: 'text',  size: 'M', config: { title: 'Enemies', body: '' } },
        { type: 'image', size: 'XL' }
    ],
    exploring: [
        { type: 'image', size: 'XL' },
        { type: 'text',  size: 'XL', config: { title: 'Locations', body: '' } }
    ],
    family: [
        { type: 'family-diagram', size: 'XL' }
    ]
};

// ====================================================================
// Widget instance ids
// ====================================================================
function generateWidgetId() {
    return 'w_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
}

function ensureWidgetIds(widgets) {
    if (!Array.isArray(widgets)) return widgets;
    for (var i = 0; i < widgets.length; i++) {
        if (!widgets[i].wid) widgets[i].wid = generateWidgetId();
    }
    return widgets;
}

// ====================================================================
// Templates (per user, copied to character on apply)
// ====================================================================
function dashboardTemplatesKey() {
    var u = (typeof currentUser === 'function') ? currentUser() : null;
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
    var widgets = loadTabWidgets(charId, tabId);
    if (!widgets) widgets = dashboardDefaultWidgetsForTab(tabId);
    var templates = loadDashboardTemplates();
    var tpl = {
        id: 't_' + Date.now().toString(36),
        name: templateName || (tabId + ' template'),
        sourceTabId: tabId,
        widgets: JSON.parse(JSON.stringify(widgets)),
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
    var cloned = (tpl.widgets || []).map(function(w) {
        return {
            wid: generateWidgetId(),
            type: w.type,
            size: w.size || 'M',
            starred: !!w.starred,
            config: w.config || {}
        };
    });
    saveTabWidgets(charId, targetTabId, cloned);
    return true;
}
